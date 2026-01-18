import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - List all fees for a deal
export async function GET(
  request: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const supabase = createClient()
  const { dealId } = params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin, legal role, or deal owner
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdminOrLegal = profile && ['admin', 'legal'].includes(profile.role)

  // Check if user is deal owner (through company ownership)
  let isDealOwner = false
  if (!isAdminOrLegal) {
    const { data: deal } = await supabase
      .from('deals')
      .select('company:companies(owner_id)')
      .eq('id', dealId)
      .single()

    isDealOwner = deal?.company?.owner_id === user.id
  }

  if (!isAdminOrLegal && !isDealOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get fees for the deal
  const { data: fees, error } = await supabase
    .from('deal_legal_fees')
    .select(`
      *,
      catalog_item:legal_fee_catalog(id, name, description, base_amount, fee_type, category),
      added_by_user:profiles!deal_legal_fees_added_by_fkey(email, full_name)
    `)
    .eq('deal_id', dealId)
    .order('category')
    .order('created_at')

  if (error) {
    console.error('Error fetching deal fees:', error)
    return NextResponse.json({ error: 'Failed to fetch deal fees' }, { status: 500 })
  }

  // Get fee summary
  const { data: summary, error: summaryError } = await supabase
    .rpc('calculate_deal_legal_fees', { p_deal_id: dealId })

  if (summaryError) {
    console.error('Error calculating fee summary:', summaryError)
  }

  return NextResponse.json({
    fees,
    summary: summary?.[0] || { total_amount: 0, pending_amount: 0, paid_amount: 0, fee_count: 0 }
  })
}

// POST - Add a fee to a deal
export async function POST(
  request: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const supabase = createClient()
  const { dealId } = params

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin or legal role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'legal'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    fee_catalog_id,
    name,
    description,
    amount,
    fee_type = 'flat',
    category = 'legal',
    hours,
    hourly_rate,
    percentage_rate,
    percentage_base,
    notes
  } = body

  // Validate required fields
  if (!name || amount === undefined) {
    return NextResponse.json({ error: 'Name and amount are required' }, { status: 400 })
  }

  // Verify deal exists
  const { data: deal } = await supabase
    .from('deals')
    .select('id')
    .eq('id', dealId)
    .single()

  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  // Create the fee
  const { data: fee, error } = await supabase
    .from('deal_legal_fees')
    .insert({
      deal_id: dealId,
      fee_catalog_id: fee_catalog_id || null,
      name,
      description: description || null,
      amount,
      fee_type,
      category,
      hours: hours || null,
      hourly_rate: hourly_rate || null,
      percentage_rate: percentage_rate || null,
      percentage_base: percentage_base || null,
      notes: notes || null,
      added_by: user.id,
      added_at: new Date().toISOString(),
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating deal fee:', error)
    return NextResponse.json({ error: 'Failed to create deal fee' }, { status: 500 })
  }

  return NextResponse.json({ fee }, { status: 201 })
}

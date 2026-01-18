import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PUT - Assign legal partner to deal
export async function PUT(
  request: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { legal_partner_id, legal_status, legal_notes } = body

  // Validate legal_status if provided
  const validStatuses = ['not_required', 'pending', 'assigned', 'in_review', 'approved', 'changes_required', 'rejected']
  if (legal_status && !validStatuses.includes(legal_status)) {
    return NextResponse.json({ error: 'Invalid legal status' }, { status: 400 })
  }

  // If assigning a partner, verify it exists and is a legal partner
  if (legal_partner_id) {
    const { data: partner, error: partnerError } = await supabase
      .from('funding_partners')
      .select('id, partner_role')
      .eq('id', legal_partner_id)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Legal partner not found' }, { status: 404 })
    }

    if (partner.partner_role !== 'legal') {
      return NextResponse.json({ error: 'Selected partner is not a legal partner' }, { status: 400 })
    }
  }

  // Update the deal
  const updateData: any = {}

  if (legal_partner_id !== undefined) {
    updateData.legal_partner_id = legal_partner_id || null
  }

  if (legal_status !== undefined) {
    updateData.legal_status = legal_status

    // Set signed off timestamp if approved
    if (legal_status === 'approved') {
      updateData.legal_signed_off_at = new Date().toISOString()
    }
  }

  if (legal_notes !== undefined) {
    updateData.legal_notes = legal_notes
  }

  const { data: deal, error } = await supabase
    .from('deals')
    .update(updateData)
    .eq('id', params.dealId)
    .select()
    .single()

  if (error) {
    console.error('Error updating deal legal info:', error)
    return NextResponse.json({ error: 'Failed to update legal partner' }, { status: 500 })
  }

  // Log the activity
  await supabase.from('activity_log').insert({
    deal_id: params.dealId,
    user_id: user.id,
    action: legal_partner_id ? 'legal_partner_assigned' : 'legal_status_updated',
    details: {
      legal_partner_id,
      legal_status,
      legal_notes
    }
  }).catch(err => console.error('Failed to log activity:', err))

  return NextResponse.json({ deal })
}

// GET - Get legal info for a deal
export async function GET(
  request: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: deal, error } = await supabase
    .from('deals')
    .select(`
      legal_partner_id,
      legal_status,
      legal_signed_off_at,
      legal_notes,
      legal_partner:funding_partners!legal_partner_id (
        id,
        name,
        slug,
        primary_contact_name,
        primary_contact_email
      )
    `)
    .eq('id', params.dealId)
    .single()

  if (error) {
    console.error('Error fetching deal legal info:', error)
    return NextResponse.json({ error: 'Failed to fetch legal info' }, { status: 500 })
  }

  return NextResponse.json({ legalInfo: deal })
}

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PUT - Update a fee
export async function PUT(
  request: NextRequest,
  { params }: { params: { dealId: string; feeId: string } }
) {
  const supabase = createClient()
  const { dealId, feeId } = params

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

  // Verify fee exists and belongs to this deal
  const { data: existingFee } = await supabase
    .from('deal_legal_fees')
    .select('id, status')
    .eq('id', feeId)
    .eq('deal_id', dealId)
    .single()

  if (!existingFee) {
    return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
  }

  const body = await request.json()
  const {
    name,
    description,
    amount,
    fee_type,
    category,
    hours,
    hourly_rate,
    percentage_rate,
    percentage_base,
    status,
    notes,
    waived_reason
  } = body

  // Build update object
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString()
  }

  if (name !== undefined) updates.name = name
  if (description !== undefined) updates.description = description
  if (amount !== undefined) updates.amount = amount
  if (fee_type !== undefined) updates.fee_type = fee_type
  if (category !== undefined) updates.category = category
  if (hours !== undefined) updates.hours = hours
  if (hourly_rate !== undefined) updates.hourly_rate = hourly_rate
  if (percentage_rate !== undefined) updates.percentage_rate = percentage_rate
  if (percentage_base !== undefined) updates.percentage_base = percentage_base
  if (notes !== undefined) updates.notes = notes

  // Handle status changes
  if (status !== undefined && status !== existingFee.status) {
    updates.status = status

    if (status === 'invoiced') {
      updates.invoiced_at = new Date().toISOString()
    } else if (status === 'paid') {
      updates.paid_at = new Date().toISOString()
    } else if (status === 'waived') {
      updates.waived_at = new Date().toISOString()
      if (waived_reason) {
        updates.waived_reason = waived_reason
      }
    }
  }

  const { data: fee, error } = await supabase
    .from('deal_legal_fees')
    .update(updates)
    .eq('id', feeId)
    .select()
    .single()

  if (error) {
    console.error('Error updating deal fee:', error)
    return NextResponse.json({ error: 'Failed to update deal fee' }, { status: 500 })
  }

  return NextResponse.json({ fee })
}

// DELETE - Remove a fee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { dealId: string; feeId: string } }
) {
  const supabase = createClient()
  const { dealId, feeId } = params

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

  // Verify fee exists and belongs to this deal
  const { data: existingFee } = await supabase
    .from('deal_legal_fees')
    .select('id, status')
    .eq('id', feeId)
    .eq('deal_id', dealId)
    .single()

  if (!existingFee) {
    return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
  }

  // Don't allow deleting paid fees
  if (existingFee.status === 'paid') {
    return NextResponse.json({ error: 'Cannot delete a paid fee' }, { status: 400 })
  }

  const { error } = await supabase
    .from('deal_legal_fees')
    .delete()
    .eq('id', feeId)

  if (error) {
    console.error('Error deleting deal fee:', error)
    return NextResponse.json({ error: 'Failed to delete deal fee' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

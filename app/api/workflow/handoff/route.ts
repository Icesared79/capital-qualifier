import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { HandoffTarget } from '@/lib/types'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse request body
  const body = await request.json()
  const { dealId, handoffTo, notes } = body as {
    dealId: string
    handoffTo: HandoffTarget | null
    notes?: string | null
  }

  if (!dealId) {
    return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 })
  }

  // Validate handoffTo if provided
  if (handoffTo && !['legal', 'optma'].includes(handoffTo)) {
    return NextResponse.json({ error: 'Invalid handoff target' }, { status: 400 })
  }

  try {
    // Update deal with handoff info
    const updateData: Record<string, any> = {
      handoff_to: handoffTo,
      internal_notes: notes ?? undefined,
    }

    // Set timestamp and user if handing off
    if (handoffTo) {
      updateData.handed_off_at = new Date().toISOString()
      updateData.handed_off_by = user.id
    } else {
      // Clear handoff data
      updateData.handed_off_at = null
      updateData.handed_off_by = null
    }

    const { error: updateError } = await adminClient
      .from('deals')
      .update(updateData)
      .eq('id', dealId)

    if (updateError) {
      console.error('Error updating deal:', updateError)
      return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
    }

    // Log the activity
    await adminClient.from('activities').insert({
      deal_id: dealId,
      user_id: user.id,
      action: handoffTo ? `handed_off_to_${handoffTo}` : 'cleared_handoff',
      details: {
        handoff_to: handoffTo,
        notes: notes,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing handoff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

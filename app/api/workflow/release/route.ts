import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const adminClient = createAdminClient()

    // Verify user is authenticated and admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { dealId, action, partner, notes } = await request.json()

    if (!dealId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validActions = ['ready_for_release', 'released', 'rejected']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get current deal
    const { data: deal, error: dealError } = await adminClient
      .from('deals')
      .select('id, release_status, company_id')
      .eq('id', dealId)
      .single()

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Update release status
    const updateData: Record<string, any> = {
      release_status: action,
      release_notes: notes || null,
    }

    if (action === 'released' || action === 'ready_for_release') {
      updateData.release_authorized_by = user.id
      updateData.release_authorized_at = new Date().toISOString()
      if (partner) {
        updateData.release_partner = partner
      }
    }

    const { error: updateError } = await adminClient
      .from('deals')
      .update(updateData)
      .eq('id', dealId)

    if (updateError) {
      console.error('Error updating release status:', updateError)
      return NextResponse.json({ error: 'Failed to update release status' }, { status: 500 })
    }

    // Get company owner for notification
    const { data: company } = await adminClient
      .from('companies')
      .select('owner_id, name')
      .eq('id', deal.company_id)
      .single()

    // Create notification for company owner
    if (company?.owner_id) {
      const notificationMessages: Record<string, { title: string; message: string }> = {
        ready_for_release: {
          title: 'Offering Ready for Release',
          message: `Your offering for ${company.name} has been marked as ready for partner release.`
        },
        released: {
          title: 'Offering Released to Partner',
          message: `Your offering for ${company.name} has been released to ${partner || 'our partner network'}.`
        },
        rejected: {
          title: 'Offering Release Rejected',
          message: `Your offering for ${company.name} was not approved for partner release at this time.${notes ? ` Reason: ${notes}` : ''}`
        }
      }

      const notification = notificationMessages[action]
      if (notification) {
        await adminClient.from('notifications').insert({
          user_id: company.owner_id,
          deal_id: dealId,
          type: 'release_status',
          title: notification.title,
          message: notification.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      release_status: action
    })
  } catch (error) {
    console.error('Release authorization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

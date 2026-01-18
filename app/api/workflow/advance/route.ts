import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { FundingApplicationStage } from '@/lib/types'
import { canTransitionTo, STAGE_CONFIG, getStageChangeNotificationTitle, getTransitionMessage } from '@/lib/workflow'

interface AdvanceRequest {
  dealId: string
  newStage: FundingApplicationStage
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const adminClient = createAdminClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body: AdvanceRequest = await request.json()
    const { dealId, newStage } = body

    if (!dealId || !newStage) {
      return NextResponse.json(
        { error: 'Missing required fields: dealId and newStage' },
        { status: 400 }
      )
    }

    // Get the current deal
    const { data: deal, error: dealError } = await adminClient
      .from('deals')
      .select(`
        *,
        companies!inner(owner_id, name)
      `)
      .eq('id', dealId)
      .single()

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    const currentStage = deal.stage as FundingApplicationStage

    // Validate the transition
    if (!canTransitionTo(currentStage, newStage)) {
      return NextResponse.json(
        { error: `Invalid stage transition from ${currentStage} to ${newStage}` },
        { status: 400 }
      )
    }

    // Update the deal stage
    const { error: updateError } = await adminClient
      .from('deals')
      .update({
        stage: newStage,
        stage_changed_at: new Date().toISOString()
      })
      .eq('id', dealId)

    if (updateError) {
      console.error('Error updating deal:', updateError)
      return NextResponse.json(
        { error: 'Failed to update deal stage' },
        { status: 500 }
      )
    }

    // Create activity log entry
    await adminClient
      .from('activities')
      .insert({
        deal_id: dealId,
        user_id: user.id,
        action: 'stage_changed',
        details: {
          from_stage: currentStage,
          to_stage: newStage,
          changed_by: user.email
        }
      })

    // Create notification for deal owner
    const ownerId = deal.companies.owner_id
    const notificationTitle = getStageChangeNotificationTitle(newStage)
    const notificationMessage = getTransitionMessage(currentStage, newStage)

    await adminClient
      .from('notifications')
      .insert({
        user_id: ownerId,
        deal_id: dealId,
        type: 'stage_change',
        title: notificationTitle,
        message: notificationMessage
      })

    return NextResponse.json({
      success: true,
      message: `Stage changed from ${STAGE_CONFIG[currentStage]?.label} to ${STAGE_CONFIG[newStage]?.label}`,
      deal: {
        id: dealId,
        stage: newStage
      }
    })
  } catch (error) {
    console.error('Error advancing deal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

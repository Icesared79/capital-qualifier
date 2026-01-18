import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PartnerDealAction, DealReleaseStatus } from '@/lib/types'

interface DealActionRequest {
  action: PartnerDealAction
  notes?: string
  passReason?: string
}

// POST: Take action on a deal (express interest, pass, start due diligence)
export async function POST(
  request: Request,
  { params }: { params: { dealId: string } }
) {
  try {
    const supabase = createClient()
    const adminClient = createAdminClient()
    const { dealId } = params

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's role (partner slug)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get partner by slug (role)
    const { data: partner, error: partnerError } = await supabase
      .from('funding_partners')
      .select('id, name')
      .eq('slug', profile.role)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      )
    }

    // Get the deal release
    const { data: release, error: releaseError } = await supabase
      .from('deal_releases')
      .select('*')
      .eq('deal_id', dealId)
      .eq('partner_id', partner.id)
      .single()

    if (releaseError || !release) {
      return NextResponse.json(
        { error: 'Deal release not found' },
        { status: 404 }
      )
    }

    const body: DealActionRequest = await request.json()
    const { action, notes, passReason } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    let newStatus: DealReleaseStatus = release.status
    let accessLevel = release.access_level
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    switch (action) {
      case 'express_interest':
        newStatus = 'interested'
        accessLevel = 'full' // Grant full access when interest is expressed
        updateData.interest_expressed_at = new Date().toISOString()
        break

      case 'pass':
        newStatus = 'passed'
        updateData.passed_at = new Date().toISOString()
        if (passReason) {
          updateData.pass_reason = passReason
        }
        break

      case 'start_due_diligence':
        if (release.status !== 'interested' && release.status !== 'reviewing') {
          return NextResponse.json(
            { error: 'Must express interest before starting due diligence' },
            { status: 400 }
          )
        }
        newStatus = 'due_diligence'
        accessLevel = 'documents' // Grant document access for DD
        break

      case 'add_note':
        if (notes) {
          updateData.partner_notes = notes
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    updateData.status = newStatus
    updateData.access_level = accessLevel

    // Update the deal release
    const { error: updateError } = await adminClient
      .from('deal_releases')
      .update(updateData)
      .eq('id', release.id)

    if (updateError) {
      console.error('Error updating deal release:', updateError)
      return NextResponse.json(
        { error: 'Failed to update deal' },
        { status: 500 }
      )
    }

    // Log the action
    await adminClient
      .from('partner_access_logs')
      .insert({
        partner_id: partner.id,
        deal_id: dealId,
        user_id: user.id,
        action: action === 'express_interest' ? 'expressed_interest' : action === 'pass' ? 'passed' : 'added_note',
        details: {
          previous_status: release.status,
          new_status: newStatus,
          notes: notes || null,
          pass_reason: passReason || null
        }
      })

    // Create activity log for the deal
    await adminClient
      .from('activities')
      .insert({
        deal_id: dealId,
        user_id: user.id,
        action: `partner_${action}`,
        details: {
          partner_name: partner.name,
          partner_id: partner.id,
          notes: notes || null
        }
      })

    return NextResponse.json({
      success: true,
      message: getActionMessage(action),
      release: {
        id: release.id,
        status: newStatus,
        access_level: accessLevel
      }
    })
  } catch (error) {
    console.error('Error in POST /api/partner/deal/[dealId]/action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getActionMessage(action: PartnerDealAction): string {
  switch (action) {
    case 'express_interest':
      return 'Interest expressed successfully. You now have full access to the deal package.'
    case 'pass':
      return 'Deal passed. Thank you for your review.'
    case 'start_due_diligence':
      return 'Due diligence started. You now have access to all documents.'
    case 'add_note':
      return 'Note added successfully.'
    default:
      return 'Action completed.'
  }
}

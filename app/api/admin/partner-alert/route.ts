import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkDealMatch } from '@/lib/dealMatcher'
import { sendPartnerDealAlert } from '@/lib/emails/partnerDealAlert'

interface PartnerAlertRequest {
  dealId: string
  partnerIds: string[]
  sendEmail?: boolean
}

// POST: Send alerts to partners when a deal is released that matches their criteria
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

    const body: PartnerAlertRequest = await request.json()
    const { dealId, partnerIds, sendEmail = true } = body

    if (!dealId || !partnerIds || partnerIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: dealId and partnerIds' },
        { status: 400 }
      )
    }

    // Get deal information
    const { data: dealData, error: dealError } = await adminClient
      .from('deals')
      .select(`
        id,
        qualification_code,
        capital_amount,
        overall_score,
        qualification_data,
        companies!inner(name, qualification_data)
      `)
      .eq('id', dealId)
      .single()

    if (dealError || !dealData) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    // Normalize the deal data - companies is a joined object, not an array
    const deal = {
      ...dealData,
      companies: Array.isArray(dealData.companies) ? dealData.companies[0] : dealData.companies
    } as {
      id: string
      qualification_code: string
      capital_amount: string | number | null
      overall_score: number | null
      qualification_data: Record<string, any> | null
      companies: { name: string; qualification_data: Record<string, any> | null } | null
    }

    // Get partners and their preferences
    const { data: partners, error: partnersError } = await adminClient
      .from('funding_partners')
      .select(`
        id,
        name,
        primary_contact_email,
        partner_notification_preferences (*)
      `)
      .in('id', partnerIds)
      .eq('status', 'active')

    if (partnersError) {
      console.error('Error fetching partners:', partnersError)
      return NextResponse.json(
        { error: 'Failed to fetch partners' },
        { status: 500 }
      )
    }

    const results: {
      partnerId: string
      partnerName: string
      matches: boolean
      notificationSent: boolean
      emailSent: boolean
    }[] = []

    // Get partner users for in-app notifications
    const { data: partnerUsers, error: usersError } = await adminClient
      .from('profiles')
      .select('id, role')
      .in('role', partners?.map(p => p.name.toLowerCase().replace(/\s+/g, '_')) || [])

    // Process each partner
    for (const partner of partners || []) {
      const preferences = partner.partner_notification_preferences?.[0] || null

      // Extract deal info for matching
      const companyData = deal.companies?.qualification_data || {}
      const dealForMatching = {
        capital_amount: deal.capital_amount,
        overall_score: deal.overall_score,
        asset_classes: companyData.loanAssetClasses || companyData.assets || [],
        geographic_focus: companyData.geographicFocus || companyData.location || null,
        qualification_data: deal.qualification_data
      }

      // Check if deal matches partner's criteria
      const matchInfo = checkDealMatch(preferences, dealForMatching)

      let notificationSent = false
      let emailSent = false

      // Create in-app notification if enabled
      if (!preferences || preferences.in_app_alerts_enabled !== false) {
        // Find the partner user
        const partnerUser = partnerUsers?.find(u =>
          u.role.toLowerCase() === partner.name.toLowerCase().replace(/\s+/g, '_') ||
          u.role === 'optma' && partner.name.toLowerCase().includes('optima')
        )

        if (partnerUser) {
          const { error: notifError } = await adminClient
            .from('notifications')
            .insert({
              user_id: partnerUser.id,
              deal_id: dealId,
              type: matchInfo.matches ? 'deal_matches_criteria' : 'new_deal_released',
              title: matchInfo.matches
                ? 'New Deal Matches Your Criteria'
                : 'New Deal Released',
              message: matchInfo.matches
                ? `${deal.companies?.name || 'A new deal'} has been released and matches your investment criteria: ${matchInfo.matchReasons.join(', ')}`
                : `${deal.companies?.name || 'A new deal'} has been released for your review.`
            })

          if (!notifError) {
            notificationSent = true
          }
        }
      }

      // Send email if enabled
      if (sendEmail && preferences?.email_alerts_enabled !== false) {
        const email = preferences?.notification_email || partner.primary_contact_email

        if (email && (preferences?.email_frequency === 'immediate' || !preferences)) {
          try {
            const result = await sendPartnerDealAlert({
              to: email,
              partnerName: partner.name,
              dealName: deal.companies?.name || 'New Deal',
              dealCode: deal.qualification_code,
              matchInfo,
              dealAmount: deal.capital_amount,
              assetClasses: companyData.loanAssetClasses || companyData.assets || [],
              geography: companyData.geographicFocus || companyData.location || undefined,
              score: deal.overall_score
            })

            if (result.success) {
              emailSent = true
            } else {
              console.error('Failed to send email:', result.error)
            }
          } catch (emailError) {
            console.error('Error sending email:', emailError)
          }
        }
      }

      results.push({
        partnerId: partner.id,
        partnerName: partner.name,
        matches: matchInfo.matches,
        notificationSent,
        emailSent
      })
    }

    return NextResponse.json({
      success: true,
      message: `Alerts processed for ${results.length} partner(s)`,
      results
    })
  } catch (error) {
    console.error('Error in POST /api/admin/partner-alert:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ApplicationDashboard from './ApplicationDashboard'
import { checkDealMatch } from '@/lib/dealMatcher'

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  // Get the deal with company info
  const { data: deal, error } = await supabase
    .from('deals')
    .select(`
      *,
      company:companies (
        id,
        name,
        type,
        owner_id,
        qualification_data,
        qualification_score,
        overall_score,
        capital_fits,
        recommended_structure,
        strengths,
        considerations,
        next_steps
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !deal) {
    notFound()
  }

  // Verify ownership or admin access
  const isOwner = deal.company?.owner_id === user.id
  if (!isOwner && !isAdmin) {
    notFound()
  }

  // Parse deal notes for extended data (scoring results stored here)
  let dealData: any = {}
  try {
    dealData = deal.notes ? JSON.parse(deal.notes) : {}
  } catch (e) {}

  // Merge data from deal columns, deal notes, and company
  const offeringData = {
    // Basic info
    id: deal.id,
    qualificationCode: deal.qualification_code,
    stage: deal.stage,
    createdAt: deal.created_at,
    stageChangedAt: deal.stage_changed_at,

    // Company info
    companyName: deal.company?.name,
    companyType: deal.company?.type,
    qualificationData: deal.company?.qualification_data || dealData.qualificationData || {},

    // Funding info
    fundingAmount: deal.capital_amount || dealData.fundingAmount,
    fundingPurpose: deal.funding_purpose || dealData.fundingPurpose,

    // Scoring results - check deal notes first, then company columns
    overallScore: dealData.overallScore || deal.overall_score || deal.company?.overall_score,
    qualificationTier: dealData.qualificationScore || deal.qualification_score || deal.company?.qualification_score,
    capitalFits: dealData.capitalFits || deal.company?.capital_fits || [],
    recommendedStructure: dealData.recommendedStructure || deal.company?.recommended_structure,
    opportunitySize: dealData.opportunitySize,
    timeToFunding: dealData.timeToFunding,
    strengths: dealData.strengths || deal.company?.strengths || [],
    considerations: dealData.considerations || deal.company?.considerations || [],
    nextSteps: dealData.nextSteps || deal.company?.next_steps || [],

    // Dimensions for charts (if available from deal notes)
    dimensions: dealData.dimensions || null,

    // Admin fields
    assignedTo: deal.assigned_to || null,
    internalNotes: deal.internal_notes || null,

    // Release authorization fields
    releaseStatus: deal.release_status || 'pending',
    releasePartner: deal.release_partner || null,
    releaseAuthorizedAt: deal.release_authorized_at || null,
  }

  // Fetch portfolio assessment if available
  const { data: assessment } = await supabase
    .from('portfolio_assessments')
    .select('*')
    .eq('deal_id', params.id)
    .single()

  const portfolioAssessment = assessment ? {
    overallScore: assessment.overall_score,
    letterGrade: assessment.letter_grade,
    status: assessment.status,
    tokenizationReadiness: assessment.tokenization_readiness,
    readyPercentage: assessment.ready_percentage || 0,
    conditionalPercentage: assessment.conditional_percentage || 0,
    notReadyPercentage: assessment.not_ready_percentage || 0,
    summary: assessment.summary,
    strengths: assessment.strengths || [],
    concerns: assessment.concerns || [],
    recommendations: assessment.recommendations || [],
    redFlags: assessment.red_flags || [],
    scores: assessment.scores,
    hasAIAnalysis: assessment.has_ai_analysis,
    estimatedTimeline: assessment.estimated_timeline,
  } : null

  // Fetch funding partners and compute matches
  const { data: partners } = await supabase
    .from('funding_partners')
    .select(`
      id,
      name,
      partner_role,
      partner_type,
      focus_asset_classes,
      min_deal_size,
      max_deal_size,
      geographic_focus,
      status
    `)
    .eq('status', 'active')

  // Separate funding and legal partners
  const fundingPartners = partners?.filter(p => p.partner_role !== 'legal') || []
  const legalPartners = partners?.filter(p => p.partner_role === 'legal') || []

  // Get the assigned legal partner details if any
  const assignedLegalPartner = deal.legal_partner_id
    ? legalPartners.find(p => p.id === deal.legal_partner_id)
    : null

  // Fetch partner preferences (only for funding partners)
  const fundingPartnerIds = fundingPartners?.map(p => p.id) || []
  const { data: preferences } = fundingPartnerIds.length > 0
    ? await supabase
        .from('partner_notification_preferences')
        .select('*')
        .in('partner_id', fundingPartnerIds)
    : { data: [] }

  // Build deal object for matching
  const dealForMatching = {
    capital_amount: offeringData.fundingAmount,
    asset_classes: offeringData.qualificationData?.assets || offeringData.qualificationData?.loanAssetClasses || [],
    geographic_focus: offeringData.qualificationData?.location || offeringData.qualificationData?.country || 'United States',
    overall_score: offeringData.overallScore,
  }

  // Compute partner matches (only funding partners)
  const partnerMatches = fundingPartners.map(partner => {
    const partnerPrefs = preferences?.find(p => p.partner_id === partner.id) || null
    const matchInfo = checkDealMatch(partnerPrefs, dealForMatching)

    return {
      id: partner.id,
      name: partner.name,
      type: partner.partner_type,
      matchReasons: matchInfo.matchReasons,
      matches: matchInfo.matches,
    }
  }).filter(p => p.matches)

  // Legal partner info for the dashboard
  const legalInfo = {
    status: deal.legal_status || 'not_required',
    partnerId: deal.legal_partner_id || null,
    partnerName: assignedLegalPartner?.name || null,
    signedOffAt: deal.legal_signed_off_at || null,
    notes: deal.legal_notes || null,
    availablePartners: legalPartners.map(p => ({ id: p.id, name: p.name })),
  }

  return <ApplicationDashboard data={offeringData} isAdmin={isAdmin} userId={user.id} portfolioAssessment={portfolioAssessment} partnerMatches={partnerMatches} legalInfo={legalInfo} />
}

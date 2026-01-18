'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { formatCapitalAmount } from '@/lib/formatters'
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  MapPin,
  DollarSign,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Download,
  Lock,
  Unlock,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ExternalLink,
  Users,
  Calendar,
  Globe,
  Shield,
  ArrowRight
} from 'lucide-react'

interface DealRelease {
  id: string
  deal_id: string
  partner_id: string
  released_at: string
  access_level: 'summary' | 'full' | 'documents'
  status: string
  first_viewed_at: string | null
  interest_expressed_at: string | null
  partner_notes: string | null
}

interface Deal {
  id: string
  qualification_code: string
  stage: string
  overall_score: number | null
  qualification_score: string | null
  capital_amount: string | null
  opportunity_size: string | null
  time_to_funding: string | null
  strengths: string[] | null
  considerations: string[] | null
  next_steps: string[] | null
  capital_fits: any[] | null
  recommended_structure: string | null
  company: {
    id: string
    name: string
    type: string
    assets: string[] | null
    qualification_data: any
  }
}

const scoreColors = {
  strong: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  moderate: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  needs_discussion: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
}

export default function PartnerDealPage() {
  const router = useRouter()
  const params = useParams()
  const dealId = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [release, setRelease] = useState<DealRelease | null>(null)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [showInterestModal, setShowInterestModal] = useState(false)
  const [showPassModal, setShowPassModal] = useState(false)
  const [passReason, setPassReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [dealId])

  async function loadData() {
    setLoading(true)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth?mode=login')
      return
    }

    // Get user profile to find partner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      router.push('/dashboard')
      return
    }

    // Get partner info
    const { data: partner } = await supabase
      .from('funding_partners')
      .select('id')
      .eq('slug', profile.role)
      .single()

    if (!partner) {
      router.push('/dashboard')
      return
    }

    setPartnerId(partner.id)

    // Get release info for this deal
    const { data: releaseData, error: releaseError } = await supabase
      .from('deal_releases')
      .select('*')
      .eq('deal_id', dealId)
      .eq('partner_id', partner.id)
      .single()

    if (releaseError || !releaseData) {
      // No release found for this partner
      router.push('/dashboard/partner')
      return
    }

    setRelease(releaseData)

    // Mark as viewed if first time
    if (!releaseData.first_viewed_at) {
      await supabase
        .from('deal_releases')
        .update({
          status: 'viewed',
          first_viewed_at: new Date().toISOString()
        })
        .eq('id', releaseData.id)

      // Log access
      await supabase.from('partner_access_logs').insert({
        partner_id: partner.id,
        deal_id: dealId,
        user_id: user.id,
        action: 'viewed_summary'
      })
    }

    // Get deal info
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        qualification_code,
        stage,
        overall_score,
        qualification_score,
        capital_amount,
        opportunity_size,
        time_to_funding,
        strengths,
        considerations,
        next_steps,
        capital_fits,
        recommended_structure,
        company:companies (
          id,
          name,
          type,
          assets,
          qualification_data
        )
      `)
      .eq('id', dealId)
      .single()

    if (dealError) {
      console.error('Error fetching deal:', dealError)
    } else {
      setDeal(dealData as Deal)
    }

    setLoading(false)
  }

  async function expressInterest() {
    if (!release || !partnerId) return

    setActionLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    // Update release status and unlock full access
    await supabase
      .from('deal_releases')
      .update({
        status: 'interested',
        access_level: 'full',
        interest_expressed_at: new Date().toISOString()
      })
      .eq('id', release.id)

    // Log access
    await supabase.from('partner_access_logs').insert({
      partner_id: partnerId,
      deal_id: dealId,
      user_id: user?.id,
      action: 'expressed_interest'
    })

    setShowInterestModal(false)
    setActionLoading(false)

    // Reload data
    loadData()
  }

  async function passDeal() {
    if (!release || !partnerId) return

    setActionLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    // Update release status
    await supabase
      .from('deal_releases')
      .update({
        status: 'passed',
        passed_at: new Date().toISOString(),
        pass_reason: passReason || null
      })
      .eq('id', release.id)

    // Log access
    await supabase.from('partner_access_logs').insert({
      partner_id: partnerId,
      deal_id: dealId,
      user_id: user?.id,
      action: 'passed',
      details: { reason: passReason }
    })

    setShowPassModal(false)
    setActionLoading(false)

    // Go back to list
    router.push('/dashboard/partner')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!deal || !release) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Deal not found</p>
        <Link href="/dashboard/partner" className="text-accent hover:underline mt-2 inline-block">
          Back to deals
        </Link>
      </div>
    )
  }

  const company = deal.company
  const qData = company?.qualification_data || {}
  const hasFullAccess = release.access_level !== 'summary'
  const isPassed = release.status === 'passed'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/partner"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to deals
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {company?.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {deal.qualification_code} • {company?.type === 'originator' ? 'Loan Originator' : 'Borrower'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {deal.qualification_score && (
            <span className={`px-4 py-2 rounded-xl text-sm font-bold ${scoreColors[deal.qualification_score as keyof typeof scoreColors]}`}>
              {deal.qualification_score === 'strong' ? 'Strong Qualification' :
               deal.qualification_score === 'moderate' ? 'Moderate Qualification' : 'Needs Discussion'}
            </span>
          )}
          {deal.overall_score && (
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="text-lg font-bold text-accent">{deal.overall_score}</span>
              <span className="text-sm text-gray-500">/100</span>
            </div>
          )}
        </div>
      </div>

      {/* Access Level Banner */}
      {!hasFullAccess && !isPassed && (
        <div className="bg-gradient-to-r from-accent/10 to-orange-100 dark:from-accent/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-accent/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Summary View
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You're viewing a summary of this deal. Express interest to unlock the full package including detailed portfolio metrics, documents, and contact information.
              </p>
              <button
                onClick={() => setShowInterestModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-colors"
              >
                <Unlock className="w-5 h-5" />
                Express Interest & Unlock Full Package
              </button>
            </div>
          </div>
        </div>
      )}

      {isPassed && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border-2 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <ThumbsDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                You passed on this deal
              </h3>
              {release.pass_reason && (
                <p className="text-gray-600 dark:text-gray-400">
                  Reason: {release.pass_reason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Deal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Deal Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {deal.capital_amount && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                    <DollarSign className="w-4 h-4" />
                    Capital Sought
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCapitalAmount(deal.capital_amount)}
                  </p>
                </div>
              )}
              {deal.opportunity_size && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Opportunity Size
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                    {deal.opportunity_size?.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
              {deal.time_to_funding && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    Time to Funding
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                    {deal.time_to_funding?.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
              {company?.assets && company.assets.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                    <Building2 className="w-4 h-4" />
                    Asset Classes
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {company.assets.map(a => a.replace(/_/g, ' ')).join(', ')}
                  </p>
                </div>
              )}
              {qData.geographicFocus && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                    <MapPin className="w-4 h-4" />
                    Geographic Focus
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {qData.geographicFocus}
                  </p>
                </div>
              )}
              {deal.recommended_structure && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                    <Shield className="w-4 h-4" />
                    Recommended Structure
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {deal.recommended_structure?.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Strengths */}
          {deal.strengths && deal.strengths.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Key Strengths
              </h2>
              <ul className="space-y-3">
                {deal.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Considerations - Only show with full access */}
          {hasFullAccess && deal.considerations && deal.considerations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Considerations
              </h2>
              <ul className="space-y-3">
                {deal.considerations.map((consideration, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{consideration}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Portfolio Metrics - Only show with full access */}
          {hasFullAccess && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Portfolio Metrics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {qData.annualVolume && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Annual Volume</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{qData.annualVolume}</p>
                  </div>
                )}
                {qData.avgDealSize && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg Deal Size</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{qData.avgDealSize}</p>
                  </div>
                )}
                {qData.portfolioSize && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Portfolio Size</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{qData.portfolioSize}</p>
                  </div>
                )}
                {qData.defaultRate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Default Rate</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{qData.defaultRate}</p>
                  </div>
                )}
                {qData.docStandard && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Doc Standard</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{qData.docStandard}</p>
                  </div>
                )}
                {qData.avgInterestRate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg Interest Rate</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{qData.avgInterestRate}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Locked Content Placeholder */}
          {!hasFullAccess && !isPassed && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Full Package Locked
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
                  Express interest to unlock detailed portfolio metrics, risk considerations, documents, and contact information.
                </p>
                <button
                  onClick={() => setShowInterestModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-colors"
                >
                  <Unlock className="w-5 h-5" />
                  Express Interest
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions & Company Info */}
        <div className="space-y-6">
          {/* Actions */}
          {!isPassed && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Actions
              </h3>
              <div className="space-y-3">
                {!hasFullAccess ? (
                  <button
                    onClick={() => setShowInterestModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-colors"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    Express Interest
                  </button>
                ) : (
                  <>
                    <button
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-colors"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Request Meeting
                    </button>
                    <button
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-gray-300 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Download Package
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowPassModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-500 font-semibold rounded-xl hover:border-red-300 hover:text-red-500 transition-colors"
                >
                  <ThumbsDown className="w-5 h-5" />
                  Pass on Deal
                </button>
              </div>
            </div>
          )}

          {/* Company Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Company Info
            </h3>
            <div className="space-y-4">
              {qData.yearFounded && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Founded</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{qData.yearFounded}</p>
                  </div>
                </div>
              )}
              {qData.teamSize && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Team Size</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{qData.teamSize}</p>
                  </div>
                </div>
              )}
              {qData.website && hasFullAccess && (
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                    <a
                      href={qData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-accent hover:underline flex items-center gap-1"
                    >
                      {qData.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
              {!hasFullAccess && (
                <div className="flex items-center gap-3 text-gray-400">
                  <Lock className="w-5 h-5" />
                  <p className="text-sm">Contact info available after expressing interest</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info - Only with full access */}
          {hasFullAccess && (qData.owners?.[0] || qData.contactName) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Primary Contact
              </h3>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {qData.owners?.[0]?.name || qData.contactName}
                </p>
                {qData.owners?.[0]?.title && (
                  <p className="text-gray-500 dark:text-gray-400">{qData.owners[0].title}</p>
                )}
                {(qData.owners?.[0]?.email || qData.email) && (
                  <a
                    href={`mailto:${qData.owners?.[0]?.email || qData.email}`}
                    className="text-accent hover:underline block"
                  >
                    {qData.owners?.[0]?.email || qData.email}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Activity
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Released</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(release.released_at).toLocaleDateString()}
                </span>
              </div>
              {release.first_viewed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">First Viewed</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(release.first_viewed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {release.interest_expressed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Interest Expressed</span>
                  <span className="text-green-600 dark:text-green-400">
                    {new Date(release.interest_expressed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Express Interest Modal */}
      {showInterestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Express Interest
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Unlock full deal package
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              By expressing interest, you'll gain access to:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Detailed portfolio metrics
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Risk considerations
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Due diligence documents
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Contact information
              </li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowInterestModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={expressInterest}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Interest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pass Modal */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <ThumbsDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Pass on Deal
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This will remove it from your active pipeline
                </p>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={passReason}
                onChange={(e) => setPassReason(e.target.value)}
                placeholder="Why are you passing on this deal?"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-accent resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPassModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={passDeal}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Pass'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

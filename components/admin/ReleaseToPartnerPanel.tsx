'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { checkDealMatch } from '@/lib/dealMatcher'
import { PartnerNotificationPreferences, DealMatchInfo } from '@/lib/types'
import {
  X,
  Send,
  Building2,
  CheckCircle2,
  AlertCircle,
  Users,
  TrendingUp,
  MapPin,
  Sparkles,
  Target,
  Zap
} from 'lucide-react'

interface Partner {
  id: string
  name: string
  slug: string
  partner_type: string
  focus_asset_classes: string[] | null
  can_tokenize: boolean
  has_legal_team: boolean
  preferences?: PartnerNotificationPreferences | null
  matchInfo?: DealMatchInfo
}

interface DealData {
  id: string
  capital_amount: string | number | null
  overall_score: number | null
  qualification_data: any
  company?: {
    name: string
    qualification_data?: any
  } | null
}

interface ExistingRelease {
  id: string
  partner_id: string
  status: string
  released_at: string
  partner: {
    name: string
  }
}

interface ReleaseToPartnerPanelProps {
  dealId: string
  dealName: string
  onClose: () => void
  onSuccess?: () => void
}

export default function ReleaseToPartnerPanel({
  dealId,
  dealName,
  onClose,
  onSuccess
}: ReleaseToPartnerPanelProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [releasing, setReleasing] = useState(false)
  const [partners, setPartners] = useState<Partner[]>([])
  const [existingReleases, setExistingReleases] = useState<ExistingRelease[]>([])
  const [selectedPartners, setSelectedPartners] = useState<string[]>([])
  const [releaseNotes, setReleaseNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dealData, setDealData] = useState<DealData | null>(null)

  useEffect(() => {
    loadData()
  }, [dealId])

  async function loadData() {
    setLoading(true)

    // Fetch deal data for matching
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        capital_amount,
        overall_score,
        qualification_data,
        company:companies (
          name,
          qualification_data
        )
      `)
      .eq('id', dealId)
      .single()

    if (dealError) {
      console.error('Error fetching deal:', dealError)
    } else {
      setDealData(deal as unknown as DealData)
    }

    // Fetch all active partners with their preferences
    const { data: partnersData, error: partnersError } = await supabase
      .from('funding_partners')
      .select('id, name, slug, partner_type, focus_asset_classes, can_tokenize, has_legal_team')
      .eq('status', 'active')
      .order('name')

    // Fetch partner preferences
    const { data: preferencesData } = await supabase
      .from('partner_notification_preferences')
      .select('*')

    const preferencesMap = new Map<string, PartnerNotificationPreferences>()
    if (preferencesData) {
      for (const pref of preferencesData) {
        preferencesMap.set(pref.partner_id, pref as PartnerNotificationPreferences)
      }
    }

    if (partnersError) {
      console.error('Error fetching partners:', partnersError)
    } else {
      // Calculate match info for each partner
      const partnersWithMatch = (partnersData || []).map(partner => {
        const preferences = preferencesMap.get(partner.id) || null

        // Build deal object for matching
        const dealForMatching = {
          capital_amount: deal?.capital_amount,
          overall_score: deal?.overall_score,
          asset_classes: deal?.qualification_data?.assetClass ||
                        deal?.company?.qualification_data?.loanAssetClasses ||
                        deal?.company?.qualification_data?.assets,
          geographic_focus: deal?.qualification_data?.geoFocus ||
                           deal?.qualification_data?.location ||
                           deal?.company?.qualification_data?.geographicFocus,
          qualification_data: deal?.qualification_data
        }

        const matchInfo = checkDealMatch(preferences, dealForMatching)

        return {
          ...partner,
          preferences,
          matchInfo
        }
      })

      // Sort partners: matches first, then by name
      partnersWithMatch.sort((a, b) => {
        if (a.matchInfo?.matches && !b.matchInfo?.matches) return -1
        if (!a.matchInfo?.matches && b.matchInfo?.matches) return 1
        return a.name.localeCompare(b.name)
      })

      setPartners(partnersWithMatch)
    }

    // Fetch existing releases for this deal
    const { data: releasesData, error: releasesError } = await supabase
      .from('deal_releases')
      .select(`
        id,
        partner_id,
        status,
        released_at,
        partner:funding_partners (
          name
        )
      `)
      .eq('deal_id', dealId)

    if (releasesError) {
      console.error('Error fetching releases:', releasesError)
    } else {
      setExistingReleases(releasesData as unknown as ExistingRelease[] || [])
    }

    setLoading(false)
  }

  function togglePartner(partnerId: string) {
    setSelectedPartners(prev =>
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    )
  }

  function isAlreadyReleased(partnerId: string) {
    return existingReleases.some(r => r.partner_id === partnerId)
  }

  function getReleaseStatus(partnerId: string) {
    const release = existingReleases.find(r => r.partner_id === partnerId)
    return release?.status
  }

  async function handleRelease() {
    if (selectedPartners.length === 0) {
      setError('Please select at least one partner')
      return
    }

    setReleasing(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setReleasing(false)
      return
    }

    // Create releases for each selected partner
    const releases = selectedPartners.map(partnerId => ({
      deal_id: dealId,
      partner_id: partnerId,
      released_by: user.id,
      release_notes: releaseNotes || null,
      access_level: 'summary',
      status: 'pending'
    }))

    const { error: insertError } = await supabase
      .from('deal_releases')
      .insert(releases)

    if (insertError) {
      console.error('Error releasing deal:', insertError)
      setError('Failed to release deal. It may already be released to some partners.')
      setReleasing(false)
      return
    }

    // Log activity
    await supabase.from('activities').insert({
      deal_id: dealId,
      user_id: user.id,
      action: 'deal_released',
      details: {
        partners: selectedPartners,
        notes: releaseNotes
      }
    })

    // Send partner alerts (notifications and emails)
    try {
      await fetch('/api/admin/partner-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          partnerIds: selectedPartners,
          sendEmail: true
        })
      })
    } catch (alertError) {
      // Don't block success if alerts fail
      console.error('Error sending partner alerts:', alertError)
    }

    setSuccess(true)
    setReleasing(false)

    // Close after brief delay
    setTimeout(() => {
      onSuccess?.()
      onClose()
    }, 1500)
  }

  const availablePartners = partners.filter(p => !isAlreadyReleased(p.id))
  const matchingPartners = availablePartners.filter(p => p.matchInfo?.matches)
  const nonMatchingPartners = availablePartners.filter(p => !p.matchInfo?.matches)

  function selectAllMatching() {
    const matchingIds = matchingPartners.map(p => p.id)
    setSelectedPartners(matchingIds)
  }

  function selectAll() {
    setSelectedPartners(availablePartners.map(p => p.id))
  }

  function clearSelection() {
    setSelectedPartners([])
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Release to Funding Partners
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {dealName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Deal Released Successfully
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {selectedPartners.length} partner{selectedPartners.length !== 1 ? 's' : ''} will be notified
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Existing Releases */}
              {existingReleases.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Already Released To
                  </h3>
                  <div className="space-y-2">
                    {existingReleases.map(release => (
                      <div
                        key={release.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {release.partner?.name}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {release.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Partners */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Select Partners
                  </h3>
                  {availablePartners.length > 0 && (
                    <div className="flex items-center gap-2">
                      {matchingPartners.length > 0 && (
                        <button
                          onClick={selectAllMatching}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                        >
                          <Target className="w-3 h-3" />
                          Select Matching ({matchingPartners.length})
                        </button>
                      )}
                      <button
                        onClick={selectAll}
                        className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        All
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {availablePartners.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    All partners have already received this deal
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* Matching Partners Section */}
                    {matchingPartners.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <Target className="w-3 h-3 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                              Matches Criteria
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            These partners are looking for deals like this
                          </span>
                        </div>
                        <div className="space-y-2">
                          {matchingPartners.map(partner => (
                            <PartnerCard
                              key={partner.id}
                              partner={partner}
                              isSelected={selectedPartners.includes(partner.id)}
                              onToggle={() => togglePartner(partner.id)}
                              isMatch={true}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Non-Matching Partners Section */}
                    {nonMatchingPartners.length > 0 && (
                      <div>
                        {matchingPartners.length > 0 && (
                          <div className="flex items-center gap-2 mb-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Other Partners
                            </span>
                          </div>
                        )}
                        <div className="space-y-2">
                          {nonMatchingPartners.map(partner => (
                            <PartnerCard
                              key={partner.id}
                              partner={partner}
                              isSelected={selectedPartners.includes(partner.id)}
                              onToggle={() => togglePartner(partner.id)}
                              isMatch={false}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Release Notes */}
              {availablePartners.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Internal Notes (optional)
                  </label>
                  <textarea
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                    placeholder="Add any notes about why this deal is being sent to these partners..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-accent resize-none"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !success && availablePartners.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedPartners.length} partner{selectedPartners.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRelease}
                disabled={releasing || selectedPartners.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {releasing ? 'Releasing...' : 'Release to Partners'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Partner Card Component
function PartnerCard({
  partner,
  isSelected,
  onToggle,
  isMatch
}: {
  partner: Partner
  isSelected: boolean
  onToggle: () => void
  isMatch: boolean
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
        isSelected
          ? 'border-accent bg-accent/5'
          : isMatch
            ? 'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 bg-green-50/50 dark:bg-green-900/10'
            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isSelected
              ? 'bg-accent text-white'
              : isMatch
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
          }`}>
            {isMatch ? <Target className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 dark:text-white">
                {partner.name}
              </p>
              {isMatch && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-xs font-medium text-green-700 dark:text-green-400">
                  <Zap className="w-3 h-3" />
                  Match
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {partner.partner_type?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          isSelected
            ? 'border-accent bg-accent'
            : 'border-gray-300 dark:border-gray-500'
        }`}>
          {isSelected && (
            <CheckCircle2 className="w-4 h-4 text-white" />
          )}
        </div>
      </div>

      {/* Match reasons */}
      {isMatch && partner.matchInfo && partner.matchInfo.matchReasons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {partner.matchInfo.matchReasons.map((reason, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* Partner capabilities */}
      <div className="flex flex-wrap gap-2 mt-3">
        {partner.can_tokenize && (
          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
            Can Tokenize
          </span>
        )}
        {partner.has_legal_team && (
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
            Legal Team
          </span>
        )}
        {partner.focus_asset_classes?.slice(0, 2).map(ac => (
          <span
            key={ac}
            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full"
          >
            {ac.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    </button>
  )
}

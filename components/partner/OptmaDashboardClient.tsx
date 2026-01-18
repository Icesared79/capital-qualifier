'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  PartnerDashboardStats,
  PartnerDashboardTab,
  PartnerNotificationPreferences,
  DealRelease,
  DealMatchInfo,
  FundingPartner
} from '@/lib/types'
import { checkDealMatch } from '@/lib/dealMatcher'
import PartnerDashboardStatsComponent from './PartnerDashboardStats'
import PartnerDealCard from './PartnerDealCard'
import PartnerPreferencesSettings from './PartnerPreferencesSettings'
import { Settings, Search, RefreshCw, Bell, Filter, HelpCircle, Sliders } from 'lucide-react'

interface DealWithRelease {
  release: DealRelease
  deal: {
    id: string
    qualification_code: string
    capital_amount: string | number | null
    overall_score: number | null
    qualification_score: string | null
    qualification_data: Record<string, any> | null
    notes: string | null
    company: {
      id: string
      name: string
      qualification_data: Record<string, any> | null
      owner: {
        id: string
        email: string
        full_name: string | null
      } | null
    } | null
  }
  matchInfo?: DealMatchInfo
}

interface OptmaDashboardClientProps {
  partner: FundingPartner
  initialPreferences: PartnerNotificationPreferences | null
  initialReleases: DealWithRelease[]
  competitionCounts?: Record<string, number>
}

function calculateStats(releases: DealWithRelease[]): PartnerDashboardStats {
  return {
    total: releases.length,
    new: releases.filter(r => r.release.status === 'pending').length,
    in_progress: releases.filter(r =>
      ['viewed', 'interested', 'reviewing'].includes(r.release.status)
    ).length,
    due_diligence: releases.filter(r => r.release.status === 'due_diligence').length,
    passed: releases.filter(r => r.release.status === 'passed').length,
    funded: releases.filter(r => r.release.status === 'funded').length
  }
}

function filterByTab(releases: DealWithRelease[], tab: PartnerDashboardTab): DealWithRelease[] {
  switch (tab) {
    case 'new':
      return releases.filter(r => r.release.status === 'pending')
    case 'in_progress':
      return releases.filter(r =>
        ['viewed', 'interested', 'reviewing'].includes(r.release.status)
      )
    case 'due_diligence':
      return releases.filter(r => r.release.status === 'due_diligence')
    case 'passed':
      return releases.filter(r => r.release.status === 'passed')
    case 'funded':
      return releases.filter(r => r.release.status === 'funded')
    default:
      return releases
  }
}

export default function OptmaDashboardClient({
  partner,
  initialPreferences,
  initialReleases,
  competitionCounts = {}
}: OptmaDashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [releases, setReleases] = useState<DealWithRelease[]>(initialReleases)
  const [preferences, setPreferences] = useState<PartnerNotificationPreferences | null>(initialPreferences)
  const [activeTab, setActiveTab] = useState<PartnerDashboardTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showMatchesOnly, setShowMatchesOnly] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Calculate match info for each deal
  const releasesWithMatch = useMemo(() => {
    return releases.map(r => {
      const companyData = r.deal.company?.qualification_data || {}
      const dealForMatching = {
        capital_amount: r.deal.capital_amount,
        overall_score: r.deal.overall_score,
        asset_classes: companyData.loanAssetClasses || companyData.assets || [],
        geographic_focus: companyData.geographicFocus || companyData.location || null,
        qualification_data: r.deal.qualification_data
      }
      return {
        ...r,
        matchInfo: checkDealMatch(preferences, dealForMatching)
      }
    })
  }, [releases, preferences])

  // Calculate stats
  const stats = useMemo(() => calculateStats(releases), [releases])

  // Filter releases
  const filteredReleases = useMemo(() => {
    let filtered = filterByTab(releasesWithMatch, activeTab)

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r =>
        r.deal.company?.name.toLowerCase().includes(query) ||
        r.deal.qualification_code.toLowerCase().includes(query)
      )
    }

    // Apply matches only filter
    if (showMatchesOnly) {
      filtered = filtered.filter(r => r.matchInfo?.matches)
    }

    // Sort: matches first, then by released_at
    return filtered.sort((a, b) => {
      const aMatches = a.matchInfo?.matches ?? false
      const bMatches = b.matchInfo?.matches ?? false
      if (aMatches && !bMatches) return -1
      if (!aMatches && bMatches) return 1
      return new Date(b.release.released_at).getTime() - new Date(a.release.released_at).getTime()
    })
  }, [releasesWithMatch, activeTab, searchQuery, showMatchesOnly])

  const refreshData = async () => {
    setRefreshing(true)
    try {
      // Fetch updated releases
      const { data: releasesData, error } = await supabase
        .from('deal_releases')
        .select(`
          *,
          deal:deals!inner (
            id,
            qualification_code,
            capital_amount,
            overall_score,
            qualification_score,
            qualification_data,
            notes,
            company:companies!inner (
              id,
              name,
              qualification_data,
              owner:profiles!companies_owner_id_fkey (
                id,
                email,
                full_name
              )
            )
          )
        `)
        .eq('partner_id', partner.id)
        .order('released_at', { ascending: false })

      if (!error && releasesData) {
        const formattedReleases: DealWithRelease[] = releasesData.map((r: any) => ({
          release: {
            id: r.id,
            deal_id: r.deal_id,
            partner_id: r.partner_id,
            released_by: r.released_by,
            released_at: r.released_at,
            release_notes: r.release_notes,
            access_level: r.access_level,
            status: r.status,
            first_viewed_at: r.first_viewed_at,
            interest_expressed_at: r.interest_expressed_at,
            passed_at: r.passed_at,
            pass_reason: r.pass_reason,
            partner_notes: r.partner_notes,
            created_at: r.created_at,
            updated_at: r.updated_at
          },
          deal: r.deal
        }))
        setReleases(formattedReleases)
      }
    } catch (err) {
      console.error('Error refreshing data:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleDealAction = async (
    dealId: string,
    action: 'express_interest' | 'pass' | 'start_due_diligence',
    notes?: string,
    passReason?: string
  ) => {
    try {
      const response = await fetch(`/api/partner/deal/${dealId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes, passReason })
      })

      if (response.ok) {
        await refreshData()
      } else {
        const data = await response.json()
        console.error('Action failed:', data.error)
        alert(data.error || 'Failed to perform action')
      }
    } catch (err) {
      console.error('Error performing action:', err)
      alert('Failed to perform action')
    }
  }

  const handleDownloadPackage = async (dealId: string) => {
    try {
      const response = await fetch(`/api/partner/deal/${dealId}/package`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `deal-package-${dealId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to download package')
      }
    } catch (err) {
      console.error('Error downloading package:', err)
      alert('Failed to download package')
    }
  }

  const handlePreferencesSaved = (newPreferences: PartnerNotificationPreferences) => {
    setPreferences(newPreferences)
    setShowSettings(false)
  }

  // Mark new releases as viewed when viewed
  useEffect(() => {
    const markAsViewed = async () => {
      const pendingReleases = releases.filter(r => r.release.status === 'pending')
      if (pendingReleases.length === 0) return

      for (const r of pendingReleases) {
        try {
          await supabase
            .from('deal_releases')
            .update({
              status: 'viewed',
              first_viewed_at: new Date().toISOString()
            })
            .eq('id', r.release.id)
        } catch (err) {
          console.error('Error marking as viewed:', err)
        }
      }
    }

    // Mark as viewed after a short delay
    const timer = setTimeout(markAsViewed, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Deal Pipeline
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
            Deals released to {partner.name} for review
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            title="Refresh deals"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
            title="Set your deal criteria to get matched with relevant deals"
          >
            <Sliders className="w-4 h-4" />
            My Deal Criteria
          </button>
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click a card below to filter deals by status
          </p>
          {activeTab !== 'all' && (
            <button
              onClick={() => setActiveTab('all')}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
        <PartnerDashboardStatsComponent
          stats={stats}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Search by company name or deal code
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., Acme Corp or CQ-2024-001"
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-gray-600"
              />
            </div>
          </div>

          {/* Matches Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Filter by your criteria
            </label>
            <button
              onClick={() => setShowMatchesOnly(!showMatchesOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
                showMatchesOnly
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600'
              }`}
              title="Show only deals that match your preferred asset classes, deal sizes, and geographies"
            >
              <Filter className="w-4 h-4" />
              {showMatchesOnly ? 'Showing Matches' : 'Show Matches Only'}
            </button>
          </div>
        </div>

        {/* Explainer */}
        {!preferences && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Set your deal criteria above to filter deals that match your investment preferences
          </p>
        )}
        {preferences && showMatchesOnly && filteredReleases.length === 0 && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            No deals currently match your criteria. Try adjusting your deal criteria or turn off the filter.
          </p>
        )}
      </div>

      {/* No preferences notice */}
      {!preferences && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-800/50 rounded-lg">
              <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 dark:text-purple-200">
                Set Up Your Deal Criteria
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                Tell us what types of deals you&apos;re looking for. We&apos;ll highlight deals that match your:
              </p>
              <ul className="text-sm text-purple-600 dark:text-purple-400 mt-2 space-y-1">
                <li>• <strong>Asset Classes</strong> — Real estate, consumer loans, SMB, etc.</li>
                <li>• <strong>Deal Size</strong> — Your min/max investment range</li>
                <li>• <strong>Geography</strong> — Where you want to invest</li>
                <li>• <strong>Quality Score</strong> — Minimum qualification score</li>
              </ul>
              <button
                onClick={() => setShowSettings(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Sliders className="w-4 h-4" />
                Set My Deal Criteria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deals List */}
      <div className="space-y-4">
        {filteredReleases.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery
                ? 'No deals match your search.'
                : showMatchesOnly
                ? 'No deals match your criteria.'
                : activeTab === 'all'
                ? 'No deals have been released to you yet.'
                : `No deals in "${activeTab.replace('_', ' ')}" status.`}
            </p>
          </div>
        ) : (
          filteredReleases.map(({ release, deal, matchInfo }) => (
            <PartnerDealCard
              key={release.id}
              release={release}
              deal={deal}
              matchInfo={matchInfo as DealMatchInfo}
              otherPartnersReviewing={competitionCounts[deal.id]}
              onAction={(action, notes, passReason) =>
                handleDealAction(deal.id, action, notes, passReason)
              }
              onDownloadPackage={() => handleDownloadPackage(deal.id)}
            />
          ))
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <PartnerPreferencesSettings
          preferences={preferences}
          isModal={true}
          onClose={() => setShowSettings(false)}
          onSave={handlePreferencesSaved}
        />
      )}
    </div>
  )
}

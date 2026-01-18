'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCapitalAmount } from '@/lib/formatters'
import {
  Building2,
  TrendingUp,
  Clock,
  MapPin,
  DollarSign,
  Eye,
  ChevronRight,
  Sparkles,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react'

interface ReleasedDeal {
  id: string
  deal_id: string
  released_at: string
  access_level: 'summary' | 'full' | 'documents'
  status: string
  first_viewed_at: string | null
  interest_expressed_at: string | null
  deal: {
    id: string
    qualification_code: string
    overall_score: number | null
    qualification_score: string | null
    capital_amount: string | null
    opportunity_size: string | null
    strengths: string[] | null
    company: {
      id: string
      name: string
      type: string
      assets: string[] | null
      qualification_data: any
    }
  }
}

const scoreColors = {
  strong: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  moderate: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  needs_discussion: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'New', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  viewed: { label: 'Viewed', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  interested: { label: 'Interested', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  reviewing: { label: 'Reviewing', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  due_diligence: { label: 'Due Diligence', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  term_sheet: { label: 'Term Sheet', color: 'bg-accent/10 text-accent' },
  passed: { label: 'Passed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  funded: { label: 'Funded', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

export default function PartnerDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [releases, setReleases] = useState<ReleasedDeal[]>([])
  const [partnerInfo, setPartnerInfo] = useState<{ name: string; slug: string } | null>(null)
  const [filter, setFilter] = useState<'all' | 'new' | 'interested' | 'passed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    // Get current user and verify partner role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth?mode=login')
      return
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      router.push('/dashboard')
      return
    }

    // Get partner info based on role (role should match partner slug)
    const { data: partner } = await supabase
      .from('funding_partners')
      .select('id, name, slug')
      .eq('slug', profile.role)
      .single()

    if (!partner) {
      // Not a partner, redirect
      router.push('/dashboard')
      return
    }

    setPartnerInfo({ name: partner.name, slug: partner.slug })

    // Fetch deals released to this partner
    const { data: releasedDeals, error } = await supabase
      .from('deal_releases')
      .select(`
        id,
        deal_id,
        released_at,
        access_level,
        status,
        first_viewed_at,
        interest_expressed_at,
        deal:deals (
          id,
          qualification_code,
          overall_score,
          qualification_score,
          capital_amount,
          opportunity_size,
          strengths,
          company:companies (
            id,
            name,
            type,
            assets,
            qualification_data
          )
        )
      `)
      .eq('partner_id', partner.id)
      .order('released_at', { ascending: false })

    if (error) {
      console.error('Error fetching releases:', error)
    } else {
      setReleases(releasedDeals as unknown as ReleasedDeal[])
    }

    setLoading(false)
  }

  // Filter and search logic
  const filteredReleases = releases.filter(release => {
    // Status filter
    if (filter === 'new' && release.status !== 'pending') return false
    if (filter === 'interested' && !['interested', 'reviewing', 'due_diligence', 'term_sheet'].includes(release.status)) return false
    if (filter === 'passed' && release.status !== 'passed') return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const companyName = release.deal?.company?.name?.toLowerCase() || ''
      const code = release.deal?.qualification_code?.toLowerCase() || ''
      if (!companyName.includes(query) && !code.includes(query)) return false
    }

    return true
  })

  // Stats
  const stats = {
    total: releases.length,
    new: releases.filter(r => r.status === 'pending').length,
    interested: releases.filter(r => ['interested', 'reviewing', 'due_diligence', 'term_sheet'].includes(r.status)).length,
    passed: releases.filter(r => r.status === 'passed').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Deal Pipeline
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
            {partnerInfo?.name} — {stats.total} deal{stats.total !== 1 ? 's' : ''} available for review
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border-2 transition-colors text-left ${
            filter === 'all'
              ? 'border-accent bg-accent/5'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Deals</p>
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`p-4 rounded-xl border-2 transition-colors text-left ${
            filter === 'new'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.new}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">New</p>
        </button>
        <button
          onClick={() => setFilter('interested')}
          className={`p-4 rounded-xl border-2 transition-colors text-left ${
            filter === 'interested'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.interested}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
        </button>
        <button
          onClick={() => setFilter('passed')}
          className={`p-4 rounded-xl border-2 transition-colors text-left ${
            filter === 'passed'
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.passed}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Passed</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by company name or deal code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-accent"
        />
      </div>

      {/* Deals List */}
      {filteredReleases.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No deals found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {filter !== 'all' ? 'Try changing your filter or ' : ''}
            Check back later for new opportunities.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReleases.map((release) => (
            <DealCard key={release.id} release={release} />
          ))}
        </div>
      )}
    </div>
  )
}

function DealCard({ release }: { release: ReleasedDeal }) {
  const deal = release.deal
  const company = deal?.company
  const qData = company?.qualification_data || {}

  const statusInfo = statusLabels[release.status] || statusLabels.pending

  // Extract data for display
  const assetClasses = company?.assets || []
  const geoFocus = qData.geographicFocus || qData.location || 'Not specified'
  const strengths = deal?.strengths || []

  return (
    <Link
      href={`/dashboard/partner/deal/${deal?.id}`}
      className="block bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-accent/50 dark:hover:border-accent/50 transition-colors overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {company?.name || 'Unknown Company'}
              </h3>
              {release.status === 'pending' && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full animate-pulse">
                  NEW
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {deal?.qualification_code} • Released {new Date(release.released_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {deal?.qualification_score && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${scoreColors[deal.qualification_score as keyof typeof scoreColors]}`}>
                {deal.qualification_score === 'strong' ? 'Strong' :
                 deal.qualification_score === 'moderate' ? 'Moderate' : 'Review'}
              </span>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {deal?.overall_score && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{deal.overall_score}/100</p>
              </div>
            </div>
          )}
          {deal?.capital_amount && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Seeking</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCapitalAmount(deal.capital_amount)}</p>
              </div>
            </div>
          )}
          {assetClasses.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Asset Class</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">
                  {assetClasses[0]?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Geography</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">
                {geoFocus}
              </p>
            </div>
          </div>
        </div>

        {/* Strengths Preview */}
        {strengths.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {strengths.slice(0, 3).map((strength, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-lg"
              >
                {strength}
              </span>
            ))}
            {strengths.length > 3 && (
              <span className="px-2 py-1 text-gray-400 text-xs">
                +{strengths.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {release.first_viewed_at ? (
              <>
                <Eye className="w-4 h-4" />
                Viewed {new Date(release.first_viewed_at).toLocaleDateString()}
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Not yet viewed
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-accent font-semibold text-sm">
            {release.access_level === 'summary' ? 'View Summary' : 'View Full Package'}
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  PieChart,
  Target,
  Zap,
  RefreshCw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Settings,
  Link2
} from 'lucide-react'

interface PipelineMetrics {
  totalDeals: number
  byStage: Record<string, number>
  totalRequestedAmount: number
  avgDealSize: number
  thisMonthDeals: number
  lastMonthDeals: number
}

interface PartnerMetrics {
  totalPartners: number
  byRole: Record<string, number>
  activeDealsAssigned: number
}

interface DocumentMetrics {
  totalDocuments: number
  pendingReview: number
  approved: number
  rejected: number
  avgCompletionRate: number
}

interface ScoreMetrics {
  assessedDeals: number
  avgScore: number
  gradeDistribution: Record<string, number>
  readinessBreakdown: {
    ready: number
    conditional: number
    notReady: number
  }
}

const STAGE_LABELS: Record<string, string> = {
  'new': 'New',
  'document_collection': 'Document Collection',
  'under_review': 'Under Review',
  'scoring': 'Scoring',
  'partner_matching': 'Partner Matching',
  'negotiation': 'Negotiation',
  'closing': 'Closing',
  'funded': 'Funded',
  'declined': 'Declined'
}

const STAGE_COLORS: Record<string, string> = {
  'new': 'bg-gray-500',
  'document_collection': 'bg-blue-500',
  'under_review': 'bg-indigo-500',
  'scoring': 'bg-purple-500',
  'partner_matching': 'bg-pink-500',
  'negotiation': 'bg-orange-500',
  'closing': 'bg-amber-500',
  'funded': 'bg-green-500',
  'declined': 'bg-red-500'
}

// Scoring criteria configuration
const SCORING_CRITERIA = {
  categoryWeights: {
    portfolioPerformance: { weight: 0.30, label: 'Portfolio Performance', description: 'Default rates, delinquency, payment history' },
    cashFlowQuality: { weight: 0.20, label: 'Cash Flow Quality', description: 'DSCR, yield stability, collection rates' },
    documentation: { weight: 0.10, label: 'Documentation', description: 'Completeness and quality of loan files' },
    collateralCoverage: { weight: 0.20, label: 'Collateral Coverage', description: 'LTV ratios, property values, appraisals' },
    diversification: { weight: 0.10, label: 'Diversification', description: 'Geographic, borrower, and property type concentration' },
    regulatoryReadiness: { weight: 0.10, label: 'Regulatory Readiness', description: 'Licensing, compliance, servicing capability' },
  },
  gradeThresholds: [
    { min: 95, grade: 'A+', label: 'Exceptional' },
    { min: 90, grade: 'A', label: 'Excellent' },
    { min: 85, grade: 'A-', label: 'Very Good' },
    { min: 80, grade: 'B+', label: 'Good' },
    { min: 75, grade: 'B', label: 'Above Average' },
    { min: 70, grade: 'B-', label: 'Average' },
    { min: 65, grade: 'C+', label: 'Below Average' },
    { min: 60, grade: 'C', label: 'Fair' },
    { min: 55, grade: 'C-', label: 'Marginal' },
    { min: 50, grade: 'D', label: 'Poor' },
    { min: 0, grade: 'F', label: 'Failing' },
  ],
  redFlagThresholds: {
    defaultRate: { threshold: 5, severity: 'high', message: 'Default rate exceeds 5%' },
    delinquency30: { threshold: 10, severity: 'medium', message: '30-day delinquency exceeds 10%' },
    concentration: { threshold: 40, severity: 'medium', message: 'Single exposure exceeds 40%' },
    ltv: { threshold: 85, severity: 'high', message: 'Average LTV exceeds 85%' },
    trackRecord: { threshold: 12, severity: 'medium', message: 'Less than 12 months performance history' },
  },
  assetTypeDocuments: {
    cre: ['CRE Loan Tape', 'Property Appraisals', 'Rent Rolls', 'Property NOI Documentation', 'Environmental Assessments'],
    residential: ['Residential Loan Tape', 'Credit Policy Guidelines', 'State Licensing', 'Title Reports'],
    consumer: ['Consumer Loan Tape', 'Consumer Loan Agreement Template', 'Credit Policy Guidelines', 'State Licensing'],
    mca: ['MCA Portfolio Tape', 'Merchant Agreement Template', 'ACH Authorization Samples', 'Collections & Recovery Procedures'],
    smb: ['SMB/Business Loan Tape', 'Business Credit Evaluation Process', 'UCC Filing Samples'],
    private_equity: ['Fund Documents (LPA/PPM)', 'Portfolio Company Financials', 'NAV Reports', 'GP/Manager Track Record'],
  },
  fundingTierRequirements: {
    '10m_50m': ['Audited Financial Statements', 'Legal Opinion Letter', 'Third-Party Valuation'],
    'over_50m': ['Audited Financial Statements', 'Legal Opinion Letter', 'Third-Party Valuation'],
  },
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pipelineMetrics, setPipelineMetrics] = useState<PipelineMetrics | null>(null)
  const [partnerMetrics, setPartnerMetrics] = useState<PartnerMetrics | null>(null)
  const [documentMetrics, setDocumentMetrics] = useState<DocumentMetrics | null>(null)
  const [scoreMetrics, setScoreMetrics] = useState<ScoreMetrics | null>(null)
  const [recentDeals, setRecentDeals] = useState<any[]>([])
  const [showCriteria, setShowCriteria] = useState(false)
  const [criteriaTab, setCriteriaTab] = useState<'weights' | 'grades' | 'redflags' | 'documents' | 'routes'>('weights')

  const supabase = createClient()

  useEffect(() => {
    loadAllMetrics()
  }, [])

  const loadAllMetrics = async () => {
    setLoading(true)
    await Promise.all([
      loadPipelineMetrics(),
      loadPartnerMetrics(),
      loadDocumentMetrics(),
      loadScoreMetrics(),
      loadRecentDeals()
    ])
    setLoading(false)
  }

  const refreshMetrics = async () => {
    setRefreshing(true)
    await loadAllMetrics()
    setRefreshing(false)
  }

  const loadPipelineMetrics = async () => {
    const { data: deals } = await supabase
      .from('deals')
      .select('id, stage, funding_amount, created_at')

    if (deals) {
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      const byStage: Record<string, number> = {}
      let totalAmount = 0

      deals.forEach(deal => {
        byStage[deal.stage] = (byStage[deal.stage] || 0) + 1
        totalAmount += deal.funding_amount || 0
      })

      const thisMonthDeals = deals.filter(d => new Date(d.created_at) >= thisMonth).length
      const lastMonthDeals = deals.filter(d => {
        const date = new Date(d.created_at)
        return date >= lastMonth && date <= lastMonthEnd
      }).length

      setPipelineMetrics({
        totalDeals: deals.length,
        byStage,
        totalRequestedAmount: totalAmount,
        avgDealSize: deals.length > 0 ? totalAmount / deals.length : 0,
        thisMonthDeals,
        lastMonthDeals
      })
    }
  }

  const loadPartnerMetrics = async () => {
    const { data: partners } = await supabase
      .from('partners')
      .select('id, role, is_active')
      .eq('is_active', true)

    const { data: assignments } = await supabase
      .from('deal_partners')
      .select('id')
      .eq('status', 'active')

    if (partners) {
      const byRole: Record<string, number> = {}
      partners.forEach(p => {
        byRole[p.role] = (byRole[p.role] || 0) + 1
      })

      setPartnerMetrics({
        totalPartners: partners.length,
        byRole,
        activeDealsAssigned: assignments?.length || 0
      })
    }
  }

  const loadDocumentMetrics = async () => {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, status, deal_id')

    if (docs) {
      const pendingReview = docs.filter(d => d.status === 'pending').length
      const approved = docs.filter(d => d.status === 'approved').length
      const rejected = docs.filter(d => d.status === 'rejected').length

      const dealDocs: Record<string, { total: number, approved: number }> = {}
      docs.forEach(d => {
        if (!dealDocs[d.deal_id]) {
          dealDocs[d.deal_id] = { total: 0, approved: 0 }
        }
        dealDocs[d.deal_id].total++
        if (d.status === 'approved') dealDocs[d.deal_id].approved++
      })

      const rates = Object.values(dealDocs).map(d => d.total > 0 ? (d.approved / d.total) * 100 : 0)
      const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0

      setDocumentMetrics({
        totalDocuments: docs.length,
        pendingReview,
        approved,
        rejected,
        avgCompletionRate: avgRate
      })
    }
  }

  const loadScoreMetrics = async () => {
    const { data: assessments } = await supabase
      .from('portfolio_assessments')
      .select('id, overall_score, letter_grade, tokenization_readiness, status')
      .eq('status', 'complete')

    if (assessments) {
      const gradeDistribution: Record<string, number> = {}
      let totalScore = 0
      let ready = 0
      let conditional = 0
      let notReady = 0

      assessments.forEach(a => {
        if (a.letter_grade) {
          gradeDistribution[a.letter_grade] = (gradeDistribution[a.letter_grade] || 0) + 1
        }
        if (a.overall_score) totalScore += a.overall_score

        if (a.tokenization_readiness === 'ready') ready++
        else if (a.tokenization_readiness === 'conditional') conditional++
        else notReady++
      })

      setScoreMetrics({
        assessedDeals: assessments.length,
        avgScore: assessments.length > 0 ? totalScore / assessments.length : 0,
        gradeDistribution,
        readinessBreakdown: { ready, conditional, notReady }
      })
    }
  }

  const loadRecentDeals = async () => {
    const { data } = await supabase
      .from('deals')
      .select(`
        id,
        name,
        stage,
        funding_amount,
        created_at,
        company:companies (name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    setRecentDeals(data || [])
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
    return `$${amount.toFixed(0)}`
  }

  const getChangeIndicator = (current: number, previous: number) => {
    if (previous === 0) return null
    const change = ((current - previous) / previous) * 100
    if (change > 0) {
      return (
        <span className="flex items-center text-green-600 dark:text-green-400 text-sm">
          <TrendingUp className="w-4 h-4 mr-1" />
          +{change.toFixed(0)}%
        </span>
      )
    } else if (change < 0) {
      return (
        <span className="flex items-center text-red-600 dark:text-red-400 text-sm">
          <TrendingDown className="w-4 h-4 mr-1" />
          {change.toFixed(0)}%
        </span>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-purple-600" />
            Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time business metrics and portfolio insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCriteria(!showCriteria)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Scoring Criteria
            {showCriteria ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={refreshMetrics}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Scoring Criteria Reference Panel */}
      {showCriteria && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'weights', label: 'Category Weights' },
              { id: 'grades', label: 'Grade Thresholds' },
              { id: 'redflags', label: 'Red Flags' },
              { id: 'documents', label: 'Document Requirements' },
              { id: 'routes', label: 'Admin Routes' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCriteriaTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  criteriaTab === tab.id
                    ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {criteriaTab === 'weights' && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Each category contributes to the overall portfolio score based on these weights (must total 100%):
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(SCORING_CRITERIA.categoryWeights).map(([key, value]) => (
                    <div key={key} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{value.label}</span>
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {(value.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{value.description}</p>
                      <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${value.weight * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {criteriaTab === 'grades' && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Letter grades are assigned based on the overall score:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {SCORING_CRITERIA.gradeThresholds.map((threshold, idx) => {
                    const nextThreshold = SCORING_CRITERIA.gradeThresholds[idx - 1]?.min || 100
                    return (
                      <div
                        key={threshold.grade}
                        className={`p-3 rounded-lg text-center ${
                          threshold.grade.startsWith('A') ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                          threshold.grade.startsWith('B') ? 'bg-blue-50 dark:bg-blue-900/20' :
                          threshold.grade.startsWith('C') ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                          'bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        <div className={`text-2xl font-bold ${
                          threshold.grade.startsWith('A') ? 'text-emerald-600 dark:text-emerald-400' :
                          threshold.grade.startsWith('B') ? 'text-blue-600 dark:text-blue-400' :
                          threshold.grade.startsWith('C') ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {threshold.grade}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {threshold.min}-{nextThreshold - 1}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          {threshold.label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {criteriaTab === 'redflags' && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Red flags are automatically triggered when these thresholds are exceeded:
                </p>
                <div className="space-y-3">
                  {Object.entries(SCORING_CRITERIA.redFlagThresholds).map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border-l-4 ${
                        value.severity === 'high'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            value.severity === 'high'
                              ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                              : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                          }`}>
                            {value.severity.toUpperCase()}
                          </span>
                          <span className="ml-3 text-gray-900 dark:text-white font-medium">
                            {value.message}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Threshold: {value.threshold}{key.includes('Rate') || key.includes('concentration') || key.includes('ltv') ? '%' : ' months'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {criteriaTab === 'documents' && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Required documents vary by asset type. Core documents apply to all deals.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      By Asset Type
                    </h4>
                    <div className="space-y-4">
                      {Object.entries(SCORING_CRITERIA.assetTypeDocuments).map(([assetType, docs]) => (
                        <div key={assetType} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <div className="font-medium text-gray-900 dark:text-white capitalize mb-2">
                            {assetType.replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <ul className="space-y-1">
                            {docs.map(doc => (
                              <li key={doc} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">By Funding Size</h4>
                    <div className="space-y-4">
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="font-medium text-gray-900 dark:text-white mb-2">
                          Large Deals ($10M+)
                        </div>
                        <ul className="space-y-1">
                          {SCORING_CRITERIA.fundingTierRequirements['10m_50m'].map(doc => (
                            <li key={doc} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="font-medium text-gray-900 dark:text-white mb-2">
                          Core Documents (All Deals)
                        </div>
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>Company Formation Documents</li>
                          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>Ownership Structure</li>
                          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>Financial Statements (3 years)</li>
                          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>Bank Statements (6 months)</li>
                          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>Loan Tape / Portfolio Data</li>
                          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>Performance History</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {criteriaTab === 'routes' && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Quick reference to all admin dashboard routes for testing and navigation.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Main Admin Routes
                    </h4>
                    <div className="space-y-2">
                      {[
                        { path: '/dashboard/admin', label: 'Admin Console', description: 'Main admin overview' },
                        { path: '/dashboard/admin/deals', label: 'All Deals', description: 'Deal pipeline management' },
                        { path: '/dashboard/admin/partners', label: 'Partner Network', description: 'Partner directory' },
                        { path: '/dashboard/admin/team', label: 'Team Management', description: 'Team members & roles' },
                        { path: '/dashboard/admin/scoring', label: 'Analytics', description: 'Metrics & scoring (this page)' },
                      ].map(route => (
                        <a
                          key={route.path}
                          href={route.path}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                        >
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                              {route.label}
                            </div>
                            <div className="text-xs text-gray-500">{route.description}</div>
                          </div>
                          <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                            {route.path}
                          </code>
                        </a>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Configuration & System</h4>
                    <div className="space-y-2">
                      {[
                        { path: '/dashboard/admin/partners/[slug]', label: 'Partner Profile', description: 'Individual partner view' },
                        { path: '/dashboard/admin/partners/[slug]/deals', label: 'Partner Deals', description: 'Partner-specific deals' },
                        { path: '/dashboard/admin/config/checklist', label: 'Document Checklist', description: 'Document config' },
                        { path: '/dashboard/admin/config/fees', label: 'Fee Configuration', description: 'Fee structure settings' },
                        { path: '/dashboard/admin/system/activity', label: 'Activity Logs', description: 'System activity tracking' },
                        { path: '/dashboard/admin/system/migrations', label: 'Database Migrations', description: 'DB migration tools' },
                      ].map(route => (
                        <a
                          key={route.path}
                          href={route.path.includes('[') ? '#' : route.path}
                          className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg transition-colors group ${
                            route.path.includes('[') ? 'cursor-default' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div>
                            <div className={`font-medium text-gray-900 dark:text-white ${
                              !route.path.includes('[') && 'group-hover:text-purple-600 dark:group-hover:text-purple-400'
                            }`}>
                              {route.label}
                            </div>
                            <div className="text-xs text-gray-500">{route.description}</div>
                          </div>
                          <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                            {route.path}
                          </code>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Deals */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            {pipelineMetrics && getChangeIndicator(pipelineMetrics.thisMonthDeals, pipelineMetrics.lastMonthDeals)}
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {pipelineMetrics?.totalDeals || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Deals</p>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {pipelineMetrics?.thisMonthDeals || 0} this month
          </div>
        </div>

        {/* Total Requested */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(pipelineMetrics?.totalRequestedAmount || 0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Requested</p>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Avg: {formatCurrency(pipelineMetrics?.avgDealSize || 0)} per deal
          </div>
        </div>

        {/* Active Partners */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {partnerMetrics?.totalPartners || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active Partners</p>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {partnerMetrics?.activeDealsAssigned || 0} active assignments
          </div>
        </div>

        {/* Avg Score */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {scoreMetrics?.avgScore ? scoreMetrics.avgScore.toFixed(0) : '--'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Portfolio Score</p>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {scoreMetrics?.assessedDeals || 0} deals assessed
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Pipeline Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Pipeline Breakdown
          </h2>
          <div className="space-y-3">
            {pipelineMetrics && Object.entries(STAGE_LABELS).map(([stage, label]) => {
              const count = pipelineMetrics.byStage[stage] || 0
              const percentage = pipelineMetrics.totalDeals > 0
                ? (count / pipelineMetrics.totalDeals) * 100
                : 0

              return (
                <div key={stage} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-600 dark:text-gray-400 truncate">
                    {label}
                  </div>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${STAGE_COLORS[stage]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                    <span className="text-gray-400 text-xs ml-1">({percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Document Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Document Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-gray-700 dark:text-gray-300">Approved</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                {documentMetrics?.approved || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-gray-700 dark:text-gray-300">Pending Review</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                {documentMetrics?.pendingReview || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-gray-700 dark:text-gray-300">Rejected</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                {documentMetrics?.rejected || 0}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Avg Completion</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {documentMetrics?.avgCompletionRate?.toFixed(0) || 0}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${documentMetrics?.avgCompletionRate || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Partner Network */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Partner Network
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {partnerMetrics?.byRole?.funding || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Funding</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {partnerMetrics?.byRole?.legal || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Legal</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {partnerMetrics?.byRole?.tokenization || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tokenization</div>
            </div>
          </div>
        </div>

        {/* Portfolio Readiness */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Portfolio Readiness
          </h2>
          {scoreMetrics && scoreMetrics.assessedDeals > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {scoreMetrics.readinessBreakdown.ready}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Ready</div>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {scoreMetrics.readinessBreakdown.conditional}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Conditional</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {scoreMetrics.readinessBreakdown.notReady}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Not Ready</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No portfolio assessments completed yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Deals */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Recent Deals
          </h2>
          <a
            href="/dashboard/admin/deals"
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentDeals.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              No deals found
            </div>
          ) : (
            recentDeals.map(deal => (
              <div key={deal.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {deal.company?.name || deal.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(deal.funding_amount || 0)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    deal.stage === 'funded' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    deal.stage === 'declined' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  }`}>
                    {STAGE_LABELS[deal.stage] || deal.stage}
                  </span>
                  <span className="text-sm text-gray-400">
                    {new Date(deal.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ScoreResultsCard, ScoreBadge } from '@/components/scoring'
import { RefreshCw, FileSpreadsheet, Play, AlertCircle, Check, ChevronDown, ChevronUp, BookOpen, Settings } from 'lucide-react'

interface Deal {
  id: string
  name: string
  qualification_code: string
  stage: string
  created_at: string
  company: {
    id: string
    name: string
  }
}

interface Assessment {
  id: string
  deal_id: string
  status: string
  overall_score: number | null
  letter_grade: string | null
  tokenization_readiness: string | null
  ready_percentage: number | null
  conditional_percentage: number | null
  not_ready_percentage: number | null
  summary: string | null
  strengths: string[] | null
  concerns: string[] | null
  recommendations: string[] | null
  red_flags: any[] | null
  scores: any | null
  has_ai_analysis: boolean | null
  estimated_timeline: string | null
  created_at: string
  updated_at: string
}

interface Document {
  id: string
  name: string
  category: string
  status: string
  file_path: string
}

// Scoring criteria configuration - edit these to adjust scoring logic
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

export default function AdminScoringPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [runningAssessment, setRunningAssessment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCriteria, setShowCriteria] = useState(false)
  const [criteriaTab, setCriteriaTab] = useState<'weights' | 'grades' | 'redflags' | 'documents'>('weights')

  const supabase = createClient()

  useEffect(() => {
    loadDeals()
  }, [])

  useEffect(() => {
    if (selectedDeal) {
      loadDealData(selectedDeal.id)
    }
  }, [selectedDeal])

  const loadDeals = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('deals')
      .select(`
        id,
        name,
        qualification_code,
        stage,
        created_at,
        company:companies (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading deals:', error)
    } else {
      setDeals(data || [])
    }
    setLoading(false)
  }

  const loadDealData = async (dealId: string) => {
    // Load assessment
    const { data: assessmentData } = await supabase
      .from('portfolio_assessments')
      .select('*')
      .eq('deal_id', dealId)
      .single()

    setAssessment(assessmentData || null)

    // Load documents
    const { data: docs } = await supabase
      .from('documents')
      .select('id, name, category, status, file_path')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })

    setDocuments(docs || [])
  }

  const runAssessment = async () => {
    if (!selectedDeal) return

    setRunningAssessment(true)
    setError(null)
    setSuccess(null)

    // Find loan tape and performance history documents
    const loanTapeDoc = documents.find(d => d.category === 'loan_tape' && d.status === 'approved')
    const perfHistoryDoc = documents.find(d =>
      d.category === 'financials' &&
      d.name.toLowerCase().includes('performance') &&
      d.status === 'approved'
    )

    try {
      const response = await fetch('/api/scoring/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: selectedDeal.id,
          loanTapeDocumentId: loanTapeDoc?.id,
          performanceHistoryDocumentId: perfHistoryDoc?.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Assessment failed')
      }

      setSuccess('Assessment completed successfully!')
      await loadDealData(selectedDeal.id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRunningAssessment(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const loanTapeDocs = documents.filter(d => d.category === 'loan_tape')
  const hasApprovedLoanTape = loanTapeDocs.some(d => d.status === 'approved')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Scoring</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Run AI-powered assessments on deal portfolios
            </p>
          </div>
          <button
            onClick={() => setShowCriteria(!showCriteria)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Scoring Criteria
            {showCriteria ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Scoring Criteria Reference Panel */}
        {showCriteria && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'weights', label: 'Category Weights' },
                { id: 'grades', label: 'Grade Thresholds' },
                { id: 'redflags', label: 'Red Flags' },
                { id: 'documents', label: 'Document Requirements' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCriteriaTab(tab.id as any)}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    criteriaTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
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
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {(value.weight * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{value.description}</p>
                        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
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
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
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
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Deal List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">Deals</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : deals.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No deals found</div>
                ) : (
                  deals.map(deal => (
                    <button
                      key={deal.id}
                      onClick={() => setSelectedDeal(deal)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedDeal?.id === deal.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {deal.company?.name || 'Unknown Company'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {deal.qualification_code} • {deal.stage.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDate(deal.created_at)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Assessment Panel */}
          <div className="lg:col-span-2">
            {!selectedDeal ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a Deal
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a deal from the list to view or run its portfolio assessment
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Deal Info Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedDeal.company?.name}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {selectedDeal.qualification_code}
                      </p>
                    </div>
                    {assessment?.overall_score && assessment?.letter_grade && (
                      <ScoreBadge
                        score={assessment.overall_score}
                        grade={assessment.letter_grade}
                        readiness={assessment.tokenization_readiness as any}
                        size="lg"
                      />
                    )}
                  </div>

                  {/* Document Status */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Portfolio Documents
                    </h3>
                    {loanTapeDocs.length === 0 ? (
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        No loan tape documents uploaded
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {loanTapeDocs.map(doc => (
                          <div key={doc.id} className="flex items-center gap-3 text-sm">
                            {doc.status === 'approved' ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="text-gray-700 dark:text-gray-300">{doc.name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              doc.status === 'approved'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : doc.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {doc.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Run Assessment Button */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={runAssessment}
                      disabled={runningAssessment || !hasApprovedLoanTape}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        runningAssessment || !hasApprovedLoanTape
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {runningAssessment ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Running Assessment...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          {assessment ? 'Re-run Assessment' : 'Run Assessment'}
                        </>
                      )}
                    </button>
                    {!hasApprovedLoanTape && (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                        An approved loan tape document is required to run the assessment
                      </p>
                    )}
                  </div>

                  {/* Status Messages */}
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                      {success}
                    </div>
                  )}
                </div>

                {/* Assessment Results */}
                {assessment && assessment.status === 'complete' && assessment.overall_score && (
                  <ScoreResultsCard
                    assessment={{
                      overallScore: assessment.overall_score,
                      letterGrade: assessment.letter_grade || 'N/A',
                      status: assessment.status,
                      tokenizationReadiness: (assessment.tokenization_readiness || 'not_ready') as any,
                      readyPercentage: assessment.ready_percentage || 0,
                      conditionalPercentage: assessment.conditional_percentage || 0,
                      notReadyPercentage: assessment.not_ready_percentage || 0,
                      summary: assessment.summary || undefined,
                      strengths: assessment.strengths || [],
                      concerns: assessment.concerns || [],
                      recommendations: assessment.recommendations || [],
                      redFlags: assessment.red_flags || [],
                      scores: assessment.scores,
                      hasAIAnalysis: assessment.has_ai_analysis || false,
                      estimatedTimeline: assessment.estimated_timeline || undefined,
                    }}
                  />
                )}

                {assessment && assessment.status === 'error' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
                    <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                      Assessment Error
                    </h3>
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      The assessment failed to complete. Please check the uploaded documents and try again.
                    </p>
                  </div>
                )}

                {assessment && assessment.status === 'processing' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 flex items-center gap-4">
                    <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                    <div>
                      <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                        Assessment in Progress
                      </h3>
                      <p className="text-blue-600 dark:text-blue-400 text-sm">
                        The portfolio is being analyzed. This may take a minute...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

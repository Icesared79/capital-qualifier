'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CapitalFitCard from '@/components/ui/CapitalFitCard'
import Button from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import NotificationBell from '@/components/ui/NotificationBell'
import AdminControlsPanel from '@/components/workflow/AdminControlsPanel'
import DocumentChecklist from '@/components/workflow/DocumentChecklist'
import ActionItemsBanner from '@/components/workflow/ActionItemsBanner'
import { FundingApplicationStage } from '@/lib/types'
import { ScoreResultsCard } from '@/components/scoring'
import { ScoreHistoryChart } from '@/components/scoring/ScoreHistoryChart'
import { formatCapitalAmount } from '@/lib/formatters'
import CapitalAlignment from '@/components/ui/CapitalAlignment'

const fundingPurposeLabels: Record<string, string> = {
  working_capital: 'Working Capital / Growth',
  acquisition: 'Acquisition or Purchase',
  refinance: 'Refinance Existing Debt',
  construction: 'Construction / Development',
  portfolio_expansion: 'Portfolio Expansion',
  other: 'Other',
}

const assetLabels: Record<string, string> = {
  cre: 'Commercial Real Estate',
  residential: 'Residential Real Estate',
  real_estate: 'Real Estate',
  consumer: 'Consumer Loans',
  smb: 'SMB / Business Loans',
  loan_portfolio: 'Loan Portfolio',
  mca: 'MCA / Merchant Cash Advance',
  factoring: 'Factoring / Receivables',
  equipment: 'Equipment Finance',
  private_equity: 'Private Equity / Fund',
  receivables: 'Receivables',
  other: 'Other',
}

const stageConfig: Record<string, { label: string; color: string; description: string }> = {
  draft: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', description: 'Your offering is being prepared.' },
  qualified: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', description: 'Your offering has been submitted. Our team will review it and may request additional documents.' },
  documents_requested: { label: 'Documents Needed', color: 'bg-blue-100 text-blue-700', description: 'Please upload the requested documents to proceed.' },
  documents_in_review: { label: 'Documents Under Review', color: 'bg-blue-100 text-blue-700', description: 'Our team is reviewing your documents.' },
  due_diligence: { label: 'Due Diligence', color: 'bg-purple-100 text-purple-700', description: 'Your offering is in the due diligence phase.' },
  term_sheet: { label: 'Term Sheet', color: 'bg-purple-100 text-purple-700', description: 'A term sheet is being prepared for your review.' },
  negotiation: { label: 'Negotiation', color: 'bg-purple-100 text-purple-700', description: 'Terms are being negotiated.' },
  closing: { label: 'Closing', color: 'bg-green-100 text-green-700', description: 'Your funding is in the closing process.' },
  funded: { label: 'Funded', color: 'bg-green-100 text-green-700', description: 'Congratulations! Your funding has been completed.' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700', description: 'Unfortunately, this offering was not approved.' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-600', description: 'This offering has been withdrawn.' },
}


const opportunitySizeLabels: Record<string, string> = {
  institutional: 'Institutional Scale',
  mid_market: 'Mid-Market',
  emerging: 'Emerging',
  early_stage: 'Early Stage',
}

const timeToFundingLabels: Record<string, { label: string; color: string }> = {
  fast_track: { label: 'Fast Track (30-45 days)', color: 'text-green-600' },
  standard: { label: 'Standard (60-90 days)', color: 'text-blue-600' },
  extended: { label: 'Extended (90+ days)', color: 'text-amber-600' },
  needs_preparation: { label: 'Preparation Needed', color: 'text-orange-600' },
}

type ReleaseStatus = 'pending' | 'ready_for_release' | 'released' | 'rejected'

interface ApplicationData {
  id: string
  qualificationCode: string
  stage: string
  createdAt: string
  stageChangedAt?: string
  companyName?: string
  companyType?: string
  qualificationData?: any
  fundingAmount?: string
  fundingPurpose?: string
  overallScore?: number
  qualificationTier?: string
  capitalFits?: any[]
  recommendedStructure?: string
  opportunitySize?: string
  timeToFunding?: string
  strengths?: string[]
  considerations?: string[]
  nextSteps?: string[]
  dimensions?: any
  assignedTo?: string | null
  internalNotes?: string | null
  releaseStatus?: ReleaseStatus
  releasePartner?: string | null
  releaseAuthorizedAt?: string | null
}

interface PortfolioAssessment {
  overallScore: number | null
  letterGrade: string | null
  status: string
  tokenizationReadiness: 'ready' | 'conditional' | 'not_ready' | null
  readyPercentage: number
  conditionalPercentage: number
  notReadyPercentage: number
  summary: string | null
  strengths: string[]
  concerns: string[]
  recommendations: string[]
  redFlags: any[]
  scores: any
  hasAIAnalysis: boolean | null
  estimatedTimeline: string | null
}

interface PartnerMatch {
  id: string
  name: string
  type: string
  matchReasons: string[]
  matches: boolean
}

interface LegalInfo {
  status: string
  partnerId: string | null
  partnerName: string | null
  signedOffAt: string | null
  notes: string | null
  availablePartners: { id: string; name: string }[]
}

interface ApplicationDashboardProps {
  data: ApplicationData
  isAdmin?: boolean
  userId?: string
  portfolioAssessment?: PortfolioAssessment | null
  partnerMatches?: PartnerMatch[]
  legalInfo?: LegalInfo
}

// Timeline stages configuration - simplified to 4 stages
const timelineStages = [
  {
    key: 'qualified',
    label: 'Submitted',
    shortLabel: 'Submitted',
    description: 'Application received and under review',
    owner: 'BitCense',
    ownerColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    // Maps these backend stages to this timeline stage
    includesStages: ['qualified', 'documents_requested', 'documents_in_review']
  },
  {
    key: 'due_diligence',
    label: 'Review',
    shortLabel: 'Review',
    description: 'Documents and due diligence in progress',
    owner: 'BitCense',
    ownerColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    includesStages: ['due_diligence', 'term_sheet', 'negotiation']
  },
  {
    key: 'closing',
    label: 'Closing',
    shortLabel: 'Closing',
    description: 'Finalizing terms and paperwork',
    owner: 'Legal',
    ownerColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    includesStages: ['closing']
  },
  {
    key: 'funded',
    label: 'Funded',
    shortLabel: 'Funded',
    description: 'Funding complete',
    owner: 'Complete',
    ownerColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    includesStages: ['funded']
  },
]

export default function ApplicationDashboard({ data, isAdmin = false, userId, portfolioAssessment, partnerMatches = [], legalInfo }: ApplicationDashboardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'details'>('overview')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Find current stage index - check includesStages array
  const currentStageIndex = timelineStages.findIndex(s => s.includesStages?.includes(data.stage))
  const isTerminalState = data.stage === 'declined' || data.stage === 'withdrawn'

  // Delete offering handler
  const handleDeleteOffering = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('deals').delete().eq('id', data.id)
      if (error) {
        console.error('Error deleting offering:', error)
        alert('Failed to delete offering. Please try again.')
        setIsDeleting(false)
        setShowDeleteModal(false)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      console.error('Error deleting offering:', err)
      alert('Failed to delete offering. Please try again.')
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const stage = stageConfig[data.stage] || stageConfig.qualified

  // Only show scoring when portfolio assessment is complete (documents analyzed)
  const hasDocumentBasedScoring = portfolioAssessment && portfolioAssessment.status === 'complete' && portfolioAssessment.overallScore

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - Clean & Corporate */}
      <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center">
              <img src="/logo.svg" alt="BitCense" className="h-8 dark:invert" />
            </Link>

            {/* Right: Nav + Actions */}
            <div className="flex items-center gap-8">
              <nav className="hidden md:flex items-center gap-8">
                <Link href="/dashboard" className="text-base font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link href="/dashboard/profile" className="text-base font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Profile
                </Link>
                <Link href="/dashboard/documents" className="text-base font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Documents
                </Link>
              </nav>
              <div className="flex items-center gap-4">
                {userId && <NotificationBell userId={userId} />}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors text-base font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Action Items Banner - only for non-admins */}
        {!isAdmin && (
          <ActionItemsBanner
            dealId={data.id}
            currentStage={data.stage as FundingApplicationStage}
            isAdmin={isAdmin}
          />
        )}

        {/* Admin Controls Panel */}
        {isAdmin && (
          <AdminControlsPanel
            dealId={data.id}
            currentStage={data.stage as FundingApplicationStage}
            assignedTo={data.assignedTo || null}
            internalNotes={data.internalNotes || null}
            releaseStatus={data.releaseStatus}
            releasePartner={data.releasePartner}
            releaseAuthorizedAt={data.releaseAuthorizedAt}
            hasDocumentScoring={!!hasDocumentBasedScoring}
          />
        )}

        {/* Legal Partner Panel - Admin only */}
        {isAdmin && legalInfo && (
          <LegalPartnerPanel
            dealId={data.id}
            legalInfo={legalInfo}
            currentStage={data.stage}
          />
        )}

        {/* Hero Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 mb-8">
          {/* Main Info */}
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {data.fundingPurpose ? fundingPurposeLabels[data.fundingPurpose] || data.fundingPurpose : 'Funding Request'}
                {data.companyName && ` · ${data.companyName}`}
              </p>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {formatCapitalAmount(data.fundingAmount, 'Funding Offering')}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Offer Number</p>
              <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">{data.qualificationCode}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1" suppressHydrationWarning>
                {new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-2.5 rounded-lg font-semibold text-base transition-colors ${
              activeTab === 'overview'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-5 py-2.5 rounded-lg font-semibold text-base transition-colors ${
              activeTab === 'timeline'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-5 py-2.5 rounded-lg font-semibold text-base transition-colors ${
              activeTab === 'details'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Details
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left Column - Score Card & Checklist (3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Portfolio Assessment Score Card - Only shown after documents are analyzed */}
              {hasDocumentBasedScoring ? (
                <>
                  <ScoreResultsCard
                    assessment={{
                      overallScore: portfolioAssessment.overallScore,
                      letterGrade: portfolioAssessment.letterGrade || 'N/A',
                      status: portfolioAssessment.status,
                      tokenizationReadiness: portfolioAssessment.tokenizationReadiness || 'not_ready',
                      readyPercentage: portfolioAssessment.readyPercentage,
                      conditionalPercentage: portfolioAssessment.conditionalPercentage,
                      notReadyPercentage: portfolioAssessment.notReadyPercentage,
                      summary: portfolioAssessment.summary || undefined,
                      strengths: portfolioAssessment.strengths,
                      concerns: portfolioAssessment.concerns,
                      recommendations: portfolioAssessment.recommendations,
                      redFlags: portfolioAssessment.redFlags,
                      scores: portfolioAssessment.scores,
                      hasAIAnalysis: portfolioAssessment.hasAIAnalysis || false,
                      estimatedTimeline: portfolioAssessment.estimatedTimeline || undefined,
                    }}
                    qualificationCode={data.qualificationCode}
                    companyName={data.companyName}
                  />
                  <ScoreHistoryChart dealId={data.id} />
                </>
              ) : (
                /* Placeholder when no scoring yet - prompts document upload */
                <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Portfolio Assessment Pending</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Upload your portfolio documents to receive a comprehensive scoring assessment.
                    </p>
                    <Link
                      href={`/dashboard/documents?deal=${data.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Documents
                    </Link>
                  </div>
                </div>
              )}

              {/* Document Checklist */}
              <DocumentChecklist
                dealId={data.id}
                currentStage={data.stage as FundingApplicationStage}
                isAdmin={isAdmin}
                assetType={data.qualificationData?.assets?.[0] || data.qualificationData?.assetType}
                fundingAmount={data.fundingAmount}
              />
            </div>

            {/* Right Column - Capital Alignment (2 cols) */}
            <div className="lg:col-span-2">
              <CapitalAlignment
                fundingAmount={data.fundingAmount}
                fundingPurpose={data.fundingPurpose}
                assetTypes={data.qualificationData?.assets || data.qualificationData?.loanAssetClasses || []}
                location={data.qualificationData?.location || data.qualificationData?.country}
                partners={partnerMatches}
                documentsComplete={data.stage !== 'draft' && data.stage !== 'qualified'}
                dealId={data.id}
              />
            </div>
          </div>

          {/* Capital Structure Options - Only show if data exists */}
          {data.capitalFits && data.capitalFits.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Capital Structure Options</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {data.capitalFits.map((fit: any, i: number) => (
                  <CapitalFitCard
                    key={i}
                    capitalFit={fit}
                  />
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic">
                For informational purposes only. Structure eligibility is based on general market criteria.
                Consult with your capital partner for specific structuring guidance.
              </p>
            </div>
          )}
          </>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Funding Progress</h3>
                {!isTerminalState && currentStageIndex >= 0 && (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Step {currentStageIndex + 1} of {timelineStages.length}
                  </span>
                )}
              </div>

              {isTerminalState ? (
                <div className={`p-4 rounded-lg ${data.stage === 'declined' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  <p className={`font-medium ${data.stage === 'declined' ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    {data.stage === 'declined' ? 'This offering was declined.' : 'This offering has been withdrawn.'}
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Progress Track */}
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${currentStageIndex >= 0 ? ((currentStageIndex + 1) / timelineStages.length) * 100 : 0}%` }}
                    />
                  </div>

                  {/* Stage Dots */}
                  <div className="flex justify-between mt-3">
                    {timelineStages.map((stage, index) => {
                      const isComplete = index < currentStageIndex
                      const isCurrent = index === currentStageIndex
                      const isPending = index > currentStageIndex

                      return (
                        <div key={stage.key} className="flex flex-col items-center" style={{ width: `${100 / timelineStages.length}%` }}>
                          <div className={`w-3 h-3 rounded-full ${
                            isComplete ? 'bg-green-500' :
                            isCurrent ? 'bg-green-500 ring-4 ring-green-100 dark:ring-green-900/50' :
                            'bg-gray-300 dark:bg-gray-600'
                          }`} />
                          <p className={`text-xs mt-2 text-center ${
                            isCurrent ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {stage.shortLabel}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Process Timeline</h3>

              <div className="space-y-0">
                {timelineStages.map((stage, index) => {
                  const isComplete = index < currentStageIndex
                  const isCurrent = index === currentStageIndex
                  const isPending = index > currentStageIndex
                  const isLast = index === timelineStages.length - 1

                  return (
                    <div key={stage.key} className="relative flex gap-4">
                      {/* Vertical Line */}
                      {!isLast && (
                        <div className={`absolute left-[11px] top-6 w-0.5 h-full ${
                          isComplete ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                      )}

                      {/* Status Indicator */}
                      <div className="relative z-10 flex-shrink-0">
                        {isComplete ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : isCurrent ? (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center ring-4 ring-blue-100 dark:ring-blue-900/50">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pb-8 ${isPending ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className={`font-bold ${isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {stage.label}
                          </h4>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stage.ownerColor}`}>
                            {stage.owner}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {stage.description}
                        </p>
                        {isCurrent && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                              Currently at this stage
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Party Legend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Parties Involved</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">BitCense</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Review & Coordination</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">Legal</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Documentation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Complete</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Funded</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Business Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Business Information
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5">Company Name</p>
                  <p className="text-base text-gray-900 dark:text-white font-semibold">{data.companyName || 'N/A'}</p>
                </div>
                {data.qualificationData?.location && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5">Location</p>
                    <p className="text-base text-gray-900 dark:text-gray-200">{data.qualificationData.location}</p>
                  </div>
                )}
                {data.qualificationData?.assets && data.qualificationData.assets.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5">Asset Types</p>
                    <p className="text-base text-gray-900 dark:text-gray-200">
                      {data.qualificationData.assets.map((a: string) => assetLabels[a] || a).join(', ')}
                    </p>
                  </div>
                )}
                {data.qualificationData?.loanAssetClasses && data.qualificationData.loanAssetClasses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5">Loan Types</p>
                    <p className="text-base text-gray-900 dark:text-gray-200">{data.qualificationData.loanAssetClasses.join(', ')}</p>
                  </div>
                )}
                {data.qualificationData?.annualVolume && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5">Annual Volume</p>
                    <p className="text-base text-gray-900 dark:text-gray-200">{data.qualificationData.annualVolume}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Funding Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Funding Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5">Amount Requested</p>
                  <p className="text-base text-gray-900 dark:text-white font-semibold">
                    {formatCapitalAmount(data.fundingAmount, 'Not specified')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5">Purpose</p>
                  <p className="text-base text-gray-900 dark:text-gray-200">
                    {data.fundingPurpose ? fundingPurposeLabels[data.fundingPurpose] || data.fundingPurpose : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5">Offering Code</p>
                  <p className="text-base text-gray-900 dark:text-gray-200 font-mono">{data.qualificationCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5">Submitted</p>
                  <p className="text-base text-gray-900 dark:text-gray-200" suppressHydrationWarning>{new Date(data.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Link
            href={`/dashboard/documents?deal=${data.id}`}
            className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 hover:border-gray-900 dark:hover:border-white transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-gray-900 dark:text-white">Upload Documents</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Financials, loan tape, legal documents</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <a
            href="https://cal.com/bitcense/capital-qualification-intro"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 hover:border-gray-900 dark:hover:border-white transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-gray-900 dark:text-white">Schedule a Call</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Discuss options with our capital team</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>

        {/* Delete & Help */}
        <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-300 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400 font-medium text-sm transition-colors"
          >
            Delete Offering
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Questions? Email{' '}
            <a href="mailto:capital@bitcense.com" className="text-gray-900 dark:text-white hover:underline font-semibold">
              capital@bitcense.com
            </a>
          </p>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Offering</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-base text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to permanently delete this offering? All associated data will be removed and cannot be recovered.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOffering}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold text-base hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Legal Partner Panel Component
function LegalPartnerPanel({
  dealId,
  legalInfo,
  currentStage
}: {
  dealId: string
  legalInfo: LegalInfo
  currentStage: string
}) {
  const router = useRouter()
  const [selectedPartner, setSelectedPartner] = useState(legalInfo.partnerId || '')
  const [isAssigning, setIsAssigning] = useState(false)
  const [notes, setNotes] = useState(legalInfo.notes || '')

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    not_required: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', label: 'Not Required' },
    pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Pending Assignment' },
    assigned: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Assigned' },
    in_review: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'In Review' },
    approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Approved' },
    changes_required: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'Changes Required' },
    rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Rejected' },
  }

  const currentStatus = statusColors[legalInfo.status] || statusColors.not_required

  // Only show legal panel for deals past qualification
  const relevantStages = ['due_diligence', 'term_sheet', 'negotiation', 'closing', 'funded']
  if (!relevantStages.includes(currentStage) && legalInfo.status === 'not_required') {
    return null
  }

  const handleAssignLegalPartner = async () => {
    if (!selectedPartner) return

    setIsAssigning(true)
    try {
      const response = await fetch(`/api/admin/deals/${dealId}/legal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_partner_id: selectedPartner,
          legal_status: 'assigned',
          legal_notes: notes
        })
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error assigning legal partner:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Legal Partner</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Assign a legal partner for review and sign-off</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentStatus.bg} ${currentStatus.text}`}>
          {currentStatus.label}
        </span>
      </div>

      {legalInfo.partnerName ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Assigned to</p>
              <p className="font-semibold text-gray-900 dark:text-white">{legalInfo.partnerName}</p>
            </div>
            {legalInfo.signedOffAt && (
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Signed off</p>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {new Date(legalInfo.signedOffAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          {legalInfo.notes && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">
              "{legalInfo.notes}"
            </p>
          )}
        </div>
      ) : legalInfo.availablePartners.length > 0 ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Legal Partner
            </label>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Choose a legal partner...</option>
              {legalInfo.availablePartners.map(partner => (
                <option key={partner.id} value={partner.id}>{partner.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions for the legal partner..."
              rows={2}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleAssignLegalPartner}
            disabled={!selectedPartner || isAssigning}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssigning ? 'Assigning...' : 'Assign Legal Partner'}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No legal partners available. Add one in the Partner Network.
          </p>
          <Link
            href="/dashboard/admin/partners"
            className="inline-flex items-center gap-2 mt-3 text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            Manage Partners
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  )
}

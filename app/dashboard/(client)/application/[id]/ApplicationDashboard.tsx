'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CapitalFitCard from '@/components/ui/CapitalFitCard'
import Button from '@/components/ui/Button'
import AdminControlsPanel from '@/components/workflow/AdminControlsPanel'
import DealManagementPanel from '@/components/workflow/DealManagementPanel'
import DocumentChecklist from '@/components/workflow/DocumentChecklist'
import ActionItemsBanner from '@/components/workflow/ActionItemsBanner'
import { FundingApplicationStage } from '@/lib/types'
import { ScoreResultsCard } from '@/components/scoring'
import { ScoreHistoryChart } from '@/components/scoring/ScoreHistoryChart'
import { formatCapitalAmount } from '@/lib/formatters'
import CapitalAlignment from '@/components/ui/CapitalAlignment'
import DealLegalFees from '@/components/legal/DealLegalFees'

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
  draft: { label: 'In Progress', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', description: 'Your offering is being prepared.' },
  qualified: { label: 'Submitted', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', description: 'Your offering has been submitted. Our team will review it and may request additional documents.' },
  documents_requested: { label: 'Documents Needed', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', description: 'Please upload the requested documents to proceed.' },
  documents_in_review: { label: 'Documents Under Review', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', description: 'Our team is reviewing your documents.' },
  due_diligence: { label: 'Due Diligence', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', description: 'Your offering is in the due diligence phase.' },
  term_sheet: { label: 'Term Sheet', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', description: 'A term sheet is being prepared for your review.' },
  negotiation: { label: 'Negotiation', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', description: 'Terms are being negotiated.' },
  closing: { label: 'Closing', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', description: 'Your funding is in the closing process.' },
  funded: { label: 'Funded', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', description: 'Congratulations! Your funding has been completed.' },
  declined: { label: 'Declined', color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', description: 'Unfortunately, this offering was not approved.' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', description: 'This offering has been withdrawn.' },
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
    ownerColor: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    // Maps these backend stages to this timeline stage
    includesStages: ['qualified', 'documents_requested', 'documents_in_review']
  },
  {
    key: 'due_diligence',
    label: 'Review',
    shortLabel: 'Review',
    description: 'Documents and due diligence in progress',
    owner: 'BitCense',
    ownerColor: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    includesStages: ['due_diligence', 'term_sheet', 'negotiation']
  },
  {
    key: 'closing',
    label: 'Closing',
    shortLabel: 'Closing',
    description: 'Finalizing terms and paperwork',
    owner: 'Legal',
    ownerColor: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
    includesStages: ['closing']
  },
  {
    key: 'funded',
    label: 'Funded',
    shortLabel: 'Funded',
    description: 'Funding complete',
    owner: 'Complete',
    ownerColor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
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

  // Withdraw offering handler (for clients - changes status, keeps record)
  const handleWithdrawOffering = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/workflow/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: data.id, newStage: 'withdrawn' })
      })
      if (response.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        alert('Failed to withdraw application. Please try again.')
        setIsDeleting(false)
        setShowDeleteModal(false)
      }
    } catch (err) {
      console.error('Error withdrawing offering:', err)
      alert('Failed to withdraw application. Please try again.')
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // Delete offering handler (for admins - permanent removal)
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
    <div className="max-w-5xl mx-auto">
        {/* Action Items Banner - only for non-admins */}
        {!isAdmin && (
          <ActionItemsBanner
            dealId={data.id}
            currentStage={data.stage as FundingApplicationStage}
            isAdmin={isAdmin}
          />
        )}

        {/* Hero Section - with subtle gradient accent */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 mb-6 overflow-hidden">
          {/* Decorative accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-teal-600 dark:bg-teal-500" />

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
          {/* Main Two-Column Layout */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left Column - Score & Checklist (3 cols) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Portfolio Assessment Score Card */}
              {hasDocumentBasedScoring && (
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
              )}

              {/* Score History */}
              {hasDocumentBasedScoring && (
                <ScoreHistoryChart dealId={data.id} />
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

            {/* Right Column - Partners & Admin (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Capital Alignment */}
              <CapitalAlignment
                fundingAmount={data.fundingAmount}
                fundingPurpose={data.fundingPurpose}
                assetTypes={data.qualificationData?.assets || data.qualificationData?.loanAssetClasses || []}
                location={data.qualificationData?.location || data.qualificationData?.country}
                partners={partnerMatches}
                documentsComplete={data.stage !== 'draft' && data.stage !== 'qualified'}
                dealId={data.id}
              />

              {/* Legal & SPV Fees - Read-only for clients */}
              {!isAdmin && (
                <DealLegalFees dealId={data.id} isEditable={false} showSummaryOnly={true} />
              )}

              {/* Consolidated Deal Management Panel - Admin only */}
              {isAdmin && (
                <DealManagementPanel
                  dealId={data.id}
                  currentStage={data.stage as FundingApplicationStage}
                  internalNotes={data.internalNotes || null}
                  releaseStatus={data.releaseStatus}
                  releasePartner={data.releasePartner}
                  hasDocumentScoring={!!hasDocumentBasedScoring}
                  legalInfo={legalInfo}
                />
              )}
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
                      className="h-full bg-teal-600 dark:bg-teal-500 rounded-full transition-all duration-500"
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
                            isComplete ? 'bg-teal-600 dark:bg-teal-500' :
                            isCurrent ? 'bg-teal-600 dark:bg-teal-500 ring-4 ring-teal-100 dark:ring-teal-900/50' :
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
                          isComplete ? 'bg-teal-600 dark:bg-teal-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                      )}

                      {/* Status Indicator */}
                      <div className="relative z-10 flex-shrink-0">
                        {isComplete ? (
                          <div className="w-6 h-6 rounded-full bg-teal-600 dark:bg-teal-500 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : isCurrent ? (
                          <div className="w-6 h-6 rounded-full bg-teal-600 dark:bg-teal-500 flex items-center justify-center ring-4 ring-teal-100 dark:ring-teal-900/50">
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
                          <div className="mt-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">
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
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">BitCense</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Review & Coordination</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">Legal</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Documentation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Complete</span>
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
        <div className="mt-8">
          <a
            href="https://cal.com/bitcense/capital-qualification-intro"
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 hover:border-gray-900 dark:hover:border-white transition-all"
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

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {/* Client: Withdraw option (non-destructive) */}
          {!isAdmin && !isTerminalState && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400 hover:text-gray-600 dark:hover:border-gray-500 dark:hover:text-gray-300 font-medium text-sm transition-colors"
            >
              Withdraw Application
            </button>
          )}
          {/* Admin: Delete option (destructive - permanent removal) */}
          {isAdmin && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-300 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400 font-medium text-sm transition-colors"
            >
              Delete Offering
            </button>
          )}
          {/* Show nothing if terminal state for non-admin */}
          {!isAdmin && isTerminalState && <div />}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Questions? Email{' '}
            <a href="mailto:capital@bitcense.com" className="text-gray-900 dark:text-white hover:underline font-semibold">
              capital@bitcense.com
            </a>
          </p>
        </div>

      {/* Withdraw/Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />

          {/* Modal - Different content for clients vs admins */}
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 w-full max-w-md mx-4 shadow-xl">
            {isAdmin ? (
              // Admin: Delete (permanent)
              <>
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
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            ) : (
              // Client: Withdraw (status change, keeps record)
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Withdraw Application</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">You can reapply later if needed</p>
                  </div>
                </div>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-6">
                  Are you sure you want to withdraw this funding application? Your application record will be kept, but it will no longer be under consideration.
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
                    onClick={handleWithdrawOffering}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? 'Withdrawing...' : 'Withdraw'}
                  </button>
                </div>
              </>
            )}
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
    pending: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', label: 'Pending Assignment' },
    assigned: { bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', label: 'Assigned' },
    in_review: { bg: 'bg-teal-50 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', label: 'In Review' },
    approved: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', label: 'Approved' },
    changes_required: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', label: 'Changes Required' },
    rejected: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', label: 'Rejected' },
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
    <div className="bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
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
          {/* Legal & SPV Fees */}
          <DealLegalFees dealId={dealId} isEditable={true} />
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
            className="w-full px-4 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="inline-flex items-center gap-2 mt-3 text-teal-600 dark:text-teal-400 font-medium hover:underline"
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

'use client'

import { useState } from 'react'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Shield,
  FileText,
  PieChart,
  Scale,
  Sparkles,
  Download
} from 'lucide-react'
import { generateScoringReportPDF } from '@/lib/generatePDF'

interface CategoryScore {
  score: number
  grade: string
  weight: number
  weightedScore: number
}

interface RedFlag {
  type: string
  severity: 'high' | 'medium' | 'low'
  message: string
}

interface AssessmentResult {
  overallScore: number
  letterGrade: string
  status: string
  tokenizationReadiness: 'ready' | 'conditional' | 'not_ready'
  readyPercentage: number
  conditionalPercentage: number
  notReadyPercentage: number
  summary?: string
  strengths: string[]
  concerns: string[]
  recommendations: string[]
  redFlags: RedFlag[]
  scores?: {
    portfolioPerformance: CategoryScore
    cashFlowQuality: CategoryScore
    documentation: CategoryScore
    collateralCoverage: CategoryScore
    diversification: CategoryScore
    regulatoryReadiness: CategoryScore
  }
  hasAIAnalysis?: boolean
  estimatedTimeline?: string
}

interface ScoreResultsCardProps {
  assessment: AssessmentResult
  compact?: boolean
  qualificationCode?: string
  companyName?: string
  metrics?: {
    portfolioSize?: number
    loanCount?: number
    avgLoanSize?: number
    weightedAvgRate?: number
    weightedAvgLtv?: number
    weightedAvgDscr?: number
    defaultRate?: number
    delinquency30Rate?: number
  }
}

const readinessConfig = {
  ready: {
    label: 'Ready for Tokenization',
    color: 'text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-900/30 dark:border-teal-700',
    icon: CheckCircle,
  },
  conditional: {
    label: 'Conditionally Ready',
    color: 'text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-700 dark:border-gray-600',
    icon: AlertTriangle,
  },
  not_ready: {
    label: 'Not Ready',
    color: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-700',
    icon: XCircle,
  },
}

const categoryIcons: Record<string, React.ComponentType<any>> = {
  portfolioPerformance: TrendingUp,
  cashFlowQuality: PieChart,
  documentation: FileText,
  collateralCoverage: Shield,
  diversification: Scale,
  regulatoryReadiness: CheckCircle,
}

const categoryLabels: Record<string, string> = {
  portfolioPerformance: 'Portfolio Performance',
  cashFlowQuality: 'Cash Flow Quality',
  documentation: 'Documentation',
  collateralCoverage: 'Collateral Coverage',
  diversification: 'Diversification',
  regulatoryReadiness: 'Regulatory Readiness',
}

export function ScoreResultsCard({ assessment, compact = false, qualificationCode, companyName, metrics }: ScoreResultsCardProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: !compact,
    recommendations: !compact,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleDownloadPDF = () => {
    generateScoringReportPDF({
      qualificationCode: qualificationCode || 'N/A',
      companyName: companyName || 'Portfolio Assessment',
      overallScore: assessment.overallScore,
      letterGrade: assessment.letterGrade,
      tokenizationReadiness: assessment.tokenizationReadiness,
      readyPercentage: assessment.readyPercentage,
      conditionalPercentage: assessment.conditionalPercentage,
      notReadyPercentage: assessment.notReadyPercentage,
      summary: assessment.summary,
      strengths: assessment.strengths,
      concerns: assessment.concerns,
      recommendations: assessment.recommendations,
      redFlags: assessment.redFlags,
      scores: assessment.scores ? {
        portfolioPerformance: assessment.scores.portfolioPerformance,
        cashFlowQuality: assessment.scores.cashFlowQuality,
        documentation: assessment.scores.documentation,
        collateralCoverage: assessment.scores.collateralCoverage,
        diversification: assessment.scores.diversification,
        regulatoryReadiness: assessment.scores.regulatoryReadiness,
      } : {},
      metrics: metrics,
      hasAIAnalysis: assessment.hasAIAnalysis,
    })
  }

  const readiness = readinessConfig[assessment.tokenizationReadiness]
  const ReadinessIcon = readiness.icon

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header with Score */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-300">Portfolio Assessment Score</h3>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-5xl font-bold">{assessment.overallScore}</span>
              <span className="text-2xl text-gray-400">/100</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${readiness.color}`}>
              <ReadinessIcon className="w-5 h-5" />
              <span className="font-medium">{readiness.label}</span>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
              title="Download PDF Report"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">PDF</span>
            </button>
          </div>
        </div>

        {/* Readiness Bar */}
        <div className="mt-6">
          <div className="flex h-3 rounded-full overflow-hidden bg-gray-700">
            <div
              className="bg-teal-500 transition-all duration-500"
              style={{ width: `${assessment.readyPercentage}%` }}
            />
            <div
              className="bg-gray-500 transition-all duration-500"
              style={{ width: `${assessment.conditionalPercentage}%` }}
            />
            <div
              className="bg-gray-600 transition-all duration-500"
              style={{ width: `${assessment.notReadyPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-2 text-gray-400">
            <span>Ready: {assessment.readyPercentage}%</span>
            <span>Conditional: {assessment.conditionalPercentage}%</span>
            <span>Not Ready: {assessment.notReadyPercentage}%</span>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {assessment.summary && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI Analysis</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300">{assessment.summary}</p>
        </div>
      )}

      {/* Red Flags */}
      {assessment.redFlags.length > 0 && (
        <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Red Flags Detected ({assessment.redFlags.length})
          </h4>
          <ul className="space-y-2">
            {assessment.redFlags.map((flag, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  flag.severity === 'high' ? 'bg-red-200 text-red-800' :
                  flag.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {flag.severity.toUpperCase()}
                </span>
                <span className="text-red-700 dark:text-red-300">{flag.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Category Scores */}
      {assessment.scores && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleSection('details')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">Category Breakdown</h4>
            {expandedSections.details ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedSections.details && (
            <div className="mt-4 grid gap-3">
              {Object.entries(assessment.scores).map(([key, score]) => {
                const Icon = categoryIcons[key] || CheckCircle
                const label = categoryLabels[key] || key
                return (
                  <div key={key} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                        <span className="text-gray-500">
                          {score.score}/100 • {(score.weight * 100).toFixed(0)}% weight
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-teal-500"
                          style={{ width: `${score.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Strengths & Concerns */}
      <div className="px-6 py-4 grid md:grid-cols-2 gap-6 border-b border-gray-200 dark:border-gray-700">
        {assessment.strengths.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              Strengths
            </h4>
            <ul className="space-y-2">
              {assessment.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-gray-400 mt-1">+</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {assessment.concerns.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-gray-500" />
              Concerns
            </h4>
            <ul className="space-y-2">
              {assessment.concerns.map((concern, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-gray-400 mt-1">!</span>
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {assessment.recommendations.length > 0 && (
        <div className="px-6 py-4">
          <button
            onClick={() => toggleSection('recommendations')}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">Recommendations</h4>
            {expandedSections.recommendations ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedSections.recommendations && (
            <ul className="mt-4 space-y-3">
              {assessment.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Timeline if available */}
      {assessment.estimatedTimeline && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Estimated Timeline:</span> {assessment.estimatedTimeline}
          </p>
        </div>
      )}

      {/* AI Badge */}
      {assessment.hasAIAnalysis && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Analysis enhanced with AI insights
          </p>
        </div>
      )}
    </div>
  )
}

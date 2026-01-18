'use client'

import { CategoryScore, QualificationScore } from '@/lib/types'

interface QualificationReportProps {
  score: QualificationScore
  totalPoints: number
  maxPoints: number
  categories: CategoryScore[]
  strengths: string[]
  considerations: string[]
  type: 'originator' | 'borrower'
}

const categoryNames: Record<string, string> = {
  volume: 'Origination Volume',
  dealSize: 'Deal Size',
  portfolioQuality: 'Portfolio Quality',
  documentation: 'Documentation',
  fundingAmount: 'Funding Amount',
  collateral: 'Collateral',
  businessHistory: 'Business History',
  revenue: 'Annual Revenue',
  timeline: 'Timeline',
}

const categoryIcons: Record<string, JSX.Element> = {
  volume: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  dealSize: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  portfolioQuality: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  documentation: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  fundingAmount: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  collateral: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  businessHistory: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  revenue: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  timeline: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
}

function getScoreColor(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100
  if (percentage >= 80) return 'text-green-600'
  if (percentage >= 60) return 'text-emerald-500'
  if (percentage >= 40) return 'text-yellow-500'
  return 'text-orange-500'
}

function getBarColor(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 60) return 'bg-emerald-500'
  if (percentage >= 40) return 'bg-yellow-500'
  return 'bg-orange-400'
}

function getLabelColor(label: string): string {
  switch (label) {
    case 'Excellent':
    case 'Optimal':
      return 'text-green-600 bg-green-50'
    case 'Strong':
    case 'Good':
      return 'text-emerald-600 bg-emerald-50'
    case 'Moderate':
    case 'Fair':
      return 'text-yellow-600 bg-yellow-50'
    case 'Limited':
    case 'Urgent':
    case 'Needs Review':
      return 'text-orange-600 bg-orange-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export default function QualificationReport({
  score,
  totalPoints,
  maxPoints,
  categories,
  strengths,
  considerations,
  type,
}: QualificationReportProps) {
  const percentage = Math.round((totalPoints / maxPoints) * 100)

  const getOverallLabel = () => {
    if (score === 'strong') return 'Strong Candidate'
    if (score === 'moderate') return 'Good Potential'
    return 'Needs Discussion'
  }

  const getOverallColor = () => {
    if (score === 'strong') return 'text-green-600'
    if (score === 'moderate') return 'text-yellow-600'
    return 'text-orange-500'
  }

  const getOverallBgColor = () => {
    if (score === 'strong') return 'bg-green-500'
    if (score === 'moderate') return 'bg-yellow-500'
    return 'bg-orange-400'
  }

  return (
    <div className="space-y-6">
      {/* Overall Score Header */}
      <div className="text-center p-6 rounded-card bg-card-cool">
        <h2 className="text-lg font-medium text-text-secondary mb-4">Your Qualification Score</h2>

        {/* Circular Progress */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-border-light"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
              strokeLinecap="round"
              className={getOverallBgColor()}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getOverallColor()}`}>{percentage}%</span>
            <span className="text-xs text-text-muted">{totalPoints}/{maxPoints} pts</span>
          </div>
        </div>

        <div className={`text-xl font-semibold ${getOverallColor()}`}>
          {getOverallLabel()}
        </div>
        <p className="text-sm text-text-secondary mt-1">
          {type === 'originator' ? 'Based on your portfolio profile' : 'Based on your funding profile'}
        </p>
      </div>

      {/* Category Breakdown */}
      <div className="p-5 rounded-card bg-surface border border-border-light">
        <h3 className="font-semibold text-text-primary mb-4">Score Breakdown</h3>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary">
                    {categoryIcons[category.name] || categoryIcons.volume}
                  </span>
                  <span className="text-sm font-medium text-text-primary">
                    {categoryNames[category.name] || category.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLabelColor(category.label)}`}>
                    {category.label}
                  </span>
                  <span className={`text-sm font-semibold ${getScoreColor(category.score, category.maxScore)}`}>
                    {category.score}/{category.maxScore}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-border-light rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(category.score, category.maxScore)}`}
                  style={{ width: `${(category.score / category.maxScore) * 100}%` }}
                />
              </div>

              <p className="text-xs text-text-muted">{category.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="p-5 rounded-card bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold text-green-800">Why You're a Good Candidate</h3>
          </div>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                <span className="text-green-500 mt-1">+</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Considerations */}
      {considerations.length > 0 && (
        <div className="p-5 rounded-card bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold text-amber-800">Areas to Discuss</h3>
          </div>
          <ul className="space-y-2">
            {considerations.map((consideration, index) => (
              <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="text-amber-500 mt-1">-</span>
                {consideration}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

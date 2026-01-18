'use client'

import { useState } from 'react'

interface DimensionData {
  dimension: string
  score: number
  maxScore: number
  icon?: string
  insights?: string[]
}

interface DimensionBarsProps {
  dimensions: Record<string, DimensionData>
}

const dimensionColors: Record<string, { bg: string; fill: string; text: string }> = {
  scale: { bg: 'bg-emerald-100', fill: 'bg-emerald-500', text: 'text-emerald-700' },
  quality: { bg: 'bg-teal-100', fill: 'bg-teal-500', text: 'text-teal-700' },
  readiness: { bg: 'bg-cyan-100', fill: 'bg-cyan-500', text: 'text-cyan-700' },
  marketPosition: { bg: 'bg-amber-100', fill: 'bg-amber-500', text: 'text-amber-700' },
  capitalAlignment: { bg: 'bg-rose-100', fill: 'bg-rose-500', text: 'text-rose-700' },
}

const dimensionIcons: Record<string, string> = {
  scale: '📈',
  quality: '✓',
  readiness: '⚡',
  marketPosition: '🎯',
  capitalAlignment: '🤝',
}

// Detailed explanations for each dimension
const dimensionExplainers: Record<string, {
  title: string
  description: string
  impact: string
  howToImprove: string[]
}> = {
  scale: {
    title: 'Scale & Volume',
    description: 'Measures your annual origination volume and overall lending capacity. Institutional investors look for consistent, scalable deal flow.',
    impact: 'Higher volume signals a mature operation that can absorb larger credit facilities and generate predictable returns for capital partners.',
    howToImprove: [
      'Increase annual origination volume above $5M for emerging status, $25M+ for institutional scale',
      'Document historical volume growth trends',
      'Build pipeline visibility with deal tracking systems',
    ]
  },
  quality: {
    title: 'Portfolio Quality',
    description: 'Evaluates the performance of your loan portfolio including default rates, documentation standards, and historical track record.',
    impact: 'Strong portfolio quality reduces investor risk and unlocks better pricing, higher advance rates, and more capital options.',
    howToImprove: [
      'Maintain default rates under 5% (under 2% is excellent)',
      'Use full documentation standards where possible',
      'Build 12+ months of performance history',
      'Implement robust underwriting and servicing processes',
    ]
  },
  readiness: {
    title: 'Operational Readiness',
    description: 'Assesses your infrastructure, systems, and existing relationships that demonstrate ability to work with institutional capital.',
    impact: 'Operationally ready originators can close deals faster and handle the reporting requirements of institutional partnerships.',
    howToImprove: [
      'Establish existing credit facilities or bank relationships',
      'Implement loan management and reporting systems',
      'Build relationships with auditors and legal counsel',
      'Document policies and procedures for underwriting and servicing',
    ]
  },
  marketPosition: {
    title: 'Market Position',
    description: 'Evaluates your asset class focus and geographic presence. Some markets and asset classes are more attractive to institutional capital.',
    impact: 'Well-positioned originators in preferred asset classes attract more interest and better terms from capital providers.',
    howToImprove: [
      'Focus on US-based lending (preferred by most institutional capital)',
      'Specialize in high-demand asset classes (residential, CRE, consumer)',
      'Build regional expertise and market knowledge',
      'Develop relationships with borrowers in your target market',
    ]
  },
  capitalAlignment: {
    title: 'Capital Alignment',
    description: 'Measures how well your funding needs match your origination capacity and business goals.',
    impact: 'Well-aligned capital requests demonstrate realistic planning and increase investor confidence in your ability to deploy capital effectively.',
    howToImprove: [
      'Request capital amounts aligned with your origination volume (typically 2-4x annual volume)',
      'Clearly articulate capital deployment timeline and strategy',
      'Consider phased capital deployment for growing platforms',
      'Define specific use of funds tied to growth milestones',
    ]
  },
}

export default function DimensionBars({ dimensions }: DimensionBarsProps) {
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {Object.entries(dimensions).map(([key, dim]) => {
        const percentage = Math.round((dim.score / dim.maxScore) * 100)
        const colors = dimensionColors[key] || { bg: 'bg-gray-100', fill: 'bg-gray-500', text: 'text-gray-700' }
        const icon = dim.icon || dimensionIcons[key] || '●'
        const explainer = dimensionExplainers[key]

        return (
          <div key={key} className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <span className="font-medium text-gray-900">{dim.dimension}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${colors.text}`}>
                  {dim.score}/{dim.maxScore}
                </span>
                <span className="text-sm text-gray-400">({percentage}%)</span>
              </div>
            </div>
            <div className={`h-3 rounded-full ${colors.bg} overflow-hidden`}>
              <div
                className={`h-full rounded-full ${colors.fill} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Insights and What is this? link */}
            <div className="flex items-center justify-between mt-1">
              {dim.insights && dim.insights.length > 0 ? (
                <p className="text-sm text-gray-500">{dim.insights[0]}</p>
              ) : (
                <span />
              )}

              {/* What is this? link */}
              {explainer && (
                <div className="relative">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    onMouseEnter={() => setHoveredDimension(key)}
                    onMouseLeave={() => setHoveredDimension(null)}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    What is this?
                  </button>

                  {/* Tooltip/Explainer on hover */}
                  {hoveredDimension === key && (
                    <div className="absolute z-50 right-0 bottom-full mb-2 w-80 p-4 bg-white rounded-2xl shadow-xl border border-emerald-100 text-sm">
                      <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r border-b border-emerald-100 transform rotate-45" />

                      <h4 className="font-semibold text-gray-900 mb-2">{explainer.title}</h4>
                      <p className="text-gray-600 mb-3">{explainer.description}</p>

                      <div className="bg-teal-50 rounded-xl p-3 mb-3">
                        <p className="text-xs font-semibold text-teal-800 uppercase mb-1">Impact on Score</p>
                        <p className="text-teal-700 text-sm">{explainer.impact}</p>
                      </div>

                      <div className="bg-emerald-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-emerald-800 uppercase mb-2">How to Improve</p>
                        <ul className="space-y-1">
                          {explainer.howToImprove.map((tip, i) => (
                            <li key={i} className="text-emerald-700 text-sm flex items-start gap-2">
                              <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                              </svg>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

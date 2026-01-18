'use client'

interface DimensionData {
  dimension: string
  score: number
  maxScore: number
  icon?: string
  insights?: string[]
}

interface ScoreCardProps {
  dimensions: Record<string, DimensionData>
  overallScore: number
  qualificationTier?: string
}

const dimensionConfig: Record<string, {
  icon: string
  label: string
  description: string
}> = {
  scale: {
    icon: '📈',
    label: 'Scale',
    description: 'Origination volume, portfolio size, and growth trajectory',
  },
  quality: {
    icon: '✓',
    label: 'Quality',
    description: 'Default rates, delinquency, and portfolio performance metrics',
  },
  readiness: {
    icon: '⚡',
    label: 'Readiness',
    description: 'Documentation, reporting systems, and operational infrastructure',
  },
  marketPosition: {
    icon: '🎯',
    label: 'Market',
    description: 'Asset class demand, geographic focus, and competitive positioning',
  },
  capitalAlignment: {
    icon: '🤝',
    label: 'Alignment',
    description: 'Funding goals match with available capital structures',
  },
}

function getGrade(percentage: number): { grade: string; label: string; color: string } {
  if (percentage >= 90) return { grade: 'A+', label: 'Excellent', color: 'text-green-600' }
  if (percentage >= 80) return { grade: 'A', label: 'Strong', color: 'text-green-600' }
  if (percentage >= 70) return { grade: 'B+', label: 'Good', color: 'text-green-600' }
  if (percentage >= 60) return { grade: 'B', label: 'Solid', color: 'text-gray-900 dark:text-white' }
  if (percentage >= 50) return { grade: 'C+', label: 'Fair', color: 'text-amber-600' }
  if (percentage >= 40) return { grade: 'C', label: 'Developing', color: 'text-amber-600' }
  return { grade: 'D', label: 'Needs Work', color: 'text-orange-600' }
}

function getOverallGrade(score: number): { grade: string; label: string; color: string; bgColor: string } {
  if (score >= 80) return { grade: 'A', label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-500' }
  if (score >= 60) return { grade: 'B', label: 'Good', color: 'text-gray-900 dark:text-white', bgColor: 'bg-gray-900 dark:bg-gray-700' }
  if (score >= 40) return { grade: 'C', label: 'Fair', color: 'text-amber-600', bgColor: 'bg-amber-500' }
  return { grade: 'D', label: 'Early', color: 'text-orange-600', bgColor: 'bg-orange-500' }
}

export default function ScoreCard({ dimensions, overallScore, qualificationTier }: ScoreCardProps) {
  const overallGrade = getOverallGrade(overallScore)
  const dimEntries = Object.entries(dimensions)

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Overall Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">{overallScore}</span>
              <span className="text-xl text-gray-400">/100</span>
            </div>
          </div>
          <div className={`w-20 h-20 rounded-full ${overallGrade.bgColor} flex items-center justify-center`}>
            <span className="text-3xl font-bold text-white">{overallGrade.grade}</span>
          </div>
        </div>
      </div>

      {/* Dimension Breakdown */}
      <div className="space-y-4">
        <h4 className="text-xl font-bold text-gray-900 dark:text-white">Score Breakdown</h4>

        {dimEntries.map(([key, dim]) => {
          const config = dimensionConfig[key] || { icon: '●', label: key, description: '' }
          const percentage = Math.round((dim.score / dim.maxScore) * 100)
          const grade = getGrade(percentage)

          return (
            <div
              key={key}
              className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-lg">{config.icon}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-base font-bold text-gray-900 dark:text-white">{dim.dimension}</h5>
                    {config.description && (
                      <div className="relative group">
                        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-700 text-white text-sm rounded-lg px-3 py-2 w-56 shadow-lg">
                            {config.description}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${grade.color}`}>{grade.grade}</p>
                </div>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gray-500 dark:bg-gray-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{dim.score}/{dim.maxScore} pts</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

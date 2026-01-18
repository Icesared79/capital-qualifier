'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Clock, RefreshCw } from 'lucide-react'

interface ScoreHistoryItem {
  date: string
  overallScore: number
  letterGrade: string
  portfolioPerformance?: number
  cashFlowQuality?: number
  documentation?: number
  collateralCoverage?: number
  diversification?: number
  regulatoryReadiness?: number
  tokenizationReadiness: string
  readyPercentage: number
  triggerType: string
  triggerDescription: string
}

interface ScoreHistoryChartProps {
  dealId: string
}

export function ScoreHistoryChart({ dealId }: ScoreHistoryChartProps) {
  const [history, setHistory] = useState<ScoreHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [dealId])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/scoring/history/${dealId}`)
      if (!response.ok) throw new Error('Failed to fetch history')
      const data = await response.json()
      setHistory(data.history || [])
    } catch (err) {
      setError('Failed to load score history')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (error || history.length === 0) {
    return null // Don't show anything if no history
  }

  const latestScore = history[history.length - 1]
  const previousScore = history.length > 1 ? history[history.length - 2] : null
  const scoreDiff = previousScore ? latestScore.overallScore - previousScore.overallScore : 0

  const TrendIcon = scoreDiff > 0 ? TrendingUp : scoreDiff < 0 ? TrendingDown : Minus
  const trendColor = scoreDiff > 0 ? 'text-emerald-600' : scoreDiff < 0 ? 'text-red-600' : 'text-gray-500'

  // Calculate chart dimensions
  const maxScore = 100
  const minScore = 0
  const chartHeight = 120
  const chartWidth = '100%'

  // Generate SVG path for the line
  const generatePath = () => {
    if (history.length < 2) return ''

    const points = history.map((item, index) => {
      const x = (index / (history.length - 1)) * 100
      const y = chartHeight - ((item.overallScore - minScore) / (maxScore - minScore)) * chartHeight
      return { x, y }
    })

    const pathParts = points.map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`
      return `L ${point.x} ${point.y}`
    })

    return pathParts.join(' ')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case 'initial': return 'Initial Assessment'
      case 'document_update': return 'Document Update'
      case 'manual_reassess': return 'Manual Reassessment'
      case 'scheduled': return 'Scheduled Review'
      default: return type
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Score History</h3>
          </div>
          {history.length > 1 && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span>
                {scoreDiff > 0 ? '+' : ''}{scoreDiff} pts
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {history.length > 1 && (
        <div className="px-6 py-4">
          <svg
            viewBox={`0 0 100 ${chartHeight}`}
            preserveAspectRatio="none"
            className="w-full h-24"
          >
            {/* Grid lines */}
            <line x1="0" y1="0" x2="100" y2="0" stroke="#e5e7eb" strokeWidth="0.5" />
            <line x1="0" y1={chartHeight / 2} x2="100" y2={chartHeight / 2} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="0" y1={chartHeight} x2="100" y2={chartHeight} stroke="#e5e7eb" strokeWidth="0.5" />

            {/* Gradient fill */}
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path
              d={`${generatePath()} L 100 ${chartHeight} L 0 ${chartHeight} Z`}
              fill="url(#scoreGradient)"
            />

            {/* Line */}
            <path
              d={generatePath()}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points */}
            {history.map((item, index) => {
              const x = (index / (history.length - 1)) * 100
              const y = chartHeight - ((item.overallScore - minScore) / (maxScore - minScore)) * chartHeight
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="2"
                />
              )
            })}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{formatDate(history[0].date)}</span>
            <span>{formatDate(history[history.length - 1].date)}</span>
          </div>
        </div>
      )}

      {/* History list */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {history.slice().reverse().map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                  item.overallScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                  item.overallScore >= 60 ? 'bg-blue-100 text-blue-700' :
                  item.overallScore >= 40 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {item.overallScore}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getTriggerLabel(item.triggerType)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(item.date)}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                item.letterGrade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                item.letterGrade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                item.letterGrade.startsWith('C') ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {item.letterGrade}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface ScoreBadgeProps {
  score: number
  grade: string
  readiness?: 'ready' | 'conditional' | 'not_ready'
  size?: 'sm' | 'md' | 'lg'
  showReadiness?: boolean
}

const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
  'A+': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700' },
  'A': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700' },
  'A-': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700' },
  'B+': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-700' },
  'B': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-700' },
  'B-': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-700' },
  'C+': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-700' },
  'C': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-700' },
  'C-': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-700' },
  'D': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-700' },
  'F': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-700' },
}

const readinessIcons = {
  ready: CheckCircle,
  conditional: AlertTriangle,
  not_ready: XCircle,
}

const readinessColors = {
  ready: 'text-emerald-600 dark:text-emerald-400',
  conditional: 'text-yellow-600 dark:text-yellow-400',
  not_ready: 'text-red-600 dark:text-red-400',
}

export function ScoreBadge({ score, grade, readiness, size = 'md', showReadiness = true }: ScoreBadgeProps) {
  const colors = gradeColors[grade] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  }

  const ReadinessIcon = readiness ? readinessIcons[readiness] : null

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 rounded-lg border font-semibold ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}>
        <span>{score}</span>
        <span className="opacity-50">/100</span>
        <span className="font-bold">{grade}</span>
      </span>
      {showReadiness && ReadinessIcon && (
        <ReadinessIcon className={`w-4 h-4 ${readinessColors[readiness!]}`} />
      )}
    </div>
  )
}

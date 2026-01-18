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
  'A+': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' },
  'A': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' },
  'A-': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' },
  'B+': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' },
  'B': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' },
  'B-': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' },
  'C+': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' },
  'C': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' },
  'C-': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' },
  'D': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' },
  'F': { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-700' },
}

const readinessIcons = {
  ready: CheckCircle,
  conditional: AlertTriangle,
  not_ready: XCircle,
}

const readinessColors = {
  ready: 'text-teal-600 dark:text-teal-400',
  conditional: 'text-gray-500 dark:text-gray-400',
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

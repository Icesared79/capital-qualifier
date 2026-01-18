'use client'

import { useEffect, useState } from 'react'
import { QualificationScore } from '@/lib/types'
import Confetti from './Confetti'

interface ResultCardProps {
  score: QualificationScore
  type: 'originator' | 'borrower'
}

const scoreConfig = {
  strong: {
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: '✓',
    label: 'Strong Match',
  },
  moderate: {
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: '◐',
    label: 'Good Potential',
  },
  needs_discussion: {
    color: 'text-text-secondary',
    bg: 'bg-card-warm',
    border: 'border-border',
    icon: '○',
    label: 'Let\'s Talk',
  },
}

const content = {
  originator: {
    strong: {
      headline: "Your Portfolio is a Strong Fit",
      message: "Based on your responses, your portfolio aligns well with our criteria for tokenized retail capital distribution.",
    },
    moderate: {
      headline: "Your Portfolio Shows Strong Potential",
      message: "Your profile has promising elements. Let's discuss how we might structure a partnership.",
    },
    needs_discussion: {
      headline: "Let's Explore Alternative Structures",
      message: "Your profile may require adjustments, but we may have alternative options to discuss.",
    },
  },
  borrower: {
    strong: {
      headline: "You're a Strong Candidate",
      message: "Great news—your profile aligns well with our lending partners' criteria.",
    },
    moderate: {
      headline: "You're a Good Candidate",
      message: "Your profile shows potential. Let's discuss your options with our lending partners.",
    },
    needs_discussion: {
      headline: "Let's Explore Your Options",
      message: "Your current profile may not fit our standard programs, but we may have alternatives.",
    },
  },
}

export default function ResultCard({ score, type }: ResultCardProps) {
  const config = scoreConfig[score]
  const { headline, message } = content[type][score]
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <>
      {score === 'strong' && <Confetti />}
      <div
        className={`
          p-6 rounded-card border ${config.bg} ${config.border}
          transition-all duration-500 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        {/* Score badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full ${config.bg} border-2 ${config.border} flex items-center justify-center text-2xl`}>
            {config.icon}
          </div>
          <span className={`text-sm font-semibold uppercase tracking-wide ${config.color}`}>
            {config.label}
          </span>
        </div>

        <p className={`text-xl font-bold ${config.color} mb-2`}>{headline}</p>
        <p className="text-text-secondary leading-relaxed">{message}</p>
      </div>
    </>
  )
}

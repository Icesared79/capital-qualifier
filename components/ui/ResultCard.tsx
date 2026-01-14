'use client'

import { QualificationScore } from '@/lib/types'

interface ResultCardProps {
  score: QualificationScore
  type: 'originator' | 'borrower'
}

const scoreConfig = {
  strong: {
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  moderate: {
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  needs_discussion: {
    color: 'text-text-secondary',
    bg: 'bg-card-warm',
    border: 'border-border',
  },
}

const content = {
  originator: {
    strong: {
      headline: "Your Portfolio Qualifies for Global Capital Access",
      message: "Based on your responses, your portfolio meets our criteria for tokenized retail capital distribution.",
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
      headline: "You Qualify for Fast Bridge Financing",
      message: "Great news—you qualify for institutional-grade bridge capital through our platform.",
    },
    moderate: {
      headline: "You're a Strong Candidate",
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

  return (
    <div className={`p-6 rounded-card border ${config.bg} ${config.border}`}>
      <p className={`text-xl font-bold ${config.color} mb-2`}>{headline}</p>
      <p className="text-text-secondary leading-relaxed">{message}</p>
    </div>
  )
}

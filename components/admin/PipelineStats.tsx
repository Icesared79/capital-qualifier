'use client'

import Link from 'next/link'
import { PipelineCounts, FundingApplicationStage } from '@/lib/types'
import { STAGE_CONFIG, STAGE_ORDER } from '@/lib/workflow'

interface PipelineStatsProps {
  counts: PipelineCounts
}

// Define the stage display order (excluding terminal stages which are shown separately)
const ACTIVE_STAGES: FundingApplicationStage[] = [
  'draft',
  'qualified',
  'documents_requested',
  'documents_in_review',
  'due_diligence',
  'term_sheet',
  'negotiation',
  'closing',
]

const TERMINAL_STAGES: FundingApplicationStage[] = ['funded', 'declined', 'withdrawn']

export default function PipelineStats({ counts }: PipelineStatsProps) {
  return (
    <div className="space-y-6">
      {/* Active Pipeline Stages */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
          Pipeline Stages
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {ACTIVE_STAGES.map((stage, index) => {
            const config = STAGE_CONFIG[stage]
            const count = counts[stage] || 0

            return (
              <Link
                key={stage}
                href={`/dashboard/admin/deals?stage=${stage}`}
                className="group relative"
              >
                <div className={`
                  bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center
                  border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600
                  transition-all hover:shadow-md
                `}>
                  {/* Count */}
                  <p className={`text-3xl font-bold ${config.color} mb-1`}>
                    {count}
                  </p>

                  {/* Stage Label */}
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                    {config.label}
                  </p>

                  {/* Progress indicator */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                    {index < ACTIVE_STAGES.length - 1 && (
                      <div className="hidden lg:block w-4 h-4 rounded-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                        <div className={`w-full h-full rounded-full ${count > 0 ? config.bgColor : 'bg-transparent'}`} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector line (visible on larger screens) */}
                {index < ACTIVE_STAGES.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gray-200 dark:bg-gray-600" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Terminal Stages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TERMINAL_STAGES.map((stage) => {
          const config = STAGE_CONFIG[stage]
          const count = counts[stage] || 0

          return (
            <Link
              key={stage}
              href={`/dashboard/admin/deals?stage=${stage}`}
              className={`
                ${config.bgColor} rounded-xl p-4 flex items-center justify-between
                border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600
                transition-all hover:shadow-md
              `}
            >
              <div className="flex items-center gap-3">
                {stage === 'funded' && (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {stage === 'declined' && (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {stage === 'withdrawn' && (
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
                <span className={`font-semibold ${config.color}`}>
                  {config.label}
                </span>
              </div>
              <span className={`text-2xl font-bold ${config.color}`}>
                {count}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

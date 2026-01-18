'use client'

import Link from 'next/link'
import { PipelineCounts, FundingApplicationStage } from '@/lib/types'

interface PipelineStatsProps {
  counts: PipelineCounts
}

// Group stages into logical buckets for cleaner display
interface PipelineBucket {
  id: string
  label: string
  description: string
  stages: FundingApplicationStage[]
  color: string
  bgColor: string
  icon: React.ReactNode
}

const PIPELINE_BUCKETS: PipelineBucket[] = [
  {
    id: 'intake',
    label: 'Intake',
    description: 'New applications',
    stages: ['draft', 'qualified'],
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'review',
    label: 'Documents',
    description: 'Collecting & reviewing',
    stages: ['documents_requested', 'documents_in_review'],
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'partner',
    label: 'With Partner',
    description: 'FP review & negotiation',
    stages: ['due_diligence', 'term_sheet', 'negotiation'],
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'closing',
    label: 'Closing',
    description: 'Final steps',
    stages: ['closing'],
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
]

export default function PipelineStats({ counts }: PipelineStatsProps) {
  // Calculate total for each bucket
  const getBucketCount = (bucket: PipelineBucket) => {
    return bucket.stages.reduce((sum, stage) => sum + (counts[stage] || 0), 0)
  }

  const totalActive = PIPELINE_BUCKETS.reduce((sum, bucket) => sum + getBucketCount(bucket), 0)

  return (
    <div className="space-y-6">
      {/* Pipeline Funnel */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Deal Pipeline
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {totalActive} active deals
          </span>
        </div>

        {/* Funnel visualization */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {PIPELINE_BUCKETS.map((bucket, index) => {
            const count = getBucketCount(bucket)
            const stageQuery = bucket.stages.join(',')

            return (
              <Link
                key={bucket.id}
                href={`/dashboard/admin/deals?stages=${stageQuery}`}
                className="group relative"
              >
                <div className={`
                  ${bucket.bgColor} rounded-xl p-5
                  border-2 border-transparent
                  hover:border-gray-300 dark:hover:border-gray-500
                  transition-all hover:shadow-lg hover:-translate-y-0.5
                `}>
                  {/* Icon and count */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={bucket.color}>
                      {bucket.icon}
                    </div>
                    <span className={`text-3xl font-bold ${bucket.color}`}>
                      {count}
                    </span>
                  </div>

                  {/* Label */}
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {bucket.label}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {bucket.description}
                  </p>
                </div>

                {/* Arrow connector */}
                {index < PIPELINE_BUCKETS.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                    </svg>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Outcomes Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Funded */}
        <Link
          href="/dashboard/admin/deals?stages=funded"
          className="group bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-center justify-between border-2 border-transparent hover:border-green-300 dark:hover:border-green-700 transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-800/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-semibold text-green-700 dark:text-green-300">Funded</span>
          </div>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            {counts.funded || 0}
          </span>
        </Link>

        {/* Declined */}
        <Link
          href="/dashboard/admin/deals?stages=declined"
          className="group bg-red-50 dark:bg-red-900/20 rounded-xl p-4 flex items-center justify-between border-2 border-transparent hover:border-red-300 dark:hover:border-red-700 transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-800/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-semibold text-red-700 dark:text-red-300">Declined</span>
          </div>
          <span className="text-2xl font-bold text-red-600 dark:text-red-400">
            {counts.declined || 0}
          </span>
        </Link>

        {/* Withdrawn */}
        <Link
          href="/dashboard/admin/deals?stages=withdrawn"
          className="group bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4 flex items-center justify-between border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-500 transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <span className="font-semibold text-gray-600 dark:text-gray-300">Withdrawn</span>
          </div>
          <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
            {counts.withdrawn || 0}
          </span>
        </Link>
      </div>
    </div>
  )
}

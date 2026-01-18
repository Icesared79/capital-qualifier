'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { FundingApplicationStage, HandoffTarget } from '@/lib/types'
import { STAGE_CONFIG } from '@/lib/workflow'

interface DealFiltersProps {
  stages: FundingApplicationStage[]
  currentStage?: FundingApplicationStage
  currentStages?: string  // comma-separated stages from URL
  currentHandoff?: HandoffTarget
  currentSearch: string
}

// Pipeline bucket labels for display
const PIPELINE_BUCKETS: Record<string, { label: string; stages: string[] }> = {
  'draft,qualified': { label: 'Intake', stages: ['draft', 'qualified'] },
  'documents_requested,documents_in_review': { label: 'Documents', stages: ['documents_requested', 'documents_in_review'] },
  'due_diligence,term_sheet,negotiation': { label: 'With Partner', stages: ['due_diligence', 'term_sheet', 'negotiation'] },
  'closing': { label: 'Closing', stages: ['closing'] },
  'funded': { label: 'Funded', stages: ['funded'] },
  'declined': { label: 'Declined', stages: ['declined'] },
  'withdrawn': { label: 'Withdrawn', stages: ['withdrawn'] },
}

export default function DealFilters({
  stages,
  currentStage,
  currentStages,
  currentHandoff,
  currentSearch,
}: DealFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch)

  // Determine active filter label
  const activeFilterLabel = currentStages
    ? PIPELINE_BUCKETS[currentStages]?.label || currentStages.split(',').join(', ')
    : currentStage
    ? STAGE_CONFIG[currentStage]?.label || currentStage
    : null

  const updateFilters = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // Reset to page 1 when filters change
    params.delete('page')

    router.push(`/dashboard/admin/deals?${params.toString()}`)
  }, [router, searchParams])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: search || undefined })
  }, [search, updateFilters])

  const clearFilters = useCallback(() => {
    setSearch('')
    router.push('/dashboard/admin/deals')
  }, [router])

  const hasFilters = currentStage || currentStages || currentHandoff || currentSearch

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
      {/* Active filter badge */}
      {activeFilterLabel && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">Showing:</span>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
            {activeFilterLabel}
          </span>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Show all
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by company, code, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none transition-colors"
            />
          </div>
        </form>

        {/* Stage Filter */}
        <div className="w-full md:w-48">
          <select
            value={currentStage || ''}
            onChange={(e) => updateFilters({ stage: e.target.value || undefined, stages: undefined })}
            className="w-full px-4 py-2.5 text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none transition-colors"
          >
            <option value="">All Stages</option>
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_CONFIG[stage]?.label || stage}
              </option>
            ))}
          </select>
        </div>

        {/* Handoff Filter */}
        <div className="w-full md:w-40">
          <select
            value={currentHandoff || ''}
            onChange={(e) => updateFilters({ handoff_to: e.target.value || undefined })}
            className="w-full px-4 py-2.5 text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none transition-colors"
          >
            <option value="">All Teams</option>
            <option value="legal">Legal</option>
            <option value="optma">Funding Partner</option>
          </select>
        </div>
      </div>
    </div>
  )
}

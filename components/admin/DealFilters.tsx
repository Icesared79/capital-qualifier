'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { FundingApplicationStage, HandoffTarget } from '@/lib/types'
import { STAGE_CONFIG } from '@/lib/workflow'

interface DealFiltersProps {
  stages: FundingApplicationStage[]
  currentStage?: FundingApplicationStage
  currentHandoff?: HandoffTarget
  currentSearch: string
}

export default function DealFilters({
  stages,
  currentStage,
  currentHandoff,
  currentSearch,
}: DealFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch)

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

  const hasFilters = currentStage || currentHandoff || currentSearch

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
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
            onChange={(e) => updateFilters({ stage: e.target.value || undefined })}
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

        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400
                     hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { DealWithCompany, TeamMember, FundingApplicationStage } from '@/lib/types'
import { STAGE_CONFIG, getValidNextStages } from '@/lib/workflow'
import { createClient } from '@/lib/supabase/client'
import AssignModal from './AssignModal'
import HandoffPanel from './HandoffPanel'
import ReleaseToPartnerPanel from './ReleaseToPartnerPanel'

interface ReleaseStats {
  total: number
  interested: number
  passed: number
}

interface DealsTableProps {
  deals: DealWithCompany[]
  teamMembers: TeamMember[]
  currentPage: number
  totalCount: number
  pageSize: number
  releaseStats?: Record<string, ReleaseStats>
}

// Stage labels
const stageLabels: Record<string, string> = {
  draft: 'Draft',
  qualified: 'Qualified',
  documents_requested: 'Docs Requested',
  documents_in_review: 'Docs in Review',
  due_diligence: 'Due Diligence',
  term_sheet: 'Term Sheet',
  negotiation: 'Negotiation',
  closing: 'Closing',
  funded: 'Funded',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
}

export default function DealsTable({
  deals,
  teamMembers,
  currentPage,
  totalCount,
  pageSize,
  releaseStats = {},
}: DealsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [changingStage, setChangingStage] = useState<string | null>(null)
  const [assignModalDeal, setAssignModalDeal] = useState<DealWithCompany | null>(null)
  const [handoffDeal, setHandoffDeal] = useState<DealWithCompany | null>(null)
  const [releaseDeal, setReleaseDeal] = useState<DealWithCompany | null>(null)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalPages = Math.ceil(totalCount / pageSize)

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/dashboard/admin/deals?${params.toString()}`)
  }

  const handleStageChange = async (dealId: string, newStage: FundingApplicationStage) => {
    setUpdating(true)
    setError(null)

    try {
      const response = await fetch('/api/workflow/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, newStage }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update stage')
      }

      // Refresh the page to show updated data
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(false)
      setChangingStage(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Partners
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {deals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No deals found
                  </td>
                </tr>
              ) : (
                deals.map((deal) => {
                  const stageConfig = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.draft
                  const validNextStages = getValidNextStages(deal.stage)
                  const isChangingThis = changingStage === deal.id

                  return (
                    <tr key={deal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      {/* Code */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/application/${deal.id}`}
                          className="font-mono text-sm font-medium text-gray-900 dark:text-white hover:underline"
                        >
                          {deal.qualification_code}
                        </Link>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {deal.company?.name || 'Unknown'}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {deal.company?.owner?.email || '-'}
                        </span>
                      </td>

                      {/* Stage */}
                      <td className="px-4 py-3">
                        {isChangingThis ? (
                          <select
                            autoFocus
                            value={deal.stage}
                            onChange={(e) => handleStageChange(deal.id, e.target.value as FundingApplicationStage)}
                            onBlur={() => setChangingStage(null)}
                            disabled={updating}
                            className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value={deal.stage}>{stageLabels[deal.stage]}</option>
                            {validNextStages.map((stage) => (
                              <option key={stage} value={stage}>
                                {stageLabels[stage]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setChangingStage(deal.id)}
                            className={`px-2 py-1 text-xs font-medium rounded-lg ${stageConfig.bgColor} ${stageConfig.color}
                                      hover:opacity-80 transition-opacity cursor-pointer`}
                            disabled={validNextStages.length === 0}
                          >
                            {stageLabels[deal.stage] || deal.stage}
                          </button>
                        )}
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {deal.overall_score !== null ? `${deal.overall_score}/100` : '-'}
                        </span>
                      </td>

                      {/* Team */}
                      <td className="px-4 py-3">
                        {deal.handoff_to ? (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded">
                            {deal.handoff_to.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>

                      {/* Partners */}
                      <td className="px-4 py-3">
                        {releaseStats[deal.id] ? (
                          <button
                            onClick={() => setReleaseDeal(deal)}
                            className="flex items-center gap-1.5 group"
                            title="Click to release to more partners"
                          >
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-accent">
                              {releaseStats[deal.id].total}
                            </span>
                            {releaseStats[deal.id].interested > 0 && (
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                                {releaseStats[deal.id].interested} interested
                              </span>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => setReleaseDeal(deal)}
                            className="text-sm text-gray-400 hover:text-accent transition-colors"
                            title="Release to partners"
                          >
                            Not released
                          </button>
                        )}
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(deal.updated_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setReleaseDeal(deal)}
                            className="p-1.5 text-gray-400 hover:text-accent transition-colors"
                            title="Release to funding partners"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setHandoffDeal(deal)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                            title="Hand off to team"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </button>
                          <Link
                            href={`/dashboard/application/${deal.id}`}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            title="View details"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400
                         hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400
                         hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {assignModalDeal && (
        <AssignModal
          deal={assignModalDeal}
          teamMembers={teamMembers}
          onClose={() => setAssignModalDeal(null)}
          onAssign={() => {
            setAssignModalDeal(null)
            router.refresh()
          }}
        />
      )}

      {/* Handoff Panel */}
      {handoffDeal && (
        <HandoffPanel
          deal={handoffDeal}
          onClose={() => setHandoffDeal(null)}
          onHandoff={() => {
            setHandoffDeal(null)
            router.refresh()
          }}
        />
      )}

      {/* Release to Partners Panel */}
      {releaseDeal && (
        <ReleaseToPartnerPanel
          dealId={releaseDeal.id}
          dealName={releaseDeal.company?.name || releaseDeal.qualification_code}
          onClose={() => setReleaseDeal(null)}
          onSuccess={() => {
            setReleaseDeal(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

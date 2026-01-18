'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DealWithCompany, HandoffTarget } from '@/lib/types'
import { STAGE_CONFIG } from '@/lib/workflow'
import { createClient } from '@/lib/supabase/client'
import { formatCapitalAmount } from '@/lib/formatters'

interface TeamDealsListProps {
  deals: DealWithCompany[]
  teamType: HandoffTarget
  userId: string
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

export default function TeamDealsList({
  deals,
  teamType,
  userId,
}: TeamDealsListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const teamColor = teamType === 'legal' ? 'blue' : 'purple'

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSaveNotes = async (dealId: string) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('deals')
        .update({ internal_notes: notes[dealId] || null })
        .eq('id', dealId)

      if (error) throw error

      setEditingNotes(null)
      router.refresh()
    } catch (error) {
      console.error('Error saving notes:', error)
    } finally {
      setSaving(false)
    }
  }

  const startEditingNotes = (deal: DealWithCompany) => {
    setNotes({ ...notes, [deal.id]: deal.internal_notes || '' })
    setEditingNotes(deal.id)
  }

  if (deals.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center">
        <div className={`w-16 h-16 rounded-full bg-${teamColor}-100 dark:bg-${teamColor}-900/30 flex items-center justify-center mx-auto mb-5`}>
          <svg className={`w-8 h-8 text-${teamColor}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No deals assigned</h3>
        <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Deals will appear here when they are handed off to the {teamType === 'legal' ? 'Legal' : 'Funding Partner'} team by an admin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {deals.map((deal) => {
        const stageConfig = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.draft
        const isExpanded = expandedDeal === deal.id
        const isEditing = editingNotes === deal.id

        return (
          <div
            key={deal.id}
            className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
          >
            {/* Deal Header - Always Visible */}
            <div
              className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              onClick={() => setExpandedDeal(isExpanded ? null : deal.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {deal.company?.name || 'Unknown Company'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {deal.qualification_code} &middot; {deal.company?.owner?.email || 'No owner'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-lg ${stageConfig.bgColor} ${stageConfig.color}`}>
                    {stageLabels[deal.stage] || deal.stage}
                  </span>
                  {deal.overall_score !== null && (
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {deal.overall_score}/100
                    </span>
                  )}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Deal Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Deal Information</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Handed off:</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">
                          {formatDateTime(deal.handed_off_at)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Created:</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">
                          {formatDate(deal.created_at)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500 dark:text-gray-400">Last updated:</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">
                          {formatDate(deal.updated_at)}
                        </dd>
                      </div>
                      {deal.capital_amount && (
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">Capital amount:</dt>
                          <dd className="font-medium text-gray-900 dark:text-white">
                            {formatCapitalAmount(deal.capital_amount)}
                          </dd>
                        </div>
                      )}
                    </dl>
                    <Link
                      href={`/dashboard/application/${deal.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      View full details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Internal Notes</h4>
                      {!isEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditingNotes(deal)
                          }}
                          className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          value={notes[deal.id] || ''}
                          onChange={(e) => setNotes({ ...notes, [deal.id]: e.target.value })}
                          placeholder="Add notes about this deal..."
                          rows={4}
                          className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                   focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none transition-colors resize-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingNotes(null)
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400
                                     hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSaveNotes(deal.id)
                            }}
                            disabled={saving}
                            className={`px-3 py-1.5 text-sm font-semibold text-white bg-${teamColor}-600
                                     rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50`}
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {deal.internal_notes || 'No notes yet.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

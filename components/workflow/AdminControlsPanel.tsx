'use client'

import { useState } from 'react'
import { FundingApplicationStage } from '@/lib/types'
import {
  STAGE_CONFIG,
  getValidNextStages,
  canTransitionTo,
  isTerminalStage
} from '@/lib/workflow'

type ReleaseStatus = 'pending' | 'ready_for_release' | 'released' | 'rejected'

interface AdminControlsPanelProps {
  dealId: string
  currentStage: FundingApplicationStage
  assignedTo: string | null
  internalNotes: string | null
  releaseStatus?: ReleaseStatus
  releasePartner?: string | null
  releaseAuthorizedAt?: string | null
  hasDocumentScoring?: boolean
  onStageChange?: (newStage: FundingApplicationStage) => void
  onNotesUpdate?: (notes: string) => void
}

const RELEASE_PARTNERS = [
  { value: 'optima', label: 'Optima' },
  { value: 'other', label: 'Other Partner' },
]

export default function AdminControlsPanel({
  dealId,
  currentStage,
  assignedTo,
  internalNotes,
  releaseStatus = 'pending',
  releasePartner,
  releaseAuthorizedAt,
  hasDocumentScoring = false,
  onStageChange,
  onNotesUpdate
}: AdminControlsPanelProps) {
  const [notes, setNotes] = useState(internalNotes || '')
  const [showNotes, setShowNotes] = useState(false)
  const [isChangingStage, setIsChangingStage] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Release modal state
  const [showReleaseModal, setShowReleaseModal] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<string>(releasePartner || 'optima')
  const [releaseNotes, setReleaseNotes] = useState('')

  const validNextStages = getValidNextStages(currentStage)
  const stageConfig = STAGE_CONFIG[currentStage]
  const isTerminal = isTerminalStage(currentStage)

  // Separate positive progression from close actions
  const progressionStages = validNextStages.filter(s => s !== 'declined' && s !== 'withdrawn')
  const closeStages = validNextStages.filter(s => s === 'declined' || s === 'withdrawn')

  const handleStageChange = async (newStage: FundingApplicationStage) => {
    if (!canTransitionTo(currentStage, newStage)) {
      setError(`Cannot transition to ${newStage}`)
      return
    }

    setIsChangingStage(true)
    setError(null)

    try {
      const response = await fetch('/api/workflow/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, newStage })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to change stage')

      setSuccess(`Stage updated to ${STAGE_CONFIG[newStage]?.label}`)
      onStageChange?.(newStage)
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change stage')
    } finally {
      setIsChangingStage(false)
    }
  }

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    setError(null)
    try {
      const response = await fetch('/api/workflow/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, notes })
      })
      const result = await response.json()
      if (response.ok) {
        setSuccess('Notes saved')
        onNotesUpdate?.(notes)
      } else {
        setError(result.error || 'Failed to save notes')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save notes')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleRelease = async (action: 'ready_for_release' | 'released' | 'rejected') => {
    setIsAuthorizing(true)
    setError(null)

    try {
      const response = await fetch('/api/workflow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          action,
          partner: selectedPartner,
          notes: releaseNotes
        })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to update release')

      setSuccess(action === 'released' ? 'Released to partner' : action === 'ready_for_release' ? 'Marked as ready' : 'Rejected')
      setShowReleaseModal(false)
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update release')
    } finally {
      setIsAuthorizing(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Admin Controls</h3>
        </div>
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Notes {internalNotes ? '•' : ''}
        </button>
      </div>

      {/* Status Messages */}
      {(error || success) && (
        <div className={`px-5 py-3 text-sm ${error ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
          {error || success}
        </div>
      )}

      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Stage Row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Current Stage</p>
            <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold ${stageConfig?.bgColor || 'bg-gray-100'} ${stageConfig?.color || 'text-gray-700'}`}>
              {stageConfig?.label || currentStage}
            </span>
          </div>

          {!isTerminal && progressionStages.length > 0 && (
            <div className="flex items-center gap-2">
              {progressionStages.map(stage => (
                <button
                  key={stage}
                  onClick={() => handleStageChange(stage)}
                  disabled={isChangingStage}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Advance to {STAGE_CONFIG[stage]?.label || stage}
                </button>
              ))}
            </div>
          )}

          {isTerminal && (
            <span className="text-sm text-gray-400 italic">Closed</span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-gray-700" />

        {/* Release Row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Partner Release</p>
            {releaseStatus === 'released' ? (
              <div className="flex items-center gap-2">
                <span className="inline-block px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  Released
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  to {RELEASE_PARTNERS.find(p => p.value === releasePartner)?.label || releasePartner}
                </span>
              </div>
            ) : releaseStatus === 'rejected' ? (
              <span className="inline-block px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                Rejected
              </span>
            ) : (
              <span className="inline-block px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                Not Released
              </span>
            )}
          </div>

          <div>
            {releaseStatus === 'released' ? (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Complete
              </span>
            ) : !hasDocumentScoring ? (
              <span className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Needs scoring
              </span>
            ) : (
              <button
                onClick={() => setShowReleaseModal(true)}
                disabled={isAuthorizing}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Release to Partner
              </button>
            )}
          </div>
        </div>

        {/* Close Offering Actions - Only if available and not terminal */}
        {closeStages.length > 0 && !isTerminal && (
          <>
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <div className="flex items-center gap-3">
              {closeStages.includes('declined' as FundingApplicationStage) && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to decline this offering? This cannot be undone.')) {
                      handleStageChange('declined' as FundingApplicationStage)
                    }
                  }}
                  disabled={isChangingStage}
                  className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  Decline Offering
                </button>
              )}
              {closeStages.includes('withdrawn' as FundingApplicationStage) && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to withdraw this offering? This cannot be undone.')) {
                      handleStageChange('withdrawn' as FundingApplicationStage)
                    }
                  }}
                  disabled={isChangingStage}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Withdraw Offering
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Collapsible Notes Section */}
      {showNotes && (
        <div className="px-5 pb-5 pt-0">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Internal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this deal..."
              className="w-full h-20 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 resize-none"
            />
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => handleSaveNotes()}
                disabled={isSavingNotes}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isSavingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Release Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Release to Partner
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Partner
                </label>
                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900"
                >
                  {RELEASE_PARTNERS.map(partner => (
                    <option key={partner.value} value={partner.value}>{partner.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="Any notes for this release..."
                  className="w-full h-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowReleaseModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRelease('released')}
                disabled={isAuthorizing}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isAuthorizing ? 'Releasing...' : 'Confirm Release'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { DealWithCompany, HandoffTarget } from '@/lib/types'

interface HandoffPanelProps {
  deal: DealWithCompany
  onClose: () => void
  onHandoff: () => void
}

export default function HandoffPanel({
  deal,
  onClose,
  onHandoff,
}: HandoffPanelProps) {
  const [selectedTeam, setSelectedTeam] = useState<HandoffTarget | ''>(deal.handoff_to || '')
  const [notes, setNotes] = useState(deal.internal_notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleHandoff = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/workflow/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          handoffTo: selectedTeam || null,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to hand off deal')
      }

      onHandoff()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleClearHandoff = async () => {
    setSelectedTeam('')
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/workflow/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          handoffTo: null,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to clear handoff')
      }

      onHandoff()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-lg mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Hand Off to Team
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Hand off <strong>{deal.qualification_code}</strong> ({deal.company?.name}) to another team for processing.
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Current Handoff Status */}
        {deal.handoff_to && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Currently handed off to: <strong>{deal.handoff_to.toUpperCase()}</strong>
                </p>
                {deal.handed_off_at && (
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {new Date(deal.handed_off_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
              <button
                onClick={handleClearHandoff}
                disabled={saving}
                className="text-xs font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
              >
                Clear handoff
              </button>
            </div>
          </div>
        )}

        {/* Team Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Team
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedTeam('legal')}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedTeam === 'legal'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <svg className={`w-8 h-8 ${selectedTeam === 'legal' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                <span className={`font-semibold ${selectedTeam === 'legal' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  Legal Team
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTeam('optma')}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedTeam === 'optma'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <svg className={`w-8 h-8 ${selectedTeam === 'optma' ? 'text-purple-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className={`font-semibold ${selectedTeam === 'optma' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  Funding Partner
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Internal Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Internal Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes for the receiving team..."
            rows={4}
            className="w-full px-4 py-2.5 text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none transition-colors resize-none"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400
                     hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleHandoff}
            disabled={saving || !selectedTeam}
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900
                     rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Hand Off'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { DealWithCompany, TeamMember } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface AssignModalProps {
  deal: DealWithCompany
  teamMembers: TeamMember[]
  onClose: () => void
  onAssign: () => void
}

export default function AssignModal({
  deal,
  teamMembers,
  onClose,
  onAssign,
}: AssignModalProps) {
  const supabase = createClient()
  const [selectedMember, setSelectedMember] = useState<string>(deal.assigned_to || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAssign = async () => {
    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('deals')
        .update({ assigned_to: selectedMember || null })
        .eq('id', deal.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      onAssign()
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

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Assign Deal
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Assign <strong>{deal.qualification_code}</strong> ({deal.company?.name}) to a team member.
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Team Member
          </label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="w-full px-4 py-2.5 text-base border-2 border-gray-200 dark:border-gray-600 rounded-xl
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none transition-colors"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name || member.email} ({member.role})
              </option>
            ))}
          </select>
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
            onClick={handleAssign}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900
                     rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}

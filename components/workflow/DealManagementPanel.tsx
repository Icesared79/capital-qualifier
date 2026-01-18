'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FundingApplicationStage } from '@/lib/types'
import { STAGE_CONFIG, getValidNextStages, canTransitionTo, isTerminalStage } from '@/lib/workflow'
import { ChevronDown, ChevronUp, Settings, Users, Scale, FileText, AlertTriangle } from 'lucide-react'

type ReleaseStatus = 'pending' | 'ready_for_release' | 'released' | 'rejected'

interface LegalInfo {
  status: string
  partnerId: string | null
  partnerName: string | null
  signedOffAt: string | null
  notes: string | null
  availablePartners: { id: string; name: string }[]
}

interface DealManagementPanelProps {
  dealId: string
  currentStage: FundingApplicationStage
  internalNotes: string | null
  releaseStatus?: ReleaseStatus
  releasePartner?: string | null
  hasDocumentScoring?: boolean
  legalInfo?: LegalInfo
}

const RELEASE_PARTNERS = [
  { value: 'optima', label: 'Optima' },
  { value: 'other', label: 'Other Partner' },
]

export default function DealManagementPanel({
  dealId,
  currentStage,
  internalNotes,
  releaseStatus = 'pending',
  releasePartner,
  hasDocumentScoring = false,
  legalInfo
}: DealManagementPanelProps) {
  const router = useRouter()
  const [expandedSection, setExpandedSection] = useState<string | null>('stage')
  const [notes, setNotes] = useState(internalNotes || '')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Legal partner state
  const [selectedLegalPartner, setSelectedLegalPartner] = useState(legalInfo?.partnerId || '')
  const [legalNotes, setLegalNotes] = useState(legalInfo?.notes || '')

  // Release modal state
  const [showReleaseModal, setShowReleaseModal] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<string>(releasePartner || 'optima')

  const validNextStages = getValidNextStages(currentStage)
  const stageConfig = STAGE_CONFIG[currentStage]
  const isTerminal = isTerminalStage(currentStage)
  const progressionStages = validNextStages.filter(s => s !== 'declined' && s !== 'withdrawn')
  const canDecline = validNextStages.includes('declined' as FundingApplicationStage)
  const canWithdraw = validNextStages.includes('withdrawn' as FundingApplicationStage)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleStageChange = async (newStage: FundingApplicationStage) => {
    if (!canTransitionTo(currentStage, newStage)) return
    setIsLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/workflow/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, newStage })
      })
      if (!response.ok) throw new Error('Failed to change stage')
      setMessage({ type: 'success', text: `Stage updated` })
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to change stage' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/workflow/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, notes })
      })
      if (response.ok) {
        setMessage({ type: 'success', text: 'Notes saved' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save notes' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRelease = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/workflow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, action: 'released', partner: selectedPartner })
      })
      if (!response.ok) throw new Error('Failed')
      setMessage({ type: 'success', text: 'Released to partner' })
      setShowReleaseModal(false)
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to release' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignLegalPartner = async () => {
    if (!selectedLegalPartner) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/deals/${dealId}/legal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_partner_id: selectedLegalPartner,
          legal_status: 'assigned',
          legal_notes: legalNotes
        })
      })
      if (response.ok) {
        setMessage({ type: 'success', text: 'Legal partner assigned' })
        setTimeout(() => router.refresh(), 1000)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to assign' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Deal Management</h3>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-2 text-xs ${message.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
          {message.text}
        </div>
      )}

      {/* Stage Section */}
      <div className="border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => toggleSection('stage')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-gray-400" />
            <div className="text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400">Stage</p>
              <p className={`text-sm font-semibold ${stageConfig?.color || 'text-gray-700 dark:text-gray-300'}`}>
                {stageConfig?.label || currentStage}
              </p>
            </div>
          </div>
          {expandedSection === 'stage' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {expandedSection === 'stage' && !isTerminal && progressionStages.length > 0 && (
          <div className="px-4 pb-3 space-y-2">
            {progressionStages.map(stage => (
              <button
                key={stage}
                onClick={() => handleStageChange(stage)}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Advance to {STAGE_CONFIG[stage]?.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Partner Release Section */}
      <div className="border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => toggleSection('release')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-gray-400" />
            <div className="text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400">Partner Release</p>
              <p className={`text-sm font-semibold ${releaseStatus === 'released' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {releaseStatus === 'released' ? 'Released' : 'Not Released'}
              </p>
            </div>
          </div>
          {expandedSection === 'release' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {expandedSection === 'release' && releaseStatus !== 'released' && (
          <div className="px-4 pb-3">
            {!hasDocumentScoring ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">Needs scoring before release</p>
            ) : (
              <button
                onClick={() => setShowReleaseModal(true)}
                className="w-full px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Release to Partner
              </button>
            )}
          </div>
        )}
      </div>

      {/* Legal Partner Section */}
      {legalInfo && (
        <div className="border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => toggleSection('legal')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Scale className="w-4 h-4 text-gray-400" />
              <div className="text-left">
                <p className="text-xs text-gray-500 dark:text-gray-400">Legal Partner</p>
                <p className={`text-sm font-semibold ${legalInfo.partnerName ? 'text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {legalInfo.partnerName || 'Not Assigned'}
                </p>
              </div>
            </div>
            {expandedSection === 'legal' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSection === 'legal' && !legalInfo.partnerName && legalInfo.availablePartners.length > 0 && (
            <div className="px-4 pb-3 space-y-2">
              <select
                value={selectedLegalPartner}
                onChange={(e) => setSelectedLegalPartner(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select partner...</option>
                {legalInfo.availablePartners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={handleAssignLegalPartner}
                disabled={!selectedLegalPartner || isLoading}
                className="w-full px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notes Section */}
      <div className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <button
          onClick={() => toggleSection('notes')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-gray-400" />
            <div className="text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400">Internal Notes</p>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {internalNotes ? 'Has notes' : 'No notes'}
              </p>
            </div>
          </div>
          {expandedSection === 'notes' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {expandedSection === 'notes' && (
          <div className="px-4 pb-3 space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes..."
              className="w-full h-16 px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
            />
            <button
              onClick={handleSaveNotes}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Save Notes
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {(canDecline || canWithdraw) && !isTerminal && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 flex gap-2">
          {canDecline && (
            <button
              onClick={() => {
                if (confirm('Decline this offering?')) handleStageChange('declined' as FundingApplicationStage)
              }}
              disabled={isLoading}
              className="flex-1 px-2 py-1.5 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Decline
            </button>
          )}
          {canWithdraw && (
            <button
              onClick={() => {
                if (confirm('Withdraw this offering?')) handleStageChange('withdrawn' as FundingApplicationStage)
              }}
              disabled={isLoading}
              className="flex-1 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Withdraw
            </button>
          )}
        </div>
      )}

      {/* Release Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 max-w-sm w-full shadow-xl">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4">Release to Partner</h4>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full px-3 py-2 mb-4 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {RELEASE_PARTNERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReleaseModal(false)}
                className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRelease}
                disabled={isLoading}
                className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

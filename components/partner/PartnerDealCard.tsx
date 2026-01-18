'use client'

import { useState } from 'react'
import { DealRelease, DealMatchInfo, DealReleaseStatus } from '@/lib/types'
import { formatCapitalAmount } from '@/lib/formatters'
import {
  Building2,
  TrendingUp,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Star,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react'

interface DealInfo {
  id: string
  qualification_code: string
  capital_amount: string | number | null
  overall_score: number | null
  qualification_score: string | null
  company: {
    id: string
    name: string
    owner: {
      id: string
      email: string
      full_name: string | null
    } | null
  } | null
  qualification_data?: {
    assetClass?: string[]
    geoFocus?: string
  } | null
  notes?: string | {
    strengths?: string[]
    assetClasses?: string[]
    geographicFocus?: string
  } | null
}

interface PartnerDealCardProps {
  release: DealRelease
  deal: DealInfo
  matchInfo?: DealMatchInfo
  otherPartnersReviewing?: number // Number of other partners actively reviewing this deal
  onAction: (action: 'express_interest' | 'pass' | 'start_due_diligence', notes?: string, passReason?: string) => Promise<void>
  onDownloadPackage: () => Promise<void>
}

const STATUS_CONFIG: Record<DealReleaseStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'New', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  viewed: { label: 'Viewed', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  interested: { label: 'Interested', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  reviewing: { label: 'Reviewing', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  due_diligence: { label: 'Due Diligence', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  term_sheet: { label: 'Term Sheet', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  passed: { label: 'Passed', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  funded: { label: 'Funded', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' }
}


export default function PartnerDealCard({
  release,
  deal,
  matchInfo,
  otherPartnersReviewing,
  onAction,
  onDownloadPackage
}: PartnerDealCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [passReason, setPassReason] = useState('')
  const [showPassModal, setShowPassModal] = useState(false)

  const statusConfig = STATUS_CONFIG[release.status] || STATUS_CONFIG.pending

  const handleAction = async (action: 'express_interest' | 'pass' | 'start_due_diligence') => {
    setLoading(action)
    try {
      if (action === 'pass') {
        await onAction(action, undefined, passReason)
        setShowPassModal(false)
      } else {
        await onAction(action)
      }
    } finally {
      setLoading(null)
    }
  }

  const handleDownload = async () => {
    setLoading('download')
    try {
      await onDownloadPackage()
    } finally {
      setLoading(null)
    }
  }

  // Parse notes to get additional info
  const notesData = typeof deal.notes === 'string'
    ? (() => { try { return JSON.parse(deal.notes) } catch { return {} } })()
    : (deal.notes || {})

  const assetClasses = deal.qualification_data?.assetClass || notesData.assetClasses || []
  const geography = deal.qualification_data?.geoFocus || notesData.geographicFocus || ''
  const strengths = notesData.strengths || []

  return (
    <div className={`bg-white dark:bg-gray-800 border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg ${
      matchInfo?.matches ? 'border-accent/30' : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Match Badge */}
      {matchInfo?.matches && matchInfo.matchReasons.length > 0 && (
        <div className="bg-accent/10 px-4 py-2 border-b border-accent/20 flex items-center gap-2">
          <Star className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent">
            Matches Your Criteria
          </span>
          <span className="text-xs text-accent/70">
            ({matchInfo.matchReasons.join(', ')})
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                {deal.company?.name || 'Unnamed Company'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {deal.qualification_code}
              </p>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.label}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Capital</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatCapitalAmount(deal.capital_amount, 'N/A')}
              </p>
            </div>
          </div>

          {deal.overall_score && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {deal.overall_score}/100
                </p>
              </div>
            </div>
          )}

          {geography && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Geography</p>
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {geography}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Released</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(release.released_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Subtle Competition Indicator */}
        {otherPartnersReviewing && otherPartnersReviewing > 0 && release.status !== 'passed' && release.status !== 'funded' && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Other partners are reviewing this opportunity
            </span>
          </div>
        )}

        {/* Asset Classes */}
        {assetClasses.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {assetClasses.slice(0, 3).map((ac: string) => (
              <span
                key={ac}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full"
              >
                {ac.replace(/_/g, ' ')}
              </span>
            ))}
            {assetClasses.length > 3 && (
              <span className="px-2 py-0.5 text-gray-500 dark:text-gray-400 text-xs">
                +{assetClasses.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Expandable Details */}
        {(release.status !== 'pending' && release.status !== 'viewed') && strengths.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>

            {showDetails && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Strengths:</p>
                <ul className="space-y-1">
                  {strengths.slice(0, 4).map((strength: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          {release.status === 'pending' && (
            <>
              <button
                onClick={() => handleAction('express_interest')}
                disabled={loading !== null}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {loading === 'express_interest' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Express Interest
              </button>
              <button
                onClick={() => setShowPassModal(true)}
                disabled={loading !== null}
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Pass
              </button>
            </>
          )}

          {(release.status === 'interested' || release.status === 'reviewing') && (
            <>
              <button
                onClick={() => handleAction('start_due_diligence')}
                disabled={loading !== null}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {loading === 'start_due_diligence' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Start Due Diligence
              </button>
              <button
                onClick={handleDownload}
                disabled={loading !== null}
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                {loading === 'download' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download Package
              </button>
              <button
                onClick={() => setShowPassModal(true)}
                disabled={loading !== null}
                className="flex items-center justify-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Pass
              </button>
            </>
          )}

          {release.status === 'due_diligence' && (
            <>
              <button
                onClick={handleDownload}
                disabled={loading !== null}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {loading === 'download' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download Full Package
              </button>
            </>
          )}

          {release.status === 'passed' && (
            <div className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-500 dark:text-gray-400">
              <XCircle className="w-4 h-4" />
              <span>Passed on this deal</span>
            </div>
          )}

          {release.status === 'funded' && (
            <div className="flex-1 flex items-center justify-center gap-2 py-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Funded</span>
            </div>
          )}
        </div>
      </div>

      {/* Pass Modal */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Pass on Deal
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Please provide a reason for passing (optional):
            </p>
            <textarea
              value={passReason}
              onChange={(e) => setPassReason(e.target.value)}
              placeholder="e.g., Asset class not a fit, deal size too small..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-accent resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPassModal(false)
                  setPassReason('')
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('pass')}
                disabled={loading === 'pass'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {loading === 'pass' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Confirm Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

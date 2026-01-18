'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FundingPartner } from '@/lib/types'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { formatCapitalAmount } from '@/lib/formatters'

interface PartnerDashboardClientProps {
  partner: FundingPartner
  deals: any[]
  isAdmin?: boolean
}

const LEGAL_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  assigned: { label: 'Assigned', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  in_review: { label: 'In Review', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  approved: { label: 'Approved', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  changes_required: { label: 'Changes Required', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  rejected: { label: 'Rejected', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
}

const TOKENIZATION_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  assigned: { label: 'Assigned', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  green_lit: { label: 'Green-lit', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  configuring: { label: 'Configuring', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  minting: { label: 'Minting', color: 'text-indigo-700 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  ready: { label: 'Ready', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  failed: { label: 'Failed', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
}

export default function PartnerDashboardClient({ partner, deals, isAdmin }: PartnerDashboardClientProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const isLegalPartner = partner.partner_role === 'legal'
  const isTokenizationPartner = partner.partner_role === 'tokenization'
  const statusConfig = isLegalPartner ? LEGAL_STATUS_CONFIG : TOKENIZATION_STATUS_CONFIG

  // Filter deals based on status
  const filteredDeals = deals.filter(deal => {
    if (filter === 'all') return true
    if (filter === 'active') {
      if (isLegalPartner) {
        return !['approved', 'rejected'].includes(deal.legal_status)
      }
      return !['ready', 'failed'].includes(deal.tokenization_status)
    }
    if (filter === 'completed') {
      if (isLegalPartner) {
        return ['approved', 'rejected'].includes(deal.legal_status)
      }
      return ['ready', 'failed'].includes(deal.tokenization_status)
    }
    return true
  })

  // Stats
  const activeCount = deals.filter(d => {
    if (isLegalPartner) return !['approved', 'rejected'].includes(d.legal_status)
    return !['ready', 'failed'].includes(d.tokenization_status)
  }).length

  const completedCount = deals.filter(d => {
    if (isLegalPartner) return d.legal_status === 'approved'
    return d.tokenization_status === 'ready'
  }).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center">
                <img src="/logo.svg" alt="BitCense" className="h-8 dark:invert" />
              </Link>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-sm font-bold rounded-lg ${
                  isLegalPartner
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : isTokenizationPartner
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                }`}>
                  {isLegalPartner ? 'Legal Partner' : isTokenizationPartner ? 'Tokenization Partner' : 'Funding Partner'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="font-semibold text-gray-900 dark:text-white">{partner.name}</span>
              {isAdmin && (
                <Link
                  href="/dashboard/admin"
                  className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Admin View
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isLegalPartner ? 'Legal Review Dashboard' : isTokenizationPartner ? 'Tokenization Dashboard' : 'Partner Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isLegalPartner
              ? 'Review and sign off on assigned deals'
              : isTokenizationPartner
              ? 'Configure and mint tokens for assigned deals'
              : 'View and manage released deals'
            }
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{deals.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Assigned</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{activeCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Deals List */}
        {filteredDeals.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No deals {filter === 'all' ? 'assigned' : filter}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'all'
                ? 'When BitCense assigns deals to you, they will appear here.'
                : `No ${filter} deals at the moment.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDeals.map(deal => {
              const status = isLegalPartner ? deal.legal_status : deal.tokenization_status
              const statusInfo = statusConfig[status] || statusConfig.pending

              return (
                <div
                  key={deal.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {deal.company?.name || 'Unknown Company'}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {deal.qualification_code} · {formatCapitalAmount(deal.capital_amount, 'N/A')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {deal.overall_score && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{deal.overall_score}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                        </div>
                      )}
                      <Link
                        href={`/dashboard/application/${deal.id}`}
                        className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  </div>

                  {(isLegalPartner && deal.legal_notes) || (!isLegalPartner && deal.tokenization_notes) ? (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        "{isLegalPartner ? deal.legal_notes : deal.tokenization_notes}"
                      </p>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

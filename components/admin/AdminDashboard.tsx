'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DealWithCompany, PipelineCounts, TeamMember } from '@/lib/types'
import { STAGE_CONFIG } from '@/lib/workflow'
import PipelineStats from './PipelineStats'

interface AdminDashboardProps {
  pipelineCounts: PipelineCounts
  recentDeals: DealWithCompany[]
  teamMembers: TeamMember[]
  totalDeals: number
}

// Stage labels for display
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

export default function AdminDashboard({
  pipelineCounts,
  recentDeals,
  teamMembers,
  totalDeals,
}: AdminDashboardProps) {
  // Calculate active deals (excluding terminal stages)
  const activeDeals = totalDeals - pipelineCounts.funded - pipelineCounts.declined - pipelineCounts.withdrawn

  // Calculate deals needing attention (in stages that require admin action)
  const needsAttention = pipelineCounts.documents_in_review + pipelineCounts.due_diligence

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pipeline Overview
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
            {totalDeals} total deals, {activeDeals} active
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/dashboard/admin/partners"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Manage Partners
          </Link>
          <Link
            href="/dashboard/admin/deals"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-gray-900 dark:hover:border-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            View All Deals
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Deals</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeDeals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Needs Attention</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{needsAttention}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Funded</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{pipelineCounts.funded}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Stats */}
      <PipelineStats counts={pipelineCounts} />

      {/* Recent Deals */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Recently Updated
            </h2>
            <Link
              href="/dashboard/admin/deals"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              View all
            </Link>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentDeals.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No deals yet</p>
            </div>
          ) : (
            recentDeals.map((deal) => {
              const stageConfig = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.draft
              return (
                <Link
                  key={deal.id}
                  href={`/dashboard/application/${deal.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
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
                    {deal.handoff_to && (
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded">
                        {deal.handoff_to.toUpperCase()}
                      </span>
                    )}
                    <span className={`px-3 py-1 text-sm font-medium rounded-lg ${stageConfig.bgColor} ${stageConfig.color}`}>
                      {stageLabels[deal.stage] || deal.stage}
                    </span>
                    {deal.overall_score !== null && (
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {deal.overall_score}/100
                      </span>
                    )}
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BitCense Team */}
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              BitCense Team
            </h3>
            <Link
              href="/dashboard/admin/team"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Manage
            </Link>
          </div>
          <div className="space-y-3">
            {teamMembers
              .filter(m => m.role === 'admin' || m.role === 'legal')
              .filter(m => m.full_name || (m.email && !m.email.includes('test')))
              .map((member) => {
                const roleLabels: Record<string, string> = {
                  admin: 'Administrator',
                  legal: 'Legal',
                }
                return (
                  <div key={member.id} className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                      {(member.full_name || member.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.full_name || member.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {roleLabels[member.role] || member.role}
                      </p>
                    </div>
                  </div>
                )
              })}
            {teamMembers.filter(m => m.role === 'admin' || m.role === 'legal').length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No team members found</p>
            )}
          </div>
        </div>

        {/* Financial Partners */}
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Financial Partners
            </h3>
            <Link
              href="/dashboard/admin/partners"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Manage
            </Link>
          </div>
          <div className="space-y-3">
            {/* Optima - our primary partner */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">O</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Optima</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Primary FP</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {recentDeals.filter(d => d.handoff_to === 'optma').length} deals
                </span>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add more partners to expand your funding network
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

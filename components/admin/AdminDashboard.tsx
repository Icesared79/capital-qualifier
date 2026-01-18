'use client'

import Link from 'next/link'
import { DealWithCompany, PipelineCounts, TeamMember } from '@/lib/types'
import { STAGE_CONFIG } from '@/lib/workflow'

interface AdminDashboardProps {
  pipelineCounts: PipelineCounts
  recentDeals: DealWithCompany[]
  teamMembers: TeamMember[]
  totalDeals: number
}

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
  const activeDeals = totalDeals - (pipelineCounts.funded || 0) - (pipelineCounts.declined || 0) - (pipelineCounts.withdrawn || 0)

  // Calculate pipeline bucket counts
  const intakeCount = (pipelineCounts.draft || 0) + (pipelineCounts.qualified || 0)
  const documentsCount = (pipelineCounts.documents_requested || 0) + (pipelineCounts.documents_in_review || 0)
  const partnerCount = (pipelineCounts.due_diligence || 0) + (pipelineCounts.term_sheet || 0) + (pipelineCounts.negotiation || 0)
  const closingCount = pipelineCounts.closing || 0

  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pipeline</h2>
          <Link
            href="/dashboard/admin/deals"
            className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
          >
            View all deals
          </Link>
        </div>

        {/* Pipeline stages as a horizontal flow */}
        <div className="flex items-center gap-3">
          {/* Intake - Blue accent */}
          <Link
            href="/dashboard/admin/deals?stages=draft,qualified"
            className="flex-1 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-center group"
          >
            <p className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-1">{intakeCount}</p>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Intake</p>
          </Link>

          <svg className="w-6 h-6 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>

          {/* Documents - Amber accent */}
          <Link
            href="/dashboard/admin/deals?stages=documents_requested,documents_in_review"
            className="flex-1 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-5 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all text-center group"
          >
            <p className="text-4xl font-black text-amber-600 dark:text-amber-400 mb-1">{documentsCount}</p>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Documents</p>
          </Link>

          <svg className="w-6 h-6 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>

          {/* With Partner - Purple accent */}
          <Link
            href="/dashboard/admin/deals?stages=due_diligence,term_sheet,negotiation"
            className="flex-1 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-5 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all text-center group"
          >
            <p className="text-4xl font-black text-purple-600 dark:text-purple-400 mb-1">{partnerCount}</p>
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Partner</p>
          </Link>

          <svg className="w-6 h-6 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>

          {/* Closing - Teal accent */}
          <Link
            href="/dashboard/admin/deals?stages=closing"
            className="flex-1 bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-200 dark:border-teal-800 rounded-xl p-5 hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-all text-center group"
          >
            <p className="text-4xl font-black text-teal-600 dark:text-teal-400 mb-1">{closingCount}</p>
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide">Closing</p>
          </Link>
        </div>

        {/* Outcomes - cleaner layout */}
        <div className="flex items-center gap-4 mt-6 pt-6 border-t-2 border-gray-100 dark:border-gray-700">
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Outcomes</span>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin/deals?stages=funded"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Funded</span>
              <span className="text-base font-black text-gray-900 dark:text-white">{pipelineCounts.funded || 0}</span>
            </Link>
            <Link
              href="/dashboard/admin/deals?stages=declined"
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg hover:border-red-400 dark:hover:border-red-600 transition-colors"
            >
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">Declined</span>
              <span className="text-base font-black text-red-600 dark:text-red-400">{pipelineCounts.declined || 0}</span>
            </Link>
            <Link
              href="/dashboard/admin/deals?stages=withdrawn"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Withdrawn</span>
              <span className="text-base font-black text-gray-700 dark:text-gray-300">{pipelineCounts.withdrawn || 0}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Deals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
          <Link
            href="/dashboard/admin/deals"
            className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
          >
            View all {activeDeals} active deals
          </Link>
        </div>

        {recentDeals.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-5 py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">No deals yet</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {recentDeals.slice(0, 6).map((deal) => {
              const stageConfig = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.draft
              const score = deal.overall_score
              const capitalAmount = deal.capital_amount

              // Calculate time since last update
              const lastUpdate = new Date(deal.updated_at)
              const now = new Date()
              const diffMs = now.getTime() - lastUpdate.getTime()
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
              const timeAgo = diffDays > 0 ? `${diffDays}d ago` : diffHours > 0 ? `${diffHours}h ago` : 'Just now'

              return (
                <Link
                  key={deal.id}
                  href={`/dashboard/application/${deal.id}`}
                  className="block bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-gray-400 dark:hover:border-gray-500 transition-all hover:shadow-md group"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Left: Main Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1.5 text-sm font-bold rounded-lg ${stageConfig.bgColor} ${stageConfig.color}`}>
                          {stageLabels[deal.stage]}
                        </span>
                        {score && (
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg">
                            Score: {score}/100
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:underline">
                        {deal.company?.name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-mono">{deal.qualification_code}</span>
                        <span className="mx-2">•</span>
                        <span>{timeAgo}</span>
                      </p>
                    </div>

                    {/* Right: Amount & Action */}
                    <div className="flex items-center gap-5">
                      {capitalAmount && (
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Funding Request</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            ${(capitalAmount / 1000000).toFixed(1)}M
                          </p>
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Team & Partners - Compact */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white">Team</h3>
            <Link href="/dashboard/admin/team" className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white">
              Manage
            </Link>
          </div>
          <div className="flex -space-x-2">
            {teamMembers
              .filter(m => m.role === 'admin' || m.role === 'legal')
              .slice(0, 5)
              .map((member) => (
                <div
                  key={member.id}
                  className="w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white dark:ring-gray-800"
                  title={member.full_name || member.email}
                >
                  {(member.full_name || member.email || '?').charAt(0).toUpperCase()}
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white">Partners</h3>
            <Link href="/dashboard/admin/partners" className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white">
              Manage
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">O</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Optima</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {recentDeals.filter(d => d.handoff_to === 'optma').length} active deals
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

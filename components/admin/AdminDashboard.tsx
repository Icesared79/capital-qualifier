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

// Pipeline buckets
const PIPELINE_STAGES = [
  { id: 'intake', label: 'Intake', stages: ['draft', 'qualified'], color: 'blue' },
  { id: 'documents', label: 'Documents', stages: ['documents_requested', 'documents_in_review'], color: 'amber' },
  { id: 'partner', label: 'With Partner', stages: ['due_diligence', 'term_sheet', 'negotiation'], color: 'purple' },
  { id: 'closing', label: 'Closing', stages: ['closing'], color: 'emerald' },
]

export default function AdminDashboard({
  pipelineCounts,
  recentDeals,
  teamMembers,
  totalDeals,
}: AdminDashboardProps) {
  const activeDeals = totalDeals - pipelineCounts.funded - pipelineCounts.declined - pipelineCounts.withdrawn

  const getStageCount = (stages: string[]) =>
    stages.reduce((sum, stage) => sum + (pipelineCounts[stage as keyof PipelineCounts] || 0), 0)

  const colorClasses: Record<string, { bg: string; text: string; ring: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-200 dark:ring-blue-800' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-200 dark:ring-amber-800' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-200 dark:ring-purple-800' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  }

  return (
    <div className="space-y-6">
      {/* Pipeline - The main thing */}
      <div className="grid grid-cols-4 gap-4">
        {PIPELINE_STAGES.map((stage, index) => {
          const count = getStageCount(stage.stages)
          const colors = colorClasses[stage.color]
          return (
            <Link
              key={stage.id}
              href={`/dashboard/admin/deals?stages=${stage.stages.join(',')}`}
              className={`relative ${colors.bg} rounded-2xl p-5 hover:ring-2 ${colors.ring} transition-all group`}
            >
              <p className={`text-4xl font-bold ${colors.text}`}>{count}</p>
              <p className="font-semibold text-gray-900 dark:text-white mt-1">{stage.label}</p>

              {/* Arrow */}
              {index < PIPELINE_STAGES.length - 1 && (
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-10 text-gray-300 dark:text-gray-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* Outcomes row */}
      <div className="flex gap-4">
        <Link
          href="/dashboard/admin/deals?stages=funded"
          className="flex-1 flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-xl px-5 py-3 hover:ring-2 ring-green-200 dark:ring-green-800 transition-all"
        >
          <span className="font-medium text-green-700 dark:text-green-300">Funded</span>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">{pipelineCounts.funded}</span>
        </Link>
        <Link
          href="/dashboard/admin/deals?stages=declined"
          className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-xl px-5 py-3 hover:ring-2 ring-red-200 dark:ring-red-800 transition-all"
        >
          <span className="font-medium text-red-700 dark:text-red-300">Declined</span>
          <span className="text-2xl font-bold text-red-600 dark:text-red-400">{pipelineCounts.declined}</span>
        </Link>
        <Link
          href="/dashboard/admin/deals?stages=withdrawn"
          className="flex-1 flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-xl px-5 py-3 hover:ring-2 ring-gray-300 dark:ring-gray-600 transition-all"
        >
          <span className="font-medium text-gray-600 dark:text-gray-400">Withdrawn</span>
          <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">{pipelineCounts.withdrawn}</span>
        </Link>
      </div>

      {/* Recent Deals */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white">Recent Deals</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{activeDeals} active</span>
        </div>

        {recentDeals.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
            No deals yet
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentDeals.slice(0, 8).map((deal) => {
              const stageConfig = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.draft
              return (
                <Link
                  key={deal.id}
                  href={`/dashboard/application/${deal.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {deal.company?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {deal.qualification_code}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${stageConfig.bgColor} ${stageConfig.color}`}>
                      {stageLabels[deal.stage]}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Team</h3>
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
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white dark:ring-gray-800"
                  title={member.full_name || member.email}
                >
                  {(member.full_name || member.email || '?').charAt(0).toUpperCase()}
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Partners</h3>
            <Link href="/dashboard/admin/partners" className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white">
              Manage
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">O</span>
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

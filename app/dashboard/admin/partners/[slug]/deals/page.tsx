import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Eye, TrendingUp, Clock, CheckCircle2, XCircle, Users } from 'lucide-react'
import { formatCapitalAmount } from '@/lib/formatters'

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  viewed: { label: 'Viewed', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  interested: { label: 'Interested', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  reviewing: { label: 'Reviewing', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  due_diligence: { label: 'Due Diligence', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  term_sheet: { label: 'Term Sheet', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  passed: { label: 'Passed', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  funded: { label: 'Funded', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' }
}

export default async function PartnerDealsPage({
  params
}: {
  params: { slug: string }
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get the partner by slug
  const { data: partner, error } = await supabase
    .from('funding_partners')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (error || !partner) {
    notFound()
  }

  // Get all deal releases for this partner
  const { data: releases } = await supabase
    .from('deal_releases')
    .select(`
      *,
      deal:deals (
        id,
        qualification_code,
        capital_amount,
        overall_score,
        stage,
        company:companies (
          id,
          name
        )
      ),
      released_by_user:profiles!deal_releases_released_by_fkey (
        email,
        full_name
      )
    `)
    .eq('partner_id', partner.id)
    .order('released_at', { ascending: false })

  // Calculate stats
  const stats = {
    total: releases?.length || 0,
    pending: releases?.filter(r => r.status === 'pending').length || 0,
    interested: releases?.filter(r => ['interested', 'reviewing', 'due_diligence'].includes(r.status)).length || 0,
    passed: releases?.filter(r => r.status === 'passed').length || 0,
    funded: releases?.filter(r => r.status === 'funded').length || 0
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin/partners"
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center">
            {partner.logo_url ? (
              <img src={partner.logo_url} alt={partner.name} className="w-8 h-8 object-contain" />
            ) : (
              <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {partner.name} - Deals
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stats.total} deals released to this partner
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.interested}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Interested</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-500">{stats.passed}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Passed</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.funded}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Funded</p>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Deal
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Partner Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Released
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {!releases || releases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No deals have been released to this partner yet
                  </td>
                </tr>
              ) : (
                releases.map((release: any) => {
                  const statusConfig = STATUS_CONFIG[release.status] || STATUS_CONFIG.pending
                  const deal = release.deal

                  return (
                    <tr key={release.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/application/${deal?.id}`}
                          className="font-mono text-sm font-medium text-gray-900 dark:text-white hover:underline"
                        >
                          {deal?.qualification_code || 'Unknown'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {deal?.company?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {formatCapitalAmount(deal?.capital_amount, '-')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {deal?.overall_score ? `${deal.overall_score}/100` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-lg ${statusConfig.bgColor} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        {release.pass_reason && (
                          <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title={release.pass_reason}>
                            {release.pass_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(release.released_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          by {release.released_by_user?.full_name || release.released_by_user?.email || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/application/${deal?.id}`}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors inline-block"
                          title="View deal"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline / Activity (optional future enhancement) */}
      {releases && releases.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {releases.slice(0, 5).map((release: any) => {
              const statusConfig = STATUS_CONFIG[release.status] || STATUS_CONFIG.pending
              return (
                <div key={release.id} className="flex items-center gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${statusConfig.bgColor.replace('bg-', 'bg-').replace('/30', '')}`} />
                  <span className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-white">{release.deal?.company?.name}</span>
                    {' '}&mdash;{' '}
                    <span className={statusConfig.color}>{statusConfig.label}</span>
                  </span>
                  <span className="text-gray-400 ml-auto">
                    {new Date(release.updated_at || release.released_at).toLocaleDateString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DealsTable from '@/components/admin/DealsTable'
import DealFilters from '@/components/admin/DealFilters'
import { DealWithCompany, TeamMember, FundingApplicationStage, HandoffTarget } from '@/lib/types'

interface DealsPageProps {
  searchParams: {
    stage?: string
    handoff_to?: string
    search?: string
    page?: string
  }
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const supabase = createClient()
  const adminClient = createAdminClient()

  // Get current user
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

  // Parse filters
  const stageFilter = searchParams.stage as FundingApplicationStage | undefined
  const handoffFilter = searchParams.handoff_to as HandoffTarget | undefined
  const searchQuery = searchParams.search || ''
  const page = parseInt(searchParams.page || '1', 10)
  const pageSize = 20

  // Build query
  let query = adminClient
    .from('deals')
    .select(`
      id,
      qualification_code,
      stage,
      assigned_to,
      internal_notes,
      created_at,
      updated_at,
      stage_changed_at,
      overall_score,
      qualification_score,
      capital_amount,
      company:companies (
        id,
        name,
        owner:profiles!companies_owner_id_fkey (
          id,
          email,
          full_name
        )
      )
    `, { count: 'exact' })

  // Apply filters
  if (stageFilter) {
    query = query.eq('stage', stageFilter)
  }

  // Note: handoff filter disabled until columns are added to database
  // if (handoffFilter) {
  //   query = query.eq('handoff_to', handoffFilter)
  // }

  // Order and paginate
  query = query
    .order('updated_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data: deals, error: dealsError, count } = await query

  if (dealsError) {
    console.error('Error fetching deals:', dealsError)
  }

  // Filter by search query on the client side (for company name or qualification code)
  let filteredDeals = deals as DealWithCompany[] || []
  if (searchQuery) {
    const lowerSearch = searchQuery.toLowerCase()
    filteredDeals = filteredDeals.filter((deal) => {
      const companyName = deal.company?.name?.toLowerCase() || ''
      const code = deal.qualification_code?.toLowerCase() || ''
      const ownerEmail = deal.company?.owner?.email?.toLowerCase() || ''
      return companyName.includes(lowerSearch) || code.includes(lowerSearch) || ownerEmail.includes(lowerSearch)
    })
  }

  // Fetch team members for assignment
  const { data: teamMembers } = await adminClient
    .from('profiles')
    .select('id, email, full_name, role')
    .in('role', ['admin', 'legal', 'optma'])

  // Get all available stages for filter
  const stages: FundingApplicationStage[] = [
    'draft', 'qualified', 'documents_requested', 'documents_in_review',
    'due_diligence', 'term_sheet', 'negotiation', 'closing',
    'funded', 'declined', 'withdrawn'
  ]

  // Fetch release stats for all deals
  const dealIds = filteredDeals.map(d => d.id)
  const releaseStats: Record<string, { total: number; interested: number; passed: number }> = {}

  if (dealIds.length > 0) {
    const { data: releases } = await adminClient
      .from('deal_releases')
      .select('deal_id, status')
      .in('deal_id', dealIds)

    if (releases) {
      for (const release of releases) {
        if (!releaseStats[release.deal_id]) {
          releaseStats[release.deal_id] = { total: 0, interested: 0, passed: 0 }
        }
        releaseStats[release.deal_id].total++
        if (['interested', 'reviewing', 'due_diligence', 'term_sheet'].includes(release.status)) {
          releaseStats[release.deal_id].interested++
        }
        if (release.status === 'passed') {
          releaseStats[release.deal_id].passed++
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            All Deals
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
            {count || 0} total deals
          </p>
        </div>
      </div>

      {/* Filters */}
      <DealFilters
        stages={stages}
        currentStage={stageFilter}
        currentHandoff={handoffFilter}
        currentSearch={searchQuery}
      />

      {/* Deals Table */}
      <DealsTable
        deals={filteredDeals}
        teamMembers={teamMembers || []}
        currentPage={page}
        totalCount={count || 0}
        pageSize={pageSize}
        releaseStats={releaseStats}
      />
    </div>
  )
}

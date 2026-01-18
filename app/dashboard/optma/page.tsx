import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OptmaDashboardClient from '@/components/partner/OptmaDashboardClient'
import { FundingPartner, PartnerNotificationPreferences, DealRelease } from '@/lib/types'

interface DealWithRelease {
  release: DealRelease
  deal: {
    id: string
    qualification_code: string
    capital_amount: string | number | null
    overall_score: number | null
    qualification_score: string | null
    qualification_data: Record<string, any> | null
    notes: string | null
    company: {
      id: string
      name: string
      qualification_data: Record<string, any> | null
      owner: {
        id: string
        email: string
        full_name: string | null
      } | null
    } | null
  }
}

export default async function OptmaDashboardPage() {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify optma or admin role (admin can access for testing)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // If profile fetch failed or role is not allowed, show error or redirect
  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Error
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Could not load your profile. Please try logging out and back in.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Error: {profileError.message}
          </p>
        </div>
      </div>
    )
  }

  if (profile?.role !== 'optma' && profile?.role !== 'admin') {
    // Don't redirect - show message instead so we can debug
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Your current role ({profile?.role || 'none'}) does not have access to this dashboard.
            Only &apos;optma&apos; or &apos;admin&apos; roles can access this page.
          </p>
          <a
            href="/dashboard/admin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
          >
            Back to Admin Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Get partner by slug
  const { data: partner, error: partnerError } = await supabase
    .from('funding_partners')
    .select('*')
    .eq('slug', 'optima')
    .single()

  if (partnerError) {
    // Check if it's a "table doesn't exist" or similar database error
    // PostgREST returns various codes: PGRST116 (relation not found), 42P01 (undefined table), etc.
    const isTableMissingError =
      partnerError.code === 'PGRST116' ||
      partnerError.code === 'PGRST205' ||
      partnerError.code === '42P01' ||
      partnerError.message?.includes('does not exist') ||
      partnerError.message?.includes('relation') ||
      partnerError.message?.includes('funding_partners')

    if (isTableMissingError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Database Setup Required
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              The partner dashboard tables need to be created first.
            </p>
            <a
              href="/setup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
            >
              Run Setup
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              Error code: {partnerError.code}
            </p>
          </div>
        </div>
      )
    }

    // If partner not found by slug, try to find any active partner
    const { data: altPartner, error: altError } = await supabase
      .from('funding_partners')
      .select('*')
      .eq('status', 'active')
      .limit(1)
      .single()

    if (altError || !altPartner) {
      // Show a more informative message with the actual error
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Partner Setup Required
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No funding partners have been configured yet. Please run setup to create the partner tables.
            </p>
            <a
              href="/setup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
            >
              Run Setup
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              Error: {partnerError.message || altError?.message}
            </p>
          </div>
        </div>
      )
    }

    // Use the first active partner for now
    return renderDashboard(supabase, altPartner)
  }

  if (!partner) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Partner Not Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Please contact an administrator to set up your partner account.
          </p>
        </div>
      </div>
    )
  }

  return renderDashboard(supabase, partner)
}

async function renderDashboard(supabase: any, partner: FundingPartner) {
  // Fetch partner's preferences
  const { data: preferences } = await supabase
    .from('partner_notification_preferences')
    .select('*')
    .eq('partner_id', partner.id)
    .single()

  // Fetch deal releases for this partner
  const { data: releasesData, error: releasesError } = await supabase
    .from('deal_releases')
    .select(`
      *,
      deal:deals!inner (
        id,
        qualification_code,
        capital_amount,
        overall_score,
        qualification_score,
        qualification_data,
        notes,
        company:companies!inner (
          id,
          name,
          qualification_data,
          owner:profiles!companies_owner_id_fkey (
            id,
            email,
            full_name
          )
        )
      )
    `)
    .eq('partner_id', partner.id)
    .order('released_at', { ascending: false })

  if (releasesError) {
    console.error('Error fetching releases:', releasesError)
  }

  // Transform the data into the expected format
  const releases: DealWithRelease[] = (releasesData || []).map((r: any) => ({
    release: {
      id: r.id,
      deal_id: r.deal_id,
      partner_id: r.partner_id,
      released_by: r.released_by,
      released_at: r.released_at,
      release_notes: r.release_notes,
      access_level: r.access_level,
      status: r.status,
      first_viewed_at: r.first_viewed_at,
      interest_expressed_at: r.interest_expressed_at,
      passed_at: r.passed_at,
      pass_reason: r.pass_reason,
      partner_notes: r.partner_notes,
      created_at: r.created_at,
      updated_at: r.updated_at
    },
    deal: r.deal
  }))

  // Fetch competition counts - how many other partners are actively reviewing each deal
  const dealIds = releases.map(r => r.deal.id)
  const competitionCounts: Record<string, number> = {}

  if (dealIds.length > 0) {
    const { data: otherReleases } = await supabase
      .from('deal_releases')
      .select('deal_id, partner_id, status')
      .in('deal_id', dealIds)
      .neq('partner_id', partner.id)
      .in('status', ['pending', 'viewed', 'interested', 'reviewing', 'due_diligence'])

    if (otherReleases) {
      for (const release of otherReleases) {
        if (!competitionCounts[release.deal_id]) {
          competitionCounts[release.deal_id] = 0
        }
        competitionCounts[release.deal_id]++
      }
    }
  }

  return (
    <OptmaDashboardClient
      partner={partner}
      initialPreferences={preferences || null}
      initialReleases={releases}
      competitionCounts={competitionCounts}
    />
  )
}

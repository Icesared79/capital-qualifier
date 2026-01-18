import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PartnerDashboardClient from './PartnerDashboardClient'

export default async function PartnerDashboardPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // User's role should match the partner slug (or be admin)
  const isAdmin = profile?.role === 'admin'
  const isPartnerUser = profile?.role === params.slug

  if (!isAdmin && !isPartnerUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            You don't have access to this partner dashboard.
          </p>
        </div>
      </div>
    )
  }

  // Fetch the partner by slug
  const { data: partner, error: partnerError } = await supabase
    .from('funding_partners')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (partnerError || !partner) {
    notFound()
  }

  // Different data fetch based on partner role
  let assignedDeals: any[] = []

  if (partner.partner_role === 'legal') {
    // For legal partners: fetch deals where they're assigned as legal partner
    const { data: deals } = await supabase
      .from('deals')
      .select(`
        id,
        qualification_code,
        stage,
        capital_amount,
        overall_score,
        legal_status,
        legal_notes,
        created_at,
        updated_at,
        company:companies (
          id,
          name,
          qualification_data
        )
      `)
      .eq('legal_partner_id', partner.id)
      .order('updated_at', { ascending: false })

    assignedDeals = deals || []
  } else {
    // For funding partners: fetch deal releases
    const { data: releases } = await supabase
      .from('deal_releases')
      .select(`
        id,
        status,
        access_level,
        released_at,
        partner_notes,
        deal:deals (
          id,
          qualification_code,
          stage,
          capital_amount,
          overall_score,
          created_at,
          company:companies (
            id,
            name,
            qualification_data
          )
        )
      `)
      .eq('partner_id', partner.id)
      .order('released_at', { ascending: false })

    assignedDeals = (releases || []).map(r => ({
      ...r.deal,
      releaseStatus: r.status,
      accessLevel: r.access_level,
      releasedAt: r.released_at,
      partnerNotes: r.partner_notes,
    }))
  }

  return (
    <PartnerDashboardClient
      partner={partner}
      deals={assignedDeals}
      isAdmin={isAdmin}
    />
  )
}

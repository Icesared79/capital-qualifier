import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TeamDealsList from '@/components/admin/TeamDealsList'
import { DealWithCompany } from '@/lib/types'

export default async function LegalDashboardPage() {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify legal role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'legal') {
    redirect('/dashboard')
  }

  // Fetch deals handed off to legal (using RLS policy)
  const { data: deals, error: dealsError } = await supabase
    .from('deals')
    .select(`
      id,
      qualification_code,
      stage,
      assigned_to,
      internal_notes,
      handoff_to,
      handed_off_at,
      handed_off_by,
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
    `)
    .eq('handoff_to', 'legal')
    .order('handed_off_at', { ascending: false })

  if (dealsError) {
    console.error('Error fetching deals:', dealsError)
  }

  const handedOffDeals = (deals || []) as DealWithCompany[]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Legal Review Queue
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
          {handedOffDeals.length} deal{handedOffDeals.length !== 1 ? 's' : ''} assigned to legal team
        </p>
      </div>

      {/* Deals List */}
      <TeamDealsList
        deals={handedOffDeals}
        teamType="legal"
        userId={user.id}
      />
    </div>
  )
}

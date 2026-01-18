import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { DealWithCompany, PipelineCounts, FundingApplicationStage } from '@/lib/types'

export default async function AdminPage() {
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

  // Fetch all deals with company and owner info using admin client (bypasses RLS)
  const { data: deals, error: dealsError } = await adminClient
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
    `)
    .order('updated_at', { ascending: false })

  if (dealsError) {
    console.error('Error fetching deals:', dealsError)
  }

  // Calculate pipeline counts
  const pipelineCounts: PipelineCounts = {
    draft: 0,
    qualified: 0,
    documents_requested: 0,
    documents_in_review: 0,
    due_diligence: 0,
    term_sheet: 0,
    negotiation: 0,
    closing: 0,
    funded: 0,
    declined: 0,
    withdrawn: 0,
  }

  if (deals) {
    deals.forEach((deal: any) => {
      const stage = deal.stage as FundingApplicationStage
      if (stage in pipelineCounts) {
        pipelineCounts[stage]++
      }
    })
  }

  // Get recent deals (last 10 updated)
  const recentDeals = (deals || []).slice(0, 10) as DealWithCompany[]

  // Fetch team members for assignment
  const { data: teamMembers } = await adminClient
    .from('profiles')
    .select('id, email, full_name, role')
    .in('role', ['admin', 'legal', 'optma'])

  return (
    <AdminDashboard
      pipelineCounts={pipelineCounts}
      recentDeals={recentDeals}
      teamMembers={teamMembers || []}
      totalDeals={deals?.length || 0}
    />
  )
}

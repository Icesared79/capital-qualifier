import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PartnersListClient from './PartnersListClient'

export default async function PartnersPage() {
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

  // Get all partners
  const { data: partners, error } = await supabase
    .from('funding_partners')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching partners:', error)
  }

  // Get deal counts per partner
  const { data: dealCounts } = await supabase
    .from('deal_releases')
    .select('partner_id, status')

  // Calculate stats per partner
  const partnerStats: Record<string, { total: number; active: number; funded: number }> = {}

  if (dealCounts) {
    for (const release of dealCounts) {
      if (!partnerStats[release.partner_id]) {
        partnerStats[release.partner_id] = { total: 0, active: 0, funded: 0 }
      }
      partnerStats[release.partner_id].total++
      if (['pending', 'viewed', 'interested', 'reviewing', 'due_diligence'].includes(release.status)) {
        partnerStats[release.partner_id].active++
      }
      if (release.status === 'funded') {
        partnerStats[release.partner_id].funded++
      }
    }
  }

  return (
    <PartnersListClient
      partners={partners || []}
      partnerStats={partnerStats}
    />
  )
}

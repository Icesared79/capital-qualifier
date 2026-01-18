import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PartnerEditClient from './PartnerEditClient'

export default async function PartnerEditPage({
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

  // Get partner's deal stats
  const { data: dealReleases } = await supabase
    .from('deal_releases')
    .select('status')
    .eq('partner_id', partner.id)

  const stats = {
    total: dealReleases?.length || 0,
    active: dealReleases?.filter(d =>
      ['pending', 'viewed', 'interested', 'reviewing', 'due_diligence'].includes(d.status)
    ).length || 0,
    funded: dealReleases?.filter(d => d.status === 'funded').length || 0
  }

  return (
    <PartnerEditClient
      partner={partner}
      stats={stats}
    />
  )
}

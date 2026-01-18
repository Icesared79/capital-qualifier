import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PartnerProfileClient from './PartnerProfileClient'

export default async function PartnerProfilePage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify optma or admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'optma' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get partner data
  const { data: partner } = await supabase
    .from('funding_partners')
    .select('*')
    .eq('slug', 'optima')
    .single()

  if (!partner) {
    // Try to get any active partner
    const { data: altPartner } = await supabase
      .from('funding_partners')
      .select('*')
      .eq('status', 'active')
      .limit(1)
      .single()

    if (!altPartner) {
      redirect('/dashboard/optma')
    }

    return <PartnerProfileClient partner={altPartner} />
  }

  return <PartnerProfileClient partner={partner} />
}

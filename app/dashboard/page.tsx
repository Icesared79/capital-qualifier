import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user's companies and deals
  const { data: companies } = await supabase
    .from('companies')
    .select(`
      *,
      deals (
        *
      )
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <DashboardClient
      user={user}
      profile={profile}
      companies={companies || []}
    />
  )
}

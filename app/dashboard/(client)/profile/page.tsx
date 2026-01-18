import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user's company with qualification data
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const company = companies?.[0] || null

  return <ProfileClient user={user} profile={profile} company={company} />
}

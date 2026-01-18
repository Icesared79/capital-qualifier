import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import OptmaLayoutClient from './OptmaLayoutClient'

export default async function OptmaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is optma team or admin (admin can access for testing)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'optma' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <OptmaLayoutClient
      userName={profile?.full_name || user.email?.split('@')[0] || 'User'}
    >
      {children}
    </OptmaLayoutClient>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClientPortalLayout from '@/components/client/ClientPortalLayout'

export default async function ClientDashboardLayout({
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

  // Get user profile to check admin status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  return (
    <ClientPortalLayout
      user={{ id: user.id, email: user.email || '' }}
      isAdmin={isAdmin}
    >
      {children}
    </ClientPortalLayout>
  )
}

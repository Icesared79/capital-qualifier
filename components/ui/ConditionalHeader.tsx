'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from './Header'
import Footer from './Footer'

export function ConditionalHeader() {
  const pathname = usePathname()
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user ? { email: user.email || '' } : null)
      setLoading(false)
    }
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ? { email: session.user.email || '' } : null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Don't show the main header on pages that have their own header
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/auth')) {
    return null
  }

  // Show header without user while loading to prevent flash
  if (loading) {
    return <Header user={null} />
  }

  return <Header user={user} />
}

export function ConditionalFooter() {
  const pathname = usePathname()

  // Don't show footer on pages with their own layout
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/auth')) {
    return null
  }

  return <Footer />
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import NotificationBell from '@/components/ui/NotificationBell'
import ClientSidebar from '@/components/client/ClientSidebar'

interface ClientPortalLayoutProps {
  children: React.ReactNode
  user: {
    id: string
    email: string
  }
  isAdmin?: boolean
}

export default function ClientPortalLayout({ children, user, isAdmin = false }: ClientPortalLayoutProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Badge */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center">
                <img src="/logo.svg" alt="BitCense" className="h-7 dark:invert" />
              </Link>
              <span className="px-3 py-1 text-xs font-bold bg-gray-900 dark:bg-gray-700 text-white rounded-lg">
                Client Portal
              </span>
            </div>

            {/* Right: User + Actions */}
            <div className="flex items-center gap-4">
              <NotificationBell userId={user.id} />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:inline">
                {user.email}
              </span>
              <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Go to Homepage"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:inline">Home</span>
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">{loggingOut ? '...' : 'Sign Out'}</span>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Layout with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <ClientSidebar isAdmin={isAdmin} />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 min-h-[calc(100vh-57px)]">
          {children}
        </main>
      </div>
    </div>
  )
}

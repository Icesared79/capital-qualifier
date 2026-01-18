import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import LegalSidebar from '@/components/legal/LegalSidebar'

// Prevent caching to ensure fresh auth state
export const dynamic = 'force-dynamic'

export default async function LegalLayout({
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

  // Check if user is legal team
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'legal') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Header */}
      <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Badge */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center">
                <img src="/logo.svg" alt="BitCense" className="h-7 dark:invert" />
              </Link>
              <span className="px-3 py-1 text-xs font-bold bg-gray-900 dark:bg-gray-700 text-white rounded-lg">
                Legal Portal
              </span>
            </div>

            {/* Right: User + Actions */}
            <div className="flex items-center gap-4">
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
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Layout with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        <LegalSidebar />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 min-h-[calc(100vh-57px)]">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

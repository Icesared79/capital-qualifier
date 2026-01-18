'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import TermsModal from '@/components/legal/TermsModal'

function TermsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const next = searchParams.get('next') || '/dashboard'

  const [isModalOpen, setIsModalOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Check if user is authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Not authenticated, redirect to login
        router.push('/auth?mode=login')
        return
      }
      setUser(user)
      setLoading(false)
    }

    checkUser()
  }, [supabase, router])

  const handleAccept = () => {
    setIsModalOpen(false)
    // Redirect to the next page
    router.push(next)
    router.refresh()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth?mode=login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img src="/logo.svg" alt="BitCense" className="h-8 dark:invert" />
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-73px)] px-6 py-12">
        <div className="w-full max-w-lg text-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Accept Terms of Service
            </h1>

            <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
              Welcome! Before you continue, please review and accept our Terms of Service.
            </p>

            {user && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                Signed in as <span className="font-medium text-gray-700 dark:text-gray-300">{user.email}</span>
              </p>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full px-6 py-4 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-xl transition-colors"
            >
              Review Terms of Service
            </button>
          </div>
        </div>
      </main>

      {/* Terms Modal - Blocking mode */}
      <TermsModal
        documentType="platform_tos"
        contextType="signup"
        isOpen={isModalOpen}
        onClose={() => {}} // Can't close without accepting
        onAccept={handleAccept}
        blocking={true}
      />
    </div>
  )
}

export default function TermsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    }>
      <TermsPageContent />
    </Suspense>
  )
}

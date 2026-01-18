'use client'

import Link from 'next/link'
import { useTheme } from '@/lib/ThemeContext'
import { Moon, Sun, ArrowLeft, BadgeCheck, Shield, Sparkles } from 'lucide-react'

interface OptmaLayoutClientProps {
  userName: string
  children: React.ReactNode
}

export default function OptmaLayoutClient({ userName, children }: OptmaLayoutClientProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Header */}
      <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Badge */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center">
                <img src="/logo.svg" alt="BitCense" className="h-8 dark:invert" />
              </Link>

              {/* Verified Partner Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-lg shadow-purple-500/25">
                <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full">
                  <BadgeCheck className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-bold text-white tracking-wide">
                  Verified Partner
                </span>
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </div>
            </div>

            {/* Center: Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/dashboard/optma"
                className="text-base font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                My Deals
              </Link>
              <Link
                href="/dashboard/optma/profile"
                className="text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Company Profile
              </Link>
            </nav>

            {/* Right: Theme Toggle + User */}
            <div className="flex items-center gap-4">
              {/* Back to Admin (for admin users) */}
              <Link
                href="/dashboard/admin"
                className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Admin
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle dark mode"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-500" />
                )}
              </button>

              {/* User Info */}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Funding Partner</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

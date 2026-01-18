'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

interface HeaderProps {
  user?: {
    email: string
  } | null
}

export default function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.svg"
              alt="BitCense"
              width={140}
              height={40}
              className="dark:invert"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-base font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side - CTA + Theme Toggle */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="text-base font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {loggingOut ? '...' : 'Sign Out'}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth?mode=login"
                  className="text-base font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/apply"
                  className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pt-4 pb-2 border-t-2 border-gray-200 dark:border-gray-700 mt-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors py-3 px-2 rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold px-5 py-3 rounded-lg transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleLogout()
                    }}
                    disabled={loggingOut}
                    className="text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors py-3 px-2 rounded-lg mt-2"
                  >
                    {loggingOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth?mode=login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors py-3 px-2 rounded-lg"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/apply"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold px-5 py-3 rounded-lg transition-colors mt-2"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

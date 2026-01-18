'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  FolderOpen,
  PlusCircle,
  BookOpen,
  Menu,
  X
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />
      }
    ]
  },
  {
    title: 'Capital',
    items: [
      {
        label: 'New Offering',
        href: '/dashboard/apply',
        icon: <PlusCircle className="w-5 h-5" />
      },
      {
        label: 'Documents',
        href: '/dashboard/documents',
        icon: <FolderOpen className="w-5 h-5" />
      }
    ]
  },
  {
    title: 'Account',
    items: [
      {
        label: 'Business Profile',
        href: '/dashboard/profile',
        icon: <Building2 className="w-5 h-5" />
      }
    ]
  },
  {
    title: 'Resources',
    items: [
      {
        label: 'Guides',
        href: '/dashboard/guides',
        icon: <BookOpen className="w-5 h-5" />
      }
    ]
  }
]

interface ClientSidebarProps {
  isAdmin?: boolean
}

export default function ClientSidebar({ isAdmin = false }: ClientSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const NavContent = () => (
    <nav className="p-4 space-y-6">
      {navGroups.map((group) => (
        <div key={group.title}>
          <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {group.title}
          </h3>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Admin Access - Only show if user is admin */}
      {isAdmin && (
        <div>
          <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Admin
          </h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/dashboard/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Console
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-gray-900 text-white rounded-full shadow-lg"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r-2 border-gray-200 dark:border-gray-700 min-h-[calc(100vh-57px)] sticky top-[57px]">
        <NavContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`lg:hidden fixed left-0 top-[57px] bottom-0 w-72 bg-white dark:bg-gray-800 border-r-2 border-gray-200 dark:border-gray-700 z-40 transform transition-transform duration-300 overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>
    </>
  )
}

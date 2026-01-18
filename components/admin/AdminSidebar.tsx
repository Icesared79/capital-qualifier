'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Settings,
  Database,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Scale,
  DollarSign,
  ClipboardList,
  Activity,
  Sparkles,
  Menu,
  X,
  BookOpen,
  FileCheck,
  ShieldCheck
} from 'lucide-react'

interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  children?: { label: string; href: string }[]
}

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard/admin',
        icon: <LayoutDashboard className="w-5 h-5" />
      }
    ]
  },
  {
    title: 'Pipeline',
    items: [
      {
        label: 'All Deals',
        href: '/dashboard/admin/deals',
        icon: <FileText className="w-5 h-5" />
      },
      {
        label: 'Analytics',
        href: '/dashboard/admin/scoring',
        icon: <Sparkles className="w-5 h-5" />
      }
    ]
  },
  {
    title: 'Network',
    items: [
      {
        label: 'Partners',
        icon: <Building2 className="w-5 h-5" />,
        children: [
          { label: 'All Partners', href: '/dashboard/admin/partners' },
          { label: 'Funding Partners', href: '/dashboard/admin/partners?role=funding' },
          { label: 'Legal Partners', href: '/dashboard/admin/partners?role=legal' }
        ]
      },
      {
        label: 'Team',
        href: '/dashboard/admin/team',
        icon: <Users className="w-5 h-5" />
      }
    ]
  },
  {
    title: 'Configuration',
    items: [
      {
        label: 'Fee Catalog',
        href: '/dashboard/admin/config/fees',
        icon: <DollarSign className="w-5 h-5" />
      },
      {
        label: 'Document Checklist',
        href: '/dashboard/admin/config/checklist',
        icon: <ClipboardList className="w-5 h-5" />
      },
      {
        label: 'Terms & Legal',
        href: '/dashboard/admin/config/terms',
        icon: <FileCheck className="w-5 h-5" />
      }
    ]
  },
  {
    title: 'Resources',
    items: [
      {
        label: 'Deal Flow Guides',
        href: '/dashboard/guides',
        icon: <BookOpen className="w-5 h-5" />
      }
    ]
  },
  {
    title: 'System',
    items: [
      {
        label: 'Migrations',
        href: '/dashboard/admin/system/migrations',
        icon: <Database className="w-5 h-5" />
      },
      {
        label: 'Activity Log',
        href: '/dashboard/admin/system/activity',
        icon: <Activity className="w-5 h-5" />
      },
      {
        label: 'Acknowledgements',
        href: '/dashboard/admin/system/acknowledgements',
        icon: <ShieldCheck className="w-5 h-5" />
      }
    ]
  }
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Partners'])
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') {
      return pathname === '/dashboard/admin'
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
                {item.children ? (
                  // Expandable item
                  <div>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        expandedItems.includes(item.label)
                          ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700/50'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </span>
                      {expandedItems.includes(item.label) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {expandedItems.includes(item.label) && (
                      <ul className="mt-1 ml-8 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className={`block px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                isActive(child.href)
                                  ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 font-medium'
                                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  // Regular link
                  <Link
                    href={item.href!}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive(item.href!)
                        ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
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

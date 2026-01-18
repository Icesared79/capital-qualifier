'use client'

import type { PartnerDashboardStats, PartnerDashboardTab } from '@/lib/types'
import {
  Inbox,
  Eye,
  Search,
  XCircle,
  CheckCircle2,
  LayoutDashboard
} from 'lucide-react'

interface PartnerDashboardStatsProps {
  stats: PartnerDashboardStats
  activeTab: PartnerDashboardTab
  onTabChange: (tab: PartnerDashboardTab) => void
}

interface StatCardProps {
  label: string
  count: number
  icon: React.ReactNode
  color: string
  bgColor: string
  isActive: boolean
  onClick: () => void
}

function StatCard({ label, count, icon, color, bgColor, isActive, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-xl text-left transition-all
        ${isActive
          ? 'ring-2 ring-accent shadow-lg'
          : 'hover:shadow-md'
        }
        ${bgColor}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-white/80' : 'bg-white/50'}`}>
          {icon}
        </div>
        <span className={`text-3xl font-bold ${color}`}>{count}</span>
      </div>
      <p className={`text-sm font-medium ${color}`}>{label}</p>
    </button>
  )
}

export default function PartnerDashboardStats({
  stats,
  activeTab,
  onTabChange
}: PartnerDashboardStatsProps) {
  const statCards: {
    tab: PartnerDashboardTab
    label: string
    count: number
    icon: React.ReactNode
    color: string
    bgColor: string
  }[] = [
    {
      tab: 'all',
      label: 'Total Deals',
      count: stats.total,
      icon: <LayoutDashboard className="w-5 h-5 text-gray-600" />,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100 dark:bg-gray-700/50'
    },
    {
      tab: 'new',
      label: 'New',
      count: stats.new,
      icon: <Inbox className="w-5 h-5 text-blue-600" />,
      color: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30'
    },
    {
      tab: 'in_progress',
      label: 'In Progress',
      count: stats.in_progress,
      icon: <Eye className="w-5 h-5 text-amber-600" />,
      color: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/30'
    },
    {
      tab: 'due_diligence',
      label: 'Due Diligence',
      count: stats.due_diligence,
      icon: <Search className="w-5 h-5 text-purple-600" />,
      color: 'text-purple-700 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30'
    },
    {
      tab: 'passed',
      label: 'Passed',
      count: stats.passed,
      icon: <XCircle className="w-5 h-5 text-gray-500" />,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-700/50'
    },
    {
      tab: 'funded',
      label: 'Funded',
      count: stats.funded,
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      color: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((card) => (
        <StatCard
          key={card.tab}
          label={card.label}
          count={card.count}
          icon={card.icon}
          color={card.color}
          bgColor={card.bgColor}
          isActive={activeTab === card.tab}
          onClick={() => onTabChange(card.tab)}
        />
      ))}
    </div>
  )
}

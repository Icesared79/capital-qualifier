'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Activity,
  User,
  FileText,
  Building2,
  DollarSign,
  Settings,
  Search,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

interface ActivityItem {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
  user_email?: string
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'deal': <FileText className="w-4 h-4" />,
  'partner': <Building2 className="w-4 h-4" />,
  'user': <User className="w-4 h-4" />,
  'fee': <DollarSign className="w-4 h-4" />,
  'config': <Settings className="w-4 h-4" />
}

const ACTION_COLORS: Record<string, string> = {
  'create': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  'update': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  'delete': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  'view': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  'login': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [entityFilter, setEntityFilter] = useState<string>('all')

  const supabase = createClient()

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error loading activities:', error)
      setActivities([])
    } else {
      setActivities(data || [])
    }
    setLoading(false)
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchTerm === '' ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.entity_type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEntity = entityFilter === 'all' || activity.entity_type === entityFilter

    return matchesSearch && matchesEntity
  })

  const getActionColor = (action: string) => {
    const actionType = action.split('_')[0]
    return ACTION_COLORS[actionType] || ACTION_COLORS['view']
  }

  const getEntityIcon = (entityType: string) => {
    return ACTION_ICONS[entityType] || <Activity className="w-4 h-4" />
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const entityTypes = [...new Set(activities.map(a => a.entity_type))]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-purple-600" />
            Activity Log
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            System-wide activity and audit trail
          </p>
        </div>
        <button
          onClick={loadActivities}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
          >
            <option value="all">All Entities</option>
            {entityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-3">Loading activities...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Activity Logged Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The activity log table needs to be created first.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Run the activity log migration from the Migrations page to enable this feature.
          </p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No activities match your filters.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredActivities.map(activity => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getActionColor(activity.action)}`}>
                    {getEntityIcon(activity.entity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {activity.action.replace(/_/g, ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {activity.entity_type}
                      </span>
                    </div>
                    {activity.entity_id && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        ID: {activity.entity_id}
                      </p>
                    )}
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(activity.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(activity.created_at)}
                    </p>
                    {activity.ip_address && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {activity.ip_address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing the last 100 activities. Activity logging captures important system events including deal updates, partner changes, and configuration modifications.
        </p>
      </div>
    </div>
  )
}

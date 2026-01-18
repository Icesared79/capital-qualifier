'use client'

import { useState, useEffect } from 'react'
import { TermsAcknowledgement, TermsDocumentType, TermsContextType } from '@/lib/types'
import {
  FileText,
  Loader2,
  Search,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  X
} from 'lucide-react'

const documentTypeLabels: Record<TermsDocumentType, { label: string; color: string }> = {
  platform_tos: { label: 'Platform ToS', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  originator_agreement: { label: 'Originator Agreement', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  offering_certification: { label: 'Offering Certification', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  partner_network_agreement: { label: 'Partner Network', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  deal_confidentiality: { label: 'Deal Confidentiality', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
}

const contextTypeLabels: Record<TermsContextType, string> = {
  signup: 'Account Signup',
  first_offering: 'First Offering',
  offering_submission: 'Offering Submission',
  partner_onboarding: 'Partner Onboarding',
  deal_interest: 'Deal Interest',
}

interface StatsData {
  total_unique_users: number
  acknowledgements_last_24h: number
  stats: Array<{
    document_id: string
    document_type: TermsDocumentType
    title: string
    is_active: boolean
    acknowledgement_count: number
  }>
}

export default function AcknowledgementsPage() {
  const [acknowledgements, setAcknowledgements] = useState<TermsAcknowledgement[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedAck, setSelectedAck] = useState<TermsAcknowledgement | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const perPage = 50

  // Filters
  const [filters, setFilters] = useState({
    document_type: '',
    context_type: '',
    date_from: '',
    date_to: '',
    search: '',
  })

  useEffect(() => {
    loadAcknowledgements()
    loadStats()
  }, [page])

  async function loadAcknowledgements() {
    setLoading(true)

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    })

    if (filters.document_type) params.append('document_type', filters.document_type)
    if (filters.context_type) params.append('context_type', filters.context_type)
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.search) params.append('search', filters.search)

    const response = await fetch(`/api/admin/acknowledgements?${params}`)
    if (response.ok) {
      const data = await response.json()
      setAcknowledgements(data.acknowledgements || [])
      setTotalPages(data.pagination?.total_pages || 1)
      setTotal(data.pagination?.total || 0)
    }

    setLoading(false)
  }

  async function loadStats() {
    const response = await fetch('/api/admin/acknowledgements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stats' }),
    })

    if (response.ok) {
      const data = await response.json()
      setStats(data)
    }
  }

  function handleSearch() {
    setPage(1)
    loadAcknowledgements()
  }

  function clearFilters() {
    setFilters({
      document_type: '',
      context_type: '',
      date_from: '',
      date_to: '',
      search: '',
    })
    setPage(1)
    setTimeout(loadAcknowledgements, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acknowledgements Audit Log</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track all terms acceptances across the platform
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_unique_users}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Unique Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.acknowledgements_last_24h}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last 24 Hours</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Records</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.stats.filter(s => s.is_active).length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active Documents</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-9 pr-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-gray-400 focus:ring-0 text-sm"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
              showFilters
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Search
          </button>

          {(filters.document_type || filters.context_type || filters.date_from || filters.date_to) && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Document Type</label>
              <select
                value={filters.document_type}
                onChange={(e) => setFilters(prev => ({ ...prev, document_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-gray-400 focus:ring-0"
              >
                <option value="">All Types</option>
                {(Object.keys(documentTypeLabels) as TermsDocumentType[]).map(type => (
                  <option key={type} value={type}>{documentTypeLabels[type].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Context</label>
              <select
                value={filters.context_type}
                onChange={(e) => setFilters(prev => ({ ...prev, context_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-gray-400 focus:ring-0"
              >
                <option value="">All Contexts</option>
                {(Object.keys(contextTypeLabels) as TermsContextType[]).map(type => (
                  <option key={type} value={type}>{contextTypeLabels[type]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-gray-400 focus:ring-0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-gray-400 focus:ring-0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Acknowledgements List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : acknowledgements.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
          <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No acknowledgements found</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Document</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Context</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Verified</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {acknowledgements.map((ack) => {
                  const docType = (ack.terms_document as any)?.document_type as TermsDocumentType
                  const typeConfig = docType ? documentTypeLabels[docType] : null

                  return (
                    <tr key={ack.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {(ack.user as any)?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(ack.user as any)?.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {typeConfig ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Unknown</span>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          v{(ack.terms_document as any)?.version}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {contextTypeLabels[ack.context_type] || ack.context_type}
                        </span>
                        {ack.context_entity_id && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[150px]">
                            ID: {ack.context_entity_id.slice(0, 8)}...
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(ack.acknowledged_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(ack.acknowledged_at).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {ack.checkbox_confirmed && (
                            <span className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center" title="Checkbox confirmed">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            </span>
                          )}
                          {ack.scrolled_to_bottom && (
                            <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center" title="Scrolled to bottom">
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setSelectedAck(ack); setShowDetail(true) }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetail && selectedAck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowDetail(false); setSelectedAck(null) }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Acknowledgement Details</h3>
              <button
                onClick={() => { setShowDetail(false); setSelectedAck(null) }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">User</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {(selectedAck.user as any)?.full_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">{(selectedAck.user as any)?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Acknowledged At</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(selectedAck.acknowledged_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Document</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {(selectedAck.terms_document as any)?.title}
                  </p>
                  <p className="text-xs text-gray-500">Version {(selectedAck.terms_document as any)?.version}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Context</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {contextTypeLabels[selectedAck.context_type]}
                  </p>
                </div>
              </div>

              {selectedAck.context_entity_id && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Entity ID</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedAck.context_entity_id}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Checkbox Confirmed</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedAck.checkbox_confirmed ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Scrolled to Bottom</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedAck.scrolled_to_bottom ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">IP Address</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedAck.ip_address || 'Not recorded'}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">User Agent</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={selectedAck.user_agent || ''}>
                  {selectedAck.user_agent || 'Not recorded'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

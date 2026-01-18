'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FundingPartner, PartnerRole } from '@/lib/types'
import {
  Building2,
  Plus,
  Search,
  BadgeCheck,
  TrendingUp,
  DollarSign,
  MapPin,
  Globe,
  MoreVertical,
  Edit3,
  Eye,
  Trash2,
  Users,
  Briefcase,
  ArrowLeft,
  Sparkles,
  Scale,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  Gavel,
  Coins
} from 'lucide-react'

interface PartnersListClientProps {
  partners: FundingPartner[]
  partnerStats: Record<string, { total: number; active: number; funded: number }>
}

const PARTNER_TYPE_LABELS: Record<string, string> = {
  institutional: 'Institutional',
  family_office: 'Family Office',
  private_credit: 'Private Credit',
  hedge_fund: 'Hedge Fund',
  bank: 'Bank',
  other: 'Other'
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  inactive: { label: 'Inactive', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  pending: { label: 'Pending', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' }
}

export default function PartnersListClient({ partners, partnerStats }: PartnersListClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | PartnerRole>('all')

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter
    const matchesRole = roleFilter === 'all' || partner.partner_role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  // Count by role
  const fundingCount = partners.filter(p => p.partner_role === 'funding' || !p.partner_role).length
  const legalCount = partners.filter(p => p.partner_role === 'legal').length
  const tokenizationCount = partners.filter(p => p.partner_role === 'tokenization').length

  // Calculate totals
  const totalDeals = Object.values(partnerStats).reduce((sum, s) => sum + s.total, 0)
  const totalFunded = Object.values(partnerStats).reduce((sum, s) => sum + s.funded, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Partner Network
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
              {fundingCount} funding · {tokenizationCount} tokenization · {legalCount} legal
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Partner
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{partners.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Partners</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {partners.filter(p => p.status === 'active').length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDeals}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Deals Released</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalFunded}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Deals Funded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setRoleFilter('all')}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
            roleFilter === 'all'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          All Partners
        </button>
        <button
          onClick={() => setRoleFilter('funding')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
            roleFilter === 'funding'
              ? 'bg-emerald-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <Banknote className="w-4 h-4" />
          Funding ({fundingCount})
        </button>
        <button
          onClick={() => setRoleFilter('tokenization')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
            roleFilter === 'tokenization'
              ? 'bg-purple-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <Coins className="w-4 h-4" />
          Tokenization ({tokenizationCount})
        </button>
        <button
          onClick={() => setRoleFilter('legal')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
            roleFilter === 'legal'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <Gavel className="w-4 h-4" />
          Legal ({legalCount})
        </button>
      </div>

      {/* Search and Status Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search partners..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive', 'pending'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPartners.length === 0 ? (
          <div className="col-span-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No partners found' : 'No partners yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? 'Try a different search term' : 'Add funding or legal partners to your network'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Partner
              </button>
            )}
          </div>
        ) : (
          filteredPartners.map(partner => {
            const stats = partnerStats[partner.id] || { total: 0, active: 0, funded: 0 }
            const statusConfig = STATUS_CONFIG[partner.status] || STATUS_CONFIG.pending

            return (
              <div
                key={partner.id}
                className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      {partner.logo_url ? (
                        <img src={partner.logo_url} alt={partner.name} className="w-10 h-10 object-contain" />
                      ) : (
                        <Building2 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {partner.name}
                        </h3>
                        {/* Role Badge */}
                        {partner.partner_role === 'legal' ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <Gavel className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Legal</span>
                          </div>
                        ) : partner.partner_role === 'tokenization' ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                            <Coins className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Tokenization</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                            <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Funding</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {PARTNER_TYPE_LABELS[partner.partner_type] || partner.partner_type}
                      </p>
                      {partner.website && (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mt-1 transition-colors"
                        >
                          <Globe className="w-3 h-3" />
                          {partner.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 bg-gray-50 dark:bg-gray-700/30">
                  <div className="p-3 text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Deals</p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.active}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.funded}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Funded</p>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {partner.can_tokenize && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">
                        <Sparkles className="w-3 h-3" />
                        Tokenization
                      </span>
                    )}
                    {partner.has_legal_team && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                        <Scale className="w-3 h-3" />
                        Legal Team
                      </span>
                    )}
                    {partner.provides_spv_formation && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                        <Shield className="w-3 h-3" />
                        SPV Formation
                      </span>
                    )}
                    {partner.focus_asset_classes && partner.focus_asset_classes.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs font-medium">
                        <TrendingUp className="w-3 h-3" />
                        {partner.focus_asset_classes.length} asset classes
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  <Link
                    href={`/dashboard/admin/partners/${partner.slug}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </Link>
                  <Link
                    href={`/dashboard/admin/partners/${partner.slug}/deals`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Deals
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <AddPartnerModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}

function AddPartnerModal({ onClose }: { onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    partner_role: 'funding' as PartnerRole,
    partner_type: 'institutional',
    website: '',
    primary_contact_email: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create partner')
      }

      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create partner')
    } finally {
      setSaving(false)
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setFormData(prev => ({ ...prev, name, slug }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Partner</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Add a funding or legal partner to your network
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Partner Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Partner Role *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, partner_role: 'funding' }))}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all ${
                  formData.partner_role === 'funding'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Banknote className={`w-5 h-5 ${formData.partner_role === 'funding' ? 'text-emerald-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-semibold text-sm ${formData.partner_role === 'funding' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                    Funding
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Capital</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, partner_role: 'tokenization' }))}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all ${
                  formData.partner_role === 'tokenization'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Coins className={`w-5 h-5 ${formData.partner_role === 'tokenization' ? 'text-purple-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-semibold text-sm ${formData.partner_role === 'tokenization' ? 'text-purple-700 dark:text-purple-400' : 'text-gray-900 dark:text-white'}`}>
                    Tokenization
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Issuance</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, partner_role: 'legal' }))}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all ${
                  formData.partner_role === 'legal'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <Gavel className={`w-5 h-5 ${formData.partner_role === 'legal' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-semibold text-sm ${formData.partner_role === 'legal' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    Legal
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sign-off</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Capital Partners"
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug (URL identifier) *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="acme-capital"
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Used for URLs and user roles
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Partner Type *
            </label>
            <select
              value={formData.partner_type}
              onChange={(e) => setFormData(prev => ({ ...prev, partner_type: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            >
              <option value="institutional">Institutional Investor</option>
              <option value="family_office">Family Office</option>
              <option value="private_credit">Private Credit Fund</option>
              <option value="hedge_fund">Hedge Fund</option>
              <option value="bank">Bank / Financial Institution</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://www.example.com"
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.primary_contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_email: e.target.value }))}
              placeholder="contact@example.com"
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FundingPartner } from '@/lib/types'
import {
  ArrowLeft,
  Building2,
  Save,
  Globe,
  Mail,
  Phone,
  User,
  Sparkles,
  Scale,
  Shield,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react'

interface PartnerEditClientProps {
  partner: FundingPartner
  stats: { total: number; active: number; funded: number }
}

const PARTNER_TYPE_OPTIONS = [
  { value: 'institutional', label: 'Institutional Investor' },
  { value: 'family_office', label: 'Family Office' },
  { value: 'private_credit', label: 'Private Credit Fund' },
  { value: 'hedge_fund', label: 'Hedge Fund' },
  { value: 'bank', label: 'Bank / Financial Institution' },
  { value: 'other', label: 'Other' }
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'text-green-600' },
  { value: 'inactive', label: 'Inactive', color: 'text-gray-600' },
  { value: 'pending', label: 'Pending Review', color: 'text-amber-600' }
]

const ASSET_CLASS_OPTIONS = [
  'Consumer Loans',
  'Auto Loans',
  'Mortgage/HELOC',
  'Equipment Leasing',
  'Real Estate',
  'SBA Loans',
  'Commercial RE',
  'MCA/Revenue Based',
  'Invoice Factoring',
  'Crypto/DeFi'
]

const GEOGRAPHY_OPTIONS = [
  'United States',
  'Canada',
  'Europe',
  'Asia Pacific',
  'Latin America',
  'Global'
]

export default function PartnerEditClient({ partner, stats }: PartnerEditClientProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [formData, setFormData] = useState({
    name: partner.name || '',
    slug: partner.slug || '',
    description: partner.description || '',
    logo_url: partner.logo_url || '',
    website: partner.website || '',
    partner_type: partner.partner_type || 'institutional',
    status: partner.status || 'active',
    primary_contact_name: partner.primary_contact_name || '',
    primary_contact_email: partner.primary_contact_email || '',
    primary_contact_phone: partner.primary_contact_phone || '',
    focus_asset_classes: partner.focus_asset_classes || [],
    min_deal_size: partner.min_deal_size || '',
    max_deal_size: partner.max_deal_size || '',
    geographic_focus: partner.geographic_focus || [],
    can_tokenize: partner.can_tokenize || false,
    has_legal_team: partner.has_legal_team || false,
    provides_spv_formation: partner.provides_spv_formation || false
  })

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const response = await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save changes')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete partner')
      }

      window.location.href = '/dashboard/admin/partners'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete partner')
      setShowDeleteConfirm(false)
    }
  }

  const toggleArrayValue = (field: 'focus_asset_classes' | 'geographic_focus', value: string) => {
    setFormData(prev => {
      const current = prev[field] || []
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v: string) => v !== value) }
      } else {
        return { ...prev, [field]: [...current, value] }
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/partners"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt={formData.name} className="w-8 h-8 object-contain" />
              ) : (
                <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {formData.name || 'Edit Partner'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.total} deals released · {stats.funded} funded
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Partner Type
            </label>
            <select
              value={formData.partner_type}
              onChange={(e) => setFormData(prev => ({ ...prev, partner_type: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            >
              {PARTNER_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
              placeholder="Brief description of the partner..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Globe className="w-4 h-4 inline mr-1" />
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://..."
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
              placeholder="https://..."
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Primary Contact */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Primary Contact</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Name
            </label>
            <input
              type="text"
              value={formData.primary_contact_name}
              onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_name: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={formData.primary_contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_email: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone
            </label>
            <input
              type="tel"
              value={formData.primary_contact_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_phone: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Investment Focus */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Investment Focus</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Asset Classes
            </label>
            <div className="flex flex-wrap gap-2">
              {ASSET_CLASS_OPTIONS.map(asset => (
                <button
                  key={asset}
                  type="button"
                  onClick={() => toggleArrayValue('focus_asset_classes', asset)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.focus_asset_classes?.includes(asset)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {asset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum Deal Size
              </label>
              <input
                type="text"
                value={formData.min_deal_size}
                onChange={(e) => setFormData(prev => ({ ...prev, min_deal_size: e.target.value }))}
                placeholder="e.g., $1M"
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maximum Deal Size
              </label>
              <input
                type="text"
                value={formData.max_deal_size}
                onChange={(e) => setFormData(prev => ({ ...prev, max_deal_size: e.target.value }))}
                placeholder="e.g., $50M"
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Geographic Focus
            </label>
            <div className="flex flex-wrap gap-2">
              {GEOGRAPHY_OPTIONS.map(geo => (
                <button
                  key={geo}
                  type="button"
                  onClick={() => toggleArrayValue('geographic_focus', geo)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.geographic_focus?.includes(geo)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {geo}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Capabilities</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
            <input
              type="checkbox"
              checked={formData.can_tokenize}
              onChange={(e) => setFormData(prev => ({ ...prev, can_tokenize: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-gray-900 dark:text-white">Tokenization</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
            <input
              type="checkbox"
              checked={formData.has_legal_team}
              onChange={(e) => setFormData(prev => ({ ...prev, has_legal_team: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-gray-900 dark:text-white">Legal Team</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
            <input
              type="checkbox"
              checked={formData.provides_spv_formation}
              onChange={(e) => setFormData(prev => ({ ...prev, provides_spv_formation: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="font-medium text-gray-900 dark:text-white">SPV Formation</span>
            </div>
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-900/50 rounded-xl p-6">
        <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Permanently delete this partner and all associated data. This action cannot be undone.
        </p>

        {showDeleteConfirm ? (
          <div className="flex items-center gap-3">
            <span className="text-red-600 dark:text-red-400 font-medium">Are you sure?</span>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Yes, Delete Partner
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:border-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Partner
          </button>
        )}
      </div>
    </div>
  )
}

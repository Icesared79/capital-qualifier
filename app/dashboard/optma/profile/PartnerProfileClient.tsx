'use client'

import { useState, useEffect } from 'react'
import { FundingPartner } from '@/lib/types'
import {
  BadgeCheck,
  Building2,
  Globe,
  Mail,
  Phone,
  User,
  MapPin,
  DollarSign,
  Shield,
  Sparkles,
  Edit3,
  Save,
  X,
  Loader2,
  Camera,
  Link as LinkIcon,
  Briefcase,
  Scale,
  FileText,
  CheckCircle2,
  Calendar,
  TrendingUp
} from 'lucide-react'
import TermsModal from '@/components/legal/TermsModal'

interface PartnerProfileClientProps {
  partner: FundingPartner
}

const ASSET_CLASS_LABELS: Record<string, string> = {
  residential_re: 'Residential Real Estate',
  commercial_re: 'Commercial Real Estate',
  consumer_loans: 'Consumer Loans',
  smb_loans: 'SMB Loans',
  auto_loans: 'Auto Loans',
  equipment_finance: 'Equipment Finance',
  factoring: 'Factoring/AR',
  crypto_lending: 'Crypto Lending',
  other: 'Other'
}

const PARTNER_TYPE_LABELS: Record<string, string> = {
  institutional: 'Institutional Investor',
  family_office: 'Family Office',
  private_credit: 'Private Credit Fund',
  hedge_fund: 'Hedge Fund',
  bank: 'Bank / Financial Institution',
  other: 'Other'
}

export default function PartnerProfileClient({ partner: initialPartner }: PartnerProfileClientProps) {
  const [partner, setPartner] = useState(initialPartner)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Terms state
  const [showPartnerAgreement, setShowPartnerAgreement] = useState(false)
  const [checkingTerms, setCheckingTerms] = useState(true)

  // Check if user has accepted Partner Network Agreement on mount
  useEffect(() => {
    const checkTermsAcceptance = async () => {
      try {
        const response = await fetch(`/api/terms/check?document_type=partner_network_agreement&context_entity_id=${partner.id}`)
        if (response.ok) {
          const data = await response.json()
          if (!data.has_accepted) {
            setShowPartnerAgreement(true)
          }
        }
      } catch (e) {
        console.error('Failed to check terms acceptance:', e)
      } finally {
        setCheckingTerms(false)
      }
    }

    checkTermsAcceptance()
  }, [partner.id])

  // Form state
  const [formData, setFormData] = useState({
    name: partner.name || '',
    description: partner.description || '',
    website: partner.website || '',
    primary_contact_name: partner.primary_contact_name || '',
    primary_contact_email: partner.primary_contact_email || '',
    primary_contact_phone: partner.primary_contact_phone || '',
    partner_type: partner.partner_type || 'institutional',
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

    try {
      const response = await fetch('/api/partner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save profile')
      }

      const data = await response.json()
      setPartner(data.partner)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const toggleAssetClass = (value: string) => {
    setFormData(prev => ({
      ...prev,
      focus_asset_classes: prev.focus_asset_classes.includes(value)
        ? prev.focus_asset_classes.filter(v => v !== value)
        : [...prev.focus_asset_classes, value]
    }))
  }

  // Show loading while checking terms
  if (checkingTerms) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Partner Network Agreement Modal */}
      <TermsModal
        documentType="partner_network_agreement"
        contextType="partner_onboarding"
        contextEntityId={partner.id}
        isOpen={showPartnerAgreement}
        onClose={() => {}}
        onAccept={() => setShowPartnerAgreement(false)}
        blocking={true}
      />

      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-2xl overflow-hidden shadow-xl">
        {/* Cover Pattern */}
        <div className="h-32 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

        <div className="px-8 pb-8 -mt-16">
          {/* Logo & Name Row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            {/* Logo */}
            <div className="relative">
              <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
                {partner.logo_url ? (
                  <img src={partner.logo_url} alt={partner.name} className="w-24 h-24 object-contain" />
                ) : (
                  <Building2 className="w-16 h-16 text-gray-400" />
                )}
              </div>
              {editing && (
                <button className="absolute bottom-2 right-2 p-2 bg-purple-600 rounded-full text-white hover:bg-purple-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Name & Badge */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="text-2xl font-bold bg-white/20 text-white placeholder-white/60 px-3 py-1 rounded-lg border border-white/30 focus:outline-none focus:border-white"
                    placeholder="Company Name"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-white">{partner.name}</h1>
                )}

                {/* Verified Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                  <BadgeCheck className="w-4 h-4 text-green-300" />
                  <span className="text-sm font-semibold text-white">Verified Partner</span>
                </div>
              </div>

              <p className="text-purple-100 mt-1">
                {PARTNER_TYPE_LABELS[partner.partner_type] || partner.partner_type}
              </p>

              {partner.website && !editing && (
                <a
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-purple-200 hover:text-white mt-2 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  {partner.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}
            </div>

            {/* Edit Button */}
            <div>
              {editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        name: partner.name || '',
                        description: partner.description || '',
                        website: partner.website || '',
                        primary_contact_name: partner.primary_contact_name || '',
                        primary_contact_email: partner.primary_contact_email || '',
                        primary_contact_phone: partner.primary_contact_phone || '',
                        partner_type: partner.partner_type || 'institutional',
                        focus_asset_classes: partner.focus_asset_classes || [],
                        min_deal_size: partner.min_deal_size || '',
                        max_deal_size: partner.max_deal_size || '',
                        geographic_focus: partner.geographic_focus || [],
                        can_tokenize: partner.can_tokenize || false,
                        has_legal_team: partner.has_legal_team || false,
                        provides_spv_formation: partner.provides_spv_formation || false
                      })
                    }}
                    className="px-4 py-2 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - About & Contact */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              About
            </h2>
            {editing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Tell deal originators about your firm, investment philosophy, and what makes you a great partner..."
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                {partner.description || 'No description added yet. Click "Edit Profile" to add information about your firm.'}
              </p>
            )}
          </div>

          {/* Investment Focus Section */}
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Investment Focus
            </h2>

            {/* Asset Classes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asset Classes
              </label>
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ASSET_CLASS_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleAssetClass(value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        formData.focus_asset_classes.includes(value)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(partner.focus_asset_classes || []).length > 0 ? (
                    partner.focus_asset_classes?.map(ac => (
                      <span key={ac} className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium">
                        {ASSET_CLASS_LABELS[ac] || ac}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">No asset classes specified</span>
                  )}
                </div>
              )}
            </div>

            {/* Deal Size */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Deal Size
                </label>
                {editing ? (
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.min_deal_size}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_deal_size: e.target.value }))}
                      placeholder="e.g., $500K"
                      className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ) : (
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {partner.min_deal_size || '—'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Deal Size
                </label>
                {editing ? (
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.max_deal_size}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_deal_size: e.target.value }))}
                      placeholder="e.g., $50M"
                      className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ) : (
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {partner.max_deal_size || '—'}
                  </p>
                )}
              </div>
            </div>

            {/* Geographic Focus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Geographic Focus
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.geographic_focus.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    geographic_focus: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  placeholder="e.g., United States, North America, Global"
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(partner.geographic_focus || []).length > 0 ? (
                    partner.geographic_focus?.map(geo => (
                      <span key={geo} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {geo}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">No geographic focus specified</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Contact & Capabilities */}
        <div className="space-y-6">
          {/* Contact Card */}
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Primary Contact
            </h2>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.primary_contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_name: e.target.value }))}
                    placeholder="John Smith"
                    className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.primary_contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_email: e.target.value }))}
                    placeholder="john@company.com"
                    className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.primary_contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://www.company.com"
                    className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {partner.primary_contact_name && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">
                        {partner.primary_contact_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{partner.primary_contact_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Primary Contact</p>
                    </div>
                  </div>
                )}
                {partner.primary_contact_email && (
                  <a href={`mailto:${partner.primary_contact_email}`} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                    <Mail className="w-4 h-4" />
                    {partner.primary_contact_email}
                  </a>
                )}
                {partner.primary_contact_phone && (
                  <a href={`tel:${partner.primary_contact_phone}`} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                    <Phone className="w-4 h-4" />
                    {partner.primary_contact_phone}
                  </a>
                )}
                {!partner.primary_contact_name && !partner.primary_contact_email && (
                  <p className="text-gray-400 text-sm">No contact information added yet</p>
                )}
              </div>
            )}
          </div>

          {/* Capabilities Card */}
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              Capabilities
            </h2>

            <div className="space-y-3">
              {editing ? (
                <>
                  <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <span className="font-medium text-gray-900 dark:text-white">Can Tokenize Assets</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.can_tokenize}
                      onChange={(e) => setFormData(prev => ({ ...prev, can_tokenize: e.target.checked }))}
                      className="w-5 h-5 accent-purple-600"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-900 dark:text-white">In-House Legal Team</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.has_legal_team}
                      onChange={(e) => setFormData(prev => ({ ...prev, has_legal_team: e.target.checked }))}
                      className="w-5 h-5 accent-purple-600"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-900 dark:text-white">SPV Formation</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.provides_spv_formation}
                      onChange={(e) => setFormData(prev => ({ ...prev, provides_spv_formation: e.target.checked }))}
                      className="w-5 h-5 accent-purple-600"
                    />
                  </label>
                </>
              ) : (
                <>
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${partner.can_tokenize ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-700/50 opacity-50'}`}>
                    <Sparkles className={`w-5 h-5 ${partner.can_tokenize ? 'text-amber-500' : 'text-gray-400'}`} />
                    <span className={`font-medium ${partner.can_tokenize ? 'text-amber-800 dark:text-amber-300' : 'text-gray-500'}`}>
                      Can Tokenize Assets
                    </span>
                    {partner.can_tokenize && <CheckCircle2 className="w-4 h-4 text-amber-600 ml-auto" />}
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${partner.has_legal_team ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-700/50 opacity-50'}`}>
                    <Scale className={`w-5 h-5 ${partner.has_legal_team ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className={`font-medium ${partner.has_legal_team ? 'text-blue-800 dark:text-blue-300' : 'text-gray-500'}`}>
                      In-House Legal Team
                    </span>
                    {partner.has_legal_team && <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto" />}
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${partner.provides_spv_formation ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50 opacity-50'}`}>
                    <Shield className={`w-5 h-5 ${partner.provides_spv_formation ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={`font-medium ${partner.provides_spv_formation ? 'text-green-800 dark:text-green-300' : 'text-gray-500'}`}>
                      SPV Formation
                    </span>
                    {partner.provides_spv_formation && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-800/50 rounded-lg">
                <BadgeCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-green-900 dark:text-green-200">Verified Partner</h3>
                <p className="text-sm text-green-700 dark:text-green-400">Identity & compliance verified</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>KYC/AML Verified</span>
              </div>
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Accredited Investor</span>
              </div>
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Calendar className="w-4 h-4" />
                <span>Member since {new Date(partner.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

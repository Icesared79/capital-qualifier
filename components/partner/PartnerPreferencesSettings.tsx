'use client'

import { useState, useEffect } from 'react'
import { PartnerNotificationPreferences, EmailFrequency } from '@/lib/types'
import { Settings, Bell, MapPin, DollarSign, Target, X, Save, Loader2 } from 'lucide-react'

// Asset class options
const ASSET_CLASS_OPTIONS = [
  { value: 'residential_re', label: 'Residential Real Estate' },
  { value: 'commercial_re', label: 'Commercial Real Estate' },
  { value: 'consumer_loans', label: 'Consumer Loans' },
  { value: 'smb_loans', label: 'SMB Loans' },
  { value: 'auto_loans', label: 'Auto Loans' },
  { value: 'equipment_finance', label: 'Equipment Finance' },
  { value: 'factoring', label: 'Factoring/AR' },
  { value: 'crypto_lending', label: 'Crypto Lending' },
  { value: 'other', label: 'Other' }
]

// Geography options
const GEOGRAPHY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'California', label: 'California' },
  { value: 'Texas', label: 'Texas' },
  { value: 'Florida', label: 'Florida' },
  { value: 'New York', label: 'New York' },
  { value: 'North America', label: 'North America' },
  { value: 'Europe', label: 'Europe' },
  { value: 'Global', label: 'Global' }
]

// Email frequency options
const EMAIL_FREQUENCY_OPTIONS: { value: EmailFrequency; label: string; description: string }[] = [
  { value: 'immediate', label: 'Immediate', description: 'Get notified as soon as a matching deal is released' },
  { value: 'daily_digest', label: 'Daily Digest', description: 'Receive a daily summary of new deals' },
  { value: 'weekly_digest', label: 'Weekly Digest', description: 'Receive a weekly summary of new deals' },
  { value: 'off', label: 'Off', description: 'No email notifications' }
]

interface PartnerPreferencesSettingsProps {
  preferences: PartnerNotificationPreferences | null
  isModal?: boolean
  onClose?: () => void
  onSave?: (preferences: PartnerNotificationPreferences) => void
}

export default function PartnerPreferencesSettings({
  preferences: initialPreferences,
  isModal = false,
  onClose,
  onSave
}: PartnerPreferencesSettingsProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [preferredAssetClasses, setPreferredAssetClasses] = useState<string[]>(
    initialPreferences?.preferred_asset_classes || []
  )
  const [minDealSize, setMinDealSize] = useState(initialPreferences?.min_deal_size || '')
  const [maxDealSize, setMaxDealSize] = useState(initialPreferences?.max_deal_size || '')
  const [preferredGeographies, setPreferredGeographies] = useState<string[]>(
    initialPreferences?.preferred_geographies || []
  )
  const [minScore, setMinScore] = useState<number | ''>(initialPreferences?.min_score || '')
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(
    initialPreferences?.email_alerts_enabled ?? true
  )
  const [emailFrequency, setEmailFrequency] = useState<EmailFrequency>(
    initialPreferences?.email_frequency || 'immediate'
  )
  const [inAppAlertsEnabled, setInAppAlertsEnabled] = useState(
    initialPreferences?.in_app_alerts_enabled ?? true
  )
  const [notificationEmail, setNotificationEmail] = useState(
    initialPreferences?.notification_email || ''
  )

  const toggleAssetClass = (value: string) => {
    setPreferredAssetClasses(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  const toggleGeography = (value: string) => {
    setPreferredGeographies(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/partner/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_asset_classes: preferredAssetClasses.length > 0 ? preferredAssetClasses : null,
          min_deal_size: minDealSize || null,
          max_deal_size: maxDealSize || null,
          preferred_geographies: preferredGeographies.length > 0 ? preferredGeographies : null,
          min_score: minScore || null,
          email_alerts_enabled: emailAlertsEnabled,
          email_frequency: emailFrequency,
          in_app_alerts_enabled: inAppAlertsEnabled,
          notification_email: notificationEmail || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save preferences')
      }

      const data = await response.json()
      setSuccess(true)
      onSave?.(data.preferences)

      if (isModal) {
        setTimeout(() => onClose?.(), 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const content = (
    <div className="space-y-8">
      {/* Deal Criteria Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Deal Criteria
          </h3>
        </div>

        {/* Asset Classes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preferred Asset Classes
          </label>
          <div className="flex flex-wrap gap-2">
            {ASSET_CLASS_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleAssetClass(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  preferredAssetClasses.includes(option.value)
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deal Size Range */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Deal Size
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={minDealSize}
                onChange={(e) => setMinDealSize(e.target.value)}
                placeholder="e.g., $500K"
                className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Deal Size
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={maxDealSize}
                onChange={(e) => setMaxDealSize(e.target.value)}
                placeholder="e.g., $50M"
                className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Geographies */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preferred Geographies
          </label>
          <div className="flex flex-wrap gap-2">
            {GEOGRAPHY_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleGeography(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  preferredGeographies.includes(option.value)
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Minimum Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Minimum Qualification Score (0-100)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="e.g., 60"
            className="w-32 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Notification Settings Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notification Settings
          </h3>
        </div>

        {/* In-App Alerts Toggle */}
        <div className="mb-4 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">In-App Notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive notifications within the dashboard
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInAppAlertsEnabled(!inAppAlertsEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              inAppAlertsEnabled ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                inAppAlertsEnabled ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Email Alerts Toggle */}
        <div className="mb-4 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive email alerts for matching deals
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              emailAlertsEnabled ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                emailAlertsEnabled ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Email Frequency */}
        {emailAlertsEnabled && (
          <div className="mb-4 pl-4 border-l-2 border-accent/30">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Frequency
            </label>
            <div className="space-y-2">
              {EMAIL_FREQUENCY_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    emailFrequency === option.value
                      ? 'bg-accent/10 border-2 border-accent'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="emailFrequency"
                    value={option.value}
                    checked={emailFrequency === option.value}
                    onChange={() => setEmailFrequency(option.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notification Email */}
        {emailAlertsEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notification Email (optional)
            </label>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="Override default email address"
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-accent"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty to use your account email
            </p>
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          Preferences saved successfully!
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Settings className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Deal Preferences
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {content}
          </div>
        </div>
      </div>
    )
  }

  return content
}

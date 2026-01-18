'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  email: string
  full_name: string | null
}

interface Company {
  id: string
  name: string
  type: string
  qualification_data: any
  assets: string[] | null
}

interface ProfileClientProps {
  user: any
  profile: Profile | null
  company: Company | null
}

export default function ProfileClient({ user, profile, company }: ProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Core profile data - what BitCense needs to know
  const [companyName, setCompanyName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [yearFounded, setYearFounded] = useState('')
  const [website, setWebsite] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    if (company) {
      setCompanyName(company.name || '')
      const qData = company.qualification_data || {}
      setBusinessType(qData.businessType || company.type || '')
      setYearFounded(qData.yearFounded || '')
      setWebsite(qData.website || '')
      setLogoUrl(qData.logo_url || '')
    }
  }, [company])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) return

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/upload-logo', { method: 'POST', body: formData })
      const result = await response.json()
      if (response.ok) setLogoUrl(result.url)
    } catch (error) {
      console.error('Error uploading logo:', error)
    } finally {
      setUploadingLogo(false)
    }
  }

  const saveProfile = async () => {
    if (!companyName.trim()) {
      alert('Company name is required')
      return
    }
    if (!businessType) {
      alert('Please select your business type')
      return
    }

    setSaving(true)
    setSaveStatus('saving')

    const assets = businessType === 'originator' ? ['loan_portfolio']
      : businessType === 'real_estate' ? ['real_estate']
      : ['receivables', 'equipment']

    const qualificationData = {
      businessType,
      yearFounded,
      website,
      logo_url: logoUrl,
      assets,
      profileCompleted: true,
      profileCompletedAt: new Date().toISOString(),
    }

    const companyData = {
      name: companyName,
      type: businessType,
      assets,
      qualification_data: qualificationData,
    }

    try {
      if (company) {
        await supabase.from('companies').update(companyData).eq('id', company.id)
      } else {
        await supabase.from('companies').insert({ ...companyData, owner_id: user.id })
      }
      setSaveStatus('saved')
      setTimeout(() => router.push('/dashboard'), 500)
    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveStatus('error')
      setSaving(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i)

  const isComplete = companyName.trim() && businessType

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Company Profile</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8">
        {/* BitCense framing */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Tell us about your company
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This information is used to build your offering profile and match you with capital partners.
          </p>
        </div>

        {/* Single clean form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 space-y-6">

          {/* Logo + Name */}
          <div className="flex gap-5">
            <label className="flex-shrink-0 cursor-pointer">
              <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden hover:border-gray-400 transition-colors">
                {uploadingLogo ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
            </label>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Capital LLC"
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-900 dark:focus:border-white"
              />
            </div>
          </div>

          {/* Year + Website */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year Founded</label>
              <select
                value={yearFounded}
                onChange={(e) => setYearFounded(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-900 dark:focus:border-white"
              >
                <option value="">Select...</option>
                {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="yourcompany.com"
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-900 dark:focus:border-white"
              />
            </div>
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Business Type <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {[
                { value: 'originator', label: 'Loan Originator', desc: 'I originate or hold loans', icon: '📊' },
                { value: 'real_estate', label: 'Real Estate', desc: 'I own or develop property', icon: '🏢' },
                { value: 'asset_backed', label: 'Asset-Backed', desc: 'Receivables, equipment, inventory', icon: '📦' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setBusinessType(type.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    businessType === type.value
                      ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{type.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{type.desc}</p>
                  </div>
                  {businessType === type.value && (
                    <svg className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="mt-6 flex justify-end gap-4">
          <Link href="/dashboard">
            <button className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 font-medium">
              Cancel
            </button>
          </Link>
          <button
            onClick={saveProfile}
            disabled={saving || !isComplete}
            className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {saveStatus === 'saved' ? 'Saved!' : saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* What happens next */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">What happens next:</span> Once saved, you can submit a capital request. BitCense will review your offering, analyze your documents with AI, and connect you with matching financial partners.
          </p>
        </div>
      </main>
    </div>
  )
}

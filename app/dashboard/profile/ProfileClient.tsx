'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import SelectCard from '@/components/ui/SelectCard'
import MultiSelect from '@/components/ui/MultiSelect'
import TextInput from '@/components/ui/TextInput'
import AddressAutocomplete from '@/components/ui/AddressAutocomplete'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { AddressData, Owner, BusinessProfileData } from '@/lib/types'

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
  asset_details: any
}

interface ProfileClientProps {
  user: any
  profile: Profile | null
  company: Company | null
}

const emptyAddress: AddressData = { street: '', city: '', state: '', zip: '', fullAddress: '' }

// Asset options
const assetOptions = [
  { value: 'loan_portfolio', label: 'Loan Portfolio', description: 'I originate or hold loans' },
  { value: 'real_estate', label: 'Real Estate', description: 'Commercial or residential property' },
  { value: 'equipment', label: 'Equipment / Inventory', description: 'Physical business assets' },
  { value: 'receivables', label: 'Receivables / Invoices', description: 'Accounts receivable, contracts' },
  { value: 'cash_flow', label: 'Business Cash Flow', description: 'Revenue-based lending' },
  { value: 'other', label: 'Other' },
]

// Loan asset class options
const loanAssetClassOptions = [
  { value: 'Residential Real Estate', label: 'Residential Real Estate', description: 'Mortgages, HELOCs, fix & flip' },
  { value: 'Commercial Real Estate', label: 'Commercial Real Estate', description: 'CRE loans, bridge loans' },
  { value: 'Consumer Loans', label: 'Consumer Loans', description: 'Personal loans, auto loans' },
  { value: 'SMB Loans', label: 'SMB / Business Loans', description: 'Small business lending' },
  { value: 'Equipment Financing', label: 'Equipment Financing', description: 'Equipment leases and loans' },
  { value: 'Specialty Finance', label: 'Specialty Finance', description: 'Factoring, merchant cash advance' },
]

// Real estate type options
const realEstateTypeOptions = [
  { value: 'multifamily', label: 'Multifamily', description: 'Apartment buildings' },
  { value: 'office', label: 'Office', description: 'Office buildings' },
  { value: 'retail', label: 'Retail', description: 'Shopping centers, storefronts' },
  { value: 'industrial', label: 'Industrial', description: 'Warehouses, manufacturing' },
  { value: 'mixed_use', label: 'Mixed Use', description: 'Combined residential/commercial' },
  { value: 'land', label: 'Land', description: 'Development sites' },
]

// Volume options
const volumeOptions = [
  { value: 'Under $1M', label: 'Under $1M', description: 'Early stage' },
  { value: '$1M - $5M', label: '$1M - $5M', description: 'Growing' },
  { value: '$5M - $25M', label: '$5M - $25M', description: 'Established' },
  { value: '$25M - $100M', label: '$25M - $100M', description: 'Scaled' },
  { value: '$100M+', label: '$100M+', description: 'Institutional' },
]

// Deal size options
const dealSizeOptions = [
  { value: 'Under $100K', label: 'Under $100K' },
  { value: '$100K - $500K', label: '$100K - $500K' },
  { value: '$500K - $2M', label: '$500K - $2M' },
  { value: '$2M - $10M', label: '$2M - $10M' },
  { value: '$10M+', label: '$10M+' },
]

// Portfolio value options
const portfolioValueOptions = [
  { value: 'Under $500K', label: 'Under $500K', description: 'Small portfolio' },
  { value: '$500K - $2M', label: '$500K - $2M', description: 'Growing portfolio' },
  { value: '$2M - $10M', label: '$2M - $10M', description: 'Established portfolio' },
  { value: '$10M - $50M', label: '$10M - $50M', description: 'Substantial portfolio' },
  { value: '$50M - $100M', label: '$50M - $100M', description: 'Large portfolio' },
  { value: '$100M+', label: '$100M+', description: 'Institutional scale' },
]

// Default rate options
const defaultRateOptions = [
  { value: 'Under 2%', label: 'Under 2%', description: 'Excellent performance' },
  { value: '2-5%', label: '2% - 5%', description: 'Strong performance' },
  { value: '5-10%', label: '5% - 10%', description: 'Moderate performance' },
  { value: 'Over 10%', label: 'Over 10%', description: 'Higher risk profile' },
  { value: 'Not sure', label: 'Not sure / New portfolio' },
]

// Documentation standard options
const docStandardOptions = [
  { value: 'Full Documentation', label: 'Full Documentation', description: 'Complete income/asset verification' },
  { value: 'Partial Documentation', label: 'Partial Documentation', description: 'Bank statements, limited docs' },
  { value: 'Varies Across Portfolio', label: 'Varies Across Portfolio', description: 'Mix of documentation types' },
  { value: 'Minimal Documentation', label: 'Minimal Documentation', description: 'Stated income, no-doc' },
]

// Current funding source options
const currentFundingOptions = [
  { value: 'Balance sheet only', label: 'Balance Sheet Only', description: 'Self-funded operations' },
  { value: 'Friends & family', label: 'Friends & Family', description: 'Personal network capital' },
  { value: 'Private credit fund', label: 'Private Credit Fund', description: 'Non-bank lender relationship' },
  { value: 'Family office', label: 'Family Office', description: 'Family office backing' },
  { value: 'Bank warehouse line', label: 'Bank Warehouse Line', description: 'Traditional bank facility' },
  { value: 'Institutional credit facility', label: 'Institutional Credit Facility', description: 'Large-scale institutional debt' },
]

// Occupancy rate options (for real estate)
const occupancyRateOptions = [
  { value: '95%+', label: '95%+', description: 'Fully leased' },
  { value: '85-95%', label: '85% - 95%', description: 'Strong occupancy' },
  { value: '70-85%', label: '70% - 85%', description: 'Moderate occupancy' },
  { value: '50-70%', label: '50% - 70%', description: 'Below average' },
  { value: 'Under 50%', label: 'Under 50%', description: 'Significant vacancy' },
  { value: 'N/A', label: 'N/A', description: 'Not applicable' },
]

// Country options
const countryOptions = [
  { value: 'Canada', label: 'Canada' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Other', label: 'Other' },
]

// Team size options
const teamSizeOptions = [
  { value: '1-5', label: '1-5 employees' },
  { value: '6-20', label: '6-20 employees' },
  { value: '21-50', label: '21-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '200+', label: '200+ employees' },
]

// Year founded options
const currentYear = new Date().getFullYear()
const yearFoundedOptions = Array.from({ length: currentYear - 1949 }, (_, i) => {
  const year = currentYear - i
  return { value: year.toString(), label: year.toString() }
})

const selectClassName = "w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/30 dark:focus:ring-white/30 focus:border-gray-900 dark:focus:border-white appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center]"

export default function ProfileClient({ user, profile, company }: ProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    business: true,
    company: true,
    assets: true,
    funding: false,
  })

  // Form state - Business basics
  const [companyName, setCompanyName] = useState('')
  const [locatedInUS, setLocatedInUS] = useState(true)
  const [country, setCountry] = useState('')
  const [countryOther, setCountryOther] = useState('')
  const [location, setLocation] = useState('')
  const [physicalAddress, setPhysicalAddress] = useState<AddressData>(emptyAddress)
  const [mailingAddress, setMailingAddress] = useState<AddressData>(emptyAddress)
  const [sameAsPhysical, setSameAsPhysical] = useState(true)
  const [owners, setOwners] = useState<Owner[]>([{ name: '', title: '', email: '' }])

  // Company details
  const [yearFounded, setYearFounded] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')

  // Assets
  const [assets, setAssets] = useState<string[]>([])
  const [assetOther, setAssetOther] = useState('')
  const [loanAssetClasses, setLoanAssetClasses] = useState<string[]>([])
  const [realEstateTypes, setRealEstateTypes] = useState<string[]>([])
  const [annualVolume, setAnnualVolume] = useState('')
  const [avgDealSize, setAvgDealSize] = useState('')
  const [portfolioSize, setPortfolioSize] = useState('')
  const [geographicFocus, setGeographicFocus] = useState('')

  // Portfolio quality
  const [defaultRate, setDefaultRate] = useState('')
  const [docStandard, setDocStandard] = useState('')
  const [avgLoanTerm, setAvgLoanTerm] = useState('')
  const [avgInterestRate, setAvgInterestRate] = useState('')
  const [occupancyRate, setOccupancyRate] = useState('')

  // Current funding
  const [currentFunding, setCurrentFunding] = useState<string[]>([])
  const [hasExistingFacility, setHasExistingFacility] = useState<boolean | null>(null)
  const [facilityDetails, setFacilityDetails] = useState('')

  // Logo
  const [logoUrl, setLogoUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Load existing data
  useEffect(() => {
    if (company) {
      setCompanyName(company.name || '')
      const qData = company.qualification_data || {}

      // Business basics
      setLocatedInUS(qData.locatedInUS !== false)
      setCountry(qData.country || '')
      setCountryOther(qData.countryOther || '')
      setLocation(qData.location || '')
      if (qData.physicalAddress) setPhysicalAddress(qData.physicalAddress)
      if (qData.mailingAddress) setMailingAddress(qData.mailingAddress)
      setSameAsPhysical(qData.sameAsPhysical !== false)
      if (qData.owners && qData.owners.length > 0) setOwners(qData.owners)

      // Company details
      setYearFounded(qData.yearFounded || '')
      setTeamSize(qData.teamSize || '')
      setDescription(qData.description || '')
      setWebsite(qData.website || '')

      // Assets
      const savedAssets = company.assets || qData.assets || []
      setAssets(savedAssets)
      setAssetOther(qData.assetOther || '')
      const assetDetails = company.asset_details || qData.assetDetails || {}
      setLoanAssetClasses(assetDetails.loanPortfolio?.assetClasses || qData.loanAssetClasses || [])
      setRealEstateTypes(assetDetails.realEstate?.propertyTypes || qData.realEstateTypes || [])
      setAnnualVolume(assetDetails.loanPortfolio?.annualVolume || qData.annualVolume || '')
      setAvgDealSize(assetDetails.loanPortfolio?.avgDealSize || qData.avgDealSize || '')
      setPortfolioSize(qData.portfolioSize || '')
      setGeographicFocus(qData.geographicFocus || '')

      // Portfolio quality
      setDefaultRate(qData.defaultRate || '')
      setDocStandard(qData.docStandard || '')
      setAvgLoanTerm(qData.avgLoanTerm || '')
      setAvgInterestRate(qData.avgInterestRate || '')
      setOccupancyRate(qData.occupancyRate || '')

      // Current funding
      setCurrentFunding(qData.currentFunding || [])
      setHasExistingFacility(qData.hasExistingFacility ?? null)
      setFacilityDetails(qData.facilityDetails || '')

      // Logo
      setLogoUrl(qData.logo_url || '')
    }
  }, [company])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB')
      return
    }

    setUploadingLogo(true)

    try {
      // Use API route for upload (bypasses RLS issues)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Upload error:', result.error)
        alert(result.error || 'Failed to upload logo. Please try again.')
        return
      }

      setLogoUrl(result.url)
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Failed to upload logo. Please try again.')
    } finally {
      setUploadingLogo(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const saveProfile = async () => {
    setSaving(true)
    setSaveStatus('saving')

    const qualificationData: BusinessProfileData = {
      companyName,
      locatedInUS,
      country: locatedInUS ? 'United States' : country,
      countryOther,
      location,
      physicalAddress,
      mailingAddress: sameAsPhysical ? physicalAddress : mailingAddress,
      sameAsPhysical,
      owners: owners.filter(o => o.name.trim() !== ''),
      yearFounded,
      teamSize,
      description,
      website,
      assets,
      assetOther,
      loanAssetClasses,
      realEstateTypes,
      annualVolume,
      avgDealSize,
      portfolioSize,
      geographicFocus,
      defaultRate,
      docStandard,
      avgLoanTerm,
      avgInterestRate,
      occupancyRate,
      currentFunding,
      hasExistingFacility: hasExistingFacility ?? undefined,
      facilityDetails,
      logo_url: logoUrl,
    }

    const companyType = assets.includes('loan_portfolio') ? 'originator' : 'borrower'

    const companyData = {
      name: companyName || 'My Company',
      type: companyType,
      assets,
      asset_details: {
        loanPortfolio: assets.includes('loan_portfolio') ? {
          assetClasses: loanAssetClasses,
          annualVolume,
          avgDealSize,
        } : undefined,
        realEstate: assets.includes('real_estate') ? {
          propertyTypes: realEstateTypes,
        } : undefined,
      },
      qualification_data: qualificationData,
    }

    try {
      if (company) {
        await supabase.from('companies').update(companyData).eq('id', company.id)
      } else {
        await supabase.from('companies').insert({ ...companyData, owner_id: user.id })
      }
      setSaveStatus('saved')
      // Redirect to dashboard after brief confirmation
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (error) {
      console.error('Error saving profile:', error)
      setSaveStatus('error')
      setSaving(false)
    }
  }

  const SectionHeader = ({ title, section, description }: { title: string; section: string; description?: string }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-4 text-left"
    >
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <svg
        className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections[section] ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Business Profile</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your company information</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {saveStatus === 'saved' && (
                <span className="text-sm text-green-600 flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-lg font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Saved!
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm text-red-600 flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-lg font-medium">
                  Error saving
                </span>
              )}
              {saveStatus !== 'saved' && (
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Business Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
          <div className="px-6 border-b-2 border-gray-200 dark:border-gray-700">
            <SectionHeader title="Business Information" section="business" description="Company name, location, and ownership" />
          </div>
          {expandedSections.business && (
            <div className="p-6 space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Company Logo</label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                      {uploadingLogo ? (
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                      ) : logoUrl ? (
                        <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain" />
                      ) : (
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-white transition-colors cursor-pointer">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {logoUrl ? 'Change Logo' : 'Upload Logo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">PNG, JPG up to 2MB. Square images work best.</p>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="text-xs text-red-500 hover:text-red-600 mt-1"
                      >
                        Remove logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <TextInput
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Capital LLC"
              />

              {/* Owner/Founder Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Owner(s) / Founder(s)</label>
                  {owners.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setOwners([...owners, { name: '', title: '', email: '' }])}
                      className="text-sm text-gray-900 dark:text-white hover:underline font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add another
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {owners.map((owner, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 relative">
                      {owners.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setOwners(owners.filter((_, i) => i !== index))}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={owner.name}
                          onChange={(e) => {
                            const newOwners = [...owners]
                            newOwners[index].name = e.target.value
                            setOwners(newOwners)
                          }}
                          placeholder="Full name"
                          className="col-span-2 px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/30 dark:focus:ring-white/30 focus:border-gray-900 dark:focus:border-white"
                        />
                        <input
                          type="text"
                          value={owner.title}
                          onChange={(e) => {
                            const newOwners = [...owners]
                            newOwners[index].title = e.target.value
                            setOwners(newOwners)
                          }}
                          placeholder="Title (e.g., CEO)"
                          className="px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/30 dark:focus:ring-white/30 focus:border-gray-900 dark:focus:border-white"
                        />
                        <input
                          type="email"
                          value={owner.email}
                          onChange={(e) => {
                            const newOwners = [...owners]
                            newOwners[index].email = e.target.value
                            setOwners(newOwners)
                          }}
                          placeholder="Email"
                          className="px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/30 dark:focus:ring-white/30 focus:border-gray-900 dark:focus:border-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Where is your company located?</label>
                <div className="grid grid-cols-2 gap-3">
                  <SelectCard label="United States" selected={locatedInUS} onClick={() => setLocatedInUS(true)} />
                  <SelectCard label="Outside US" selected={!locatedInUS} onClick={() => setLocatedInUS(false)} />
                </div>
              </div>

              {locatedInUS ? (
                <>
                  <AddressAutocomplete
                    label="Physical Business Address"
                    value={physicalAddress}
                    onChange={setPhysicalAddress}
                    placeholder="Start typing your address..."
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSameAsPhysical(!sameAsPhysical)
                        if (!sameAsPhysical) setMailingAddress(physicalAddress)
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        sameAsPhysical ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                        sameAsPhysical ? 'translate-x-6 bg-white dark:bg-gray-900' : 'translate-x-1 bg-white'
                      }`} />
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Mailing address is the same as physical address</span>
                  </div>
                  {!sameAsPhysical && (
                    <AddressAutocomplete
                      label="Mailing Address"
                      value={mailingAddress}
                      onChange={setMailingAddress}
                      placeholder="Start typing your mailing address..."
                    />
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectClassName}>
                      <option value="">Select your country...</option>
                      {countryOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  {country === 'Other' && (
                    <TextInput
                      label="Country Name"
                      value={countryOther}
                      onChange={(e) => setCountryOther(e.target.value)}
                      placeholder="Enter country name"
                    />
                  )}
                  <TextInput
                    label="Business Address"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Full business address"
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Company Details Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
          <div className="px-6 border-b-2 border-gray-200 dark:border-gray-700">
            <SectionHeader title="Company Details" section="company" description="Year founded, team size, and description" />
          </div>
          {expandedSections.company && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year Founded</label>
                  <select value={yearFounded} onChange={(e) => setYearFounded(e.target.value)} className={selectClassName}>
                    <option value="">Select year...</option>
                    {yearFoundedOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team Size</label>
                  <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className={selectClassName}>
                    <option value="">Select team size...</option>
                    {teamSizeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <TextInput
                label="Website (optional)"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourcompany.com"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what your company does..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/30 dark:focus:ring-white/30 focus:border-gray-900 dark:focus:border-white resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Assets & Portfolio Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
          <div className="px-6 border-b-2 border-gray-200 dark:border-gray-700">
            <SectionHeader title="Assets & Portfolio" section="assets" description="Asset types, loan classes, and portfolio metrics" />
          </div>
          {expandedSections.assets && (
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">What assets does your business have?</p>
                <MultiSelect options={assetOptions} selected={assets} onChange={setAssets} />
                {assets.includes('other') && (
                  <div className="mt-4">
                    <TextInput
                      label="Describe your assets"
                      value={assetOther}
                      onChange={(e) => setAssetOther(e.target.value)}
                      placeholder="Describe your asset type..."
                    />
                  </div>
                )}
              </div>

              {assets.includes('loan_portfolio') && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">What types of loans do you originate?</p>
                    <MultiSelect options={loanAssetClassOptions} selected={loanAssetClasses} onChange={setLoanAssetClasses} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Annual origination volume</p>
                    <div className="space-y-2">
                      {volumeOptions.map((option) => (
                        <SelectCard
                          key={option.value}
                          label={option.label}
                          description={option.description}
                          selected={annualVolume === option.value}
                          onClick={() => setAnnualVolume(option.value)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Average deal size</p>
                    <div className="grid grid-cols-2 gap-2">
                      {dealSizeOptions.map((option) => (
                        <SelectCard
                          key={option.value}
                          label={option.label}
                          selected={avgDealSize === option.value}
                          onClick={() => setAvgDealSize(option.value)}
                        />
                      ))}
                    </div>
                  </div>
                  <TextInput
                    label="Current portfolio size (optional)"
                    value={portfolioSize}
                    onChange={(e) => setPortfolioSize(e.target.value)}
                    placeholder="e.g., $50M"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Historical default rate</p>
                    <div className="space-y-2">
                      {defaultRateOptions.map((option) => (
                        <SelectCard
                          key={option.value}
                          label={option.label}
                          description={option.description}
                          selected={defaultRate === option.value}
                          onClick={() => setDefaultRate(option.value)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Documentation standards</p>
                    <div className="space-y-2">
                      {docStandardOptions.map((option) => (
                        <SelectCard
                          key={option.value}
                          label={option.label}
                          description={option.description}
                          selected={docStandard === option.value}
                          onClick={() => setDocStandard(option.value)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <TextInput
                      label="Avg loan term (optional)"
                      value={avgLoanTerm}
                      onChange={(e) => setAvgLoanTerm(e.target.value)}
                      placeholder="e.g., 12 months"
                    />
                    <TextInput
                      label="Avg interest rate (optional)"
                      value={avgInterestRate}
                      onChange={(e) => setAvgInterestRate(e.target.value)}
                      placeholder="e.g., 10%"
                    />
                  </div>
                </>
              )}

              {assets.includes('real_estate') && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">What types of real estate?</p>
                    <MultiSelect options={realEstateTypeOptions} selected={realEstateTypes} onChange={setRealEstateTypes} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Estimated portfolio value</p>
                    <div className="space-y-2">
                      {portfolioValueOptions.map((option) => (
                        <SelectCard
                          key={option.value}
                          label={option.label}
                          description={option.description}
                          selected={portfolioSize === option.value}
                          onClick={() => setPortfolioSize(option.value)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Average occupancy rate</p>
                    <div className="space-y-2">
                      {occupancyRateOptions.map((option) => (
                        <SelectCard
                          key={option.value}
                          label={option.label}
                          description={option.description}
                          selected={occupancyRate === option.value}
                          onClick={() => setOccupancyRate(option.value)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              <TextInput
                label="Geographic focus (optional)"
                value={geographicFocus}
                onChange={(e) => setGeographicFocus(e.target.value)}
                placeholder="e.g., Southeast US, California"
              />
            </div>
          )}
        </div>

        {/* Current Funding Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
          <div className="px-6 border-b-2 border-gray-200 dark:border-gray-700">
            <SectionHeader title="Current Funding" section="funding" description="Existing funding sources and facilities" />
          </div>
          {expandedSections.funding && (
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Current funding sources</p>
                <MultiSelect options={currentFundingOptions} selected={currentFunding} onChange={setCurrentFunding} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Do you have an existing credit facility?</p>
                <div className="grid grid-cols-2 gap-3">
                  <SelectCard label="Yes" selected={hasExistingFacility === true} onClick={() => setHasExistingFacility(true)} />
                  <SelectCard label="No" selected={hasExistingFacility === false} onClick={() => setHasExistingFacility(false)} />
                </div>
              </div>
              {hasExistingFacility && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Facility details (optional)</label>
                  <textarea
                    value={facilityDetails}
                    onChange={(e) => setFacilityDetails(e.target.value)}
                    placeholder="Size, provider, terms, expiration..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/30 dark:focus:ring-white/30 focus:border-gray-900 dark:focus:border-white resize-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          {saveStatus === 'saved' ? (
            <span className="text-sm text-green-600 flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-lg font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Saved! Redirecting...
            </span>
          ) : (
            <>
              <Link href="/dashboard">
                <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold text-base transition-colors">
                  Cancel
                </button>
              </Link>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

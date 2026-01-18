'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import SelectCard from '@/components/ui/SelectCard'
import { scoreOriginatorAdvanced } from '@/lib/scoring'

// Step titles for progress display
const stepTitles = [
  'Funding Details',
  'Deal Context',
  'Quick Qualification',
  'Review & Submit',
]

// Asset labels - specific asset types for document checklist matching
const assetLabels: Record<string, string> = {
  // Real Estate
  cre: 'Commercial Real Estate (CRE)',
  residential: 'Residential Real Estate',
  real_estate: 'Real Estate (Mixed/Other)',
  // Lending
  consumer: 'Consumer Loans',
  smb: 'SMB / Business Loans',
  loan_portfolio: 'Loan Portfolio (Mixed)',
  // Specialty Finance
  mca: 'MCA / Merchant Cash Advance',
  factoring: 'Factoring / Receivables',
  equipment: 'Equipment Finance',
  // Other
  private_equity: 'Private Equity / Fund',
  receivables: 'Receivables / Invoices',
  other: 'Other',
}


// Funding amount suggestions for autocomplete
const fundingAmountSuggestions = [
  { value: 1000000, label: '$1,000,000' },
  { value: 2000000, label: '$2,000,000' },
  { value: 5000000, label: '$5,000,000' },
  { value: 10000000, label: '$10,000,000' },
  { value: 15000000, label: '$15,000,000' },
  { value: 25000000, label: '$25,000,000' },
  { value: 50000000, label: '$50,000,000' },
  { value: 75000000, label: '$75,000,000' },
  { value: 100000000, label: '$100,000,000' },
]

// Format number as currency with commas (e.g., $10,000,000)
const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

// Format input as user types - add commas and dollar sign
const formatCurrencyInput = (input: string): string => {
  // Remove everything except digits
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''

  // Convert to number and format with commas
  const num = parseInt(digits, 10)
  return `$${num.toLocaleString('en-US')}`
}

// Parse currency string to number
const parseCurrencyInput = (input: string): number | null => {
  // Remove $ and commas
  const cleaned = input.replace(/[$,\s]/g, '')

  // Handle M/m suffix for backwards compatibility
  if (cleaned.toLowerCase().endsWith('m')) {
    const num = parseFloat(cleaned.slice(0, -1))
    return isNaN(num) ? null : num * 1000000
  }

  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

const MIN_FUNDING = 1000000 // $1M
const MAX_FUNDING = 100000000 // $100M

// Funding purpose options (simplified)
const fundingPurposeOptions = [
  { value: 'working_capital', label: 'Growth / Working Capital' },
  { value: 'acquisition', label: 'Acquisition' },
  { value: 'refinance', label: 'Refinance Existing Debt' },
  { value: 'portfolio_expansion', label: 'Portfolio Expansion' },
  { value: 'exploring', label: 'Just Exploring Options' },
]

// Timeline options
const timelineOptions = [
  { value: '30_days', label: '30 Days' },
  { value: '30_60_days', label: '30-60 Days' },
  { value: '60_90_days', label: '60-90 Days' },
  { value: '90_plus', label: '90+' },
]

// Years in business options
const yearsInBusinessOptions = [
  { value: 'less_than_1', label: '<1 Year' },
  { value: '1_3', label: '1-3 Years' },
  { value: '3_5', label: '3-5 Years' },
  { value: '5_10', label: '5-10 Years' },
  { value: '10_plus', label: '10+ Years' },
]

// Origination volume options
const volumeOptions = [
  { value: 'under_1m', label: '<$1M/mo' },
  { value: '1m_5m', label: '$1-5M/mo' },
  { value: '5m_10m', label: '$5-10M/mo' },
  { value: '10m_25m', label: '$10-25M/mo' },
  { value: '25m_plus', label: '$25M+/mo' },
]

// Geographic focus options
const geographyOptions = [
  { value: 'national', label: 'National' },
  { value: 'multi_state', label: 'Multi-State' },
  { value: 'single_state', label: 'Single State' },
  { value: 'regional', label: 'Regional' },
]

function ApplyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dealId = searchParams.get('id')
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Existing data
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [existingDealId, setExistingDealId] = useState<string | null>(null)

  // Profile data (read-only, loaded from company)
  const [profileData, setProfileData] = useState<any>(null)
  const [hasProfile, setHasProfile] = useState(false)

  // Offering-specific data
  const [fundingAmount, setFundingAmount] = useState<number | null>(null)
  const [fundingAmountInput, setFundingAmountInput] = useState('')
  const [showAmountSuggestions, setShowAmountSuggestions] = useState(false)
  const [fundingPurpose, setFundingPurpose] = useState('')
  const [timeline, setTimeline] = useState('')

  // Deal context
  const [hasExistingFacility, setHasExistingFacility] = useState<boolean | null>(null)
  const [facilityDetails, setFacilityDetails] = useState('')
  const [dealAssets, setDealAssets] = useState<string[]>([])
  const [dealAssetOther, setDealAssetOther] = useState('')

  // Quick qualification
  const [yearsInBusiness, setYearsInBusiness] = useState('')
  const [monthlyVolume, setMonthlyVolume] = useState('')
  const [geographicFocus, setGeographicFocus] = useState('')

  // Handle funding amount input change
  const handleFundingAmountChange = (value: string) => {
    // Format the input with $ and commas as user types
    const formatted = formatCurrencyInput(value)
    const parsed = parseCurrencyInput(formatted)

    // Cap at max funding amount
    if (parsed !== null && parsed > MAX_FUNDING) {
      setFundingAmountInput(formatCurrency(MAX_FUNDING))
      setFundingAmount(MAX_FUNDING)
      setErrors(prev => ({ ...prev, fundingAmount: `Maximum funding amount is ${formatCurrency(MAX_FUNDING)}` }))
      return
    }

    setFundingAmountInput(formatted)
    setShowAmountSuggestions(true)

    if (parsed !== null && parsed > 0) {
      setFundingAmount(parsed)
      // Clear error if within range
      if (parsed >= MIN_FUNDING && parsed <= MAX_FUNDING) {
        setErrors(prev => {
          const { fundingAmount, ...rest } = prev
          return rest
        })
      }
    } else {
      setFundingAmount(null)
    }
  }

  // Handle suggestion selection
  const handleAmountSuggestionClick = (value: number) => {
    setFundingAmount(value)
    setFundingAmountInput(formatCurrency(value))
    setShowAmountSuggestions(false)
  }

  // Handle blur - format the input
  const handleAmountBlur = () => {
    setTimeout(() => setShowAmountSuggestions(false), 200)
    if (fundingAmount !== null) {
      setFundingAmountInput(formatCurrency(fundingAmount))
    }
  }

  // Filter suggestions based on input
  const filteredSuggestions = fundingAmountSuggestions.filter(s => {
    if (!fundingAmountInput) return true
    const parsed = parseCurrencyInput(fundingAmountInput)
    if (parsed === null) return true
    // Show suggestions around the entered value
    return s.value >= parsed * 0.5 && s.value <= parsed * 2
  })

  const totalSteps = 4

  useEffect(() => {
    loadExistingData()
  }, [])

  const loadExistingData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get existing company
    const { data: companies } = await supabase
      .from('companies')
      .select('*, deals(*)')
      .eq('owner_id', user.id)
      .limit(1)

    if (companies && companies.length > 0) {
      const company = companies[0]
      setCompanyId(company.id)

      // Load profile data
      const qData = company.qualification_data || {}
      const assets = company.assets || qData.assets || []
      const assetDetails = company.asset_details || qData.assetDetails || {}

      const profile = {
        companyName: company.name || '',
        locatedInUS: qData.locatedInUS !== false,
        country: qData.country || '',
        countryOther: qData.countryOther || '',
        location: qData.location || '',
        physicalAddress: qData.physicalAddress,
        owners: qData.owners || [],
        yearFounded: qData.yearFounded || '',
        teamSize: qData.teamSize || '',
        description: qData.description || '',
        website: qData.website || '',
        assets,
        assetOther: qData.assetOther || '',
        loanAssetClasses: assetDetails.loanPortfolio?.assetClasses || qData.loanAssetClasses || [],
        realEstateTypes: assetDetails.realEstate?.propertyTypes || qData.realEstateTypes || [],
        annualVolume: assetDetails.loanPortfolio?.annualVolume || qData.annualVolume || '',
        avgDealSize: assetDetails.loanPortfolio?.avgDealSize || qData.avgDealSize || '',
        portfolioSize: qData.portfolioSize || '',
        geographicFocus: qData.geographicFocus || '',
        defaultRate: qData.defaultRate || '',
        docStandard: qData.docStandard || '',
        avgLoanTerm: qData.avgLoanTerm || '',
        avgInterestRate: qData.avgInterestRate || '',
        currentFunding: qData.currentFunding || [],
        hasExistingFacility: qData.hasExistingFacility,
        facilityDetails: qData.facilityDetails || '',
        occupancyRate: qData.occupancyRate || '',
      }

      setProfileData(profile)
      setHasProfile(assets.length > 0)

      // If editing an existing deal, load its data
      if (dealId) {
        const deal = company.deals?.find((d: any) => d.id === dealId)
        if (deal) {
          setExistingDealId(deal.id)
          let dealData: any = {}
          try {
            dealData = deal.notes ? JSON.parse(deal.notes) : {}
          } catch (e) {}
          // Parse funding amount - could be number or string
          const savedAmount = deal.capital_amount || dealData.fundingAmount
          if (savedAmount) {
            const parsed = typeof savedAmount === 'number' ? savedAmount : parseCurrencyInput(String(savedAmount))
            if (parsed !== null) {
              setFundingAmount(parsed)
              setFundingAmountInput(formatCurrency(parsed))
            }
          }
          setFundingPurpose(deal.funding_purpose || dealData.fundingPurpose || '')
          setTimeline(dealData.timeline || qData.timeline || '')
        }
      }
    } else {
      // No company exists, redirect to profile creation
      setHasProfile(false)
    }

    setLoading(false)
  }

  const validateStep = () => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 0: // Funding Details
        if (fundingAmount === null) {
          newErrors.fundingAmount = 'Please enter a funding amount'
        } else if (fundingAmount < MIN_FUNDING) {
          newErrors.fundingAmount = `Minimum funding amount is ${formatCurrency(MIN_FUNDING)}`
        } else if (fundingAmount > MAX_FUNDING) {
          newErrors.fundingAmount = `Maximum funding amount is ${formatCurrency(MAX_FUNDING)}`
        }
        if (!fundingPurpose) {
          newErrors.fundingPurpose = 'Please select a funding purpose'
        }
        if (!timeline) {
          newErrors.timeline = 'Please select a timeline'
        }
        break

      case 1: // Deal Context
        if (hasExistingFacility === null) {
          newErrors.hasExistingFacility = 'Please indicate if you have existing facilities'
        }
        if (dealAssets.length === 0) {
          newErrors.dealAssets = 'Please select at least one asset type'
        }
        if (dealAssets.includes('other') && !dealAssetOther.trim()) {
          newErrors.dealAssetOther = 'Please describe your asset type'
        }
        break

      case 2: // Quick Qualification
        if (!yearsInBusiness) {
          newErrors.yearsInBusiness = 'Please select years in business'
        }
        if (!monthlyVolume) {
          newErrors.monthlyVolume = 'Please select your monthly volume'
        }
        if (!geographicFocus) {
          newErrors.geographicFocus = 'Please select your geographic focus'
        }
        break

      case 3: // Review
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validateStep()) return

    if (step < 3) {
      setStep(prev => prev + 1)
      window.scrollTo(0, 0)
    } else {
      await handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !companyId) return

    // Build qualification data for scoring (combine profile + offering data)
    const qualificationData = {
      ...profileData,
      // Funding info
      capitalAmount: fundingAmount,
      fundingPurpose,
      timeline,
      // Deal context
      hasExistingFacility,
      facilityDetails,
      dealAssets,
      dealAssetOther,
      // Quick qualification
      yearsInBusiness,
      monthlyVolume,
      geographicFocus,
      // For scoring compatibility
      assetClass: dealAssets.length > 0 ? dealAssets : profileData.loanAssetClasses,
      geoFocus: geographicFocus || profileData.geographicFocus || (profileData.locatedInUS ? 'United States' : profileData.country),
    }

    // Score the application
    const scoringResult = scoreOriginatorAdvanced(qualificationData)

    // Create deal with scoring data (profile data is NOT modified)
    const qualificationCode = `BCS-${Date.now().toString(36).toUpperCase()}`
    const dealExtendedData = {
      // Offering-specific data
      fundingAmount,
      fundingPurpose,
      timeline,
      // Deal context
      hasExistingFacility,
      facilityDetails,
      dealAssets,
      dealAssetOther,
      // Quick qualification
      yearsInBusiness,
      monthlyVolume,
      geographicFocus,
      // Scoring results
      qualificationScore: scoringResult.qualificationTier,
      overallScore: scoringResult.overallScore,
      capitalFits: scoringResult.capitalFits,
      recommendedStructure: scoringResult.recommendedStructure,
      opportunitySize: scoringResult.opportunitySize,
      timeToFunding: scoringResult.timeToFunding,
      strengths: scoringResult.strengths,
      considerations: scoringResult.considerations,
      nextSteps: scoringResult.nextSteps,
      dimensions: scoringResult.dimensions,
    }

    const dealData = {
      company_id: companyId,
      qualification_code: qualificationCode,
      stage: 'qualified',
      capital_amount: fundingAmount,
      funding_purpose: fundingPurpose,
      qualification_score: scoringResult.qualificationTier,
      overall_score: scoringResult.overallScore,
      notes: JSON.stringify(dealExtendedData),
    }

    let dealIdToRedirect = existingDealId

    if (existingDealId) {
      await supabase.from('deals').update(dealData).eq('id', existingDealId)
    } else {
      const { data: newDeal } = await supabase
        .from('deals')
        .insert(dealData)
        .select()
        .single()

      if (newDeal) {
        setExistingDealId(newDeal.id)
        dealIdToRedirect = newDeal.id
      }
    }

    setSaving(false)

    // Redirect directly to the application detail page
    if (dealIdToRedirect) {
      router.push(`/dashboard/application/${dealIdToRedirect}`)
    } else {
      // If somehow we don't have the ID, go to dashboard
      router.push('/dashboard')
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(prev => prev - 1)
      window.scrollTo(0, 0)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Form view
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                {existingDealId ? 'Update Offering' : 'New Capital Offering'}
              </h1>
            </div>
            <span className="text-sm text-gray-400">
              Step {step + 1} of {totalSteps}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-hover rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* No Profile Banner */}
        {!hasProfile && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 mb-1">Complete your business profile first</h3>
                <p className="text-amber-700 text-sm mb-3">
                  Set up your business profile with company info and assets before creating a capital offering.
                </p>
                <Link href="/dashboard/profile">
                  <Button size="sm">Set Up Profile</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Profile Summary Header */}
        {hasProfile && profileData && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-accent font-semibold text-sm">
                  {profileData.companyName ? profileData.companyName.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{profileData.companyName}</p>
                <p className="text-xs text-gray-500">
                  {profileData.assets?.map((a: string) => assetLabels[a] || a).join(', ')}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/profile"
              className="text-sm text-accent hover:text-accent-hover flex items-center gap-1"
            >
              Edit Profile
            </Link>
          </div>
        )}

        <div className="bg-white rounded-2xl border-2 border-gray-100 p-8">
          {/* Step 0: Funding Details */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Funding Details</h2>
                <p className="text-gray-500">Specify your funding requirements</p>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How much capital are you seeking?
                </label>
                <p className="text-xs text-gray-500 mb-3">Enter an amount between $1,000,000 and $100,000,000</p>
                <div className="relative">
                  <input
                    type="text"
                    value={fundingAmountInput}
                    onChange={(e) => handleFundingAmountChange(e.target.value)}
                    onFocus={() => setShowAmountSuggestions(true)}
                    onBlur={handleAmountBlur}
                    placeholder="$10,000,000"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.fundingAmount ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500' : 'border-gray-200 focus:ring-accent/30 focus:border-accent'
                    } bg-white text-gray-900 focus:outline-none focus:ring-2 text-lg`}
                  />
                  {fundingAmount !== null && fundingAmount >= MIN_FUNDING && fundingAmount <= MAX_FUNDING && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Autocomplete suggestions */}
                {showAmountSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    <p className="px-3 py-2 text-xs text-gray-400 border-b border-gray-100">Quick select</p>
                    <div className="grid grid-cols-3 gap-1 p-2">
                      {fundingAmountSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.value}
                          type="button"
                          onMouseDown={() => handleAmountSuggestionClick(suggestion.value)}
                          className={`px-3 py-2 text-sm rounded-md transition-colors text-center ${
                            fundingAmount === suggestion.value
                              ? 'bg-accent text-white'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {suggestion.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {errors.fundingAmount && <p className="text-sm text-red-500 mt-2">{errors.fundingAmount}</p>}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Primary use of funds</p>
                <div className="grid grid-cols-2 gap-2">
                  {fundingPurposeOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={fundingPurpose === option.value}
                      onClick={() => setFundingPurpose(option.value)}
                    />
                  ))}
                </div>
                {errors.fundingPurpose && <p className="text-sm text-red-500 mt-2">{errors.fundingPurpose}</p>}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">When do you need funding?</p>
                <div className="grid grid-cols-4 gap-2">
                  {timelineOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={timeline === option.value}
                      onClick={() => setTimeline(option.value)}
                    />
                  ))}
                </div>
                {errors.timeline && <p className="text-sm text-red-500 mt-2">{errors.timeline}</p>}
              </div>
            </div>
          )}

          {/* Step 1: Deal Context */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Deal Context</h2>
                <p className="text-gray-500">Help us understand this specific deal</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Do you have existing credit facilities or debt?</p>
                <div className="grid grid-cols-2 gap-2">
                  <SelectCard
                    label="Yes"
                    selected={hasExistingFacility === true}
                    onClick={() => setHasExistingFacility(true)}
                  />
                  <SelectCard
                    label="No"
                    selected={hasExistingFacility === false}
                    onClick={() => setHasExistingFacility(false)}
                  />
                </div>
                {errors.hasExistingFacility && <p className="text-sm text-red-500 mt-2">{errors.hasExistingFacility}</p>}
              </div>

              {hasExistingFacility && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brief details <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={facilityDetails}
                    onChange={(e) => setFacilityDetails(e.target.value)}
                    placeholder="Current lender, facility size, maturity date..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-accent/30 focus:border-accent bg-white text-gray-900 focus:outline-none focus:ring-2"
                  />
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">What assets back this deal?</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(assetLabels).slice(0, 8).map(([value, label]) => (
                    <SelectCard
                      key={value}
                      label={label}
                      selected={dealAssets.includes(value)}
                      onClick={() => {
                        if (dealAssets.includes(value)) {
                          setDealAssets(dealAssets.filter(a => a !== value))
                        } else {
                          setDealAssets([...dealAssets, value])
                        }
                      }}
                    />
                  ))}
                  <SelectCard
                    label="Other"
                    selected={dealAssets.includes('other')}
                    onClick={() => {
                      if (dealAssets.includes('other')) {
                        setDealAssets(dealAssets.filter(a => a !== 'other'))
                        setDealAssetOther('')
                      } else {
                        setDealAssets([...dealAssets, 'other'])
                      }
                    }}
                  />
                </div>
                {errors.dealAssets && <p className="text-sm text-red-500 mt-2">{errors.dealAssets}</p>}

                {dealAssets.includes('other') && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={dealAssetOther}
                      onChange={(e) => setDealAssetOther(e.target.value)}
                      placeholder="Describe your asset type..."
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.dealAssetOther ? 'border-red-300 focus:ring-red-500/30 focus:border-red-500' : 'border-gray-200 focus:ring-accent/30 focus:border-accent'
                      } bg-white text-gray-900 focus:outline-none focus:ring-2`}
                    />
                    {errors.dealAssetOther && <p className="text-sm text-red-500 mt-2">{errors.dealAssetOther}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Quick Qualification */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Quick Qualification</h2>
                <p className="text-gray-500">A few more details to match you with the right capital</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Years in business</p>
                  <div className="space-y-2">
                    {yearsInBusinessOptions.map((option) => (
                      <SelectCard
                        key={option.value}
                        label={option.label}
                        selected={yearsInBusiness === option.value}
                        onClick={() => setYearsInBusiness(option.value)}
                      />
                    ))}
                  </div>
                  {errors.yearsInBusiness && <p className="text-sm text-red-500 mt-2">{errors.yearsInBusiness}</p>}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Monthly volume</p>
                  <div className="space-y-2">
                    {volumeOptions.map((option) => (
                      <SelectCard
                        key={option.value}
                        label={option.label}
                        selected={monthlyVolume === option.value}
                        onClick={() => setMonthlyVolume(option.value)}
                      />
                    ))}
                  </div>
                  {errors.monthlyVolume && <p className="text-sm text-red-500 mt-2">{errors.monthlyVolume}</p>}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Geographic focus</p>
                <div className="grid grid-cols-2 gap-2">
                  {geographyOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={geographicFocus === option.value}
                      onClick={() => setGeographicFocus(option.value)}
                    />
                  ))}
                </div>
                {errors.geographicFocus && <p className="text-sm text-red-500 mt-2">{errors.geographicFocus}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Review Your Offering</h2>
                <p className="text-gray-500">Confirm the details before submitting</p>
              </div>

              {/* Business Profile Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase">Business Profile</h3>
                  <Link href="/dashboard/profile" className="text-xs text-accent hover:text-accent-hover">Edit</Link>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-400">Company</p>
                    <p className="font-medium text-gray-900">{profileData?.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Assets</p>
                    <p className="font-medium text-gray-900">
                      {profileData?.assets?.map((a: string) => assetLabels[a] || a).join(', ')}
                    </p>
                  </div>
                  {profileData?.annualVolume && (
                    <div>
                      <p className="text-xs text-gray-400">Annual Volume</p>
                      <p className="font-medium text-gray-900">{profileData.annualVolume}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Offering Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">This Offering</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Amount Seeking</p>
                    <p className="font-medium text-gray-900">
                      {fundingAmount !== null ? formatCurrency(fundingAmount) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Purpose</p>
                    <p className="font-medium text-gray-900">
                      {fundingPurposeOptions.find(o => o.value === fundingPurpose)?.label || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Timeline</p>
                    <p className="font-medium text-gray-900">
                      {timelineOptions.find(o => o.value === timeline)?.label || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Existing Facilities</p>
                    <p className="font-medium text-gray-900">
                      {hasExistingFacility ? 'Yes' : 'No'}
                      {hasExistingFacility && facilityDetails && ` - ${facilityDetails}`}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Deal Assets</p>
                    <p className="font-medium text-gray-900">
                      {dealAssets.map(a => {
                        if (a === 'other' && dealAssetOther) {
                          return `Other: ${dealAssetOther}`
                        }
                        return assetLabels[a] || a
                      }).join(', ') || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Qualification Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Qualification</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Years in Business</p>
                    <p className="font-medium text-gray-900">
                      {yearsInBusinessOptions.find(o => o.value === yearsInBusiness)?.label || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Monthly Volume</p>
                    <p className="font-medium text-gray-900">
                      {volumeOptions.find(o => o.value === monthlyVolume)?.label || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Geographic Focus</p>
                    <p className="font-medium text-gray-900">
                      {geographyOptions.find(o => o.value === geographicFocus)?.label || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">Ready to submit</p>
                    <p className="text-sm text-green-600">
                      We'll analyze your profile and match you with suitable capital options.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
            {step > 0 && (
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
            )}
            {hasProfile ? (
              <Button fullWidth onClick={handleNext} disabled={saving}>
                {saving ? 'Submitting...' : step === 3 ? 'Submit Offering' : 'Continue'}
              </Button>
            ) : (
              <Link href="/dashboard/profile" className="flex-1">
                <Button fullWidth>
                  Set Up Business Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ApplyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <ApplyPageContent />
    </Suspense>
  )
}

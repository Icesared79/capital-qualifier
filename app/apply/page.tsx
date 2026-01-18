'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import SelectCard from '@/components/ui/SelectCard'
import MultiSelect from '@/components/ui/MultiSelect'
import TextInput from '@/components/ui/TextInput'

const TOTAL_STEPS = 4

// Asset/collateral options
const assetOptions = [
  { value: 'loan_portfolio', label: 'Loan Portfolio', description: 'I originate loans (real estate, consumer, business, etc.)' },
  { value: 'real_estate', label: 'Real Estate', description: 'Commercial or residential property' },
  { value: 'equipment', label: 'Equipment / Inventory', description: 'Physical business assets' },
  { value: 'receivables', label: 'Receivables / Invoices', description: 'Accounts receivable, contracts' },
  { value: 'cash_flow', label: 'Business Cash Flow', description: 'Revenue-based lending' },
  { value: 'other', label: 'Other', description: 'Other asset types' },
]

// Loan portfolio asset class options (shown if loan_portfolio is selected)
const loanAssetClassOptions = [
  { value: 'residential_re', label: 'Residential Real Estate' },
  { value: 'commercial_re', label: 'Commercial Real Estate' },
  { value: 'consumer', label: 'Consumer Loans' },
  { value: 'smb', label: 'SMB / Business Loans' },
  { value: 'equipment_finance', label: 'Equipment Finance' },
  { value: 'specialty', label: 'Specialty Finance' },
]

// Real estate type options (shown if real_estate is selected)
const realEstateTypeOptions = [
  { value: 'multifamily', label: 'Multifamily / Apartments' },
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'industrial', label: 'Industrial / Warehouse' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'mixed_use', label: 'Mixed Use' },
  { value: 'land', label: 'Land / Development' },
  { value: 'single_family', label: 'Single Family Residential' },
]

// Funding amount options
const fundingAmountOptions = [
  { value: 'under_500k', label: 'Under $500K' },
  { value: '500k_2m', label: '$500K - $2M' },
  { value: '2m_10m', label: '$2M - $10M' },
  { value: '10m_50m', label: '$10M - $50M' },
  { value: 'over_50m', label: '$50M+' },
]

// Funding purpose options
const fundingPurposeOptions = [
  { value: 'working_capital', label: 'Working Capital / Growth' },
  { value: 'acquisition', label: 'Acquisition or Purchase' },
  { value: 'refinance', label: 'Refinance Existing Debt' },
  { value: 'construction', label: 'Construction / Development' },
  { value: 'portfolio_expansion', label: 'Portfolio Expansion' },
  { value: 'other', label: 'Other' },
]

// Country options for non-US
const countryOptions = [
  { value: 'Canada', label: 'Canada' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Hong Kong', label: 'Hong Kong' },
  { value: 'Japan', label: 'Japan' },
  { value: 'UAE', label: 'United Arab Emirates' },
  { value: 'Israel', label: 'Israel' },
  { value: 'Mexico', label: 'Mexico' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'India', label: 'India' },
  { value: 'Other', label: 'Other' },
]

export default function ApplyPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Business info
  const [companyName, setCompanyName] = useState('')
  const [locatedInUS, setLocatedInUS] = useState(true)
  const [country, setCountry] = useState('')
  const [countryOther, setCountryOther] = useState('')
  const [location, setLocation] = useState('') // city, state for US

  // Assets
  const [assets, setAssets] = useState<string[]>([])
  const [loanAssetClasses, setLoanAssetClasses] = useState<string[]>([])
  const [realEstateTypes, setRealEstateTypes] = useState<string[]>([])
  const [assetOther, setAssetOther] = useState('')

  // Funding need
  const [fundingAmount, setFundingAmount] = useState('')
  const [fundingPurpose, setFundingPurpose] = useState('')
  const [fundingPurposeOther, setFundingPurposeOther] = useState('')

  // Contact info
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const validateStep = () => {
    const newErrors: Record<string, string> = {}

    if (step === 0) {
      if (!companyName.trim()) newErrors.companyName = 'Company name is required'
      if (!locatedInUS && !country) newErrors.country = 'Please select your country'
      if (!locatedInUS && country === 'Other' && !countryOther.trim()) {
        newErrors.countryOther = 'Please specify your country'
      }
    } else if (step === 1) {
      if (assets.length === 0) newErrors.assets = 'Please select at least one asset type'
      if (assets.includes('loan_portfolio') && loanAssetClasses.length === 0) {
        newErrors.loanAssetClasses = 'Please select what types of loans you originate'
      }
      if (assets.includes('other') && !assetOther.trim()) {
        newErrors.assetOther = 'Please describe your asset type'
      }
    } else if (step === 2) {
      if (!fundingAmount) newErrors.fundingAmount = 'Please select a funding amount'
      if (!fundingPurpose) newErrors.fundingPurpose = 'Please select a funding purpose'
      if (fundingPurpose === 'other' && !fundingPurposeOther.trim()) {
        newErrors.fundingPurposeOther = 'Please describe your funding purpose'
      }
    } else if (step === 3) {
      if (!contactName.trim()) newErrors.contactName = 'Your name is required'
      if (!email.trim()) newErrors.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validateStep()) return

    if (step < TOTAL_STEPS - 1) {
      setStep(prev => prev + 1)
      window.scrollTo(0, 0)
    } else {
      // Submit
      setIsSubmitting(true)

      try {
        const response = await fetch('/api/submit-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadType: 'unified',
            data: {
              // Business info
              companyName,
              locatedInUS,
              country: locatedInUS ? 'United States' : country,
              countryOther,
              location,
              // Assets
              assets,
              loanAssetClasses,
              realEstateTypes,
              assetOther,
              // Funding need
              fundingAmount,
              fundingPurpose,
              fundingPurposeOther,
              // Contact
              contactName,
              email,
              phone,
            },
            qualificationScore: 'pending',
            qualificationFactors: {
              note: 'Lead capture - full qualification pending',
            },
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to submit')
        }

        // Store lead data in localStorage for use after signup
        const leadData = {
          companyName,
          locatedInUS,
          country: locatedInUS ? 'United States' : country,
          countryOther,
          location,
          assets,
          loanAssetClasses,
          realEstateTypes,
          assetOther,
          fundingAmount,
          fundingPurpose,
          fundingPurposeOther,
          contactName,
          email,
          phone,
          submittedAt: new Date().toISOString(),
        }
        localStorage.setItem('pendingLeadData', JSON.stringify(leadData))

        setSubmitted(true)
      } catch (error) {
        setErrors({ submit: 'Something went wrong. Please try again.' })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(prev => prev - 1)
      window.scrollTo(0, 0)
    }
  }

  // Get step title
  const getStepTitle = () => {
    switch (step) {
      case 0: return 'About Your Business'
      case 1: return 'Your Assets & Collateral'
      case 2: return 'Your Funding Need'
      case 3: return 'Contact Information'
      default: return ''
    }
  }

  // Success screen
  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">You're In!</h1>
          <p className="text-gray-600 mb-8">
            Thanks for your interest in BitCense Capital. Create your account to complete
            your qualification and get matched with the right capital solutions.
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">What's next?</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-accent text-white text-sm font-medium flex items-center justify-center flex-shrink-0">1</span>
                <span className="text-gray-600">Complete your profile and get your AI-powered qualification score</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-sm font-medium flex items-center justify-center flex-shrink-0">2</span>
                <span className="text-gray-600">Get matched with optimal capital structures</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-sm font-medium flex items-center justify-center flex-shrink-0">3</span>
                <span className="text-gray-600">Upload documents and get matched with funding partners</span>
              </li>
            </ul>
          </div>

          <Button fullWidth size="lg" onClick={() => router.push('/signup')}>
            Create Your Account
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col px-6 py-20">
      <div className="max-w-lg w-full mx-auto flex-1 flex flex-col">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-500 hover:text-accent mb-8 transition-colors text-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Apply for Capital
            </h1>
            <p className="text-gray-500">
              Get scored in minutes by our proprietary qualification engine
            </p>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  i <= step ? 'bg-accent' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Step Title */}
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{getStepTitle()}</h2>

          {/* Step 0: About Your Business */}
          {step === 0 && (
            <div className="flex-1 space-y-5">
              <TextInput
                label="Company / Business Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                error={errors.companyName}
                placeholder="Acme Capital LLC"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={locatedInUS ? 'US' : 'Non-US'}
                  onChange={(e) => setLocatedInUS(e.target.value === 'US')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                >
                  <option value="US">United States</option>
                  <option value="Non-US">Outside United States</option>
                </select>
              </div>

              {locatedInUS ? (
                <TextInput
                  label="City, State"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="New York, NY"
                />
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                    >
                      <option value="">Select your country...</option>
                      {countryOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country}</p>}
                  </div>
                  {country === 'Other' && (
                    <TextInput
                      label="Please specify your country"
                      value={countryOther}
                      onChange={(e) => setCountryOther(e.target.value)}
                      error={errors.countryOther}
                      placeholder="Enter country name"
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 1: Assets & Collateral */}
          {step === 1 && (
            <div className="flex-1 space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  What assets does your business have? Select all that apply.
                </p>
                <MultiSelect
                  options={assetOptions}
                  selected={assets}
                  onChange={setAssets}
                />
                {errors.assets && <p className="text-sm text-red-500 mt-2">{errors.assets}</p>}
              </div>

              {/* Conditional: Loan Portfolio details */}
              {assets.includes('loan_portfolio') && (
                <div className="pl-4 border-l-2 border-accent/30">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    What types of loans do you originate?
                  </p>
                  <MultiSelect
                    options={loanAssetClassOptions}
                    selected={loanAssetClasses}
                    onChange={setLoanAssetClasses}
                  />
                  {errors.loanAssetClasses && (
                    <p className="text-sm text-red-500 mt-2">{errors.loanAssetClasses}</p>
                  )}
                </div>
              )}

              {/* Conditional: Real Estate details */}
              {assets.includes('real_estate') && (
                <div className="pl-4 border-l-2 border-accent/30">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    What type of real estate?
                  </p>
                  <MultiSelect
                    options={realEstateTypeOptions}
                    selected={realEstateTypes}
                    onChange={setRealEstateTypes}
                  />
                </div>
              )}

              {/* Conditional: Other description */}
              {assets.includes('other') && (
                <TextInput
                  label="Please describe your assets"
                  value={assetOther}
                  onChange={(e) => setAssetOther(e.target.value)}
                  error={errors.assetOther}
                  placeholder="Describe your asset type..."
                />
              )}
            </div>
          )}

          {/* Step 2: Funding Need */}
          {step === 2 && (
            <div className="flex-1 space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-4">How much capital do you need?</p>
                <div className="space-y-3">
                  {fundingAmountOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={fundingAmount === option.value}
                      onClick={() => setFundingAmount(option.value)}
                    />
                  ))}
                </div>
                {errors.fundingAmount && (
                  <p className="text-sm text-red-500 mt-2">{errors.fundingAmount}</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-4">What is this funding for?</p>
                <div className="space-y-3">
                  {fundingPurposeOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={fundingPurpose === option.value}
                      onClick={() => setFundingPurpose(option.value)}
                    />
                  ))}
                </div>
                {errors.fundingPurpose && (
                  <p className="text-sm text-red-500 mt-2">{errors.fundingPurpose}</p>
                )}
              </div>

              {fundingPurpose === 'other' && (
                <TextInput
                  label="Please describe"
                  value={fundingPurposeOther}
                  onChange={(e) => setFundingPurposeOther(e.target.value)}
                  error={errors.fundingPurposeOther}
                  placeholder="Describe your funding purpose..."
                />
              )}
            </div>
          )}

          {/* Step 3: Contact Info */}
          {step === 3 && (
            <div className="flex-1 space-y-4">
              <TextInput
                label="Your Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                error={errors.contactName}
                placeholder="John Smith"
              />
              <TextInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="john@example.com"
              />
              <TextInput
                label="Phone (optional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
              {errors.submit && (
                <p className="text-sm text-red-500">{errors.submit}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
            {step > 0 && (
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button fullWidth onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : step === TOTAL_STEPS - 1 ? 'Submit' : 'Continue'}
            </Button>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Secure & confidential • Instant results • No commitment required
          </p>
        </div>
      </div>
    </main>
  )
}

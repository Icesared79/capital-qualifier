'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import SelectCard from '@/components/ui/SelectCard'
import MultiSelect from '@/components/ui/MultiSelect'
import TextInput from '@/components/ui/TextInput'
import ProgressBar from '@/components/ui/ProgressBar'
import ResultCard from '@/components/ui/ResultCard'
import { BorrowerData } from '@/lib/types'
import { scoreBorrower } from '@/lib/scoring'

const TOTAL_STEPS = 7

const fundingPurposeOptions = [
  { value: 'Bridge financing (short-term)', label: 'Bridge Financing (Short-Term)' },
  { value: 'Working capital', label: 'Working Capital' },
  { value: 'Acquisition or purchase', label: 'Acquisition Or Purchase' },
  { value: 'Refinance existing debt', label: 'Refinance Existing Debt' },
  { value: 'Construction or renovation', label: 'Construction Or Renovation' },
  { value: 'Growth/expansion', label: 'Growth/Expansion' },
  { value: 'Other', label: 'Other' },
]

const amountOptions = [
  { value: 'Under $250,000', label: 'Under $250,000' },
  { value: '$250,000 - $500,000', label: '$250,000 - $500,000' },
  { value: '$500,000 - $1,000,000', label: '$500,000 - $1,000,000' },
  { value: '$1,000,000 - $5,000,000', label: '$1,000,000 - $5,000,000' },
  { value: '$5,000,000+', label: '$5,000,000+' },
]

const timelineOptions = [
  { value: 'ASAP (within 1-2 weeks)', label: 'ASAP (Within 1-2 Weeks)' },
  { value: 'Within 1 month', label: 'Within 1 Month' },
  { value: '1-2 months', label: '1-2 Months' },
  { value: '2+ months', label: '2+ Months' },
  { value: 'Just exploring', label: 'Just Exploring' },
]

const collateralOptions = [
  { value: 'Commercial real estate', label: 'Commercial Real Estate' },
  { value: 'Residential real estate', label: 'Residential Real Estate' },
  { value: 'Equipment/vehicles', label: 'Equipment/Vehicles' },
  { value: 'Accounts receivable', label: 'Accounts Receivable' },
  { value: 'No collateral available', label: 'No Collateral Available' },
  { value: 'Other', label: 'Other' },
]

const assetValueOptions = [
  { value: 'Under $500,000', label: 'Under $500,000' },
  { value: '$500,000 - $1,000,000', label: '$500,000 - $1,000,000' },
  { value: '$1,000,000 - $5,000,000', label: '$1,000,000 - $5,000,000' },
  { value: '$5,000,000 - $10,000,000', label: '$5,000,000 - $10,000,000' },
  { value: '$10,000,000+', label: '$10,000,000+' },
  { value: 'N/A', label: 'N/A' },
]

const existingDebtOptions = [
  { value: 'None', label: 'None' },
  { value: 'Under 50% LTV', label: 'Under 50% LTV' },
  { value: '50-70% LTV', label: '50-70% LTV' },
  { value: 'Over 70% LTV', label: 'Over 70% LTV' },
  { value: 'Not sure', label: 'Not Sure' },
  { value: 'N/A', label: 'N/A' },
]

const businessTypeOptions = [
  { value: 'Real estate investor/developer', label: 'Real Estate Investor/Developer' },
  { value: 'Operating business', label: 'Operating Business' },
  { value: 'Professional services', label: 'Professional Services' },
  { value: 'Retail/restaurant', label: 'Retail/Restaurant' },
  { value: 'Construction/trades', label: 'Construction/Trades' },
  { value: 'Other', label: 'Other' },
]

const yearsOptions = [
  { value: 'Under 1 year', label: 'Under 1 Year' },
  { value: '1-2 years', label: '1-2 Years' },
  { value: '2-5 years', label: '2-5 Years' },
  { value: '5+ years', label: '5+ Years' },
]

const revenueOptions = [
  { value: 'Under $500,000', label: 'Under $500,000' },
  { value: '$500,000 - $2,000,000', label: '$500,000 - $2,000,000' },
  { value: '$2,000,000 - $10,000,000', label: '$2,000,000 - $10,000,000' },
  { value: '$10,000,000+', label: '$10,000,000+' },
  { value: 'Pre-revenue', label: 'Pre-Revenue' },
]

const bankStatusOptions = [
  { value: 'Yes - approved', label: 'Yes - Approved' },
  { value: 'Yes - rejected', label: 'Yes - Rejected' },
  { value: 'Yes - process too slow', label: 'Yes - Process Too Slow' },
  { value: "No - haven't tried", label: "No - Haven't Tried" },
  { value: "No - traditional lending requirements don't fit", label: "No - Traditional Lending Requirements Don't Fit" },
]

const rejectionReasonOptions = [
  { value: 'Credit score', label: 'Credit Score' },
  { value: 'Income documentation', label: 'Income Documentation' },
  { value: 'Timeline', label: 'Timeline' },
  { value: 'Loan size', label: 'Loan Size' },
  { value: 'Property type', label: 'Property Type' },
  { value: 'Business too new', label: 'Business Too New' },
  { value: 'Too much existing debt', label: 'Too Much Existing Debt' },
  { value: 'Other/unsure', label: 'Other/Unsure' },
]

const bestTimeOptions = [
  { value: 'Morning', label: 'Morning' },
  { value: 'Afternoon', label: 'Afternoon' },
  { value: 'Evening', label: 'Evening' },
  { value: 'Anytime', label: 'Anytime' },
]

export default function BorrowerPage() {
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [data, setData] = useState<Partial<BorrowerData>>({
    fundingPurpose: '',
    fundingPurposeOther: '',
    amountNeeded: '',
    timeline: '',
    collateralType: '',
    collateralOther: '',
    assetValue: '',
    existingDebt: '',
    businessType: '',
    businessTypeOther: '',
    yearsInBusiness: '',
    annualRevenue: '',
    bankStatus: '',
    rejectionReasons: [],
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    bestTimeToReach: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof scoreBorrower> | null>(null)

  const updateData = (field: keyof BorrowerData, value: string | string[]) => {
    setData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = () => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 0:
        if (!data.fundingPurpose) newErrors.fundingPurpose = 'Please select a funding purpose'
        break
      case 1:
        if (!data.amountNeeded) newErrors.amountNeeded = 'Please select funding amount'
        if (!data.timeline) newErrors.timeline = 'Please select a timeline'
        break
      case 2:
        if (!data.collateralType) newErrors.collateralType = 'Please select collateral type'
        break
      case 3:
        if (!data.businessType) newErrors.businessType = 'Please select business type'
        if (!data.yearsInBusiness) newErrors.yearsInBusiness = 'Please select years in business'
        if (!data.annualRevenue) newErrors.annualRevenue = 'Please select annual revenue'
        break
      case 4:
        // Bank status is optional, no validation needed
        break
      case 5:
        if (!data.companyName?.trim()) newErrors.companyName = 'Company/property name is required'
        if (!data.contactName?.trim()) newErrors.contactName = 'Your name is required'
        if (!data.email?.trim()) newErrors.email = 'Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          newErrors.email = 'Please enter a valid email'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validateStep()) return

    if (step === 5) {
      // Submit the form
      setIsSubmitting(true)
      setSubmitError('')

      try {
        const scoringResult = scoreBorrower(data)

        const response = await fetch('/api/submit-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadType: 'borrower',
            data,
            qualificationScore: scoringResult.score,
            qualificationFactors: {
              strengths: scoringResult.strengths,
              considerations: scoringResult.considerations,
            },
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to submit')
        }

        setResult(scoringResult)
        setStep(6)
      } catch {
        setSubmitError('Something went wrong. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1)
    }
  }

  const showAssetValueAndDebt = data.collateralType && data.collateralType !== 'No collateral available'

  return (
    <main className="min-h-screen flex flex-col px-6 py-8 md:px-10">
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-text-secondary hover:text-accent mb-6 transition-colors text-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back To Start
        </Link>

        {/* Main Card Container */}
        <div className="bg-surface rounded-card shadow-md p-8 md:p-10 flex-1 flex flex-col">
          {/* Header */}
          {step < 6 && (
            <div className="mb-8 pb-6 border-b border-border-light">
              <h1 className="text-2xl font-bold text-text-primary mb-1">
                Funding Qualification
              </h1>
              <p className="text-text-secondary text-sm mb-6">
                Help us understand your funding needs.
              </p>
              <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS - 1} />
            </div>
          )}

        {/* Form Steps */}
        <div className="flex-1">
          {/* Step 0: Funding Purpose */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                What do you need funding for?
              </h2>
              <div className="space-y-3">
                {fundingPurposeOptions.map((option) => (
                  <SelectCard
                    key={option.value}
                    label={option.label}
                    selected={data.fundingPurpose === option.value}
                    onClick={() => updateData('fundingPurpose', option.value)}
                  />
                ))}
              </div>
              {data.fundingPurpose === 'Other' && (
                <div className="mt-4">
                  <TextInput
                    label="Please describe your funding need"
                    value={data.fundingPurposeOther || ''}
                    onChange={(e) => updateData('fundingPurposeOther', e.target.value)}
                  />
                </div>
              )}
              {errors.fundingPurpose && (
                <p className="text-sm text-red-500">{errors.fundingPurpose}</p>
              )}
            </div>
          )}

          {/* Step 1: Amount & Timeline */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  How much do you need?
                </h2>
                <div className="space-y-3">
                  {amountOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={data.amountNeeded === option.value}
                      onClick={() => updateData('amountNeeded', option.value)}
                    />
                  ))}
                </div>
                {errors.amountNeeded && (
                  <p className="text-sm text-red-500 mt-2">{errors.amountNeeded}</p>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  When do you need it?
                </h2>
                <div className="space-y-3">
                  {timelineOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={data.timeline === option.value}
                      onClick={() => updateData('timeline', option.value)}
                    />
                  ))}
                </div>
                {errors.timeline && (
                  <p className="text-sm text-red-500 mt-2">{errors.timeline}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Collateral/Assets */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Do you have assets to secure the loan?
                </h2>
                <div className="space-y-3">
                  {collateralOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={data.collateralType === option.value}
                      onClick={() => updateData('collateralType', option.value)}
                    />
                  ))}
                </div>
                {data.collateralType === 'Other' && (
                  <div className="mt-4">
                    <TextInput
                      label="Please describe your collateral"
                      value={data.collateralOther || ''}
                      onChange={(e) => updateData('collateralOther', e.target.value)}
                    />
                  </div>
                )}
                {errors.collateralType && (
                  <p className="text-sm text-red-500 mt-2">{errors.collateralType}</p>
                )}
              </div>

              {showAssetValueAndDebt && (
                <>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-4">
                      Estimated asset value
                    </h2>
                    <div className="space-y-3">
                      {assetValueOptions.map((option) => (
                        <SelectCard
                          key={option.value}
                          label={option.label}
                          selected={data.assetValue === option.value}
                          onClick={() => updateData('assetValue', option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-4">
                      Existing debt on asset
                    </h2>
                    <div className="space-y-3">
                      {existingDebtOptions.map((option) => (
                        <SelectCard
                          key={option.value}
                          label={option.label}
                          selected={data.existingDebt === option.value}
                          onClick={() => updateData('existingDebt', option.value)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Business Profile */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Business type
                </h2>
                <div className="space-y-3">
                  {businessTypeOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={data.businessType === option.value}
                      onClick={() => updateData('businessType', option.value)}
                    />
                  ))}
                </div>
                {data.businessType === 'Other' && (
                  <div className="mt-4">
                    <TextInput
                      label="Please describe your business type"
                      value={data.businessTypeOther || ''}
                      onChange={(e) => updateData('businessTypeOther', e.target.value)}
                    />
                  </div>
                )}
                {errors.businessType && (
                  <p className="text-sm text-red-500 mt-2">{errors.businessType}</p>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Years in business
                </h2>
                <div className="space-y-3">
                  {yearsOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={data.yearsInBusiness === option.value}
                      onClick={() => updateData('yearsInBusiness', option.value)}
                    />
                  ))}
                </div>
                {errors.yearsInBusiness && (
                  <p className="text-sm text-red-500 mt-2">{errors.yearsInBusiness}</p>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Annual revenue
                </h2>
                <div className="space-y-3">
                  {revenueOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={data.annualRevenue === option.value}
                      onClick={() => updateData('annualRevenue', option.value)}
                    />
                  ))}
                </div>
                {errors.annualRevenue && (
                  <p className="text-sm text-red-500 mt-2">{errors.annualRevenue}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Bank Status (Optional) */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-2">
                  Have you approached a bank?
                </h2>
                <p className="text-sm text-gray-500 mb-4">This helps us understand your situation (optional)</p>
                <div className="space-y-3">
                  {bankStatusOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={data.bankStatus === option.value}
                      onClick={() => updateData('bankStatus', option.value)}
                    />
                  ))}
                </div>
              </div>

              {data.bankStatus === 'Yes - rejected' && (
                <div>
                  <h2 className="text-lg font-semibold text-text-primary mb-2">
                    If rejected, why?
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">Select all that apply (optional)</p>
                  <MultiSelect
                    options={rejectionReasonOptions}
                    selected={data.rejectionReasons || []}
                    onChange={(selected) => updateData('rejectionReasons', selected)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 5: Contact */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Your contact information
              </h2>
              <TextInput
                label="Company/property name"
                value={data.companyName || ''}
                onChange={(e) => updateData('companyName', e.target.value)}
                error={errors.companyName}
              />
              <TextInput
                label="Your name"
                value={data.contactName || ''}
                onChange={(e) => updateData('contactName', e.target.value)}
                error={errors.contactName}
              />
              <TextInput
                label="Email"
                type="email"
                value={data.email || ''}
                onChange={(e) => updateData('email', e.target.value)}
                error={errors.email}
              />
              <TextInput
                label="Phone (optional)"
                type="tel"
                value={data.phone || ''}
                onChange={(e) => updateData('phone', e.target.value)}
              />
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-3">Best time to reach you</h3>
                <div className="grid grid-cols-2 gap-3">
                  {bestTimeOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={data.bestTimeToReach === option.value}
                      onClick={() => updateData('bestTimeToReach', option.value)}
                    />
                  ))}
                </div>
              </div>
              {submitError && (
                <p className="text-sm text-red-500">{submitError}</p>
              )}
            </div>
          )}

          {/* Step 6: Results */}
          {step === 6 && result && (
            <div className="space-y-6">
              <ResultCard score={result.score} type="borrower" />

              <div className="p-5 rounded-card bg-card-warm border border-border-light">
                <h3 className="font-semibold text-text-primary mb-2">Your Timeline</h3>
                <ul className="text-text-secondary text-sm space-y-1">
                  <li>Submit documents: Today</li>
                  <li>Receive term sheet: 24-48 hours</li>
                  <li>Final approval: 5-7 days</li>
                  <li>Funding: Day 7-10</li>
                </ul>
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => window.open('https://cal.com/bitcense', '_blank')}
                >
                  Start Your Application
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => window.location.href = '/'}
                >
                  Back to Start
                </Button>
              </div>
            </div>
          )}
        </div>

          {/* Navigation Buttons */}
          {step < 6 && (
            <div className="mt-8 pt-6 border-t border-border-light flex gap-4">
              {step > 0 && (
                <Button variant="ghost" onClick={handleBack}>
                  Back
                </Button>
              )}
              <Button
                fullWidth
                onClick={handleNext}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : step === 5 ? 'See If You Qualify' : 'Continue'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

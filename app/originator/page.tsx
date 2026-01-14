'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import SelectCard from '@/components/ui/SelectCard'
import MultiSelect from '@/components/ui/MultiSelect'
import TextInput from '@/components/ui/TextInput'
import ProgressBar from '@/components/ui/ProgressBar'
import ResultCard from '@/components/ui/ResultCard'
import { OriginatorData } from '@/lib/types'
import { scoreOriginator } from '@/lib/scoring'

const TOTAL_STEPS = 6

const assetClassOptions = [
  { value: 'Commercial Real Estate', label: 'Commercial Real Estate' },
  { value: 'Residential Real Estate', label: 'Residential Real Estate' },
  { value: 'SMB Loans', label: 'SMB Loans' },
  { value: 'Equipment Finance', label: 'Equipment Finance' },
  { value: 'Receivables/Factoring', label: 'Receivables/Factoring' },
  { value: 'Mixed/Other', label: 'Mixed/Other' },
]

const volumeOptions = [
  { value: 'Under $5M', label: 'Under $5M' },
  { value: '$5M - $25M', label: '$5M - $25M' },
  { value: '$25M - $100M', label: '$25M - $100M' },
  { value: '$100M+', label: '$100M+' },
]

const dealSizeOptions = [
  { value: 'Under $250K', label: 'Under $250K' },
  { value: '$250K - $1M', label: '$250K - $1M' },
  { value: '$1M - $5M', label: '$1M - $5M' },
  { value: '$5M+', label: '$5M+' },
]

const defaultRateOptions = [
  { value: 'Under 2%', label: 'Under 2%' },
  { value: '2-5%', label: '2-5%' },
  { value: '5-10%', label: '5-10%' },
  { value: 'Over 10%', label: 'Over 10%' },
  { value: 'Not sure', label: 'Not Sure' },
]

const docStandardOptions = [
  { value: 'Full documentation', label: 'Full Documentation' },
  { value: 'Lite doc', label: 'Lite Doc' },
  { value: 'Stated income', label: 'Stated Income' },
  { value: 'Mixed', label: 'Mixed' },
]

const fundingOptions = [
  { value: 'Balance sheet', label: 'Balance Sheet' },
  { value: 'Warehouse line', label: 'Warehouse Line' },
  { value: 'Institutional buyers', label: 'Institutional Buyers' },
  { value: 'Securitization', label: 'Securitization' },
  { value: 'Other', label: 'Other' },
]

const motivationOptions = [
  { value: 'Growth & scaling', label: 'Growth & Scaling' },
  { value: 'Diversification', label: 'Diversification' },
  { value: 'Better pricing or terms', label: 'Better Pricing Or Terms' },
  { value: 'Faster settlement', label: 'Faster Settlement' },
  { value: 'Current sources constrained', label: 'Current Sources Constrained' },
  { value: 'Exploring options', label: 'Exploring Options' },
]

export default function OriginatorPage() {
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [data, setData] = useState<Partial<OriginatorData>>({
    assetClass: '',
    assetClassOther: '',
    annualVolume: '',
    avgDealSize: '',
    defaultRate: '',
    docStandard: '',
    geoFocus: '',
    currentFunding: [],
    currentFundingOther: '',
    capitalMotivation: [],
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof scoreOriginator> | null>(null)

  const updateData = (field: keyof OriginatorData, value: string | string[]) => {
    setData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = () => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 0:
        if (!data.assetClass) newErrors.assetClass = 'Please select an asset class'
        break
      case 1:
        if (!data.annualVolume) newErrors.annualVolume = 'Please select annual volume'
        if (!data.avgDealSize) newErrors.avgDealSize = 'Please select average deal size'
        break
      case 2:
        if (!data.defaultRate) newErrors.defaultRate = 'Please select default rate'
        if (!data.docStandard) newErrors.docStandard = 'Please select documentation standard'
        break
      case 3:
        if (!data.currentFunding?.length) newErrors.currentFunding = 'Please select at least one funding source'
        if (!data.capitalMotivation?.length) newErrors.capitalMotivation = 'Please select at least one motivation'
        break
      case 4:
        if (!data.companyName?.trim()) newErrors.companyName = 'Company name is required'
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

    if (step === 4) {
      // Submit the form
      setIsSubmitting(true)
      setSubmitError('')

      try {
        const scoringResult = scoreOriginator(data)

        const response = await fetch('/api/submit-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadType: 'originator',
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
        setStep(5)
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
          {step < 5 && (
            <div className="mb-8 pb-6 border-b border-border-light">
              <h1 className="text-2xl font-bold text-text-primary mb-1">
                Originator Qualification
              </h1>
              <p className="text-text-secondary text-sm mb-6">
                Help us understand your lending portfolio.
              </p>
              <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS - 1} />
            </div>
          )}

        {/* Form Steps */}
        <div className="flex-1">
          {/* Step 0: Asset Class */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                What type of assets do you originate?
              </h2>
              <div className="space-y-3">
                {assetClassOptions.map((option) => (
                  <SelectCard
                    key={option.value}
                    label={option.label}
                    selected={data.assetClass === option.value}
                    onClick={() => updateData('assetClass', option.value)}
                  />
                ))}
              </div>
              {data.assetClass === 'Mixed/Other' && (
                <div className="mt-4">
                  <TextInput
                    label="Please describe your asset class"
                    value={data.assetClassOther || ''}
                    onChange={(e) => updateData('assetClassOther', e.target.value)}
                  />
                </div>
              )}
              {errors.assetClass && (
                <p className="text-sm text-red-500">{errors.assetClass}</p>
              )}
            </div>
          )}

          {/* Step 1: Volume */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Annual origination volume
                </h2>
                <div className="space-y-3">
                  {volumeOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={data.annualVolume === option.value}
                      onClick={() => updateData('annualVolume', option.value)}
                    />
                  ))}
                </div>
                {errors.annualVolume && (
                  <p className="text-sm text-red-500 mt-2">{errors.annualVolume}</p>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Average deal size
                </h2>
                <div className="space-y-3">
                  {dealSizeOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={data.avgDealSize === option.value}
                      onClick={() => updateData('avgDealSize', option.value)}
                    />
                  ))}
                </div>
                {errors.avgDealSize && (
                  <p className="text-sm text-red-500 mt-2">{errors.avgDealSize}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Portfolio Quality */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Historical default rate
                </h2>
                <div className="space-y-3">
                  {defaultRateOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={data.defaultRate === option.value}
                      onClick={() => updateData('defaultRate', option.value)}
                    />
                  ))}
                </div>
                {errors.defaultRate && (
                  <p className="text-sm text-red-500 mt-2">{errors.defaultRate}</p>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Documentation standard
                </h2>
                <div className="space-y-3">
                  {docStandardOptions.map((option) => (
                    <SelectCard
                      key={option.value}
                      label={option.label}
                      selected={data.docStandard === option.value}
                      onClick={() => updateData('docStandard', option.value)}
                    />
                  ))}
                </div>
                {errors.docStandard && (
                  <p className="text-sm text-red-500 mt-2">{errors.docStandard}</p>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Geographic focus
                </h2>
                <TextInput
                  label="e.g., Northeast US, Western Europe, North America"
                  value={data.geoFocus || ''}
                  onChange={(e) => updateData('geoFocus', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Current Distribution */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  How do you currently fund originations?
                </h2>
                <p className="text-sm text-gray-500 mb-4">Select all that apply</p>
                <MultiSelect
                  options={fundingOptions}
                  selected={data.currentFunding || []}
                  onChange={(selected) => updateData('currentFunding', selected)}
                />
                {data.currentFunding?.includes('Other') && (
                  <div className="mt-4">
                    <TextInput
                      label="Please describe your other funding source"
                      value={data.currentFundingOther || ''}
                      onChange={(e) => updateData('currentFundingOther', e.target.value)}
                    />
                  </div>
                )}
                {errors.currentFunding && (
                  <p className="text-sm text-red-500 mt-2">{errors.currentFunding}</p>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Looking for additional capital because...
                </h2>
                <p className="text-sm text-gray-500 mb-4">Select all that apply</p>
                <MultiSelect
                  options={motivationOptions}
                  selected={data.capitalMotivation || []}
                  onChange={(selected) => updateData('capitalMotivation', selected)}
                />
                {errors.capitalMotivation && (
                  <p className="text-sm text-red-500 mt-2">{errors.capitalMotivation}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Contact */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Your contact information
              </h2>
              <TextInput
                label="Company name"
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
              {submitError && (
                <p className="text-sm text-red-500">{submitError}</p>
              )}
            </div>
          )}

          {/* Step 5: Results */}
          {step === 5 && result && (
            <div className="space-y-6">
              <ResultCard score={result.score} type="originator" />

              <div className="p-5 rounded-card bg-card-warm border border-border-light">
                <h3 className="font-semibold text-text-primary mb-2">What Happens Next</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Our team will contact you within 24 hours to discuss portfolio structure, pricing, and how our tokenization infrastructure works.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => window.open('https://cal.com/bitcense', '_blank')}
                >
                  Schedule Your Consultation
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
          {step < 5 && (
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
                {isSubmitting ? 'Submitting...' : step === 4 ? 'Get Your Portfolio Assessment' : 'Continue'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

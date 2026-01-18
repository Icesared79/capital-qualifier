'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { formatCapitalAmount } from '@/lib/formatters'

// Interface for lead data stored in localStorage
interface PendingLeadData {
  companyName: string
  locatedInUS: boolean
  country: string
  countryOther: string
  location: string
  assets: string[]
  loanAssetClasses: string[]
  realEstateTypes: string[]
  assetOther: string
  fundingAmount: string
  fundingPurpose: string
  fundingPurposeOther: string
  contactName: string
  email: string
  phone: string
  submittedAt: string
}

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface Deal {
  id: string
  qualification_code: string
  stage: string
  capital_amount: string | null
  funding_purpose: string | null
  qualification_score: string | null
  overall_score: number | null
  notes: string | null
  created_at: string
}

interface Company {
  id: string
  name: string
  type: 'originator' | 'borrower' | 'business'
  assets: string[] | null
  asset_details: any | null
  location: string | null
  qualification_score: string | null
  overall_score: number | null
  qualification_data: any | null
  created_at: string
  deals: Deal[]
}

interface DashboardClientProps {
  user: any
  profile: Profile | null
  companies: Company[]
}

// Asset labels - specific asset types for document checklist matching
const assetLabels: Record<string, string> = {
  cre: 'Commercial Real Estate',
  residential: 'Residential Real Estate',
  real_estate: 'Real Estate',
  consumer: 'Consumer Loans',
  smb: 'SMB / Business Loans',
  loan_portfolio: 'Loan Portfolio',
  mca: 'MCA / Merchant Cash Advance',
  factoring: 'Factoring / Receivables',
  equipment: 'Equipment Finance',
  private_equity: 'Private Equity / Fund',
  receivables: 'Receivables',
  other: 'Other',
}

// Funding purpose labels
const fundingPurposeLabels: Record<string, string> = {
  working_capital: 'Working Capital',
  acquisition: 'Acquisition',
  refinance: 'Refinance',
  construction: 'Construction',
  portfolio_expansion: 'Portfolio Expansion',
  other: 'Other',
}

// Stage labels and colors
const stageConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'In Progress', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  qualified: { label: 'Submitted', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
  documents_requested: { label: 'Documents Needed', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
  documents_in_review: { label: 'Documents Under Review', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
  due_diligence: { label: 'Due Diligence', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
  term_sheet: { label: 'Term Sheet', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
  negotiation: { label: 'Negotiation', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
  closing: { label: 'Closing', color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
  funded: { label: 'Funded', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  declined: { label: 'Declined', color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
}

export default function DashboardClient({ user, profile, companies }: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoadingLeadData, setIsLoadingLeadData] = useState(false)
  const [hasPendingLead, setHasPendingLead] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const processingRef = useRef(false)

  // Check if there's pending lead data
  useEffect(() => {
    if (companies.length === 0) {
      const pendingData = localStorage.getItem('pendingLeadData')
      setHasPendingLead(!!pendingData)
    } else {
      // Clear stale data if user has companies
      localStorage.removeItem('pendingLeadData')
      setHasPendingLead(false)
    }
  }, [companies.length])

  // Function to import lead data - can be called automatically or via button
  const importLeadData = useCallback(async () => {
    // Prevent duplicate execution
    if (processingRef.current || isLoadingLeadData) {
      return
    }

    const pendingData = localStorage.getItem('pendingLeadData')
    if (!pendingData) {
      setImportError('No pending application found')
      return
    }

    processingRef.current = true
    setIsLoadingLeadData(true)
    setImportError(null)

    try {
      const leadData: PendingLeadData = JSON.parse(pendingData)

      // Build asset details based on selected assets
      const assetDetails: any = {}
      if (leadData.assets.includes('loan_portfolio') && leadData.loanAssetClasses.length > 0) {
        assetDetails.loanPortfolio = {
          assetClasses: leadData.loanAssetClasses,
        }
      }
      if (leadData.assets.includes('real_estate') && leadData.realEstateTypes.length > 0) {
        assetDetails.realEstate = {
          propertyTypes: leadData.realEstateTypes,
        }
      }
      if (leadData.assetOther) {
        assetDetails.otherDescription = leadData.assetOther
      }

      // Determine business type based on assets
      const companyType = leadData.assets.includes('loan_portfolio') ? 'originator' : 'borrower'

      // Create the company (business profile)
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          owner_id: user.id,
          name: leadData.companyName,
          type: companyType,
          qualification_data: {
            locatedInUS: leadData.locatedInUS,
            country: leadData.country,
            countryOther: leadData.countryOther,
            location: leadData.location,
            assets: leadData.assets,
            assetDetails: assetDetails,
            loanAssetClasses: leadData.loanAssetClasses,
            realEstateTypes: leadData.realEstateTypes,
            assetOther: leadData.assetOther,
          },
        })
        .select()
        .single()

      if (companyError) {
        console.error('Error creating company:', companyError)
        setImportError(`Failed to create business profile: ${companyError.message}`)
        processingRef.current = false
        setIsLoadingLeadData(false)
        return
      }

      // Create the initial funding application (deal)
      const qualificationCode = `BC-${Date.now().toString(36).toUpperCase()}`
      const { error: dealError } = await supabase
        .from('deals')
        .insert({
          company_id: company.id,
          qualification_code: qualificationCode,
          stage: 'qualified',
          notes: JSON.stringify({
            fundingAmount: leadData.fundingAmount,
            fundingPurpose: leadData.fundingPurpose,
            fundingPurposeOther: leadData.fundingPurposeOther,
            contactName: leadData.contactName,
            email: leadData.email,
            phone: leadData.phone,
            createdFromLead: true,
          }),
        })

      if (dealError) {
        console.error('Error creating deal:', dealError)
        // Don't fail completely - company was created
      }

      // Update profile with contact name if not already set
      if (leadData.contactName && !profile?.full_name) {
        await supabase
          .from('profiles')
          .update({ full_name: leadData.contactName })
          .eq('id', user.id)
      }

      // Clear the localStorage
      localStorage.removeItem('pendingLeadData')
      setHasPendingLead(false)

      // Refresh to show the new data
      router.refresh()
    } catch (error) {
      console.error('Error processing lead data:', error)
      setImportError('Failed to import application. Please try again.')
      processingRef.current = false
    } finally {
      setIsLoadingLeadData(false)
    }
  }, [supabase, user.id, router, profile?.full_name, isLoadingLeadData])

  // Auto-import on mount if conditions are right
  useEffect(() => {
    if (companies.length === 0 && !processingRef.current) {
      const pendingData = localStorage.getItem('pendingLeadData')
      if (pendingData) {
        // Small delay to ensure component is fully mounted
        const timer = setTimeout(() => {
          importLeadData()
        }, 100)
        return () => clearTimeout(timer)
      }
    }
  }, [companies.length, importLeadData])

  const hasCompanies = companies.length > 0
  const primaryCompany = companies[0]
  const companyAssets = primaryCompany?.assets || primaryCompany?.qualification_data?.assets
  const hasBusinessProfile = companyAssets && companyAssets.length > 0
  const fundingApplications = primaryCompany?.deals || []

  const formatAssets = (assets: string[] | null | undefined) => {
    if (!assets || assets.length === 0) return 'Not set'
    return assets.map(a => assetLabels[a] || a).join(', ')
  }

  const getLocationDisplay = () => {
    if (!primaryCompany) return ''
    const qData = primaryCompany.qualification_data || {}
    if (qData.locatedInUS) {
      return qData.location || 'United States'
    }
    return qData.country === 'Other' ? qData.countryOther : qData.country || ''
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Loading state when processing lead data */}
      {isLoadingLeadData && (
        <div className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Setting up your business profile...</h3>
            <p className="text-base text-gray-600 dark:text-gray-400">This will only take a moment.</p>
          </div>
        </div>
      )}

      {/* Business Profile Section - At Top */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-6">
          {/* Logo Area */}
          <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {primaryCompany?.qualification_data?.logo_url ? (
              <img
                src={primaryCompany.qualification_data.logo_url}
                alt={primaryCompany.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                {primaryCompany ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {primaryCompany.name}
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-400">
                      {getLocationDisplay() && <span>{getLocationDisplay()}</span>}
                      {getLocationDisplay() && hasBusinessProfile && <span> • </span>}
                      {hasBusinessProfile && <span>{formatAssets(companyAssets)}</span>}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      Set Up Your Business
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-400">
                      Complete your profile to improve qualification scores
                    </p>
                  </>
                )}
              </div>
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-gray-900 dark:hover:border-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {primaryCompany ? 'Edit Profile' : 'Complete Profile'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Page Header with CTA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Your Offerings
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            {fundingApplications.length > 0
              ? `${fundingApplications.length} offering${fundingApplications.length > 1 ? 's' : ''} in progress`
              : 'Create your first capital offering'
            }
          </p>
        </div>
        <Link
          href="/dashboard/apply"
          className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-base font-semibold rounded-xl transition-colors shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Offering
        </Link>
      </div>

      {/* Pending Offering Banner - shows if there's pending data but import hasn't happened */}
      {hasPendingLead && !hasCompanies && !isLoadingLeadData && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 mb-1">You have a pending offering</h3>
              <p className="text-amber-700 text-sm mb-3">
                We found your offering details. Click below to import them into your account.
              </p>
              {importError && (
                <p className="text-red-600 text-sm mb-3">{importError}</p>
              )}
              <Button onClick={importLeadData} disabled={isLoadingLeadData}>
                Import My Offering
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* OFFERINGS LIST - PRIMARY FOCUS */}
      <div className="mb-8">
        {fundingApplications.length > 0 ? (
          <div className="grid gap-4">
            {fundingApplications.map((deal) => {
              // Parse deal data from notes field
              let dealData: any = {}
              try { dealData = deal.notes ? JSON.parse(deal.notes) : {} } catch (e) {}

              const fundingAmount = deal.capital_amount || dealData.fundingAmount
              const fundingPurpose = deal.funding_purpose || dealData.fundingPurpose
              const overallScore = deal.overall_score || dealData.overallScore
              const stage = stageConfig[deal.stage] || stageConfig.draft

              // Format amount using universal formatter
              const displayAmount = formatCapitalAmount(fundingAmount, 'Amount TBD')

              const purpose = fundingPurpose
                ? fundingPurposeLabels[fundingPurpose] || fundingPurpose
                : 'Capital Offering'

              return (
                <Link
                  key={deal.id}
                  href={deal.stage === 'draft' ? `/dashboard/apply?id=${deal.id}` : `/dashboard/application/${deal.id}`}
                  className="block bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-gray-400 dark:hover:border-gray-500 transition-all hover:shadow-md group"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Left: Main Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1.5 text-sm font-bold rounded-lg ${stage.color}`}>
                          {stage.label}
                        </span>
                        {overallScore && (
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg">
                            Score: {overallScore}/100
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:underline">
                        {purpose}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span suppressHydrationWarning>Created {new Date(deal.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </p>
                    </div>

                    {/* Right: Amount & Action */}
                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Funding Request</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {displayAmount}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No offerings yet</h3>
            <p className="text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create your first capital offering to get matched with the right funding solutions.
            </p>
            <Link
              href="/dashboard/apply"
              className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-base font-semibold rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Offering
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Questions? Email us at{' '}
          <a href="mailto:capital@bitcense.com" className="text-gray-900 dark:text-white hover:underline font-semibold">
            capital@bitcense.com
          </a>
        </p>
      </div>
    </div>
  )
}

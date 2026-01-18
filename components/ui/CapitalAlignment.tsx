'use client'

import Link from 'next/link'

interface PartnerMatch {
  id: string
  name: string
  type: string
  matchReasons: string[]
}

interface CapitalAlignmentProps {
  // Deal info
  fundingAmount?: string
  fundingPurpose?: string
  assetTypes?: string[]
  location?: string

  // Partner matches
  partners: PartnerMatch[]

  // Status
  documentsComplete?: boolean
  dealId: string
}

const fundingAmountLabels: Record<string, string> = {
  under_500k: 'Under $500K',
  '500k_2m': '$500K - $2M',
  '2m_10m': '$2M - $10M',
  '10m_50m': '$10M - $50M',
  over_50m: '$50M+',
}

const fundingPurposeLabels: Record<string, string> = {
  working_capital: 'Working Capital',
  acquisition: 'Acquisition',
  refinance: 'Refinance',
  construction: 'Construction',
  portfolio_expansion: 'Portfolio Expansion',
  other: 'Other',
}

const assetLabels: Record<string, string> = {
  cre: 'Commercial Real Estate',
  residential: 'Residential Real Estate',
  real_estate: 'Real Estate',
  consumer: 'Consumer Loans',
  smb: 'SMB / Business Loans',
  loan_portfolio: 'Loan Portfolio',
  mca: 'MCA',
  factoring: 'Factoring / Receivables',
  equipment: 'Equipment Finance',
  private_equity: 'Private Equity',
  receivables: 'Receivables',
  residential_re: 'Residential RE',
  commercial_re: 'Commercial RE',
  equipment_finance: 'Equipment Finance',
  specialty: 'Specialty Finance',
  other: 'Other',
}

const partnerTypeLabels: Record<string, string> = {
  institutional: 'Institutional',
  family_office: 'Family Office',
  private_credit: 'Private Credit',
  hedge_fund: 'Hedge Fund',
  bank: 'Bank',
  other: 'Other',
}

export default function CapitalAlignment({
  fundingAmount,
  fundingPurpose,
  assetTypes = [],
  location,
  partners,
  documentsComplete = false,
  dealId,
}: CapitalAlignmentProps) {
  const formattedAmount = fundingAmount ? fundingAmountLabels[fundingAmount] || fundingAmount : null
  const formattedPurpose = fundingPurpose ? fundingPurposeLabels[fundingPurpose] || fundingPurpose : null
  const formattedAssets = assetTypes.map(a => assetLabels[a] || a)

  return (
    <div className="space-y-4">
      {/* Deal Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Your Request
        </h3>
        <div className="space-y-3">
          {formattedAmount && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{formattedAmount}</span>
            </div>
          )}
          {formattedPurpose && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Purpose</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{formattedPurpose}</span>
            </div>
          )}
          {formattedAssets.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Asset Type</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white text-right">
                {formattedAssets.slice(0, 2).join(', ')}
                {formattedAssets.length > 2 && ` +${formattedAssets.length - 2}`}
              </span>
            </div>
          )}
          {location && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Location</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Partner Matches */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Compatible Partners
        </h3>

        {partners.length > 0 ? (
          <div className="space-y-4">
            {partners.map((partner) => (
              <div key={partner.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{partner.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                    {partnerTypeLabels[partner.type] || partner.type}
                  </span>
                </div>
                {partner.matchReasons.length > 0 && (
                  <ul className="space-y-1">
                    {partner.matchReasons.map((reason, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-gray-400 dark:text-gray-500 mt-0.5">·</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No partners matched yet. Complete your profile to see compatible partners.
          </p>
        )}
      </div>

      {/* Next Action */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {documentsComplete ? 'Documents Complete' : 'To Proceed'}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {documentsComplete
                ? 'Your documents have been submitted. Partner introductions are enabled.'
                : 'Complete document checklist to enable partner introductions.'}
            </p>
            {!documentsComplete && (
              <Link
                href={`/dashboard/documents?deal=${dealId}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Upload Documents
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

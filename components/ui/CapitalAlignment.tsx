'use client'

import { formatCapitalAmount } from '@/lib/formatters'
import { CheckCircle, Clock, Building2 } from 'lucide-react'

interface PartnerMatch {
  id: string
  name: string
  type: string
  matchReasons: string[]
}

interface CapitalAlignmentProps {
  fundingAmount?: string
  fundingPurpose?: string
  assetTypes?: string[]
  location?: string
  partners: PartnerMatch[]
  documentsComplete?: boolean
  dealId: string
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
  cre: 'CRE',
  residential: 'Residential',
  real_estate: 'Real Estate',
  consumer: 'Consumer',
  smb: 'SMB',
  loan_portfolio: 'Loan Portfolio',
  mca: 'MCA',
  factoring: 'Factoring',
  equipment: 'Equipment',
  private_equity: 'PE/Fund',
  receivables: 'Receivables',
  residential_re: 'Residential RE',
  commercial_re: 'Commercial RE',
  equipment_finance: 'Equipment',
  specialty: 'Specialty',
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
  const formattedAmount = fundingAmount ? formatCapitalAmount(fundingAmount) : null
  const formattedPurpose = fundingPurpose ? fundingPurposeLabels[fundingPurpose] || fundingPurpose : null
  const formattedAssets = assetTypes.map(a => assetLabels[a] || a)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Capital Partners</h3>
        </div>
      </div>

      {/* Request Summary - Compact */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap gap-2 text-xs">
          {formattedAmount && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-medium">
              {formattedAmount}
            </span>
          )}
          {formattedAssets.slice(0, 2).map((asset, i) => (
            <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md">
              {asset}
            </span>
          ))}
          {formattedPurpose && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md">
              {formattedPurpose}
            </span>
          )}
        </div>
      </div>

      {/* Compatible Partners */}
      <div className="px-4 py-3">
        {partners.length > 0 ? (
          <div className="space-y-3">
            {partners.slice(0, 3).map((partner) => (
              <div key={partner.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {partner.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{partner.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {partnerTypeLabels[partner.type] || partner.type}
                  </p>
                </div>
              </div>
            ))}
            {partners.length > 3 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                +{partners.length - 3} more partners
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No partners matched yet
          </p>
        )}
      </div>

      {/* Status Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {documentsComplete ? (
            <>
              <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-medium text-teal-600 dark:text-teal-400">Introductions enabled</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Awaiting documents</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

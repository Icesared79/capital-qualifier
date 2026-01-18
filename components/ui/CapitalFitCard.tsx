'use client'

import { useState } from 'react'

interface CapitalFit {
  type: string
  name: string
  fit: 'excellent' | 'good' | 'possible' | 'not_recommended'
  description: string
  requirements?: string[]
}

interface CapitalFitCardProps {
  capitalFit: CapitalFit
}

const fitConfig = {
  excellent: {
    label: 'Eligible',
    color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    icon: '✓',
    isEligible: true,
  },
  good: {
    label: 'Eligible',
    color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    icon: '✓',
    isEligible: true,
  },
  possible: {
    label: 'May Qualify',
    color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    icon: '?',
    isEligible: false,
  },
  not_recommended: {
    label: 'Not Eligible',
    color: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600',
    icon: '—',
    isEligible: false,
  },
}

const capitalTypeIcons: Record<string, string> = {
  warehouse_line: '🏦',
  forward_flow: '📈',
  whole_loan_sale: '📋',
  securitization: '📊',
  credit_facility: '💳',
  equity_partnership: '🤝',
  mezzanine: '📐',
}

// Detailed explanations for each capital structure type
const capitalTypeExplainers: Record<string, {
  title: string
  whatItIs: string
  howItWorks: string
  bestFor: string[]
  typicalTerms: string[]
}> = {
  warehouse_line: {
    title: 'Warehouse Line of Credit',
    whatItIs: 'A revolving credit facility that allows you to fund loans before selling them to permanent investors. Think of it like a credit card for your lending business.',
    howItWorks: 'You draw funds to originate loans, then repay when you sell those loans. The line "revolves" - as you repay, you can borrow again.',
    bestFor: [
      'Originators with steady loan production',
      'Companies needing flexible, ongoing capital',
      'Businesses with established track records',
    ],
    typicalTerms: [
      'Advance rates: 80-95% of loan value',
      'Interest: SOFR + 2-5%',
      'Commitment: 1-3 years',
    ],
  },
  forward_flow: {
    title: 'Forward Flow Agreement',
    whatItIs: 'A commitment from a buyer to purchase loans you originate on an ongoing basis, typically at pre-agreed terms and pricing.',
    howItWorks: 'You agree to sell a certain volume of qualifying loans each month. The buyer commits to purchasing them at a set price, giving you predictable liquidity.',
    bestFor: [
      'Consistent originators with predictable volume',
      'Companies wanting guaranteed liquidity',
      'Originators with standardized loan products',
    ],
    typicalTerms: [
      'Minimum monthly volume commitments',
      'Pre-set pricing (typically par or small premium)',
      'Contract duration: 1-3 years',
    ],
  },
  whole_loan_sale: {
    title: 'Whole Loan Sale',
    whatItIs: 'A one-time sale of a pool of loans to an investor who takes ownership of the entire loan (principal, interest, and risk).',
    howItWorks: 'You package a group of loans and sell them outright. The buyer pays you and takes over all rights and risks of the loans.',
    bestFor: [
      'Reducing balance sheet exposure',
      'One-time liquidity needs',
      'Testing investor appetite for your product',
    ],
    typicalTerms: [
      'Pricing: 98-105% of unpaid principal',
      'Minimum pool size: $1-10M typically',
      'Reps & warranties required',
    ],
  },
  securitization: {
    title: 'Securitization (ABS)',
    whatItIs: 'The process of pooling loans and issuing bonds backed by those loans. This is how large originators access the capital markets.',
    howItWorks: 'Your loans are transferred to a special purpose vehicle (SPV), which issues rated bonds to investors. You may retain servicing rights and a residual interest.',
    bestFor: [
      'Large originators ($50M+ annual volume)',
      'Accessing lowest cost of capital',
      'Building a permanent capital markets presence',
    ],
    typicalTerms: [
      'Minimum deal size: $50-100M',
      'Advance rates: 85-95%',
      'Requires rated track record',
    ],
  },
  credit_facility: {
    title: 'Credit Facility',
    whatItIs: 'A broader term for debt financing that can include term loans, lines of credit, or other lending arrangements with a financial institution.',
    howItWorks: 'A bank or fund provides you with a loan or line of credit secured by your assets, cash flow, or loan portfolio.',
    bestFor: [
      'General business capital needs',
      'Companies with diverse collateral',
      'Flexible funding requirements',
    ],
    typicalTerms: [
      'Term: 1-5 years',
      'Rates vary by structure and risk',
      'Covenants typically required',
    ],
  },
  equity_partnership: {
    title: 'Equity Partnership',
    whatItIs: 'An investment where a capital partner takes an ownership stake in your company or a joint venture, sharing in the profits and risks.',
    howItWorks: 'An investor provides capital in exchange for equity (ownership). They share in your upside but also take on risk alongside you.',
    bestFor: [
      'High-growth companies',
      'Businesses needing patient capital',
      'Founders willing to share ownership',
    ],
    typicalTerms: [
      'Equity stake: 10-49% typical',
      'Board representation often required',
      'Exit expectations: 3-7 years',
    ],
  },
  mezzanine: {
    title: 'Mezzanine Financing',
    whatItIs: 'A hybrid of debt and equity that sits between senior debt and common equity in the capital structure. Higher risk means higher returns for investors.',
    howItWorks: 'You receive capital that acts like debt (with interest payments) but may convert to equity or include warrants. It\'s subordinate to senior debt but senior to equity.',
    bestFor: [
      'Companies with maxed-out senior debt capacity',
      'Acquisition financing',
      'Growth capital without full dilution',
    ],
    typicalTerms: [
      'Interest: 12-20% (current + PIK)',
      'Often includes warrants or conversion rights',
      'Subordinate to senior debt',
    ],
  },
}

export default function CapitalFitCard({ capitalFit }: CapitalFitCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const config = fitConfig[capitalFit.fit]
  const icon = capitalTypeIcons[capitalFit.type] || '💰'
  const explainer = capitalTypeExplainers[capitalFit.type]

  return (
    <div className={`relative rounded-xl border-2 p-5 transition-all ${
      config.isEligible
        ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30'
        : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800'
    }`}>

      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">{capitalFit.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{capitalFit.description}</p>

          {capitalFit.requirements && capitalFit.requirements.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-2">
                {config.isEligible ? 'Requirements Met' : 'Typical Requirements'}
              </p>
              <ul className="space-y-1">
                {capitalFit.requirements.map((req, i) => (
                  <li key={i} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    {config.isEligible ? (
                      <svg className="w-3.5 h-3.5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="w-3.5 h-3.5 mr-2 text-gray-400 dark:text-gray-500">•</span>
                    )}
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What is this? link */}
          {explainer && (
            <div className="relative mt-3">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What is this?
              </button>

              {/* Tooltip/Explainer on hover */}
              {showTooltip && (
                <div className="absolute z-50 left-0 bottom-full mb-2 w-80 p-4 bg-white rounded-xl shadow-xl border border-gray-200 text-sm">
                  <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45" />

                  <h4 className="font-semibold text-gray-900 mb-2">{explainer.title}</h4>

                  <div className="space-y-3">
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-indigo-800 uppercase mb-1">What It Is</p>
                      <p className="text-indigo-700 text-sm">{explainer.whatItIs}</p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase mb-1">How It Works</p>
                      <p className="text-blue-700 text-sm">{explainer.howItWorks}</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase mb-2">Common Use Cases</p>
                      <ul className="space-y-1">
                        {explainer.bestFor.map((item, i) => (
                          <li key={i} className="text-green-700 text-sm flex items-start gap-2">
                            <span className="text-green-400">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Typical Terms</p>
                      <ul className="space-y-1">
                        {explainer.typicalTerms.map((term, i) => (
                          <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            {term}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

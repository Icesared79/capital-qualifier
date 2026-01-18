import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { OriginatorData, BorrowerData, QualificationScore } from '@/lib/types'

// Unified lead data structure
interface UnifiedLeadData {
  // Business info
  companyName: string
  locatedInUS: boolean
  country: string
  countryOther?: string
  location?: string
  // Assets
  assets: string[]
  loanAssetClasses?: string[]
  realEstateTypes?: string[]
  assetOther?: string
  // Funding need
  fundingAmount: string
  fundingPurpose: string
  fundingPurposeOther?: string
  // Contact
  contactName: string
  email: string
  phone?: string
}

interface LeadSubmission {
  leadType: 'originator' | 'borrower' | 'unified'
  data: OriginatorData | BorrowerData | UnifiedLeadData
  qualificationScore: QualificationScore
  qualificationFactors: {
    strengths?: string[]
    considerations?: string[]
    note?: string
  }
}

function formatOriginatorEmail(data: OriginatorData, score: QualificationScore, factors: LeadSubmission['qualificationFactors']) {
  return `
New Originator Lead - Capital Access Qualifier

QUALIFICATION: ${score.toUpperCase().replace('_', ' ')}

CONTACT INFORMATION
-------------------
Company: ${data.companyName}
Contact: ${data.contactName}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}
Location: ${data.locatedInUS ? 'United States' : data.country || 'Not specified'}

PORTFOLIO DETAILS
-----------------
Asset Class: ${data.assetClass}${data.assetClassOther ? ` (${data.assetClassOther})` : ''}
Annual Volume: ${data.annualVolume}
Average Deal Size: ${data.avgDealSize}
Default Rate: ${data.defaultRate}
Documentation Standard: ${data.docStandard}
Geographic Focus: ${data.geoFocus || 'Not specified'}

FUNDING & MOTIVATION
--------------------
Current Funding Sources: ${data.currentFunding?.join(', ') || 'None selected'}${data.currentFundingOther ? ` (Other: ${data.currentFundingOther})` : ''}
Looking for Capital Because: ${data.capitalMotivation?.join(', ') || 'None selected'}

QUALIFICATION ANALYSIS
----------------------
Strengths:
${(factors.strengths?.length ?? 0) > 0 ? factors.strengths?.map(s => `• ${s}`).join('\n') : '• None identified'}

Considerations:
${(factors.considerations?.length ?? 0) > 0 ? factors.considerations?.map(c => `• ${c}`).join('\n') : '• None identified'}

---
Submitted via Capital Access Qualifier
https://qualify.bitcense.com
  `.trim()
}

function formatBorrowerEmail(data: BorrowerData, score: QualificationScore, factors: LeadSubmission['qualificationFactors']) {
  return `
New Borrower Lead - Capital Access Qualifier

QUALIFICATION: ${score.toUpperCase().replace('_', ' ')}

CONTACT INFORMATION
-------------------
Company/Property: ${data.companyName}
Contact: ${data.contactName}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}
Location: ${data.locatedInUS ? 'United States' : data.country || 'Not specified'}
Best Time to Reach: ${data.bestTimeToReach || 'Not specified'}

FUNDING NEEDS
-------------
Purpose: ${data.fundingPurpose}${data.fundingPurposeOther ? ` (${data.fundingPurposeOther})` : ''}
Amount Needed: ${data.amountNeeded}
Timeline: ${data.timeline}

COLLATERAL
----------
Collateral Type: ${data.collateralType}${data.collateralOther ? ` (${data.collateralOther})` : ''}
Asset Value: ${data.assetValue || 'N/A'}
Existing Debt: ${data.existingDebt || 'N/A'}

BUSINESS PROFILE
----------------
Business Type: ${data.businessType}${data.businessTypeOther ? ` (${data.businessTypeOther})` : ''}
Years in Business: ${data.yearsInBusiness}
Annual Revenue: ${data.annualRevenue}

BANK STATUS
-----------
Approached Bank: ${data.bankStatus || 'Not specified'}
${data.rejectionReasons?.length ? `Rejection Reasons: ${data.rejectionReasons.join(', ')}` : ''}

QUALIFICATION ANALYSIS
----------------------
Strengths:
${(factors.strengths?.length ?? 0) > 0 ? factors.strengths?.map(s => `• ${s}`).join('\n') : '• None identified'}

Considerations:
${(factors.considerations?.length ?? 0) > 0 ? factors.considerations?.map(c => `• ${c}`).join('\n') : '• None identified'}

---
Submitted via Capital Access Qualifier
https://qualify.bitcense.com
  `.trim()
}

function generateQualificationCode(companyName: string): string {
  const prefix = companyName?.slice(0, 3).toUpperCase() || 'XXX'
  const suffix = Date.now().toString(36).toUpperCase().slice(-5)
  return `BTC-${prefix}-${suffix}`
}

function formatOriginatorCandidateEmail(data: OriginatorData, score: QualificationScore, factors: LeadSubmission['qualificationFactors']) {
  const scoreMessage = {
    strong: "Great news! Your portfolio is a strong fit for global capital access through BitCense.",
    moderate: "Your portfolio shows strong potential. We'd love to discuss how we can work together.",
    needs_discussion: "Thank you for your interest. We'd like to explore alternative structures with you.",
  }

  const qualificationCode = generateQualificationCode(data.companyName)
  const showCode = score === 'strong' || score === 'moderate'

  return `
Hi ${data.contactName},

Thank you for completing the BitCense Capital Access Qualifier.

${scoreMessage[score]}

YOUR QUALIFICATION SUMMARY
--------------------------
Result: ${score.toUpperCase().replace('_', ' ')}
${showCode ? `Qualification Code: ${qualificationCode}` : ''}

Portfolio Highlights:
${(factors.strengths?.length ?? 0) > 0 ? factors.strengths?.map(s => `• ${s}`).join('\n') : '• Assessment in progress'}

${(factors.considerations?.length ?? 0) > 0 ? `\nAreas to Discuss:\n${factors.considerations?.map(c => `• ${c}`).join('\n')}` : ''}

NEXT STEPS
----------
${showCode
  ? `Schedule your consultation and provide your qualification code (${qualificationCode}) when booking:\nhttps://cal.com/bitcense/capital-qualification-intro`
  : 'A member of our team will review your submission and reach out if we can find a suitable arrangement.'
}

Best regards,
The BitCense Team

---
BitCense | On-Chain. Retail. Connected.
https://www.bitcense.com
  `.trim()
}

function formatBorrowerCandidateEmail(data: BorrowerData, score: QualificationScore, factors: LeadSubmission['qualificationFactors']) {
  const scoreMessage = {
    strong: "Great news! You're a strong candidate for bridge financing through BitCense.",
    moderate: "You're a good candidate. We'd love to discuss your financing options.",
    needs_discussion: "Thank you for your interest. We'd like to explore your options with you.",
  }

  const qualificationCode = generateQualificationCode(data.companyName)
  const showCode = score === 'strong' || score === 'moderate'

  return `
Hi ${data.contactName},

Thank you for completing the BitCense Funding Qualifier.

${scoreMessage[score]}

YOUR QUALIFICATION SUMMARY
--------------------------
Result: ${score.toUpperCase().replace('_', ' ')}
${showCode ? `Qualification Code: ${qualificationCode}` : ''}

Strengths:
${(factors.strengths?.length ?? 0) > 0 ? factors.strengths?.map(s => `• ${s}`).join('\n') : '• Assessment in progress'}

${(factors.considerations?.length ?? 0) > 0 ? `\nConsiderations:\n${factors.considerations?.map(c => `• ${c}`).join('\n')}` : ''}

YOUR REQUEST
------------
Funding Purpose: ${data.fundingPurpose}
Amount Needed: ${data.amountNeeded}
Timeline: ${data.timeline}

NEXT STEPS
----------
${showCode
  ? `Schedule your consultation and provide your qualification code (${qualificationCode}) when booking:\nhttps://cal.com/bitcense/capital-qualification-intro`
  : 'A member of our team will review your submission and reach out if we can find a suitable arrangement.'
}

Best regards,
The BitCense Team

---
BitCense | On-Chain. Retail. Connected.
https://www.bitcense.com
  `.trim()
}

// Asset label mapping
const assetLabels: Record<string, string> = {
  loan_portfolio: 'Loan Portfolio',
  real_estate: 'Real Estate',
  equipment: 'Equipment / Inventory',
  receivables: 'Receivables / Invoices',
  cash_flow: 'Business Cash Flow',
  other: 'Other',
}

const loanAssetClassLabels: Record<string, string> = {
  residential_re: 'Residential Real Estate',
  commercial_re: 'Commercial Real Estate',
  consumer: 'Consumer Loans',
  smb: 'SMB / Business Loans',
  equipment_finance: 'Equipment Finance',
  specialty: 'Specialty Finance',
}

const fundingAmountLabels: Record<string, string> = {
  under_500k: 'Under $500K',
  '500k_2m': '$500K - $2M',
  '2m_10m': '$2M - $10M',
  '10m_50m': '$10M - $50M',
  over_50m: '$50M+',
}

const fundingPurposeLabels: Record<string, string> = {
  working_capital: 'Working Capital / Growth',
  acquisition: 'Acquisition or Purchase',
  refinance: 'Refinance Existing Debt',
  construction: 'Construction / Development',
  portfolio_expansion: 'Portfolio Expansion',
  other: 'Other',
}

function formatUnifiedEmail(data: UnifiedLeadData, score: QualificationScore, factors: LeadSubmission['qualificationFactors']) {
  const assetsFormatted = data.assets.map(a => assetLabels[a] || a).join(', ')
  const loanClassesFormatted = data.loanAssetClasses?.map(c => loanAssetClassLabels[c] || c).join(', ')

  return `
New Lead - Capital Access Qualifier

QUALIFICATION: ${score.toUpperCase().replace('_', ' ')}

CONTACT INFORMATION
-------------------
Company: ${data.companyName}
Contact: ${data.contactName}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}
Location: ${data.locatedInUS ? `${data.location || 'United States'}` : (data.country === 'Other' ? data.countryOther : data.country) || 'Not specified'}

BUSINESS ASSETS
---------------
Asset Types: ${assetsFormatted}${data.assetOther ? ` (${data.assetOther})` : ''}
${data.loanAssetClasses?.length ? `Loan Types: ${loanClassesFormatted}` : ''}
${data.realEstateTypes?.length ? `Real Estate Types: ${data.realEstateTypes.join(', ')}` : ''}

FUNDING REQUEST
---------------
Amount: ${fundingAmountLabels[data.fundingAmount] || data.fundingAmount}
Purpose: ${fundingPurposeLabels[data.fundingPurpose] || data.fundingPurpose}${data.fundingPurposeOther ? ` (${data.fundingPurposeOther})` : ''}

${factors.note ? `Note: ${factors.note}` : ''}

---
Submitted via Capital Access Qualifier
https://qualify.bitcense.com
  `.trim()
}

function formatUnifiedCandidateEmail(data: UnifiedLeadData, score: QualificationScore, factors: LeadSubmission['qualificationFactors']) {
  const qualificationCode = generateQualificationCode(data.companyName)

  return `
Hi ${data.contactName},

Thank you for starting your application with BitCense Capital.

We've received your information and will review your profile. To complete your qualification and get matched with optimal capital solutions, please create your account.

YOUR REQUEST SUMMARY
--------------------
Company: ${data.companyName}
Funding Amount: ${fundingAmountLabels[data.fundingAmount] || data.fundingAmount}
Purpose: ${fundingPurposeLabels[data.fundingPurpose] || data.fundingPurpose}

NEXT STEPS
----------
1. Create your account to complete your full qualification
2. Get matched with the right capital structures
3. Upload documents and connect with capital partners

Create your account: https://qualify.bitcense.com/signup

Best regards,
The BitCense Team

---
BitCense | On-Chain. Retail. Connected.
https://www.bitcense.com
  `.trim()
}

export async function POST(request: Request) {
  try {
    const body: LeadSubmission = await request.json()
    const { leadType, data, qualificationScore, qualificationFactors } = body

    // Format emails based on lead type
    let adminEmailText: string
    let candidateEmailText: string

    if (leadType === 'unified') {
      adminEmailText = formatUnifiedEmail(data as UnifiedLeadData, qualificationScore, qualificationFactors)
      candidateEmailText = formatUnifiedCandidateEmail(data as UnifiedLeadData, qualificationScore, qualificationFactors)
    } else if (leadType === 'originator') {
      adminEmailText = formatOriginatorEmail(data as OriginatorData, qualificationScore, qualificationFactors)
      candidateEmailText = formatOriginatorCandidateEmail(data as OriginatorData, qualificationScore, qualificationFactors)
    } else {
      adminEmailText = formatBorrowerEmail(data as BorrowerData, qualificationScore, qualificationFactors)
      candidateEmailText = formatBorrowerCandidateEmail(data as BorrowerData, qualificationScore, qualificationFactors)
    }

    const contactName = 'contactName' in data ? data.contactName : 'Unknown'
    const companyName = 'companyName' in data ? data.companyName : 'Unknown'
    const candidateEmail = 'email' in data ? data.email : ''

    // Determine lead type label for email subject
    const leadTypeLabel = leadType === 'unified' ? 'Capital' : leadType === 'originator' ? 'Originator' : 'Borrower'

    // Send email notifications
    console.log('API Key exists:', !!process.env.RESEND_API_KEY)
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)

      // Send to admin
      const adminEmailResult = await resend.emails.send({
        from: 'Capital Qualifier <onboarding@resend.dev>',
        to: 'paul.dicesare@gmail.com',
        subject: `[${qualificationScore.toUpperCase().replace('_', ' ')}] New ${leadTypeLabel} Lead: ${companyName}`,
        text: adminEmailText,
      })
      console.log('Admin email result:', JSON.stringify(adminEmailResult))

      // Send confirmation to candidate
      if (candidateEmail) {
        const candidateEmailResult = await resend.emails.send({
          from: 'BitCense <onboarding@resend.dev>',
          to: candidateEmail,
          subject: `Your BitCense Qualification Results - ${qualificationScore === 'strong' ? 'You Qualify!' : 'Next Steps'}`,
          text: candidateEmailText,
        })
        console.log('Candidate email result:', JSON.stringify(candidateEmailResult))
      }
    } else {
      // Log to console if no API key (for development)
      console.log('=== NO API KEY - LOGGING INSTEAD ===')
      console.log('Admin Email:', adminEmailText)
      console.log('Candidate Email:', candidateEmailText)
      console.log('===========================')
    }

    return NextResponse.json({
      success: true,
      message: 'Lead submitted successfully',
      leadId: `${leadType}-${Date.now()}`,
    })
  } catch (error) {
    console.error('Error submitting lead:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to submit lead' },
      { status: 500 }
    )
  }
}

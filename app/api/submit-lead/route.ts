import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { OriginatorData, BorrowerData, QualificationScore } from '@/lib/types'

interface LeadSubmission {
  leadType: 'originator' | 'borrower'
  data: OriginatorData | BorrowerData
  qualificationScore: QualificationScore
  qualificationFactors: {
    strengths: string[]
    considerations: string[]
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
${factors.strengths.length > 0 ? factors.strengths.map(s => `• ${s}`).join('\n') : '• None identified'}

Considerations:
${factors.considerations.length > 0 ? factors.considerations.map(c => `• ${c}`).join('\n') : '• None identified'}

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
${factors.strengths.length > 0 ? factors.strengths.map(s => `• ${s}`).join('\n') : '• None identified'}

Considerations:
${factors.considerations.length > 0 ? factors.considerations.map(c => `• ${c}`).join('\n') : '• None identified'}

---
Submitted via Capital Access Qualifier
https://qualify.bitcense.com
  `.trim()
}

export async function POST(request: Request) {
  try {
    const body: LeadSubmission = await request.json()
    const { leadType, data, qualificationScore, qualificationFactors } = body

    // Format email based on lead type
    const emailText = leadType === 'originator'
      ? formatOriginatorEmail(data as OriginatorData, qualificationScore, qualificationFactors)
      : formatBorrowerEmail(data as BorrowerData, qualificationScore, qualificationFactors)

    const contactName = 'contactName' in data ? data.contactName : 'Unknown'
    const companyName = 'companyName' in data ? data.companyName : 'Unknown'

    // Send email notification
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Capital Qualifier <onboarding@resend.dev>',
        to: 'paul.dicesare@gmail.com',
        subject: `[${qualificationScore.toUpperCase().replace('_', ' ')}] New ${leadType === 'originator' ? 'Originator' : 'Borrower'} Lead: ${companyName}`,
        text: emailText,
      })
    } else {
      // Log to console if no API key (for development)
      console.log('=== NEW LEAD SUBMISSION ===')
      console.log(emailText)
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

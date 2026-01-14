import { OriginatorData, BorrowerData, QualificationScore } from './types'

interface ScoringResult {
  score: QualificationScore
  strengths: string[]
  considerations: string[]
}

export function scoreOriginator(data: Partial<OriginatorData>): ScoringResult {
  let score = 0
  const strengths: string[] = []
  const considerations: string[] = []

  // Volume (max 30 points)
  if (data.annualVolume === '$100M+') {
    score += 30
    strengths.push('Strong origination volume ($100M+) demonstrates scale')
  } else if (data.annualVolume === '$25M - $100M') {
    score += 25
    strengths.push('Solid origination volume suitable for fund structuring')
  } else if (data.annualVolume === '$5M - $25M') {
    score += 15
    considerations.push('Volume may require aggregation with other originators')
  } else if (data.annualVolume) {
    score += 5
    considerations.push('Lower volume may limit structuring options')
  }

  // Deal size (max 25 points)
  if (data.avgDealSize === '$5M+') {
    score += 25
    strengths.push('Large deal sizes align well with institutional requirements')
  } else if (data.avgDealSize === '$1M - $5M') {
    score += 20
    strengths.push('Deal sizes fit well within EU fund parameters')
  } else if (data.avgDealSize === '$250K - $1M') {
    score += 10
    considerations.push('Smaller deals may require pooling for efficiency')
  } else if (data.avgDealSize) {
    considerations.push('Deal size below typical institutional thresholds')
  }

  // Default rate (max 25 points)
  if (data.defaultRate === 'Under 2%') {
    score += 25
    strengths.push('Excellent historical performance with low default rate')
  } else if (data.defaultRate === '2-5%') {
    score += 15
    strengths.push('Acceptable default rate within normal parameters')
  } else if (data.defaultRate === '5-10%') {
    score += 5
    considerations.push('Higher default rate may require enhanced structuring')
  } else if (data.defaultRate === 'Over 10%' || data.defaultRate === 'Not sure') {
    considerations.push('Default rate needs review for fund compliance')
  }

  // Documentation (max 20 points)
  if (data.docStandard === 'Full documentation') {
    score += 20
    strengths.push('Full documentation meets regulatory standards')
  } else if (data.docStandard === 'Lite doc') {
    score += 12
    considerations.push('Lite documentation may require additional verification')
  } else if (data.docStandard === 'Mixed') {
    score += 8
    considerations.push('Mixed documentation standards need standardization')
  } else if (data.docStandard === 'Stated income') {
    considerations.push('Stated income products face regulatory scrutiny')
  }

  // Asset class bonus
  if (data.assetClass === 'Commercial Real Estate' || data.assetClass === 'Residential Real Estate') {
    strengths.push(`${data.assetClass} is a well-understood asset class for EU investors`)
  } else if (data.assetClass === 'SMB Loans') {
    strengths.push('SMB lending aligns with EU sustainable finance initiatives')
  }

  // Determine qualification
  let qualificationScore: QualificationScore
  if (score >= 70) {
    qualificationScore = 'strong'
  } else if (score >= 40) {
    qualificationScore = 'moderate'
  } else {
    qualificationScore = 'needs_discussion'
  }

  return {
    score: qualificationScore,
    strengths,
    considerations,
  }
}

export function scoreBorrower(data: Partial<BorrowerData>): ScoringResult {
  let score = 0
  const strengths: string[] = []
  const considerations: string[] = []

  // Amount (max 25 points) - sweet spot is $500K-$5M
  if (data.amountNeeded === '$500K - $1M' || data.amountNeeded === '$1M - $5M') {
    score += 25
    strengths.push('Funding amount fits well within our network parameters')
  } else if (data.amountNeeded === '$5M+') {
    score += 20
    strengths.push('Larger funding needs may qualify for institutional terms')
  } else if (data.amountNeeded === '$250K - $500K') {
    score += 15
    considerations.push('Smaller amount may have limited lender options')
  } else if (data.amountNeeded) {
    score += 5
    considerations.push('Funding amount below typical network minimums')
  }

  // Collateral (max 30 points)
  if (data.collateralType === 'Commercial real estate' || data.collateralType === 'Residential real estate') {
    if (data.existingDebt === 'Under 50% LTV' || data.existingDebt === 'None') {
      score += 30
      strengths.push('Real estate collateral with strong equity position')
    } else if (data.existingDebt === '50-70% LTV') {
      score += 20
      strengths.push('Real estate secured with acceptable leverage')
    } else {
      score += 10
      considerations.push('Higher existing leverage may affect terms')
    }
  } else if (data.collateralType === 'Equipment/vehicles') {
    score += 15
    considerations.push('Equipment collateral accepted by select lenders')
  } else if (data.collateralType === 'Accounts receivable') {
    score += 12
    considerations.push('AR-based financing available through factoring partners')
  } else if (data.collateralType === 'No collateral available') {
    considerations.push('Unsecured financing has limited options and higher rates')
  }

  // Business history (max 20 points)
  if (data.yearsInBusiness === '5+ years') {
    score += 20
    strengths.push('Established business track record')
  } else if (data.yearsInBusiness === '2-5 years') {
    score += 15
    strengths.push('Sufficient operating history for most lenders')
  } else if (data.yearsInBusiness === '1-2 years') {
    score += 8
    considerations.push('Limited operating history may restrict options')
  } else if (data.yearsInBusiness) {
    considerations.push('Early-stage businesses face more scrutiny')
  }

  // Revenue (max 15 points)
  if (data.annualRevenue === '$10M+') {
    score += 15
    strengths.push('Strong revenue supports favorable terms')
  } else if (data.annualRevenue === '$2M - $10M') {
    score += 12
    strengths.push('Revenue level appropriate for requested funding')
  } else if (data.annualRevenue === '$500K - $2M') {
    score += 8
  } else if (data.annualRevenue === 'Pre-revenue' || data.annualRevenue === 'Under $500K') {
    considerations.push('Revenue level may limit traditional financing options')
  }

  // Timeline (max 10 points)
  if (data.timeline === '1-2 months' || data.timeline === '2+ months' || data.timeline === 'Just exploring') {
    score += 10
    strengths.push('Timeline allows for optimal lender matching')
  } else if (data.timeline === '2-4 weeks') {
    score += 7
    strengths.push('Expedited timeline achievable for qualified borrowers')
  } else if (data.timeline === 'ASAP (under 2 weeks)') {
    score += 3
    considerations.push('Urgent timeline may limit options and affect terms')
  }

  // Bank status insights
  if (data.bankStatus === 'Yes - rejected') {
    considerations.push('Prior bank decline may require documentation')
  } else if (data.bankStatus === 'Yes - too slow') {
    strengths.push('Private credit can move faster than traditional banks')
  }

  // Determine qualification
  let qualificationScore: QualificationScore
  if (score >= 65) {
    qualificationScore = 'strong'
  } else if (score >= 35) {
    qualificationScore = 'moderate'
  } else {
    qualificationScore = 'needs_discussion'
  }

  return {
    score: qualificationScore,
    strengths,
    considerations,
  }
}

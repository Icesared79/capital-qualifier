export type QualificationScore = 'strong' | 'moderate' | 'needs_discussion'

export interface OriginatorData {
  assetClass: string
  assetClassOther?: string
  annualVolume: string
  avgDealSize: string
  defaultRate: string
  docStandard: string
  geoFocus: string
  currentFunding: string[]
  currentFundingOther?: string
  capitalMotivation: string[]
  companyName: string
  contactName: string
  email: string
  phone: string
}

export interface BorrowerData {
  fundingPurpose: string
  fundingPurposeOther?: string
  amountNeeded: string
  timeline: string
  collateralType: string
  collateralOther?: string
  assetValue: string
  existingDebt: string
  businessType: string
  businessTypeOther?: string
  yearsInBusiness: string
  annualRevenue: string
  bankStatus: string
  rejectionReasons: string[]
  companyName: string
  contactName: string
  email: string
  phone: string
  bestTimeToReach: string
}

export interface Lead {
  id: string
  createdAt: string
  leadType: 'originator' | 'borrower'
  qualificationScore: QualificationScore
  qualificationFactors: {
    strengths: string[]
    considerations: string[]
  }
  data: OriginatorData | BorrowerData
}

export interface SelectOption {
  value: string
  label: string
  description?: string
}

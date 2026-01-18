// AI Scoring System Types

export interface LoanTapeRow {
  loanId: string
  borrowerName?: string
  originalBalance: number
  currentBalance: number
  interestRate: number
  originationDate: Date
  maturityDate: Date
  termMonths: number
  paymentStatus: 'current' | '30_day' | '60_day' | '90_day' | 'default' | 'paid_off'
  propertyType?: string
  propertyState?: string
  propertyCity?: string
  propertyValue?: number
  originalLtv?: number
  currentLtv?: number
  dscr?: number
  lienPosition?: string
  appraisalDate?: Date
  loanPurpose?: string
}

export interface PerformanceHistoryRow {
  periodMonth: Date
  portfolioBalance: number
  loanCount: number
  currentPct: number
  delinquent30Pct: number
  delinquent60Pct: number
  delinquent90Pct: number
  defaultPct: number
  prepayments?: number
  newOriginations?: number
}

export interface PortfolioMetrics {
  portfolioSize: number
  loanCount: number
  avgLoanSize: number
  weightedAvgRate: number
  weightedAvgLtv: number
  weightedAvgDscr: number
  defaultRate: number
  delinquency30Rate: number
  delinquency60Rate: number
  delinquency90Rate: number
  avgLoanAgeMonths: number
  avgRemainingTermMonths: number
  largestSingleExposure: number
  top10Concentration: number
  geographicConcentration: Record<string, number>
  propertyTypeConcentration: Record<string, number>
}

export interface CategoryScore {
  score: number  // 0-100
  grade: string  // A, B, C, D, F
  weight: number // percentage (0.25 = 25%)
  weightedScore: number
  details: Record<string, any>
}

export interface AssessmentScores {
  portfolioPerformance: CategoryScore
  cashFlowQuality: CategoryScore
  documentation: CategoryScore
  collateralCoverage: CategoryScore
  diversification: CategoryScore
  regulatoryReadiness: CategoryScore
}

export interface RedFlag {
  type: string
  severity: 'high' | 'medium' | 'low'
  message: string
  details?: any
}

export interface AssessmentResult {
  overallScore: number
  letterGrade: string
  status: 'incomplete' | 'processing' | 'preliminary' | 'complete' | 'error'
  metrics: PortfolioMetrics
  scores: AssessmentScores

  // AI-generated
  summary?: string
  strengths: string[]
  concerns: string[]
  recommendations: string[]
  redFlags: RedFlag[]

  // Tokenization readiness
  tokenizationReadiness: 'ready' | 'conditional' | 'not_ready'
  readyPercentage: number
  conditionalPercentage: number
  notReadyPercentage: number
  estimatedTimeline?: string
}

// Scoring thresholds from spec
export const SCORING_THRESHOLDS = {
  portfolioPerformance: {
    defaultRate: { A: 0.02, B: 0.05, C: 0.10 },
    delinquencyRate: { A: 0.03, B: 0.07, C: 0.15 },
    recoveryRate: { A: 0.80, B: 0.60, C: 0.40 }
  },
  cashFlowQuality: {
    avgDscr: { A: 1.5, B: 1.25, C: 1.0 },
    paymentConsistency: { A: 0.95, B: 0.90, C: 0.80 }
  },
  documentation: {
    performanceHistoryMonths: { A: 24, B: 12, C: 6 }
  },
  collateralCoverage: {
    avgLtv: { A: 0.60, B: 0.70, C: 0.80 }
  },
  diversification: {
    largestExposure: { A: 0.05, B: 0.10, C: 0.20 },
    top10Concentration: { A: 0.30, B: 0.50, C: 0.70 },
    geographicSpread: { A: 5, B: 3, C: 2 },
    propertyTypeMix: { A: 4, B: 3, C: 2 }
  }
}

// Category weights
export const CATEGORY_WEIGHTS = {
  portfolioPerformance: 0.25,
  cashFlowQuality: 0.25,
  documentation: 0.20,
  collateralCoverage: 0.15,
  diversification: 0.10,
  regulatoryReadiness: 0.05
}

// Red flag triggers
export const RED_FLAG_TRIGGERS = {
  defaultRateHigh: 0.10,
  anyLoan90Plus: true,
  singleExposureHigh: 0.20,
  avgLtvHigh: 0.80,
  dscrLow: 1.0,
  appraisalOld: 36, // months
  performanceHistoryShort: 6, // months
  unsecuredHigh: 0.25
}

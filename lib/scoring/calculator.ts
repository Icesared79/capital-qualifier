import {
  LoanTapeRow,
  PerformanceHistoryRow,
  PortfolioMetrics,
  CategoryScore,
  AssessmentScores,
  AssessmentResult,
  RedFlag,
  SCORING_THRESHOLDS,
  CATEGORY_WEIGHTS,
  RED_FLAG_TRIGGERS
} from './types'

// Helper to calculate weighted average
function weightedAverage(items: { value: number; weight: number }[]): number {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0)
  if (totalWeight === 0) return 0
  return items.reduce((sum, i) => sum + (i.value * i.weight), 0) / totalWeight
}

// Helper to get letter grade from score
function getGrade(score: number): string {
  if (score >= 95) return 'A'
  if (score >= 90) return 'A-'
  if (score >= 85) return 'B+'
  if (score >= 80) return 'B'
  if (score >= 75) return 'B-'
  if (score >= 70) return 'C+'
  if (score >= 65) return 'C'
  if (score >= 60) return 'C-'
  if (score >= 50) return 'D'
  return 'F'
}

// Calculate months between two dates
function monthsBetween(date1: Date, date2: Date): number {
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24 * 30))
}

// Extract portfolio metrics from loan tape
export function calculateMetrics(
  loans: LoanTapeRow[],
  performanceHistory?: PerformanceHistoryRow[]
): PortfolioMetrics {
  const now = new Date()

  // Basic portfolio metrics
  const portfolioSize = loans.reduce((sum, l) => sum + (l.currentBalance || 0), 0)
  const loanCount = loans.length
  const avgLoanSize = loanCount > 0 ? portfolioSize / loanCount : 0

  // Weighted averages (weighted by current balance)
  const rateItems = loans
    .filter(l => l.interestRate !== undefined && l.currentBalance)
    .map(l => ({ value: l.interestRate!, weight: l.currentBalance }))
  const weightedAvgRate = weightedAverage(rateItems)

  const ltvItems = loans
    .filter(l => l.currentLtv !== undefined && l.currentBalance)
    .map(l => ({ value: l.currentLtv!, weight: l.currentBalance }))
  const weightedAvgLtv = weightedAverage(ltvItems)

  const dscrItems = loans
    .filter(l => l.dscr !== undefined && l.currentBalance)
    .map(l => ({ value: l.dscr!, weight: l.currentBalance }))
  const weightedAvgDscr = weightedAverage(dscrItems)

  // Payment status distribution
  const statusCounts = {
    current: 0,
    '30_day': 0,
    '60_day': 0,
    '90_day': 0,
    default: 0,
    paid_off: 0
  }
  loans.forEach(l => {
    const status = l.paymentStatus || 'current'
    statusCounts[status]++
  })

  const activeLoans = loanCount - statusCounts.paid_off
  const defaultRate = activeLoans > 0 ? statusCounts.default / activeLoans : 0
  const delinquency30Rate = activeLoans > 0 ? statusCounts['30_day'] / activeLoans : 0
  const delinquency60Rate = activeLoans > 0 ? statusCounts['60_day'] / activeLoans : 0
  const delinquency90Rate = activeLoans > 0 ? statusCounts['90_day'] / activeLoans : 0

  // Loan age and remaining term
  const loanAges = loans
    .filter(l => l.originationDate)
    .map(l => monthsBetween(l.originationDate!, now))
  const avgLoanAgeMonths = loanAges.length > 0
    ? Math.round(loanAges.reduce((a, b) => a + b, 0) / loanAges.length)
    : 0

  const remainingTerms = loans
    .filter(l => l.maturityDate)
    .map(l => Math.max(0, monthsBetween(now, l.maturityDate!)))
  const avgRemainingTermMonths = remainingTerms.length > 0
    ? Math.round(remainingTerms.reduce((a, b) => a + b, 0) / remainingTerms.length)
    : 0

  // Concentration metrics
  const sortedByBalance = [...loans].sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0))
  const largestSingleExposure = portfolioSize > 0 && sortedByBalance[0]
    ? (sortedByBalance[0].currentBalance || 0) / portfolioSize
    : 0

  const top10Balance = sortedByBalance.slice(0, 10).reduce((sum, l) => sum + (l.currentBalance || 0), 0)
  const top10Concentration = portfolioSize > 0 ? top10Balance / portfolioSize : 0

  // Geographic concentration
  const geographicConcentration: Record<string, number> = {}
  loans.forEach(l => {
    if (l.propertyState && l.currentBalance) {
      geographicConcentration[l.propertyState] = (geographicConcentration[l.propertyState] || 0) + l.currentBalance
    }
  })
  Object.keys(geographicConcentration).forEach(state => {
    geographicConcentration[state] = portfolioSize > 0
      ? Math.round((geographicConcentration[state] / portfolioSize) * 1000) / 1000
      : 0
  })

  // Property type concentration
  const propertyTypeConcentration: Record<string, number> = {}
  loans.forEach(l => {
    if (l.propertyType && l.currentBalance) {
      propertyTypeConcentration[l.propertyType] = (propertyTypeConcentration[l.propertyType] || 0) + l.currentBalance
    }
  })
  Object.keys(propertyTypeConcentration).forEach(type => {
    propertyTypeConcentration[type] = portfolioSize > 0
      ? Math.round((propertyTypeConcentration[type] / portfolioSize) * 1000) / 1000
      : 0
  })

  return {
    portfolioSize,
    loanCount,
    avgLoanSize,
    weightedAvgRate,
    weightedAvgLtv,
    weightedAvgDscr,
    defaultRate,
    delinquency30Rate,
    delinquency60Rate,
    delinquency90Rate,
    avgLoanAgeMonths,
    avgRemainingTermMonths,
    largestSingleExposure,
    top10Concentration,
    geographicConcentration,
    propertyTypeConcentration
  }
}

// Calculate portfolio performance score (25%)
function scorePortfolioPerformance(
  metrics: PortfolioMetrics,
  performanceHistory?: PerformanceHistoryRow[]
): CategoryScore {
  const thresholds = SCORING_THRESHOLDS.portfolioPerformance
  let score = 0

  // Default rate scoring (up to 40 points)
  if (metrics.defaultRate <= thresholds.defaultRate.A) score += 40
  else if (metrics.defaultRate <= thresholds.defaultRate.B) score += 30
  else if (metrics.defaultRate <= thresholds.defaultRate.C) score += 20
  else score += 10

  // Delinquency rate scoring (up to 40 points)
  const totalDelinquency = metrics.delinquency30Rate + metrics.delinquency60Rate + metrics.delinquency90Rate
  if (totalDelinquency <= thresholds.delinquencyRate.A) score += 40
  else if (totalDelinquency <= thresholds.delinquencyRate.B) score += 30
  else if (totalDelinquency <= thresholds.delinquencyRate.C) score += 20
  else score += 10

  // Performance trend (up to 20 points) - if we have history
  if (performanceHistory && performanceHistory.length >= 3) {
    const recent = performanceHistory.slice(-3)
    const older = performanceHistory.slice(0, 3)

    const recentDefault = recent.reduce((sum, r) => sum + (r.defaultPct || 0), 0) / recent.length
    const olderDefault = older.reduce((sum, r) => sum + (r.defaultPct || 0), 0) / older.length

    if (recentDefault < olderDefault) score += 20  // Improving
    else if (recentDefault === olderDefault) score += 15  // Stable
    else if (recentDefault < olderDefault * 1.5) score += 10  // Slightly worse
    else score += 5  // Deteriorating
  } else {
    score += 10  // No history, neutral score
  }

  return {
    score,
    grade: getGrade(score),
    weight: CATEGORY_WEIGHTS.portfolioPerformance,
    weightedScore: score * CATEGORY_WEIGHTS.portfolioPerformance,
    details: {
      defaultRate: metrics.defaultRate,
      delinquency30Rate: metrics.delinquency30Rate,
      delinquency60Rate: metrics.delinquency60Rate,
      delinquency90Rate: metrics.delinquency90Rate
    }
  }
}

// Calculate cash flow quality score (25%)
function scoreCashFlowQuality(metrics: PortfolioMetrics, loans: LoanTapeRow[]): CategoryScore {
  const thresholds = SCORING_THRESHOLDS.cashFlowQuality
  let score = 0

  // DSCR scoring (up to 50 points)
  if (metrics.weightedAvgDscr >= thresholds.avgDscr.A) score += 50
  else if (metrics.weightedAvgDscr >= thresholds.avgDscr.B) score += 40
  else if (metrics.weightedAvgDscr >= thresholds.avgDscr.C) score += 25
  else score += 10

  // Payment consistency (up to 35 points) - based on current status
  const currentPct = loans.filter(l => l.paymentStatus === 'current').length / loans.length
  if (currentPct >= thresholds.paymentConsistency.A) score += 35
  else if (currentPct >= thresholds.paymentConsistency.B) score += 25
  else if (currentPct >= thresholds.paymentConsistency.C) score += 15
  else score += 5

  // Interest rate competitiveness (up to 15 points)
  // Assuming market rate is around 8-10%
  if (metrics.weightedAvgRate >= 8 && metrics.weightedAvgRate <= 12) score += 15
  else if (metrics.weightedAvgRate >= 6 && metrics.weightedAvgRate <= 14) score += 10
  else score += 5

  return {
    score,
    grade: getGrade(score),
    weight: CATEGORY_WEIGHTS.cashFlowQuality,
    weightedScore: score * CATEGORY_WEIGHTS.cashFlowQuality,
    details: {
      weightedAvgDscr: metrics.weightedAvgDscr,
      currentPct,
      weightedAvgRate: metrics.weightedAvgRate
    }
  }
}

// Calculate documentation score (20%)
function scoreDocumentation(
  loans: LoanTapeRow[],
  performanceHistory?: PerformanceHistoryRow[],
  hasLoanTape: boolean = true,
  hasSupportingDocs: boolean = false
): CategoryScore {
  let score = 0

  // Loan tape completeness (up to 40 points)
  if (hasLoanTape) {
    const requiredFields = ['loanId', 'currentBalance', 'interestRate', 'paymentStatus']
    const optionalFields = ['dscr', 'currentLtv', 'propertyType', 'propertyState', 'lienPosition', 'appraisalDate']

    // Check how complete the loan tape is
    const sampleLoan = loans[0]
    const hasRequired = requiredFields.every(f => (sampleLoan as any)[f] !== undefined)
    const optionalCount = optionalFields.filter(f => (sampleLoan as any)[f] !== undefined).length

    if (hasRequired && optionalCount >= 5) score += 40
    else if (hasRequired && optionalCount >= 3) score += 30
    else if (hasRequired) score += 20
    else score += 10
  }

  // Performance history length (up to 40 points)
  const thresholds = SCORING_THRESHOLDS.documentation
  if (performanceHistory && performanceHistory.length > 0) {
    const months = performanceHistory.length
    if (months >= thresholds.performanceHistoryMonths.A) score += 40
    else if (months >= thresholds.performanceHistoryMonths.B) score += 30
    else if (months >= thresholds.performanceHistoryMonths.C) score += 20
    else score += 10
  } else {
    score += 5  // No performance history
  }

  // Supporting documents (up to 20 points)
  if (hasSupportingDocs) score += 20
  else score += 5

  return {
    score,
    grade: getGrade(score),
    weight: CATEGORY_WEIGHTS.documentation,
    weightedScore: score * CATEGORY_WEIGHTS.documentation,
    details: {
      hasLoanTape,
      performanceHistoryMonths: performanceHistory?.length || 0,
      hasSupportingDocs
    }
  }
}

// Calculate collateral coverage score (15%)
function scoreCollateralCoverage(metrics: PortfolioMetrics, loans: LoanTapeRow[]): CategoryScore {
  const thresholds = SCORING_THRESHOLDS.collateralCoverage
  let score = 0

  // LTV scoring (up to 50 points)
  const avgLtv = metrics.weightedAvgLtv / 100  // Convert to decimal
  if (avgLtv <= thresholds.avgLtv.A) score += 50
  else if (avgLtv <= thresholds.avgLtv.B) score += 40
  else if (avgLtv <= thresholds.avgLtv.C) score += 25
  else score += 10

  // Lien position (up to 30 points)
  const firstLienCount = loans.filter(l =>
    l.lienPosition?.toLowerCase().includes('1st') ||
    l.lienPosition?.toLowerCase() === '1' ||
    l.lienPosition?.toLowerCase().includes('first')
  ).length
  const firstLienPct = loans.length > 0 ? firstLienCount / loans.length : 0

  if (firstLienPct >= 0.95) score += 30
  else if (firstLienPct >= 0.80) score += 25
  else if (firstLienPct >= 0.50) score += 15
  else score += 5

  // Appraisal recency (up to 20 points)
  const now = new Date()
  const loansWithAppraisal = loans.filter(l => l.appraisalDate)
  if (loansWithAppraisal.length > 0) {
    const avgAppraisalAge = loansWithAppraisal
      .map(l => monthsBetween(l.appraisalDate!, now))
      .reduce((a, b) => a + b, 0) / loansWithAppraisal.length

    if (avgAppraisalAge <= 12) score += 20
    else if (avgAppraisalAge <= 24) score += 15
    else if (avgAppraisalAge <= 36) score += 10
    else score += 5
  } else {
    score += 5  // No appraisal data
  }

  return {
    score,
    grade: getGrade(score),
    weight: CATEGORY_WEIGHTS.collateralCoverage,
    weightedScore: score * CATEGORY_WEIGHTS.collateralCoverage,
    details: {
      weightedAvgLtv: metrics.weightedAvgLtv,
      firstLienPct,
      loansWithAppraisalPct: loans.length > 0 ? loansWithAppraisal.length / loans.length : 0
    }
  }
}

// Calculate diversification score (10%)
function scoreDiversification(metrics: PortfolioMetrics): CategoryScore {
  const thresholds = SCORING_THRESHOLDS.diversification
  let score = 0

  // Single exposure (up to 30 points)
  if (metrics.largestSingleExposure <= thresholds.largestExposure.A) score += 30
  else if (metrics.largestSingleExposure <= thresholds.largestExposure.B) score += 25
  else if (metrics.largestSingleExposure <= thresholds.largestExposure.C) score += 15
  else score += 5

  // Top 10 concentration (up to 30 points)
  if (metrics.top10Concentration <= thresholds.top10Concentration.A) score += 30
  else if (metrics.top10Concentration <= thresholds.top10Concentration.B) score += 25
  else if (metrics.top10Concentration <= thresholds.top10Concentration.C) score += 15
  else score += 5

  // Geographic spread (up to 20 points)
  const stateCount = Object.keys(metrics.geographicConcentration).length
  if (stateCount >= thresholds.geographicSpread.A) score += 20
  else if (stateCount >= thresholds.geographicSpread.B) score += 15
  else if (stateCount >= thresholds.geographicSpread.C) score += 10
  else score += 5

  // Property type mix (up to 20 points)
  const typeCount = Object.keys(metrics.propertyTypeConcentration).length
  if (typeCount >= thresholds.propertyTypeMix.A) score += 20
  else if (typeCount >= thresholds.propertyTypeMix.B) score += 15
  else if (typeCount >= thresholds.propertyTypeMix.C) score += 10
  else score += 5

  return {
    score,
    grade: getGrade(score),
    weight: CATEGORY_WEIGHTS.diversification,
    weightedScore: score * CATEGORY_WEIGHTS.diversification,
    details: {
      largestSingleExposure: metrics.largestSingleExposure,
      top10Concentration: metrics.top10Concentration,
      stateCount,
      typeCount
    }
  }
}

// Calculate regulatory readiness score (5%)
// This would normally involve more user inputs about structure
function scoreRegulatoryReadiness(hasStructureInfo: boolean = false): CategoryScore {
  // Simplified - would expand based on user inputs
  const score = hasStructureInfo ? 80 : 60

  return {
    score,
    grade: getGrade(score),
    weight: CATEGORY_WEIGHTS.regulatoryReadiness,
    weightedScore: score * CATEGORY_WEIGHTS.regulatoryReadiness,
    details: {
      hasStructureInfo,
      note: 'Regulatory readiness requires manual review'
    }
  }
}

// Detect red flags
function detectRedFlags(
  metrics: PortfolioMetrics,
  loans: LoanTapeRow[],
  performanceHistory?: PerformanceHistoryRow[]
): RedFlag[] {
  const flags: RedFlag[] = []

  // Default rate > 10%
  if (metrics.defaultRate > RED_FLAG_TRIGGERS.defaultRateHigh) {
    flags.push({
      type: 'HIGH_DEFAULT_RATE',
      severity: 'high',
      message: `Default rate of ${(metrics.defaultRate * 100).toFixed(1)}% exceeds 10% threshold`,
      details: { defaultRate: metrics.defaultRate }
    })
  }

  // Any loan 90+ days delinquent
  const loans90Plus = loans.filter(l => l.paymentStatus === '90_day' || l.paymentStatus === 'default')
  if (loans90Plus.length > 0) {
    flags.push({
      type: 'LOANS_90_PLUS',
      severity: 'high',
      message: `${loans90Plus.length} loan(s) are 90+ days delinquent or in default`,
      details: { count: loans90Plus.length, loanIds: loans90Plus.map(l => l.loanId) }
    })
  }

  // Single exposure > 20%
  if (metrics.largestSingleExposure > RED_FLAG_TRIGGERS.singleExposureHigh) {
    flags.push({
      type: 'HIGH_CONCENTRATION',
      severity: 'high',
      message: `Largest single exposure is ${(metrics.largestSingleExposure * 100).toFixed(1)}% of portfolio`,
      details: { exposure: metrics.largestSingleExposure }
    })
  }

  // Avg LTV > 80%
  if (metrics.weightedAvgLtv > RED_FLAG_TRIGGERS.avgLtvHigh * 100) {
    flags.push({
      type: 'HIGH_LTV',
      severity: 'medium',
      message: `Average LTV of ${metrics.weightedAvgLtv.toFixed(1)}% exceeds 80% threshold`,
      details: { avgLtv: metrics.weightedAvgLtv }
    })
  }

  // DSCR < 1.0 on any loan
  const lowDscrLoans = loans.filter(l => l.dscr !== undefined && l.dscr < RED_FLAG_TRIGGERS.dscrLow)
  if (lowDscrLoans.length > 0) {
    flags.push({
      type: 'LOW_DSCR',
      severity: 'medium',
      message: `${lowDscrLoans.length} loan(s) have DSCR below 1.0x`,
      details: { count: lowDscrLoans.length, loanIds: lowDscrLoans.map(l => l.loanId) }
    })
  }

  // Appraisals > 36 months old
  const now = new Date()
  const oldAppraisals = loans.filter(l => {
    if (!l.appraisalDate) return false
    return monthsBetween(l.appraisalDate, now) > RED_FLAG_TRIGGERS.appraisalOld
  })
  if (oldAppraisals.length > 0) {
    flags.push({
      type: 'OLD_APPRAISALS',
      severity: 'medium',
      message: `${oldAppraisals.length} loan(s) have appraisals older than 36 months`,
      details: { count: oldAppraisals.length, loanIds: oldAppraisals.map(l => l.loanId) }
    })
  }

  // Performance history < 6 months
  if (!performanceHistory || performanceHistory.length < RED_FLAG_TRIGGERS.performanceHistoryShort) {
    flags.push({
      type: 'LIMITED_HISTORY',
      severity: 'low',
      message: `Only ${performanceHistory?.length || 0} months of performance history available`,
      details: { months: performanceHistory?.length || 0 }
    })
  }

  return flags
}

// Main scoring function
export function calculateAssessment(
  loans: LoanTapeRow[],
  performanceHistory?: PerformanceHistoryRow[],
  options: {
    hasSupportingDocs?: boolean
    hasStructureInfo?: boolean
  } = {}
): AssessmentResult {
  // Calculate metrics
  const metrics = calculateMetrics(loans, performanceHistory)

  // Calculate category scores
  const scores: AssessmentScores = {
    portfolioPerformance: scorePortfolioPerformance(metrics, performanceHistory),
    cashFlowQuality: scoreCashFlowQuality(metrics, loans),
    documentation: scoreDocumentation(loans, performanceHistory, true, options.hasSupportingDocs),
    collateralCoverage: scoreCollateralCoverage(metrics, loans),
    diversification: scoreDiversification(metrics),
    regulatoryReadiness: scoreRegulatoryReadiness(options.hasStructureInfo)
  }

  // Calculate overall score
  const overallScore = Math.round(
    scores.portfolioPerformance.weightedScore +
    scores.cashFlowQuality.weightedScore +
    scores.documentation.weightedScore +
    scores.collateralCoverage.weightedScore +
    scores.diversification.weightedScore +
    scores.regulatoryReadiness.weightedScore
  )

  // Detect red flags
  const redFlags = detectRedFlags(metrics, loans, performanceHistory)

  // Determine tokenization readiness
  let tokenizationReadiness: 'ready' | 'conditional' | 'not_ready' = 'ready'
  if (redFlags.some(f => f.severity === 'high')) {
    tokenizationReadiness = 'not_ready'
  } else if (redFlags.some(f => f.severity === 'medium') || overallScore < 70) {
    tokenizationReadiness = 'conditional'
  }

  // Placeholder for AI-generated content (will be filled by AI service)
  const strengths: string[] = []
  const concerns: string[] = []
  const recommendations: string[] = []

  // Auto-generate basic strengths/concerns based on scores
  if (scores.portfolioPerformance.score >= 80) {
    strengths.push(`Strong portfolio performance with ${(metrics.defaultRate * 100).toFixed(1)}% default rate`)
  }
  if (scores.cashFlowQuality.score >= 80) {
    strengths.push(`Solid cash flow quality with ${metrics.weightedAvgDscr.toFixed(2)}x average DSCR`)
  }
  if (scores.collateralCoverage.score >= 80) {
    strengths.push(`Strong collateral coverage with ${metrics.weightedAvgLtv.toFixed(1)}% average LTV`)
  }

  if (scores.diversification.score < 70) {
    concerns.push(`Portfolio concentration risk - top 10 borrowers represent ${(metrics.top10Concentration * 100).toFixed(0)}%`)
  }
  if (!performanceHistory || performanceHistory.length < 12) {
    concerns.push(`Limited performance history (${performanceHistory?.length || 0} months)`)
  }

  // Generate basic recommendations
  if (!performanceHistory || performanceHistory.length < 24) {
    recommendations.push('Provide additional months of performance history to improve score')
  }
  if (metrics.largestSingleExposure > 0.10) {
    recommendations.push('Consider reducing largest single exposure below 10%')
  }

  return {
    overallScore,
    letterGrade: getGrade(overallScore),
    status: performanceHistory && performanceHistory.length >= 6 ? 'complete' : 'preliminary',
    metrics,
    scores,
    strengths,
    concerns,
    recommendations,
    redFlags,
    tokenizationReadiness,
    readyPercentage: tokenizationReadiness === 'ready' ? 100 : tokenizationReadiness === 'conditional' ? 70 : 30,
    conditionalPercentage: tokenizationReadiness === 'conditional' ? 30 : 0,
    notReadyPercentage: tokenizationReadiness === 'not_ready' ? 70 : 0,
    estimatedTimeline: tokenizationReadiness === 'ready' ? '2-4 weeks' :
      tokenizationReadiness === 'conditional' ? '4-8 weeks' : '8+ weeks'
  }
}

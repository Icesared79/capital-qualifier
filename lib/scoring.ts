import {
  OriginatorData,
  BorrowerData,
  QualificationScore,
  CategoryScore,
  CapitalType,
  CapitalFit,
  DimensionScore,
  OriginatorQualification,
} from './types'

interface ScoringResult {
  score: QualificationScore
  totalPoints: number
  maxPoints: number
  strengths: string[]
  considerations: string[]
  categories: CategoryScore[]
}

// Capital structure definitions with requirements
const capitalStructures: Record<CapitalType, { name: string; description: string; minVolume: number; requirements: string[] }> = {
  warehouse_line: {
    name: 'Warehouse Credit Facility',
    description: 'Revolving credit line secured by originated loans, enabling continuous origination capacity',
    minVolume: 25,
    requirements: ['Consistent origination volume', 'Strong documentation standards', 'Low default rates'],
  },
  forward_flow: {
    name: 'Forward Flow Agreement',
    description: 'Committed purchase agreement for future loan production at pre-negotiated terms',
    minVolume: 10,
    requirements: ['Predictable origination pipeline', 'Standardized underwriting', 'Performance track record'],
  },
  whole_loan_sale: {
    name: 'Whole Loan Sale',
    description: 'Direct sale of existing loan portfolio to institutional buyers',
    minVolume: 5,
    requirements: ['Existing portfolio', 'Complete loan files', 'Clear servicing arrangement'],
  },
  securitization: {
    name: 'Securitization',
    description: 'Pool loans into asset-backed securities for capital markets execution',
    minVolume: 100,
    requirements: ['Large homogeneous portfolio', 'Full documentation', 'Rating agency eligible', 'Institutional scale'],
  },
  credit_facility: {
    name: 'Term Credit Facility',
    description: 'Fixed-term debt facility for portfolio financing or growth capital',
    minVolume: 15,
    requirements: ['Stable cash flows', 'Adequate collateral coverage', 'Operating history'],
  },
  equity_partnership: {
    name: 'Equity Partnership',
    description: 'Strategic equity investment for platform growth and expansion',
    minVolume: 5,
    requirements: ['Scalable platform', 'Strong management team', 'Clear growth strategy'],
  },
  mezzanine: {
    name: 'Mezzanine Financing',
    description: 'Subordinated debt with equity upside for growth initiatives',
    minVolume: 10,
    requirements: ['Growth opportunity', 'Existing senior debt capacity', 'Path to exit or refinancing'],
  },
}

// Parse volume string to numeric value for comparison
function parseVolume(volume: string): number {
  if (volume === '$100M+') return 100
  if (volume === '$25M - $100M') return 50
  if (volume === '$5M - $25M') return 15
  if (volume === '$1M - $5M') return 3
  if (volume === 'Under $1M') return 0.5
  return 0
}

// Parse capital amount to numeric value (in millions)
function parseCapitalAmount(amount: string | number | undefined): number {
  if (amount === undefined || amount === null) return 0

  // If it's a number, assume it's in dollars and convert to millions
  if (typeof amount === 'number') {
    return amount / 1000000
  }

  // Handle legacy string formats
  if (amount === '$100,000,000+') return 100
  if (amount === '$50,000,000 - $100,000,000') return 75
  if (amount === '$15,000,000 - $50,000,000') return 32
  if (amount === '$5,000,000 - $15,000,000') return 10
  if (amount === 'Under $5,000,000') return 2.5

  // Try to parse numeric string
  const cleaned = amount.replace(/[$,\s]/g, '').toLowerCase()
  if (cleaned.endsWith('m')) {
    const num = parseFloat(cleaned.slice(0, -1))
    return isNaN(num) ? 0 : num
  }
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num / 1000000
}

export function scoreOriginatorAdvanced(data: Partial<OriginatorData>): OriginatorQualification {
  const strengths: string[] = []
  const considerations: string[] = []
  const nextSteps: string[] = []

  // Parse input data
  const volume = parseVolume(data.annualVolume || '')
  const capitalNeeded = parseCapitalAmount(data.capitalAmount)
  const capitalGoals = data.capitalGoal || []
  const assetClasses = data.assetClass || []
  const currentFunding = data.currentFunding || []
  const isUS = data.locatedInUS === true

  // ============================================
  // DIMENSION 1: SCALE (0-25 points)
  // ============================================
  let scaleScore = 0
  const scaleInsights: string[] = []

  if (volume >= 100) {
    scaleScore = 25
    scaleInsights.push('Institutional-scale origination volume')
    scaleInsights.push('Qualifies for full range of capital solutions')
    strengths.push('Institutional-scale volume ($100M+) opens all capital channels')
  } else if (volume >= 25) {
    scaleScore = 20
    scaleInsights.push('Strong volume for fund-level structures')
    scaleInsights.push('Well-positioned for warehouse and forward flow')
    strengths.push('Strong origination volume suitable for institutional structures')
  } else if (volume >= 10) {
    scaleScore = 14
    scaleInsights.push('Emerging scale with growth potential')
    scaleInsights.push('Forward flow and whole loan sale opportunities')
  } else if (volume >= 3) {
    scaleScore = 8
    scaleInsights.push('Early-stage volume')
    scaleInsights.push('May benefit from aggregation strategies')
    considerations.push('Volume may benefit from aggregation with complementary originators')
  } else {
    scaleScore = 3
    scaleInsights.push('Building origination capacity')
    considerations.push('Building track record for institutional capital')
  }

  // ============================================
  // DIMENSION 2: QUALITY (0-25 points)
  // ============================================
  let qualityScore = 0
  const qualityInsights: string[] = []

  if (data.defaultRate === 'Under 2%') {
    qualityScore = 25
    qualityInsights.push('Exceptional portfolio performance')
    qualityInsights.push('Meets institutional investment grade standards')
    strengths.push('Exceptional credit quality with sub-2% defaults')
  } else if (data.defaultRate === '2-5%') {
    qualityScore = 18
    qualityInsights.push('Strong credit performance')
    qualityInsights.push('Within acceptable institutional parameters')
    strengths.push('Strong portfolio quality within institutional norms')
  } else if (data.defaultRate === '5-10%') {
    qualityScore = 10
    qualityInsights.push('Elevated default rate')
    qualityInsights.push('May require credit enhancement structures')
    considerations.push('Default rate may require first-loss or credit enhancement')
  } else if (data.defaultRate === 'Over 10%') {
    qualityScore = 3
    qualityInsights.push('High default rate requires specialized structures')
    considerations.push('High default rate limits traditional capital options')
  } else {
    qualityScore = 5
    qualityInsights.push('Performance data needed for evaluation')
    considerations.push('Historical performance documentation will be required')
    nextSteps.push('Prepare historical default and loss data')
  }

  // ============================================
  // DIMENSION 3: READINESS (0-20 points)
  // ============================================
  let readinessScore = 0
  const readinessInsights: string[] = []

  // Documentation readiness
  if (data.docStandard === 'Full Documentation') {
    readinessScore += 10
    readinessInsights.push('Full documentation meets investor requirements')
    strengths.push('Full documentation standards meet regulatory requirements')
  } else if (data.docStandard === 'Partial Documentation') {
    readinessScore += 6
    readinessInsights.push('Documentation may need enhancement')
  } else if (data.docStandard === 'Varies Across Portfolio') {
    readinessScore += 3
    readinessInsights.push('Documentation standardization recommended')
    considerations.push('Inconsistent documentation may slow due diligence')
  } else if (data.docStandard) {
    readinessScore += 1
    considerations.push('Limited documentation restricts institutional appetite')
  }

  // Operational sophistication (based on current funding sources)
  if (currentFunding.includes('Bank warehouse line') || currentFunding.includes('Institutional credit facility')) {
    readinessScore += 10
    readinessInsights.push('Existing institutional relationships demonstrate readiness')
    strengths.push('Existing institutional funding demonstrates operational maturity')
  } else if (currentFunding.includes('Private credit fund') || currentFunding.includes('Family office')) {
    readinessScore += 7
    readinessInsights.push('Private capital experience provides foundation')
    strengths.push('Private capital experience provides transition path to institutional')
  } else if (currentFunding.includes('Balance sheet only') || currentFunding.includes('Friends & family')) {
    readinessScore += 3
    readinessInsights.push('Building toward institutional-ready operations')
    nextSteps.push('Develop institutional reporting and compliance frameworks')
  } else {
    readinessScore += 1
  }

  // ============================================
  // DIMENSION 4: MARKET POSITION (0-15 points)
  // ============================================
  let marketScore = 0
  const marketInsights: string[] = []

  // Asset class attractiveness
  const hasRealEstate = assetClasses.some(ac => ac.includes('Real Estate'))
  const hasSMB = assetClasses.includes('SMB Loans')
  const hasConsumer = assetClasses.includes('Consumer Loans')
  const hasEquipment = assetClasses.includes('Equipment Financing')
  const hasSpecialty = assetClasses.includes('Specialty Finance')

  if (hasRealEstate) {
    marketScore += 5
    marketInsights.push('Real estate is highly liquid in secondary markets')
    strengths.push('Real estate assets are well-understood by global investors')
  }
  if (hasSMB) {
    marketScore += 4
    marketInsights.push('SMB lending aligns with impact investing mandates')
  }
  if (hasConsumer) {
    marketScore += 3
    marketInsights.push('Consumer loans offer diversification for fund portfolios')
  }
  if (hasEquipment) {
    marketScore += 3
    marketInsights.push('Equipment-backed loans have tangible collateral value')
  }
  if (hasSpecialty) {
    marketScore += 2
    marketInsights.push('Specialty finance may command premium pricing')
  }

  // Geographic positioning
  if (isUS) {
    marketScore += 5
    marketInsights.push('US market preferred by majority of institutional capital')
    strengths.push('US-based operations access deep institutional capital markets')
  } else if (data.geoFocus === 'North America') {
    marketScore += 4
    marketInsights.push('North American focus aligns with major fund mandates')
  } else if (data.geoFocus === 'Europe' || data.geoFocus === 'United Kingdom') {
    marketScore += 3
    marketInsights.push('Established European capital markets available')
  } else {
    marketScore += 1
    marketInsights.push('Emerging market exposure may require specialized capital')
    considerations.push('Geographic focus may limit available capital partners')
  }

  // Cap market score
  marketScore = Math.min(marketScore, 15)

  // ============================================
  // DIMENSION 5: CAPITAL ALIGNMENT (0-15 points)
  // ============================================
  let alignmentScore = 0
  const alignmentInsights: string[] = []

  // Check if capital needs align with profile
  const volumeCapitalRatio = capitalNeeded > 0 ? volume / capitalNeeded : 1

  if (volumeCapitalRatio >= 2) {
    alignmentScore += 8
    alignmentInsights.push('Strong origination capacity relative to capital needs')
    strengths.push('Origination volume well-supports capital request')
  } else if (volumeCapitalRatio >= 1) {
    alignmentScore += 6
    alignmentInsights.push('Capital request aligns with origination capacity')
  } else if (volumeCapitalRatio >= 0.5) {
    alignmentScore += 4
    alignmentInsights.push('Capital request may exceed near-term deployment capacity')
    considerations.push('Capital request is ambitious relative to current volume')
  } else {
    alignmentScore += 2
    alignmentInsights.push('Consider phased capital deployment')
    considerations.push('Consider phased approach to match origination growth')
  }

  // Goal clarity and motivation
  if (capitalGoals.includes('Establish ongoing capital partnership')) {
    alignmentScore += 4
    alignmentInsights.push('Seeking strategic partnership aligns with institutional approach')
    strengths.push('Strategic partnership focus enables optimal structuring')
  } else if (capitalGoals.includes('Raise capital for new originations')) {
    alignmentScore += 3
    alignmentInsights.push('Growth capital focus well-suited for credit facilities')
  } else if (capitalGoals.includes('Sell down existing portfolio')) {
    alignmentScore += 3
    alignmentInsights.push('Portfolio sale can be executed efficiently')
  } else if (capitalGoals.includes('Refinance current warehouse or facility')) {
    alignmentScore += 4
    alignmentInsights.push('Refinancing indicates operational maturity')
    strengths.push('Existing facility demonstrates bankability')
  }

  // Additional goal for exploring
  if (capitalGoals.includes('Exploring options')) {
    alignmentScore += 2
    alignmentInsights.push('Discovery phase - multiple structures possible')
    nextSteps.push('Consultation to identify optimal capital structure')
  }

  // Cap alignment score
  alignmentScore = Math.min(alignmentScore, 15)

  // ============================================
  // CALCULATE OVERALL SCORE
  // ============================================
  const totalScore = scaleScore + qualityScore + readinessScore + marketScore + alignmentScore
  const maxScore = 100
  const overallScore = Math.round((totalScore / maxScore) * 100)

  // ============================================
  // DETERMINE CAPITAL FITS
  // ============================================
  const capitalFits: CapitalFit[] = []

  // Warehouse Line
  if (volume >= 25 && qualityScore >= 18 && readinessScore >= 12) {
    capitalFits.push({
      type: 'warehouse_line',
      name: capitalStructures.warehouse_line.name,
      fit: 'excellent',
      description: 'Your volume and quality profile is ideal for warehouse financing',
      requirements: capitalStructures.warehouse_line.requirements,
    })
  } else if (volume >= 10 && qualityScore >= 10) {
    capitalFits.push({
      type: 'warehouse_line',
      name: capitalStructures.warehouse_line.name,
      fit: 'possible',
      description: 'With volume growth, warehouse financing becomes viable',
      requirements: capitalStructures.warehouse_line.requirements,
    })
  }

  // Forward Flow
  if (volume >= 10 && qualityScore >= 18) {
    capitalFits.push({
      type: 'forward_flow',
      name: capitalStructures.forward_flow.name,
      fit: volume >= 25 ? 'excellent' : 'good',
      description: 'Consistent origination makes you attractive for forward flow buyers',
      requirements: capitalStructures.forward_flow.requirements,
    })
  } else if (volume >= 5) {
    capitalFits.push({
      type: 'forward_flow',
      name: capitalStructures.forward_flow.name,
      fit: 'possible',
      description: 'Forward flow agreements possible as volume scales',
      requirements: capitalStructures.forward_flow.requirements,
    })
  }

  // Whole Loan Sale
  if (capitalGoals.includes('Sell down existing portfolio') || volume >= 5) {
    const fit = qualityScore >= 18 && readinessScore >= 10 ? 'excellent' : qualityScore >= 10 ? 'good' : 'possible'
    capitalFits.push({
      type: 'whole_loan_sale',
      name: capitalStructures.whole_loan_sale.name,
      fit,
      description: 'Portfolio sale opportunities available through our buyer network',
      requirements: capitalStructures.whole_loan_sale.requirements,
    })
  }

  // Securitization
  if (volume >= 100 && qualityScore >= 20 && readinessScore >= 15) {
    capitalFits.push({
      type: 'securitization',
      name: capitalStructures.securitization.name,
      fit: 'excellent',
      description: 'Your scale and quality support capital markets execution',
      requirements: capitalStructures.securitization.requirements,
    })
  } else if (volume >= 50 && qualityScore >= 15) {
    capitalFits.push({
      type: 'securitization',
      name: capitalStructures.securitization.name,
      fit: 'possible',
      description: 'Approaching scale for securitization with continued growth',
      requirements: capitalStructures.securitization.requirements,
    })
  }

  // Credit Facility
  if (volume >= 15 && readinessScore >= 10) {
    capitalFits.push({
      type: 'credit_facility',
      name: capitalStructures.credit_facility.name,
      fit: qualityScore >= 15 ? 'good' : 'possible',
      description: 'Term facility available for portfolio or growth financing',
      requirements: capitalStructures.credit_facility.requirements,
    })
  }

  // Equity Partnership
  if (scaleScore >= 8 && alignmentScore >= 8) {
    capitalFits.push({
      type: 'equity_partnership',
      name: capitalStructures.equity_partnership.name,
      fit: scaleScore >= 14 && alignmentScore >= 10 ? 'good' : 'possible',
      description: 'Strategic equity may accelerate platform growth',
      requirements: capitalStructures.equity_partnership.requirements,
    })
  }

  // Sort by fit quality
  const fitOrder = { excellent: 0, good: 1, possible: 2, not_recommended: 3 }
  capitalFits.sort((a, b) => fitOrder[a.fit] - fitOrder[b.fit])

  // ============================================
  // DETERMINE OPPORTUNITY SIZE & TIME TO FUNDING
  // ============================================
  let opportunitySize: 'institutional' | 'mid_market' | 'emerging' | 'early_stage'
  if (volume >= 50) {
    opportunitySize = 'institutional'
  } else if (volume >= 15) {
    opportunitySize = 'mid_market'
  } else if (volume >= 5) {
    opportunitySize = 'emerging'
  } else {
    opportunitySize = 'early_stage'
  }

  let timeToFunding: 'fast_track' | 'standard' | 'extended' | 'needs_preparation'
  if (readinessScore >= 16 && qualityScore >= 18 && capitalFits.some(f => f.fit === 'excellent')) {
    timeToFunding = 'fast_track'
    nextSteps.push('Schedule introductory call to discuss immediate opportunities')
  } else if (readinessScore >= 10 && capitalFits.some(f => f.fit === 'excellent' || f.fit === 'good')) {
    timeToFunding = 'standard'
    nextSteps.push('Prepare documentation package for capital partner review')
  } else if (capitalFits.some(f => f.fit === 'possible')) {
    timeToFunding = 'extended'
    nextSteps.push('Work with our team to enhance capital readiness')
  } else {
    timeToFunding = 'needs_preparation'
    nextSteps.push('Schedule consultation to develop capital access roadmap')
  }

  // ============================================
  // DETERMINE QUALIFICATION TIER
  // ============================================
  let qualificationTier: QualificationScore
  if (overallScore >= 70 || (capitalFits.filter(f => f.fit === 'excellent').length >= 2)) {
    qualificationTier = 'strong'
  } else if (overallScore >= 45 || (capitalFits.filter(f => f.fit === 'excellent' || f.fit === 'good').length >= 2)) {
    qualificationTier = 'moderate'
  } else {
    qualificationTier = 'needs_discussion'
  }

  // Add final next steps based on qualification
  if (qualificationTier === 'strong') {
    if (!nextSteps.includes('Schedule introductory call to discuss immediate opportunities')) {
      nextSteps.push('Connect with capital partners in your asset class')
    }
  } else if (qualificationTier === 'moderate') {
    nextSteps.push('Review enhancement opportunities with our team')
  }

  // ============================================
  // BUILD LEGACY CATEGORIES FOR COMPATIBILITY
  // ============================================
  const categories: CategoryScore[] = [
    {
      name: 'scale',
      score: scaleScore,
      maxScore: 25,
      label: scaleScore >= 20 ? 'Excellent' : scaleScore >= 14 ? 'Strong' : scaleScore >= 8 ? 'Moderate' : 'Building',
      description: scaleInsights[0] || '',
    },
    {
      name: 'quality',
      score: qualityScore,
      maxScore: 25,
      label: qualityScore >= 20 ? 'Excellent' : qualityScore >= 15 ? 'Strong' : qualityScore >= 10 ? 'Fair' : 'Review Needed',
      description: qualityInsights[0] || '',
    },
    {
      name: 'readiness',
      score: readinessScore,
      maxScore: 20,
      label: readinessScore >= 16 ? 'Ready' : readinessScore >= 10 ? 'Prepared' : readinessScore >= 5 ? 'Developing' : 'Early',
      description: readinessInsights[0] || '',
    },
    {
      name: 'marketPosition',
      score: marketScore,
      maxScore: 15,
      label: marketScore >= 12 ? 'Strong' : marketScore >= 8 ? 'Good' : marketScore >= 4 ? 'Moderate' : 'Niche',
      description: marketInsights[0] || '',
    },
    {
      name: 'capitalAlignment',
      score: alignmentScore,
      maxScore: 15,
      label: alignmentScore >= 12 ? 'Aligned' : alignmentScore >= 8 ? 'Good' : alignmentScore >= 4 ? 'Moderate' : 'Exploring',
      description: alignmentInsights[0] || '',
    },
  ]

  return {
    overallScore,
    qualificationTier,
    dimensions: {
      scale: { dimension: 'Scale & Volume', score: scaleScore, maxScore: 25, icon: '📈', insights: scaleInsights },
      quality: { dimension: 'Portfolio Quality', score: qualityScore, maxScore: 25, icon: '✓', insights: qualityInsights },
      readiness: { dimension: 'Operational Readiness', score: readinessScore, maxScore: 20, icon: '⚡', insights: readinessInsights },
      marketPosition: { dimension: 'Market Position', score: marketScore, maxScore: 15, icon: '🎯', insights: marketInsights },
      capitalAlignment: { dimension: 'Capital Alignment', score: alignmentScore, maxScore: 15, icon: '🤝', insights: alignmentInsights },
    },
    capitalFits,
    recommendedStructure: capitalFits.length > 0 ? capitalFits[0].type : null,
    opportunitySize,
    timeToFunding,
    strengths,
    considerations,
    nextSteps,
    categories,
    totalPoints: totalScore,
    maxPoints: maxScore,
  }
}

// Legacy wrapper for backward compatibility
export function scoreOriginator(data: Partial<OriginatorData>): ScoringResult {
  const result = scoreOriginatorAdvanced(data)
  return {
    score: result.qualificationTier,
    totalPoints: result.totalPoints,
    maxPoints: result.maxPoints,
    strengths: result.strengths,
    considerations: result.considerations,
    categories: result.categories,
  }
}

export function scoreBorrower(data: Partial<BorrowerData>): ScoringResult {
  const strengths: string[] = []
  const considerations: string[] = []
  const categories: CategoryScore[] = []

  // Funding Amount Category (max 25 points)
  let amountScore = 0
  let amountLabel = ''
  let amountDesc = ''

  if (data.amountNeeded === '$500,000 - $1,000,000' || data.amountNeeded === '$1,000,000 - $5,000,000') {
    amountScore = 25
    amountLabel = 'Excellent'
    amountDesc = 'Funding amount fits well within network parameters'
    strengths.push('Funding amount fits well within our network parameters')
  } else if (data.amountNeeded === '$5,000,000+') {
    amountScore = 20
    amountLabel = 'Strong'
    amountDesc = 'Larger funding needs may qualify for institutional terms'
    strengths.push('Larger funding needs may qualify for institutional terms')
  } else if (data.amountNeeded === '$250,000 - $500,000') {
    amountScore = 15
    amountLabel = 'Moderate'
    amountDesc = 'Smaller amount may have limited lender options'
    considerations.push('Smaller amount may have limited lender options')
  } else if (data.amountNeeded) {
    amountScore = 5
    amountLabel = 'Limited'
    amountDesc = 'Funding amount below typical network minimums'
    considerations.push('Funding amount below typical network minimums')
  }

  categories.push({
    name: 'fundingAmount',
    score: amountScore,
    maxScore: 25,
    label: amountLabel,
    description: amountDesc
  })

  // Collateral Category (max 30 points)
  let collateralScore = 0
  let collateralLabel = ''
  let collateralDesc = ''

  if (data.collateralType === 'Commercial real estate' || data.collateralType === 'Residential real estate') {
    if (data.existingDebt === 'Under 50% LTV' || data.existingDebt === 'None') {
      collateralScore = 30
      collateralLabel = 'Excellent'
      collateralDesc = 'Real estate collateral with strong equity position'
      strengths.push('Real estate collateral with strong equity position')
    } else if (data.existingDebt === '50-70% LTV') {
      collateralScore = 20
      collateralLabel = 'Good'
      collateralDesc = 'Real estate secured with acceptable leverage'
      strengths.push('Real estate secured with acceptable leverage')
    } else {
      collateralScore = 10
      collateralLabel = 'Fair'
      collateralDesc = 'Higher existing leverage may affect terms'
      considerations.push('Higher existing leverage may affect terms')
    }
  } else if (data.collateralType === 'Equipment/vehicles') {
    collateralScore = 15
    collateralLabel = 'Moderate'
    collateralDesc = 'Equipment collateral accepted by select lenders'
    considerations.push('Equipment collateral accepted by select lenders')
  } else if (data.collateralType === 'Accounts receivable') {
    collateralScore = 12
    collateralLabel = 'Moderate'
    collateralDesc = 'AR-based financing available through factoring partners'
    considerations.push('AR-based financing available through factoring partners')
  } else if (data.collateralType === 'No collateral available') {
    collateralScore = 0
    collateralLabel = 'Limited'
    collateralDesc = 'Unsecured financing has limited options'
    considerations.push('Unsecured financing has limited options and higher rates')
  }

  categories.push({
    name: 'collateral',
    score: collateralScore,
    maxScore: 30,
    label: collateralLabel,
    description: collateralDesc
  })

  // Business History Category (max 20 points)
  let historyScore = 0
  let historyLabel = ''
  let historyDesc = ''

  if (data.yearsInBusiness === '5+ years') {
    historyScore = 20
    historyLabel = 'Excellent'
    historyDesc = 'Established business track record'
    strengths.push('Established business track record')
  } else if (data.yearsInBusiness === '2-5 years') {
    historyScore = 15
    historyLabel = 'Good'
    historyDesc = 'Sufficient operating history for most lenders'
    strengths.push('Sufficient operating history for most lenders')
  } else if (data.yearsInBusiness === '1-2 years') {
    historyScore = 8
    historyLabel = 'Fair'
    historyDesc = 'Limited operating history may restrict options'
    considerations.push('Limited operating history may restrict options')
  } else if (data.yearsInBusiness) {
    historyScore = 3
    historyLabel = 'Limited'
    historyDesc = 'Early-stage businesses face more scrutiny'
    considerations.push('Early-stage businesses face more scrutiny')
  }

  categories.push({
    name: 'businessHistory',
    score: historyScore,
    maxScore: 20,
    label: historyLabel,
    description: historyDesc
  })

  // Revenue Category (max 15 points)
  let revenueScore = 0
  let revenueLabel = ''
  let revenueDesc = ''

  if (data.annualRevenue === '$10,000,000+') {
    revenueScore = 15
    revenueLabel = 'Excellent'
    revenueDesc = 'Strong revenue supports favorable terms'
    strengths.push('Strong revenue supports favorable terms')
  } else if (data.annualRevenue === '$2,000,000 - $10,000,000') {
    revenueScore = 12
    revenueLabel = 'Good'
    revenueDesc = 'Revenue level appropriate for requested funding'
    strengths.push('Revenue level appropriate for requested funding')
  } else if (data.annualRevenue === '$500,000 - $2,000,000') {
    revenueScore = 8
    revenueLabel = 'Fair'
    revenueDesc = 'Revenue supports moderate funding options'
  } else if (data.annualRevenue === 'Pre-revenue' || data.annualRevenue === 'Under $500,000') {
    revenueScore = 3
    revenueLabel = 'Limited'
    revenueDesc = 'Revenue level may limit traditional financing options'
    considerations.push('Revenue level may limit traditional financing options')
  }

  categories.push({
    name: 'revenue',
    score: revenueScore,
    maxScore: 15,
    label: revenueLabel,
    description: revenueDesc
  })

  // Timeline bonus (max 10 points)
  let timelineScore = 0
  let timelineLabel = ''
  let timelineDesc = ''

  if (data.timeline === '1-2 months' || data.timeline === '2+ months' || data.timeline === 'Just exploring') {
    timelineScore = 10
    timelineLabel = 'Optimal'
    timelineDesc = 'Timeline allows for optimal lender matching'
    strengths.push('Timeline allows for optimal lender matching')
  } else if (data.timeline === 'Within 1 month') {
    timelineScore = 7
    timelineLabel = 'Good'
    timelineDesc = 'Expedited timeline achievable for qualified borrowers'
    strengths.push('Expedited timeline achievable for qualified borrowers')
  } else if (data.timeline === 'ASAP (within 1-2 weeks)') {
    timelineScore = 3
    timelineLabel = 'Urgent'
    timelineDesc = 'Urgent timeline may limit options and affect terms'
    considerations.push('Urgent timeline may limit options and affect terms')
  }

  categories.push({
    name: 'timeline',
    score: timelineScore,
    maxScore: 10,
    label: timelineLabel,
    description: timelineDesc
  })

  // Bank status insights (informational)
  if (data.bankStatus === 'Yes - rejected') {
    considerations.push('Prior bank decline may require documentation')
  } else if (data.bankStatus === 'Yes - process too slow') {
    strengths.push('Private credit can move faster than traditional banks')
  }

  // Calculate totals
  const totalPoints = categories.reduce((sum, cat) => sum + cat.score, 0)
  const maxPoints = categories.reduce((sum, cat) => sum + cat.maxScore, 0)

  // Determine qualification
  let qualificationScore: QualificationScore
  if (totalPoints >= 65) {
    qualificationScore = 'strong'
  } else if (totalPoints >= 35) {
    qualificationScore = 'moderate'
  } else {
    qualificationScore = 'needs_discussion'
  }

  return {
    score: qualificationScore,
    totalPoints,
    maxPoints,
    strengths,
    considerations,
    categories,
  }
}

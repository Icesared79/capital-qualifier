import { jsPDF } from 'jspdf'
import { CategoryScore, QualificationScore, OriginatorData, BorrowerData } from './types'

// Base64 encoded BitCense logo (white version for header)
const BITCENSE_LOGO = 'data:image/png;base64,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'

interface PDFData {
  qualificationCode: string
  score: QualificationScore
  totalPoints: number
  maxPoints: number
  categories: CategoryScore[]
  strengths: string[]
  considerations: string[]
  type: 'originator' | 'borrower'
  data: Partial<OriginatorData> | Partial<BorrowerData>
}

const categoryNames: Record<string, string> = {
  // Originator dimensions
  scale: 'Scale & Volume',
  quality: 'Portfolio Quality',
  readiness: 'Operational Readiness',
  marketPosition: 'Market Position',
  capitalAlignment: 'Capital Alignment',
  // Legacy originator
  volume: 'Origination Volume',
  portfolioQuality: 'Portfolio Quality',
  documentation: 'Documentation',
  // Borrower categories
  fundingAmount: 'Funding Amount',
  collateral: 'Collateral',
  businessHistory: 'Business History',
  revenue: 'Annual Revenue',
  timeline: 'Timeline',
}

export function generateQualificationPDF(pdfData: PDFData): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 18
  const contentWidth = pageWidth - margin * 2
  const boxPadding = 8 // Consistent padding inside all boxes

  // Colors
  const accentColor: [number, number, number] = [255, 107, 53]
  const darkColor: [number, number, number] = [44, 44, 44]
  const grayColor: [number, number, number] = [102, 102, 102]
  const lightGray: [number, number, number] = [230, 230, 230]

  const percentage = Math.round((pdfData.totalPoints / pdfData.maxPoints) * 100)
  const scoreLabel = pdfData.score === 'strong' ? 'Strong Candidate' : pdfData.score === 'moderate' ? 'Good Potential' : 'Needs Discussion'
  const candidateData = pdfData.data
  const isOriginator = pdfData.type === 'originator'

  // === HEADER ===
  doc.setFillColor(...accentColor)
  doc.rect(0, 0, pageWidth, 32, 'F')

  doc.addImage(BITCENSE_LOGO, 'PNG', margin, 7, 50, 10)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Capital Qualification Report', margin, 25)

  doc.setFontSize(9)
  doc.text('Qualification Code', pageWidth - margin, 12, { align: 'right' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(pdfData.qualificationCode, pageWidth - margin, 22, { align: 'right' })

  let y = 42

  // === CANDIDATE INFO LINE ===
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)

  const infoLine = []
  if ('companyName' in candidateData && candidateData.companyName) {
    infoLine.push(candidateData.companyName)
  }
  if ('contactName' in candidateData && candidateData.contactName) {
    infoLine.push(candidateData.contactName)
  }
  if ('email' in candidateData && candidateData.email) {
    infoLine.push(candidateData.email)
  }
  infoLine.push(new Date().toLocaleDateString())

  doc.text(infoLine.join('  •  '), margin, y)
  y += 12

  // === SCORE SECTION ===
  const scoreBoxHeight = 45
  const scoreBoxY = y
  doc.setFillColor(250, 248, 245)
  doc.roundedRect(margin, scoreBoxY, contentWidth, scoreBoxHeight, 3, 3, 'F')

  // Large percentage - aligned to left padding
  doc.setFontSize(42)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...accentColor)
  doc.text(`${percentage}%`, margin + boxPadding, scoreBoxY + 30)

  // Points - below percentage
  doc.setFontSize(10)
  doc.setTextColor(...grayColor)
  doc.setFont('helvetica', 'normal')
  doc.text(`${pdfData.totalPoints} of ${pdfData.maxPoints} points`, margin + boxPadding, scoreBoxY + 40)

  // Score label - aligned to right padding
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  if (pdfData.score === 'strong') {
    doc.setTextColor(34, 139, 34)
  } else if (pdfData.score === 'moderate') {
    doc.setTextColor(180, 140, 0)
  } else {
    doc.setTextColor(200, 100, 50)
  }
  doc.text(scoreLabel, margin + contentWidth - boxPadding, scoreBoxY + 22, { align: 'right' })

  doc.setFontSize(9)
  doc.setTextColor(...grayColor)
  doc.setFont('helvetica', 'normal')
  doc.text(isOriginator ? 'Originator Assessment' : 'Borrower Assessment', margin + contentWidth - boxPadding, scoreBoxY + 32, { align: 'right' })

  y = scoreBoxY + scoreBoxHeight + 10

  // === TWO COLUMN LAYOUT ===
  const colGap = 15
  const colWidth = (contentWidth - colGap) / 2
  const leftX = margin
  const rightX = margin + colWidth + colGap

  // === LEFT COLUMN: Score Breakdown ===
  let leftY = y

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.text('Score Breakdown', leftX, leftY)
  leftY += 10

  pdfData.categories.forEach((category) => {
    const catName = categoryNames[category.name] || category.name
    const scorePercent = (category.score / category.maxScore) * 100

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...darkColor)
    doc.text(catName, leftX, leftY)
    doc.setTextColor(...grayColor)
    doc.text(`${category.score}/${category.maxScore}`, leftX + colWidth, leftY, { align: 'right' })

    leftY += 5

    // Progress bar
    doc.setFillColor(...lightGray)
    doc.roundedRect(leftX, leftY, colWidth, 3, 1, 1, 'F')

    if (scorePercent >= 80) {
      doc.setFillColor(34, 139, 34)
    } else if (scorePercent >= 60) {
      doc.setFillColor(100, 180, 100)
    } else if (scorePercent >= 40) {
      doc.setFillColor(200, 180, 50)
    } else {
      doc.setFillColor(200, 130, 80)
    }
    doc.roundedRect(leftX, leftY, colWidth * (scorePercent / 100), 3, 1, 1, 'F')

    leftY += 10
  })

  // === RIGHT COLUMN: Details ===
  let rightY = y

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.text('Submission Details', rightX, rightY)
  rightY += 10

  doc.setFontSize(8)

  const renderDetails = (details: [string, string][]) => {
    details.forEach((detail) => {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grayColor)
      doc.text(detail[0], rightX, rightY)
      doc.setTextColor(...darkColor)
      const val = detail[1].length > 28 ? detail[1].slice(0, 28) + '...' : detail[1]
      doc.text(val, rightX + colWidth, rightY, { align: 'right' })
      rightY += 7
    })
  }

  if (isOriginator) {
    const origData = candidateData as Partial<OriginatorData>
    renderDetails([
      ['Asset Class', Array.isArray(origData.assetClass) ? origData.assetClass.slice(0, 2).join(', ') + (origData.assetClass.length > 2 ? '...' : '') : 'N/A'],
      ['Capital Goal', Array.isArray(origData.capitalGoal) ? origData.capitalGoal.slice(0, 2).join(', ') + (origData.capitalGoal.length > 2 ? '...' : '') : 'N/A'],
      ['Capital Amount', String(origData.capitalAmount || 'N/A')],
      ['Annual Volume', origData.annualVolume || 'N/A'],
      ['Avg Deal Size', origData.avgDealSize || 'N/A'],
      ['Default Rate', origData.defaultRate || 'N/A'],
      ['Documentation', origData.docStandard || 'N/A'],
    ])
  } else {
    const borrowData = candidateData as Partial<BorrowerData>
    renderDetails([
      ['Funding Purpose', borrowData.fundingPurpose || 'N/A'],
      ['Amount Needed', borrowData.amountNeeded || 'N/A'],
      ['Timeline', borrowData.timeline || 'N/A'],
      ['Collateral', borrowData.collateralType || 'N/A'],
      ['Business Type', borrowData.businessType || 'N/A'],
      ['Years in Business', borrowData.yearsInBusiness || 'N/A'],
      ['Annual Revenue', borrowData.annualRevenue || 'N/A'],
    ])
  }

  // Move Y to bottom of columns
  y = Math.max(leftY, rightY) + 8

  // === STRENGTHS & CONSIDERATIONS ===
  const boxGap = 10
  const boxWidth = (contentWidth - boxGap) / 2

  // Calculate box heights
  const strengthsBoxHeight = pdfData.strengths.length > 0 ? 14 + pdfData.strengths.length * 7 : 0
  const consBoxHeight = pdfData.considerations.length > 0 ? 14 + pdfData.considerations.length * 7 : 0
  const maxBoxHeight = Math.max(strengthsBoxHeight, consBoxHeight)

  // Strengths box
  if (pdfData.strengths.length > 0) {
    const boxX = leftX
    const boxY = y
    doc.setFillColor(235, 250, 240)
    doc.roundedRect(boxX, boxY, boxWidth, maxBoxHeight, 3, 3, 'F')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 101, 52)
    doc.text('Why You Qualify', boxX + boxPadding, boxY + 10)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    let textY = boxY + 18
    pdfData.strengths.forEach((s) => {
      const line = `+ ${s}`
      const truncated = line.length > 42 ? line.slice(0, 42) + '...' : line
      doc.text(truncated, boxX + boxPadding, textY)
      textY += 7
    })
  }

  // Considerations box
  if (pdfData.considerations.length > 0) {
    const boxX = rightX
    const boxY = y
    doc.setFillColor(255, 248, 235)
    doc.roundedRect(boxX, boxY, boxWidth, maxBoxHeight, 3, 3, 'F')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(146, 64, 14)
    doc.text('Areas to Discuss', boxX + boxPadding, boxY + 10)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    let textY = boxY + 18
    pdfData.considerations.forEach((c) => {
      const line = `• ${c}`
      const truncated = line.length > 42 ? line.slice(0, 42) + '...' : line
      doc.text(truncated, boxX + boxPadding, textY)
      textY += 7
    })
  }

  y += maxBoxHeight + 12

  // === NEXT STEPS BOX ===
  const nextStepsBoxHeight = 30
  const nextStepsBoxY = y
  doc.setFillColor(255, 252, 248)
  doc.setDrawColor(...accentColor)
  doc.roundedRect(margin, nextStepsBoxY, contentWidth, nextStepsBoxHeight, 3, 3, 'FD')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...accentColor)
  doc.text('Next Steps', margin + boxPadding, nextStepsBoxY + 11)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkColor)

  if (pdfData.score === 'needs_discussion') {
    doc.text('Our team will review your submission and reach out to discuss potential options.', margin + boxPadding, nextStepsBoxY + 21)
  } else {
    doc.text('Schedule your consultation to discuss portfolio structure, pricing, and next steps.', margin + boxPadding, nextStepsBoxY + 21)
  }

  // === FOOTER ===
  const footerY = pageHeight - 12
  doc.setDrawColor(...lightGray)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

  doc.setFontSize(8)
  doc.setTextColor(...grayColor)
  doc.setFont('helvetica', 'normal')
  doc.text('BitCense Capital Qualifier', margin, footerY)
  doc.text('www.bitcense.com', pageWidth / 2, footerY, { align: 'center' })
  doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth - margin, footerY, { align: 'right' })

  // Save
  doc.save(`BitCense-Qualification-${pdfData.qualificationCode}.pdf`)
}

// Portfolio Scoring Report PDF
interface ScoringReportData {
  qualificationCode: string
  companyName: string
  overallScore: number
  letterGrade: string
  tokenizationReadiness: 'ready' | 'conditional' | 'not_ready'
  readyPercentage: number
  conditionalPercentage: number
  notReadyPercentage: number
  summary?: string
  strengths: string[]
  concerns: string[]
  recommendations: string[]
  redFlags: { severity: string; message: string }[]
  scores: {
    portfolioPerformance?: { score: number; grade: string }
    cashFlowQuality?: { score: number; grade: string }
    documentation?: { score: number; grade: string }
    collateralCoverage?: { score: number; grade: string }
    diversification?: { score: number; grade: string }
    regulatoryReadiness?: { score: number; grade: string }
  }
  metrics?: {
    portfolioSize?: number
    loanCount?: number
    avgLoanSize?: number
    weightedAvgRate?: number
    weightedAvgLtv?: number
    weightedAvgDscr?: number
    defaultRate?: number
    delinquency30Rate?: number
  }
  hasAIAnalysis?: boolean
}

const scoringCategoryNames: Record<string, string> = {
  portfolioPerformance: 'Portfolio Performance',
  cashFlowQuality: 'Cash Flow Quality',
  documentation: 'Documentation',
  collateralCoverage: 'Collateral Coverage',
  diversification: 'Diversification',
  regulatoryReadiness: 'Regulatory Readiness',
}

export function generateScoringReportPDF(data: ScoringReportData): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 18
  const contentWidth = pageWidth - margin * 2
  const boxPadding = 8

  // Colors
  const accentColor: [number, number, number] = [99, 102, 241] // Indigo
  const darkColor: [number, number, number] = [44, 44, 44]
  const grayColor: [number, number, number] = [102, 102, 102]
  const lightGray: [number, number, number] = [230, 230, 230]
  const greenColor: [number, number, number] = [34, 139, 34]
  const yellowColor: [number, number, number] = [180, 140, 0]
  const redColor: [number, number, number] = [200, 50, 50]

  // === HEADER ===
  doc.setFillColor(...accentColor)
  doc.rect(0, 0, pageWidth, 32, 'F')

  doc.addImage(BITCENSE_LOGO, 'PNG', margin, 7, 50, 10)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Portfolio Scoring Report', margin, 25)

  doc.setFontSize(9)
  doc.text('Reference', pageWidth - margin, 12, { align: 'right' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(data.qualificationCode, pageWidth - margin, 22, { align: 'right' })

  let y = 42

  // === COMPANY NAME & DATE ===
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text(`${data.companyName}  •  ${new Date().toLocaleDateString()}`, margin, y)
  y += 12

  // === MAIN SCORE BOX ===
  const scoreBoxHeight = 55
  doc.setFillColor(250, 248, 245)
  doc.roundedRect(margin, y, contentWidth, scoreBoxHeight, 3, 3, 'F')

  // Large score
  doc.setFontSize(48)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...accentColor)
  doc.text(`${data.overallScore}`, margin + boxPadding, y + 35)

  doc.setFontSize(20)
  doc.setTextColor(...grayColor)
  doc.text('/100', margin + boxPadding + 48, y + 35)

  // Grade circle
  const gradeX = margin + boxPadding + 90
  const gradeColor = data.overallScore >= 80 ? greenColor : data.overallScore >= 60 ? yellowColor : redColor
  doc.setFillColor(...gradeColor)
  doc.circle(gradeX, y + 28, 15, 'F')
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(data.letterGrade, gradeX, y + 33, { align: 'center' })

  // Tokenization readiness
  const readinessLabel = data.tokenizationReadiness === 'ready' ? 'Ready for Tokenization'
    : data.tokenizationReadiness === 'conditional' ? 'Conditionally Ready'
    : 'Not Ready'
  const readinessColor = data.tokenizationReadiness === 'ready' ? greenColor
    : data.tokenizationReadiness === 'conditional' ? yellowColor : redColor

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...readinessColor)
  doc.text(readinessLabel, margin + contentWidth - boxPadding, y + 20, { align: 'right' })

  // Readiness bar
  const barY = y + 30
  const barWidth = 100
  const barX = margin + contentWidth - boxPadding - barWidth
  doc.setFillColor(200, 200, 200)
  doc.roundedRect(barX, barY, barWidth, 6, 2, 2, 'F')

  if (data.readyPercentage > 0) {
    doc.setFillColor(...greenColor)
    doc.roundedRect(barX, barY, barWidth * (data.readyPercentage / 100), 6, 2, 2, 'F')
  }

  doc.setFontSize(8)
  doc.setTextColor(...grayColor)
  doc.text(`${data.readyPercentage}% Ready  |  ${data.conditionalPercentage}% Conditional  |  ${data.notReadyPercentage}% Not Ready`, barX + barWidth / 2, barY + 14, { align: 'center' })

  y += scoreBoxHeight + 12

  // === AI SUMMARY ===
  if (data.summary && data.hasAIAnalysis) {
    doc.setFillColor(245, 243, 255)
    const summaryLines = doc.splitTextToSize(data.summary, contentWidth - boxPadding * 2)
    const summaryBoxHeight = 16 + summaryLines.length * 5
    doc.roundedRect(margin, y, contentWidth, summaryBoxHeight, 3, 3, 'F')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...accentColor)
    doc.text('AI Analysis Summary', margin + boxPadding, y + 10)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...darkColor)
    doc.text(summaryLines, margin + boxPadding, y + 18)

    y += summaryBoxHeight + 8
  }

  // === RED FLAGS ===
  if (data.redFlags && data.redFlags.length > 0) {
    doc.setFillColor(255, 240, 240)
    const flagBoxHeight = 12 + data.redFlags.length * 8
    doc.roundedRect(margin, y, contentWidth, flagBoxHeight, 3, 3, 'F')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...redColor)
    doc.text(`Red Flags (${data.redFlags.length})`, margin + boxPadding, y + 10)

    let flagY = y + 18
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    data.redFlags.slice(0, 4).forEach(flag => {
      doc.setTextColor(flag.severity === 'high' ? redColor[0] : yellowColor[0], flag.severity === 'high' ? redColor[1] : yellowColor[1], flag.severity === 'high' ? redColor[2] : yellowColor[2])
      doc.text(`[${flag.severity.toUpperCase()}] ${flag.message.slice(0, 70)}`, margin + boxPadding, flagY)
      flagY += 8
    })

    y += flagBoxHeight + 8
  }

  // === TWO COLUMN: SCORES & METRICS ===
  const colGap = 12
  const colWidth = (contentWidth - colGap) / 2
  let leftY = y
  let rightY = y

  // Left: Category Scores
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.text('Category Scores', margin, leftY)
  leftY += 10

  if (data.scores) {
    Object.entries(data.scores).forEach(([key, value]) => {
      if (!value) return
      const catName = scoringCategoryNames[key] || key
      const scoreColor = value.score >= 80 ? greenColor : value.score >= 60 ? [100, 180, 100] as [number, number, number] : value.score >= 40 ? yellowColor : redColor

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...darkColor)
      doc.text(catName, margin, leftY)
      doc.setTextColor(...scoreColor)
      doc.text(`${value.score}/100 (${value.grade})`, margin + colWidth, leftY, { align: 'right' })

      leftY += 4
      doc.setFillColor(...lightGray)
      doc.roundedRect(margin, leftY, colWidth, 3, 1, 1, 'F')
      doc.setFillColor(...scoreColor)
      doc.roundedRect(margin, leftY, colWidth * (value.score / 100), 3, 1, 1, 'F')
      leftY += 9
    })
  }

  // Right: Key Metrics
  const rightX = margin + colWidth + colGap
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkColor)
  doc.text('Portfolio Metrics', rightX, rightY)
  rightY += 10

  if (data.metrics) {
    const formatCurrency = (n?: number) => n ? `$${n.toLocaleString()}` : 'N/A'
    const formatPercent = (n?: number) => n !== undefined ? `${(n * 100).toFixed(2)}%` : 'N/A'
    const formatNumber = (n?: number) => n !== undefined ? n.toLocaleString() : 'N/A'

    const metricsList = [
      ['Portfolio Size', formatCurrency(data.metrics.portfolioSize)],
      ['Loan Count', formatNumber(data.metrics.loanCount)],
      ['Avg Loan Size', formatCurrency(data.metrics.avgLoanSize)],
      ['Wtd Avg Rate', data.metrics.weightedAvgRate ? `${data.metrics.weightedAvgRate.toFixed(2)}%` : 'N/A'],
      ['Wtd Avg LTV', data.metrics.weightedAvgLtv ? `${data.metrics.weightedAvgLtv.toFixed(1)}%` : 'N/A'],
      ['Wtd Avg DSCR', data.metrics.weightedAvgDscr ? `${data.metrics.weightedAvgDscr.toFixed(2)}x` : 'N/A'],
      ['Default Rate', formatPercent(data.metrics.defaultRate)],
      ['30-Day Delinquency', formatPercent(data.metrics.delinquency30Rate)],
    ]

    doc.setFontSize(8)
    metricsList.forEach(([label, value]) => {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grayColor)
      doc.text(label, rightX, rightY)
      doc.setTextColor(...darkColor)
      doc.text(value, rightX + colWidth, rightY, { align: 'right' })
      rightY += 7
    })
  }

  y = Math.max(leftY, rightY) + 10

  // === STRENGTHS & CONCERNS ===
  const boxWidth = (contentWidth - colGap) / 2
  const itemsToShow = 4
  const boxHeight = 12 + itemsToShow * 8

  // Strengths
  if (data.strengths.length > 0) {
    doc.setFillColor(235, 250, 240)
    doc.roundedRect(margin, y, boxWidth, boxHeight, 3, 3, 'F')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 101, 52)
    doc.text('Strengths', margin + boxPadding, y + 10)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    let textY = y + 18
    data.strengths.slice(0, itemsToShow).forEach(s => {
      doc.text(`+ ${s.slice(0, 45)}${s.length > 45 ? '...' : ''}`, margin + boxPadding, textY)
      textY += 8
    })
  }

  // Concerns
  if (data.concerns.length > 0) {
    doc.setFillColor(255, 248, 235)
    doc.roundedRect(rightX, y, boxWidth, boxHeight, 3, 3, 'F')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(146, 64, 14)
    doc.text('Concerns', rightX + boxPadding, y + 10)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    let textY = y + 18
    data.concerns.slice(0, itemsToShow).forEach(c => {
      doc.text(`• ${c.slice(0, 45)}${c.length > 45 ? '...' : ''}`, rightX + boxPadding, textY)
      textY += 8
    })
  }

  y += boxHeight + 10

  // === RECOMMENDATIONS ===
  if (data.recommendations.length > 0) {
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(...accentColor)
    const recBoxHeight = 12 + Math.min(data.recommendations.length, 4) * 8
    doc.roundedRect(margin, y, contentWidth, recBoxHeight, 3, 3, 'FD')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...accentColor)
    doc.text('Recommendations', margin + boxPadding, y + 10)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...darkColor)
    let recY = y + 18
    data.recommendations.slice(0, 4).forEach((r, i) => {
      doc.text(`${i + 1}. ${r.slice(0, 90)}${r.length > 90 ? '...' : ''}`, margin + boxPadding, recY)
      recY += 8
    })
  }

  // === FOOTER ===
  const footerY = pageHeight - 12
  doc.setDrawColor(...lightGray)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

  doc.setFontSize(8)
  doc.setTextColor(...grayColor)
  doc.setFont('helvetica', 'normal')
  doc.text('BitCense Portfolio Scoring', margin, footerY)
  doc.text(data.hasAIAnalysis ? 'AI-Enhanced Analysis' : '', pageWidth / 2, footerY, { align: 'center' })
  doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth - margin, footerY, { align: 'right' })

  // Save
  doc.save(`BitCense-Scoring-Report-${data.qualificationCode}.pdf`)
}

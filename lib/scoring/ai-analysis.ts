import Anthropic from '@anthropic-ai/sdk'
import { AssessmentResult, PortfolioMetrics, RedFlag } from './types'

// Initialize Anthropic client
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your-api-key-here') {
    return null
  }
  return new Anthropic({ apiKey })
}

export interface AIAnalysisResult {
  summary: string
  strengths: string[]
  concerns: string[]
  recommendations: string[]
  tokenizationAssessment: string
}

// Generate AI-powered analysis using Claude
export async function generateAIAnalysis(
  assessment: AssessmentResult
): Promise<AIAnalysisResult | null> {
  const client = getAnthropicClient()

  if (!client) {
    console.log('Anthropic API key not configured, skipping AI analysis')
    return null
  }

  const prompt = buildAnalysisPrompt(assessment)

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    // Extract text from response
    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('')

    return parseAIResponse(text)
  } catch (error) {
    console.error('AI analysis failed:', error)
    return null
  }
}

function buildAnalysisPrompt(assessment: AssessmentResult): string {
  const { metrics, scores, redFlags, overallScore, letterGrade, tokenizationReadiness } = assessment

  return `You are a private credit portfolio analyst. Analyze this portfolio assessment and provide insights.

## Portfolio Overview
- Portfolio Size: $${metrics.portfolioSize.toLocaleString()}
- Number of Loans: ${metrics.loanCount}
- Average Loan Size: $${metrics.avgLoanSize.toLocaleString()}
- Overall Score: ${overallScore}/100 (Grade: ${letterGrade})
- Tokenization Readiness: ${tokenizationReadiness}

## Key Metrics
- Weighted Avg Interest Rate: ${metrics.weightedAvgRate.toFixed(2)}%
- Weighted Avg LTV: ${metrics.weightedAvgLtv.toFixed(1)}%
- Weighted Avg DSCR: ${metrics.weightedAvgDscr.toFixed(2)}x
- Default Rate: ${(metrics.defaultRate * 100).toFixed(2)}%
- 30-Day Delinquency: ${(metrics.delinquency30Rate * 100).toFixed(2)}%
- Average Loan Age: ${metrics.avgLoanAgeMonths} months
- Average Remaining Term: ${metrics.avgRemainingTermMonths} months

## Concentration
- Largest Single Exposure: ${(metrics.largestSingleExposure * 100).toFixed(1)}%
- Top 10 Concentration: ${(metrics.top10Concentration * 100).toFixed(1)}%
- Geographic Distribution: ${JSON.stringify(metrics.geographicConcentration)}
- Property Types: ${JSON.stringify(metrics.propertyTypeConcentration)}

## Category Scores
- Portfolio Performance: ${scores.portfolioPerformance.score}/100
- Cash Flow Quality: ${scores.cashFlowQuality.score}/100
- Documentation: ${scores.documentation.score}/100
- Collateral Coverage: ${scores.collateralCoverage.score}/100
- Diversification: ${scores.diversification.score}/100
- Regulatory Readiness: ${scores.regulatoryReadiness.score}/100

## Red Flags Detected
${redFlags.length > 0 ? redFlags.map(f => `- [${f.severity.toUpperCase()}] ${f.message}`).join('\n') : 'None'}

Please provide your analysis in the following JSON format:
{
  "summary": "2-3 sentence executive summary of the portfolio",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "concerns": ["concern 1", "concern 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "tokenizationAssessment": "1-2 sentence assessment of tokenization readiness"
}

Be specific and reference actual numbers from the data. Keep each point concise (1 sentence).`
}

function parseAIResponse(text: string): AIAnalysisResult {
  // Default fallback
  const defaultResult: AIAnalysisResult = {
    summary: 'Unable to generate AI summary.',
    strengths: [],
    concerns: [],
    recommendations: [],
    tokenizationAssessment: 'Manual review required.'
  }

  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return defaultResult
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      summary: parsed.summary || defaultResult.summary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      tokenizationAssessment: parsed.tokenizationAssessment || defaultResult.tokenizationAssessment
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    return defaultResult
  }
}

// Merge AI analysis into assessment result
export function mergeAIAnalysis(
  assessment: AssessmentResult,
  aiAnalysis: AIAnalysisResult | null
): AssessmentResult {
  if (!aiAnalysis) {
    return assessment
  }

  return {
    ...assessment,
    summary: aiAnalysis.summary,
    strengths: [...aiAnalysis.strengths, ...assessment.strengths.filter(s =>
      !aiAnalysis.strengths.some(as => as.toLowerCase().includes(s.toLowerCase().slice(0, 20)))
    )].slice(0, 6),
    concerns: [...aiAnalysis.concerns, ...assessment.concerns.filter(c =>
      !aiAnalysis.concerns.some(ac => ac.toLowerCase().includes(c.toLowerCase().slice(0, 20)))
    )].slice(0, 6),
    recommendations: [...aiAnalysis.recommendations, ...assessment.recommendations.filter(r =>
      !aiAnalysis.recommendations.some(ar => ar.toLowerCase().includes(r.toLowerCase().slice(0, 20)))
    )].slice(0, 6)
  }
}

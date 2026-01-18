import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { parseLoanTape, parsePerformanceHistory } from '@/lib/scoring/parser'
import { calculateAssessment } from '@/lib/scoring/calculator'
import { generateAIAnalysis, mergeAIAnalysis } from '@/lib/scoring/ai-analysis'
import * as fs from 'fs'
import * as path from 'path'

// Test endpoint to seed scoring data - REMOVE IN PRODUCTION
export async function POST(request: Request) {
  try {
    // Create admin client with service role
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
          set() {},
          remove() {},
        },
      }
    )

    // Parse request body for options
    const body = await request.json().catch(() => ({}))
    const { dealId, skipAI = false } = body

    let targetDealId = dealId

    // If no deal ID provided, find or create a test deal
    if (!targetDealId) {
      // First try to find an existing deal
      const { data: existingDeals } = await supabase
        .from('deals')
        .select('id, name')
        .limit(1)

      if (existingDeals && existingDeals.length > 0) {
        targetDealId = existingDeals[0].id
        console.log(`Using existing deal: ${existingDeals[0].name} (${targetDealId})`)
      } else {
        // Need to create a company first, then a deal
        // Find an admin user to own the company
        const { data: adminUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
          .limit(1)
          .single()

        if (!adminUser) {
          return NextResponse.json(
            { error: 'No admin user found. Please create a deal manually first.' },
            { status: 400 }
          )
        }

        // Create test company
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: 'Test Lending Company',
            owner_id: adminUser.id,
            type: 'originator',
            qualification_score: 'strong',
            overall_score: 85
          })
          .select('id')
          .single()

        if (companyError) {
          console.error('Failed to create company:', companyError)
          return NextResponse.json(
            { error: 'Failed to create test company', details: companyError.message },
            { status: 500 }
          )
        }

        // Create test deal
        const qualificationCode = `TEST-${Date.now().toString(36).toUpperCase()}`
        const { data: deal, error: dealError } = await supabase
          .from('deals')
          .insert({
            company_id: company.id,
            qualification_code: qualificationCode,
            stage: 'due_diligence',
            notes: 'Test portfolio for scoring demonstration'
          })
          .select('id')
          .single()

        if (dealError) {
          console.error('Failed to create deal:', dealError)
          return NextResponse.json(
            { error: 'Failed to create test deal', details: dealError.message },
            { status: 500 }
          )
        }

        targetDealId = deal.id
        console.log(`Created test deal: ${targetDealId}`)
      }
    }

    // Read and parse the sample CSV files
    const testDocsPath = path.join(process.cwd(), 'test-documents')
    console.log('Test docs path:', testDocsPath)

    const loanTapePath = path.join(testDocsPath, 'sample_loan_tape.csv')
    const perfHistoryPath = path.join(testDocsPath, 'sample_performance_history.csv')

    // Check if files exist
    if (!fs.existsSync(loanTapePath)) {
      return NextResponse.json({ error: `Loan tape file not found at: ${loanTapePath}` }, { status: 400 })
    }
    if (!fs.existsSync(perfHistoryPath)) {
      return NextResponse.json({ error: `Performance history file not found at: ${perfHistoryPath}` }, { status: 400 })
    }

    const loanTapeBuffer = fs.readFileSync(loanTapePath)
    const perfHistoryBuffer = fs.readFileSync(perfHistoryPath)

    console.log('Loan tape buffer length:', loanTapeBuffer.length)
    console.log('Perf history buffer length:', perfHistoryBuffer.length)

    const loanTapeResult = parseLoanTape(loanTapeBuffer, 'sample_loan_tape.csv')
    const perfHistoryResult = parsePerformanceHistory(perfHistoryBuffer, 'sample_performance_history.csv')

    if (!loanTapeResult.success) {
      return NextResponse.json(
        { error: 'Failed to parse loan tape', details: loanTapeResult.errors },
        { status: 400 }
      )
    }

    // Log the raw content for debugging
    console.log('Perf history content preview:', perfHistoryBuffer.toString().substring(0, 500))

    if (!perfHistoryResult.success) {
      // Try to read raw data for debugging
      const XLSX = require('xlsx')
      const workbook = XLSX.read(perfHistoryBuffer, { type: 'buffer', cellDates: true })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 })

      return NextResponse.json(
        {
          error: 'Failed to parse performance history',
          details: perfHistoryResult.errors,
          warnings: perfHistoryResult.warnings,
          unmappedColumns: perfHistoryResult.unmappedColumns,
          dataCount: perfHistoryResult.data.length,
          rawRowCount: rawData.length,
          rawHeaders: rawData[0],
          rawFirstRow: rawData[1]
        },
        { status: 400 }
      )
    }

    console.log(`Parsed ${loanTapeResult.data.length} loans and ${perfHistoryResult.data.length} months of performance`)

    // Calculate the assessment
    let assessment = calculateAssessment(
      loanTapeResult.data,
      perfHistoryResult.data,
      12 // 12 months of performance history
    )

    // Run AI analysis unless skipped
    if (!skipAI) {
      console.log('Running AI analysis...')
      const aiAnalysis = await generateAIAnalysis(assessment)
      if (aiAnalysis) {
        assessment = mergeAIAnalysis(assessment, aiAnalysis)
        console.log('AI analysis complete')
      } else {
        console.log('AI analysis skipped or failed')
      }
    }

    // Check for existing assessment
    const { data: existingAssessment } = await supabase
      .from('portfolio_assessments')
      .select('id')
      .eq('deal_id', targetDealId)
      .single()

    let assessmentId: string

    if (existingAssessment) {
      // Update existing assessment
      const { error: updateError } = await supabase
        .from('portfolio_assessments')
        .update({
          status: assessment.status,
          overall_score: assessment.overallScore,
          letter_grade: assessment.letterGrade,
          metrics: assessment.metrics,
          scores: assessment.scores,
          summary: assessment.summary,
          strengths: assessment.strengths,
          concerns: assessment.concerns,
          recommendations: assessment.recommendations,
          red_flags: assessment.redFlags,
          tokenization_readiness: assessment.tokenizationReadiness,
          ready_percentage: assessment.readyPercentage,
          conditional_percentage: assessment.conditionalPercentage,
          not_ready_percentage: assessment.notReadyPercentage,
          estimated_timeline: assessment.estimatedTimeline,
          has_ai_analysis: !skipAI,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAssessment.id)

      if (updateError) {
        console.error('Failed to update assessment:', updateError)
        return NextResponse.json(
          { error: 'Failed to update assessment', details: updateError.message },
          { status: 500 }
        )
      }

      assessmentId = existingAssessment.id
    } else {
      // Create new assessment
      const { data: newAssessment, error: createError } = await supabase
        .from('portfolio_assessments')
        .insert({
          deal_id: targetDealId,
          status: assessment.status,
          overall_score: assessment.overallScore,
          letter_grade: assessment.letterGrade,
          metrics: assessment.metrics,
          scores: assessment.scores,
          summary: assessment.summary,
          strengths: assessment.strengths,
          concerns: assessment.concerns,
          recommendations: assessment.recommendations,
          red_flags: assessment.redFlags,
          tokenization_readiness: assessment.tokenizationReadiness,
          ready_percentage: assessment.readyPercentage,
          conditional_percentage: assessment.conditionalPercentage,
          not_ready_percentage: assessment.notReadyPercentage,
          estimated_timeline: assessment.estimatedTimeline,
          has_ai_analysis: !skipAI,
          user_inputs: {}
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Failed to create assessment:', createError)
        return NextResponse.json(
          { error: 'Failed to create assessment', details: createError.message },
          { status: 500 }
        )
      }

      assessmentId = newAssessment.id
    }

    // Store loan tape data
    await supabase
      .from('loan_tape_data')
      .delete()
      .eq('assessment_id', assessmentId)

    const loanRecords = loanTapeResult.data.map(loan => ({
      assessment_id: assessmentId,
      loan_id: loan.loanId,
      borrower_name: loan.borrowerName,
      original_balance: loan.originalBalance,
      current_balance: loan.currentBalance,
      interest_rate: loan.interestRate,
      origination_date: loan.originationDate?.toISOString(),
      maturity_date: loan.maturityDate?.toISOString(),
      payment_status: loan.paymentStatus,
      property_type: loan.propertyType,
      property_state: loan.propertyState,
      property_city: loan.propertyCity,
      original_ltv: loan.originalLtv,
      current_ltv: loan.currentLtv,
      dscr: loan.dscr
    }))

    await supabase.from('loan_tape_data').insert(loanRecords)

    // Store performance history
    await supabase
      .from('performance_history_data')
      .delete()
      .eq('assessment_id', assessmentId)

    const perfRecords = perfHistoryResult.data.map(row => ({
      assessment_id: assessmentId,
      period_month: row.periodMonth.toISOString(),
      portfolio_balance: row.portfolioBalance,
      loan_count: row.loanCount,
      current_pct: row.currentPct,
      delinquent_30_pct: row.delinquent30Pct,
      delinquent_60_pct: row.delinquent60Pct,
      delinquent_90_pct: row.delinquent90Pct,
      default_pct: row.defaultPct,
      prepayments: row.prepayments
    }))

    await supabase.from('performance_history_data').insert(perfRecords)

    // Add score history record
    await supabase
      .from('score_history')
      .insert({
        deal_id: targetDealId,
        assessment_id: assessmentId,
        overall_score: assessment.overallScore,
        letter_grade: assessment.letterGrade,
        portfolio_performance_score: assessment.scores?.portfolioPerformance?.score,
        cash_flow_quality_score: assessment.scores?.cashFlowQuality?.score,
        documentation_score: assessment.scores?.documentation?.score,
        collateral_coverage_score: assessment.scores?.collateralCoverage?.score,
        diversification_score: assessment.scores?.diversification?.score,
        regulatory_readiness_score: assessment.scores?.regulatoryReadiness?.score,
        tokenization_readiness: assessment.tokenizationReadiness,
        ready_percentage: assessment.readyPercentage,
        trigger_type: 'initial',
        trigger_description: 'Test scoring data seeded via API'
      })

    return NextResponse.json({
      success: true,
      message: 'Test scoring data seeded successfully',
      dealId: targetDealId,
      assessmentId: assessmentId,
      assessment: {
        overallScore: assessment.overallScore,
        letterGrade: assessment.letterGrade,
        tokenizationReadiness: assessment.tokenizationReadiness,
        readyPercentage: assessment.readyPercentage,
        summary: assessment.summary,
        strengths: assessment.strengths?.slice(0, 3),
        concerns: assessment.concerns?.slice(0, 3),
        hasAIAnalysis: !skipAI
      },
      loansProcessed: loanTapeResult.data.length,
      performanceMonths: perfHistoryResult.data.length
    })

  } catch (error) {
    console.error('Error seeding test data:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint to check status
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/test/seed-scoring',
    description: 'Seeds test scoring data for demo purposes',
    usage: 'POST with optional { dealId: "uuid", skipAI: false }',
    note: 'REMOVE THIS ENDPOINT IN PRODUCTION'
  })
}

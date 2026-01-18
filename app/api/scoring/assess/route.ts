import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { parseLoanTape, parsePerformanceHistory } from '@/lib/scoring/parser'
import { calculateAssessment } from '@/lib/scoring/calculator'
import { generateAIAnalysis, mergeAIAnalysis } from '@/lib/scoring/ai-analysis'
import { LoanTapeRow, PerformanceHistoryRow } from '@/lib/scoring/types'

export const maxDuration = 60 // Allow up to 60 seconds for AI analysis

interface AssessmentRequest {
  dealId: string
  loanTapeDocumentId?: string
  performanceHistoryDocumentId?: string
  userInputs?: {
    averageRecoveryRate?: number
    servicerName?: string
    backupServicer?: string
    hasAuditedFinancials?: boolean
    kycComplete?: boolean
    amlComplete?: boolean
    performanceHistoryMonths?: number
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const adminClient = createAdminClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: AssessmentRequest = await request.json()
    const { dealId, loanTapeDocumentId, performanceHistoryDocumentId, userInputs } = body

    if (!dealId) {
      return NextResponse.json(
        { error: 'Missing required field: dealId' },
        { status: 400 }
      )
    }

    // Verify user has access to this deal
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        name,
        companies!inner(id, owner_id, name)
      `)
      .eq('id', dealId)
      .single()

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Deal not found or access denied' },
        { status: 404 }
      )
    }

    // Check if there's an existing assessment for this deal
    const { data: existingAssessment } = await adminClient
      .from('portfolio_assessments')
      .select('id')
      .eq('deal_id', dealId)
      .single()

    const assessmentId = existingAssessment?.id

    // Update status to processing
    if (assessmentId) {
      await adminClient
        .from('portfolio_assessments')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', assessmentId)
    } else {
      // Create new assessment record
      const { data: newAssessment, error: createError } = await adminClient
        .from('portfolio_assessments')
        .insert({
          deal_id: dealId,
          status: 'processing',
          user_inputs: userInputs || {}
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Failed to create assessment:', createError)
        return NextResponse.json(
          { error: 'Failed to create assessment record' },
          { status: 500 }
        )
      }
    }

    // Get the current assessment ID
    const { data: currentAssessment } = await adminClient
      .from('portfolio_assessments')
      .select('id')
      .eq('deal_id', dealId)
      .single()

    if (!currentAssessment) {
      return NextResponse.json(
        { error: 'Assessment record not found' },
        { status: 500 }
      )
    }

    let loanTapeData: LoanTapeRow[] = []
    let performanceData: PerformanceHistoryRow[] = []
    const parseErrors: string[] = []
    const parseWarnings: string[] = []

    // Parse loan tape if provided
    if (loanTapeDocumentId) {
      const { data: loanTapeDoc, error: docError } = await adminClient
        .from('documents')
        .select('storage_path, name')
        .eq('id', loanTapeDocumentId)
        .single()

      if (docError || !loanTapeDoc) {
        parseErrors.push('Loan tape document not found')
      } else {
        // Download file from storage
        const { data: fileData, error: downloadError } = await adminClient
          .storage
          .from('documents')
          .download(loanTapeDoc.storage_path)

        if (downloadError || !fileData) {
          parseErrors.push(`Failed to download loan tape: ${downloadError?.message}`)
        } else {
          const buffer = Buffer.from(await fileData.arrayBuffer())
          const parseResult = parseLoanTape(buffer, loanTapeDoc.name)

          if (!parseResult.success) {
            parseErrors.push(...parseResult.errors)
          } else {
            loanTapeData = parseResult.data
            parseWarnings.push(...parseResult.warnings)

            // Store parsed loan data
            await adminClient
              .from('loan_tape_data')
              .delete()
              .eq('assessment_id', currentAssessment.id)

            if (loanTapeData.length > 0) {
              const loanRecords = loanTapeData.map(loan => ({
                assessment_id: currentAssessment.id,
                loan_id: loan.loanId,
                borrower_name: loan.borrowerName,
                original_balance: loan.originalBalance,
                current_balance: loan.currentBalance,
                interest_rate: loan.interestRate,
                origination_date: loan.originationDate?.toISOString(),
                maturity_date: loan.maturityDate?.toISOString(),
                term_months: loan.termMonths,
                payment_status: loan.paymentStatus,
                property_type: loan.propertyType,
                property_state: loan.propertyState,
                property_city: loan.propertyCity,
                property_value: loan.propertyValue,
                original_ltv: loan.originalLtv,
                current_ltv: loan.currentLtv,
                dscr: loan.dscr,
                lien_position: loan.lienPosition,
                appraisal_date: loan.appraisalDate?.toISOString(),
                loan_purpose: loan.loanPurpose
              }))

              await adminClient
                .from('loan_tape_data')
                .insert(loanRecords)
            }
          }
        }
      }
    }

    // Parse performance history if provided
    if (performanceHistoryDocumentId) {
      const { data: perfDoc, error: docError } = await adminClient
        .from('documents')
        .select('storage_path, name')
        .eq('id', performanceHistoryDocumentId)
        .single()

      if (docError || !perfDoc) {
        parseErrors.push('Performance history document not found')
      } else {
        const { data: fileData, error: downloadError } = await adminClient
          .storage
          .from('documents')
          .download(perfDoc.storage_path)

        if (downloadError || !fileData) {
          parseErrors.push(`Failed to download performance history: ${downloadError?.message}`)
        } else {
          const buffer = Buffer.from(await fileData.arrayBuffer())
          const parseResult = parsePerformanceHistory(buffer, perfDoc.name)

          if (!parseResult.success) {
            parseErrors.push(...parseResult.errors)
          } else {
            performanceData = parseResult.data
            parseWarnings.push(...parseResult.warnings)

            // Store parsed performance data
            await adminClient
              .from('performance_history_data')
              .delete()
              .eq('assessment_id', currentAssessment.id)

            if (performanceData.length > 0) {
              const perfRecords = performanceData.map(row => ({
                assessment_id: currentAssessment.id,
                period_month: row.periodMonth.toISOString(),
                portfolio_balance: row.portfolioBalance,
                loan_count: row.loanCount,
                current_pct: row.currentPct,
                delinquent_30_pct: row.delinquent30Pct,
                delinquent_60_pct: row.delinquent60Pct,
                delinquent_90_pct: row.delinquent90Pct,
                default_pct: row.defaultPct,
                prepayments: row.prepayments,
                new_originations: row.newOriginations
              }))

              await adminClient
                .from('performance_history_data')
                .insert(perfRecords)
            }
          }
        }
      }
    }

    // If we have critical errors, mark as error and return
    if (parseErrors.length > 0 && loanTapeData.length === 0) {
      await adminClient
        .from('portfolio_assessments')
        .update({
          status: 'error',
          parse_errors: parseErrors,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentAssessment.id)

      return NextResponse.json({
        success: false,
        assessmentId: currentAssessment.id,
        status: 'error',
        errors: parseErrors
      }, { status: 400 })
    }

    // Calculate the assessment
    let assessment = calculateAssessment(
      loanTapeData,
      performanceData,
      userInputs?.performanceHistoryMonths
    )

    // Run AI analysis
    const aiAnalysis = await generateAIAnalysis(assessment)
    if (aiAnalysis) {
      assessment = mergeAIAnalysis(assessment, aiAnalysis)
    }

    // Store the assessment results
    const { error: updateError } = await adminClient
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
        parse_errors: parseErrors.length > 0 ? parseErrors : null,
        parse_warnings: parseWarnings.length > 0 ? parseWarnings : null,
        user_inputs: userInputs || {},
        has_ai_analysis: aiAnalysis !== null,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentAssessment.id)

    if (updateError) {
      console.error('Failed to update assessment:', updateError)
      return NextResponse.json(
        { error: 'Failed to save assessment results' },
        { status: 500 }
      )
    }

    // Create activity log
    await adminClient
      .from('activities')
      .insert({
        deal_id: dealId,
        user_id: user.id,
        action: 'assessment_completed',
        details: {
          assessment_id: currentAssessment.id,
          overall_score: assessment.overallScore,
          letter_grade: assessment.letterGrade,
          tokenization_readiness: assessment.tokenizationReadiness,
          loan_count: loanTapeData.length
        }
      })

    // Record score history
    const isInitial = !existingAssessment
    await adminClient
      .from('score_history')
      .insert({
        deal_id: dealId,
        assessment_id: currentAssessment.id,
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
        trigger_type: isInitial ? 'initial' : 'manual_reassess',
        trigger_description: isInitial
          ? 'Initial portfolio assessment'
          : `Manual reassessment of ${loanTapeData.length} loans`
      })

    return NextResponse.json({
      success: true,
      assessmentId: currentAssessment.id,
      assessment: {
        overallScore: assessment.overallScore,
        letterGrade: assessment.letterGrade,
        status: assessment.status,
        tokenizationReadiness: assessment.tokenizationReadiness,
        readyPercentage: assessment.readyPercentage,
        summary: assessment.summary,
        strengths: assessment.strengths.slice(0, 3),
        concerns: assessment.concerns.slice(0, 3),
        recommendations: assessment.recommendations.slice(0, 3),
        redFlags: assessment.redFlags,
        hasAIAnalysis: aiAnalysis !== null
      },
      parseInfo: {
        loansProcessed: loanTapeData.length,
        performanceMonths: performanceData.length,
        warnings: parseWarnings
      }
    })
  } catch (error) {
    console.error('Error running assessment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

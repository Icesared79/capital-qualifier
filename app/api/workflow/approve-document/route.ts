import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { parseLoanTape, parsePerformanceHistory } from '@/lib/scoring/parser'
import { calculateAssessment } from '@/lib/scoring/calculator'
import { generateAIAnalysis, mergeAIAnalysis } from '@/lib/scoring/ai-analysis'

interface ApproveDocumentRequest {
  documentId: string
  checklistItemId?: string
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body: ApproveDocumentRequest = await request.json()
    const { documentId, checklistItemId } = body

    if (!documentId) {
      return NextResponse.json(
        { error: 'Missing required field: documentId' },
        { status: 400 }
      )
    }

    // Get the document with deal info
    const { data: document, error: docError } = await adminClient
      .from('documents')
      .select(`
        *,
        deals!inner(
          id,
          companies!inner(owner_id, name)
        )
      `)
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Update document status
    const { error: updateError } = await adminClient
      .from('documents')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('Error updating document:', updateError)
      return NextResponse.json(
        { error: 'Failed to approve document' },
        { status: 500 }
      )
    }

    // If there's a checklist item, update its status
    if (checklistItemId) {
      await adminClient
        .from('deal_checklist_status')
        .update({
          status: 'approved',
          document_id: documentId,
          updated_at: new Date().toISOString()
        })
        .eq('deal_id', document.deal_id)
        .eq('checklist_item_id', checklistItemId)
    }

    // Create activity log entry
    await adminClient
      .from('activities')
      .insert({
        deal_id: document.deal_id,
        user_id: user.id,
        action: 'document_approved',
        details: {
          document_id: documentId,
          document_name: document.name,
          approved_by: user.email
        }
      })

    // Create notification for deal owner
    const ownerId = document.deals.companies.owner_id
    await adminClient
      .from('notifications')
      .insert({
        user_id: ownerId,
        deal_id: document.deal_id,
        type: 'document_approved',
        title: 'Document Approved',
        message: `Your document "${document.name}" has been reviewed and approved.`
      })

    // Auto-trigger scoring when loan tape is approved
    let scoringTriggered = false
    if (document.category === 'loan_tape') {
      try {
        // Check for approved loan tape documents
        const { data: approvedDocs } = await adminClient
          .from('documents')
          .select('id, category, storage_path, name')
          .eq('deal_id', document.deal_id)
          .eq('status', 'approved')
          .in('category', ['loan_tape', 'performance_history'])

        const loanTapeDoc = approvedDocs?.find(d => d.category === 'loan_tape')
        const perfHistoryDoc = approvedDocs?.find(d => d.category === 'performance_history')

        if (loanTapeDoc) {
          // Run scoring in background (async, don't block response)
          (async () => {
            try {
              // Create or get assessment record
              let assessmentId: string
              const { data: existingAssessment } = await adminClient
                .from('portfolio_assessments')
                .select('id')
                .eq('deal_id', document.deal_id)
                .single()

              if (existingAssessment) {
                assessmentId = existingAssessment.id
                await adminClient
                  .from('portfolio_assessments')
                  .update({ status: 'processing', updated_at: new Date().toISOString() })
                  .eq('id', assessmentId)
              } else {
                const { data: newAssessment } = await adminClient
                  .from('portfolio_assessments')
                  .insert({ deal_id: document.deal_id, status: 'processing' })
                  .select('id')
                  .single()
                assessmentId = newAssessment?.id
              }

              // Download and parse loan tape
              const { data: loanTapeFile } = await adminClient.storage
                .from('documents')
                .download(loanTapeDoc.storage_path)

              if (!loanTapeFile) throw new Error('Failed to download loan tape')

              const loanTapeBuffer = Buffer.from(await loanTapeFile.arrayBuffer())
              const loanTapeResult = parseLoanTape(loanTapeBuffer, loanTapeDoc.name)

              if (!loanTapeResult.success) {
                throw new Error(loanTapeResult.errors.join(', '))
              }

              // Parse performance history if available
              let perfData: any[] = []
              if (perfHistoryDoc) {
                const { data: perfFile } = await adminClient.storage
                  .from('documents')
                  .download(perfHistoryDoc.storage_path)
                if (perfFile) {
                  const perfBuffer = Buffer.from(await perfFile.arrayBuffer())
                  const perfResult = parsePerformanceHistory(perfBuffer, perfHistoryDoc.name)
                  if (perfResult.success) perfData = perfResult.data
                }
              }

              // Calculate assessment
              let assessment = calculateAssessment(loanTapeResult.data, perfData)

              // Run AI analysis
              const aiAnalysis = await generateAIAnalysis(assessment)
              if (aiAnalysis) {
                assessment = mergeAIAnalysis(assessment, aiAnalysis)
              }

              // Save results
              await adminClient
                .from('portfolio_assessments')
                .update({
                  status: 'complete',
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
                  has_ai_analysis: aiAnalysis !== null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', assessmentId)

              // Update deal with score
              await adminClient
                .from('deals')
                .update({ overall_score: assessment.overallScore })
                .eq('id', document.deal_id)

              // Record score history
              await adminClient
                .from('score_history')
                .insert({
                  deal_id: document.deal_id,
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
                  trigger_type: 'document_update',
                  trigger_description: 'Loan tape document approved'
                })

              // Notify owner that scoring is complete
              await adminClient
                .from('notifications')
                .insert({
                  user_id: ownerId,
                  deal_id: document.deal_id,
                  type: 'scoring_complete',
                  title: 'Portfolio Analysis Complete',
                  message: `Your portfolio has been scored: ${assessment.overallScore}/100 (${assessment.letterGrade})`
                })

            } catch (err) {
              console.error('Scoring failed:', err)
            }
          })()

          scoringTriggered = true

          // Notify owner that scoring is starting
          await adminClient
            .from('notifications')
            .insert({
              user_id: ownerId,
              deal_id: document.deal_id,
              type: 'scoring_started',
              title: 'Portfolio Analysis Started',
              message: 'Your loan tape has been approved and portfolio scoring analysis has begun.'
            })
        }
      } catch (err) {
        console.error('Error triggering auto-scoring:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: scoringTriggered
        ? 'Document approved and portfolio scoring initiated'
        : 'Document approved successfully',
      document: {
        id: documentId,
        status: 'approved'
      },
      scoringTriggered
    })
  } catch (error) {
    console.error('Error approving document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

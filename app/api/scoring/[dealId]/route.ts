import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { dealId: string } }
) {
  try {
    const supabase = createClient()
    const adminClient = createAdminClient()
    const { dealId } = params

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to this deal
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('id')
      .eq('id', dealId)
      .single()

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Deal not found or access denied' },
        { status: 404 }
      )
    }

    // Get the assessment
    const { data: assessment, error: assessmentError } = await adminClient
      .from('portfolio_assessments')
      .select('*')
      .eq('deal_id', dealId)
      .single()

    if (assessmentError) {
      if (assessmentError.code === 'PGRST116') {
        // No assessment found
        return NextResponse.json({
          exists: false,
          assessment: null
        })
      }
      throw assessmentError
    }

    return NextResponse.json({
      exists: true,
      assessment: {
        id: assessment.id,
        status: assessment.status,
        overallScore: assessment.overall_score,
        letterGrade: assessment.letter_grade,
        metrics: assessment.metrics,
        scores: assessment.scores,
        summary: assessment.summary,
        strengths: assessment.strengths,
        concerns: assessment.concerns,
        recommendations: assessment.recommendations,
        redFlags: assessment.red_flags,
        tokenizationReadiness: assessment.tokenization_readiness,
        readyPercentage: assessment.ready_percentage,
        conditionalPercentage: assessment.conditional_percentage,
        notReadyPercentage: assessment.not_ready_percentage,
        estimatedTimeline: assessment.estimated_timeline,
        hasAIAnalysis: assessment.has_ai_analysis,
        parseErrors: assessment.parse_errors,
        parseWarnings: assessment.parse_warnings,
        userInputs: assessment.user_inputs,
        createdAt: assessment.created_at,
        updatedAt: assessment.updated_at
      }
    })
  } catch (error) {
    console.error('Error fetching assessment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

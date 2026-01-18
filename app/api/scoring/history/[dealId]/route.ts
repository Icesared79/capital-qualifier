import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { dealId: string } }
) {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { dealId } = params

  // Fetch score history ordered by date
  const { data: history, error } = await supabase
    .from('score_history')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching score history:', error)
    return NextResponse.json({ error: 'Failed to fetch score history' }, { status: 500 })
  }

  // Transform data for chart-friendly format
  const chartData = history?.map(record => ({
    date: record.created_at,
    overallScore: record.overall_score,
    letterGrade: record.letter_grade,
    portfolioPerformance: record.portfolio_performance_score,
    cashFlowQuality: record.cash_flow_quality_score,
    documentation: record.documentation_score,
    collateralCoverage: record.collateral_coverage_score,
    diversification: record.diversification_score,
    regulatoryReadiness: record.regulatory_readiness_score,
    tokenizationReadiness: record.tokenization_readiness,
    readyPercentage: record.ready_percentage,
    triggerType: record.trigger_type,
    triggerDescription: record.trigger_description,
  })) || []

  return NextResponse.json({
    dealId,
    history: chartData,
    count: chartData.length,
  })
}

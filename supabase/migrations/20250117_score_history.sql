-- ============================================
-- SCORE HISTORY TRACKING
-- ============================================

-- Table to track score changes over time
CREATE TABLE IF NOT EXISTS public.score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  assessment_id UUID REFERENCES public.portfolio_assessments(id) ON DELETE CASCADE,

  -- Score at this point in time
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  letter_grade TEXT,

  -- Category scores snapshot
  portfolio_performance_score INTEGER,
  cash_flow_quality_score INTEGER,
  documentation_score INTEGER,
  collateral_coverage_score INTEGER,
  diversification_score INTEGER,
  regulatory_readiness_score INTEGER,

  -- Readiness snapshot
  tokenization_readiness TEXT CHECK (tokenization_readiness IN ('ready', 'conditional', 'not_ready')),
  ready_percentage DECIMAL(5, 2),

  -- What triggered this update
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'initial',           -- First assessment
    'document_update',   -- Document was added/updated
    'manual_reassess',   -- Admin triggered reassessment
    'scheduled'          -- Periodic reassessment
  )),
  trigger_description TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;

-- Index for fast queries
CREATE INDEX idx_score_history_deal ON public.score_history(deal_id);
CREATE INDEX idx_score_history_created ON public.score_history(deal_id, created_at DESC);

-- RLS Policies
CREATE POLICY "Users can view own score history" ON public.score_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.companies c ON d.company_id = c.id
      WHERE d.id = deal_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all score history" ON public.score_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Legal/Optma can view assigned score history" ON public.score_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE d.id = deal_id
      AND d.handoff_to = p.role
      AND p.role IN ('legal', 'optma')
    )
  );

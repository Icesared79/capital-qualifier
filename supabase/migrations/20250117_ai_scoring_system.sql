-- ============================================
-- AI SCORING SYSTEM MIGRATION
-- ============================================

-- Add new document categories for scoring
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_category_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_category_check CHECK (category IN (
  'financials',
  'loan_tape',
  'performance_history',
  'servicing_report',
  'appraisal',
  'sample_loan_docs',
  'borrower_financials',
  'legal',
  'corporate',
  'due_diligence',
  'other'
));

-- ============================================
-- PORTFOLIO ASSESSMENTS TABLE
-- Main scoring results for a deal
-- ============================================
CREATE TABLE IF NOT EXISTS public.portfolio_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,

  -- Overall Score
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  letter_grade TEXT CHECK (letter_grade IN ('A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F')),

  -- Category Scores (0-100 for each, will be weighted)
  portfolio_performance_score INTEGER CHECK (portfolio_performance_score >= 0 AND portfolio_performance_score <= 100),
  cash_flow_quality_score INTEGER CHECK (cash_flow_quality_score >= 0 AND cash_flow_quality_score <= 100),
  documentation_score INTEGER CHECK (documentation_score >= 0 AND documentation_score <= 100),
  collateral_coverage_score INTEGER CHECK (collateral_coverage_score >= 0 AND collateral_coverage_score <= 100),
  diversification_score INTEGER CHECK (diversification_score >= 0 AND diversification_score <= 100),
  regulatory_readiness_score INTEGER CHECK (regulatory_readiness_score >= 0 AND regulatory_readiness_score <= 100),

  -- Scoring Status
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN (
    'incomplete',      -- Missing required documents
    'processing',      -- Currently analyzing
    'preliminary',     -- Loan tape only, no performance history
    'complete',        -- Full assessment done
    'error'            -- Processing failed
  )),

  -- Key Metrics (extracted from loan tape)
  portfolio_size DECIMAL(15, 2),
  loan_count INTEGER,
  avg_loan_size DECIMAL(15, 2),
  weighted_avg_rate DECIMAL(5, 3),
  weighted_avg_ltv DECIMAL(5, 2),
  weighted_avg_dscr DECIMAL(5, 2),
  default_rate DECIMAL(5, 3),
  delinquency_30_rate DECIMAL(5, 3),
  delinquency_60_rate DECIMAL(5, 3),
  delinquency_90_rate DECIMAL(5, 3),
  avg_loan_age_months INTEGER,
  avg_remaining_term_months INTEGER,

  -- Concentration Metrics
  largest_single_exposure DECIMAL(5, 3),
  top_10_concentration DECIMAL(5, 3),
  geographic_concentration JSONB,  -- { "CA": 0.35, "TX": 0.25, ... }
  property_type_concentration JSONB,  -- { "Office": 0.40, "Retail": 0.30, ... }

  -- AI-Generated Content
  summary TEXT,
  strengths JSONB,  -- ["Low default rate", "Strong DSCR", ...]
  concerns JSONB,   -- ["Geographic concentration", "Limited history", ...]
  recommendations JSONB,  -- ["Upload 6 more months of data", ...]
  red_flags JSONB,  -- Automatic flags triggered

  -- Tokenization Readiness
  tokenization_readiness TEXT CHECK (tokenization_readiness IN ('ready', 'conditional', 'not_ready')),
  ready_percentage DECIMAL(5, 2),
  conditional_percentage DECIMAL(5, 2),
  not_ready_percentage DECIMAL(5, 2),
  estimated_timeline TEXT,

  -- Metadata
  last_calculated_at TIMESTAMPTZ,
  calculation_version TEXT DEFAULT '1.0',
  raw_analysis JSONB,  -- Store full AI response for debugging

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.portfolio_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own assessments" ON public.portfolio_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.companies c ON d.company_id = c.id
      WHERE d.id = deal_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all assessments" ON public.portfolio_assessments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Legal/Optma can view assigned assessments" ON public.portfolio_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE d.id = deal_id
      AND d.handoff_to = p.role
      AND p.role IN ('legal', 'optma')
    )
  );

-- ============================================
-- LOAN TAPE DATA TABLE
-- Parsed loan-level data from uploaded loan tapes
-- ============================================
CREATE TABLE IF NOT EXISTS public.loan_tape_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES public.portfolio_assessments(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,

  -- Loan Identification
  loan_id TEXT NOT NULL,
  borrower_name TEXT,

  -- Balances
  original_balance DECIMAL(15, 2),
  current_balance DECIMAL(15, 2),

  -- Terms
  interest_rate DECIMAL(5, 3),
  origination_date DATE,
  maturity_date DATE,
  term_months INTEGER,

  -- Status
  payment_status TEXT CHECK (payment_status IN ('current', '30_day', '60_day', '90_day', 'default', 'paid_off')),

  -- Property Info
  property_type TEXT,
  property_state TEXT,
  property_city TEXT,
  property_value DECIMAL(15, 2),

  -- Risk Metrics
  original_ltv DECIMAL(5, 2),
  current_ltv DECIMAL(5, 2),
  dscr DECIMAL(5, 2),

  -- Collateral
  lien_position TEXT,
  appraisal_date DATE,

  -- Other
  loan_purpose TEXT,

  -- Flags
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reasons JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.loan_tape_data ENABLE ROW LEVEL SECURITY;

-- Index for fast queries
CREATE INDEX idx_loan_tape_assessment ON public.loan_tape_data(assessment_id);
CREATE INDEX idx_loan_tape_document ON public.loan_tape_data(document_id);

-- RLS Policies (inherit from assessment)
CREATE POLICY "Users can view own loan data" ON public.loan_tape_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portfolio_assessments pa
      JOIN public.deals d ON pa.deal_id = d.id
      JOIN public.companies c ON d.company_id = c.id
      WHERE pa.id = assessment_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all loan data" ON public.loan_tape_data
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- PERFORMANCE HISTORY DATA TABLE
-- Monthly performance snapshots
-- ============================================
CREATE TABLE IF NOT EXISTS public.performance_history_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES public.portfolio_assessments(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,

  -- Period
  period_month DATE NOT NULL,  -- First day of month

  -- Portfolio Metrics
  portfolio_balance DECIMAL(15, 2),
  loan_count INTEGER,

  -- Performance Buckets (percentages)
  current_pct DECIMAL(5, 2),
  delinquent_30_pct DECIMAL(5, 2),
  delinquent_60_pct DECIMAL(5, 2),
  delinquent_90_pct DECIMAL(5, 2),
  default_pct DECIMAL(5, 2),

  -- Activity
  prepayments DECIMAL(15, 2),
  new_originations DECIMAL(15, 2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.performance_history_data ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX idx_perf_history_assessment ON public.performance_history_data(assessment_id);
CREATE UNIQUE INDEX idx_perf_history_period ON public.performance_history_data(assessment_id, period_month);

-- RLS Policies
CREATE POLICY "Users can view own performance data" ON public.performance_history_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portfolio_assessments pa
      JOIN public.deals d ON pa.deal_id = d.id
      JOIN public.companies c ON d.company_id = c.id
      WHERE pa.id = assessment_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all performance data" ON public.performance_history_data
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- ADD ASSESSMENT REFERENCE TO DEALS
-- ============================================
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS current_assessment_id UUID REFERENCES public.portfolio_assessments(id);

-- Update trigger to set updated_at
CREATE OR REPLACE FUNCTION update_assessment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolio_assessments_updated_at
  BEFORE UPDATE ON public.portfolio_assessments
  FOR EACH ROW EXECUTE FUNCTION update_assessment_updated_at();

-- ============================================
-- FUNCTION: Calculate letter grade from score
-- ============================================
CREATE OR REPLACE FUNCTION get_letter_grade(score INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN score >= 95 THEN 'A'
    WHEN score >= 90 THEN 'A-'
    WHEN score >= 85 THEN 'B+'
    WHEN score >= 80 THEN 'B'
    WHEN score >= 75 THEN 'B-'
    WHEN score >= 70 THEN 'C+'
    WHEN score >= 65 THEN 'C'
    WHEN score >= 60 THEN 'C-'
    WHEN score >= 50 THEN 'D'
    ELSE 'F'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

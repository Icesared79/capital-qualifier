-- ============================================
-- DEAL FLOW EXAMPLES
-- Educational examples showing how deals progress through the system
-- Accessible to admins and all partners
-- BitCense Capital Qualifier
-- ============================================

-- ============================================
-- DEAL FLOW EXAMPLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.deal_flow_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  deal_type TEXT NOT NULL,
  description TEXT,
  timeline_days INTEGER,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  lessons_learned TEXT[],
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deal_flow_examples_published ON public.deal_flow_examples(is_published, display_order);
CREATE INDEX IF NOT EXISTS idx_deal_flow_examples_deal_type ON public.deal_flow_examples(deal_type);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.deal_flow_examples ENABLE ROW LEVEL SECURITY;

-- All authenticated users with allowed roles can read published examples
CREATE POLICY "Deal flow examples readable by partners and admins"
  ON public.deal_flow_examples FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'legal', 'optma', 'investor')
    )
  );

-- Admins can read all (including unpublished)
CREATE POLICY "Admins can read all deal flow examples"
  ON public.deal_flow_examples FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can manage examples
CREATE POLICY "Admins can manage deal flow examples"
  ON public.deal_flow_examples FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- SEED DATA - Example Deal Scenarios
-- ============================================

INSERT INTO public.deal_flow_examples (title, deal_type, description, timeline_days, stages, lessons_learned, is_published, display_order) VALUES

-- Example 1: Fast Track Real Estate
(
  'Fast Track Real Estate Portfolio',
  'Real Estate',
  'A clean bridge loan deal with an experienced borrower and strong collateral. This deal demonstrates the ideal scenario with minimal friction.',
  30,
  '[
    {
      "stage": "qualified",
      "day": 1,
      "duration_days": 2,
      "notes": "Deal scored 92/100 with strong financials and experienced sponsor",
      "actions": ["AI scoring completed", "Partner notifications sent", "Priority flagged"]
    },
    {
      "stage": "documents_requested",
      "day": 3,
      "duration_days": 5,
      "notes": "Standard document request sent. Borrower had most documents ready.",
      "actions": ["Document checklist sent", "90% uploaded within 3 days", "Follow-up on remaining 10%"]
    },
    {
      "stage": "under_review",
      "day": 8,
      "duration_days": 7,
      "notes": "Legal review concurrent with funding partner due diligence",
      "actions": ["Legal team assigned", "Title search initiated", "Appraisal ordered"]
    },
    {
      "stage": "term_sheet",
      "day": 15,
      "duration_days": 5,
      "notes": "Terms negotiated quickly due to clear requirements",
      "actions": ["Term sheet drafted", "Client accepted within 48 hours", "Legal began closing docs"]
    },
    {
      "stage": "closing",
      "day": 20,
      "duration_days": 8,
      "notes": "Smooth closing with minimal back-and-forth",
      "actions": ["Final docs prepared", "Wire instructions sent", "Recording scheduled"]
    },
    {
      "stage": "funded",
      "day": 28,
      "duration_days": 0,
      "notes": "Deal closed 2 days ahead of schedule",
      "actions": ["Funds wired", "Documents recorded", "Client notified"]
    }
  ]'::jsonb,
  ARRAY['Clean documentation upfront reduces timeline by 20%', 'Experienced borrowers require less hand-holding', 'Concurrent legal and funding review saves time', 'Clear communication on requirements prevents delays'],
  true,
  10
),

-- Example 2: Consumer Lending Portfolio
(
  'Consumer Lending Portfolio Acquisition',
  'Consumer Lending',
  'A portfolio acquisition requiring extra due diligence on loan tape analysis and regulatory compliance. Shows how complex deals require additional review cycles.',
  60,
  '[
    {
      "stage": "qualified",
      "day": 1,
      "duration_days": 3,
      "notes": "Initial score 78/100 - flagged for additional review due to portfolio complexity",
      "actions": ["AI scoring completed", "Compliance team notified", "Additional DD checklist created"]
    },
    {
      "stage": "documents_requested",
      "day": 4,
      "duration_days": 14,
      "notes": "Extensive loan tape required. Multiple data format issues to resolve.",
      "actions": ["Loan tape template sent", "Data validation issues identified", "Three rounds of corrections"]
    },
    {
      "stage": "under_review",
      "day": 18,
      "duration_days": 21,
      "notes": "Deep dive on loan tape, sampling, and state-by-state compliance",
      "actions": ["Loan tape analysis completed", "Sample loan file review", "State licensing verified", "Rep and warranty negotiation"]
    },
    {
      "stage": "term_sheet",
      "day": 39,
      "duration_days": 10,
      "notes": "Multiple term sheet revisions due to pricing discussions",
      "actions": ["Initial term sheet sent", "Advance rate negotiation", "Revised terms accepted"]
    },
    {
      "stage": "closing",
      "day": 49,
      "duration_days": 10,
      "notes": "Complex closing with multiple parties and wire instructions",
      "actions": ["SPV formation", "Assignment documents prepared", "Servicer transition planned"]
    },
    {
      "stage": "funded",
      "day": 59,
      "duration_days": 0,
      "notes": "Successfully closed with purchase price holdback for rep breaches",
      "actions": ["Initial funding wired", "Holdback account established", "Servicing transferred"]
    }
  ]'::jsonb,
  ARRAY['Consumer lending deals require state-by-state compliance review', 'Loan tape quality significantly impacts timeline', 'Build in buffer time for portfolio due diligence', 'Rep and warranty negotiation often takes multiple rounds', 'Servicer transition planning should start early'],
  true,
  20
),

-- Example 3: Complex Multi-Asset Deal
(
  'Complex Multi-Asset Facility',
  'Mixed Asset',
  'A sophisticated deal involving multiple asset classes and jurisdictions. Demonstrates how complex structures require extensive coordination.',
  90,
  '[
    {
      "stage": "qualified",
      "day": 1,
      "duration_days": 5,
      "notes": "Initial score 72/100 - complexity required manual underwriting overlay",
      "actions": ["AI scoring completed", "Senior underwriter assigned", "Structure review meeting scheduled"]
    },
    {
      "stage": "documents_requested",
      "day": 6,
      "duration_days": 21,
      "notes": "Multi-asset documentation across three jurisdictions",
      "actions": ["Custom document checklist created", "Third-party reports ordered", "Cross-border counsel engaged"]
    },
    {
      "stage": "under_review",
      "day": 27,
      "duration_days": 28,
      "notes": "Parallel workstreams for each asset class with weekly sync calls",
      "actions": ["Real estate appraisals completed", "Equipment valuations ordered", "AR aging analysis performed", "Insurance requirements defined"]
    },
    {
      "stage": "term_sheet",
      "day": 55,
      "duration_days": 14,
      "notes": "Complex pricing across multiple tranches and asset classes",
      "actions": ["Initial term sheet drafted", "Waterfall structure negotiated", "Covenants package agreed"]
    },
    {
      "stage": "closing",
      "day": 69,
      "duration_days": 18,
      "notes": "Multi-jurisdictional closing with staggered fundings",
      "actions": ["Master facility agreement drafted", "Security documents by jurisdiction", "Closing checklist with 150+ items"]
    },
    {
      "stage": "funded",
      "day": 87,
      "duration_days": 0,
      "notes": "Initial draw funded with remaining availability for future draws",
      "actions": ["Initial tranche funded", "Borrowing base certificate delivered", "Reporting requirements began"]
    }
  ]'::jsonb,
  ARRAY['Complex deals benefit from dedicated deal teams', 'Weekly sync calls keep all parties aligned', 'Multi-jurisdictional deals need local counsel coordination', 'Staggered closing approach reduces risk', 'Clear workstream ownership prevents bottlenecks', 'Expect 3x normal timeline for multi-asset structures'],
  true,
  30
),

-- Example 4: Declined Deal
(
  'Declined: Undercapitalized Sponsor',
  'Equipment Finance',
  'An example of a deal that did not proceed due to fundamental issues discovered during due diligence. Shows the importance of early qualification.',
  21,
  '[
    {
      "stage": "qualified",
      "day": 1,
      "duration_days": 2,
      "notes": "Initial score 58/100 - flagged for sponsor financial review",
      "actions": ["AI scoring completed with warnings", "Sponsor financial deep dive requested", "Conditional qualification pending review"]
    },
    {
      "stage": "documents_requested",
      "day": 3,
      "duration_days": 10,
      "notes": "Sponsor financials revealed concerning trends",
      "actions": ["Tax returns showed declining revenue", "Bank statements showed cash flow issues", "Additional guarantor requested"]
    },
    {
      "stage": "under_review",
      "day": 13,
      "duration_days": 7,
      "notes": "Credit committee review identified deal-breaker issues",
      "actions": ["Sponsor net worth insufficient", "Equipment appraisal showed inflated values", "References revealed payment history issues"]
    },
    {
      "stage": "declined",
      "day": 20,
      "duration_days": 0,
      "notes": "Deal declined with clear feedback to sponsor",
      "actions": ["Declination letter sent", "Specific feedback provided", "Pathway to reapply outlined"]
    }
  ]'::jsonb,
  ARRAY['Early AI scoring can identify potential issues before significant time investment', 'Sponsor financial strength is often more important than collateral', 'Third-party references provide valuable insight', 'Clear declination feedback helps sponsors improve for future deals', 'Not every deal should close - quality over quantity'],
  true,
  40
)

ON CONFLICT DO NOTHING;

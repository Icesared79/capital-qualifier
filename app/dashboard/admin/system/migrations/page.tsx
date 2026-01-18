'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Database,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface Migration {
  id: string
  name: string
  description: string
  status: 'completed' | 'pending' | 'failed'
  completedAt?: string
  sql?: string
}

const MIGRATIONS: Migration[] = [
  {
    id: 'initial-schema',
    name: 'Initial Schema',
    description: 'Core tables: profiles, companies, deals, documents',
    status: 'completed',
    completedAt: '2024-01-15'
  },
  {
    id: 'partners-network',
    name: 'Partner Network',
    description: 'Partners table with roles (funding, legal, tokenization)',
    status: 'completed',
    completedAt: '2024-01-18'
  },
  {
    id: 'legal-fees',
    name: 'Legal & SPV Fee Structure',
    description: 'Fee catalog and deal-specific legal fees tracking',
    status: 'completed',
    completedAt: '2024-01-20',
    sql: `-- Legal Fee Catalog & Deal Fees Migration
-- Tables: legal_fee_catalog, deal_legal_fees
-- See /admin/run-migration for full SQL`
  },
  {
    id: 'document-checklist',
    name: 'Document Checklist',
    description: 'Configurable document requirements for deals',
    status: 'pending',
    sql: `-- Document Checklist Migration
CREATE TABLE IF NOT EXISTS public.document_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'business' CHECK (category IN ('business', 'personal', 'financial', 'legal', 'property')),
  is_required BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active items
CREATE INDEX IF NOT EXISTS idx_checklist_items_active ON public.document_checklist_items(is_active, category);

-- Enable RLS
ALTER TABLE public.document_checklist_items ENABLE ROW LEVEL SECURITY;

-- Checklist readable by authenticated users
CREATE POLICY "Checklist readable by authenticated users"
  ON public.document_checklist_items FOR SELECT
  TO authenticated
  USING (true);

-- Checklist manageable by admins
CREATE POLICY "Checklist manageable by admins"
  ON public.document_checklist_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seed data
INSERT INTO public.document_checklist_items (name, description, category, is_required, display_order) VALUES
-- Business Documents
('Articles of Incorporation', 'Certificate of incorporation or formation documents', 'business', true, 10),
('Operating Agreement', 'LLC operating agreement or corporate bylaws', 'business', true, 20),
('Business License', 'Current business license for operations', 'business', true, 30),
('EIN Confirmation', 'IRS EIN confirmation letter', 'business', true, 40),
('Certificate of Good Standing', 'State certificate of good standing', 'business', false, 50),
-- Personal Documents
('Government ID', 'Valid government-issued photo ID (passport, driver''s license)', 'personal', true, 100),
('Proof of Address', 'Utility bill or bank statement showing current address', 'personal', true, 110),
('Resume/CV', 'Professional background and experience', 'personal', false, 120),
-- Financial Documents
('Bank Statements', 'Last 3 months of business bank statements', 'financial', true, 200),
('Tax Returns', 'Last 2 years of business tax returns', 'financial', true, 210),
('Profit & Loss Statement', 'Current year P&L statement', 'financial', true, 220),
('Balance Sheet', 'Current balance sheet', 'financial', true, 230),
('Accounts Receivable Aging', 'AR aging report', 'financial', false, 240),
-- Legal Documents
('Existing Loan Agreements', 'Any current loan or credit agreements', 'legal', false, 300),
('Litigation Disclosure', 'Disclosure of any pending litigation', 'legal', true, 310),
('Insurance Certificates', 'Business insurance certificates', 'legal', false, 320),
-- Property Documents
('Property Deed', 'Deed or title to collateral property', 'property', false, 400),
('Appraisal Report', 'Recent property appraisal', 'property', false, 410),
('Environmental Report', 'Phase I environmental assessment', 'property', false, 420)
ON CONFLICT DO NOTHING;

SELECT 'Document checklist migration completed!' as status;`
  },
  {
    id: 'activity-log',
    name: 'Activity Log',
    description: 'System-wide activity tracking and audit trail',
    status: 'pending',
    sql: `-- Activity Log Migration
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Activity log viewable by admins only
CREATE POLICY "Activity log viewable by admins"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Activity log insertable by system
CREATE POLICY "Activity log insertable by authenticated"
  ON public.activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

SELECT 'Activity log migration completed!' as status;`
  },
  {
    id: 'deal-flow-examples',
    name: 'Deal Flow Examples',
    description: 'Educational examples showing how deals progress through the system',
    status: 'pending',
    sql: `-- Deal Flow Examples Migration
-- Educational examples showing how deals progress through the system
-- Accessible to admins and all partners

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

-- Enable RLS
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

-- Seed Data: Example Deal Scenarios
INSERT INTO public.deal_flow_examples (title, deal_type, description, timeline_days, stages, lessons_learned, is_published, display_order) VALUES

-- Example 1: Fast Track Real Estate
(
  'Fast Track Real Estate Portfolio',
  'Real Estate',
  'A clean bridge loan deal with an experienced borrower and strong collateral. This deal demonstrates the ideal scenario with minimal friction.',
  30,
  '[{"stage": "qualified", "day": 1, "duration_days": 2, "notes": "Deal scored 92/100 with strong financials and experienced sponsor", "actions": ["AI scoring completed", "Partner notifications sent", "Priority flagged"]}, {"stage": "documents_requested", "day": 3, "duration_days": 5, "notes": "Standard document request sent. Borrower had most documents ready.", "actions": ["Document checklist sent", "90% uploaded within 3 days", "Follow-up on remaining 10%"]}, {"stage": "under_review", "day": 8, "duration_days": 7, "notes": "Legal review concurrent with funding partner due diligence", "actions": ["Legal team assigned", "Title search initiated", "Appraisal ordered"]}, {"stage": "term_sheet", "day": 15, "duration_days": 5, "notes": "Terms negotiated quickly due to clear requirements", "actions": ["Term sheet drafted", "Client accepted within 48 hours", "Legal began closing docs"]}, {"stage": "closing", "day": 20, "duration_days": 8, "notes": "Smooth closing with minimal back-and-forth", "actions": ["Final docs prepared", "Wire instructions sent", "Recording scheduled"]}, {"stage": "funded", "day": 28, "duration_days": 0, "notes": "Deal closed 2 days ahead of schedule", "actions": ["Funds wired", "Documents recorded", "Client notified"]}]'::jsonb,
  ARRAY['Clean documentation upfront reduces timeline by 20%', 'Experienced borrowers require less hand-holding', 'Concurrent legal and funding review saves time', 'Clear communication on requirements prevents delays'],
  true,
  10
),

-- Example 2: Consumer Lending Portfolio
(
  'Consumer Lending Portfolio Acquisition',
  'Consumer Lending',
  'A portfolio acquisition requiring extra due diligence on loan tape analysis and regulatory compliance.',
  60,
  '[{"stage": "qualified", "day": 1, "duration_days": 3, "notes": "Initial score 78/100 - flagged for additional review due to portfolio complexity", "actions": ["AI scoring completed", "Compliance team notified", "Additional DD checklist created"]}, {"stage": "documents_requested", "day": 4, "duration_days": 14, "notes": "Extensive loan tape required. Multiple data format issues to resolve.", "actions": ["Loan tape template sent", "Data validation issues identified", "Three rounds of corrections"]}, {"stage": "under_review", "day": 18, "duration_days": 21, "notes": "Deep dive on loan tape, sampling, and state-by-state compliance", "actions": ["Loan tape analysis completed", "Sample loan file review", "State licensing verified", "Rep and warranty negotiation"]}, {"stage": "term_sheet", "day": 39, "duration_days": 10, "notes": "Multiple term sheet revisions due to pricing discussions", "actions": ["Initial term sheet sent", "Advance rate negotiation", "Revised terms accepted"]}, {"stage": "closing", "day": 49, "duration_days": 10, "notes": "Complex closing with multiple parties and wire instructions", "actions": ["SPV formation", "Assignment documents prepared", "Servicer transition planned"]}, {"stage": "funded", "day": 59, "duration_days": 0, "notes": "Successfully closed with purchase price holdback for rep breaches", "actions": ["Initial funding wired", "Holdback account established", "Servicing transferred"]}]'::jsonb,
  ARRAY['Consumer lending deals require state-by-state compliance review', 'Loan tape quality significantly impacts timeline', 'Build in buffer time for portfolio due diligence', 'Rep and warranty negotiation often takes multiple rounds'],
  true,
  20
),

-- Example 3: Complex Multi-Asset Deal
(
  'Complex Multi-Asset Facility',
  'Mixed Asset',
  'A sophisticated deal involving multiple asset classes and jurisdictions.',
  90,
  '[{"stage": "qualified", "day": 1, "duration_days": 5, "notes": "Initial score 72/100 - complexity required manual underwriting overlay", "actions": ["AI scoring completed", "Senior underwriter assigned", "Structure review meeting scheduled"]}, {"stage": "documents_requested", "day": 6, "duration_days": 21, "notes": "Multi-asset documentation across three jurisdictions", "actions": ["Custom document checklist created", "Third-party reports ordered", "Cross-border counsel engaged"]}, {"stage": "under_review", "day": 27, "duration_days": 28, "notes": "Parallel workstreams for each asset class with weekly sync calls", "actions": ["Real estate appraisals completed", "Equipment valuations ordered", "AR aging analysis performed", "Insurance requirements defined"]}, {"stage": "term_sheet", "day": 55, "duration_days": 14, "notes": "Complex pricing across multiple tranches and asset classes", "actions": ["Initial term sheet drafted", "Waterfall structure negotiated", "Covenants package agreed"]}, {"stage": "closing", "day": 69, "duration_days": 18, "notes": "Multi-jurisdictional closing with staggered fundings", "actions": ["Master facility agreement drafted", "Security documents by jurisdiction", "Closing checklist with 150+ items"]}, {"stage": "funded", "day": 87, "duration_days": 0, "notes": "Initial draw funded with remaining availability for future draws", "actions": ["Initial tranche funded", "Borrowing base certificate delivered", "Reporting requirements began"]}]'::jsonb,
  ARRAY['Complex deals benefit from dedicated deal teams', 'Weekly sync calls keep all parties aligned', 'Multi-jurisdictional deals need local counsel coordination', 'Staggered closing approach reduces risk'],
  true,
  30
),

-- Example 4: Declined Deal
(
  'Declined: Undercapitalized Sponsor',
  'Equipment Finance',
  'An example of a deal that did not proceed due to fundamental issues discovered during due diligence.',
  21,
  '[{"stage": "qualified", "day": 1, "duration_days": 2, "notes": "Initial score 58/100 - flagged for sponsor financial review", "actions": ["AI scoring completed with warnings", "Sponsor financial deep dive requested", "Conditional qualification pending review"]}, {"stage": "documents_requested", "day": 3, "duration_days": 10, "notes": "Sponsor financials revealed concerning trends", "actions": ["Tax returns showed declining revenue", "Bank statements showed cash flow issues", "Additional guarantor requested"]}, {"stage": "under_review", "day": 13, "duration_days": 7, "notes": "Credit committee review identified deal-breaker issues", "actions": ["Sponsor net worth insufficient", "Equipment appraisal showed inflated values", "References revealed payment history issues"]}, {"stage": "declined", "day": 20, "duration_days": 0, "notes": "Deal declined with clear feedback to sponsor", "actions": ["Declination letter sent", "Specific feedback provided", "Pathway to reapply outlined"]}]'::jsonb,
  ARRAY['Early AI scoring can identify potential issues before significant time investment', 'Sponsor financial strength is often more important than collateral', 'Third-party references provide valuable insight', 'Not every deal should close - quality over quantity'],
  true,
  40
)

ON CONFLICT DO NOTHING;

SELECT 'Deal flow examples migration completed!' as status;`
  },
  {
    id: 'seed-deal-flow-examples',
    name: 'Seed Deal Flow Examples (Data Only)',
    description: 'Insert sample deal flow examples if table exists but is empty',
    status: 'pending',
    sql: `-- Seed Deal Flow Examples (Data Only)
-- Run this if the table exists but examples are missing
-- This will insert 4 example deal flow scenarios

-- Check if table is empty first
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.deal_flow_examples LIMIT 1) THEN
    RAISE NOTICE 'Table is empty, inserting examples...';
  END IF;
END $$;

-- Example 1: Real Estate Fast Track
INSERT INTO deal_flow_examples (title, deal_type, description, timeline_days, stages, lessons_learned, is_published, display_order)
SELECT
  'Real Estate Portfolio Fast Track',
  'Real Estate',
  'A well-prepared commercial real estate lender with a $15M portfolio of bridge loans. Strong documentation and track record enabled expedited review and funding within 3 weeks.',
  21,
  '[
    {"stage": "qualified", "day": 1, "duration_days": 1, "notes": "Initial application reviewed. Portfolio metrics strong: 2.1% default rate, 78% avg LTV, 18-month track record.", "actions": ["Application submitted", "Initial screening passed", "Assigned to deal team"]},
    {"stage": "documents_requested", "day": 2, "duration_days": 3, "notes": "Document checklist sent. Client had most documents prepared in advance, submitted 90% within 48 hours.", "actions": ["Loan tape uploaded", "Appraisals provided", "Financials submitted", "Rent rolls shared"]},
    {"stage": "under_review", "day": 5, "duration_days": 5, "notes": "Due diligence in progress. Portfolio scoring completed with A- grade. Minor concentration issue flagged (35% in one market).", "actions": ["Portfolio scored: 87/100", "Concentration analysis", "Property valuations verified", "Borrower credit checks"]},
    {"stage": "term_sheet", "day": 10, "duration_days": 4, "notes": "Term sheet issued by funding partner. 85% advance rate offered with 12-month facility. Client accepted terms within 2 days.", "actions": ["Term sheet drafted", "Legal review", "Client negotiation", "Terms accepted"]},
    {"stage": "closing", "day": 14, "duration_days": 6, "notes": "Legal documentation and final due diligence. UCC filings prepared, custody arrangements confirmed.", "actions": ["Loan docs prepared", "UCC filings", "Custodian setup", "Final compliance check"]},
    {"stage": "funded", "day": 21, "duration_days": 0, "notes": "Successfully funded! $12.75M facility closed. First advance drawn same day.", "actions": ["Funds wired", "Facility activated", "Ongoing reporting setup"]}
  ]'::jsonb,
  ARRAY['Having documents prepared before applying significantly accelerates the timeline', 'Strong portfolio metrics (low defaults, reasonable LTV) attract better terms', 'Minor concentration issues can be worked around with proper explanation', 'Responsive communication throughout the process builds partner confidence'],
  true,
  10
WHERE NOT EXISTS (SELECT 1 FROM deal_flow_examples WHERE title = 'Real Estate Portfolio Fast Track');

-- Example 2: Consumer Lending Scale-Up
INSERT INTO deal_flow_examples (title, deal_type, description, timeline_days, stages, lessons_learned, is_published, display_order)
SELECT
  'Consumer Lending Scale-Up',
  'Consumer Lending',
  'A growing consumer lender seeking $8M to expand their personal loan portfolio. Required additional documentation and credit enhancement, but ultimately secured favorable terms.',
  42,
  '[
    {"stage": "qualified", "day": 1, "duration_days": 2, "notes": "Application reviewed. Promising growth metrics but limited track record (14 months). Assigned for enhanced due diligence.", "actions": ["Application reviewed", "Growth trajectory analyzed", "Enhanced DD flagged"]},
    {"stage": "documents_requested", "day": 3, "duration_days": 8, "notes": "Extended document list required due to shorter track record. Client needed time to compile historical servicing data.", "actions": ["Loan tape formatting", "Credit policy documentation", "Collections procedures", "State licensing verification"]},
    {"stage": "under_review", "day": 11, "duration_days": 14, "notes": "Thorough portfolio analysis. AI scoring identified strong cash flows but flagged 6.2% 30-day delinquency. Additional data requested on recovery rates.", "actions": ["Portfolio scored: 74/100", "Cash flow analysis", "Delinquency deep dive", "Recovery rate verification"]},
    {"stage": "term_sheet", "day": 25, "duration_days": 7, "notes": "Term sheet received with credit enhancement requirement (10% reserve account). After negotiation, reduced to 7.5% reserve with performance triggers.", "actions": ["Initial terms reviewed", "Reserve negotiation", "Performance covenants discussed", "Final terms agreed"]},
    {"stage": "closing", "day": 32, "duration_days": 9, "notes": "Complex legal structure required for consumer receivables. State-by-state compliance verified.", "actions": ["Legal structuring", "State compliance", "Backup servicer identified", "Insurance requirements"]},
    {"stage": "funded", "day": 42, "duration_days": 0, "notes": "Facility closed at $7.5M with path to $12M upon meeting performance benchmarks. Reserve funded on day one.", "actions": ["Initial funding", "Reserve account funded", "Reporting systems connected"]}
  ]'::jsonb,
  ARRAY['Shorter track records require more extensive documentation - prepare accordingly', 'Credit enhancements (reserves, guarantees) can bridge the gap for newer originators', 'Clear communication about delinquency causes and mitigation strategies is essential', 'Performance-based facility increases incentivize good portfolio management', 'Consumer lending requires careful attention to state-by-state licensing compliance'],
  true,
  20
WHERE NOT EXISTS (SELECT 1 FROM deal_flow_examples WHERE title = 'Consumer Lending Scale-Up');

-- Example 3: Equipment Finance Turnaround
INSERT INTO deal_flow_examples (title, deal_type, description, timeline_days, stages, lessons_learned, is_published, display_order)
SELECT
  'Equipment Finance Turnaround',
  'Equipment Finance',
  'An equipment finance company with a $22M portfolio of construction and medical equipment leases. Initial challenges with documentation quality were resolved through a structured remediation process.',
  56,
  '[
    {"stage": "qualified", "day": 1, "duration_days": 2, "notes": "Strong equipment mix and low loss history. However, initial document submission was incomplete with formatting issues.", "actions": ["Application approved", "Document quality concerns noted", "Remediation guidance provided"]},
    {"stage": "documents_requested", "day": 3, "duration_days": 14, "notes": "Significant document remediation required. Loan tape needed reformatting, several equipment appraisals were outdated.", "actions": ["Loan tape restructured", "Updated appraisals ordered", "UCC filing audit", "Title verification"]},
    {"stage": "under_review", "day": 17, "duration_days": 18, "notes": "Extended review due to equipment diversity. Individual asset valuations required for high-value items. Portfolio scored B+ with strong fundamentals.", "actions": ["Portfolio scored: 79/100", "Equipment depreciation analysis", "Lessee credit review", "Residual value assessment"]},
    {"stage": "term_sheet", "day": 35, "duration_days": 8, "notes": "Multiple term sheets received. Selected partner offering best advance rates on medical equipment (higher residuals).", "actions": ["Three term sheets compared", "Partner selection", "Terms negotiation", "Advance rate optimization"]},
    {"stage": "closing", "day": 43, "duration_days": 12, "notes": "Complex closing due to equipment across 12 states. Title transfers and UCC amendments processed.", "actions": ["Multi-state UCC filings", "Equipment inspection", "Insurance verification", "Servicing agreement"]},
    {"stage": "funded", "day": 56, "duration_days": 0, "notes": "Successfully funded $18.7M facility. Advance rates: 85% medical, 75% construction. Additional $5M accordion available.", "actions": ["Funding completed", "Equipment tracking system linked", "Quarterly reporting established"]}
  ]'::jsonb,
  ARRAY['Document quality issues early add weeks to timeline - invest in proper formatting upfront', 'Equipment portfolios with diverse asset types may require specialized valuation', 'Medical equipment typically commands better advance rates due to stable residual values', 'Multi-state operations require careful UCC filing coordination', 'Having multiple interested partners provides negotiating leverage'],
  true,
  30
WHERE NOT EXISTS (SELECT 1 FROM deal_flow_examples WHERE title = 'Equipment Finance Turnaround');

-- Example 4: Declined Deal - Learning Scenario
INSERT INTO deal_flow_examples (title, deal_type, description, timeline_days, stages, lessons_learned, is_published, display_order)
SELECT
  'When Deals Don''t Close: A Case Study',
  'Mixed Asset',
  'A mixed asset portfolio that was ultimately declined due to concentration risk and documentation gaps. Understanding why deals don''t close helps originators prepare better applications.',
  28,
  '[
    {"stage": "qualified", "day": 1, "duration_days": 2, "notes": "Initial application showed $10M portfolio with mix of real estate and business loans. Flagged for concentration review - 52% exposure to single industry (hospitality).", "actions": ["Application reviewed", "Concentration flag raised", "Conditional approval to proceed"]},
    {"stage": "documents_requested", "day": 3, "duration_days": 7, "notes": "Document collection started. Multiple requests for missing items: incomplete loan files, missing appraisals, outdated financials.", "actions": ["Partial documents received", "Gap analysis sent", "Follow-up requests", "Extended deadline granted"]},
    {"stage": "under_review", "day": 10, "duration_days": 12, "notes": "Due diligence revealed additional concerns: 8.5% default rate (above threshold), several loans missing proper collateral documentation.", "actions": ["Portfolio scored: 58/100", "Collateral gaps identified", "Default analysis", "Hospitality sector review"]},
    {"stage": "declined", "day": 22, "duration_days": 6, "notes": "After partner review, deal was declined. Primary reasons: (1) Concentration exceeds 40% threshold, (2) Default rate above 5% limit, (3) Incomplete collateral documentation on 15% of portfolio.", "actions": ["Partner feedback collected", "Decline reasons documented", "Remediation path outlined", "Reapplication guidance provided"]}
  ]'::jsonb,
  ARRAY['Industry concentration above 40% is a common red flag - diversification is key', 'Default rates above 5% typically require significant credit enhancement or portfolio carve-outs', 'Every loan in the portfolio needs complete documentation - partial files create uncertainty', 'Declined deals often have a path to approval: this originator was invited to reapply after addressing concentration and documentation', 'Early identification of issues (during qualification) allows time for remediation before full review'],
  true,
  40
WHERE NOT EXISTS (SELECT 1 FROM deal_flow_examples WHERE title LIKE 'When Deals Don%');

SELECT COUNT(*) as examples_count, 'Deal flow examples seeded successfully!' as status FROM deal_flow_examples;`
  },
  {
    id: 'ai-scoring-system',
    name: 'AI Scoring System',
    description: 'Portfolio assessments, loan tape data, and performance history tables for AI-powered scoring',
    status: 'pending',
    sql: `-- ============================================
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

  -- Scoring Status
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN (
    'incomplete',
    'processing',
    'preliminary',
    'complete',
    'error'
  )),

  -- Key Metrics (JSONB for flexibility)
  metrics JSONB,
  scores JSONB,

  -- AI-Generated Content
  summary TEXT,
  strengths JSONB,
  concerns JSONB,
  recommendations JSONB,
  red_flags JSONB,

  -- Tokenization Readiness
  tokenization_readiness TEXT CHECK (tokenization_readiness IN ('ready', 'conditional', 'not_ready')),
  ready_percentage DECIMAL(5, 2),
  conditional_percentage DECIMAL(5, 2),
  not_ready_percentage DECIMAL(5, 2),
  estimated_timeline TEXT,

  -- Metadata
  parse_errors JSONB,
  parse_warnings JSONB,
  user_inputs JSONB,
  has_ai_analysis BOOLEAN DEFAULT FALSE,

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

-- ============================================
-- LOAN TAPE DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.loan_tape_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES public.portfolio_assessments(id) ON DELETE CASCADE NOT NULL,

  loan_id TEXT NOT NULL,
  borrower_name TEXT,
  original_balance DECIMAL(15, 2),
  current_balance DECIMAL(15, 2),
  interest_rate DECIMAL(5, 3),
  origination_date DATE,
  maturity_date DATE,
  term_months INTEGER,
  payment_status TEXT CHECK (payment_status IN ('current', '30_day', '60_day', '90_day', 'default', 'paid_off')),
  property_type TEXT,
  property_state TEXT,
  property_city TEXT,
  property_value DECIMAL(15, 2),
  original_ltv DECIMAL(5, 2),
  current_ltv DECIMAL(5, 2),
  dscr DECIMAL(5, 2),
  lien_position TEXT,
  appraisal_date DATE,
  loan_purpose TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.loan_tape_data ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_loan_tape_assessment ON public.loan_tape_data(assessment_id);

CREATE POLICY "Admins can manage all loan data" ON public.loan_tape_data
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- PERFORMANCE HISTORY DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.performance_history_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES public.portfolio_assessments(id) ON DELETE CASCADE NOT NULL,

  period_month DATE NOT NULL,
  portfolio_balance DECIMAL(15, 2),
  loan_count INTEGER,
  current_pct DECIMAL(5, 2),
  delinquent_30_pct DECIMAL(5, 2),
  delinquent_60_pct DECIMAL(5, 2),
  delinquent_90_pct DECIMAL(5, 2),
  default_pct DECIMAL(5, 2),
  prepayments DECIMAL(15, 2),
  new_originations DECIMAL(15, 2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.performance_history_data ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_perf_history_assessment ON public.performance_history_data(assessment_id);

CREATE POLICY "Admins can manage all performance data" ON public.performance_history_data
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

SELECT 'AI Scoring System tables created!' as status;`
  },
  {
    id: 'score-history',
    name: 'Score History Tracking',
    description: 'Track score changes over time for audit and trending',
    status: 'pending',
    sql: `-- ============================================
-- SCORE HISTORY TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS public.score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  assessment_id UUID REFERENCES public.portfolio_assessments(id) ON DELETE CASCADE,

  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  letter_grade TEXT,

  portfolio_performance_score INTEGER,
  cash_flow_quality_score INTEGER,
  documentation_score INTEGER,
  collateral_coverage_score INTEGER,
  diversification_score INTEGER,
  regulatory_readiness_score INTEGER,

  tokenization_readiness TEXT CHECK (tokenization_readiness IN ('ready', 'conditional', 'not_ready')),
  ready_percentage DECIMAL(5, 2),

  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'initial',
    'document_update',
    'manual_reassess',
    'scheduled'
  )),
  trigger_description TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_score_history_deal ON public.score_history(deal_id);
CREATE INDEX idx_score_history_created ON public.score_history(deal_id, created_at DESC);

CREATE POLICY "Admins can manage all score history" ON public.score_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

SELECT 'Score History table created!' as status;`
  },
  {
    id: 'terms-acknowledgement',
    name: 'Legal Terms Acknowledgement System',
    description: 'Versioned legal documents and user acceptance tracking for compliance',
    status: 'pending',
    sql: `-- ============================================
-- LEGAL TERMS ACKNOWLEDGEMENT SYSTEM
-- Capital Qualifier
-- ============================================

-- ============================================
-- TERMS DOCUMENTS TABLE
-- Versioned legal documents for user acceptance
-- ============================================
CREATE TABLE IF NOT EXISTS public.terms_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Document Type & Version
  document_type TEXT NOT NULL CHECK (document_type IN (
    'platform_tos',           -- Platform Terms of Service (signup)
    'originator_agreement',   -- Originator Agreement (first offering)
    'offering_certification', -- Offering Certification (each deal submission)
    'partner_network_agreement', -- Partner Network Agreement (partner onboarding)
    'deal_confidentiality'    -- Deal Confidentiality/NDA (express interest)
  )),
  version TEXT NOT NULL,      -- e.g., '1.0', '1.1', '2.0'
  effective_date DATE NOT NULL,

  -- Content
  title TEXT NOT NULL,
  summary TEXT,               -- Brief description shown before full text
  content TEXT NOT NULL,      -- Full text (markdown supported)

  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT false, -- Only one active per type
  requires_scroll BOOLEAN NOT NULL DEFAULT true, -- Must scroll to bottom before accepting

  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: only one active document per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_terms_documents_active_type
  ON public.terms_documents(document_type) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.terms_documents ENABLE ROW LEVEL SECURITY;

-- Everyone can read active terms documents
CREATE POLICY "Anyone can read active terms" ON public.terms_documents
  FOR SELECT USING (is_active = true);

-- Admins can manage terms documents
CREATE POLICY "Admins can manage terms documents" ON public.terms_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================
-- TERMS ACKNOWLEDGEMENTS TABLE
-- Records of user acceptance with context
-- ============================================
CREATE TABLE IF NOT EXISTS public.terms_acknowledgements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User & Document
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  terms_document_id UUID REFERENCES public.terms_documents(id) ON DELETE RESTRICT NOT NULL,

  -- Context: When/why was this accepted?
  context_type TEXT NOT NULL CHECK (context_type IN (
    'signup',              -- Account creation (ToS)
    'first_offering',      -- First offering submission (Originator Agreement)
    'offering_submission', -- Each deal submission (Offering Certification)
    'partner_onboarding',  -- Partner profile access (Partner Network Agreement)
    'deal_interest'        -- Express interest in deal (Deal Confidentiality)
  )),
  context_entity_id UUID,  -- deal_id, partner_id, or null depending on context

  -- Acknowledgement Details
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,

  -- Explicit Confirmation
  checkbox_confirmed BOOLEAN NOT NULL DEFAULT false,
  scrolled_to_bottom BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.terms_acknowledgements ENABLE ROW LEVEL SECURITY;

-- Users can view their own acknowledgements
CREATE POLICY "Users can view own acknowledgements" ON public.terms_acknowledgements
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own acknowledgements
CREATE POLICY "Users can create acknowledgements" ON public.terms_acknowledgements
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all acknowledgements
CREATE POLICY "Admins can view all acknowledgements" ON public.terms_acknowledgements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_terms_documents_type ON public.terms_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_terms_documents_active ON public.terms_documents(is_active);

CREATE INDEX IF NOT EXISTS idx_terms_ack_user ON public.terms_acknowledgements(user_id);
CREATE INDEX IF NOT EXISTS idx_terms_ack_document ON public.terms_acknowledgements(terms_document_id);
CREATE INDEX IF NOT EXISTS idx_terms_ack_context ON public.terms_acknowledgements(context_type);
CREATE INDEX IF NOT EXISTS idx_terms_ack_entity ON public.terms_acknowledgements(context_entity_id);
CREATE INDEX IF NOT EXISTS idx_terms_ack_user_document ON public.terms_acknowledgements(user_id, terms_document_id);


-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE TRIGGER update_terms_documents_updated_at
  BEFORE UPDATE ON public.terms_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================
-- HELPER FUNCTION: Check if user has accepted terms
-- ============================================
CREATE OR REPLACE FUNCTION public.has_accepted_terms(
  p_user_id UUID,
  p_document_type TEXT,
  p_context_entity_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_accepted BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.terms_acknowledgements ta
    JOIN public.terms_documents td ON ta.terms_document_id = td.id
    WHERE ta.user_id = p_user_id
      AND td.document_type = p_document_type
      AND td.is_active = true
      AND (
        p_context_entity_id IS NULL
        OR ta.context_entity_id = p_context_entity_id
      )
  ) INTO v_has_accepted;

  RETURN v_has_accepted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- HELPER FUNCTION: Get active terms document
-- ============================================
CREATE OR REPLACE FUNCTION public.get_active_terms(
  p_document_type TEXT
)
RETURNS TABLE (
  id UUID,
  document_type TEXT,
  version TEXT,
  effective_date DATE,
  title TEXT,
  summary TEXT,
  content TEXT,
  requires_scroll BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    td.id,
    td.document_type,
    td.version,
    td.effective_date,
    td.title,
    td.summary,
    td.content,
    td.requires_scroll
  FROM public.terms_documents td
  WHERE td.document_type = p_document_type
    AND td.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- GRANT EXECUTE ON FUNCTIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.has_accepted_terms(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_terms(TEXT) TO authenticated;

SELECT 'Terms acknowledgement tables created!' as status;`
  },
  {
    id: 'terms-seed-data',
    name: 'Legal Terms Seed Data',
    description: 'Initial legal documents: Platform ToS, Originator Agreement, Offering Certification, Partner Network Agreement, Deal Confidentiality',
    status: 'pending',
    sql: `-- ============================================
-- SEED DATA: Initial Terms Documents
-- Run this AFTER the terms-acknowledgement migration
-- ============================================

-- 1. Platform Terms of Service
INSERT INTO public.terms_documents (
  document_type, version, effective_date, title, summary, content, is_active, requires_scroll
) VALUES (
  'platform_tos',
  '1.0',
  '2026-01-01',
  'Platform Terms of Service',
  'These terms govern your use of the Capital Qualifier platform.',
  '# Platform Terms of Service

**Effective Date:** January 1, 2026

## 1. Acceptance of Terms

By accessing or using the Capital Qualifier platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform.

## 2. Eligibility

You must be at least 18 years old and have the legal capacity to enter into binding contracts to use this Platform. By using the Platform, you represent and warrant that you meet these requirements.

## 3. Account Registration

To access certain features of the Platform, you must register for an account. You agree to:
- Provide accurate, current, and complete information during registration
- Maintain and promptly update your account information
- Maintain the security and confidentiality of your login credentials
- Accept responsibility for all activities under your account
- Notify us immediately of any unauthorized use of your account

## 4. Platform Services

Capital Qualifier provides a platform for:
- Submitting funding applications for capital raising
- Connecting with institutional funding partners
- Managing deal documentation and compliance
- Facilitating due diligence processes

## 5. User Conduct

You agree not to:
- Use the Platform for any unlawful purpose
- Submit false, misleading, or fraudulent information
- Interfere with or disrupt the Platform''s operation
- Attempt to gain unauthorized access to any systems
- Violate any applicable securities laws or regulations

## 6. Intellectual Property

All content on the Platform, including text, graphics, logos, and software, is the property of Capital Qualifier or its licensors and is protected by intellectual property laws.

## 7. Privacy

Your use of the Platform is subject to our Privacy Policy. By using the Platform, you consent to our collection and use of information as described in the Privacy Policy.

## 8. Disclaimers

THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. CAPITAL QUALIFIER DOES NOT GUARANTEE:
- The accuracy or completeness of any information on the Platform
- That the Platform will be uninterrupted or error-free
- Any particular outcome from using the Platform

## 9. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, CAPITAL QUALIFIER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM.

## 10. Governing Law

These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions.

## 11. Contact Information

For questions about these Terms, please contact us at admin@bitcense.com.',
  true,
  true
) ON CONFLICT DO NOTHING;

-- 2. Originator Agreement
INSERT INTO public.terms_documents (
  document_type, version, effective_date, title, summary, content, is_active, requires_scroll
) VALUES (
  'originator_agreement',
  '1.0',
  '2026-01-01',
  'Originator Agreement',
  'Agreement governing your rights and obligations as a deal originator on the platform.',
  '# Originator Agreement

**Effective Date:** January 1, 2026

This Originator Agreement ("Agreement") is entered into between you ("Originator") and Capital Qualifier, Inc. ("Company").

## 1. Purpose

This Agreement governs your submission of funding applications and deal information through the Capital Qualifier platform for the purpose of connecting with institutional funding partners.

## 2. Representations and Warranties

By submitting any funding application or deal information, you represent and warrant that:

### 2.1 Authority
- You have full authority to submit the application on behalf of the entity seeking funding
- You are authorized to share the information provided with potential funding partners
- You have obtained all necessary consents from your organization

### 2.2 Accuracy
- All information provided is accurate, complete, and not misleading
- All financial data and projections are based on reasonable assumptions
- You have disclosed all material facts relevant to the funding request

### 2.3 Compliance
- The funding request does not violate any applicable laws or regulations
- The underlying business operations are lawful and properly licensed
- You are not subject to any restrictions that would prevent the transaction

## 3. Authorization to Share Information

You hereby authorize Capital Qualifier to:
- Share your application and deal information with selected funding partners
- Conduct or facilitate due diligence investigations
- Verify the information you have provided
- Store and process your information in accordance with our Privacy Policy

## 4. No Guarantee of Funding

You acknowledge and agree that:
- Submission of an application does not guarantee funding
- Capital Qualifier does not guarantee any particular outcome
- Funding decisions are made solely by the funding partners
- Capital Qualifier acts only as a facilitator, not a lender or investor

## 5. Governing Law

This Agreement shall be governed by the laws of the State of Delaware.

By checking the box below, you acknowledge that you have read, understood, and agree to be bound by this Originator Agreement.',
  true,
  true
) ON CONFLICT DO NOTHING;

-- 3. Offering Certification
INSERT INTO public.terms_documents (
  document_type, version, effective_date, title, summary, content, is_active, requires_scroll
) VALUES (
  'offering_certification',
  '1.0',
  '2026-01-01',
  'Offering Certification',
  'Certification of accuracy and authority for this specific offering submission.',
  '# Offering Certification

**Effective Date:** January 1, 2026

## Certification Statement

I hereby certify the following with respect to this funding application submission:

## 1. Accuracy of Information

I certify that all information provided in this application, including but not limited to:
- Business and financial information
- Asset descriptions and valuations
- Revenue and expense data
- Ownership and organizational structure
- Outstanding obligations and liabilities

is true, accurate, complete, and not misleading in any material respect as of the date of submission.

## 2. Authority

I certify that I have the full legal authority to:
- Submit this application on behalf of the entity seeking funding
- Bind the entity to the terms and conditions of this submission
- Share the information provided with Capital Qualifier and its funding partners
- Make the representations and warranties contained herein

## 3. Material Changes

I agree to promptly notify Capital Qualifier of any material changes to the information provided in this application.

## 4. Acknowledgment of Consequences

I understand that:
- This certification may be relied upon by Capital Qualifier and funding partners
- Any material misrepresentation may result in rejection of this application
- False statements may result in legal liability and potential criminal penalties

By checking the box below, I certify under penalty of perjury that the foregoing statements are true and correct.',
  true,
  false
) ON CONFLICT DO NOTHING;

-- 4. Partner Network Agreement
INSERT INTO public.terms_documents (
  document_type, version, effective_date, title, summary, content, is_active, requires_scroll
) VALUES (
  'partner_network_agreement',
  '1.0',
  '2026-01-01',
  'Partner Network Agreement',
  'Agreement governing your participation in the Capital Qualifier funding partner network.',
  '# Partner Network Agreement

**Effective Date:** January 1, 2026

This Partner Network Agreement ("Agreement") governs your participation as a funding partner in the Capital Qualifier network.

## 1. Partner Network Overview

The Capital Qualifier Partner Network connects institutional funding sources with qualified deal opportunities. As a partner, you will have access to curated funding applications and deal information.

## 2. Confidentiality Obligations

### 2.1 Confidential Information
You agree to maintain strict confidentiality regarding all deal information, applications, and materials ("Confidential Information") received through the Platform.

### 2.2 Non-Disclosure
You agree not to disclose Confidential Information to any third party without prior written consent from Capital Qualifier or the originator''s express authorization.

## 3. Non-Circumvention

You agree not to directly or indirectly circumvent Capital Qualifier by:
- Contacting originators outside the Platform without authorization
- Structuring transactions to avoid Platform involvement
- Soliciting originators for direct relationships

This non-circumvention obligation shall survive for a period of two (2) years.

## 4. Compliance Requirements

You represent and warrant that:
- You are properly licensed and authorized to participate in funding activities
- You comply with all applicable securities laws and regulations
- You maintain appropriate compliance programs and controls

## 5. Governing Law

This Agreement shall be governed by Delaware law. Disputes shall be resolved through binding arbitration.

By checking the box below, you acknowledge that you have read, understood, and agree to be bound by this Partner Network Agreement.',
  true,
  true
) ON CONFLICT DO NOTHING;

-- 5. Deal Confidentiality Agreement
INSERT INTO public.terms_documents (
  document_type, version, effective_date, title, summary, content, is_active, requires_scroll
) VALUES (
  'deal_confidentiality',
  '1.0',
  '2026-01-01',
  'Deal Confidentiality Agreement',
  'Non-disclosure agreement for accessing confidential deal information.',
  '# Deal Confidentiality Agreement

**Effective Date:** January 1, 2026

This Deal Confidentiality Agreement ("Agreement") is entered into in connection with your review of the confidential deal information identified below.

## 1. Purpose

You are being provided access to confidential information regarding a potential funding opportunity ("Deal") for the sole purpose of evaluating whether to provide funding or investment.

## 2. Confidential Information

"Confidential Information" includes all information provided to you regarding the Deal, including but not limited to:
- Business plans and financial projections
- Historical financial statements and data
- Asset information and valuations
- Customer and vendor information
- Any other non-public information regarding the Deal

## 3. Obligations

### 3.1 Non-Disclosure
You agree to:
- Keep all Confidential Information strictly confidential
- Not disclose Confidential Information to any third party without prior written consent
- Not use Confidential Information for any purpose other than evaluating the Deal

### 3.2 Standard of Care
You shall protect Confidential Information using the same degree of care used to protect your own confidential information.

## 4. Duration

The confidentiality obligations under this Agreement shall continue for a period of two (2) years from the date of disclosure.

## 5. Remedies

You acknowledge that breach of this Agreement may cause irreparable harm. Therefore, the aggrieved party shall be entitled to seek equitable relief, including injunction and specific performance.

## 6. Governing Law

This Agreement shall be governed by the laws of the State of Delaware.

By checking the box below, you acknowledge and agree that you have read and understood this Agreement and agree to be bound by its terms.',
  true,
  true
) ON CONFLICT DO NOTHING;

SELECT 'Legal terms seed data inserted!' as status, COUNT(*) as documents_count FROM public.terms_documents;`
  }
]

export default function MigrationsPage() {
  const [expandedMigration, setExpandedMigration] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = async (sql: string, id: string) => {
    await navigator.clipboard.writeText(sql)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 3000)
  }

  const completedCount = MIGRATIONS.filter(m => m.status === 'completed').length
  const pendingCount = MIGRATIONS.filter(m => m.status === 'pending').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Database className="w-7 h-7 text-purple-600" />
            Database Migrations
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage database schema migrations
          </p>
        </div>
        <a
          href="https://supabase.com/dashboard/project/_/sql/new"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
        >
          <ExternalLink className="w-5 h-5" />
          Open SQL Editor
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{MIGRATIONS.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Migrations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Migrations List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {MIGRATIONS.map(migration => (
            <div key={migration.id}>
              <div
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                onClick={() => setExpandedMigration(
                  expandedMigration === migration.id ? null : migration.id
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    migration.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : migration.status === 'pending'
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {migration.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : migration.status === 'pending' ? (
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {migration.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {migration.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {migration.completedAt && (
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      {migration.completedAt}
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    migration.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : migration.status === 'pending'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {migration.status.charAt(0).toUpperCase() + migration.status.slice(1)}
                  </span>
                  {migration.sql && (
                    expandedMigration === migration.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )
                  )}
                </div>
              </div>

              {/* Expanded SQL */}
              {expandedMigration === migration.id && migration.sql && (
                <div className="px-4 pb-4">
                  <div className="bg-gray-900 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                      <span className="text-sm text-gray-400">SQL Migration</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(migration.sql!, migration.id)
                        }}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedId === migration.id ? (
                          <>
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy SQL
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 text-sm text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
                      {migration.sql}
                    </pre>
                  </div>
                  {migration.status === 'pending' && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      Copy the SQL above and run it in the Supabase SQL Editor
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Running Migrations</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>Click on a pending migration to expand its SQL</li>
          <li>Click "Copy SQL" to copy the migration script</li>
          <li>Open the Supabase SQL Editor using the button above</li>
          <li>Paste and run the SQL</li>
          <li>Refresh this page to see updated status</li>
        </ol>
      </div>
    </div>
  )
}

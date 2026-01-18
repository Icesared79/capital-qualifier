-- Migration: Business Profile + Funding Applications Model
-- Run this in Supabase SQL Editor after the initial schema

-- ============================================
-- COMPANIES TABLE UPDATES (Business Profile)
-- ============================================

-- Add new columns for business profile
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS assets TEXT[],
ADD COLUMN IF NOT EXISTS asset_details JSONB,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Update type check to be more flexible
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_type_check;
ALTER TABLE public.companies ADD CONSTRAINT companies_type_check
  CHECK (type IN ('originator', 'borrower', 'business'));

-- ============================================
-- DEALS TABLE UPDATES (Funding Applications)
-- ============================================

-- Add columns to turn deals into funding applications
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS capital_amount TEXT,
ADD COLUMN IF NOT EXISTS funding_purpose TEXT,
ADD COLUMN IF NOT EXISTS qualification_data JSONB,
ADD COLUMN IF NOT EXISTS qualification_score TEXT,
ADD COLUMN IF NOT EXISTS overall_score INTEGER,
ADD COLUMN IF NOT EXISTS capital_fits JSONB,
ADD COLUMN IF NOT EXISTS recommended_structure TEXT,
ADD COLUMN IF NOT EXISTS opportunity_size TEXT,
ADD COLUMN IF NOT EXISTS time_to_funding TEXT,
ADD COLUMN IF NOT EXISTS strengths TEXT[],
ADD COLUMN IF NOT EXISTS considerations TEXT[],
ADD COLUMN IF NOT EXISTS next_steps TEXT[];

-- Add check constraint for qualification_score on deals
ALTER TABLE public.deals ADD CONSTRAINT deals_qualification_score_check
  CHECK (qualification_score IS NULL OR qualification_score IN ('strong', 'moderate', 'needs_discussion'));

-- Add stage 'draft' for in-progress applications
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_stage_check;
ALTER TABLE public.deals ADD CONSTRAINT deals_stage_check
  CHECK (stage IN (
    'draft',
    'qualified',
    'documents_requested',
    'documents_in_review',
    'due_diligence',
    'term_sheet',
    'negotiation',
    'closing',
    'funded',
    'declined',
    'withdrawn'
  ));

-- ============================================
-- POLICIES FOR NEW FUNCTIONALITY
-- ============================================

-- Allow users to insert their own deals (funding applications)
DROP POLICY IF EXISTS "Users can insert own deals" ON public.deals;
CREATE POLICY "Users can insert own deals" ON public.deals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
  );

-- Allow users to update their own deals
DROP POLICY IF EXISTS "Users can update own deals" ON public.deals;
CREATE POLICY "Users can update own deals" ON public.deals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN public.companies.assets IS 'Array of asset types: loan_portfolio, real_estate, equipment, receivables, cash_flow, other';
COMMENT ON COLUMN public.companies.asset_details IS 'JSON with details per asset type, e.g. {loanPortfolio: {assetClasses: [...], volume: "..."}}';
COMMENT ON COLUMN public.companies.business_type IS 'Type of business: loan_originator, real_estate_investor, operating_business, etc.';
COMMENT ON COLUMN public.deals.capital_amount IS 'Requested funding amount range';
COMMENT ON COLUMN public.deals.funding_purpose IS 'Purpose of the funding request';
COMMENT ON COLUMN public.deals.qualification_data IS 'Application-specific qualification responses';

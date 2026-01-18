-- ============================================
-- LEGAL & SPV FEE STRUCTURE
-- Fee catalog and deal-specific fee tracking
-- BitCense Capital Qualifier
-- ============================================

-- ============================================
-- LEGAL FEE CATALOG
-- Predefined services that legal partners can add to deals
-- ============================================

CREATE TABLE IF NOT EXISTS public.legal_fee_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  fee_type TEXT NOT NULL DEFAULT 'flat' CHECK (fee_type IN ('flat', 'hourly', 'percentage', 'annual')),
  category TEXT NOT NULL DEFAULT 'legal' CHECK (category IN ('legal', 'spv', 'maintenance', 'custom')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active fees
CREATE INDEX IF NOT EXISTS idx_legal_fee_catalog_active ON public.legal_fee_catalog(is_active, category);

-- ============================================
-- DEAL LEGAL FEES
-- Fees assigned to specific deals
-- ============================================

CREATE TABLE IF NOT EXISTS public.deal_legal_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  fee_catalog_id UUID REFERENCES public.legal_fee_catalog(id),

  -- Fee details (copied from catalog or custom)
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  fee_type TEXT NOT NULL DEFAULT 'flat' CHECK (fee_type IN ('flat', 'hourly', 'percentage', 'annual')),
  category TEXT NOT NULL DEFAULT 'legal' CHECK (category IN ('legal', 'spv', 'maintenance', 'custom')),

  -- For hourly fees
  hours DECIMAL(5,2),
  hourly_rate DECIMAL(10,2),

  -- For percentage fees
  percentage_rate DECIMAL(5,4),
  percentage_base TEXT, -- what the percentage is calculated on

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'waived')),

  -- Audit trail
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  invoiced_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  waived_at TIMESTAMPTZ,
  waived_reason TEXT,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deal_legal_fees_deal ON public.deal_legal_fees(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_legal_fees_status ON public.deal_legal_fees(status);

-- ============================================
-- SEED DATA - Standard Legal & SPV Services
-- ============================================

INSERT INTO public.legal_fee_catalog (name, description, base_amount, fee_type, category, display_order) VALUES
-- Legal Services
('Document Review', 'Comprehensive review of all deal documentation including loan agreements, security documents, and compliance materials', 2500.00, 'flat', 'legal', 10),
('Compliance Review', 'Regulatory compliance assessment and verification', 1500.00, 'flat', 'legal', 20),
('Securities Opinion Letter', 'Legal opinion letter for securities compliance and exemption verification', 7500.00, 'flat', 'legal', 30),
('Contract Drafting', 'Custom contract drafting and negotiation support', 450.00, 'hourly', 'legal', 40),
('Due Diligence Support', 'Legal due diligence investigation and reporting', 3500.00, 'flat', 'legal', 50),
('Closing Coordination', 'Transaction closing management and document execution', 2000.00, 'flat', 'legal', 60),
('UCC Filing & Searches', 'UCC-1 filing preparation and lien searches', 750.00, 'flat', 'legal', 70),

-- SPV Formation
('SPV Formation (Delaware LLC)', 'Formation of Delaware Limited Liability Company for deal structure', 5000.00, 'flat', 'spv', 100),
('SPV Formation (Wyoming LLC)', 'Formation of Wyoming Limited Liability Company for deal structure', 4500.00, 'flat', 'spv', 110),
('SPV Formation (Nevada LLC)', 'Formation of Nevada Limited Liability Company for deal structure', 4750.00, 'flat', 'spv', 120),
('Operating Agreement Drafting', 'Custom LLC operating agreement tailored to deal requirements', 3000.00, 'flat', 'spv', 130),
('State Filing Fees', 'State government filing and registration fees', 500.00, 'flat', 'spv', 140),
('Registered Agent (Annual)', 'Registered agent service for SPV entity', 300.00, 'annual', 'spv', 150),
('EIN Application', 'Federal Employer Identification Number application and filing', 250.00, 'flat', 'spv', 160),
('Bank Account Setup', 'Business bank account establishment and documentation', 500.00, 'flat', 'spv', 170),

-- Ongoing Maintenance
('Annual Compliance Filing', 'Annual state compliance filings and reports', 750.00, 'annual', 'maintenance', 200),
('SPV Tax Preparation', 'Annual tax return preparation for SPV entity', 1500.00, 'annual', 'maintenance', 210),
('Corporate Maintenance', 'Ongoing corporate record maintenance and updates', 1000.00, 'annual', 'maintenance', 220),
('Franchise Tax Payment', 'Annual state franchise tax payment processing', 400.00, 'annual', 'maintenance', 230)

ON CONFLICT DO NOTHING;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.legal_fee_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_legal_fees ENABLE ROW LEVEL SECURITY;

-- Fee catalog is readable by all authenticated users
CREATE POLICY "Fee catalog readable by authenticated users"
  ON public.legal_fee_catalog FOR SELECT
  TO authenticated
  USING (true);

-- Deal fees - admins and legal partners can manage
CREATE POLICY "Deal fees viewable by deal stakeholders"
  ON public.deal_legal_fees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'legal')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.companies c ON d.company_id = c.id
      WHERE d.id = deal_legal_fees.deal_id
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Deal fees manageable by admins and legal"
  ON public.deal_legal_fees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'legal')
    )
  );

-- ============================================
-- HELPER FUNCTION: Calculate deal total fees
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_deal_legal_fees(p_deal_id UUID)
RETURNS TABLE (
  total_amount DECIMAL(10,2),
  pending_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  fee_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(dlf.amount), 0)::DECIMAL(10,2) as total_amount,
    COALESCE(SUM(CASE WHEN dlf.status IN ('pending', 'invoiced') THEN dlf.amount ELSE 0 END), 0)::DECIMAL(10,2) as pending_amount,
    COALESCE(SUM(CASE WHEN dlf.status = 'paid' THEN dlf.amount ELSE 0 END), 0)::DECIMAL(10,2) as paid_amount,
    COUNT(*)::INTEGER as fee_count
  FROM public.deal_legal_fees dlf
  WHERE dlf.deal_id = p_deal_id
  AND dlf.status != 'waived';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

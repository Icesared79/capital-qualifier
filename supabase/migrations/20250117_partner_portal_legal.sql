-- ============================================
-- PARTNER PORTAL & LEGAL TRACKING SYSTEM
-- BitCense Capital Qualifier
-- ============================================

-- ============================================
-- FUNDING PARTNERS TABLE
-- Organizations like Optima that receive deal packages
-- ============================================
CREATE TABLE IF NOT EXISTS public.funding_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- e.g., 'optima', 'partner-a'
  description TEXT,
  logo_url TEXT,
  website TEXT,

  -- Contact
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,

  -- Partner Type & Focus
  partner_type TEXT NOT NULL DEFAULT 'institutional' CHECK (partner_type IN (
    'institutional',      -- Large institutional investors
    'family_office',      -- Family offices
    'private_credit',     -- Private credit funds
    'hedge_fund',         -- Hedge funds
    'bank',               -- Banks/traditional lenders
    'other'
  )),

  -- Investment Focus
  focus_asset_classes TEXT[], -- e.g., ['residential_re', 'consumer_loans', 'smb']
  min_deal_size TEXT,         -- e.g., '$1M'
  max_deal_size TEXT,         -- e.g., '$50M'
  geographic_focus TEXT[],    -- e.g., ['US', 'North America']

  -- Capabilities
  can_tokenize BOOLEAN DEFAULT false,
  has_legal_team BOOLEAN DEFAULT false,
  provides_spv_formation BOOLEAN DEFAULT false,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.funding_partners ENABLE ROW LEVEL SECURITY;

-- Admins can manage funding partners
CREATE POLICY "Admins can manage funding partners" ON public.funding_partners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Partners can view their own record
CREATE POLICY "Partners can view own record" ON public.funding_partners
  FOR SELECT USING (
    slug = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );


-- ============================================
-- DEAL RELEASES TABLE
-- Tracks which deals are released to which partners
-- ============================================
CREATE TABLE IF NOT EXISTS public.deal_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES public.funding_partners(id) ON DELETE CASCADE NOT NULL,

  -- Release Info
  released_by UUID REFERENCES public.profiles(id) NOT NULL,
  released_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  release_notes TEXT, -- Internal notes about why this partner

  -- Access Level
  access_level TEXT NOT NULL DEFAULT 'summary' CHECK (access_level IN (
    'summary',     -- Can only see executive summary
    'full',        -- Full access to all deal data
    'documents'    -- Full access including document downloads
  )),

  -- Partner Response Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',          -- Released but not yet viewed
    'viewed',           -- Partner has viewed the summary
    'interested',       -- Partner expressed interest (unlocks full access)
    'reviewing',        -- Partner is reviewing full package
    'due_diligence',    -- Partner doing their own DD
    'term_sheet',       -- Partner preparing/sent term sheet
    'passed',           -- Partner declined
    'funded'            -- Deal funded by this partner
  )),

  -- Timestamps
  first_viewed_at TIMESTAMPTZ,
  interest_expressed_at TIMESTAMPTZ,
  passed_at TIMESTAMPTZ,
  pass_reason TEXT,

  -- Partner Notes
  partner_notes TEXT, -- Notes from partner about the deal

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one release per deal-partner combo
  UNIQUE(deal_id, partner_id)
);

-- Enable RLS
ALTER TABLE public.deal_releases ENABLE ROW LEVEL SECURITY;

-- Admins can manage all releases
CREATE POLICY "Admins can manage deal releases" ON public.deal_releases
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Partners can view/update releases to them
CREATE POLICY "Partners can view their releases" ON public.deal_releases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.funding_partners fp
      WHERE fp.id = partner_id
      AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Partners can update their releases" ON public.deal_releases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.funding_partners fp
      WHERE fp.id = partner_id
      AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())
    )
  );


-- ============================================
-- PARTNER ACCESS LOGS TABLE
-- Audit trail of partner activity
-- ============================================
CREATE TABLE IF NOT EXISTS public.partner_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  partner_id UUID REFERENCES public.funding_partners(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id), -- If logged in user

  -- Action
  action TEXT NOT NULL CHECK (action IN (
    'viewed_summary',
    'viewed_full',
    'downloaded_package',
    'downloaded_document',
    'expressed_interest',
    'passed',
    'submitted_term_sheet',
    'added_note'
  )),

  -- Details
  details JSONB, -- Additional context (e.g., which document downloaded)
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.partner_access_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view access logs" ON public.partner_access_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================
-- LEGAL STRUCTURES TABLE
-- Tracks legal/tokenization structure for deals
-- ============================================
CREATE TABLE IF NOT EXISTS public.legal_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Reference
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Overall Status
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started',
    'spv_formation',
    'securities_filing',
    'documentation',
    'tokenization',
    'complete',
    'on_hold'
  )),

  -- ============================================
  -- SPV INFORMATION (BitCense typically manages)
  -- ============================================
  spv_name TEXT,
  spv_entity_type TEXT CHECK (spv_entity_type IN (
    'delaware_llc',
    'delaware_lp',
    'delaware_corp',
    'cayman_fund',
    'bvi_company',
    'other'
  )),
  spv_jurisdiction TEXT,
  spv_formation_date DATE,
  spv_ein TEXT,
  spv_registered_agent TEXT,
  spv_status TEXT DEFAULT 'pending' CHECK (spv_status IN (
    'pending', 'forming', 'formed', 'active', 'dissolved'
  )),
  spv_owner TEXT DEFAULT 'bitcense', -- Who is managing SPV formation

  -- ============================================
  -- SECURITIES COMPLIANCE (Optima legal typically manages)
  -- ============================================
  exemption_type TEXT CHECK (exemption_type IN (
    'reg_d_506b',     -- Reg D 506(b) - no general solicitation
    'reg_d_506c',     -- Reg D 506(c) - accredited only, can advertise
    'reg_a_tier1',    -- Reg A+ Tier 1 - up to $20M
    'reg_a_tier2',    -- Reg A+ Tier 2 - up to $75M
    'reg_s',          -- Reg S - non-US only
    'reg_cf',         -- Reg CF - crowdfunding up to $5M
    'reg_d_504',      -- Reg D 504 - up to $10M
    'other'
  )),
  offering_amount DECIMAL(15,2),
  min_investment DECIMAL(15,2),
  max_investors INTEGER,

  -- Filing Status
  sec_filing_status TEXT DEFAULT 'not_filed' CHECK (sec_filing_status IN (
    'not_filed', 'preparing', 'filed', 'approved', 'rejected', 'amended'
  )),
  sec_filing_date DATE,
  sec_file_number TEXT,
  sec_owner TEXT DEFAULT 'optima', -- Who is managing SEC filing

  -- Blue Sky (State Filings)
  blue_sky_required BOOLEAN DEFAULT false,
  blue_sky_states TEXT[], -- States where filing needed
  blue_sky_status TEXT DEFAULT 'not_started' CHECK (blue_sky_status IN (
    'not_started', 'in_progress', 'complete', 'not_required'
  )),

  -- ============================================
  -- OFFERING DOCUMENTS (Optima legal typically manages)
  -- ============================================
  ppm_status TEXT DEFAULT 'not_started' CHECK (ppm_status IN (
    'not_started', 'drafting', 'review', 'final', 'amended'
  )),
  ppm_version TEXT,
  ppm_last_updated TIMESTAMPTZ,

  subscription_agreement_status TEXT DEFAULT 'not_started' CHECK (subscription_agreement_status IN (
    'not_started', 'drafting', 'review', 'final'
  )),

  operating_agreement_status TEXT DEFAULT 'not_started' CHECK (operating_agreement_status IN (
    'not_started', 'drafting', 'review', 'final'
  )),

  docs_owner TEXT DEFAULT 'optima', -- Who is managing offering docs

  -- ============================================
  -- TOKENIZATION (Optima manages)
  -- ============================================
  token_standard TEXT CHECK (token_standard IN (
    'erc1400',        -- Security Token Standard
    'erc3643',        -- T-REX (regulated token)
    'erc20',          -- Basic (less common for securities)
    'st20',           -- Polymath
    'other'
  )),
  blockchain TEXT CHECK (blockchain IN (
    'ethereum', 'polygon', 'avalanche', 'solana', 'stellar', 'other'
  )),
  token_name TEXT,
  token_symbol TEXT,
  contract_address TEXT,
  deployment_date DATE,

  -- Transfer Restrictions
  transfer_restrictions JSONB, -- e.g., {accredited_only: true, holding_period_days: 365}
  whitelist_enabled BOOLEAN DEFAULT true,

  token_status TEXT DEFAULT 'not_started' CHECK (token_status IN (
    'not_started', 'designing', 'development', 'testing', 'auditing', 'deployed', 'active'
  )),
  token_owner TEXT DEFAULT 'optima', -- Who is managing tokenization

  -- ============================================
  -- COMPLIANCE & SERVICE PROVIDERS
  -- ============================================
  kyc_provider TEXT,           -- e.g., 'Jumio', 'Onfido', 'Synaps'
  aml_provider TEXT,
  transfer_agent TEXT,         -- e.g., 'Securitize', 'Vertalo'
  cap_table_provider TEXT,
  audit_firm TEXT,
  audit_status TEXT DEFAULT 'not_started' CHECK (audit_status IN (
    'not_started', 'in_progress', 'complete', 'not_required'
  )),

  -- ============================================
  -- TIMELINE & METADATA
  -- ============================================
  target_close_date DATE,
  actual_close_date DATE,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.legal_structures ENABLE ROW LEVEL SECURITY;

-- Admins can manage all legal structures
CREATE POLICY "Admins can manage legal structures" ON public.legal_structures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Partners can view legal structures for deals released to them
CREATE POLICY "Partners can view legal structures" ON public.legal_structures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deal_releases dr
      JOIN public.funding_partners fp ON dr.partner_id = fp.id
      WHERE dr.deal_id = legal_structures.deal_id
      AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())
      AND dr.access_level IN ('full', 'documents')
    )
  );

-- Optima role can update legal structures
CREATE POLICY "Optima can update legal structures" ON public.legal_structures
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'optima')
  );


-- ============================================
-- LEGAL CHECKLIST ITEMS TABLE
-- Flexible checklist that varies by exemption type
-- ============================================
CREATE TABLE IF NOT EXISTS public.legal_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Reference
  legal_structure_id UUID REFERENCES public.legal_structures(id) ON DELETE CASCADE NOT NULL,

  -- Item Details
  category TEXT NOT NULL CHECK (category IN (
    'spv',           -- SPV formation tasks
    'securities',    -- SEC/regulatory filings
    'offering_docs', -- PPM, subscription agreements
    'token',         -- Smart contract, deployment
    'compliance',    -- KYC, AML, ongoing compliance
    'closing'        -- Final closing items
  )),
  item_name TEXT NOT NULL,
  description TEXT,

  -- Ownership
  owner TEXT NOT NULL DEFAULT 'bitcense' CHECK (owner IN ('bitcense', 'optima', 'shared', 'client')),
  assigned_to UUID REFERENCES public.profiles(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Not started
    'in_progress',  -- Being worked on
    'blocked',      -- Waiting on something
    'review',       -- Needs review/approval
    'complete'      -- Done
  )),
  blocked_reason TEXT,

  -- Timing
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),

  -- Order
  sort_order INTEGER DEFAULT 0,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.legal_checklist_items ENABLE ROW LEVEL SECURITY;

-- Admins can manage checklist items
CREATE POLICY "Admins can manage checklist items" ON public.legal_checklist_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Optima can manage checklist items
CREATE POLICY "Optima can manage checklist items" ON public.legal_checklist_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'optima')
  );


-- ============================================
-- LEGAL DOCUMENTS TABLE
-- Documents specific to legal/tokenization process
-- ============================================
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Reference
  legal_structure_id UUID REFERENCES public.legal_structures(id) ON DELETE CASCADE NOT NULL,

  -- Document Info
  document_type TEXT NOT NULL CHECK (document_type IN (
    -- SPV Docs
    'articles_of_organization',
    'operating_agreement',
    'certificate_of_formation',
    'ein_confirmation',
    'registered_agent_agreement',

    -- Securities Filings
    'form_d',
    'form_d_amendment',
    'reg_a_filing',
    'blue_sky_filing',

    -- Offering Docs
    'ppm',
    'ppm_supplement',
    'subscription_agreement',
    'investor_questionnaire',
    'side_letter',

    -- Token Docs
    'token_whitepaper',
    'smart_contract_audit',
    'security_audit',

    -- Other
    'legal_opinion',
    'board_resolution',
    'other'
  )),
  name TEXT NOT NULL,
  description TEXT,

  -- File
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,

  -- Version Control
  version TEXT DEFAULT '1.0',
  is_current BOOLEAN DEFAULT true,
  previous_version_id UUID REFERENCES public.legal_documents(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'review', 'approved', 'final', 'superseded'
  )),

  -- Upload Info
  uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Approval
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,

  -- Access Control
  visibility TEXT DEFAULT 'internal' CHECK (visibility IN (
    'internal',   -- BitCense team only
    'partner',    -- Visible to funding partners
    'investor',   -- Visible to end investors (future)
    'public'      -- Publicly accessible
  )),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Admins can manage all legal documents
CREATE POLICY "Admins can manage legal documents" ON public.legal_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Optima can manage legal documents
CREATE POLICY "Optima can manage legal documents" ON public.legal_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'optima')
  );

-- Partners can view partner-visible documents
CREATE POLICY "Partners can view legal documents" ON public.legal_documents
  FOR SELECT USING (
    visibility IN ('partner', 'public')
    AND EXISTS (
      SELECT 1 FROM public.legal_structures ls
      JOIN public.deal_releases dr ON dr.deal_id = ls.deal_id
      JOIN public.funding_partners fp ON dr.partner_id = fp.id
      WHERE ls.id = legal_documents.legal_structure_id
      AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())
    )
  );


-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_funding_partners_slug ON public.funding_partners(slug);
CREATE INDEX IF NOT EXISTS idx_funding_partners_status ON public.funding_partners(status);

CREATE INDEX IF NOT EXISTS idx_deal_releases_deal ON public.deal_releases(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_releases_partner ON public.deal_releases(partner_id);
CREATE INDEX IF NOT EXISTS idx_deal_releases_status ON public.deal_releases(status);

CREATE INDEX IF NOT EXISTS idx_partner_access_logs_partner ON public.partner_access_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_access_logs_deal ON public.partner_access_logs(deal_id);

CREATE INDEX IF NOT EXISTS idx_legal_structures_deal ON public.legal_structures(deal_id);
CREATE INDEX IF NOT EXISTS idx_legal_structures_status ON public.legal_structures(status);

CREATE INDEX IF NOT EXISTS idx_legal_checklist_structure ON public.legal_checklist_items(legal_structure_id);
CREATE INDEX IF NOT EXISTS idx_legal_checklist_status ON public.legal_checklist_items(status);

CREATE INDEX IF NOT EXISTS idx_legal_documents_structure ON public.legal_documents(legal_structure_id);


-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE TRIGGER update_funding_partners_updated_at
  BEFORE UPDATE ON public.funding_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_deal_releases_updated_at
  BEFORE UPDATE ON public.deal_releases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_legal_structures_updated_at
  BEFORE UPDATE ON public.legal_structures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_legal_checklist_updated_at
  BEFORE UPDATE ON public.legal_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================
-- SEED DATA: Add Optima as first funding partner
-- ============================================
INSERT INTO public.funding_partners (
  name,
  slug,
  description,
  partner_type,
  focus_asset_classes,
  can_tokenize,
  has_legal_team,
  provides_spv_formation,
  status
) VALUES (
  'Optima Financial',
  'optima',
  'Institutional investment platform specializing in tokenized private credit',
  'institutional',
  ARRAY['residential_re', 'commercial_re', 'consumer_loans', 'smb_loans'],
  true,
  true,
  false,
  'active'
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  can_tokenize = EXCLUDED.can_tokenize,
  has_legal_team = EXCLUDED.has_legal_team;


-- ============================================
-- HELPER FUNCTION: Create default legal checklist for a deal
-- ============================================
CREATE OR REPLACE FUNCTION create_default_legal_checklist(
  p_legal_structure_id UUID,
  p_exemption_type TEXT DEFAULT 'reg_d_506c'
)
RETURNS void AS $$
BEGIN
  -- SPV Formation Items (BitCense)
  INSERT INTO public.legal_checklist_items (legal_structure_id, category, item_name, owner, sort_order)
  VALUES
    (p_legal_structure_id, 'spv', 'Form SPV entity', 'bitcense', 1),
    (p_legal_structure_id, 'spv', 'Draft Operating Agreement', 'bitcense', 2),
    (p_legal_structure_id, 'spv', 'Obtain EIN', 'bitcense', 3),
    (p_legal_structure_id, 'spv', 'Set up registered agent', 'bitcense', 4),
    (p_legal_structure_id, 'spv', 'Open bank account', 'bitcense', 5);

  -- Securities Filing Items (Optima)
  INSERT INTO public.legal_checklist_items (legal_structure_id, category, item_name, owner, sort_order)
  VALUES
    (p_legal_structure_id, 'securities', 'Determine exemption type', 'shared', 10),
    (p_legal_structure_id, 'securities', 'Prepare Form D', 'optima', 11),
    (p_legal_structure_id, 'securities', 'File Form D with SEC', 'optima', 12),
    (p_legal_structure_id, 'securities', 'Blue Sky state filings', 'optima', 13);

  -- Offering Docs Items (Optima)
  INSERT INTO public.legal_checklist_items (legal_structure_id, category, item_name, owner, sort_order)
  VALUES
    (p_legal_structure_id, 'offering_docs', 'Draft PPM', 'optima', 20),
    (p_legal_structure_id, 'offering_docs', 'Legal review of PPM', 'optima', 21),
    (p_legal_structure_id, 'offering_docs', 'Finalize PPM', 'optima', 22),
    (p_legal_structure_id, 'offering_docs', 'Prepare Subscription Agreement', 'optima', 23),
    (p_legal_structure_id, 'offering_docs', 'Prepare Investor Questionnaire', 'optima', 24);

  -- Token Items (Optima)
  INSERT INTO public.legal_checklist_items (legal_structure_id, category, item_name, owner, sort_order)
  VALUES
    (p_legal_structure_id, 'token', 'Design token structure', 'optima', 30),
    (p_legal_structure_id, 'token', 'Develop smart contract', 'optima', 31),
    (p_legal_structure_id, 'token', 'Smart contract audit', 'optima', 32),
    (p_legal_structure_id, 'token', 'Configure transfer restrictions', 'optima', 33),
    (p_legal_structure_id, 'token', 'Deploy to mainnet', 'optima', 34);

  -- Compliance Items (Shared)
  INSERT INTO public.legal_checklist_items (legal_structure_id, category, item_name, owner, sort_order)
  VALUES
    (p_legal_structure_id, 'compliance', 'Set up KYC/AML provider', 'optima', 40),
    (p_legal_structure_id, 'compliance', 'Configure investor whitelist', 'optima', 41),
    (p_legal_structure_id, 'compliance', 'Establish reporting procedures', 'shared', 42);

  -- Closing Items
  INSERT INTO public.legal_checklist_items (legal_structure_id, category, item_name, owner, sort_order)
  VALUES
    (p_legal_structure_id, 'closing', 'Final legal review', 'optima', 50),
    (p_legal_structure_id, 'closing', 'Board/manager approval', 'bitcense', 51),
    (p_legal_structure_id, 'closing', 'Closing documentation', 'shared', 52);

END;
$$ LANGUAGE plpgsql;

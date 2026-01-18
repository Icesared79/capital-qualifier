import { NextResponse } from 'next/server'

// This endpoint executes the partner portal migration using Supabase's SQL API
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Migration SQL - broken into individual statements for execution
  const statements = [
    // Enable UUID extension if not exists
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

    // FUNDING PARTNERS TABLE
    `CREATE TABLE IF NOT EXISTS public.funding_partners (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      logo_url TEXT,
      website TEXT,
      primary_contact_name TEXT,
      primary_contact_email TEXT,
      primary_contact_phone TEXT,
      partner_type TEXT NOT NULL DEFAULT 'institutional' CHECK (partner_type IN (
        'institutional', 'family_office', 'private_credit', 'hedge_fund', 'bank', 'other'
      )),
      focus_asset_classes TEXT[],
      min_deal_size TEXT,
      max_deal_size TEXT,
      geographic_focus TEXT[],
      can_tokenize BOOLEAN DEFAULT false,
      has_legal_team BOOLEAN DEFAULT false,
      provides_spv_formation BOOLEAN DEFAULT false,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    // DEAL RELEASES TABLE
    `CREATE TABLE IF NOT EXISTS public.deal_releases (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
      partner_id UUID REFERENCES public.funding_partners(id) ON DELETE CASCADE NOT NULL,
      released_by UUID REFERENCES public.profiles(id) NOT NULL,
      released_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      release_notes TEXT,
      access_level TEXT NOT NULL DEFAULT 'summary' CHECK (access_level IN ('summary', 'full', 'documents')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'viewed', 'interested', 'reviewing', 'due_diligence', 'term_sheet', 'passed', 'funded'
      )),
      first_viewed_at TIMESTAMPTZ,
      interest_expressed_at TIMESTAMPTZ,
      passed_at TIMESTAMPTZ,
      pass_reason TEXT,
      partner_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(deal_id, partner_id)
    )`,

    // PARTNER ACCESS LOGS TABLE
    `CREATE TABLE IF NOT EXISTS public.partner_access_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      partner_id UUID REFERENCES public.funding_partners(id) ON DELETE CASCADE NOT NULL,
      deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES public.profiles(id),
      action TEXT NOT NULL CHECK (action IN (
        'viewed_summary', 'viewed_full', 'downloaded_package', 'downloaded_document',
        'expressed_interest', 'passed', 'submitted_term_sheet', 'added_note'
      )),
      details JSONB,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    // LEGAL STRUCTURES TABLE
    `CREATE TABLE IF NOT EXISTS public.legal_structures (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
        'not_started', 'spv_formation', 'securities_filing', 'documentation', 'tokenization', 'complete', 'on_hold'
      )),
      spv_name TEXT,
      spv_entity_type TEXT CHECK (spv_entity_type IN (
        'delaware_llc', 'delaware_lp', 'delaware_corp', 'cayman_fund', 'bvi_company', 'other'
      )),
      spv_jurisdiction TEXT,
      spv_formation_date DATE,
      spv_ein TEXT,
      spv_registered_agent TEXT,
      spv_status TEXT DEFAULT 'pending' CHECK (spv_status IN ('pending', 'forming', 'formed', 'active', 'dissolved')),
      spv_owner TEXT DEFAULT 'bitcense',
      exemption_type TEXT CHECK (exemption_type IN (
        'reg_d_506b', 'reg_d_506c', 'reg_a_tier1', 'reg_a_tier2', 'reg_s', 'reg_cf', 'reg_d_504', 'other'
      )),
      offering_amount DECIMAL(15,2),
      min_investment DECIMAL(15,2),
      max_investors INTEGER,
      sec_filing_status TEXT DEFAULT 'not_filed' CHECK (sec_filing_status IN (
        'not_filed', 'preparing', 'filed', 'approved', 'rejected', 'amended'
      )),
      sec_filing_date DATE,
      sec_file_number TEXT,
      sec_owner TEXT DEFAULT 'optima',
      blue_sky_required BOOLEAN DEFAULT false,
      blue_sky_states TEXT[],
      blue_sky_status TEXT DEFAULT 'not_started' CHECK (blue_sky_status IN ('not_started', 'in_progress', 'complete', 'not_required')),
      ppm_status TEXT DEFAULT 'not_started' CHECK (ppm_status IN ('not_started', 'drafting', 'review', 'final', 'amended')),
      ppm_version TEXT,
      ppm_last_updated TIMESTAMPTZ,
      subscription_agreement_status TEXT DEFAULT 'not_started' CHECK (subscription_agreement_status IN ('not_started', 'drafting', 'review', 'final')),
      operating_agreement_status TEXT DEFAULT 'not_started' CHECK (operating_agreement_status IN ('not_started', 'drafting', 'review', 'final')),
      docs_owner TEXT DEFAULT 'optima',
      token_standard TEXT CHECK (token_standard IN ('erc1400', 'erc3643', 'erc20', 'st20', 'other')),
      blockchain TEXT CHECK (blockchain IN ('ethereum', 'polygon', 'avalanche', 'solana', 'stellar', 'other')),
      token_name TEXT,
      token_symbol TEXT,
      contract_address TEXT,
      deployment_date DATE,
      transfer_restrictions JSONB,
      whitelist_enabled BOOLEAN DEFAULT true,
      token_status TEXT DEFAULT 'not_started' CHECK (token_status IN (
        'not_started', 'designing', 'development', 'testing', 'auditing', 'deployed', 'active'
      )),
      token_owner TEXT DEFAULT 'optima',
      kyc_provider TEXT,
      aml_provider TEXT,
      transfer_agent TEXT,
      cap_table_provider TEXT,
      audit_firm TEXT,
      audit_status TEXT DEFAULT 'not_started' CHECK (audit_status IN ('not_started', 'in_progress', 'complete', 'not_required')),
      target_close_date DATE,
      actual_close_date DATE,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    // LEGAL CHECKLIST ITEMS TABLE
    `CREATE TABLE IF NOT EXISTS public.legal_checklist_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      legal_structure_id UUID REFERENCES public.legal_structures(id) ON DELETE CASCADE NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('spv', 'securities', 'offering_docs', 'token', 'compliance', 'closing')),
      item_name TEXT NOT NULL,
      description TEXT,
      owner TEXT NOT NULL DEFAULT 'bitcense' CHECK (owner IN ('bitcense', 'optima', 'shared', 'client')),
      assigned_to UUID REFERENCES public.profiles(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'blocked', 'review', 'complete')),
      blocked_reason TEXT,
      due_date DATE,
      completed_at TIMESTAMPTZ,
      completed_by UUID REFERENCES public.profiles(id),
      sort_order INTEGER DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    // LEGAL DOCUMENTS TABLE
    `CREATE TABLE IF NOT EXISTS public.legal_documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      legal_structure_id UUID REFERENCES public.legal_structures(id) ON DELETE CASCADE NOT NULL,
      document_type TEXT NOT NULL CHECK (document_type IN (
        'articles_of_organization', 'operating_agreement', 'certificate_of_formation', 'ein_confirmation',
        'registered_agent_agreement', 'form_d', 'form_d_amendment', 'reg_a_filing', 'blue_sky_filing',
        'ppm', 'ppm_supplement', 'subscription_agreement', 'investor_questionnaire', 'side_letter',
        'token_whitepaper', 'smart_contract_audit', 'security_audit', 'legal_opinion', 'board_resolution', 'other'
      )),
      name TEXT NOT NULL,
      description TEXT,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      version TEXT DEFAULT '1.0',
      is_current BOOLEAN DEFAULT true,
      previous_version_id UUID REFERENCES public.legal_documents(id),
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'final', 'superseded')),
      uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approved_by UUID REFERENCES public.profiles(id),
      approved_at TIMESTAMPTZ,
      visibility TEXT DEFAULT 'internal' CHECK (visibility IN ('internal', 'partner', 'investor', 'public')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  ]

  const rlsPolicies = [
    // Enable RLS on all tables
    `ALTER TABLE public.funding_partners ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.deal_releases ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.partner_access_logs ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.legal_structures ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.legal_checklist_items ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY`,

    // Funding partners policies
    `DROP POLICY IF EXISTS "Admins can manage funding partners" ON public.funding_partners`,
    `CREATE POLICY "Admins can manage funding partners" ON public.funding_partners FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
    `DROP POLICY IF EXISTS "Partners can view own record" ON public.funding_partners`,
    `CREATE POLICY "Partners can view own record" ON public.funding_partners FOR SELECT USING (slug = (SELECT role FROM public.profiles WHERE id = auth.uid()))`,

    // Deal releases policies
    `DROP POLICY IF EXISTS "Admins can manage deal releases" ON public.deal_releases`,
    `CREATE POLICY "Admins can manage deal releases" ON public.deal_releases FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
    `DROP POLICY IF EXISTS "Partners can view their releases" ON public.deal_releases`,
    `CREATE POLICY "Partners can view their releases" ON public.deal_releases FOR SELECT USING (EXISTS (SELECT 1 FROM public.funding_partners fp WHERE fp.id = partner_id AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())))`,
    `DROP POLICY IF EXISTS "Partners can update their releases" ON public.deal_releases`,
    `CREATE POLICY "Partners can update their releases" ON public.deal_releases FOR UPDATE USING (EXISTS (SELECT 1 FROM public.funding_partners fp WHERE fp.id = partner_id AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())))`,

    // Partner access logs policies
    `DROP POLICY IF EXISTS "Admins can view access logs" ON public.partner_access_logs`,
    `CREATE POLICY "Admins can view access logs" ON public.partner_access_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,

    // Legal structures policies
    `DROP POLICY IF EXISTS "Admins can manage legal structures" ON public.legal_structures`,
    `CREATE POLICY "Admins can manage legal structures" ON public.legal_structures FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
    `DROP POLICY IF EXISTS "Optima can update legal structures" ON public.legal_structures`,
    `CREATE POLICY "Optima can update legal structures" ON public.legal_structures FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'optima'))`,

    // Legal checklist policies
    `DROP POLICY IF EXISTS "Admins can manage checklist items" ON public.legal_checklist_items`,
    `CREATE POLICY "Admins can manage checklist items" ON public.legal_checklist_items FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
    `DROP POLICY IF EXISTS "Optima can manage checklist items" ON public.legal_checklist_items`,
    `CREATE POLICY "Optima can manage checklist items" ON public.legal_checklist_items FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'optima'))`,

    // Legal documents policies
    `DROP POLICY IF EXISTS "Admins can manage legal documents" ON public.legal_documents`,
    `CREATE POLICY "Admins can manage legal documents" ON public.legal_documents FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
    `DROP POLICY IF EXISTS "Optima can manage legal documents" ON public.legal_documents`,
    `CREATE POLICY "Optima can manage legal documents" ON public.legal_documents FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'optima'))`,
  ]

  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_funding_partners_slug ON public.funding_partners(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_funding_partners_status ON public.funding_partners(status)`,
    `CREATE INDEX IF NOT EXISTS idx_deal_releases_deal ON public.deal_releases(deal_id)`,
    `CREATE INDEX IF NOT EXISTS idx_deal_releases_partner ON public.deal_releases(partner_id)`,
    `CREATE INDEX IF NOT EXISTS idx_deal_releases_status ON public.deal_releases(status)`,
    `CREATE INDEX IF NOT EXISTS idx_partner_access_logs_partner ON public.partner_access_logs(partner_id)`,
    `CREATE INDEX IF NOT EXISTS idx_partner_access_logs_deal ON public.partner_access_logs(deal_id)`,
    `CREATE INDEX IF NOT EXISTS idx_legal_structures_deal ON public.legal_structures(deal_id)`,
    `CREATE INDEX IF NOT EXISTS idx_legal_structures_status ON public.legal_structures(status)`,
    `CREATE INDEX IF NOT EXISTS idx_legal_checklist_structure ON public.legal_checklist_items(legal_structure_id)`,
    `CREATE INDEX IF NOT EXISTS idx_legal_checklist_status ON public.legal_checklist_items(status)`,
    `CREATE INDEX IF NOT EXISTS idx_legal_documents_structure ON public.legal_documents(legal_structure_id)`,
  ]

  const seedData = `
    INSERT INTO public.funding_partners (
      name, slug, description, partner_type, focus_asset_classes,
      can_tokenize, has_legal_team, provides_spv_formation, status
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
      has_legal_team = EXCLUDED.has_legal_team
  `

  const results: { step: string; success: boolean; error?: string }[] = []

  // Helper to execute SQL via Supabase SQL API
  async function executeSQL(sql: string, stepName: string): Promise<boolean> {
    try {
      // Use the Supabase PostgreSQL connection via REST API with pg_query
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({})
      })

      // Since RPC won't work for DDL, we need a different approach
      // Let's use the pg package via a serverless function or check if tables exist
      results.push({ step: stepName, success: false, error: 'DDL not supported via REST API' })
      return false
    } catch (error: any) {
      results.push({ step: stepName, success: false, error: error.message })
      return false
    }
  }

  // Since Supabase REST API doesn't support DDL, provide the SQL for manual execution
  const fullMigrationSQL = [...statements, ...rlsPolicies, ...indexes, seedData].join(';\n\n')

  return NextResponse.json({
    message: 'Migration SQL prepared. Copy and run in Supabase SQL Editor.',
    instructions: [
      '1. Go to: https://supabase.com/dashboard/project/gwrpijvfxjppncpmamfp/sql',
      '2. Create a "New query"',
      '3. Paste the SQL below',
      '4. Click "Run"'
    ],
    sqlEditorUrl: 'https://supabase.com/dashboard/project/gwrpijvfxjppncpmamfp/sql/new',
    note: 'After running the migration, your partner portal will be ready at /dashboard/partner',
    sql: fullMigrationSQL
  })
}

export async function POST() {
  return GET()
}

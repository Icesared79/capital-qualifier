'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SetupMigrationPage() {
  const [status, setStatus] = useState<'checking' | 'needed' | 'complete' | 'error'>('checking')
  const [copied, setCopied] = useState(false)
  const [tablesExist, setTablesExist] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  const migrationSQL = `-- ============================================
-- PARTNER PORTAL & LEGAL TRACKING SYSTEM
-- BitCense Capital Qualifier
-- Run this in Supabase SQL Editor
-- ============================================

-- FUNDING PARTNERS TABLE
CREATE TABLE IF NOT EXISTS public.funding_partners (
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
);

-- DEAL RELEASES TABLE
CREATE TABLE IF NOT EXISTS public.deal_releases (
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
);

-- PARTNER ACCESS LOGS TABLE
CREATE TABLE IF NOT EXISTS public.partner_access_logs (
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
);

-- LEGAL STRUCTURES TABLE
CREATE TABLE IF NOT EXISTS public.legal_structures (
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
);

-- LEGAL CHECKLIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.legal_checklist_items (
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
);

-- LEGAL DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.legal_documents (
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
);

-- Enable RLS
ALTER TABLE public.funding_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for funding_partners
DROP POLICY IF EXISTS "Admins can manage funding partners" ON public.funding_partners;
CREATE POLICY "Admins can manage funding partners" ON public.funding_partners FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Partners can view own record" ON public.funding_partners;
CREATE POLICY "Partners can view own record" ON public.funding_partners FOR SELECT USING (slug = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- RLS Policies for deal_releases
DROP POLICY IF EXISTS "Admins can manage deal releases" ON public.deal_releases;
CREATE POLICY "Admins can manage deal releases" ON public.deal_releases FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Partners can view their releases" ON public.deal_releases;
CREATE POLICY "Partners can view their releases" ON public.deal_releases FOR SELECT USING (EXISTS (SELECT 1 FROM public.funding_partners fp WHERE fp.id = partner_id AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())));
DROP POLICY IF EXISTS "Partners can update their releases" ON public.deal_releases;
CREATE POLICY "Partners can update their releases" ON public.deal_releases FOR UPDATE USING (EXISTS (SELECT 1 FROM public.funding_partners fp WHERE fp.id = partner_id AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())));

-- RLS Policies for partner_access_logs
DROP POLICY IF EXISTS "Admins can view access logs" ON public.partner_access_logs;
CREATE POLICY "Admins can view access logs" ON public.partner_access_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for legal_structures
DROP POLICY IF EXISTS "Admins can manage legal structures" ON public.legal_structures;
CREATE POLICY "Admins can manage legal structures" ON public.legal_structures FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Optima can update legal structures" ON public.legal_structures;
CREATE POLICY "Optima can update legal structures" ON public.legal_structures FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'optima'));

-- RLS Policies for legal_checklist_items
DROP POLICY IF EXISTS "Admins can manage checklist items" ON public.legal_checklist_items;
CREATE POLICY "Admins can manage checklist items" ON public.legal_checklist_items FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Optima can manage checklist items" ON public.legal_checklist_items;
CREATE POLICY "Optima can manage checklist items" ON public.legal_checklist_items FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'optima'));

-- RLS Policies for legal_documents
DROP POLICY IF EXISTS "Admins can manage legal documents" ON public.legal_documents;
CREATE POLICY "Admins can manage legal documents" ON public.legal_documents FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Optima can manage legal documents" ON public.legal_documents;
CREATE POLICY "Optima can manage legal documents" ON public.legal_documents FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'optima'));

-- Indexes
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

-- Seed Optima as first funding partner
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
  has_legal_team = EXCLUDED.has_legal_team;

-- Update triggers (if update_updated_at function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    CREATE TRIGGER IF NOT EXISTS update_funding_partners_updated_at
      BEFORE UPDATE ON public.funding_partners
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

    CREATE TRIGGER IF NOT EXISTS update_deal_releases_updated_at
      BEFORE UPDATE ON public.deal_releases
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

    CREATE TRIGGER IF NOT EXISTS update_legal_structures_updated_at
      BEFORE UPDATE ON public.legal_structures
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;`

  useEffect(() => {
    checkMigrationStatus()
  }, [])

  async function checkMigrationStatus() {
    const tables = ['funding_partners', 'deal_releases', 'partner_access_logs', 'legal_structures']
    const results: Record<string, boolean> = {}

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('id').limit(1)
      // Table exists if no error, or if we get data back
      // PGRST205 = table not in schema cache (doesn't exist)
      // 42P01 = PostgreSQL undefined_table
      const tableExists = !error && data !== null
      results[table] = tableExists
    }

    setTablesExist(results)

    const allExist = Object.values(results).every(Boolean)
    setStatus(allExist ? 'complete' : 'needed')
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(migrationSQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Partner Portal Migration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Set up the database tables for the Partner Portal and Legal Tracking system.
          </p>

          {/* Status */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Migration Status
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(tablesExist).map(([table, exists]) => (
                <div
                  key={table}
                  className={`p-4 rounded-xl border-2 ${
                    exists
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {exists ? (
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`font-mono text-sm ${exists ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {table}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {status === 'complete' ? (
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">
                Migration Complete!
              </h3>
              <p className="text-green-700 dark:text-green-400 mb-4">
                All tables are set up. You can now use the Partner Portal.
              </p>
              <a
                href="/dashboard/admin/deals"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-colors"
              >
                Go to Admin Dashboard
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-2">
                  Migration Required
                </h3>
                <p className="text-amber-700 dark:text-amber-400 mb-4">
                  Follow these steps to complete the setup:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-amber-700 dark:text-amber-400">
                  <li>Click the button below to copy the migration SQL</li>
                  <li>Click "Open SQL Editor" to open Supabase</li>
                  <li>Paste the SQL and click "Run"</li>
                  <li>Come back here and refresh to verify</li>
                </ol>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={copyToClipboard}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-colors ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Migration SQL
                    </>
                  )}
                </button>

                <a
                  href="https://supabase.com/dashboard/project/gwrpijvfxjppncpmamfp/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open SQL Editor
                </a>
              </div>

              <button
                onClick={checkMigrationStatus}
                className="w-full px-6 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 transition-colors"
              >
                Refresh Status
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

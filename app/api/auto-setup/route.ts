import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const MIGRATION_SQL = `
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

-- PARTNER NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.partner_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES public.funding_partners(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_asset_classes TEXT[],
  min_deal_size TEXT,
  max_deal_size TEXT,
  preferred_geographies TEXT[],
  min_score INTEGER,
  email_alerts_enabled BOOLEAN DEFAULT true,
  email_frequency TEXT DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily_digest', 'weekly_digest', 'off')),
  in_app_alerts_enabled BOOLEAN DEFAULT true,
  notification_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`

const RLS_POLICIES_SQL = `
-- Enable RLS on all tables
ALTER TABLE public.funding_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Funding partners policies
DROP POLICY IF EXISTS "Admins can manage funding partners" ON public.funding_partners;
CREATE POLICY "Admins can manage funding partners" ON public.funding_partners FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Partners can view own record" ON public.funding_partners;
CREATE POLICY "Partners can view own record" ON public.funding_partners FOR SELECT USING (slug = (SELECT role FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "Service role full access funding_partners" ON public.funding_partners;
CREATE POLICY "Service role full access funding_partners" ON public.funding_partners FOR ALL USING (true);

-- Deal releases policies
DROP POLICY IF EXISTS "Admins can manage deal releases" ON public.deal_releases;
CREATE POLICY "Admins can manage deal releases" ON public.deal_releases FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Partners can view their releases" ON public.deal_releases;
CREATE POLICY "Partners can view their releases" ON public.deal_releases FOR SELECT USING (EXISTS (SELECT 1 FROM public.funding_partners fp WHERE fp.id = partner_id AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())));
DROP POLICY IF EXISTS "Service role full access deal_releases" ON public.deal_releases;
CREATE POLICY "Service role full access deal_releases" ON public.deal_releases FOR ALL USING (true);

-- Partner access logs policies
DROP POLICY IF EXISTS "Admins can view access logs" ON public.partner_access_logs;
CREATE POLICY "Admins can view access logs" ON public.partner_access_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Service role full access partner_access_logs" ON public.partner_access_logs;
CREATE POLICY "Service role full access partner_access_logs" ON public.partner_access_logs FOR ALL USING (true);

-- Partner notification preferences policies
DROP POLICY IF EXISTS "Admins can manage partner preferences" ON public.partner_notification_preferences;
CREATE POLICY "Admins can manage partner preferences" ON public.partner_notification_preferences FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Service role full access partner_notification_preferences" ON public.partner_notification_preferences;
CREATE POLICY "Service role full access partner_notification_preferences" ON public.partner_notification_preferences FOR ALL USING (true);
`

const SEED_SQL = `
-- Seed Optima as the first funding partner
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
`

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const results: { step: string; success: boolean; error?: string }[] = []

  try {
    // Step 1: Check if funding_partners table exists
    const { data: checkData, error: checkError } = await supabase
      .from('funding_partners')
      .select('id')
      .limit(1)

    // Check for any error that indicates table doesn't exist
    const tableDoesNotExist = checkError && (
      checkError.code === 'PGRST116' ||
      checkError.code === 'PGRST205' ||
      checkError.code === '42P01' ||
      checkError.message?.includes('does not exist') ||
      checkError.message?.includes('relation') ||
      checkError.message?.includes('funding_partners')
    )

    if (tableDoesNotExist || checkError) {
      // Tables don't exist - need to run migration via SQL Editor
      return NextResponse.json({
        success: false,
        needsManualSetup: true,
        message: 'Tables need to be created. Click the link to open SQL Editor with the code ready.',
        shortUrl: 'https://supabase.com/dashboard/project/gwrpijvfxjppncpmamfp/sql/new',
        errorCode: checkError?.code,
        errorMessage: checkError?.message
      })
    }

    // Tables exist - check if Optima partner exists
    const { data: existingPartner } = await supabase
      .from('funding_partners')
      .select('id')
      .eq('slug', 'optima')
      .single()

    if (!existingPartner) {
      // Insert Optima partner
      const { error: insertError } = await supabase
        .from('funding_partners')
        .insert({
          name: 'Optima Financial',
          slug: 'optima',
          description: 'Institutional investment platform specializing in tokenized private credit',
          partner_type: 'institutional',
          focus_asset_classes: ['residential_re', 'commercial_re', 'consumer_loans', 'smb_loans'],
          can_tokenize: true,
          has_legal_team: true,
          provides_spv_formation: false,
          status: 'active'
        })

      if (insertError) {
        results.push({ step: 'Create Optima partner', success: false, error: insertError.message })
      } else {
        results.push({ step: 'Create Optima partner', success: true })
      }
    } else {
      results.push({ step: 'Optima partner exists', success: true })
    }

    // Check if partner preferences exist
    if (existingPartner) {
      const { data: prefs } = await supabase
        .from('partner_notification_preferences')
        .select('id')
        .eq('partner_id', existingPartner.id)
        .single()

      if (!prefs) {
        const { error: prefsError } = await supabase
          .from('partner_notification_preferences')
          .insert({
            partner_id: existingPartner.id,
            email_alerts_enabled: true,
            in_app_alerts_enabled: true
          })

        if (prefsError) {
          results.push({ step: 'Create partner preferences', success: false, error: prefsError.message })
        } else {
          results.push({ step: 'Create partner preferences', success: true })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Setup complete! Partner dashboard is ready.',
      results
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  // Check current status
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // First check if table exists at all
  const { data: tableCheck, error: tableError } = await supabase
    .from('funding_partners')
    .select('id')
    .limit(1)

  // Any error means tables don't exist or aren't accessible
  if (tableError) {
    return NextResponse.json({
      tablesExist: false,
      partnerExists: false,
      ready: false,
      error: tableError.message,
      errorCode: tableError.code
    })
  }

  // Table exists - check for Optima partner
  const { data, error } = await supabase
    .from('funding_partners')
    .select('id, name, slug')
    .eq('slug', 'optima')
    .single()

  if (error && error.code !== 'PGRST116') {
    // Some other error (not "no rows found")
    return NextResponse.json({
      tablesExist: true,
      partnerExists: false,
      ready: false,
      error: error.message
    })
  }

  return NextResponse.json({
    tablesExist: true,
    partnerExists: !!data,
    ready: !!data,
    partner: data
  })
}

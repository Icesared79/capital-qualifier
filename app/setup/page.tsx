'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, ExternalLink, Loader2, AlertCircle, ArrowRight, Copy } from 'lucide-react'

const SETUP_SQL = `-- Partner Dashboard Setup SQL
-- Run this in Supabase SQL Editor

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

-- Enable RLS
ALTER TABLE public.funding_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow admin and optma roles)
CREATE POLICY "Admin full access funding_partners" ON public.funding_partners FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'optma'))
);
CREATE POLICY "Admin full access deal_releases" ON public.deal_releases FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'optma'))
);
CREATE POLICY "Admin full access partner_access_logs" ON public.partner_access_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'optma'))
);
CREATE POLICY "Admin full access partner_notification_preferences" ON public.partner_notification_preferences FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'optma'))
);

-- Seed Optima Partner
INSERT INTO public.funding_partners (name, slug, description, partner_type, status)
VALUES ('Optima Financial', 'optima', 'Institutional investment platform', 'institutional', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Create preferences for Optima
INSERT INTO public.partner_notification_preferences (partner_id, email_alerts_enabled)
SELECT id, true FROM public.funding_partners WHERE slug = 'optima'
ON CONFLICT (partner_id) DO NOTHING;`

export default function SetupPage() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'needs-setup' | 'error'>('checking')
  const [copied, setCopied] = useState(false)
  const [errorInfo, setErrorInfo] = useState<string>('')

  useEffect(() => {
    checkStatus()
  }, [])

  async function checkStatus() {
    setStatus('checking')
    try {
      const res = await fetch('/api/auto-setup')
      const data = await res.json()

      if (data.ready) {
        setStatus('ready')
      } else {
        setStatus('needs-setup')
        setErrorInfo(data.error || data.errorCode || '')
      }
    } catch (err) {
      setStatus('error')
      setErrorInfo('Could not check status')
    }
  }

  function copySQL() {
    navigator.clipboard.writeText(SETUP_SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // Loading state
  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking setup status...</p>
        </div>
      </div>
    )
  }

  // Already ready
  if (status === 'ready') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h1>
          <p className="text-gray-600 mb-6">Your partner dashboard is ready to use.</p>
          <a
            href="/dashboard/optma"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Go to Partner Dashboard
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  // Needs setup - show manual steps directly
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Partner Dashboard Setup
          </h1>
          <p className="text-gray-600">
            Follow these 3 simple steps to set up your database tables.
          </p>
          {errorInfo && (
            <p className="text-sm text-gray-400 mt-2">Error: {errorInfo}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Step 1 */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Copy the setup code
                </h2>
                <p className="text-gray-600 mb-4">
                  Click the button below to copy the database setup code to your clipboard.
                </p>
                <button
                  onClick={copySQL}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
                    copied
                      ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                      : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy Setup Code
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Run the code in Supabase
                </h2>
                <p className="text-gray-600 mb-4">
                  Click below to open the Supabase SQL Editor, then:
                </p>
                <ol className="text-gray-600 mb-4 space-y-1 list-decimal list-inside">
                  <li>Press <kbd className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono">Ctrl+V</kbd> to paste the code</li>
                  <li>Click the green <strong>&quot;Run&quot;</strong> button (bottom right)</li>
                  <li>Wait for &quot;Success&quot; message</li>
                </ol>
                <a
                  href="https://supabase.com/dashboard/project/gwrpijvfxjppncpmamfp/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Open Supabase SQL Editor
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Verify and continue
                </h2>
                <p className="text-gray-600 mb-4">
                  After running the SQL in Supabase, click below to verify everything is set up correctly.
                </p>
                <button
                  onClick={checkStatus}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Verify Setup
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Having trouble? Make sure you&apos;re logged into Supabase with the correct account.
        </p>
      </div>
    </div>
  )
}

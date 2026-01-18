'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check, ExternalLink, CheckCircle2 } from 'lucide-react'

const FULL_MIGRATION_SQL = `-- ============================================
-- LEGAL & SPV FEE STRUCTURE MIGRATION
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- LEGAL FEE CATALOG TABLE
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

-- DEAL LEGAL FEES TABLE
CREATE TABLE IF NOT EXISTS public.deal_legal_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  fee_catalog_id UUID REFERENCES public.legal_fee_catalog(id),
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  fee_type TEXT NOT NULL DEFAULT 'flat' CHECK (fee_type IN ('flat', 'hourly', 'percentage', 'annual')),
  category TEXT NOT NULL DEFAULT 'legal' CHECK (category IN ('legal', 'spv', 'maintenance', 'custom')),
  hours DECIMAL(5,2),
  hourly_rate DECIMAL(10,2),
  percentage_rate DECIMAL(5,4),
  percentage_base TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'waived')),
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  invoiced_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  waived_at TIMESTAMPTZ,
  waived_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deal_legal_fees_deal ON public.deal_legal_fees(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_legal_fees_status ON public.deal_legal_fees(status);

-- SEED DATA - Standard Legal & SPV Services
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

-- Enable RLS
ALTER TABLE public.legal_fee_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_legal_fees ENABLE ROW LEVEL SECURITY;

-- Fee catalog is readable by all authenticated users
DROP POLICY IF EXISTS "Fee catalog readable by authenticated users" ON public.legal_fee_catalog;
CREATE POLICY "Fee catalog readable by authenticated users"
  ON public.legal_fee_catalog FOR SELECT
  TO authenticated
  USING (true);

-- Deal fees viewable by stakeholders
DROP POLICY IF EXISTS "Deal fees viewable by deal stakeholders" ON public.deal_legal_fees;
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

-- Deal fees manageable by admins and legal
DROP POLICY IF EXISTS "Deal fees manageable by admins and legal" ON public.deal_legal_fees;
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

-- Helper function to calculate deal fees
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

-- Done!
SELECT 'Migration completed successfully!' as status;
`

export default function RunMigrationPage() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(FULL_MIGRATION_SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Legal Fees Migration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Follow these 3 simple steps to run the migration:
          </p>

          {/* Step 1 */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Copy the SQL</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Click the button below to copy the entire migration script to your clipboard.
                </p>
                <button
                  onClick={copyToClipboard}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy SQL to Clipboard
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Open Supabase SQL Editor</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Click the button below to open your Supabase SQL Editor in a new tab.
                </p>
                <a
                  href="https://supabase.com/dashboard/project/_/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open Supabase SQL Editor
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  (You may need to select your project if prompted)
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Paste and Run</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  In the SQL Editor:
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                  <li>Press <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+V</kbd> (or <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Cmd+V</kbd> on Mac) to paste</li>
                  <li>Click the green <strong>"Run"</strong> button (or press <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+Enter</kbd>)</li>
                  <li>Wait for "Success" message</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Success indicator */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-gray-400" />
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">After running successfully:</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You should see "Migration completed successfully!" at the bottom of the results.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SQL Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">SQL Preview</h2>
            <button
              onClick={copyToClipboard}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-64 overflow-y-auto">
            {FULL_MIGRATION_SQL}
          </pre>
        </div>
      </div>
    </div>
  )
}

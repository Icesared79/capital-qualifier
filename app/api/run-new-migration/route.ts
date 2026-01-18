import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const results: { step: string; success: boolean; error?: string }[] = []

  // Migration steps - each can be run independently
  const steps = [
    {
      name: 'Create partner_notification_preferences table',
      check: async () => {
        const { data } = await supabase
          .from('partner_notification_preferences')
          .select('id')
          .limit(1)
        return data !== null
      },
      run: async () => {
        // Table creation needs to be done via SQL Editor
        // For now, just check if it exists
        return { needsManualRun: true }
      }
    },
    {
      name: 'Check for Optima partner',
      check: async () => {
        const { data } = await supabase
          .from('funding_partners')
          .select('id')
          .eq('slug', 'optima')
          .single()
        return !!data
      },
      run: async () => {
        // Already seeded by previous migration
        return { success: true }
      }
    },
    {
      name: 'Initialize preferences for existing partners',
      check: async () => true,
      run: async () => {
        // Get partners without preferences
        const { data: partners } = await supabase
          .from('funding_partners')
          .select('id')

        if (partners && partners.length > 0) {
          for (const partner of partners) {
            // Check if preferences exist
            const { data: existing } = await supabase
              .from('partner_notification_preferences')
              .select('id')
              .eq('partner_id', partner.id)
              .single()

            if (!existing) {
              // Create default preferences
              await supabase
                .from('partner_notification_preferences')
                .insert({
                  partner_id: partner.id,
                  email_alerts_enabled: true,
                  email_frequency: 'immediate',
                  in_app_alerts_enabled: true
                })
            }
          }
        }
        return { success: true }
      }
    }
  ]

  // First, let's check if the table already exists
  const { data: tableCheck, error: tableError } = await supabase
    .from('partner_notification_preferences')
    .select('id')
    .limit(1)

  if (tableError && tableError.code === '42P01') {
    // Table doesn't exist - need to create it
    // Return the SQL for manual execution
    const migrationSQL = `
-- Partner Notification Preferences Table
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
ALTER TABLE public.partner_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage partner preferences" ON public.partner_notification_preferences
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Partners can view own preferences" ON public.partner_notification_preferences
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.funding_partners fp WHERE fp.id = partner_id
    AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Partners can update own preferences" ON public.partner_notification_preferences
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.funding_partners fp WHERE fp.id = partner_id
    AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Partners can insert own preferences" ON public.partner_notification_preferences
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.funding_partners fp WHERE fp.id = partner_id
    AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())
  ));

-- Index
CREATE INDEX IF NOT EXISTS idx_partner_preferences_partner ON public.partner_notification_preferences(partner_id);

-- Update trigger
CREATE TRIGGER update_partner_notification_preferences_updated_at
  BEFORE UPDATE ON public.partner_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Initialize preferences for existing partners
INSERT INTO public.partner_notification_preferences (partner_id)
SELECT id FROM public.funding_partners
WHERE id NOT IN (SELECT partner_id FROM public.partner_notification_preferences)
ON CONFLICT (partner_id) DO NOTHING;
    `.trim()

    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

    return NextResponse.json({
      success: false,
      needsManualMigration: true,
      message: 'The database table needs to be created. Please follow these simple steps:',
      instructions: [
        '1. Click the link below to open Supabase SQL Editor',
        '2. Click the green "Run" button at the bottom right',
        '3. Come back here and refresh the page'
      ],
      sqlEditorUrl: `https://supabase.com/dashboard/project/${projectRef}/sql/new`,
      sql: migrationSQL
    })
  }

  // Table exists - just initialize any missing preferences
  try {
    const { data: partners } = await supabase
      .from('funding_partners')
      .select('id')

    let created = 0
    if (partners) {
      for (const partner of partners) {
        const { data: existing } = await supabase
          .from('partner_notification_preferences')
          .select('id')
          .eq('partner_id', partner.id)
          .single()

        if (!existing) {
          const { error } = await supabase
            .from('partner_notification_preferences')
            .insert({
              partner_id: partner.id,
              email_alerts_enabled: true,
              email_frequency: 'immediate',
              in_app_alerts_enabled: true
            })
          if (!error) created++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration complete! Database is ready.',
      details: `Initialized preferences for ${created} partner(s)`
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}

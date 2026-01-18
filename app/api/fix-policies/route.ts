import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing service role key' }, { status: 500 })
  }

  // Create admin client with service role key (bypasses RLS)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })

  try {
    // Test if we can query the policies table to see what exists
    const { data: existingPolicies, error: queryError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'deals')

    // This won't work directly - pg_policies isn't exposed via REST
    // Instead, let's just try to verify the setup by doing a test operation

    // For now, return instructions
    return NextResponse.json({
      message: 'Cannot create policies via API. Please run SQL manually.',
      sql: `
-- Run this in Supabase SQL Editor:

CREATE POLICY "Users can insert own deals" ON public.deals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can update own deals" ON public.deals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
  );
      `.trim(),
      dashboard_url: 'https://supabase.com/dashboard/project/gwrpijvfxjppncpmamfp/sql'
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to get the SQL fix, or run it manually',
    dashboard_url: 'https://supabase.com/dashboard/project/gwrpijvfxjppncpmamfp/sql'
  })
}

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const adminClient = createAdminClient()

  const migrations: { name: string; sql: string }[] = [
    {
      name: 'Add overall_score to deals',
      sql: `ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS overall_score INTEGER;`
    },
    {
      name: 'Add other deal columns',
      sql: `
        ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS capital_amount TEXT;
        ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS funding_purpose TEXT;
        ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS qualification_data JSONB;
        ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS qualification_score TEXT;
        ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS capital_fits JSONB;
        ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS recommended_structure TEXT;
        ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS opportunity_size TEXT;
        ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS time_to_funding TEXT;
        ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS strengths TEXT[];
        ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS considerations TEXT[];
        ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS next_steps TEXT[];
      `
    }
  ]

  const results: { name: string; success: boolean; error?: string }[] = []

  for (const migration of migrations) {
    try {
      // Use raw SQL through RPC if available, otherwise try direct query
      const { error } = await adminClient.rpc('exec_sql', { sql: migration.sql }).single()

      if (error) {
        // If RPC doesn't exist, we need a different approach
        results.push({ name: migration.name, success: false, error: error.message })
      } else {
        results.push({ name: migration.name, success: true })
      }
    } catch (err: any) {
      results.push({ name: migration.name, success: false, error: err.message })
    }
  }

  return NextResponse.json({
    message: 'Migration attempt complete',
    results,
    note: 'If migrations failed, you may need to run them directly in Supabase SQL Editor'
  })
}

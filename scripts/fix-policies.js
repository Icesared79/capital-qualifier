// Script to add missing RLS policies to Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gwrpijvfxjppncpmamfp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function fixPolicies() {
  console.log('Adding missing RLS policies for deals table...')

  // Use rpc to execute raw SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Check if policy exists first
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'Users can insert own deals'
        ) THEN
          CREATE POLICY "Users can insert own deals" ON public.deals
            FOR INSERT WITH CHECK (
              EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
            );
          RAISE NOTICE 'Created INSERT policy for deals';
        ELSE
          RAISE NOTICE 'INSERT policy already exists';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'Users can update own deals'
        ) THEN
          CREATE POLICY "Users can update own deals" ON public.deals
            FOR UPDATE USING (
              EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
            );
          RAISE NOTICE 'Created UPDATE policy for deals';
        ELSE
          RAISE NOTICE 'UPDATE policy already exists';
        END IF;
      END $$;
    `
  })

  if (error) {
    console.log('RPC method not available, this is expected.')
    console.log('Please run the SQL manually in Supabase SQL Editor.')
  } else {
    console.log('Policies added successfully!')
  }
}

fixPolicies()

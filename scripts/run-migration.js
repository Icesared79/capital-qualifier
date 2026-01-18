// Script to run the admin dashboard migration
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('Running admin dashboard migration...\n')

  // Note: Supabase JS client doesn't support raw SQL DDL directly
  // We need to use individual operations instead

  try {
    // Test the connection
    const { data, error } = await supabase.from('profiles').select('id').limit(1)
    if (error) throw error
    console.log('Connected to Supabase successfully\n')

    // Check if handoff columns already exist
    const { data: deals, error: dealError } = await supabase
      .from('deals')
      .select('id, handoff_to')
      .limit(1)

    if (dealError && dealError.message.includes('handoff_to')) {
      console.log('Migration needed - handoff columns do not exist yet')
      console.log('\nPlease run the following SQL in Supabase Dashboard SQL Editor:')
      console.log('https://supabase.com/dashboard/project/gwrpijvfxjppncpmamfp/sql/new\n')
      console.log('='.repeat(60))
      console.log(`
-- Admin Dashboard Migration
-- Adds support for legal and optma roles and handoff tracking

-- 1. Update profiles.role constraint to include new roles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('client', 'admin', 'legal', 'optma', 'investor'));

-- 2. Add handoff tracking columns to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS
  handoff_to TEXT CHECK (handoff_to IN ('legal', 'optma'));

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS
  handed_off_at TIMESTAMPTZ;

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS
  handed_off_by UUID REFERENCES public.profiles(id);

-- 3. Add index for efficient handoff queries
CREATE INDEX IF NOT EXISTS idx_deals_handoff_to ON public.deals(handoff_to) WHERE handoff_to IS NOT NULL;
`)
      console.log('='.repeat(60))
    } else {
      console.log('Handoff columns already exist! Migration may have already been applied.')
    }

    // Check current user roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email, role')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!profilesError && profiles) {
      console.log('\nCurrent users and roles:')
      profiles.forEach(p => {
        console.log(`  ${p.email}: ${p.role}`)
      })
    }

  } catch (err) {
    console.error('Error:', err.message)
  }
}

runMigration()

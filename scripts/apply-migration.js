// Script to apply the admin dashboard migration
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})

async function applyMigration() {
  console.log('Applying admin dashboard migration...\n')

  try {
    // Step 1: Update user role to admin
    console.log('1. Updating pfd@bitcense.com to admin role...')
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', 'pfd@bitcense.com')

    if (roleError) {
      console.log('   Error:', roleError.message)
      // Try without constraint - might need to update constraint first
      console.log('   Trying direct update...')
    } else {
      console.log('   Success!')
    }

    // Step 2: Check if columns exist by trying to query them
    console.log('\n2. Checking if handoff columns exist...')
    const { data: testData, error: testError } = await supabase
      .from('deals')
      .select('id, handoff_to')
      .limit(1)

    if (testError && testError.message.includes('handoff_to')) {
      console.log('   Columns do not exist yet.')
      console.log('\n   DDL changes (ALTER TABLE) require direct database access.')
      console.log('   Please run this SQL in Supabase Dashboard:\n')
      console.log('   https://supabase.com/dashboard/project/gwrpijvfxjppncpmamfp/sql/new\n')
      console.log(`   ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS handoff_to TEXT;
   ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS handed_off_at TIMESTAMPTZ;
   ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS handed_off_by UUID;`)
    } else {
      console.log('   Columns already exist!')
    }

    // Verify the role update
    console.log('\n3. Verifying role update...')
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('email', 'pfd@bitcense.com')
      .single()

    if (profile) {
      console.log(`   ${profile.email}: ${profile.role}`)
      if (profile.role === 'admin') {
        console.log('\n   SUCCESS! You are now an admin.')
        console.log('   Go to: http://localhost:3003/dashboard/admin')
      }
    }

  } catch (err) {
    console.error('Error:', err.message)
  }
}

applyMigration()

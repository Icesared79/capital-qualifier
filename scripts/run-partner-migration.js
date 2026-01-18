const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250117_partner_portal_legal.sql')
const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

console.log('Migration file loaded successfully')
console.log('Connecting to Supabase...')

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('\n=== Running Partner Portal & Legal System Migration ===\n')

  // For Supabase, we need to use the SQL API via fetch directly
  // since supabase-js doesn't support DDL operations

  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'GET',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    }
  })

  if (!response.ok) {
    console.error('Cannot connect to Supabase REST API')
    console.log('\n⚠️  To run this migration, please:')
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/gwrpijvfxjppncpmamfp')
    console.log('2. Click "SQL Editor" in the left sidebar')
    console.log('3. Copy and paste the contents of: supabase/migrations/20250117_partner_portal_legal.sql')
    console.log('4. Click "Run" to execute the migration')
    return
  }

  console.log('Connected to Supabase!')

  // Try to execute via the pg_graphql or rpc if available
  // Since we can't run raw SQL directly, we'll provide instructions

  console.log('\n⚠️  The Supabase JavaScript client cannot run DDL (CREATE TABLE) statements.')
  console.log('\nEasiest option - Run via API endpoint:')
  console.log('  1. Start your dev server: npm run dev')
  console.log('  2. Visit: http://localhost:3000/api/execute-migration')
  console.log('\nAlternative - Run manually:')
  console.log('  1. Go to: https://supabase.com/dashboard/project/gwrpijvfxjppncpmamfp/sql')
  console.log('  2. Paste the migration SQL and run it')

  // Let's try to check if tables already exist
  console.log('\n--- Checking current database state ---')

  const { data: partners, error: partnersError } = await supabase
    .from('funding_partners')
    .select('id, name')
    .limit(1)

  if (partnersError && partnersError.code === '42P01') {
    console.log('❌ funding_partners table does not exist')
    console.log('\n👉 Migration needs to be run!')
  } else if (partnersError) {
    console.log('⚠️  Error checking funding_partners:', partnersError.message)
  } else {
    console.log('✅ funding_partners table exists')
    if (partners && partners.length > 0) {
      console.log('   Found partner:', partners[0].name)
    }
  }

  const { data: releases, error: releasesError } = await supabase
    .from('deal_releases')
    .select('id')
    .limit(1)

  if (releasesError && releasesError.code === '42P01') {
    console.log('❌ deal_releases table does not exist')
  } else if (releasesError) {
    console.log('⚠️  Error checking deal_releases:', releasesError.message)
  } else {
    console.log('✅ deal_releases table exists')
  }

  const { data: legalStructures, error: legalError } = await supabase
    .from('legal_structures')
    .select('id')
    .limit(1)

  if (legalError && legalError.code === '42P01') {
    console.log('❌ legal_structures table does not exist')
  } else if (legalError) {
    console.log('⚠️  Error checking legal_structures:', legalError.message)
  } else {
    console.log('✅ legal_structures table exists')
  }
}

runMigration().catch(console.error)

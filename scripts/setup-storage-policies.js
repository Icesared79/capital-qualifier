const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://gwrpijvfxjppncpmamfp.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cnBpanZmeGpwcG5jcG1hbWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU1NTMwMCwiZXhwIjoyMDg0MTMxMzAwfQ.oDSFw5xhX67Gt8pxHRwcUQyMTqvzfWiuJDXqoMlpYs0'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function setupPolicies() {
  console.log('Setting up storage policies...')

  // The policies need to be created via the Supabase dashboard or SQL editor
  // because the REST API doesn't support direct DDL commands.
  // However, the bucket is now public and should allow uploads from authenticated users.

  // Test that bucket exists
  const { data: buckets, error } = await supabase.storage.listBuckets()

  if (error) {
    console.error('Error listing buckets:', error)
    return
  }

  const bucket = buckets.find(b => b.id === 'company-assets')

  if (bucket) {
    console.log('✓ company-assets bucket exists')
    console.log('  Public:', bucket.public)
    console.log('  Created:', bucket.created_at)

    // Try to update bucket to ensure it's public
    const { error: updateError } = await supabase.storage.updateBucket('company-assets', {
      public: true,
      fileSizeLimit: 2097152,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    })

    if (updateError) {
      console.log('Note: Could not update bucket settings:', updateError.message)
    } else {
      console.log('✓ Bucket settings confirmed')
    }
  } else {
    console.log('✗ company-assets bucket not found')
  }

  console.log('')
  console.log('IMPORTANT: Storage policies for RLS need to be set in the Supabase Dashboard.')
  console.log('Go to: https://supabase.com/dashboard/project/gwrpijvfxjppncpmamfp/storage/buckets/company-assets')
  console.log('')
  console.log('Add these policies under the "Policies" tab:')
  console.log('')
  console.log('1. INSERT policy (for uploads):')
  console.log('   - Name: "Allow authenticated uploads"')
  console.log('   - Target roles: authenticated')
  console.log('   - WITH CHECK expression: true')
  console.log('')
  console.log('2. SELECT policy (for viewing):')
  console.log('   - Name: "Allow public viewing"')
  console.log('   - Target roles: public (anon)')
  console.log('   - USING expression: true')
}

setupPolicies()

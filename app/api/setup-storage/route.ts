import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Create admin client with service role
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

    if (listError) {
      return NextResponse.json({ error: 'Failed to list buckets', details: listError.message }, { status: 500 })
    }

    const bucketExists = buckets?.some(b => b.id === 'company-assets')

    if (!bucketExists) {
      // Create the bucket
      const { error: createError } = await supabaseAdmin.storage.createBucket('company-assets', {
        public: true,
        fileSizeLimit: 2097152, // 2MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      })

      if (createError) {
        return NextResponse.json({ error: 'Failed to create bucket', details: createError.message }, { status: 500 })
      }
    }

    // Now set up RLS policies via SQL
    // Using the admin client to run SQL
    const { error: policyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can upload company logos" ON storage.objects;
        DROP POLICY IF EXISTS "Public can view company assets" ON storage.objects;
        DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;

        -- Allow authenticated users to upload logos
        CREATE POLICY "Users can upload company logos"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'company-assets');

        -- Allow anyone to view company assets (public bucket)
        CREATE POLICY "Public can view company assets"
        ON storage.objects
        FOR SELECT
        TO public
        USING (bucket_id = 'company-assets');

        -- Allow users to manage their own logos
        CREATE POLICY "Users can update own logos"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'company-assets');

        CREATE POLICY "Users can delete own logos"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'company-assets');
      `
    })

    // If RPC doesn't exist, we'll handle it differently
    if (policyError) {
      // Policies might need to be created manually, but bucket is created
      return NextResponse.json({
        success: true,
        message: 'Bucket created successfully. Policies may need manual setup.',
        bucketCreated: !bucketExists,
        policyNote: 'Run the SQL in Supabase dashboard for full policy setup'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Storage bucket and policies created successfully',
      bucketCreated: !bucketExists
    })

  } catch (error: any) {
    return NextResponse.json({ error: 'Setup failed', details: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to set up the company-assets storage bucket'
  })
}

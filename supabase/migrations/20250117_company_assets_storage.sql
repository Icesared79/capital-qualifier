-- Create storage bucket for company assets (logos, etc.)
-- Run this in Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,  -- Public bucket so getPublicUrl works
  2097152,  -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- Allow authenticated users to upload to their own folder (using user ID prefix)
CREATE POLICY "Users can upload company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-assets'
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

-- Allow anyone to view company assets (public bucket)
CREATE POLICY "Public can view company assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-assets');

-- Allow users to update/delete their own logos
CREATE POLICY "Users can update own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-assets'
  AND auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

CREATE POLICY "Users can delete own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-assets'
  AND auth.uid()::text = split_part((storage.filename(name)), '-', 1)
);

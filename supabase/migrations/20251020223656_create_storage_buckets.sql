/*
  # Create Storage Buckets for Media Files

  1. Storage Setup
    - Create `product-images` bucket for image uploads
    - Create `product-videos` bucket for video uploads
    - Both buckets are publicly accessible for viewing
    - Authenticated users can upload files
  
  2. Security
    - Public read access for all files
    - Upload restricted to authenticated users only
    - Delete restricted to authenticated users only
*/

-- Create product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create product-videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-videos',
  'product-videos',
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access for images" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access for videos" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete videos" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-videos');

-- Allow public read access to images
CREATE POLICY "Public read access for images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Allow public read access to videos
CREATE POLICY "Public read access for videos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-videos');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete videos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-videos');
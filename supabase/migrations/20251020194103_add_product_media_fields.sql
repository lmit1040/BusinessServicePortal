/*
  # Add Product Media Fields to Service Offers

  ## Overview
  Adds optional media and link fields to service_offers table to allow admins
  to provide additional resources and visual content for each service.

  ## Changes
  
  ### service_offers table
  - `product_link` (text) - Optional URL to product page or external resource
  - `product_image` (text) - Optional URL to product image
  - `product_video` (text) - Optional URL to product video (YouTube, Vimeo, etc.)

  ## Notes
  - All new fields are optional (nullable)
  - URLs should be validated on the frontend for proper format
  - Images and videos should be hosted externally or via Supabase Storage
*/

-- Add new media fields to service_offers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_offers' AND column_name = 'product_link'
  ) THEN
    ALTER TABLE service_offers ADD COLUMN product_link text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_offers' AND column_name = 'product_image'
  ) THEN
    ALTER TABLE service_offers ADD COLUMN product_image text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_offers' AND column_name = 'product_video'
  ) THEN
    ALTER TABLE service_offers ADD COLUMN product_video text;
  END IF;
END $$;
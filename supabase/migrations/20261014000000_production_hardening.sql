-- ==============================================================================
-- Campus Mart Production Hardening Migration
-- Version: 20261014000000
-- Description: Creates profiles table, auth triggers, storage bucket, and least-privilege RLS policies.
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  college TEXT,
  department TEXT,
  year TEXT,
  hostel TEXT,
  phone TEXT,
  avatar_url TEXT,
  verified_student BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Auth Trigger for Automatic Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, college, department, year, hostel, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'college', 'IIT Delhi - Main Campus'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'Student'),
    COALESCE(NEW.raw_user_meta_data->>'year', '1st Year'),
    COALESCE(NEW.raw_user_meta_data->>'hostel', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    college = EXCLUDED.college,
    department = EXCLUDED.department,
    year = EXCLUDED.year;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 3. Additive Columns for Enquiries and Reservations
ALTER TABLE public.product_enquiries ADD COLUMN IF NOT EXISTS buyer_id TEXT;
ALTER TABLE public.product_enquiries ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE public.product_enquiries ADD COLUMN IF NOT EXISTS buyer_email TEXT;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS buyer_id TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS buyer_email TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS buyer_phone TEXT;

-- 4. Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Users can delete own product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images');

-- 5. Hardened RLS Policies for Tables
ALTER POLICY "Allow anon update on products"
  ON public.products TO authenticated
  USING (seller_id = auth.uid()::text);

CREATE POLICY "Sellers can delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (seller_id = auth.uid()::text);

ALTER POLICY "Allow anon select on contact_inquiries"
  ON public.contact_inquiries TO authenticated
  USING (auth.jwt()->>'role' = 'service_role');

ALTER POLICY "Allow anon select on product_enquiries"
  ON public.product_enquiries TO authenticated
  USING (buyer_id = auth.uid()::text OR seller_id = auth.uid()::text);

ALTER POLICY "Allow anon select on reservations"
  ON public.reservations TO authenticated
  USING (buyer_id = auth.uid()::text);

-- 6. Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_campus ON public.products(campus);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_enquiries_buyer ON public.product_enquiries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_product_enquiries_seller ON public.product_enquiries(seller_id);
CREATE INDEX IF NOT EXISTS idx_reservations_buyer ON public.reservations(buyer_id);

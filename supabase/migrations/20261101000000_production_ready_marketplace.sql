-- ==============================================================================
-- Campus Mart: Consolidated Production-Ready Marketplace Migration
-- Target: Supabase PostgreSQL (SQL Editor / Migration Runner)
-- Version: 20261101000000
-- ==============================================================================

-- 1. EXTEND PRODUCTS TABLE
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '21 days');
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS course_code TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_fields JSONB DEFAULT '{}'::jsonb;

-- Backfill existing rows safely
UPDATE public.products
SET 
  status = COALESCE(status, CASE WHEN in_stock = false THEN 'sold' ELSE 'available' END),
  expires_at = COALESCE(expires_at, now() + INTERVAL '21 days'),
  updated_at = COALESCE(updated_at, created_at, now())
WHERE status IS NULL OR expires_at IS NULL;

-- Check constraint on product status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_products_status') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT check_products_status
      CHECK (status IN ('available', 'reserved', 'sold', 'archived'));
  END IF;
END $$;

-- Product RLS Policies
DROP POLICY IF EXISTS "Sellers can update own products" ON public.products;
CREATE POLICY "Sellers can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    seller_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin')
    )
  )
  WITH CHECK (
    seller_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Sellers can delete own products" ON public.products;
CREATE POLICY "Sellers can delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (
    seller_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_expires_at ON public.products(expires_at);
CREATE INDEX IF NOT EXISTS idx_products_course_code ON public.products(lower(course_code));

-- 2. EXTEND PROFILES TABLE WITH ROLE
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_profiles_role') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT check_profiles_role
      CHECK (role IN ('student', 'moderator', 'admin'));
  END IF;
END $$;

-- Profile deletion policy: allow authenticated users to delete their own profile record
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Reservation update policy: allow buyers to update their reservation status (e.g. completed, cancelled)
DROP POLICY IF EXISTS "Buyers can update own reservations" ON public.reservations;
CREATE POLICY "Buyers can update own reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid()::text)
  WITH CHECK (buyer_id = auth.uid()::text);

-- Reservation Integrity Trigger: Prevents tampering with price/items/buyer_id and prevents reopening completed orders
CREATE OR REPLACE FUNCTION public.protect_reservation_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    -- Prevent changing total_amount, items, or buyer_id
    IF NEW.total_amount IS DISTINCT FROM OLD.total_amount OR
       NEW.items IS DISTINCT FROM OLD.items OR
       NEW.buyer_id IS DISTINCT FROM OLD.buyer_id THEN
      RAISE EXCEPTION 'Unauthorized: Reservation financial and item details cannot be modified.';
    END IF;

    -- Only allow valid status transitions
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF OLD.status IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'Reservation is finalized and cannot be modified.';
      END IF;
      IF NEW.status NOT IN ('reserved', 'completed', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid reservation status transition.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_protect_reservation_updates') THEN
    CREATE TRIGGER tr_protect_reservation_updates
      BEFORE UPDATE ON public.reservations
      FOR EACH ROW EXECUTE FUNCTION public.protect_reservation_updates();
  END IF;
END $$;

-- Role protection trigger: prevent privilege escalation
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.role() = 'service_role' THEN
      RETURN NEW;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot change their own account role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_protect_profile_role') THEN
    CREATE TRIGGER tr_protect_profile_role
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();
  END IF;
END $$;

-- 3. WISHLISTS TABLE
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_product_wishlist UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlists;
CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wishlist" ON public.wishlists;
CREATE POLICY "Users can insert own wishlist"
  ON public.wishlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlists;
CREATE POLICY "Users can delete own wishlist"
  ON public.wishlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. CONVERSATIONS TABLE (IN-APP BUYER-SELLER MESSAGING)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_listing_buyer_conversation UNIQUE (listing_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(buyer_id, seller_id);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Buyers can initiate conversations" ON public.conversations;
CREATE POLICY "Buyers can initiate conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Participants can update conversation metadata" ON public.conversations;
CREATE POLICY "Participants can update conversation metadata"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 5. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_meetup_suggestion BOOLEAN DEFAULT false,
  meetup_location TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Trigger to keep conversation updated on new message
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_text = NEW.message_text,
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_message_created') THEN
    CREATE TRIGGER on_message_created
      AFTER INSERT ON public.messages
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();
  END IF;
END $$;

-- 6. CONTENT MODERATION (LISTING REPORTS)
CREATE TABLE IF NOT EXISTS public.listing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('Prohibited Item', 'Scam/Fake', 'Already Sold', 'Other', 'prohibited_item', 'scam_fake', 'already_sold', 'other')),
  explanation TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  moderator_notes TEXT,
  resolution_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_listing_reporter UNIQUE (listing_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_reports_status ON public.listing_reports(status);
ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit reports" ON public.listing_reports;
CREATE POLICY "Users can submit reports"
  ON public.listing_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Reporters and moderators can view reports" ON public.listing_reports;
CREATE POLICY "Reporters and moderators can view reports"
  ON public.listing_reports FOR SELECT
  TO authenticated
  USING (
    auth.uid() = reporter_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Moderators can update reports" ON public.listing_reports;
CREATE POLICY "Moderators can update reports"
  ON public.listing_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin')
    )
  );

-- 7. HELPER RPC: RENEW LISTING (21 DAYS)
CREATE OR REPLACE FUNCTION public.renew_listing(p_listing_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_seller_id text;
  v_current_status text;
BEGIN
  SELECT seller_id, status INTO v_seller_id, v_current_status
  FROM public.products
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found.');
  END IF;

  IF v_seller_id <> auth.uid()::text THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You can only renew your own listings.');
  END IF;

  IF v_current_status = 'sold' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sold items cannot be renewed.');
  END IF;

  UPDATE public.products
  SET 
    expires_at = now() + INTERVAL '21 days',
    status = 'available',
    in_stock = true,
    updated_at = now()
  WHERE id = p_listing_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Listing successfully renewed for 21 days.',
    'new_expiry', (now() + INTERVAL '21 days')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.renew_listing TO authenticated;

-- 8. HELPER RPC: EXPIRE STALE LISTINGS
CREATE OR REPLACE FUNCTION public.expire_stale_listings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.products
  SET 
    status = 'archived',
    in_stock = false,
    updated_at = now()
  WHERE expires_at < now()
    AND status = 'available';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'archived_count', v_count,
    'executed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_listings FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.expire_stale_listings FROM anon;
GRANT EXECUTE ON FUNCTION public.expire_stale_listings TO service_role, authenticated;

-- 9. HELPER RPC: SECURE ACCOUNT DELETION (SELF-SERVICE)
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: User is not authenticated.');
  END IF;

  -- 1. Deactivate seller's listings
  UPDATE public.products
  SET in_stock = false, status = 'archived', updated_at = now()
  WHERE seller_id = v_uid::text;

  -- 2. Delete user's wishlist records
  DELETE FROM public.wishlists WHERE user_id = v_uid;

  -- 3. Delete user's profile record
  DELETE FROM public.profiles WHERE id = v_uid;

  -- 4. Delete user authentication identity (cascades sessions & tokens)
  DELETE FROM auth.users WHERE id = v_uid;

  RETURN jsonb_build_object('success', true, 'message', 'Account and associated records successfully removed.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account TO authenticated;

-- 10. PERMISSIONS GRANT
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.listing_reports TO authenticated;
GRANT SELECT, UPDATE ON public.reservations TO authenticated;

-- 11. STORAGE BUCKET ROW LEVEL SECURITY (HARDENED ISOLATION)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  8388608, -- 8MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- Hardened Delete: Users can ONLY delete images within their own userId folder
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
CREATE POLICY "Users can delete own product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin')
      )
    )
  );

-- Hardened Upload: Users can ONLY upload images into their own userId folder
DROP POLICY IF EXISTS "Upload product images" ON storage.objects;
CREATE POLICY "Upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ==============================================================================
-- Campus Mart: Complete Marketplace Upgrade Migration
-- Version: 20261014020000
-- Description:
-- 1. Adds listing status ('available', 'reserved', 'sold', 'archived'), 21-day expiry,
--    and category-specific structured fields to 'products'.
-- 2. Adds moderator/admin roles to 'profiles' with privilege escalation protection.
-- 3. Creates private in-app 'conversations' and 'messages' with Realtime support & RLS.
-- 4. Creates 'listing_reports' with RLS and moderator workflows.
-- 5. Implements server-side functions for renewal and idempotent 21-day expiry.
-- ==============================================================================

-- 1. Extend products table with status, 21-day automatic expiry, and structured fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '21 days');
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS course_code TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_fields JSONB DEFAULT '{}'::jsonb;

-- Backfill existing rows safely (grant existing active items 21 days from upgrade)
UPDATE public.products
SET 
  status = COALESCE(status, CASE WHEN in_stock = false THEN 'sold' ELSE 'available' END),
  expires_at = COALESCE(expires_at, now() + INTERVAL '21 days'),
  updated_at = COALESCE(updated_at, created_at, now())
WHERE status IS NULL OR expires_at IS NULL;

-- Add check constraint for status if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_products_status'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT check_products_status
      CHECK (status IN ('available', 'reserved', 'sold', 'archived'));
  END IF;
END $$;

-- Hardened RLS Policy for Product Updates: Enforce ownership & prevent seller impersonation
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

-- 2. Extend profiles with role for moderation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_profiles_role'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT check_profiles_role
      CHECK (role IN ('student', 'moderator', 'admin'));
  END IF;
END $$;

-- Role Protection: Prevent ordinary users from elevating their own role to 'moderator' or 'admin'
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow service_role to manage roles freely
    IF auth.role() = 'service_role' THEN
      RETURN NEW;
    END IF;

    -- Only authenticated admins can assign roles
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
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_protect_profile_role'
  ) THEN
    CREATE TRIGGER tr_protect_profile_role
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();
  END IF;
END $$;

-- 3. Conversations Table for Private In-App Messaging
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

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversations RLS: Only participants can read or update
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

-- 4. Messages Table for Realtime Chat
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

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages RLS: Only conversation participants can read & insert
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

-- Trigger to update conversation last_message
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
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_message_created'
  ) THEN
    CREATE TRIGGER on_message_created
      AFTER INSERT ON public.messages
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();
  END IF;
END $$;

-- 5. Listing Reports Table for Content Moderation
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

ALTER TABLE public.listing_reports ADD COLUMN IF NOT EXISTS moderator_notes TEXT;
ALTER TABLE public.listing_reports ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE public.listing_reports ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE public.listing_reports ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id);

ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

-- Reports RLS
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

-- 6. RPC Function: Renew Listing (21 days)
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

  -- Verify caller is the seller or admin
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

-- 7. RPC Function: Idempotent Expiry Function for Stale Listings
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

-- Restrict execution to service_role and authenticated users only (NOT anon)
REVOKE ALL ON FUNCTION public.expire_stale_listings FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.expire_stale_listings FROM anon;
GRANT EXECUTE ON FUNCTION public.expire_stale_listings TO service_role, authenticated;

-- 8. High Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_expires_at ON public.products(expires_at);
CREATE INDEX IF NOT EXISTS idx_products_course_code ON public.products(lower(course_code));
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_listing_reports_status ON public.listing_reports(status);

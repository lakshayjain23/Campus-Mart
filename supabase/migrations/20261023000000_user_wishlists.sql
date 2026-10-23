-- ==============================================================================
-- Campus Mart: Authenticated User Wishlists Migration
-- Version: 20261023000000
-- Description:
-- 1. Creates 'wishlists' table storing per-user product saves.
-- 2. Enables Row Level Security (RLS) guaranteeing strict isolation between users.
-- 3. Implements least-privilege policies: Users can SELECT, INSERT, and DELETE
--    only rows matching auth.uid().
-- 4. Enforces unique (user_id, product_id) to prevent duplicate wishlist records.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_product_wishlist UNIQUE (user_id, product_id)
);

-- Performance indices for rapid per-user lookups and product relationship cascades
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy: Authenticated users can query only their own wishlist items
DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlists;
CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. INSERT Policy: Authenticated users can insert items only for their own user_id
DROP POLICY IF EXISTS "Users can insert own wishlist" ON public.wishlists;
CREATE POLICY "Users can insert own wishlist"
  ON public.wishlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. DELETE Policy: Authenticated users can delete items only from their own wishlist
DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlists;
CREATE POLICY "Users can delete own wishlist"
  ON public.wishlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Explicitly revoke access from unauthenticated / anonymous users
REVOKE ALL ON public.wishlists FROM anon;
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;

/*
  # Fix RLS Infinite Recursion Issue

  ## Problem
  The existing RLS policies cause infinite recursion because they query the profiles
  table from within policies on the profiles table itself.

  ## Solution
  1. Drop all existing policies that cause recursion
  2. Recreate policies without circular dependencies
  3. For admin checks, we'll store is_admin in auth.users metadata or use a simpler approach
  
  ## Changes
  - Drop and recreate profiles policies to avoid self-referencing
  - Drop and recreate service_categories policies
  - Drop and recreate service_offers policies
  - Drop and recreate user_subscriptions policies

  ## Security
  All policies maintain the same security level but without recursion.
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Anyone can view categories" ON service_categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON service_categories;
DROP POLICY IF EXISTS "Admins can update categories" ON service_categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON service_categories;

DROP POLICY IF EXISTS "Anyone can view active offers" ON service_offers;
DROP POLICY IF EXISTS "Admins can insert offers" ON service_offers;
DROP POLICY IF EXISTS "Admins can update offers" ON service_offers;
DROP POLICY IF EXISTS "Admins can delete offers" ON service_offers;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON user_subscriptions;

-- Create helper function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = user_id LIMIT 1),
    false
  );
$$;

-- Recreate profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Recreate service_categories policies
CREATE POLICY "Anyone can view categories"
  ON service_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON service_categories FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Recreate service_offers policies
CREATE POLICY "Users can view active offers"
  ON service_offers FOR SELECT
  TO authenticated
  USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage offers"
  ON service_offers FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Recreate user_subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can create own subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));
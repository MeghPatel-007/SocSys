-- SocSys Supabase RLS policies
-- Run this after totalproject.sql in Supabase SQL Editor.

SET search_path = public;

-- Enable RLS on all app tables
ALTER TABLE public.owner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenancebill ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyerprofile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socsysaccount ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passwordresetotp ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe re-run)
DROP POLICY IF EXISTS owner_select_authenticated ON public.owner;
DROP POLICY IF EXISTS tenant_select_authenticated ON public.tenant;
DROP POLICY IF EXISTS house_select_public ON public.house;
DROP POLICY IF EXISTS house_write_authenticated ON public.house;
DROP POLICY IF EXISTS sale_select_public ON public.sale;
DROP POLICY IF EXISTS sale_write_authenticated ON public.sale;
DROP POLICY IF EXISTS rental_select_authenticated ON public.rental;
DROP POLICY IF EXISTS rental_write_authenticated ON public.rental;
DROP POLICY IF EXISTS bill_select_authenticated ON public.maintenancebill;
DROP POLICY IF EXISTS bill_write_authenticated ON public.maintenancebill;
DROP POLICY IF EXISTS payment_select_authenticated ON public.payment;
DROP POLICY IF EXISTS payment_write_authenticated ON public.payment;
DROP POLICY IF EXISTS complaint_select_authenticated ON public.complaint;
DROP POLICY IF EXISTS complaint_insert_authenticated ON public.complaint;
DROP POLICY IF EXISTS complaint_update_authenticated ON public.complaint;
DROP POLICY IF EXISTS buyerprofile_select_authenticated ON public.buyerprofile;

-- Public listing access (for marketplace-style browsing)
CREATE POLICY house_select_public
ON public.house
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY sale_select_public
ON public.sale
FOR SELECT
TO anon, authenticated
USING (true);

-- Admin-style data read (authenticated users)
CREATE POLICY owner_select_authenticated
ON public.owner
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY tenant_select_authenticated
ON public.tenant
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY rental_select_authenticated
ON public.rental
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY bill_select_authenticated
ON public.maintenancebill
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY payment_select_authenticated
ON public.payment
FOR SELECT
TO authenticated
USING (true);

-- Complaint flows for signed-in users
CREATE POLICY complaint_select_authenticated
ON public.complaint
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY complaint_insert_authenticated
ON public.complaint
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY complaint_update_authenticated
ON public.complaint
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Buyer profile read for signed-in users. Personal account and OTP tables
-- are intentionally not exposed via direct client policies.
CREATE POLICY buyerprofile_select_authenticated
ON public.buyerprofile
FOR SELECT
TO authenticated
USING (true);

-- Optional write access for authenticated users (uncomment only if frontend writes directly)
-- CREATE POLICY house_write_authenticated
-- ON public.house
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY sale_write_authenticated
-- ON public.sale
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY rental_write_authenticated
-- ON public.rental
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY bill_write_authenticated
-- ON public.maintenancebill
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY payment_write_authenticated
-- ON public.payment
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- Notes:
-- 1) Supabase service_role bypasses RLS, so backend server calls continue to work.
-- 2) Tighten these policies later by adding user_id columns and role-based checks via JWT claims.

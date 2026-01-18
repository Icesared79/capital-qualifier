-- FIX: Add missing INSERT and UPDATE policies for deals table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard

-- Allow users to insert deals for their own companies
CREATE POLICY "Users can insert own deals" ON public.deals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
  );

-- Allow users to update their own deals
CREATE POLICY "Users can update own deals" ON public.deals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
  );

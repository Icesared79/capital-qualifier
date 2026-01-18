-- Admin Dashboard Migration
-- Adds support for legal and optma roles and handoff tracking

-- 1. Update profiles.role constraint to include new roles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('client', 'admin', 'legal', 'optma', 'investor'));

-- 2. Add handoff tracking columns to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS
  handoff_to TEXT CHECK (handoff_to IN ('legal', 'optma'));

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS
  handed_off_at TIMESTAMPTZ;

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS
  handed_off_by UUID REFERENCES public.profiles(id);

-- 3. Add index for efficient handoff queries
CREATE INDEX IF NOT EXISTS idx_deals_handoff_to ON public.deals(handoff_to) WHERE handoff_to IS NOT NULL;

-- 4. Update RLS policies for legal and optma users to see their assigned deals
-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Legal users can view handed off deals" ON public.deals;
DROP POLICY IF EXISTS "Optma users can view handed off deals" ON public.deals;

-- Create policy for legal users
CREATE POLICY "Legal users can view handed off deals"
ON public.deals
FOR SELECT
TO authenticated
USING (
  handoff_to = 'legal'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'legal'
  )
);

-- Create policy for optma users
CREATE POLICY "Optma users can view handed off deals"
ON public.deals
FOR SELECT
TO authenticated
USING (
  handoff_to = 'optma'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'optma'
  )
);

-- 5. Allow legal/optma users to update internal_notes on their handed-off deals
DROP POLICY IF EXISTS "Legal users can update notes" ON public.deals;
DROP POLICY IF EXISTS "Optma users can update notes" ON public.deals;

CREATE POLICY "Legal users can update notes"
ON public.deals
FOR UPDATE
TO authenticated
USING (
  handoff_to = 'legal'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'legal'
  )
)
WITH CHECK (
  handoff_to = 'legal'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'legal'
  )
);

CREATE POLICY "Optma users can update notes"
ON public.deals
FOR UPDATE
TO authenticated
USING (
  handoff_to = 'optma'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'optma'
  )
)
WITH CHECK (
  handoff_to = 'optma'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'optma'
  )
);

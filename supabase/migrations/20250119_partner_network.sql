-- ============================================
-- PARTNER NETWORK EXPANSION
-- Adding Legal Partners alongside Funding Partners
-- BitCense Capital Qualifier
-- ============================================

-- ============================================
-- ADD PARTNER ROLE TO FUNDING_PARTNERS
-- Distinguishes between funding partners and legal partners
-- ============================================

-- Add partner_role column
ALTER TABLE public.funding_partners
ADD COLUMN IF NOT EXISTS partner_role TEXT NOT NULL DEFAULT 'funding'
CHECK (partner_role IN ('funding', 'legal', 'tokenization'));

-- Add comment for clarity
COMMENT ON COLUMN public.funding_partners.partner_role IS
  'Role in deal flow: funding (capital providers), legal (legal review/sign-off), or tokenization (token issuance)';

-- Create index for filtering by role
CREATE INDEX IF NOT EXISTS idx_funding_partners_role ON public.funding_partners(partner_role);


-- ============================================
-- ADD LEGAL PARTNER FIELDS TO DEALS
-- Track which legal partner is assigned and their status
-- ============================================

-- Add legal partner assignment
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS legal_partner_id UUID REFERENCES public.funding_partners(id);

-- Add legal review status
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS legal_status TEXT DEFAULT 'not_required' CHECK (legal_status IN (
  'not_required',    -- No legal review needed for this deal
  'pending',         -- Waiting for legal partner assignment
  'assigned',        -- Legal partner assigned, awaiting review
  'in_review',       -- Legal partner actively reviewing
  'approved',        -- Legal partner has signed off
  'changes_required', -- Legal partner requires changes
  'rejected'         -- Legal partner rejected
));

-- Track when legal sign-off occurred
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS legal_signed_off_at TIMESTAMPTZ;

-- Track any notes from legal review
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS legal_notes TEXT;

-- Comments for clarity
COMMENT ON COLUMN public.deals.legal_partner_id IS 'Assigned legal partner for deal review';
COMMENT ON COLUMN public.deals.legal_status IS 'Status of legal review process';
COMMENT ON COLUMN public.deals.legal_signed_off_at IS 'Timestamp when legal partner approved';
COMMENT ON COLUMN public.deals.legal_notes IS 'Notes from legal partner review';

-- Create index for legal partner queries
CREATE INDEX IF NOT EXISTS idx_deals_legal_partner ON public.deals(legal_partner_id);
CREATE INDEX IF NOT EXISTS idx_deals_legal_status ON public.deals(legal_status);


-- ============================================
-- ADD TOKENIZATION PARTNER FIELDS TO DEALS
-- Track which tokenization partner is assigned and their status
-- ============================================

-- Add tokenization partner assignment
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS tokenization_partner_id UUID REFERENCES public.funding_partners(id);

-- Add tokenization status
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS tokenization_status TEXT DEFAULT 'not_required' CHECK (tokenization_status IN (
  'not_required',     -- No tokenization needed
  'pending',          -- Waiting for partner assignment
  'assigned',         -- Partner assigned, awaiting green-light
  'green_lit',        -- BitCense approved, partner can proceed
  'configuring',      -- Partner configuring token
  'minting',          -- Token being minted
  'ready',            -- Token ready for distribution
  'failed'            -- Tokenization failed
));

-- Track tokenization timestamps
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS tokenization_green_lit_at TIMESTAMPTZ;
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS tokenization_completed_at TIMESTAMPTZ;
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS tokenization_notes TEXT;

-- Comments
COMMENT ON COLUMN public.deals.tokenization_partner_id IS 'Assigned tokenization partner';
COMMENT ON COLUMN public.deals.tokenization_status IS 'Status of tokenization process';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deals_tokenization_partner ON public.deals(tokenization_partner_id);
CREATE INDEX IF NOT EXISTS idx_deals_tokenization_status ON public.deals(tokenization_status);


-- ============================================
-- LEGAL PARTNER DEAL RELEASES
-- Legal partners also get deal releases like funding partners
-- Uses same deal_releases table with different status flow
-- ============================================

-- Add legal-specific status options to deal_releases
-- First drop the constraint, then recreate with new options
ALTER TABLE public.deal_releases
DROP CONSTRAINT IF EXISTS deal_releases_status_check;

ALTER TABLE public.deal_releases
ADD CONSTRAINT deal_releases_status_check CHECK (status IN (
  -- Funding partner statuses
  'pending',          -- Released but not yet viewed
  'viewed',           -- Partner has viewed the summary
  'interested',       -- Partner expressed interest
  'reviewing',        -- Partner is reviewing full package
  'due_diligence',    -- Partner doing their own DD
  'term_sheet',       -- Partner preparing/sent term sheet
  'passed',           -- Partner declined
  'funded',           -- Deal funded by this partner
  -- Legal partner statuses
  'legal_review',     -- Legal partner reviewing
  'legal_approved',   -- Legal partner approved
  'legal_changes',    -- Legal partner requires changes
  'legal_rejected'    -- Legal partner rejected
));


-- ============================================
-- RLS POLICIES FOR LEGAL PARTNERS
-- Legal partners have same access patterns as funding partners
-- ============================================

-- Legal partners can view deals released to them (same policy applies via slug match)
-- No additional policy needed since existing policy uses slug matching


-- ============================================
-- INSERT SAMPLE LEGAL PARTNER (IBL)
-- ============================================

-- Insert IBL as first legal partner (only if doesn't exist)
INSERT INTO public.funding_partners (
  name,
  slug,
  description,
  partner_role,
  partner_type,
  primary_contact_name,
  status
) VALUES (
  'IBL (Infinity Business Law)',
  'ibl',
  'Legal partner providing deal review and sign-off services',
  'legal',
  'other',
  'Aaron Krowne',
  'active'
) ON CONFLICT (slug) DO NOTHING;

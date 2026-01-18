-- ============================================
-- PARTNER NOTIFICATION PREFERENCES
-- Allows funding partners to set deal preferences and notification settings
-- ============================================

-- ============================================
-- PARTNER NOTIFICATION PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.partner_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES public.funding_partners(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Deal Criteria Preferences
  preferred_asset_classes TEXT[], -- e.g., ['residential_re', 'consumer_loans']
  min_deal_size TEXT,              -- e.g., '$500K'
  max_deal_size TEXT,              -- e.g., '$10M'
  preferred_geographies TEXT[],    -- e.g., ['US', 'California', 'Texas']
  min_score INTEGER,               -- Minimum overall score (0-100)

  -- Notification Settings
  email_alerts_enabled BOOLEAN DEFAULT true,
  email_frequency TEXT DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily_digest', 'weekly_digest', 'off')),
  in_app_alerts_enabled BOOLEAN DEFAULT true,
  notification_email TEXT,         -- Override email for notifications

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.partner_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Admins can manage all preferences
CREATE POLICY "Admins can manage partner preferences" ON public.partner_notification_preferences
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Partners can view and update their own preferences
CREATE POLICY "Partners can view own preferences" ON public.partner_notification_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.funding_partners fp
      WHERE fp.id = partner_id
      AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Partners can update own preferences" ON public.partner_notification_preferences
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.funding_partners fp
      WHERE fp.id = partner_id
      AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Partners can insert own preferences" ON public.partner_notification_preferences
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.funding_partners fp
      WHERE fp.id = partner_id
      AND fp.slug = (SELECT role FROM public.profiles WHERE id = auth.uid())
    )
  );

-- ============================================
-- EXTEND NOTIFICATIONS TABLE
-- Add partner alert notification types
-- ============================================

-- Drop existing constraint if it exists, then add new one with additional types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'stage_change',
    'document_approved',
    'document_rejected',
    'action_required',
    'new_deal_released',
    'deal_matches_criteria'
  ));

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partner_preferences_partner ON public.partner_notification_preferences(partner_id);

-- ============================================
-- UPDATE TRIGGER
-- ============================================
CREATE TRIGGER update_partner_notification_preferences_updated_at
  BEFORE UPDATE ON public.partner_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- INITIALIZE PREFERENCES FOR EXISTING PARTNERS
-- Creates default preferences for any existing partners
-- ============================================
INSERT INTO public.partner_notification_preferences (partner_id)
SELECT id FROM public.funding_partners
WHERE id NOT IN (SELECT partner_id FROM public.partner_notification_preferences)
ON CONFLICT (partner_id) DO NOTHING;

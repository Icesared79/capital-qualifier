-- Migration: Workflow Management System
-- Adds notifications, document checklists, and deal checklist tracking

-- ============================================
-- ENABLE UUID EXTENSION (if not already enabled)
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('stage_change', 'document_approved', 'document_rejected', 'action_required')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System/admins can insert notifications for any user
CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- ============================================
-- DOCUMENT CHECKLIST ITEMS TABLE (Predefined Requirements)
-- ============================================
CREATE TABLE IF NOT EXISTS public.document_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('financials', 'loan_tape', 'legal', 'corporate', 'due_diligence', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for stage-based queries
CREATE INDEX IF NOT EXISTS idx_checklist_items_stage ON public.document_checklist_items(stage);

-- Enable RLS (everyone can read checklist items)
ALTER TABLE public.document_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view checklist items" ON public.document_checklist_items
  FOR SELECT USING (true);

-- ============================================
-- DEAL CHECKLIST STATUS TABLE (Tracks completion per deal)
-- ============================================
CREATE TABLE IF NOT EXISTS public.deal_checklist_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE NOT NULL,
  checklist_item_id UUID REFERENCES public.document_checklist_items(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'approved', 'waived')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(deal_id, checklist_item_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_deal_checklist_deal_id ON public.deal_checklist_status(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_checklist_status ON public.deal_checklist_status(status);

-- Enable RLS
ALTER TABLE public.deal_checklist_status ENABLE ROW LEVEL SECURITY;

-- Users can view checklist status for their own deals
CREATE POLICY "Users can view own deal checklist status" ON public.deal_checklist_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.companies c ON d.company_id = c.id
      WHERE d.id = deal_id AND c.owner_id = auth.uid()
    )
  );

-- Users can update checklist status for their own deals
CREATE POLICY "Users can update own deal checklist status" ON public.deal_checklist_status
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.companies c ON d.company_id = c.id
      WHERE d.id = deal_id AND c.owner_id = auth.uid()
    )
  );

-- Users can insert checklist status for their own deals
CREATE POLICY "Users can insert own deal checklist status" ON public.deal_checklist_status
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.companies c ON d.company_id = c.id
      WHERE d.id = deal_id AND c.owner_id = auth.uid()
    )
  );

-- Admins can manage all checklist statuses
CREATE POLICY "Admins can manage all checklist status" ON public.deal_checklist_status
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- ADMIN POLICIES FOR DEALS
-- ============================================

-- Allow admins to update any deal
DROP POLICY IF EXISTS "Admins can update any deal" ON public.deals;
CREATE POLICY "Admins can update any deal" ON public.deals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to view any deal
DROP POLICY IF EXISTS "Admins can view any deal" ON public.deals;
CREATE POLICY "Admins can view any deal" ON public.deals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- ADMIN POLICIES FOR DOCUMENTS
-- ============================================

-- Allow admins to update any document
DROP POLICY IF EXISTS "Admins can update any document" ON public.documents;
CREATE POLICY "Admins can update any document" ON public.documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to view any document
DROP POLICY IF EXISTS "Admins can view any document" ON public.documents;
CREATE POLICY "Admins can view any document" ON public.documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- ADMIN POLICIES FOR NOTIFICATIONS
-- ============================================

-- Allow admins to view all notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- SEED DATA: Document Requirements by Stage
-- ============================================

-- Clear existing seed data (if re-running)
DELETE FROM public.document_checklist_items;

-- Qualified Stage - Corporate Documents
INSERT INTO public.document_checklist_items (id, stage, category, name, description, is_required, display_order) VALUES
  (uuid_generate_v4(), 'qualified', 'corporate', 'Company Formation Documents', 'Articles of incorporation, operating agreement, or equivalent formation documents', true, 1),
  (uuid_generate_v4(), 'qualified', 'corporate', 'Ownership Structure', 'Cap table, ownership chart, or similar document showing ownership structure', true, 2);

-- Documents Requested Stage - Financials & Loan Tape
INSERT INTO public.document_checklist_items (id, stage, category, name, description, is_required, display_order) VALUES
  (uuid_generate_v4(), 'documents_requested', 'financials', 'Financial Statements (3 years)', 'Audited or reviewed financial statements for the past 3 years', true, 1),
  (uuid_generate_v4(), 'documents_requested', 'financials', 'Bank Statements (6 months)', 'Bank statements from all operating accounts for the past 6 months', true, 2),
  (uuid_generate_v4(), 'documents_requested', 'loan_tape', 'Loan Tape / Portfolio Data', 'Detailed loan-level data export including origination, terms, and performance', true, 3),
  (uuid_generate_v4(), 'documents_requested', 'loan_tape', 'Performance History', 'Historical performance data including delinquency, default, and recovery rates', true, 4);

-- Due Diligence Stage - Legal & DD Documents
INSERT INTO public.document_checklist_items (id, stage, category, name, description, is_required, display_order) VALUES
  (uuid_generate_v4(), 'due_diligence', 'legal', 'Loan Agreements (samples)', 'Sample loan agreements or form documents used with borrowers', true, 1),
  (uuid_generate_v4(), 'due_diligence', 'due_diligence', 'Insurance Certificates', 'Current insurance certificates covering operations and portfolio', true, 2);

-- Term Sheet Stage - Signed Term Sheet
INSERT INTO public.document_checklist_items (id, stage, category, name, description, is_required, display_order) VALUES
  (uuid_generate_v4(), 'term_sheet', 'legal', 'Term Sheet (signed)', 'Fully executed term sheet agreeing to proposed terms', true, 1);

-- Closing Stage - Final Documents
INSERT INTO public.document_checklist_items (id, stage, category, name, description, is_required, display_order) VALUES
  (uuid_generate_v4(), 'closing', 'legal', 'Final Agreements', 'All executed final transaction documents', true, 1),
  (uuid_generate_v4(), 'closing', 'corporate', 'Board Resolutions', 'Board resolutions authorizing the transaction', true, 2);

-- ============================================
-- FUNCTION: Initialize deal checklist status
-- ============================================
CREATE OR REPLACE FUNCTION public.initialize_deal_checklist()
RETURNS TRIGGER AS $$
BEGIN
  -- When a deal moves to a new stage, initialize checklist items for that stage
  INSERT INTO public.deal_checklist_status (deal_id, checklist_item_id, status)
  SELECT NEW.id, dci.id, 'pending'
  FROM public.document_checklist_items dci
  WHERE dci.stage = NEW.stage
  ON CONFLICT (deal_id, checklist_item_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize checklist when deal stage changes
DROP TRIGGER IF EXISTS initialize_deal_checklist_trigger ON public.deals;
CREATE TRIGGER initialize_deal_checklist_trigger
  AFTER INSERT OR UPDATE OF stage ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_deal_checklist();

-- ============================================
-- FUNCTION: Create notification
-- ============================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_deal_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, deal_id, type, title, message)
  VALUES (p_user_id, p_deal_id, p_type, p_title, p_message)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.notifications IS 'In-app notifications for users about deal status changes';
COMMENT ON TABLE public.document_checklist_items IS 'Predefined document requirements by stage';
COMMENT ON TABLE public.deal_checklist_status IS 'Tracks document checklist completion per deal';
COMMENT ON FUNCTION public.create_notification IS 'Helper function to create notifications for users';

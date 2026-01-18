-- ============================================
-- LEGAL TERMS ACKNOWLEDGEMENT SYSTEM
-- Capital Qualifier
-- ============================================

-- ============================================
-- TERMS DOCUMENTS TABLE
-- Versioned legal documents for user acceptance
-- ============================================
CREATE TABLE IF NOT EXISTS public.terms_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Document Type & Version
  document_type TEXT NOT NULL CHECK (document_type IN (
    'platform_tos',           -- Platform Terms of Service (signup)
    'originator_agreement',   -- Originator Agreement (first offering)
    'offering_certification', -- Offering Certification (each deal submission)
    'partner_network_agreement', -- Partner Network Agreement (partner onboarding)
    'deal_confidentiality'    -- Deal Confidentiality/NDA (express interest)
  )),
  version TEXT NOT NULL,      -- e.g., '1.0', '1.1', '2.0'
  effective_date DATE NOT NULL,

  -- Content
  title TEXT NOT NULL,
  summary TEXT,               -- Brief description shown before full text
  content TEXT NOT NULL,      -- Full text (markdown supported)

  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT false, -- Only one active per type
  requires_scroll BOOLEAN NOT NULL DEFAULT true, -- Must scroll to bottom before accepting

  -- Metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: only one active document per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_terms_documents_active_type
  ON public.terms_documents(document_type) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.terms_documents ENABLE ROW LEVEL SECURITY;

-- Everyone can read active terms documents
CREATE POLICY "Anyone can read active terms" ON public.terms_documents
  FOR SELECT USING (is_active = true);

-- Admins can manage terms documents
CREATE POLICY "Admins can manage terms documents" ON public.terms_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================
-- TERMS ACKNOWLEDGEMENTS TABLE
-- Records of user acceptance with context
-- ============================================
CREATE TABLE IF NOT EXISTS public.terms_acknowledgements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User & Document
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  terms_document_id UUID REFERENCES public.terms_documents(id) ON DELETE RESTRICT NOT NULL,

  -- Context: When/why was this accepted?
  context_type TEXT NOT NULL CHECK (context_type IN (
    'signup',              -- Account creation (ToS)
    'first_offering',      -- First offering submission (Originator Agreement)
    'offering_submission', -- Each deal submission (Offering Certification)
    'partner_onboarding',  -- Partner profile access (Partner Network Agreement)
    'deal_interest'        -- Express interest in deal (Deal Confidentiality)
  )),
  context_entity_id UUID,  -- deal_id, partner_id, or null depending on context

  -- Acknowledgement Details
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,

  -- Explicit Confirmation
  checkbox_confirmed BOOLEAN NOT NULL DEFAULT false,
  scrolled_to_bottom BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.terms_acknowledgements ENABLE ROW LEVEL SECURITY;

-- Users can view their own acknowledgements
CREATE POLICY "Users can view own acknowledgements" ON public.terms_acknowledgements
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own acknowledgements
CREATE POLICY "Users can create acknowledgements" ON public.terms_acknowledgements
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all acknowledgements
CREATE POLICY "Admins can view all acknowledgements" ON public.terms_acknowledgements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_terms_documents_type ON public.terms_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_terms_documents_active ON public.terms_documents(is_active);

CREATE INDEX IF NOT EXISTS idx_terms_ack_user ON public.terms_acknowledgements(user_id);
CREATE INDEX IF NOT EXISTS idx_terms_ack_document ON public.terms_acknowledgements(terms_document_id);
CREATE INDEX IF NOT EXISTS idx_terms_ack_context ON public.terms_acknowledgements(context_type);
CREATE INDEX IF NOT EXISTS idx_terms_ack_entity ON public.terms_acknowledgements(context_entity_id);
CREATE INDEX IF NOT EXISTS idx_terms_ack_user_document ON public.terms_acknowledgements(user_id, terms_document_id);


-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE TRIGGER update_terms_documents_updated_at
  BEFORE UPDATE ON public.terms_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================
-- HELPER FUNCTION: Check if user has accepted terms
-- ============================================
CREATE OR REPLACE FUNCTION public.has_accepted_terms(
  p_user_id UUID,
  p_document_type TEXT,
  p_context_entity_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_accepted BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.terms_acknowledgements ta
    JOIN public.terms_documents td ON ta.terms_document_id = td.id
    WHERE ta.user_id = p_user_id
      AND td.document_type = p_document_type
      AND td.is_active = true
      AND (
        p_context_entity_id IS NULL
        OR ta.context_entity_id = p_context_entity_id
      )
  ) INTO v_has_accepted;

  RETURN v_has_accepted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- HELPER FUNCTION: Get active terms document
-- ============================================
CREATE OR REPLACE FUNCTION public.get_active_terms(
  p_document_type TEXT
)
RETURNS TABLE (
  id UUID,
  document_type TEXT,
  version TEXT,
  effective_date DATE,
  title TEXT,
  summary TEXT,
  content TEXT,
  requires_scroll BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    td.id,
    td.document_type,
    td.version,
    td.effective_date,
    td.title,
    td.summary,
    td.content,
    td.requires_scroll
  FROM public.terms_documents td
  WHERE td.document_type = p_document_type
    AND td.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- SEED DATA: Initial Terms Documents
-- ============================================

-- 1. Platform Terms of Service
INSERT INTO public.terms_documents (
  document_type, version, effective_date, title, summary, content, is_active, requires_scroll
) VALUES (
  'platform_tos',
  '1.0',
  '2026-01-01',
  'Platform Terms of Service',
  'These terms govern your use of the Capital Qualifier platform.',
  '# Platform Terms of Service

**Effective Date:** January 1, 2026

## 1. Acceptance of Terms

By accessing or using the Capital Qualifier platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform.

## 2. Eligibility

You must be at least 18 years old and have the legal capacity to enter into binding contracts to use this Platform. By using the Platform, you represent and warrant that you meet these requirements.

## 3. Account Registration

To access certain features of the Platform, you must register for an account. You agree to:
- Provide accurate, current, and complete information during registration
- Maintain and promptly update your account information
- Maintain the security and confidentiality of your login credentials
- Accept responsibility for all activities under your account
- Notify us immediately of any unauthorized use of your account

## 4. Platform Services

Capital Qualifier provides a platform for:
- Submitting funding applications for capital raising
- Connecting with institutional funding partners
- Managing deal documentation and compliance
- Facilitating due diligence processes

## 5. User Conduct

You agree not to:
- Use the Platform for any unlawful purpose
- Submit false, misleading, or fraudulent information
- Interfere with or disrupt the Platform''s operation
- Attempt to gain unauthorized access to any systems
- Violate any applicable securities laws or regulations

## 6. Intellectual Property

All content on the Platform, including text, graphics, logos, and software, is the property of Capital Qualifier or its licensors and is protected by intellectual property laws.

## 7. Privacy

Your use of the Platform is subject to our Privacy Policy. By using the Platform, you consent to our collection and use of information as described in the Privacy Policy.

## 8. Disclaimers

THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. CAPITAL QUALIFIER DOES NOT GUARANTEE:
- The accuracy or completeness of any information on the Platform
- That the Platform will be uninterrupted or error-free
- Any particular outcome from using the Platform

## 9. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, CAPITAL QUALIFIER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM.

## 10. Indemnification

You agree to indemnify and hold harmless Capital Qualifier and its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Platform or violation of these Terms.

## 11. Governing Law

These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions.

## 12. Dispute Resolution

Any disputes arising from these Terms or your use of the Platform shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.

## 13. Modifications

We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the updated Terms on the Platform. Your continued use of the Platform after such changes constitutes acceptance of the modified Terms.

## 14. Termination

We may terminate or suspend your account at any time for any reason, including violation of these Terms. Upon termination, your right to use the Platform will immediately cease.

## 15. Contact Information

For questions about these Terms, please contact us at admin@bitcense.com.',
  true,
  true
);

-- 2. Originator Agreement
INSERT INTO public.terms_documents (
  document_type, version, effective_date, title, summary, content, is_active, requires_scroll
) VALUES (
  'originator_agreement',
  '1.0',
  '2026-01-01',
  'Originator Agreement',
  'Agreement governing your rights and obligations as a deal originator on the platform.',
  '# Originator Agreement

**Effective Date:** January 1, 2026

This Originator Agreement ("Agreement") is entered into between you ("Originator") and Capital Qualifier, Inc. ("Company").

## 1. Purpose

This Agreement governs your submission of funding applications and deal information through the Capital Qualifier platform for the purpose of connecting with institutional funding partners.

## 2. Representations and Warranties

By submitting any funding application or deal information, you represent and warrant that:

### 2.1 Authority
- You have full authority to submit the application on behalf of the entity seeking funding
- You are authorized to share the information provided with potential funding partners
- You have obtained all necessary consents from your organization

### 2.2 Accuracy
- All information provided is accurate, complete, and not misleading
- All financial data and projections are based on reasonable assumptions
- You have disclosed all material facts relevant to the funding request

### 2.3 Compliance
- The funding request does not violate any applicable laws or regulations
- The underlying business operations are lawful and properly licensed
- You are not subject to any restrictions that would prevent the transaction

## 3. Authorization to Share Information

You hereby authorize Capital Qualifier to:
- Share your application and deal information with selected funding partners
- Conduct or facilitate due diligence investigations
- Verify the information you have provided
- Store and process your information in accordance with our Privacy Policy

## 4. Confidential Information

Capital Qualifier will treat your deal information as confidential and will only share it with:
- Funding partners who have agreed to confidentiality obligations
- Service providers bound by appropriate confidentiality agreements
- As required by law or regulatory authorities

## 5. No Guarantee of Funding

You acknowledge and agree that:
- Submission of an application does not guarantee funding
- Capital Qualifier does not guarantee any particular outcome
- Funding decisions are made solely by the funding partners
- Capital Qualifier acts only as a facilitator, not a lender or investor

## 6. Fees

Any fees associated with using the Platform or successfully obtaining funding will be disclosed to you in advance and agreed upon separately.

## 7. Ongoing Obligations

You agree to:
- Promptly notify us of any material changes to your application
- Provide additional information reasonably requested during due diligence
- Maintain accurate and current contact information
- Comply with all applicable securities laws and regulations

## 8. Indemnification

You agree to indemnify and hold harmless Capital Qualifier, its funding partners, and their respective officers, directors, employees, and agents from any claims, damages, or expenses arising from:
- Any breach of your representations or warranties
- Any inaccuracy in information you provide
- Your violation of any applicable laws or regulations

## 9. Term and Termination

This Agreement remains in effect for the duration of your relationship with Capital Qualifier. Either party may terminate upon written notice, subject to survival of provisions that by their nature should survive.

## 10. Governing Law

This Agreement shall be governed by the laws of the State of Delaware.

By checking the box below, you acknowledge that you have read, understood, and agree to be bound by this Originator Agreement.',
  true,
  true
);

-- 3. Offering Certification
INSERT INTO public.terms_documents (
  document_type, version, effective_date, title, summary, content, is_active, requires_scroll
) VALUES (
  'offering_certification',
  '1.0',
  '2026-01-01',
  'Offering Certification',
  'Certification of accuracy and authority for this specific offering submission.',
  '# Offering Certification

**Effective Date:** January 1, 2026

## Certification Statement

I hereby certify the following with respect to this funding application submission:

## 1. Accuracy of Information

I certify that all information provided in this application, including but not limited to:
- Business and financial information
- Asset descriptions and valuations
- Revenue and expense data
- Ownership and organizational structure
- Outstanding obligations and liabilities

is true, accurate, complete, and not misleading in any material respect as of the date of submission.

## 2. Authority

I certify that I have the full legal authority to:
- Submit this application on behalf of the entity seeking funding
- Bind the entity to the terms and conditions of this submission
- Share the information provided with Capital Qualifier and its funding partners
- Make the representations and warranties contained herein

## 3. Material Changes

I agree to promptly notify Capital Qualifier of any material changes to the information provided in this application, including but not limited to:
- Changes in financial condition
- Changes in ownership or management
- Pending or threatened litigation
- Changes in asset values or conditions
- Any event that would make any statement in this application untrue or misleading

## 4. Due Diligence Cooperation

I agree to cooperate fully with any due diligence requests from Capital Qualifier or its funding partners, including providing additional documentation, access to records, and clarification of any matters related to this application.

## 5. No Omissions

I certify that I have not omitted any information that would be material to a funding partner''s evaluation of this application or that would make any statement herein misleading.

## 6. Legal Compliance

I certify that the proposed use of funds and the underlying business operations comply with all applicable laws and regulations.

## 7. Acknowledgment of Consequences

I understand that:
- This certification may be relied upon by Capital Qualifier and funding partners
- Any material misrepresentation may result in rejection of this application
- False statements may result in legal liability and potential criminal penalties
- I may be required to reaffirm these certifications at various stages of the process

By checking the box below, I certify under penalty of perjury that the foregoing statements are true and correct.',
  true,
  false
);

-- 4. Partner Network Agreement
INSERT INTO public.terms_documents (
  document_type, version, effective_date, title, summary, content, is_active, requires_scroll
) VALUES (
  'partner_network_agreement',
  '1.0',
  '2026-01-01',
  'Partner Network Agreement',
  'Agreement governing your participation in the Capital Qualifier funding partner network.',
  '# Partner Network Agreement

**Effective Date:** January 1, 2026

This Partner Network Agreement ("Agreement") governs your participation as a funding partner in the Capital Qualifier network.

## 1. Partner Network Overview

The Capital Qualifier Partner Network connects institutional funding sources with qualified deal opportunities. As a partner, you will have access to curated funding applications and deal information.

## 2. Confidentiality Obligations

### 2.1 Confidential Information
You agree to maintain strict confidentiality regarding all deal information, applications, and materials ("Confidential Information") received through the Platform.

### 2.2 Permitted Use
Confidential Information may only be used for:
- Evaluating potential funding opportunities
- Conducting due diligence on deals of interest
- Making investment decisions

### 2.3 Non-Disclosure
You agree not to disclose Confidential Information to any third party without:
- Prior written consent from Capital Qualifier
- The originator''s express authorization
- Legal compulsion (with prompt notice to Capital Qualifier)

### 2.4 Reasonable Care
You shall protect Confidential Information using at least the same degree of care used to protect your own confidential information, but in no event less than reasonable care.

## 3. Non-Circumvention

### 3.1 Prohibition
You agree not to directly or indirectly circumvent Capital Qualifier by:
- Contacting originators outside the Platform without authorization
- Structuring transactions to avoid Platform involvement
- Soliciting originators for direct relationships
- Using Confidential Information to compete with Capital Qualifier

### 3.2 Duration
This non-circumvention obligation shall survive for a period of two (2) years following your last access to any particular deal information.

## 4. Compliance Requirements

### 4.1 Regulatory Compliance
You represent and warrant that:
- You are properly licensed and authorized to participate in funding activities
- You comply with all applicable securities laws and regulations
- You maintain appropriate compliance programs and controls

### 4.2 Anti-Money Laundering
You agree to comply with all applicable anti-money laundering laws and maintain appropriate KYC/AML procedures.

### 4.3 Accredited Investor Status
If applicable, you represent that you meet the definition of an accredited investor under applicable securities laws.

## 5. Platform Access

### 5.1 Account Security
You agree to maintain the security of your account credentials and immediately notify Capital Qualifier of any unauthorized access.

### 5.2 Authorized Users
You may designate authorized users within your organization, and you are responsible for their compliance with this Agreement.

## 6. Deal Evaluation

### 6.1 Independent Analysis
You acknowledge that all funding decisions are your sole responsibility and you will conduct your own independent analysis and due diligence.

### 6.2 No Recommendations
Capital Qualifier does not make recommendations or provide investment advice. Deal scoring and information are provided for informational purposes only.

## 7. Fees and Payments

Any fees payable for participation in the Partner Network or for successful transactions will be set forth in a separate fee schedule or agreement.

## 8. Term and Termination

### 8.1 Term
This Agreement is effective upon your acceptance and continues until terminated.

### 8.2 Termination
Either party may terminate upon thirty (30) days written notice. Capital Qualifier may terminate immediately for breach.

### 8.3 Survival
Confidentiality and non-circumvention obligations survive termination.

## 9. Limitation of Liability

CAPITAL QUALIFIER''S LIABILITY UNDER THIS AGREEMENT SHALL BE LIMITED TO DIRECT DAMAGES AND SHALL NOT EXCEED FEES PAID BY YOU IN THE TWELVE MONTHS PRECEDING THE CLAIM.

## 10. Governing Law and Disputes

This Agreement shall be governed by Delaware law. Disputes shall be resolved through binding arbitration.

By checking the box below, you acknowledge that you have read, understood, and agree to be bound by this Partner Network Agreement.',
  true,
  true
);

-- 5. Deal Confidentiality Agreement
INSERT INTO public.terms_documents (
  document_type, version, effective_date, title, summary, content, is_active, requires_scroll
) VALUES (
  'deal_confidentiality',
  '1.0',
  '2026-01-01',
  'Deal Confidentiality Agreement',
  'Non-disclosure agreement for accessing confidential deal information.',
  '# Deal Confidentiality Agreement

**Effective Date:** January 1, 2026

This Deal Confidentiality Agreement ("Agreement") is entered into in connection with your review of the confidential deal information identified below.

## 1. Purpose

You are being provided access to confidential information regarding a potential funding opportunity ("Deal") for the sole purpose of evaluating whether to provide funding or investment.

## 2. Confidential Information

"Confidential Information" includes all information provided to you regarding the Deal, including but not limited to:
- Business plans and financial projections
- Historical financial statements and data
- Asset information and valuations
- Customer and vendor information
- Proprietary technology and processes
- Legal and regulatory matters
- Any other non-public information regarding the Deal or the originator

## 3. Obligations

### 3.1 Non-Disclosure
You agree to:
- Keep all Confidential Information strictly confidential
- Not disclose Confidential Information to any third party without prior written consent
- Limit internal disclosure to those with a need to know who are bound by confidentiality obligations
- Not use Confidential Information for any purpose other than evaluating the Deal

### 3.2 Standard of Care
You shall protect Confidential Information using the same degree of care used to protect your own confidential information, but in no event less than a reasonable standard of care.

### 3.3 No Copying
You shall not copy or reproduce Confidential Information except as reasonably necessary for evaluation purposes.

## 4. Exclusions

Confidential Information does not include information that:
- Is or becomes publicly available through no fault of yours
- Was already in your possession before disclosure
- Is independently developed by you without use of Confidential Information
- Is rightfully obtained from a third party without restriction

## 5. Required Disclosure

If you are legally compelled to disclose Confidential Information, you shall:
- Provide prompt written notice to Capital Qualifier (unless prohibited by law)
- Cooperate in seeking protective measures
- Disclose only the minimum information legally required

## 6. Return of Information

Upon request or upon deciding not to proceed with the Deal, you shall:
- Return or destroy all Confidential Information
- Certify in writing that all copies have been returned or destroyed
- Delete all electronic copies from your systems

## 7. No License

Nothing in this Agreement grants you any license or rights to the Confidential Information or any intellectual property contained therein.

## 8. No Obligation

This Agreement does not obligate:
- You to provide funding or investment
- The originator to accept any offer
- Capital Qualifier to facilitate any transaction

## 9. Non-Solicitation

For a period of two (2) years, you agree not to directly solicit or hire any employee of the originator whose identity became known to you through this Deal.

## 10. Duration

The confidentiality obligations under this Agreement shall continue for a period of two (2) years from the date of disclosure, or until the information becomes public through no fault of yours, whichever is earlier.

## 11. Remedies

You acknowledge that breach of this Agreement may cause irreparable harm for which monetary damages would be inadequate. Therefore, in addition to other remedies, the aggrieved party shall be entitled to seek equitable relief, including injunction and specific performance.

## 12. Governing Law

This Agreement shall be governed by the laws of the State of Delaware, without regard to conflict of law principles.

## 13. Acknowledgment

By checking the box below, you acknowledge and agree that:
- You have read and understood this Agreement
- You agree to be bound by its terms
- You are authorized to enter into this Agreement on behalf of your organization
- Violation of this Agreement may result in legal liability

This Agreement is effective as of the date of your acceptance below.',
  true,
  true
);


-- ============================================
-- GRANT EXECUTE ON FUNCTIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.has_accepted_terms(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_terms(TEXT) TO authenticated;

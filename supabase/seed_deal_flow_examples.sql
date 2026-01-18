-- Seed Deal Flow Examples
-- Run this SQL to populate the deal_flow_examples table with real-world scenarios

-- Example 1: Real Estate Fast Track - Successful Funding
INSERT INTO deal_flow_examples (
  title,
  deal_type,
  description,
  timeline_days,
  stages,
  lessons_learned,
  is_published,
  display_order
) VALUES (
  'Real Estate Portfolio Fast Track',
  'Real Estate',
  'A well-prepared commercial real estate lender with a $15M portfolio of bridge loans. Strong documentation and track record enabled expedited review and funding within 3 weeks.',
  21,
  '[
    {
      "stage": "qualified",
      "day": 1,
      "duration_days": 1,
      "notes": "Initial application reviewed. Portfolio metrics strong: 2.1% default rate, 78% avg LTV, 18-month track record.",
      "actions": ["Application submitted", "Initial screening passed", "Assigned to deal team"]
    },
    {
      "stage": "documents_requested",
      "day": 2,
      "duration_days": 3,
      "notes": "Document checklist sent. Client had most documents prepared in advance, submitted 90% within 48 hours.",
      "actions": ["Loan tape uploaded", "Appraisals provided", "Financials submitted", "Rent rolls shared"]
    },
    {
      "stage": "under_review",
      "day": 5,
      "duration_days": 5,
      "notes": "Due diligence in progress. Portfolio scoring completed with A- grade. Minor concentration issue flagged (35% in one market).",
      "actions": ["Portfolio scored: 87/100", "Concentration analysis", "Property valuations verified", "Borrower credit checks"]
    },
    {
      "stage": "term_sheet",
      "day": 10,
      "duration_days": 4,
      "notes": "Term sheet issued by funding partner. 85% advance rate offered with 12-month facility. Client accepted terms within 2 days.",
      "actions": ["Term sheet drafted", "Legal review", "Client negotiation", "Terms accepted"]
    },
    {
      "stage": "closing",
      "day": 14,
      "duration_days": 6,
      "notes": "Legal documentation and final due diligence. UCC filings prepared, custody arrangements confirmed.",
      "actions": ["Loan docs prepared", "UCC filings", "Custodian setup", "Final compliance check"]
    },
    {
      "stage": "funded",
      "day": 21,
      "duration_days": 0,
      "notes": "Successfully funded! $12.75M facility closed. First advance drawn same day.",
      "actions": ["Funds wired", "Facility activated", "Ongoing reporting setup"]
    }
  ]'::jsonb,
  ARRAY[
    'Having documents prepared before applying significantly accelerates the timeline',
    'Strong portfolio metrics (low defaults, reasonable LTV) attract better terms',
    'Minor concentration issues can be worked around with proper explanation',
    'Responsive communication throughout the process builds partner confidence'
  ],
  true,
  10
);

-- Example 2: Consumer Lending Portfolio - Successful with Extended Review
INSERT INTO deal_flow_examples (
  title,
  deal_type,
  description,
  timeline_days,
  stages,
  lessons_learned,
  is_published,
  display_order
) VALUES (
  'Consumer Lending Scale-Up',
  'Consumer Lending',
  'A growing consumer lender seeking $8M to expand their personal loan portfolio. Required additional documentation and credit enhancement, but ultimately secured favorable terms.',
  42,
  '[
    {
      "stage": "qualified",
      "day": 1,
      "duration_days": 2,
      "notes": "Application reviewed. Promising growth metrics but limited track record (14 months). Assigned for enhanced due diligence.",
      "actions": ["Application reviewed", "Growth trajectory analyzed", "Enhanced DD flagged"]
    },
    {
      "stage": "documents_requested",
      "day": 3,
      "duration_days": 8,
      "notes": "Extended document list required due to shorter track record. Client needed time to compile historical servicing data.",
      "actions": ["Loan tape formatting", "Credit policy documentation", "Collections procedures", "State licensing verification"]
    },
    {
      "stage": "under_review",
      "day": 11,
      "duration_days": 14,
      "notes": "Thorough portfolio analysis. AI scoring identified strong cash flows but flagged 6.2% 30-day delinquency. Additional data requested on recovery rates.",
      "actions": ["Portfolio scored: 74/100", "Cash flow analysis", "Delinquency deep dive", "Recovery rate verification"]
    },
    {
      "stage": "term_sheet",
      "day": 25,
      "duration_days": 7,
      "notes": "Term sheet received with credit enhancement requirement (10% reserve account). After negotiation, reduced to 7.5% reserve with performance triggers.",
      "actions": ["Initial terms reviewed", "Reserve negotiation", "Performance covenants discussed", "Final terms agreed"]
    },
    {
      "stage": "closing",
      "day": 32,
      "duration_days": 9,
      "notes": "Complex legal structure required for consumer receivables. State-by-state compliance verified.",
      "actions": ["Legal structuring", "State compliance", "Backup servicer identified", "Insurance requirements"]
    },
    {
      "stage": "funded",
      "day": 42,
      "duration_days": 0,
      "notes": "Facility closed at $7.5M with path to $12M upon meeting performance benchmarks. Reserve funded on day one.",
      "actions": ["Initial funding", "Reserve account funded", "Reporting systems connected"]
    }
  ]'::jsonb,
  ARRAY[
    'Shorter track records require more extensive documentation - prepare accordingly',
    'Credit enhancements (reserves, guarantees) can bridge the gap for newer originators',
    'Clear communication about delinquency causes and mitigation strategies is essential',
    'Performance-based facility increases incentivize good portfolio management',
    'Consumer lending requires careful attention to state-by-state licensing compliance'
  ],
  true,
  20
);

-- Example 3: Equipment Finance - Funded After Challenges
INSERT INTO deal_flow_examples (
  title,
  deal_type,
  description,
  timeline_days,
  stages,
  lessons_learned,
  is_published,
  display_order
) VALUES (
  'Equipment Finance Turnaround',
  'Equipment Finance',
  'An equipment finance company with a $22M portfolio of construction and medical equipment leases. Initial challenges with documentation quality were resolved through a structured remediation process.',
  56,
  '[
    {
      "stage": "qualified",
      "day": 1,
      "duration_days": 2,
      "notes": "Strong equipment mix and low loss history. However, initial document submission was incomplete with formatting issues.",
      "actions": ["Application approved", "Document quality concerns noted", "Remediation guidance provided"]
    },
    {
      "stage": "documents_requested",
      "day": 3,
      "duration_days": 14,
      "notes": "Significant document remediation required. Loan tape needed reformatting, several equipment appraisals were outdated.",
      "actions": ["Loan tape restructured", "Updated appraisals ordered", "UCC filing audit", "Title verification"]
    },
    {
      "stage": "under_review",
      "day": 17,
      "duration_days": 18,
      "notes": "Extended review due to equipment diversity. Individual asset valuations required for high-value items. Portfolio scored B+ with strong fundamentals.",
      "actions": ["Portfolio scored: 79/100", "Equipment depreciation analysis", "Lessee credit review", "Residual value assessment"]
    },
    {
      "stage": "term_sheet",
      "day": 35,
      "duration_days": 8,
      "notes": "Multiple term sheets received. Selected partner offering best advance rates on medical equipment (higher residuals).",
      "actions": ["Three term sheets compared", "Partner selection", "Terms negotiation", "Advance rate optimization"]
    },
    {
      "stage": "closing",
      "day": 43,
      "duration_days": 12,
      "notes": "Complex closing due to equipment across 12 states. Title transfers and UCC amendments processed.",
      "actions": ["Multi-state UCC filings", "Equipment inspection", "Insurance verification", "Servicing agreement"]
    },
    {
      "stage": "funded",
      "day": 56,
      "duration_days": 0,
      "notes": "Successfully funded $18.7M facility. Advance rates: 85% medical, 75% construction. Additional $5M accordion available.",
      "actions": ["Funding completed", "Equipment tracking system linked", "Quarterly reporting established"]
    }
  ]'::jsonb,
  ARRAY[
    'Document quality issues early add weeks to timeline - invest in proper formatting upfront',
    'Equipment portfolios with diverse asset types may require specialized valuation',
    'Medical equipment typically commands better advance rates due to stable residual values',
    'Multi-state operations require careful UCC filing coordination',
    'Having multiple interested partners provides negotiating leverage'
  ],
  true,
  30
);

-- Example 4: Declined Deal - Learning Scenario
INSERT INTO deal_flow_examples (
  title,
  deal_type,
  description,
  timeline_days,
  stages,
  lessons_learned,
  is_published,
  display_order
) VALUES (
  'When Deals Don''t Close: A Case Study',
  'Mixed Asset',
  'A mixed asset portfolio that was ultimately declined due to concentration risk and documentation gaps. Understanding why deals don''t close helps originators prepare better applications.',
  28,
  '[
    {
      "stage": "qualified",
      "day": 1,
      "duration_days": 2,
      "notes": "Initial application showed $10M portfolio with mix of real estate and business loans. Flagged for concentration review - 52% exposure to single industry (hospitality).",
      "actions": ["Application reviewed", "Concentration flag raised", "Conditional approval to proceed"]
    },
    {
      "stage": "documents_requested",
      "day": 3,
      "duration_days": 7,
      "notes": "Document collection started. Multiple requests for missing items: incomplete loan files, missing appraisals, outdated financials.",
      "actions": ["Partial documents received", "Gap analysis sent", "Follow-up requests", "Extended deadline granted"]
    },
    {
      "stage": "under_review",
      "day": 10,
      "duration_days": 12,
      "notes": "Due diligence revealed additional concerns: 8.5% default rate (above threshold), several loans missing proper collateral documentation.",
      "actions": ["Portfolio scored: 58/100", "Collateral gaps identified", "Default analysis", "Hospitality sector review"]
    },
    {
      "stage": "declined",
      "day": 22,
      "duration_days": 6,
      "notes": "After partner review, deal was declined. Primary reasons: (1) Concentration exceeds 40% threshold, (2) Default rate above 5% limit, (3) Incomplete collateral documentation on 15% of portfolio.",
      "actions": ["Partner feedback collected", "Decline reasons documented", "Remediation path outlined", "Reapplication guidance provided"]
    }
  ]'::jsonb,
  ARRAY[
    'Industry concentration above 40% is a common red flag - diversification is key',
    'Default rates above 5% typically require significant credit enhancement or portfolio carve-outs',
    'Every loan in the portfolio needs complete documentation - partial files create uncertainty',
    'Declined deals often have a path to approval: this originator was invited to reapply after addressing concentration and documentation',
    'Early identification of issues (during qualification) allows time for remediation before full review'
  ],
  true,
  40
);

-- Verify the inserts
SELECT id, title, deal_type, timeline_days, is_published, display_order
FROM deal_flow_examples
ORDER BY display_order;

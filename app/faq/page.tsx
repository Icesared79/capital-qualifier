'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ArrowRight } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  title: string
  faqs: FAQItem[]
}

// ============================================================================
// CAPITAL SEEKERS FAQ - For originators, real estate, asset-backed businesses
// ============================================================================
const capitalSeekersFAQ: FAQCategory[] = [
  {
    title: 'ABOUT BITCENSE',
    faqs: [
      {
        question: 'What does BitCense do?',
        answer: 'BitCense is a capital matching platform for private credit. We work with loan originators, real estate owners, and asset-backed businesses to build structured offering profiles, then match them with funding partners who specialize in their asset type. Unlike traditional brokers, we don\'t just make introductions—we prepare your entire offering package, analyze your documents with AI, score your portfolio, and present you to partners with everything they need to make a funding decision.',
      },
      {
        question: 'Who is BitCense for?',
        answer: 'We work with three main types of businesses: (1) Loan originators—whether you\'re originating consumer loans, business loans, merchant cash advances, or real estate loans, if you have a portfolio you want to leverage for capital, we can help. (2) Real estate owners and developers—if you own income-producing properties or are developing projects that need capital, we connect you with appropriate funding sources. (3) Asset-backed businesses—companies with receivables, equipment, inventory, or other assets that can serve as collateral for financing.',
      },
      {
        question: 'How is BitCense different from a traditional broker?',
        answer: 'Traditional brokers take your materials and shop them around to their contacts, often with minimal preparation. BitCense takes a fundamentally different approach. We build a complete offering profile for you—structured data about your company, portfolio, and track record. Our AI analyzes your documents to extract key metrics and flag potential issues before they become problems. We score your portfolio against objective criteria. Then we match you with funding partners whose specific criteria align with your deal. Partners receive a complete package, not just a teaser. This means faster decisions, less back-and-forth, and higher close rates.',
      },
      {
        question: 'What does it cost to work with BitCense?',
        answer: 'Qualification and the initial process are completely free. You can create an account, complete the qualification assessment, upload documents, and get matched with partners at no cost. Fees are only charged when capital is successfully funded—we succeed when you succeed. Fee structures vary based on deal size, complexity, and the specific funding partner, but are always disclosed upfront before you commit to proceeding.',
      },
    ],
  },
  {
    title: 'ELIGIBILITY & QUALIFICATION',
    faqs: [
      {
        question: 'How does the qualification scoring work?',
        answer: 'Our scoring engine evaluates multiple factors: portfolio size and composition, asset type and quality, historical performance metrics (default rates, delinquency, recovery rates), length of track record, management experience, and operational infrastructure. Each factor is weighted based on what funding partners prioritize for your asset class. You receive a score immediately after completing the qualification form, along with specific feedback on strengths and areas that might need attention.',
      },
      {
        question: 'What score do I need to proceed?',
        answer: 'Scores above 60 are typically eligible for partner matching. However, this isn\'t a hard cutoff—some funding partners work with earlier-stage originators if other factors are strong (experienced management, strong collateral, strategic value). Scores below 60 receive detailed feedback on what would need to improve. We\'re direct about this: if your portfolio isn\'t ready for institutional capital, we\'ll tell you why and what would need to change.',
      },
      {
        question: 'What\'s the minimum portfolio size?',
        answer: '$5 million is our general minimum for most asset types. This reflects the economics of institutional funding—below this size, the transaction costs often don\'t make sense for funding partners. That said, some partners work with smaller portfolios for specific asset classes or if the originator has a clear growth trajectory. Real estate deals can sometimes be smaller if the properties are high-quality. During qualification, we\'ll be clear about whether your size works for our current partner base.',
      },
      {
        question: 'How long of a track record do I need?',
        answer: 'Most funding partners want to see 12-24 months of performance data—enough to understand how your portfolio performs through different conditions. Newer originators (under 12 months) can still qualify if they have experienced management teams with verifiable track records from previous roles, strong collateral coverage, or other factors that mitigate the limited history. We evaluate the full picture, not just time in business.',
      },
      {
        question: 'What if my portfolio has some problem loans?',
        answer: 'Every portfolio has some level of defaults or delinquencies—that\'s expected and priced into funding terms. What matters is whether the levels are within acceptable ranges for your asset class and whether you\'re managing them appropriately. Our scoring accounts for this. If your default rates are elevated, you\'ll see that reflected in your score, and we\'ll be transparent about how it affects your options. Funding partners price risk, so higher-risk portfolios can still get funded, just at different terms.',
      },
    ],
  },
  {
    title: 'DOCUMENTS & DUE DILIGENCE',
    faqs: [
      {
        question: 'What documents will I need to provide?',
        answer: 'Required documents vary by asset type, but typically include: (1) Financial statements—at least 2 years of company financials, preferably audited or reviewed. (2) Loan tape or asset schedule—detailed listing of your portfolio with key metrics per asset. (3) Performance history—monthly or quarterly performance reports showing defaults, delinquencies, collections, and payoffs. (4) Sample agreements—your standard loan agreements, servicing agreements, or lease documents. (5) Corporate documents—formation docs, org chart, key bios. (6) Policies and procedures—underwriting guidelines, servicing procedures, collection policies. We provide a specific checklist based on your asset type during the process.',
      },
      {
        question: 'How does the AI document analysis work?',
        answer: 'When you upload documents, our AI system reads and analyzes them automatically. It classifies each document by type (financial statement, loan tape, legal agreement, etc.), extracts key data points and metrics, identifies potential issues or missing information, and flags anything that might need attention during due diligence. This serves two purposes: it accelerates the review process significantly, and it helps you identify and address issues before they become problems with funding partners. You can see the AI\'s analysis in your dashboard.',
      },
      {
        question: 'How long does document review take?',
        answer: 'Initial AI analysis happens within minutes of upload. Our team reviews the AI output and your complete document package typically within 1-2 weeks, depending on volume and complexity. If we need additional documents or clarification, we\'ll reach out promptly. The goal is to have your complete offering package ready for partner review as quickly as possible while ensuring nothing important is missed.',
      },
      {
        question: 'Is my data secure and confidential?',
        answer: 'Yes. All documents are encrypted in transit (TLS) and at rest (AES-256). Access is strictly limited to authorized BitCense personnel working on your deal and, once you\'re matched, your assigned funding partner. We never share your data with third parties without your explicit consent. We use bank-grade security infrastructure and follow SOC 2 practices. Your confidential business information is protected throughout the process.',
      },
      {
        question: 'Can I upload documents before completing qualification?',
        answer: 'Yes, and we encourage it. You can upload documents at any time after creating an account. Our AI will classify and analyze them, so when you reach the document review stage, you\'re already ahead. This can significantly speed up your overall timeline.',
      },
    ],
  },
  {
    title: 'THE MATCHING PROCESS',
    faqs: [
      {
        question: 'How does partner matching work?',
        answer: 'Once your offering profile is complete and documents are reviewed, we match you with funding partners whose criteria align with your deal. Each partner has specific requirements—asset types they focus on, size ranges they work with, performance thresholds, geographic preferences, and structural requirements. We don\'t blast your deal to everyone; we identify the 1-3 partners most likely to be interested and present your complete package to them. Partners review and indicate interest, then you work directly with them through term sheet and closing.',
      },
      {
        question: 'Who are your funding partners?',
        answer: 'Our funding partner network includes institutional investors, family offices, credit funds, and specialty finance companies focused on private credit. Each partner has specific areas of focus—some specialize in consumer loans, others in real estate or equipment finance. Partners join our network because they want access to pre-vetted, well-structured deals with complete documentation. We continuously expand our partner base to cover more asset types and deal sizes.',
      },
      {
        question: 'What if I don\'t match with a partner?',
        answer: 'We\'ll tell you exactly why and what would need to change. Sometimes the issue is portfolio performance—default rates too high, track record too short. Sometimes it\'s documentation—missing key materials or data. Sometimes it\'s market timing—partners may be at capacity or have shifted focus. Whatever the reason, we give you specific, actionable feedback. If the gap is closeable, we\'ll tell you what to work on and invite you to come back when you\'re ready.',
      },
      {
        question: 'Can I choose which partners to work with?',
        answer: 'Yes. We present you with matched partners and their general terms/approach, and you decide which ones to engage with. You\'re never obligated to proceed with a partner you\'re not comfortable with. If you have existing relationships with funders, we can also help prepare your materials for those conversations.',
      },
      {
        question: 'What happens after I\'m matched?',
        answer: 'Once you and a funding partner mutually agree to proceed, you enter due diligence. The partner will review your complete package (which we\'ve already prepared), may request additional information or clarification, and will conduct their own analysis. This leads to a term sheet outlining proposed funding terms. You negotiate terms directly with the partner, with our support as needed. Once terms are agreed, you move to documentation and closing.',
      },
    ],
  },
  {
    title: 'TERMS, TIMING & FEES',
    faqs: [
      {
        question: 'How long does the full process take?',
        answer: 'Typical timeline: Qualification assessment takes minutes. Document collection and review takes 1-2 weeks (faster if you upload documents early). Partner matching and initial response takes 1-2 weeks. Term sheet negotiation takes 1-3 weeks depending on complexity. Due diligence and closing takes 4-8 weeks. Total from start to funding: 8-14 weeks for most deals. Simpler deals with complete documentation can move faster; complex structures or large deals may take longer.',
      },
      {
        question: 'What are typical funding terms?',
        answer: 'Terms vary significantly based on asset type, portfolio performance, structure, and the specific funding partner. Common structures include warehouse facilities (revolving credit lines), whole loan purchases, and participation arrangements. Advance rates typically range from 70-90% of portfolio value, depending on asset quality and structure. Pricing (interest rates, fees) is based on risk profile—stronger portfolios with longer track records generally get better terms. Specific terms are always detailed in the term sheet before you commit.',
      },
      {
        question: 'What fees does BitCense charge?',
        answer: 'There is no fee for qualification, document review, or partner matching. BitCense earns a success fee only when capital is funded—typically a percentage of the funded amount. The specific percentage varies based on deal size (larger deals have lower percentage fees) and complexity. Fee structure is disclosed before you commit to proceeding with any partner match. There are no hidden fees or surprise charges.',
      },
      {
        question: 'Can I raise more capital later?',
        answer: 'Yes, and it gets easier. Repeat offerings with a proven track record move faster and often receive better terms. Your profile, documents, and history stay in our system—you don\'t start from scratch. Many of our originators return for subsequent rounds as their portfolios grow. Funding partners value repeat relationships with originators who perform as expected.',
      },
      {
        question: 'What if my funding needs change during the process?',
        answer: 'The process is flexible. If your portfolio grows, terms change, or your capital needs shift, let us know and we\'ll adjust. If you need to pause and come back later, your profile and documents are preserved. We understand that business conditions evolve and we work with you accordingly.',
      },
    ],
  },
]

// ============================================================================
// FUNDING PARTNERS FAQ - For investors, lenders, capital providers
// ============================================================================
const fundingPartnersFAQ: FAQCategory[] = [
  {
    title: 'ABOUT THE PLATFORM',
    faqs: [
      {
        question: 'What is BitCense?',
        answer: 'BitCense is a deal origination and preparation platform for private credit. We source, qualify, and prepare loan originators, real estate owners, and asset-backed businesses seeking capital. Rather than sending you raw leads or incomplete packages, we deliver fully structured offerings with complete documentation, AI-analyzed metrics, and pre-qualified profiles. Our goal is to save you time on deal sourcing and due diligence while expanding your access to quality deal flow.',
      },
      {
        question: 'What types of deals does BitCense source?',
        answer: 'We work across private credit asset classes: consumer loan portfolios (personal loans, installment loans), business loan portfolios (SMB loans, merchant cash advances, lines of credit), real estate (income-producing properties, development projects, loan portfolios), and specialty finance (equipment leasing, receivables financing, inventory finance). Our originator base is diverse, ranging from established players to growth-stage originators with strong fundamentals.',
      },
      {
        question: 'How is BitCense different from a broker?',
        answer: 'Traditional brokers send you incomplete packages and expect you to do the work of extracting information. BitCense does that work upfront. Every deal you see includes: a structured offering profile with standardized data, AI-analyzed documents with extracted metrics and flagged issues, a qualification score based on objective criteria, and complete documentation organized by category. You can quickly assess fit rather than spending time on basic information gathering.',
      },
      {
        question: 'What does it cost?',
        answer: 'There is no fee to funding partners for access to deal flow or for reviewing offerings. BitCense is compensated by originators upon successful funding. This means your interests and ours are aligned—we only succeed when we bring you deals that actually close.',
      },
    ],
  },
  {
    title: 'DEAL QUALITY & SELECTION',
    faqs: [
      {
        question: 'How does BitCense qualify originators?',
        answer: 'Every originator goes through our structured qualification process. We evaluate: portfolio size and composition, historical performance metrics (defaults, delinquencies, recoveries), length and consistency of track record, management team experience and background, operational infrastructure and controls, and documentation completeness. Originators receive a score, and we\'re selective about which deals move forward to partner matching. You see only deals that meet baseline quality thresholds.',
      },
      {
        question: 'What information do I receive on each deal?',
        answer: 'For each matched deal, you receive: (1) Offering profile—structured data on the company, portfolio, and request. (2) Qualification score with factor breakdown. (3) Complete document package—financials, loan tape, performance history, sample agreements, corporate docs. (4) AI analysis summary—key extracted metrics, document classifications, and flagged items. (5) Any notes from our review. Everything is organized and accessible in your partner dashboard.',
      },
      {
        question: 'Can I set specific criteria for deals I want to see?',
        answer: 'Yes. During onboarding, you define your investment criteria: asset types, size ranges, geographic focus, performance thresholds, structural preferences, and any specific requirements. We only match you with deals that fit your stated criteria. You can update these preferences anytime as your focus evolves.',
      },
      {
        question: 'How many deals will I see?',
        answer: 'This depends on your criteria and our deal flow. We prioritize quality over quantity—you\'ll only see deals that genuinely match your requirements. Most partners receive 2-5 relevant matches per month, though this varies. We never spam you with deals that don\'t fit just to show volume.',
      },
    ],
  },
  {
    title: 'DUE DILIGENCE & PROCESS',
    faqs: [
      {
        question: 'What due diligence does BitCense perform?',
        answer: 'Our process includes: document collection and completeness verification, AI-powered document analysis and metric extraction, qualification scoring against objective criteria, identification of potential issues or areas requiring attention, and organization of all materials for efficient review. We do not perform legal due diligence, audit financials, or make investment recommendations. We prepare the package; you make the investment decision based on your own analysis.',
      },
      {
        question: 'How does the AI document analysis work?',
        answer: 'When originators upload documents, our AI reads and processes them automatically. It classifies documents by type, extracts key data points and metrics from financials and loan tapes, identifies inconsistencies or gaps, and flags potential issues for attention. You can see the AI\'s analysis alongside the original documents—it\'s a tool to accelerate your review, not replace your judgment. The AI handles the tedious extraction work so you can focus on evaluation.',
      },
      {
        question: 'What happens after I express interest in a deal?',
        answer: 'When you indicate interest, the originator is notified and mutual engagement begins. You\'ll have full access to all documents and can request additional information directly through the platform. Most partners conduct their own due diligence calls and additional analysis. This leads to term sheet issuance if you want to proceed. The originator may be in discussion with multiple partners; we facilitate but don\'t manage exclusivity unless specifically arranged.',
      },
      {
        question: 'How quickly do I need to respond to deals?',
        answer: 'We don\'t impose artificial deadlines, but originators are typically in active capital-raising mode. Prompt review (within 1-2 weeks) is appreciated. If a deal matches your criteria and you\'re interested, faster response generally means better outcomes. If you need more time or have capacity constraints, let us know and we can manage expectations with the originator.',
      },
    ],
  },
  {
    title: 'WORKING WITH ORIGINATORS',
    faqs: [
      {
        question: 'Do I work directly with the originator?',
        answer: 'Yes. Once matched and engaged, you communicate directly with the originator for due diligence, negotiation, and closing. BitCense facilitates the introduction and provides the structured package, but the relationship is between you and the originator. We can assist with communication or issue resolution if helpful, but we don\'t insert ourselves unnecessarily into your process.',
      },
      {
        question: 'What if I pass on a deal?',
        answer: 'No problem—not every deal is a fit, and we\'d rather you pass on deals that don\'t work than force fits. If you can share brief feedback on why you passed (size, performance metrics, structure, timing), it helps us improve matching. We track pass reasons to refine your criteria over time.',
      },
      {
        question: 'Can I source deals directly to originators outside BitCense?',
        answer: 'If you\'re introduced to an originator through BitCense and subsequently do business with them—whether on the initial deal or future deals—our agreement applies. This is standard for introduction-based relationships. If you have pre-existing relationships with originators who happen to also use BitCense, let us know and we\'ll confirm there\'s no conflict.',
      },
      {
        question: 'How do repeat deals work?',
        answer: 'Many originators return for subsequent funding rounds as portfolios grow. If you\'ve funded an originator before, you typically have first look at follow-on opportunities. Repeat relationships are valuable to everyone—originators get faster execution, you get known counterparties. We track these relationships and facilitate accordingly.',
      },
    ],
  },
  {
    title: 'GETTING STARTED',
    faqs: [
      {
        question: 'How do I become a funding partner?',
        answer: 'Contact us to start the conversation. We\'ll discuss your investment focus, criteria, and capacity. After a brief qualification call, you\'ll complete partner onboarding: defining your criteria, signing our partner agreement, and getting access to your dashboard. The process typically takes 1-2 weeks. We\'re selective about partners to ensure originators have access to serious, capable capital sources.',
      },
      {
        question: 'What are the requirements to join?',
        answer: 'We work with institutional investors, family offices, credit funds, and specialty finance companies with demonstrated capacity to fund private credit deals. You should have: clear investment criteria and asset class focus, capital available to deploy (not just LOIs or exploratory interest), ability to execute on deals that fit your criteria, and a professional approach to working with originators. We\'re not a fit for individual investors or those seeking deal-by-deal capital raising.',
      },
      {
        question: 'Is there a commitment or minimum?',
        answer: 'There\'s no commitment to fund any specific number of deals or minimum volume. We ask that you be responsive to matched deals and provide feedback on passes, but you\'re never obligated to proceed on any deal. The relationship works best when you\'re actively deploying capital and can move on deals that fit.',
      },
      {
        question: 'How do I contact BitCense about becoming a partner?',
        answer: 'Reach out through our contact page or email partners@bitcense.com. Include a brief description of your firm, your investment focus, and typical deal size. We\'ll schedule a call to discuss fit and next steps.',
      },
    ],
  },
]

// ============================================================================
// COMPONENTS
// ============================================================================

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start justify-between p-6 text-left gap-4"
      >
        <span className="font-bold text-gray-900 dark:text-white text-lg leading-snug">{item.question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 mt-1 transition-transform ${
            isOpen ? 'rotate-180 text-gray-900 dark:text-white' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 -mt-2">
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{item.answer}</p>
        </div>
      )}
    </div>
  )
}

type UserType = 'seekers' | 'partners'

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState<UserType>('seekers')

  const faqData = activeTab === 'seekers' ? capitalSeekersFAQ : fundingPartnersFAQ

  return (
    <div className="min-h-screen bg-[#F5F1ED] dark:bg-gray-900">
      {/* Header */}
      <section className="pt-16 pb-6 md:pt-24 md:pb-8">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            FAQ
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            How BitCense works, what you need, and what to expect.
          </p>

          {/* User Type Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('seekers')}
              className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'seekers'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              Raising Capital
            </button>
            <button
              onClick={() => setActiveTab('partners')}
              className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'partners'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              Funding Partners
            </button>
          </div>
        </div>
      </section>

      {/* Context Banner */}
      <section className="pb-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className={`rounded-xl p-4 ${
            activeTab === 'seekers'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-100 dark:border-blue-800'
              : 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-100 dark:border-purple-800'
          }`}>
            <p className={`text-sm ${
              activeTab === 'seekers'
                ? 'text-blue-800 dark:text-blue-300'
                : 'text-purple-800 dark:text-purple-300'
            }`}>
              {activeTab === 'seekers'
                ? 'For loan originators, real estate owners, and asset-backed businesses looking to raise capital.'
                : 'For institutional investors, family offices, and capital providers looking to deploy into private credit.'
              }
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-6">
          {faqData.map((category) => (
            <div key={category.title} className="mb-12">
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
                {category.title}
              </h2>
              <div className="space-y-4">
                {category.faqs.map((faq) => (
                  <FAQAccordion key={faq.question} item={faq} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Actions */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {activeTab === 'seekers' ? 'Ready to get started?' : 'Interested in becoming a partner?'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {activeTab === 'seekers'
                    ? 'Qualification takes a few minutes. You\'ll know immediately if you\'re eligible.'
                    : 'Contact us to discuss your investment criteria and how we can work together.'
                  }
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/contact"
                  className="text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
                <Link
                  href={activeTab === 'seekers' ? '/apply' : '/contact'}
                  className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  {activeTab === 'seekers' ? 'Start Qualification' : 'Become a Partner'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

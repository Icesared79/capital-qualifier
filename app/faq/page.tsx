'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ArrowRight, ArrowUpRight, HelpCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  title: string
  faqs: FAQItem[]
}

const faqCategories: FAQCategory[] = [
  {
    title: 'GETTING STARTED',
    faqs: [
      {
        question: 'What is BitCense?',
        answer: 'BitCense provides tokenization infrastructure that connects private credit originators to global retail capital markets through compliant, on-chain securities.',
      },
      {
        question: 'How do I know if my portfolio qualifies?',
        answer: 'Start with our free Capital Qualifier assessment. Our proprietary scoring engine evaluates your asset type, portfolio size, performance metrics, and track record to provide immediate, data-driven feedback.',
      },
      {
        question: 'Is there a cost to apply?',
        answer: 'The qualification assessment is completely free. Fees are only applicable if and when a deal is successfully funded.',
      },
      {
        question: 'What types of assets do you work with?',
        answer: 'We work with commercial real estate loans, SMB/business loans, residential loans, consumer loans, and specialty finance portfolios.',
      },
    ],
  },
  {
    title: 'QUALIFICATION',
    faqs: [
      {
        question: 'What is the minimum portfolio size?',
        answer: 'We typically work with portfolios of $5 million or larger, though this varies by asset type and performance characteristics.',
      },
      {
        question: 'What performance metrics do you look at?',
        answer: 'Key metrics include default rates, delinquency rates, DSCR, LTV, track record length, and geographic concentration.',
      },
      {
        question: 'How long of a track record do I need?',
        answer: 'We generally look for 12-24 months of performance data, though this varies by asset class.',
      },
    ],
  },
  {
    title: 'THE PROCESS',
    faqs: [
      {
        question: 'How long does the process take?',
        answer: 'Our qualification process delivers results in minutes, not weeks. From document submission to funding partner matching typically ranges from 4-12 weeks depending on complexity.',
      },
      {
        question: 'What documents will I need?',
        answer: 'Financial statements, loan tape data, performance history, sample loan agreements, insurance certificates, and corporate documents.',
      },
      {
        question: 'What happens during due diligence?',
        answer: 'We combine proprietary analytics with expert review to conduct portfolio performance analysis, underwriting assessment, operational evaluation, and legal/compliance review.',
      },
    ],
  },
  {
    title: 'FUNDING',
    faqs: [
      {
        question: 'What are typical funding terms?',
        answer: 'Terms vary based on asset type, performance, structure, and funding partner. Specific terms are detailed in the term sheet during structuring with your matched funding partner.',
      },
      {
        question: 'How quickly can I receive funding?',
        answer: 'Once you are matched with a funding partner and terms are agreed, funding depends on investor demand. Funds transfer as the offering fills.',
      },
      {
        question: 'Can I raise additional capital later?',
        answer: 'Yes. Many originators return for subsequent offerings with our funding partners. A successful track record can streamline future rounds.',
      },
    ],
  },
]

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden hover:border-accent dark:hover:border-accent transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="font-bold text-gray-900 dark:text-white pr-4 text-lg">{item.question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-accent' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#F5F1ED] dark:bg-gray-900">
      {/* Hero Section */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-6">
                Questions & Answers
              </p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-[0.95] tracking-tight mb-8">
                FREQUENTLY<br />ASKED
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                Find answers to common questions about BitCense and our qualification process.
              </p>
            </div>

            {/* Feature Card */}
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 md:p-10">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                  <HelpCircle className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Can't Find Your Answer?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  Our team is here to help. Schedule a call or send us a message and we'll get back to you within 1 business day.
                </p>
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-2 text-gray-900 dark:text-white font-bold hover:text-accent transition-colors"
                >
                  Contact Us
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          {faqCategories.map((category) => (
            <div key={category.title} className="mb-12">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
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

      {/* CTA Section - Orange */}
      <section className="py-20 md:py-32 bg-accent">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6">
            STILL HAVE<br />QUESTIONS?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Our team is here to help. Schedule a call or send us a message.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold px-10 py-5 rounded-full transition-all text-lg"
            >
              Contact Us
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 text-white font-bold px-4 py-5 hover:text-white/80 transition-colors"
            >
              Start Qualification
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

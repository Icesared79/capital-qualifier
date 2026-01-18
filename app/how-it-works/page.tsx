import Link from 'next/link'
import { ArrowRight, ArrowUpRight, CheckCircle2, Clock, Users, Shield, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'How It Works | BitCense',
  description: 'Learn how BitCense helps private credit originators access global retail capital.',
}

const processSteps = [
  {
    number: '01',
    title: 'QUALIFY',
    subtitle: 'See if you\'re a fit',
    description: 'Our proprietary scoring engine analyzes your portfolio against institutional-grade criteria in minutes. This assessment evaluates asset type, portfolio size, performance metrics, and track record.',
    details: [
      'Free, no-obligation assessment',
      'Instant preliminary scoring',
      'Clear feedback on criteria',
      'No documents required',
    ],
    cta: 'Start Assessment',
    ctaLink: '/apply',
  },
  {
    number: '02',
    title: 'SUBMIT',
    subtitle: 'Share your portfolio data',
    description: 'If you qualify, you\'ll submit documentation for full review including financial statements, loan tape data, and performance history.',
    details: [
      'Secure document upload',
      'Clear checklist provided',
      'Common file formats supported',
      'Dedicated support team',
    ],
  },
  {
    number: '03',
    title: 'REVIEW',
    subtitle: 'Comprehensive due diligence',
    description: 'Our team conducts thorough due diligence, combining proprietary analytics with expert review to analyze performance data, underwriting standards, and operational capabilities.',
    details: [
      'AI-assisted performance analysis',
      'Underwriting review',
      'Operational assessment',
      'Legal and compliance review',
    ],
  },
  {
    number: '04',
    title: 'STRUCTURE',
    subtitle: 'Define the offering',
    description: 'We work with you to structure the tokenized offering, including terms, pricing, and deal structure.',
    details: [
      'Customized deal structure',
      'Competitive pricing',
      'Clear terms and conditions',
      'Legal documentation',
    ],
  },
  {
    number: '05',
    title: 'FUND',
    subtitle: 'Connect with capital',
    description: 'Once terms are agreed, your offering launches through our funding partners to their global investor network. Funds are transferred as the offering fills.',
    details: [
      'Matched with funding partners',
      'Global investor distribution',
      'Regulatory compliant',
      'Transparent reporting',
    ],
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#F5F1ED] dark:bg-gray-900">
      {/* Hero Section */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-6">
                The Process
              </p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-[0.95] tracking-tight mb-8">
                HOW IT<br />WORKS
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                A straightforward path from qualification to funding partner matching. We guide you through every step with dedicated support.
              </p>
            </div>

            {/* Process Preview Card - Vertical Timeline */}
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gray-900 dark:bg-gray-950 px-6 py-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-accent uppercase tracking-widest">The Process</p>
                    <div className="px-2.5 py-1 bg-green-500/20 rounded-full text-xs font-bold text-green-400">
                      In Progress
                    </div>
                  </div>
                  <p className="text-white font-black text-xl">Your Journey to Capital</p>
                </div>

                {/* Timeline Content */}
                <div className="p-5">
                  <div className="space-y-3">
                    {/* Step 1 - Complete */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="w-0.5 h-4 bg-green-500" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-bold text-sm text-gray-900 dark:text-white">Qualify</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Portfolio scored</p>
                      </div>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400 pt-1">Complete</span>
                    </div>

                    {/* Step 2 - Complete */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="w-0.5 h-4 bg-green-500" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-bold text-sm text-gray-900 dark:text-white">Submit</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Documents uploaded</p>
                      </div>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400 pt-1">Complete</span>
                    </div>

                    {/* Step 3 - In Progress */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center ring-4 ring-accent/20">
                          <span className="text-xs font-bold text-white">3</span>
                        </div>
                        <div className="w-0.5 h-4 bg-gray-200 dark:bg-gray-700" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-bold text-sm text-gray-900 dark:text-white">Review</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Due diligence underway</p>
                      </div>
                      <span className="text-xs font-semibold text-accent pt-1">In Progress</span>
                    </div>

                    {/* Step 4 - Pending */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-400">4</span>
                        </div>
                        <div className="w-0.5 h-4 bg-gray-200 dark:bg-gray-700" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-bold text-sm text-gray-400 dark:text-gray-500">Structure</p>
                        <p className="text-xs text-gray-400 dark:text-gray-600">Define offering terms</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-400 pt-1">Pending</span>
                    </div>

                    {/* Step 5 - Pending */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-400">5</span>
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-bold text-sm text-gray-400 dark:text-gray-500">Fund</p>
                        <p className="text-xs text-gray-400 dark:text-gray-600">Connect with capital</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-400 pt-1">Pending</span>
                    </div>
                  </div>

                  {/* Bottom CTA */}
                  <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Est. Time to Fund</p>
                        <p className="text-xl font-black text-accent">1-2 Weeks</p>
                      </div>
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-accent" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-accent/20 rounded-full blur-2xl -z-10" />
              <div className="absolute -top-8 -left-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="space-y-8">
            {processSteps.map((step, index) => (
              <div key={step.number} className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 md:p-10 hover:border-accent dark:hover:border-accent transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                  {/* Step Number */}
                  <div className="flex-shrink-0">
                    <div className="text-7xl md:text-8xl font-black text-gray-200 dark:text-gray-700">
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                      {step.subtitle}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed max-w-2xl">
                      {step.description}
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {step.details.map((detail) => (
                        <div key={detail} className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                        </div>
                      ))}
                    </div>

                    {step.cta && (
                      <div className="mt-8">
                        <Link
                          href={step.ctaLink || '#'}
                          className="group inline-flex items-center gap-3 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold px-8 py-4 rounded-full transition-all"
                        >
                          {step.cta}
                          <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What to Expect - Dark Section */}
      <section className="py-20 md:py-32 bg-gray-900 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">
              The Experience
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              WHAT TO EXPECT
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-800 dark:bg-gray-900 rounded-2xl p-8 border border-gray-700">
              <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Intelligent Analysis
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Proprietary scoring technology evaluates your portfolio with institutional-grade precision.
              </p>
            </div>

            <div className="bg-gray-800 dark:bg-gray-900 rounded-2xl p-8 border border-gray-700">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Transparent Timeline
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Clear milestones and regular updates keep you informed at every stage of the process.
              </p>
            </div>

            <div className="bg-gray-800 dark:bg-gray-900 rounded-2xl p-8 border border-gray-700">
              <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Dedicated Support
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Your assigned team member guides you through each step with personalized attention.
              </p>
            </div>

            <div className="bg-gray-800 dark:bg-gray-900 rounded-2xl p-8 border border-gray-700">
              <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Secure Process
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Enterprise-grade security protects your data throughout the entire engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Orange */}
      <section className="py-20 md:py-32 bg-accent">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6">
            READY TO<br />GET STARTED?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Take the first step with our free qualification assessment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/apply"
              className="group inline-flex items-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold px-10 py-5 rounded-full transition-all text-lg"
            >
              Start Qualification
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-white font-bold px-4 py-5 hover:text-white/80 transition-colors"
            >
              Talk to Our Team
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

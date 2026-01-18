import Link from 'next/link'
import { ArrowUpRight, ArrowRight, Shield, Globe, Zap, Building2, Users, Sparkles, Cpu, CheckCircle2, ArrowLeftRight } from 'lucide-react'
import DashboardPreview from '@/components/ui/DashboardPreview'

export default function HomePage() {
  const marqueeItems = ['GLOBAL REACH', 'RETAIL CAPITAL', 'INTELLIGENT QUALIFICATION', 'BEYOND INSTITUTIONAL', 'DEDICATED SUPPORT', 'TRANSPARENT PROCESS', 'FAST FUNDING']

  const steps = [
    { title: 'Qualify', desc: 'Take our free assessment. Our proprietary scoring engine evaluates your portfolio against institutional criteria.', icon: Sparkles, color: 'accent' },
    { title: 'Structure', desc: 'We handle due diligence, compliance, and deal structuring so you can focus on your business.', icon: Shield, color: 'blue' },
    { title: 'Fund', desc: 'Get matched with funding partners who connect you to their global network of investors.', icon: Globe, color: 'purple' },
  ]

  const originatorItems = [
    'Commercial real estate lenders',
    'SMB and business loan originators',
    'Consumer finance companies',
    'Specialty finance providers',
  ]

  const investorItems = [
    'Access institutional-quality deals',
    'AI-scored portfolio transparency',
    'Secondary market liquidity',
    'Regulatory protection',
  ]

  return (
    <div className="min-h-screen bg-[#F5F1ED] dark:bg-gray-900">
      {/* Hero Section */}
      <section className="pt-12 pb-20 md:pt-20 md:pb-32 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gray-900/5 dark:bg-white/5 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Animated badge */}
              <div className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-full text-sm font-bold mb-8">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Funding Available Now
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-[0.95] tracking-tight mb-6">
                RETAIL<br />
                CAPITAL<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-400">TOKENIZED</span>
              </h1>

              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-8">
                On-Chain &bull; Retail &bull; Connected
              </p>

              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-md leading-relaxed">
                Infrastructure that connects private credit originators to global retail capital markets.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/apply"
                  className="group inline-flex items-center gap-3 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold px-8 py-4 rounded-full transition-all shadow-lg shadow-gray-900/20"
                >
                  Get Started
                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 text-gray-900 dark:text-white font-bold px-4 py-4 hover:text-accent transition-colors"
                >
                  See How It Works
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>Smart Scoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Global Reach</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span>Fast Process</span>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Dashboard Preview */}
              <DashboardPreview />

              {/* Decorative blurs */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-accent/20 rounded-full blur-2xl -z-10" />
              <div className="absolute -top-8 -left-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Strip */}
      <div className="bg-gray-900 dark:bg-gray-800 py-4 overflow-hidden">
        <div className="flex items-center gap-8 animate-marquee">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 text-white font-bold text-sm tracking-widest whitespace-nowrap">
              {marqueeItems.map((item, j) => (
                <span key={j} className="flex items-center gap-8">
                  <span>{item}</span>
                  <span className="w-2 h-2 bg-accent rounded-full" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <section className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">
              Three Steps to Capital
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
              FROM QUALIFICATION<br />TO FUNDING
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We guide you through qualification, handle the structuring complexity, and connect you with funding partners.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-4">
            {/* Qualify */}
            <Link
              href="/how-it-works"
              className="group flex-1 bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 hover:border-accent dark:hover:border-accent transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-accent/20">
                <Sparkles className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Qualify</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Take our free assessment. Our proprietary scoring engine evaluates your portfolio against institutional criteria.</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Arrow 1 */}
            <div className="hidden md:flex items-center justify-center px-2">
              <ArrowRight className="w-6 h-6 text-gray-300 dark:text-gray-600" />
            </div>

            {/* Structure */}
            <Link
              href="/how-it-works"
              className="group flex-1 bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 hover:border-accent dark:hover:border-accent transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-blue-500/20">
                <Shield className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Structure</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">We handle due diligence, compliance, and deal structuring so you can focus on your business.</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Arrow 2 */}
            <div className="hidden md:flex items-center justify-center px-2">
              <ArrowRight className="w-6 h-6 text-gray-300 dark:text-gray-600" />
            </div>

            {/* Fund */}
            <Link
              href="/how-it-works"
              className="group flex-1 bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 hover:border-accent dark:hover:border-accent transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-purple-500/20">
                <Globe className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Fund</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Get matched with funding partners who connect you to their global network of investors.</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-gray-900 dark:text-white font-bold hover:text-accent transition-colors"
            >
              View Full Process
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Who We Serve - Dark Section */}
      <section className="py-20 md:py-32 bg-gray-900 dark:bg-gray-950 relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">
              Two Sides, One Platform
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
              WHO WE SERVE
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              BitCense connects those who have assets with those who have capital.
            </p>
          </div>

          <div className="relative">
            {/* Connection bridge - visible on desktop */}
            <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-accent rounded-full p-4 shadow-lg shadow-accent/30">
                <ArrowLeftRight className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-stretch">
              {/* Originators Card */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-3xl p-8 md:p-10 border border-gray-700 hover:border-accent transition-colors relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-full flex flex-col">
                  <div className="w-14 h-14 bg-accent/30 border border-accent/30 rounded-2xl flex items-center justify-center mb-6">
                    <Building2 className="w-7 h-7 text-accent" />
                  </div>
                  <div className="px-3 py-1 bg-accent/20 border border-accent/40 rounded-full text-xs font-bold text-accent uppercase tracking-wider w-fit mb-4">
                    Capital Seekers
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Asset Originators
                  </h3>
                  <p className="text-gray-400 mb-8 leading-relaxed">
                    Private credit lenders and specialty finance companies looking to diversify funding sources and access retail capital.
                  </p>
                  <ul className="space-y-4 mt-auto">
                    {originatorItems.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-gray-300">
                        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Investors Card */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-3xl p-8 md:p-10 border border-gray-700 hover:border-blue-500 transition-colors relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-full flex flex-col">
                  <div className="w-14 h-14 bg-blue-500/30 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-6">
                    <Users className="w-7 h-7 text-blue-400" />
                  </div>
                  <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full text-xs font-bold text-blue-400 uppercase tracking-wider w-fit mb-4">
                    Yield Seekers
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Investors
                  </h3>
                  <p className="text-gray-400 mb-8 leading-relaxed">
                    Retail and accredited investors seeking access to private market yields through regulated tokenized securities.
                  </p>
                  <ul className="space-y-4 mt-auto">
                    {investorItems.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-gray-300">
                        <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why BitCense */}
      <section className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">
              The Advantage
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              WHY BITCENSE
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 dark:bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Cpu className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Proprietary Scoring
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our proprietary qualification engine delivers instant scoring with institutional-grade analysis.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Regulatory Compliance
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Built for compliance across multiple jurisdictions. Navigate securities regulations with confidence.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Global Reach
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Access retail investors worldwide through compliant tokenized securities.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Streamlined Process
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                From qualification to funding partner matching, we guide you through every step with dedicated support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-accent">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6">
            READY TO ACCESS<br />RETAIL CAPITAL?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Start with our free qualification assessment to see if your portfolio is a fit.
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
              Schedule a Call
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

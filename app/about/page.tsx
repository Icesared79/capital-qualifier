'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Linkedin, Mail, Building2, Users, Shield, Sparkles } from 'lucide-react'

const teamMembers = [
  {
    name: 'Paul DiCesare',
    role: 'Founder & Chief Executive Officer',
    bio: 'Paul established BitCense following 25+ years in real estate, proptech, and property tokenization. He witnessed firsthand how the real estate industry is slow to adopt new technologies, often missing out on significant benefits from new technologies. Paul built BitCense to solve the obstacle of converting traditionally illiquid real estate assets into digital tokens by offering full-service, compliant tokenization infrastructure and help clients unlock value and future-proof their portfolios without needing to become technology experts. Paul is a U.S. Air Force combat veteran and holds a Bachelor\'s in Organizational Leadership from Penn State University.',
    linkedin: 'https://linkedin.com/in/pauldiceasre',
    email: 'paul@bitcense.com',
    image: 'https://cdn.prod.website-files.com/67ebf6a9f5b29ac6fd350c0a/67fd15191ae279c90c173bb6_06056dd2cb7393bc97186ed6fde00afa_avatar-1-v2.avif',
  },
  {
    name: 'Joseph Joyce',
    role: 'Co-Founder & Chief Product Officer',
    bio: 'Joe directs product vision using his expertise in commercial real estate finance and blockchain technologies. He previously co-founded a real estate tokenization platform, bringing hands-on experience building digital asset systems. His approach combines financial modeling, capital structuring, and asset analysis to create products that serve both originators and investors. He holds an M.S. in Financial Analysis from St. Mary\'s College and a B.S. in Finance from CSU Chico.',
    linkedin: 'https://linkedin.com/in/josephjoyce',
    email: 'joe@bitcense.com',
    image: 'https://cdn.prod.website-files.com/67ebf6a9f5b29ac6fd350c0a/683d6b4ed9853108937ed402_660d3f4d05868a15faebab13f331488e_Joyce-b.avif',
  },
  {
    name: 'Michael Orlandi',
    role: 'Co-Founder & Chief Investment Officer',
    bio: 'Michael brings 15+ years of experience acquiring, developing, financing, and managing institutional-quality real estate across asset classes, delivering consistent returns as an investment director. His deep commercial real estate knowledge shapes BitCense\'s approach to tokenization and deal structuring. He holds a Master\'s in Real Estate Development from Columbia University and a J.D. from Harvard University.',
    linkedin: 'https://linkedin.com/in/michaelorlandi',
    email: 'michael@bitcense.com',
    image: 'https://cdn.prod.website-files.com/67ebf6a9f5b29ac6fd350c0a/683d6b4e0ddc96d31b253515_f21731c37aaf10c3ab48ca7a714ba12a_Orlandi-b.avif',
  },
  {
    name: 'Shane Fleming',
    role: 'Chief Strategy Officer',
    bio: 'Shane is a real estate strategist and startup founder with 20+ years of experience across commercial, residential, and proptech sectors. He founded FlemingRE, advising companies like McDonald\'s and Circle K, worked at JLL in corporate advisory, and founded PropGen, an AI-focused proptech startup. At BitCense, he leads strategy, growth, and go-to-market planning across Ireland and US markets.',
    linkedin: 'https://linkedin.com/in/shanefleming',
    email: 'shane@bitcense.com',
    image: 'https://cdn.prod.website-files.com/67ebf6a9f5b29ac6fd350c0a/6887b7353831c3e246adcf26_4b688a5d5ddf6b68d7e8d1e74bf9e033_Shane%20Fleming%20-b.avif',
  },
  {
    name: 'Delia Sabau',
    role: 'Head of Capital Structuring',
    bio: 'Delia is an investment leader with 20+ years in institutional finance and hedge fund management. She managed $1B+ in equity strategies at Barclays Global Investors (now BlackRock), launched global hedge funds at Menta Capital, built crypto strategies at CKC Fund, and co-founded Optima for regulated on-chain strategies. She serves as the architect of BitCense\'s vaulting strategy.',
    linkedin: 'https://linkedin.com/in/deliasabau',
    email: 'delia@bitcense.com',
    image: 'https://cdn.prod.website-files.com/67ebf6a9f5b29ac6fd350c0a/693bf8beb6638c25f7a826c6_1b08b85182f1bbac7d884d041677796d_delia-1.jpg',
  },
]

export default function AboutPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeMember = teamMembers[activeIndex]

  const goToPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? teamMembers.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setActiveIndex((prev) => (prev === teamMembers.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="min-h-screen bg-[#F5F1ED] dark:bg-gray-900">
      {/* Hero Section */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-6">
              About BitCense
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-[0.95] tracking-tight mb-8">
              THE BRIDGE TO<br />RETAIL CAPITAL
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              We serve as the compliance and structuring layer between private credit originators and regulated distribution channels. Our proprietary technology qualifies portfolios, structures offerings, and connects you with funding partners — so you can access retail capital without becoming a securities expert.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do - Visual Cards */}
      <section className="py-20 md:py-32 bg-gray-900 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">
              What We Do
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              YOUR GATEWAY TO<br />RETAIL CAPITAL
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800 dark:bg-gray-900 rounded-3xl p-8 border border-gray-700 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Qualify</h3>
                <p className="text-gray-400 leading-relaxed">
                  Our proprietary scoring engine evaluates your portfolio against institutional-grade criteria, providing clear feedback in minutes — not weeks.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 dark:bg-gray-900 rounded-3xl p-8 border border-gray-700 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Structure</h3>
                <p className="text-gray-400 leading-relaxed">
                  We handle the regulatory complexity — structuring compliant tokenized offerings across multiple jurisdictions so you don't have to.
                </p>
              </div>
            </div>

            <div className="bg-gray-800 dark:bg-gray-900 rounded-3xl p-8 border border-gray-700 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Connect</h3>
                <p className="text-gray-400 leading-relaxed">
                  We match you with funding partners who distribute your offering to their global network of retail and accredited investors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-6">
                Our Mission
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-8">
                DEMOCRATIZING<br />PRIVATE MARKETS
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                BitCense exists to democratize access to private markets — connecting originators with capital and investors with yield across real estate, private credit, and alternative assets.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                We believe tokenization technology can unlock new opportunities for everyone in the capital markets ecosystem. Quality assets should be accessible to investors globally, and originators should have diverse, efficient paths to capital.
              </p>
            </div>

            {/* Stats Card */}
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 md:p-10">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2">100+</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Years Industry Experience</p>
                  </div>
                  <div>
                    <p className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2">$1B+</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">AUM Experience</p>
                  </div>
                  <div>
                    <p className="text-4xl md:text-5xl font-black text-accent mb-2">5</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset Classes</p>
                  </div>
                  <div>
                    <p className="text-4xl md:text-5xl font-black text-accent mb-2">Global</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Investor Reach</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/20 rounded-full blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 md:py-32 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Large Photo */}
            <div className="relative max-w-sm lg:max-w-md mx-auto lg:mx-0">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-2xl">
                <Image
                  src={activeMember.image}
                  alt={activeMember.name}
                  fill
                  className="object-cover object-top"
                />
              </div>
            </div>

            {/* Bio Content */}
            <div>
              <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-4">
                Meet the Team
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
                {activeMember.name}
              </h2>

              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6">
                {activeMember.role}
              </h3>

              <div className="w-16 h-0.5 bg-accent mb-8" />

              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                {activeMember.bio}
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-4">
                {activeMember.linkedin && (
                  <a
                    href={activeMember.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {activeMember.email && (
                  <a
                    href={`mailto:${activeMember.email}`}
                    className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Team Thumbnails */}
          <div className="mt-12 pt-12 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-4 md:gap-6">
              <button
                onClick={goToPrev}
                className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center hover:border-accent hover:text-accent transition-colors"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
              </button>

              {teamMembers.map((member, index) => (
                <button
                  key={member.name}
                  onClick={() => setActiveIndex(index)}
                  className={`relative group transition-all ${
                    index === activeIndex ? 'scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`w-14 h-14 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 transition-colors ${
                    index === activeIndex
                      ? 'border-accent'
                      : 'border-gray-200 dark:border-gray-600 group-hover:border-accent/50'
                  }`}>
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {index === activeIndex && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent rounded-full" />
                  )}
                </button>
              ))}

              <button
                onClick={goToNext}
                className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center hover:border-accent hover:text-accent transition-colors"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-accent">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6">
            READY TO<br />GET STARTED?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Whether you're an originator seeking capital or want to learn more, our team is ready to help.
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
              Contact Us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

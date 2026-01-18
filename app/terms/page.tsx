import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export const metadata = {
  title: 'Terms of Use | BitCense',
  description: 'Terms of Use for BitCense services and platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F5F1ED] dark:bg-gray-900 py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-accent" />
            </div>
            <p className="text-sm font-semibold text-accent uppercase tracking-widest">
              Legal
            </p>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            TERMS OF USE
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Last Updated: January 2026</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 md:p-10">
          <div className="space-y-10 text-gray-600 dark:text-gray-400">
            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                1. ACCEPTANCE OF TERMS
              </h2>
              <p className="leading-relaxed mb-4">
                Welcome to BitCense. BitCense, Inc. (&ldquo;BitCense,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a Delaware corporation that provides advisory and technology services for private credit originators seeking access to retail capital markets.
              </p>
              <p className="leading-relaxed">
                By accessing or using our website at www.bitcense.com (the &ldquo;Site&rdquo;), platform, or any of our services (collectively, the &ldquo;Services&rdquo;), you agree to be bound by these Terms of Use. If you do not agree to these Terms, please do not access or use our Services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                2. DESCRIPTION OF SERVICES
              </h2>
              <p className="mb-4 leading-relaxed">
                BitCense provides infrastructure and advisory services that connect private credit originators with global retail capital markets through tokenization. Our Services include:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Proprietary portfolio qualification and scoring technology</li>
                <li>Asset evaluation and due diligence facilitation</li>
                <li>Legal structuring and SPV formation coordination</li>
                <li>Compliance advisory and regulatory navigation</li>
                <li>Connection to funding partners and distribution networks</li>
                <li>Document management and deal packaging</li>
              </ul>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-amber-800 dark:text-amber-200 font-semibold">
                  Important: BitCense is NOT a broker-dealer, investment adviser, funding portal, transfer agent, or securities exchange. We do not provide investment advice, offer or sell securities, or guarantee funding.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                3. ELIGIBILITY
              </h2>
              <p className="leading-relaxed mb-4">To use our Services, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Have the legal authority to enter into binding agreements</li>
                <li>If representing a business entity, have authorization to bind that entity to these Terms</li>
                <li>Not be prohibited from using our Services under applicable laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                4. ACCOUNT REGISTRATION
              </h2>
              <p className="mb-4 leading-relaxed">When you create an account or use our Services, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the confidentiality and security of your account credentials</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized access or security breaches</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                5. ACCEPTABLE USE
              </h2>
              <p className="mb-4 leading-relaxed">You may use our Services to:</p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Learn about BitCense and our offerings</li>
                <li>Submit qualification applications and portfolio information</li>
                <li>Communicate with our team</li>
                <li>Access your account and manage your engagement</li>
              </ul>
              <p className="mb-4 leading-relaxed">You may NOT:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use automated tools, bots, or scrapers to access or collect data from our Services</li>
                <li>Attempt to gain unauthorized access to any part of our Services or systems</li>
                <li>Interfere with or disrupt the integrity or performance of our Services</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Use our Services for any unlawful purpose or in violation of these Terms</li>
                <li>Misrepresent your identity, affiliation, or the information you provide</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                6. PROPRIETARY TECHNOLOGY
              </h2>
              <p className="leading-relaxed mb-4">
                Our qualification platform, scoring algorithms, and assessment methodologies constitute proprietary technology owned by BitCense. You acknowledge that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Qualification scores and assessments are generated using our proprietary technology</li>
                <li>Scores are for informational purposes and do not guarantee funding or acceptance by funding partners</li>
                <li>Our methodologies, algorithms, and scoring criteria are confidential and proprietary</li>
                <li>You may not reverse engineer, copy, or attempt to replicate our technology</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                7. NO INVESTMENT ADVICE
              </h2>
              <p className="leading-relaxed mb-4">
                The information provided through our Services is for general informational purposes only and does not constitute:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Investment advice or recommendations</li>
                <li>Legal, tax, or accounting advice</li>
                <li>An offer or solicitation to buy or sell securities</li>
                <li>A guarantee of funding or capital access</li>
              </ul>
              <p className="mt-4 leading-relaxed">
                You should consult with qualified professionals regarding investment, legal, tax, and financial matters.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                8. INTELLECTUAL PROPERTY
              </h2>
              <p className="leading-relaxed">
                The Services, including all content, features, functionality, software, text, graphics, logos, and trademarks, are owned by BitCense or its licensors and are protected by intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our Services without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                9. USER CONTENT
              </h2>
              <p className="leading-relaxed mb-4">
                By submitting information, documents, or other content (&ldquo;User Content&rdquo;) through our Services, you:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Represent that you have the right to submit such content</li>
                <li>Grant BitCense a license to use, process, and analyze User Content for providing our Services</li>
                <li>Acknowledge that User Content may be shared with funding partners with your consent</li>
                <li>Remain responsible for the accuracy and legality of User Content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                10. DISCLAIMER OF WARRANTIES
              </h2>
              <p className="leading-relaxed uppercase text-sm">
                THE SERVICES ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. BITCENSE DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                11. LIMITATION OF LIABILITY
              </h2>
              <p className="leading-relaxed uppercase text-sm mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, BITCENSE AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, REGARDLESS OF THE CAUSE OF ACTION.
              </p>
              <p className="leading-relaxed uppercase text-sm">
                IN NO EVENT SHALL BITCENSE&apos;S TOTAL LIABILITY EXCEED ONE HUNDRED DOLLARS ($100) OR THE AMOUNT YOU PAID TO BITCENSE IN THE TWELVE MONTHS PRECEDING THE CLAIM, WHICHEVER IS GREATER.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                12. INDEMNIFICATION
              </h2>
              <p className="leading-relaxed">
                You agree to indemnify, defend, and hold harmless BitCense and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising from your use of the Services, violation of these Terms, or infringement of any third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                13. GOVERNING LAW AND JURISDICTION
              </h2>
              <p className="leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions.
              </p>
              <p className="leading-relaxed">
                Any disputes arising from these Terms or your use of the Services shall be resolved exclusively in the state or federal courts located in Delaware. You consent to the personal jurisdiction of such courts and waive any objection to venue. Any claim must be filed within one (1) year after the cause of action arises.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                14. MODIFICATIONS AND TERMINATION
              </h2>
              <p className="leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. Material changes will be posted on this page with an updated &ldquo;Last Updated&rdquo; date. Your continued use of the Services after changes constitutes acceptance of the modified Terms.
              </p>
              <p className="leading-relaxed">
                We may suspend or terminate your access to the Services at any time, with or without cause, and without prior notice or liability.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                15. SEVERABILITY
              </h2>
              <p className="leading-relaxed">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                16. CONTACT INFORMATION
              </h2>
              <p className="leading-relaxed">
                Questions about these Terms of Use? Contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <p className="font-semibold text-gray-900 dark:text-white">BitCense, Inc.</p>
                <p>Email:{' '}
                  <a href="mailto:legal@bitcense.com" className="text-accent hover:underline font-semibold">
                    legal@bitcense.com
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-900 dark:text-white hover:text-accent font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/privacy"
            className="text-accent hover:underline font-semibold"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}

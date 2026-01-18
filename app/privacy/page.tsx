import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | BitCense',
  description: 'Privacy Policy for BitCense services and platform.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F5F1ED] dark:bg-gray-900 py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-accent" />
            </div>
            <p className="text-sm font-semibold text-accent uppercase tracking-widest">
              Legal
            </p>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            PRIVACY POLICY
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Last Updated: January 2026</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 md:p-10">
          <div className="space-y-10 text-gray-600 dark:text-gray-400">
            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                1. INTRODUCTION
              </h2>
              <p className="leading-relaxed mb-4">
                BitCense, Inc. (&ldquo;BitCense,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at www.bitcense.com (the &ldquo;Site&rdquo;) or use our services.
              </p>
              <p className="leading-relaxed">
                This policy applies to information gathered through cookies, web beacons, server logs, and similar technologies when you access or use our Site and services, including our proprietary qualification platform and scoring technology.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                2. INFORMATION WE COLLECT
              </h2>
              <p className="mb-4 leading-relaxed font-semibold text-gray-900 dark:text-white">Information You Provide:</p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li><strong className="text-gray-900 dark:text-white">Contact Information:</strong> Name, email address, phone number, company name</li>
                <li><strong className="text-gray-900 dark:text-white">Business Information:</strong> Portfolio data, financial statements, loan tape data, asset performance history</li>
                <li><strong className="text-gray-900 dark:text-white">Qualification Data:</strong> Information submitted through our qualification assessment tool</li>
                <li><strong className="text-gray-900 dark:text-white">Communications:</strong> Messages, inquiries, and correspondence with our team</li>
                <li><strong className="text-gray-900 dark:text-white">Account Credentials:</strong> Login information for platform access</li>
              </ul>
              <p className="mb-4 leading-relaxed font-semibold text-gray-900 dark:text-white">Information Collected Automatically:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                <li><strong className="text-gray-900 dark:text-white">Usage Data:</strong> Pages visited, features used, clickstream data, referral sources</li>
                <li><strong className="text-gray-900 dark:text-white">Log Data:</strong> Access times, server logs, error reports</li>
                <li><strong className="text-gray-900 dark:text-white">Analytics Data:</strong> Interaction patterns with our qualification tools and platform features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                3. COOKIES AND TRACKING TECHNOLOGIES
              </h2>
              <p className="mb-4 leading-relaxed">We use the following types of cookies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Essential Cookies:</strong> Required for Site operation and security</li>
                <li><strong className="text-gray-900 dark:text-white">Analytics Cookies:</strong> Help us understand how visitors interact with our Site (e.g., Google Analytics)</li>
                <li><strong className="text-gray-900 dark:text-white">Marketing Cookies:</strong> Used to deliver relevant advertisements and track campaign effectiveness</li>
              </ul>
              <p className="mt-4 leading-relaxed">
                You can manage cookie preferences through your browser settings. Note that disabling certain cookies may affect Site functionality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                4. HOW WE USE YOUR INFORMATION
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our Services and platform</li>
                <li>Process and evaluate qualification applications using our proprietary scoring technology</li>
                <li>Conduct due diligence analysis on submitted portfolios</li>
                <li>Generate qualification scores and assessment reports</li>
                <li>Communicate with you about our Services, updates, and offerings</li>
                <li>Connect qualified originators with funding partners (with your consent)</li>
                <li>Detect, prevent, and address fraud, security issues, and technical problems</li>
                <li>Comply with legal obligations and regulatory requirements</li>
                <li>Improve and develop our qualification algorithms and scoring models</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                5. INFORMATION SHARING
              </h2>
              <p className="mb-4 leading-relaxed">We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Service Providers:</strong> Third parties who perform services on our behalf (hosting, analytics, security)</li>
                <li><strong className="text-gray-900 dark:text-white">Legal and Compliance Partners:</strong> Securities law firms and compliance consultants as needed</li>
                <li><strong className="text-gray-900 dark:text-white">Funding Partners:</strong> With your explicit consent, we may share qualification data with funding partners to facilitate capital connections</li>
                <li><strong className="text-gray-900 dark:text-white">Legal Requirements:</strong> When required by law, legal process, or government request</li>
                <li><strong className="text-gray-900 dark:text-white">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
              <p className="mt-4 leading-relaxed font-semibold text-gray-900 dark:text-white">We do not sell your personal information to third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                6. DATA SECURITY
              </h2>
              <p className="leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your personal data, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure server infrastructure with access controls</li>
                <li>Regular security assessments and monitoring</li>
                <li>Employee training on data protection practices</li>
              </ul>
              <p className="mt-4 leading-relaxed">
                While we strive to protect your information, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                7. DATA RETENTION
              </h2>
              <p className="leading-relaxed mb-4">We retain your information according to the following schedule:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Inquiry Data:</strong> 3 years from last contact</li>
                <li><strong className="text-gray-900 dark:text-white">Engagement Data:</strong> 7 years from completion of services (for regulatory compliance)</li>
                <li><strong className="text-gray-900 dark:text-white">Analytics Data:</strong> Anonymized and retained indefinitely for service improvement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                8. YOUR RIGHTS
              </h2>
              <p className="mb-4 leading-relaxed">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and receive a copy of your personal data</li>
                <li>Request correction of inaccurate or incomplete data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to or restrict certain processing activities</li>
                <li>Opt out of marketing communications</li>
                <li>Data portability (receive your data in a structured format)</li>
              </ul>
              <p className="mt-4 leading-relaxed">
                To exercise these rights, contact{' '}
                <a href="mailto:privacy@bitcense.com" className="text-accent hover:underline font-semibold">
                  privacy@bitcense.com
                </a>
              </p>
              <p className="mt-4 leading-relaxed">
                Note: We do not currently respond to &ldquo;Do Not Track&rdquo; browser signals.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                9. CALIFORNIA RESIDENTS (CCPA)
              </h2>
              <p className="leading-relaxed mb-4">
                If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Right to know what personal information is collected and how it is used</li>
                <li>Right to delete personal information</li>
                <li>Right to opt out of the sale of personal information (we do not sell personal information)</li>
                <li>Right to non-discrimination for exercising your privacy rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                10. EUROPEAN USERS (GDPR)
              </h2>
              <p className="leading-relaxed">
                If you are located in the European Union or United Kingdom, you have rights under the General Data Protection Regulation (GDPR), including access, rectification, erasure, restriction, portability, and the right to object. You also have the right to lodge a complaint with your local supervisory authority.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                11. CHANGES TO THIS POLICY
              </h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page with a new &ldquo;Last Updated&rdquo; date. Your continued use of our Services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                12. CONTACT US
              </h2>
              <p className="leading-relaxed">
                Questions or concerns about this Privacy Policy or our data practices? Contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <p className="font-semibold text-gray-900 dark:text-white">BitCense, Inc.</p>
                <p>Email:{' '}
                  <a href="mailto:privacy@bitcense.com" className="text-accent hover:underline font-semibold">
                    privacy@bitcense.com
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
            href="/terms"
            className="text-accent hover:underline font-semibold"
          >
            Terms of Use
          </Link>
        </div>
      </div>
    </div>
  )
}

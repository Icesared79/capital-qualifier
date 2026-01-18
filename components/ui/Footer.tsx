import Link from 'next/link'
import Image from 'next/image'

const footerLinks = {
  company: [
    { href: '/about', label: 'About' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ],
  resources: [
    { href: '/apply', label: 'Get Started' },
    { href: '/auth', label: 'Sign In' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Use' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo.svg"
                alt="BitCense"
                width={120}
                height={32}
                className="dark:invert"
              />
            </Link>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              On-Chain. Retail. Connected.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connecting private credit originators to global retail capital.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Get Started</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 dark:bg-gray-700 mb-6" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} BitCense. All rights reserved.
          </p>

          {/* Mobile Legal Links */}
          <div className="flex items-center gap-6 md:hidden">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
          BitCense is not a broker-dealer, marketplace, or exchange and does not sell or place
          securities directly. The Capital Qualifier provides preliminary assessment only and
          does not constitute an offer or guarantee of financing. Securities offerings are made
          only through proper legal channels and documentation.
        </p>
      </div>
    </footer>
  )
}

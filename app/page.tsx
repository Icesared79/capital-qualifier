import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 md:px-10">
      <div className="w-full max-w-3xl mx-auto">
        {/* Main Card Container */}
        <div className="bg-surface rounded-card shadow-md p-8 md:p-12">
          {/* Logo */}
          <div className="text-center mb-10">
            <a
              href="https://www.bitcense.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:opacity-80 transition-opacity"
            >
              <img
                src="/logo.svg"
                alt="BitCense"
                className="h-8 mx-auto"
              />
            </a>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-[42px] leading-tight font-bold text-text-primary">
              Unlock Global Capital
            </h1>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px bg-border-light"></div>
            <span className="text-sm font-medium text-text-muted uppercase tracking-wider">Choose Your Path</span>
            <div className="flex-1 h-px bg-border-light"></div>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Originator Card */}
            <Link
              href="/originator"
              className="group block p-8 rounded-card border-2 border-border bg-card-cool hover:border-accent hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <h2 className="text-xl font-bold text-text-primary mb-3 group-hover:text-accent transition-colors duration-200">
                I&apos;m a Private Lender
              </h2>
              <p className="text-text-secondary text-[15px] leading-relaxed mb-6">
                Transform your portfolio into tokenized securities accessing global retail capital. Bypass institutional gatekeepers.
              </p>
              <div className="flex items-center text-accent font-medium text-sm">
                <span>Assess My Portfolio</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            {/* Borrower Card */}
            <Link
              href="/borrower"
              className="group block p-8 rounded-card border-2 border-border bg-card-warm hover:border-accent hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <h2 className="text-xl font-bold text-text-primary mb-3 group-hover:text-accent transition-colors duration-200">
                I Need Capital
              </h2>
              <p className="text-text-secondary text-[15px] leading-relaxed mb-6">
                Access institutional-grade bridge financing with traditional bank pricing at fintech speed.
              </p>
              <div className="flex items-center text-accent font-medium text-sm">
                <span>Check My Eligibility</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted tracking-wide">
            On-Chain. Retail. Connected.
          </p>
        </div>
      </div>
    </main>
  )
}

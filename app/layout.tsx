import type { Metadata } from 'next'
import { Ubuntu, Urbanist } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/lib/ThemeContext'
import { ConditionalHeader, ConditionalFooter } from '@/components/ui/ConditionalHeader'

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-ubuntu',
})

const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-urbanist',
})

export const metadata: Metadata = {
  title: 'BitCense Capital Qualifier',
  description: 'See if your asset or portfolio qualifies for global retail capital.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${ubuntu.variable} ${urbanist.variable}`}>
      <body className={`min-h-screen gradient-bg flex flex-col ${urbanist.className}`}>
        {/* Google Places API for address autocomplete */}
        {process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places`}
            strategy="lazyOnload"
          />
        )}
        <ThemeProvider>
          <ConditionalHeader />
          <div className="flex-1">
            {children}
          </div>
          <ConditionalFooter />
        </ThemeProvider>
      </body>
    </html>
  )
}

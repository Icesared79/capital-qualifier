import type { Metadata } from 'next'
import { Ubuntu, Urbanist } from 'next/font/google'
import './globals.css'

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
  title: 'Capital Access Qualifier | BitCense',
  description: 'See if your asset or portfolio qualifies for global retail capital.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${ubuntu.variable} ${urbanist.variable}`}>
      <body className="min-h-screen bg-white gradient-bg">
        {children}
      </body>
    </html>
  )
}

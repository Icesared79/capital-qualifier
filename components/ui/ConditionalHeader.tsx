'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'

export function ConditionalHeader() {
  const pathname = usePathname()

  // Don't show the main header on pages that have their own header
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/auth')) {
    return null
  }

  return <Header />
}

export function ConditionalFooter() {
  const pathname = usePathname()

  // Don't show footer on pages with their own layout
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/auth')) {
    return null
  }

  return <Footer />
}

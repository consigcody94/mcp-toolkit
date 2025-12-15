import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Layout/Navbar'
import Footer from '@/components/Layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cosmic Atlas - Explore the Universe',
  description: 'Real-time space data visualization platform featuring ISS tracking, space weather, Mars rovers, exoplanets, launches, and NASA imagery.',
  keywords: ['space', 'astronomy', 'NASA', 'ISS', 'Mars', 'exoplanets', 'space weather', 'launches'],
  authors: [{ name: 'Cosmic Atlas Team' }],
  openGraph: {
    title: 'Cosmic Atlas - Explore the Universe',
    description: 'Real-time space data visualization platform',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: '#0a0e27',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        {/* Animated Stars Background */}
        <div className="stars-background">
          <div className="stars"></div>
        </div>

        {/* Main Layout */}
        <Navbar />

        <main className="flex-1 relative z-10">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  )
}

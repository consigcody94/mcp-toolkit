'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Satellite,
  Sun,
  Truck,
  Globe2,
  Rocket,
  Image as ImageIcon,
  Menu,
  X,
  Sparkles,
} from 'lucide-react'

interface NavLink {
  name: string
  href: string
  icon: React.ReactNode
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  const navLinks: NavLink[] = [
    { name: 'ISS Tracker', href: '/iss', icon: <Satellite className="w-4 h-4" /> },
    { name: 'Space Weather', href: '/space-weather', icon: <Sun className="w-4 h-4" /> },
    { name: 'Mars Rovers', href: '/mars', icon: <Truck className="w-4 h-4" /> },
    { name: 'Exoplanets', href: '/exoplanets', icon: <Globe2 className="w-4 h-4" /> },
    { name: 'Launches', href: '/launches', icon: <Rocket className="w-4 h-4" /> },
    { name: 'APOD', href: '/apod', icon: <ImageIcon className="w-4 h-4" /> },
  ]

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-card shadow-lg shadow-cosmic-blue/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <Sparkles className="w-8 h-8 text-cosmic-blue" />
              <div className="absolute inset-0 blur-lg opacity-50 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-8 h-8 text-cosmic-purple" />
              </div>
            </motion.div>
            <span className="text-xl md:text-2xl font-bold gradient-text">
              Cosmic Atlas
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
                    ${
                      isActive(link.href)
                        ? 'bg-cosmic-blue/20 text-cosmic-blue border border-cosmic-blue/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {link.icon}
                  <span className="font-medium">{link.name}</span>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-white/10"
          >
            <div className="glass-card px-4 py-4 space-y-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={link.href}>
                    <div
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${
                          isActive(link.href)
                            ? 'bg-cosmic-blue/20 text-cosmic-blue border border-cosmic-blue/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      {link.icon}
                      <span className="font-medium">{link.name}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

'use client'

import Link from 'next/link'
import {
  Satellite,
  Sun,
  Truck,
  Globe2,
  Rocket,
  Image as ImageIcon,
  Github,
  Twitter,
  Mail,
  ExternalLink,
  Sparkles,
} from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const sections = [
    {
      title: 'Features',
      links: [
        { name: 'ISS Tracker', href: '/iss', icon: <Satellite className="w-4 h-4" /> },
        { name: 'Space Weather', href: '/space-weather', icon: <Sun className="w-4 h-4" /> },
        { name: 'Mars Rovers', href: '/mars', icon: <Truck className="w-4 h-4" /> },
        { name: 'Exoplanets', href: '/exoplanets', icon: <Globe2 className="w-4 h-4" /> },
        { name: 'Launches', href: '/launches', icon: <Rocket className="w-4 h-4" /> },
        { name: 'APOD Gallery', href: '/apod', icon: <ImageIcon className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'NASA', href: 'https://www.nasa.gov', external: true },
        { name: 'ESA', href: 'https://www.esa.int', external: true },
        { name: 'SpaceX', href: 'https://www.spacex.com', external: true },
        { name: 'API Docs', href: '/docs', external: false },
      ],
    },
    {
      title: 'About',
      links: [
        { name: 'About Project', href: '/about' },
        { name: 'Data Sources', href: '/sources' },
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Use', href: '/terms' },
      ],
    },
  ]

  const socialLinks = [
    { name: 'GitHub', href: 'https://github.com', icon: <Github className="w-5 h-5" /> },
    { name: 'Twitter', href: 'https://twitter.com', icon: <Twitter className="w-5 h-5" /> },
    { name: 'Email', href: 'mailto:contact@cosmicatlas.space', icon: <Mail className="w-5 h-5" /> },
  ]

  return (
    <footer className="relative mt-20 border-t border-white/10">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-space-darkest via-space-dark/50 to-transparent pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <Sparkles className="w-8 h-8 text-cosmic-blue" />
              <span className="text-xl font-bold gradient-text">Cosmic Atlas</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              Explore the universe through real-time data visualization and stunning imagery
              from NASA and other space agencies.
            </p>
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-gray-400 hover:text-cosmic-blue hover:bg-white/5 transition-all duration-200"
                  aria-label={link.name}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-gray-400 hover:text-cosmic-blue transition-colors duration-200 group"
                      >
                        <span>{link.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : 'icon' in link ? (
                      <Link
                        href={link.href}
                        className="flex items-center space-x-2 text-gray-400 hover:text-cosmic-blue transition-colors duration-200"
                      >
                        <span>{(link as any).icon}</span>
                        <span>{link.name}</span>
                      </Link>
                    ) : (
                      <Link
                        href={link.href}
                        className="flex items-center space-x-2 text-gray-400 hover:text-cosmic-blue transition-colors duration-200"
                      >
                        <span>{link.name}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-gray-400 text-sm">
            <p>
              &copy; {currentYear} Cosmic Atlas. All rights reserved.
            </p>
          </div>

          <div className="text-gray-400 text-sm text-center md:text-right">
            <p className="flex items-center space-x-2">
              <span>Data provided by</span>
              <a
                href="https://www.nasa.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cosmic-blue hover:text-cosmic-cyan transition-colors"
              >
                NASA
              </a>
              <span>and other sources</span>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Built with Next.js, React, and love for space exploration
          </p>
        </div>
      </div>
    </footer>
  )
}

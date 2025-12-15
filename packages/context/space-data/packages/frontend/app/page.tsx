'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Satellite,
  Sun,
  Truck,
  Globe2,
  Rocket,
  Image as ImageIcon,
  Activity,
  Sparkles,
} from 'lucide-react'

interface FeatureCard {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
  gradient: string
}

interface Stat {
  label: string
  value: number
  suffix: string
  icon: React.ReactNode
}

export default function Home() {
  const [stats, setStats] = useState<Stat[]>([
    { label: 'ISS Orbits', value: 0, suffix: '', icon: <Satellite className="w-5 h-5" /> },
    { label: 'Active Missions', value: 0, suffix: '+', icon: <Rocket className="w-5 h-5" /> },
    { label: 'Exoplanets', value: 0, suffix: '+', icon: <Globe2 className="w-5 h-5" /> },
    { label: 'Data Points', value: 0, suffix: 'M+', icon: <Activity className="w-5 h-5" /> },
  ])

  const features: FeatureCard[] = [
    {
      title: 'ISS Tracker',
      description: 'Track the International Space Station in real-time with live telemetry and orbit visualization',
      icon: <Satellite className="w-12 h-12" />,
      href: '/iss',
      color: 'from-blue-500 to-cyan-500',
      gradient: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
    },
    {
      title: 'Space Weather',
      description: 'Monitor solar activity, geomagnetic storms, and space weather phenomena',
      icon: <Sun className="w-12 h-12" />,
      href: '/space-weather',
      color: 'from-yellow-500 to-orange-500',
      gradient: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
    },
    {
      title: 'Mars Rovers',
      description: 'Explore the latest images and data from NASA Mars rovers on the Red Planet',
      icon: <Truck className="w-12 h-12" />,
      href: '/mars',
      color: 'from-red-500 to-orange-600',
      gradient: 'bg-gradient-to-br from-red-500/20 to-orange-600/20',
    },
    {
      title: 'Exoplanets',
      description: 'Discover thousands of planets beyond our solar system with detailed data',
      icon: <Globe2 className="w-12 h-12" />,
      href: '/exoplanets',
      color: 'from-purple-500 to-pink-500',
      gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
    },
    {
      title: 'Launches',
      description: 'Stay updated with upcoming and past space launches from around the world',
      icon: <Rocket className="w-12 h-12" />,
      href: '/launches',
      color: 'from-green-500 to-emerald-500',
      gradient: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
    },
    {
      title: 'APOD Gallery',
      description: 'Browse NASA Astronomy Picture of the Day archive with stunning space imagery',
      icon: <ImageIcon className="w-12 h-12" />,
      href: '/apod',
      color: 'from-indigo-500 to-purple-500',
      gradient: 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20',
    },
  ]

  // Animate stats counter on mount
  useEffect(() => {
    const targets = [17520, 50, 5500, 100]
    const duration = 2000
    const steps = 60

    const intervals = targets.map((target, index) => {
      const increment = target / steps
      let current = 0

      return setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(intervals[index])
        }

        setStats(prev => {
          const newStats = [...prev]
          newStats[index] = { ...newStats[index], value: Math.floor(current) }
          return newStats
        })
      }, duration / steps)
    })

    return () => intervals.forEach(clearInterval)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-space-dark/50 to-space-darkest pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            {/* Logo/Icon */}
            <motion.div
              className="flex justify-center mb-6"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className="relative">
                <Sparkles className="w-20 h-20 text-cosmic-blue" />
                <motion.div
                  className="absolute inset-0 blur-xl opacity-50"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  <Sparkles className="w-20 h-20 text-cosmic-purple" />
                </motion.div>
              </div>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="gradient-text">Cosmic Atlas</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Explore the Universe Through Real-Time Data
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Track the ISS, monitor space weather, explore Mars, discover exoplanets,
              and stay updated with the latest space launches and imagery.
            </p>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="glass-card rounded-xl p-6 text-center"
              >
                <div className="flex justify-center mb-3 text-cosmic-blue">
                  {stat.icon}
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-cosmic-blue mb-2">
                  {stat.value.toLocaleString()}{stat.suffix}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Feature Cards Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <Link href={feature.href}>
                  <div className="glass-card feature-card rounded-2xl p-8 h-full transition-smooth cursor-pointer group">
                    <div className={`${feature.gradient} rounded-xl p-4 w-fit mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`}>
                        {feature.icon}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-cosmic-blue transition-colors">
                      {feature.title}
                    </h3>

                    <p className="text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>

                    <div className="mt-6 flex items-center text-cosmic-blue group-hover:translate-x-2 transition-transform">
                      <span className="font-semibold">Explore</span>
                      <svg
                        className="w-5 h-5 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-center mt-20"
          >
            <div className="glass-card rounded-2xl p-12 max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Explore the Cosmos?
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                Start your journey through space with real-time data and stunning visualizations
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/iss">
                  <button className="px-8 py-4 bg-gradient-to-r from-cosmic-blue to-cosmic-purple rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-cosmic-blue/50 transition-all duration-300 hover:scale-105">
                    Start Tracking ISS
                  </button>
                </Link>
                <Link href="/apod">
                  <button className="px-8 py-4 glass-card rounded-lg font-semibold text-white hover:border-cosmic-blue transition-all duration-300 hover:scale-105">
                    View Gallery
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

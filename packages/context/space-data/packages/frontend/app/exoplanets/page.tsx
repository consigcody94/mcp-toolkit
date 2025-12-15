'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Globe2, Search, Thermometer, Ruler, Star } from 'lucide-react'

interface Exoplanet {
  pl_name: string
  hostname: string
  discoverymethod: string
  disc_year: number
  pl_rade?: number
  pl_bmasse?: number
  pl_orbper?: number
  st_teff?: number
  sy_dist?: number
}

export default function ExoplanetsPage() {
  const [planets, setPlanets] = useState<Exoplanet[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planetsRes, statsRes] = await Promise.all([
          fetch('http://localhost:3001/api/exoplanets/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit: 50 })
          }),
          fetch('http://localhost:3001/api/exoplanets/stats/summary')
        ])

        const planetsData = await planetsRes.json()
        const statsData = await statsRes.json()

        if (planetsData.success) setPlanets(planetsData.data)
        if (statsData.success) setStats(statsData.data)

        setLoading(false)
      } catch (err) {
        console.error('Failed to load exoplanet data:', err)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredPlanets = planets.filter(p =>
    p.pl_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.hostname.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Globe2 className="w-16 h-16 text-cosmic-blue mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading exoplanet database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold gradient-text mb-4">
            Exoplanet Explorer
          </h1>
          <p className="text-xl text-gray-400">
            Discover planets beyond our solar system
          </p>
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          >
            <div className="glass-card rounded-xl p-6 text-center">
              <Globe2 className="w-8 h-8 text-cosmic-blue mx-auto mb-3" />
              <div className="text-3xl font-bold text-cosmic-blue mb-1">
                {stats.totalPlanets?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-sm text-gray-400">Total Exoplanets</div>
            </div>

            <div className="glass-card rounded-xl p-6 text-center">
              <Star className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-yellow-400 mb-1">
                {stats.totalStars?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-sm text-gray-400">Host Stars</div>
            </div>

            <div className="glass-card rounded-xl p-6 text-center">
              <Thermometer className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {stats.multiPlanetSystems?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-sm text-gray-400">Multi-Planet Systems</div>
            </div>

            <div className="glass-card rounded-xl p-6 text-center">
              <Ruler className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-400 mb-1">
                {stats.methods || 'N/A'}
              </div>
              <div className="text-sm text-gray-400">Discovery Methods</div>
            </div>
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search planets by name or host star..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full glass-card rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cosmic-blue"
            />
          </div>
        </motion.div>

        {/* Planets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlanets.map((planet, index) => (
            <motion.div
              key={planet.pl_name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-xl p-6 hover:scale-105 transition-transform"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {planet.pl_name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Host: {planet.hostname}
                  </p>
                </div>
                <Globe2 className="w-8 h-8 text-cosmic-blue" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Discovery Year</span>
                  <span className="text-sm font-semibold text-white">
                    {planet.disc_year || 'Unknown'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Method</span>
                  <span className="text-xs font-semibold text-cosmic-blue">
                    {planet.discoverymethod || 'N/A'}
                  </span>
                </div>

                {planet.pl_rade && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Radius</span>
                    <span className="text-sm font-semibold text-green-400">
                      {planet.pl_rade.toFixed(2)} R⊕
                    </span>
                  </div>
                )}

                {planet.pl_bmasse && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Mass</span>
                    <span className="text-sm font-semibold text-purple-400">
                      {planet.pl_bmasse.toFixed(2)} M⊕
                    </span>
                  </div>
                )}

                {planet.pl_orbper && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Orbital Period</span>
                    <span className="text-sm font-semibold text-yellow-400">
                      {planet.pl_orbper.toFixed(1)} days
                    </span>
                  </div>
                )}

                {planet.sy_dist && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Distance</span>
                    <span className="text-sm font-semibold text-orange-400">
                      {planet.sy_dist.toFixed(1)} pc
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredPlanets.length === 0 && (
          <div className="text-center py-20">
            <Globe2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No exoplanets found matching your search</p>
          </div>
        )}
      </div>
    </div>
  )
}

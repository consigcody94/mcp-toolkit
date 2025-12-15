'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Satellite, Users, MapPin, Clock } from 'lucide-react'

interface ISSPosition {
  latitude: number
  longitude: number
  altitude: number
  velocity: number
  timestamp: number
}

interface Astronaut {
  name: string
  craft: string
}

export default function ISSPage() {
  const [position, setPosition] = useState<ISSPosition | null>(null)
  const [astronauts, setAstronauts] = useState<Astronaut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch ISS position
        const posRes = await fetch('http://localhost:3001/api/iss/position')
        const posData = await posRes.json()

        if (posData.success && posData.data.iss_position) {
          // Extract ISS position from nested structure and add timestamp/altitude/velocity
          const issPos = posData.data.iss_position
          setPosition({
            latitude: parseFloat(issPos.latitude),
            longitude: parseFloat(issPos.longitude),
            altitude: 408, // ISS orbits at ~408 km
            velocity: 7.66, // ISS travels at ~7.66 km/s
            timestamp: posData.data.timestamp
          })
        }

        // Fetch astronauts
        const astroRes = await fetch('http://localhost:3001/api/iss/astronauts')
        const astroData = await astroRes.json()

        if (astroData.success) {
          setAstronauts(astroData.data.people.filter((p: Astronaut) => p.craft === 'ISS'))
        }

        setLoading(false)
      } catch (err) {
        setError('Failed to load ISS data')
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Satellite className="w-16 h-16 text-cosmic-blue mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading ISS data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold gradient-text mb-4">
            ISS Real-Time Tracker
          </h1>
          <p className="text-xl text-gray-400">
            Track the International Space Station in real-time
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Position Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <MapPin className="w-8 h-8 text-cosmic-blue" />
              <h2 className="text-2xl font-bold text-white">Current Position</h2>
            </div>

            {position && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                  <span className="text-gray-400">Latitude</span>
                  <span className="text-xl font-bold text-cosmic-blue">
                    {position.latitude.toFixed(4)}°
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                  <span className="text-gray-400">Longitude</span>
                  <span className="text-xl font-bold text-cosmic-blue">
                    {position.longitude.toFixed(4)}°
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                  <span className="text-gray-400">Altitude</span>
                  <span className="text-xl font-bold text-green-400">
                    {position.altitude.toFixed(2)} km
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                  <span className="text-gray-400">Velocity</span>
                  <span className="text-xl font-bold text-purple-400">
                    {position.velocity.toFixed(2)} km/s
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-4">
                  <Clock className="w-4 h-4" />
                  <span>Updated: {new Date(position.timestamp * 1000).toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Astronauts Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Users className="w-8 h-8 text-cosmic-blue" />
              <h2 className="text-2xl font-bold text-white">
                Astronauts on ISS ({astronauts.length})
              </h2>
            </div>

            <div className="space-y-3">
              {astronauts.map((astronaut, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cosmic-blue to-purple-600 flex items-center justify-center text-white font-bold">
                    {astronaut.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{astronaut.name}</p>
                    <p className="text-sm text-gray-400">{astronaut.craft}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Live Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-8 mt-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Live Map</h2>
          {position ? (
            <div className="relative aspect-video bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl overflow-hidden border border-cosmic-blue/20">
              {/* Simple CSS-based world map */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 800 400" className="w-full h-full opacity-30">
                  {/* Simplified world map outlines */}
                  <path d="M 100 200 L 700 200" stroke="#3b82f6" strokeWidth="1" fill="none" />
                  <path d="M 400 50 L 400 350" stroke="#3b82f6" strokeWidth="1" fill="none" />
                  <circle cx="400" cy="200" r="180" stroke="#3b82f6" strokeWidth="1" fill="none" />
                  <ellipse cx="400" cy="200" rx="180" ry="90" stroke="#3b82f6" strokeWidth="1" fill="none" />
                  <ellipse cx="400" cy="200" rx="180" ry="45" stroke="#3b82f6" strokeWidth="1" fill="none" />
                </svg>
              </div>

              {/* ISS Position Marker */}
              <div
                className="absolute w-8 h-8 -ml-4 -mt-4 transition-all duration-1000 ease-out"
                style={{
                  left: `${((position.longitude + 180) / 360) * 100}%`,
                  top: `${((90 - position.latitude) / 180) * 100}%`
                }}
              >
                <div className="relative">
                  <Satellite className="w-8 h-8 text-cosmic-blue animate-pulse drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                  <div className="absolute inset-0 animate-ping">
                    <div className="w-8 h-8 rounded-full bg-cosmic-blue/30"></div>
                  </div>
                </div>
              </div>

              {/* Orbital Path */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <ellipse
                  cx="50%"
                  cy="50%"
                  rx="45%"
                  ry="25%"
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="10 5"
                />
              </svg>

              {/* Coordinate Display */}
              <div className="absolute bottom-4 left-4 right-4 glass-card rounded-lg p-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Position:</span>
                    <span className="text-white font-mono ml-2">
                      {position.latitude.toFixed(2)}°N, {position.longitude.toFixed(2)}°E
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400">Speed:</span>
                    <span className="text-cosmic-blue font-mono ml-2">
                      {(position.velocity * 3600).toFixed(0)} km/h
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Satellite className="w-16 h-16 text-cosmic-blue mx-auto mb-4 animate-bounce" />
                <p className="text-gray-400">Loading ISS position...</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

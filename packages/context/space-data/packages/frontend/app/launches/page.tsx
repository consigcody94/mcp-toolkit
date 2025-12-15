'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Rocket, Calendar, MapPin, Clock } from 'lucide-react'

interface Launch {
  id: string
  name: string
  net: string
  status: {
    name: string
    abbrev: string
  }
  rocket: {
    configuration: {
      name: string
      family: string
    }
  }
  pad: {
    location: {
      name: string
    }
  }
  mission?: {
    name: string
    description: string
    type: string
  }
}

export default function LaunchesPage() {
  const [launches, setLaunches] = useState<Launch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLaunches = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/launches/upcoming?limit=20')
        const data = await res.json()

        if (data.success && data.data.results) {
          setLaunches(data.data.results)
        }
        setLoading(false)
      } catch (err) {
        console.error('Failed to load launches:', err)
        setLoading(false)
      }
    }

    fetchLaunches()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'go':
      case 'go for launch':
        return 'text-green-400 bg-green-500/20'
      case 'tbc':
      case 'tbd':
        return 'text-yellow-400 bg-yellow-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Rocket className="w-16 h-16 text-cosmic-blue mx-auto mb-4 animate-bounce" />
          <p className="text-gray-400">Loading upcoming launches...</p>
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
            Upcoming Launches
          </h1>
          <p className="text-xl text-gray-400">
            Track the next rocket launches worldwide
          </p>
        </motion.div>

        {/* Launch Counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 mb-12 text-center"
        >
          <div className="text-6xl font-bold gradient-text mb-2">
            {launches.length}
          </div>
          <div className="text-gray-400">Scheduled Launches</div>
        </motion.div>

        {/* Launches List */}
        <div className="space-y-6">
          {launches.map((launch, index) => (
            <motion.div
              key={launch.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-2xl p-6 hover:scale-[1.02] transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                {/* Left Side - Main Info */}
                <div className="flex-1">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-cosmic-blue to-purple-600 rounded-xl">
                      <Rocket className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {launch.name}
                      </h3>

                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(launch.status.abbrev)}`}>
                        {launch.status.name}
                      </div>
                    </div>
                  </div>

                  {/* Mission Description */}
                  {launch.mission?.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {launch.mission.description}
                    </p>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Rocket className="w-5 h-5 text-cosmic-blue" />
                      <div>
                        <div className="text-xs text-gray-500">Rocket</div>
                        <div className="text-sm font-semibold text-white">
                          {launch.rocket.configuration.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="text-xs text-gray-500">Location</div>
                        <div className="text-sm font-semibold text-white">
                          {launch.pad.location.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="text-xs text-gray-500">Launch Date</div>
                        <div className="text-sm font-semibold text-white">
                          {new Date(launch.net).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-yellow-400" />
                      <div>
                        <div className="text-xs text-gray-500">Launch Time</div>
                        <div className="text-sm font-semibold text-white">
                          {new Date(launch.net).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Countdown */}
                <div className="glass-card rounded-xl p-6 text-center min-w-[200px]">
                  <div className="text-sm text-gray-400 mb-2">T-Minus</div>
                  <CountdownTimer targetDate={launch.net} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {launches.length === 0 && (
          <div className="text-center py-20">
            <Rocket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No upcoming launches scheduled</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - Date.now()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white/5 rounded-lg p-3">
        <div className="text-2xl font-bold text-cosmic-blue">{timeLeft.days}</div>
        <div className="text-xs text-gray-500">Days</div>
      </div>
      <div className="bg-white/5 rounded-lg p-3">
        <div className="text-2xl font-bold text-cosmic-blue">{timeLeft.hours}</div>
        <div className="text-xs text-gray-500">Hours</div>
      </div>
      <div className="bg-white/5 rounded-lg p-3">
        <div className="text-2xl font-bold text-cosmic-blue">{timeLeft.minutes}</div>
        <div className="text-xs text-gray-500">Mins</div>
      </div>
      <div className="bg-white/5 rounded-lg p-3">
        <div className="text-2xl font-bold text-cosmic-blue">{timeLeft.seconds}</div>
        <div className="text-xs text-gray-500">Secs</div>
      </div>
    </div>
  )
}

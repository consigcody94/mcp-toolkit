'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Wind, Activity, AlertTriangle, Zap, Radio } from 'lucide-react'

export default function SpaceWeatherPage() {
  const [aurora, setAurora] = useState<any>(null)
  const [solarWind, setSolarWind] = useState<any>(null)
  const [geomagnetic, setGeomagnetic] = useState<any>(null)
  const [solarFlares, setSolarFlares] = useState<any[]>([])
  const [cmes, setCmes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const [auroraRes, solarRes, geoRes, flaresRes, cmesRes] = await Promise.all([
          fetch('http://localhost:3001/api/space-weather/aurora'),
          fetch('http://localhost:3001/api/space-weather/solar-wind'),
          fetch('http://localhost:3001/api/space-weather/geomagnetic'),
          fetch(`http://localhost:3001/api/space-weather/solar-flares?start_date=${weekAgo}&end_date=${today}`),
          fetch(`http://localhost:3001/api/space-weather/cmes?start_date=${weekAgo}&end_date=${today}`)
        ])

        const auroraData = await auroraRes.json()
        const solarData = await solarRes.json()
        const geoData = await geoRes.json()
        const flaresData = await flaresRes.json()
        const cmesData = await cmesRes.json()

        if (auroraData.success) setAurora(auroraData.data)
        if (solarData.success) setSolarWind(solarData.data)
        if (geoData.success) setGeomagnetic(geoData.data)
        if (flaresData.success) setSolarFlares(flaresData.data.slice(0, 5))
        if (cmesData.success) setCmes(cmesData.data.slice(0, 5))

        setLoading(false)
      } catch (err) {
        console.error('Failed to load space weather data:', err)
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 300000) // Update every 5 minutes

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sun className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Loading space weather data...</p>
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
            Space Weather Monitor
          </h1>
          <p className="text-xl text-gray-400">
            Real-time solar activity and geomagnetic conditions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Aurora Forecast */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Activity className="w-8 h-8 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Aurora Forecast</h2>
            </div>

            {aurora && (
              <div className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl">
                  <div className="text-6xl font-bold text-green-400 mb-2">
                    {aurora.hemisphericPower || 'N/A'}
                  </div>
                  <p className="text-gray-400">Hemispheric Power (GW)</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Current Activity</p>
                  <p className="text-white font-semibold">
                    {aurora.hemisphericPower > 30 ? 'High Activity' :
                     aurora.hemisphericPower > 15 ? 'Moderate Activity' :
                     'Low Activity'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Solar Wind */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Wind className="w-8 h-8 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Solar Wind</h2>
            </div>

            {solarWind && (
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">Speed</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {solarWind.speed || 'N/A'} km/s
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">Density</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {solarWind.density || 'N/A'} p/cm³
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">Temperature</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {solarWind.temperature ? (solarWind.temperature / 1000).toFixed(0) : 'N/A'}K
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Geomagnetic Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Geomagnetic</h2>
            </div>

            {geomagnetic && (
              <div className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-br from-yellow-500/20 to-red-500/20 rounded-xl">
                  <div className="text-6xl font-bold text-yellow-400 mb-2">
                    {geomagnetic.kp || 'N/A'}
                  </div>
                  <p className="text-gray-400">Kp Index</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Storm Level</p>
                  <p className="text-white font-semibold">
                    {geomagnetic.kp >= 7 ? '⚠️ Severe Storm' :
                     geomagnetic.kp >= 5 ? '⚡ Storm' :
                     geomagnetic.kp >= 4 ? '⚠️ Minor Storm' :
                     '✅ Quiet'}
                  </p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">Aurora Visibility</p>
                  <p className="text-white font-semibold">
                    {geomagnetic.kp >= 7 ? 'Mid-latitudes' :
                     geomagnetic.kp >= 5 ? 'Northern US/UK' :
                     geomagnetic.kp >= 3 ? 'Canada/Scandinavia' :
                     'Arctic Circle'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Solar Flares & CMEs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Solar Flares */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Zap className="w-8 h-8 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Solar Flares (7 Days)</h2>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {solarFlares.length > 0 ? solarFlares.map((flare, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 hover:from-yellow-500/20 hover:to-orange-500/20 rounded-xl border border-yellow-500/20 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      flare.classType?.startsWith('X') ? 'bg-red-500 text-white' :
                      flare.classType?.startsWith('M') ? 'bg-orange-500 text-white' :
                      flare.classType?.startsWith('C') ? 'bg-yellow-500 text-black' :
                      'bg-gray-500 text-white'
                    }`}>
                      {flare.classType || 'Unknown Class'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {flare.beginTime ? new Date(flare.beginTime).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-white mb-1">
                    Peak: {flare.peakTime ? new Date(flare.peakTime).toLocaleTimeString() : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Source: {flare.sourceLocation || 'Unknown'}
                  </p>
                </motion.div>
              )) : (
                <div className="text-center py-10">
                  <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No solar flares in the past 7 days</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* CMEs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Radio className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">CMEs (7 Days)</h2>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {cmes.length > 0 ? cmes.map((cme, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 rounded-xl border border-purple-500/20 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-purple-400">
                      {cme.cmeAnalyses?.[0]?.speed ? `${cme.cmeAnalyses[0].speed} km/s` : 'Speed N/A'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {cme.activityID || `CME #${index + 1}`}
                    </span>
                  </div>
                  <p className="text-xs text-white mb-1">
                    {cme.startTime ? new Date(cme.startTime).toLocaleString() : 'Time N/A'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Type: {cme.cmeAnalyses?.[0]?.type || 'Unknown'} •
                    {cme.cmeAnalyses?.[0]?.isMostAccurate ? ' ✓ Verified' : ' Preliminary'}
                  </p>
                </motion.div>
              )) : (
                <div className="text-center py-10">
                  <Radio className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No CMEs detected in the past 7 days</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

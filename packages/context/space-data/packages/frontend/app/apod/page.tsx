'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Calendar, User, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

interface APOD {
  date: string
  title: string
  explanation: string
  url: string
  hdurl?: string
  media_type: string
  copyright?: string
}

export default function APODPage() {
  const [apod, setApod] = useState<APOD | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAPOD()
  }, [selectedDate])

  const fetchAPOD = async () => {
    setLoading(true)
    try {
      const url = selectedDate
        ? `http://localhost:3001/api/nasa/apod?date=${selectedDate}`
        : 'http://localhost:3001/api/nasa/apod'

      const res = await fetch(url)
      const data = await res.json()

      if (data.success) {
        setApod(data.data)
      }
      setLoading(false)
    } catch (err) {
      console.error('Failed to load APOD:', err)
      setLoading(false)
    }
  }

  const navigateDate = (days: number) => {
    const currentDate = selectedDate ? new Date(selectedDate) : new Date()
    currentDate.setDate(currentDate.getDate() + days)

    const today = new Date()
    const minDate = new Date('1995-06-16') // APOD started on June 16, 1995

    if (currentDate <= today && currentDate >= minDate) {
      setSelectedDate(currentDate.toISOString().split('T')[0])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="w-16 h-16 text-cosmic-blue mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading Astronomy Picture of the Day...</p>
        </div>
      </div>
    )
  }

  if (!apod) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Failed to load APOD</p>
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
            Astronomy Picture of the Day
          </h1>
          <p className="text-xl text-gray-400">
            Discover the cosmos through NASA's daily featured image
          </p>
        </motion.div>

        {/* Date Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center space-x-4 mb-8"
        >
          <button
            onClick={() => navigateDate(-1)}
            className="glass-card p-3 rounded-xl hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="glass-card rounded-xl px-6 py-3 flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-cosmic-blue" />
            <input
              type="date"
              value={selectedDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              min="1995-06-16"
              className="bg-transparent text-white focus:outline-none"
            />
          </div>

          <button
            onClick={() => navigateDate(1)}
            disabled={selectedDate === new Date().toISOString().split('T')[0] || !selectedDate}
            className="glass-card p-3 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image/Video */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="glass-card rounded-2xl overflow-hidden">
              {apod.media_type === 'image' ? (
                <div className="relative aspect-video bg-black">
                  <img
                    src={apod.url}
                    alt={apod.title}
                    className="w-full h-full object-contain"
                  />

                  {apod.hdurl && (
                    <a
                      href={apod.hdurl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-4 right-4 glass-card px-4 py-2 rounded-xl hover:bg-white/20 transition-all flex items-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm font-semibold">View HD</span>
                    </a>
                  )}
                </div>
              ) : apod.media_type === 'video' ? (
                <div className="aspect-video">
                  <iframe
                    src={apod.url}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              ) : null}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Title Card */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                {apod.title}
              </h2>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="w-4 h-4 text-cosmic-blue" />
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white font-semibold">
                    {new Date(apod.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {apod.copyright && (
                  <div className="flex items-center space-x-3 text-sm">
                    <User className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-400">Copyright:</span>
                    <span className="text-white font-semibold">
                      {apod.copyright}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-3 text-sm">
                  <ImageIcon className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white font-semibold capitalize">
                    {apod.media_type}
                  </span>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Explanation</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {apod.explanation}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Quick Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6 mt-8"
        >
          <h3 className="text-xl font-bold text-white mb-4">Quick Navigation</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedDate('')}
              className="px-4 py-2 bg-gradient-to-r from-cosmic-blue to-purple-600 rounded-xl hover:scale-105 transition-transform font-semibold"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate(-7)}
              className="px-4 py-2 glass-card rounded-xl hover:bg-white/10 transition-all"
            >
              1 Week Ago
            </button>
            <button
              onClick={() => navigateDate(-30)}
              className="px-4 py-2 glass-card rounded-xl hover:bg-white/10 transition-all"
            >
              1 Month Ago
            </button>
            <button
              onClick={() => navigateDate(-365)}
              className="px-4 py-2 glass-card rounded-xl hover:bg-white/10 transition-all"
            >
              1 Year Ago
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

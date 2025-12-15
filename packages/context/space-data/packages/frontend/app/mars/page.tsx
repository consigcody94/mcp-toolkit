'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Truck, Calendar, Camera, ChevronLeft, ChevronRight } from 'lucide-react'

interface MarsPhoto {
  id: number
  sol: number
  camera: {
    full_name: string
    name: string
  }
  img_src: string
  earth_date: string
  rover: {
    name: string
    landing_date: string
    launch_date: string
    status: string
  }
}

export default function MarsPage() {
  const [photos, setPhotos] = useState<MarsPhoto[]>([])
  const [selectedRover, setSelectedRover] = useState('curiosity')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const photosPerPage = 12

  const rovers = [
    { id: 'curiosity', name: 'Curiosity', color: 'from-red-500 to-orange-600' },
    { id: 'perseverance', name: 'Perseverance', color: 'from-blue-500 to-purple-600' },
    { id: 'opportunity', name: 'Opportunity', color: 'from-green-500 to-teal-600' },
    { id: 'spirit', name: 'Spirit', color: 'from-yellow-500 to-amber-600' }
  ]

  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true)
      try {
        const res = await fetch(`http://localhost:3001/api/nasa/mars/${selectedRover}?sol=1000`)
        const data = await res.json()

        if (data.success && data.data.photos) {
          setPhotos(data.data.photos)
        }
        setLoading(false)
      } catch (err) {
        console.error('Failed to load Mars photos:', err)
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [selectedRover])

  const paginatedPhotos = photos.slice(
    currentPage * photosPerPage,
    (currentPage + 1) * photosPerPage
  )

  const totalPages = Math.ceil(photos.length / photosPerPage)

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold gradient-text mb-4">
            Mars Rover Gallery
          </h1>
          <p className="text-xl text-gray-400">
            Explore stunning images from NASA's Mars rovers
          </p>
        </motion.div>

        {/* Rover Selection */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {rovers.map((rover) => (
            <button
              key={rover.id}
              onClick={() => {
                setSelectedRover(rover.id)
                setCurrentPage(0)
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedRover === rover.id
                  ? `bg-gradient-to-r ${rover.color} text-white shadow-lg scale-105`
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5" />
                <span>{rover.name}</span>
              </div>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Truck className="w-16 h-16 text-red-400 mx-auto mb-4 animate-bounce" />
              <p className="text-gray-400">Loading Mars photos...</p>
            </div>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20">
            <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No photos available for this rover</p>
          </div>
        ) : (
          <>
            {/* Photo Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {paginatedPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-xl overflow-hidden group cursor-pointer"
                >
                  <div className="aspect-square relative overflow-hidden bg-black">
                    <img
                      src={photo.img_src}
                      alt={`Mars photo by ${photo.camera.full_name}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-cosmic-blue">
                        {photo.camera.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        Sol {photo.sol}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mb-1">
                      {photo.camera.full_name}
                    </p>

                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{photo.earth_date}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="glass-card p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="text-gray-400">
                  Page {currentPage + 1} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="glass-card p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 mt-8"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-cosmic-blue mb-1">
                    {photos.length}
                  </div>
                  <div className="text-sm text-gray-400">Photos Available</div>
                </div>

                <div>
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {photos[0]?.rover.status || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-400">Rover Status</div>
                </div>

                <div>
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {photos[0]?.sol || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-400">Mars Sol</div>
                </div>

                <div>
                  <div className="text-3xl font-bold text-orange-400 mb-1">
                    {photos[0]?.earth_date || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-400">Earth Date</div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { Loader2, Satellite, Sparkles } from 'lucide-react'

interface LoadingProps {
  message?: string
  variant?: 'spinner' | 'pulse' | 'orbit' | 'dots'
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export default function Loading({
  message = 'Loading...',
  variant = 'spinner',
  size = 'md',
  fullScreen = false,
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-space-darkest/90 backdrop-blur-sm z-50'
    : 'flex flex-col items-center justify-center p-8'

  if (variant === 'spinner') {
    return (
      <div className={containerClasses}>
        <div className="text-center space-y-4">
          <Loader2 className={`${sizeClasses[size]} text-cosmic-blue animate-spin mx-auto`} />
          {message && <p className="text-gray-400 animate-pulse">{message}</p>}
        </div>
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={containerClasses}>
        <div className="text-center space-y-4">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Sparkles className={`${sizeClasses[size]} text-cosmic-purple mx-auto`} />
          </motion.div>
          {message && <p className="text-gray-400">{message}</p>}
        </div>
      </div>
    )
  }

  if (variant === 'orbit') {
    return (
      <div className={containerClasses}>
        <div className="text-center space-y-4">
          <div className="relative" style={{ width: sizeClasses[size].split(' ')[0], height: sizeClasses[size].split(' ')[1] }}>
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Satellite className={`${sizeClasses[size]} text-cosmic-blue`} />
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-cosmic-cyan rounded-full animate-pulse"></div>
            </div>
          </div>
          {message && <p className="text-gray-400">{message}</p>}
        </div>
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={containerClasses}>
        <div className="text-center space-y-4">
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-cosmic-blue rounded-full"
                animate={{
                  y: [0, -10, 0],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
          {message && <p className="text-gray-400">{message}</p>}
        </div>
      </div>
    )
  }

  return null
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <Loader2 className={`${sizeMap[size]} text-cosmic-blue animate-spin`} />
  )
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-space-medium/50 rounded-lg"></div>
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="glass-card rounded-xl p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-space-medium/50 rounded w-3/4"></div>
        <div className="h-4 bg-space-medium/50 rounded w-1/2"></div>
        <div className="h-20 bg-space-medium/50 rounded"></div>
      </div>
    </div>
  )
}

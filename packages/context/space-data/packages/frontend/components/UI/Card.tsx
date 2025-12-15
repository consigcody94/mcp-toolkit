'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
  glow?: boolean
  gradient?: boolean
  onClick?: () => void
}

export default function Card({
  children,
  className = '',
  hoverable = false,
  glow = false,
  gradient = false,
  onClick,
}: CardProps) {
  const baseClasses = 'glass-card rounded-xl p-6 transition-smooth'

  const hoverClasses = hoverable
    ? 'cursor-pointer hover:scale-105 hover:shadow-2xl'
    : ''

  const glowClasses = glow ? 'cosmic-glow' : ''

  const gradientClasses = gradient
    ? 'gradient-border border-2 border-transparent'
    : ''

  const allClasses = `${baseClasses} ${hoverClasses} ${glowClasses} ${gradientClasses} ${className}`

  if (onClick) {
    return (
      <motion.div
        whileHover={hoverable ? { scale: 1.02 } : {}}
        whileTap={hoverable ? { scale: 0.98 } : {}}
        onClick={onClick}
        className={allClasses}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={allClasses}>{children}</div>
}

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  color?: 'blue' | 'purple' | 'cyan' | 'pink' | 'green'
}

export function StatCard({ label, value, icon, trend, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'text-cosmic-blue',
    purple: 'text-cosmic-purple',
    cyan: 'text-cosmic-cyan',
    pink: 'text-cosmic-pink',
    green: 'text-green-500',
  }

  return (
    <Card className="relative overflow-hidden">
      {icon && (
        <div className={`mb-4 ${colorClasses[color]}`}>
          {icon}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-gray-400 font-medium">{label}</p>

        <div className="flex items-end justify-between">
          <p className={`text-3xl font-bold ${colorClasses[color]}`}>
            {value}
          </p>

          {trend && (
            <div
              className={`flex items-center text-sm font-medium ${
                trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
              }`}
            >
              <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

interface InfoCardProps {
  title: string
  description: string
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  color?: string
}

export function InfoCard({ title, description, icon, action, color = 'blue' }: InfoCardProps) {
  return (
    <Card hoverable={!!action} onClick={action?.onClick}>
      <div className="flex items-start space-x-4">
        {icon && (
          <div className={`p-3 rounded-lg bg-gradient-to-br from-${color}-500/20 to-${color}-600/20`}>
            {icon}
          </div>
        )}

        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>

          {action && (
            <button className="text-cosmic-blue hover:text-cosmic-cyan transition-colors text-sm font-medium mt-2">
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

interface ImageCardProps {
  title: string
  imageUrl: string
  description?: string
  date?: string
  onClick?: () => void
}

export function ImageCard({ title, imageUrl, description, date, onClick }: ImageCardProps) {
  return (
    <Card hoverable onClick={onClick} className="p-0 overflow-hidden">
      <div className="relative aspect-video w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        {date && (
          <div className="absolute top-2 right-2 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white">
            {date}
          </div>
        )}
      </div>

      <div className="p-6 space-y-2">
        <h3 className="text-lg font-semibold text-white line-clamp-2">{title}</h3>
        {description && (
          <p className="text-gray-400 text-sm line-clamp-3">{description}</p>
        )}
      </div>
    </Card>
  )
}

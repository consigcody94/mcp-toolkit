/**
 * Type Definitions for Cosmic Atlas Frontend
 */

// ISS Types
export interface ISSPosition {
  latitude: number
  longitude: number
  altitude: number
  velocity: number
  timestamp: string
}

export interface ISSTelemetry {
  speed: number
  altitude: number
  visibility: string
  footprint: number
}

export interface ISSCrew {
  name: string
  role: string
  country: string
  launchDate: string
}

// Space Weather Types
export interface SolarActivity {
  sunspotNumber: number
  solarFlares: SolarFlare[]
  solarWind: SolarWind
}

export interface SolarFlare {
  classType: string
  intensity: number
  timestamp: string
  location: string
}

export interface SolarWind {
  speed: number
  density: number
  temperature: number
}

export interface GeomagneticData {
  kpIndex: number
  stormLevel: string
  forecast: string
}

// Mars Types
export interface MarsPhoto {
  id: number
  sol: number
  camera: MarsCamera
  imgSrc: string
  earthDate: string
  rover: MarsRover
}

export interface MarsCamera {
  id: number
  name: string
  roverId: number
  fullName: string
}

export interface MarsRover {
  id: number
  name: string
  landingDate: string
  launchDate: string
  status: string
  maxSol: number
  maxDate: string
  totalPhotos: number
}

// Exoplanet Types
export interface Exoplanet {
  name: string
  hostname: string
  discoveryMethod: string
  discoveryYear: number
  orbitalPeriod: number
  planetRadius: number
  planetMass: number
  stellarDistance: number
  equilibriumTemp: number
}

export interface ExoplanetStats {
  total: number
  byMethod: Record<string, number>
  byYear: Record<string, number>
}

// Launch Types
export interface Launch {
  id: string
  name: string
  status: LaunchStatus
  net: string // No Earlier Than
  windowStart: string
  windowEnd: string
  mission: Mission
  rocket: Rocket
  pad: LaunchPad
  provider: LaunchProvider
}

export interface Mission {
  name: string
  description: string
  type: string
}

export interface Rocket {
  name: string
  family: string
  variant: string
}

export interface LaunchPad {
  name: string
  location: string
  latitude: number
  longitude: number
}

export interface LaunchProvider {
  name: string
  type: string
}

export type LaunchStatus =
  | 'Go'
  | 'TBD'
  | 'Success'
  | 'Failure'
  | 'Hold'
  | 'In Flight'

// APOD Types
export interface APOD {
  date: string
  title: string
  explanation: string
  url: string
  hdurl?: string
  mediaType: 'image' | 'video'
  copyright?: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: ApiError
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

// UI Component Types
export interface CardProps {
  title?: string
  description?: string
  children?: React.ReactNode
  className?: string
  onClick?: () => void
}

export interface LoadingState {
  isLoading: boolean
  error?: string
  data?: any
}

// Chart Types
export interface ChartDataPoint {
  timestamp: string
  value: number
  label?: string
}

export interface ChartConfig {
  xAxisKey: string
  yAxisKey: string
  color?: string
  strokeWidth?: number
}

// WebSocket Types
export interface WebSocketMessage<T = any> {
  event: string
  data: T
  timestamp: string
}

export interface WebSocketConfig {
  url: string
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

// Filter Types
export interface FilterOption {
  label: string
  value: string | number
  count?: number
}

export interface FilterState {
  [key: string]: string | number | boolean | null
}

// Pagination Types
export interface PaginationParams {
  page: number
  limit: number
  total: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationParams
}

// Search Types
export interface SearchParams {
  query: string
  filters?: FilterState
  sort?: SortConfig
  pagination?: PaginationParams
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

// Navigation Types
export interface NavLink {
  name: string
  href: string
  icon?: React.ReactNode
  external?: boolean
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

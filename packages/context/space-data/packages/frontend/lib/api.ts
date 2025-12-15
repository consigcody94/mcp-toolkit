import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'

/**
 * API Client for Cosmic Atlas Backend
 * Provides type-safe methods for all API endpoints
 */

// Base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const API_TIMEOUT = 30000 // 30 seconds

// Create axios instance with default config
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Add any auth tokens here if needed
      // config.headers.Authorization = `Bearer ${token}`
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle errors globally
      if (error.response) {
        // Server responded with error status
        console.error('API Error:', error.response.status, error.response.data)
      } else if (error.request) {
        // Request made but no response
        console.error('Network Error: No response received')
      } else {
        // Error in request configuration
        console.error('Request Error:', error.message)
      }
      return Promise.reject(error)
    }
  )

  return instance
}

const apiClient = createAxiosInstance()

/**
 * Generic API request handler with error handling
 */
async function apiRequest<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      method,
      url,
      data,
      ...config,
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || error.message || 'An error occurred'
      )
    }
    throw error
  }
}

/**
 * ISS API Methods
 */
export const issApi = {
  /**
   * Get current ISS position and telemetry
   */
  getCurrentPosition: () =>
    apiRequest<any>('get', '/iss/position'),

  /**
   * Get ISS orbit history
   */
  getOrbitHistory: (limit = 100) =>
    apiRequest<any>('get', `/iss/orbit?limit=${limit}`),

  /**
   * Get ISS telemetry data
   */
  getTelemetry: () =>
    apiRequest<any>('get', '/iss/telemetry'),

  /**
   * Get current crew information
   */
  getCrew: () =>
    apiRequest<any>('get', '/iss/crew'),
}

/**
 * Space Weather API Methods
 */
export const spaceWeatherApi = {
  /**
   * Get current solar activity data
   */
  getSolarActivity: () =>
    apiRequest<any>('get', '/space-weather/solar'),

  /**
   * Get geomagnetic storm data
   */
  getGeomagneticData: () =>
    apiRequest<any>('get', '/space-weather/geomagnetic'),

  /**
   * Get solar wind data
   */
  getSolarWind: () =>
    apiRequest<any>('get', '/space-weather/solar-wind'),

  /**
   * Get all space weather data
   */
  getAll: () =>
    apiRequest<any>('get', '/space-weather'),
}

/**
 * Mars Rovers API Methods
 */
export const marsApi = {
  /**
   * Get latest Mars rover photos
   */
  getLatestPhotos: (rover: string = 'curiosity', sol?: number) => {
    const params = sol ? `?sol=${sol}` : ''
    return apiRequest<any>('get', `/mars/${rover}/photos${params}`)
  },

  /**
   * Get rover manifest
   */
  getRoverManifest: (rover: string = 'curiosity') =>
    apiRequest<any>('get', `/mars/${rover}/manifest`),

  /**
   * Get photos by Earth date
   */
  getPhotosByDate: (rover: string, earthDate: string) =>
    apiRequest<any>('get', `/mars/${rover}/photos?earth_date=${earthDate}`),

  /**
   * Get photos by camera
   */
  getPhotosByCamera: (rover: string, camera: string, sol?: number) => {
    const solParam = sol ? `&sol=${sol}` : ''
    return apiRequest<any>('get', `/mars/${rover}/photos?camera=${camera}${solParam}`)
  },
}

/**
 * Exoplanets API Methods
 */
export const exoplanetsApi = {
  /**
   * Get all exoplanets with optional filters
   */
  getAll: (params?: {
    limit?: number
    offset?: number
    hostname?: string
    discoveryMethod?: string
  }) => {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : ''
    return apiRequest<any>('get', `/exoplanets${queryString}`)
  },

  /**
   * Get exoplanet by name
   */
  getByName: (name: string) =>
    apiRequest<any>('get', `/exoplanets/${encodeURIComponent(name)}`),

  /**
   * Get exoplanet statistics
   */
  getStats: () =>
    apiRequest<any>('get', '/exoplanets/stats'),

  /**
   * Search exoplanets
   */
  search: (query: string) =>
    apiRequest<any>('get', `/exoplanets/search?q=${encodeURIComponent(query)}`),
}

/**
 * Launches API Methods
 */
export const launchesApi = {
  /**
   * Get upcoming launches
   */
  getUpcoming: (limit = 10) =>
    apiRequest<any>('get', `/launches/upcoming?limit=${limit}`),

  /**
   * Get past launches
   */
  getPast: (limit = 10) =>
    apiRequest<any>('get', `/launches/past?limit=${limit}`),

  /**
   * Get launch by ID
   */
  getById: (id: string) =>
    apiRequest<any>('get', `/launches/${id}`),

  /**
   * Get all launches with filters
   */
  getAll: (params?: {
    limit?: number
    offset?: number
    status?: string
  }) => {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : ''
    return apiRequest<any>('get', `/launches${queryString}`)
  },
}

/**
 * APOD (Astronomy Picture of the Day) API Methods
 */
export const apodApi = {
  /**
   * Get today's APOD
   */
  getToday: () =>
    apiRequest<any>('get', '/apod/today'),

  /**
   * Get APOD by date
   */
  getByDate: (date: string) =>
    apiRequest<any>('get', `/apod?date=${date}`),

  /**
   * Get APOD range
   */
  getRange: (startDate: string, endDate: string) =>
    apiRequest<any>('get', `/apod/range?start_date=${startDate}&end_date=${endDate}`),

  /**
   * Get random APODs
   */
  getRandom: (count = 5) =>
    apiRequest<any>('get', `/apod/random?count=${count}`),
}

/**
 * Health Check
 */
export const healthApi = {
  /**
   * Check API health
   */
  check: () =>
    apiRequest<any>('get', '/health'),
}

/**
 * Export all API methods
 */
const api = {
  iss: issApi,
  spaceWeather: spaceWeatherApi,
  mars: marsApi,
  exoplanets: exoplanetsApi,
  launches: launchesApi,
  apod: apodApi,
  health: healthApi,
}

export default api

/**
 * Error handling utilities
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Check if error is an API error
 */
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError
}

/**
 * Format error for display
 */
export function formatApiError(error: any): string {
  if (isApiError(error)) {
    return error.message
  }
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Network error occurred'
  }
  return 'An unexpected error occurred'
}

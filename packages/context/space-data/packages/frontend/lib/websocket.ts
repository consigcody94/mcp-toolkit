import { io, Socket } from 'socket.io-client'

/**
 * WebSocket Client for Real-time Updates
 * Manages Socket.IO connections to the backend
 */

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

let socket: Socket | null = null

/**
 * Initialize WebSocket connection
 */
export function initializeWebSocket(): Socket {
  if (socket?.connected) {
    return socket
  }

  socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    console.log('WebSocket connected:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error.message)
  })

  socket.on('error', (error) => {
    console.error('WebSocket error:', error)
  })

  return socket
}

/**
 * Get existing socket instance
 */
export function getSocket(): Socket | null {
  return socket
}

/**
 * Disconnect WebSocket
 */
export function disconnectWebSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Subscribe to ISS position updates
 */
export function subscribeToISSUpdates(callback: (data: any) => void): () => void {
  const socket = initializeWebSocket()

  socket.on('iss:position', callback)

  // Return unsubscribe function
  return () => {
    socket.off('iss:position', callback)
  }
}

/**
 * Subscribe to space weather updates
 */
export function subscribeToSpaceWeather(callback: (data: any) => void): () => void {
  const socket = initializeWebSocket()

  socket.on('space-weather:update', callback)

  return () => {
    socket.off('space-weather:update', callback)
  }
}

/**
 * Subscribe to launch updates
 */
export function subscribeToLaunchUpdates(callback: (data: any) => void): () => void {
  const socket = initializeWebSocket()

  socket.on('launch:update', callback)

  return () => {
    socket.off('launch:update', callback)
  }
}

/**
 * Custom hook for WebSocket subscriptions (for use in React components)
 */
export interface UseWebSocketOptions {
  event: string
  onMessage: (data: any) => void
  enabled?: boolean
}

/**
 * Generic WebSocket subscription
 */
export function subscribeToEvent(
  event: string,
  callback: (data: any) => void
): () => void {
  const socket = initializeWebSocket()

  socket.on(event, callback)

  return () => {
    socket.off(event, callback)
  }
}

/**
 * Emit event to server
 */
export function emitEvent(event: string, data?: any): void {
  const socket = getSocket()

  if (socket?.connected) {
    socket.emit(event, data)
  } else {
    console.warn('WebSocket not connected, cannot emit event:', event)
  }
}

/**
 * Check if WebSocket is connected
 */
export function isConnected(): boolean {
  return socket?.connected || false
}

export default {
  initialize: initializeWebSocket,
  getSocket,
  disconnect: disconnectWebSocket,
  subscribeToISSUpdates,
  subscribeToSpaceWeather,
  subscribeToLaunchUpdates,
  subscribeToEvent,
  emitEvent,
  isConnected,
}

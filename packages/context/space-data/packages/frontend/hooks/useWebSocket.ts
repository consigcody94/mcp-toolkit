import { useEffect, useRef, useCallback, useState } from 'react'
import { subscribeToEvent, emitEvent, isConnected } from '@/lib/websocket'

/**
 * Custom React Hook for WebSocket subscriptions
 */

interface UseWebSocketOptions<T> {
  event: string
  onMessage?: (data: T) => void
  onConnect?: () => void
  onDisconnect?: () => void
  enabled?: boolean
}

interface UseWebSocketReturn<T> {
  data: T | null
  connected: boolean
  emit: (data?: any) => void
}

export function useWebSocket<T>(
  options: UseWebSocketOptions<T>
): UseWebSocketReturn<T> {
  const {
    event,
    onMessage,
    onConnect,
    onDisconnect,
    enabled = true,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [connected, setConnected] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Subscribe to event
    const handleMessage = (receivedData: T) => {
      setData(receivedData)
      if (onMessage) {
        onMessage(receivedData)
      }
    }

    unsubscribeRef.current = subscribeToEvent(event, handleMessage)

    // Check connection status
    setConnected(isConnected())

    // Handle connection events
    const handleConnect = () => {
      setConnected(true)
      if (onConnect) {
        onConnect()
      }
    }

    const handleDisconnect = () => {
      setConnected(false)
      if (onDisconnect) {
        onDisconnect()
      }
    }

    // Subscribe to connection events
    const connectUnsub = subscribeToEvent('connect', handleConnect)
    const disconnectUnsub = subscribeToEvent('disconnect', handleDisconnect)

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      connectUnsub()
      disconnectUnsub()
    }
  }, [event, enabled, onMessage, onConnect, onDisconnect])

  const emit = useCallback((emitData?: any) => {
    emitEvent(event, emitData)
  }, [event])

  return {
    data,
    connected,
    emit,
  }
}

/**
 * Hook for ISS position updates
 */
export function useISSPosition(enabled: boolean = true) {
  return useWebSocket<{
    latitude: number
    longitude: number
    altitude: number
    velocity: number
    timestamp: string
  }>({
    event: 'iss:position',
    enabled,
  })
}

/**
 * Hook for space weather updates
 */
export function useSpaceWeather(enabled: boolean = true) {
  return useWebSocket<{
    solarActivity: any
    geomagneticData: any
    timestamp: string
  }>({
    event: 'space-weather:update',
    enabled,
  })
}

/**
 * Hook for launch updates
 */
export function useLaunchUpdates(enabled: boolean = true) {
  return useWebSocket<{
    id: string
    name: string
    status: string
    net: string
  }>({
    event: 'launch:update',
    enabled,
  })
}

export default useWebSocket

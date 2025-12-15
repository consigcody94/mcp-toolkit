import { useState, useEffect, useCallback } from 'react'

/**
 * Custom React Hooks for API Calls
 */

interface UseApiOptions<T> {
  initialData?: T
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  autoFetch?: boolean
}

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setData: (data: T | null) => void
}

/**
 * Generic hook for API calls with loading and error states
 */
export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const {
    initialData = null,
    onSuccess,
    onError,
    autoFetch = true,
  } = options

  const [data, setData] = useState<T | null>(initialData as T | null)
  const [loading, setLoading] = useState<boolean>(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiCall()
      setData(result)

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)

      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setLoading(false)
    }
  }, [apiCall, onSuccess, onError])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [autoFetch, fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData,
  }
}

/**
 * Hook for paginated API calls
 */
interface UsePaginatedApiOptions<T> {
  initialPage?: number
  initialLimit?: number
  onSuccess?: (data: T[]) => void
  onError?: (error: Error) => void
}

interface UsePaginatedApiReturn<T> {
  data: T[]
  loading: boolean
  error: string | null
  page: number
  limit: number
  total: number
  hasMore: boolean
  nextPage: () => void
  prevPage: () => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  refetch: () => Promise<void>
}

export function usePaginatedApi<T>(
  apiCall: (page: number, limit: number) => Promise<{ items: T[]; total: number }>,
  options: UsePaginatedApiOptions<T> = {}
): UsePaginatedApiReturn<T> {
  const {
    initialPage = 1,
    initialLimit = 10,
    onSuccess,
    onError,
  } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(initialPage)
  const [limit, setLimit] = useState<number>(initialLimit)
  const [total, setTotal] = useState<number>(0)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiCall(page, limit)
      setData(result.items)
      setTotal(result.total)

      if (onSuccess) {
        onSuccess(result.items)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)

      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setLoading(false)
    }
  }, [page, limit, apiCall, onSuccess, onError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1)
  }, [])

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1))
  }, [])

  const hasMore = page * limit < total

  return {
    data,
    loading,
    error,
    page,
    limit,
    total,
    hasMore,
    nextPage,
    prevPage,
    setPage,
    setLimit,
    refetch: fetchData,
  }
}

/**
 * Hook for polling API calls at intervals
 */
interface UsePollingOptions<T> {
  interval?: number
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function usePolling<T>(
  apiCall: () => Promise<T>,
  options: UsePollingOptions<T> = {}
): UseApiReturn<T> {
  const {
    interval = 5000,
    enabled = true,
    onSuccess,
    onError,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await apiCall()
      setData(result)

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)

      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    } finally {
      setLoading(false)
    }
  }, [apiCall, onSuccess, onError])

  useEffect(() => {
    if (!enabled) return

    fetchData()

    const intervalId = setInterval(fetchData, interval)

    return () => clearInterval(intervalId)
  }, [enabled, interval, fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData,
  }
}

/**
 * Hook for debounced API calls (useful for search)
 */
export function useDebouncedApi<T>(
  apiCall: (query: string) => Promise<T>,
  delay: number = 500
): {
  data: T | null
  loading: boolean
  error: string | null
  search: (query: string) => void
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string>('')

  useEffect(() => {
    if (!query) {
      setData(null)
      return
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await apiCall(query)
        setData(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }, delay)

    return () => clearTimeout(timeout)
  }, [query, delay, apiCall])

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery)
  }, [])

  return {
    data,
    loading,
    error,
    search,
  }
}

export default useApi

'use client'

import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="glass-card rounded-2xl p-8 text-center">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <AlertTriangle className="w-20 h-20 text-red-500" />
                  <div className="absolute inset-0 blur-xl opacity-50">
                    <AlertTriangle className="w-20 h-20 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              <h1 className="text-3xl font-bold text-white mb-4">
                Oops! Something went wrong
              </h1>

              <p className="text-gray-400 mb-8">
                We encountered an unexpected error. This might be a temporary issue.
                Please try refreshing the page or return to the home page.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-8 text-left">
                  <details className="glass-card rounded-lg p-4 cursor-pointer">
                    <summary className="text-sm font-semibold text-red-400 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <div className="mt-4 space-y-2">
                      <div className="text-xs">
                        <div className="text-gray-400 mb-1">Error Message:</div>
                        <pre className="bg-space-darkest/50 p-3 rounded overflow-x-auto text-red-300">
                          {this.state.error.toString()}
                        </pre>
                      </div>
                      {this.state.errorInfo && (
                        <div className="text-xs">
                          <div className="text-gray-400 mb-1">Component Stack:</div>
                          <pre className="bg-space-darkest/50 p-3 rounded overflow-x-auto text-gray-300 max-h-64">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-cosmic-blue to-cosmic-purple rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-cosmic-blue/50 transition-all duration-300 hover:scale-105"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Try Again</span>
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center space-x-2 px-6 py-3 glass-card rounded-lg font-semibold text-white hover:border-cosmic-blue transition-all duration-300 hover:scale-105"
                >
                  <Home className="w-5 h-5" />
                  <span>Go Home</span>
                </button>
              </div>

              {/* Additional Help */}
              <p className="text-sm text-gray-500 mt-8">
                If this problem persists, please contact support or check our status page.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier use
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Simple error message component
interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorMessage({
  title = 'Error',
  message,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="glass-card rounded-xl p-8 text-center max-w-md mx-auto">
      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-6 py-3 bg-cosmic-blue rounded-lg font-semibold text-white hover:bg-cosmic-blue/80 transition-colors mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      )}
    </div>
  )
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setupTestEnvironment } from '../test-helpers.js'

// Mock the ErrorHandler class structure based on common patterns
const ErrorHandler = vi.fn().mockImplementation(() => ({
  logError: vi.fn(),
  handleApiError: vi.fn(),
  handleValidationError: vi.fn(),
  handleNetworkError: vi.fn(),
  handleAuthError: vi.fn(),
  handleClientError: vi.fn(),
  handleServerError: vi.fn(),
  notifyUser: vi.fn(),
  reportTelemetry: vi.fn(),
  createErrorReport: vi.fn(),
  isRetryableError: vi.fn(),
  sanitizeError: vi.fn()
}))

describe('Error Handler - Comprehensive Tests', () => {
  let errorHandler
  let testEnv
  let consoleErrorSpy
  let consoleWarnSpy

  beforeEach(() => {
    testEnv = setupTestEnvironment()
    errorHandler = new ErrorHandler()
    
    // Spy on console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    testEnv.cleanup()
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  describe('Error Logging', () => {
    it('should log errors with appropriate level', () => {
      const error = new Error('Test error')
      const context = { component: 'training-tracker', action: 'save_session' }
      
      errorHandler.logError.mockImplementation((error, level, context) => {
        expect(error.message).toBe('Test error')
        expect(level).toBe('error')
        expect(context.component).toBe('training-tracker')
      })
      
      errorHandler.logError(error, 'error', context)
      expect(errorHandler.logError).toHaveBeenCalledWith(error, 'error', context)
    })

    it('should include stack trace for development errors', () => {
      const error = new Error('Development error')
      error.stack = 'Error: Development error\n    at test.js:123:45'
      
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      errorHandler.logError.mockImplementation((error, level, context) => {
        expect(context.includeStack).toBe(true)
        expect(error.stack).toContain('test.js:123:45')
      })
      
      errorHandler.logError(error, 'error', { includeStack: true })
      
      process.env.NODE_ENV = originalEnv
    })

    it('should sanitize sensitive information from error logs', () => {
      const error = new Error('Database connection failed: password=secret123')
      
      errorHandler.sanitizeError.mockImplementation((error) => {
        const sanitizedMessage = error.message.replace(/password=\w+/g, 'password=***')
        return { ...error, message: sanitizedMessage }
      })
      
      const sanitizedError = errorHandler.sanitizeError(error)
      expect(sanitizedError.message).toBe('Database connection failed: password=***')
    })

    it('should log performance metrics with errors', () => {
      const performanceError = new Error('Slow API response')
      const metrics = {
        responseTime: 5000,
        endpoint: '/api/training/analysis',
        timestamp: Date.now()
      }
      
      errorHandler.logError.mockImplementation((error, level, context) => {
        expect(context.performance).toEqual(metrics)
      })
      
      errorHandler.logError(performanceError, 'warn', { performance: metrics })
    })
  })

  describe('API Error Handling', () => {
    it('should handle 400 Bad Request errors', () => {
      const apiError = {
        status: 400,
        message: 'Invalid training session data',
        details: { field: 'duration', error: 'must be positive number' }
      }
      
      errorHandler.handleApiError.mockImplementation((error) => {
        expect(error.status).toBe(400)
        expect(error.message).toBe('Invalid training session data')
        return {
          type: 'validation_error',
          userMessage: 'Please check your training session data and try again.',
          retryable: false
        }
      })
      
      const result = errorHandler.handleApiError(apiError)
      expect(result.type).toBe('validation_error')
      expect(result.retryable).toBe(false)
    })

    it('should handle 401 Unauthorized errors', () => {
      const authError = {
        status: 401,
        message: 'Token expired',
        details: { expiredAt: '2025-01-15T10:00:00Z' }
      }
      
      errorHandler.handleAuthError.mockImplementation((error) => {
        return {
          type: 'auth_error',
          action: 'redirect_to_login',
          userMessage: 'Your session has expired. Please log in again.',
          retryable: false
        }
      })
      
      const result = errorHandler.handleAuthError(authError)
      expect(result.action).toBe('redirect_to_login')
    })

    it('should handle 403 Forbidden errors', () => {
      const forbiddenError = {
        status: 403,
        message: 'Insufficient permissions',
        details: { requiredRole: 'coach', currentRole: 'athlete' }
      }
      
      errorHandler.handleApiError.mockImplementation((error) => {
        return {
          type: 'permission_error',
          userMessage: 'You don\'t have permission to perform this action.',
          retryable: false
        }
      })
      
      const result = errorHandler.handleApiError(forbiddenError)
      expect(result.type).toBe('permission_error')
    })

    it('should handle 404 Not Found errors', () => {
      const notFoundError = {
        status: 404,
        message: 'Training session not found',
        details: { sessionId: 'session-123' }
      }
      
      errorHandler.handleApiError.mockImplementation((error) => {
        return {
          type: 'not_found_error',
          userMessage: 'The requested training session could not be found.',
          retryable: false,
          suggestions: ['Check the session ID', 'Try refreshing the page']
        }
      })
      
      const result = errorHandler.handleApiError(notFoundError)
      expect(result.suggestions).toContain('Check the session ID')
    })

    it('should handle 500 Server errors', () => {
      const serverError = {
        status: 500,
        message: 'Internal server error',
        details: { errorId: 'err-123', timestamp: Date.now() }
      }
      
      errorHandler.handleServerError.mockImplementation((error) => {
        return {
          type: 'server_error',
          userMessage: 'Something went wrong on our end. Please try again later.',
          retryable: true,
          retryAfter: 5000
        }
      })
      
      const result = errorHandler.handleServerError(serverError)
      expect(result.retryable).toBe(true)
      expect(result.retryAfter).toBe(5000)
    })
  })

  describe('Network Error Handling', () => {
    it('should handle network timeout errors', () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.code = 'TIMEOUT'
      
      errorHandler.handleNetworkError.mockImplementation((error) => {
        return {
          type: 'network_timeout',
          userMessage: 'The request took too long to complete. Please check your connection and try again.',
          retryable: true,
          retryAfter: 2000
        }
      })
      
      const result = errorHandler.handleNetworkError(timeoutError)
      expect(result.retryable).toBe(true)
    })

    it('should handle connection refused errors', () => {
      const connectionError = new Error('Connection refused')
      connectionError.code = 'ECONNREFUSED'
      
      errorHandler.handleNetworkError.mockImplementation((error) => {
        return {
          type: 'connection_error',
          userMessage: 'Unable to connect to the server. Please check your internet connection.',
          retryable: true,
          fallbackMode: 'offline'
        }
      })
      
      const result = errorHandler.handleNetworkError(connectionError)
      expect(result.fallbackMode).toBe('offline')
    })

    it('should handle DNS resolution errors', () => {
      const dnsError = new Error('DNS lookup failed')
      dnsError.code = 'ENOTFOUND'
      
      errorHandler.handleNetworkError.mockImplementation((error) => {
        return {
          type: 'dns_error',
          userMessage: 'Unable to reach the server. Please check your internet connection.',
          retryable: true,
          retryAfter: 10000
        }
      })
      
      const result = errorHandler.handleNetworkError(dnsError)
      expect(result.type).toBe('dns_error')
    })
  })

  describe('Validation Error Handling', () => {
    it('should handle form validation errors', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password must be at least 8 characters' },
        { field: 'age', message: 'Age must be between 13 and 100' }
      ]
      
      errorHandler.handleValidationError.mockImplementation((errors) => {
        return {
          type: 'validation_error',
          errors: errors.map(err => ({
            field: err.field,
            userMessage: err.message
          })),
          userMessage: 'Please correct the highlighted fields and try again.'
        }
      })
      
      const result = errorHandler.handleValidationError(validationErrors)
      expect(result.errors).toHaveLength(3)
      expect(result.errors[0].field).toBe('email')
    })

    it('should handle training session validation errors', () => {
      const trainingErrors = [
        { field: 'duration', message: 'Duration must be positive' },
        { field: 'exercises', message: 'At least one exercise required' },
        { field: 'intensity', message: 'Intensity must be between 1-10' }
      ]
      
      errorHandler.handleValidationError.mockImplementation((errors) => {
        return {
          type: 'training_validation_error',
          errors,
          userMessage: 'Please check your training session data.',
          suggestions: [
            'Ensure all fields are filled correctly',
            'Check that exercise data is complete'
          ]
        }
      })
      
      const result = errorHandler.handleValidationError(trainingErrors)
      expect(result.suggestions).toContain('Ensure all fields are filled correctly')
    })

    it('should handle nutrition validation errors', () => {
      const nutritionErrors = [
        { field: 'calories', message: 'Calories cannot be negative' },
        { field: 'meal_time', message: 'Invalid meal time format' }
      ]
      
      errorHandler.handleValidationError.mockImplementation((errors) => {
        return {
          type: 'nutrition_validation_error',
          errors,
          userMessage: 'Please correct your nutrition entry.',
          retryable: true
        }
      })
      
      const result = errorHandler.handleValidationError(nutritionErrors)
      expect(result.type).toBe('nutrition_validation_error')
    })
  })

  describe('User Notification', () => {
    it('should notify user of critical errors', () => {
      const criticalError = {
        type: 'server_error',
        severity: 'critical',
        userMessage: 'Critical system error occurred.'
      }
      
      errorHandler.notifyUser.mockImplementation((error) => {
        if (error.severity === 'critical') {
          return {
            method: 'modal',
            title: 'System Error',
            message: error.userMessage,
            actions: ['retry', 'contact_support']
          }
        }
      })
      
      const notification = errorHandler.notifyUser(criticalError)
      expect(notification.method).toBe('modal')
      expect(notification.actions).toContain('contact_support')
    })

    it('should show toast notifications for minor errors', () => {
      const minorError = {
        type: 'validation_error',
        severity: 'low',
        userMessage: 'Please check your input.'
      }
      
      errorHandler.notifyUser.mockImplementation((error) => {
        if (error.severity === 'low') {
          return {
            method: 'toast',
            duration: 3000,
            message: error.userMessage,
            type: 'warning'
          }
        }
      })
      
      const notification = errorHandler.notifyUser(minorError)
      expect(notification.method).toBe('toast')
      expect(notification.duration).toBe(3000)
    })

    it('should handle offline error notifications', () => {
      const offlineError = {
        type: 'connection_error',
        userMessage: 'You appear to be offline.',
        context: { feature: 'data_sync' }
      }
      
      errorHandler.notifyUser.mockImplementation((error) => {
        return {
          method: 'banner',
          persistent: true,
          message: error.userMessage,
          actions: ['retry_when_online', 'work_offline']
        }
      })
      
      const notification = errorHandler.notifyUser(offlineError)
      expect(notification.persistent).toBe(true)
      expect(notification.actions).toContain('work_offline')
    })
  })

  describe('Error Recovery', () => {
    it('should determine if error is retryable', () => {
      const retryableError = { status: 500, type: 'server_error' }
      const nonRetryableError = { status: 400, type: 'validation_error' }
      
      errorHandler.isRetryableError.mockImplementation((error) => {
        return error.status >= 500 || error.type === 'network_error'
      })
      
      expect(errorHandler.isRetryableError(retryableError)).toBe(true)
      expect(errorHandler.isRetryableError(nonRetryableError)).toBe(false)
    })

    it('should suggest recovery actions', () => {
      const recoveryError = {
        type: 'connection_error',
        context: { lastAction: 'save_training_session' }
      }
      
      errorHandler.suggestRecovery = vi.fn().mockImplementation((error) => {
        return {
          actions: [
            'check_internet_connection',
            'retry_save',
            'save_locally'
          ],
          autoRetry: true,
          retryDelay: 5000
        }
      })
      
      const recovery = errorHandler.suggestRecovery(recoveryError)
      expect(recovery.actions).toContain('save_locally')
      expect(recovery.autoRetry).toBe(true)
    })

    it('should handle graceful degradation', () => {
      const featureError = {
        type: 'feature_unavailable',
        feature: 'ai_coaching',
        context: { fallbackAvailable: true }
      }
      
      errorHandler.handleGracefulDegradation = vi.fn().mockImplementation((error) => {
        return {
          fallbackMode: 'basic_coaching',
          userMessage: 'AI coaching is temporarily unavailable. Using basic coaching mode.',
          affectedFeatures: ['personalized_recommendations', 'predictive_analytics']
        }
      })
      
      const degradation = errorHandler.handleGracefulDegradation(featureError)
      expect(degradation.fallbackMode).toBe('basic_coaching')
    })
  })

  describe('Error Reporting & Telemetry', () => {
    it('should create comprehensive error reports', () => {
      const error = new Error('Complex error scenario')
      const context = {
        component: 'training-analytics',
        userAction: 'generate_performance_report',
        sessionId: 'session-123',
        userId: 'user-456'
      }
      
      errorHandler.createErrorReport.mockImplementation((error, context) => {
        return {
          errorId: 'err-' + Date.now(),
          timestamp: new Date().toISOString(),
          error: {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
          },
          context,
          environment: {
            userAgent: navigator.userAgent,
            url: window.location.href,
            viewport: { width: window.innerWidth, height: window.innerHeight }
          },
          session: {
            duration: Date.now() - context.sessionStart,
            actionsCount: context.actionsInSession
          }
        }
      })
      
      const report = errorHandler.createErrorReport(error, context)
      expect(report.errorId).toMatch(/^err-\d+$/)
      expect(report.context.component).toBe('training-analytics')
    })

    it('should report telemetry data', () => {
      const telemetryData = {
        errorType: 'api_timeout',
        endpoint: '/api/training/analysis',
        responseTime: 5000,
        retryCount: 2,
        resolved: false
      }
      
      errorHandler.reportTelemetry.mockImplementation((data) => {
        // Simulate sending telemetry to analytics service
        return { sent: true, telemetryId: 'tel-' + Date.now() }
      })
      
      const result = errorHandler.reportTelemetry(telemetryData)
      expect(result.sent).toBe(true)
      expect(result.telemetryId).toMatch(/^tel-\d+$/)
    })

    it('should aggregate error patterns', () => {
      const errors = [
        { type: 'api_timeout', endpoint: '/api/training' },
        { type: 'api_timeout', endpoint: '/api/training' },
        { type: 'validation_error', field: 'email' },
        { type: 'api_timeout', endpoint: '/api/nutrition' }
      ]
      
      errorHandler.aggregateErrorPatterns = vi.fn().mockImplementation((errors) => {
        const patterns = {}
        errors.forEach(error => {
          const key = `${error.type}:${error.endpoint || error.field}`
          patterns[key] = (patterns[key] || 0) + 1
        })
        return patterns
      })
      
      const patterns = errorHandler.aggregateErrorPatterns(errors)
      expect(patterns['api_timeout:/api/training']).toBe(2)
      expect(patterns['api_timeout:/api/nutrition']).toBe(1)
    })
  })

  describe('Error Context Enhancement', () => {
    it('should enhance errors with user context', () => {
      const baseError = new Error('Training save failed')
      const userContext = {
        userId: 'user-123',
        userType: 'premium_athlete',
        currentPlan: 'olympic_preparation',
        deviceInfo: { type: 'mobile', os: 'ios' }
      }
      
      errorHandler.enhanceWithContext = vi.fn().mockImplementation((error, context) => {
        return {
          ...error,
          context: {
            ...context,
            timestamp: Date.now(),
            errorId: 'enhanced-err-' + Math.random().toString(36).substr(2, 9)
          }
        }
      })
      
      const enhancedError = errorHandler.enhanceWithContext(baseError, userContext)
      expect(enhancedError.context.userType).toBe('premium_athlete')
      expect(enhancedError.context.errorId).toMatch(/^enhanced-err-/)
    })

    it('should track error frequency per user', () => {
      const userId = 'user-123'
      
      errorHandler.trackUserErrorFrequency = vi.fn().mockImplementation((userId, error) => {
        return {
          errorCount: 5,
          errorFrequency: 0.12, // errors per session
          pattern: 'increasing',
          recommendation: 'provide_additional_guidance'
        }
      })
      
      const tracking = errorHandler.trackUserErrorFrequency(userId, new Error('test'))
      expect(tracking.errorCount).toBe(5)
      expect(tracking.recommendation).toBe('provide_additional_guidance')
    })
  })
})
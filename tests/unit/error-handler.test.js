import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorHandler } from '../../src/error-handler.js'

describe('ErrorHandler', () => {
  let errorHandler
  let consoleSpy

  beforeEach(() => {
    errorHandler = new ErrorHandler()
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('handleError', () => {
    it('should log basic errors', () => {
      const error = new Error('Test error')
      
      errorHandler.handleError(error)

      expect(consoleSpy).toHaveBeenCalledWith('Error:', error)
    })

    it('should handle network errors', () => {
      const networkError = new Error('Failed to fetch')
      networkError.name = 'NetworkError'

      const result = errorHandler.handleError(networkError)

      expect(result.type).toBe('network')
      expect(result.message).toContain('network')
    })

    it('should handle validation errors', () => {
      const validationError = new Error('Validation failed')
      validationError.name = 'ValidationError'

      const result = errorHandler.handleError(validationError)

      expect(result.type).toBe('validation')
      expect(result.message).toContain('validation')
    })

    it('should handle authentication errors', () => {
      const authError = new Error('Unauthorized')
      authError.status = 401

      const result = errorHandler.handleError(authError)

      expect(result.type).toBe('auth')
      expect(result.redirect).toBe('/login.html')
    })

    it('should handle 403 forbidden errors', () => {
      const forbiddenError = new Error('Forbidden')
      forbiddenError.status = 403

      const result = errorHandler.handleError(forbiddenError)

      expect(result.type).toBe('permission')
      expect(result.message).toContain('permission')
    })

    it('should handle 404 not found errors', () => {
      const notFoundError = new Error('Not found')
      notFoundError.status = 404

      const result = errorHandler.handleError(notFoundError)

      expect(result.type).toBe('notFound')
      expect(result.message).toContain('not found')
    })

    it('should handle 500 server errors', () => {
      const serverError = new Error('Internal server error')
      serverError.status = 500

      const result = errorHandler.handleError(serverError)

      expect(result.type).toBe('server')
      expect(result.message).toContain('server')
    })
  })

  describe('displayError', () => {
    it('should show error in UI element', () => {
      const mockElement = {
        innerHTML: '',
        style: { display: 'none' }
      }
      document.getElementById = vi.fn().mockReturnValue(mockElement)

      errorHandler.displayError('Test error message')

      expect(mockElement.innerHTML).toContain('Test error message')
      expect(mockElement.style.display).toBe('block')
    })

    it('should handle missing error container gracefully', () => {
      document.getElementById = vi.fn().mockReturnValue(null)

      expect(() => errorHandler.displayError('Test error')).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('Error container not found')
    })
  })

  describe('clearErrors', () => {
    it('should hide error container', () => {
      const mockElement = {
        innerHTML: 'Previous error',
        style: { display: 'block' }
      }
      document.getElementById = vi.fn().mockReturnValue(mockElement)

      errorHandler.clearErrors()

      expect(mockElement.innerHTML).toBe('')
      expect(mockElement.style.display).toBe('none')
    })
  })

  describe('logError', () => {
    it('should log errors with context', () => {
      const error = new Error('Test error')
      const context = { userId: 123, action: 'login' }

      errorHandler.logError(error, context)

      expect(consoleSpy).toHaveBeenCalledWith('Error Context:', context)
      expect(consoleSpy).toHaveBeenCalledWith('Error:', error)
    })
  })

  describe('isRetryableError', () => {
    it('should identify retryable network errors', () => {
      const networkError = new Error('Failed to fetch')
      
      expect(errorHandler.isRetryableError(networkError)).toBe(true)
    })

    it('should identify non-retryable validation errors', () => {
      const validationError = new Error('Invalid input')
      validationError.status = 400

      expect(errorHandler.isRetryableError(validationError)).toBe(false)
    })

    it('should identify retryable server errors', () => {
      const serverError = new Error('Internal error')
      serverError.status = 500

      expect(errorHandler.isRetryableError(serverError)).toBe(true)
    })

    it('should identify retryable timeout errors', () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'TimeoutError'

      expect(errorHandler.isRetryableError(timeoutError)).toBe(true)
    })
  })
})
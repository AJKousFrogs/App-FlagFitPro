import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PerformanceUtils } from '../../src/performance-utils.js'

describe('PerformanceUtils', () => {
  let performanceUtils

  beforeEach(() => {
    performanceUtils = new PerformanceUtils()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('debounce', () => {
    it('should delay function execution', () => {
      const mockFn = vi.fn()
      const debouncedFn = performanceUtils.debounce(mockFn, 100)

      debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledOnce()
    })

    it('should cancel previous calls', () => {
      const mockFn = vi.fn()
      const debouncedFn = performanceUtils.debounce(mockFn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledOnce()
    })

    it('should pass arguments correctly', () => {
      const mockFn = vi.fn()
      const debouncedFn = performanceUtils.debounce(mockFn, 100)

      debouncedFn('arg1', 'arg2')
      vi.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('throttle', () => {
    it('should limit function calls', () => {
      const mockFn = vi.fn()
      const throttledFn = performanceUtils.throttle(mockFn, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(mockFn).toHaveBeenCalledOnce()

      vi.advanceTimersByTime(100)
      throttledFn()

      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('should execute immediately on first call', () => {
      const mockFn = vi.fn()
      const throttledFn = performanceUtils.throttle(mockFn, 100)

      throttledFn()
      expect(mockFn).toHaveBeenCalledOnce()
    })
  })

  describe('lazyLoad', () => {
    it('should load images when in viewport', () => {
      const mockImage = {
        src: '',
        dataset: { src: 'lazy-image.jpg' },
        classList: { add: vi.fn(), remove: vi.fn() }
      }

      const mockIntersectionObserver = vi.fn().mockImplementation((callback) => ({
        observe: vi.fn((element) => {
          // Simulate image entering viewport
          callback([{ target: element, isIntersecting: true }])
        }),
        unobserve: vi.fn(),
        disconnect: vi.fn()
      }))

      global.IntersectionObserver = mockIntersectionObserver

      performanceUtils.lazyLoad([mockImage])

      expect(mockImage.src).toBe('lazy-image.jpg')
      expect(mockImage.classList.add).toHaveBeenCalledWith('loaded')
    })
  })

  describe('measurePerformance', () => {
    it('should measure function execution time', async () => {
      const slowFunction = () => new Promise(resolve => setTimeout(resolve, 100))
      
      vi.useRealTimers() // Need real timers for performance measurement
      const result = await performanceUtils.measurePerformance(slowFunction, 'test-function')
      
      expect(result.duration).toBeGreaterThan(90)
      expect(result.name).toBe('test-function')
    })

    it('should handle synchronous functions', () => {
      const syncFunction = () => 'result'
      
      const result = performanceUtils.measurePerformance(syncFunction, 'sync-test')
      
      expect(result.result).toBe('result')
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })
  })

  describe('cacheWithTTL', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    it('should cache values', () => {
      const cache = performanceUtils.cacheWithTTL(1000)
      
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('should expire cached values', () => {
      const cache = performanceUtils.cacheWithTTL(1000)
      
      cache.set('key1', 'value1')
      vi.advanceTimersByTime(1500)
      
      expect(cache.get('key1')).toBeUndefined()
    })

    it('should refresh TTL on access', () => {
      const cache = performanceUtils.cacheWithTTL(1000)
      
      cache.set('key1', 'value1')
      vi.advanceTimersByTime(500)
      
      expect(cache.get('key1')).toBe('value1') // Should still exist
      vi.advanceTimersByTime(700) // Total 1200ms, but refreshed at 500ms
      
      expect(cache.get('key1')).toBe('value1') // Should still exist due to refresh
    })
  })

  describe('optimizeImages', () => {
    it('should compress images', async () => {
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn()
        }),
        toBlob: vi.fn((callback) => {
          callback(new Blob(['compressed'], { type: 'image/jpeg' }))
        })
      }

      document.createElement = vi.fn().mockReturnValue(mockCanvas)

      const file = new File(['original'], 'test.jpg', { type: 'image/jpeg' })
      const result = await performanceUtils.optimizeImages([file])

      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(Blob)
    })
  })

  describe('batchRequests', () => {
    it('should batch multiple requests', async () => {
      const requests = [
        () => Promise.resolve('result1'),
        () => Promise.resolve('result2'),
        () => Promise.resolve('result3')
      ]

      const results = await performanceUtils.batchRequests(requests, 2)

      expect(results).toEqual(['result1', 'result2', 'result3'])
    })

    it('should handle request failures', async () => {
      const requests = [
        () => Promise.resolve('result1'),
        () => Promise.reject(new Error('Failed')),
        () => Promise.resolve('result3')
      ]

      const results = await performanceUtils.batchRequests(requests, 2)

      expect(results[0]).toBe('result1')
      expect(results[1]).toBeInstanceOf(Error)
      expect(results[2]).toBe('result3')
    })
  })
})
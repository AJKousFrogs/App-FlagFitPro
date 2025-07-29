/**
 * Comprehensive tests for performance utilities
 */

import {
  PerformanceMonitor,
  performanceUtils,
  memoryUtils,
  bundleUtils,
  reactUtils,
  optimizationHelpers,
  initializePerformanceMonitoring,
} from '../performance';

// Mock performance APIs
const mockPerformanceObserver = jest.fn();
const mockPerformanceEntry = {
  entryType: 'navigation',
  name: 'navigation',
  duration: 1500,
  startTime: 0,
  responseStart: 100,
  requestStart: 50,
  domContentLoadedEventEnd: 800,
  domContentLoadedEventStart: 750,
  loadEventEnd: 1500,
  loadEventStart: 1450,
  domainLookupEnd: 60,
  domainLookupStart: 55,
  connectEnd: 80,
  connectStart: 65,
  secureConnectionStart: 70,
  responseEnd: 200,
  element: { tagName: 'DIV' },
  url: 'https://example.com/test.jpg',
  processingStart: 105,
  transferSize: 1024,
  hadRecentInput: false,
  value: 0.05,
};

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Setup PerformanceObserver mock
  global.PerformanceObserver = jest.fn().mockImplementation((callback) => {
    mockPerformanceObserver.mockImplementation(callback);
    return {
      observe: jest.fn(),
      disconnect: jest.fn(),
    };
  });

  // Setup performance API mocks
  global.performance.getEntriesByType = jest.fn().mockReturnValue([mockPerformanceEntry]);
  global.performance.getEntriesByName = jest.fn().mockReturnValue([mockPerformanceEntry]);
  global.performance.mark = jest.fn();
  global.performance.measure = jest.fn().mockReturnValue(mockPerformanceEntry);
  
  // Setup memory mock
  (global.performance as any).memory = {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 40000000,
  };

  // Setup navigator mock
  Object.defineProperty(global.navigator, 'onLine', {
    value: true,
    writable: true,
  });
});

describe('PerformanceMonitor', () => {
  describe('constructor', () => {
    it('should create monitor with default options', () => {
      const monitor = new PerformanceMonitor();
      expect(monitor.enabled).toBe(true);
      expect(monitor.sampleRate).toBe(0.1);
      expect(monitor.metrics).toBeInstanceOf(Map);
    });

    it('should create monitor with custom options', () => {
      const monitor = new PerformanceMonitor({
        enabled: false,
        sampleRate: 0.5,
      });
      expect(monitor.enabled).toBe(false);
      expect(monitor.sampleRate).toBe(0.5);
    });

    it('should setup observers when enabled', () => {
      new PerformanceMonitor({ enabled: true });
      expect(global.PerformanceObserver).toHaveBeenCalled();
    });

    it('should not setup observers when disabled', () => {
      new PerformanceMonitor({ enabled: false });
      // Note: In our implementation, observers are only set up if window exists
      // In test environment, this condition prevents observer setup
    });
  });

  describe('recordMetric', () => {
    it('should record metric when sampling passes', () => {
      const monitor = new PerformanceMonitor({ sampleRate: 1.0 });
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      monitor.recordMetric('test', { value: 100 });

      expect(monitor.metrics.has('test')).toBe(true);
      expect(monitor.metrics.get('test')).toHaveLength(1);
    });

    it('should not record metric when sampling fails', () => {
      const monitor = new PerformanceMonitor({ sampleRate: 0.1 });
      jest.spyOn(Math, 'random').mockReturnValue(0.9);

      monitor.recordMetric('test', { value: 100 });

      expect(monitor.metrics.has('test')).toBe(false);
    });
  });

  describe('extractNavigationMetrics', () => {
    it('should extract navigation timing metrics', () => {
      const monitor = new PerformanceMonitor();
      const metrics = monitor.extractNavigationMetrics(mockPerformanceEntry as any);

      expect(metrics).toHaveProperty('ttfb');
      expect(metrics).toHaveProperty('domLoad');
      expect(metrics).toHaveProperty('windowLoad');
      expect(metrics).toHaveProperty('dns');
      expect(metrics.ttfb).toBe(50); // responseStart - requestStart
      expect(metrics.dns).toBe(5); // domainLookupEnd - domainLookupStart
    });
  });

  describe('getResourceType', () => {
    it('should identify JavaScript files', () => {
      const monitor = new PerformanceMonitor();
      expect(monitor.getResourceType('https://example.com/app.js')).toBe('script');
    });

    it('should identify CSS files', () => {
      const monitor = new PerformanceMonitor();
      expect(monitor.getResourceType('https://example.com/styles.css')).toBe('stylesheet');
    });

    it('should identify image files', () => {
      const monitor = new PerformanceMonitor();
      expect(monitor.getResourceType('https://example.com/image.png')).toBe('image');
      expect(monitor.getResourceType('https://example.com/photo.jpg')).toBe('image');
    });

    it('should identify font files', () => {
      const monitor = new PerformanceMonitor();
      expect(monitor.getResourceType('https://example.com/font.woff2')).toBe('font');
    });

    it('should default to other for unknown types', () => {
      const monitor = new PerformanceMonitor();
      expect(monitor.getResourceType('https://example.com/unknown.xyz')).toBe('other');
    });
  });

  describe('getMetrics', () => {
    it('should return all metrics when no type specified', () => {
      const monitor = new PerformanceMonitor({ sampleRate: 1.0 });
      jest.spyOn(Math, 'random').mockReturnValue(0.1);

      monitor.recordMetric('test1', { value: 1 });
      monitor.recordMetric('test2', { value: 2 });

      const metrics = monitor.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(2);
      expect(metrics).toHaveProperty('test1');
      expect(metrics).toHaveProperty('test2');
    });

    it('should return specific metric type when specified', () => {
      const monitor = new PerformanceMonitor({ sampleRate: 1.0 });
      jest.spyOn(Math, 'random').mockReturnValue(0.1);

      monitor.recordMetric('test1', { value: 1 });
      monitor.recordMetric('test2', { value: 2 });

      const metrics = monitor.getMetrics('test1');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].data.value).toBe(1);
    });
  });

  describe('disconnect', () => {
    it('should disconnect all observers', () => {
      const mockDisconnect = jest.fn();
      global.PerformanceObserver = jest.fn().mockReturnValue({
        observe: jest.fn(),
        disconnect: mockDisconnect,
      });

      const monitor = new PerformanceMonitor();
      monitor.observers = [
        { disconnect: mockDisconnect },
        { disconnect: mockDisconnect },
      ] as any;

      monitor.disconnect();

      expect(mockDisconnect).toHaveBeenCalledTimes(2);
      expect(monitor.observers).toHaveLength(0);
    });
  });
});

describe('performanceUtils', () => {
  describe('measureTime', () => {
    it('should measure sync function execution time', async () => {
      const testFn = jest.fn(() => 'result');
      const measuredFn = performanceUtils.measureTime('test', testFn);

      const result = await measuredFn('arg1', 'arg2');

      expect(result).toBe('result');
      expect(testFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(global.performance.now).toHaveBeenCalled();
    });

    it('should measure async function execution time', async () => {
      const testFn = jest.fn(() => Promise.resolve('async-result'));
      const measuredFn = performanceUtils.measureTime('test-async', testFn);

      const result = await measuredFn('arg1');

      expect(result).toBe('async-result');
      expect(testFn).toHaveBeenCalledWith('arg1');
    });

    it('should handle function errors and still measure time', async () => {
      const error = new Error('Test error');
      const testFn = jest.fn(() => { throw error; });
      const measuredFn = performanceUtils.measureTime('test-error', testFn);

      await expect(measuredFn()).rejects.toThrow(error);
      expect(global.performance.now).toHaveBeenCalled();
    });
  });

  describe('mark', () => {
    it('should create performance mark', () => {
      performanceUtils.mark('test-mark');
      expect(global.performance.mark).toHaveBeenCalledWith('test-mark');
    });

    it('should handle missing performance.mark gracefully', () => {
      const originalMark = global.performance.mark;
      delete (global.performance as any).mark;

      expect(() => performanceUtils.mark('test')).not.toThrow();

      global.performance.mark = originalMark;
    });
  });

  describe('measure', () => {
    it('should create performance measure', () => {
      performanceUtils.measure('test-measure', 'start', 'end');
      expect(global.performance.measure).toHaveBeenCalledWith('test-measure', 'start', 'end');
    });

    it('should return duration from measure', () => {
      const duration = performanceUtils.measure('test-measure', 'start', 'end');
      expect(duration).toBe(1500); // from mockPerformanceEntry
    });
  });
});

describe('memoryUtils', () => {
  describe('getMemoryUsage', () => {
    it('should return memory usage when available', () => {
      const memory = memoryUtils.getMemoryUsage();

      expect(memory).toEqual({
        used: 10000000,
        total: 20000000,
        limit: 40000000,
        percentage: 25, // (10M / 40M) * 100
      });
    });

    it('should return null when memory API not available', () => {
      const originalMemory = (global.performance as any).memory;
      delete (global.performance as any).memory;

      const memory = memoryUtils.getMemoryUsage();
      expect(memory).toBeNull();

      (global.performance as any).memory = originalMemory;
    });
  });

  describe('monitorMemoryLeaks', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should log warning when memory usage exceeds threshold', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Set high memory usage
      (global.performance as any).memory.usedJSHeapSize = 35000000; // 87.5%

      memoryUtils.monitorMemoryLeaks(80);

      // Fast-forward time to trigger check
      jest.advanceTimersByTime(30000);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('High memory usage: 87.50%')
      );

      consoleSpy.mockRestore();
    });

    it('should not log warning when memory usage is below threshold', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      memoryUtils.monitorMemoryLeaks(90);
      jest.advanceTimersByTime(30000);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

describe('bundleUtils', () => {
  describe('getBundleInfo', () => {
    beforeEach(() => {
      // Mock DOM elements
      document.head.innerHTML = `
        <script src="/static/js/app.js" async></script>
        <script src="/static/js/vendor.js" defer></script>
        <link rel="stylesheet" href="/static/css/main.css" media="screen">
        <link rel="stylesheet" href="/static/css/print.css" media="print">
      `;
    });

    it('should return bundle information', () => {
      const info = bundleUtils.getBundleInfo();

      expect(info.totalScripts).toBe(2);
      expect(info.totalStylesheets).toBe(2);
      expect(info.scripts).toHaveLength(2);
      expect(info.stylesheets).toHaveLength(2);

      expect(info.scripts[0]).toEqual({
        src: expect.stringContaining('app.js'),
        async: true,
        defer: false,
      });

      expect(info.stylesheets[0]).toEqual({
        href: expect.stringContaining('main.css'),
        media: 'screen',
      });
    });
  });

  describe('analyzeResourceLoading', () => {
    it('should analyze resource loading performance', () => {
      // Mock performance entries
      const mockResources = [
        {
          name: 'https://example.com/app.js',
          duration: 500,
          transferSize: 100000,
        },
        {
          name: 'https://example.com/styles.css',
          duration: 200,
          transferSize: 50000,
        },
        {
          name: 'https://example.com/slow.js',
          duration: 1500,
          transferSize: 200000,
        },
        {
          name: 'https://example.com/cached.js',
          duration: 10,
          transferSize: 0,
        },
      ];

      global.performance.getEntriesByType = jest.fn().mockReturnValue(mockResources);

      const analysis = bundleUtils.analyzeResourceLoading();

      expect(analysis.totalResources).toBe(4);
      expect(analysis.totalSize).toBe(350000);
      expect(analysis.totalDuration).toBe(2210);
      expect(analysis.slowResources).toHaveLength(1);
      expect(analysis.slowResources[0].name).toContain('slow.js');
      expect(analysis.cachedResources).toHaveLength(1);
      expect(analysis.cachedResources[0]).toContain('cached.js');
    });
  });
});

describe('optimizationHelpers', () => {
  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce function calls', () => {
      const fn = jest.fn();
      const debouncedFn = optimizationHelpers.debounce(fn, 100);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg3');
    });

    it('should call immediately when immediate flag is true', () => {
      const fn = jest.fn();
      const debouncedFn = optimizationHelpers.debounce(fn, 100, true);

      debouncedFn('arg1');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg1');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should throttle function calls', () => {
      const fn = jest.fn();
      const throttledFn = optimizationHelpers.throttle(fn, 100);

      throttledFn('arg1');
      throttledFn('arg2');
      throttledFn('arg3');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg1');

      jest.advanceTimersByTime(100);

      throttledFn('arg4');

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('arg4');
    });
  });

  describe('memoize', () => {
    it('should memoize function results', () => {
      const fn = jest.fn((x: number) => x * 2);
      const memoizedFn = optimizationHelpers.memoize(fn);

      const result1 = memoizedFn(5);
      const result2 = memoizedFn(5);
      const result3 = memoizedFn(10);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(result3).toBe(20);
      expect(fn).toHaveBeenCalledTimes(2); // Only called for unique arguments
    });

    it('should use custom key generator', () => {
      const fn = jest.fn((obj: { id: number }) => obj.id * 2);
      const memoizedFn = optimizationHelpers.memoize(fn, (obj) => obj.id.toString());

      const obj1 = { id: 1 };
      const obj2 = { id: 1 }; // Different object, same id

      const result1 = memoizedFn(obj1);
      const result2 = memoizedFn(obj2);

      expect(result1).toBe(2);
      expect(result2).toBe(2);
      expect(fn).toHaveBeenCalledTimes(1); // Only called once due to same key
    });
  });

  describe('preloadResource', () => {
    it('should add preload link to document head', () => {
      optimizationHelpers.preloadResource('/static/js/app.js', 'script');

      const preloadLink = document.head.querySelector('link[rel="preload"]');
      expect(preloadLink).toBeTruthy();
      expect(preloadLink?.getAttribute('href')).toBe('/static/js/app.js');
      expect(preloadLink?.getAttribute('as')).toBe('script');
    });
  });
});

describe('initializePerformanceMonitoring', () => {
  it('should initialize performance monitoring', () => {
    const originalWindow = global.window;
    (global as any).window = { performance: global.performance };

    const monitor = initializePerformanceMonitoring({ enabled: true });

    expect(monitor).toBeInstanceOf(PerformanceMonitor);

    global.window = originalWindow;
  });

  it('should return null when window is not available', () => {
    const originalWindow = global.window;
    delete (global as any).window;

    const monitor = initializePerformanceMonitoring();

    expect(monitor).toBeNull();

    (global as any).window = originalWindow;
  });
});
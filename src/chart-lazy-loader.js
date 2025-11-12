// Lazy load Chart.js only when chart containers are visible
// Uses IntersectionObserver for performance optimization

export class ChartLazyLoader {
  static chartLoaded = false;
  static loadingPromise = null;
  static observers = new Map();

  // Load Chart.js dynamically
  static async loadChartJS() {
    if (this.chartLoaded && window.Chart) {
      return window.Chart;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = new Promise((resolve, reject) => {
      // Check if Chart.js is already loaded
      if (window.Chart) {
        this.chartLoaded = true;
        resolve(window.Chart);
        return;
      }

      // Load Chart.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js';
      script.async = true;
      
      script.onload = () => {
        this.chartLoaded = true;
        console.log('✅ Chart.js loaded successfully');
        resolve(window.Chart);
      };

      script.onerror = () => {
        // Try fallback CDN
        console.warn('Primary CDN failed, trying fallback...');
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://unpkg.com/chart.js@4.4.1/dist/chart.umd.js';
        fallbackScript.async = true;
        
        fallbackScript.onload = () => {
          this.chartLoaded = true;
          console.log('✅ Chart.js loaded from fallback');
          resolve(window.Chart);
        };

        fallbackScript.onerror = () => {
          console.error('❌ Failed to load Chart.js from all sources');
          reject(new Error('Chart.js failed to load'));
        };

        document.head.appendChild(fallbackScript);
      };

      document.head.appendChild(script);
    });

    return this.loadingPromise;
  }

  // Observe chart container and load Chart.js when visible
  static observeChartContainer(containerId, initCallback) {
    const container = document.getElementById(containerId) || 
                      document.querySelector(`[data-chart="${containerId}"]`);
    
    if (!container) {
      console.warn(`Chart container not found: ${containerId}`);
      return;
    }

    // If container is already visible, load immediately
    const rect = container.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

    if (isVisible) {
      this.loadChartJS().then(() => {
        if (initCallback) initCallback();
      });
      return;
    }

    // Use IntersectionObserver for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadChartJS().then(() => {
              if (initCallback) initCallback();
            });
            observer.unobserve(entry.target);
            this.observers.delete(containerId);
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before container is visible
        threshold: 0.01,
      }
    );

    observer.observe(container);
    this.observers.set(containerId, observer);
  }

  // Observe multiple chart containers
  static observeChartContainers(containers, initCallback) {
    containers.forEach(({ id, callback }) => {
      this.observeChartContainer(id, callback || initCallback);
    });
  }

  // Cleanup observers
  static cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}


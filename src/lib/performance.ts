/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and custom metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = import.meta.env.PROD && !!import.meta.env.VITE_UMAMI_WEBSITE_ID;
    
    if (this.isEnabled) {
      this.initializeWebVitals();
      this.initializeCustomMetrics();
    }
  }

  private async initializeWebVitals() {
    try {
      // Dynamically import web-vitals only in production
      const webVitals = await import('web-vitals');
      
      const sendToAnalytics = (metric: WebVitalsMetric) => {
        this.recordMetric({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          timestamp: Date.now(),
        });

        // Send to Umami if available
        if (typeof window !== 'undefined' && (window as any).umami) {
          (window as any).umami.track('web-vital', {
            metric: metric.name,
            value: Math.round(metric.value),
            rating: metric.rating,
          });
        }
      };

      if (webVitals.onCLS) webVitals.onCLS(sendToAnalytics);
      if (webVitals.onFID) webVitals.onFID(sendToAnalytics);
      if (webVitals.onFCP) webVitals.onFCP(sendToAnalytics);
      if (webVitals.onLCP) webVitals.onLCP(sendToAnalytics);
      if (webVitals.onTTFB) webVitals.onTTFB(sendToAnalytics);
    } catch (error) {
      console.warn('Web Vitals not available:', error);
    }
  }

  private initializeCustomMetrics() {
    // Track navigation timing
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.recordMetric({
            name: 'DOM_CONTENT_LOADED',
            value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            rating: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart < 1000 ? 'good' : 'needs-improvement',
            timestamp: Date.now(),
          });

          this.recordMetric({
            name: 'LOAD_EVENT',
            value: navigation.loadEventEnd - navigation.loadEventStart,
            rating: navigation.loadEventEnd - navigation.loadEventStart < 2000 ? 'good' : 'needs-improvement',
            timestamp: Date.now(),
          });
        }
      });
    }
  }

  recordMetric(metric: PerformanceMetric) {
    if (!this.isEnabled) return;

    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Track custom performance marks
  mark(name: string) {
    if (!this.isEnabled || typeof window === 'undefined') return;
    
    try {
      performance.mark(name);
    } catch (error) {
      console.warn('Performance mark failed:', error);
    }
  }

  // Measure time between marks
  measure(name: string, startMark: string, endMark?: string) {
    if (!this.isEnabled || typeof window === 'undefined') return;
    
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      
      if (measure) {
        this.recordMetric({
          name: name.toUpperCase(),
          value: measure.duration,
          rating: measure.duration < 100 ? 'good' : measure.duration < 300 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.warn('Performance measure failed:', error);
    }
  }

  // Track React component render times
  trackComponentRender(componentName: string, renderTime: number) {
    if (!this.isEnabled) return;

    this.recordMetric({
      name: `COMPONENT_RENDER_${componentName.toUpperCase()}`,
      value: renderTime,
      rating: renderTime < 16 ? 'good' : renderTime < 50 ? 'needs-improvement' : 'poor',
      timestamp: Date.now(),
    });
  }

  // Track API call performance
  trackApiCall(endpoint: string, duration: number, success: boolean) {
    if (!this.isEnabled) return;

    this.recordMetric({
      name: `API_CALL_${endpoint.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`,
      value: duration,
      rating: duration < 200 ? 'good' : duration < 1000 ? 'needs-improvement' : 'poor',
      timestamp: Date.now(),
    });

    // Track success rate
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track('api-call', {
        endpoint,
        duration: Math.round(duration),
        success,
      });
    }
  }

  // Get performance summary
  getSummary(): { [key: string]: PerformanceMetric[] } {
    const summary: { [key: string]: PerformanceMetric[] } = {};
    
    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = [];
      }
      summary[metric.name].push(metric);
    });

    return summary;
  }

  // Clear metrics
  clear() {
    this.metrics = [];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  const startTime = performance.now();

  return {
    trackRender: () => {
      const renderTime = performance.now() - startTime;
      performanceMonitor.trackComponentRender(componentName, renderTime);
    },
    mark: (name: string) => performanceMonitor.mark(`${componentName}_${name}`),
    measure: (name: string, startMark: string, endMark?: string) => 
      performanceMonitor.measure(`${componentName}_${name}`, startMark, endMark),
  };
}

// API performance tracking wrapper
export function withApiPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  endpoint: string
): T {
  return (async (...args: any[]) => {
    const startTime = performance.now();
    let success = false;
    
    try {
      const result = await fn(...args);
      success = true;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      performanceMonitor.trackApiCall(endpoint, duration, success);
    }
  }) as T;
}
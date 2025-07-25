/**
 * Simplified performance monitoring for production
 */

interface SimpleMetric {
  name: string;
  value: number;
  timestamp: number;
}

class SimplePerformanceMonitor {
  private metrics: SimpleMetric[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = import.meta.env.PROD && !!import.meta.env.VITE_UMAMI_WEBSITE_ID;
  }

  trackApiCall(endpoint: string, duration: number, success: boolean) {
    if (!this.isEnabled) return;

    this.metrics.push({
      name: `api_${endpoint}`,
      value: duration,
      timestamp: Date.now(),
    });

    // Keep only last 50 metrics
    if (this.metrics.length > 50) {
      this.metrics = this.metrics.slice(-50);
    }

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track('api-performance', {
        endpoint,
        duration: Math.round(duration),
        success,
      });
    }
  }

  mark(name: string) {
    if (!this.isEnabled || typeof window === 'undefined') return;
    
    try {
      performance.mark(name);
    } catch (error) {
      // Ignore errors
    }
  }

  measure(name: string, startMark: string, endMark?: string) {
    if (!this.isEnabled || typeof window === 'undefined') return;
    
    try {
      performance.measure(name, startMark, endMark);
    } catch (error) {
      // Ignore errors
    }
  }

  getMetrics() {
    return this.metrics;
  }

  clear() {
    this.metrics = [];
  }
}

export const simplePerformanceMonitor = new SimplePerformanceMonitor();
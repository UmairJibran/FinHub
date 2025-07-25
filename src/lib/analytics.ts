/**
 * Analytics integration for Umami
 * Handles event tracking and page views
 */

interface UmamiEvent {
  name: string;
  data?: Record<string, any>;
}

interface UmamiPageView {
  url: string;
  title?: string;
  referrer?: string;
}

class Analytics {
  private isEnabled: boolean;
  private websiteId: string | undefined;

  constructor() {
    this.websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
    this.isEnabled = import.meta.env.PROD && !!this.websiteId;
    
    if (this.isEnabled) {
      this.initializeUmami();
    }
  }

  private initializeUmami() {
    if (typeof window === 'undefined' || !this.websiteId) return;

    // Load Umami script
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = 'https://cloud.umami.is/script.js';
    script.setAttribute('data-website-id', this.websiteId);
    script.setAttribute('data-domains', window.location.hostname);
    script.setAttribute('data-auto-track', 'false'); // We'll handle tracking manually
    
    document.head.appendChild(script);

    // Wait for Umami to load
    script.onload = () => {
      console.log('Umami analytics loaded');
    };

    script.onerror = () => {
      console.warn('Failed to load Umami analytics');
    };
  }

  // Track page views
  trackPageView(pageView: UmamiPageView) {
    if (!this.isEnabled || typeof window === 'undefined') return;

    try {
      if ((window as any).umami) {
        (window as any).umami.track(pageView.url, pageView);
      }
    } catch (error) {
      console.warn('Failed to track page view:', error);
    }
  }

  // Track custom events
  trackEvent(event: UmamiEvent) {
    if (!this.isEnabled || typeof window === 'undefined') return;

    try {
      if ((window as any).umami) {
        (window as any).umami.track(event.name, event.data);
      }
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  }

  // Track user interactions
  trackUserAction(action: string, category: string, data?: Record<string, any>) {
    this.trackEvent({
      name: 'user-action',
      data: {
        action,
        category,
        ...data,
      },
    });
  }

  // Track portfolio-specific events
  trackPortfolioEvent(action: string, portfolioData?: Record<string, any>) {
    this.trackEvent({
      name: 'portfolio-action',
      data: {
        action,
        ...portfolioData,
      },
    });
  }

  // Track calculator usage
  trackCalculatorUsage(calculator: string, data?: Record<string, any>) {
    this.trackEvent({
      name: 'calculator-usage',
      data: {
        calculator,
        ...data,
      },
    });
  }

  // Track authentication events
  trackAuthEvent(action: string, method?: string) {
    this.trackEvent({
      name: 'auth-action',
      data: {
        action,
        method,
      },
    });
  }

  // Track errors
  trackError(error: string, context?: string, data?: Record<string, any>) {
    this.trackEvent({
      name: 'error',
      data: {
        error,
        context,
        ...data,
      },
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, rating: string) {
    this.trackEvent({
      name: 'performance',
      data: {
        metric,
        value: Math.round(value),
        rating,
      },
    });
  }
}

// Create singleton instance
export const analytics = new Analytics();

// React hook for page tracking
export function usePageTracking() {
  const trackPage = (url: string, title?: string) => {
    analytics.trackPageView({ url, title, referrer: document.referrer });
  };

  return { trackPage };
}

// React hook for event tracking
export function useEventTracking() {
  return {
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackPortfolioEvent: analytics.trackPortfolioEvent.bind(analytics),
    trackCalculatorUsage: analytics.trackCalculatorUsage.bind(analytics),
    trackAuthEvent: analytics.trackAuthEvent.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
  };
}
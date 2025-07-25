/**
 * Performance Monitor Component
 * Development-only component for monitoring app performance
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { performanceMonitor } from '@/lib/performance';
import { Activity, Zap, Clock, AlertTriangle } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<{ [key: string]: PerformanceMetric[] }>({});
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const summary = performanceMonitor.getSummary();
      setMetrics(summary);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'needs-improvement':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'poor':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatValue = (name: string, value: number) => {
    if (name.includes('API_CALL') || name.includes('COMPONENT_RENDER')) {
      return `${value.toFixed(2)}ms`;
    }
    if (name.includes('PERCENTAGE')) {
      return `${value.toFixed(2)}%`;
    }
    return value.toFixed(2);
  };

  const getMetricIcon = (name: string) => {
    if (name.includes('API_CALL')) return <Activity className="h-4 w-4" />;
    if (name.includes('COMPONENT_RENDER')) return <Zap className="h-4 w-4" />;
    if (name.includes('PAGE_')) return <Clock className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
        >
          <Activity className="h-4 w-4 mr-2" />
          Performance
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden">
      <Card className="bg-background/95 backdrop-blur-sm border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Monitor
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => performanceMonitor.clear()}
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 max-h-80 overflow-y-auto">
          <div className="space-y-3">
            {Object.entries(metrics).map(([metricName, metricList]) => {
              const latestMetric = metricList[metricList.length - 1];
              if (!latestMetric) return null;

              return (
                <div
                  key={metricName}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getMetricIcon(metricName)}
                    <span className="text-xs font-medium truncate">
                      {metricName.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono">
                      {formatValue(metricName, latestMetric.value)}
                    </span>
                    <Badge
                      className={`text-xs px-1 py-0 ${getRatingColor(latestMetric.rating)}`}
                    >
                      {latestMetric.rating === 'needs-improvement' ? 'OK' : latestMetric.rating}
                    </Badge>
                  </div>
                </div>
              );
            })}

            {Object.keys(metrics).length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-4">
                No performance metrics yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Web Vitals Display Component
 */
export function WebVitalsDisplay() {
  const [vitals, setVitals] = useState<{ [key: string]: number }>({});

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  useEffect(() => {
    // Listen for web vitals updates
    const handleVitalsUpdate = (event: CustomEvent) => {
      setVitals(prev => ({
        ...prev,
        [event.detail.name]: event.detail.value,
      }));
    };

    window.addEventListener('web-vitals-update', handleVitalsUpdate as EventListener);
    return () => {
      window.removeEventListener('web-vitals-update', handleVitalsUpdate as EventListener);
    };
  }, []);

  const getVitalRating = (name: string, value: number) => {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  if (Object.keys(vitals).length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="bg-background/95 backdrop-blur-sm border-2 w-64">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {Object.entries(vitals).map(([name, value]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-xs font-medium">{name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">
                    {name === 'CLS' ? value.toFixed(3) : Math.round(value)}
                    {name !== 'CLS' && 'ms'}
                  </span>
                  <Badge
                    className={`text-xs px-1 py-0 ${getRatingColor(getVitalRating(name, value))}`}
                  >
                    {getVitalRating(name, value) === 'needs-improvement' ? 'OK' : getVitalRating(name, value)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
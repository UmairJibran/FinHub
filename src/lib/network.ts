/**
 * Network error handling with retry mechanisms
 */

import { CustomError, ErrorType, withRetry } from './error-handling';

// Network status monitoring
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  public subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// Enhanced fetch with retry and error handling
export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  retryCondition?: (error: any, attempt: number) => boolean;
  corsMode?: 'cors' | 'no-cors' | 'same-origin';
}

export async function enhancedFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = 10000,
    retries = 3,
    retryDelay = 1000,
    corsMode = 'cors',
    retryCondition = (error, attempt) => {
      // Retry on network errors or 5xx server errors
      return (
        error.name === 'NetworkError' ||
        error.name === 'TypeError' ||
        (error.status >= 500 && error.status < 600)
      );
    },
    ...fetchOptions
  } = options;

  // Check network status
  const networkMonitor = NetworkMonitor.getInstance();
  if (!networkMonitor.getStatus()) {
    throw new CustomError(
      'No internet connection available',
      ErrorType.NETWORK,
      { retryable: true }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchWithTimeout = async (): Promise<Response> => {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        mode: corsMode,
        credentials: corsMode === 'cors' ? 'include' : 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorType = response.status >= 500 
          ? ErrorType.SERVER 
          : response.status === 401 
          ? ErrorType.AUTHENTICATION
          : response.status === 403
          ? ErrorType.AUTHORIZATION
          : response.status === 404
          ? ErrorType.NOT_FOUND
          : ErrorType.UNKNOWN;

        throw new CustomError(
          `HTTP ${response.status}: ${response.statusText}`,
          errorType,
          { 
            statusCode: response.status,
            retryable: response.status >= 500 || response.status === 429
          }
        );
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new CustomError(
          'Request timed out',
          ErrorType.NETWORK,
          { retryable: true, cause: error }
        );
      }

      if (error instanceof CustomError) {
        throw error;
      }

      // Network or other fetch errors
      throw new CustomError(
        'Network request failed',
        ErrorType.NETWORK,
        { retryable: true, cause: error }
      );
    }
  };

  return withRetry(fetchWithTimeout, {
    maxRetries: retries,
    baseDelay: retryDelay,
    shouldRetry: retryCondition,
  });
}

// Supabase client wrapper with enhanced error handling
export function createSupabaseWrapper(supabaseClient: any) {
  return {
    async query(queryFn: () => Promise<any>) {
      try {
        const result = await queryFn();
        
        if (result.error) {
          throw new CustomError(
            result.error.message,
            this.classifySupabaseError(result.error),
            { 
              code: result.error.code,
              details: result.error.details,
              retryable: this.isRetryableSupabaseError(result.error)
            }
          );
        }

        return result;
      } catch (error) {
        if (error instanceof CustomError) {
          throw error;
        }

        throw new CustomError(
          'Database operation failed',
          ErrorType.SERVER,
          { retryable: true, cause: error }
        );
      }
    },

    classifySupabaseError(error: any): ErrorType {
      if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        return ErrorType.AUTHENTICATION;
      }
      
      if (error.code === '42501' || error.message?.includes('RLS')) {
        return ErrorType.AUTHORIZATION;
      }
      
      if (error.code === '23505') {
        return ErrorType.VALIDATION;
      }
      
      if (error.code === 'PGRST116') {
        return ErrorType.NOT_FOUND;
      }
      
      return ErrorType.SERVER;
    },

    isRetryableSupabaseError(error: any): boolean {
      // Don't retry auth, authorization, or validation errors
      const nonRetryableCodes = ['42501', '23505', 'PGRST116'];
      if (nonRetryableCodes.includes(error.code)) {
        return false;
      }
      
      if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        return false;
      }
      
      return true;
    }
  };
}

// Connection quality monitoring
export class ConnectionQualityMonitor {
  private static instance: ConnectionQualityMonitor;
  private quality: 'good' | 'poor' | 'offline' = 'good';
  private listeners: Set<(quality: string) => void> = new Set();

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): ConnectionQualityMonitor {
    if (!ConnectionQualityMonitor.instance) {
      ConnectionQualityMonitor.instance = new ConnectionQualityMonitor();
    }
    return ConnectionQualityMonitor.instance;
  }

  private async startMonitoring() {
    // Check connection quality every 30 seconds
    setInterval(async () => {
      await this.checkConnectionQuality();
    }, 30000);

    // Initial check
    await this.checkConnectionQuality();
  }

  private async checkConnectionQuality() {
    if (!navigator.onLine) {
      this.updateQuality('offline');
      return;
    }

    try {
      const start = Date.now();
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const duration = Date.now() - start;

      if (response.ok) {
        const newQuality = duration > 2000 ? 'poor' : 'good';
        this.updateQuality(newQuality);
      } else {
        this.updateQuality('poor');
      }
    } catch {
      this.updateQuality('poor');
    }
  }

  private updateQuality(newQuality: 'good' | 'poor' | 'offline') {
    if (this.quality !== newQuality) {
      this.quality = newQuality;
      this.listeners.forEach(listener => listener(newQuality));
    }
  }

  public getQuality(): string {
    return this.quality;
  }

  public subscribe(listener: (quality: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// Request queue for offline scenarios
export class RequestQueue {
  private static instance: RequestQueue;
  private queue: Array<{
    id: string;
    url: string;
    options: RequestInit;
    resolve: (value: Response) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;

  private constructor() {
    this.setupNetworkListener();
  }

  static getInstance(): RequestQueue {
    if (!RequestQueue.instance) {
      RequestQueue.instance = new RequestQueue();
    }
    return RequestQueue.instance;
  }

  private setupNetworkListener() {
    const networkMonitor = NetworkMonitor.getInstance();
    networkMonitor.subscribe((isOnline) => {
      if (isOnline && this.queue.length > 0) {
        this.processQueue();
      }
    });
  }

  public enqueue(url: string, options: RequestInit = {}): Promise<Response> {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9);
      this.queue.push({ id, url, options, resolve, reject });
      
      // Try to process immediately if online
      if (navigator.onLine) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && navigator.onLine) {
      const request = this.queue.shift()!;
      
      try {
        const response = await enhancedFetch(request.url, request.options);
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      }
    }

    this.processing = false;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public clearQueue(): void {
    this.queue.forEach(request => {
      request.reject(new CustomError(
        'Request cancelled',
        ErrorType.UNKNOWN,
        { retryable: false }
      ));
    });
    this.queue = [];
  }
}

// React hooks for network monitoring
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  
  React.useEffect(() => {
    const networkMonitor = NetworkMonitor.getInstance();
    return networkMonitor.subscribe(setIsOnline);
  }, []);

  return isOnline;
}

export function useConnectionQuality() {
  const [quality, setQuality] = React.useState<string>('good');
  
  React.useEffect(() => {
    const monitor = ConnectionQualityMonitor.getInstance();
    setQuality(monitor.getQuality());
    return monitor.subscribe(setQuality);
  }, []);

  return quality;
}

// Import React for hooks
import React from 'react';
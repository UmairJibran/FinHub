/**
 * Security configuration and utilities
 */

import { apiRateLimiter, authRateLimiter } from './input-sanitization';

// Security configuration constants
export const SECURITY_CONFIG = {
  // Rate limiting
  API_RATE_LIMIT: 60, // requests per minute
  AUTH_RATE_LIMIT: 5, // attempts per 5 minutes
  
  // Session management
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  
  // Input validation
  MAX_INPUT_LENGTH: 1000,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  
  // CORS settings
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://localhost:3000',
    'https://localhost:5173',
    // Add production domains here
    ...(import.meta.env.VITE_ALLOWED_ORIGINS?.split(',') || []),
  ],
  
  // Content Security Policy
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval needed for Vite in dev
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'connect-src': ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'frame-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': import.meta.env.PROD ? [] : undefined,
  },
} as const;

// Security middleware for API calls
export function withSecurityMiddleware<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    requireAuth?: boolean;
    rateLimiter?: 'api' | 'auth';
    validateInput?: boolean;
  } = {}
): T {
  return (async (...args: any[]) => {
    const { requireAuth = true, rateLimiter = 'api', validateInput = true } = options;
    
    // Rate limiting
    const limiter = rateLimiter === 'auth' ? authRateLimiter : apiRateLimiter;
    const identifier = getUserIdentifier();
    
    if (!limiter.isAllowed(identifier)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Input validation (if enabled)
    if (validateInput) {
      validateInputSecurity(args);
    }
    
    // Authentication check (if required)
    if (requireAuth && !isUserAuthenticated()) {
      throw new Error('Authentication required');
    }
    
    // Execute the original function
    return await fn(...args);
  }) as T;
}

// Get user identifier for rate limiting
function getUserIdentifier(): string {
  // In a real app, this would use user ID or IP address
  // For now, use a combination of user agent and timestamp
  const userAgent = navigator.userAgent;
  const sessionId = sessionStorage.getItem('session-id') || 'anonymous';
  return `${userAgent}-${sessionId}`;
}

// Check if user is authenticated
function isUserAuthenticated(): boolean {
  // This should check actual auth state
  // For now, check if there's a session token
  return !!localStorage.getItem('supabase.auth.token');
}

// Validate input security
function validateInputSecurity(inputs: any[]): void {
  for (const input of inputs) {
    if (typeof input === 'string') {
      // Check for potential XSS
      if (containsPotentialXSS(input)) {
        throw new Error('Invalid input detected');
      }
      
      // Check for SQL injection patterns
      if (containsPotentialSQLInjection(input)) {
        throw new Error('Invalid input detected');
      }
      
      // Check input length
      if (input.length > SECURITY_CONFIG.MAX_INPUT_LENGTH) {
        throw new Error('Input too long');
      }
    }
  }
}

// XSS detection
function containsPotentialXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b/gi,
    /<object\b/gi,
    /<embed\b/gi,
    /<link\b/gi,
    /<meta\b/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

// SQL injection detection
function containsPotentialSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/gi,
    /(--|\/\*|\*\/)/g,
    /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\(\s*\d+\s*\))/gi,
    /(\b(CAST|CONVERT)\s*\()/gi,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

// Session security utilities
export class SessionSecurity {
  private static lastActivity: number = Date.now();
  private static sessionStartTime: number = Date.now();
  
  static updateActivity(): void {
    this.lastActivity = Date.now();
  }
  
  static isSessionExpired(): boolean {
    const now = Date.now();
    const sessionAge = now - this.sessionStartTime;
    const idleTime = now - this.lastActivity;
    
    return sessionAge > SECURITY_CONFIG.SESSION_TIMEOUT || 
           idleTime > SECURITY_CONFIG.IDLE_TIMEOUT;
  }
  
  static extendSession(): void {
    this.sessionStartTime = Date.now();
    this.lastActivity = Date.now();
  }
  
  static clearSession(): void {
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
    this.sessionStartTime = 0;
    this.lastActivity = 0;
  }
}

// HTTPS enforcement
export function enforceHTTPS(): void {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
  }
}

// Content Security Policy header generation
export function generateCSPHeader(): string {
  const directives = Object.entries(SECURITY_CONFIG.CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values?.join(' ') || ''}`)
    .join('; ');
  
  return directives;
}

// Secure cookie settings
export function getSecureCookieOptions(): {
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  httpOnly: boolean;
} {
  return {
    secure: location.protocol === 'https:',
    sameSite: 'strict',
    httpOnly: true,
  };
}

// CORS validation utility
export function validateCORSOrigin(origin: string): boolean {
  if (!origin) return false;
  
  // Allow localhost in development
  if (!import.meta.env.PROD && origin.includes('localhost')) {
    return true;
  }
  
  return SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin);
}

// Security headers for API responses
export function getSecurityHeaders(origin?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': generateCSPHeader(),
  };

  // Add CORS headers if origin is provided and valid
  if (origin && validateCORSOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
    headers['Access-Control-Max-Age'] = '86400'; // 24 hours
  }

  return headers;
}

// Initialize security measures
export function initializeSecurity(): void {
  // Enforce HTTPS in production
  if (import.meta.env.PROD) {
    enforceHTTPS();
  }
  
  // Set security headers on the document
  const metaCSP = document.createElement('meta');
  metaCSP.httpEquiv = 'Content-Security-Policy';
  metaCSP.content = generateCSPHeader();
  document.head.appendChild(metaCSP);
  
  // Set up session activity tracking
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  events.forEach(event => {
    document.addEventListener(event, () => SessionSecurity.updateActivity(), true);
  });
  
  // Check session expiration periodically
  setInterval(() => {
    if (SessionSecurity.isSessionExpired()) {
      SessionSecurity.clearSession();
      // Redirect to login or show session expired message
      window.location.href = '/login';
    }
  }, 60000); // Check every minute
  
  // Disable right-click context menu in production
  if (import.meta.env.PROD) {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  // Disable F12 and other developer tools shortcuts in production
  if (import.meta.env.PROD) {
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
      }
    });
  }
  
  // Initialize security audit logging
  SecurityAuditLogger.log(SECURITY_EVENTS.SESSION_EXPIRED, {
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
  });
  
  // Run security tests in development
  if (import.meta.env.DEV) {
    // Run comprehensive security audit
    import('./security-audit').then(({ runSecurityAudit }) => {
      runSecurityAudit();
    });
    
    // Run individual tests if enabled
    if (import.meta.env.VITE_ENABLE_SECURITY_TESTING === 'true') {
      import('./security-testing').then(({ runSecurityTests }) => {
        runSecurityTests();
      });
    }
    
    if (import.meta.env.VITE_ENABLE_RLS_TESTING === 'true') {
      import('./rls-testing').then(({ runAndLogRLSTests }) => {
        runAndLogRLSTests();
      });
    }
  }
}

// Audit logging utility
export class SecurityAuditLogger {
  private static logs: Array<{
    timestamp: number;
    event: string;
    details: any;
    userAgent: string;
  }> = [];
  
  static log(event: string, details: any = {}): void {
    this.logs.push({
      timestamp: Date.now(),
      event,
      details,
      userAgent: navigator.userAgent,
    });
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    // In production, send to monitoring service
    if (import.meta.env.PROD) {
      this.sendToMonitoring(event, details);
    }
  }
  
  private static sendToMonitoring(event: string, details: any): void {
    // Implementation would send to monitoring service
    // For now, just store in session storage for debugging
    const existingLogs = JSON.parse(sessionStorage.getItem('security-logs') || '[]');
    existingLogs.push({
      timestamp: Date.now(),
      event,
      details,
    });
    
    // Keep only last 100 logs in session storage
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    sessionStorage.setItem('security-logs', JSON.stringify(existingLogs));
  }
  
  static getLogs(): typeof SecurityAuditLogger.logs {
    return [...this.logs];
  }
  
  static clearLogs(): void {
    this.logs = [];
    sessionStorage.removeItem('security-logs');
  }
}

// Security event types for audit logging
export const SECURITY_EVENTS = {
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  SESSION_EXPIRED: 'session_expired',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_INPUT: 'invalid_input',
  XSS_ATTEMPT: 'xss_attempt',
  SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
} as const;
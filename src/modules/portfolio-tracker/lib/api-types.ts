/**
 * API-specific types and interfaces for Portfolio Tracker
 */

import { 
  Portfolio, 
  Position, 
  Transaction, 
  User, 
  AssetType,
  PortfolioSummary,
  PositionWithMetrics,
  DashboardAnalytics
} from './types';

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * API error codes for consistent error handling
 */
export enum ApiErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Business logic errors
  INSUFFICIENT_QUANTITY = 'INSUFFICIENT_QUANTITY',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
  PORTFOLIO_LIMIT_EXCEEDED = 'PORTFOLIO_LIMIT_EXCEEDED',
  
  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * Detailed API error interface
 */
export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, any>;
  field?: string;
  timestamp?: string;
  request_id?: string;
}

/**
 * Validation error details
 */
export interface ValidationError extends ApiError {
  code: ApiErrorCode.VALIDATION_ERROR;
  field_errors: Record<string, string[]>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Base API response structure
 */
export interface BaseApiResponse {
  success: boolean;
  message?: string;
  timestamp: string;
  request_id?: string;
}

/**
 * Successful API response with data
 */
export interface SuccessResponse<T = any> extends BaseApiResponse {
  success: true;
  data: T;
}

/**
 * Error API response
 */
export interface ErrorResponse extends BaseApiResponse {
  success: false;
  error: ApiError;
}

/**
 * Generic API response union type
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> extends BaseApiResponse {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ============================================================================
// SPECIFIC API RESPONSE TYPES
// ============================================================================

/**
 * Authentication response
 */
export interface AuthResponse extends SuccessResponse<{
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {}

/**
 * Portfolio responses
 */
export type PortfolioResponse = SuccessResponse<Portfolio>;
export type PortfoliosResponse = PaginatedApiResponse<Portfolio>;
export type PortfolioSummaryResponse = SuccessResponse<PortfolioSummary>;
export type PortfolioSummariesResponse = PaginatedApiResponse<PortfolioSummary>;

/**
 * Position responses
 */
export type PositionResponse = SuccessResponse<Position>;
export type PositionsResponse = PaginatedApiResponse<Position>;
export type PositionWithMetricsResponse = SuccessResponse<PositionWithMetrics>;
export type PositionsWithMetricsResponse = PaginatedApiResponse<PositionWithMetrics>;

/**
 * Transaction responses
 */
export type TransactionResponse = SuccessResponse<Transaction>;
export type TransactionsResponse = PaginatedApiResponse<Transaction>;

/**
 * Dashboard response
 */
export type DashboardResponse = SuccessResponse<DashboardAnalytics>;

/**
 * User profile response
 */
export type UserProfileResponse = SuccessResponse<User>;

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Base request options
 */
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/**
 * Query parameters for list endpoints
 */
export interface ListQueryParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  asset_type?: AssetType;
  start_date?: string;
  end_date?: string;
}

/**
 * Portfolio query parameters
 */
export interface PortfolioQueryParams extends ListQueryParams {
  include_positions?: boolean;
  include_metrics?: boolean;
}

/**
 * Position query parameters
 */
export interface PositionQueryParams extends ListQueryParams {
  portfolio_id?: string;
  symbol?: string;
  include_transactions?: boolean;
  include_metrics?: boolean;
}

/**
 * Transaction query parameters
 */
export interface TransactionQueryParams extends ListQueryParams {
  position_id?: string;
  portfolio_id?: string;
  transaction_type?: 'BUY' | 'SELL';
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Webhook event types
 */
export enum WebhookEventType {
  PORTFOLIO_CREATED = 'portfolio.created',
  PORTFOLIO_UPDATED = 'portfolio.updated',
  PORTFOLIO_DELETED = 'portfolio.deleted',
  POSITION_CREATED = 'position.created',
  POSITION_UPDATED = 'position.updated',
  POSITION_DELETED = 'position.deleted',
  TRANSACTION_CREATED = 'transaction.created'
}

/**
 * Webhook payload structure
 */
export interface WebhookPayload<T = any> {
  event: WebhookEventType;
  data: T;
  user_id: string;
  timestamp: string;
  webhook_id: string;
}

// ============================================================================
// BATCH OPERATION TYPES
// ============================================================================

/**
 * Batch operation request
 */
export interface BatchRequest<T> {
  operations: T[];
  transaction?: boolean;
  continue_on_error?: boolean;
}

/**
 * Batch operation result
 */
export interface BatchResult<T> {
  success_count: number;
  error_count: number;
  results: Array<{
    success: boolean;
    data?: T;
    error?: ApiError;
    index: number;
  }>;
}

/**
 * Batch response
 */
export type BatchResponse<T> = SuccessResponse<BatchResult<T>>;

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Export format options
 */
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx'
}

/**
 * Export request parameters
 */
export interface ExportRequest {
  format: ExportFormat;
  portfolio_ids?: string[];
  start_date?: string;
  end_date?: string;
  include_transactions?: boolean;
  include_metrics?: boolean;
}

/**
 * Export response
 */
export interface ExportResponse extends SuccessResponse<{
  download_url: string;
  expires_at: string;
  file_size: number;
  record_count: number;
}> {}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return response.success === false;
}

/**
 * Type guard to check if error is a validation error
 */
export function isValidationError(error: ApiError): error is ValidationError {
  return error.code === ApiErrorCode.VALIDATION_ERROR;
}

/**
 * Type guard to check if response is paginated
 */
export function isPaginatedResponse<T>(response: any): response is PaginatedApiResponse<T> {
  return response.success === true && 'pagination' in response;
}
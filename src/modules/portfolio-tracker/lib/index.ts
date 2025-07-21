// Portfolio tracker utilities index

// Export core types and interfaces
export {
  AssetType,
  TransactionType,
  AssetTypeLabels,
  type User,
  type Portfolio,
  type Position,
  type Transaction,
  type PortfolioSummary,
  type PositionWithMetrics,
  type DashboardAnalytics,
  type AssetAllocation,
  type QueryParams,
  type LoginFormData,
  type PortfolioFormData,
  type PositionFormData,
  type TransactionFormData,
  type AuthState,
  type LoadingState,
  type FormState
} from './types';

// Export input types from types.ts (avoiding conflicts with schemas)
export type {
  CreatePortfolioInput,
  UpdatePortfolioInput,
  CreatePositionInput,
  UpdatePositionInput,
  CreateTransactionInput
} from './types';

// Export validation schemas (with different names to avoid conflicts)
export {
  AssetTypeSchema,
  TransactionTypeSchema,
  UserSchema,
  PortfolioSchema,
  PositionSchema,
  TransactionSchema,
  CreatePortfolioSchema,
  UpdatePortfolioSchema,
  CreatePositionSchema,
  UpdatePositionSchema,
  CreateTransactionSchema,
  LoginFormSchema,
  PortfolioFormSchema,
  PositionFormSchema,
  TransactionFormSchema,
  QueryParamsSchema,
  ApiResponseSchema,
  PaginatedResponseSchema,
  isValidUUID,
  isValidAmount,
  isValidQuantity,
  isValidSymbol
} from './schemas';

// Export schema-inferred types with different names
export type {
  UserInput,
  PortfolioInput,
  PositionInput,
  TransactionInput,
  LoginFormInput,
  PortfolioFormInput,
  PositionFormInput,
  TransactionFormInput,
  QueryParamsInput
} from './schemas';

// Export API-specific types
export {
  HttpStatusCode,
  ApiErrorCode,
  ExportFormat,
  WebhookEventType,
  isSuccessResponse,
  isErrorResponse,
  isValidationError,
  isPaginatedResponse
} from './api-types';

// Export API types (avoiding conflicts with types.ts)
export type {
  ApiError as ApiErrorType,
  ValidationError,
  BaseApiResponse,
  SuccessResponse,
  ErrorResponse,
  ApiResponse as ApiResponseType,
  PaginatedApiResponse,
  AuthResponse,
  PortfolioResponse,
  PortfoliosResponse,
  PortfolioSummaryResponse,
  PortfolioSummariesResponse,
  PositionResponse,
  PositionsResponse,
  PositionWithMetricsResponse,
  PositionsWithMetricsResponse,
  TransactionResponse,
  TransactionsResponse,
  DashboardResponse,
  UserProfileResponse,
  RequestOptions,
  ListQueryParams,
  PortfolioQueryParams,
  PositionQueryParams,
  TransactionQueryParams,
  WebhookPayload,
  BatchRequest,
  BatchResult,
  BatchResponse,
  ExportRequest,
  ExportResponse
} from './api-types';

// Export cost basis calculator functions
export {
  calculateNewAverageCost,
  calculateCostBasisAfterSale,
  calculateCostBasisFromTransactions,
  calculatePositionMetrics,
  validatePositionUpdate,
  calculatePositionUpdateImpact
} from './cost-basis-calculator';

// Export position service functions
export {
  fetchPositionsByPortfolio,
  fetchPositionsWithMetrics,
  fetchPositionById,
  createPosition,
  updatePosition,
  deletePosition,
  fetchTransactionsByPosition,
  fetchRecentTransactions,
  isSymbolExistsInPortfolio,
  getPositionCount
} from './position-service';

// Export cache management utilities
export {
  CacheInvalidationManager,
  OptimisticUpdateManager,
  CachePersistenceManager,
  RealTimeUpdateManager,
  CacheManager
} from './cache-utils';

// Export data synchronization utilities
export {
  RealTimeSubscriptionManager,
  OfflineSyncManager,
  BackgroundSyncManager,
  DataSyncManager
} from './data-sync';
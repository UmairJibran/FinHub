# Design Document

## Overview

The Portfolio Tracker is a Vite-powered React application built with TypeScript, utilizing Supabase as the backend for authentication, database, and real-time features. The application follows a modular architecture with clear separation of concerns, leveraging React 18+ features and modern client-side routing. The design emphasizes user experience with responsive layouts, real-time updates, and comprehensive portfolio analytics.

## Architecture

### Technology Stack

- **Frontend**: Vite + React 18+, TypeScript, Tailwind CSS
- **Routing**: React Router v6 for client-side routing
- **Backend**: Supabase (PostgreSQL database, Authentication, Real-time subscriptions)
- **UI Components**: shadcn/ui components, Recharts for visualizations
- **Authentication**: Supabase Auth with Google OAuth and email/password
- **State Management**: React hooks with TanStack Query for server state management

### Application Structure

```
src/
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Callback.tsx
│   ├── Dashboard.tsx
│   ├── Portfolios.tsx
│   └── PortfolioDetail.tsx
├── components/
│   ├── auth/
│   ├── portfolio/
│   ├── dashboard/
│   ├── layout/
│   └── ui/ (shadcn/ui)
├── lib/
│   ├── supabase/
│   ├── auth/
│   └── utils.ts (existing)
├── hooks/
│   ├── useAuth.ts
│   ├── usePortfolios.ts
│   └── usePositions.ts
└── modules/
    └── portfolio-tracker/
        ├── components/
        ├── hooks/
        ├── lib/
        └── types/
```

## Components and Interfaces

### Authentication Components

- **LoginForm**: Handles email/password and Google OAuth login
- **AuthProvider**: Context provider for authentication state
- **ProtectedRoute**: HOC for route protection

### Portfolio Management Components

- **PortfolioList**: Displays all user portfolios with summary cards
- **PortfolioForm**: Create/edit portfolio accounts
- **PortfolioCard**: Individual portfolio summary display
- **AssetTypeSelector**: Dropdown for selecting asset types

### Position Management Components

- **PositionList**: Displays positions within a portfolio
- **PositionForm**: Add/edit individual positions
- **PositionCard**: Individual position display with metrics
- **CostBasisCalculator**: Handles average cost calculations

### Dashboard Components

- **DashboardOverview**: Main dashboard with key metrics
- **AllocationChart**: Pie/donut chart for asset allocation
- **PerformanceChart**: Line chart for portfolio performance over time
- **RecentTransactions**: List of recent position changes
- **PortfolioSummaryCards**: Grid of portfolio summary cards

### Core Interfaces

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  asset_type: AssetType;
  created_at: string;
  updated_at: string;
}

interface Position {
  id: string;
  portfolio_id: string;
  symbol: string;
  name: string;
  quantity: number;
  average_cost: number;
  total_invested: number;
  current_price?: number;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  position_id: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  date: string;
  created_at: string;
}

enum AssetType {
  STOCKS = 'stocks',
  CRYPTO = 'crypto',
  MUTUAL_FUNDS = 'mutual_funds',
  COMMODITIES = 'commodities',
  REAL_ESTATE = 'real_estate',
}
```

## Data Models

### Database Schema

#### Users Table (managed by Supabase Auth)

```sql
-- Extended user profile
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Portfolios Table

```sql
CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stocks', 'crypto', 'mutual_funds', 'commodities', 'real_estate')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Positions Table

```sql
CREATE TABLE positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
  average_cost DECIMAL(20, 8) NOT NULL CHECK (average_cost > 0),
  total_invested DECIMAL(20, 2) NOT NULL CHECK (total_invested > 0),
  current_price DECIMAL(20, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Transactions Table

```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
  price DECIMAL(20, 8) NOT NULL CHECK (price > 0),
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own portfolios" ON portfolios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own positions" ON positions FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM portfolios WHERE id = portfolio_id)
);
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (
  auth.uid() IN (
    SELECT p.user_id FROM portfolios p
    JOIN positions pos ON p.id = pos.portfolio_id
    WHERE pos.id = position_id
  )
);
```

## Error Handling

### Client-Side Error Handling

- **Form Validation**: Real-time validation with clear error messages
- **API Error Handling**: Centralized error handling with user-friendly messages
- **Network Errors**: Retry mechanisms and offline state handling
- **Authentication Errors**: Automatic redirect to login on auth failures

### Server-Side Error Handling

- **Database Constraints**: Proper constraint violations with meaningful messages
- **RLS Violations**: Secure error messages that don't leak data
- **Input Validation**: Server-side validation for all user inputs
- **Transaction Rollbacks**: Atomic operations for data consistency

### Error Boundaries

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class PortfolioErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  // Error boundary implementation for portfolio-specific errors
}
```

## Testing Strategy

### Unit Testing

- **Components**: React Testing Library for component behavior
- **Hooks**: Custom hooks testing with renderHook
- **Utilities**: Pure function testing for calculations
- **Validation**: Schema validation testing

### Integration Testing

- **API Routes**: Test API endpoints with mock database
- **Authentication Flow**: Test login/logout flows
- **Database Operations**: Test CRUD operations with test database
- **Cost Basis Calculations**: Test complex averaging calculations

### End-to-End Testing

- **User Journeys**: Complete user flows from login to portfolio management
- **Cross-browser Testing**: Ensure compatibility across browsers
- **Mobile Responsiveness**: Test on various device sizes
- **Performance Testing**: Load testing for dashboard with multiple portfolios

### Test Data Management

```typescript
// Test utilities for creating mock data
interface TestPortfolio {
  name: string;
  asset_type: AssetType;
  positions: TestPosition[];
}

interface TestPosition {
  symbol: string;
  quantity: number;
  price: number;
}
```

## Security Considerations

### Authentication Security

- **OAuth Implementation**: Secure Google OAuth flow with PKCE
- **Session Management**: Secure session handling with httpOnly cookies
- **Password Security**: Supabase handles password hashing and validation
- **Multi-factor Authentication**: Future enhancement for additional security

### Data Security

- **Row Level Security**: Comprehensive RLS policies for data isolation
- **Input Sanitization**: All user inputs sanitized and validated
- **SQL Injection Prevention**: Parameterized queries through Supabase client
- **XSS Prevention**: Proper output encoding and CSP headers

### API Security

- **Rate Limiting**: Implement rate limiting for API endpoints
- **CORS Configuration**: Proper CORS setup for production
- **API Key Management**: Secure handling of Supabase keys
- **Environment Variables**: Secure storage of sensitive configuration

## Performance Optimizations

### Frontend Performance

- **Code Splitting**: Route-based code splitting with React.lazy and Vite
- **Asset Optimization**: Vite's built-in asset optimization and tree-shaking
- **Caching**: TanStack Query for intelligent server state caching
- **Bundle Analysis**: Vite bundle analyzer for monitoring bundle size

### Database Performance

- **Indexing**: Proper indexes on frequently queried columns
- **Query Optimization**: Efficient queries with proper joins
- **Connection Pooling**: Supabase handles connection pooling
- **Real-time Subscriptions**: Efficient real-time updates for live data

### Caching Strategy

```typescript
// Client-side caching with TanStack Query
const usePortfolios = () => {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: fetchPortfolios,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
```

## Responsive Design

### Breakpoint Strategy

- **Mobile**: 320px - 768px (single column layout)
- **Tablet**: 768px - 1024px (two column layout)
- **Desktop**: 1024px+ (multi-column dashboard layout)

### Component Responsiveness

- **Navigation**: Collapsible sidebar on mobile, persistent on desktop
- **Charts**: Responsive charts that adapt to container size
- **Tables**: Horizontal scroll on mobile, full display on desktop
- **Forms**: Stack form fields on mobile, side-by-side on desktop

### Touch Interactions

- **Touch Targets**: Minimum 44px touch targets for mobile
- **Gestures**: Swipe gestures for navigation where appropriate
- **Haptic Feedback**: Subtle feedback for user actions on mobile devices

### Design ideology

- Single-column, vertical flow.
- Prominent input (Textarea with placeholder).
- Responses in soft Cards, no borders.
- Use ShadCN components (or custom if truly needed).
- No tooltips — use icon + label (e.g., 🔄 Regenerate).
- Defaults: dark mode, system font, responsive.
- Real-time feedback: spinner, typing dots, toasts.
- Collapsible, auto-labeled history.
- Tap-friendly, smooth (duration-200 ease-in-out).
- Clarity > cleverness.

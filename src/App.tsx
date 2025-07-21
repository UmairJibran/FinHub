import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Zustand auth store is initialized automatically when imported
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import RootLayout from './app/layout';
import './app/globals.css';

// Import components directly (disable lazy loading for now)
import HomePage from './app/page';
import CalculatorsPage from './app/calculators/page';
import SIPSWPPage from './app/calculators/sip-swp/page';
import ZakatCalculatorPage from './app/calculators/zakat/page';
import ShareAveragingPage from './app/calculators/share-averaging/page';
import Dashboard from './pages/Dashboard';
import Portfolios from './pages/Portfolios';
import PortfolioDetail from './pages/PortfolioDetail';
// import PortfolioTest from './pages/PortfolioTest';
import Login from './pages/auth/Login';
import Callback from './pages/auth/Callback';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      // Enable background refetching for better UX
      refetchInterval: false, // Disable automatic polling by default
      refetchIntervalInBackground: false,
      // Network mode for better offline handling
      networkMode: 'online',
      // Retry configuration with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          return false;
        }
        // Don't retry on 4xx errors except 429 (rate limit)
        if (error?.statusCode >= 400 && error?.statusCode < 500 && error?.statusCode !== 429) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Enable structural sharing for better performance
      structuralSharing: true,
      // Keep previous data during refetch for better UX
      placeholderData: (previousData: any) => previousData,
    },
    mutations: {
      // Network mode for mutations
      networkMode: 'online',
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          return false;
        }
        // Retry up to 2 times for server errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
          <Router>
            <RootLayout>
            <Routes>
              {/* Public routes - accessible without authentication */}
              <Route path="/" element={<HomePage />} />
              <Route path="/calculators" element={<CalculatorsPage />} />
              <Route path="/calculators/sip-swp" element={<SIPSWPPage />} />
              <Route
                path="/calculators/zakat"
                element={<ZakatCalculatorPage />}
              />
              <Route
                path="/calculators/share-averaging"
                element={<ShareAveragingPage />}
              />

              {/* Auth routes - redirect if already authenticated */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/auth/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route path="/auth/callback" element={<Callback />} />

              {/* Protected routes - require authentication */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portfolios"
                element={
                  <ProtectedRoute>
                    <Portfolios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portfolios/:portfolioId"
                element={
                  <ProtectedRoute>
                    <PortfolioDetail />
                  </ProtectedRoute>
                }
              />
            </Routes>
            </RootLayout>
          </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

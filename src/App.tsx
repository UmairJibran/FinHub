import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy, useEffect } from 'react';
// Zustand auth store is initialized automatically when imported
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import RootLayout from './app/layout';
import { simplePerformanceMonitor } from './lib/performance-simple';
import { usePageTracking } from './lib/analytics';
import { createOptimizedQueryClient } from './lib/query-optimization';
// import { PerformanceMonitor, WebVitalsDisplay } from './components/debug/PerformanceMonitor';
import './app/globals.css';

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Lazy load components for code splitting
// Public pages (loaded immediately for better UX)
import HomePage from './app/page';
import CalculatorsPage from './app/calculators/page';

// Calculator pages (lazy loaded as they're feature-specific)
const SIPSWPPage = lazy(() => import('./app/calculators/sip-swp/page'));
const ZakatCalculatorPage = lazy(() => import('./app/calculators/zakat/page'));
const ShareAveragingPage = lazy(() => import('./app/calculators/share-averaging/page'));

// Protected pages (lazy loaded as they require authentication)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Portfolios = lazy(() => import('./pages/Portfolios'));
const PortfolioDetail = lazy(() => import('./pages/PortfolioDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const AssetPrices = lazy(() => import('./pages/AssetPrices'));

// Auth pages (lazy loaded as they're used less frequently)
const Login = lazy(() => import('./pages/auth/Login'));
const SignUp = lazy(() => import('./pages/auth/SignUp'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Callback = lazy(() => import('./pages/auth/Callback'));

// Page tracking component
function PageTracker() {
  const location = useLocation();
  const { trackPage } = usePageTracking();

  useEffect(() => {
    // Track page views
    trackPage(location.pathname + location.search, document.title);
    
    // Performance mark for page navigation
    simplePerformanceMonitor.mark(`page_${location.pathname.replace(/\//g, '_')}_start`);
    
    return () => {
      simplePerformanceMonitor.mark(`page_${location.pathname.replace(/\//g, '_')}_end`);
      simplePerformanceMonitor.measure(
        `page_${location.pathname.replace(/\//g, '_')}_duration`,
        `page_${location.pathname.replace(/\//g, '_')}_start`,
        `page_${location.pathname.replace(/\//g, '_')}_end`
      );
    };
  }, [location, trackPage]);

  return null;
}

// Create optimized query client with performance monitoring
const queryClient = createOptimizedQueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
          <Router>
            <PageTracker />
            <RootLayout>
            <Routes>
              {/* Public routes - accessible without authentication */}
              <Route path="/" element={<HomePage />} />
              <Route path="/calculators" element={<CalculatorsPage />} />
              <Route 
                path="/calculators/sip-swp" 
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <SIPSWPPage />
                  </Suspense>
                } 
              />
              <Route
                path="/calculators/zakat"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <ZakatCalculatorPage />
                  </Suspense>
                }
              />
              <Route
                path="/calculators/share-averaging"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <ShareAveragingPage />
                  </Suspense>
                }
              />

              {/* Auth routes - redirect if already authenticated */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Login />
                    </Suspense>
                  </PublicRoute>
                }
              />
              <Route
                path="/auth/login"
                element={
                  <PublicRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Login />
                    </Suspense>
                  </PublicRoute>
                }
              />
              <Route
                path="/auth/signup"
                element={
                  <PublicRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <SignUp />
                    </Suspense>
                  </PublicRoute>
                }
              />
              <Route
                path="/auth/reset-password"
                element={
                  <PublicRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <ResetPassword />
                    </Suspense>
                  </PublicRoute>
                }
              />
              <Route 
                path="/auth/callback" 
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Callback />
                  </Suspense>
                } 
              />

              {/* Protected routes - require authentication */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Dashboard />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portfolios"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Portfolios />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portfolios/:portfolioId"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <PortfolioDetail />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Settings />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/asset-prices"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <AssetPrices />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
            </Routes>
            </RootLayout>
            
            {/* Development-only performance monitoring - disabled for now */}
            {/* {import.meta.env.DEV && (
              <>
                <PerformanceMonitor />
                <WebVitalsDisplay />
              </>
            )} */}
          </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

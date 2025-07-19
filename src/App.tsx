import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/auth/AuthContext';
import { SafeAuthProvider } from './lib/auth/SafeAuthProvider';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
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
import Login from './pages/auth/Login';
import Callback from './pages/auth/Callback';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return !!(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('your_supabase') &&
    !supabaseKey.includes('your_supabase') &&
    supabaseUrl.startsWith('https://')
  );
}

function App() {
  const AuthProviderComponent = isSupabaseConfigured()
    ? AuthProvider
    : SafeAuthProvider;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderComponent>
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
            </Routes>
          </RootLayout>
        </Router>
      </AuthProviderComponent>
    </QueryClientProvider>
  );
}

export default App;

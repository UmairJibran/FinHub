import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RootLayout from './app/layout';
import HomePage from './app/page';
import CalculatorsPage from './app/calculators/page';
import SIPSWPPage from './app/calculators/sip-swp/page';
import ZakatCalculatorPage from './app/calculators/zakat/page';
import ShareAveragingPage from './app/calculators/share-averaging/page';
import Dashboard from './pages/Dashboard';
import Portfolios from './pages/Portfolios';
import Login from './pages/auth/Login';
import Callback from './pages/auth/Callback';
import './app/globals.css';

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <RootLayout>
          <Routes>
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
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<Callback />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolios" element={<Portfolios />} />
          </Routes>
        </RootLayout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

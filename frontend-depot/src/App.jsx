import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DepotProvider } from './contexts/DepotContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; 
import MainLayout from './layouts/MainLayout';
import OfflineBanner from './components/OfflineBanner';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Routes Publiques */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Routes Privées (Protégées) */}
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <DepotProvider>
              <MainLayout />
            </DepotProvider>
          </PrivateRoute>
        }
      />

      {/* Redirection par défaut */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <OfflineBanner />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}





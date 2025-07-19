import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { PocketProvider, usePocket } from './contexts/PocketContext.jsx';
import { TrainingProvider } from './contexts/TrainingContext.jsx';
import { AnalyticsProvider } from './contexts/AnalyticsContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import QueryProvider from './providers/QueryProvider.jsx';
import { useOnlineStatus } from './hooks/index.js';
import useAppStore from './stores/useAppStore.js';

// Import components
import LoadingSpinner from './components/LoadingSpinner.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Lazy load views for code splitting
const LoginView = lazy(() => import('./views/LoginView.jsx'));
const RegisterView = lazy(() => import('./views/RegisterView.jsx'));
const DashboardView = lazy(() => import('./views/DashboardView.jsx'));
const TrainingView = lazy(() => import('./views/TrainingView.jsx'));
const ProfileView = lazy(() => import('./views/ProfileView.jsx'));
const OnboardingView = lazy(() => import('./views/OnboardingView.jsx'));
const TournamentsView = lazy(() => import('./views/TournamentsView.jsx'));
const CommunityView = lazy(() => import('./views/CommunityView.jsx'));

// Protected Route Component (must be inside AuthProvider)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = usePocket();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = usePocket();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// App Routes Component (inside AuthProvider)
const AppRoutes = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginView />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <RegisterView />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/training" 
            element={
              <ProtectedRoute>
                <TrainingView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfileView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <OnboardingView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tournaments" 
            element={
              <ProtectedRoute>
                <TournamentsView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/community" 
            element={
              <ProtectedRoute>
                <CommunityView />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

// Main App Content Component (inside AuthProvider)
const AppContent = () => {
  const { isOnline } = useOnlineStatus();
  const { isDarkMode } = useAppStore();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3B82F6',
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
        },
      }}
    >
      <div className="app">
        {!isOnline && <OfflineBanner />}
        <TrainingProvider>
          <AnalyticsProvider>
            <AppRoutes />
          </AnalyticsProvider>
        </TrainingProvider>
      </div>
    </ConfigProvider>
  );
};

// Root App Component with Providers
const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <PocketProvider>
            <AppContent />
          </PocketProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { PocketProvider, usePocket } from './contexts/PocketContext';
import { TrainingProvider } from './contexts/TrainingContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import QueryProvider from './providers/QueryProvider';
import { useOnlineStatus } from './hooks/index';
import useAppStore from './stores/useAppStore';
import { hybridAnalyticsService } from './services/hybrid-analytics.service.js';

// Import components
import LoadingSpinner from './components/LoadingSpinner';
import OfflineBanner from './components/OfflineBanner';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load views for code splitting
const LoginView = lazy(() => import('./views/LoginView'));
const RegisterView = lazy(() => import('./views/RegisterView'));
const DashboardView = lazy(() => import('./views/DashboardView'));
const TrainingView = lazy(() => import('./views/TrainingView'));
const ProfileView = lazy(() => import('./views/ProfileView'));
const OnboardingView = lazy(() => import('./views/OnboardingView'));
const TournamentsView = lazy(() => import('./views/TournamentsView'));
const CommunityView = lazy(() => import('./views/CommunityView'));
const RadixThemeDemo = lazy(() => import('./components/RadixThemeDemo'));

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

// Route Analytics Component
const RouteAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    hybridAnalyticsService.trackPageView({
      page_path: location.pathname,
      page_title: document.title,
      referrer: document.referrer
    });
  }, [location]);

  return null;
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
      <RouteAnalytics />
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
          <Route 
            path="/theme-demo" 
            element={
              <ProtectedRoute>
                <RadixThemeDemo />
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
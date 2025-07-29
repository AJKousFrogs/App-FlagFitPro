import React, { useState, Suspense, memo, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { MeasurementProvider } from './contexts/MeasurementContext';
import { AuthProvider } from './contexts/AuthContext';
import { NeonDatabaseProvider } from './contexts/NeonDatabaseContext';
import { useAuth } from './hooks/useAuth.js';
import { queryClient } from './lib/queryClient.js';
import { initializePerformanceMonitoring } from './utils/performance';
import { createLazyRoute, preloadManager } from './utils/codesplitting';
import { initializeConnectionPools } from './utils/connectionPool';
import { initializeScalability } from './utils/scalability';
import Breadcrumbs from './components/Breadcrumbs';
import LoadingSpinner from './components/LoadingSpinner';
import NewNavigation from './components/NewNavigation';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/components.css';

// Enterprise-grade lazy loading with advanced error handling and preloading
const DashboardPage = createLazyRoute(() => import('./pages/DashboardPage'), 'Dashboard');
const TrainingPage = createLazyRoute(() => import('./pages/TrainingPage'), 'Training');
const CommunityPage = createLazyRoute(() => import('./pages/CommunityPage'), 'Community');
const ProfilePage = createLazyRoute(() => import('./pages/ProfilePage'), 'Profile');
const TournamentsPage = createLazyRoute(() => import('./pages/TournamentsPage'), 'Tournaments');
const LoginPage = createLazyRoute(() => import('./pages/LoginPage'), 'Login');
const RegisterPage = createLazyRoute(() => import('./pages/RegisterPage'), 'Register');

// Header Component with React.memo for performance
const Header = memo(() => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return null; // Don't show header on auth pages
  }

  return <NewNavigation />;
});

Header.displayName = 'Header';

// Loading Fallback Component with React.memo
const PageLoading = memo(() => (
  <div className="page-loading">
    <LoadingSpinner size="large" message="Loading page..." />
  </div>
));

PageLoading.displayName = 'PageLoading';

// Protected Route component
const ProtectedRoute = memo(({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <PageLoading />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
});

ProtectedRoute.displayName = 'ProtectedRoute';

// App Content Component with React Query
const AppContent = memo(() => {
  const { isAuthenticated, isLoading, login, register } = useAuth();
  
  const handleLogin = useCallback(async (credentials) => {
    try {
      await login(credentials);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [login]);

  const handleRegister = useCallback(async (userData) => {
    try {
      await register(userData);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }, [register]);



  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app">
        <Header />
        
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onRegister={handleRegister} />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Breadcrumbs />
              <main>
                <Suspense fallback={<PageLoading />}>
                  <DashboardPage />
                </Suspense>
              </main>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Breadcrumbs />
              <main>
                <Suspense fallback={<PageLoading />}>
                  <DashboardPage />
                </Suspense>
              </main>
            </ProtectedRoute>
          } />
          <Route path="/training" element={
            <ProtectedRoute>
              <Breadcrumbs />
              <main>
                <Suspense fallback={<PageLoading />}>
                  <TrainingPage />
                </Suspense>
              </main>
            </ProtectedRoute>
          } />
          <Route path="/community" element={
            <ProtectedRoute>
              <Breadcrumbs />
              <main>
                <Suspense fallback={<PageLoading />}>
                  <CommunityPage />
                </Suspense>
              </main>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Breadcrumbs />
              <main>
                <Suspense fallback={<PageLoading />}>
                  <ProfilePage />
                </Suspense>
              </main>
            </ProtectedRoute>
          } />
          <Route path="/tournaments" element={
            <ProtectedRoute>
              <Breadcrumbs />
              <main>
                <Suspense fallback={<PageLoading />}>
                  <TournamentsPage />
                </Suspense>
              </main>
            </ProtectedRoute>
          } />
          
          {/* Catch all - redirect to login or dashboard based on auth status */}
          <Route path="*" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } />
        </Routes>
        
        {isLoading && (
          <div className="loading-overlay">
            <LoadingSpinner size="large" message="Processing..." />
          </div>
        )}
      </div>
    </Router>
  );
});

AppContent.displayName = 'AppContent';

// Main App Component with React Query Provider and Performance Monitoring
const App = () => {
  useEffect(() => {
    // Initialize enterprise-grade performance monitoring
    initializePerformanceMonitoring({
      enabled: true,
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
    });

    // Initialize connection pools for scalability
    initializeConnectionPools();

    // Initialize scalability infrastructure
    initializeScalability({
      servers: [
        { url: 'https://api.flagfootball.com', weight: 2 },
        { url: 'https://api2.flagfootball.com', weight: 1 }
      ],
      services: {
        'user-service': [
          { url: 'https://users.flagfootball.com' },
          { url: 'https://users2.flagfootball.com' }
        ],
        'training-service': [
          { url: 'https://training.flagfootball.com' }
        ]
      },
      autoScaling: {
        minInstances: 2,
        maxInstances: 20,
        targetCPU: 70,
        targetMemory: 80
      }
    });

    // Setup intelligent preloading based on user behavior
    const setupPreloading = () => {
      // Preload likely next pages based on current route
      const currentPath = window.location.pathname;
      
      if (currentPath === '/login' || currentPath === '/register') {
        // Preload dashboard after auth pages
        preloadManager.addToQueue(DashboardPage, 8);
      } else if (currentPath === '/dashboard') {
        // Preload frequently accessed pages from dashboard
        preloadManager.addToQueue(TrainingPage, 6);
        preloadManager.addToQueue(ProfilePage, 4);
      }
    };

    setupPreloading();

    // Preload on navigation hints
    const handleMouseOver = (e) => {
      const link = e.target.closest('a[href]');
      if (link) {
        const href = link.getAttribute('href');
        if (href === '/training') preloadManager.addToQueue(TrainingPage, 7);
        else if (href === '/community') preloadManager.addToQueue(CommunityPage, 7);
        else if (href === '/profile') preloadManager.addToQueue(ProfilePage, 7);
        else if (href === '/tournaments') preloadManager.addToQueue(TournamentsPage, 7);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NeonDatabaseProvider>
            <MeasurementProvider>
              <AppContent />
              {/* React Query DevTools - only in development */}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </MeasurementProvider>
          </NeonDatabaseProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default memo(App);
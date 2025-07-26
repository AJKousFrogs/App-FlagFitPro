import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { NeonDatabaseProvider, useNeonDatabase } from './contexts/NeonDatabaseContext';
import { TrainingProvider } from './contexts/TrainingContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import QueryProvider from './providers/QueryProvider';
import { useOnlineStatus } from './hooks/index';
import useAppStore from './stores/useAppStore';

// Import components
import LoadingSpinner from './components/LoadingSpinner';
import OfflineBanner from './components/OfflineBanner';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load views for code splitting with prefetching hints
const LoginView = lazy(() => 
  import(/* webpackChunkName: "auth" */ './views/LoginView')
);
const RegisterView = lazy(() => 
  import(/* webpackChunkName: "auth" */ './views/RegisterView')
);
const DashboardView = lazy(() => 
  import(/* webpackChunkName: "dashboard", webpackPrefetch: true */ './views/DashboardView')
);
const ComprehensiveDashboardView = lazy(() => 
  import(/* webpackChunkName: "comprehensive-dashboard", webpackPrefetch: true */ './views/ComprehensiveDashboardView')
);
const TrainingView = lazy(() => 
  import(/* webpackChunkName: "training", webpackPreload: true */ './views/TrainingView')
);
const ProfileView = lazy(() => 
  import(/* webpackChunkName: "profile" */ './views/ProfileView')
);
const OnboardingView = lazy(() => 
  import(/* webpackChunkName: "onboarding" */ './views/OnboardingView')
);
const TournamentsView = lazy(() => 
  import(/* webpackChunkName: "tournaments" */ './views/TournamentsView')
);
const CommunityView = lazy(() => 
  import(/* webpackChunkName: "community" */ './views/CommunityView')
);
const RadixThemeDemo = lazy(() => 
  import(/* webpackChunkName: "demo" */ './components/RadixThemeDemo')
);
const RadixTest = lazy(() => 
  import(/* webpackChunkName: "test" */ './components/RadixTest')
);

// Protected Route Component with better error handling
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isInitialized } = useNeonDatabase();
  
  // Show loading while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Render protected content
  return children;
};

// App Routes Component
const AppRoutes = () => {
  const location = useLocation();
  
  // Add error boundary around routes
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes location={location}>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={<LoginView />} 
          />
          <Route 
            path="/register" 
            element={<RegisterView />} 
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
            path="/comprehensive-dashboard" 
            element={
              <ProtectedRoute>
                <ComprehensiveDashboardView />
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
          <Route 
            path="/radix-test" 
            element={
              <ProtectedRoute>
                <RadixTest />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

// Main App Content Component (inside AuthProvider)
const AppContent = () => {
  const { isOnline } = useOnlineStatus();
  const { isDarkMode } = useAppStore();

  // Add error boundary around the main content
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

// Root App Component with Providers
const App = () => {
  // Add initialization check
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    // Ensure all required globals are available
    const checkGlobals = () => {
      const requiredGlobals = [
        'React',
        'ReactDOM',
        'window',
        'document',
        'localStorage'
      ];
      
      const allAvailable = requiredGlobals.every(global => {
        try {
          return typeof window[global] !== 'undefined' || typeof global !== 'undefined';
        } catch {
          return false;
        }
      });
      
      if (allAvailable) {
        setIsReady(true);
      } else {
        // Retry after a short delay
        setTimeout(checkGlobals, 100);
      }
    };

    checkGlobals();
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent-9 mx-auto mb-4"></div>
          <p className="text-lg">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <QueryProvider>
            <NeonDatabaseProvider>
              <AppContent />
            </NeonDatabaseProvider>
          </QueryProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
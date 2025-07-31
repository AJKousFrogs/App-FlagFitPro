import React, { useState, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MeasurementProvider } from './contexts/MeasurementContext';
import SecureAuthProvider, { useAuth } from './contexts/SecureAuthContext';
import { NeonDatabaseProvider } from './contexts/NeonDatabaseContext';
import { AppErrorBoundary, RouteErrorBoundary, ComponentErrorBoundary } from './components/ErrorBoundary';
import RadixNavigationMenu from './components/RadixNavigationMenu';
import Breadcrumbs from './components/Breadcrumbs';
import LoadingSpinner from './components/LoadingSpinner';
import AccessibilityFeatures from './components/AccessibilityFeatures';
import WeatherSystem from './components/WeatherSystem';
import serviceWorkerManager from './utils/serviceWorkerManager';
import './styles/components.css';
import './styles/radix-navigation.css';

// Lazy load page components for better performance
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const TrainingPage = React.lazy(() => import('./pages/TrainingPage'));
const CommunityPage = React.lazy(() => import('./pages/CommunityPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const TournamentsPage = React.lazy(() => import('./pages/TournamentsPage'));

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const WelcomeBackPage = React.lazy(() => import('./pages/WelcomeBackPage'));
const WelcomeBackDemo = React.lazy(() => import('./pages/WelcomeBackDemo'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage'));

// Training sub-pages
const RouteRunningPage = React.lazy(() => import('./pages/training/RouteRunningPage'));
const PlyometricsPage = React.lazy(() => import('./pages/training/PlyometricsPage'));
const SpeedTrainingPage = React.lazy(() => import('./pages/training/SpeedTrainingPage'));
const CatchingDrillsPage = React.lazy(() => import('./pages/training/CatchingDrillsPage'));
const StrengthTrainingPage = React.lazy(() => import('./pages/training/StrengthTrainingPage'));
const RecoveryPage = React.lazy(() => import('./pages/training/RecoveryPage'));

// Community sub-pages
const TeamChatPage = React.lazy(() => import('./pages/community/TeamChatPage'));
const DiscussionForumsPage = React.lazy(() => import('./pages/community/DiscussionForumsPage'));
const TeamEventsPage = React.lazy(() => import('./pages/community/TeamEventsPage'));
const LeaderboardsPage = React.lazy(() => import('./pages/community/LeaderboardsPage'));

// Tournaments sub-pages
const UpcomingTournamentsPage = React.lazy(() => import('./pages/tournaments/UpcomingTournamentsPage'));
const ActiveTournamentsPage = React.lazy(() => import('./pages/tournaments/ActiveTournamentsPage'));
const PastResultsPage = React.lazy(() => import('./pages/tournaments/PastResultsPage'));
const StandingsPage = React.lazy(() => import('./pages/tournaments/StandingsPage'));

// Profile sub-pages
const PersonalInfoPage = React.lazy(() => import('./pages/profile/PersonalInfoPage'));
const PerformanceStatsPage = React.lazy(() => import('./pages/profile/PerformanceStatsPage'));
const AchievementsPage = React.lazy(() => import('./pages/profile/AchievementsPage'));
const SettingsPage = React.lazy(() => import('./pages/profile/SettingsPage'));

// Loading Fallback Component
const PageLoading = () => (
  <div className="page-loading">
    <LoadingSpinner size="large" message="Loading page..." />
  </div>
);

// App Content Component (uses useAuth hook)
const AppContent = () => {
  const [isPremium, setIsPremium] = useState(false);
  const { isAuthenticated, isLoading, login, register, logout } = useAuth();

  // Initialize service worker
  useEffect(() => {
    const initServiceWorker = async () => {
      try {
        await serviceWorkerManager.register();
      } catch (error) {
        console.error('Failed to initialize Service Worker:', error);
      }
    };

    initServiceWorker();
  }, []);

  const handleLogin = async (userData) => {
    try {
      await login(userData);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleRegister = async (userData) => {
    try {
      await register(userData);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleTogglePremium = () => {
    setIsPremium(!isPremium);
  };

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <LoginPage onLogin={handleLogin} />;
    }
    return children;
  };

  return (
    <div className="app">
      {/* New Radix Navigation Component - Only show when authenticated */}
      {isAuthenticated && (
        <ComponentErrorBoundary>
          <RadixNavigationMenu />
        </ComponentErrorBoundary>
      )}
      
      {!isAuthenticated ? (
        <RouteErrorBoundary>
          <Routes>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/welcome-back" element={<WelcomeBackPage onLogin={handleLogin} />} />
            <Route path="/welcome-demo" element={<WelcomeBackDemo />} />
            <Route path="/register" element={<RegisterPage onRegister={handleRegister} />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="*" element={<WelcomeBackPage onLogin={handleLogin} />} />
          </Routes>
        </RouteErrorBoundary>
      ) : (
        <>
          <ComponentErrorBoundary>
            <Breadcrumbs />
          </ComponentErrorBoundary>
          <main>
            <RouteErrorBoundary>
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  {/* Main Routes */}
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/training" element={<TrainingPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/tournaments" element={<TournamentsPage />} />

                        
                  {/* Dashboard Sub-routes */}
                  <Route path="/dashboard/analytics" element={<DashboardPage />} />
                  <Route path="/dashboard/progress" element={<DashboardPage />} />
                  <Route path="/dashboard/goals" element={<DashboardPage />} />
                  
                  {/* Training Sub-routes */}
                  <Route path="/training/routes" element={<RouteRunningPage />} />
                  <Route path="/training/plyometrics" element={<PlyometricsPage />} />
                  <Route path="/training/speed" element={<SpeedTrainingPage />} />
                  <Route path="/training/catching" element={<CatchingDrillsPage />} />
                  <Route path="/training/strength" element={<StrengthTrainingPage />} />
                  <Route path="/training/recovery" element={<RecoveryPage />} />
                  
                  {/* Community Sub-routes */}
                  <Route path="/community/chat" element={<TeamChatPage />} />
                  <Route path="/community/forums" element={<DiscussionForumsPage />} />
                  <Route path="/community/events" element={<TeamEventsPage />} />
                  <Route path="/community/leaderboards" element={<LeaderboardsPage />} />
                  
                  {/* Tournaments Sub-routes */}
                  <Route path="/tournaments/upcoming" element={<UpcomingTournamentsPage />} />
                  <Route path="/tournaments/active" element={<ActiveTournamentsPage />} />
                  <Route path="/tournaments/past" element={<PastResultsPage />} />
                  <Route path="/tournaments/standings" element={<StandingsPage />} />
                  
                  {/* Profile Sub-routes */}
                  <Route path="/profile/info" element={<PersonalInfoPage />} />
                  <Route path="/profile/stats" element={<PerformanceStatsPage />} />
                  <Route path="/profile/achievements" element={<AchievementsPage />} />
                  <Route path="/profile/settings" element={<SettingsPage />} />
                  

                  
                  {/* Fallback Route */}
                  <Route path="*" element={<DashboardPage />} />
                </Routes>
              </Suspense>
            </RouteErrorBoundary>
          </main>
        </>
      )}
      
      {isLoading && (
        <div className="loading-overlay">
          <LoadingSpinner size="large" message="Processing..." />
        </div>
      )}
    </div>
  );
};

// Main App Component (wraps with providers and error boundary)
const App = () => {
  return (
    <AppErrorBoundary>
      <SecureAuthProvider>
        <NeonDatabaseProvider>
          <MeasurementProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AppContent />
            </Router>
          </MeasurementProvider>
        </NeonDatabaseProvider>
      </SecureAuthProvider>
    </AppErrorBoundary>
  );
};

export default App;
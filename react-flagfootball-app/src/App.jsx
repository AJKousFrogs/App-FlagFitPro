import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { MeasurementProvider } from './contexts/MeasurementContext';
import Breadcrumbs from './components/Breadcrumbs';
import LoadingSpinner from './components/LoadingSpinner';
import NotificationSystem from './components/NotificationSystem';
import SearchSystem from './components/SearchSystem';
import AvatarMenu from './components/AvatarMenu';
import OfflineSync from './components/OfflineSync';
import AccessibilityFeatures from './components/AccessibilityFeatures';
import WeatherSystem from './components/WeatherSystem';
import './styles/components.css';

// Lazy load page components for better performance
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const TrainingPage = React.lazy(() => import('./pages/TrainingPage'));
const CommunityPage = React.lazy(() => import('./pages/CommunityPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const TournamentsPage = React.lazy(() => import('./pages/TournamentsPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));

// Header Component
const Header = ({ onLogout, isPremium, onTogglePremium }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return null; // Don't show header on auth pages
  }

  return (
    <header>
      <h1>🏈 FlagFit Pro</h1>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/training">Training</Link>
        <Link to="/community">Community</Link>
        <Link to="/tournaments">Tournaments</Link>
        <Link to="/profile">Profile</Link>
      </nav>
      <div className="header-controls">
        <SearchSystem />
        <NotificationSystem />
        <AvatarMenu />
        <OfflineSync />
        <WeatherSystem />
        <button 
          onClick={onTogglePremium}
          style={{
            border: '1px solid #333',
            background: isPremium ? '#4CAF50' : '#fff',
            color: isPremium ? '#fff' : '#333',
            padding: '4px 8px',
            fontSize: '12px',
            marginRight: '10px'
          }}
        >
          {isPremium ? '⭐ Premium' : '💰 Free'}
        </button>
        <button onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
};

// Loading Fallback Component
const PageLoading = () => (
  <div className="page-loading">
    <LoadingSpinner size="large" message="Loading page..." />
  </div>
);

// Main App Component
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (userData) => {
    setIsLoading(true);
    // Simulate login process
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsLoading(false);
    }, 1000);
  };

  const handleRegister = (userData) => {
    setIsLoading(true);
    // Simulate registration process
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
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
    <MeasurementProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app">
          <Header 
            onLogout={handleLogout}
            isPremium={isPremium}
            onTogglePremium={handleTogglePremium}
          />
          
          {!isAuthenticated ? (
            <Routes>
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route path="/register" element={<RegisterPage onRegister={handleRegister} />} />
              <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
            </Routes>
          ) : (
            <>
              <Breadcrumbs />
              <main>
                <Suspense fallback={<PageLoading />}>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/training" element={<TrainingPage />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/tournaments" element={<TournamentsPage />} />
                    <Route path="*" element={<DashboardPage />} />
                  </Routes>
                </Suspense>
              </main>
            </>
          )}
          
          {isLoading && (
            <div className="loading-overlay">
              <LoadingSpinner size="large" message="Processing..." />
            </div>
          )}
        </div>
      </Router>
    </MeasurementProvider>
  );
};

export default App;
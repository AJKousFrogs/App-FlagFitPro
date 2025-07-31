import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useNeonDatabase } from '../contexts/NeonDatabaseContext';
import { Avatar, AvatarImage, AvatarFallback } from './ui/Avatar';

import ThemeToggle from './ThemeToggle';
import BackupManager from './BackupManager';
import NotificationCenter from './NotificationCenter';
import BackupErrorBoundary from './BackupErrorBoundary';
import PreFlightChecklistView from './PreFlightChecklistView';
import NotificationService from '../services/NotificationService';

const Navigation = () => {
  const { user, logout } = useNeonDatabase();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [teamData] = useState({
    name: 'Hawks',
    nextGame: 'vs Eagles Tomorrow',
    chemistry: 7.8,
    unreadMessages: 3
  });
  const [onboardingStatus] = useState({
    completed: false,
    currentStep: 2,
    totalSteps: 5
  });

  
  // Backup and Notification state
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showPreFlightChecklist, setShowPreFlightChecklist] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const moreMenuRef = useRef(null);

  // Initialize notifications and backup status
  useEffect(() => {
    if (user?.id) {
      // Subscribe to notifications
      const unsubscribe = NotificationService.subscribe(
        user.id,
        (notification) => {
          if (!notification.read) {
            setUnreadNotifications(prev => prev + 1);
          }
        }
      );

      // Initialize notification count (mock data)
      setUnreadNotifications(3);

      // Initialize backup status (mock data)
      // setBackupStatus({
      //   lastBackup: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      //   hasIssues: false,
      //   inProgress: false
      // });

      return unsubscribe;
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotificationCenter(true);
  };

  const handleNotificationClose = () => {
    setShowNotificationCenter(false);
  };

  const handleBackupClick = () => {
    setShowBackupManager(true);
  };

  const handleBackupClose = () => {
    setShowBackupManager(false);
  };



  const getNavigationItems = () => {
    const primaryItems = [
      {
        path: '/dashboard',
        name: 'Dashboard',
        category: 'primary'
      },
      {
        path: '/performance',
        name: 'Stats',
        category: 'primary'
      },
      {
        path: '/training',
        name: 'Practice',
        category: 'primary'
      },
      {
        path: '/community',
        name: 'Community',
        category: 'primary',
        badge: teamData.unreadMessages
      },
      {
        path: '/tournaments',
        name: 'Tournaments',
        category: 'primary'
      }
    ];

    const secondaryItems = [
      {
        path: '/profile',
        name: 'Profile',
        category: 'secondary'
      },
      {
        path: '/progress',
        name: 'Progress',
        category: 'secondary'
      },
      {
        path: '/streak',
        name: 'Streak',
        category: 'secondary'
      },
      {
        path: '/level',
        name: 'Level',
        category: 'secondary'
      }
    ];

    return { primaryItems, secondaryItems };
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Implement search functionality
  };

  const { primaryItems, secondaryItems } = getNavigationItems();
  const showRegistrationLink = !user;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        {/* Setup Progress Banner - Only show if not completed */}
        {!onboardingStatus.completed && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  Complete your setup: Step {onboardingStatus.currentStep} of {onboardingStatus.totalSteps}
                </span>
                <div className="flex-1 max-w-xs">
                  <div className="w-full bg-blue-400 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(onboardingStatus.currentStep / onboardingStatus.totalSteps) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <Link
                to="/onboarding"
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                Continue Setup
              </Link>
            </div>
          </div>
        )}

        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left Section - Logo & Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                Merlins Playbook
              </span>
            </Link>
          </div>

          {/* Center Section - Primary Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {primaryItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative text-sm font-medium px-3 py-2 transition-all duration-200 ${
                  isActive(item.path)
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-b hover:border-blue-600/40 dark:hover:border-blue-400/40'
                }`}
              >
                {item.name}
                {item.badge && item.badge > 0 && (
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    ({item.badge})
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Section - Secondary Links & Utilities */}
          <div className="flex items-center space-x-4">
            {/* Secondary Links - Desktop */}
            <div className="hidden xl:flex items-center space-x-4">
              {secondaryItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium px-3 py-2 transition-all duration-200 ${
                    isActive(item.path)
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-b hover:border-blue-600/40 dark:hover:border-blue-400/40'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* More Menu - Tablet */}
            <div className="hidden lg:hidden xl:block relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="text-sm font-medium px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
              >
                More ▾
              </button>
              
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-700">
                  {secondaryItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowMoreMenu(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Utilities */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              {user && (
                <div className="relative" ref={searchRef}>
                  <button
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="text-sm font-medium px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                  >
                    Search
                  </button>
                  
                  {searchOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-3 z-50 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 pb-3">
                        <input
                          type="text"
                          placeholder="Search players, drills, stats..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <div className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                          Quick Links
                        </div>
                        <Link to="/training" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setSearchOpen(false)}>
                          Practice Sessions
                        </Link>
                        <Link to="/community/team" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setSearchOpen(false)}>
                          Team Chat
                        </Link>
                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setSearchOpen(false)}>
                          My Stats
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications */}
              {user && (
                <button
                  onClick={handleNotificationClick}
                  className="relative text-sm font-medium px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                  title="Notifications"
                >
                  Alerts
                  {unreadNotifications > 0 && (
                    <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </button>
              )}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu */}
              {user && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.firstName} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user?.firstName || 'User'}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                        <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{user?.email}</div>
                        {user?.position && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                            {user.role === 'coach' ? 'Coach' : user.position}
                          </div>
                        )}
                      </div>
                      
                      {!onboardingStatus.completed && (
                        <Link
                          to="/onboarding"
                          className="block px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Complete Setup ({onboardingStatus.currentStep}/{onboardingStatus.totalSteps})
                        </Link>
                      )}
                      
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      
                      <button
                        onClick={() => {
                          handleNotificationClick();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Notifications
                        {unreadNotifications > 0 && (
                          <span className="ml-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                            {unreadNotifications}
                          </span>
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          handleBackupClick();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Backup & Recovery
                      </button>
                      
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        App Settings
                      </Link>
                      
                      {/* Developer/Admin Tools */}
                      {(user?.role === 'coach' || process.env.NODE_ENV === 'development') && (
                        <button
                          onClick={() => {
                            setShowPreFlightChecklist(true);
                            setIsMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-600"
                        >
                          System Health Check
                        </button>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Registration Link for unauthenticated users */}
              {showRegistrationLink && (
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                <span className="text-sm font-medium">Menu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {primaryItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{item.name}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({item.badge})
                    </span>
                  )}
                </Link>
              ))}
              
              {secondaryItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {/* Mobile Registration Link */}
              {showRegistrationLink && (
                <Link
                  to="/register"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-base font-medium transition-colors text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Components */}
      {showNotificationCenter && (
        <NotificationCenter
          currentUser={user}
          isOpen={showNotificationCenter}
          onClose={handleNotificationClose}
        />
      )}

      {showBackupManager && (
        <BackupErrorBoundary currentUser={user}>
          <BackupManager
            currentUser={user}
            onClose={handleBackupClose}
          />
        </BackupErrorBoundary>
      )}

      {showPreFlightChecklist && (
        <PreFlightChecklistView
          onClose={() => setShowPreFlightChecklist(false)}
          onProceed={() => {
            setShowPreFlightChecklist(false);
            alert('🚀 Database integration can proceed safely!');
          }}
        />
      )}
    </nav>
  );
};

export default Navigation; 
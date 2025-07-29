import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useNeonDatabase } from '../contexts/NeonDatabaseContext';
import { Avatar, AvatarImage, AvatarFallback } from './ui/Avatar';
import { 
  HomeIcon, 
  UserGroupIcon, 
  TrophyIcon, 
  BellIcon, 
  MagnifyingGlassIcon,
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

import ThemeToggle from './ThemeToggle';
import BackupManager from './BackupManager';
import NotificationCenter from './NotificationCenter';
import BackupErrorBoundary from './BackupErrorBoundary';
import PreFlightChecklistView from './PreFlightChecklistView';
import NotificationService from '../services/NotificationService';

const NewNavigation = () => {
  const { user, logout } = useNeonDatabase();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showActivityMenu, setShowActivityMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncStatus, setSyncStatus] = useState({ synced: true, lastSync: new Date() });
  
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
  const profileMenuRef = useRef(null);
  const activityMenuRef = useRef(null);

  // Initialize notifications and sync status
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

      return unsubscribe;
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (activityMenuRef.current && !activityMenuRef.current.contains(event.target)) {
        setShowActivityMenu(false);
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

  // Navigation items - grouped by content destinations and utilities
  const contentDestinations = [
    { path: '/dashboard', name: 'Dashboard', icon: HomeIcon },
    { path: '/training', name: 'Training', icon: UserIcon },
    { path: '/community', name: 'Community', icon: UserGroupIcon },
    { path: '/tournaments', name: 'Tournaments', icon: TrophyIcon }
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Implement search functionality
    console.log('Searching for:', query);
  };

  const showRegistrationLink = !user;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50" role="navigation">
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
          {/* Left Section - Brand & Content Destinations */}
          <div className="flex items-center space-x-8">
            {/* Brand & Primary Shortcut */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <HomeIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                FlagFit Pro
              </span>
            </Link>

            {/* Content Destinations - Desktop */}
            <div className="hidden lg:flex items-center space-x-6">
              {contentDestinations.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 text-sm font-medium px-3 py-2 transition-all duration-200 ${
                    isActive(item.path)
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-b hover:border-blue-600/40 dark:hover:border-blue-400/40'
                  }`}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.path === '/community' && teamData.unreadMessages > 0 && (
                    <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {teamData.unreadMessages}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section - Utilities */}
          <div className="flex items-center space-x-4">
            {/* Global Search - Desktop */}
            {user && (
              <div className="hidden md:flex items-center relative" ref={searchRef}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-48 px-3 py-1.5 pl-8 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            )}

            {/* Activity Menu (Notifications + Sync Status) */}
            {user && (
              <div className="relative" ref={activityMenuRef}>
                <button
                  onClick={() => setShowActivityMenu(!showActivityMenu)}
                  className="flex items-center space-x-1 text-sm font-medium px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                  title="Activity & Notifications"
                >
                  <BellIcon className="h-6 w-6" />
                  <span className="hidden lg:block">Activity</span>
                  {unreadNotifications > 0 && (
                    <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                  {syncStatus.synced && (
                    <span className="text-green-500 text-sm">✓</span>
                  )}
                </button>

                {showActivityMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-3 z-50 border border-gray-200 dark:border-gray-700">
                    {/* Sync Status */}
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Sync Status</span>
                        <span className="text-green-500 text-sm">✓ Synced</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Last sync: {syncStatus.lastSync.toLocaleTimeString()}
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="px-4 py-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Recent Notifications
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          Team practice scheduled for tomorrow
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          New training drill available
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          Tournament registration opens soon
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          handleNotificationClick();
                          setShowActivityMenu(false);
                        }}
                        className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Menu */}
            {user && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
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
                  <span className="text-gray-400">▼</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-700">
                    {/* User Info */}
                    <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                      <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{user?.email}</div>
                      {user?.position && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                          {user.role === 'coach' ? 'Coach' : user.position}
                        </div>
                      )}
                    </div>
                    
                    {/* Profile Actions */}
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      My Profile
                    </Link>

                    {/* Tools Submenu */}
                    <div className="relative group">
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Sync Tools ›
                      </button>
                      <div className="absolute left-full top-0 ml-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          Check Status
                        </button>
                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          Force Sync
                        </button>
                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          Clear Offline Data
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleBackupClick();
                        setShowProfileMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Backup & Recovery
                    </button>
                    
                    {/* Developer/Admin Tools */}
                    {(user?.role === 'coach' || process.env.NODE_ENV === 'development') && (
                      <button
                        onClick={() => {
                          setShowPreFlightChecklist(true);
                          setShowProfileMenu(false);
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
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {contentDestinations.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                >
                  <item.icon className="h-6 w-6" />
                  <span>{item.name}</span>
                  {item.path === '/community' && teamData.unreadMessages > 0 && (
                    <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {teamData.unreadMessages}
                    </span>
                  )}
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

export default NewNavigation; 
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useNeonDatabase } from '../contexts/NeonDatabaseContext';
import { Avatar, AvatarImage, AvatarFallback } from './ui/Avatar';
import BackupManager from './BackupManager';
import NotificationCenter from './NotificationCenter';
import BackupErrorBoundary from './BackupErrorBoundary';
import PreFlightChecklistView from './PreFlightChecklistView';
import NotificationService from '../services/NotificationService';
import ThemeToggle from './ThemeToggle';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './ui/NavigationMenu';
import { cn } from '../utils/cn';

const NewNavigation = () => {
  const { user, logout } = useNeonDatabase();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const showRegistrationLink = !user;

  const ListItem = React.forwardRef(({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  });
  ListItem.displayName = "ListItem";

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto">
        {/* Setup Progress Banner - Only show if not completed */}
        {!onboardingStatus.completed && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
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
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Continue Setup
              </Link>
            </div>
          </div>
        )}

        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between h-16 px-6">
          {/* Left Section - Logo & Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                Merlins Playbook
              </span>
            </Link>
          </div>

          {/* Center Section - Main Navigation */}
          <div className="hidden lg:block">
            <NavigationMenu>
              <NavigationMenuList className="space-x-8">
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link 
                      to="/dashboard"
                      className={cn(
                        navigationMenuTriggerStyle,
                        "h-12 px-6 py-3 text-base font-medium transition-all duration-200",
                        isActive('/dashboard')
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      Dashboard
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link 
                      to="/training"
                      className={cn(
                        navigationMenuTriggerStyle,
                        "h-12 px-6 py-3 text-base font-medium transition-all duration-200",
                        isActive('/training')
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      Practice
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "h-12 px-6 py-3 text-base font-medium transition-all duration-200",
                      isActive('/community')
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    Community
                    {teamData.unreadMessages > 0 && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        ({teamData.unreadMessages})
                      </span>
                    )}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 w-[400px] md:w-[500px] lg:w-[600px]">
                      <ListItem href="/community/team" title="Team Chat">
                        Connect with your teammates and coaches
                      </ListItem>
                      <ListItem href="/community/forums" title="Discussion Forums">
                        Share strategies and get advice from the community
                      </ListItem>
                      <ListItem href="/community/events" title="Team Events">
                        View upcoming team events and activities
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "h-12 px-6 py-3 text-base font-medium transition-all duration-200",
                      isActive('/tournaments')
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    Tournaments
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 w-[400px] md:w-[500px] lg:w-[600px]">
                      <ListItem href="/tournaments/upcoming" title="Upcoming Tournaments">
                        View and register for upcoming tournaments
                      </ListItem>
                      <ListItem href="/tournaments/past" title="Past Results">
                        Review your tournament history and performance
                      </ListItem>
                      <ListItem href="/tournaments/standings" title="Current Standings">
                        Check your position in ongoing tournaments
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Section - User Menu Only */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle className="hidden md:flex" />
            
            {/* User Menu */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                      Profile
                    </Link>
                    
                    <Link
                      to="/performance"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Stats
                    </Link>
                    
                    <Link
                      to="/progress"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Progress
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
                    
                    {/* Theme Toggle */}
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
                        <ThemeToggle showLabel={false} />
                      </div>
                    </div>
                    
                    {/* Developer/Admin Tools */}
                    {(user?.role === 'coach' || process.env.NODE_ENV === 'development') && (
                      <>
                        <button
                          onClick={() => {
                            setShowPreFlightChecklist(true);
                            setIsMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-600"
                        >
                          System Health Check
                        </button>
                        <Link
                          to="/dragdrop-test"
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Drag & Drop Test
                        </Link>
                      </>
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

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 pt-4 pb-6 space-y-2">
              <Link
                to="/dashboard"
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span>Dashboard</span>
              </Link>
              
              <Link
                to="/training"
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive('/training')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span>Practice</span>
              </Link>
              
              <Link
                to="/community"
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive('/community')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span>Community</span>
                {teamData.unreadMessages > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({teamData.unreadMessages})
                  </span>
                )}
              </Link>
              
              <Link
                to="/tournaments"
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive('/tournaments')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span>Tournaments</span>
              </Link>
              
              {/* Mobile Registration Link */}
              {showRegistrationLink && (
                <Link
                  to="/register"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-base font-medium transition-colors text-center"
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
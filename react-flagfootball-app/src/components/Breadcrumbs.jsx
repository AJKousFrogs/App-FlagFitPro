import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumbs = () => {
  const location = useLocation();
  
  // Define breadcrumb mappings
  const breadcrumbMap = {
    '/dashboard': 'Dashboard',
    '/comprehensive-dashboard': 'Performance',
    '/training': 'Training',
    '/training/route-running': 'Route Running',
    '/training/plyometrics': 'Plyometrics',
    '/training/speed': 'Speed Training',
    '/training/catching': 'Catching',
    '/training/strength': 'Strength',
    '/training/recovery': 'Recovery',
    '/community': 'Community',
    '/community/team': 'Team Chat',
    '/community/qb-wr': 'QB/WR Squad',
    '/community/defense': 'Defense Unit',
    '/community/coaches': 'Coach\'s Corner',
    '/tournaments': 'Tournaments',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/onboarding': 'Setup',
    '/team-management': 'Team Management'
  };

  // Generate breadcrumb items
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    const breadcrumbs = [{ name: 'Home', path: '/dashboard' }];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const name = breadcrumbMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      breadcrumbs.push({
        name,
        path: currentPath,
        isLast: index === pathSegments.length - 1
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  
  // Don't show breadcrumbs on home page or if only one level deep
  if (breadcrumbs.length <= 2) {
    return null;
  }

  return (
    <nav className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 py-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center space-x-2">
              {index > 0 && (
                <span className="text-gray-400 dark:text-gray-500">/</span>
              )}
              {crumb.isLast ? (
                <span className="font-medium text-gray-900 dark:text-white">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  {crumb.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbName = (path) => {
    const breadcrumbMap = {
      'dashboard': 'Dashboard',
      'training': 'Training',
      'community': 'Community',
      'profile': 'Profile',
      'tournaments': 'Tournaments',
      'login': 'Login',
      'register': 'Register',
      'onboarding': 'Onboarding'
    };
    return breadcrumbMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <nav className="breadcrumbs">
      <Link to="/" className="breadcrumb-link">
        🏈 FlagFit Pro
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <span key={name} className="breadcrumb-item">
            <span className="breadcrumb-separator"> / </span>
            {isLast ? (
              <span className="breadcrumb-current">{getBreadcrumbName(name)}</span>
            ) : (
              <Link to={routeTo} className="breadcrumb-link">
                {getBreadcrumbName(name)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
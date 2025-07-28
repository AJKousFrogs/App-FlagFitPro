import React from 'react';
import NewNavigation from './NewNavigation';
import Breadcrumbs from './Breadcrumbs';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NewNavigation />
      <Breadcrumbs />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
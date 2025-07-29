import React from 'react';
import DraggableDashboard from '../components/DraggableDashboard';
import AICoachMessage from '../components/AICoachMessage';
import SponsorBanner from '../components/SponsorBanner';
import { HomeIcon, BoltIcon, BeakerIcon } from '@heroicons/react/24/outline';

const DashboardPage = () => {
  return (
    <div className="dashboard-page">
      <h1 className="flex items-center gap-2">
        <HomeIcon className="h-8 w-8 text-blue-600" />
        Dashboard
      </h1>
      
      {/* Top Sponsor Banner */}
      <SponsorBanner 
        position="top" 
        size="wide" 
        isPremium={false}
        sponsor={{
          name: 'GearXPro',
          logo: <BoltIcon className="h-6 w-6" />,
          message: 'Upgrade your training gear',
          cta: 'Shop Now',
          link: '#'
        }}
      />
      
      {/* AI Coach Message */}
      <AICoachMessage />
      
      {/* Draggable Dashboard */}
      <DraggableDashboard />
      
      {/* Bottom Sponsor Banner */}
      <SponsorBanner 
        position="bottom" 
        size="wide" 
        isPremium={false}
        sponsor={{
          name: 'Chemius',
          logo: <BeakerIcon className="h-6 w-6" />,
          message: 'Advanced sports nutrition',
          cta: 'Learn More',
          link: '#'
        }}
      />
    </div>
  );
};

export default DashboardPage; 
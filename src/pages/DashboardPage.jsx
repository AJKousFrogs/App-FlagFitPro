import React from 'react';
import DraggableDashboard from '../components/DraggableDashboard';
import AICoachMessage from '../components/AICoachMessage';
import SponsorBanner from '../components/SponsorBanner';

const DashboardPage = () => {
  return (
    <div className="dashboard-page">
      <h1>🏈 Dashboard</h1>
      
      {/* Top Sponsor Banner */}
      <SponsorBanner 
        position="top" 
        size="wide" 
        isPremium={false}
        sponsor={{
          name: 'GearXPro',
          logo: '⚡',
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
          logo: '🧪',
          message: 'Advanced sports nutrition',
          cta: 'Learn More',
          link: '#'
        }}
      />
    </div>
  );
};

export default DashboardPage; 
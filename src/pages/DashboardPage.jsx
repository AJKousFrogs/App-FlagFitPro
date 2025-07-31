import React from 'react';
import DraggableDashboard from '../components/DraggableDashboard';
import AICoachMessage from '../components/AICoachMessage';
import SponsorBanner from '../components/SponsorBanner';
import PhysicalProfileCard from '../components/PhysicalProfileCard';

const DashboardPage = () => {
  // Sample physical metrics data
  const physicalMetrics = {
    height: 74, // 6'2" in inches
    weight: 185,
    age: 24,
    bmi: 22.4,
    bodyFat: 15,
    muscleMass: 42.3
  };

  return (
    <div className="dashboard-page">
      <h1>🏈 Player Dashboard</h1>
      
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
      
      {/* Physical Profile - Top Priority */}
      <div className="dashboard-top-section">
        <div className="top-section-grid">
          <div className="physical-profile-section">
            <PhysicalProfileCard 
              metrics={physicalMetrics}
              className="dashboard-physical-profile"
            />
          </div>
        </div>
      </div>
      
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
import React, { useState } from 'react';
import PhysicalProfileCard from '../components/PhysicalProfileCard';
import MeasurementToggle from '../components/MeasurementToggle';
import MeasurementInput from '../components/MeasurementInput';
import SponsorBanner from '../components/SponsorBanner';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    team: 'Hawks',
    primaryPosition: 'QB',
    secondaryPosition: 'WR',
    experience: 'Intermediate',
    weight: 185,
    height: 72,
    age: 25
  });

  const handleSave = () => {
    console.log('Profile saved:', profileData);
  };

  const handleMeasurementChange = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value
    });
  };

  return (
    <div className="profile-page">
      <h1>👤 Profile</h1>
      
      {/* Top Sponsor Banner */}
      <SponsorBanner 
        position="top" 
        size="wide" 
        isPremium={false}
        sponsor={{
          name: 'GearXPro',
          logo: '⚡',
          message: 'Personalized training gear',
          cta: 'Shop Now',
          link: '#'
        }}
      />
      
      {/* Profile Navigation Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'personal' ? 'active' : ''}
          onClick={() => setActiveTab('personal')}
        >
          Personal Info
        </button>
        <button 
          className={activeTab === 'physical' ? 'active' : ''}
          onClick={() => setActiveTab('physical')}
        >
          Physical Profile
        </button>
        <button 
          className={activeTab === 'performance' ? 'active' : ''}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'personal' && (
        <div className="tab-content">
          <h2>Personal Information</h2>
          <form className="profile-form">
            <div className="form-group">
              <label>First Name</label>
              <input 
                type="text" 
                value={profileData.firstName}
                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input 
                type="text" 
                value={profileData.lastName}
                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Team</label>
              <select 
                value={profileData.team}
                onChange={(e) => setProfileData({...profileData, team: e.target.value})}
              >
                <option value="Hawks">Hawks</option>
                <option value="Eagles">Eagles</option>
                <option value="Lions">Lions</option>
              </select>
            </div>
            <div className="form-group">
              <label>Primary Position</label>
              <select 
                value={profileData.primaryPosition}
                onChange={(e) => setProfileData({...profileData, primaryPosition: e.target.value})}
              >
                <option value="QB">Quarterback</option>
                <option value="WR">Wide Receiver</option>
                <option value="RB">Running Back</option>
                <option value="DB">Defensive Back</option>
              </select>
            </div>
            <div className="form-group">
              <label>Experience Level</label>
              <select 
                value={profileData.experience}
                onChange={(e) => setProfileData({...profileData, experience: e.target.value})}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <button type="button" onClick={handleSave}>Save Changes</button>
          </form>
        </div>
      )}
      
      {activeTab === 'physical' && (
        <div className="tab-content">
          <h2>Physical Profile</h2>
          
          <MeasurementToggle />
          
          <div className="physical-metrics">
            <div className="metric-group">
              <h3>Height</h3>
              <MeasurementInput
                type="height"
                value={profileData.height}
                onChange={(value) => handleMeasurementChange('height', value)}
                placeholder="Enter height"
              />
            </div>
            
            <div className="metric-group">
              <h3>Weight</h3>
              <MeasurementInput
                type="weight"
                value={profileData.weight}
                onChange={(value) => handleMeasurementChange('weight', value)}
                placeholder="Enter weight"
              />
            </div>
            
            <div className="metric-group">
              <h3>Age</h3>
              <input 
                type="number" 
                value={profileData.age}
                onChange={(e) => setProfileData({...profileData, age: parseInt(e.target.value)})}
                placeholder="Enter age"
              />
            </div>
          </div>
          
          <PhysicalProfileCard 
            metrics={{
              height: profileData.height,
              weight: profileData.weight,
              age: profileData.age
            }}
          />
          
          <button type="button" onClick={handleSave}>Save Physical Profile</button>
        </div>
      )}
      
      {activeTab === 'performance' && (
        <div className="tab-content">
          <h2>Performance Statistics</h2>
          <div className="performance-stats">
            <div className="stat-card">
              <h3>Season Summary</h3>
              <div>Games Played: 12</div>
              <div>Win Rate: 75%</div>
              <div>Touchdowns: 18</div>
              <div>Interceptions: 3</div>
            </div>
            <div className="stat-card">
              <h3>Recent Games</h3>
              <div>vs Eagles: W 28-14</div>
              <div>vs Lions: L 21-24</div>
              <div>vs Bears: W 35-7</div>
            </div>
            <div className="stat-card">
              <h3>Achievements</h3>
              <div>🏆 MVP Week 3</div>
              <div>🎯 Accuracy Leader</div>
              <div>⚡ Speed Champion</div>
            </div>
            <div className="stat-card">
              <h3>Goals</h3>
              <div>Season TD Record: 85%</div>
              <div>Completion Rate: 92%</div>
              <div>Team Chemistry: 8.5/10</div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div className="tab-content">
          <h2>Account Settings</h2>
          <div className="settings-section">
            <h3>Notifications</h3>
            <div className="setting-item">
              <label>
                <input type="checkbox" defaultChecked />
                Training reminders
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" defaultChecked />
                Game notifications
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" />
                Team chat alerts
              </label>
            </div>
          </div>
          
          <div className="settings-section">
            <h3>Privacy</h3>
            <div className="setting-item">
              <label>
                <input type="checkbox" defaultChecked />
                Show profile to team
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" />
                Show performance stats
              </label>
            </div>
          </div>
          
          <button type="button" onClick={handleSave}>Save Settings</button>
        </div>
      )}
      
      {/* Bottom Sponsor Banner */}
      <SponsorBanner 
        position="bottom" 
        size="wide" 
        isPremium={false}
        sponsor={{
          name: 'Chemius',
          logo: '🧪',
          message: 'Personalized nutrition plans',
          cta: 'Get Plan',
          link: '#'
        }}
      />
    </div>
  );
};

export default ProfilePage; 
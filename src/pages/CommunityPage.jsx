import React, { useState } from 'react';
import SponsorBanner from '../components/SponsorBanner';

const CommunityPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="community-page">
      <h1>👥 Community</h1>
      
      {/* Top Sponsor Banner */}
      <SponsorBanner 
        position="top" 
        size="wide" 
        isPremium={false}
        sponsor={{
          name: 'Chemius',
          logo: '🧪',
          message: 'Team nutrition solutions',
          cta: 'Learn More',
          link: '#'
        }}
      />
      
      {/* Community Navigation Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Team Overview
        </button>
        <button 
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          Team Chat
        </button>
        <button 
          className={activeTab === 'sessions' ? 'active' : ''}
          onClick={() => setActiveTab('sessions')}
        >
          Training Sessions
        </button>
        <button 
          className={activeTab === 'knowledge' ? 'active' : ''}
          onClick={() => setActiveTab('knowledge')}
        >
          Knowledge Base
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <h2>Team Overview</h2>
          <div className="team-stats">
            <div className="stat-card">
              <h3>Active Players</h3>
              <div>23 members</div>
            </div>
            <div className="stat-card">
              <h3>Team Chemistry</h3>
              <div>7.8/10 🟢</div>
            </div>
            <div className="stat-card">
              <h3>Next Game</h3>
              <div>vs Eagles Tomorrow</div>
            </div>
            <div className="stat-card">
              <h3>Practice</h3>
              <div>Today 6 PM</div>
            </div>
          </div>
          
          <h3>Recent Activity</h3>
          <div className="activity-feed">
            <div className="activity-item">
              <div>⚡ Jake completed Route Running drill</div>
              <div>2 hours ago</div>
            </div>
            <div className="activity-item">
              <div>🏈 Coach AJ scheduled team practice</div>
              <div>4 hours ago</div>
            </div>
            <div className="activity-item">
              <div>📈 Sarah improved her 40-yard dash time</div>
              <div>1 day ago</div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'chat' && (
        <div className="tab-content">
          <h2>Team Chat</h2>
          <div className="chat-rooms">
            <div className="chat-room">
              <h4>🏈 Main Team Chat (23 members) [3 unread]</h4>
              <div>&quot;Practice tomorrow at 6 PM!&quot;</div>
              <div>Chemistry: 7.8/10 🟢</div>
            </div>
            <div className="chat-room">
              <h4>⚡ QB Pocket Movement (8 members)</h4>
              <div>&quot;Working on pressure timing tomorrow&quot;</div>
              <div>Chemistry: 6.8/10 🟡</div>
            </div>
            <div className="chat-room">
              <h4>🏃‍♂️ WR Route Timing (12 members)</h4>
              <div>&quot;Crossing patterns need work&quot;</div>
              <div>Chemistry: 8.2/10 🟢</div>
            </div>
          </div>
          
          <div className="chat-message">
            <h4>⚡ Jake &quot;The Snake&quot; (Blitzer) (10:52 AM)</h4>
            <div>Blitzers - we&apos;re working on pressure timing tomorrow</div>
            <div>Chemistry with you: 6.8/10 🟡</div>
          </div>
        </div>
      )}
      
      {activeTab === 'sessions' && (
        <div className="tab-content">
          <h2>Training Sessions</h2>
          <div className="training-sessions">
            <div className="session-item">
              <div className="session-time">Today 6:00 PM</div>
              <div className="session-details">
                <div>Team Practice</div>
                <div>Focus: Route timing and pocket presence</div>
                <div>Duration: 90 minutes</div>
                <div>Location: Main Field</div>
              </div>
            </div>
            <div className="session-item">
              <div className="session-time">Tomorrow 5:30 PM</div>
              <div className="session-details">
                <div>Position-Specific Training</div>
                <div>Focus: QB decision making, WR route running</div>
                <div>Duration: 60 minutes</div>
                <div>Location: Practice Field</div>
              </div>
            </div>
            <div className="session-item">
              <div className="session-time">Friday 7:00 PM</div>
              <div className="session-details">
                <div>Game Preparation</div>
                <div>Focus: Strategy review and team chemistry</div>
                <div>Duration: 45 minutes</div>
                <div>Location: Film Room</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'knowledge' && (
        <div className="tab-content">
          <h2>Knowledge Base</h2>
          <div className="knowledge-base">
            <div className="knowledge-item">
              <div>🏈 Offensive Playbook</div>
              <div>Complete collection of offensive plays and strategies</div>
              <div>Last updated: 2 days ago</div>
            </div>
            <div className="knowledge-item">
              <div>🛡️ Defensive Schemes</div>
              <div>Defensive formations and coverage patterns</div>
              <div>Last updated: 1 week ago</div>
            </div>
            <div className="knowledge-item">
              <div>📊 Game Film Analysis</div>
              <div>Breakdown of recent games and opponent analysis</div>
              <div>Last updated: 3 days ago</div>
            </div>
            <div className="knowledge-item">
              <div>💪 Training Resources</div>
              <div>Drill guides, workout plans, and nutrition tips</div>
              <div>Last updated: 1 day ago</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom Sponsor Banner */}
      <SponsorBanner 
        position="bottom" 
        size="wide" 
        isPremium={false}
        sponsor={{
          name: 'LaprimaFit',
          logo: '💪',
          message: 'Team equipment packages',
          cta: 'Get Quote',
          link: '#'
        }}
      />
    </div>
  );
};

export default CommunityPage; 
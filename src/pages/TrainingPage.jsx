import React, { useState } from 'react';
import DraggableTrainingSchedule from '../components/DraggableTrainingSchedule';
import WeeklyTrainingSchedule from '../components/WeeklyTrainingSchedule';
import SponsorBanner from '../components/SponsorBanner';
import AICoachMessage from '../components/AICoachMessage';
import LA28Countdown from '../components/LA28Countdown';
import TrainingCategories from '../components/TrainingCategories';
import CoachRecommendedDrills from '../components/CoachRecommendedDrills';

const TrainingPage = () => {
  const [activeTab, setActiveTab] = useState('schedule');

  // Training stats data
  const [trainingStats] = useState({
    currentStreak: 7,
    playerLevel: 'Route Runner Pro',
    xp: 2400,
    dailyChallenge: 'Complete 5 Routes',
    challengeXP: 50
  });

  // Position-specific focus areas
  const [positionFocus] = useState({
    qb: {
      primary: [
        'Pocket Presence: Decision time 0.3s slower',
        'Red Zone Efficiency: 67% (target: 75%)',
        'Intermediate Routes: Timing needs work'
      ],
      improvement: '+12% accuracy on crossing patterns'
    },
    wr: {
      primary: [
        'Route Precision: 78% (target: 85%)',
        'Catch Rate: 67% (target: 75%)',
        'Chemistry with QB: 8.3/10 (excellent)'
      ],
      improvement: '+8% timing with Mike Johnson'
    }
  });





  // Team chemistry data
  const [teamChemistry] = useState([
    {
      player: 'Mike Johnson (WR)',
      chemistry: 8.3,
      status: 'excellent',
      details: {
        communication: 9,
        timing: 8,
        trust: 8
      },
      suggestion: 'Practice route timing together'
    },
    {
      player: 'Chris Wilson (Center)',
      chemistry: 8.0,
      status: 'good',
      details: {
        snapTiming: 9,
        protectionCalls: 8
      },
      suggestion: 'Work on protection communication'
    }
  ]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#2196F3';
      case 'fair': return '#FF9800';
      case 'poor': return '#F44336';
      default: return '#9E9E9E';
    }
  };



  return (
    <div className="training-page">
      <h1>🏃‍♂️ Training</h1>
      
      {/* Top Sponsor Banner */}
      <SponsorBanner 
        position="top" 
        size="wide" 
        isPremium={false}
        sponsor={{
          name: 'LaprimaFit',
          logo: '💪',
          message: 'Premium training equipment',
          cta: 'Shop Now',
          link: '#'
        }}
      />
      
      {/* AI Coach Message */}
      <AICoachMessage />
      
      {/* LA28 Olympic Games Countdown */}
      <LA28Countdown />
      
      {/* Training Stats Overview */}
      <div className="training-stats-overview">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Current Streak</h3>
            <div className="stat-value">{trainingStats.currentStreak} days</div>
          </div>
          <div className="stat-card">
            <h3>Player Level</h3>
            <div className="stat-value">{trainingStats.playerLevel}</div>
            <div className="stat-subtitle">{trainingStats.xp} XP</div>
          </div>
          <div className="stat-card">
            <h3>Daily Challenge</h3>
            <div className="stat-value">{trainingStats.dailyChallenge}</div>
            <div className="stat-subtitle">+{trainingStats.challengeXP} XP</div>
          </div>
        </div>
      </div>
      
      {/* Position-Specific Training Focus */}
      <div className="position-focus-section">
        <h2>Position-Specific Training Focus</h2>
        
        <div className="focus-areas">
          <div className="focus-area">
            <h3>🎯 QB Primary Focus Areas</h3>
            <ul>
              {positionFocus.qb.primary.map((focus, index) => (
                <li key={index}>{focus}</li>
              ))}
            </ul>
            <div className="improvement-note">
              📈 This Week: {positionFocus.qb.improvement}
            </div>
          </div>
          
          <div className="focus-area">
            <h3>🎯 WR Secondary Focus Areas</h3>
            <ul>
              {positionFocus.wr.primary.map((focus, index) => (
                <li key={index}>{focus}</li>
              ))}
            </ul>
            <div className="improvement-note">
              📈 This Week: {positionFocus.wr.improvement}
            </div>
          </div>
        </div>
      </div>
      

      

      
      {/* Enhanced Training Categories Component */}
      <div className="enhanced-training-categories-section">
        <TrainingCategories />
      </div>
      
      {/* Coach Recommended Drills */}
      <CoachRecommendedDrills />
      
      {/* Team Chemistry Building */}
      <div className="team-chemistry-section">
        <h2>Team Chemistry Building</h2>
        
        <div className="chemistry-grid">
          {teamChemistry.map((teammate, index) => (
            <div key={index} className="chemistry-card">
              <div className="chemistry-header">
                <h3>{teammate.player}</h3>
                <span 
                  className="chemistry-score"
                  style={{ color: getStatusColor(teammate.status) }}
                >
                  {teammate.chemistry}/10
                </span>
              </div>
              
              <div className="chemistry-details">
                {Object.entries(teammate.details).map(([key, value]) => (
                  <div key={key} className="chemistry-metric">
                    <span className="metric-label">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="metric-value">{value}/10</span>
                  </div>
                ))}
              </div>
              
              <div className="chemistry-suggestion">
                💡 {teammate.suggestion}
              </div>
              
              <div className="chemistry-actions">
                <button className="btn-primary">Invite to Practice</button>
                <button className="btn-secondary">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Training Navigation Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'schedule' ? 'active' : ''}
          onClick={() => setActiveTab('schedule')}
        >
          Weekly Schedule
        </button>
        <button 
          className={activeTab === 'drills' ? 'active' : ''}
          onClick={() => setActiveTab('drills')}
        >
          Drill Library
        </button>
        <button 
          className={activeTab === 'progress' ? 'active' : ''}
          onClick={() => setActiveTab('progress')}
        >
          Progress Tracking
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'schedule' && (
        <div className="tab-content">
          <h2>Weekly Training Schedule</h2>
          <WeeklyTrainingSchedule />
        </div>
      )}
      
      {activeTab === 'drills' && (
        <div className="tab-content">
          <h2>Drill Library</h2>
          <div className="drill-categories">
            <div className="drill-category">
              <h3>Route Running</h3>
              <div>Speed routes, crossing patterns, timing drills</div>
            </div>
            <div className="drill-category">
              <h3>Plyometrics</h3>
              <div>Box jumps, lateral bounds, explosive movements</div>
            </div>
            <div className="drill-category">
              <h3>Speed Training</h3>
              <div>40-yard dash, agility drills, acceleration work</div>
            </div>
            <div className="drill-category">
              <h3>Strength</h3>
              <div>Core stability, functional strength, power</div>
            </div>
            <div className="drill-category">
              <h3>Accuracy</h3>
              <div>Target practice, precision drills, consistency</div>
            </div>
            <div className="drill-category">
              <h3>Mental</h3>
              <div>Game situations, decision making, pressure</div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'progress' && (
        <div className="tab-content">
          <h2>Progress Tracking</h2>
          <div className="progress-stats">
            <div className="stat-card">
              <h3>Current Streak</h3>
              <div>7 days</div>
            </div>
            <div className="stat-card">
              <h3>Player Level</h3>
              <div>Level 12</div>
            </div>
            <div className="stat-card">
              <h3>Total XP</h3>
              <div>2,450 XP</div>
            </div>
            <div className="stat-card">
              <h3>Weekly Goal</h3>
              <div>85% Complete</div>
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
          name: 'GearXPro',
          logo: '⚡',
          message: 'Performance tracking devices',
          cta: 'Explore',
          link: '#'
        }}
      />
    </div>
  );
};

export default TrainingPage; 
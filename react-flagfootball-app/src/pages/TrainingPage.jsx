import React, { useState } from 'react';
import WeeklyTrainingSchedule from '../components/WeeklyTrainingSchedule';
import SponsorBanner from '../components/SponsorBanner';
import AICoachMessage from '../components/AICoachMessage';
import { 
  UserIcon, 
  BoltIcon, 
  UserGroupIcon,
  ChartBarIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

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

  // Coach-recommended drills
  const [recommendedDrills] = useState([
    {
      id: 1,
      title: 'QB Pocket Movement Drills',
      coach: 'Coach AJ',
      duration: 30,
      difficulty: 'Advanced',
      focus: 'Decision making under pressure',
      description: 'Improve pocket presence and decision-making under pressure'
    },
    {
      id: 2,
      title: 'QB-WR Chemistry Drills',
      coach: 'Team Chemistry',
      duration: 45,
      difficulty: 'Intermediate',
      focus: 'Timing with Mike Johnson',
      description: 'Build chemistry and timing with your primary receiver'
    },
    {
      id: 3,
      title: 'Blitzer Pass Rush Drills',
      coach: 'Defense Coach',
      duration: 25,
      difficulty: 'Intermediate',
      focus: 'Pass rush techniques',
      description: 'Improve pass rush effectiveness and pressure'
    },
    {
      id: 4,
      title: 'DB Coverage Drills',
      coach: 'Defense Coach',
      duration: 35,
      difficulty: 'Advanced',
      focus: 'Coverage techniques',
      description: 'Enhance coverage skills and positioning'
    }
  ]);

  // Training categories with progress
  const [trainingCategories] = useState([
    { name: 'Route Running', icon: UserIcon, routes: 15, completed: 8, color: '#4CAF50' },
    { name: 'Plyometrics', icon: BoltIcon, routes: 12, completed: 5, color: '#FF9800' },
    { name: 'Speed Training', icon: UserIcon, routes: 8, completed: 6, color: '#2196F3' },
    { name: 'Catching', icon: TargetIcon, routes: 10, completed: 4, color: '#9C27B0' },
    { name: 'Strength', icon: UserGroupIcon, routes: 20, completed: 12, color: '#F44336' },
    { name: 'Recovery', icon: UserIcon, routes: 6, completed: 3, color: '#607D8B' }
  ]);

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

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return '#4CAF50';
      case 'Intermediate': return '#FF9800';
      case 'Advanced': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <div className="training-page">
              <h1 className="flex items-center gap-2">
          <UserIcon className="h-8 w-8 text-blue-600" />
          Training
        </h1>
      
      {/* Top Sponsor Banner */}
      <SponsorBanner 
        position="top" 
        size="wide" 
        isPremium={false}
        sponsor={{
          name: 'LaprimaFit',
          logo: <UserGroupIcon className="h-6 w-6" />,
          message: 'Premium training equipment',
          cta: 'Shop Now',
          link: '#'
        }}
      />
      
      {/* AI Coach Message */}
      <AICoachMessage />
      
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
      
      {/* Coach-Recommended Drills - Bento Grid */}
      <div className="recommended-drills-section">
        <h2>Coach-Recommended Drills</h2>
        
        <div className="bento-grid">
          {recommendedDrills.map((drill) => (
            <div key={drill.id} className="bento-drill-card">
              <div className="drill-header">
                <h3>{drill.title}</h3>
                <span className="coach-badge">{drill.coach}</span>
              </div>
              
              <div className="drill-meta">
                <span>Duration: {drill.duration} min</span>
                <span 
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(drill.difficulty) }}
                >
                  {drill.difficulty}
                </span>
              </div>
              
              <div className="drill-focus">
                <strong>Focus:</strong> {drill.focus}
              </div>
              
              <div className="drill-description">
                {drill.description}
              </div>
              
              <div className="drill-actions">
                <button className="btn-primary">Start Drill</button>
                <button className="btn-secondary">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Training Categories - Bento Grid */}
      <div className="training-categories-section">
        <h2>Training Categories</h2>
        
        <div className="bento-grid">
          {trainingCategories.map((category) => (
            <div key={category.name} className="bento-category-card">
                              <category.icon className="h-8 w-8" style={{ color: category.color }} />
              <h3>{category.name}</h3>
              <div className="category-progress">
                <div className="progress-text">
                  {category.completed}/{category.routes} completed
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${(category.completed / category.routes) * 100}%`,
                      backgroundColor: category.color
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
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
          logo: <BoltIcon className="h-6 w-6" />,
          message: 'Performance tracking devices',
          cta: 'Explore',
          link: '#'
        }}
      />
    </div>
  );
};

export default TrainingPage; 
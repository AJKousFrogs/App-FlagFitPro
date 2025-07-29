import React, { useState } from 'react';
import MeasurementDisplay from './MeasurementDisplay';
import WeeklyTrainingSchedule from './WeeklyTrainingSchedule';
import PlayersLeaderboard from './PlayersLeaderboard';
import SponsorBanner from './SponsorBanner';
import PerformancePredictionEngine from './PerformancePredictionEngine';
import InjuryRiskAssessment from './InjuryRiskAssessment';
import NutritionPerformanceAnalytics from './NutritionPerformanceAnalytics';
import InteractivePerformanceVisualization from './InteractivePerformanceVisualization';
import TeamChemistryAnalytics from './TeamChemistryAnalytics';
import { 
  BoltIcon, 
  BeakerIcon, 
  ShieldCheckIcon, 
  UserGroupIcon, 
  TrophyIcon,
  CogIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const DraggableDashboard = ({ isPremium = false }) => {
  const [dashboardSections, setDashboardSections] = useState([
    {
      id: 'performance-prediction',
      title: '🤖 AI Performance Prediction',
      content: <PerformancePredictionEngine />
    },
    {
      id: 'injury-risk-assessment',
      title: '🛡️ Injury Risk Assessment',
      content: <InjuryRiskAssessment />
    },
    {
      id: 'nutrition-performance-analytics',
      title: '🥗 Nutrition-Performance Analytics',
      content: <NutritionPerformanceAnalytics />
    },
    {
      id: 'interactive-performance-visualization',
      title: '📊 Interactive Performance Visualization',
      content: <InteractivePerformanceVisualization />
    },
    {
      id: 'team-chemistry-analytics',
      title: '🤝 Team Chemistry Analytics',
      content: <TeamChemistryAnalytics />
    },
    {
      id: 'players-leaderboard',
      title: '🏆 Players Leaderboard',
      content: <PlayersLeaderboard />
    },
    {
      id: 'team-chemistry',
      title: 'Team Chemistry',
      content: (
        <div className="grid">
          <div className="stats-card">
            <div>Overall Chemistry</div>
            <div>87% ⭐</div>
          </div>
          <div className="stats-card">
            <div>Communication</div>
            <div>92%</div>
          </div>
          <div className="stats-card">
            <div>Trust Level</div>
            <div>85%</div>
          </div>
          <div className="stats-card">
            <div>Team Ranking</div>
            <div>#3 of 12</div>
          </div>
        </div>
      )
    },
    {
      id: 'game-stats',
      title: 'Game Stats',
      content: (
        <div className="dashboard-stats">
          <div className="stats-card">
            <div>Games Played</div>
            <div>12</div>
          </div>
          <div className="stats-card">
            <div>Touchdowns</div>
            <div>18</div>
          </div>
          <div className="stats-card">
            <div>Passing Yards</div>
            <div>2,847</div>
          </div>
          <div className="stats-card">
            <div>Completion %</div>
            <div>68.5%</div>
          </div>
        </div>
      )
    },
    {
      id: 'training-focus',
      title: 'Training Focus',
      content: (
        <div className="grid">
          <div className="stats-card">
            <h4>Speed & Agility</h4>
            <div>Progress: 75%</div>
            <div className="progress">
              <div className="progress-bar" style={{width: '75%'}}></div>
            </div>
          </div>
          <div className="stats-card">
            <h4>Strength & Power</h4>
            <div>Progress: 82%</div>
            <div className="progress">
              <div className="progress-bar" style={{width: '82%'}}></div>
            </div>
          </div>
          <div className="stats-card">
            <h4>Endurance</h4>
            <div>Progress: 68%</div>
            <div className="progress">
              <div className="progress-bar" style={{width: '68%'}}></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      content: (
        <div className="flex">
          <button>Start Training Session</button>
          <button>View Team Stats</button>
          <button>Schedule Game</button>
          <button>Update Profile</button>
        </div>
      )
    }
  ]);

  const [draggedSection, setDraggedSection] = useState(null);

  const handleDragStart = (e, section) => {
    setDraggedSection(section);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetSection) => {
    e.preventDefault();
    
    if (!draggedSection || draggedSection.id === targetSection.id) {
      return;
    }

    const newSections = [...dashboardSections];
    const draggedIndex = newSections.findIndex(section => section.id === draggedSection.id);
    const targetIndex = newSections.findIndex(section => section.id === targetSection.id);

    // Remove dragged section from its current position
    const [removed] = newSections.splice(draggedIndex, 1);
    
    // Insert dragged section at target position
    newSections.splice(targetIndex, 0, removed);

    setDashboardSections(newSections);
    setDraggedSection(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
  };

  return (
    <main>
      <h2>Player Dashboard 🏈</h2>
      
      {/* Top Banner for Free Users */}
      <SponsorBanner 
        position="top" 
        size="wide" 
        isPremium={isPremium}
        sponsor={{
          name: 'Chemius',
          logo: <BeakerIcon className="h-6 w-6" />,
          message: 'Optimize your performance with our premium supplement line',
          cta: 'Shop Supplements',
          link: '#'
        }}
      />
      
      <div className="dashboard-instructions">
        <p>💡 Drag and drop sections to reorder your dashboard layout</p>
      </div>
      
      {dashboardSections.map((section) => (
        <div
          key={section.id}
          className={`dashboard-section ${draggedSection?.id === section.id ? 'dragging' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, section)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, section)}
          onDragEnd={handleDragEnd}
        >
          <div className="section-header">
            <div className="drag-handle">⋮⋮</div>
            <h3>{section.title}</h3>
          </div>
          <div className="section-content">
            {section.content}
          </div>
        </div>
      ))}
      
      {/* Sidebar Banner for Free Users */}
      <SponsorBanner 
        position="sidebar" 
        size="sidebar" 
        isPremium={isPremium}
        sponsor={{
          name: 'LaprimaFit',
          logo: <UserGroupIcon className="h-6 w-6" />,
          message: 'Premium training equipment for serious athletes',
          cta: 'Shop Now',
          link: '#'
        }}
      />
    </main>
  );
};

export default DraggableDashboard; 
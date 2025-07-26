import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNeonDatabase } from '../contexts/NeonDatabaseContext';
import { useTraining } from '../contexts/TrainingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import TrainingSession from '../components/TrainingSession';
import CommunityHub from '../components/CommunityHub';
import BiometricIntegration from '../components/BiometricIntegration';
import DrillLibrary from '../components/DrillLibrary';
import DrillDetail from '../components/DrillDetail';
import TrainingCalendar from '../components/TrainingCalendar';
import ProgressTracker from '../components/ProgressTracker';
import WeeklyChallenges from '../components/WeeklyChallenges';
import OfflineWorkouts from '../components/OfflineWorkouts';
import BuddySystem from '../components/BuddySystem';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import WeightManagement from '../components/WeightManagement';
import EnhancedBiometricIntegration from '../components/EnhancedBiometricIntegration';
import AdvancedChemistryAnalytics from '../components/AdvancedChemistryAnalytics';

const TrainingView = () => {
  const { user } = useNeonDatabase();
  const { stats, sessions, fetchStats } = useTraining();
  
  // Core State Management
  const [activeCategory, setActiveCategory] = useState('routes');
  const [currentStreak, setCurrentStreak] = useState(7);
  const [playerLevel, setPlayerLevel] = useState({ 
    name: 'Route Runner Pro', 
    xp: 2400, 
    nextLevel: 3000,
    position: 'QB',
    secondaryPosition: 'WR'
  });
  
  // Progressive Disclosure State
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTeamChemistry, setShowTeamChemistry] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showWeightManagement, setShowWeightManagement] = useState(false);
  
  // AI Coach & Personalization
  const [aiCoachMessage, setAiCoachMessage] = useState('');
  const [aiCoachPersonality, setAiCoachPersonality] = useState('motivational');
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  
  // Training Session State
  const [showTrainingSession, setShowTrainingSession] = useState(false);
  const [showWorkoutMode, setShowWorkoutMode] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [workoutProgress, setWorkoutProgress] = useState(0);
  
  // Performance & Analytics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    trainingEffectiveness: 87,
    gamePerformance: 92,
    injuryRisk: 12,
    recoveryScore: 78,
    teamChemistry: 8.3
  });
  
  // Team Chemistry & Social Features
  const [teamChemistry, setTeamChemistry] = useState({
    teammates: [
      { name: 'Mike Johnson', position: 'WR', chemistry: 8.3, communication: 9, timing: 8 },
      { name: 'Chris Wilson', position: 'Center', chemistry: 8.0, snapTiming: 9, protection: 8 }
    ],
    teamFormation: 'Shotgun Spread',
    chemistryTrend: '+0.2'
  });
  
  // Advanced Analytics
  const [analyticsData, setAnalyticsData] = useState({
    predictiveModeling: {
      nextGamePerformance: 89,
      trainingImpact: 0.73,
      improvementAreas: ['Red Zone Efficiency', 'Decision Time']
    },
    positionBenchmarks: {
      qb: { accuracy: 78, decisionTime: 2.1, redZoneEfficiency: 67 },
      wr: { routePrecision: 82, catchRate: 75, separation: 79 }
    }
  });
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  
  // Component Visibility State
  const [showDrillLibrary, setShowDrillLibrary] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [showWeeklyChallenges, setShowWeeklyChallenges] = useState(false);
  const [showOfflineWorkouts, setShowOfflineWorkouts] = useState(false);
  const [showBuddySystem, setShowBuddySystem] = useState(false);
  const [selectedDrill, setSelectedDrill] = useState(null);

  // Enhanced Training Categories with Progressive Disclosure
  const trainingCategories = {
    routes: {
      name: 'Route Running',
      icon: '🏃',
      color: 'from-green-500 to-green-600',
      routes: 15,
      completed: 8,
      difficulty: 'Intermediate',
      nextUnlock: 'Double Move Routes',
      focusAreas: ['Timing', 'Precision', 'Separation'],
      aiInsights: {
        strength: 'Excellent acceleration',
        weakness: 'Route depth consistency',
        recommendation: 'Practice 5-yard timing markers'
      }
    },
    plyometrics: {
      name: 'Plyometrics',
      icon: '⚡',
      color: 'from-yellow-500 to-orange-600',
      routes: 12,
      completed: 5,
      difficulty: 'Beginner',
      nextUnlock: 'Explosive Power Drills',
      focusAreas: ['Explosiveness', 'Landing Mechanics', 'Recovery'],
      aiInsights: {
        strength: 'Good vertical leap',
        weakness: 'Landing stability',
        recommendation: 'Focus on soft landings'
      }
    },
    sprints: {
      name: 'Speed Training',
      icon: '🏃‍♂️',
      color: 'from-blue-500 to-purple-600',
      routes: 8,
      completed: 6,
      difficulty: 'Advanced',
      nextUnlock: 'Elite Sprint Mechanics',
      focusAreas: ['Acceleration', 'Top Speed', 'Deceleration'],
      aiInsights: {
        strength: 'Fast 40-yard time',
        weakness: 'Deceleration control',
        recommendation: 'Practice controlled stops'
      }
    },
    catching: {
      name: 'Catching',
      icon: '🎯',
      color: 'from-red-500 to-pink-600',
      routes: 10,
      completed: 4,
      difficulty: 'Intermediate',
      nextUnlock: 'One-Handed Catches',
      focusAreas: ['Hand-Eye Coordination', 'Body Control', 'Focus'],
      aiInsights: {
        strength: 'Good hand positioning',
        weakness: 'Contested catch rate',
        recommendation: 'Practice high-point catches'
      }
    },
    strength: {
      name: 'Strength',
      icon: '💪',
      color: 'from-gray-500 to-gray-700',
      routes: 20,
      completed: 12,
      difficulty: 'Beginner',
      nextUnlock: 'Power Lifting Fundamentals',
      focusAreas: ['Core Strength', 'Lower Body', 'Upper Body'],
      aiInsights: {
        strength: 'Strong lower body',
        weakness: 'Core stability',
        recommendation: 'Add planks to routine'
      }
    },
    recovery: {
      name: 'Recovery',
      icon: '🧘',
      color: 'from-indigo-500 to-purple-600',
      routes: 6,
      completed: 3,
      difficulty: 'Beginner',
      nextUnlock: 'Advanced Mobility Work',
      focusAreas: ['Mobility', 'Flexibility', 'Recovery'],
      aiInsights: {
        strength: 'Good sleep habits',
        weakness: 'Post-workout stretching',
        recommendation: 'Add 10-min cool-down'
      }
    }
  };

  // AI Coach Messages with Personality Adaptation
  const generateAICoachMessage = useCallback(() => {
    const messages = {
      motivational: [
        "Ready to dominate today's route session? Your precision has improved 23% this week! 🔥",
        "I noticed you're strongest in the mornings. Perfect time for speed work! ⚡",
        "Your form on that last slant route was textbook perfect. Let's build on that momentum! 🎯"
      ],
      analytical: [
        "Based on your biometrics, today's optimal training window is 2-4 PM. Heart rate variability suggests peak performance timing.",
        "Your recovery metrics indicate 78% readiness. Recommend focusing on technique over intensity.",
        "Analysis shows 12% improvement in decision time. Red zone efficiency drills next."
      ],
      supportive: [
        "Great work on consistency! Your 7-day streak shows real dedication. Keep it up! 🌟",
        "Remember, progress isn't always linear. Your effort today builds tomorrow's success.",
        "You're doing amazing! Let's tackle today's challenge together."
      ]
    };
    
    const personalityMessages = messages[aiCoachPersonality] || messages.motivational;
    return personalityMessages[Math.floor(Math.random() * personalityMessages.length)];
  }, [aiCoachPersonality]);

  // Enhanced AI Recommendations
  const generateAIRecommendations = useCallback(() => {
    const recommendations = [
      {
        type: 'performance',
        title: 'Red Zone Efficiency',
        description: 'Focus on 10-yard timing drills',
        priority: 'high',
        impact: '+15% game performance',
        duration: '20 min'
      },
      {
        type: 'chemistry',
        title: 'Team Chemistry',
        description: 'Practice with Mike Johnson',
        priority: 'medium',
        impact: '+0.3 chemistry rating',
        duration: '30 min'
      },
      {
        type: 'recovery',
        title: 'Recovery Optimization',
        description: 'Light mobility work',
        priority: 'low',
        impact: '+8% recovery score',
        duration: '15 min'
      }
    ];
    
    return recommendations;
  }, []);

  // Initialize Component
  useEffect(() => {
    const initializeTraining = async () => {
      try {
        // Simulate loading
        setTimeout(() => setIsLoading(false), 1500);
        
        // Set AI coach message
        setAiCoachMessage(generateAICoachMessage());
        
        // Generate AI recommendations
        setAiRecommendations(generateAIRecommendations());
        
        // Fetch training stats
        await fetchStats();
        
      } catch (error) {
        console.error('Failed to initialize training:', error);
        setIsLoading(false);
      }
    };

    initializeTraining();
  }, [generateAICoachMessage, generateAIRecommendations, fetchStats]);

  // Handle Training Start with Enhanced Analytics
  const handleStartTraining = (category) => {
    setActiveCategory(category);
    
    // Progressive disclosure: Show advanced features after first training
    if (!showAdvancedFeatures) {
      setShowAdvancedFeatures(true);
    }
    
    setShowTrainingSession(true);
    
    // Achievement system
    const achievement = {
      title: 'Training Initiated',
      description: `Started ${trainingCategories[category].name} session`,
      icon: trainingCategories[category].icon,
      xp: 50
    };
    
    setAchievementData(achievement);
    setShowAchievement(true);
    setTimeout(() => setShowAchievement(false), 3000);
  };

  // Enhanced Training Completion
  const handleCompleteTraining = (results) => {
    setShowTrainingSession(false);
    
    // Update performance metrics
    setPerformanceMetrics(prev => ({
      ...prev,
      trainingEffectiveness: Math.min(100, prev.trainingEffectiveness + 2),
      gamePerformance: Math.min(100, prev.gamePerformance + 1)
    }));
    
    // Update player level
    setPlayerLevel(prev => ({
      ...prev,
      xp: prev.xp + 100
    }));
    
    // Show completion achievement
    const completionAchievement = {
      title: 'Session Complete!',
      description: `Completed ${trainingCategories[activeCategory].name}`,
      icon: '🏆',
      xp: 100,
      performance: results?.score || 85
    };
    
    setAchievementData(completionAchievement);
    setShowAchievement(true);
    setTimeout(() => setShowAchievement(false), 3000);
  };

  // Workout Mode Handler
  const handleStartWorkoutMode = (workout) => {
    setCurrentWorkout(workout);
    setShowWorkoutMode(true);
    setWorkoutProgress(0);
  };

  // AI Chat Handler
  const handleAIChat = (message) => {
    // Simulate AI response
    const responses = [
      "Based on your recent performance, I'd recommend focusing on route timing today.",
      "Your biometrics show you're ready for high-intensity training. Let's push it!",
      "I've noticed your decision time has improved. Great work on the mental game!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-900 mt-4 text-lg">Preparing your personalized training experience...</p>
        </div>
      </div>
    );
  }

  // Show component modals
  if (showDrillLibrary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-green-100 text-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowDrillLibrary(false)}
              className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Training</span>
            </button>
          </div>
          <DrillLibrary 
            selectedCategory={activeCategory}
            onSelectDrill={setSelectedDrill}
          />
        </div>
      </div>
    );
  }

  if (showCalendar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-green-100 text-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowCalendar(false)}
              className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Training</span>
            </button>
          </div>
          <TrainingCalendar />
        </div>
      </div>
    );
  }

  if (showProgressTracker) {
    return <ProgressTracker onBack={() => setShowProgressTracker(false)} />;
  }

  if (showWeeklyChallenges) {
    return <WeeklyChallenges onBack={() => setShowWeeklyChallenges(false)} />;
  }

  if (showOfflineWorkouts) {
    return <OfflineWorkouts onBack={() => setShowOfflineWorkouts(false)} />;
  }

  if (showBuddySystem) {
    return <BuddySystem onBack={() => setShowBuddySystem(false)} />;
  }

  if (showTrainingSession) {
    return (
      <TrainingSession
        category={activeCategory}
        onBack={() => setShowTrainingSession(false)}
        onComplete={handleCompleteTraining}
      />
    );
  }

  if (selectedDrill) {
    return (
      <DrillDetail
        drill={selectedDrill}
        onBack={() => setSelectedDrill(null)}
        onStartDrill={(drill) => console.log('Starting drill:', drill)}
      />
    );
  }

  const progressPercentage = (playerLevel.xp / playerLevel.nextLevel) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-green-100 text-gray-900">
      {/* Achievement Popup */}
      {showAchievement && achievementData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 rounded-3xl transform animate-bounce">
            <div className="text-center">
              <div className="text-6xl mb-4">{achievementData.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{achievementData.title}</h3>
              <p className="text-white opacity-90 mb-2">{achievementData.description}</p>
              {achievementData.performance && (
                <p className="text-white opacity-90">Performance: {achievementData.performance}/100</p>
              )}
              <p className="text-white opacity-90">+{achievementData.xp} XP</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header with Progressive Disclosure */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                Training Ecosystem
              </h1>
              <p className="text-green-700 mt-2">AI-Powered Flag Football Mastery</p>
            </div>
            
            {/* Progressive Disclosure Controls */}
            <div className="flex items-center space-x-4">
              {/* Core Actions - Always Visible */}
              <button
                onClick={() => setShowCalendar(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Calendar</span>
              </button>
              
              {/* Advanced Features - Progressive Disclosure */}
              {showAdvancedFeatures && (
                <>
                  <button
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Analytics</span>
                  </button>
                  
                  <button
                    onClick={() => setShowTeamChemistry(!showTeamChemistry)}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition-colors text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Chemistry</span>
                  </button>
                </>
              )}
              
              <div className="text-right">
                <div className="text-sm text-green-700">Current Streak</div>
                <div className="text-2xl font-bold text-green-600">{currentStreak} days 🔥</div>
              </div>
            </div>
          </div>

          {/* Enhanced AI Coach Section */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="relative flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-2xl animate-pulse">
                🤖
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">Your AI Coach</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setAiCoachPersonality('motivational')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        aiCoachPersonality === 'motivational' 
                          ? 'bg-white/30 text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      Motivational
                    </button>
                    <button
                      onClick={() => setAiCoachPersonality('analytical')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        aiCoachPersonality === 'analytical' 
                          ? 'bg-white/30 text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      Analytical
                    </button>
                    <button
                      onClick={() => setAiCoachPersonality('supportive')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        aiCoachPersonality === 'supportive' 
                          ? 'bg-white/30 text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      Supportive
                    </button>
                  </div>
                </div>
                <p className="text-green-100 text-lg leading-relaxed mb-4">{aiCoachMessage}</p>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setShowAIChat(true)}
                    className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full text-sm font-semibold transition-all backdrop-blur-sm text-white"
                  >
                    Ask Coach a Question
                  </button>
                  <button 
                    onClick={() => setAiCoachMessage(generateAICoachMessage())}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-semibold transition-all backdrop-blur-sm text-white"
                  >
                    New Message
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Player Progress with Position-Specific Data */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{playerLevel.name}</h3>
                <p className="text-green-700">
                  Level 12 • {playerLevel.xp}/{playerLevel.nextLevel} XP • 
                  {playerLevel.position} / {playerLevel.secondaryPosition}
                </p>
              </div>
              <div className="flex space-x-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{performanceMetrics.trainingEffectiveness}%</div>
                  <div className="text-xs text-gray-500">Training Effectiveness</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{performanceMetrics.gamePerformance}%</div>
                  <div className="text-xs text-gray-500">Game Performance</div>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-green-700">
              {playerLevel.nextLevel - playerLevel.xp} XP to next level
            </p>
          </div>
        </div>

        {/* Main Content Grid with Progressive Disclosure */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Training Categories - Main Content */}
          <div className="lg:col-span-3">
            {/* AI Recommendations Section */}
            {showAdvancedFeatures && aiRecommendations.length > 0 && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                <div className="relative">
                  <h3 className="text-xl font-bold text-white mb-4">🤖 AI Recommendations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiRecommendations.map((rec, index) => (
                      <div key={index} className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{rec.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rec.priority === 'high' ? 'bg-red-500 text-white' :
                            rec.priority === 'medium' ? 'bg-yellow-500 text-black' :
                            'bg-blue-500 text-white'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-blue-100 text-sm mb-2">{rec.description}</p>
                        <div className="text-xs text-blue-200 space-y-1">
                          <div>Impact: {rec.impact}</div>
                          <div>Duration: {rec.duration}</div>
                        </div>
                        <button className="w-full mt-3 bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm font-semibold transition-colors text-white">
                          Start Training
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Training Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              {Object.entries(trainingCategories).map(([key, category]) => {
                const completionRate = (category.completed / category.routes) * 100;
                return (
                  <div
                    key={key}
                    className={`bg-gradient-to-br ${category.color} rounded-2xl p-6 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl relative overflow-hidden group`}
                    onClick={() => handleStartTraining(key)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-4xl">{category.icon}</div>
                        <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-semibold">
                          {category.difficulty}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                      
                      {/* Progressive Disclosure: Show AI Insights on Hover */}
                      {showAdvancedFeatures && (
                        <div className="mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/20 rounded-lg p-3 mb-3">
                            <h4 className="text-sm font-semibold mb-2">AI Insights</h4>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>Strength:</span>
                                <span className="text-green-200">{category.aiInsights.strength}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Focus:</span>
                                <span className="text-yellow-200">{category.aiInsights.weakness}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{category.completed}/{category.routes}</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-white h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="text-sm opacity-80 mb-3">
                        Next unlock: {category.nextUnlock}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartTraining(key);
                          }}
                          className="bg-white/20 hover:bg-white/30 py-2 rounded-full font-semibold transition-all backdrop-blur-sm text-sm"
                        >
                          Start Training
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCategory(key);
                            setShowDrillLibrary(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 py-2 rounded-full font-semibold transition-all text-sm"
                        >
                          View Drills
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Team Chemistry Section - Progressive Disclosure */}
            {showTeamChemistry && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                <div className="relative">
                  <h3 className="text-xl font-bold text-white mb-4">👥 Team Chemistry Building</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamChemistry.teammates.map((teammate, index) => (
                      <div key={index} className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-white">{teammate.name}</h4>
                            <p className="text-purple-200 text-sm">{teammate.position}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">{teammate.chemistry}/10</div>
                            <div className="text-xs text-purple-200">Chemistry</div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-purple-100">
                          {teammate.communication && (
                            <div className="flex justify-between">
                              <span>Communication:</span>
                              <span>{teammate.communication}/10</span>
                            </div>
                          )}
                          {teammate.timing && (
                            <div className="flex justify-between">
                              <span>Timing:</span>
                              <span>{teammate.timing}/10</span>
                            </div>
                          )}
                          {teammate.snapTiming && (
                            <div className="flex justify-between">
                              <span>Snap Timing:</span>
                              <span>{teammate.snapTiming}/10</span>
                            </div>
                          )}
                        </div>
                        <button className="w-full mt-3 bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm font-semibold transition-colors text-white">
                          Invite to Practice
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-purple-200">Team Chemistry Trend: {teamChemistry.chemistryTrend}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Chemistry Analytics - Progressive Disclosure */}
            {showAnalytics && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">🧪 Advanced Chemistry Analytics</h3>
                <AdvancedChemistryAnalytics 
                  teamId={user?.teamId} 
                  playerId={user?.id}
                />
              </div>
            )}

            {/* Analytics Dashboard - Progressive Disclosure */}
            {showAnalytics && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Performance Analytics</h3>
                <AnalyticsDashboard />
              </div>
            )}
          </div>

          {/* Enhanced Sidebar with Progressive Disclosure */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">📊 This Week</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Workouts</span>
                  <span className="font-bold text-green-400">5/7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Time</span>
                  <span className="font-bold">4h 32m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Avg. Rating</span>
                  <span className="font-bold text-yellow-400">4.8/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Calories</span>
                  <span className="font-bold text-red-400">1,247</span>
                </div>
              </div>
            </div>

            {/* Enhanced Biometric Integration - Progressive Disclosure */}
            {showAdvancedFeatures && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">📊 Enhanced Biometric Insights</h3>
                <EnhancedBiometricIntegration 
                  teamId={user?.teamId} 
                  playerId={user?.id}
                />
              </div>
            )}

            {/* Weight Management - Progressive Disclosure */}
            {showAdvancedFeatures && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">⚖️ Weight Management</h3>
                <WeightManagement 
                  playerId={user?.id} 
                  position={playerLevel.position}
                />
              </div>
            )}

            {/* Performance Metrics - Progressive Disclosure */}
            {showAdvancedFeatures && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">🎯 Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Injury Risk</span>
                    <span className={`font-bold ${performanceMetrics.injuryRisk < 20 ? 'text-green-400' : 'text-red-400'}`}>
                      {performanceMetrics.injuryRisk}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Recovery Score</span>
                    <span className={`font-bold ${performanceMetrics.recoveryScore > 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {performanceMetrics.recoveryScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Team Chemistry</span>
                    <span className="font-bold text-purple-400">{performanceMetrics.teamChemistry}/10</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Access Tools */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">🛠️ Quick Access</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowDrillLibrary(true)}
                  className="p-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Drill Library
                </button>
                <button
                  onClick={() => setShowProgressTracker(true)}
                  className="p-3 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Progress
                </button>
                <button
                  onClick={() => setShowWeeklyChallenges(true)}
                  className="p-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Challenges
                </button>
                <button
                  onClick={() => setShowBuddySystem(true)}
                  className="p-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Buddies
                </button>
                <button
                  onClick={() => setShowWeightManagement(true)}
                  className="p-3 bg-orange-600 hover:bg-orange-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Weight
                </button>
                <button
                  onClick={() => setShowBiometrics(true)}
                  className="p-3 bg-teal-600 hover:bg-teal-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Biometrics
                </button>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">📅 Upcoming</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">Team Practice</p>
                    <p className="text-xs text-gray-300">Today, 6:00 PM</p>
                  </div>
                  <div className="text-xs bg-green-600 px-2 py-1 rounded-full">
                    Confirmed
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">Speed Training</p>
                    <p className="text-xs text-gray-300">Tomorrow, 7:00 AM</p>
                  </div>
                  <div className="text-xs bg-yellow-600 px-2 py-1 rounded-full">
                    Pending
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Modal */}
      {showAIChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">AI Coach Chat</h3>
              <button
                onClick={() => setShowAIChat(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 mb-4 h-32 overflow-y-auto">
              <p className="text-sm text-gray-700">
                "Hello! I'm your AI coach. Ask me anything about your training, performance, or get personalized recommendations."
              </p>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Ask your AI coach..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Community Hub Modal */}
      {showCommunity && (
        <CommunityHub onClose={() => setShowCommunity(false)} />
      )}
    </div>
  );
};

export default TrainingView;
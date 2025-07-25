import React, { useState, useEffect, useRef } from 'react';
import { useNeonDatabase } from '../contexts/NeonDatabaseContext';
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
// Removed direct import - will use dynamic import when needed

const TrainingView = () => {
  const { user } = useNeonDatabase();
  const [activeCategory, setActiveCategory] = useState('routes');
  const [currentStreak, setCurrentStreak] = useState(7);
  const [playerLevel, setPlayerLevel] = useState({ name: 'Route Runner Pro', xp: 2400, nextLevel: 3000 });
  const [aiCoachMessage, setAiCoachMessage] = useState('');
  const [showAchievement, setShowAchievement] = useState(false);
  const [communityFeed, setCommunityFeed] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrainingSession, setShowTrainingSession] = useState(false);
  const [showCommunityHub, setShowCommunityHub] = useState(false);
  const [showDrillLibrary, setShowDrillLibrary] = useState(false);
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [showWeeklyChallenges, setShowWeeklyChallenges] = useState(false);
  const [showOfflineWorkouts, setShowOfflineWorkouts] = useState(false);
  const [showBuddySystem, setShowBuddySystem] = useState(false);
  const [scheduledWorkouts, setScheduledWorkouts] = useState([]);
  const [biometricRecommendations, setBiometricRecommendations] = useState([]);
  const videoRef = useRef(null);

  // Training categories with enhanced data
  const trainingCategories = {
    routes: {
      name: 'Route Running',
      icon: '🏃',
      color: 'from-green-500 to-green-600',
      routes: 15,
      completed: 8,
      difficulty: 'Intermediate',
      nextUnlock: 'Double Move Routes'
    },
    plyometrics: {
      name: 'Plyometrics',
      icon: '⚡',
      color: 'from-green-500 to-green-600',
      routes: 12,
      completed: 5,
      difficulty: 'Beginner',
      nextUnlock: 'Explosive Power Drills'
    },
    sprints: {
      name: 'Speed Training',
      icon: '🏃‍♂️',
      color: 'from-green-500 to-green-600',
      routes: 8,
      completed: 6,
      difficulty: 'Advanced',
      nextUnlock: 'Elite Sprint Mechanics'
    },
    catching: {
      name: 'Catching',
      icon: '🎯',
      color: 'from-green-500 to-green-600',
      routes: 10,
      completed: 4,
      difficulty: 'Intermediate',
      nextUnlock: 'One-Handed Catches'
    },
    strength: {
      name: 'Strength',
      icon: '💪',
      color: 'from-green-500 to-green-600',
      routes: 20,
      completed: 12,
      difficulty: 'Beginner',
      nextUnlock: 'Power Lifting Fundamentals'
    },
    recovery: {
      name: 'Recovery',
      icon: '🧘',
      color: 'from-green-500 to-green-600',
      routes: 6,
      completed: 3,
      difficulty: 'Beginner',
      nextUnlock: 'Advanced Mobility Work'
    }
  };

  // AI Coach messages based on user progress and time
  const aiCoachMessages = [
    "Ready to dominate today's route session? Your precision has improved 23% this week! 🔥",
    "I noticed you're strongest in the mornings. Perfect time for speed work! ⚡",
    "Your form on that last slant route was textbook perfect. Let's build on that momentum! 🎯",
    "Based on your sleep data, I recommend focusing on technique over intensity today. Smart training wins games! 🧠",
    "You're 2 workouts away from unlocking Elite Sprint Mechanics. Push through! 💪"
  ];

  // Sample community feed
  const sampleCommunityFeed = [
    {
      id: 1,
      user: 'Alex M.',
      avatar: '🏃‍♂️',
      action: 'crushed their 40-yard dash',
      time: '2m ago',
      achievement: 'New Personal Best: 4.3s',
      likes: 12
    },
    {
      id: 2,
      user: 'Maya R.',
      avatar: '⚡',
      action: 'completed Week 3 Plyometrics',
      time: '15m ago',
      achievement: 'Consistency Streak: 14 days',
      likes: 8
    },
    {
      id: 3,
      user: 'Coach Johnson',
      avatar: '🎯',
      action: 'shared a new route breakdown',
      time: '1h ago',
      achievement: 'Pro Tip: Post Route Timing',
      likes: 24
    }
  ];

  // Daily challenges
  const dailyChallenges = [
    {
      title: 'Speed Demon Challenge',
      description: 'Complete 5 sprint drills with perfect form',
      reward: '50 XP + Speed Badge',
      difficulty: 'Medium',
      timeLeft: '6h 23m'
    },
    {
      title: 'Route Master',
      description: 'Run 3 different routes with 90%+ accuracy',
      reward: '75 XP + Precision Badge',
      difficulty: 'Hard',
      timeLeft: '12h 45m'
    }
  ];

  // Achievements system
  const achievements = [
    { name: 'Speed Demon', icon: '⚡', unlocked: true },
    { name: 'Perfect Form', icon: '🎯', unlocked: true },
    { name: 'Team Player', icon: '🌟', unlocked: false },
    { name: 'Consistency King', icon: '🔥', unlocked: true },
    { name: 'Route Master', icon: '🏃', unlocked: false }
  ];

  useEffect(() => {
    // Track training view load
    hybridAnalyticsService.trackPageView({
      page_title: 'Training Dashboard',
      user_level: playerLevel.name,
      current_streak: currentStreak
    });

    // Simulate loading
    setTimeout(() => setIsLoading(false), 1500);
    
    // Set random AI coach message
    setAiCoachMessage(aiCoachMessages[Math.floor(Math.random() * aiCoachMessages.length)]);
    
    // Set community feed
    setCommunityFeed(sampleCommunityFeed);
    
    // Set daily challenge
    setDailyChallenge(dailyChallenges[Math.floor(Math.random() * dailyChallenges.length)]);
  }, []);

  const handleStartTraining = (category) => {
    // Track training session start
    hybridAnalyticsService.trackUserAction('training_started', {
      training_category: category,
      user_level: playerLevel.name,
      difficulty: trainingCategories[category]?.difficulty,
      current_streak: currentStreak
    });

    setActiveCategory(category);
    setShowTrainingSession(true);
    setShowAchievement(true);
    setTimeout(() => setShowAchievement(false), 3000);
  };

  const handleCompleteTraining = (results) => {
    // Track training session completion
    hybridAnalyticsService.trackUserAction('training_completed', {
      training_category: activeCategory,
      results: results,
      xp_gained: 100,
      session_duration: results?.duration || 0,
      performance_score: results?.score || 0
    });

    setShowTrainingSession(false);
    // Update user progress, XP, etc.
    console.log('Training completed:', results);
    setPlayerLevel(prev => ({
      ...prev,
      xp: prev.xp + 100 // Add XP for completion
    }));
  };

  const handleSelectDrill = (drill) => {
    setSelectedDrill(drill);
  };

  const handleScheduleWorkout = (workout) => {
    setScheduledWorkouts(prev => [...prev, workout]);
    console.log('Scheduled workout:', workout);
  };

  const progressPercentage = (playerLevel.xp / playerLevel.nextLevel) * 100;

  // Show drill detail if selected
  if (selectedDrill) {
    return (
      <DrillDetail
        drill={selectedDrill}
        onBack={() => setSelectedDrill(null)}
        onStartDrill={(drill) => console.log('Starting drill:', drill)}
      />
    );
  }

  // Show drill library if active
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
            onSelectDrill={handleSelectDrill}
          />
        </div>
      </div>
    );
  }

  // Show calendar if active
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
          <TrainingCalendar 
            scheduledWorkouts={scheduledWorkouts}
            onScheduleWorkout={handleScheduleWorkout}
          />
        </div>
      </div>
    );
  }

  // Show progress tracker if active
  if (showProgressTracker) {
    return (
      <ProgressTracker onBack={() => setShowProgressTracker(false)} />
    );
  }

  // Show weekly challenges if active
  if (showWeeklyChallenges) {
    return (
      <WeeklyChallenges onBack={() => setShowWeeklyChallenges(false)} />
    );
  }

  // Show offline workouts if active
  if (showOfflineWorkouts) {
    return (
      <OfflineWorkouts onBack={() => setShowOfflineWorkouts(false)} />
    );
  }
  // Show buddy system if active
  if (showBuddySystem) {
    return (
      <BuddySystem onBack={() => setShowBuddySystem(false)} />
    );
  }

  // Show training session if active
  if (showTrainingSession) {
    return (
      <TrainingSession
        category={activeCategory}
        onBack={() => setShowTrainingSession(false)}
        onComplete={handleCompleteTraining}
      />
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-green-100 text-gray-900">
      {/* Achievement Popup */}
      {showAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 rounded-3xl transform animate-bounce">
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-white mb-2">Achievement Unlocked!</h3>
              <p className="text-white opacity-90">Training Session Started</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Header with AI Coach */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                Training Ecosystem
              </h1>
              <p className="text-green-700 mt-2">AI-Powered Flag Football Mastery</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCalendar(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Calendar</span>
              </button>
              <button
                onClick={() => setShowDrillLibrary(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Drills</span>
              </button>
              <button
                onClick={() => setShowProgressTracker(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Progress</span>
              </button>
              <button
                onClick={() => setShowWeeklyChallenges(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Challenges</span>
              </button>
              <button
                onClick={() => setShowOfflineWorkouts(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Offline</span>
              </button>
              <button
                onClick={() => setShowBuddySystem(true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Buddies</span>
              </button>
              <div className="text-right">
                <div className="text-sm text-green-700">Current Streak</div>
                <div className="text-2xl font-bold text-green-600">{currentStreak} days 🔥</div>
              </div>
            </div>
          </div>

          {/* AI Coach Section */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="relative flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-2xl animate-pulse">
                🤖
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 text-white">Your AI Coach</h3>
                <p className="text-green-100 text-lg leading-relaxed">{aiCoachMessage}</p>
                <button className="mt-4 bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full text-sm font-semibold transition-all backdrop-blur-sm text-white">
                  Ask Coach a Question
                </button>
              </div>
            </div>
          </div>

          {/* Player Progress */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{playerLevel.name}</h3>
                <p className="text-green-700">Level 12 • {playerLevel.xp}/{playerLevel.nextLevel} XP</p>
              </div>
              <div className="flex space-x-2">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                      achievement.unlocked 
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                        : 'bg-gray-600'
                    }`}
                    title={achievement.name}
                  >
                    {achievement.icon}
                  </div>
                ))}
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Training Categories - Main Content */}
          <div className="lg:col-span-3">
            {/* Daily Challenge */}
            {dailyChallenge && (
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">🎯 Daily Challenge</h3>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm text-white">
                      {dailyChallenge.timeLeft} left
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-white">{dailyChallenge.title}</h4>
                  <p className="text-green-100 mb-4">{dailyChallenge.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-200 font-semibold">{dailyChallenge.reward}</span>
                    <button className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full font-semibold transition-all text-white">
                      Accept Challenge
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Training Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              {Object.entries(trainingCategories).map(([key, category]) => {
                const completionRate = (category.completed / category.routes) * 100;
                return (
                  <div
                    key={key}
                    className={`bg-gradient-to-br ${category.color} rounded-2xl p-6 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl relative overflow-hidden group`}
                    onClick={() => {
                      setActiveCategory(key);
                      handleStartTraining(key);
                    }}
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
                          onClick={() => {
                            setActiveCategory(key);
                            handleStartTraining(key);
                          }}
                          className="bg-white/20 hover:bg-white/30 py-2 rounded-full font-semibold transition-all backdrop-blur-sm text-sm"
                        >
                          Start Training
                        </button>
                        <button 
                          onClick={() => {
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

            {/* Featured Training Video */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">🎥 Featured Training Video</h3>
              <div className="bg-gray-800 rounded-xl aspect-video mb-4 relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.267 14.68c-.184 0-.308-.018-.372-.036A1.533 1.533 0 0 1 6.5 13.133V6.867a1.533 1.533 0 0 1 1.395-1.511c.064-.018.188-.036.372-.036.964 0 1.733.794 1.733 1.774v5.804c0 .98-.769 1.774-1.733 1.774z"/>
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h4 className="font-semibold text-lg mb-1">Elite Route Running: The Double Move</h4>
                  <p className="text-sm text-gray-300">Master the art of deception with NFL techniques</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-300">
                  <span>Duration: 12:34</span>
                  <span>•</span>
                  <span>Difficulty: Advanced</span>
                  <span>•</span>
                  <span>👁 2.3k views</span>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                  Watch Now
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Community & Stats */}
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

            {/* Community Feed */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">👥 Training Buddies</h3>
                <span className="text-green-400 text-sm">🟢 12 online</span>
              </div>
              <div className="space-y-4">
                {communityFeed.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm">
                      {activity.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">{activity.user}</span>{' '}
                        <span className="text-gray-300">{activity.action}</span>
                      </p>
                      <p className="text-xs text-blue-300 mt-1">{activity.achievement}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{activity.time}</span>
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <span>❤️</span>
                          <span>{activity.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowCommunityHub(true)}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Open Community Hub
              </button>
            </div>

            {/* Biometric Integration */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">📊 Biometric Insights</h3>
              <BiometricIntegration 
                onRecommendation={setBiometricRecommendations}
              />
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

      {/* Community Hub Modal */}
      {showCommunityHub && (
        <CommunityHub onClose={() => setShowCommunityHub(false)} />
      )}
    </div>
  );
};

export default TrainingView;
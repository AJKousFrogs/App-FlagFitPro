import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePocket } from '../contexts/PocketContext';
import { useTraining } from '../contexts/TrainingContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import ThemeToggle from '../components/ThemeToggle';

const DashboardView = React.memo(function DashboardView() {
  const { user, logout, pb } = usePocket();
  const { stats, sessions, isLoading: trainingLoading } = useTraining();
  const { isLoading: analyticsLoading } = useAnalytics();
  const location = useLocation();
  
  // Smart Goal Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [goalData, setGoalData] = useState({
    objective: '',
    timeframe: '',
    targetValue: '',
    gameDate: ''
  });
  const [hasActiveGoal, setHasActiveGoal] = useState(false);
  const [goalProgress, setGoalProgress] = useState(0);
  
  // Training Detail Modal State
  const [showTrainingDetail, setShowTrainingDetail] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  
  // Enhanced Training Features State
  const [trainingProgress, setTrainingProgress] = useState({});
  const [exerciseNotes, setExerciseNotes] = useState({});
  const [difficultyRating, setDifficultyRating] = useState({});
  const [activeTimer, setActiveTimer] = useState(null);
  const [timeSpent, setTimeSpent] = useState({});
  const [timerStart, setTimerStart] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [weeklyScheduleState, setWeeklyScheduleState] = useState([]);
  const [todayProgress, setTodayProgress] = useState({
    routesCompleted: 8,
    totalRoutes: 10,
    averageTime: 2.4,
    accuracy: 87,
    formScore: 92
  });
  
  // Refs for cleanup
  const timerRef = useRef(null);
  const notificationRef = useRef(null);

  // Training calendar data with detailed breakdowns
  const weeklySchedule = useMemo(() => [
    { day: 'SUN', date: 13, activities: [] },
    { 
      day: 'MON', 
      date: 14, 
      activities: [{ 
        id: 'mon-practice',
        time: '19:00', 
        title: 'Team Practice', 
        type: 'Training', 
        category: 'training', 
        completed: true,
        duration: '90 min',
        location: 'Training Field',
        exercises: [
          { name: 'Warm-up Jog', duration: '10 min', completed: true },
          { name: 'Route Running', duration: '30 min', completed: true },
          { name: 'Flag Pulling Drills', duration: '20 min', completed: true },
          { name: 'Scrimmage', duration: '25 min', completed: true },
          { name: 'Cool-down Stretch', duration: '5 min', completed: true }
        ]
      }] 
    },
    { 
      day: 'TUE', 
      date: 15, 
      activities: [{ 
        id: 'tue-conditioning',
        time: '19:00', 
        title: 'Conditioning', 
        type: 'Sprints/Agility', 
        category: 'conditioning', 
        completed: true,
        duration: '60 min',
        location: 'Training Field',
        exercises: [
          { name: 'Dynamic Warm-up', duration: '10 min', completed: true },
          { name: '40-Yard Sprints', duration: '15 min', completed: true },
          { name: 'Ladder Drills', duration: '15 min', completed: true },
          { name: 'Cone Drills', duration: '15 min', completed: true },
          { name: 'Cool-down', duration: '5 min', completed: true }
        ]
      }] 
    },
    { 
      day: 'WED', 
      date: 16, 
      activities: [{ 
        id: 'wed-recovery',
        time: '08:00', 
        title: 'Recovery Day', 
        type: 'Foam Rolling', 
        category: 'recovery', 
        completed: false,
        duration: '45 min',
        location: 'Home/Gym',
        exercises: [
          { name: 'Light Stretching', duration: '10 min', completed: false },
          { name: 'Foam Rolling - Legs', duration: '15 min', completed: false },
          { name: 'Foam Rolling - Back', duration: '10 min', completed: false },
          { name: 'Mobility Exercises', duration: '10 min', completed: false }
        ]
      }] 
    },
    { 
      day: 'THU', 
      date: 17, 
      activities: [{ 
        id: 'thu-game',
        time: '18:30', 
        title: 'Game vs Lightning', 
        type: 'Game Day', 
        category: 'game', 
        completed: false,
        duration: '120 min',
        location: 'Lightning Field',
        exercises: [
          { name: 'Pre-game Warm-up', duration: '20 min', completed: false },
          { name: 'Team Meeting', duration: '10 min', completed: false },
          { name: 'Game Play', duration: '60 min', completed: false },
          { name: 'Post-game Cool-down', duration: '10 min', completed: false },
          { name: 'Team Debrief', duration: '20 min', completed: false }
        ]
      }] 
    },
    { 
      day: 'FRI', 
      date: 18, 
      activities: [{ 
        id: 'fri-yoga',
        time: '10:00', 
        title: 'Yoga/Stretching', 
        type: 'Flexibility', 
        category: 'recovery', 
        completed: false,
        duration: '60 min',
        location: 'Training Field',
        exercises: [
          { name: 'Breathing Exercises', duration: '5 min', completed: false },
          { name: 'Sun Salutations', duration: '15 min', completed: false },
          { name: 'Hip Flexibility', duration: '15 min', completed: false },
          { name: 'Hamstring Stretches', duration: '10 min', completed: false },
          { name: 'Cool-down & Meditation', duration: '15 min', completed: false }
        ]
      }] 
    },
    { 
      day: 'SAT', 
      date: 19, 
      activities: [{ 
        id: 'sat-rest',
        time: '', 
        title: 'Rest Day', 
        type: 'Complete Rest', 
        category: 'rest', 
        completed: false,
        duration: 'All day',
        location: 'Home',
        exercises: [
          { name: 'Light Walking', duration: '30 min', completed: false },
          { name: 'Hydration Focus', duration: 'All day', completed: false },
          { name: 'Nutrition Planning', duration: '30 min', completed: false },
          { name: 'Mental Recovery', duration: 'All day', completed: false }
        ]
      }] 
    }
  ], []);

  // Initialize weekly schedule state
  useEffect(() => {
    try {
      setWeeklyScheduleState(weeklySchedule);
    } catch (error) {
      console.error('Error initializing weekly schedule:', error);
      setWeeklyScheduleState([]);
    }
  }, [weeklySchedule]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!showTrainingDetail) return;
      
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          handleCloseTrainingDetail();
          break;
        case ' ':
          event.preventDefault();
          if (selectedTraining && selectedTraining.exercises && selectedTraining.exercises.length > 0) {
            // Toggle first incomplete exercise
            const firstIncomplete = selectedTraining.exercises.findIndex(ex => ex && !ex.completed);
            if (firstIncomplete !== -1) {
              handleToggleExercise(firstIncomplete);
            }
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          // Navigate to previous exercise
          break;
        case 'ArrowDown':
          event.preventDefault();
          // Navigate to next exercise
          break;
        case 't':
          event.preventDefault();
          // Start/stop timer for current exercise
          if (activeTimer !== null) {
            startExerciseTimer(activeTimer);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showTrainingDetail, selectedTraining, activeTimer]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (notificationRef.current) {
        clearTimeout(notificationRef.current);
      }
    };
  }, []);

  // Request notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Smart notifications
  useEffect(() => {
    const checkUpcomingTrainings = () => {
      try {
        const now = new Date();
        const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
        
        (weeklyScheduleState || []).forEach(day => {
          (day.activities || []).forEach(activity => {
            if (activity.time) {
              const [hours, minutes] = activity.time.split(':').map(Number);
              const activityTime = new Date();
              activityTime.setHours(hours, minutes, 0, 0);
              
              if (activityTime > now && activityTime <= in30Minutes && !activity.completed) {
                // Show notification
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(`Upcoming Training: ${activity.title}`, {
                    body: `Starting in 30 minutes at ${activity.time}`,
                    icon: '/favicon.ico'
                  });
                }
              }
            }
          });
        });
      } catch (error) {
        console.error('Error checking upcoming trainings:', error);
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkUpcomingTrainings, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [weeklyScheduleState]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout]);

  // Mock player data (this would come from user profile in real app)
  const playerMetrics = useMemo(() => ({
    height: '1.78 m',
    weight: '75 kg',
    bmi: '23.7',
    bmiStatus: 'Acceptable',
    muscleMass: '77%',
    muscleMassStatus: 'Optimal',
    fortyYardDash: '4.85 sec',
    dashStatus: 'Good',
    lastUpdated: '2024-07-13'
  }), []);

  // Smart Goal Wizard Functions
  const objectives = [
    { id: 'speed', name: 'Speed', description: 'Improve 40-yard dash time', icon: '⚡', color: 'blue' },
    { id: 'accuracy', name: 'Accuracy', description: 'Increase route precision', icon: '🎯', color: 'green' },
    { id: 'conditioning', name: 'Conditioning', description: 'Build endurance', icon: '💪', color: 'purple' },
    { id: 'agility', name: 'Agility', description: 'Enhance quickness', icon: '🔄', color: 'orange' }
  ];

  const timeframes = [
    { id: '1week', name: '1 Week', description: 'Quick improvement' },
    { id: '2weeks', name: '2 Weeks', description: 'Moderate progress' },
    { id: '1month', name: '1 Month', description: 'Significant change' },
    { id: 'season', name: 'Season Goal', description: 'Long-term target' }
  ];

  const handleWizardNext = () => {
    if (wizardStep < 4) {
      setWizardStep(wizardStep + 1);
    }
  };

  const handleWizardBack = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  const handleCreateGoal = () => {
    setHasActiveGoal(true);
    setGoalProgress(15); // Initial progress
    setShowWizard(false);
    setWizardStep(1);
  };

  const handleDismissGoal = () => {
    setHasActiveGoal(false);
    setGoalProgress(0);
    setGoalData({
      objective: '',
      timeframe: '',
      targetValue: '',
      gameDate: ''
    });
  };

  // Data Persistence Functions
  const saveProgressToPocketBase = async (trainingId, exercises, notes, ratings) => {
    try {
      if (!pb || !user) return;
      
      const progressData = {
        userId: user.id,
        trainingId,
        exercises,
        notes,
        ratings,
        completedAt: new Date().toISOString(),
        totalTimeSpent: Object.values(timeSpent).reduce((a, b) => a + b, 0)
      };
      
      // Save to localStorage as backup
      const key = `training_progress_${trainingId}`;
      localStorage.setItem(key, JSON.stringify(progressData));
      
      // Update training progress state
      setTrainingProgress(prev => ({
        ...prev,
        [trainingId]: progressData
      }));
      
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const loadProgressFromStorage = (trainingId) => {
    try {
      const key = `training_progress_${trainingId}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading progress:', error);
      return null;
    }
  };

  // Real-time Progress Sync
  const updateTodayProgressMetrics = () => {
    try {
      const today = new Date().toDateString();
      const todayActivities = (weeklyScheduleState || []).flatMap(day => day.activities || [])
        .filter(activity => new Date().toDateString() === today);
      
      const completedCount = todayActivities.filter(activity => activity.completed).length;
      const totalCount = todayActivities.length;
      
      setTodayProgress(prev => ({
        ...prev,
        routesCompleted: completedCount,
        totalRoutes: Math.max(totalCount, 10) // Fallback to 10 if no activities
      }));
    } catch (error) {
      console.error('Error updating progress metrics:', error);
    }
  };

  const checkTrainingCompletion = (trainingId, exercises) => {
    try {
      if (!exercises || !Array.isArray(exercises)) return;
      
      const allComplete = exercises.every(ex => ex.completed);
      
      if (allComplete) {
        // Update calendar status
        setWeeklyScheduleState(prev => 
          (prev || []).map(day => ({
            ...day,
            activities: (day.activities || []).map(activity => 
              activity.id === trainingId 
                ? { ...activity, completed: true }
                : activity
            )
          }))
        );
        
        // Update today's progress
        updateTodayProgressMetrics();
        
        // Trigger celebration
        triggerCompletionCelebration(trainingId);
        
        // Update achievement progress
        updateAchievementProgress();
      }
    } catch (error) {
      console.error('Error checking training completion:', error);
    }
  };

  // Completion Celebration
  const triggerCompletionCelebration = (trainingId) => {
    const messages = [
      "🎉 Awesome work! Training completed!",
      "💪 You're crushing it! Great job!",
      "🔥 Training session complete! You're unstoppable!",
      "⚡ Excellent effort! Keep it up!",
      "🏆 Training completed! You're a champion!"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setCompletionMessage(randomMessage);
    setShowCelebration(true);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };

  const updateAchievementProgress = () => {
    // Update goal progress if active
    if (hasActiveGoal) {
      setGoalProgress(prev => Math.min(prev + 10, 100));
    }
  };

  // Timer Functions
  const startExerciseTimer = (exerciseIndex) => {
    try {
      if (!selectedTraining || !selectedTraining.id) return;
      
      if (activeTimer === exerciseIndex) {
        // Stop timer
        const elapsed = Date.now() - timerStart;
        setTimeSpent(prev => ({
          ...prev,
          [`${selectedTraining.id}_${exerciseIndex}`]: (prev[`${selectedTraining.id}_${exerciseIndex}`] || 0) + elapsed
        }));
        setActiveTimer(null);
        setTimerStart(null);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        // Start timer
        setActiveTimer(exerciseIndex);
        setTimerStart(Date.now());
        
        timerRef.current = setInterval(() => {
          // Force re-render to update timer display
          setTimerStart(prev => prev);
        }, 1000);
      }
    } catch (error) {
      console.error('Error with exercise timer:', error);
    }
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCurrentExerciseTime = (exerciseIndex) => {
    try {
      if (!selectedTraining || exerciseIndex === undefined) return 0;
      
      const baseTime = timeSpent[`${selectedTraining.id}_${exerciseIndex}`] || 0;
      const currentTime = activeTimer === exerciseIndex && timerStart 
        ? Date.now() - timerStart 
        : 0;
      return baseTime + currentTime;
    } catch (error) {
      console.error('Error getting exercise time:', error);
      return 0;
    }
  };

  // Enhanced Training Detail Modal Functions
  const handleTrainingClick = (activity) => {
    try {
      if (!activity) return;
      
      const savedProgress = loadProgressFromStorage(activity.id);
      
      if (savedProgress && savedProgress.exercises) {
        // Restore saved progress
        activity.exercises = savedProgress.exercises;
        setExerciseNotes(savedProgress.notes || {});
        setDifficultyRating(savedProgress.ratings || {});
        setTimeSpent(prev => ({ ...prev, ...(savedProgress.timeSpent || {}) }));
      }
      
      setSelectedTraining(activity);
      setShowTrainingDetail(true);
    } catch (error) {
      console.error('Error opening training detail:', error);
    }
  };

  const handleCloseTrainingDetail = () => {
    // Stop any active timer
    if (activeTimer !== null) {
      startExerciseTimer(activeTimer);
    }
    
    // Save progress before closing
    if (selectedTraining) {
      saveProgressToPocketBase(
        selectedTraining.id,
        selectedTraining.exercises,
        exerciseNotes,
        difficultyRating
      );
    }
    
    setShowTrainingDetail(false);
    setSelectedTraining(null);
    setActiveTimer(null);
    setTimerStart(null);
  };

  const handleToggleExercise = (exerciseIndex) => {
    try {
      if (!selectedTraining || !selectedTraining.exercises) return;
      
      const updatedExercises = selectedTraining.exercises.map((exercise, index) => 
        index === exerciseIndex ? { ...exercise, completed: !exercise.completed } : exercise
      );
      
      const updatedTraining = { ...selectedTraining, exercises: updatedExercises };
      setSelectedTraining(updatedTraining);
      
      // Check for completion
      checkTrainingCompletion(selectedTraining.id, updatedExercises);
      
      // Save progress
      saveProgressToPocketBase(
        selectedTraining.id,
        updatedExercises,
        exerciseNotes,
        difficultyRating
      );
    } catch (error) {
      console.error('Error toggling exercise:', error);
    }
  };

  // Notes and Rating Functions
  const handleExerciseNote = (exerciseIndex, note) => {
    try {
      if (!selectedTraining) return;
      
      const key = `${selectedTraining.id}_${exerciseIndex}`;
      setExerciseNotes(prev => ({
        ...prev,
        [key]: note
      }));
    } catch (error) {
      console.error('Error saving exercise note:', error);
    }
  };

  const handleDifficultyRating = (exerciseIndex, rating) => {
    try {
      if (!selectedTraining) return;
      
      const key = `${selectedTraining.id}_${exerciseIndex}`;
      setDifficultyRating(prev => ({
        ...prev,
        [key]: rating
      }));
    } catch (error) {
      console.error('Error saving difficulty rating:', error);
    }
  };

  // Contextual Actions
  const handleRescheduleTraining = (trainingId, newDate) => {
    // Implementation for rescheduling
    console.log('Reschedule training:', trainingId, 'to', newDate);
  };

  const handleSkipExercise = (exerciseIndex) => {
    if (selectedTraining) {
      const updatedExercises = selectedTraining.exercises.map((exercise, index) => 
        index === exerciseIndex ? { ...exercise, skipped: true } : exercise
      );
      setSelectedTraining({ ...selectedTraining, exercises: updatedExercises });
    }
  };

  const handleAddCustomExercise = (exerciseName, duration) => {
    if (selectedTraining) {
      const newExercise = {
        name: exerciseName,
        duration,
        completed: false,
        custom: true
      };
      const updatedExercises = [...selectedTraining.exercises, newExercise];
      setSelectedTraining({ ...selectedTraining, exercises: updatedExercises });
    }
  };

  if (trainingLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        {/* Header */}
        <header className="bg-card border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo and Navigation */}
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">🏈</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{import.meta.env.VITE_APP_NAME || 'FlagFit Pro'}</h1>
                    <p className="text-sm text-muted-foreground">AI-Powered Flag Football Mastery</p>
                  </div>
                </div>
                
                <nav className="hidden md:flex space-x-2">
                  <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z" />
                    </svg>
                    <span>📅 Calendar</span>
                  </button>
                  <Link 
                    to="/training" 
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold text-white transition-colors"
                  >
                    <span>💪 Drills</span>
                  </Link>
                  <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold text-white transition-colors">
                    <span>📈 Progress</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg font-semibold text-white transition-colors">
                    <span>🏆 Challenges</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg font-semibold text-white transition-colors">
                    <span>💾 Offline</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold text-white transition-colors">
                    <span>👥 Buddies</span>
                  </button>
                </nav>
              </div>

              {/* User Actions */}
              <div className="flex items-center space-x-4">
                <div className="text-right hidden md:block">
                  <div className="text-sm text-muted-foreground">Current Streak</div>
                  <div className="text-2xl font-bold text-yellow-500">7 days 🔥</div>
                </div>
                
                <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                <ThemeToggle />

                <Avatar className="h-10 w-10 cursor-pointer hover:scale-110 transition-transform duration-200 ring-2 ring-white/20">
                  <AvatarImage src={user?.avatar} alt={user?.name || user?.email} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'D'}
                  </AvatarFallback>
                </Avatar>

                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* AI Coach Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🧠</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Your AI Coach</h2>
                <p className="text-purple-100">Based on your sleep data, I recommend focusing on technique over intensity today. Smart training wins games! 🧠</p>
              </div>
            </div>
            <button className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
              Ask Coach a Question
            </button>
          </div>
        </div>

        {/* Level Progress Section */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">Route Runner Pro</h3>
              <p className="text-gray-300">Level 12 • 2400/3000 XP</p>
            </div>
            <div className="flex space-x-2">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="font-bold">🥇</span>
              </div>
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="font-bold">⚡</span>
              </div>
              <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="font-bold">⭐</span>
              </div>
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <span className="font-bold">🔥</span>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="font-bold">🏆</span>
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full" style={{width: '80%'}}></div>
          </div>
          <p className="text-gray-300 text-sm">600 XP to next level</p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Daily Challenge */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">⏱ Daily Challenge</h3>
                  <span className="text-pink-100 text-sm">12h 45m left</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Route Master</h4>
                <p className="text-pink-100 mb-4">Run 3 different routes with 90%+ accuracy</p>
                <div className="flex items-center justify-between">
                  <div className="text-yellow-300 font-semibold">75 XP + Precision Badge</div>
                  <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                    Accept Challenge
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* This Week Stats */}
          <div className="bg-gradient-to-r from-gray-800 to-blue-900 rounded-3xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">📊 This Week</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Workouts</span>
                <span className="font-bold">5/7</span>
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
                <span className="font-bold text-orange-400">1,247</span>
              </div>
            </div>
          </div>
        </div>

        {/* Training Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* Route Running */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏃</span>
                </div>
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">Intermediate</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Route Running</h3>
              <div className="mb-4">
                <p className="text-blue-100 text-sm mb-2">Progress</p>
                <div className="w-full bg-white/20 rounded-full h-2 mb-1">
                  <div className="bg-white h-2 rounded-full" style={{width: '53%'}}></div>
                </div>
                <p className="text-blue-100 text-xs">8/15</p>
              </div>
              <p className="text-blue-100 text-sm mb-4">Next unlock: Double Move Routes</p>
              <div className="flex space-x-2">
                <Link to="/training" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Start Training
                </Link>
                <button className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  View Drills
                </button>
              </div>
            </div>
          </div>

          {/* Plyometrics */}
          <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">Beginner</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Plyometrics</h3>
              <div className="mb-4">
                <p className="text-orange-100 text-sm mb-2">Progress</p>
                <div className="w-full bg-white/20 rounded-full h-2 mb-1">
                  <div className="bg-white h-2 rounded-full" style={{width: '42%'}}></div>
                </div>
                <p className="text-orange-100 text-xs">5/12</p>
              </div>
              <p className="text-orange-100 text-sm mb-4">Next unlock: Explosive Power Drills</p>
              <div className="flex space-x-2">
                <Link to="/training" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Start Training
                </Link>
                <button className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  View Drills
                </button>
              </div>
            </div>
          </div>

          {/* Speed Training */}
          <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏃</span>
                </div>
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">Advanced</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Speed Training</h3>
              <div className="mb-4">
                <p className="text-red-100 text-sm mb-2">Progress</p>
                <div className="w-full bg-white/20 rounded-full h-2 mb-1">
                  <div className="bg-white h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
                <p className="text-red-100 text-xs">6/8</p>
              </div>
              <p className="text-red-100 text-sm mb-4">Next unlock: Elite Sprint Mechanics</p>
              <div className="flex space-x-2">
                <Link to="/training" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Start Training
                </Link>
                <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  View Drills
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Training Buddies Section */}
        <div className="bg-gradient-to-r from-gray-800 to-purple-900 rounded-3xl p-6 text-white">
          <h3 className="text-lg font-bold mb-4">👥 Training Buddies</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium">12</span>
                <span className="text-gray-300 text-sm">online</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">AM</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Alex M.</p>
                    <p className="text-xs text-gray-300">crushed their 40-yard dash</p>
                  </div>
                  <div className="text-red-400">❤️ 12</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </TooltipProvider>
  );
});

export default DashboardView;

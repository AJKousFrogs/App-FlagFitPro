import React, { useState, useEffect, useRef, useCallback } from 'react';

const TrainingSession = ({ category, onBack, onComplete }) => {
  const [currentDrill, setCurrentDrill] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [formScore, setFormScore] = useState(0);
  const [showAROverlay, setShowAROverlay] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [workoutMode, setWorkoutMode] = useState(false);
  const [autoPreload, setAutoPreload] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [nextDrillPreview, setNextDrillPreview] = useState(null);
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [fatigueLevel, setFatigueLevel] = useState(0);
  const [restRecommendations, setRestRecommendations] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const nextDrillTimerRef = useRef(null);

  // Enhanced Training drills data with progressive difficulty
  const drillSets = {
    routes: [
      {
        name: 'Quick Slant',
        description: 'Sharp 5-yard cut at precise timing',
        duration: 30,
        reps: 8,
        difficulty: 'Beginner',
        keyPoints: ['Sharp plant foot', 'Quick hip turn', 'Hands ready'],
        video: '/videos/quick-slant.mp4',
        arMarkers: [
          { x: 50, y: 60, label: 'Plant foot here' },
          { x: 70, y: 40, label: 'Cut direction' }
        ],
        audioCues: ['Plant', 'Cut', 'Accelerate'],
        vibrationPattern: [100, 200, 100],
        nextDrill: 'Double Move',
        restTime: 60,
        targetHeartRate: 140
      },
      {
        name: 'Double Move',
        description: 'Fake inside, break outside at 8 yards',
        duration: 45,
        reps: 6,
        difficulty: 'Advanced',
        keyPoints: ['Sell the first move', 'Explosive second cut', 'Maintain speed'],
        video: '/videos/double-move.mp4',
        arMarkers: [
          { x: 50, y: 70, label: 'First fake' },
          { x: 80, y: 30, label: 'Real break' }
        ],
        audioCues: ['Fake', 'Break', 'Go'],
        vibrationPattern: [200, 100, 300],
        nextDrill: 'Post Route',
        restTime: 90,
        targetHeartRate: 160
      },
      {
        name: 'Post Route',
        description: 'Deep route with precise timing',
        duration: 60,
        reps: 4,
        difficulty: 'Advanced',
        keyPoints: ['Maintain speed', 'Look for ball', 'Adjust to coverage'],
        video: '/videos/post-route.mp4',
        arMarkers: [
          { x: 50, y: 20, label: 'Break point' },
          { x: 80, y: 10, label: 'Deep target' }
        ],
        audioCues: ['Go', 'Break', 'Ball'],
        vibrationPattern: [300, 200, 400],
        nextDrill: null,
        restTime: 120,
        targetHeartRate: 170
      }
    ],
    plyometrics: [
      {
        name: 'Box Jumps',
        description: 'Explosive vertical jumps',
        duration: 45,
        reps: 10,
        difficulty: 'Intermediate',
        keyPoints: ['Soft landing', 'Full extension', 'Quick reset'],
        video: '/videos/box-jumps.mp4',
        arMarkers: [
          { x: 50, y: 50, label: 'Jump target' },
          { x: 50, y: 80, label: 'Landing zone' }
        ],
        audioCues: ['Ready', 'Jump', 'Land'],
        vibrationPattern: [150, 250, 150],
        nextDrill: 'Depth Jumps',
        restTime: 75,
        targetHeartRate: 150
      }
    ],
    sprints: [
      {
        name: '40-Yard Dash',
        description: 'Maximum speed sprint',
        duration: 8,
        reps: 6,
        difficulty: 'Advanced',
        keyPoints: ['Explosive start', 'Drive phase', 'Maintain form'],
        video: '/videos/40-yard-dash.mp4',
        arMarkers: [
          { x: 20, y: 50, label: 'Start line' },
          { x: 80, y: 50, label: 'Finish line' }
        ],
        audioCues: ['Set', 'Go', 'Finish'],
        vibrationPattern: [100, 500, 100],
        nextDrill: 'Shuttle Run',
        restTime: 180,
        targetHeartRate: 180
      }
    ]
  };

  const currentDrillSet = drillSets[category] || drillSets.routes;
  const drill = currentDrillSet[currentDrill];

  // Audio and Vibration Setup
  useEffect(() => {
    if (audioEnabled && 'AudioContext' in window) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioEnabled]);

  // Auto-preload next drill
  useEffect(() => {
    if (autoPreload && currentDrill < currentDrillSet.length - 1) {
      const nextDrill = currentDrillSet[currentDrill + 1];
      setNextDrillPreview(nextDrill);
      
      // Preload next drill video
      if (nextDrill.video) {
        const video = new Audio(nextDrill.video);
        video.load();
      }
    } else {
      setNextDrillPreview(null);
    }
  }, [currentDrill, currentDrillSet, autoPreload]);

  // Audio cue system
  const playAudioCue = useCallback((cue) => {
    if (!audioEnabled || !audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
    oscillator.frequency.setValueAtTime(1200, audioContextRef.current.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.2);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.2);
  }, [audioEnabled]);

  // Vibration cue system
  const playVibrationCue = useCallback((pattern) => {
    if (!vibrationEnabled || !navigator.vibrate) return;
    navigator.vibrate(pattern);
  }, [vibrationEnabled]);

  // Enhanced form analysis with AI insights
  const analyzeForm = useCallback(() => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis with enhanced insights
    setTimeout(() => {
      const score = Math.floor(Math.random() * 40) + 60; // 60-100 score
      setFormScore(score);
      
      // Generate AI insights based on performance
      const insights = [];
      
      if (score >= 90) {
        insights.push({
          type: 'excellent',
          message: 'Perfect form! Your technique is textbook quality.',
          suggestion: 'Try increasing speed while maintaining form.'
        });
      } else if (score >= 70) {
        insights.push({
          type: 'good',
          message: 'Good execution with room for improvement.',
          suggestion: 'Focus on explosive first step and arm drive.'
        });
      } else {
        insights.push({
          type: 'needs_work',
          message: 'Form needs attention. Let\'s break it down.',
          suggestion: 'Practice the movement slowly, focusing on each key point.'
        });
      }
      
      // Fatigue analysis
      const newFatigueLevel = Math.min(100, fatigueLevel + Math.floor(Math.random() * 10));
      setFatigueLevel(newFatigueLevel);
      
      if (newFatigueLevel > 70) {
        insights.push({
          type: 'fatigue',
          message: 'Signs of fatigue detected.',
          suggestion: 'Consider taking a longer rest or switching to lighter drills.'
        });
        
        setRestRecommendations([
          'Take 3-5 minutes active rest',
          'Hydrate and stretch',
          'Consider reducing intensity'
        ]);
      }
      
      setAiInsights(insights);
      
      const feedbackMessages = [
        "Excellent form! Your timing is perfect.",
        "Good execution. Try to keep your head up more.",
        "Strong effort! Focus on explosive first step.",
        "Nice work! Your balance has improved significantly.",
        "Great technique! Try to pump your arms more actively."
      ];
      
      setFeedback(feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)]);
      setIsAnalyzing(false);
    }, 2000);
  }, [fatigueLevel]);

  // Timer functionality with enhanced features
  useEffect(() => {
    if (isActive && timer > 0 && !sessionPaused) {
      intervalRef.current = setInterval(() => {
        setTimer(timer - 1);
        
        // Audio and vibration cues based on timer
        if (timer === 10) {
          playAudioCue('warning');
          playVibrationCue([100, 100, 100]);
        } else if (timer === 5) {
          playAudioCue('final');
          playVibrationCue([200, 200, 200]);
        } else if (timer === 1) {
          playAudioCue('finish');
          playVibrationCue([500]);
        }
      }, 1000);
    } else if (timer === 0 && isActive) {
      setIsActive(false);
      analyzeForm();
    }
    
    return () => clearInterval(intervalRef.current);
  }, [isActive, timer, sessionPaused, playAudioCue, playVibrationCue, analyzeForm]);

  // Camera setup for AR overlay
  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraPermission(true);
      } catch (error) {
        console.error('Camera access denied:', error);
      }
    };

    if (showAROverlay) {
      setupCamera();
    }
  }, [showAROverlay]);

  // Workout mode toggle
  const toggleWorkoutMode = () => {
    setWorkoutMode(!workoutMode);
    if (!workoutMode) {
      // Enter distraction-free mode
      document.body.style.overflow = 'hidden';
    } else {
      // Exit distraction-free mode
      document.body.style.overflow = 'auto';
    }
  };

  // Enhanced drill start with auto-save
  const startDrill = useCallback(() => {
    setTimer(drill.duration);
    setIsActive(true);
    setReps(0);
    setFeedback('');
    setFormScore(0);
    setAiInsights([]);
    
    // Auto-save session state
    const sessionState = {
      category,
      currentDrill,
      timer: drill.duration,
      reps: 0,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('trainingSessionState', JSON.stringify(sessionState));
    
    // Play start cue
    playAudioCue('start');
    playVibrationCue([100, 100, 100]);
  }, [drill, category, currentDrill, playAudioCue, playVibrationCue]);

  // Enhanced drill completion
  const nextDrill = useCallback(() => {
    // Save performance history
    const performance = {
      drill: drill.name,
      score: formScore,
      reps: reps,
      duration: drill.duration,
      timestamp: new Date().toISOString()
    };
    setPerformanceHistory(prev => [...prev, performance]);
    
    if (currentDrill < currentDrillSet.length - 1) {
      setCurrentDrill(currentDrill + 1);
      setNextDrillPreview(null);
      
      // Auto-start next drill if in workout mode
      if (workoutMode && autoPreload) {
        setTimeout(() => {
          startDrill();
        }, 3000); // 3-second transition
      }
    } else {
      // Session complete
      const finalResults = {
        category,
        drillsCompleted: currentDrillSet.length,
        avgFormScore: performanceHistory.reduce((sum, p) => sum + p.score, formScore) / (performanceHistory.length + 1),
        totalTime: currentDrillSet.reduce((sum, d) => sum + d.duration, 0),
        performanceHistory: [...performanceHistory, performance],
        fatigueLevel,
        aiInsights
      };
      
      // Clear session state
      localStorage.removeItem('trainingSessionState');
      
      // Exit workout mode
      if (workoutMode) {
        document.body.style.overflow = 'auto';
      }
      
      onComplete(finalResults);
    }
  }, [currentDrill, currentDrillSet, drill, formScore, reps, performanceHistory, fatigueLevel, aiInsights, workoutMode, autoPreload, startDrill, onComplete]);

  // Quick exit with auto-save
  const handleQuickExit = () => {
    const sessionState = {
      category,
      currentDrill,
      timer,
      reps,
      timestamp: new Date().toISOString(),
      performanceHistory
    };
    localStorage.setItem('trainingSessionState', JSON.stringify(sessionState));
    
    if (workoutMode) {
      document.body.style.overflow = 'auto';
    }
    
    onBack();
  };

  // Pause/Resume functionality
  const togglePause = () => {
    setSessionPaused(!sessionPaused);
    if (sessionPaused) {
      playAudioCue('resume');
    } else {
      playAudioCue('pause');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-400';
      case 'Intermediate': return 'text-yellow-400';
      case 'Advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Distraction-free workout mode layout
  if (workoutMode) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white">
          {/* Timer Display */}
          <div className="text-8xl font-bold mb-8">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </div>
          
          {/* Current Drill */}
          <div className="text-2xl mb-4">{drill.name}</div>
          
          {/* Reps Counter */}
          <div className="text-xl mb-8">
            Reps: {reps} / {drill.reps}
          </div>
          
          {/* Quick Controls */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setReps(reps + 1)}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-lg font-semibold"
            >
              +1 Rep
            </button>
            <button
              onClick={togglePause}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-lg font-semibold"
            >
              {sessionPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleQuickExit}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-lg font-semibold"
            >
              Exit
            </button>
          </div>
          
          {/* Next Drill Preview */}
          {nextDrillPreview && (
            <div className="mt-8 p-4 bg-white/10 rounded-lg">
              <div className="text-sm text-gray-300">Next: {nextDrillPreview.name}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Training</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-blue-200">
              Drill {currentDrill + 1} of {currentDrillSet.length}
            </div>
            
            {/* Workout Mode Toggle */}
            <button
              onClick={toggleWorkoutMode}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {workoutMode ? 'Exit Workout Mode' : 'Enter Workout Mode'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Video/AR Section */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Training Video</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAROverlay(!showAROverlay)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      showAROverlay 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {showAROverlay ? 'Hide AR' : 'Show AR'}
                  </button>
                  
                  {/* Audio/Vibration Controls */}
                  <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      audioEnabled ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    🔊
                  </button>
                  <button
                    onClick={() => setVibrationEnabled(!vibrationEnabled)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      vibrationEnabled ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    📳
                  </button>
                </div>
              </div>
              
              {/* Video Container */}
              <div className="relative bg-gray-800 rounded-xl aspect-video overflow-hidden">
                {showAROverlay && cameraPermission ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                    />
                    {/* AR Markers */}
                    {drill.arMarkers.map((marker, index) => (
                      <div
                        key={index}
                        className="absolute bg-yellow-400 text-black px-2 py-1 rounded-lg text-xs font-semibold animate-pulse"
                        style={{
                          left: `${marker.x}%`,
                          top: `${marker.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {marker.label}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎥</div>
                      <p className="text-gray-400">Training Video</p>
                      <p className="text-sm text-gray-500">{drill.name}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Audio Cues Display */}
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Audio Cues:</h4>
                <div className="flex space-x-2">
                  {drill.audioCues.map((cue, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-600 rounded text-xs">
                      {cue}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced AI Form Analysis */}
            {(formScore > 0 || isAnalyzing) && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">🤖 AI Form Analysis</h3>
                {isAnalyzing ? (
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-blue-200">Analyzing your form...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Form Score</span>
                      <span className={`text-2xl font-bold ${
                        formScore >= 90 ? 'text-green-400' : 
                        formScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {formScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          formScore >= 90 ? 'bg-green-400' : 
                          formScore >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${formScore}%` }}
                      ></div>
                    </div>
                    
                    {/* AI Insights */}
                    {aiInsights.map((insight, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        insight.type === 'excellent' ? 'bg-green-500/20 border-green-500' :
                        insight.type === 'good' ? 'bg-yellow-500/20 border-yellow-500' :
                        insight.type === 'needs_work' ? 'bg-red-500/20 border-red-500' :
                        'bg-blue-500/20 border-blue-500'
                      } border`}>
                        <p className="text-sm font-semibold mb-1">{insight.message}</p>
                        <p className="text-xs opacity-80">{insight.suggestion}</p>
                      </div>
                    ))}
                    
                    {/* Fatigue Warning */}
                    {fatigueLevel > 70 && (
                      <div className="p-3 bg-orange-500/20 border border-orange-500 rounded-lg">
                        <p className="text-sm font-semibold text-orange-300 mb-2">⚠️ Fatigue Detected</p>
                        <div className="text-xs space-y-1">
                          {restRecommendations.map((rec, index) => (
                            <div key={index} className="text-orange-200">• {rec}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Drill Details */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{drill.name}</h2>
                <span className={`text-sm font-semibold ${getDifficultyColor(drill.difficulty)}`}>
                  {drill.difficulty}
                </span>
              </div>
              
              <p className="text-blue-200 mb-6">{drill.description}</p>
              
              {/* Key Points */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Key Points:</h3>
                <ul className="space-y-2">
                  {drill.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="text-yellow-400">•</span>
                      <span className="text-blue-200">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Enhanced Timer and Controls */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-400 mb-2">
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </div>
                  <p className="text-blue-200">
                    {isActive ? 'Time Remaining' : 'Duration'}: {drill.duration}s
                  </p>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{reps}</div>
                    <div className="text-sm text-blue-200">Reps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{drill.reps}</div>
                    <div className="text-sm text-blue-200">Target</div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  {!isActive && timer === 0 ? (
                    <button
                      onClick={startDrill}
                      className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Start Drill
                    </button>
                  ) : (
                    <button
                      onClick={togglePause}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                        sessionPaused 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {sessionPaused ? 'Resume' : 'Pause'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => setReps(reps + 1)}
                    className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors"
                  >
                    +1 Rep
                  </button>
                </div>

                {formScore > 0 && (
                  <button
                    onClick={nextDrill}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold transition-colors"
                  >
                    {currentDrill < currentDrillSet.length - 1 ? 'Next Drill' : 'Complete Session'}
                  </button>
                )}
              </div>
            </div>

            {/* Next Drill Preview */}
            {nextDrillPreview && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">⏭️ Next Drill Preview</h3>
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-200">{nextDrillPreview.name}</h4>
                  <p className="text-sm text-gray-300">{nextDrillPreview.description}</p>
                  <div className="flex justify-between text-sm">
                    <span>Duration: {nextDrillPreview.duration}s</span>
                    <span>Reps: {nextDrillPreview.reps}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Rest time: {nextDrillPreview.restTime}s
                  </div>
                </div>
              </div>
            )}

            {/* Performance History */}
            {performanceHistory.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">📊 Performance History</h3>
                <div className="space-y-2">
                  {performanceHistory.slice(-3).map((perf, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                      <span className="text-sm">{perf.drill}</span>
                      <span className="text-sm font-semibold">{perf.score}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingSession;
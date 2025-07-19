import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePocket } from '../contexts/PocketContext';

const TournamentsView = () => {
  const { user } = usePocket();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  
  // Tournament system state
  const [activeTab, setActiveTab] = useState('tournaments');
  const [selectedTournamentType, setSelectedTournamentType] = useState('skill-based');
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [showNutritionPlanner, setShowNutritionPlanner] = useState(false);
  const [showFinancialPlanner, setShowFinancialPlanner] = useState(false);
  const [nextMatchDate, setNextMatchDate] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)); // 3 days from now

  // Tournament data
  const tournamentData = useMemo(() => ({
    'skill-based': [
      { id: 1, name: 'Quick Match - Beginner', participants: '12/16', xpRange: '0-1000', prize: '50 XP', status: 'open', startTime: '2:00 PM', difficulty: 'Beginner' },
      { id: 2, name: 'Ranked Ladder - Intermediate', participants: '8/8', xpRange: '1000-5000', prize: '150 XP', status: 'full', startTime: '4:00 PM', difficulty: 'Intermediate' },
      { id: 3, name: 'Elite Championship', participants: '4/8', xpRange: '5000+', prize: '500 XP + Gear', status: 'open', startTime: '6:00 PM', difficulty: 'Elite' }
    ],
    'seasonal': [
      { id: 4, name: 'European Spring League', participants: '24/32', duration: '12 weeks', prize: '$5000 + Equipment', status: 'registration', startDate: 'March 15', type: 'International' },
      { id: 5, name: 'North American Championship', participants: '18/24', duration: '16 weeks', prize: '$15000', status: 'ongoing', startDate: 'February 1', type: 'International' },
      { id: 6, name: 'Asia-Pacific League', participants: '12/20', duration: '10 weeks', prize: '$3000', status: 'registration', startDate: 'April 1', type: 'International' }
    ],
    'championships': [
      { id: 7, name: 'City Championship 2024', participants: '32/64', format: 'Single Elimination', prize: '$2000', status: 'open', date: 'Next Weekend', type: 'Local' },
      { id: 8, name: 'Regional Finals', participants: '16/16', format: 'Double Elimination', prize: '$5000', status: 'full', date: 'March 10', type: 'Regional' },
      { id: 9, name: 'Amateur League Cup', participants: '8/32', format: 'Round Robin', prize: '$800', status: 'open', date: 'February 25', type: 'Local' }
    ]
  }), []);

  // AI Nutrition Scheduler
  const calculateNutritionPlan = (matchDate, weatherTemp = 22) => {
    const matchTime = new Date(matchDate);
    const now = new Date();
    const hoursUntilMatch = (matchTime - now) / (1000 * 60 * 60);
    
    const plan = {
      immediate: [],
      preMatch: [],
      matchDay: [],
      postMatch: []
    };

    if (hoursUntilMatch > 72) {
      plan.immediate = [
        { time: 'Now', action: 'Start hydration prep', items: ['Increase water intake to 3L daily', 'Begin electrolyte balance'], icon: '💧' },
        { time: 'Daily', action: 'Nutrition prep', items: ['Focus on complex carbs', 'Lean protein meals'], icon: '🥗' }
      ];
    }

    if (hoursUntilMatch <= 24) {
      plan.preMatch = [
        { time: 'T-12h', action: 'Pre-competition meal', items: ['Pasta with lean protein', 'Low fiber vegetables'], icon: '🍝' },
        { time: 'T-3h', action: 'Final meal', items: ['400-600 calories', 'Complex carbs', 'Minimal fiber'], icon: '🥙' },
        { time: 'T-90min', action: 'Hydration boost', items: ['500ml water', '250ml electrolyte drink'], icon: '🥤' }
      ];
    }

    plan.matchDay = [
      { time: 'T-30min', action: 'Pre-game fuel', items: ['1 protein bar', 'Banana', weatherTemp > 25 ? 'Extra electrolytes' : 'Light caffeine'], icon: '🍌' },
      { time: 'Halftime', action: 'Quick energy', items: ['Energy gel', '200ml sports drink'], icon: '⚡' },
      { time: 'Every 15min', action: 'Hydration reminder', items: [`${weatherTemp > 25 ? '250ml' : '150ml'} electrolyte solution`], icon: '💧' }
    ];

    plan.postMatch = [
      { time: 'T+30min', action: 'Recovery window', items: ['Protein shake (25g)', 'Simple carbs', 'Chocolate milk'], icon: '🥛' },
      { time: 'T+2h', action: 'Full recovery meal', items: ['Balanced meal', 'Anti-inflammatory foods', 'Omega-3 rich fish'], icon: '🐟' }
    ];

    return plan;
  };

  // Financial Planning Data
  const financialData = useMemo(() => {
    const userXP = currentUserData?.xp || 3250;
    const sponsorshipTier = userXP >= 10000 ? 'elite' : userXP >= 5000 ? 'rising' : 'emerging';
    
    return {
      seasonCosts: {
        equipment: { base: 300, current: 285, category: 'Essential' },
        training: { base: 500, current: 425, category: 'Development' },
        nutrition: { base: 400, current: 360, category: 'Performance' },
        travel: { base: 600, current: 540, category: 'Competition' },
        registration: { base: 200, current: 180, category: 'Access' }
      },
      sponsorshipStatus: {
        tier: sponsorshipTier,
        currentSupport: sponsorshipTier === 'elite' ? 1500 : sponsorshipTier === 'rising' ? 500 : 200,
        potential: sponsorshipTier === 'elite' ? 2500 : sponsorshipTier === 'rising' ? 1200 : 600,
        nextTierXP: sponsorshipTier === 'elite' ? null : sponsorshipTier === 'rising' ? 10000 : 5000
      },
      savingsGoals: {
        monthly: 158,
        emergency: 380,
        equipment: 95,
        totalAnnual: 1895
      }
    };
  }, [currentUserData]);

  // Mock leaderboard data - in real app this would come from your backend
  const leaderboardData = useMemo(() => [
    { id: 1, name: 'Marcus "Lightning" Johnson', xp: 12450, avatar: '⚡', level: 28, completedTrainings: 145, monthlyXP: 2890 },
    { id: 2, name: 'Sarah "Flash" Williams', xp: 11200, avatar: '🔥', level: 26, completedTrainings: 132, monthlyXP: 2650 },
    { id: 3, name: 'DJ "Rocket" Thompson', xp: 10800, avatar: '🚀', level: 25, completedTrainings: 128, monthlyXP: 2480 },
    { id: 4, name: 'Maya "Storm" Rodriguez', xp: 10350, avatar: '⛈️', level: 24, completedTrainings: 121, monthlyXP: 2320 },
    { id: 5, name: 'Tyler "Beast" Anderson', xp: 9875, avatar: '🦁', level: 23, completedTrainings: 118, monthlyXP: 2190 },
    { id: 6, name: 'Jordan "Ace" Martinez', xp: 9420, avatar: '🎯', level: 22, completedTrainings: 112, monthlyXP: 2050 },
    { id: 7, name: 'Alex "Phantom" Lee', xp: 8950, avatar: '👻', level: 21, completedTrainings: 108, monthlyXP: 1920 },
    { id: 8, name: 'Casey "Blitz" Davis', xp: 8675, avatar: '⚡', level: 20, completedTrainings: 105, monthlyXP: 1850 },
    { id: 9, name: 'Morgan "Turbo" Wilson', xp: 8320, avatar: '🏁', level: 19, completedTrainings: 98, monthlyXP: 1740 },
    { id: 10, name: 'Riley "Comet" Brown', xp: 7890, avatar: '☄️', level: 18, completedTrainings: 94, monthlyXP: 1680 },
    // Add current user if not in top 10
    { id: 'current', name: user?.name || 'You', xp: 3250, avatar: '🏈', level: 12, completedTrainings: 45, monthlyXP: 890, position: 47 }
  ], [user]);

  const currentUserPosition = useMemo(() => {
    const currentUser = leaderboardData.find(player => player.id === 'current');
    return currentUser?.position || leaderboardData.length + 1;
  }, [leaderboardData]);

  const isCurrentUserInTop10 = currentUserPosition <= 10;
  const topTenData = leaderboardData.slice(0, 10);
  const currentUserData = leaderboardData.find(player => player.id === 'current');

  const getRankIcon = (position) => {
    switch(position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${position}`;
    }
  };

  const getPositionStyle = (position) => {
    switch(position) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default: return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <Link 
            to="/dashboard" 
            className="text-blue-600 hover:text-blue-800 flex items-center space-x-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Tournaments</h1>
          <p className="text-gray-600 mt-2">Compete against other teams and players</p>
        </div>
        
        {/* Monthly Champion Award Section */}
        <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-5xl">🏆</div>
              <div>
                <h2 className="text-2xl font-bold">Monthly Champion Award</h2>
                <p className="text-yellow-100">Top athlete wins sponsor rewards at month's end!</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-yellow-200">Days Remaining</div>
              <div className="text-3xl font-bold">{new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()}</div>
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>🏆</span>
                <span>XP Leaderboard</span>
              </h2>
              <p className="text-gray-600">Top athletes competing for monthly champion</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedPeriod('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === 'monthly' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPeriod('allTime')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === 'allTime' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Top 10 Leaderboard */}
          <div className="space-y-3">
            {topTenData.map((player, index) => {
              const position = index + 1;
              const isCurrentUser = player.id === 'current' && isCurrentUserInTop10;
              return (
                <div 
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    isCurrentUser 
                      ? 'border-blue-500 bg-blue-50' 
                      : position <= 3 
                        ? 'border-yellow-200 bg-yellow-50' 
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${getPositionStyle(position)}`}>
                      {getRankIcon(position)}
                    </div>
                    <div className="text-2xl">{player.avatar}</div>
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center space-x-2">
                        <span>{player.name}</span>
                        {isCurrentUser && <span className="text-blue-600 text-sm">(You)</span>}
                      </div>
                      <div className="text-sm text-gray-600">
                        Level {player.level} • {player.completedTrainings} trainings completed
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {selectedPeriod === 'monthly' ? player.monthlyXP : player.xp} XP
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedPeriod === 'monthly' ? 'This Month' : 'Total XP'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current User Position (if not in top 10) */}
          {!isCurrentUserInTop10 && currentUserData && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500 mb-3">Your Position</div>
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-blue-500 bg-blue-50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    #{currentUserPosition}
                  </div>
                  <div className="text-2xl">{currentUserData.avatar}</div>
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center space-x-2">
                      <span>{currentUserData.name}</span>
                      <span className="text-blue-600 text-sm">(You)</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Level {currentUserData.level} • {currentUserData.completedTrainings} trainings completed
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    {selectedPeriod === 'monthly' ? currentUserData.monthlyXP : currentUserData.xp} XP
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedPeriod === 'monthly' ? 'This Month' : 'Total XP'}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600">
                  {selectedPeriod === 'monthly' 
                    ? `You need ${topTenData[9]?.monthlyXP - currentUserData.monthlyXP + 1} more XP to reach top 10 this month!`
                    : `You need ${topTenData[9]?.xp - currentUserData.xp + 1} more XP to reach top 10!`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Tournament System */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('tournaments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tournaments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🏆 Tournaments
              </button>
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'nutrition'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🥗 AI Nutrition Planner
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'financial'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💰 Financial Planner
              </button>
            </nav>
          </div>

          {/* Tournament Tab */}
          {activeTab === 'tournaments' && (
            <div className="p-6">
              {/* Tournament Type Selector */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSelectedTournamentType('skill-based')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedTournamentType === 'skill-based'
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🎯 Skill-Based
                  </button>
                  <button
                    onClick={() => setSelectedTournamentType('seasonal')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedTournamentType === 'seasonal'
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🏅 Seasonal Leagues
                  </button>
                  <button
                    onClick={() => setSelectedTournamentType('championships')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedTournamentType === 'championships'
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🎖️ Championships
                  </button>
                </div>
                <button
                  onClick={() => setShowCreateTournament(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                >
                  + Create Tournament
                </button>
              </div>

              {/* Tournament Cards */}
              <div className="space-y-4">
                {tournamentData[selectedTournamentType].map((tournament) => (
                  <div key={tournament.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            tournament.status === 'open' ? 'bg-green-100 text-green-700' :
                            tournament.status === 'full' ? 'bg-red-100 text-red-700' :
                            tournament.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {tournament.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Participants</p>
                            <p className="font-medium">{tournament.participants}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              {selectedTournamentType === 'skill-based' ? 'XP Range' : 
                               selectedTournamentType === 'seasonal' ? 'Duration' : 'Format'}
                            </p>
                            <p className="font-medium">
                              {tournament.xpRange || tournament.duration || tournament.format}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Prize</p>
                            <p className="font-medium text-green-600">{tournament.prize}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              {selectedTournamentType === 'skill-based' ? 'Start Time' : 'Date'}
                            </p>
                            <p className="font-medium">
                              {tournament.startTime || tournament.startDate || tournament.date}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          {tournament.status === 'full' ? 'Join Waitlist' : 'Join Tournament'}
                        </button>
                        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Nutrition Planner Tab */}
          {activeTab === 'nutrition' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🤖 AI Nutrition Scheduler</h2>
                <p className="text-gray-600">Optimize your performance with personalized nutrition timing for your next match</p>
              </div>

              {/* Match Selection */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Next Match: City Championship Qualifier</h3>
                    <p className="text-gray-600">
                      {nextMatchDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Hours until match</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round((nextMatchDate - new Date()) / (1000 * 60 * 60))}h
                    </p>
                  </div>
                </div>
              </div>

              {/* Nutrition Plan */}
              {(() => {
                const nutritionPlan = calculateNutritionPlan(nextMatchDate, 24);
                return (
                  <div className="space-y-6">
                    {nutritionPlan.immediate.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-blue-900 mb-4">🚨 Immediate Actions</h4>
                        <div className="space-y-3">
                          {nutritionPlan.immediate.map((item, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <span className="text-2xl">{item.icon}</span>
                              <div>
                                <p className="font-medium text-blue-900">{item.time}: {item.action}</p>
                                <ul className="text-blue-700 text-sm mt-1">
                                  {item.items.map((detail, i) => (
                                    <li key={i}>• {detail}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {nutritionPlan.preMatch.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-yellow-900 mb-4">⏰ Pre-Match Timeline</h4>
                        <div className="space-y-3">
                          {nutritionPlan.preMatch.map((item, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <span className="text-2xl">{item.icon}</span>
                              <div>
                                <p className="font-medium text-yellow-900">{item.time}: {item.action}</p>
                                <ul className="text-yellow-700 text-sm mt-1">
                                  {item.items.map((detail, i) => (
                                    <li key={i}>• {detail}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-green-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-green-900 mb-4">🏃‍♂️ Match Day Protocol</h4>
                      <div className="space-y-3">
                        {nutritionPlan.matchDay.map((item, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                              <p className="font-medium text-green-900">{item.time}: {item.action}</p>
                              <ul className="text-green-700 text-sm mt-1">
                                {item.items.map((detail, i) => (
                                  <li key={i}>• {detail}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-purple-900 mb-4">🔄 Post-Match Recovery</h4>
                      <div className="space-y-3">
                        {nutritionPlan.postMatch.map((item, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                              <p className="font-medium text-purple-900">{item.time}: {item.action}</p>
                              <ul className="text-purple-700 text-sm mt-1">
                                {item.items.map((detail, i) => (
                                  <li key={i}>• {detail}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Financial Planner Tab */}
          {activeTab === 'financial' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">💰 Season Financial Planner</h2>
                <p className="text-gray-600">Manage your season costs, track sponsorship opportunities, and plan your budget</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Season Costs */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Season Cost Breakdown</h3>
                  <div className="space-y-4">
                    {Object.entries(financialData.seasonCosts).map(([category, data]) => (
                      <div key={category} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{category}</p>
                          <p className="text-sm text-gray-500">{data.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${data.current}</p>
                          {data.current < data.base && (
                            <p className="text-sm text-green-600">Save ${data.base - data.current}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-gray-900">Total Annual Cost</p>
                        <p className="text-xl font-bold text-gray-900">
                          ${Object.values(financialData.seasonCosts).reduce((sum, item) => sum + item.current, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sponsorship Status */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Sponsorship Status</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium text-gray-900">Current Tier</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          financialData.sponsorshipStatus.tier === 'elite' ? 'bg-gold-100 text-gold-800' :
                          financialData.sponsorshipStatus.tier === 'rising' ? 'bg-silver-100 text-silver-800' :
                          'bg-bronze-100 text-bronze-800'
                        }`}>
                          {financialData.sponsorshipStatus.tier.charAt(0).toUpperCase() + financialData.sponsorshipStatus.tier.slice(1)}
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ 
                            width: `${(financialData.sponsorshipStatus.currentSupport / financialData.sponsorshipStatus.potential) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>${financialData.sponsorshipStatus.currentSupport} current</span>
                        <span>${financialData.sponsorshipStatus.potential} potential</span>
                      </div>
                    </div>

                    {financialData.sponsorshipStatus.nextTierXP && (
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Next Tier Requirements</p>
                        <p className="font-medium text-gray-900">
                          {financialData.sponsorshipStatus.nextTierXP - (currentUserData?.xp || 3250)} XP needed
                        </p>
                        <p className="text-sm text-green-600">
                          +${financialData.sponsorshipStatus.tier === 'emerging' ? 300 : 1000} potential funding
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Savings Goals */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Savings Targets</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700">Monthly Target</p>
                      <p className="font-semibold text-green-600">${financialData.savingsGoals.monthly}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700">Emergency Fund</p>
                      <p className="font-semibold text-green-600">${financialData.savingsGoals.emergency}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700">Equipment Replacement</p>
                      <p className="font-semibold text-green-600">${financialData.savingsGoals.equipment}</p>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-gray-900">Annual Goal</p>
                        <p className="text-xl font-bold text-green-600">${financialData.savingsGoals.totalAnnual}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sponsorship Opportunities */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🤝 Sponsorship Opportunities</h3>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">Local Sports Store</p>
                          <p className="text-sm text-gray-600">Equipment sponsorship</p>
                        </div>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">Match: 95%</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">NutriBoost Supplements</p>
                          <p className="text-sm text-gray-600">Nutrition partnership</p>
                        </div>
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">Match: 78%</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">TravelEasy Transport</p>
                          <p className="text-sm text-gray-600">Travel cost support</p>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">Match: 82%</span>
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    Apply to Sponsors
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentsView;
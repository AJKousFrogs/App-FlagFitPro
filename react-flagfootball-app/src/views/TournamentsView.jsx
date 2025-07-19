import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePocket } from '../contexts/PocketContext';

const TournamentsView = () => {
  const { user } = usePocket();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

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

        {/* Tournament Types Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tournaments Coming Soon!</h2>
          <p className="text-gray-600 mb-6">
            We're building an exciting tournament system where you can compete against other teams, 
            join leagues, and showcase your skills in flag football competitions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold text-blue-900">Skill-Based Matchmaking</h3>
              <p className="text-sm text-blue-700">Compete against players of similar skill levels</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl mb-2">🏅</div>
              <h3 className="font-semibold text-green-900">Seasonal Leagues</h3>
              <p className="text-sm text-green-700">Join ongoing leagues with regular matches</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl mb-2">🎖️</div>
              <h3 className="font-semibold text-purple-900">Championships</h3>
              <p className="text-sm text-purple-700">Compete for ultimate bragging rights</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentsView;
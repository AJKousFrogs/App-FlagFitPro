import React from 'react';

const LeaderboardsPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Leaderboards</h1>
          <p className="text-lg text-gray-600">
            Performance rankings and achievements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Season Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Touchdowns</h3>
                  <p className="text-sm text-gray-600">Most touchdowns scored</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">12</div>
                  <div className="text-xs text-gray-500">Alex Rivera</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Tackles</h3>
                  <p className="text-sm text-gray-600">Most flag pulls</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">28</div>
                  <div className="text-xs text-gray-500">Mike Johnson</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Passing Yards</h3>
                  <p className="text-sm text-gray-600">Most passing yards</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">1,245</div>
                  <div className="text-xs text-gray-500">Sarah Johnson</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Achievements</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🏆</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">MVP Award</h3>
                  <p className="text-sm text-gray-600">Most valuable player of the season</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">⚡</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Speed Demon</h3>
                  <p className="text-sm text-gray-600">Fastest 40-yard dash time</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🎯</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Sharp Shooter</h3>
                  <p className="text-sm text-gray-600">Highest completion percentage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardsPage; 
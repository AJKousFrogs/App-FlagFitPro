import React from 'react';

const RouteRunningPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Route Running Training</h1>
          <p className="text-lg text-gray-600">
            Master the art of precise route running with agility drills and precision training.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Agility Drills */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Agility Drills</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Cone Weaving</h3>
                <p className="text-gray-600 text-sm">Practice weaving through cones to improve lateral movement</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Ladder Drills</h3>
                <p className="text-gray-600 text-sm">Enhance footwork and coordination with ladder exercises</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Shuttle Runs</h3>
                <p className="text-gray-600 text-sm">Build explosive acceleration and change of direction</p>
              </div>
            </div>
          </div>

          {/* Route Precision */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Route Precision</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Pattern Recognition</h3>
                <p className="text-gray-600 text-sm">Learn to read defensive coverages and adjust routes</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Break Point Training</h3>
                <p className="text-gray-600 text-sm">Perfect your cuts and breaks at the right moments</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Timing Drills</h3>
                <p className="text-gray-600 text-sm">Synchronize your routes with quarterback timing</p>
              </div>
            </div>
          </div>

          {/* Speed Training */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Speed Training</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Sprint Mechanics</h3>
                <p className="text-gray-600 text-sm">Perfect your running form for maximum speed</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Acceleration Work</h3>
                <p className="text-gray-600 text-sm">Build explosive first steps off the line</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Top Speed Maintenance</h3>
                <p className="text-gray-600 text-sm">Learn to maintain speed throughout your routes</p>
              </div>
            </div>
          </div>

          {/* Game Situations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Game Situations</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Red Zone Routes</h3>
                <p className="text-gray-600 text-sm">Specialized routes for scoring situations</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Third Down Conversions</h3>
                <p className="text-gray-600 text-sm">Routes designed to move the chains</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Two-Minute Drill</h3>
                <p className="text-gray-600 text-sm">Hurry-up offense route running</p>
              </div>
            </div>
          </div>
        </div>

        {/* Training Progress */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">85%</div>
              <div className="text-sm text-gray-600">Route Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">92%</div>
              <div className="text-sm text-gray-600">Agility Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">78%</div>
              <div className="text-sm text-gray-600">Speed Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteRunningPage; 
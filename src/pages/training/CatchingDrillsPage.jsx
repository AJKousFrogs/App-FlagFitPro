import React from 'react';

const CatchingDrillsPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Catching Drills</h1>
          <p className="text-lg text-gray-600">
            Improve hand-eye coordination and ball skills for reliable pass catching.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hand Position</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Diamond Formation</h3>
                <p className="text-gray-600 text-sm">Thumbs together, fingers spread</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Eye Level</h3>
                <p className="text-gray-600 text-sm">Track ball with eyes to hands</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Soft Hands</h3>
                <p className="text-gray-600 text-sm">Absorb the ball's momentum</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Drill Progressions</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Stationary Catches</h3>
                <p className="text-gray-600 text-sm">Basic catching technique</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Moving Catches</h3>
                <p className="text-gray-600 text-sm">Catch while running routes</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Contested Catches</h3>
                <p className="text-gray-600 text-sm">Catch with defender pressure</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">92%</div>
              <div className="text-sm text-gray-600">Catch Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">85%</div>
              <div className="text-sm text-gray-600">Contested Catches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">78%</div>
              <div className="text-sm text-gray-600">Yards After Catch</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatchingDrillsPage; 
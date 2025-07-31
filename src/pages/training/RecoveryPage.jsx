import React from 'react';

const RecoveryPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Recovery</h1>
          <p className="text-lg text-gray-600">
            Optimize your recovery to maximize training adaptations and performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Recovery</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Light Cardio</h3>
                <p className="text-gray-600 text-sm">Low-intensity walking or cycling</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Stretching</h3>
                <p className="text-gray-600 text-sm">Dynamic and static stretching</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Foam Rolling</h3>
                <p className="text-gray-600 text-sm">Self-myofascial release</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recovery Modalities</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Sleep</h3>
                <p className="text-gray-600 text-sm">7-9 hours of quality sleep</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Nutrition</h3>
                <p className="text-gray-600 text-sm">Proper post-workout fueling</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Hydration</h3>
                <p className="text-gray-600 text-sm">Maintain proper fluid balance</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Recovery Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">8.2h</div>
              <div className="text-sm text-gray-600">Avg Sleep</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">85%</div>
              <div className="text-sm text-gray-600">Recovery Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">92%</div>
              <div className="text-sm text-gray-600">Readiness</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryPage; 
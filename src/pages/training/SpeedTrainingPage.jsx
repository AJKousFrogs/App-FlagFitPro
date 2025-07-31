import React from 'react';

const SpeedTrainingPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Speed Training</h1>
          <p className="text-lg text-gray-600">
            Develop explosive acceleration and maximum sprint speed for flag football performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sprint Mechanics</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Arm Drive</h3>
                <p className="text-gray-600 text-sm">Proper arm swing for forward propulsion</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Leg Action</h3>
                <p className="text-gray-600 text-sm">High knee drive and foot placement</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Body Position</h3>
                <p className="text-gray-600 text-sm">Forward lean and core stability</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Acceleration</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">First Steps</h3>
                <p className="text-gray-600 text-sm">Explosive start from various positions</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Drive Phase</h3>
                <p className="text-gray-600 text-sm">Powerful push-off mechanics</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Transition</h3>
                <p className="text-gray-600 text-sm">Smooth acceleration to top speed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">4.2s</div>
              <div className="text-sm text-gray-600">40-Yard Dash</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">2.8s</div>
              <div className="text-sm text-gray-600">20-Yard Shuttle</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">88%</div>
              <div className="text-sm text-gray-600">Speed Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeedTrainingPage; 
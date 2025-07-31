import React from 'react';

const StrengthTrainingPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Strength Training</h1>
          <p className="text-lg text-gray-600">
            Build functional strength and power for flag football performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lower Body</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Squats</h3>
                <p className="text-gray-600 text-sm">Build leg strength and power</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Deadlifts</h3>
                <p className="text-gray-600 text-sm">Develop posterior chain strength</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Lunges</h3>
                <p className="text-gray-600 text-sm">Improve balance and stability</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upper Body</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Push-ups</h3>
                <p className="text-gray-600 text-sm">Build chest and tricep strength</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Pull-ups</h3>
                <p className="text-gray-600 text-sm">Develop back and bicep strength</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Overhead Press</h3>
                <p className="text-gray-600 text-sm">Build shoulder strength</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">225lbs</div>
              <div className="text-sm text-gray-600">Squat Max</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">185lbs</div>
              <div className="text-sm text-gray-600">Deadlift Max</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">15</div>
              <div className="text-sm text-gray-600">Pull-ups</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrengthTrainingPage; 
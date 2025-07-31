import React from 'react';

const ActiveTournamentsPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Active Tournaments</h1>
          <p className="text-lg text-gray-600">
            Current tournament participation and schedules.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Winter League 2024</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">3-1</div>
              <div className="text-sm text-gray-600">Record</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">2nd</div>
              <div className="text-sm text-gray-600">Standing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">4</div>
              <div className="text-sm text-gray-600">Games Left</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Next Game: vs Eagles</h3>
                <p className="text-sm text-gray-600">Tomorrow at 3:00 PM</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">Lincoln Park</div>
                <div className="text-xs text-gray-500">Field #2</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveTournamentsPage; 
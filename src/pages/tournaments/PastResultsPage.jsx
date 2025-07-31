import React from 'react';

const PastResultsPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Past Results</h1>
          <p className="text-lg text-gray-600">
            Historical performance data and tournament results.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Fall League 2023</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Final Record</h3>
                <p className="text-sm text-gray-600">8-2 (Championship Runner-up)</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">2nd Place</div>
                <div className="text-xs text-gray-500">League Finish</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">24.5</div>
                <div className="text-sm text-gray-600">Points Per Game</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">12.8</div>
                <div className="text-sm text-gray-600">Points Allowed</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">+11.7</div>
                <div className="text-sm text-gray-600">Point Differential</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PastResultsPage; 
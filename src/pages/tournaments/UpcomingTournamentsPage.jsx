import React from 'react';

const UpcomingTournamentsPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upcoming Tournaments</h1>
          <p className="text-lg text-gray-600">
            Register for future tournaments and competitions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Spring League</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Registration Deadline</h3>
                <p className="text-gray-600 text-sm">March 15, 2024</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Tournament Start</h3>
                <p className="text-gray-600 text-sm">April 1, 2024</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Entry Fee</h3>
                <p className="text-gray-600 text-sm">$150 per team</p>
              </div>
            </div>
            <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Register Now
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Summer Championship</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Registration Deadline</h3>
                <p className="text-gray-600 text-sm">May 20, 2024</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Tournament Start</h3>
                <p className="text-gray-600 text-sm">June 10, 2024</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Entry Fee</h3>
                <p className="text-gray-600 text-sm">$200 per team</p>
              </div>
            </div>
            <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Register Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingTournamentsPage; 
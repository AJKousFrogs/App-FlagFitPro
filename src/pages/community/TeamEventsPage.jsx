import React from 'react';

const TeamEventsPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Team Events</h1>
          <p className="text-lg text-gray-600">
            View upcoming team events and activities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Game vs Eagles</h3>
                <p className="text-gray-600 text-sm">Tomorrow at 3:00 PM</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Team Practice</h3>
                <p className="text-gray-600 text-sm">Friday at 5:00 PM</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Film Review</h3>
                <p className="text-gray-600 text-sm">Sunday at 2:00 PM</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Activities</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Team Dinner</h3>
                <p className="text-gray-600 text-sm">Next Saturday at 6:00 PM</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Community Service</h3>
                <p className="text-gray-600 text-sm">Volunteer day at local park</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Team Building</h3>
                <p className="text-gray-600 text-sm">Escape room challenge</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamEventsPage; 
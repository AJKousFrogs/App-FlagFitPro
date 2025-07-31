import React from 'react';

const DiscussionForumsPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Discussion Forums</h1>
          <p className="text-lg text-gray-600">
            Share strategies and get advice from the community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Strategy & Tactics</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Offensive Plays</h3>
                <p className="text-gray-600 text-sm">Share and discuss offensive strategies</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Defensive Schemes</h3>
                <p className="text-gray-600 text-sm">Defensive formations and coverages</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Special Teams</h3>
                <p className="text-gray-600 text-sm">Kickoff and punt strategies</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Training & Development</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Skill Development</h3>
                <p className="text-gray-600 text-sm">Improving individual skills</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Fitness & Conditioning</h3>
                <p className="text-gray-600 text-sm">Physical training discussions</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Mental Game</h3>
                <p className="text-gray-600 text-sm">Psychology and mental preparation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionForumsPage; 
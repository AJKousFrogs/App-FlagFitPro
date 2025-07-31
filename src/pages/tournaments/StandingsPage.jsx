import React from 'react';

const StandingsPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Current Standings</h1>
          <p className="text-lg text-gray-600">
            Check your position in ongoing tournaments.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Winter League 2024</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Rank</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Team</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">W</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">L</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">PCT</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">GB</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">1</td>
                  <td className="py-3 px-4 text-gray-900">Eagles</td>
                  <td className="py-3 px-4 text-center text-gray-900">4</td>
                  <td className="py-3 px-4 text-center text-gray-900">0</td>
                  <td className="py-3 px-4 text-center text-gray-900">1.000</td>
                  <td className="py-3 px-4 text-center text-gray-900">-</td>
                </tr>
                <tr className="border-b border-gray-100 bg-blue-50">
                  <td className="py-3 px-4 font-medium text-blue-600">2</td>
                  <td className="py-3 px-4 text-blue-600 font-medium">Hawks</td>
                  <td className="py-3 px-4 text-center text-blue-600">3</td>
                  <td className="py-3 px-4 text-center text-blue-600">1</td>
                  <td className="py-3 px-4 text-center text-blue-600">.750</td>
                  <td className="py-3 px-4 text-center text-blue-600">1</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">3</td>
                  <td className="py-3 px-4 text-gray-900">Lions</td>
                  <td className="py-3 px-4 text-center text-gray-900">2</td>
                  <td className="py-3 px-4 text-center text-gray-900">2</td>
                  <td className="py-3 px-4 text-center text-gray-900">.500</td>
                  <td className="py-3 px-4 text-center text-gray-900">2</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">4</td>
                  <td className="py-3 px-4 text-gray-900">Bears</td>
                  <td className="py-3 px-4 text-center text-gray-900">1</td>
                  <td className="py-3 px-4 text-center text-gray-900">3</td>
                  <td className="py-3 px-4 text-center text-gray-900">.250</td>
                  <td className="py-3 px-4 text-center text-gray-900">3</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">5</td>
                  <td className="py-3 px-4 text-gray-900">Vikings</td>
                  <td className="py-3 px-4 text-center text-gray-900">0</td>
                  <td className="py-3 px-4 text-center text-gray-900">4</td>
                  <td className="py-3 px-4 text-center text-gray-900">.000</td>
                  <td className="py-3 px-4 text-center text-gray-900">4</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandingsPage; 
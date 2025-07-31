import React from 'react';

const PlyometricsPage = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Plyometrics Training</h1>
          <p className="text-lg text-gray-600">
            Build explosive power and enhance athletic performance with evidence-based plyometric training.
          </p>
        </div>

        {/* Research Foundation */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Research Foundation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Yuri Verkhoshansky's Shock Method</h3>
              <p className="text-sm text-gray-600">
                Based on the original 1968 research, plyometrics enhance power through the stretch-shortening cycle.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Modern Validation</h3>
              <p className="text-sm text-gray-600">
                Recent studies show 4.7-15% improvement in vertical jump and 1.8-6% improvement in sprint speed.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Depth Jumps */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Depth Jumps</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Box Height Progression</h3>
                <p className="text-gray-600 text-sm">Start with 8-12 inches, progress to 20-30 inches</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Contact Time</h3>
                <p className="text-gray-600 text-sm">Maintain 0.1-0.2 second ground contact</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Volume</h3>
                <p className="text-gray-600 text-sm">3-5 sets of 3-5 repetitions</p>
              </div>
            </div>
          </div>

          {/* Box Jumps */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Box Jumps</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Height Selection</h3>
                <p className="text-gray-600 text-sm">Choose height that allows perfect form</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Landing Mechanics</h3>
                <p className="text-gray-600 text-sm">Soft landing with knees and hips</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Progression</h3>
                <p className="text-gray-600 text-sm">Increase height as technique improves</p>
              </div>
            </div>
          </div>

          {/* Bounds and Hops */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bounds and Hops</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Single-Leg Bounds</h3>
                <p className="text-gray-600 text-sm">Develop unilateral power and stability</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Alternate Leg Bounds</h3>
                <p className="text-gray-600 text-sm">Improve coordination and rhythm</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Lateral Hops</h3>
                <p className="text-gray-600 text-sm">Enhance side-to-side movement</p>
              </div>
            </div>
          </div>

          {/* Sport-Specific */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sport-Specific</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">Football Movements</h3>
                <p className="text-gray-600 text-sm">Simulate game-specific jumping patterns</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium text-gray-900">Reactive Jumps</h3>
                <p className="text-gray-600 text-sm">Respond to visual or auditory cues</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium text-gray-900">Direction Changes</h3>
                <p className="text-gray-600 text-sm">Combine jumping with direction changes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Guidelines */}
        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Safety Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Prerequisites</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Adequate strength base (1.5x bodyweight squat)</li>
                <li>• Proper landing mechanics</li>
                <li>• No recent lower extremity injuries</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Progression</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Start with basic jumping skills</li>
                <li>• Progress height gradually</li>
                <li>• Monitor for signs of overtraining</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Training Progress */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">24"</div>
              <div className="text-sm text-gray-600">Box Jump Height</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">18"</div>
              <div className="text-sm text-gray-600">Depth Jump Height</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">85%</div>
              <div className="text-sm text-gray-600">Power Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlyometricsPage; 
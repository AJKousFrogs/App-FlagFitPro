import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import WelcomeBackPage from './WelcomeBackPage';

const WelcomeBackDemo = () => {
  const [demoState, setDemoState] = useState('default');

  const handleDemoLogin = (userData) => {
    console.log('Demo login with:', userData);
    // Simulate successful login
    alert('Demo login successful! Check console for user data.');
  };

  const handleStateChange = (state) => {
    setDemoState(state);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome Back Page Demo
          </h1>
          <p className="text-gray-600 mb-6">
            This demo showcases the new Welcome Back page built with Radix UI components.
            Test different states and interactions below.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => handleStateChange('default')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                demoState === 'default'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Default State
            </button>
            <button
              onClick={() => handleStateChange('loading')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                demoState === 'loading'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Loading State
            </button>
            <button
              onClick={() => handleStateChange('error')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                demoState === 'error'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Error State
            </button>
            <button
              onClick={() => handleStateChange('validation')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                demoState === 'validation'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Validation Errors
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/welcome-back"
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              View Full Page
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Compare with Old Login
            </Link>
            <Link
              to="/nav-demo"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Navigation Demo
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Features Showcased
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Radix UI Components</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Card components for layout structure</li>
                <li>• Form components with validation</li>
                <li>• Button components with variants</li>
                <li>• Flex layout components</li>
                <li>• Badge components for labels</li>
                <li>• Focus management with FocusScope</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Design Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Modern gradient backgrounds</li>
                <li>• Smooth transitions and animations</li>
                <li>• Responsive design for all devices</li>
                <li>• Dark mode support</li>
                <li>• Accessibility features</li>
                <li>• Loading states and error handling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBackDemo; 
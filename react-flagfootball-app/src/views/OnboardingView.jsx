import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePocket } from '../contexts/PocketContext';

const OnboardingView = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = usePocket();
  const [step, setStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    position: '',
    experience: '',
    goals: [],
    teamName: '',
    playingHistory: ''
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const completeOnboarding = async () => {
    try {
      // Save onboarding data to user profile and mark as completed
      await updateProfile({ 
        ...onboardingData, 
        onboardingCompleted: true 
      });
      console.log('Onboarding completed successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      navigate('/dashboard'); // Navigate anyway
    }
  };

  const updateData = (key, value) => {
    setOnboardingData(prev => ({ ...prev, [key]: value }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to MERLINS PLAYBOOK!</h2>
              <p className="text-gray-600">Let&apos;s get you set up for success</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What position do you play?
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={onboardingData.position}
                  onChange={(e) => updateData('position', e.target.value)}
                >
                  <option value="">Select a position</option>
                  <option value="quarterback">Quarterback</option>
                  <option value="receiver">Receiver</option>
                  <option value="rusher">Rusher</option>
                  <option value="defender">Defender</option>
                  <option value="safety">Safety</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={onboardingData.experience}
                  onChange={(e) => updateData('experience', e.target.value)}
                >
                  <option value="">Select experience level</option>
                  <option value="beginner">Beginner (0-1 years)</option>
                  <option value="intermediate">Intermediate (2-4 years)</option>
                  <option value="advanced">Advanced (5+ years)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Goals</h2>
              <p className="text-gray-600">What do you want to achieve?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name (Optional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your team name"
                  value={onboardingData.teamName}
                  onChange={(e) => updateData('teamName', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Goals (Check all that apply)
                </label>
                <div className="space-y-2">
                  {[
                    'Improve speed and agility',
                    'Increase endurance',
                    'Better technique',
                    'Team coordination',
                    'Competition preparation'
                  ].map(goal => (
                    <label key={goal} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={onboardingData.goals.includes(goal)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateData('goals', [...onboardingData.goals, goal]);
                          } else {
                            updateData('goals', onboardingData.goals.filter(g => g !== goal));
                          }
                        }}
                      />
                      {goal}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">You&apos;re All Set!</h2>
              <p className="text-gray-600">Ready to start your flag football journey?</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Your Profile Summary:</h3>
              <ul className="space-y-1 text-green-700">
                <li><strong>Position:</strong> {onboardingData.position || 'Not specified'}</li>
                <li><strong>Experience:</strong> {onboardingData.experience || 'Not specified'}</li>
                <li><strong>Team:</strong> {onboardingData.teamName || 'Individual player'}</li>
                <li><strong>Goals:</strong> {onboardingData.goals.length} selected</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-4">
                You can always update these settings in your profile later.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Step {step} of 3</span>
              <span>{Math.round((step / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {renderStep()}

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Skip for now
            </button>
            
            <div className="space-x-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {step === 3 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;
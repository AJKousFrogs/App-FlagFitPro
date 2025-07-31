import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    role: '',
    primaryPosition: '',
    experience: '',
    
    // Step 2: Physical Profile
    height: '',
    weight: '',
    age: '',
    
    // Step 3: Goals
    trainingGoals: [],
    trainingFrequency: '',
    
    // Step 4: Preferences
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  });
  const navigate = useNavigate();

  const totalSteps = 4;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Tell us about yourself' },
    { id: 2, title: 'Physical Profile', description: 'Your measurements' },
    { id: 3, title: 'Training Goals', description: 'What do you want to achieve?' },
    { id: 4, title: 'Preferences', description: 'Customize your experience' }
  ];

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('Onboarding completed:', formData);
        navigate('/dashboard');
      } catch (err) {
        console.error('Onboarding failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.role && formData.primaryPosition && formData.experience;
      case 2:
        return formData.height && formData.weight && formData.age;
      case 3:
        return formData.trainingGoals.length > 0 && formData.trainingFrequency;
      case 4:
        return true; // Preferences are optional
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">What's your role?</h3>
              <div className="grid grid-cols-1 gap-3">
                {['Player', 'Coach', 'Parent/Guardian'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={cn(
                      "p-4 text-left border-2 rounded-lg transition-colors",
                      formData.role === role
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => handleChange('role', role)}
                  >
                    <div className="font-medium">{role}</div>
                  </button>
                ))}
              </div>
            </div>

            {formData.role === 'Player' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Primary Position</h3>
                <select
                  value={formData.primaryPosition}
                  onChange={(e) => handleChange('primaryPosition', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select your position</option>
                  <option value="QB">Quarterback (QB)</option>
                  <option value="WR">Wide Receiver (WR)</option>
                  <option value="RB">Running Back (RB)</option>
                  <option value="DB">Defensive Back (DB)</option>
                  <option value="LB">Linebacker (LB)</option>
                  <option value="C">Center (C)</option>
                </select>
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Experience Level</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'beginner', label: 'Beginner', desc: '0-1 years' },
                  { value: 'intermediate', label: 'Intermediate', desc: '1-3 years' },
                  { value: 'advanced', label: 'Advanced', desc: '3+ years' },
                  { value: 'professional', label: 'Professional', desc: 'Competitive level' }
                ].map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    className={cn(
                      "p-4 text-left border-2 rounded-lg transition-colors",
                      formData.experience === level.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => handleChange('experience', level.value)}
                  >
                    <div className="font-medium">{level.label}</div>
                    <div className="text-sm text-gray-500">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Physical Profile</h3>
              <p className="text-gray-600 mb-6">Help us create personalized training plans</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                <input
                  type="text"
                  placeholder="5'10&quot; or 178 cm"
                  value={formData.height}
                  onChange={(e) => handleChange('height', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                <input
                  type="text"
                  placeholder="170 lbs or 77 kg"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <input
                type="number"
                placeholder="25"
                min="13"
                max="100"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Training Goals</h3>
              <p className="text-gray-600 mb-6">What do you want to achieve? (Select all that apply)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Improve Speed',
                'Build Strength',
                'Master Position Skills',
                'Team Chemistry',
                'Injury Prevention',
                'Endurance',
                'Agility',
                'Mental Performance'
              ].map((goal) => (
                <button
                  key={goal}
                  type="button"
                  className={cn(
                    "p-4 text-left border-2 rounded-lg transition-colors",
                    formData.trainingGoals.includes(goal)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handleArrayToggle('trainingGoals', goal)}
                >
                  <div className="font-medium">{goal}</div>
                </button>
              ))}
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Training Frequency</h3>
              <select
                value={formData.trainingFrequency}
                onChange={(e) => handleChange('trainingFrequency', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">How often do you want to train?</option>
                <option value="2-3">2-3 times per week</option>
                <option value="4-5">4-5 times per week</option>
                <option value="6-7">6-7 times per week (Advanced)</option>
                <option value="daily">Daily training</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <p className="text-gray-600 mb-6">Stay updated with your training progress</p>
            </div>

            <div className="space-y-4">
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Training reminders and progress updates' },
                { key: 'push', label: 'Push Notifications', desc: 'Real-time alerts on your device' },
                { key: 'sms', label: 'SMS Notifications', desc: 'Important updates via text message' }
              ].map((option) => (
                <div key={option.key} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={option.key}
                    checked={formData.notifications[option.key]}
                    onChange={(e) => handleChange('notifications', {
                      ...formData.notifications,
                      [option.key]: e.target.checked
                    })}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor={option.key} className="font-medium text-gray-900">
                      {option.label}
                    </label>
                    <p className="text-sm text-gray-500">{option.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-green-500 text-2xl mr-3">🎯</div>
                <div>
                  <h4 className="font-semibold text-green-800">Almost Ready!</h4>
                  <p className="text-green-700 text-sm">
                    Complete your setup to start your personalized training journey.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to FlagFit Pro! 🏈
          </h1>
          <p className="text-gray-600">
            Let's set up your personalized training experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2",
                    currentStep >= step.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <div className="text-xs text-gray-600 max-w-20">
                  <div className="font-medium">{step.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-gray-600">
              {steps[currentStep - 1].description}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Setting up...</span>
                </div>
              ) : currentStep === totalSteps ? (
                'Complete Setup'
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip for now - I'll complete this later
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
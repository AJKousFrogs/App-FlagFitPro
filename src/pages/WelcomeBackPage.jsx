import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, FocusScope } from '../utils/radixComponents';
import { Eye, EyeOff, Lock, Smartphone } from '../utils/icons';
import { cn } from '../utils/cn';
import '../styles/welcome-back-page.css';

const WelcomeBackPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    try {
      // Basic validation
      const newErrors = {};
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (onLogin) {
        onLogin(formData);
      }
      
      navigate('/dashboard');
    } catch (err) {
      setErrors({ general: err.message || 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBiometricLogin = () => {
    // Implement biometric authentication
    console.log('Biometric login triggered');
  };

  const handlePhoneLogin = () => {
    // Navigate to phone login page
    navigate('/phone-login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <FocusScope.Root trapped>
        <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          {/* Header */}
          <div className="text-center p-8 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back! 🏈
            </h1>
            <p className="text-gray-600 text-lg">
              Ready to dominate today's training?
            </p>
          </div>

          {/* Content */}
          <div className="px-8 pb-8 space-y-6">
            {/* Sponsor Banner */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">💪</div>
                  <span className="font-medium text-gray-800">
                    Start your fitness journey
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                    AD
                  </span>
                  <button className="bg-yellow-500 text-white hover:bg-yellow-600 px-3 py-1 rounded text-sm font-medium transition-colors">
                    GET STARTED
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">
                  {errors.general}
                </p>
              </div>
            )}

            {/* Login Form */}
            <Form.Root onSubmit={handleSubmit} className="space-y-6">
              <Form.Field name="email" className="space-y-2">
                <Form.Label className="text-sm font-medium text-gray-700">
                  Email
                </Form.Label>
                <Form.Control asChild>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                      errors.email 
                        ? "border-red-300 focus:border-red-500" 
                        : "border-gray-200 focus:border-blue-500"
                    )}
                    disabled={isLoading}
                  />
                </Form.Control>
                {errors.email && (
                  <Form.Message className="text-red-600 text-sm">
                    {errors.email}
                  </Form.Message>
                )}
              </Form.Field>

              <Form.Field name="password" className="space-y-2">
                <Form.Label className="text-sm font-medium text-gray-700">
                  Password
                </Form.Label>
                <Form.Control asChild>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className={cn(
                        "w-full px-4 py-3 pr-12 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                        errors.password 
                          ? "border-red-300 focus:border-red-500" 
                          : "border-gray-200 focus:border-blue-500"
                      )}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </Form.Control>
                {errors.password && (
                  <Form.Message className="text-red-600 text-sm">
                    {errors.password}
                  </Form.Message>
                )}
              </Form.Field>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full bg-black text-white py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  "SIGN IN"
                )}
              </button>
            </Form.Root>

            {/* Alternative Login Options */}
            <div className="flex flex-col gap-3">
              <button
                className="w-full border-2 border-gray-200 py-3 rounded-lg hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                onClick={handleBiometricLogin}
                disabled={isLoading}
              >
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5" />
                  <span>BIOMETRIC LOGIN</span>
                </div>
              </button>

              <button
                className="w-full border-2 border-gray-200 py-3 rounded-lg hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                onClick={handlePhoneLogin}
                disabled={isLoading}
              >
                <div className="flex items-center justify-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  <span>CONTINUE WITH PHONE</span>
                </div>
              </button>
            </div>

            {/* Footer Links */}
            <div className="flex flex-col gap-2 text-center pt-4">
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:text-blue-800 underline text-sm transition-colors"
              >
                Forgot Password?
              </Link>
              <p className="text-gray-600 text-sm">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </FocusScope.Root>
    </div>
  );
};

export default WelcomeBackPage; 
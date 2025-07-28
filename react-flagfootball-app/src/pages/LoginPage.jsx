import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SponsorBanner from '../components/SponsorBanner';

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 Form submitted!', formData);
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate login process
      console.log('🔄 Starting login process...');
      
      // Basic validation
      if (!formData.email || !formData.password) {
        console.log('❌ Validation failed - missing fields');
        throw new Error('Please fill in all fields');
      }
      
      console.log('✅ Validation passed, simulating API call...');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('📞 Calling onLogin function...');
      
      // Call the onLogin function from App.jsx
      if (onLogin) {
        console.log('✅ onLogin function exists, calling it...');
        onLogin(formData);
      } else {
        console.log('⚠️ onLogin function is undefined!');
      }
      
      console.log('🧭 Navigating to dashboard...');
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.log('❌ Error occurred:', err.message);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      console.log('🏁 Login process finished');
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-page">
      <div className="login-form">
        <h2>Welcome Back! 🏈</h2>
        <div>Ready to dominate today&apos;s training?</div>
        
        {/* Top Banner for Free Users */}
        <SponsorBanner 
          position="top" 
          size="wide" 
          isPremium={false}
          sponsor={{
            name: 'LaprimaFit',
            logo: '💪',
            message: 'Start your fitness journey with premium equipment',
            cta: 'Get Started',
            link: '#'
          }}
        />
        
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
            onClick={() => console.log('🔘 Button clicked!')}
            style={{
              cursor: 'pointer',
              backgroundColor: '#fff',
              border: '2px solid #333',
              padding: '12px',
              width: '100%',
              fontSize: '16px',
              fontWeight: 'bold',
              margin: '15px 0'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="login-options">
          <button className="social-login-btn" disabled={isLoading}>
            🔐 Biometric Login
          </button>
          <button className="social-login-btn" disabled={isLoading}>
            📱 Continue with Phone
          </button>
        </div>
        
        <div className="login-links">
          <Link to="/forgot-password">Forgot Password?</Link>
          <span>Don&apos;t have an account? </span>
          <Link to="/register">Create Account</Link>
        </div>
        
        {/* Sponsor Logos Section */}
        <div className="sponsor-section">
          <h3>Powered by our sponsors</h3>
          <div className="sponsor-grid">
            <div className="sponsor-logo">GearXPro</div>
            <div className="sponsor-logo">LaprimaFit</div>
            <div className="sponsor-logo">Chemius</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 
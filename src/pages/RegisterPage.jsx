import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MeasurementToggle from '../components/MeasurementToggle';
import MeasurementInput from '../components/MeasurementInput';
import SponsorBanner from '../components/SponsorBanner';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    team: 'Hawks',
    primaryPosition: 'QB',
    experience: 'Beginner',
    weight: 0,
    height: 0
  });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle registration logic here
    console.log('Registration attempt:', formData);
    navigate('/onboarding');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleMeasurementChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="register-page">
      <div className="register-form">
        <h2>Create Your Account 🏈</h2>
        <div>Join FlagFit Pro and start your training journey!</div>
        
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
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Team</label>
              <select
                name="team"
                value={formData.team}
                onChange={handleChange}
              >
                <option value="Hawks">Hawks</option>
                <option value="Eagles">Eagles</option>
                <option value="Lions">Lions</option>
                <option value="Bears">Bears</option>
              </select>
            </div>
            <div className="form-group">
              <label>Primary Position</label>
              <select
                name="primaryPosition"
                value={formData.primaryPosition}
                onChange={handleChange}
              >
                <option value="QB">Quarterback</option>
                <option value="WR">Wide Receiver</option>
                <option value="RB">Running Back</option>
                <option value="DB">Defensive Back</option>
                <option value="LB">Linebacker</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Experience Level</label>
            <select
              name="experience"
              value={formData.experience}
              onChange={handleChange}
            >
              <option value="Beginner">Beginner (0-1 years)</option>
              <option value="Intermediate">Intermediate (1-3 years)</option>
              <option value="Advanced">Advanced (3+ years)</option>
            </select>
          </div>
          
          <div className="measurement-section">
            <h3>Physical Profile</h3>
            <MeasurementToggle />
            
            <div className="measurement-inputs">
              <div className="form-group">
                <label>Height</label>
                <MeasurementInput
                  type="height"
                  value={formData.height}
                  onChange={(value) => handleMeasurementChange('height', value)}
                  placeholder="Enter height"
                />
              </div>
              
              <div className="form-group">
                <label>Weight</label>
                <MeasurementInput
                  type="weight"
                  value={formData.weight}
                  onChange={(value) => handleMeasurementChange('weight', value)}
                  placeholder="Enter weight"
                />
              </div>
            </div>
          </div>
          
          <button type="submit" className="create-account-btn">
            Create Account
          </button>
        </form>
        
        <div className="register-links">
          <span>Already have an account? </span>
          <Link to="/login">Sign In</Link>
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

export default RegisterPage; 
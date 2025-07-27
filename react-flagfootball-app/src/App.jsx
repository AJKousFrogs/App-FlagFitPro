import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { MeasurementProvider } from './contexts/MeasurementContext';
import MeasurementToggle from './components/MeasurementToggle';
import MeasurementInput from './components/MeasurementInput';
import MeasurementDisplay from './components/MeasurementDisplay';
import DraggableDashboard from './components/DraggableDashboard';
import AICoachMessage from './components/AICoachMessage';
import SponsorBanner from './components/SponsorBanner';

// Header Wireframe
const WireframeHeader = ({ onLogout, isPremium, onTogglePremium }) => {
  return (
    <header>
      <h1>🏈 FlagFit Pro</h1>
      <nav>
        <Link to="/">Dashboard</Link>
        <Link to="/training">Training</Link>
        <Link to="/community">Community</Link>
        <Link to="/tournaments">Tournaments</Link>
        <Link to="/profile">Profile</Link>
      </nav>
      <div>
        <span>🌙 Theme</span>
        <span>👤 Avatar</span>
        <button 
          onClick={onTogglePremium}
          style={{
            border: '1px solid #333',
            background: isPremium ? '#4CAF50' : '#fff',
            color: isPremium ? '#fff' : '#333',
            padding: '4px 8px',
            fontSize: '12px',
            marginRight: '10px'
          }}
        >
          {isPremium ? '⭐ Premium' : '💰 Free'}
        </button>
        <button onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
};

// Registration Page Wireframe
const WireframeRegister = ({ onRegister, isPremium }) => {
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
    onRegister(formData);
    navigate('/');
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
    <div className="login-form">
      <h2>Create Your Account 🏈</h2>
      <div>Join FlagFit Pro and start your training journey!</div>
      
      {/* Top Banner for Free Users */}
      <SponsorBanner 
        position="top" 
        size="wide" 
        isPremium={isPremium}
        sponsor={{
          name: 'LaprimaFit',
          logo: '💪',
          message: 'Start your fitness journey with premium equipment',
          cta: 'Get Started',
          link: '#'
        }}
      />
      
      {/* Sponsor Logos Section */}
      <div className="sponsor-section">
        <h3>Official Partners of FlagFit Pro</h3>
        <div className="sponsor-grid">
          <div className="sponsor-logo">[Sponsor Logo 1]</div>
          <div className="sponsor-logo">[Sponsor Logo 2]</div>
          <div className="sponsor-logo">[Sponsor Logo 3]</div>
          <div className="sponsor-logo">[Sponsor Logo 4]</div>
          <div className="sponsor-logo">[Sponsor Logo 5]</div>
          <div className="sponsor-logo">[Sponsor Logo 6]</div>
        </div>
      </div>

      {/* Measurement System Toggle */}
      <MeasurementToggle />
      
      <form onSubmit={handleSubmit}>
        <div className="grid">
          <div>
            <label>First Name</label>
            <input 
              type="text" 
              name="firstName"
              value={formData.firstName} 
              onChange={handleChange}
              placeholder="Alex"
              required
            />
          </div>
          <div>
            <label>Last Name</label>
            <input 
              type="text" 
              name="lastName"
              value={formData.lastName} 
              onChange={handleChange}
              placeholder="Rivera"
              required
            />
          </div>
        </div>
        
        <div>
          <label>Email Address</label>
          <input 
            type="email" 
            name="email"
            value={formData.email} 
            onChange={handleChange}
            placeholder="alex.rivera@email.com"
            required
          />
        </div>
        
        <div>
          <label>Password</label>
          <input 
            type="password" 
            name="password"
            value={formData.password} 
            onChange={handleChange}
            placeholder="••••••••••••••••••••••••••••••••••••••••"
            required
          />
          <span>👁️</span>
        </div>
        
        <div>Password strength: ████████████████████████████████████████████</div>
        
        <div>
          <label>Confirm Password</label>
          <input 
            type="password" 
            name="confirmPassword"
            value={formData.confirmPassword} 
            onChange={handleChange}
            placeholder="••••••••••••••••••••••••••••••••••••••••"
            required
          />
        </div>
        
        <div className="card">
          <h3>Team & Position Setup</h3>
          <div>
            <label>Team</label>
            <select name="team" value={formData.team} onChange={handleChange}>
              <option>Hawks</option>
              <option>Eagles</option>
              <option>Lions</option>
              <option>Bears</option>
              <option>Create New Team</option>
            </select>
          </div>
          
          <div>
            <label>Primary Position</label>
            <select name="primaryPosition" value={formData.primaryPosition} onChange={handleChange}>
              <option>QB</option>
              <option>WR</option>
              <option>Center</option>
              <option>Blitzer</option>
              <option>DB</option>
            </select>
          </div>
          
          <div>
            <label>Experience Level</label>
            <select name="experience" value={formData.experience} onChange={handleChange}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Elite</option>
            </select>
          </div>
        </div>

        <div className="card">
          <h3>Physical Profile</h3>
          <MeasurementInput
            type="weight"
            value={formData.weight}
            onChange={(value) => handleMeasurementChange('weight', value)}
            label="Weight"
            placeholder="Enter your weight"
          />
          <MeasurementInput
            type="height"
            value={formData.height}
            onChange={(value) => handleMeasurementChange('height', value)}
            label="Height"
            placeholder="Enter your height"
          />
        </div>
        
        <div>
          <input type="checkbox" required /> I agree to the Terms of Service and Privacy Policy
        </div>
        
        <div>
          <input type="checkbox" /> Send me training tips and updates
        </div>
        
        <button type="submit">Create Account</button>
      </form>

      <div className="text-center">─────────────── or ───────────────</div>
      
      <div className="flex">
        <button>Google</button>
        <button>Apple</button>
        <button>Facebook</button>
      </div>

      <div className="text-center">
        Already have an account? <Link to="/login">Sign In</Link>
      </div>
      
      {/* Bottom Banner for Free Users */}
      <SponsorBanner 
        position="bottom" 
        size="medium" 
        isPremium={isPremium}
        sponsor={{
          name: 'GearX Pro',
          logo: '🏆',
          message: 'New members get 15% off their first purchase',
          cta: 'Claim Offer',
          link: '#'
        }}
      />
    </div>
  );
};

// Login Page Wireframe
const WireframeLogin = ({ onLogin, isPremium }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    onLogin({ email, role: 'Player', team: 'Hawks' });
    navigate('/');
  };

  return (
    <div className="login-form">
      <h2>Welcome Back! 🏈</h2>
      <div>Ready to dominate today&apos;s training?</div>
      
      {/* Top Banner for Free Users */}
      <SponsorBanner 
        position="top" 
        size="wide" 
        isPremium={isPremium}
        sponsor={{
          name: 'GearX Pro',
          logo: '🏆',
          message: 'Upgrade your game with premium gear! 20% off for FlagFit Pro users',
          cta: 'Shop Now',
          link: '#'
        }}
      />
      
      {/* Sponsor Logos Section */}
      <div className="sponsor-section">
        <h3>Official Partners of FlagFit Pro</h3>
        <div className="sponsor-grid">
          <div className="sponsor-logo">[Sponsor Logo 1]</div>
          <div className="sponsor-logo">[Sponsor Logo 2]</div>
          <div className="sponsor-logo">[Sponsor Logo 3]</div>
          <div className="sponsor-logo">[Sponsor Logo 4]</div>
          <div className="sponsor-logo">[Sponsor Logo 5]</div>
          <div className="sponsor-logo">[Sponsor Logo 6]</div>
        </div>
      </div>
      
      <div className="card">
        <h3>Role Auto-Detection</h3>
        <div>Detected: Player (QB/WR) - Hawks Team</div>
      </div>

      <form>
        <div>
          <label>Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex.rivera@email.com"
          />
        </div>
        
        <div>
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••••••••••••••••••••••••••••••"
          />
          <span>👁️</span>
        </div>
        
        <div>Password strength: ████████████████████████████████████████████</div>
        
        <div>
          <input type="checkbox" /> Remember me for 30 days
          <button type="button">Forgot Password?</button>
        </div>
        
        <button type="button" onClick={handleLogin}>🔐 Login with Email</button>
      </form>

      <div className="text-center">─────────────── or ───────────────</div>
      
      <div className="flex">
        <button>Google</button>
        <button>Apple</button>
        <button>Facebook</button>
      </div>
      
      <div>
        <button>👆 Touch ID / Face ID Login</button>
      </div>

      <div className="card">
        <h3>Quick Stats Preview</h3>
        <div>Last Login: 2 hours ago</div>
        <div>Training Streak: 5 days 🔥</div>
        <div>Next Game: Tomorrow vs Eagles</div>
        <div>Team Chemistry: 87% ⭐</div>
      </div>

      <div className="text-center">
        <Link to="/register" className="button-link">
          <button className="create-account-btn">Create Account</button>
        </Link>
      </div>
      
      {/* Bottom Banner for Free Users */}
      <SponsorBanner 
        position="bottom" 
        size="medium" 
        isPremium={isPremium}
        sponsor={{
          name: 'Chemius',
          logo: '💊',
          message: 'Boost your performance with premium supplements',
          cta: 'Learn More',
          link: '#'
        }}
      />
    </div>
  );
};

// Onboarding Wireframe
const WireframeOnboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    primaryPosition: 'QB',
    secondaryPosition: 'WR',
    team: 'Hawks',
    experience: 'Beginner',
    weight: 0,
    height: 0,
    goals: [],
    availability: []
  });

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
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

  const progress = (step / 5) * 100;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Welcome to FlagFit Pro! 🏈</h2>
        <div>Let&apos;s set up your profile in 5 quick steps</div>
        
        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        
        <div>Step {step} of 5</div>

        {step === 1 && (
          <div>
            <h3>Position & Team Setup</h3>
            <div>
              <label>Primary Position</label>
              <select name="primaryPosition" value={formData.primaryPosition} onChange={handleChange}>
                <option>QB</option>
                <option>WR</option>
                <option>Center</option>
                <option>Blitzer</option>
                <option>DB</option>
              </select>
            </div>
            <div>
              <label>Secondary Position</label>
              <select name="secondaryPosition" value={formData.secondaryPosition} onChange={handleChange}>
                <option>QB</option>
                <option>WR</option>
                <option>Center</option>
                <option>Blitzer</option>
                <option>DB</option>
              </select>
            </div>
            <div>
              <label>Team</label>
              <select name="team" value={formData.team} onChange={handleChange}>
                <option>Hawks</option>
                <option>Eagles</option>
                <option>Lions</option>
                <option>Bears</option>
                <option>Create New Team</option>
              </select>
            </div>
            <div>
              <label>Experience Level</label>
              <select name="experience" value={formData.experience} onChange={handleChange}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Elite</option>
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3>Physical Profile</h3>
            <MeasurementToggle />
            <MeasurementInput
              type="weight"
              value={formData.weight}
              onChange={(value) => handleMeasurementChange('weight', value)}
              label="Weight"
              placeholder="Enter your weight"
            />
            <MeasurementInput
              type="height"
              value={formData.height}
              onChange={(value) => handleMeasurementChange('height', value)}
              label="Height"
              placeholder="Enter your height"
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <h3>Training Goals</h3>
            <div>Select your primary training goals:</div>
            <div>
              <input type="checkbox" /> Improve Speed & Agility
            </div>
            <div>
              <input type="checkbox" /> Build Strength & Power
            </div>
            <div>
              <input type="checkbox" /> Enhance Endurance
            </div>
            <div>
              <input type="checkbox" /> Master Position Skills
            </div>
            <div>
              <input type="checkbox" /> Team Chemistry
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3>Availability & Schedule</h3>
            <div>When are you available for training?</div>
            <div>
              <input type="checkbox" /> Monday
            </div>
            <div>
              <input type="checkbox" /> Tuesday
            </div>
            <div>
              <input type="checkbox" /> Wednesday
            </div>
            <div>
              <input type="checkbox" /> Thursday
            </div>
            <div>
              <input type="checkbox" /> Friday
            </div>
            <div>
              <input type="checkbox" /> Saturday
            </div>
            <div>
              <input type="checkbox" /> Sunday
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h3>Review & Complete</h3>
            <div>Let&apos;s review your setup:</div>
            <div>Primary Position: {formData.primaryPosition}</div>
            <div>Secondary Position: {formData.secondaryPosition}</div>
            <div>Team: {formData.team}</div>
            <div>Experience: {formData.experience}</div>
            <div>Weight: {formData.weight}</div>
            <div>Height: {formData.height}</div>
            <div>Ready to start your training journey!</div>
          </div>
        )}

        <div className="flex">
          {step > 1 && <button onClick={handleBack}>Back</button>}
          <button onClick={handleNext}>
            {step === 5 ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Training Page Wireframe
const WireframeTraining = () => {
  return (
    <div>
      {/* AI Coach Message - Full component with daily motivational quotes */}
      <AICoachMessage />
      
      <div className="dashboard-stats">
        <div className="stats-card">
          <div>Current Streak</div>
          <div>7 days</div>
        </div>
        <div className="stats-card">
          <div>Player Level</div>
          <div>Route Runner Pro</div>
          <div>2400 XP</div>
        </div>
        <div className="stats-card">
          <div>Daily Challenge</div>
          <div>Complete 5 Routes</div>
          <div>+50 XP</div>
        </div>
      </div>
      
      <div className="card">
        <h3>Position-Specific Training Focus</h3>
        <div className="grid">
          <div className="card">
            <h4>🎯 QB Primary Focus Areas</h4>
            <div>• Pocket Presence: Decision time 0.3s slower</div>
            <div>• Red Zone Efficiency: 67% success rate (target: 75%)</div>
            <div>• Intermediate Routes: Timing needs improvement</div>
            <div>📈 This Week&apos;s Improvement: +12% accuracy on crossing patterns</div>
          </div>
          <div className="card">
            <h4>🎯 WR Secondary Focus Areas</h4>
            <div>• Route Precision: 78% (target: 85%)</div>
            <div>• Catch Rate: 67% (target: 75%)</div>
            <div>• Chemistry with QB: 8.3/10 (excellent)</div>
            <div>📈 This Week: +8% timing with Mike Johnson</div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>Coach-Recommended Drills</h3>
        <div className="grid">
          <div className="card">
            <h4>🏈 QB Pocket Movement Drills</h4>
            <div>Coach AJ&apos;s recommendation</div>
            <div>Duration: 30 min • Difficulty: Advanced</div>
            <div>Focus: Decision making under pressure</div>
            <div className="flex">
              <button>Start Drill</button>
              <button>View Details</button>
            </div>
          </div>
          <div className="card">
            <h4>🎯 QB-WR Chemistry Drills</h4>
            <div>Team chemistry building</div>
            <div>Duration: 45 min • Difficulty: Intermediate</div>
            <div>Focus: Timing with Mike Johnson</div>
            <div className="flex">
              <button>Start Drill</button>
              <button>View Details</button>
            </div>
          </div>
          <div className="card">
            <h4>🛡️ Blitzer Pass Rush Drills</h4>
            <div>Defensive pressure training</div>
            <div>Duration: 25 min • Difficulty: Intermediate</div>
            <div>Focus: Speed and pressure timing</div>
            <div className="flex">
              <button>Start Drill</button>
              <button>View Details</button>
            </div>
          </div>
          <div className="card">
            <h4>🎯 DB Coverage Drills</h4>
            <div>Defensive back fundamentals</div>
            <div>Duration: 35 min • Difficulty: Advanced</div>
            <div>Focus: Man and zone coverage</div>
            <div className="flex">
              <button>Start Drill</button>
              <button>View Details</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>Training Categories</h3>
        <div className="training-categories">
          <div>🏃 Route Running</div>
          <div>⚡ Plyometrics</div>
          <div>🏃‍♂️ Speed Training</div>
          <div>💪 Strength</div>
          <div>🎯 Accuracy</div>
          <div>🧠 Mental</div>
          <div>🛡️ Defense</div>
          <div>🏈 Position-Specific</div>
        </div>
      </div>
    </div>
  );
};

// Community Page Wireframe
const WireframeCommunity = () => {
  const [activeTab, setActiveTab] = useState('chat');

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div>
      <h2>Community 🏈</h2>
      
      <div className="tabs">
        <button 
          className={activeTab === 'chat' ? 'active' : ''} 
          onClick={() => handleTabClick('chat')}
        >
          Chat
        </button>
        <button 
          className={activeTab === 'training' ? 'active' : ''} 
          onClick={() => handleTabClick('training')}
        >
          Training Sessions
        </button>
        <button 
          className={activeTab === 'knowledge' ? 'active' : ''} 
          onClick={() => handleTabClick('knowledge')}
        >
          Knowledge
        </button>
        <button 
          className={activeTab === 'film' ? 'active' : ''} 
          onClick={() => handleTabClick('film')}
        >
          Film Room
        </button>
      </div>
      
      {/* Chat Tab Content */}
      {activeTab === 'chat' && (
        <>
          <div className="card">
            <h3>Team Overview - Hawks</h3>
            <div className="dashboard-stats">
              <div className="stats-card">
                <div>Active Players</div>
                <div>23</div>
              </div>
              <div className="stats-card">
                <div>Team Chemistry Average</div>
                <div>7.8/10</div>
                <div>🟢 Good</div>
              </div>
              <div className="stats-card">
                <div>Next Game</div>
                <div>vs Eagles</div>
                <div>Tomorrow</div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3>Chat Rooms</h3>
            <div className="chat-rooms">
              <div className="card">
                <h4>🏈 Main Team Chat (23 members) [3 unread]</h4>
                <div>&quot;Practice tomorrow at 6 PM!&quot;</div>
                <div>Chemistry: 7.8/10 🟢</div>
              </div>
              <div className="card">
                <h4>⚡ Offense Chat (12 members) [2 unread]</h4>
                <div>&quot;New route combinations to practice&quot;</div>
                <div>Chemistry: 8.3/10 🟢</div>
              </div>
              <div className="card">
                <h4>🛡️ Defense Chat (11 members) [1 unread]</h4>
                <div>&quot;Great job on coverage drills!&quot;</div>
                <div>Chemistry: 7.5/10 🟡</div>
              </div>
              <div className="card">
                <h4>👨‍🏫 Coaches Corner (5 coaches)</h4>
                <div>&quot;Team meeting after practice&quot;</div>
                <div>Chemistry: 8.0/10 🟢</div>
              </div>
              <div className="card">
                <h4>👥 Players Corner (18 players)</h4>
                <div>&quot;Who&apos;s up for extra practice this weekend?&quot;</div>
                <div>Chemistry: 8.2/10 🟢</div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3>Chat Messages</h3>
            <div>
              <div className="chat-message">
                <h4>👨‍🏫 Coach AJ (10:30 AM)</h4>
                <div>Great practice today everyone! Remember tomorrow&apos;s session starts at 6 PM sharp.</div>
                <div>[Announcement] [👍12] [🏈5]</div>
              </div>
              <div className="chat-message">
                <h4>🔥 Mike Johnson (WR) (10:45 AM)</h4>
                <div>Can someone share the new route diagrams?</div>
                <div>Chemistry with you: 8.3/10 🟢</div>
              </div>
              <div className="chat-message">
                <h4>⚡ Marcus Lightning (10:46 AM)</h4>
                <div>I&apos;ll send them over in a few minutes!</div>
                <div>Chemistry with you: 7.8/10 🟢</div>
              </div>
              <div className="chat-message">
                <h4>🛡️ Tyler Brown (DB) (10:50 AM)</h4>
                <div>Defense unit meeting at 5:30 PM for coverage review</div>
                <div>Chemistry with you: 7.5/10 🟡</div>
              </div>
              <div className="chat-message">
                <h4>⚡ Jake &quot;The Snake&quot; (Blitzer) (10:52 AM)</h4>
                <div>Blitzers - we&apos;re working on pressure timing tomorrow</div>
                <div>Chemistry with you: 6.8/10 🟡</div>
              </div>
            </div>
            
            <div className="chat-input">
              <input placeholder="Type a message..." />
              <button>Send</button>
            </div>
          </div>
        </>
      )}
      
      {/* Training Sessions Tab Content */}
      {activeTab === 'training' && (
        <div className="card">
          <h3>🏋️ Training Sessions</h3>
          <div className="training-sessions">
            <div className="card">
              <h4>📅 Upcoming Sessions</h4>
              <div className="session-item">
                <div className="session-time">Tomorrow 6:00 PM</div>
                <div className="session-details">
                  <div>Team Practice - Route Running Focus</div>
                  <div>Duration: 2 hours • Location: Central Field</div>
                  <div>Coach: AJ • Players: 23 confirmed</div>
                </div>
              </div>
              <div className="session-item">
                <div className="session-time">Saturday 9:00 AM</div>
                <div className="session-details">
                  <div>Strength & Conditioning</div>
                  <div>Duration: 1.5 hours • Location: Gym</div>
                  <div>Coach: Mike • Players: 18 confirmed</div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <h4>📊 Recent Sessions</h4>
              <div className="session-item">
                <div className="session-time">Today 6:00 PM</div>
                <div className="session-details">
                  <div>Defensive Coverage Drills</div>
                  <div>Duration: 1.5 hours • Attendance: 20/23</div>
                  <div>Rating: 4.2/5 • Chemistry: +0.3</div>
                </div>
              </div>
              <div className="session-item">
                <div className="session-time">Yesterday 5:30 PM</div>
                <div className="session-details">
                  <div>QB-WR Chemistry Practice</div>
                  <div>Duration: 1 hour • Attendance: 12/15</div>
                  <div>Rating: 4.5/5 • Chemistry: +0.5</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Knowledge Tab Content */}
      {activeTab === 'knowledge' && (
        <div className="card">
          <h3>📚 Knowledge Base</h3>
          <div className="knowledge-base">
            <div className="card">
              <h4>📖 Playbook</h4>
              <div className="knowledge-item">
                <div>🏈 Offensive Plays</div>
                <div>• Route combinations</div>
                <div>• QB progressions</div>
                <div>• Blocking schemes</div>
              </div>
              <div className="knowledge-item">
                <div>🛡️ Defensive Plays</div>
                <div>• Coverage schemes</div>
                <div>• Blitz packages</div>
                <div>• Zone assignments</div>
              </div>
            </div>
            
            <div className="card">
              <h4>🎯 Training Resources</h4>
              <div className="knowledge-item">
                <div>💪 Strength Training</div>
                <div>• Position-specific workouts</div>
                <div>• Recovery protocols</div>
                <div>• Nutrition guidelines</div>
              </div>
              <div className="knowledge-item">
                <div>🏃 Speed & Agility</div>
                <div>• Ladder drills</div>
                <div>• Cone work</div>
                <div>• Plyometric exercises</div>
              </div>
            </div>
            
            <div className="card">
              <h4>📋 Team Policies</h4>
              <div className="knowledge-item">
                <div>📅 Attendance Policy</div>
                <div>• Practice requirements</div>
                <div>• Game day protocols</div>
                <div>• Communication guidelines</div>
              </div>
              <div className="knowledge-item">
                <div>🏥 Health & Safety</div>
                <div>• Injury reporting</div>
                <div>• Concussion protocols</div>
                <div>• Emergency procedures</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
            {/* Film Room Tab Content */}
      {activeTab === 'film' && (
        <div className="card">
          <h3>🎬 Film Room - Game Analysis & Discussion</h3>
          <div className="film-room-intro">
            <p>Coaches can upload game videos from YouTube and analyze player performance. Players can discuss strategies and learn from game footage.</p>
          </div>
        
        {/* Upload New Game Video */}
        <div className="card">
          <h4>📹 Upload New Game Video</h4>
          <div className="upload-section">
            <div>
              <label>YouTube Video URL</label>
              <input 
                type="url" 
                placeholder="https://www.youtube.com/watch?v=..." 
                className="youtube-url-input"
              />
            </div>
            <div>
              <label>Game Title</label>
              <input 
                type="text" 
                placeholder="e.g., Hawks vs Eagles - Week 3" 
              />
            </div>
            <div>
              <label>Date</label>
              <input 
                type="date" 
              />
            </div>
            <div>
              <label>Opponent</label>
              <input 
                type="text" 
                placeholder="e.g., Eagles" 
              />
            </div>
            <div>
              <label>Coach Notes</label>
              <textarea 
                placeholder="Brief description of key moments to analyze..." 
                rows="3"
              />
            </div>
            <button className="upload-btn">📹 Upload Game Video</button>
          </div>
        </div>
        
        {/* Recent Game Videos */}
        <div className="card">
          <h4>🎬 Recent Game Videos</h4>
          <div className="game-videos-grid">
            <div className="video-card">
              <div className="video-thumbnail">
                <div className="play-button">▶️</div>
                <div className="video-duration">12:45</div>
              </div>
              <div className="video-info">
                <h5>Hawks vs Eagles - Week 3</h5>
                <div>Uploaded by Coach AJ • 2 days ago</div>
                <div>Key Focus: QB Pocket Presence & WR Route Timing</div>
                <div className="video-stats">
                  <span>👁️ 23 views</span>
                  <span>💬 8 comments</span>
                  <span>⭐ 4.8/5 rating</span>
                </div>
              </div>
              <div className="video-actions">
                <button>Watch & Analyze</button>
                <button>View Comments</button>
              </div>
            </div>
            
            <div className="video-card">
              <div className="video-thumbnail">
                <div className="play-button">▶️</div>
                <div className="video-duration">18:32</div>
              </div>
              <div className="video-info">
                <h5>Hawks vs Lions - Week 2</h5>
                <div>Uploaded by Coach AJ • 1 week ago</div>
                <div>Key Focus: Defensive Coverage & Blitz Timing</div>
                <div className="video-stats">
                  <span>👁️ 45 views</span>
                  <span>💬 12 comments</span>
                  <span>⭐ 4.6/5 rating</span>
                </div>
              </div>
              <div className="video-actions">
                <button>Watch & Analyze</button>
                <button>View Comments</button>
              </div>
            </div>
            
            <div className="video-card">
              <div className="video-thumbnail">
                <div className="play-button">▶️</div>
                <div className="video-duration">15:20</div>
              </div>
              <div className="video-info">
                <h5>Hawks vs Bears - Week 1</h5>
                <div>Uploaded by Coach AJ • 2 weeks ago</div>
                <div>Key Focus: Team Chemistry & Communication</div>
                <div className="video-stats">
                  <span>👁️ 67 views</span>
                  <span>💬 15 comments</span>
                  <span>⭐ 4.9/5 rating</span>
                </div>
              </div>
              <div className="video-actions">
                <button>Watch & Analyze</button>
                <button>View Comments</button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Coach Analysis & Tips */}
        <div className="card">
          <h4>👨‍🏫 Coach Analysis & Tips</h4>
          <div className="analysis-section">
            <div className="analysis-card">
              <h5>🎯 QB Performance Analysis - Week 3</h5>
              <div className="analysis-content">
                <div><strong>Alex Rivera (QB):</strong></div>
                <div>✅ Pocket presence improved by 15%</div>
                <div>✅ Decision time: 2.3s (target: 2.0s)</div>
                <div>⚠️ Red zone efficiency needs work</div>
                <div>📈 Overall rating: 8.2/10</div>
              </div>
              <div className="coach-tips">
                <div><strong>Coach Tips:</strong></div>
                <div>• Practice 3-step drop timing</div>
                <div>• Work on red zone play calling</div>
                <div>• Improve communication with WRs</div>
              </div>
            </div>
            
            <div className="analysis-card">
              <h5>🏃 WR Route Analysis - Week 3</h5>
              <div className="analysis-content">
                <div><strong>Mike Johnson (WR):</strong></div>
                <div>✅ Route precision: 85% (excellent)</div>
                <div>✅ Catch rate: 78% (improved)</div>
                <div>⚠️ Blocking technique needs refinement</div>
                <div>📈 Overall rating: 8.5/10</div>
              </div>
              <div className="coach-tips">
                <div><strong>Coach Tips:</strong></div>
                <div>• Continue route precision work</div>
                <div>• Practice blocking fundamentals</div>
                <div>• Maintain chemistry with QB</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Film Room Discussion */}
        <div className="card">
          <h4>💬 Film Room Discussion</h4>
          <div className="discussion-thread">
            <div className="discussion-message">
              <h5>👨‍🏫 Coach AJ (2 hours ago)</h5>
              <div>Great analysis of the Week 3 game! Key takeaways:</div>
              <div>• QB pocket presence improved significantly</div>
              <div>• WR route timing was excellent</div>
              <div>• Defense needs work on zone coverage</div>
              <div>What do you think about the 3rd quarter adjustments?</div>
            </div>
            
            <div className="discussion-message">
              <h5>🔥 Mike Johnson (WR) (1 hour ago)</h5>
              <div>I noticed our route combinations were working really well in the 2nd half. The timing with Alex was perfect!</div>
              <div>Should we practice more of those crossing patterns?</div>
            </div>
            
            <div className="discussion-message">
              <h5>🛡️ Tyler Brown (DB) (45 min ago)</h5>
              <div>From a defensive perspective, I think we need to work on our zone coverage communication. There were some gaps in the 3rd quarter.</div>
            </div>
            
            <div className="discussion-message">
              <h5>⚡ Jake &quot;The Snake&quot; (Blitzer) (30 min ago)</h5>
              <div>Our blitz timing was off in the 2nd quarter. We need to coordinate better with the DBs on coverage.</div>
            </div>
          </div>
          
          <div className="discussion-input">
            <textarea placeholder="Add your analysis or comment..." rows="3" />
            <button>Post Comment</button>
          </div>
        </div>
      </div>
        )}
    </div>
  );
};

// Profile Page Wireframe
const WireframeProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: 'Alex',
    lastName: 'Rivera',
    email: 'alex.rivera@email.com',
    team: 'Hawks',
    primaryPosition: 'QB',
    secondaryPosition: 'WR',
    experience: 'Intermediate',
    weight: 185,
    height: 74, // 6'2" in inches
    age: 24,
    joinDate: '2024-01-15'
  });

  const handleSave = () => {
    setIsEditing(false);
    // Here you would save to backend
  };

  const handleMeasurementChange = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value
    });
  };

  return (
    <main>
      <h2>Player Profile 🏈</h2>
      
      <div className="card">
        <h3>Profile Information</h3>
        <div className="grid">
          <div>
            <label>First Name</label>
            <input 
              type="text" 
              value={profileData.firstName}
              disabled={!isEditing}
              onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
            />
          </div>
          <div>
            <label>Last Name</label>
            <input 
              type="text" 
              value={profileData.lastName}
              disabled={!isEditing}
              onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
            />
          </div>
        </div>
        
        <div>
          <label>Email</label>
          <input 
            type="email" 
            value={profileData.email}
            disabled={!isEditing}
            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
          />
        </div>
        
        <div className="grid">
          <div>
            <label>Team</label>
            <select 
              value={profileData.team}
              disabled={!isEditing}
              onChange={(e) => setProfileData({...profileData, team: e.target.value})}
            >
              <option>Hawks</option>
              <option>Eagles</option>
              <option>Lions</option>
              <option>Bears</option>
            </select>
          </div>
          <div>
            <label>Primary Position</label>
            <select 
              value={profileData.primaryPosition}
              disabled={!isEditing}
              onChange={(e) => setProfileData({...profileData, primaryPosition: e.target.value})}
            >
              <option>QB</option>
              <option>WR</option>
              <option>Center</option>
              <option>Blitzer</option>
              <option>DB</option>
            </select>
          </div>
        </div>
        
        <div className="flex">
          {isEditing ? (
            <>
              <button onClick={handleSave}>Save Changes</button>
              <button onClick={() => setIsEditing(false)}>Cancel</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Physical Metrics</h3>
        <MeasurementToggle />
        
        {isEditing ? (
          <div>
            <MeasurementInput
              type="weight"
              value={profileData.weight}
              onChange={(value) => handleMeasurementChange('weight', value)}
              label="Weight"
            />
            <MeasurementInput
              type="height"
              value={profileData.height}
              onChange={(value) => handleMeasurementChange('height', value)}
              label="Height"
            />
          </div>
        ) : (
          <div className="grid">
            <MeasurementDisplay
              type="weight"
              value={profileData.weight}
              label="Weight"
            />
            <MeasurementDisplay
              type="height"
              value={profileData.height}
              label="Height"
            />
            <div className="stats-card">
              <div>Age: {profileData.age}</div>
            </div>
            <div className="stats-card">
              <div>Member Since: {profileData.joinDate}</div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Available Positions</h3>
        <div className="grid">
          <div className="stats-card">
            <h4>QB - Quarterback</h4>
            <div>Pocket presence, decision-making, accuracy</div>
          </div>
          <div className="stats-card">
            <h4>WR - Wide Receiver</h4>
            <div>Route running, catching, speed</div>
          </div>
          <div className="stats-card">
            <h4>Center - Offensive Line</h4>
            <div>Blocking, snap accuracy, protection</div>
          </div>
          <div className="stats-card">
            <h4>Blitzer - Defensive Line</h4>
            <div>Pass rush, gap control, pressure</div>
          </div>
          <div className="stats-card">
            <h4>DB - Defensive Back</h4>
            <div>Coverage, tackling, ball skills</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Universal Rankings</h3>
        <div className="grid">
          <div className="stats-card">
            <h4>Speed</h4>
            <div>4.6s 40-yard dash</div>
            <div>42nd percentile</div>
          </div>
          <div className="stats-card">
            <h4>Strength</h4>
            <div>185 lbs bench press</div>
            <div>38th percentile</div>
          </div>
          <div className="stats-card">
            <h4>Agility</h4>
            <div>7.2s cone drill</div>
            <div>45th percentile</div>
          </div>
          <div className="stats-card">
            <h4>Overall</h4>
            <div>Rank #4,201</div>
            <div>of 10,001 players</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Performance History</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Game</th>
              <th>Position</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2024-01-20</td>
              <td>Hawks vs Eagles</td>
              <td>QB</td>
              <td>3 TD, 245 yards</td>
            </tr>
            <tr>
              <td>2024-01-15</td>
              <td>Hawks vs Lions</td>
              <td>QB</td>
              <td>2 TD, 189 yards</td>
            </tr>
            <tr>
              <td>2024-01-10</td>
              <td>Hawks vs Bears</td>
              <td>WR</td>
              <td>1 TD, 67 yards</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
};

// Tournaments Page Wireframe
const WireframeTournaments = () => {
  return (
    <div>
      <h2>Tournaments</h2>
      
      <div className="card">
        <h3>Upcoming Tournaments</h3>
        <div className="tournament-list">
          <div className="card">
            <h4>Spring Championship 2024</h4>
            <div>Date: March 15-17, 2024</div>
            <div>Location: Central Park</div>
            <div>Teams: 48 (8 pools × 6 teams)</div>
            <div>Status: Registered</div>
            <button>View Details</button>
          </div>
          <div className="card">
            <h4>Summer League</h4>
            <div>Date: June 1-30, 2024</div>
            <div>Location: Various Venues</div>
            <div>Teams: 24</div>
            <div>Status: Registration Open</div>
            <button>Register Now</button>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>Tournament Schedule & Nutrition Plan</h3>
        <div className="tournament-schedule-grid">
          <div className="schedule-section">
            <h4>📅 Game Schedule</h4>
            <div className="day-schedule">
              <h5>Spring Championship - Day 1</h5>
              <div className="game-item">
                <div className="game-time">9:00 AM</div>
                <div className="game-details">Game 1: Hawks vs Eagles</div>
              </div>
              <div className="game-item">
                <div className="game-time">11:00 AM</div>
                <div className="game-details">Game 2: Hawks vs Lions</div>
              </div>
              <div className="game-item">
                <div className="game-time">2:00 PM</div>
                <div className="game-details">Game 3: Hawks vs Bears</div>
              </div>
            </div>
            <div className="day-schedule">
              <h5>Spring Championship - Day 2</h5>
              <div className="game-item">
                <div className="game-time">10:00 AM</div>
                <div className="game-details">Quarterfinal: Hawks vs TBD</div>
              </div>
              <div className="game-item">
                <div className="game-time">2:00 PM</div>
                <div className="game-details">Semifinal: TBD</div>
              </div>
              <div className="game-item">
                <div className="game-time">4:00 PM</div>
                <div className="game-details">Championship: TBD</div>
              </div>
            </div>
          </div>
          
          <div className="nutrition-section">
            <h4>🥤 Tournament Nutrition Plan</h4>
            <div className="nutrition-timeline">
              <h5>Day 1 - Nutrition Schedule</h5>
              <div className="nutrition-item">
                <div className="nutrition-time">8:30 AM</div>
                <div className="nutrition-details">
                  <div>🍳 Pre-Game Meal</div>
                  <div>• Oatmeal with banana & honey</div>
                  <div>• 500ml water + electrolytes</div>
                </div>
              </div>
              <div className="nutrition-item">
                <div className="nutrition-time">After Game 1</div>
                <div className="nutrition-details">
                  <div>⚡ Recovery Protocol</div>
                  <div>• Take gel from 226 (energy)</div>
                  <div>• Drink 0.5L electrolytes</div>
                  <div>• Protein shake (30g)</div>
                </div>
              </div>
              <div className="nutrition-item">
                <div className="nutrition-time">10:30 AM</div>
                <div className="nutrition-details">
                  <div>🍌 Pre-Game 2</div>
                  <div>• Banana + energy bar</div>
                  <div>• 300ml sports drink</div>
                </div>
              </div>
              <div className="nutrition-item">
                <div className="nutrition-time">After Game 2</div>
                <div className="nutrition-details">
                  <div>⚡ Recovery Protocol</div>
                  <div>• Take gel from 226 (energy)</div>
                  <div>• Drink 0.5L electrolytes</div>
                  <div>• BCAA supplement</div>
                </div>
              </div>
              <div className="nutrition-item">
                <div className="nutrition-time">1:30 PM</div>
                <div className="nutrition-details">
                  <div>🥪 Pre-Game 3</div>
                  <div>• Turkey sandwich (gluten-free)</div>
                  <div>• 400ml water + electrolytes</div>
                </div>
              </div>
              <div className="nutrition-item">
                <div className="nutrition-time">After Game 3</div>
                <div className="nutrition-details">
                  <div>⚡ Recovery Protocol</div>
                  <div>• Take gel from 226 (energy)</div>
                  <div>• Drink 0.5L electrolytes</div>
                  <div>• Protein shake (40g)</div>
                </div>
              </div>
            </div>
            
            <div className="nutrition-timeline">
              <h5>Day 2 - Nutrition Schedule</h5>
              <div className="nutrition-item">
                <div className="nutrition-time">9:30 AM</div>
                <div className="nutrition-details">
                  <div>🍳 Pre-Quarterfinal</div>
                  <div>• Protein pancakes (gluten-free)</div>
                  <div>• 600ml water + electrolytes</div>
                </div>
              </div>
              <div className="nutrition-item">
                <div className="nutrition-time">After Quarterfinal</div>
                <div className="nutrition-details">
                  <div>⚡ Recovery Protocol</div>
                  <div>• Take gel from 226 (energy)</div>
                  <div>• Drink 0.5L electrolytes</div>
                  <div>• Creatine supplement</div>
                </div>
              </div>
              <div className="nutrition-item">
                <div className="nutrition-time">1:30 PM</div>
                <div className="nutrition-details">
                  <div>🥤 Pre-Semifinal</div>
                  <div>• Energy gel + sports drink</div>
                  <div>• 400ml electrolytes</div>
                </div>
              </div>
              <div className="nutrition-item">
                <div className="nutrition-time">After Semifinal</div>
                <div className="nutrition-details">
                  <div>⚡ Recovery Protocol</div>
                  <div>• Take gel from 226 (energy)</div>
                  <div>• Drink 0.5L electrolytes</div>
                  <div>• BCAA + protein mix</div>
                </div>
              </div>
              <div className="nutrition-item">
                <div className="nutrition-time">3:30 PM</div>
                <div className="nutrition-details">
                  <div>⚡ Pre-Championship</div>
                  <div>• Energy gel + caffeine</div>
                  <div>• 500ml electrolytes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>Tournament Results</h3>
        <div>
          <div>Win vs Eagles (28-14)</div>
          <div>Win vs Lions (35-21)</div>
          <div>Loss vs Bears (17-24)</div>
        </div>
      </div>
      
      <div className="card">
        <h3>Nutrition Planning</h3>
        <div className="grid">
          <div className="card">
            <h4>Personal Dietary Profile</h4>
            <div>🏥 Medical Restrictions (Locked)</div>
            <div>• Gluten Intolerance (Severe)</div>
            <div>• Lactose Sensitivity (Moderate)</div>
            <div>[Request Modification]</div>
          </div>
          <div className="card">
            <h4>Personal Preferences</h4>
            <div>• Vegetarian Diet Choice</div>
            <div>• Dislikes: Seafood, Spicy Foods</div>
            <div>• Supplement Routine: Creatine, Protein</div>
            <div>[Edit Preferences]</div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>30-Minute Break Optimization</h3>
        <div>
          <div>0-5 min: Cool down + immediate hydration</div>
          <div>5-10 min: Team meeting (if scheduled)</div>
          <div>10-15 min: Equipment check + personal care</div>
          <div>15-25 min: Nutrition intake + rest</div>
          <div>25-30 min: Warm-up + game preparation</div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isPremium, setIsPremium] = useState(false); // false = free user, true = premium user

  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  const handleRegister = (userData) => {
    setCurrentUser(userData);
    setShowOnboarding(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleOnboardingComplete = (formData) => {
    setCurrentUser({ ...currentUser, ...formData });
    setShowOnboarding(false);
  };

  const handleTogglePremium = () => {
    setIsPremium(!isPremium);
  };

  return (
    <Router>
      <MeasurementProvider>
        <div className="app">
          <WireframeHeader 
            currentUser={currentUser} 
            onLogout={handleLogout} 
            isPremium={isPremium}
            onTogglePremium={handleTogglePremium}
          />
          
          <Routes>
            <Route path="/login" element={<WireframeLogin onLogin={handleLogin} isPremium={isPremium} />} />
            <Route path="/register" element={<WireframeRegister onRegister={handleRegister} isPremium={isPremium} />} />
            <Route path="/" element={currentUser ? <DraggableDashboard isPremium={isPremium} /> : <WireframeLogin onLogin={handleLogin} isPremium={isPremium} />} />
            <Route path="/training" element={currentUser ? <WireframeTraining /> : <WireframeLogin onLogin={handleLogin} isPremium={isPremium} />} />
            <Route path="/community" element={currentUser ? <WireframeCommunity /> : <WireframeLogin onLogin={handleLogin} isPremium={isPremium} />} />
            <Route path="/profile" element={currentUser ? <WireframeProfile /> : <WireframeLogin onLogin={handleLogin} isPremium={isPremium} />} />
            <Route path="/tournaments" element={currentUser ? <WireframeTournaments /> : <WireframeLogin onLogin={handleLogin} isPremium={isPremium} />} />
          </Routes>
          
          {showOnboarding && (
            <WireframeOnboarding onComplete={handleOnboardingComplete} />
          )}
        </div>
      </MeasurementProvider>
    </Router>
  );
};

export default App;
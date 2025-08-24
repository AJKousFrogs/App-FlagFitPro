import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ChatWidget from './components/ChatWidget';
import FilterManager from './utils/FilterManager';
import './index.css';

// Wireframe Pages
const DashboardPage = () => (
  <div className="container">
    <div style={{ padding: '40px 0' }}>
      <h1>🏈 Dashboard</h1>
      <p className="body-text">Welcome to your FlagFit Pro dashboard! Track your progress, manage your training, and connect with your team.</p>
      
      <div className="wireframe-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '2rem' }}>
        <div className="wireframe-card">
          <h3>Performance Overview</h3>
          <p className="small-text">Your latest training metrics and progress updates</p>
          <div style={{ height: '120px', background: '#f5f5f5', border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
            <span className="caption">Chart Placeholder</span>
          </div>
          <button className="cta-secondary btn-small">View Details</button>
        </div>
        
        <div className="wireframe-card">
          <h3>Today's Training</h3>
          <p className="small-text">Recommended exercises based on your goals</p>
          <div style={{ padding: '1rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Speed Drills</span>
              <span className="small-text">15 min</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Route Running</span>
              <span className="small-text">20 min</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Flag Pulling</span>
              <span className="small-text">10 min</span>
            </div>
          </div>
          <button className="cta-primary btn-small">Start Training</button>
        </div>
        
        <div className="wireframe-card">
          <h3>Team Updates</h3>
          <p className="small-text">Latest news from your Ljubljana Frogs team</p>
          <div style={{ padding: '1rem 0' }}>
            <div style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #eee' }}>
              <div className="small-text" style={{ color: '#1a1a1a', fontWeight: '500' }}>Practice Tomorrow</div>
              <div className="caption">Coach announced practice at 6 PM</div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div className="small-text" style={{ color: '#1a1a1a', fontWeight: '500' }}>New Training Program</div>
              <div className="caption">Olympic preparation routine available</div>
            </div>
          </div>
          <button className="cta-secondary btn-small">View All</button>
        </div>
      </div>
    </div>
  </div>
);

const TrainingPage = () => (
  <div className="container">
    <div style={{ padding: '40px 0' }}>
      <h1>🏃‍♂️ Training</h1>
      <p className="body-text">Your personalized flag football training journey. Track workouts, improve skills, and reach your goals.</p>
      
      <div style={{ margin: '2rem 0', padding: '2rem', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '12px' }}>
        <h3>Today's Recommended Workout</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
            <h5>🏃‍♂️ Speed & Agility</h5>
            <p className="small-text">40-yard sprints, cone drills, ladder work</p>
            <div className="caption">Duration: 20 minutes</div>
          </div>
          <div style={{ padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
            <h5>🎯 Route Running</h5>
            <p className="small-text">Precision routes, timing, field awareness</p>
            <div className="caption">Duration: 25 minutes</div>
          </div>
          <div style={{ padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
            <h5>🛡️ Defensive Drills</h5>
            <p className="small-text">Flag pulling technique, coverage skills</p>
            <div className="caption">Duration: 15 minutes</div>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <button className="cta-primary">Start Workout</button>
          <button className="cta-secondary" style={{ marginLeft: '1rem' }}>Customize</button>
        </div>
      </div>
    </div>
  </div>
);

const CommunityPage = () => (
  <div className="container">
    <div style={{ padding: '40px 0' }}>
      <h1>🤝 Community</h1>
      <p className="body-text">Connect with fellow flag football players, share experiences, and grow together.</p>
      
      <div className="wireframe-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div>
          <div className="wireframe-card">
            <h3>Recent Discussions</h3>
            <div style={{ marginTop: '1rem' }}>
              {[
                { title: "Olympic Training Tips from LA28 Prep", author: "CoachMike", replies: 12, time: "2h ago" },
                { title: "Best Flag Pulling Techniques", author: "FastRunner", replies: 8, time: "4h ago" },
                { title: "Nutrition for Game Day Performance", author: "HealthyAthlete", replies: 15, time: "6h ago" }
              ].map((discussion, index) => (
                <div key={index} style={{ 
                  padding: '1rem', 
                  marginBottom: '1rem', 
                  border: '1px solid #e5e5e5', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease'
                }}>
                  <h5 style={{ marginBottom: '0.5rem' }}>{discussion.title}</h5>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="small-text">by {discussion.author} • {discussion.replies} replies</span>
                    <span className="caption">{discussion.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="cta-secondary btn-small">View All Discussions</button>
          </div>
        </div>
        
        <div>
          <div className="wireframe-card">
            <h3>Team Leaderboard</h3>
            <div style={{ marginTop: '1rem' }}>
              {[
                { name: "Alex Johnson", points: 1250, position: 1 },
                { name: "Maria Silva", points: 1180, position: 2 },
                { name: "You", points: 1050, position: 3 },
                { name: "John Smith", points: 980, position: 4 }
              ].map((player, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: index < 3 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <div>
                    <span className="small-text" style={{ fontWeight: player.name === 'You' ? '600' : '400' }}>
                      #{player.position} {player.name}
                    </span>
                  </div>
                  <span className="caption">{player.points} pts</span>
                </div>
              ))}
            </div>
            <button className="cta-primary btn-small" style={{ marginTop: '1rem', width: '100%' }}>
              View Full Rankings
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TournamentsPage = () => (
  <div className="container">
    <div style={{ padding: '40px 0' }}>
      <h1>🏆 Tournaments</h1>
      <p className="body-text">Compete in flag football tournaments, track your team's progress, and aim for LA28 Olympic qualification.</p>
      
      <div style={{ margin: '2rem 0' }}>
        <div className="wireframe-card" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '2px solid #1a1a1a' }}>
          <h3>🥇 LA28 Olympic Qualification Path</h3>
          <p className="body-text">Track your journey to the 2028 Los Angeles Olympics</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏃‍♂️</div>
              <h5>Regional Qualifiers</h5>
              <p className="small-text">Next: March 2025</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌍</div>
              <h5>World Championships</h5>
              <p className="small-text">Goal: Top 8 Teams</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🥇</div>
              <h5>LA28 Olympics</h5>
              <p className="small-text">Dream: Medal Contention</p>
            </div>
          </div>
          <button className="cta-primary">View Qualification Requirements</button>
        </div>
      </div>
      
      <div className="wireframe-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        <div className="wireframe-card">
          <h3>Upcoming Tournaments</h3>
          {[
            { name: "Spring League Championship", date: "March 15-17, 2025", location: "Ljubljana, Slovenia" },
            { name: "European Flag Football Cup", date: "June 8-10, 2025", location: "Vienna, Austria" },
            { name: "IFAF World Championships", date: "August 2025", location: "TBD" }
          ].map((tournament, index) => (
            <div key={index} style={{ 
              padding: '1rem', 
              marginBottom: '1rem', 
              border: '1px solid #e5e5e5', 
              borderRadius: '8px' 
            }}>
              <h5>{tournament.name}</h5>
              <p className="small-text">{tournament.date}</p>
              <p className="caption">📍 {tournament.location}</p>
            </div>
          ))}
          <button className="cta-secondary btn-small">View All Tournaments</button>
        </div>
        
        <div className="wireframe-card">
          <h3>Recent Results</h3>
          {[
            { tournament: "Winter Cup 2024", result: "2nd Place", date: "Dec 2024" },
            { tournament: "Ljubljana Open", result: "Champions", date: "Nov 2024" },
            { tournament: "Central European League", result: "Semifinals", date: "Oct 2024" }
          ].map((result, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.75rem 0',
              borderBottom: index < 2 ? '1px solid #f0f0f0' : 'none'
            }}>
              <div>
                <div className="small-text" style={{ fontWeight: '500' }}>{result.tournament}</div>
                <div className="caption">{result.date}</div>
              </div>
              <div className="small-text" style={{ 
                fontWeight: '600',
                color: result.result.includes('Champions') || result.result.includes('1st') ? '#28a745' : 
                       result.result.includes('2nd') || result.result.includes('3rd') ? '#ffc107' : '#6c757d'
              }}>
                {result.result}
              </div>
            </div>
          ))}
          <button className="cta-secondary btn-small" style={{ marginTop: '1rem', width: '100%' }}>
            View Complete History
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Navigation Header
const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav style={{ 
      background: '#ffffff', 
      borderBottom: '1px solid #e5e5e5', 
      padding: '1rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#1a1a1a' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏈 FlagFit Pro
            </h2>
          </Link>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link 
              to="/" 
              style={{ 
                textDecoration: 'none', 
                color: location.pathname === '/' ? '#1a1a1a' : '#6b6b6b',
                fontWeight: location.pathname === '/' ? '600' : '400',
                fontSize: '1rem',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              Dashboard
            </Link>
            <Link 
              to="/training" 
              style={{ 
                textDecoration: 'none', 
                color: location.pathname === '/training' ? '#1a1a1a' : '#6b6b6b',
                fontWeight: location.pathname === '/training' ? '600' : '400',
                fontSize: '1rem',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              Training
            </Link>
            <Link 
              to="/community" 
              style={{ 
                textDecoration: 'none', 
                color: location.pathname === '/community' ? '#1a1a1a' : '#6b6b6b',
                fontWeight: location.pathname === '/community' ? '600' : '400',
                fontSize: '1rem',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              Community
            </Link>
            <Link 
              to="/tournaments" 
              style={{ 
                textDecoration: 'none', 
                color: location.pathname === '/tournaments' ? '#1a1a1a' : '#6b6b6b',
                fontWeight: location.pathname === '/tournaments' ? '600' : '400',
                fontSize: '1rem',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              Tournaments
            </Link>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="cta-secondary btn-small">Profile</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Main App Component
const App = () => {
  useEffect(() => {
    // Initialize FilterManager when app loads
    const filterManager = new FilterManager();
  }, []);

  return (
    <Router>
      <div className="app">
        <Navigation />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
        </Routes>
        <ChatWidget />
      </div>
    </Router>
  );
};

export default App;
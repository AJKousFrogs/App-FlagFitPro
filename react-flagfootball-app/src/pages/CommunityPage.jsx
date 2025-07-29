import React, { useState, useEffect } from 'react';
import SponsorBanner from '../components/SponsorBanner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { 
  UserGroupIcon, 
  BeakerIcon, 
  ChartBarIcon, 
  BoltIcon, 
  UserIcon, 
  ShieldCheckIcon,
  DocumentTextIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const CommunityPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [teamBuildingRecommendations, setTeamBuildingRecommendations] = useState([]);
  const [teamChemistry, setTeamChemistry] = useState({
    overall: 7.8,
    communication: 6.5,
    trust: 8.2,
    onFieldSynergy: 7.1,
    recentTrend: 'improving'
  });

  return (
    <div className="community-page">
      <h1 className="flex items-center gap-2">
        <UserGroupIcon className="h-8 w-8 text-blue-600" />
        Community
      </h1>
      
      {/* Top Sponsor Banner */}
      <SponsorBanner 
        position="top" 
        size="wide" 
        isPremium={false}
        sponsor={{
          name: 'Chemius',
          logo: <BeakerIcon className="h-6 w-6" />,
          message: 'Team nutrition solutions',
          cta: 'Learn More',
          link: '#'
        }}
      />
      
      {/* Community Navigation Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Team Overview
        </button>
        <button 
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          Team Chat
        </button>
        <button 
          className={activeTab === 'sessions' ? 'active' : ''}
          onClick={() => setActiveTab('sessions')}
        >
          Training Sessions
        </button>
        <button 
          className={activeTab === 'knowledge' ? 'active' : ''}
          onClick={() => setActiveTab('knowledge')}
        >
          Knowledge Base
        </button>
        <button 
          className={activeTab === 'team-building' ? 'active' : ''}
          onClick={() => setActiveTab('team-building')}
        >
          Team Building
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <h2>Team Overview</h2>
          <div className="team-stats">
            <div className="stat-card">
              <h3>Active Players</h3>
              <div>23 members</div>
            </div>
            <div className="stat-card">
              <h3>Team Chemistry</h3>
              <div>{teamChemistry.overall}/10 🟢</div>
            </div>
            <div className="stat-card">
              <h3>Next Game</h3>
              <div>vs Eagles Tomorrow</div>
            </div>
            <div className="stat-card">
              <h3>Practice</h3>
              <div>Today 6 PM</div>
            </div>
          </div>

          {/* Team Chemistry Breakdown */}
          <div className="chemistry-breakdown">
            <h3>Team Chemistry Analysis</h3>
            <div className="chemistry-metrics">
              <div className="metric">
                <span>Communication</span>
                <Progress value={teamChemistry.communication * 10} className="w-full" />
                <span>{teamChemistry.communication}/10</span>
              </div>
              <div className="metric">
                <span>Trust Level</span>
                <Progress value={teamChemistry.trust * 10} className="w-full" />
                <span>{teamChemistry.trust}/10</span>
              </div>
              <div className="metric">
                <span>On-Field Synergy</span>
                <Progress value={teamChemistry.onFieldSynergy * 10} className="w-full" />
                <span>{teamChemistry.onFieldSynergy}/10</span>
              </div>
            </div>
            <div className="trend-indicator">
              <span>Trend: {teamChemistry.recentTrend} 📈</span>
            </div>
          </div>
          
          <h3>Recent Activity</h3>
          <div className="activity-feed">
            <div className="activity-item">
              <div>⚡ Jake completed Route Running drill</div>
              <div>2 hours ago</div>
            </div>
            <div className="activity-item">
              <div>🏈 Coach AJ scheduled team practice</div>
              <div>4 hours ago</div>
            </div>
            <div className="activity-item">
              <div>📈 Sarah improved her 40-yard dash time</div>
              <div>1 day ago</div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'chat' && (
        <div className="tab-content">
          <h2>Team Chat</h2>
          <div className="chat-rooms">
            <div className="chat-room">
              <h4>🏈 Main Team Chat (23 members) [3 unread]</h4>
              <div>&quot;Practice tomorrow at 6 PM!&quot;</div>
              <div>Chemistry: 7.8/10 🟢</div>
            </div>
            <div className="chat-room">
              <h4>⚡ QB Pocket Movement (8 members)</h4>
              <div>&quot;Working on pressure timing tomorrow&quot;</div>
              <div>Chemistry: 6.8/10 🟡</div>
            </div>
            <div className="chat-room">
              <h4>🏃‍♂️ WR Route Timing (12 members)</h4>
              <div>&quot;Crossing patterns need work&quot;</div>
              <div>Chemistry: 8.2/10 🟢</div>
            </div>
          </div>
          
          <div className="chat-message">
            <h4>⚡ Jake &quot;The Snake&quot; (Blitzer) (10:52 AM)</h4>
            <div>Blitzers - we&apos;re working on pressure timing tomorrow</div>
            <div>Chemistry with you: 6.8/10 🟡</div>
          </div>
        </div>
      )}
      
      {activeTab === 'sessions' && (
        <div className="tab-content">
          <h2>Training Sessions</h2>
          <div className="training-sessions">
            <div className="session-item">
              <div className="session-time">Today 6:00 PM</div>
              <div className="session-details">
                <div>Team Practice</div>
                <div>Focus: Route timing and pocket presence</div>
                <div>Duration: 90 minutes</div>
                <div>Location: Main Field</div>
              </div>
            </div>
            <div className="session-item">
              <div className="session-time">Tomorrow 5:30 PM</div>
              <div className="session-details">
                <div>Position-Specific Training</div>
                <div>Focus: QB decision making, WR route running</div>
                <div>Duration: 60 minutes</div>
                <div>Location: Practice Field</div>
              </div>
            </div>
            <div className="session-item">
              <div className="session-time">Friday 7:00 PM</div>
              <div className="session-details">
                <div>Game Preparation</div>
                <div>Focus: Strategy review and team chemistry</div>
                <div>Duration: 45 minutes</div>
                <div>Location: Film Room</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'knowledge' && (
        <div className="tab-content">
          <h2>Knowledge Base</h2>
          <div className="knowledge-base">
            <div className="knowledge-item">
              <div>🏈 Offensive Playbook</div>
              <div>Complete collection of offensive plays and strategies</div>
              <div>Last updated: 2 days ago</div>
            </div>
            <div className="knowledge-item">
              <div>🛡️ Defensive Schemes</div>
              <div>Defensive formations and coverage patterns</div>
              <div>Last updated: 1 week ago</div>
            </div>
            <div className="knowledge-item">
              <div>📊 Game Film Analysis</div>
              <div>Breakdown of recent games and opponent analysis</div>
              <div>Last updated: 3 days ago</div>
            </div>
            <div className="knowledge-item">
              <div>💪 Training Resources</div>
              <div>Drill guides, workout plans, and nutrition tips</div>
              <div>Last updated: 1 day ago</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'team-building' && (
        <div className="tab-content">
          <h2>Team Building Recommendations</h2>
          
          {/* Team Building Overview */}
          <div className="team-building-overview">
            <Card>
              <CardHeader>
                <CardTitle>Current Team Chemistry Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="chemistry-summary">
                  <div className="overall-score">
                    <span className="score">{teamChemistry.overall}/10</span>
                    <span className="label">Overall Chemistry</span>
                  </div>
                  <div className="chemistry-details">
                    <p>Your team is performing well overall, but there are specific areas where targeted team building activities can improve performance and cohesion.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Building Recommendations */}
          <div className="recommendations-section">
            <h3>Priority Recommendations</h3>
            
            {/* Recommendation 1: Strengthen WR Corps Chemistry */}
            <Card className="recommendation-card">
              <CardContent>
                <div className="recommendation-header">
                  <div className="recommendation-title">
                    <h4>Strengthen WR Corps Chemistry</h4>
                    <Badge variant="destructive">HIGH PRIORITY</Badge>
                  </div>
                </div>
                <div className="recommendation-content">
                  <p className="problem-statement">
                    <strong>Problem:</strong> David Lee and Ashley Green need more synchronized route running practice.
                  </p>
                  <div className="recommended-actions">
                    <h5>Recommended Actions:</h5>
                    <ul>
                      <li>Schedule 3x weekly route running sessions for WR2 and WR3</li>
                      <li>Implement buddy system for film study</li>
                      <li>Create competitive route precision challenges</li>
                    </ul>
                  </div>
                  <div className="expected-impact">
                    <span className="impact-label">Expected Impact:</span>
                    <span className="impact-value">+4% completion rate on multi-receiver routes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendation 2: Improve In-Game Communication */}
            <Card className="recommendation-card">
              <CardContent>
                <div className="recommendation-header">
                  <div className="recommendation-title">
                    <h4>Improve In-Game Communication</h4>
                    <Badge variant="secondary">MEDIUM PRIORITY</Badge>
                  </div>
                </div>
                <div className="recommendation-content">
                  <p className="problem-statement">
                    <strong>Problem:</strong> Communication clarity drops 6% during high-pressure situations.
                  </p>
                  <div className="recommended-actions">
                    <h5>Recommended Actions:</h5>
                    <ul>
                      <li>Practice communication under crowd noise</li>
                      <li>Develop simplified audible system</li>
                      <li>Implement hand signal backup system</li>
                    </ul>
                  </div>
                  <div className="expected-impact">
                    <span className="impact-label">Expected Impact:</span>
                    <span className="impact-value">+2.3 points average in close games</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendation 3: Develop Secondary Leadership */}
            <Card className="recommendation-card">
              <CardContent>
                <div className="recommendation-header">
                  <div className="recommendation-title">
                    <h4>Develop Secondary Leadership</h4>
                    <Badge variant="secondary">MEDIUM PRIORITY</Badge>
                  </div>
                </div>
                <div className="recommendation-content">
                  <p className="problem-statement">
                    <strong>Problem:</strong> Over-reliance on Alex Rodriguez for field leadership.
                  </p>
                  <div className="recommended-actions">
                    <h5>Recommended Actions:</h5>
                    <ul>
                      <li>Rotate captain responsibilities in practice</li>
                      <li>Mentor Jordan Smith as defensive signal caller</li>
                      <li>Create leadership development program</li>
                    </ul>
                  </div>
                  <div className="expected-impact">
                    <span className="impact-label">Expected Impact:</span>
                    <span className="impact-value">+8% performance when QB is under pressure</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Building Activities */}
          <div className="team-activities">
            <h3>Scheduled Team Building Activities</h3>
            <div className="activities-grid">
              <Card>
                <CardContent>
                  <h4>🏈 Route Running Workshop</h4>
                  <p>Tomorrow 5:30 PM - 7:00 PM</p>
                  <p>Focus: WR synchronization and timing</p>
                  <Button size="sm" variant="outline">Join Session</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <h4>🗣️ Communication Drill</h4>
                  <p>Friday 6:00 PM - 7:30 PM</p>
                  <p>Focus: Audible system and hand signals</p>
                  <Button size="sm" variant="outline">Join Session</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <h4>👥 Leadership Workshop</h4>
                  <p>Saturday 10:00 AM - 12:00 PM</p>
                  <p>Focus: Developing secondary leaders</p>
                  <Button size="sm" variant="outline">Join Session</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom Sponsor Banner */}
      <SponsorBanner 
        position="bottom" 
        size="wide" 
        isPremium={false}
        sponsor={{
          name: 'LaprimaFit',
          logo: '💪',
          message: 'Team equipment packages',
          cta: 'Get Quote',
          link: '#'
        }}
      />
    </div>
  );
};

export default CommunityPage; 
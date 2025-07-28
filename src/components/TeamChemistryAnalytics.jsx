import React, { useState, useEffect } from 'react';

const TeamChemistryAnalytics = () => {
  const [chemistryData, setChemistryData] = useState({
    overallChemistry: 0,
    playerRelationships: [],
    positionGroups: [],
    communicationMetrics: {},
    performanceImpact: {},
    recommendations: [],
    trends: []
  });
  
  const [activeView, setActiveView] = useState('overview');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate comprehensive team chemistry analysis
    const generateChemistryData = () => {
      const mockData = {
        overallChemistry: 87.3,
        playerRelationships: [
          {
            player1: 'Alex Rodriguez (QB)',
            player2: 'Mike Johnson (WR)',
            chemistry: 9.2,
            relationship: 'excellent',
            metrics: {
              communication: 9.5,
              timing: 9.0,
              trust: 9.1,
              onFieldSync: 8.9
            },
            interactions: 147,
            successRate: 94.2,
            improvement: '+0.8 since last month'
          },
          {
            player1: 'Alex Rodriguez (QB)',
            player2: 'Chris Wilson (Center)',
            chemistry: 8.8,
            relationship: 'strong',
            metrics: {
              communication: 9.2,
              timing: 8.7,
              trust: 8.9,
              protection: 8.5
            },
            interactions: 89,
            successRate: 91.7,
            improvement: '+0.3 since last month'
          },
          {
            player1: 'Mike Johnson (WR)',
            player2: 'David Lee (WR)',
            chemistry: 8.1,
            relationship: 'good',
            metrics: {
              communication: 8.0,
              coordination: 8.2,
              trust: 8.1,
              teamwork: 8.0
            },
            interactions: 78,
            successRate: 87.3,
            improvement: '+0.5 since last month'
          },
          {
            player1: 'Sarah Kim (DB)',
            player2: 'Tony Martinez (LB)',
            chemistry: 8.9,
            relationship: 'excellent',
            metrics: {
              communication: 9.1,
              coverage: 8.8,
              trust: 9.0,
              coordination: 8.7
            },
            interactions: 112,
            successRate: 92.8,
            improvement: '+0.6 since last month'
          }
        ],
        positionGroups: [
          {
            group: 'Offensive Line',
            chemistry: 9.1,
            members: ['Chris Wilson (C)', 'Jake Thompson (LG)', 'Ryan Davis (RG)', 'Mark Brown (LT)', 'Steve Clark (RT)'],
            strengths: ['Protection Communication', 'Run Blocking Sync', 'Audible Recognition'],
            improvements: ['Pass Rush Stunts', 'Silent Count Timing'],
            performance: '+12% blocking efficiency when together'
          },
          {
            group: 'Receiving Corps',
            chemistry: 8.4,
            members: ['Mike Johnson (WR1)', 'David Lee (WR2)', 'Ashley Green (WR3)', 'Brad Taylor (TE)'],
            strengths: ['Route Running Sync', 'Spacing Awareness', 'Red Zone Execution'],
            improvements: ['Deep Ball Timing', 'Pick Plays', 'Audible Adjustments'],
            performance: '+8% completion rate in group routes'
          },
          {
            group: 'Secondary',
            chemistry: 8.7,
            members: ['Sarah Kim (FS)', 'Tony Martinez (SS)', 'Lisa Wang (CB1)', 'Jordan Smith (CB2)'],
            strengths: ['Coverage Communication', 'Zone Rotations', 'Blitz Pickup'],
            improvements: ['Man Coverage Switches', 'Deep Help Communication'],
            performance: '+15% pass defense efficiency'
          },
          {
            group: 'QB-Receiver Connection',
            chemistry: 9.0,
            members: ['Alex Rodriguez (QB)', 'Mike Johnson (WR1)', 'David Lee (WR2)', 'Brad Taylor (TE)'],
            strengths: ['Pre-Snap Reads', 'Hot Route Adjustments', 'Back-Shoulder Timing'],
            improvements: ['Deep Ball Placement', 'Scramble Drill Communication'],
            performance: '+11% passing efficiency in key situations'
          }
        ],
        communicationMetrics: {
          overallScore: 8.6,
          responseTime: 0.34, // seconds average
          clarityScore: 8.8,
          frequencyScore: 8.4,
          effectivenessRate: 91.2,
          patterns: {
            preSnap: { score: 9.1, volume: 'High', clarity: 'Excellent' },
            inGame: { score: 8.3, volume: 'Medium', clarity: 'Good' },
            timeout: { score: 8.9, volume: 'High', clarity: 'Very Good' },
            huddle: { score: 8.7, volume: 'Medium', clarity: 'Good' }
          },
          topCommunicators: [
            { player: 'Alex Rodriguez (QB)', score: 9.4, role: 'Field General' },
            { player: 'Chris Wilson (Center)', score: 9.2, role: 'Line Captain' },
            { player: 'Sarah Kim (FS)', score: 9.0, role: 'Defensive QB' }
          ]
        },
        performanceImpact: {
          highChemistryGames: {
            averageScore: 94.2,
            winRate: 89.3,
            avgPointsScored: 28.4,
            avgPointsAllowed: 16.8
          },
          lowChemistryGames: {
            averageScore: 76.8,
            winRate: 62.5,
            avgPointsScored: 21.1,
            avgPointsAllowed: 24.3
          },
          correlations: [
            { factor: 'Team Chemistry vs Win Rate', correlation: 0.83, strength: 'Very Strong' },
            { factor: 'Communication vs Turnover Ratio', correlation: 0.76, strength: 'Strong' },
            { factor: 'Position Group Chemistry vs Unit Performance', correlation: 0.71, strength: 'Strong' },
            { factor: 'QB-WR Chemistry vs Passing Efficiency', correlation: 0.88, strength: 'Very Strong' }
          ]
        },
        recommendations: [
          {
            type: 'team-building',
            priority: 'high',
            title: 'Strengthen WR Corps Chemistry',
            description: 'David Lee and Ashley Green need more synchronized route running practice',
            actions: [
              'Schedule 3x weekly route running sessions for WR2 and WR3',
              'Implement buddy system for film study',
              'Create competitive route precision challenges'
            ],
            expectedImprovement: '+4% completion rate on multi-receiver routes'
          },
          {
            type: 'communication',
            priority: 'medium',
            title: 'Improve In-Game Communication',
            description: 'Communication clarity drops 6% during high-pressure situations',
            actions: [
              'Practice communication under crowd noise',
              'Develop simplified audible system',
              'Implement hand signal backup system'
            ],
            expectedImprovement: '+2.3 points average in close games'
          },
          {
            type: 'leadership',
            priority: 'medium',
            title: 'Develop Secondary Leadership',
            description: 'Over-reliance on Alex Rodriguez for field leadership',
            actions: [
              'Rotate captain responsibilities in practice',
              'Mentor Jordan Smith as defensive signal caller',
              'Create leadership development program'
            ],
            expectedImprovement: '+8% performance when QB is under pressure'
          }
        ],
        trends: [
          { week: 'W1', chemistry: 82.1 },
          { week: 'W2', chemistry: 83.7 },
          { week: 'W3', chemistry: 85.2 },
          { week: 'W4', chemistry: 86.8 },
          { week: 'W5', chemistry: 87.3 },
          { week: 'W6', chemistry: 88.9, predicted: true }
        ]
      };
      
      setChemistryData(mockData);
      setLoading(false);
    };

    const timer = setTimeout(generateChemistryData, 1500);
    return () => clearTimeout(timer);
  }, []);

  const getChemistryColor = (score) => {
    if (score >= 9.0) return '#10b981'; // excellent
    if (score >= 8.0) return '#3b82f6'; // strong
    if (score >= 7.0) return '#f59e0b'; // good
    return '#ef4444'; // needs work
  };

  const getRelationshipLabel = (relationship) => {
    const labels = {
      excellent: 'Excellent',
      strong: 'Strong',
      good: 'Good',
      developing: 'Developing',
      needs_work: 'Needs Work'
    };
    return labels[relationship] || relationship;
  };

  const renderPlayerNetwork = () => (
    <div className="player-network-container">
      <div className="network-visualization">
        <svg viewBox="0 0 400 300" className="network-svg">
          {/* Player nodes */}
          <g className="player-nodes">
            <circle cx="200" cy="150" r="25" fill="#3b82f6" className="player-node qb" />
            <text x="200" y="155" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">QB</text>
            
            <circle cx="120" cy="100" r="20" fill="#10b981" className="player-node wr" />
            <text x="120" y="105" textAnchor="middle" fill="white" fontSize="9">WR1</text>
            
            <circle cx="280" cy="100" r="20" fill="#10b981" className="player-node wr" />
            <text x="280" y="105" textAnchor="middle" fill="white" fontSize="9">WR2</text>
            
            <circle cx="200" cy="220" r="18" fill="#f59e0b" className="player-node c" />
            <text x="200" y="225" textAnchor="middle" fill="white" fontSize="8">C</text>
            
            <circle cx="80" cy="200" r="16" fill="#ef4444" className="player-node db" />
            <text x="80" y="205" textAnchor="middle" fill="white" fontSize="8">DB</text>
            
            <circle cx="320" cy="200" r="16" fill="#ef4444" className="player-node lb" />
            <text x="320" y="205" textAnchor="middle" fill="white" fontSize="8">LB</text>
          </g>
          
          {/* Connection lines */}
          <g className="connections">
            <line x1="200" y1="150" x2="120" y2="100" stroke="#10b981" strokeWidth="4" opacity="0.8" />
            <line x1="200" y1="150" x2="280" y2="100" stroke="#3b82f6" strokeWidth="3" opacity="0.6" />
            <line x1="200" y1="150" x2="200" y2="220" stroke="#10b981" strokeWidth="4" opacity="0.8" />
            <line x1="120" y1="100" x2="280" y2="100" stroke="#f59e0b" strokeWidth="2" opacity="0.5" />
            <line x1="80" y1="200" x2="320" y2="200" stroke="#10b981" strokeWidth="3" opacity="0.7" />
          </g>
        </svg>
      </div>
      <div className="network-legend">
        <div className="legend-title">Player Chemistry Network</div>
        <div className="connection-strength">
          <div className="strength-item">
            <div className="strength-line excellent"></div>
            <span>Excellent (9.0+)</span>
          </div>
          <div className="strength-item">
            <div className="strength-line strong"></div>
            <span>Strong (8.0-8.9)</span>
          </div>
          <div className="strength-item">
            <div className="strength-line good"></div>
            <span>Good (7.0-7.9)</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPositionGroups = () => (
    <div className="position-groups-container">
      {chemistryData.positionGroups.map((group, index) => (
        <div key={index} className="position-group-card">
          <div className="group-header">
            <h4>{group.group}</h4>
            <div 
              className="group-chemistry-score"
              style={{ color: getChemistryColor(group.chemistry) }}
            >
              {group.chemistry}/10
            </div>
          </div>
          
          <div className="group-members">
            <strong>Members:</strong>
            <div className="members-list">
              {group.members.map((member, idx) => (
                <span key={idx} className="member-tag">{member}</span>
              ))}
            </div>
          </div>
          
          <div className="group-analysis">
            <div className="strengths-section">
              <strong>Strengths:</strong>
              <ul>
                {group.strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
            
            <div className="improvements-section">
              <strong>Areas to Improve:</strong>
              <ul>
                {group.improvements.map((improvement, idx) => (
                  <li key={idx}>{improvement}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="performance-impact">
            <strong>Performance Impact:</strong> {group.performance}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="stats-card">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>🤝 Analyzing team chemistry and relationships...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="team-chemistry-analytics">
      {/* Overall Chemistry Score */}
      <div className="stats-card chemistry-overview">
        <div className="chemistry-score-main">
          <div className="chemistry-score-container">
            <div 
              className="chemistry-score-circle"
              style={{ 
                background: `conic-gradient(${getChemistryColor(chemistryData.overallChemistry)} ${chemistryData.overallChemistry}%, #f1f5f9 ${chemistryData.overallChemistry}%)`
              }}
            >
              <div className="chemistry-score-inner">
                <div className="chemistry-score-value">{chemistryData.overallChemistry}</div>
                <div className="chemistry-score-label">Team Chemistry</div>
              </div>
            </div>
            <div className="chemistry-interpretation">
              <div className="chemistry-level" style={{ color: getChemistryColor(chemistryData.overallChemistry) }}>
                {chemistryData.overallChemistry >= 9.0 ? 'Excellent' : chemistryData.overallChemistry >= 8.0 ? 'Strong' : 'Good'}
              </div>
              <div className="chemistry-subtitle">Overall team cohesion and trust</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="stats-card view-controls">
        <h4>🎛️ Analysis Views</h4>
        <div className="control-tabs">
          <button 
            className={activeView === 'overview' ? 'tab-active' : ''}
            onClick={() => setActiveView('overview')}
          >
            Overview
          </button>
          <button 
            className={activeView === 'relationships' ? 'tab-active' : ''}
            onClick={() => setActiveView('relationships')}
          >
            Player Relationships
          </button>
          <button 
            className={activeView === 'groups' ? 'tab-active' : ''}
            onClick={() => setActiveView('groups')}
          >
            Position Groups
          </button>
          <button 
            className={activeView === 'communication' ? 'tab-active' : ''}
            onClick={() => setActiveView('communication')}
          >
            Communication
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeView === 'overview' && (
        <>
          {/* Player Network Visualization */}
          <div className="stats-card player-network">
            <h4>🕸️ Player Chemistry Network</h4>
            {renderPlayerNetwork()}
          </div>

          {/* Performance Impact */}
          <div className="stats-card performance-impact">
            <h4>📈 Chemistry Impact on Performance</h4>
            <div className="impact-comparison">
              <div className="impact-section high-chemistry">
                <h5>High Chemistry Games</h5>
                <div className="impact-stats">
                  <div className="impact-stat">
                    <span className="stat-label">Win Rate:</span>
                    <span className="stat-value">{chemistryData.performanceImpact.highChemistryGames?.winRate}%</span>
                  </div>
                  <div className="impact-stat">
                    <span className="stat-label">Avg Score:</span>
                    <span className="stat-value">{chemistryData.performanceImpact.highChemistryGames?.averageScore}</span>
                  </div>
                  <div className="impact-stat">
                    <span className="stat-label">Points For:</span>
                    <span className="stat-value">{chemistryData.performanceImpact.highChemistryGames?.avgPointsScored}</span>
                  </div>
                  <div className="impact-stat">
                    <span className="stat-label">Points Against:</span>
                    <span className="stat-value">{chemistryData.performanceImpact.highChemistryGames?.avgPointsAllowed}</span>
                  </div>
                </div>
              </div>
              
              <div className="impact-section low-chemistry">
                <h5>Low Chemistry Games</h5>
                <div className="impact-stats">
                  <div className="impact-stat">
                    <span className="stat-label">Win Rate:</span>
                    <span className="stat-value">{chemistryData.performanceImpact.lowChemistryGames?.winRate}%</span>
                  </div>
                  <div className="impact-stat">
                    <span className="stat-label">Avg Score:</span>
                    <span className="stat-value">{chemistryData.performanceImpact.lowChemistryGames?.averageScore}</span>
                  </div>
                  <div className="impact-stat">
                    <span className="stat-label">Points For:</span>
                    <span className="stat-value">{chemistryData.performanceImpact.lowChemistryGames?.avgPointsScored}</span>
                  </div>
                  <div className="impact-stat">
                    <span className="stat-label">Points Against:</span>
                    <span className="stat-value">{chemistryData.performanceImpact.lowChemistryGames?.avgPointsAllowed}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="correlations-section">
              <h5>Key Correlations</h5>
              {chemistryData.performanceImpact.correlations?.map((corr, index) => (
                <div key={index} className="correlation-item">
                  <span className="correlation-factor">{corr.factor}</span>
                  <span className="correlation-value">r = {corr.correlation}</span>
                  <span className="correlation-strength">{corr.strength}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeView === 'relationships' && (
        <div className="stats-card player-relationships">
          <h4>🤝 Player Relationship Analysis</h4>
          <div className="relationships-grid">
            {chemistryData.playerRelationships.map((rel, index) => (
              <div key={index} className="relationship-card">
                <div className="relationship-header">
                  <div className="player-pair">
                    <span>{rel.player1}</span>
                    <span className="connection-icon">↔</span>
                    <span>{rel.player2}</span>
                  </div>
                  <div 
                    className="relationship-score"
                    style={{ color: getChemistryColor(rel.chemistry) }}
                  >
                    {rel.chemistry}/10
                  </div>
                </div>
                
                <div className="relationship-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getChemistryColor(rel.chemistry) }}
                  >
                    {getRelationshipLabel(rel.relationship)}
                  </span>
                  <span className="improvement-trend">{rel.improvement}</span>
                </div>
                
                <div className="relationship-metrics">
                  {Object.entries(rel.metrics).map(([metric, value]) => (
                    <div key={metric} className="metric-row">
                      <span className="metric-name">{metric.charAt(0).toUpperCase() + metric.slice(1)}</span>
                      <div className="metric-bar-container">
                        <div 
                          className="metric-bar"
                          style={{ 
                            width: `${value * 10}%`,
                            backgroundColor: getChemistryColor(value)
                          }}
                        ></div>
                        <span className="metric-value">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="relationship-stats">
                  <div className="stat-item">
                    <span className="stat-label">Interactions:</span>
                    <span className="stat-value">{rel.interactions}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Success Rate:</span>
                    <span className="stat-value">{rel.successRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'groups' && (
        <div className="stats-card position-groups">
          <h4>👥 Position Group Chemistry</h4>
          {renderPositionGroups()}
        </div>
      )}

      {activeView === 'communication' && (
        <div className="stats-card communication-analysis">
          <h4>💬 Communication Analysis</h4>
          
          <div className="communication-overview">
            <div className="comm-score-display">
              <div className="comm-score-value">{chemistryData.communicationMetrics.overallScore}/10</div>
              <div className="comm-score-label">Overall Communication Score</div>
            </div>
            
            <div className="comm-metrics-grid">
              <div className="comm-metric">
                <span className="metric-label">Response Time</span>
                <span className="metric-value">{chemistryData.communicationMetrics.responseTime}s</span>
              </div>
              <div className="comm-metric">
                <span className="metric-label">Clarity Score</span>
                <span className="metric-value">{chemistryData.communicationMetrics.clarityScore}/10</span>
              </div>
              <div className="comm-metric">
                <span className="metric-label">Effectiveness</span>
                <span className="metric-value">{chemistryData.communicationMetrics.effectivenessRate}%</span>
              </div>
            </div>
          </div>
          
          <div className="communication-patterns">
            <h5>Communication Patterns by Situation</h5>
            <div className="patterns-grid">
              {Object.entries(chemistryData.communicationMetrics.patterns || {}).map(([situation, data]) => (
                <div key={situation} className="pattern-card">
                  <h6>{situation.charAt(0).toUpperCase() + situation.slice(1)}</h6>
                  <div className="pattern-metrics">
                    <div className="pattern-metric">
                      <span>Score: {data.score}/10</span>
                    </div>
                    <div className="pattern-metric">
                      <span>Volume: {data.volume}</span>
                    </div>
                    <div className="pattern-metric">
                      <span>Clarity: {data.clarity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="top-communicators">
            <h5>Top Communicators</h5>
            {chemistryData.communicationMetrics.topCommunicators?.map((player, index) => (
              <div key={index} className="communicator-item">
                <span className="player-name">{player.player}</span>
                <span className="player-role">{player.role}</span>
                <span 
                  className="comm-score"
                  style={{ color: getChemistryColor(player.score) }}
                >
                  {player.score}/10
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chemistry Trends */}
      <div className="stats-card chemistry-trends">
        <h4>📈 Chemistry Trends</h4>
        <div className="trends-visualization">
          {chemistryData.trends.map((point, index) => (
            <div key={index} className="trend-point">
              <div className="trend-week">{point.week}</div>
              <div 
                className={`trend-bar ${point.predicted ? 'predicted' : ''}`}
                style={{ 
                  height: `${(point.chemistry - 75) * 4}px`,
                  backgroundColor: point.predicted ? '#10b981' : getChemistryColor(point.chemistry)
                }}
              >
                <span className="trend-score">{point.chemistry}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="trends-legend">
          <span className="legend-item">
            <div className="legend-color historical"></div>
            Historical
          </span>
          <span className="legend-item">
            <div className="legend-color predicted-chemistry"></div>
            Predicted
          </span>
        </div>
      </div>

      {/* Recommendations */}
      <div className="stats-card chemistry-recommendations">
        <h4>🎯 Team Building Recommendations</h4>
        <div className="recommendations-list">
          {chemistryData.recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <div className="rec-header">
                <span className="rec-title">{rec.title}</span>
                <span className={`rec-priority ${rec.priority}`}>{rec.priority} priority</span>
              </div>
              <div className="rec-description">{rec.description}</div>
              <div className="rec-actions">
                <strong>Recommended Actions:</strong>
                <ul>
                  {rec.actions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
              <div className="rec-impact">
                <strong>Expected Impact:</strong> {rec.expectedImprovement}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="stats-card chemistry-actions">
        <h4>⚡ Team Chemistry Tools</h4>
        <div className="action-buttons">
          <button className="action-btn primary">Schedule Team Building</button>
          <button className="action-btn secondary">Generate Chemistry Report</button>
          <button className="action-btn secondary">Communication Workshop</button>
          <button className="action-btn secondary">Export Team Analysis</button>
        </div>
      </div>
    </div>
  );
};

export default TeamChemistryAnalytics;
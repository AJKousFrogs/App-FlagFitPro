import React, { useState, useEffect } from 'react';

const InteractivePerformanceVisualization = () => {
  const [visualizationData, setVisualizationData] = useState({
    performanceMetrics: [],
    heatMapData: {},
    radarChartData: {},
    timeSeriesData: [],
    comparativeData: {},
    filters: {
      timeRange: '30d',
      metric: 'overall',
      position: 'all'
    }
  });
  
  const [activeVisualization, setActiveVisualization] = useState('heatmap');
  const [selectedMetric, setSelectedMetric] = useState('performance_score');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate comprehensive performance visualization data
    const generateVisualizationData = () => {
      const mockData = {
        performanceMetrics: [
          { metric: 'Speed', current: 85, previous: 82, target: 88, trend: 'up' },
          { metric: 'Agility', current: 78, previous: 80, target: 85, trend: 'down' },
          { metric: 'Strength', current: 92, previous: 88, target: 90, trend: 'up' },
          { metric: 'Endurance', current: 76, previous: 74, target: 82, trend: 'up' },
          { metric: 'Accuracy', current: 89, previous: 87, target: 92, trend: 'up' },
          { metric: 'Reaction Time', current: 82, previous: 79, target: 85, trend: 'up' }
        ],
        heatMapData: {
          fieldZones: [
            // End zones
            { zone: 'Left End Zone', x: 0, y: 25, performance: 94, attempts: 12, success: 11 },
            { zone: 'Right End Zone', x: 100, y: 25, performance: 89, attempts: 15, success: 13 },
            
            // Red zones
            { zone: 'Left Red Zone', x: 10, y: 25, performance: 87, attempts: 28, success: 24 },
            { zone: 'Right Red Zone', x: 90, y: 25, performance: 82, attempts: 31, success: 25 },
            
            // Midfield zones
            { zone: 'Center Field', x: 50, y: 25, performance: 91, attempts: 45, success: 41 },
            { zone: 'Left Sideline', x: 25, y: 45, performance: 73, attempts: 22, success: 16 },
            { zone: 'Right Sideline', x: 75, y: 45, performance: 68, attempts: 19, success: 13 },
            
            // Deep zones
            { zone: 'Deep Left', x: 30, y: 75, performance: 79, attempts: 18, success: 14 },
            { zone: 'Deep Center', x: 50, y: 75, performance: 85, attempts: 24, success: 20 },
            { zone: 'Deep Right', x: 70, y: 75, performance: 77, attempts: 16, success: 12 },
            
            // Short zones
            { zone: 'Short Left', x: 30, y: 10, performance: 88, attempts: 35, success: 31 },
            { zone: 'Short Center', x: 50, y: 10, performance: 92, attempts: 42, success: 39 },
            { zone: 'Short Right', x: 70, y: 10, performance: 86, attempts: 33, success: 28 }
          ]
        },
        radarChartData: {
          categories: ['Speed', 'Agility', 'Strength', 'Endurance', 'Accuracy', 'Decision Making'],
          playerData: [85, 78, 92, 76, 89, 83],
          teamAverage: [82, 81, 87, 79, 85, 80],
          positionAverage: [87, 82, 89, 78, 91, 85]
        },
        timeSeriesData: [
          { date: '2024-01-01', performance: 78, training_load: 65, recovery: 82 },
          { date: '2024-01-02', performance: 81, training_load: 70, recovery: 79 },
          { date: '2024-01-03', performance: 76, training_load: 75, recovery: 75 },
          { date: '2024-01-04', performance: 84, training_load: 60, recovery: 85 },
          { date: '2024-01-05', performance: 87, training_load: 65, recovery: 88 },
          { date: '2024-01-06', performance: 82, training_load: 80, recovery: 72 },
          { date: '2024-01-07', performance: 89, training_load: 55, recovery: 91 },
          { date: '2024-01-08', performance: 85, training_load: 70, recovery: 86 },
          { date: '2024-01-09', performance: 88, training_load: 65, recovery: 89 },
          { date: '2024-01-10', performance: 91, training_load: 60, recovery: 93 },
          { date: '2024-01-11', performance: 86, training_load: 75, recovery: 80 },
          { date: '2024-01-12', performance: 90, training_load: 58, recovery: 94 },
          { date: '2024-01-13', performance: 88, training_load: 68, recovery: 87 },
          { date: '2024-01-14', performance: 93, training_load: 55, recovery: 96 }
        ],
        comparativeData: {
          vsTeammates: {
            better: ['Speed', 'Accuracy', 'Strength'],
            worse: ['Agility', 'Endurance']
          },
          vsPosition: {
            percentile: 78,
            strengths: ['Strength', 'Accuracy'],
            improvements: ['Agility', 'Endurance', 'Decision Making']
          },
          weeklyProgress: {
            thisWeek: 87.2,
            lastWeek: 84.6,
            change: '+2.6'
          }
        }
      };
      
      setVisualizationData(mockData);
      setLoading(false);
    };

    const timer = setTimeout(generateVisualizationData, 1400);
    return () => clearTimeout(timer);
  }, []);

  const getPerformanceColor = (performance) => {
    if (performance >= 90) return '#10b981'; // excellent
    if (performance >= 80) return '#3b82f6'; // good
    if (performance >= 70) return '#f59e0b'; // fair
    return '#ef4444'; // needs work
  };

  const getTrendIcon = (trend) => {
    return trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
  };

  const renderHeatMap = () => (
    <div className="heatmap-container">
      <div className="field-visualization">
        <div className="field-background">
          <div className="field-lines">
            <div className="yard-line yard-10"></div>
            <div className="yard-line yard-20"></div>
            <div className="yard-line yard-30"></div>
            <div className="yard-line yard-40"></div>
            <div className="yard-line yard-50"></div>
            <div className="yard-line yard-60"></div>
            <div className="yard-line yard-70"></div>
            <div className="yard-line yard-80"></div>
            <div className="yard-line yard-90"></div>
          </div>
          {visualizationData.heatMapData.fieldZones?.map((zone, index) => (
            <div
              key={index}
              className="performance-zone"
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                backgroundColor: getPerformanceColor(zone.performance),
                opacity: 0.7
              }}
              title={`${zone.zone}: ${zone.performance}% (${zone.success}/${zone.attempts})`}
            >
              <div className="zone-label">{zone.performance}%</div>
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap-legend">
        <div className="legend-title">Performance by Field Zone</div>
        <div className="legend-scale">
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#ef4444'}}></div>
            <span>Needs Work (&lt;70%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#f59e0b'}}></div>
            <span>Fair (70-79%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#3b82f6'}}></div>
            <span>Good (80-89%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: '#10b981'}}></div>
            <span>Excellent (90%+)</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRadarChart = () => (
    <div className="radar-chart-container">
      <div className="radar-chart">
        <svg viewBox="0 0 300 300" className="radar-svg">
          {/* Grid lines */}
          <g className="radar-grid">
            {[1, 2, 3, 4, 5].map(level => (
              <polygon
                key={level}
                points="150,30 258.3,105 258.3,195 150,270 41.7,195 41.7,105"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="1"
                transform={`scale(${level/5})`}
                transformOrigin="150 150"
              />
            ))}
            {/* Axis lines */}
            {visualizationData.radarChartData.categories?.map((_, index) => {
              const angle = (index * 60 - 90) * Math.PI / 180;
              const x2 = 150 + 120 * Math.cos(angle);
              const y2 = 150 + 120 * Math.sin(angle);
              return (
                <line
                  key={index}
                  x1="150"
                  y1="150"
                  x2={x2}
                  y2={y2}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              );
            })}
          </g>
          
          {/* Player data */}
          <polygon
            points={visualizationData.radarChartData.playerData?.map((value, index) => {
              const angle = (index * 60 - 90) * Math.PI / 180;
              const radius = (value / 100) * 120;
              const x = 150 + radius * Math.cos(angle);
              const y = 150 + radius * Math.sin(angle);
              return `${x},${y}`;
            }).join(' ')}
            fill="rgba(59, 130, 246, 0.3)"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          
          {/* Team average */}
          <polygon
            points={visualizationData.radarChartData.teamAverage?.map((value, index) => {
              const angle = (index * 60 - 90) * Math.PI / 180;
              const radius = (value / 100) * 120;
              const x = 150 + radius * Math.cos(angle);
              const y = 150 + radius * Math.sin(angle);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          
          {/* Labels */}
          {visualizationData.radarChartData.categories?.map((category, index) => {
            const angle = (index * 60 - 90) * Math.PI / 180;
            const x = 150 + 140 * Math.cos(angle);
            const y = 150 + 140 * Math.sin(angle);
            return (
              <text
                key={index}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="radar-label"
                fontSize="12"
                fill="#374151"
              >
                {category}
              </text>
            );
          })}
        </svg>
      </div>
      <div className="radar-legend">
        <div className="legend-item">
          <div className="legend-line player-line"></div>
          <span>Your Performance</span>
        </div>
        <div className="legend-item">
          <div className="legend-line team-line"></div>
          <span>Team Average</span>
        </div>
      </div>
    </div>
  );

  const renderTimeSeries = () => (
    <div className="timeseries-container">
      <div className="timeseries-chart">
        <svg viewBox="0 0 400 200" className="timeseries-svg">
          {/* Grid */}
          <g className="chart-grid">
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="40"
                y1={40 + i * 30}
                x2="380"
                y2={40 + i * 30}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}
          </g>
          
          {/* Performance Line */}
          <polyline
            points={visualizationData.timeSeriesData?.map((point, index) => 
              `${40 + (index * 24)},${160 - (point.performance - 70) * 2}`
            ).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
          />
          
          {/* Recovery Line */}
          <polyline
            points={visualizationData.timeSeriesData?.map((point, index) => 
              `${40 + (index * 24)},${160 - (point.recovery - 70) * 2}`
            ).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="3,3"
          />
          
          {/* Data points */}
          {visualizationData.timeSeriesData?.map((point, index) => (
            <circle
              key={index}
              cx={40 + (index * 24)}
              cy={160 - (point.performance - 70) * 2}
              r="3"
              fill="#3b82f6"
              className="data-point"
            />
          ))}
          
          {/* Y-axis labels */}
          {[70, 80, 90, 100].map((value, index) => (
            <text
              key={value}
              x="35"
              y={165 - index * 30}
              textAnchor="end"
              fontSize="12"
              fill="#6b7280"
            >
              {value}
            </text>
          ))}
        </svg>
      </div>
      <div className="timeseries-legend">
        <div className="legend-item">
          <div className="legend-line performance-line"></div>
          <span>Performance Score</span>
        </div>
        <div className="legend-item">
          <div className="legend-line recovery-line"></div>
          <span>Recovery Score</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="stats-card">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>📊 Generating interactive performance visualizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="interactive-performance-visualization">
      {/* Performance Metrics Overview */}
      <div className="stats-card metrics-overview">
        <h4>📊 Performance Metrics Overview</h4>
        <div className="metrics-grid">
          {visualizationData.performanceMetrics.map((metric, index) => (
            <div key={index} className="metric-card">
              <div className="metric-header">
                <span className="metric-name">{metric.metric}</span>
                <span className="metric-trend">{getTrendIcon(metric.trend)}</span>
              </div>
              <div className="metric-values">
                <div className="current-value">{metric.current}</div>
                <div className="previous-value">
                  Previous: {metric.previous} 
                  <span style={{ color: metric.trend === 'up' ? '#10b981' : '#ef4444' }}>
                    ({metric.trend === 'up' ? '+' : ''}{metric.current - metric.previous})
                  </span>
                </div>
              </div>
              <div className="metric-progress">
                <div className="progress-track">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${(metric.current / metric.target) * 100}%`,
                      backgroundColor: getPerformanceColor(metric.current)
                    }}
                  ></div>
                </div>
                <div className="target-label">Target: {metric.target}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visualization Controls */}
      <div className="stats-card viz-controls">
        <h4>🎛️ Visualization Controls</h4>
        <div className="controls-grid">
          <div className="control-group">
            <label>Visualization Type:</label>
            <select 
              value={activeVisualization} 
              onChange={(e) => setActiveVisualization(e.target.value)}
              className="control-select"
            >
              <option value="heatmap">Field Heat Map</option>
              <option value="radar">Radar Chart</option>
              <option value="timeseries">Time Series</option>
            </select>
          </div>
          <div className="control-group">
            <label>Metric Focus:</label>
            <select 
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="control-select"
            >
              <option value="performance_score">Overall Performance</option>
              <option value="accuracy">Accuracy</option>
              <option value="speed">Speed</option>
              <option value="strength">Strength</option>
            </select>
          </div>
          <div className="control-group">
            <label>Time Range:</label>
            <select className="control-select">
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 3 Months</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="stats-card main-visualization">
        <h4>
          {activeVisualization === 'heatmap' && '🗺️ Field Performance Heat Map'}
          {activeVisualization === 'radar' && '🎯 Multi-Dimensional Performance Radar'}
          {activeVisualization === 'timeseries' && '📈 Performance Trends Over Time'}
        </h4>
        <div className="visualization-content">
          {activeVisualization === 'heatmap' && renderHeatMap()}
          {activeVisualization === 'radar' && renderRadarChart()}
          {activeVisualization === 'timeseries' && renderTimeSeries()}
        </div>
      </div>

      {/* Comparative Analysis */}
      <div className="stats-card comparative-analysis">
        <h4>📊 Comparative Performance Analysis</h4>
        <div className="comparison-grid">
          <div className="comparison-section">
            <h5>vs Teammates</h5>
            <div className="comparison-lists">
              <div className="strengths">
                <div className="comparison-label">Strengths:</div>
                {visualizationData.comparativeData.vsTeammates?.better.map((strength, index) => (
                  <div key={index} className="comparison-item positive">
                    ✅ {strength}
                  </div>
                ))}
              </div>
              <div className="improvements">
                <div className="comparison-label">Areas for Improvement:</div>
                {visualizationData.comparativeData.vsTeammates?.worse.map((area, index) => (
                  <div key={index} className="comparison-item negative">
                    🎯 {area}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="comparison-section">
            <h5>Position Ranking</h5>
            <div className="percentile-display">
              <div className="percentile-circle">
                <div className="percentile-value">
                  {visualizationData.comparativeData.vsPosition?.percentile}th
                </div>
                <div className="percentile-label">Percentile</div>
              </div>
            </div>
            <div className="position-details">
              <div className="position-strengths">
                <strong>Position Strengths:</strong>
                {visualizationData.comparativeData.vsPosition?.strengths.join(', ')}
              </div>
              <div className="position-improvements">
                <strong>Focus Areas:</strong>
                {visualizationData.comparativeData.vsPosition?.improvements.join(', ')}
              </div>
            </div>
          </div>
          
          <div className="comparison-section">
            <h5>Weekly Progress</h5>
            <div className="weekly-progress">
              <div className="progress-comparison">
                <div className="week-score">
                  <span className="week-label">This Week</span>
                  <span className="week-value">{visualizationData.comparativeData.weeklyProgress?.thisWeek}</span>
                </div>
                <div className="progress-arrow">→</div>
                <div className="week-score">
                  <span className="week-label">Last Week</span>
                  <span className="week-value">{visualizationData.comparativeData.weeklyProgress?.lastWeek}</span>
                </div>
              </div>
              <div 
                className="progress-change"
                style={{ 
                  color: visualizationData.comparativeData.weeklyProgress?.change.startsWith('+') ? '#10b981' : '#ef4444'
                }}
              >
                Change: {visualizationData.comparativeData.weeklyProgress?.change} points
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Insights */}
      <div className="stats-card interactive-insights">
        <h4>💡 Interactive Insights</h4>
        <div className="insights-list">
          <div className="insight-item">
            <div className="insight-icon">🏟️</div>
            <div className="insight-content">
              <div className="insight-title">Field Zone Analysis</div>
              <div className="insight-text">
                Your performance is strongest in center field (91%) and end zones (94% left, 89% right). 
                Focus on improving sideline performance (73% left, 68% right).
              </div>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <div className="insight-title">Performance Trend</div>
              <div className="insight-text">
                14-day upward trend with 93% peak performance. Strong correlation between 
                recovery scores and next-day performance (r=0.78).
              </div>
            </div>
          </div>
          <div className="insight-item">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <div className="insight-title">Key Strengths</div>
              <div className="insight-text">
                Strength (92/100) and Accuracy (89/100) are your top performers. 
                78th percentile ranking among position players.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="stats-card viz-actions">
        <h4>⚡ Advanced Analytics</h4>
        <div className="action-buttons">
          <button className="action-btn primary">Generate Custom Report</button>
          <button className="action-btn secondary">Export Visualization</button>
          <button className="action-btn secondary">Share with Coach</button>
          <button className="action-btn secondary">Compare with Team</button>
        </div>
      </div>
    </div>
  );
};

export default InteractivePerformanceVisualization;
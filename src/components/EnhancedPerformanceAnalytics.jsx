import React, { useState, useEffect } from 'react';
import { enhancedPerformanceService } from '../services/EnhancedPerformanceService';

const EnhancedPerformanceAnalytics = ({ userId, userProfile }) => {
  const [performanceData, setPerformanceData] = useState({
    analysis: null,
    insights: [],
    recommendations: [],
    loading: true,
    error: null
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('30days');

  useEffect(() => {
    loadPerformanceAnalysis();
  }, [userId, timeframe]);

  const loadPerformanceAnalysis = async () => {
    try {
      setPerformanceData(prev => ({ ...prev, loading: true, error: null }));

      // Mock data for demonstration - in production, this would come from database
      const mockPerformanceData = {
        sessions: [
          {
            date: '2024-01-15',
            metrics: { speed: 85, agility: 82, endurance: 78, strength: 80, technical: 88, decision_making: 85 }
          },
          {
            date: '2024-01-12',
            metrics: { speed: 83, agility: 84, endurance: 76, strength: 82, technical: 86, decision_making: 87 }
          },
          {
            date: '2024-01-10',
            metrics: { speed: 81, agility: 80, endurance: 79, strength: 78, technical: 84, decision_making: 83 }
          }
        ],
        physical: {
          speed: { current: 85, baseline: 78, history: [78, 80, 82, 83, 85] },
          agility: { current: 82, baseline: 75, history: [75, 77, 79, 81, 82] },
          endurance: { current: 78, baseline: 72, history: [72, 74, 76, 77, 78] }
        },
        technical: {
          passingAccuracy: { current: 88, baseline: 82, history: [82, 84, 85, 87, 88] },
          ballHandling: { current: 85, baseline: 80, history: [80, 81, 83, 84, 85] },
          routeRunning: { current: 86, baseline: 79, history: [79, 81, 83, 85, 86] }
        },
        mental: {
          focus: { current: 87, baseline: 82, history: [82, 83, 85, 86, 87] },
          confidence: { current: 85, baseline: 78, history: [78, 80, 82, 84, 85] },
          resilience: { current: 83, baseline: 80, history: [80, 81, 82, 82, 83] }
        }
      };

      const mockContextData = {
        training: { intensity: 7.5, frequency: 4, consistency: 0.85 },
        nutrition: { adherence: 0.82, quality: 0.88 },
        recovery: { sleep: 0.75, stress: 0.70 },
        environment: { conditions: 'optimal' }
      };

      const analysis = await enhancedPerformanceService.getComprehensivePerformanceAnalysis(
        userProfile,
        mockPerformanceData,
        mockContextData
      );

      setPerformanceData({
        analysis,
        insights: analysis.insights || [],
        recommendations: analysis.recommendations || [],
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error loading performance analysis:', error);
      setPerformanceData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load performance analysis'
      }));
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981'; // green
    if (score >= 70) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence === 'high' || confidence > 0.8) return '#10b981';
    if (confidence === 'medium' || confidence > 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const renderOverviewTab = () => {
    const { analysis } = performanceData;
    if (!analysis) return null;

    const { performanceMetrics, trendAnalysis } = analysis.analysis;

    return (
      <div className="performance-overview">
        {/* Overall Performance Score */}
        <div className="stats-card performance-score-main">
          <div className="performance-score-container">
            <div 
              className="performance-score-circle"
              style={{ 
                background: `conic-gradient(${getScoreColor(performanceMetrics.overall.score)} ${performanceMetrics.overall.score}%, #f1f5f9 ${performanceMetrics.overall.score}%)`
              }}
            >
              <div className="performance-score-inner">
                <div className="performance-score-value">{performanceMetrics.overall.score}</div>
                <div className="performance-score-label">Performance Score</div>
                <div className="performance-trend">
                  {getTrendIcon(performanceMetrics.overall.trend)} {performanceMetrics.overall.trend}
                </div>
              </div>
            </div>
            <div className="performance-interpretation">
              <div className="performance-level" style={{ color: getScoreColor(performanceMetrics.overall.score) }}>
                {performanceMetrics.overall.score >= 85 ? 'Elite' : 
                 performanceMetrics.overall.score >= 70 ? 'Advanced' : 
                 performanceMetrics.overall.score >= 60 ? 'Developing' : 'Needs Focus'}
              </div>
              <div className="performance-subtitle">
                Based on {performanceMetrics.overall.sessionsAnalyzed} sessions
              </div>
              <div className="performance-confidence" style={{ color: getConfidenceColor(performanceMetrics.overall.confidence) }}>
                Confidence: {performanceMetrics.overall.confidence}
              </div>
            </div>
          </div>
        </div>

        {/* Key Performance Areas */}
        <div className="stats-card performance-areas">
          <h4>🎯 Performance Areas</h4>
          <div className="performance-areas-grid">
            {/* Physical Metrics */}
            <div className="performance-area">
              <h5>💪 Physical</h5>
              {Object.entries(performanceMetrics.physical).map(([metric, data]) => (
                <div key={metric} className="metric-item">
                  <div className="metric-header">
                    <span className="metric-name">{metric.charAt(0).toUpperCase() + metric.slice(1)}</span>
                    <span className="metric-score" style={{ color: getScoreColor(data.current) }}>
                      {data.current}
                    </span>
                  </div>
                  <div className="metric-details">
                    <span>Improvement: {data.improvement > 0 ? '+' : ''}{data.improvement}%</span>
                    <span>Trend: {getTrendIcon(data.trend)} {data.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Technical Metrics */}
            <div className="performance-area">
              <h5>⚽ Technical</h5>
              {Object.entries(performanceMetrics.technical).map(([metric, data]) => (
                <div key={metric} className="metric-item">
                  <div className="metric-header">
                    <span className="metric-name">
                      {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <span className="metric-score" style={{ color: getScoreColor(data.current) }}>
                      {data.current}
                    </span>
                  </div>
                  <div className="metric-details">
                    <span>Improvement: {data.improvement > 0 ? '+' : ''}{data.improvement}%</span>
                    <span>Consistency: {data.consistency}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mental Metrics */}
            <div className="performance-area">
              <h5>🧠 Mental</h5>
              {Object.entries(performanceMetrics.mental).map(([metric, data]) => (
                <div key={metric} className="metric-item">
                  <div className="metric-header">
                    <span className="metric-name">{metric.charAt(0).toUpperCase() + metric.slice(1)}</span>
                    <span className="metric-score" style={{ color: getScoreColor(data.current) }}>
                      {data.current}
                    </span>
                  </div>
                  <div className="metric-details">
                    <span>Improvement: {data.improvement > 0 ? '+' : ''}{data.improvement}%</span>
                    <span>Stability: {data.stability}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="stats-card performance-insights">
          <h4>💡 Key Insights</h4>
          <div className="insights-list">
            {performanceData.insights.map((insight, index) => (
              <div key={index} className="insight-item">
                <span className="insight-text">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTrendsTab = () => {
    const { analysis } = performanceData;
    if (!analysis) return null;

    const { trendAnalysis, performancePredictions } = analysis.analysis;

    return (
      <div className="performance-trends">
        {/* Trend Analysis */}
        <div className="stats-card trend-analysis">
          <h4>📊 Performance Trend Analysis</h4>
          {trendAnalysis && (
            <div className="trend-content">
              <div className="trend-confidence">
                <span className="confidence-label">Analysis Confidence:</span>
                <span 
                  className="confidence-value"
                  style={{ color: getConfidenceColor(trendAnalysis.confidence) }}
                >
                  {Math.round(trendAnalysis.confidence * 100)}%
                </span>
              </div>
              
              <div className="trend-patterns">
                <h5>🔍 Identified Patterns</h5>
                {trendAnalysis.patterns.map((pattern, index) => (
                  <div key={index} className="pattern-item">
                    • {pattern}
                  </div>
                ))}
              </div>

              {trendAnalysis.predictions && (
                <div className="trend-predictions">
                  <h5>🔮 Trend Predictions</h5>
                  {trendAnalysis.predictions.map((prediction, index) => (
                    <div key={index} className="prediction-item">
                      • {prediction}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Performance Predictions */}
        {performancePredictions && (
          <div className="stats-card performance-predictions">
            <h4>🎯 Performance Predictions</h4>
            <div className="predictions-grid">
              <div className="prediction-timeframe">
                <h5>Short-term (1-2 weeks)</h5>
                <div className="prediction-content">
                  <div className="prediction-text">{performancePredictions.shortTerm.overall}</div>
                  <div className="prediction-confidence">
                    Confidence: {performancePredictions.shortTerm.confidence}
                  </div>
                </div>
              </div>

              <div className="prediction-timeframe">
                <h5>Medium-term (1-3 months)</h5>
                <div className="prediction-content">
                  <div className="prediction-text">{performancePredictions.mediumTerm.overall}</div>
                  <div className="prediction-confidence">
                    Confidence: {performancePredictions.mediumTerm.confidence}
                  </div>
                </div>
              </div>

              <div className="prediction-timeframe">
                <h5>Long-term (3-12 months)</h5>
                <div className="prediction-content">
                  <div className="prediction-text">{performancePredictions.longTerm.overall}</div>
                  <div className="prediction-confidence">
                    Confidence: {performancePredictions.longTerm.confidence}
                  </div>
                </div>
              </div>
            </div>

            {performancePredictions.assumptions && (
              <div className="prediction-assumptions">
                <h5>📋 Key Assumptions</h5>
                {performancePredictions.assumptions.map((assumption, index) => (
                  <div key={index} className="assumption-item">
                    • {assumption}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRecommendationsTab = () => {
    return (
      <div className="performance-recommendations">
        <div className="stats-card recommendations-main">
          <h4>🎯 Performance Recommendations</h4>
          <div className="recommendations-list">
            {performanceData.recommendations.map((rec, index) => (
              <div key={index} className="recommendation-item">
                <div className="rec-header">
                  <div className="rec-priority">
                    Priority {rec.priority}
                  </div>
                  <div className="rec-category">{rec.category}</div>
                </div>
                <div className="rec-action">{rec.action}</div>
                <div className="rec-details">
                  <div className="rec-rationale">
                    <strong>Why:</strong> {rec.rationale}
                  </div>
                  <div className="rec-timeline">
                    <strong>Timeline:</strong> {rec.timeline}
                  </div>
                  {rec.expectedImpact && (
                    <div className="rec-impact">
                      <strong>Expected Impact:</strong> {rec.expectedImpact}
                    </div>
                  )}
                  {rec.evidenceLevel && (
                    <div className="rec-evidence">
                      <strong>Evidence Level:</strong> {rec.evidenceLevel}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Research Backing */}
        {performanceData.analysis?.analysis?.researchBacking && (
          <div className="stats-card research-backing">
            <h4>📚 Research Backing</h4>
            <div className="research-content">
              <div className="research-quality">
                Evidence Quality: <strong>{performanceData.analysis.analysis.evidenceQuality}</strong>
              </div>
              {performanceData.analysis.analysis.researchBacking.sources.length > 0 && (
                <div className="research-sources">
                  <h5>Sources Referenced</h5>
                  {performanceData.analysis.analysis.researchBacking.sources.slice(0, 5).map((source, index) => (
                    <div key={index} className="source-item">
                      • {source}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnalysisTab = () => {
    const { analysis } = performanceData;
    if (!analysis) return null;

    return (
      <div className="performance-analysis">
        <div className="stats-card analysis-overview">
          <h4>🔬 Analysis Overview</h4>
          <div className="analysis-details">
            <div className="analysis-item">
              <strong>Analysis Date:</strong> {new Date(analysis.timestamp).toLocaleDateString()}
            </div>
            <div className="analysis-item">
              <strong>Analysis Confidence:</strong> 
              <span style={{ color: getConfidenceColor(analysis.analysis.confidence) }}>
                {Math.round(analysis.analysis.confidence * 100)}%
              </span>
            </div>
            <div className="analysis-item">
              <strong>Evidence Quality:</strong> {analysis.analysis.evidenceQuality}
            </div>
            <div className="analysis-item">
              <strong>Next Analysis:</strong> {new Date(analysis.nextAnalysisDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Contextual Factors */}
        {analysis.analysis.performanceMetrics.contextualFactors && (
          <div className="stats-card contextual-factors">
            <h4>📊 Contextual Factors</h4>
            <div className="factors-grid">
              {Object.entries(analysis.analysis.performanceMetrics.contextualFactors).map(([factor, status]) => (
                <div key={factor} className="factor-item">
                  <span className="factor-name">{factor.charAt(0).toUpperCase() + factor.slice(1)}:</span>
                  <span className="factor-status">{status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Methods */}
        <div className="stats-card analysis-methods">
          <h4>🛠️ Analysis Methods</h4>
          <div className="methods-list">
            <div className="method-item">
              <strong>Performance Metrics:</strong> Multi-dimensional scoring across physical, technical, and mental domains
            </div>
            <div className="method-item">
              <strong>Trend Analysis:</strong> {analysis.analysis.trendAnalysis ? 'Sequential Thought reasoning applied' : 'Basic trend calculation'}
            </div>
            <div className="method-item">
              <strong>Research Integration:</strong> {analysis.analysis.researchBacking ? 'Context7 sports science research' : 'Standard methodologies'}
            </div>
            <div className="method-item">
              <strong>Predictions:</strong> {analysis.analysis.performancePredictions ? 'Advanced modeling' : 'Basic projections'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (performanceData.loading) {
    return (
      <div className="stats-card">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>📈 Analyzing performance with MCP integration...</p>
          <p className="loading-detail">Applying Sequential Thought reasoning and Context7 research...</p>
        </div>
      </div>
    );
  }

  if (performanceData.error) {
    return (
      <div className="stats-card error-state">
        <div className="error-content">
          <h4>⚠️ Analysis Error</h4>
          <p>{performanceData.error}</p>
          <button 
            className="retry-button"
            onClick={loadPerformanceAnalysis}
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-performance-analytics">
      {/* Header with Controls */}
      <div className="stats-card analytics-header">
        <div className="header-content">
          <h3>📈 Enhanced Performance Analytics</h3>
          <div className="header-controls">
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className="timeframe-select"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 3 Months</option>
              <option value="1year">Last Year</option>
            </select>
            <button 
              className="refresh-button"
              onClick={loadPerformanceAnalysis}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        {/* MCP Status Indicator */}
        {performanceData.analysis?.analysis?.researchBacking && (
          <div className="mcp-status">
            <span className="mcp-indicator active">🔗 MCP Active</span>
            <span className="mcp-details">Context7 + Sequential Thought</span>
          </div>
        )}
        {performanceData.analysis?.fallback && (
          <div className="mcp-status">
            <span className="mcp-indicator inactive">⚠️ MCP Unavailable</span>
            <span className="mcp-details">Using fallback analysis</span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="stats-card tab-navigation">
        <div className="tabs">
          <button 
            className={activeTab === 'overview' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={activeTab === 'trends' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('trends')}
          >
            📈 Trends
          </button>
          <button 
            className={activeTab === 'recommendations' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('recommendations')}
          >
            🎯 Recommendations
          </button>
          <button 
            className={activeTab === 'analysis' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('analysis')}
          >
            🔬 Analysis
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'trends' && renderTrendsTab()}
        {activeTab === 'recommendations' && renderRecommendationsTab()}
        {activeTab === 'analysis' && renderAnalysisTab()}
      </div>

      {/* Action Buttons */}
      <div className="stats-card analytics-actions">
        <h4>⚡ Take Action</h4>
        <div className="action-buttons">
          <button className="action-btn primary">Generate Training Plan</button>
          <button className="action-btn secondary">Export Performance Report</button>
          <button className="action-btn secondary">Schedule Coach Review</button>
          <button className="action-btn secondary">Track Improvements</button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPerformanceAnalytics;
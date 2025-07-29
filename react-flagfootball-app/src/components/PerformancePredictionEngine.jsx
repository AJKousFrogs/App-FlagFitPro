import React, { useState, useEffect } from 'react';

const PerformancePredictionEngine = () => {
  const [predictions, setPredictions] = useState({
    nextSessionScore: 0,
    confidence: 0,
    riskFactors: [],
    recommendations: [],
    trends: []
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate ML prediction calculation
    const calculatePredictions = () => {
      // Mock ML model results based on training data, nutrition, recovery
      const mockPredictions = {
        nextSessionScore: 87.5,
        confidence: 92,
        riskFactors: [
          { factor: 'Training Load', risk: 'medium', value: 78 },
          { factor: 'Recovery Time', risk: 'low', value: 23 },
          { factor: 'Nutrition Score', risk: 'low', value: 15 }
        ],
        recommendations: [
          '🏃‍♂️ Focus on speed drills - predicted 12% improvement',
          '💤 Increase sleep to 8+ hours for optimal recovery',
          '🥗 Add protein within 30min post-workout',
          '⚡ High-intensity session recommended for Thursday'
        ],
        trends: [
          { week: 'W1', score: 82 },
          { week: 'W2', score: 84 },
          { week: 'W3', score: 86 },
          { week: 'W4', score: 87.5 },
          { week: 'W5', score: 89.2, predicted: true }
        ]
      };
      
      setPredictions(mockPredictions);
      setLoading(false);
    };

    const timer = setTimeout(calculatePredictions, 1500);
    return () => clearTimeout(timer);
  }, []);

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="stats-card">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>🤖 AI analyzing your performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-prediction-engine">
      {/* Main Prediction Score */}
      <div className="stats-card prediction-main">
        <div className="prediction-score">
          <div className="score-value">{predictions.nextSessionScore}</div>
          <div className="score-label">Predicted Next Session Score</div>
          <div className="confidence">
            {predictions.confidence}% confidence
            <div className="progress">
              <div 
                className="progress-bar confidence-bar" 
                style={{ width: `${predictions.confidence}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Factors Grid */}
      <div className="grid">
        {predictions.riskFactors.map((factor, index) => (
          <div key={index} className="stats-card risk-factor">
            <div className="risk-header">
              <span>{factor.factor}</span>
              <span 
                className="risk-badge"
                style={{ backgroundColor: getRiskColor(factor.risk) }}
              >
                {factor.risk}
              </span>
            </div>
            <div className="risk-value">{factor.value}%</div>
            <div className="progress">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${factor.value}%`,
                  backgroundColor: getRiskColor(factor.risk)
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Trend Chart */}
      <div className="stats-card trend-chart">
        <h4>📈 Performance Trend & Prediction</h4>
        <div className="trend-visualization">
          {predictions.trends.map((point, index) => (
            <div key={index} className="trend-point">
              <div className="trend-week">{point.week}</div>
              <div 
                className={`trend-bar ${point.predicted ? 'predicted' : ''}`}
                style={{ height: `${point.score}%` }}
              >
                <span className="trend-score">{point.score}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="trend-legend">
          <span className="legend-item">
            <div className="legend-color actual"></div>
            Historical
          </span>
          <span className="legend-item">
            <div className="legend-color predicted"></div>
            Predicted
          </span>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="stats-card recommendations">
        <h4>🎯 AI Performance Recommendations</h4>
        <div className="recommendations-list">
          {predictions.recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <span className="rec-text">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="stats-card quick-actions">
        <h4>⚡ Optimize Performance</h4>
        <div className="action-buttons">
          <button className="action-btn primary">Start Recommended Session</button>
          <button className="action-btn secondary">View Detailed Analysis</button>
          <button className="action-btn secondary">Export Predictions</button>
        </div>
      </div>
    </div>
  );
};

export default PerformancePredictionEngine;
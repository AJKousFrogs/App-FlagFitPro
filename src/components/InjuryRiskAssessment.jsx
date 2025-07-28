import React, { useState, useEffect } from 'react';

const InjuryRiskAssessment = () => {
  const [riskData, setRiskData] = useState({
    overallRisk: 0,
    confidence: 0,
    riskFactors: [],
    bodyPartRisks: [],
    earlyWarnings: [],
    recommendations: [],
    riskTrend: [],
    injuryProbability: {}
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate comprehensive injury risk calculation
    const calculateInjuryRisk = () => {
      // Mock comprehensive risk assessment based on multiple factors
      const mockRiskData = {
        overallRisk: 34, // 0-100 scale (lower is better)
        confidence: 89,
        riskFactors: [
          { 
            factor: 'Training Load', 
            risk: 42, 
            status: 'moderate',
            description: 'Above optimal training volume this week',
            impact: 'high'
          },
          { 
            factor: 'Recovery Quality', 
            risk: 28, 
            status: 'low',
            description: 'Good sleep and wellness metrics',
            impact: 'medium'
          },
          { 
            factor: 'Pain Indicators', 
            risk: 35, 
            status: 'moderate',
            description: 'Minor hamstring tightness reported',
            impact: 'high'
          },
          { 
            factor: 'Movement Quality', 
            risk: 31, 
            status: 'low',
            description: 'Range of motion within normal limits',
            impact: 'medium'
          }
        ],
        bodyPartRisks: [
          { bodyPart: 'Hamstring', risk: 45, trend: 'increasing', lastInjury: '8 months ago' },
          { bodyPart: 'Ankle', risk: 22, trend: 'stable', lastInjury: 'Never' },
          { bodyPart: 'Knee', risk: 18, trend: 'decreasing', lastInjury: '2 years ago' },
          { bodyPart: 'Shoulder', risk: 35, trend: 'stable', lastInjury: '1 year ago' },
          { bodyPart: 'Lower Back', risk: 28, trend: 'decreasing', lastInjury: '6 months ago' }
        ],
        earlyWarnings: [
          {
            severity: 'medium',
            type: 'training_load',
            message: 'Training intensity increased 15% this week - monitor closely',
            action: 'Consider active recovery session tomorrow'
          },
          {
            severity: 'low', 
            type: 'muscle_tension',
            message: 'Hamstring tightness reported 3 days in a row',
            action: 'Increase stretching and foam rolling frequency'
          }
        ],
        recommendations: [
          '🎯 Reduce training intensity by 10-15% for next 3 days',
          '🧘‍♂️ Add 15-minute daily stretching routine focusing on hamstrings',
          '💤 Prioritize 8+ hours sleep - current recovery metrics show room for improvement',
          '🏃‍♂️ Replace one high-intensity session with active recovery this week',
          '📊 Schedule movement assessment to identify compensation patterns'
        ],
        riskTrend: [
          { week: 'W1', risk: 25 },
          { week: 'W2', risk: 28 },
          { week: 'W3', risk: 32 },
          { week: 'W4', risk: 34 },
          { week: 'W5', risk: 31, predicted: true }
        ],
        injuryProbability: {
          next7Days: 8.5,
          next14Days: 15.2,
          next30Days: 23.8
        }
      };
      
      setRiskData(mockRiskData);
      setLoading(false);
    };

    const timer = setTimeout(calculateInjuryRisk, 1800);
    return () => clearTimeout(timer);
  }, []);

  const getRiskColor = (risk) => {
    if (risk <= 25) return '#10b981'; // green - low risk
    if (risk <= 50) return '#f59e0b'; // yellow - moderate risk
    return '#ef4444'; // red - high risk
  };

  const getRiskLevel = (risk) => {
    if (risk <= 25) return 'Low';
    if (risk <= 50) return 'Moderate';
    return 'High';
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="stats-card">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>🔍 Analyzing injury risk patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="injury-risk-assessment">
      {/* Overall Risk Score */}
      <div className="stats-card risk-overview">
        <div className="risk-score-main">
          <div className="risk-score-container">
            <div 
              className="risk-score-circle"
              style={{ 
                background: `conic-gradient(${getRiskColor(riskData.overallRisk)} ${riskData.overallRisk}%, #f1f5f9 ${riskData.overallRisk}%)`
              }}
            >
              <div className="risk-score-inner">
                <div className="risk-score-value">{riskData.overallRisk}</div>
                <div className="risk-score-label">Risk Score</div>
              </div>
            </div>
            <div className="risk-interpretation">
              <div className="risk-level" style={{ color: getRiskColor(riskData.overallRisk) }}>
                {getRiskLevel(riskData.overallRisk)} Risk
              </div>
              <div className="risk-confidence">{riskData.confidence}% confidence</div>
            </div>
          </div>
        </div>
      </div>

      {/* Early Warning Alerts */}
      {riskData.earlyWarnings.length > 0 && (
        <div className="stats-card early-warnings">
          <h4>⚠️ Early Warning System</h4>
          <div className="warnings-list">
            {riskData.earlyWarnings.map((warning, index) => (
              <div key={index} className="warning-item">
                <div className="warning-header">
                  <div 
                    className="warning-indicator"
                    style={{ backgroundColor: getSeverityColor(warning.severity) }}
                  ></div>
                  <span className="warning-message">{warning.message}</span>
                </div>
                <div className="warning-action">→ {warning.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Factors Breakdown */}
      <div className="stats-card risk-factors">
        <h4>🔍 Risk Factor Analysis</h4>
        <div className="risk-factors-grid">
          {riskData.riskFactors.map((factor, index) => (
            <div key={index} className="risk-factor-item">
              <div className="factor-header">
                <span className="factor-name">{factor.factor}</span>
                <span 
                  className="factor-risk"
                  style={{ color: getRiskColor(factor.risk) }}
                >
                  {factor.risk}%
                </span>
              </div>
              <div className="factor-progress">
                <div 
                  className="factor-bar"
                  style={{ 
                    width: `${factor.risk}%`,
                    backgroundColor: getRiskColor(factor.risk)
                  }}
                ></div>
              </div>
              <div className="factor-description">{factor.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body Part Risk Assessment */}
      <div className="stats-card body-part-risks">
        <h4>🎯 Body Part Vulnerability</h4>
        <div className="body-parts-grid">
          {riskData.bodyPartRisks.map((part, index) => (
            <div key={index} className="body-part-item">
              <div className="body-part-header">
                <span className="body-part-name">{part.bodyPart}</span>
                <div className="body-part-trend">
                  {getTrendIcon(part.trend)}
                  <span style={{ color: getRiskColor(part.risk) }}>
                    {part.risk}%
                  </span>
                </div>
              </div>
              <div className="body-part-progress">
                <div 
                  className="body-part-bar"
                  style={{ 
                    width: `${part.risk}%`,
                    backgroundColor: getRiskColor(part.risk)
                  }}
                ></div>
              </div>
              <div className="body-part-history">
                Last injury: {part.lastInjury}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Injury Probability Forecast */}
      <div className="stats-card injury-probability">
        <h4>📊 Injury Probability Forecast</h4>
        <div className="probability-grid">
          <div className="probability-item">
            <div className="probability-timeframe">Next 7 Days</div>
            <div className="probability-value" style={{ color: getRiskColor(riskData.injuryProbability.next7Days * 4) }}>
              {riskData.injuryProbability.next7Days}%
            </div>
            <div className="probability-level">
              {getRiskLevel(riskData.injuryProbability.next7Days * 4)}
            </div>
          </div>
          <div className="probability-item">
            <div className="probability-timeframe">Next 14 Days</div>
            <div className="probability-value" style={{ color: getRiskColor(riskData.injuryProbability.next14Days * 2) }}>
              {riskData.injuryProbability.next14Days}%
            </div>
            <div className="probability-level">
              {getRiskLevel(riskData.injuryProbability.next14Days * 2)}
            </div>
          </div>
          <div className="probability-item">
            <div className="probability-timeframe">Next 30 Days</div>
            <div className="probability-value" style={{ color: getRiskColor(riskData.injuryProbability.next30Days * 2) }}>
              {riskData.injuryProbability.next30Days}%
            </div>
            <div className="probability-level">
              {getRiskLevel(riskData.injuryProbability.next30Days * 2)}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Trend Chart */}
      <div className="stats-card risk-trend">
        <h4>📈 Risk Trend Analysis</h4>
        <div className="trend-visualization">
          {riskData.riskTrend.map((point, index) => (
            <div key={index} className="trend-point">
              <div className="trend-week">{point.week}</div>
              <div 
                className={`trend-bar ${point.predicted ? 'predicted' : ''}`}
                style={{ 
                  height: `${point.risk * 2}px`,
                  backgroundColor: point.predicted ? '#28a745' : getRiskColor(point.risk)
                }}
              >
                <span className="trend-score">{point.risk}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="trend-legend">
          <span className="legend-item">
            <div className="legend-color historical"></div>
            Historical
          </span>
          <span className="legend-item">
            <div className="legend-color predicted-trend"></div>
            Predicted
          </span>
        </div>
      </div>

      {/* Prevention Recommendations */}
      <div className="stats-card prevention-recommendations">
        <h4>🛡️ Injury Prevention Recommendations</h4>
        <div className="recommendations-list">
          {riskData.recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <span className="rec-text">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="stats-card injury-actions">
        <h4>⚡ Take Action</h4>
        <div className="action-buttons">
          <button className="action-btn primary">Schedule Movement Assessment</button>
          <button className="action-btn secondary">Log Current Pain Levels</button>
          <button className="action-btn secondary">View Injury History</button>
          <button className="action-btn secondary">Export Risk Report</button>
        </div>
      </div>
    </div>
  );
};

export default InjuryRiskAssessment;
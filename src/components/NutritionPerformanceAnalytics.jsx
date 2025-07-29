import React, { useState, useEffect } from 'react';

const NutritionPerformanceAnalytics = () => {
  const [nutritionData, setNutritionData] = useState({
    dailyTargets: {},
    currentIntake: {},
    performanceCorrelations: [],
    mealTiming: {},
    nutritionScore: 0,
    recommendations: [],
    weeklyTrends: [],
    supplementAnalysis: {}
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate comprehensive nutrition-performance analysis
    const calculateNutritionAnalytics = () => {
      const mockNutritionData = {
        dailyTargets: {
          calories: 3200,
          protein: 145, // grams
          carbs: 400,   // grams
          fat: 107,     // grams
          hydration: 3.5 // liters
        },
        currentIntake: {
          calories: 2850,
          protein: 128,
          carbs: 385,
          fat: 98,
          hydration: 2.8
        },
        performanceCorrelations: [
          {
            nutrient: 'Pre-workout Carbs',
            correlation: 0.74,
            impact: 'Energy levels during training',
            recommendation: 'Increase by 15-20g, 60min before training'
          },
          {
            nutrient: 'Post-workout Protein',
            correlation: 0.68,
            impact: 'Recovery and muscle adaptation',
            recommendation: 'Current timing optimal, maintain 25-30g within 30min'
          },
          {
            nutrient: 'Daily Hydration',
            correlation: 0.82,
            impact: 'Overall performance and focus',
            recommendation: 'Add 700ml spread throughout day'
          },
          {
            nutrient: 'Sleep-time Magnesium',
            correlation: 0.45,
            impact: 'Sleep quality and muscle relaxation',
            recommendation: 'Consider 200mg supplement 1hr before bed'
          }
        ],
        mealTiming: {
          preWorkout: {
            optimal: '60-90 minutes before',
            current: '45 minutes before',
            score: 75,
            recommendations: ['Move meal 15min earlier', 'Add 10g carbs for energy']
          },
          postWorkout: {
            optimal: '30 minutes after',
            current: '25 minutes after',
            score: 92,
            recommendations: ['Excellent timing!', 'Consider adding tart cherry juice']
          },
          daily: {
            meals: 4,
            distribution: 'Good',
            score: 85,
            recommendations: ['Add mid-afternoon snack on training days']
          }
        },
        nutritionScore: 78,
        recommendations: [
          '💧 Increase daily water intake by 700ml - strong correlation with performance',
          '🥖 Add 15g carbs 60min pre-workout for sustained energy',
          '🥩 Excellent protein timing - maintain current schedule',
          '🍌 Consider potassium-rich foods for muscle function',
          '😴 Evening magnesium may improve sleep quality',
          '📊 Track micronutrient intake for 2 weeks to identify gaps'
        ],
        weeklyTrends: [
          { day: 'Mon', performance: 85, nutrition: 82, hydration: 75 },
          { day: 'Tue', performance: 88, nutrition: 85, hydration: 82 },
          { day: 'Wed', performance: 82, nutrition: 78, hydration: 70 },
          { day: 'Thu', performance: 91, nutrition: 88, hydration: 85 },
          { day: 'Fri', performance: 87, nutrition: 83, hydration: 80 },
          { day: 'Sat', performance: 93, nutrition: 90, hydration: 88 },
          { day: 'Sun', performance: 79, nutrition: 75, hydration: 72 }
        ],
        supplementAnalysis: {
          current: ['Whey Protein', 'Creatine', 'Multivitamin'],
          effectiveness: {
            'Whey Protein': { score: 9.2, evidence: 'Strong', timing: 'Optimal' },
            'Creatine': { score: 8.8, evidence: 'Strong', timing: 'Good' },
            'Multivitamin': { score: 6.5, evidence: 'Limited', timing: 'Adequate' }
          },
          suggestions: [
            'Beta-Alanine for anaerobic performance',
            'Omega-3 for recovery and inflammation',
            'Vitamin D3 - check blood levels first'
          ]
        }
      };
      
      setNutritionData(mockNutritionData);
      setLoading(false);
    };

    const timer = setTimeout(calculateNutritionAnalytics, 1600);
    return () => clearTimeout(timer);
  }, []);

  const getCompletionColor = (current, target) => {
    const percentage = (current / target) * 100;
    if (percentage >= 95) return '#10b981'; // green
    if (percentage >= 80) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getCompletionPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getCorrelationColor = (correlation) => {
    if (correlation >= 0.7) return '#10b981'; // strong positive
    if (correlation >= 0.4) return '#f59e0b'; // moderate
    if (correlation >= 0.2) return '#3b82f6'; // weak positive
    return '#6b7280'; // minimal
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="stats-card">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>🥗 Analyzing nutrition-performance correlations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nutrition-performance-analytics">
      {/* Overall Nutrition Score */}
      <div className="stats-card nutrition-overview">
        <div className="nutrition-score-main">
          <div className="nutrition-score-container">
            <div 
              className="nutrition-score-circle"
              style={{ 
                background: `conic-gradient(${getScoreColor(nutritionData.nutritionScore)} ${nutritionData.nutritionScore}%, #f1f5f9 ${nutritionData.nutritionScore}%)`
              }}
            >
              <div className="nutrition-score-inner">
                <div className="nutrition-score-value">{nutritionData.nutritionScore}</div>
                <div className="nutrition-score-label">Nutrition Score</div>
              </div>
            </div>
            <div className="nutrition-interpretation">
              <div className="nutrition-level" style={{ color: getScoreColor(nutritionData.nutritionScore) }}>
                {nutritionData.nutritionScore >= 85 ? 'Excellent' : nutritionData.nutritionScore >= 70 ? 'Good' : 'Needs Work'}
              </div>
              <div className="nutrition-subtitle">Performance-optimized nutrition</div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Macros Status */}
      <div className="stats-card daily-macros">
        <h4>📊 Daily Macronutrient Status</h4>
        <div className="macros-grid">
          {Object.entries(nutritionData.dailyTargets).map(([macro, target]) => {
            const current = nutritionData.currentIntake[macro];
            const percentage = getCompletionPercentage(current, target);
            const color = getCompletionColor(current, target);
            
            return (
              <div key={macro} className="macro-item">
                <div className="macro-header">
                  <span className="macro-name">{macro.charAt(0).toUpperCase() + macro.slice(1)}</span>
                  <span className="macro-values">
                    {current} / {target}
                    {macro === 'hydration' ? 'L' : macro === 'calories' ? '' : 'g'}
                  </span>
                </div>
                <div className="macro-progress">
                  <div 
                    className="macro-bar"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: color
                    }}
                  ></div>
                </div>
                <div className="macro-percentage" style={{ color }}>
                  {Math.round(percentage)}% complete
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Correlations */}
      <div className="stats-card performance-correlations">
        <h4>🔬 Nutrition-Performance Correlations</h4>
        <div className="correlations-list">
          {nutritionData.performanceCorrelations.map((item, index) => (
            <div key={index} className="correlation-item">
              <div className="correlation-header">
                <span className="correlation-nutrient">{item.nutrient}</span>
                <div className="correlation-strength">
                  <div 
                    className="correlation-indicator"
                    style={{ backgroundColor: getCorrelationColor(item.correlation) }}
                  ></div>
                  <span className="correlation-value">r = {item.correlation}</span>
                </div>
              </div>
              <div className="correlation-impact">{item.impact}</div>
              <div className="correlation-recommendation">→ {item.recommendation}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Meal Timing Analysis */}
      <div className="stats-card meal-timing">
        <h4>⏰ Meal Timing Optimization</h4>
        <div className="timing-grid">
          {Object.entries(nutritionData.mealTiming).map(([timing, data]) => (
            <div key={timing} className="timing-item">
              <div className="timing-header">
                <span className="timing-type">
                  {timing === 'preWorkout' ? 'Pre-Workout' : 
                   timing === 'postWorkout' ? 'Post-Workout' : 'Daily Pattern'}
                </span>
                <div 
                  className="timing-score"
                  style={{ color: getScoreColor(data.score) }}
                >
                  {data.score}%
                </div>
              </div>
              <div className="timing-details">
                {timing !== 'daily' && (
                  <>
                    <div className="timing-comparison">
                      <span>Optimal: {data.optimal}</span>
                      <span>Current: {data.current}</span>
                    </div>
                  </>
                )}
                {timing === 'daily' && (
                  <div className="daily-stats">
                    <span>{data.meals} meals/day</span>
                    <span>{data.distribution} distribution</span>
                  </div>
                )}
              </div>
              <div className="timing-recommendations">
                {data.recommendations.map((rec, idx) => (
                  <div key={idx} className="timing-rec">• {rec}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Performance Trends */}
      <div className="stats-card weekly-trends">
        <h4>📈 Weekly Nutrition-Performance Trends</h4>
        <div className="trends-chart">
          {nutritionData.weeklyTrends.map((day, index) => (
            <div key={index} className="trend-day">
              <div className="trend-day-label">{day.day}</div>
              <div className="trend-bars">
                <div className="trend-bar-container">
                  <div 
                    className="trend-bar performance"
                    style={{ height: `${day.performance}%` }}
                    title={`Performance: ${day.performance}%`}
                  ></div>
                  <div className="trend-bar-label">P</div>
                </div>
                <div className="trend-bar-container">
                  <div 
                    className="trend-bar nutrition"
                    style={{ height: `${day.nutrition}%` }}
                    title={`Nutrition: ${day.nutrition}%`}
                  ></div>
                  <div className="trend-bar-label">N</div>
                </div>
                <div className="trend-bar-container">
                  <div 
                    className="trend-bar hydration"
                    style={{ height: `${day.hydration}%` }}
                    title={`Hydration: ${day.hydration}%`}
                  ></div>
                  <div className="trend-bar-label">H</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="trends-legend">
          <span className="legend-item">
            <div className="legend-color performance-color"></div>
            Performance
          </span>
          <span className="legend-item">
            <div className="legend-color nutrition-color"></div>
            Nutrition
          </span>
          <span className="legend-item">
            <div className="legend-color hydration-color"></div>
            Hydration
          </span>
        </div>
      </div>

      {/* Supplement Analysis */}
      <div className="stats-card supplement-analysis">
        <h4>💊 Supplement Effectiveness Analysis</h4>
        <div className="supplements-current">
          <h5>Current Stack</h5>
          {nutritionData.supplementAnalysis.current.map((supplement, index) => {
            const effectiveness = nutritionData.supplementAnalysis.effectiveness[supplement];
            return (
              <div key={index} className="supplement-item">
                <div className="supplement-header">
                  <span className="supplement-name">{supplement}</span>
                  <span 
                    className="supplement-score"
                    style={{ color: getScoreColor(effectiveness.score * 10) }}
                  >
                    {effectiveness.score}/10
                  </span>
                </div>
                <div className="supplement-details">
                  <span>Evidence: {effectiveness.evidence}</span>
                  <span>Timing: {effectiveness.timing}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="supplements-suggestions">
          <h5>Suggested Additions</h5>
          {nutritionData.supplementAnalysis.suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item">
              • {suggestion}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="stats-card nutrition-recommendations">
        <h4>🎯 Personalized Recommendations</h4>
        <div className="recommendations-list">
          {nutritionData.recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <span className="rec-text">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="stats-card nutrition-actions">
        <h4>⚡ Take Action</h4>
        <div className="action-buttons">
          <button className="action-btn primary">Log Today's Meals</button>
          <button className="action-btn secondary">Generate Meal Plan</button>
          <button className="action-btn secondary">Track Hydration</button>
          <button className="action-btn secondary">Export Nutrition Report</button>
        </div>
      </div>
    </div>
  );
};

export default NutritionPerformanceAnalytics;
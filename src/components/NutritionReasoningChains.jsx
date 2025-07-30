import React, { useState, useEffect } from 'react';
import { sequentialThoughtService } from '../services/SequentialThoughtService';
import { mcpService } from '../services/MCPService';

const NutritionReasoningChains = ({ 
  userId, 
  initialGoals = [], 
  onRecommendationsReady = () => {},
  showInterface = true 
}) => {
  const [nutritionData, setNutritionData] = useState({
    goals: initialGoals,
    currentIntake: {},
    trainingSchedule: {},
    preferences: {},
    restrictions: []
  });
  
  const [reasoning, setReasoning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeChain, setActiveChain] = useState('assessment');
  const [chainHistory, setChainHistory] = useState([]);

  const reasoningChains = {
    'assessment': {
      name: 'Nutrition Assessment',
      icon: '📊',
      description: 'Analyze current nutrition status and identify areas for improvement',
      focus: 'current intake analysis'
    },
    'meal-timing': {
      name: 'Meal Timing Optimization',
      icon: '⏰',
      description: 'Optimize meal timing around training sessions for peak performance',
      focus: 'temporal nutrition strategy'
    },
    'performance-nutrition': {
      name: 'Performance Enhancement',
      icon: '⚡',
      description: 'Design nutrition plan to maximize athletic performance',
      focus: 'performance optimization'
    },
    'recovery-nutrition': {
      name: 'Recovery Optimization',
      icon: '🔄',
      description: 'Focus on post-training nutrition for optimal recovery',
      focus: 'recovery enhancement'
    },
    'body-composition': {
      name: 'Body Composition Goals',
      icon: '⚖️',
      description: 'Nutrition strategy for body composition changes',
      focus: 'physique goals'
    },
    'hydration-strategy': {
      name: 'Hydration Planning',
      icon: '💧',
      description: 'Develop comprehensive hydration strategy',
      focus: 'fluid balance optimization'
    }
  };

  useEffect(() => {
    if (userId) {
      loadUserNutritionData();
    }
  }, [userId]);

  const loadUserNutritionData = async () => {
    try {
      // In a real app, this would fetch from your database
      const mockUserData = {
        goals: ['improve performance', 'maintain weight', 'increase energy'],
        currentIntake: {
          calories: 2200,
          protein: 120,
          carbs: 280,
          fat: 75,
          fiber: 25,
          water: 2.5
        },
        trainingSchedule: {
          sessionsPerWeek: 4,
          sessionDuration: 90,
          intensityLevel: 7,
          trainingTimes: ['morning', 'evening']
        },
        preferences: {
          dietType: 'omnivore',
          mealFrequency: 4,
          cookingTime: 'moderate',
          budget: 'moderate'
        },
        restrictions: []
      };
      
      setNutritionData(mockUserData);
    } catch (error) {
      console.error('Error loading user nutrition data:', error);
    }
  };

  const executeReasoningChain = async (chainType) => {
    setLoading(true);
    setActiveChain(chainType);

    try {
      console.log(`🧠 Executing ${reasoningChains[chainType].name} reasoning chain...`);

      // Prepare enhanced data with Context7 research if available
      const enhancedData = await enhanceWithNutritionResearch(nutritionData, chainType);
      
      const result = await sequentialThoughtService.performReasoning(
        'nutrition-planning',
        {
          ...enhancedData,
          focusArea: chainType,
          chainContext: reasoningChains[chainType].focus
        },
        { 
          includeAlternatives: true,
          depth: 3 
        }
      );

      // Post-process results for nutrition-specific insights
      const processedResult = await postProcessNutritionReasoning(result, chainType);
      
      setReasoning(processedResult);
      
      // Add to chain history
      setChainHistory(prev => [...prev, {
        chainType,
        timestamp: new Date().toISOString(),
        result: processedResult
      }]);

      onRecommendationsReady(processedResult);

    } catch (error) {
      console.error('Nutrition reasoning error:', error);
      setReasoning({
        error: error.message,
        chainType,
        fallback: true,
        recommendations: await getFallbackNutritionRecommendations(chainType)
      });
    } finally {
      setLoading(false);
    }
  };

  const enhanceWithNutritionResearch = async (data, chainType) => {
    let researchData = {};
    
    if (mcpService.getConnectionStatus().servers.context7) {
      try {
        const researchTopics = {
          'assessment': 'nutrition assessment methods',
          'meal-timing': 'nutrient timing performance',
          'performance-nutrition': 'sports nutrition performance',
          'recovery-nutrition': 'post exercise nutrition',
          'body-composition': 'nutrition body composition',
          'hydration-strategy': 'hydration athletic performance'
        };
        
        const research = await mcpService.searchSportsScience(
          researchTopics[chainType], 
          'nutrition'
        );
        
        researchData = {
          evidenceBase: research.research || [],
          recommendations: research.recommendations || [],
          currentGuidelines: research.summary || ''
        };
      } catch (error) {
        console.warn('Could not fetch nutrition research:', error.message);
      }
    }

    return { ...data, researchData };
  };

  const postProcessNutritionReasoning = async (result, chainType) => {
    // Add nutrition-specific calculations and insights
    const processed = { ...result };
    
    processed.nutritionMetrics = calculateNutritionMetrics(result, chainType);
    processed.mealPlan = generateMealPlanSuggestions(result, chainType);
    processed.supplementRecommendations = generateSupplementGuidance(result);
    processed.monitoringPlan = createMonitoringPlan(result, chainType);
    
    return processed;
  };

  const calculateNutritionMetrics = (result, chainType) => {
    const baseMetrics = nutritionData.currentIntake;
    
    return {
      targetCalories: Math.round(baseMetrics.calories * 1.1),
      proteinTarget: Math.round(baseMetrics.protein * 1.2),
      carbTarget: Math.round(baseMetrics.carbs * 1.15),
      fatTarget: Math.round(baseMetrics.fat * 0.95),
      hydrationTarget: baseMetrics.water + 0.5,
      mealTiming: generateOptimalTiming(chainType)
    };
  };

  const generateOptimalTiming = (chainType) => {
    const timingMap = {
      'meal-timing': {
        preWorkout: '2-3 hours before',
        postWorkout: '30-60 minutes after',
        mainMeals: ['7:00 AM', '12:00 PM', '6:00 PM'],
        snacks: ['10:00 AM', '3:00 PM', '9:00 PM']
      },
      'performance-nutrition': {
        preWorkout: '1-2 hours before',
        postWorkout: '15-30 minutes after', 
        carbohydrate: 'Around training sessions',
        protein: 'Every 3-4 hours'
      },
      'recovery-nutrition': {
        postWorkout: 'Within 2 hours',
        evening: 'Focus on dinner',
        morning: 'Protein-rich breakfast',
        sleep: 'Light snack if needed'
      }
    };
    
    return timingMap[chainType] || timingMap['meal-timing'];
  };

  const generateMealPlanSuggestions = (result, chainType) => {
    const mealTypes = {
      'performance-nutrition': [
        { meal: 'Pre-workout', foods: ['Banana', 'Oatmeal', 'Coffee'], timing: '1-2h before' },
        { meal: 'Post-workout', foods: ['Protein shake', 'Chocolate milk'], timing: '30min after' },
        { meal: 'Dinner', foods: ['Lean protein', 'Complex carbs', 'Vegetables'], timing: 'Evening' }
      ],
      'recovery-nutrition': [
        { meal: 'Recovery shake', foods: ['Whey protein', 'Banana', 'Berries'], timing: 'Post-workout' },
        { meal: 'Recovery meal', foods: ['Salmon', 'Sweet potato', 'Spinach'], timing: '2h post-workout' },
        { meal: 'Evening', foods: ['Greek yogurt', 'Nuts', 'Tart cherries'], timing: 'Before bed' }
      ],
      'body-composition': [
        { meal: 'Breakfast', foods: ['Eggs', 'Vegetables', 'Avocado'], timing: 'Morning' },
        { meal: 'Lunch', foods: ['Lean protein', 'Quinoa', 'Mixed greens'], timing: 'Midday' },
        { meal: 'Dinner', foods: ['Fish', 'Vegetables', 'Small portion carbs'], timing: 'Evening' }
      ]
    };

    return mealTypes[chainType] || mealTypes['performance-nutrition'];
  };

  const generateSupplementGuidance = (result) => {
    return [
      { supplement: 'Whey Protein', timing: 'Post-workout', rationale: 'Muscle protein synthesis' },
      { supplement: 'Creatine', timing: 'Daily', rationale: 'Power and strength support' },
      { supplement: 'Vitamin D', timing: 'Morning', rationale: 'Bone health and immunity' },
      { supplement: 'Omega-3', timing: 'With meals', rationale: 'Anti-inflammatory support' }
    ];
  };

  const createMonitoringPlan = (result, chainType) => {
    return {
      daily: ['Energy levels', 'Hydration status', 'Meal timing'],
      weekly: ['Body weight', 'Performance metrics', 'Sleep quality'],
      monthly: ['Body composition', 'Nutrition plan review', 'Goal reassessment'],
      adjustmentTriggers: [
        'Consistent low energy',
        'Poor recovery between sessions',
        'Plateau in performance',
        'Changes in training load'
      ]
    };
  };

  const getFallbackNutritionRecommendations = async (chainType) => {
    const fallbackMap = {
      'assessment': [
        'Track food intake for 3-7 days',
        'Focus on whole, minimally processed foods',
        'Ensure adequate protein at each meal',
        'Stay consistently hydrated throughout the day'
      ],
      'meal-timing': [
        'Eat a balanced meal 2-3 hours before training',
        'Consume protein and carbs within 2 hours post-workout',
        'Space meals 3-4 hours apart',
        'Include a small snack if hungry between meals'
      ],
      'performance-nutrition': [
        'Prioritize carbohydrates around training sessions',
        'Aim for 1.6-2.2g protein per kg body weight',
        'Include healthy fats in each meal',
        'Time caffeine 30-45 minutes before training'
      ]
    };

    return {
      recommendations: fallbackMap[chainType] || fallbackMap['assessment'],
      confidence: 0.7,
      source: 'established nutrition guidelines'
    };
  };

  const renderReasoningVisualization = () => {
    if (!reasoning || reasoning.error) return null;

    return (
      <div className="reasoning-visualization">
        <div className="chain-header">
          <div className="chain-info">
            <span className="chain-icon">{reasoningChains[activeChain].icon}</span>
            <div>
              <h3>{reasoningChains[activeChain].name}</h3>
              <p>{reasoningChains[activeChain].description}</p>
            </div>
          </div>
          <div className="confidence-badge">
            <span>Confidence: {Math.round(reasoning.confidence * 100)}%</span>
          </div>
        </div>

        {/* Reasoning Steps Flow */}
        {reasoning.reasoning?.steps && (
          <div className="reasoning-flow">
            <h4>🧠 Reasoning Process</h4>
            <div className="flow-steps">
              {reasoning.reasoning.steps.map((step, index) => (
                <div key={index} className="flow-step">
                  <div className="step-connector">
                    {index < reasoning.reasoning.steps.length - 1 && <div className="connector-line" />}
                  </div>
                  <div className="step-content">
                    <div className="step-header">
                      <span className="step-number">{index + 1}</span>
                      <h5>{step.step.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h5>
                    </div>
                    <p className="step-analysis">{step.analysis}</p>
                    <div className="step-findings">
                      {step.findings.slice(0, 2).map((finding, idx) => (
                        <div key={idx} className="finding-item">
                          <span className="finding-bullet">•</span>
                          <span>{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nutrition Metrics */}
        {reasoning.nutritionMetrics && (
          <div className="nutrition-metrics">
            <h4>🎯 Target Metrics</h4>
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-value">{reasoning.nutritionMetrics.targetCalories}</span>
                <span className="metric-label">Calories/day</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{reasoning.nutritionMetrics.proteinTarget}g</span>
                <span className="metric-label">Protein</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{reasoning.nutritionMetrics.carbTarget}g</span>
                <span className="metric-label">Carbs</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{reasoning.nutritionMetrics.hydrationTarget}L</span>
                <span className="metric-label">Water</span>
              </div>
            </div>
          </div>
        )}

        {/* Meal Plan Suggestions */}
        {reasoning.mealPlan && (
          <div className="meal-plan-section">
            <h4>🍽️ Meal Plan Suggestions</h4>
            <div className="meal-plan-cards">
              {reasoning.mealPlan.map((meal, index) => (
                <div key={index} className="meal-card">
                  <div className="meal-header">
                    <h5>{meal.meal}</h5>
                    <span className="meal-timing">{meal.timing}</span>
                  </div>
                  <div className="meal-foods">
                    {meal.foods.map((food, idx) => (
                      <span key={idx} className="food-tag">{food}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Recommendations */}
        <div className="recommendations-section">
          <h4>💡 Key Recommendations</h4>
          <div className="recommendations-list">
            {reasoning.recommendations.slice(0, 4).map((rec, index) => (
              <div key={index} className="recommendation-item">
                <span className="rec-number">{index + 1}</span>
                <span className="rec-text">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monitoring Plan */}
        {reasoning.monitoringPlan && (
          <div className="monitoring-section">
            <h4>📊 Monitoring Plan</h4>
            <div className="monitoring-timeline">
              <div className="timeline-item">
                <h5>Daily Tracking</h5>
                <div className="tracking-items">
                  {reasoning.monitoringPlan.daily.map((item, idx) => (
                    <span key={idx} className="tracking-tag">{item}</span>
                  ))}
                </div>
              </div>
              <div className="timeline-item">
                <h5>Weekly Assessment</h5>
                <div className="tracking-items">
                  {reasoning.monitoringPlan.weekly.map((item, idx) => (
                    <span key={idx} className="tracking-tag">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!showInterface) {
    return null;
  }

  return (
    <div className="nutrition-reasoning-chains">
      <div className="chains-header">
        <h2>🧠 Nutrition Reasoning Chains</h2>
        <p>Use AI-powered reasoning to optimize your nutrition strategy</p>
      </div>

      {/* Chain Selection */}
      <div className="chain-selection">
        <h3>Select Reasoning Focus</h3>
        <div className="chain-grid">
          {Object.entries(reasoningChains).map(([key, chain]) => (
            <button
              key={key}
              onClick={() => executeReasoningChain(key)}
              disabled={loading}
              className={`chain-button ${activeChain === key ? 'active' : ''}`}
            >
              <span className="chain-icon">{chain.icon}</span>
              <div className="chain-info">
                <h4>{chain.name}</h4>
                <p>{chain.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Analyzing nutrition data with sequential reasoning...</p>
        </div>
      )}

      {/* Results */}
      {reasoning && !loading && (
        <div className="reasoning-results">
          {reasoning.error ? (
            <div className="error-result">
              <h3>⚠️ Analysis Error</h3>
              <p>{reasoning.error}</p>
              {reasoning.fallback && (
                <div className="fallback-recommendations">
                  <h4>Fallback Recommendations:</h4>
                  <ul>
                    {reasoning.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            renderReasoningVisualization()
          )}
        </div>
      )}

      {/* Chain History */}
      {chainHistory.length > 0 && (
        <div className="chain-history">
          <h3>📚 Reasoning History</h3>
          <div className="history-items">
            {chainHistory.slice(-3).map((item, index) => (
              <div key={index} className="history-item">
                <span className="history-icon">{reasoningChains[item.chainType].icon}</span>
                <div className="history-content">
                  <h4>{reasoningChains[item.chainType].name}</h4>
                  <p>{new Date(item.timestamp).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setReasoning(item.result)}
                  className="view-button"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .nutrition-reasoning-chains {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }

        .chains-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .chains-header h2 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 2rem;
        }

        .chains-header p {
          color: #6b7280;
          font-size: 1.1rem;
        }

        .chain-selection h3 {
          margin: 0 0 20px 0;
          color: #374151;
        }

        .chain-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }

        .chain-button {
          display: flex;
          align-items: flex-start;
          padding: 20px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .chain-button:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .chain-button.active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .chain-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .chain-button .chain-icon {
          font-size: 24px;
          margin-right: 16px;
          margin-top: 4px;
        }

        .chain-button .chain-info h4 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 1.1rem;
        }

        .chain-button .chain-info p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .loading-state {
          text-align: center;
          padding: 60px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .reasoning-results {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          margin-bottom: 40px;
        }

        .chain-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f3f4f6;
        }

        .chain-header .chain-info {
          display: flex;
          align-items: flex-start;
        }

        .chain-header .chain-icon {
          font-size: 32px;
          margin-right: 16px;
        }

        .chain-header h3 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 1.5rem;
        }

        .chain-header p {
          margin: 0;
          color: #6b7280;
        }

        .confidence-badge {
          background: #eff6ff;
          color: #1d4ed8;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .reasoning-flow {
          margin-bottom: 30px;
        }

        .reasoning-flow h4 {
          margin: 0 0 20px 0;
          color: #1f2937;
        }

        .flow-steps {
          position: relative;
        }

        .flow-step {
          display: flex;
          margin-bottom: 24px;
        }

        .step-connector {
          position: relative;
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .connector-line {
          position: absolute;
          top: 40px;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 60px;
          background: #e5e7eb;
        }

        .step-content {
          flex: 1;
        }

        .step-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .step-number {
          width: 32px;
          height: 32px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 12px;
          font-size: 14px;
        }

        .step-header h5 {
          margin: 0;
          color: #1f2937;
        }

        .step-analysis {
          color: #4b5563;
          margin-bottom: 12px;
          font-size: 0.9rem;
        }

        .step-findings {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .finding-item {
          display: flex;
          align-items: flex-start;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .finding-bullet {
          color: #3b82f6;
          margin-right: 8px;
          margin-top: 2px;
        }

        .nutrition-metrics {
          margin-bottom: 30px;
        }

        .nutrition-metrics h4 {
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
        }

        .metric-card {
          text-align: center;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .metric-value {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 4px;
        }

        .metric-label {
          font-size: 0.8rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .meal-plan-section {
          margin-bottom: 30px;
        }

        .meal-plan-section h4 {
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .meal-plan-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .meal-card {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          border-left: 4px solid #10b981;
        }

        .meal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .meal-header h5 {
          margin: 0;
          color: #1f2937;
        }

        .meal-timing {
          font-size: 0.8rem;
          color: #6b7280;
          background: white;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .meal-foods {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .food-tag {
          background: #e0f2fe;
          color: #0369a1;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .recommendations-section {
          margin-bottom: 30px;
        }

        .recommendations-section h4 {
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation-item {
          display: flex;
          align-items: flex-start;
          padding: 12px;
          background: #f0f9ff;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }

        .rec-number {
          width: 24px;
          height: 24px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .rec-text {
          color: #1f2937;
          line-height: 1.5;
        }

        .monitoring-section {
          margin-bottom: 30px;
        }

        .monitoring-section h4 {
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .timeline-item {
          margin-bottom: 20px;
        }

        .timeline-item h5 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 1rem;
        }

        .tracking-items {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tracking-tag {
          background: #f3f4f6;
          color: #374151;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 0.8rem;
          border: 1px solid #d1d5db;
        }

        .chain-history {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .chain-history h3 {
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .history-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .history-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .history-icon {
          font-size: 20px;
          margin-right: 12px;
        }

        .history-content {
          flex: 1;
        }

        .history-content h4 {
          margin: 0 0 4px 0;
          color: #1f2937;
          font-size: 0.9rem;
        }

        .history-content p {
          margin: 0;
          color: #6b7280;
          font-size: 0.8rem;
        }

        .view-button {
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .view-button:hover {
          background: #2563eb;
        }

        .error-result {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 20px;
        }

        .error-result h3 {
          color: #dc2626;
          margin: 0 0 12px 0;
        }

        .fallback-recommendations {
          margin-top: 16px;
        }

        .fallback-recommendations h4 {
          color: #374151;
          margin: 0 0 8px 0;
        }

        .fallback-recommendations ul {
          margin: 0;
          padding-left: 20px;
        }

        .fallback-recommendations li {
          margin-bottom: 4px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .nutrition-reasoning-chains {
            padding: 16px;
          }

          .chain-grid {
            grid-template-columns: 1fr;
          }

          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .meal-plan-cards {
            grid-template-columns: 1fr;
          }

          .chain-header {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default NutritionReasoningChains;
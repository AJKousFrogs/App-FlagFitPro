import React, { useState, useEffect, useCallback } from 'react';
import { useNeonDatabase } from '../contexts/NeonDatabaseContext';
import { useTraining } from '../contexts/TrainingContext';

const WeightManagement = ({ playerId, position }) => {
  const { db } = useNeonDatabase();
  const { updateTrainingMetrics } = useTraining();
  
  // Weight management states
  const [currentWeight, setCurrentWeight] = useState(185.2);
  const [weightHistory, setWeightHistory] = useState([]);
  const [targetRange, setTargetRange] = useState({ min: 182, max: 188 });
  const [performanceImpact, setPerformanceImpact] = useState({});
  const [xiaomiConnected, setXiaomiConnected] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [weightTrend, setWeightTrend] = useState('stable');

  // Position-specific weight targets
  const positionTargets = {
    QB: { min: 180, max: 190, optimal: 185 },
    WR: { min: 170, max: 185, optimal: 178 },
    RB: { min: 180, max: 200, optimal: 190 },
    DB: { min: 170, max: 185, optimal: 178 },
    LB: { min: 190, max: 210, optimal: 200 }
  };

  // Generate mock weight history data
  const generateWeightHistory = useCallback(() => {
    const history = [];
    const baseWeight = 185.2;
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate realistic weight fluctuations
      const fluctuation = (Math.random() - 0.5) * 2; // ±1 lb daily variation
      const trend = Math.sin(i / 7) * 0.5; // Weekly trend
      const weight = baseWeight + fluctuation + trend;
      
      history.push({
        date: date.toISOString().split('T')[0],
        weight: Math.round(weight * 10) / 10,
        hydration: Math.random() > 0.3, // 70% chance of proper hydration
        trainingDay: i % 3 === 0 // Every 3rd day is training
      });
    }
    
    return history;
  }, []);

  // Calculate performance impact based on weight
  const calculatePerformanceImpact = useCallback((weight) => {
    const optimal = positionTargets[position]?.optimal || 185;
    const deviation = Math.abs(weight - optimal);
    const maxDeviation = 10; // 10 lbs deviation = max impact
    
    const impact = Math.max(0, (maxDeviation - deviation) / maxDeviation);
    
    return {
      speed: Math.round((0.8 + impact * 0.2) * 100) / 100,
      agility: Math.round((0.75 + impact * 0.25) * 100) / 100,
      endurance: Math.round((0.85 + impact * 0.15) * 100) / 100,
      strength: Math.round((0.9 + impact * 0.1) * 100) / 100
    };
  }, [position]);

  // Connect to Xiaomi scale
  const connectXiaomiScale = useCallback(async () => {
    try {
      // Simulate Xiaomi API connection
      console.log('Connecting to Xiaomi scale...');
      
      // Mock connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setXiaomiConnected(true);
      
      // Simulate receiving weight data
      const newWeight = 185.2 + (Math.random() - 0.5) * 0.5;
      setCurrentWeight(Math.round(newWeight * 10) / 10);
      
      // Update database
      if (db) {
        await db.execute(`
          INSERT INTO weight_measurements (player_id, weight, measured_at, source)
          VALUES ($1, $2, NOW(), 'xiaomi_scale')
        `, [playerId, newWeight]);
      }
      
      console.log('Xiaomi scale connected successfully');
    } catch (error) {
      console.error('Failed to connect to Xiaomi scale:', error);
    }
  }, [db, playerId]);

  // Share data for research
  const shareDataForResearch = useCallback(async () => {
    if (!researchConsent) {
      alert('Please provide consent for data sharing first');
      return;
    }
    
    try {
      // Prepare anonymized data for research
      const researchData = {
        position: position,
        weightHistory: weightHistory.map(entry => ({
          weight: entry.weight,
          trainingDay: entry.trainingDay,
          hydration: entry.hydration
        })),
        performanceImpact: performanceImpact,
        timestamp: new Date().toISOString()
      };
      
      // Simulate sending to research database
      console.log('Sharing anonymized data for research:', researchData);
      
      // Update training metrics
      updateTrainingMetrics({
        weightManagement: {
          dataShared: true,
          sharedAt: new Date().toISOString()
        }
      });
      
      alert('Data shared successfully for research purposes');
    } catch (error) {
      console.error('Failed to share data:', error);
    }
  }, [researchConsent, weightHistory, performanceImpact, position, updateTrainingMetrics]);

  // Get training recommendations based on weight
  const getWeightTrainingRecommendations = useCallback(() => {
    const recommendations = [];
    
    if (currentWeight > targetRange.max) {
      recommendations.push('Focus on HIIT for fat loss while maintaining muscle');
      recommendations.push('Increase cardio sessions to 4-5 times per week');
      recommendations.push('Monitor caloric intake and maintain protein levels');
    } else if (currentWeight < targetRange.min) {
      recommendations.push('Increase strength training to build muscle mass');
      recommendations.push('Focus on compound movements and progressive overload');
      recommendations.push('Ensure adequate caloric surplus for muscle growth');
    } else {
      recommendations.push('Maintain current weight with balanced training');
      recommendations.push('Continue current nutrition and exercise routine');
      recommendations.push('Monitor hydration levels during training sessions');
    }
    
    return recommendations;
  }, [currentWeight, targetRange]);

  // Initialize component
  useEffect(() => {
    const history = generateWeightHistory();
    setWeightHistory(history);
    
    // Set target range based on position
    const targets = positionTargets[position];
    if (targets) {
      setTargetRange({ min: targets.min, max: targets.max });
    }
    
    // Calculate initial performance impact
    const impact = calculatePerformanceImpact(currentWeight);
    setPerformanceImpact(impact);
    
    // Determine weight trend
    const recentWeights = history.slice(-7).map(h => h.weight);
    const trend = recentWeights[recentWeights.length - 1] - recentWeights[0];
    setWeightTrend(trend > 0.5 ? 'increasing' : trend < -0.5 ? 'decreasing' : 'stable');
  }, [generateWeightHistory, position, currentWeight, calculatePerformanceImpact]);

  // Update performance impact when weight changes
  useEffect(() => {
    const impact = calculatePerformanceImpact(currentWeight);
    setPerformanceImpact(impact);
  }, [currentWeight, calculatePerformanceImpact]);

  return (
    <div className="weight-management bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          ⚖️ Weight Management & Performance
        </h3>
        <div className="flex items-center space-x-2">
          {xiaomiConnected ? (
            <span className="text-green-600 text-sm">✓ Xiaomi Connected</span>
          ) : (
            <button
              onClick={connectXiaomiScale}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Connect Xiaomi Scale
            </button>
          )}
        </div>
      </div>

      {/* Current Weight Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {currentWeight} lbs
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Target Range: {targetRange.min}-{targetRange.max} lbs (Optimal for {position})
          </div>
          <div className="text-sm text-gray-600">
            Trend: {weightTrend === 'increasing' ? '↗️' : weightTrend === 'decreasing' ? '↘️' : '→'} {weightTrend}
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
          <div className="text-lg font-semibold text-gray-800 mb-2">
            Performance Impact
          </div>
          <div className="space-y-1 text-sm">
            <div>Speed: {performanceImpact.speed * 100}%</div>
            <div>Agility: {performanceImpact.agility * 100}%</div>
            <div>Endurance: {performanceImpact.endurance * 100}%</div>
            <div>Strength: {performanceImpact.strength * 100}%</div>
          </div>
        </div>
      </div>

      {/* Weight History Chart */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">
          📊 Weight History (Last 30 Days)
        </h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="h-32 flex items-end justify-between space-x-1">
            {weightHistory.slice(-7).map((entry, index) => {
              const maxWeight = Math.max(...weightHistory.map(h => h.weight));
              const minWeight = Math.min(...weightHistory.map(h => h.weight));
              const height = ((entry.weight - minWeight) / (maxWeight - minWeight)) * 100;
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-blue-500 rounded-t w-8"
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-1">
                    {entry.weight}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Training Recommendations */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">
          🏋️ Training Recommendations
        </h4>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <ul className="space-y-2 text-sm">
            {getWeightTrainingRecommendations().map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Research Data Sharing */}
      <div className="border-t pt-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">
          🔬 Research Data Sharing
        </h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="research-consent"
              checked={researchConsent}
              onChange={(e) => setResearchConsent(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="research-consent" className="text-sm text-gray-700">
              I consent to share anonymized weight and performance data for sports research
            </label>
          </div>
          
          <button
            onClick={shareDataForResearch}
            disabled={!researchConsent}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Share Data for Research
          </button>
          
          <p className="text-xs text-gray-500">
            Your data will be anonymized and used for sports performance research. 
            No personal identification will be shared.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeightManagement; 
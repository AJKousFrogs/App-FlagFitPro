import React, { useState, useEffect, useCallback } from 'react';
import { useNeonDatabase } from '../contexts/NeonDatabaseContext';
import { useTraining } from '../contexts/TrainingContext';

const EnhancedBiometricIntegration = ({ onRecommendation, teamId, playerId }) => {
  const { db } = useNeonDatabase();
  const { updateTrainingMetrics } = useTraining();
  
  // Enhanced biometric states
  const [heartRate, setHeartRate] = useState(0);
  const [heartRateVariability, setHeartRateVariability] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [sleepScore, setSleepScore] = useState(0);
  const [sleepQuality, setSleepQuality] = useState({
    deepSleep: 0,
    remSleep: 0,
    lightSleep: 0,
    awakeTime: 0,
    sleepEfficiency: 0
  });
  const [recoveryScore, setRecoveryScore] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [sleepChemistryCorrelation, setSleepChemistryCorrelation] = useState({});
  const [nutritionEffectiveness, setNutritionEffectiveness] = useState({});
  const [weightFluctuation, setWeightFluctuation] = useState({
    current: 185.2,
    trend: 'stable',
    weeklyChange: 0,
    monthlyChange: 0
  });

  // Simulate enhanced biometric data
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate heart rate (60-180 BPM)
      setHeartRate(Math.floor(Math.random() * 120) + 60);
      
      // Simulate heart rate variability (20-100 ms)
      setHeartRateVariability(Math.floor(Math.random() * 80) + 20);
      
      // Simulate sleep score (0-100)
      const newSleepScore = Math.floor(Math.random() * 30) + 70;
      setSleepScore(newSleepScore);
      
      // Simulate detailed sleep quality
      setSleepQuality({
        deepSleep: Math.floor(Math.random() * 30) + 60, // 60-90 minutes
        remSleep: Math.floor(Math.random() * 40) + 80, // 80-120 minutes
        lightSleep: Math.floor(Math.random() * 60) + 120, // 120-180 minutes
        awakeTime: Math.floor(Math.random() * 20) + 10, // 10-30 minutes
        sleepEfficiency: Math.floor(Math.random() * 20) + 80 // 80-100%
      });
      
      // Simulate recovery score (0-100)
      setRecoveryScore(Math.floor(Math.random() * 40) + 60);
      
      // Simulate weight fluctuations
      const baseWeight = 185.2;
      const fluctuation = (Math.random() - 0.5) * 2; // ±1 lb daily variation
      const newWeight = baseWeight + fluctuation;
      setWeightFluctuation({
        current: Math.round(newWeight * 10) / 10,
        trend: fluctuation > 0.5 ? 'increasing' : fluctuation < -0.5 ? 'decreasing' : 'stable',
        weeklyChange: Math.round((Math.random() - 0.5) * 3 * 10) / 10,
        monthlyChange: Math.round((Math.random() - 0.5) * 5 * 10) / 10
      });
      
      setIsConnected(true);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Analyze sleep quality correlation with team chemistry
  const analyzeSleepChemistryCorrelation = useCallback((sleepData, chemistryData) => {
    const correlations = {};
    
    // Simulate sleep-chemistry correlation analysis
    Object.entries(chemistryData).forEach(([pairId, chemistry]) => {
      const [player1Id, player2Id] = pairId.split('-');
      
      // Calculate correlation between sleep quality and chemistry
      const sleepQualityImpact = sleepData.sleepEfficiency / 100;
      const chemistryImpact = sleepQualityImpact * 0.3; // 30% impact factor
      
      correlations[pairId] = {
        sleepCorrelation: Math.round(sleepQualityImpact * 100) / 100,
        chemistryImpact: Math.round(chemistryImpact * 100) / 100,
        recommendation: getSleepChemistryRecommendation(sleepQualityImpact)
      };
    });
    
    return correlations;
  }, []);

  // Analyze nutrition timing effectiveness based on biometric feedback
  const analyzeNutritionEffectiveness = useCallback((nutritionData, biometricData) => {
    const effectiveness = {};
    
    // Simulate nutrition effectiveness analysis
    const timingScore = calculateNutritionTiming(nutritionData.timing, biometricData.heartRate);
    const hydrationScore = calculateHydrationEffectiveness(nutritionData.hydration, biometricData.recovery);
    const energyScore = calculateEnergyMaintenance(nutritionData.intake, biometricData.performance);
    
    const overallEffectiveness = (timingScore + hydrationScore + energyScore) / 3;
    
    effectiveness.current = {
      timingScore: Math.round(timingScore * 100) / 100,
      hydrationScore: Math.round(hydrationScore * 100) / 100,
      energyScore: Math.round(energyScore * 100) / 100,
      overallEffectiveness: Math.round(overallEffectiveness * 100) / 100,
      recommendations: generateNutritionRecommendations(timingScore, hydrationScore, energyScore)
    };
    
    return effectiveness;
  }, []);

  // Generate enhanced AI recommendations based on biometric data
  useEffect(() => {
    if (heartRate > 0 && sleepScore > 0 && recoveryScore > 0) {
      const newRecommendations = generateEnhancedRecommendations(
        heartRate, 
        heartRateVariability,
        sleepScore, 
        sleepQuality,
        recoveryScore,
        weightFluctuation
      );
      setRecommendations(newRecommendations);
      onRecommendation(newRecommendations);
    }
  }, [heartRate, heartRateVariability, sleepScore, sleepQuality, recoveryScore, weightFluctuation, onRecommendation]);

  // Enhanced recommendation generation
  const generateEnhancedRecommendations = (hr, hrv, sleep, sleepQuality, recovery, weight) => {
    const recs = [];

    // Heart rate variability based recommendations
    if (hrv < 30) {
      recs.push({
        type: 'warning',
        title: 'Low Heart Rate Variability',
        message: 'Your HRV indicates high stress levels. Consider stress management techniques.',
        action: 'Add meditation or yoga to your routine',
        priority: 'high',
        impact: 'High stress may affect team chemistry and performance'
      });
    } else if (hrv > 70) {
      recs.push({
        type: 'positive',
        title: 'Excellent Heart Rate Variability',
        message: 'Your HRV indicates excellent recovery and stress management.',
        action: 'Perfect time for high-intensity training',
        priority: 'medium',
        impact: 'Optimal condition for team chemistry building'
      });
    }

    // Sleep quality based recommendations
    if (sleepQuality.sleepEfficiency < 85) {
      recs.push({
        type: 'warning',
        title: 'Poor Sleep Efficiency',
        message: 'Your sleep efficiency is below optimal levels.',
        action: 'Improve sleep hygiene and reduce screen time before bed',
        priority: 'high',
        impact: 'Poor sleep may negatively impact team communication'
      });
    }

    if (sleepQuality.deepSleep < 70) {
      recs.push({
        type: 'warning',
        title: 'Insufficient Deep Sleep',
        message: 'You need more deep sleep for optimal recovery.',
        action: 'Create a more consistent sleep schedule',
        priority: 'medium',
        impact: 'Deep sleep is crucial for team chemistry and performance'
      });
    }

    // Weight fluctuation based recommendations
    if (weight.trend === 'increasing' && weight.weeklyChange > 1) {
      recs.push({
        type: 'warning',
        title: 'Rapid Weight Gain',
        message: 'You\'re gaining weight faster than recommended.',
        action: 'Review nutrition plan and increase cardio',
        priority: 'medium',
        impact: 'Weight changes may affect speed and agility'
      });
    } else if (weight.trend === 'decreasing' && weight.weeklyChange < -1) {
      recs.push({
        type: 'warning',
        title: 'Rapid Weight Loss',
        message: 'You\'re losing weight faster than recommended.',
        action: 'Increase caloric intake and monitor nutrition',
        priority: 'medium',
        impact: 'Weight loss may affect strength and performance'
      });
    }

    // Recovery based recommendations
    if (recovery < 60) {
      recs.push({
        type: 'warning',
        title: 'Low Recovery Score',
        message: 'Your body needs more recovery time.',
        action: 'Focus on mobility and light cardio',
        priority: 'high',
        impact: 'Poor recovery affects team chemistry and performance'
      });
    } else if (recovery > 80) {
      recs.push({
        type: 'positive',
        title: 'Excellent Recovery',
        message: 'Your recovery metrics are excellent.',
        action: 'Perfect time for team chemistry building activities',
        priority: 'medium',
        impact: 'Optimal condition for team bonding and communication'
      });
    }

    return recs;
  };

  // Helper functions
  const getSleepChemistryRecommendation = (sleepQuality) => {
    if (sleepQuality > 0.8) return "Excellent sleep quality - optimal for team chemistry";
    if (sleepQuality > 0.6) return "Good sleep quality - maintain current patterns";
    if (sleepQuality > 0.4) return "Fair sleep quality - consider sleep schedule adjustments";
    return "Poor sleep quality - implement sleep improvement program";
  };

  const calculateNutritionTiming = (timing, heartRate) => {
    const timingAccuracy = timing?.accuracy || 0.7;
    const hrResponse = heartRate > 60 && heartRate < 100 ? 1.0 : 0.6;
    return (timingAccuracy + hrResponse) / 2;
  };

  const calculateHydrationEffectiveness = (hydration, recovery) => {
    const hydrationLevel = hydration?.level || 0.7;
    const recoveryRate = recovery / 100;
    return (hydrationLevel + recoveryRate) / 2;
  };

  const calculateEnergyMaintenance = (intake, performance) => {
    const energyIntake = intake?.adequacy || 0.8;
    const performanceMaintenance = performance?.consistency || 0.7;
    return (energyIntake + performanceMaintenance) / 2;
  };

  const generateNutritionRecommendations = (timing, hydration, energy) => {
    const recommendations = [];
    
    if (timing < 0.7) recommendations.push("Adjust nutrition timing by 15-30 minutes");
    if (hydration < 0.7) recommendations.push("Increase pre-game hydration by 20%");
    if (energy < 0.7) recommendations.push("Increase caloric intake by 200-300 calories");
    
    return recommendations.length > 0 ? recommendations : ["Maintain current nutrition protocol"];
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getWeightTrendColor = (trend) => {
    switch (trend) {
      case 'increasing': return 'text-red-400';
      case 'decreasing': return 'text-blue-400';
      default: return 'text-green-400';
    }
  };

  const getWeightTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '→';
    }
  };

  // Initialize sleep-chemistry correlation analysis
  useEffect(() => {
    const mockChemistryData = {
      'player1-player2': { chemistry: 8.5 },
      'player1-player3': { chemistry: 6.8 },
      'player2-player3': { chemistry: 7.2 }
    };
    
    const correlations = analyzeSleepChemistryCorrelation(sleepQuality, mockChemistryData);
    setSleepChemistryCorrelation(correlations);
  }, [sleepQuality, analyzeSleepChemistryCorrelation]);

  // Initialize nutrition effectiveness analysis
  useEffect(() => {
    const mockNutritionData = {
      timing: { accuracy: 0.8 },
      hydration: { level: 0.75 },
      intake: { adequacy: 0.85 }
    };
    
    const mockBiometricData = {
      heartRate: heartRate,
      recovery: recoveryScore,
      performance: { consistency: 0.8 }
    };
    
    const effectiveness = analyzeNutritionEffectiveness(mockNutritionData, mockBiometricData);
    setNutritionEffectiveness(effectiveness);
  }, [heartRate, recoveryScore, analyzeNutritionEffectiveness]);

  return (
    <div className="enhanced-biometric-integration bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          📊 Enhanced Biometric Integration
        </h3>
        <p className="text-gray-600">
          Advanced biometric monitoring with sleep-chemistry correlation and nutrition effectiveness
        </p>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium">
            {isConnected ? 'Connected to Biometric Devices' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Real-time Biometric Data */}
      {isConnected && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-center text-white">
            <div className="text-2xl font-bold">{heartRate}</div>
            <div className="text-sm">Heart Rate</div>
            <div className="text-xs">BPM</div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-center text-white">
            <div className="text-2xl font-bold">{heartRateVariability}</div>
            <div className="text-sm">HRV</div>
            <div className="text-xs">ms</div>
          </div>
          
          <div className={`bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-center text-white`}>
            <div className="text-2xl font-bold">{sleepScore}</div>
            <div className="text-sm">Sleep Score</div>
            <div className="text-xs">Last night</div>
          </div>
          
          <div className={`bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-center text-white`}>
            <div className="text-2xl font-bold">{recoveryScore}</div>
            <div className="text-sm">Recovery</div>
            <div className="text-xs">Current</div>
          </div>
        </div>
      )}

      {/* Detailed Sleep Analysis */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">😴 Sleep Quality Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-600">{sleepQuality.deepSleep}m</div>
            <div className="text-xs text-blue-700">Deep Sleep</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-600">{sleepQuality.remSleep}m</div>
            <div className="text-xs text-purple-700">REM Sleep</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-600">{sleepQuality.lightSleep}m</div>
            <div className="text-xs text-green-700">Light Sleep</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-yellow-600">{sleepQuality.awakeTime}m</div>
            <div className="text-xs text-yellow-700">Awake Time</div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-indigo-600">{sleepQuality.sleepEfficiency}%</div>
            <div className="text-xs text-indigo-700">Efficiency</div>
          </div>
        </div>
      </div>

      {/* Weight Fluctuation Tracking */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">⚖️ Weight Fluctuation Patterns</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{weightFluctuation.current} lbs</div>
            <div className="text-sm text-gray-600">Current Weight</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${getWeightTrendColor(weightFluctuation.trend)}`}>
              {getWeightTrendIcon(weightFluctuation.trend)} {weightFluctuation.trend}
            </div>
            <div className="text-sm text-gray-600">Trend</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{weightFluctuation.weeklyChange} lbs</div>
            <div className="text-sm text-gray-600">Weekly Change</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{weightFluctuation.monthlyChange} lbs</div>
            <div className="text-sm text-gray-600">Monthly Change</div>
          </div>
        </div>
      </div>

      {/* Sleep-Chemistry Correlation */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">🔄 Sleep-Chemistry Correlation</h4>
        <div className="space-y-3">
          {Object.entries(sleepChemistryCorrelation).map(([pairId, data]) => (
            <div key={pairId} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Player Pair: {pairId}</p>
                  <p className="text-sm text-gray-600">{data.recommendation}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">{data.sleepCorrelation}</div>
                  <div className="text-sm text-gray-600">Sleep Correlation</div>
                  <div className="text-sm text-blue-600">{data.chemistryImpact}% Chemistry Impact</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition Effectiveness */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">🍎 Nutrition Timing Effectiveness</h4>
        {nutritionEffectiveness.current && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{nutritionEffectiveness.current.timingScore}</div>
                <div className="text-sm text-gray-600">Timing Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{nutritionEffectiveness.current.hydrationScore}</div>
                <div className="text-sm text-gray-600">Hydration Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{nutritionEffectiveness.current.energyScore}</div>
                <div className="text-sm text-gray-600">Energy Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{nutritionEffectiveness.current.overallEffectiveness}</div>
                <div className="text-sm text-gray-600">Overall</div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {nutritionEffectiveness.current.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Recommendations</h4>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              rec.type === 'warning' ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className={`font-semibold ${
                    rec.type === 'warning' ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {rec.title}
                  </h5>
                  <p className={`text-sm mt-1 ${
                    rec.type === 'warning' ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {rec.message}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Action:</strong> {rec.action}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Team Impact:</strong> {rec.impact}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {rec.priority} priority
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tournament Season Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">🏆 Tournament Season Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {sleepQuality.sleepEfficiency > 85 ? 'Excellent' : sleepQuality.sleepEfficiency > 70 ? 'Good' : 'Needs Improvement'}
            </div>
            <div className="text-sm text-gray-600">Sleep Quality Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {heartRateVariability > 60 ? 'Optimal' : heartRateVariability > 40 ? 'Good' : 'Stress Detected'}
            </div>
            <div className="text-sm text-gray-600">Stress Management</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {recoveryScore > 80 ? 'Peak' : recoveryScore > 60 ? 'Good' : 'Recovery Needed'}
            </div>
            <div className="text-sm text-gray-600">Recovery Status</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            These metrics directly impact your team chemistry and tournament performance
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBiometricIntegration; 
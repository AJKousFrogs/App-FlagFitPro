import React, { useState, useEffect, useCallback } from 'react';
import { useNeonDatabase } from '../contexts/NeonDatabaseContext';
import { useTraining } from '../contexts/TrainingContext';

const AdvancedChemistryAnalytics = ({ teamId, playerId }) => {
  const { db } = useNeonDatabase();
  const { updateTrainingMetrics } = useTraining();
  
  // Advanced chemistry states
  const [rpiData, setRpiData] = useState({});
  const [optimalLineups, setOptimalLineups] = useState([]);
  const [chemistryPrograms, setChemistryPrograms] = useState([]);
  const [industryBenchmarks, setIndustryBenchmarks] = useState({});
  const [roiMetrics, setRoiMetrics] = useState({});
  const [sleepChemistryCorrelation, setSleepChemistryCorrelation] = useState({});
  const [nutritionEffectiveness, setNutritionEffectiveness] = useState({});

  // RPI Calculation Components
  const calculateRPI = useCallback((player1Id, player2Id, gameData) => {
    const baseChemistry = gameData.chemistry || 7.0;
    const communicationScore = gameData.communication || 7.0;
    const timingScore = gameData.timing || 7.0;
    const trustScore = gameData.trust || 7.0;
    const performanceImpact = gameData.performanceImpact || 0.0;
    
    // RPI Formula: Weighted combination of chemistry factors
    const rpi = (
      (baseChemistry * 0.3) +
      (communicationScore * 0.25) +
      (timingScore * 0.25) +
      (trustScore * 0.1) +
      (performanceImpact * 0.1)
    );
    
    return Math.round(rpi * 100) / 100;
  }, []);

  // Generate optimal lineups based on chemistry data
  const generateOptimalLineups = useCallback((teamData) => {
    const positions = ['QB', 'WR', 'WR', 'Center', 'DB'];
    const players = teamData.players || [];
    
    // Calculate all possible combinations
    const combinations = [];
    
    // QB-WR combinations (most critical)
    const qbs = players.filter(p => p.positions.includes('QB'));
    const wrs = players.filter(p => p.positions.includes('WR'));
    
    qbs.forEach(qb => {
      wrs.forEach(wr => {
        const chemistry = rpiData[`${qb.id}-${wr.id}`] || 7.0;
        combinations.push({
          qb: qb,
          wr: wr,
          chemistry: chemistry,
          rpi: calculateRPI(qb.id, wr.id, { chemistry, communication: 8, timing: 7, trust: 7 })
        });
      });
    });
    
    // Sort by RPI and return top combinations
    return combinations
      .sort((a, b) => b.rpi - a.rpi)
      .slice(0, 5)
      .map((combo, index) => ({
        ...combo,
        rank: index + 1,
        expectedPerformance: Math.round((combo.rpi / 10) * 100),
        recommendation: getChemistryRecommendation(combo.rpi)
      }));
  }, [rpiData, calculateRPI]);

  // Chemistry improvement programs with ROI tracking
  const generateChemistryPrograms = useCallback((chemistryData) => {
    const programs = [];
    
    // Identify low chemistry relationships
    Object.entries(chemistryData).forEach(([pairId, data]) => {
      if (data.rpi < 7.0) {
        const [player1Id, player2Id] = pairId.split('-');
        const program = {
          id: `program-${pairId}`,
          players: [player1Id, player2Id],
          currentRPI: data.rpi,
          targetRPI: 8.0,
          duration: '8 weeks',
          activities: generateChemistryActivities(data.rpi),
          expectedROI: calculateChemistryROI(data.rpi, 8.0),
          cost: calculateProgramCost(data.rpi),
          timeline: generateProgramTimeline(data.rpi)
        };
        programs.push(program);
      }
    });
    
    return programs.sort((a, b) => b.expectedROI - a.expectedROI);
  }, []);

  // Sleep quality correlation with team chemistry
  const analyzeSleepChemistryCorrelation = useCallback((sleepData, chemistryData) => {
    const correlations = {};
    
    Object.entries(chemistryData).forEach(([pairId, chemistry]) => {
      const [player1Id, player2Id] = pairId.split('-');
      
      // Get sleep data for both players
      const player1Sleep = sleepData[player1Id] || [];
      const player2Sleep = sleepData[player2Id] || [];
      
      if (player1Sleep.length > 0 && player2Sleep.length > 0) {
        // Calculate correlation between sleep quality and chemistry
        const sleepCorrelation = calculateCorrelation(
          player1Sleep.map(s => s.quality),
          player2Sleep.map(s => s.quality)
        );
        
        const chemistryImpact = sleepCorrelation * 0.3; // 30% impact factor
        
        correlations[pairId] = {
          sleepCorrelation: Math.round(sleepCorrelation * 100) / 100,
          chemistryImpact: Math.round(chemistryImpact * 100) / 100,
          recommendation: getSleepRecommendation(sleepCorrelation)
        };
      }
    });
    
    return correlations;
  }, []);

  // Nutrition timing effectiveness based on biometric feedback
  const analyzeNutritionEffectiveness = useCallback((nutritionData, biometricData) => {
    const effectiveness = {};
    
    Object.entries(nutritionData).forEach(([sessionId, nutrition]) => {
      const biometric = biometricData[sessionId];
      
      if (biometric) {
        const timingScore = calculateNutritionTiming(nutrition.timing, biometric.heartRate);
        const hydrationScore = calculateHydrationEffectiveness(nutrition.hydration, biometric.recovery);
        const energyScore = calculateEnergyMaintenance(nutrition.intake, biometric.performance);
        
        const overallEffectiveness = (timingScore + hydrationScore + energyScore) / 3;
        
        effectiveness[sessionId] = {
          timingScore: Math.round(timingScore * 100) / 100,
          hydrationScore: Math.round(hydrationScore * 100) / 100,
          energyScore: Math.round(energyScore * 100) / 100,
          overallEffectiveness: Math.round(overallEffectiveness * 100) / 100,
          recommendations: generateNutritionRecommendations(timingScore, hydrationScore, energyScore)
        };
      }
    });
    
    return effectiveness;
  }, []);

  // Helper functions
  const getChemistryRecommendation = (rpi) => {
    if (rpi >= 9.0) return "Elite chemistry - maximize playing time together";
    if (rpi >= 8.0) return "Strong chemistry - continue current training";
    if (rpi >= 7.0) return "Good chemistry - focus on communication";
    if (rpi >= 6.0) return "Fair chemistry - implement improvement program";
    return "Poor chemistry - intensive relationship building needed";
  };

  const generateChemistryActivities = (currentRPI) => {
    const activities = [];
    
    if (currentRPI < 6.0) {
      activities.push("Daily communication exercises");
      activities.push("Weekly team building sessions");
      activities.push("Position-specific drills together");
    } else if (currentRPI < 7.0) {
      activities.push("Bi-weekly chemistry building drills");
      activities.push("Communication workshops");
      activities.push("Shared film study sessions");
    } else {
      activities.push("Maintenance chemistry exercises");
      activities.push("Advanced coordination drills");
    }
    
    return activities;
  };

  const calculateChemistryROI = (currentRPI, targetRPI) => {
    const improvement = targetRPI - currentRPI;
    const performanceGain = improvement * 0.15; // 15% performance gain per RPI point
    const costSavings = improvement * 0.1; // 10% cost savings per RPI point
    return Math.round((performanceGain + costSavings) * 100) / 100;
  };

  const calculateProgramCost = (currentRPI) => {
    const baseCost = 500;
    const difficultyMultiplier = currentRPI < 6.0 ? 1.5 : currentRPI < 7.0 ? 1.2 : 1.0;
    return Math.round(baseCost * difficultyMultiplier);
  };

  const generateProgramTimeline = (currentRPI) => {
    const weeks = currentRPI < 6.0 ? 12 : currentRPI < 7.0 ? 8 : 6;
    return Array.from({ length: weeks }, (_, i) => ({
      week: i + 1,
      focus: i < weeks / 3 ? "Communication" : i < 2 * weeks / 3 ? "Coordination" : "Integration",
      activities: generateWeekActivities(i, weeks)
    }));
  };

  const generateWeekActivities = (weekIndex, totalWeeks) => {
    const activities = [];
    if (weekIndex < totalWeeks / 3) {
      activities.push("Daily check-ins", "Communication drills", "Team building");
    } else if (weekIndex < 2 * totalWeeks / 3) {
      activities.push("Position-specific training", "Coordination exercises", "Film study");
    } else {
      activities.push("Game simulation", "Performance testing", "Integration assessment");
    }
    return activities;
  };

  const calculateCorrelation = (array1, array2) => {
    if (array1.length !== array2.length) return 0;
    
    const n = array1.length;
    const sum1 = array1.reduce((a, b) => a + b, 0);
    const sum2 = array2.reduce((a, b) => a + b, 0);
    const sum1Sq = array1.reduce((a, b) => a + b * b, 0);
    const sum2Sq = array2.reduce((a, b) => a + b * b, 0);
    const pSum = array1.reduce((a, b, i) => a + b * array2[i], 0);
    
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    
    return den === 0 ? 0 : num / den;
  };

  const getSleepRecommendation = (correlation) => {
    if (correlation > 0.7) return "Excellent sleep synchronization - maintain current patterns";
    if (correlation > 0.5) return "Good sleep alignment - minor adjustments recommended";
    if (correlation > 0.3) return "Fair sleep correlation - consider sleep schedule coordination";
    return "Poor sleep alignment - implement sleep synchronization program";
  };

  const calculateNutritionTiming = (timing, heartRate) => {
    // Score based on timing accuracy and heart rate response
    const timingAccuracy = timing.accuracy || 0.7;
    const hrResponse = heartRate.optimal ? 1.0 : 0.6;
    return (timingAccuracy + hrResponse) / 2;
  };

  const calculateHydrationEffectiveness = (hydration, recovery) => {
    // Score based on hydration levels and recovery metrics
    const hydrationLevel = hydration.level || 0.7;
    const recoveryRate = recovery.rate || 0.8;
    return (hydrationLevel + recoveryRate) / 2;
  };

  const calculateEnergyMaintenance = (intake, performance) => {
    // Score based on energy intake and performance maintenance
    const energyIntake = intake.adequacy || 0.8;
    const performanceMaintenance = performance.consistency || 0.7;
    return (energyIntake + performanceMaintenance) / 2;
  };

  const generateNutritionRecommendations = (timing, hydration, energy) => {
    const recommendations = [];
    
    if (timing < 0.7) recommendations.push("Adjust nutrition timing by 15-30 minutes");
    if (hydration < 0.7) recommendations.push("Increase pre-game hydration by 20%");
    if (energy < 0.7) recommendations.push("Increase caloric intake by 200-300 calories");
    
    return recommendations.length > 0 ? recommendations : ["Maintain current nutrition protocol"];
  };

  // Initialize component
  useEffect(() => {
    // Load team chemistry data
    const loadChemistryData = async () => {
      try {
        // Simulate loading chemistry data
        const mockChemistryData = {
          'player1-player2': { rpi: 8.5, chemistry: 8.5, communication: 9, timing: 8, trust: 8 },
          'player1-player3': { rpi: 6.8, chemistry: 6.8, communication: 7, timing: 6, trust: 7 },
          'player2-player3': { rpi: 7.2, chemistry: 7.2, communication: 7, timing: 7, trust: 8 }
        };
        
        setRpiData(mockChemistryData);
        
        // Generate optimal lineups
        const lineups = generateOptimalLineups({
          players: [
            { id: 'player1', name: 'Mike Johnson', positions: ['QB'] },
            { id: 'player2', name: 'Chris Wilson', positions: ['WR'] },
            { id: 'player3', name: 'Tyler Brown', positions: ['WR', 'DB'] }
          ]
        });
        setOptimalLineups(lineups);
        
        // Generate chemistry programs
        const programs = generateChemistryPrograms(mockChemistryData);
        setChemistryPrograms(programs);
        
        // Load industry benchmarks
        setIndustryBenchmarks({
          averageRPI: 7.2,
          topQuartile: 8.5,
          bottomQuartile: 6.0,
          industryStandard: 7.5
        });
        
        // Calculate ROI metrics
        setRoiMetrics({
          totalInvestment: programs.reduce((sum, p) => sum + p.cost, 0),
          expectedReturn: programs.reduce((sum, p) => sum + p.expectedROI, 0),
          roiPercentage: Math.round((programs.reduce((sum, p) => sum + p.expectedROI, 0) / 
                                   programs.reduce((sum, p) => sum + p.cost, 0)) * 100)
        });
        
      } catch (error) {
        console.error('Failed to load chemistry data:', error);
      }
    };
    
    loadChemistryData();
  }, [generateOptimalLineups, generateChemistryPrograms]);

  return (
    <div className="advanced-chemistry-analytics bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          🧪 Advanced Chemistry Analytics
        </h3>
        <p className="text-gray-600">
          Industry-standard Relationship Performance Index (RPI) and chemistry optimization
        </p>
      </div>

      {/* RPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <h4 className="text-lg font-semibold mb-2">Team RPI Average</h4>
          <div className="text-3xl font-bold">
            {Object.values(rpiData).length > 0 
              ? Math.round(Object.values(rpiData).reduce((sum, data) => sum + data.rpi, 0) / Object.values(rpiData).length * 100) / 100
              : 'N/A'
            }
          </div>
          <p className="text-blue-100 text-sm">Industry: 7.2</p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <h4 className="text-lg font-semibold mb-2">Chemistry ROI</h4>
          <div className="text-3xl font-bold">{roiMetrics.roiPercentage || 0}%</div>
          <p className="text-green-100 text-sm">Expected return on investment</p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <h4 className="text-lg font-semibold mb-2">Active Programs</h4>
          <div className="text-3xl font-bold">{chemistryPrograms.length}</div>
          <p className="text-purple-100 text-sm">Chemistry improvement programs</p>
        </div>
      </div>

      {/* Optimal Lineups */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-gray-900 mb-4">🏆 Optimal Lineups by RPI</h4>
        <div className="space-y-4">
          {optimalLineups.map((lineup, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold text-blue-600">#{lineup.rank}</span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {lineup.qb.name} (QB) + {lineup.wr.name} (WR)
                    </p>
                    <p className="text-sm text-gray-600">{lineup.recommendation}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{lineup.rpi}</div>
                  <div className="text-sm text-gray-600">RPI Score</div>
                  <div className="text-sm text-blue-600">{lineup.expectedPerformance}% Performance</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chemistry Improvement Programs */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-gray-900 mb-4">📈 Chemistry Improvement Programs</h4>
        <div className="space-y-4">
          {chemistryPrograms.map((program, index) => (
            <div key={program.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-gray-900">Program #{index + 1}</h5>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Current: {program.currentRPI}</span>
                  <span className="text-sm text-gray-600">Target: {program.targetRPI}</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                    ROI: {program.expectedROI}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Duration</p>
                  <p className="text-sm text-gray-600">{program.duration}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Cost</p>
                  <p className="text-sm text-gray-600">${program.cost}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Expected ROI</p>
                  <p className="text-sm text-gray-600">{program.expectedROI}%</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Activities:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {program.activities.map((activity, i) => (
                    <li key={i} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {activity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Industry Benchmarks */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-gray-900 mb-4">📊 Industry Benchmarks</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{industryBenchmarks.averageRPI || 'N/A'}</div>
            <p className="text-sm text-gray-600">League Average</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{industryBenchmarks.topQuartile || 'N/A'}</div>
            <p className="text-sm text-gray-600">Top Quartile</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{industryBenchmarks.bottomQuartile || 'N/A'}</div>
            <p className="text-sm text-gray-600">Bottom Quartile</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{industryBenchmarks.industryStandard || 'N/A'}</div>
            <p className="text-sm text-gray-600">Industry Standard</p>
          </div>
        </div>
      </div>

      {/* ROI Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <h4 className="text-xl font-semibold text-gray-900 mb-4">💰 Chemistry Investment Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">${roiMetrics.totalInvestment || 0}</div>
            <p className="text-sm text-gray-600">Total Investment</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">${roiMetrics.expectedReturn || 0}</div>
            <p className="text-sm text-gray-600">Expected Return</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{roiMetrics.roiPercentage || 0}%</div>
            <p className="text-sm text-gray-600">ROI Percentage</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedChemistryAnalytics; 
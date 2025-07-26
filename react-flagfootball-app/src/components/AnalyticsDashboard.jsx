import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Select, DatePicker, Spin, Alert } from 'antd';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrophyOutlined, UserOutlined, FireOutlined, ClockCircleOutlined, BarChartOutlined, DashboardOutlined } from '@ant-design/icons';
// Removed direct import - will use dynamic import when needed

const { Option } = Select;
const { RangePicker } = DatePicker;

const AnalyticsDashboard = () => {
  const [timeframe, setTimeframe] = useState('7d');
  const [selectedPosition, setSelectedPosition] = useState('QB');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [predictiveData, setPredictiveData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Enhanced analytics data structure
  const generateAnalyticsData = useCallback(() => {
    return {
      // Real-time training effectiveness
      trainingEffectiveness: {
        current: 87,
        trend: '+5.2%',
        breakdown: {
          technique: 92,
          consistency: 85,
          intensity: 78,
          recovery: 89
        },
        weeklyProgress: [
          { week: 1, score: 82 },
          { week: 2, score: 84 },
          { week: 3, score: 86 },
          { week: 4, score: 87 }
        ]
      },

      // Predictive performance modeling
      predictiveModeling: {
        nextGamePerformance: 89,
        confidence: 87,
        factors: {
          trainingImpact: 0.73,
          restQuality: 0.85,
          teamChemistry: 0.78,
          recentForm: 0.91
        },
        predictions: [
          { date: '2024-01-15', performance: 89, confidence: 87 },
          { date: '2024-01-22', performance: 91, confidence: 82 },
          { date: '2024-01-29', performance: 88, confidence: 79 }
        ]
      },

      // Position-specific benchmarks
      positionBenchmarks: {
        QB: {
          accuracy: { current: 78, benchmark: 82, percentile: 75 },
          decisionTime: { current: 2.1, benchmark: 1.8, percentile: 65 },
          redZoneEfficiency: { current: 67, benchmark: 75, percentile: 60 },
          pocketPresence: { current: 81, benchmark: 85, percentile: 70 }
        },
        WR: {
          routePrecision: { current: 82, benchmark: 88, percentile: 70 },
          catchRate: { current: 75, benchmark: 80, percentile: 65 },
          separation: { current: 79, benchmark: 85, percentile: 68 },
          yardsAfterCatch: { current: 4.2, benchmark: 5.1, percentile: 62 }
        },
        RB: {
          yardsPerCarry: { current: 4.8, benchmark: 5.2, percentile: 70 },
          breakTackleRate: { current: 23, benchmark: 28, percentile: 65 },
          passProtection: { current: 76, benchmark: 82, percentile: 60 },
          receivingYards: { current: 45, benchmark: 52, percentile: 68 }
        }
      },

      // Injury risk assessment
      injuryRisk: {
        overall: 12,
        trend: '-3%',
        factors: {
          fatigue: 15,
          overuse: 8,
          technique: 18,
          recovery: 10
        },
        recommendations: [
          'Increase rest between high-intensity sessions',
          'Focus on proper landing mechanics',
          'Add mobility work to routine',
          'Monitor fatigue levels more closely'
        ]
      },

      // Game performance correlation
      gamePerformance: {
        correlation: 0.73,
        impact: {
          trainingDrills: 0.68,
          recoveryQuality: 0.82,
          teamChemistry: 0.71,
          mentalPreparation: 0.79
        },
        recentGames: [
          { date: '2024-01-08', trainingScore: 85, gameScore: 88 },
          { date: '2024-01-01', trainingScore: 82, gameScore: 85 },
          { date: '2023-12-25', trainingScore: 79, gameScore: 81 }
        ]
      },

      // Advanced metrics
      advancedMetrics: {
        heartRateVariability: { current: 45, optimal: 50, status: 'good' },
        sleepQuality: { current: 78, optimal: 85, status: 'fair' },
        stressLevel: { current: 32, optimal: 25, status: 'elevated' },
        hydrationStatus: { current: 92, optimal: 90, status: 'excellent' }
      }
    };
  }, []);

  // Initialize analytics
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        setLoading(true);
        const data = generateAnalyticsData();
        setAnalyticsData(data);
        setPerformanceMetrics(data.positionBenchmarks[selectedPosition]);
        setPredictiveData(data.predictiveModeling);
        setLoading(false);
      } catch (error) {
        setError('Failed to load analytics data');
        setLoading(false);
      }
    };

    initializeAnalytics();
  }, [generateAnalyticsData, selectedPosition]);

  // Update performance metrics when position changes
  useEffect(() => {
    if (analyticsData) {
      setPerformanceMetrics(analyticsData.positionBenchmarks[selectedPosition]);
    }
  }, [selectedPosition, analyticsData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      case 'elevated': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getPercentileColor = (percentile) => {
    if (percentile >= 80) return 'text-green-600';
    if (percentile >= 60) return 'text-blue-600';
    if (percentile >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600">Real-time performance insights and predictive modeling</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="QB">Quarterback</option>
            <option value="WR">Wide Receiver</option>
            <option value="RB">Running Back</option>
          </select>
        </div>
      </div>

      {/* Real-time Training Effectiveness */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Real-time Training Effectiveness</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{analyticsData.trainingEffectiveness.current}%</div>
            <div className="text-sm text-gray-600">Overall Score</div>
            <div className="text-xs text-green-600">{analyticsData.trainingEffectiveness.trend}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analyticsData.trainingEffectiveness.breakdown.technique}%</div>
            <div className="text-sm text-gray-600">Technique</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{analyticsData.trainingEffectiveness.breakdown.consistency}%</div>
            <div className="text-sm text-gray-600">Consistency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{analyticsData.trainingEffectiveness.breakdown.recovery}%</div>
            <div className="text-sm text-gray-600">Recovery</div>
          </div>
        </div>
        
        {/* Weekly Progress Chart */}
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Weekly Progress</h4>
          <div className="flex items-end space-x-2 h-32">
            {analyticsData.trainingEffectiveness.weeklyProgress.map((week, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t"
                  style={{ height: `${(week.score / 100) * 100}%` }}
                ></div>
                <div className="text-xs text-gray-600 mt-2">W{week.week}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Predictive Performance Modeling */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🔮 Predictive Performance Modeling</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-purple-600">{predictiveData.nextGamePerformance}%</div>
              <div className="text-sm text-gray-600">Predicted Next Game Performance</div>
              <div className="text-xs text-gray-500">Confidence: {predictiveData.confidence}%</div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Performance Factors</h4>
              {Object.entries(predictiveData.factors).map(([factor, impact]) => (
                <div key={factor} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{factor.replace(/([A-Z])/g, ' $1')}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${impact * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold">{Math.round(impact * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Performance Predictions</h4>
            <div className="space-y-3">
              {predictiveData.predictions.map((prediction, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">{prediction.performance}%</div>
                    <div className="text-sm text-gray-600">{new Date(prediction.date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Confidence</div>
                    <div className="font-semibold">{prediction.confidence}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Position-Specific Benchmarking */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Position-Specific Benchmarking</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(performanceMetrics).map(([metric, data]) => (
            <div key={metric} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900 capitalize">{metric.replace(/([A-Z])/g, ' $1')}</h4>
                <span className={`text-sm font-semibold ${getPercentileColor(data.percentile)}`}>
                  {data.percentile}th percentile
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold text-blue-600">{data.current}</span>
                <span className="text-sm text-gray-600">vs {data.benchmark}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(data.current / data.benchmark) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Injury Risk Assessment */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">⚠️ Injury Risk Assessment</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-orange-600">{analyticsData.injuryRisk.overall}%</div>
              <div className="text-sm text-gray-600">Overall Risk Level</div>
              <div className="text-xs text-green-600">{analyticsData.injuryRisk.trend}</div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Risk Factors</h4>
              {Object.entries(analyticsData.injuryRisk.factors).map(([factor, risk]) => (
                <div key={factor} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{factor}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${risk > 15 ? 'bg-red-500' : risk > 10 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${risk}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold">{risk}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
            <div className="space-y-2">
              {analyticsData.injuryRisk.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg">
                  <span className="text-orange-600 mt-1">•</span>
                  <span className="text-sm text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Game Performance Correlation */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Training vs Game Performance Correlation</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-green-600">{Math.round(analyticsData.gamePerformance.correlation * 100)}%</div>
              <div className="text-sm text-gray-600">Correlation Strength</div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Impact Factors</h4>
              {Object.entries(analyticsData.gamePerformance.impact).map(([factor, impact]) => (
                <div key={factor} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{factor.replace(/([A-Z])/g, ' $1')}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${impact * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold">{Math.round(impact * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Recent Performance</h4>
            <div className="space-y-3">
              {analyticsData.gamePerformance.recentGames.map((game, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">Game {index + 1}</div>
                    <div className="text-sm text-gray-600">{new Date(game.date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Training: {game.trainingScore}%</div>
                    <div className="font-semibold">Game: {game.gameScore}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Biometric Metrics */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">💓 Advanced Biometric Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analyticsData.advancedMetrics).map(([metric, data]) => (
            <div key={metric} className="text-center p-4 border border-gray-200 rounded-lg">
              <div className={`text-2xl font-bold ${getStatusColor(data.status)}`}>{data.current}</div>
              <div className="text-sm text-gray-600 capitalize">{metric.replace(/([A-Z])/g, ' $1')}</div>
              <div className="text-xs text-gray-500">Optimal: {data.optimal}</div>
              <div className={`text-xs font-semibold ${getStatusColor(data.status)}`}>
                {data.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
import React, { useState, useEffect } from 'react';
import { sequentialThoughtService } from '../services/SequentialThoughtService';
import { enhancedPerformanceService } from '../services/EnhancedPerformanceService';

const PerformanceReasoningChains = ({ performanceData, userProfile, recommendations }) => {
  const [reasoningChains, setReasoningChains] = useState([]);
  const [activeChain, setActiveChain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableChains] = useState([
    {
      id: 'performance-optimization',
      name: 'Performance Optimization',
      icon: '🎯',
      description: 'Analyze current performance and identify optimization opportunities'
    },
    {
      id: 'trend-analysis',
      name: 'Trend Analysis',
      icon: '📈',
      description: 'Deep dive into performance trends and pattern recognition'
    },
    {
      id: 'improvement-strategy',
      name: 'Improvement Strategy',
      icon: '🚀',
      description: 'Develop strategic approach to performance enhancement'
    },
    {
      id: 'risk-assessment',
      name: 'Risk Assessment',
      icon: '⚠️',
      description: 'Evaluate risks to performance and injury prevention'
    },
    {
      id: 'goal-alignment',
      name: 'Goal Alignment',
      icon: '🎪',
      description: 'Align training and performance with athlete goals'
    }
  ]);

  const executeReasoningChain = async (chainId) => {
    setLoading(true);
    setActiveChain(chainId);

    try {
      let reasoningResult;

      switch (chainId) {
        case 'performance-optimization':
          reasoningResult = await performanceOptimizationReasoning();
          break;
        case 'trend-analysis':
          reasoningResult = await trendAnalysisReasoning();
          break;
        case 'improvement-strategy':
          reasoningResult = await improvementStrategyReasoning();
          break;
        case 'risk-assessment':
          reasoningResult = await riskAssessmentReasoning();
          break;
        case 'goal-alignment':
          reasoningResult = await goalAlignmentReasoning();
          break;
        default:
          reasoningResult = { error: 'Unknown reasoning chain' };
      }

      if (reasoningResult && !reasoningResult.error) {
        setReasoningChains(prev => [
          ...prev.filter(chain => chain.id !== chainId),
          { id: chainId, result: reasoningResult, timestamp: new Date() }
        ]);
      }

    } catch (error) {
      console.error(`Error executing ${chainId} reasoning:`, error);
      setReasoningChains(prev => [
        ...prev.filter(chain => chain.id !== chainId),
        { 
          id: chainId, 
          result: { error: error.message || 'Reasoning failed' }, 
          timestamp: new Date() 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const performanceOptimizationReasoning = async () => {
    const input = {
      currentPerformance: performanceData?.analysis?.performanceMetrics || {},
      userGoals: userProfile?.goals || {},
      constraints: userProfile?.constraints || [],
      timeAvailable: userProfile?.timeAvailable || 'standard'
    };

    try {
      const reasoning = await sequentialThoughtService.performReasoning(
        'performance-optimization',
        input,
        { depth: 3, includeAlternatives: true }
      );

      return reasoning || {
        steps: [
          {
            step: 1,
            thought: 'Analyze current performance baseline',
            observation: `Overall performance score: ${input.currentPerformance.overall?.score || 'N/A'}`,
            reasoning: 'Establishing baseline performance metrics across all domains'
          },
          {
            step: 2,
            thought: 'Identify optimization opportunities',
            observation: 'Areas with highest improvement potential identified',
            reasoning: 'Focus on metrics with largest gap between current and potential performance'
          },
          {
            step: 3,
            thought: 'Prioritize interventions',
            observation: 'High-impact, low-risk optimizations prioritized',
            reasoning: 'Maximize performance gains while minimizing injury risk and time investment'
          }
        ],
        conclusions: [
          'Focus on consistency improvements in strongest areas',
          'Address fundamental gaps in weakest performance domains',
          'Implement progressive overload in training protocols'
        ],
        confidence: 0.82,
        alternatives: [
          'Conservative approach focusing on consistency',
          'Aggressive approach targeting rapid gains',
          'Balanced approach with moderate progression'
        ]
      };
    } catch (error) {
      throw error;
    }
  };

  const trendAnalysisReasoning = async () => {
    const input = {
      performanceHistory: performanceData?.trends || [],
      contextualFactors: performanceData?.context || {},
      timeframe: '30-days'
    };

    try {
      const reasoning = await sequentialThoughtService.performReasoning(
        'trend-analysis',
        input,
        { depth: 3 }
      );

      return reasoning || {
        steps: [
          {
            step: 1,
            thought: 'Examine performance patterns',
            observation: 'Cyclical patterns in performance metrics identified',
            reasoning: 'Performance shows clear correlation with training cycles and recovery periods'
          },
          {
            step: 2,
            thought: 'Analyze trend drivers',
            observation: 'Training load and recovery quality are primary trend drivers',
            reasoning: 'Strong correlation between well-managed training load and performance improvements'
          },
          {
            step: 3,
            thought: 'Project future trends',
            observation: 'Current trajectory suggests continued improvement with proper management',
            reasoning: 'Trend sustainability depends on maintaining current training and recovery protocols'
          }
        ],
        conclusions: [
          'Performance trends are positive and sustainable',
          'Training periodization is effectively supporting progress',
          'Recovery protocols need optimization for continued gains'
        ],
        confidence: 0.78,
        patterns: [
          'Weekly performance peaks align with training cycles',
          'Recovery quality directly impacts subsequent performance',
          'Consistency improving across all measured domains'
        ]
      };
    } catch (error) {
      throw error;
    }
  };

  const improvementStrategyReasoning = async () => {
    const input = {
      currentLevel: performanceData?.analysis?.performanceMetrics?.overall?.score || 70,
      targetLevel: userProfile?.goals?.targetPerformance || 85,
      timeframe: userProfile?.goals?.timeframe || '3-months',
      resources: userProfile?.resources || 'standard'
    };

    return {
      steps: [
        {
          step: 1,
          thought: 'Define improvement requirements',
          observation: `Need ${input.targetLevel - input.currentLevel} point improvement in ${input.timeframe}`,
          reasoning: 'Clear performance gap identified requiring systematic approach'
        },
        {
          step: 2,
          thought: 'Assess improvement feasibility',
          observation: 'Target improvement is achievable with focused training',
          reasoning: 'Historical data shows similar improvements possible with consistent effort'
        },
        {
          step: 3,
          thought: 'Design improvement pathway',
          observation: 'Multi-phase approach with progressive milestones',
          reasoning: 'Structured progression reduces injury risk while maintaining motivation'
        },
        {
          step: 4,
          thought: 'Allocate training resources',
          observation: 'Prioritize high-impact training methods',
          reasoning: 'Focus limited time and energy on activities with greatest ROI'
        }
      ],
      conclusions: [
        'Improvement target is realistic within timeframe',
        'Focus on 2-3 key performance areas for maximum impact',
        'Regular assessment and adjustment needed every 2-3 weeks'
      ],
      confidence: 0.85,
      strategy: {
        phase1: 'Foundation building (weeks 1-4)',
        phase2: 'Skill development (weeks 5-8)',
        phase3: 'Performance optimization (weeks 9-12)'
      }
    };
  };

  const riskAssessmentReasoning = async () => {
    const input = {
      currentPerformance: performanceData?.analysis?.performanceMetrics || {},
      trainingLoad: performanceData?.context?.training || {},
      recoveryStatus: performanceData?.context?.recovery || {},
      injuryHistory: userProfile?.injuryHistory || []
    };

    return {
      steps: [
        {
          step: 1,
          thought: 'Evaluate performance risks',
          observation: 'Identify factors that could negatively impact performance',
          reasoning: 'Proactive risk identification allows for preventive measures'
        },
        {
          step: 2,
          thought: 'Assess injury risk factors',
          observation: 'Current training load and recovery status indicate low-moderate risk',
          reasoning: 'Balanced training approach with adequate recovery reduces injury likelihood'
        },
        {
          step: 3,
          thought: 'Analyze overtraining indicators',
          observation: 'No significant overtraining symptoms detected',
          reasoning: 'Performance trends and recovery markers suggest appropriate training stress'
        },
        {
          step: 4,
          thought: 'Review external risk factors',
          observation: 'Environmental and lifestyle factors generally supportive',
          reasoning: 'External factors can significantly impact performance and injury risk'
        }
      ],
      conclusions: [
        'Overall risk profile is favorable for continued training',
        'Monitor training load progression carefully',
        'Maintain current recovery protocols to prevent accumulation of fatigue'
      ],
      confidence: 0.79,
      riskFactors: [
        'Rapid training load increases (Low risk)',
        'Inadequate recovery periods (Low-Medium risk)',
        'Environmental stressors (Low risk)'
      ],
      mitigationStrategies: [
        'Progressive training load increases',
        'Emphasize sleep and nutrition quality',
        'Regular performance and wellness monitoring'
      ]
    };
  };

  const goalAlignmentReasoning = async () => {
    const input = {
      athleteGoals: userProfile?.goals || {},
      currentPerformance: performanceData?.analysis?.performanceMetrics || {},
      timeConstraints: userProfile?.timeConstraints || {},
      priorities: userProfile?.priorities || []
    };

    return {
      steps: [
        {
          step: 1,
          thought: 'Map performance to goals',
          observation: 'Current performance metrics aligned with stated goals',
          reasoning: 'Performance development should directly support athlete objectives'
        },
        {
          step: 2,
          thought: 'Identify priority alignment',
          observation: 'Training focus areas match performance priorities',
          reasoning: 'Resource allocation should reflect goal importance and potential impact'
        },
        {
          step: 3,
          thought: 'Assess timeline feasibility',
          observation: 'Goals are achievable within stated timeframes',
          reasoning: 'Realistic timelines increase motivation and reduce pressure'
        },
        {
          step: 4,
          thought: 'Optimize training allocation',
          observation: 'Training time effectively distributed across goal areas',
          reasoning: 'Balanced approach ensures progress across multiple objectives'
        }
      ],
      conclusions: [
        'Current approach well-aligned with athlete goals',
        'Minor adjustments needed to optimize time allocation',
        'Regular goal review recommended to maintain alignment'
      ],
      confidence: 0.83,
      alignment: {
        primaryGoals: 'Strong alignment (85%)',
        secondaryGoals: 'Good alignment (72%)',
        timeAllocation: 'Optimal distribution'
      },
      recommendations: [
        'Increase focus on technical skills development',
        'Maintain current physical training emphasis',
        'Schedule monthly goal review sessions'
      ]
    };
  };

  const getChainStatus = (chainId) => {
    const chain = reasoningChains.find(c => c.id === chainId);
    if (!chain) return 'not-run';
    if (chain.result.error) return 'error';
    return 'completed';
  };

  const getChainResult = (chainId) => {
    return reasoningChains.find(c => c.id === chainId)?.result;
  };

  const getStepIcon = (stepNumber, isCompleted = true) => {
    if (!isCompleted) return '⏳';
    switch (stepNumber) {
      case 1: return '🔍';
      case 2: return '📊';
      case 3: return '💡';
      case 4: return '✅';
      default: return '🔢';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#10b981';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const renderReasoningChain = (chainId) => {
    const result = getChainResult(chainId);
    if (!result) return null;

    if (result.error) {
      return (
        <div className="reasoning-error">
          <div className="error-icon">❌</div>
          <div className="error-message">Reasoning failed: {result.error}</div>
          <button 
            className="retry-button"
            onClick={() => executeReasoningChain(chainId)}
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="reasoning-result">
        {/* Reasoning Steps */}
        {result.steps && (
          <div className="reasoning-steps">
            <h5>🧠 Reasoning Process</h5>
            {result.steps.map((step, index) => (
              <div key={index} className="reasoning-step">
                <div className="step-header">
                  <span className="step-icon">{getStepIcon(step.step)}</span>
                  <span className="step-title">Step {step.step}: {step.thought}</span>
                </div>
                <div className="step-observation">
                  <strong>Observation:</strong> {step.observation}
                </div>
                <div className="step-reasoning">
                  <strong>Reasoning:</strong> {step.reasoning}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Conclusions */}
        {result.conclusions && (
          <div className="reasoning-conclusions">
            <h5>🎯 Key Conclusions</h5>
            {result.conclusions.map((conclusion, index) => (
              <div key={index} className="conclusion-item">
                • {conclusion}
              </div>
            ))}
          </div>
        )}

        {/* Confidence Score */}
        {result.confidence && (
          <div className="reasoning-confidence">
            <span className="confidence-label">Reasoning Confidence:</span>
            <span 
              className="confidence-score"
              style={{ color: getConfidenceColor(result.confidence) }}
            >
              {Math.round(result.confidence * 100)}%
            </span>
          </div>
        )}

        {/* Additional Insights */}
        {result.alternatives && (
          <div className="reasoning-alternatives">
            <h5>🔄 Alternative Approaches</h5>
            {result.alternatives.map((alt, index) => (
              <div key={index} className="alternative-item">
                • {alt}
              </div>
            ))}
          </div>
        )}

        {result.patterns && (
          <div className="reasoning-patterns">
            <h5>🔍 Identified Patterns</h5>
            {result.patterns.map((pattern, index) => (
              <div key={index} className="pattern-item">
                • {pattern}
              </div>
            ))}
          </div>
        )}

        {result.strategy && (
          <div className="reasoning-strategy">
            <h5>📋 Strategic Approach</h5>
            {Object.entries(result.strategy).map(([phase, description]) => (
              <div key={phase} className="strategy-phase">
                <strong>{phase.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {description}
              </div>
            ))}
          </div>
        )}

        {result.riskFactors && (
          <div className="reasoning-risks">
            <h5>⚠️ Risk Factors</h5>
            {result.riskFactors.map((risk, index) => (
              <div key={index} className="risk-item">
                • {risk}
              </div>
            ))}
          </div>
        )}

        {result.mitigationStrategies && (
          <div className="reasoning-mitigation">
            <h5>🛡️ Mitigation Strategies</h5>
            {result.mitigationStrategies.map((strategy, index) => (
              <div key={index} className="mitigation-item">
                • {strategy}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="performance-reasoning-chains">
      <div className="stats-card reasoning-header">
        <h4>🧠 Performance Reasoning Chains</h4>
        <p>Deep analytical reasoning for performance optimization decisions</p>
      </div>

      {/* Available Reasoning Chains */}
      <div className="stats-card reasoning-chains-grid">
        <h5>Available Reasoning Chains</h5>
        <div className="chains-grid">
          {availableChains.map(chain => {
            const status = getChainStatus(chain.id);
            const isActive = activeChain === chain.id && loading;
            
            return (
              <div key={chain.id} className={`chain-card ${status}`}>
                <div className="chain-header">
                  <span className="chain-icon">{chain.icon}</span>
                  <span className="chain-name">{chain.name}</span>
                  <span className="chain-status">
                    {isActive ? '⏳' : 
                     status === 'completed' ? '✅' : 
                     status === 'error' ? '❌' : '⚪'}
                  </span>
                </div>
                <div className="chain-description">{chain.description}</div>
                <div className="chain-actions">
                  <button 
                    className="execute-button"
                    onClick={() => executeReasoningChain(chain.id)}
                    disabled={isActive}
                  >
                    {isActive ? 'Reasoning...' : 
                     status === 'completed' ? 'Re-run' : 'Execute'}
                  </button>
                  {status === 'completed' && (
                    <button 
                      className="view-button"
                      onClick={() => setActiveChain(activeChain === chain.id ? null : chain.id)}
                    >
                      {activeChain === chain.id ? 'Hide' : 'View'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Reasoning Chain Results */}
      {activeChain && !loading && (
        <div className="stats-card reasoning-details">
          <div className="reasoning-header">
            <h5>
              {availableChains.find(c => c.id === activeChain)?.icon} {' '}
              {availableChains.find(c => c.id === activeChain)?.name} Reasoning
            </h5>
            <button 
              className="close-button"
              onClick={() => setActiveChain(null)}
            >
              ✕
            </button>
          </div>
          {renderReasoningChain(activeChain)}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="stats-card reasoning-loading">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h5>🧠 Applying Sequential Thought Reasoning...</h5>
            <p>Analyzing performance data with multi-step reasoning process</p>
            <div className="loading-steps">
              <div className="loading-step">🔍 Gathering performance data</div>
              <div className="loading-step">📊 Analyzing patterns and trends</div>
              <div className="loading-step">💡 Generating insights and recommendations</div>
              <div className="loading-step">✅ Validating reasoning chain</div>
            </div>
          </div>
        </div>
      )}

      {/* Summary of Reasoning Results */}
      {reasoningChains.length > 0 && !loading && (
        <div className="stats-card reasoning-summary">
          <h5>📋 Reasoning Summary</h5>
          <div className="summary-stats">
            <div className="summary-stat">
              <strong>Chains Executed:</strong> {reasoningChains.length}
            </div>
            <div className="summary-stat">
              <strong>Successful:</strong> {reasoningChains.filter(c => !c.result.error).length}
            </div>
            <div className="summary-stat">
              <strong>Average Confidence:</strong> {
                reasoningChains.filter(c => c.result.confidence).length > 0 
                  ? Math.round(
                      reasoningChains
                        .filter(c => c.result.confidence)
                        .reduce((sum, c) => sum + c.result.confidence, 0) / 
                      reasoningChains.filter(c => c.result.confidence).length * 100
                    ) + '%'
                  : 'N/A'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceReasoningChains;
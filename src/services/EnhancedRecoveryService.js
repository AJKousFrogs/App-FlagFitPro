/**
 * Enhanced Recovery Service with MCP Integration
 * Provides evidence-based recovery recommendations using Context7 research
 * and Sequential Thought reasoning for injury prevention and recovery optimization
 */

import { mcpService } from './MCPService';
import { sequentialThoughtService } from './SequentialThoughtService';
import { searchLibraryIds } from '../config/context7-mappings';

class EnhancedRecoveryService {
  constructor() {
    this.recoveryProtocols = new Map(); // Cached recovery protocols
    this.injuryPreventionStrategies = new Map(); // Injury prevention cache
    this.researchCache = new Map(); // Recovery science research cache
    this.recoveryMetrics = new Map(); // User recovery metrics
  }

  /**
   * Generate comprehensive recovery plan with MCP enhancement
   * @param {Object} userProfile - User's profile and recovery data
   * @param {Object} trainingLoad - Current and recent training load
   * @param {Object} recoveryGoals - Recovery and performance goals
   * @returns {Promise<Object>} Complete recovery plan with evidence backing
   */
  async generateComprehensiveRecoveryPlan(userProfile, trainingLoad, recoveryGoals) {
    try {
      console.log('😴 Starting comprehensive recovery plan generation with MCP...');

      // Initialize MCP services
      await mcpService.initialize();

      // Step 1: Access latest recovery science documentation
      const recoveryResearch = await this.getLatestRecoveryResearch(recoveryGoals.focusAreas);

      // Step 2: Analyze current recovery status with reasoning
      const recoveryAnalysis = await this.analyzeRecoveryStatus(
        userProfile,
        trainingLoad,
        recoveryResearch
      );

      // Step 3: Implement injury prevention reasoning chains
      const injuryPreventionPlan = await this.generateInjuryPreventionStrategy(
        userProfile,
        trainingLoad,
        recoveryAnalysis
      );

      // Step 4: Create evidence-based recovery protocols
      const recoveryProtocols = await this.generateEvidenceBasedProtocols(
        recoveryAnalysis,
        recoveryResearch,
        userProfile.preferences
      );

      // Step 5: Generate personalized recovery schedule
      const recoverySchedule = await this.createPersonalizedRecoverySchedule(
        recoveryProtocols,
        trainingLoad.schedule,
        userProfile.lifestyle
      );

      // Step 6: Create monitoring and adjustment plan
      const monitoringPlan = await this.createRecoveryMonitoringPlan(
        recoveryAnalysis,
        recoveryGoals
      );

      return {
        timestamp: new Date().toISOString(),
        userId: userProfile.id,
        recoveryPlan: {
          currentStatus: recoveryAnalysis,
          protocols: recoveryProtocols,
          injuryPrevention: injuryPreventionPlan,
          schedule: recoverySchedule,
          monitoring: monitoringPlan,
          researchBacking: recoveryResearch,
          confidence: this.calculatePlanConfidence(recoveryResearch, recoveryAnalysis),
          evidenceLevel: recoveryResearch ? 'high' : 'moderate'
        },
        recommendations: this.generatePrioritizedRecoveryRecommendations(
          recoveryAnalysis,
          recoveryProtocols,
          injuryPreventionPlan
        ),
        nextReviewDate: this.calculateNextRecoveryReview(recoveryGoals.timeline),
        emergencyProtocols: this.generateEmergencyRecoveryProtocols(userProfile)
      };

    } catch (error) {
      console.error('Comprehensive recovery plan generation error:', error);
      return this.getFallbackRecoveryPlan(userProfile, trainingLoad, recoveryGoals);
    }
  }

  /**
   * Access latest recovery science documentation via Context7
   */
  async getLatestRecoveryResearch(focusAreas = ['general-recovery']) {
    const cacheKey = `recovery-research-${focusAreas.join('-')}`;
    
    if (this.researchCache.has(cacheKey)) {
      const cached = this.researchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.data;
      }
    }

    try {
      if (!mcpService.getConnectionStatus().servers?.context7) {
        console.warn('Context7 not available for recovery research');
        return null;
      }

      // Get relevant library IDs for recovery research
      const recoveryTopics = [
        'recovery-methods',
        'sleep-performance', 
        'active-recovery',
        'cold-therapy',
        'heat-therapy',
        'massage-therapy',
        'stretching',
        'foam-rolling',
        'injury-prevention'
      ];

      const relevantTopics = focusAreas.length > 1 ? focusAreas : recoveryTopics.slice(0, 4);
      
      const libraryIds = relevantTopics.flatMap(topic => searchLibraryIds(topic));
      const researchPromises = libraryIds.slice(0, 4).map(id => 
        mcpService.getLibraryDocs(id)
      );

      const researchResults = await Promise.allSettled(researchPromises);
      const successfulResults = researchResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      const combinedResearch = {
        protocols: [],
        recommendations: [],
        techniques: [],
        contraindications: [],
        evidenceLevel: [],
        sources: [],
        lastUpdated: new Date().toISOString()
      };

      successfulResults.forEach(result => {
        if (result.content) {
          combinedResearch.protocols.push(...(result.content.protocols || []));
          combinedResearch.recommendations.push(...(result.content.recommendations || []));
          combinedResearch.techniques.push(...(result.content.techniques || []));
          combinedResearch.contraindications.push(...(result.content.contraindications || []));
          combinedResearch.evidenceLevel.push(...(result.content.evidenceLevel || []));
          combinedResearch.sources.push(...(result.content.sources || []));
        }
      });

      // Cache the results
      this.researchCache.set(cacheKey, {
        data: combinedResearch,
        timestamp: Date.now()
      });

      console.log(`📚 Retrieved ${combinedResearch.recommendations.length} evidence-based recovery recommendations`);
      return combinedResearch;

    } catch (error) {
      console.error('Error fetching recovery research:', error);
      return null;
    }
  }

  /**
   * Analyze current recovery status with Sequential Thought reasoning
   */
  async analyzeRecoveryStatus(userProfile, trainingLoad, recoveryResearch) {
    try {
      const recoveryMetrics = this.calculateBaseRecoveryMetrics(userProfile, trainingLoad);
      
      // Use Sequential Thought for complex recovery analysis
      let reasoningAnalysis = null;
      if (mcpService.getConnectionStatus().servers?.sequentialThought) {
        try {
          reasoningAnalysis = await sequentialThoughtService.performReasoning(
            'recovery-optimization',
            {
              userProfile: {
                age: userProfile.age,
                fitnessLevel: userProfile.fitnessLevel,
                sleepHabits: userProfile.sleepHabits,
                stressLevel: userProfile.stressLevel,
                recoveryHistory: userProfile.recoveryHistory
              },
              trainingLoad: {
                weeklyVolume: trainingLoad.weeklyVolume,
                intensity: trainingLoad.averageIntensity,
                frequency: trainingLoad.sessionsPerWeek,
                recentChanges: trainingLoad.recentChanges
              },
              currentMetrics: recoveryMetrics,
              researchGuidelines: recoveryResearch?.recommendations || []
            },
            { depth: 3, includeAlternatives: true }
          );

          console.log('🧠 Applied sequential reasoning to recovery analysis');
        } catch (error) {
          console.warn('Recovery reasoning failed:', error.message);
        }
      }

      return {
        baseMetrics: recoveryMetrics,
        reasoning: reasoningAnalysis,
        overallStatus: this.determineOverallRecoveryStatus(recoveryMetrics, reasoningAnalysis),
        riskFactors: this.identifyRecoveryRiskFactors(recoveryMetrics, userProfile),
        strengths: this.identifyRecoveryStrengths(recoveryMetrics, userProfile),
        priorityAreas: this.identifyPriorityRecoveryAreas(recoveryMetrics, reasoningAnalysis),
        researchAlignment: this.assessResearchAlignment(recoveryMetrics, recoveryResearch)
      };

    } catch (error) {
      console.error('Recovery status analysis error:', error);
      return this.getBasicRecoveryAnalysis(userProfile, trainingLoad);
    }
  }

  /**
   * Calculate base recovery metrics
   */
  calculateBaseRecoveryMetrics(userProfile, trainingLoad) {
    const metrics = {};

    // Sleep Quality Score (0-100)
    const sleepData = userProfile.sleepData || {};
    metrics.sleepScore = this.calculateSleepScore(sleepData);

    // Stress and Wellness Score (0-100)
    metrics.stressScore = this.calculateStressScore(userProfile.stressLevel, userProfile.wellness);

    // Training Load vs Recovery Balance (0-100)
    metrics.loadBalanceScore = this.calculateLoadBalanceScore(trainingLoad, userProfile);

    // Physical Recovery Indicators (0-100)
    metrics.physicalRecoveryScore = this.calculatePhysicalRecoveryScore(userProfile);

    // Overall Recovery Score (0-100)
    metrics.overallScore = Math.round(
      (metrics.sleepScore * 0.35 + 
       metrics.stressScore * 0.25 + 
       metrics.loadBalanceScore * 0.25 + 
       metrics.physicalRecoveryScore * 0.15)
    );

    return metrics;
  }

  calculateSleepScore(sleepData) {
    const {
      averageHours = 7,
      quality = 5,
      consistency = 5,
      efficiency = 85
    } = sleepData;

    let score = 0;
    
    // Hours of sleep (40% weight)
    if (averageHours >= 8) score += 40;
    else if (averageHours >= 7) score += 30;
    else if (averageHours >= 6) score += 20;
    else score += 10;

    // Sleep quality (30% weight)
    score += (quality / 10) * 30;

    // Sleep consistency (20% weight)
    score += (consistency / 10) * 20;

    // Sleep efficiency (10% weight)
    score += (efficiency / 100) * 10;

    return Math.round(Math.min(score, 100));
  }

  calculateStressScore(stressLevel = 5, wellness = {}) {
    let score = 100;

    // Stress level impact (60% weight)
    score -= (stressLevel * 6);

    // Wellness factors (40% weight)
    const {
      mood = 5,
      energy = 5,
      motivation = 5
    } = wellness;

    const wellnessAvg = (mood + energy + motivation) / 3;
    score = (score * 0.6) + (wellnessAvg * 4);

    return Math.round(Math.max(0, Math.min(score, 100)));
  }

  calculateLoadBalanceScore(trainingLoad, userProfile) {
    const {
      weeklyVolume = 0,
      averageIntensity = 5,
      sessionsPerWeek = 3
    } = trainingLoad;

    const totalLoadScore = (weeklyVolume * averageIntensity * sessionsPerWeek) / 100;
    const recoveryCapacity = this.estimateRecoveryCapacity(userProfile);
    
    const ratio = totalLoadScore / recoveryCapacity;
    
    if (ratio <= 0.8) return 100; // Under-loaded
    if (ratio <= 1.0) return 85; // Well balanced
    if (ratio <= 1.2) return 70; // Slightly over-loaded
    if (ratio <= 1.5) return 50; // Over-loaded
    return 25; // Severely over-loaded
  }

  estimateRecoveryCapacity(userProfile) {
    let capacity = 50; // Base capacity

    // Age factor
    if (userProfile.age < 25) capacity += 15;
    else if (userProfile.age < 35) capacity += 10;
    else if (userProfile.age < 45) capacity += 5;
    else capacity -= 5;

    // Fitness level factor
    const fitnessMultiplier = {
      'beginner': 0.8,
      'intermediate': 1.0,
      'advanced': 1.2,
      'expert': 1.4
    };
    capacity *= (fitnessMultiplier[userProfile.fitnessLevel] || 1.0);

    // Sleep quality factor
    const sleepScore = this.calculateSleepScore(userProfile.sleepData || {});
    capacity *= (sleepScore / 100);

    return capacity;
  }

  calculatePhysicalRecoveryScore(userProfile) {
    const {
      muscleSoreness = 3,
      jointStiffness = 3,
      energyLevel = 7,
      motivation = 7
    } = userProfile.physicalMetrics || {};

    let score = 100;

    // Higher soreness/stiffness = lower score
    score -= (muscleSoreness * 8);
    score -= (jointStiffness * 8);

    // Higher energy/motivation = higher score
    score = (score * 0.7) + ((energyLevel + motivation) / 2) * 3;

    return Math.round(Math.max(0, Math.min(score, 100)));
  }

  /**
   * Generate injury prevention strategy with Sequential Thought reasoning
   */
  async generateInjuryPreventionStrategy(userProfile, trainingLoad, recoveryAnalysis) {
    try {
      // Identify injury risk factors
      const riskFactors = this.identifyInjuryRiskFactors(userProfile, trainingLoad, recoveryAnalysis);
      
      // Use Sequential Thought for comprehensive injury prevention reasoning
      let preventionReasoning = null;
      if (mcpService.getConnectionStatus().servers?.sequentialThought) {
        try {
          preventionReasoning = await sequentialThoughtService.performReasoning(
            'injury-risk',
            {
              riskFactors,
              userProfile: {
                age: userProfile.age,
                injuryHistory: userProfile.injuryHistory || [],
                movement: userProfile.movementScreen || {},
                sport: 'flag-football'
              },
              trainingLoad,
              recoveryStatus: recoveryAnalysis.overallStatus
            },
            { depth: 3 }
          );

          console.log('🧠 Applied injury prevention reasoning');
        } catch (error) {
          console.warn('Injury prevention reasoning failed:', error.message);
        }
      }

      return {
        riskLevel: this.calculateOverallInjuryRisk(riskFactors, preventionReasoning),
        riskFactors,
        preventionStrategies: this.generatePreventionStrategies(riskFactors, preventionReasoning),
        movementCorrections: this.generateMovementCorrections(userProfile, riskFactors),
        strengtheningSuggestions: this.generateStrengtheningProtocol(riskFactors),
        mobilityWork: this.generateMobilityProtocol(riskFactors),
        loadManagement: this.generateLoadManagementStrategy(trainingLoad, recoveryAnalysis),
        reasoning: preventionReasoning,
        monitoringMarkers: this.getInjuryPreventionMarkers(riskFactors)
      };

    } catch (error) {
      console.error('Injury prevention strategy error:', error);
      return this.getBasicInjuryPrevention(userProfile, trainingLoad);
    }
  }

  /**
   * Identify injury risk factors
   */
  identifyInjuryRiskFactors(userProfile, trainingLoad, recoveryAnalysis) {
    const riskFactors = [];

    // Age-related risk
    if (userProfile.age > 35) {
      riskFactors.push({
        factor: 'Age-related risk',
        level: userProfile.age > 45 ? 'high' : 'moderate',
        description: 'Increased injury risk with age due to tissue changes'
      });
    }

    // Previous injury history
    if (userProfile.injuryHistory?.length > 0) {
      riskFactors.push({
        factor: 'Previous injury history',
        level: userProfile.injuryHistory.length > 2 ? 'high' : 'moderate',
        description: 'History of injuries increases re-injury risk'
      });
    }

    // Training load concerns
    if (recoveryAnalysis.baseMetrics.loadBalanceScore < 70) {
      riskFactors.push({
        factor: 'Training load imbalance',
        level: recoveryAnalysis.baseMetrics.loadBalanceScore < 50 ? 'high' : 'moderate',
        description: 'Training load exceeds recovery capacity'
      });
    }

    // Recovery deficits
    if (recoveryAnalysis.baseMetrics.overallScore < 70) {
      riskFactors.push({
        factor: 'Poor recovery status',
        level: recoveryAnalysis.baseMetrics.overallScore < 50 ? 'high' : 'moderate',
        description: 'Inadequate recovery increases injury susceptibility'
      });
    }

    // Movement screen issues
    if (userProfile.movementScreen?.score < 14) {
      riskFactors.push({
        factor: 'Movement dysfunction',
        level: userProfile.movementScreen.score < 10 ? 'high' : 'moderate',
        description: 'Movement compensations and asymmetries'
      });
    }

    // Sport-specific risks for flag football
    riskFactors.push({
      factor: 'Flag football cutting movements',
      level: 'moderate',
      description: 'Rapid direction changes stress ankle and knee joints'
    });

    return riskFactors;
  }

  /**
   * Generate evidence-based recovery protocols
   */
  async generateEvidenceBasedProtocols(recoveryAnalysis, recoveryResearch, preferences) {
    const protocols = {
      sleep: this.generateSleepProtocol(recoveryAnalysis, recoveryResearch),
      activeRecovery: this.generateActiveRecoveryProtocol(recoveryAnalysis, preferences),
      passiveRecovery: this.generatePassiveRecoveryProtocol(recoveryAnalysis, recoveryResearch),
      nutritionTiming: this.generateRecoveryNutritionProtocol(recoveryAnalysis),
      stressManagement: this.generateStressManagementProtocol(recoveryAnalysis),
      recoveryModalities: this.generateRecoveryModalityProtocol(recoveryResearch, preferences)
    };

    // Add research citations if available
    if (recoveryResearch) {
      protocols.citations = recoveryResearch.sources.slice(0, 5);
      protocols.evidenceBased = true;
    }

    return protocols;
  }

  generateSleepProtocol(recoveryAnalysis, recoveryResearch) {
    const sleepScore = recoveryAnalysis.baseMetrics.sleepScore;
    
    const protocol = {
      targetHours: sleepScore < 70 ? '8-9 hours' : '7-8 hours',
      bedtimeRoutine: [
        'Consistent bedtime within 30 minutes each night',
        'No screens 1 hour before bed',
        'Room temperature 65-68°F (18-20°C)',
        'Dark, quiet environment'
      ],
      sleepHygiene: [
        'No caffeine after 2 PM',
        'Limit alcohol consumption',
        'Regular exercise, but not within 3 hours of bedtime',
        'Comfortable mattress and pillows'
      ],
      improvements: []
    };

    if (sleepScore < 70) {
      protocol.improvements = [
        'Prioritize sleep duration - aim for 8+ hours',
        'Improve sleep environment optimization',
        'Consider sleep tracking for accountability',
        'Evaluate and address potential sleep disorders'
      ];
    }

    // Add research-based recommendations
    if (recoveryResearch?.recommendations) {
      const sleepRecommendations = recoveryResearch.recommendations
        .filter(rec => rec.toLowerCase().includes('sleep'))
        .slice(0, 2);
      protocol.researchRecommendations = sleepRecommendations;
    }

    return protocol;
  }

  generateActiveRecoveryProtocol(recoveryAnalysis, preferences) {
    const loadScore = recoveryAnalysis.baseMetrics.loadBalanceScore;
    
    return {
      frequency: loadScore < 70 ? 'Daily light activity' : '3-4 times per week',
      activities: [
        'Light walking (20-30 minutes)',
        'Easy swimming or water jogging',
        'Gentle yoga or stretching',
        'Low-intensity cycling',
        'Mobility and breathing exercises'
      ],
      intensity: 'RPE 3-4 out of 10 (conversational pace)',
      duration: '20-45 minutes',
      timing: 'On rest days or as post-workout cool-down',
      benefits: [
        'Enhances blood flow and nutrient delivery',
        'Reduces muscle stiffness and soreness',
        'Promotes psychological recovery',
        'Maintains movement quality'
      ],
      modifications: preferences?.preferredActivities ? 
        `Focus on: ${preferences.preferredActivities.join(', ')}` : null
    };
  }

  generatePassiveRecoveryProtocol(recoveryAnalysis, recoveryResearch) {
    const physicalScore = recoveryAnalysis.baseMetrics.physicalRecoveryScore;
    
    const protocol = {
      restDays: physicalScore < 70 ? '2-3 per week' : '1-2 per week',
      techniques: [
        'Complete rest from structured exercise',
        'Gentle stretching or foam rolling',
        'Massage or self-massage',
        'Heat therapy (sauna, warm bath)',
        'Cold therapy (ice bath, cold shower)',
        'Meditation or mindfulness practice'
      ],
      scheduling: [
        'Plan rest days after high-intensity sessions',
        'Take complete rest if recovery score < 60',
        'Listen to body signals and adjust as needed'
      ]
    };

    // Add evidence-based modalities
    if (recoveryResearch?.techniques) {
      protocol.evidenceBasedTechniques = recoveryResearch.techniques
        .filter(tech => tech.toLowerCase().includes('passive') || 
                       tech.toLowerCase().includes('rest'))
        .slice(0, 3);
    }

    return protocol;
  }

  generateRecoveryNutritionProtocol(recoveryAnalysis) {
    return {
      postWorkout: {
        timing: 'Within 2 hours of training',
        protein: '20-25g high-quality protein',
        carbohydrates: '30-60g depending on session intensity',
        fluids: 'Replace 150% of fluid losses',
        examples: [
          'Chocolate milk + banana',
          'Protein smoothie with berries',
          'Greek yogurt with granola'
        ]
      },
      antiInflammatory: [
        'Omega-3 rich foods (salmon, walnuts)',
        'Antioxidant-rich berries and vegetables',
        'Tart cherry juice for sleep and recovery',
        'Turmeric and ginger for inflammation'
      ],
      hydration: {
        daily: 'Minimum 35ml per kg body weight',
        training: 'Additional 500-750ml per hour of exercise',
        monitoring: 'Urine color should be pale yellow'
      },
      timing: {
        preWorkout: 'Light meal 2-3 hours before, snack 30-60 minutes before',
        postWorkout: 'Recovery nutrition within 30-120 minutes',
        throughout: 'Consistent meal timing to support circadian rhythms'
      }
    };
  }

  generateStressManagementProtocol(recoveryAnalysis) {
    const stressScore = recoveryAnalysis.baseMetrics.stressScore;
    
    const protocol = {
      priority: stressScore < 70 ? 'High - stress negatively impacting recovery' : 'Moderate - maintenance focus',
      techniques: [
        'Deep breathing exercises (4-7-8 technique)',
        'Progressive muscle relaxation',
        'Mindfulness meditation (10-20 minutes daily)',
        'Journaling or gratitude practice',
        'Nature exposure and outdoor time'
      ],
      lifestyle: [
        'Establish work-life boundaries',
        'Prioritize social connections',
        'Limit exposure to stressors when possible',
        'Practice time management and organization'
      ],
      warning_signs: [
        'Persistent fatigue despite adequate sleep',
        'Decreased motivation for training',
        'Increased injury susceptibility',
        'Mood changes or irritability'
      ]
    };

    if (stressScore < 50) {
      protocol.urgent_recommendations = [
        'Consider professional stress counseling',
        'Evaluate training load reduction',
        'Prioritize stress management over performance',
        'Monitor for signs of overtraining syndrome'
      ];
    }

    return protocol;
  }

  generateRecoveryModalityProtocol(recoveryResearch, preferences) {
    const modalities = {
      coldTherapy: {
        method: 'Cold water immersion or ice baths',
        protocol: '10-15 minutes at 50-59°F (10-15°C)',
        timing: 'Within 1 hour post-exercise',
        benefits: 'Reduces inflammation and muscle soreness',
        contraindications: 'Avoid if trying to maximize strength gains'
      },
      heatTherapy: {
        method: 'Sauna or hot bath',
        protocol: '15-20 minutes at 158-176°F (70-80°C) for sauna',
        timing: 'Separate from training by at least 6 hours',
        benefits: 'Improves circulation and promotes relaxation',
        contraindications: 'Avoid when dehydrated or immediately post-exercise'
      },
      massage: {
        method: 'Sports massage or self-massage',
        protocol: '30-60 minutes focusing on worked muscle groups',
        timing: '24-48 hours after intense training',
        benefits: 'Reduces muscle tension and promotes circulation',
        selfCare: 'Foam rolling or massage gun for 10-15 minutes'
      },
      compression: {
        method: 'Compression garments or pneumatic compression',
        protocol: 'Wear for 2-4 hours post-exercise',
        benefits: 'May enhance venous return and reduce swelling',
        note: 'Evidence is mixed - use if subjectively helpful'
      }
    };

    // Filter based on research recommendations
    if (recoveryResearch?.techniques) {
      modalities.researchSupported = recoveryResearch.techniques
        .filter(tech => Object.keys(modalities).some(mod => 
          tech.toLowerCase().includes(mod.toLowerCase())
        ));
    }

    // Add preference-based recommendations
    if (preferences?.preferredModalities) {
      modalities.recommended = preferences.preferredModalities
        .filter(pref => modalities[pref])
        .map(pref => modalities[pref]);
    }

    return modalities;
  }

  /**
   * Generate other required methods for complete recovery service
   */
  
  determineOverallRecoveryStatus(metrics, reasoning) {
    const score = metrics.overallScore;
    
    if (score >= 85) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 65) return 'Fair';
    if (score >= 50) return 'Poor';
    return 'Critical';
  }

  identifyRecoveryRiskFactors(metrics, userProfile) {
    const risks = [];
    
    if (metrics.sleepScore < 70) risks.push('Poor sleep quality');
    if (metrics.stressScore < 60) risks.push('High stress levels');
    if (metrics.loadBalanceScore < 70) risks.push('Training load imbalance');
    if (userProfile.age > 40) risks.push('Age-related recovery decline');
    
    return risks;
  }

  identifyRecoveryStrengths(metrics, userProfile) {
    const strengths = [];
    
    if (metrics.sleepScore >= 80) strengths.push('Excellent sleep habits');
    if (metrics.stressScore >= 80) strengths.push('Good stress management');
    if (metrics.loadBalanceScore >= 80) strengths.push('Well-balanced training load');
    if (userProfile.fitnessLevel === 'advanced') strengths.push('High fitness level');
    
    return strengths;
  }

  identifyPriorityRecoveryAreas(metrics, reasoning) {
    const priorities = [];
    
    const scores = [
      { area: 'Sleep', score: metrics.sleepScore },
      { area: 'Stress Management', score: metrics.stressScore },
      { area: 'Load Management', score: metrics.loadBalanceScore },
      { area: 'Physical Recovery', score: metrics.physicalRecoveryScore }
    ];
    
    return scores
      .filter(item => item.score < 75)
      .sort((a, b) => a.score - b.score)
      .map(item => item.area)
      .slice(0, 3);
  }

  assessResearchAlignment(metrics, research) {
    if (!research) return null;
    
    return {
      aligned: research.recommendations.length > 0,
      recommendations: research.recommendations.slice(0, 3),
      evidenceLevel: 'moderate-to-high'
    };
  }

  calculateOverallInjuryRisk(riskFactors, reasoning) {
    const highRiskCount = riskFactors.filter(rf => rf.level === 'high').length;
    const moderateRiskCount = riskFactors.filter(rf => rf.level === 'moderate').length;
    
    if (highRiskCount >= 2) return 'High';
    if (highRiskCount >= 1 || moderateRiskCount >= 3) return 'Moderate';
    if (moderateRiskCount >= 1) return 'Low-Moderate';
    return 'Low';
  }

  generatePreventionStrategies(riskFactors, reasoning) {
    const strategies = [];
    
    riskFactors.forEach(risk => {
      switch (risk.factor) {
        case 'Training load imbalance':
          strategies.push('Implement periodized training with adequate recovery');
          break;
        case 'Poor recovery status':
          strategies.push('Prioritize sleep and stress management');
          break;
        case 'Movement dysfunction':
          strategies.push('Address movement patterns with corrective exercises');
          break;
        case 'Flag football cutting movements':
          strategies.push('Strengthen glutes and implement agility progression');
          break;
      }
    });
    
    return [...new Set(strategies)]; // Remove duplicates
  }

  generateMovementCorrections(userProfile, riskFactors) {
    return [
      'Hip flexor stretching and strengthening',
      'Ankle mobility and stability work',
      'Core stabilization exercises',
      'Single-leg balance and proprioception training'
    ];
  }

  generateStrengtheningProtocol(riskFactors) {
    return {
      frequency: '2-3 times per week',
      exercises: [
        'Glute bridges and clamshells',
        'Single-leg deadlifts',
        'Lateral band walks',
        'Calf raises and ankle circles',
        'Planks and side planks'
      ],
      progression: 'Start with bodyweight, progress to resistance'
    };
  }

  generateMobilityProtocol(riskFactors) {
    return {
      frequency: 'Daily, especially before training',
      routine: [
        'Dynamic warm-up (10 minutes)',
        'Hip circles and leg swings',
        'Ankle circles and calf stretches',
        'Shoulder rolls and arm circles',
        'Gentle spinal movements'
      ],
      postWorkout: [
        'Static stretching (15-20 minutes)',
        'Focus on worked muscle groups',
        'Hold stretches for 30-60 seconds'
      ]
    };
  }

  generateLoadManagementStrategy(trainingLoad, recoveryAnalysis) {
    const loadScore = recoveryAnalysis.baseMetrics.loadBalanceScore;
    
    if (loadScore < 50) {
      return {
        recommendation: 'Reduce training load by 20-30%',
        focus: 'Prioritize recovery over performance temporarily',
        monitoring: 'Daily recovery score tracking'
      };
    } else if (loadScore < 70) {
      return {
        recommendation: 'Maintain current load with enhanced recovery',
        focus: 'Optimize recovery protocols',
        monitoring: 'Weekly recovery assessment'
      };
    } else {
      return {
        recommendation: 'Current load is well-tolerated',
        focus: 'Maintain balance and monitor for changes',
        monitoring: 'Bi-weekly recovery check-ins'
      };
    }
  }

  getInjuryPreventionMarkers(riskFactors) {
    return [
      'Morning stiffness and soreness levels',
      'Energy and motivation for training',
      'Sleep quality and duration',
      'Any new aches or pains',
      'Training performance consistency'
    ];
  }

  // Additional helper methods...
  
  createPersonalizedRecoverySchedule(protocols, trainingSchedule, lifestyle) {
    return {
      daily: protocols.sleep.bedtimeRoutine.concat([
        'Morning movement routine (10 min)',
        'Stress check-in and breathing exercise',
        'Hydration monitoring'
      ]),
      postTraining: [
        'Cool-down and stretching (15 min)',
        'Recovery nutrition within 2 hours',
        'Recovery modality if available'
      ],
      restDays: protocols.activeRecovery.activities.slice(0, 2).concat([
        'Extended mobility work (30 min)',
        'Stress management practice',
        'Recovery planning for next training block'
      ]),
      weekly: [
        'Recovery protocol review and adjustment',
        'Body composition and wellness check',
        'Training load and recovery balance assessment'
      ]
    };
  }

  createRecoveryMonitoringPlan(recoveryAnalysis, recoveryGoals) {
    return {
      daily: [
        'Sleep duration and quality rating (1-10)',
        'Morning energy level (1-10)',
        'Muscle soreness and stiffness (1-10)',
        'Stress and mood assessment (1-10)',
        'Hydration status (urine color)'
      ],
      weekly: [
        'Overall recovery score calculation',
        'Training performance trends',  
        'Body weight and composition',
        'Recovery protocol adherence review'
      ],
      monthly: [
        'Comprehensive recovery assessment',
        'Goal progress evaluation',
        'Protocol adjustments and optimization',
        'Long-term trend analysis'
      ],
      alertThresholds: {
        dailyRecoveryBelow: 60,
        consecutivePoorDays: 3,
        performanceDecline: '10% over 2 weeks',
        sleepQualityBelow: 6
      }
    };
  }

  generatePrioritizedRecoveryRecommendations(analysis, protocols, injuryPrevention) {
    const recommendations = [];
    
    // Priority 1: Critical recovery areas
    if (analysis.baseMetrics.overallScore < 60) {
      recommendations.push({
        priority: 1,
        category: 'Critical Recovery',
        action: 'Immediately prioritize sleep and reduce training load',
        timeline: 'Start today',
        rationale: 'Poor recovery increases injury risk and impairs performance'
      });
    }
    
    // Priority 2: Sleep optimization
    if (analysis.baseMetrics.sleepScore < 75) {
      recommendations.push({
        priority: 2,
        category: 'Sleep Optimization',
        action: `Implement sleep protocol: ${protocols.sleep.targetHours} nightly`,
        timeline: 'This week',
        rationale: 'Sleep is the foundation of all recovery processes'
      });
    }
    
    // Priority 3: Injury prevention
    if (injuryPrevention.riskLevel === 'High' || injuryPrevention.riskLevel === 'Moderate') {
      recommendations.push({
        priority: 3,
        category: 'Injury Prevention',
        action: 'Begin movement corrections and strengthening protocol',
        timeline: '1-2 weeks',
        rationale: 'Address movement dysfunctions before they lead to injury'
      });
    }
    
    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  calculateNextRecoveryReview(timeline) {
    const weeks = timeline === 'short-term' ? 1 : timeline === 'long-term' ? 4 : 2;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + (weeks * 7));
    return nextReview.toISOString();
  }

  generateEmergencyRecoveryProtocols(userProfile) {
    return {
      acuteOverreaching: {
        symptoms: ['Persistent fatigue', 'Declining performance', 'Mood changes'],
        protocol: ['Reduce training by 50%', 'Focus on sleep and nutrition', 'Consider medical consultation'],
        duration: '1-2 weeks'
      },
      injuryWarning: {
        symptoms: ['New pain or discomfort', 'Movement restrictions', 'Swelling'],
        protocol: ['Stop training immediately', 'Apply RICE protocol', 'Seek medical evaluation'],
        followUp: 'Do not return to training without clearance'
      },
      burnout: {
        symptoms: ['Loss of motivation', 'Chronic fatigue', 'Emotional exhaustion'],
        protocol: ['Complete training break', 'Focus on mental health', 'Professional support if needed'],
        duration: 'Until symptoms resolve (weeks to months)'
      }
    };
  }

  calculatePlanConfidence(research, analysis) {
    let confidence = 0.7;
    
    if (research?.recommendations?.length > 0) confidence += 0.15;
    if (analysis?.reasoning && !analysis.reasoning.error) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  getBasicRecoveryAnalysis(userProfile, trainingLoad) {
    const metrics = this.calculateBaseRecoveryMetrics(userProfile, trainingLoad);
    
    return {
      baseMetrics: metrics,
      reasoning: null,
      overallStatus: this.determineOverallRecoveryStatus(metrics, null),
      riskFactors: this.identifyRecoveryRiskFactors(metrics, userProfile),
      strengths: this.identifyRecoveryStrengths(metrics, userProfile),
      priorityAreas: ['Sleep', 'Stress Management', 'Load Management'].slice(0, 2),
      researchAlignment: null
    };
  }

  getBasicInjuryPrevention(userProfile, trainingLoad) {
    const riskFactors = this.identifyInjuryRiskFactors(userProfile, trainingLoad, { baseMetrics: { loadBalanceScore: 70 } });
    
    return {
      riskLevel: this.calculateOverallInjuryRisk(riskFactors, null),
      riskFactors,
      preventionStrategies: ['Focus on movement quality', 'Maintain training consistency', 'Listen to body signals'],
      movementCorrections: this.generateMovementCorrections(userProfile, riskFactors),
      strengtheningSuggestions: this.generateStrengtheningProtocol(riskFactors),
      mobilityWork: this.generateMobilityProtocol(riskFactors),
      reasoning: null,
      monitoringMarkers: this.getInjuryPreventionMarkers(riskFactors)
    };
  }

  async getFallbackRecoveryPlan(userProfile, trainingLoad, recoveryGoals) {
    console.warn('Using fallback recovery plan - MCP services unavailable');
    
    const recoveryAnalysis = this.getBasicRecoveryAnalysis(userProfile, trainingLoad);
    const injuryPrevention = this.getBasicInjuryPrevention(userProfile, trainingLoad);
    const basicProtocols = await this.generateEvidenceBasedProtocols(recoveryAnalysis, null, userProfile.preferences);
    
    return {
      timestamp: new Date().toISOString(),
      userId: userProfile.id,
      recoveryPlan: {
        currentStatus: recoveryAnalysis,
        protocols: basicProtocols,
        injuryPrevention,
        schedule: this.createPersonalizedRecoverySchedule(basicProtocols, trainingLoad.schedule, userProfile.lifestyle),
        monitoring: this.createRecoveryMonitoringPlan(recoveryAnalysis, recoveryGoals),
        researchBacking: null,
        confidence: 0.7,
        evidenceLevel: 'basic'
      },
      recommendations: [
        {
          priority: 1,
          category: 'Foundation',
          action: 'Focus on sleep quality and stress management',
          timeline: 'Start immediately',
          rationale: 'Fundamental recovery principles'
        }
      ],
      nextReviewDate: this.calculateNextRecoveryReview(recoveryGoals.timeline),
      emergencyProtocols: this.generateEmergencyRecoveryProtocols(userProfile),
      fallback: true
    };
  }
}

// Create singleton instance
const enhancedRecoveryService = new EnhancedRecoveryService();

export { enhancedRecoveryService };
export default enhancedRecoveryService;
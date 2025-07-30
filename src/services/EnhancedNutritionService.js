/**
 * Enhanced Nutrition Service with MCP Integration
 * Provides evidence-based nutrition recommendations using Context7 research
 * and Sequential Thought reasoning for complex nutrition decisions
 */

import { mcpService } from './MCPService';
import { sequentialThoughtService } from './SequentialThoughtService';
import { searchLibraryIds } from '../config/context7-mappings';

class EnhancedNutritionService {
  constructor() {
    this.nutritionDatabase = new Map(); // Local nutrition data cache
    this.supplementDatabase = new Map(); // Supplement interaction database
    this.mealPlanCache = new Map(); // Cached meal plans
    this.researchCache = new Map(); // Cached research data
  }

  /**
   * Get comprehensive nutrition analysis with research backing
   * @param {Object} userProfile - User's profile and preferences
   * @param {Object} trainingData - Current training load and schedule
   * @param {Object} goals - Nutrition and performance goals
   * @returns {Promise<Object>} Complete nutrition analysis with research
   */
  async getComprehensiveNutritionAnalysis(userProfile, trainingData, goals) {
    try {
      console.log('🥗 Starting comprehensive nutrition analysis with MCP...');

      // Initialize MCP services
      await mcpService.initialize();

      // Step 1: Get latest nutritional science research
      const researchData = await this.getLatestNutritionResearch(goals.primaryFocus);
      
      // Step 2: Calculate evidence-based nutrition targets
      const nutritionTargets = await this.calculateEvidenceBasedTargets(
        userProfile, 
        trainingData, 
        goals, 
        researchData
      );

      // Step 3: Use Sequential Thought for complex nutrition planning
      const nutritionReasoning = await this.performNutritionReasoning(
        userProfile,
        trainingData,
        goals,
        nutritionTargets
      );

      // Step 4: Generate personalized meal plan with citations
      const mealPlan = await this.generateEvidenceBasedMealPlan(
        nutritionTargets,
        userProfile.preferences,
        researchData
      );

      // Step 5: Check supplement interactions and recommendations
      const supplementAnalysis = await this.analyzeSupplementNeeds(
        nutritionTargets,
        userProfile,
        trainingData
      );

      return {
        timestamp: new Date().toISOString(),
        userId: userProfile.id,
        analysis: {
          nutritionTargets,
          mealPlan,
          supplementAnalysis,
          researchBacking: researchData,
          reasoning: nutritionReasoning,
          confidence: this.calculateAnalysisConfidence(researchData, nutritionReasoning),
          evidenceQuality: researchData ? 'high' : 'moderate'
        },
        recommendations: this.generatePrioritizedRecommendations(
          nutritionTargets,
          mealPlan,
          supplementAnalysis,
          nutritionReasoning
        ),
        monitoringPlan: this.createNutritionMonitoringPlan(userProfile, goals),
        nextReviewDate: this.calculateNextReviewDate(goals.timeframe)
      };

    } catch (error) {
      console.error('Comprehensive nutrition analysis error:', error);
      return this.getFallbackNutritionAnalysis(userProfile, trainingData, goals);
    }
  }

  /**
   * Get latest nutritional science research via Context7
   */
  async getLatestNutritionResearch(focus) {
    const cacheKey = `nutrition-research-${focus}`;
    
    if (this.researchCache.has(cacheKey)) {
      const cached = this.researchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.data;
      }
    }

    try {
      if (!mcpService.getConnectionStatus().servers?.context7) {
        console.warn('Context7 not available for nutrition research');
        return null;
      }

      // Get relevant library IDs for nutrition research
      const libraryIds = searchLibraryIds(focus);
      const researchPromises = libraryIds.slice(0, 3).map(id => 
        mcpService.getLibraryDocs(id)
      );

      const researchResults = await Promise.allSettled(researchPromises);
      const successfulResults = researchResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      const combinedResearch = {
        guidelines: [],
        recommendations: [],
        evidenceLevel: [],
        sources: [],
        lastUpdated: new Date().toISOString()
      };

      successfulResults.forEach(result => {
        if (result.content) {
          combinedResearch.guidelines.push(...(result.content.guidelines || []));
          combinedResearch.recommendations.push(...(result.content.recommendations || []));
          combinedResearch.evidenceLevel.push(...(result.content.evidenceLevel || []));
          combinedResearch.sources.push(...(result.content.sources || []));
        }
      });

      // Cache the results
      this.researchCache.set(cacheKey, {
        data: combinedResearch,
        timestamp: Date.now()
      });

      console.log(`📚 Retrieved ${combinedResearch.recommendations.length} evidence-based nutrition recommendations`);
      return combinedResearch;

    } catch (error) {
      console.error('Error fetching nutrition research:', error);
      return null;
    }
  }

  /**
   * Calculate evidence-based nutrition targets
   */
  async calculateEvidenceBasedTargets(userProfile, trainingData, goals, researchData) {
    const baseTargets = this.calculateBaseTargets(userProfile, trainingData);
    
    if (!researchData) {
      return baseTargets;
    }

    // Apply research-based adjustments
    const adjustedTargets = { ...baseTargets };

    // Protein adjustments based on latest research
    const proteinResearch = researchData.recommendations.find(rec => 
      rec.toLowerCase().includes('protein')
    );
    if (proteinResearch) {
      adjustedTargets.protein = Math.max(
        adjustedTargets.protein,
        userProfile.weight * 1.6 // Minimum from research
      );
    }

    // Carbohydrate timing based on research
    const carbResearch = researchData.recommendations.find(rec => 
      rec.toLowerCase().includes('carbohydrate') || rec.toLowerCase().includes('timing')
    );
    if (carbResearch) {
      adjustedTargets.carbTiming = {
        preWorkout: adjustedTargets.carbs * 0.3,
        postWorkout: adjustedTargets.carbs * 0.4,
        other: adjustedTargets.carbs * 0.3
      };
    }

    // Hydration based on latest guidelines
    const hydrationResearch = researchData.recommendations.find(rec => 
      rec.toLowerCase().includes('hydration') || rec.toLowerCase().includes('fluid')
    );
    if (hydrationResearch) {
      adjustedTargets.hydration = Math.max(
        35 * userProfile.weight / 1000, // ml per kg body weight
        2.5 // minimum liters
      );
    }

    adjustedTargets.researchAdjusted = true;
    adjustedTargets.adjustmentSources = researchData.sources.slice(0, 3);

    return adjustedTargets;
  }

  /**
   * Calculate basic nutrition targets without research
   */
  calculateBaseTargets(userProfile, trainingData) {
    const { weight, height, age, gender, activityLevel } = userProfile;
    const { avgIntensity = 6, sessionsPerWeek = 3, avgDuration = 60 } = trainingData;

    // Calculate BMR using Mifflin-St Jeor equation
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Calculate activity factor
    const trainingLoad = (sessionsPerWeek * avgDuration * avgIntensity) / 100;
    const activityFactor = 1.2 + (trainingLoad / 1000); // Base + training adjustment

    const totalCalories = Math.round(bmr * activityFactor);

    return {
      calories: totalCalories,
      protein: Math.round(weight * 1.4), // g per kg body weight
      carbs: Math.round(totalCalories * 0.45 / 4), // 45% of calories
      fat: Math.round(totalCalories * 0.25 / 9), // 25% of calories
      fiber: Math.max(25, weight * 0.35), // g per kg, minimum 25g
      hydration: Math.max(2.5, weight * 0.035), // L per day
      sodium: Math.min(2300, 1000 + (trainingLoad * 10)), // mg, adjusted for training
      micronutrients: this.calculateMicronutrientNeeds(userProfile, trainingData)
    };
  }

  /**
   * Calculate micronutrient needs
   */
  calculateMicronutrientNeeds(userProfile, trainingData) {
    const { weight, gender } = userProfile;
    const highIntensity = trainingData.avgIntensity > 7;

    return {
      vitaminD: gender === 'male' ? 15 : 15, // mcg
      vitaminC: highIntensity ? 200 : 90, // mg, increased for athletes
      iron: gender === 'male' ? 8 : 18, // mg
      calcium: gender === 'male' ? 1000 : 1200, // mg
      magnesium: weight * 6, // mg per kg body weight
      zinc: gender === 'male' ? 11 : 8, // mg
      b12: 2.4, // mcg
      folate: 400, // mcg
      omega3: 1000 // mg EPA + DHA
    };
  }

  /**
   * Use Sequential Thought reasoning for nutrition planning
   */
  async performNutritionReasoning(userProfile, trainingData, goals, nutritionTargets) {
    try {
      if (!mcpService.getConnectionStatus().servers?.sequentialThought) {
        console.warn('Sequential Thought not available for nutrition reasoning');
        return null;
      }

      const reasoningInput = {
        userProfile: {
          weight: userProfile.weight,
          height: userProfile.height,
          age: userProfile.age,
          activityLevel: userProfile.activityLevel,
          goals: goals.primaryFocus
        },
        trainingData: {
          intensity: trainingData.avgIntensity,
          frequency: trainingData.sessionsPerWeek,
          duration: trainingData.avgDuration
        },
        nutritionTargets,
        constraints: userProfile.preferences?.restrictions || [],
        timeline: goals.timeframe || '4-6 weeks'
      };

      const reasoning = await sequentialThoughtService.performReasoning(
        'nutrition-planning',
        reasoningInput,
        { depth: 2, includeAlternatives: true }
      );

      console.log('🧠 Applied sequential reasoning to nutrition planning');
      return reasoning;

    } catch (error) {
      console.error('Nutrition reasoning error:', error);
      return null;
    }
  }

  /**
   * Generate evidence-based meal plan with source citations
   */
  async generateEvidenceBasedMealPlan(nutritionTargets, preferences, researchData) {
    const mealPlan = {
      dailyMeals: [],
      weeklyRotation: [],
      shoppingList: [],
      preparationTips: [],
      citations: []
    };

    // Generate daily meal structure
    const mealDistribution = {
      breakfast: 0.25,
      lunch: 0.30,
      dinner: 0.30,
      snacks: 0.15
    };

    Object.entries(mealDistribution).forEach(([meal, percentage]) => {
      const mealTargets = {
        calories: Math.round(nutritionTargets.calories * percentage),
        protein: Math.round(nutritionTargets.protein * percentage),
        carbs: Math.round(nutritionTargets.carbs * percentage),
        fat: Math.round(nutritionTargets.fat * percentage)
      };

      const mealSuggestions = this.generateMealSuggestions(meal, mealTargets, preferences);
      
      mealPlan.dailyMeals.push({
        meal,
        targets: mealTargets,
        suggestions: mealSuggestions,
        timing: this.getOptimalMealTiming(meal, preferences?.trainingTimes)
      });
    });

    // Add research-based recommendations
    if (researchData) {
      mealPlan.researchRecommendations = researchData.recommendations
        .filter(rec => rec.toLowerCase().includes('meal') || rec.toLowerCase().includes('timing'))
        .slice(0, 3);
      
      mealPlan.citations = researchData.sources.slice(0, 5);
    }

    // Generate weekly rotation
    mealPlan.weeklyRotation = this.generateWeeklyMealRotation(mealPlan.dailyMeals, preferences);

    // Create shopping list
    mealPlan.shoppingList = this.generateShoppingList(mealPlan.weeklyRotation);

    return mealPlan;
  }

  /**
   * Generate meal suggestions for specific meal and targets
   */
  generateMealSuggestions(mealType, targets, preferences) {
    const mealDatabase = {
      breakfast: [
        {
          name: 'Athletes Oatmeal Bowl',
          ingredients: ['oats', 'banana', 'berries', 'protein powder', 'nuts'],
          macros: { calories: 400, protein: 25, carbs: 45, fat: 12 },
          prepTime: 10,
          benefits: 'Sustained energy release, complete amino acids'
        },
        {
          name: 'Power Breakfast Scramble',
          ingredients: ['eggs', 'vegetables', 'cheese', 'avocado', 'whole grain toast'],
          macros: { calories: 450, protein: 28, carbs: 25, fat: 22 },
          prepTime: 15,
          benefits: 'High protein, healthy fats, micronutrients'
        }
      ],
      lunch: [
        {
          name: 'Performance Bowl',
          ingredients: ['quinoa', 'chicken breast', 'mixed vegetables', 'olive oil', 'herbs'],
          macros: { calories: 500, protein: 35, carbs: 40, fat: 18 },
          prepTime: 20,
          benefits: 'Complete protein, complex carbs, anti-inflammatory'
        },
        {
          name: 'Recovery Wrap',
          ingredients: ['whole wheat tortilla', 'turkey', 'hummus', 'vegetables', 'spinach'],
          macros: { calories: 420, protein: 28, carbs: 38, fat: 16 },
          prepTime: 10,
          benefits: 'Portable, balanced macros, fiber'
        }
      ],
      dinner: [
        {
          name: 'Champion Salmon Plate',
          ingredients: ['salmon', 'sweet potato', 'broccoli', 'olive oil', 'lemon'],
          macros: { calories: 550, protein: 40, carbs: 35, fat: 24 },
          prepTime: 25,
          benefits: 'Omega-3 fatty acids, complex carbs, antioxidants'
        },
        {
          name: 'Lean & Clean Stir-fry',
          ingredients: ['lean beef', 'brown rice', 'mixed vegetables', 'ginger', 'soy sauce'],
          macros: { calories: 480, protein: 32, carbs: 42, fat: 14 },
          prepTime: 20,
          benefits: 'Iron, B-vitamins, fiber, low saturated fat'
        }
      ],
      snacks: [
        {
          name: 'Pre-Workout Fuel',
          ingredients: ['banana', 'almond butter', 'honey'],
          macros: { calories: 200, protein: 6, carbs: 28, fat: 8 },
          prepTime: 2,
          benefits: 'Quick energy, potassium, healthy fats'
        },
        {
          name: 'Recovery Smoothie',
          ingredients: ['protein powder', 'berries', 'spinach', 'almond milk'],
          macros: { calories: 180, protein: 20, carbs: 15, fat: 4 },
          prepTime: 5,
          benefits: 'Fast protein absorption, antioxidants, vitamins'
        }
      ]
    };

    const availableMeals = mealDatabase[mealType] || [];
    
    // Filter based on preferences
    return availableMeals.filter(meal => {
      if (preferences?.restrictions?.includes('vegetarian') && 
          meal.ingredients.some(ing => ['chicken', 'turkey', 'beef', 'salmon'].includes(ing))) {
        return false;
      }
      if (preferences?.restrictions?.includes('dairy-free') && 
          meal.ingredients.some(ing => ['cheese', 'milk'].includes(ing))) {
        return false;
      }
      return true;
    }).slice(0, 3);
  }

  /**
   * Get optimal meal timing based on training schedule
   */
  getOptimalMealTiming(meal, trainingTimes = []) {
    const defaultTiming = {
      breakfast: '7:00 AM',
      lunch: '12:00 PM',
      dinner: '6:00 PM',
      snacks: 'As needed'
    };

    if (trainingTimes.length === 0) {
      return defaultTiming[meal];
    }

    // Adjust timing based on training
    const morningTraining = trainingTimes.includes('morning');
    const eveningTraining = trainingTimes.includes('evening');

    if (morningTraining && meal === 'breakfast') {
      return '6:00 AM (1 hour before training)';
    }
    if (eveningTraining && meal === 'dinner') {
      return '7:30 PM (1 hour after training)';
    }

    return defaultTiming[meal];
  }

  /**
   * Analyze supplement needs and interactions
   */
  async analyzeSupplementNeeds(nutritionTargets, userProfile, trainingData) {
    try {
      const supplementAnalysis = {
        recommended: [],
        cautions: [],
        interactions: [],
        timing: {},
        evidenceBased: false
      };

      // Basic supplement recommendations based on targets and profile
      const basicRecommendations = this.getBasicSupplementRecommendations(
        nutritionTargets, 
        userProfile, 
        trainingData
      );

      supplementAnalysis.recommended = basicRecommendations;

      // Use Sequential Thought for complex supplement interaction checking
      if (mcpService.getConnectionStatus().servers?.sequentialThought) {
        try {
          const interactionAnalysis = await sequentialThoughtService.performReasoning(
            'supplement-analysis',
            {
              currentSupplements: userProfile.currentSupplements || [],
              recommendedSupplements: basicRecommendations,
              healthConditions: userProfile.healthConditions || [],
              medications: userProfile.medications || []
            },
            { depth: 2 }
          );

          if (interactionAnalysis && !interactionAnalysis.error) {
            supplementAnalysis.interactions = interactionAnalysis.recommendations || [];
            supplementAnalysis.cautions = interactionAnalysis.reasoning?.conclusions || [];
            supplementAnalysis.evidenceBased = true;
          }
        } catch (error) {
          console.warn('Supplement interaction analysis failed:', error.message);
        }
      }

      // Generate timing recommendations
      supplementAnalysis.timing = this.generateSupplementTiming(supplementAnalysis.recommended);

      return supplementAnalysis;

    } catch (error) {
      console.error('Supplement analysis error:', error);
      return {
        recommended: this.getBasicSupplementRecommendations(nutritionTargets, userProfile, trainingData),
        cautions: ['Consult healthcare provider before starting new supplements'],
        interactions: [],
        timing: {},
        evidenceBased: false
      };
    }
  }

  /**
   * Get basic supplement recommendations
   */
  getBasicSupplementRecommendations(nutritionTargets, userProfile, trainingData) {
    const recommendations = [];

    // Protein powder if targets are hard to meet with food
    if (nutritionTargets.protein > userProfile.weight * 1.6) {
      recommendations.push({
        supplement: 'Whey Protein Powder',
        dosage: '25-30g',
        rationale: 'Support muscle protein synthesis and recovery',
        priority: 'high',
        evidenceLevel: 'strong'
      });
    }

    // Creatine for power sports
    if (trainingData.avgIntensity > 7) {
      recommendations.push({
        supplement: 'Creatine Monohydrate',
        dosage: '3-5g daily',
        rationale: 'Enhance power output and muscle mass gains',
        priority: 'high',
        evidenceLevel: 'strong'
      });
    }

    // Vitamin D (common deficiency)
    recommendations.push({
      supplement: 'Vitamin D3',
      dosage: '1000-2000 IU',
      rationale: 'Support bone health and immune function',
      priority: 'medium',
      evidenceLevel: 'moderate'
    });

    // Omega-3 for inflammation
    if (trainingData.sessionsPerWeek > 4) {
      recommendations.push({
        supplement: 'Omega-3 Fish Oil',
        dosage: '1-2g EPA+DHA',
        rationale: 'Reduce exercise-induced inflammation',
        priority: 'medium',
        evidenceLevel: 'moderate'
      });
    }

    return recommendations;
  }

  /**
   * Generate supplement timing recommendations
   */
  generateSupplementTiming(supplements) {
    const timing = {};

    supplements.forEach(supp => {
      switch (supp.supplement.toLowerCase()) {
        case 'whey protein powder':
          timing[supp.supplement] = 'Post-workout within 2 hours, or between meals';
          break;
        case 'creatine monohydrate':
          timing[supp.supplement] = 'Daily, timing not critical - can be with meals';
          break;
        case 'vitamin d3':
          timing[supp.supplement] = 'With breakfast or lunch (with fats for absorption)';
          break;
        case 'omega-3 fish oil':
          timing[supp.supplement] = 'With meals to reduce potential stomach upset';
          break;
        default:
          timing[supp.supplement] = 'Follow label instructions';
      }
    });

    return timing;
  }

  /**
   * Generate prioritized recommendations
   */
  generatePrioritizedRecommendations(nutritionTargets, mealPlan, supplementAnalysis, reasoning) {
    const recommendations = [];

    // Priority 1: Foundation nutrition
    recommendations.push({
      priority: 1,
      category: 'Foundation Nutrition',
      action: `Aim for ${nutritionTargets.calories} calories daily with ${nutritionTargets.protein}g protein`,
      rationale: 'Supports energy needs and muscle protein synthesis',
      timeline: 'Start immediately'
    });

    // Priority 2: Meal timing
    if (nutritionTargets.carbTiming) {
      recommendations.push({
        priority: 2,
        category: 'Nutrient Timing',
        action: 'Time carbohydrates around training sessions',
        rationale: 'Optimizes performance and recovery',
        timeline: 'Implement within 1 week'
      });
    }

    // Priority 3: Hydration
    recommendations.push({
      priority: 3,
      category: 'Hydration',
      action: `Consume ${nutritionTargets.hydration}L of water daily`,
      rationale: 'Maintains performance and supports recovery',
      timeline: 'Start immediately'
    });

    // Priority 4: Supplements (if recommended)
    if (supplementAnalysis.recommended.length > 0) {
      const highPrioritySupps = supplementAnalysis.recommended
        .filter(supp => supp.priority === 'high')
        .map(supp => supp.supplement);
      
      if (highPrioritySupps.length > 0) {
        recommendations.push({
          priority: 4,
          category: 'Strategic Supplementation',
          action: `Consider adding: ${highPrioritySupps.join(', ')}`,
          rationale: 'Addresses specific performance and recovery needs',
          timeline: 'After consulting healthcare provider'
        });
      }
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Create nutrition monitoring plan
   */
  createNutritionMonitoringPlan(userProfile, goals) {
    return {
      daily: [
        'Track food intake and portions',
        'Monitor energy levels throughout day',
        'Record hydration status',
        'Note hunger and satiety cues'
      ],
      weekly: [
        'Weigh yourself at consistent time',
        'Assess training performance quality',
        'Review meal prep success rate',
        'Evaluate supplement compliance'
      ],
      monthly: [
        'Measure body composition if possible',
        'Review and adjust nutrition targets',
        'Assess goal progress and timeline',
        'Update meal preferences and restrictions'
      ],
      keyMetrics: [
        'Energy stability throughout day',
        'Training performance consistency',
        'Recovery between sessions',
        'Body composition changes',
        'Digestive health and comfort'
      ]
    };
  }

  /**
   * Calculate next review date
   */
  calculateNextReviewDate(timeframe) {
    const weeks = timeframe === 'short-term' ? 2 : 
                  timeframe === 'long-term' ? 8 : 4;
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + (weeks * 7));
    
    return nextReview.toISOString();
  }

  /**
   * Calculate overall analysis confidence
   */
  calculateAnalysisConfidence(researchData, reasoning) {
    let confidence = 0.7; // Base confidence
    
    if (researchData && researchData.recommendations.length > 0) {
      confidence += 0.15; // Research backing
    }
    
    if (reasoning && !reasoning.error) {
      confidence += 0.1; // Sequential reasoning
    }
    
    return Math.min(confidence, 0.95); // Cap at 95%
  }

  /**
   * Fallback nutrition analysis when MCP services unavailable
   */
  async getFallbackNutritionAnalysis(userProfile, trainingData, goals) {
    console.warn('Using fallback nutrition analysis - MCP services unavailable');
    
    const nutritionTargets = this.calculateBaseTargets(userProfile, trainingData);
    const basicMealPlan = await this.generateEvidenceBasedMealPlan(
      nutritionTargets, 
      userProfile.preferences, 
      null
    );
    const basicSupplements = await this.analyzeSupplementNeeds(
      nutritionTargets, 
      userProfile, 
      trainingData
    );

    return {
      timestamp: new Date().toISOString(),
      userId: userProfile.id,
      analysis: {
        nutritionTargets,
        mealPlan: basicMealPlan,
        supplementAnalysis: basicSupplements,
        researchBacking: null,
        reasoning: null,
        confidence: 0.7,
        evidenceQuality: 'basic'
      },
      recommendations: [
        {
          priority: 1,
          category: 'Foundation',
          action: 'Focus on whole foods and consistent meal timing',
          rationale: 'Established nutrition principles',
          timeline: 'Start immediately'
        }
      ],
      monitoringPlan: this.createNutritionMonitoringPlan(userProfile, goals),
      nextReviewDate: this.calculateNextReviewDate(goals.timeframe),
      fallback: true
    };
  }

  // Utility methods for meal plan generation
  generateWeeklyMealRotation(dailyMeals, preferences) {
    // Create 7-day rotation with variety
    const rotation = [];
    
    for (let day = 0; day < 7; day++) {
      const dayPlan = {};
      
      dailyMeals.forEach(meal => {
        // Rotate through suggestions to create variety
        const suggestionIndex = day % meal.suggestions.length;
        dayPlan[meal.meal] = meal.suggestions[suggestionIndex] || meal.suggestions[0];
      });
      
      rotation.push({
        day: day + 1,
        dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day],
        meals: dayPlan
      });
    }
    
    return rotation;
  }

  generateShoppingList(weeklyRotation) {
    const ingredients = new Set();
    
    weeklyRotation.forEach(day => {
      Object.values(day.meals).forEach(meal => {
        meal.ingredients?.forEach(ingredient => {
          ingredients.add(ingredient);
        });
      });
    });
    
    return Array.from(ingredients).sort();
  }
}

// Create singleton instance
const enhancedNutritionService = new EnhancedNutritionService();

export { enhancedNutritionService };
export default enhancedNutritionService;
/**
 * Defensive Back (DB) Training Module
 * Specialized training for flag football defensive backs
 * Focus: Missed flags, blown coverage, 1v1 scenarios, route recognition
 */

import { logger } from "../logger.js";
import { mlPredictor } from "../ml-performance-predictor.js";
import { ComponentWithCleanup } from "../event-cleanup-utils.js";

export class DBTrainingModule extends ComponentWithCleanup {
  constructor() {
    super();
    this.trainingScenarios = new Map();
    this.performanceMetrics = new Map();
    this.drillLibrary = new Map();
    this.initializeTrainingModules();
  }

  /**
   * Initialize DB-specific training modules
   */
  initializeTrainingModules() {
    // Flag Pull Technique Training
    this.trainingScenarios.set("flagPull", {
      name: "Flag Pull Mastery",
      focus: "Missed flags, timing, technique",
      difficulty: "Progressive",
      scenarios: [
        {
          id: "basic_flag_pull",
          name: "Basic Flag Pull Technique",
          description: "Fundamental flag pulling mechanics and positioning",
          metrics: ["success_rate", "reaction_time", "positioning_accuracy"],
          drills: ["stationary_pulls", "walking_pulls", "jogging_pulls"],
        },
        {
          id: "pursuit_angles",
          name: "Pursuit Angle Optimization",
          description: "Optimal angles for flag pulls in different scenarios",
          metrics: ["angle_efficiency", "closing_speed", "miss_rate"],
          drills: ["angle_pursuit", "cutoff_drills", "closing_distance"],
        },
        {
          id: "one_handed_pulls",
          name: "One-Handed Flag Pulls",
          description: "Advanced flag pulling with single hand technique",
          metrics: ["success_rate", "hand_coordination", "body_control"],
          drills: ["dominant_hand", "weak_hand", "situational_pulls"],
        },
      ],
    });

    // Coverage Training
    this.trainingScenarios.set("coverage", {
      name: "Coverage Excellence",
      focus: "Blown coverage, route recognition, zone/man coverage",
      difficulty: "Advanced",
      scenarios: [
        {
          id: "man_coverage",
          name: "Man-to-Man Coverage",
          description: "Individual coverage techniques for different routes",
          metrics: ["separation_allowed", "coverage_tightness", "break_timing"],
          drills: ["mirror_drill", "backpedal_break", "hip_turn_technique"],
        },
        {
          id: "zone_coverage",
          name: "Zone Coverage Discipline",
          description: "Zone responsibilities and communication",
          metrics: [
            "zone_integrity",
            "help_coverage",
            "communication_accuracy",
          ],
          drills: ["zone_drops", "pattern_matching", "leverage_maintenance"],
        },
        {
          id: "route_recognition",
          name: "Route Recognition & Anticipation",
          description: "Reading receiver stems and anticipating routes",
          metrics: [
            "recognition_speed",
            "route_prediction",
            "break_anticipation",
          ],
          drills: [
            "stem_reading",
            "pattern_recognition",
            "film_study_practical",
          ],
        },
      ],
    });

    // 1v1 Training
    this.trainingScenarios.set("oneOnOne", {
      name: "1v1 Domination",
      focus: "1v1 scenarios, receiver beating, competitive situations",
      difficulty: "Elite",
      scenarios: [
        {
          id: "press_coverage",
          name: "Press Coverage Mastery",
          description: "Aggressive press coverage at line of scrimmage",
          metrics: [
            "jam_effectiveness",
            "release_prevention",
            "recovery_speed",
          ],
          drills: ["jam_technique", "hand_fighting", "press_bail"],
        },
        {
          id: "off_coverage",
          name: "Off Coverage Excellence",
          description: "Cushion coverage and closing on receivers",
          metrics: ["cushion_management", "closing_speed", "break_reaction"],
          drills: ["backpedal_technique", "break_and_drive", "speed_turns"],
        },
        {
          id: "contested_catches",
          name: "Contested Catch Defense",
          description: "Defending passes in tight coverage",
          metrics: ["ball_disruption", "positioning", "flag_pull_timing"],
          drills: ["high_point_defense", "hands_technique", "body_positioning"],
        },
      ],
    });

    logger.info("DB Training Module initialized with 9 specialized scenarios");
  }

  /**
   * Generate personalized DB training plan
   */
  async generateTrainingPlan(playerData) {
    try {
      // Analyze current DB performance
      const performanceAnalysis = await this.analyzeDBPerformance(playerData);

      // Get ML predictions for improvement areas
      const predictions = await mlPredictor.predictDecisionMaking(
        playerData,
        "DB",
      );

      // Create customized training plan
      const trainingPlan = {
        playerId: playerData.id,
        position: "DB",
        currentLevel: performanceAnalysis.overallLevel,
        weaknesses: performanceAnalysis.primaryWeaknesses,
        focusAreas: this.identifyFocusAreas(performanceAnalysis, predictions),
        weeklyPlan: this.createWeeklyDBPlan(performanceAnalysis),
        progressionTimeline:
          this.createProgressionTimeline(performanceAnalysis),
        specificDrills: this.selectSpecificDrills(performanceAnalysis),
        competitiveScenarios: this.generateCompetitiveScenarios(playerData),
      };

      logger.debug(`DB training plan generated for player ${playerData.id}`);
      return trainingPlan;
    } catch (error) {
      logger.error("Failed to generate DB training plan:", error);
      return this.getDefaultDBPlan();
    }
  }

  /**
   * Analyze current DB performance across key areas
   */
  async analyzeDBPerformance(playerData) {
    const metrics = {
      flagPullAccuracy: this.calculateFlagPullMetrics(playerData),
      coverageEfficiency: this.calculateCoverageMetrics(playerData),
      oneOnOneSuccess: this.calculateOneOnOneMetrics(playerData),
      routeRecognition: this.calculateRecognitionMetrics(playerData),
      communication: this.calculateCommunicationMetrics(playerData),
    };

    // Calculate overall level and identify weaknesses
    const overallLevel =
      Object.values(metrics).reduce((sum, metric) => sum + metric.score, 0) / 5;
    const primaryWeaknesses = Object.entries(metrics)
      .filter(([_, metric]) => metric.score < 0.7)
      .map(([area, metric]) => ({
        area,
        score: metric.score,
        priority: metric.priority,
      }))
      .sort((a, b) => b.priority - a.priority);

    return {
      metrics,
      overallLevel,
      primaryWeaknesses,
      strengths: Object.entries(metrics)
        .filter(([_, metric]) => metric.score >= 0.8)
        .map(([area, metric]) => area),
      readiness: this.assessCompetitiveReadiness(
        overallLevel,
        primaryWeaknesses,
      ),
    };
  }

  /**
   * Calculate flag pull specific metrics
   */
  calculateFlagPullMetrics(playerData) {
    const stats = playerData.stats?.flagPull || {};

    const successRate =
      stats.successful_pulls / Math.max(stats.attempted_pulls, 1) || 0.65;
    const missedFlags = stats.missed_flags || 0;
    const pursuitEfficiency =
      stats.optimal_angles / Math.max(stats.total_pursuits, 1) || 0.7;

    // Weight factors for flag pull importance
    const score =
      successRate * 0.5 +
      pursuitEfficiency * 0.3 +
      Math.max(0, 1 - missedFlags / 10) * 0.2;

    return {
      score: Math.min(1, score),
      successRate,
      missedFlags,
      pursuitEfficiency,
      priority: missedFlags > 5 ? 0.9 : 0.7,
      recommendations: this.getFlagPullRecommendations(
        successRate,
        missedFlags,
      ),
    };
  }

  /**
   * Calculate coverage efficiency metrics
   */
  calculateCoverageMetrics(playerData) {
    const stats = playerData.stats?.coverage || {};

    const completionAllowed =
      stats.completions_allowed / Math.max(stats.targets, 1) || 0.4;
    const yardsPerTarget =
      stats.yards_allowed / Math.max(stats.targets, 1) || 8;
    const blownCoverage = stats.blown_coverage || 0;

    // Lower completion % and yards = better score
    const coverageScore =
      Math.max(0, 1 - completionAllowed) * 0.5 +
      Math.max(0, 1 - yardsPerTarget / 15) * 0.3 +
      Math.max(0, 1 - blownCoverage / 5) * 0.2;

    return {
      score: Math.min(1, coverageScore),
      completionAllowed,
      yardsPerTarget,
      blownCoverage,
      priority: blownCoverage > 2 ? 0.95 : 0.8,
      recommendations: this.getCoverageRecommendations(
        completionAllowed,
        blownCoverage,
      ),
    };
  }

  /**
   * Calculate 1v1 success metrics
   */
  calculateOneOnOneMetrics(playerData) {
    const stats = playerData.stats?.oneOnOne || {};

    const winRate = stats.wins / Math.max(stats.total_matchups, 1) || 0.6;
    const receiverBeaten = stats.receiver_beaten || 0;
    const pressSuccess =
      stats.press_success / Math.max(stats.press_attempts, 1) || 0.5;

    const score = winRate * 0.6 + pressSuccess * 0.4;

    return {
      score: Math.min(1, score),
      winRate,
      receiverBeaten,
      pressSuccess,
      priority: receiverBeaten > 3 ? 0.85 : 0.6,
      recommendations: this.getOneOnOneRecommendations(winRate, pressSuccess),
    };
  }

  /**
   * Create weekly DB training plan
   */
  createWeeklyDBPlan(analysis) {
    const primaryFocus = analysis.primaryWeaknesses[0]?.area || "general";

    const weeklyPlan = {
      monday: {
        focus: "Flag Pull Technique",
        duration: 45,
        drills: this.selectDrillsByCategory("flagPull", analysis),
        intensity: "High",
      },
      tuesday: {
        focus: "Coverage Fundamentals",
        duration: 60,
        drills: this.selectDrillsByCategory("coverage", analysis),
        intensity: "Medium",
      },
      wednesday: {
        focus: "Recovery & Film Study",
        duration: 30,
        drills: ["film_review", "route_recognition_theory"],
        intensity: "Low",
      },
      thursday: {
        focus: "1v1 Competition",
        duration: 50,
        drills: this.selectDrillsByCategory("oneOnOne", analysis),
        intensity: "High",
      },
      friday: {
        focus: "Game Simulation",
        duration: 40,
        drills: ["full_speed_scenarios", "communication_drills"],
        intensity: "Game Speed",
      },
      saturday: {
        focus: "Position-Specific Conditioning",
        duration: 35,
        drills: ["backpedal_conditioning", "change_of_direction"],
        intensity: "Medium",
      },
      sunday: {
        focus: "Rest & Recovery",
        duration: 20,
        drills: ["mobility_work", "mental_preparation"],
        intensity: "Recovery",
      },
    };

    return weeklyPlan;
  }

  /**
   * Select specific drills based on performance analysis
   */
  selectSpecificDrills(analysis) {
    const drills = [];

    // Flag pull focused drills
    if (analysis.metrics.flagPullAccuracy.score < 0.7) {
      drills.push({
        category: "Flag Pull",
        drills: [
          {
            name: "Pursuit Angle Ladder",
            description: "Practice optimal pursuit angles using cones",
            duration: "10 minutes",
            reps: "3 sets x 8 reps",
            focus: "Angle efficiency and closing speed",
          },
          {
            name: "One-Handed Flag Pulls",
            description: "Practice flag pulls with single hand",
            duration: "8 minutes",
            reps: "2 sets x 10 reps each hand",
            focus: "Hand coordination and timing",
          },
          {
            name: "Moving Target Flags",
            description: "Flag pulls on moving targets at various speeds",
            duration: "12 minutes",
            reps: "4 sets x 5 reps",
            focus: "Real-game flag pulling under pressure",
          },
        ],
      });
    }

    // Coverage drills
    if (analysis.metrics.coverageEfficiency.score < 0.75) {
      drills.push({
        category: "Coverage",
        drills: [
          {
            name: "Mirror Drill Progression",
            description: "Mirror receiver movements without ball",
            duration: "15 minutes",
            reps: "5 sets x 1 minute",
            focus: "Hip fluidity and reaction time",
          },
          {
            name: "Route Stem Recognition",
            description: "Identify route based on receiver stem",
            duration: "12 minutes",
            reps: "20 different stems",
            focus: "Early route recognition",
          },
          {
            name: "Zone Drop Precision",
            description: "Perfect zone drops and coverage landmarks",
            duration: "10 minutes",
            reps: "3 sets x 5 different zones",
            focus: "Zone discipline and communication",
          },
        ],
      });
    }

    // 1v1 competitive drills
    if (analysis.metrics.oneOnOneSuccess.score < 0.8) {
      drills.push({
        category: "1v1 Competition",
        drills: [
          {
            name: "Press Coverage Gauntlet",
            description: "Aggressive press coverage at LOS",
            duration: "10 minutes",
            reps: "3 sets x 6 reps",
            focus: "Jam technique and recovery",
          },
          {
            name: "Break and Drive",
            description: "React to receiver breaks and close",
            duration: "8 minutes",
            reps: "4 sets x 4 reps",
            focus: "Break recognition and closing speed",
          },
          {
            name: "Contested Ball Drills",
            description: "Defend passes in tight coverage",
            duration: "12 minutes",
            reps: "3 sets x 5 contested catches",
            focus: "Ball skills and positioning",
          },
        ],
      });
    }

    return drills;
  }

  /**
   * Generate competitive scenarios for advanced training
   */
  generateCompetitiveScenarios(playerData) {
    return [
      {
        name: "Red Zone Defense",
        description: "Defend in condensed field with high completion pressure",
        setup: "15-yard field, 1v1 and 2v2 scenarios",
        objectives: [
          "Prevent TDs",
          "Force difficult throws",
          "Communicate coverage",
        ],
        success_metrics: [
          "TD prevention rate",
          "Flag pulls in red zone",
          "Communication accuracy",
        ],
        difficulty: "Elite",
      },
      {
        name: "Two-Minute Drill Defense",
        description: "High-pressure defense with time management",
        setup: "Full field, multiple receivers, hurry-up offense",
        objectives: ["Stop big plays", "Force incompletions", "Manage clock"],
        success_metrics: [
          "Plays > 15 yards allowed",
          "Third down stops",
          "Coverage busts",
        ],
        difficulty: "Advanced",
      },
      {
        name: "Pick Play Defense",
        description: "Defend against pick/rub routes and screens",
        setup: "Various formations, designed pick plays",
        objectives: [
          "Fight through picks",
          "Maintain coverage",
          "Communicate switches",
        ],
        success_metrics: [
          "Pick navigation",
          "Coverage maintenance",
          "Switch execution",
        ],
        difficulty: "Advanced",
      },
    ];
  }

  /**
   * Get flag pull improvement recommendations
   */
  getFlagPullRecommendations(successRate, missedFlags) {
    const recommendations = [];

    if (successRate < 0.7) {
      recommendations.push("Focus on pursuit angles and closing speed");
      recommendations.push("Practice flag pull technique daily");
    }

    if (missedFlags > 3) {
      recommendations.push("Improve hand-eye coordination drills");
      recommendations.push("Work on timing and anticipation");
    }

    return recommendations.length > 0
      ? recommendations
      : ["Maintain current flag pull technique"];
  }

  /**
   * Get coverage improvement recommendations
   */
  getCoverageRecommendations(completionAllowed, blownCoverage) {
    const recommendations = [];

    if (completionAllowed > 0.5) {
      recommendations.push("Improve coverage tightness and positioning");
      recommendations.push("Work on route recognition and anticipation");
    }

    if (blownCoverage > 2) {
      recommendations.push("Focus on zone discipline and communication");
      recommendations.push("Practice coverage assignments and responsibilities");
    }

    return recommendations.length > 0
      ? recommendations
      : ["Maintain current coverage level"];
  }

  /**
   * Get 1v1 improvement recommendations
   */
  getOneOnOneRecommendations(winRate, pressSuccess) {
    const recommendations = [];

    if (winRate < 0.6) {
      recommendations.push("Improve press coverage technique");
      recommendations.push("Work on recovery speed and positioning");
    }

    if (pressSuccess < 0.5) {
      recommendations.push("Focus on jam technique at line of scrimmage");
      recommendations.push("Practice hand fighting and leverage");
    }

    return recommendations.length > 0
      ? recommendations
      : ["Maintain current 1v1 performance"];
  }

  /**
   * Calculate route recognition metrics
   */
  calculateRecognitionMetrics(playerData) {
    const stats = playerData.stats?.routeRecognition || {};

    const recognitionSpeed = stats.recognition_speed || 0.65;
    const routePrediction = stats.route_prediction_accuracy || 0.6;
    const breakAnticipation = stats.break_anticipation || 0.7;

    const score =
      recognitionSpeed * 0.4 +
      routePrediction * 0.35 +
      breakAnticipation * 0.25;

    return {
      score: Math.min(1, score),
      recognitionSpeed,
      routePrediction,
      breakAnticipation,
      priority: score < 0.7 ? 0.85 : 0.6,
      recommendations: this.getRecognitionRecommendations(score),
    };
  }

  /**
   * Calculate communication metrics
   */
  calculateCommunicationMetrics(playerData) {
    const stats = playerData.stats?.communication || {};

    const callAccuracy = stats.call_accuracy || 0.75;
    const coverageSwitches = stats.coverage_switches_executed || 0.7;
    const helpCalls = stats.help_calls_made || 0.65;

    const score = callAccuracy * 0.4 + coverageSwitches * 0.35 + helpCalls * 0.25;

    return {
      score: Math.min(1, score),
      callAccuracy,
      coverageSwitches,
      helpCalls,
      priority: score < 0.7 ? 0.8 : 0.5,
      recommendations: this.getCommunicationRecommendations(score),
    };
  }

  /**
   * Get route recognition recommendations
   */
  getRecognitionRecommendations(score) {
    const recommendations = [];

    if (score < 0.7) {
      recommendations.push("Study film to recognize route patterns");
      recommendations.push("Practice reading receiver stems");
    }

    return recommendations.length > 0
      ? recommendations
      : ["Continue studying route recognition"];
  }

  /**
   * Get communication recommendations
   */
  getCommunicationRecommendations(score) {
    const recommendations = [];

    if (score < 0.7) {
      recommendations.push("Improve coverage call communication");
      recommendations.push("Practice coverage switches and help calls");
    }

    return recommendations.length > 0
      ? recommendations
      : ["Maintain current communication level"];
  }

  /**
   * Identify focus areas based on analysis and predictions
   */
  identifyFocusAreas(analysis, predictions) {
    const focusAreas = [];

    // Add primary weaknesses as focus areas
    analysis.primaryWeaknesses.forEach((weakness) => {
      focusAreas.push({
        area: weakness.area,
        priority: weakness.priority,
        currentScore: weakness.score,
        targetScore: Math.min(1, weakness.score + 0.2),
      });
    });

    // Add ML-predicted improvement areas
    if (predictions && predictions.improvementAreas) {
      predictions.improvementAreas.forEach((area) => {
        if (!focusAreas.find((fa) => fa.area === area.name)) {
          focusAreas.push({
            area: area.name,
            priority: area.potential,
            currentScore: area.current,
            targetScore: area.target,
          });
        }
      });
    }

    return focusAreas.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Select drills by category
   */
  selectDrillsByCategory(category, analysis) {
    const scenario = this.trainingScenarios.get(category);
    if (!scenario) {return [];}

    const drills = [];
    scenario.scenarios.forEach((scenarioItem) => {
      drills.push(...scenarioItem.drills);
    });

    // Filter drills based on weaknesses
    if (category === "flagPull" && analysis.metrics.flagPullAccuracy.score < 0.7) {
      return drills.filter((drill) =>
        drill.includes("pursuit") || drill.includes("pull"),
      );
    }

    if (
      category === "coverage" &&
      analysis.metrics.coverageEfficiency.score < 0.75
    ) {
      return drills.filter(
        (drill) =>
          drill.includes("coverage") ||
          drill.includes("zone") ||
          drill.includes("man"),
      );
    }

    if (
      category === "oneOnOne" &&
      analysis.metrics.oneOnOneSuccess.score < 0.8
    ) {
      return drills.filter(
        (drill) =>
          drill.includes("press") ||
          drill.includes("1v1") ||
          drill.includes("competition"),
      );
    }

    return drills.slice(0, 3); // Return top 3 drills
  }

  /**
   * Get default DB training plan when analysis fails
   */
  getDefaultDBPlan() {
    return {
      playerId: "default",
      position: "DB",
      currentLevel: 0.65,
      weaknesses: [
        {
          area: "flagPullAccuracy",
          score: 0.65,
          priority: 0.8,
        },
        {
          area: "coverageEfficiency",
          score: 0.6,
          priority: 0.9,
        },
      ],
      focusAreas: [
        {
          area: "Flag Pull Mastery",
          priority: 0.9,
          currentScore: 0.65,
          targetScore: 0.85,
        },
        {
          area: "Coverage Excellence",
          priority: 0.85,
          currentScore: 0.6,
          targetScore: 0.8,
        },
      ],
      weeklyPlan: this.createWeeklyDBPlan({
        primaryWeaknesses: [
          { area: "flagPullAccuracy" },
          { area: "coverageEfficiency" },
        ],
        metrics: {
          flagPullAccuracy: { score: 0.65 },
          coverageEfficiency: { score: 0.6 },
          oneOnOneSuccess: { score: 0.7 },
        },
      }),
      progressionTimeline: {
        week1_2: {
          focus: "Foundation Building",
          goals: ["Master basic techniques", "Build confidence"],
          expectedImprovement: "15-20%",
        },
        week3_4: {
          focus: "Skill Integration",
          goals: ["Combine techniques", "Increase speed"],
          expectedImprovement: "20-25%",
        },
      },
      specificDrills: [
        {
          category: "Flag Pull",
          drills: [
            {
              name: "Basic Flag Pull Technique",
              description: "Fundamental flag pulling mechanics",
              duration: "10 minutes",
              reps: "3 sets x 8 reps",
              focus: "Technique and timing",
            },
          ],
        },
      ],
      competitiveScenarios: this.generateCompetitiveScenarios({ id: "default" }),
    };
  }

  /**
   * Create training progression timeline
   */
  createProgressionTimeline(analysis) {
    const timeline = {
      week1_2: {
        focus: "Foundation Building",
        goals: ["Master basic techniques", "Build confidence"],
        expectedImprovement: "15-20%",
      },
      week3_4: {
        focus: "Skill Integration",
        goals: ["Combine techniques", "Increase speed"],
        expectedImprovement: "20-25%",
      },
      week5_6: {
        focus: "Competition Preparation",
        goals: ["Game-speed execution", "Situational awareness"],
        expectedImprovement: "25-30%",
      },
      week7_8: {
        focus: "Elite Performance",
        goals: ["Consistent execution", "Leadership"],
        expectedImprovement: "30-35%",
      },
    };

    return timeline;
  }

  /**
   * Assess competitive readiness
   */
  assessCompetitiveReadiness(overallLevel, weaknesses) {
    if (overallLevel >= 0.85 && weaknesses.length <= 1) {
      return {
        level: "Elite",
        description: "Ready for highest level competition",
        recommendations: ["Focus on leadership and consistency"],
      };
    } else if (overallLevel >= 0.75 && weaknesses.length <= 2) {
      return {
        level: "Advanced",
        description: "Ready for competitive play with minor improvements",
        recommendations: [
          "Address remaining weaknesses",
          "Increase training intensity",
        ],
      };
    } else if (overallLevel >= 0.65) {
      return {
        level: "Developing",
        description: "Needs focused improvement before competition",
        recommendations: [
          "Intensive skill development",
          "Fundamentals reinforcement",
        ],
      };
    } else {
      return {
        level: "Beginner",
        description: "Requires comprehensive skill development",
        recommendations: [
          "Master fundamentals first",
          "Build confidence gradually",
        ],
      };
    }
  }
}

export const dbTraining = new DBTrainingModule();

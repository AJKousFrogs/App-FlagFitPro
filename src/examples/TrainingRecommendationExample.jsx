// Training Recommendation Example
// Demonstrates data-driven rule engine vs hardcoded conditionals

import React, { useState } from "react";
import { TrainingRecommendationEngine } from "../utils/RuleEngine";

/**
 * BEFORE: Hardcoded if-chain approach (BAD)
 * This is what we ELIMINATED from the codebase
 */
const OldApproach_HardcodedConditionals = (hamstringStrength) => {
  // ❌ ANTI-PATTERN: Hardcoded business logic in conditionals
  if (hamstringStrength < 60) {
    return {
      exercises: ["Nordic Hamstring Curls", "Romanian Deadlifts"],
      frequency: "4x per week",
      sets: 3,
      reps: 8,
      injuryRisk: "High - Immediate attention required",
    };
  } else if (hamstringStrength >= 60 && hamstringStrength < 75) {
    return {
      exercises: ["Single-leg Romanian Deadlifts", "Hamstring Curls"],
      frequency: "3x per week",
      sets: 3,
      reps: 10,
      injuryRisk: "Moderate - Preventive training recommended",
    };
  } else if (hamstringStrength >= 75) {
    return {
      exercises: ["Maintenance Hamstring Curls"],
      frequency: "2x per week",
      sets: 2,
      reps: 12,
      injuryRisk: "Low - Maintain current level",
    };
  }

  return { error: "No recommendation available" };
};

/**
 * AFTER: Data-driven rule engine approach (GOOD)
 * Clean, testable, maintainable
 */
const NewApproach_DataDrivenRules = (hamstringStrength) => {
  // ✅ BEST PRACTICE: Business logic in configuration, evaluation in engine
  return TrainingRecommendationEngine.getRecommendations(
    "hamstring",
    hamstringStrength,
  );
};

/**
 * Example React Component showing the improved approach
 */
const TrainingRecommendationDemo = () => {
  const [hamstringStrength, setHamstringStrength] = useState(55);
  const [quadricepsStrength, setQuadricepsStrength] = useState(70);
  const [coreStability, setCoreStability] = useState(65);

  // Get recommendations using data-driven engine
  const hamstringPlan = TrainingRecommendationEngine.getRecommendations(
    "hamstring",
    hamstringStrength,
  );
  const quadricepsPlan = TrainingRecommendationEngine.getRecommendations(
    "quadriceps",
    quadricepsStrength,
  );
  const corePlan = TrainingRecommendationEngine.getRecommendations(
    "core",
    coreStability,
  );

  // Or get comprehensive plan for all muscle groups
  const comprehensivePlan = TrainingRecommendationEngine.getComprehensivePlan({
    hamstring: hamstringStrength,
    quadriceps: quadricepsStrength,
    core: coreStability,
  });

  return (
    <div className="training-recommendations">
      <h2>🏋️ Data-Driven Training Recommendations</h2>

      {/* Hamstring Section */}
      <div className="muscle-group">
        <h3>Hamstring Strength: {hamstringStrength}%</h3>
        <input
          type="range"
          min="0"
          max="100"
          value={hamstringStrength}
          onChange={(e) => setHamstringStrength(parseInt(e.target.value))}
        />

        <div className={`recommendation severity-${hamstringPlan.severity}`}>
          <p>
            <strong>Injury Risk:</strong> {hamstringPlan.injuryRisk}
          </p>
          <p>
            <strong>Frequency:</strong> {hamstringPlan.frequency}
          </p>

          <h4>Recommended Exercises:</h4>
          <ul>
            {hamstringPlan.recommendations?.map((exercise, idx) => (
              <li key={idx}>
                {exercise.exercise} - {exercise.sets} sets x {exercise.reps}{" "}
                reps
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quadriceps Section */}
      <div className="muscle-group">
        <h3>Quadriceps Strength: {quadricepsStrength}%</h3>
        <input
          type="range"
          min="0"
          max="100"
          value={quadricepsStrength}
          onChange={(e) => setQuadricepsStrength(parseInt(e.target.value))}
        />

        <div className={`recommendation severity-${quadricepsPlan.severity}`}>
          <p>
            <strong>Frequency:</strong> {quadricepsPlan.frequency}
          </p>

          <h4>Recommended Exercises:</h4>
          <ul>
            {quadricepsPlan.recommendations?.map((exercise, idx) => (
              <li key={idx}>
                {exercise.exercise} - {exercise.sets} sets x {exercise.reps}{" "}
                reps
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Core Section */}
      <div className="muscle-group">
        <h3>Core Stability: {coreStability}%</h3>
        <input
          type="range"
          min="0"
          max="100"
          value={coreStability}
          onChange={(e) => setCoreStability(parseInt(e.target.value))}
        />

        <div className={`recommendation severity-${corePlan.severity}`}>
          <p>
            <strong>Frequency:</strong> {corePlan.frequency}
          </p>
          {corePlan.note && (
            <p>
              <em>{corePlan.note}</em>
            </p>
          )}

          <h4>Recommended Exercises:</h4>
          <ul>
            {corePlan.recommendations?.map((exercise, idx) => (
              <li key={idx}>
                {exercise.exercise} -{" "}
                {exercise.duration ||
                  `${exercise.sets} sets x ${exercise.reps} reps`}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Comprehensive Plan */}
      <div className="comprehensive-plan">
        <h3>📋 Complete Training Plan</h3>
        {comprehensivePlan.map((plan, idx) => (
          <div key={idx} className={`plan-item severity-${plan.severity}`}>
            <h4>{plan.muscle.toUpperCase()}</h4>
            <p>
              Current: {plan.currentStrength}% -{" "}
              {plan.injuryRisk || "Assess individually"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Benefits of the Refactored Approach:
 *
 * 1. ✅ SEPARATION OF CONCERNS
 *    - Business rules live in config/thresholds.js
 *    - Logic evaluation lives in utils/RuleEngine.js
 *    - UI components are clean and focused
 *
 * 2. ✅ MAINTAINABILITY
 *    - Change thresholds? Edit config, not code
 *    - Add new muscle groups? Add to config
 *    - Update recommendations? No code changes
 *
 * 3. ✅ TESTABILITY
 *    - Test rule engine with different inputs
 *    - Test config separately from logic
 *    - Mock config for unit tests
 *
 * 4. ✅ TEAM COLLABORATION
 *    - Coaches can update thresholds in config
 *    - Developers maintain the engine
 *    - No conflicts between rule changes and code changes
 *
 * 5. ✅ EXTENSIBILITY
 *    - Add new rule types without touching engine
 *    - Polymorphic design allows new strategies
 *    - Easy to add conditions/impacts
 */

export default TrainingRecommendationDemo;

/**
 * HOW TO USE IN YOUR CODE:
 *
 * // Example 1: Get recommendations for a single muscle group
 * const hamstringPlan = TrainingRecommendationEngine.getRecommendations('hamstring', 55);
 *
 * // Example 2: Get comprehensive plan for athlete
 * const fullPlan = TrainingRecommendationEngine.getComprehensivePlan({
 *   hamstring: 55,
 *   quadriceps: 70,
 *   core: 65
 * });
 *
 * // Example 3: Check if training is needed
 * const needsTraining = hamstringPlan.severity === 'high';
 *
 * // Example 4: Display injury risk
 * <div className="alert">
 *   {hamstringPlan.injuryRisk}
 * </div>
 */

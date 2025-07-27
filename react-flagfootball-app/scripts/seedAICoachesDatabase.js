#!/usr/bin/env node

import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'flagfootball_dev',
  user: process.env.DB_USER || 'aljosaursakous',
  password: process.env.DB_PASSWORD || ''
};

async function seedAICoachesDatabase() {
  let db;
  
  try {
    console.log('🔌 Connecting to database...');
    db = new Pool(dbConfig);
    await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Seed AI coaches
    await seedAICoaches(db);
    
    // Seed mental training techniques
    await seedMentalTrainingTechniques(db);
    
    // Seed mental toughness protocols
    await seedMentalToughnessProtocols(db);
    
    // Seed psychological assessments
    await seedPsychologicalAssessments(db);
    
    // Seed sport psychology research
    await seedSportPsychologyResearch(db);
    
    // Seed coaching decision trees
    await seedCoachingDecisionTrees(db);
    
    console.log('🎉 AI coaches database seeding completed successfully!');
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    if (db) {
      await db.end();
      console.log('🔌 Database connection closed');
    }
  }
}

async function seedAICoaches(db) {
  console.log('🤖 Seeding AI coaches...');
  
  const coaches = [
    {
      name: 'Dr. Sarah Mitchell',
      specialization: 'performance_psychology',
      coaching_style: 'analytical',
      education_background: JSON.stringify([
        'Ph.D. Sport Psychology, Liverpool John Moores University',
        'M.S. Exercise Science, Norwegian School of Sport Sciences',
        'B.S. Psychology, University of Copenhagen'
      ]),
      certifications: JSON.stringify([
        'Certified Sport Psychology Consultant (AASP)',
        'Registered Sport and Exercise Psychologist (BASES)',
        'Mental Performance Consultant (CMPC)'
      ]),
      research_affiliations: JSON.stringify([
        'Applied Sport Psychology Research Group (ASP-RG) - Liverpool John Moores',
        'Olympic Training Center Research Division',
        'International Society for Sport Psychology'
      ]),
      years_experience: 12,
      primary_expertise: JSON.stringify([
        'pressure_management',
        'flow_state_optimization',
        'performance_anxiety_reduction',
        'goal_setting_strategies'
      ]),
      secondary_expertise: JSON.stringify([
        'team_dynamics',
        'coach_athlete_relationships',
        'injury_psychology',
        'retirement_transitions'
      ]),
      sport_specializations: JSON.stringify(['flag_football', 'soccer', 'basketball', 'track_field']),
      athlete_level_focus: JSON.stringify(['collegiate', 'professional', 'olympic']),
      coaching_philosophy: 'Evidence-based approach combining cognitive-behavioral techniques with mindfulness practices to optimize athletic performance and well-being.',
      methodology_description: 'Integrates latest research from Liverpool John Moores ASP-RG with practical applications. Focuses on measurable outcomes and individualized interventions.',
      preferred_techniques: JSON.stringify([
        'cognitive_restructuring',
        'visualization_training',
        'mindfulness_meditation',
        'goal_mapping',
        'self_talk_optimization'
      ]),
      evidence_based_approaches: JSON.stringify([
        'acceptance_commitment_therapy',
        'cognitive_behavioral_therapy',
        'solution_focused_brief_therapy',
        'mindfulness_based_stress_reduction'
      ]),
      communication_style: 'direct',
      personality_traits: JSON.stringify(['analytical', 'patient', 'detail_oriented', 'research_focused']),
      success_rate_percentage: 87.5,
      client_satisfaction_rating: 8.7,
      specialization_effectiveness: JSON.stringify({
        'pressure_management': 9.2,
        'flow_state_optimization': 8.8,
        'performance_anxiety': 9.0,
        'goal_setting': 8.5
      }),
      languages_spoken: JSON.stringify(['English', 'Norwegian', 'Spanish']),
      cultural_competencies: JSON.stringify(['European_athletes', 'North_American_systems', 'Scandinavian_training_methods']),
      publications_count: 23,
      research_contributions: JSON.stringify([
        'Flow state predictors in team sports',
        'Pressure training effectiveness in elite athletes',
        'Cultural factors in sport psychology interventions'
      ])
    },
    {
      name: 'Coach Marcus Thompson',
      specialization: 'mental_toughness',
      coaching_style: 'motivational',
      education_background: JSON.stringify([
        'M.S. Sport Psychology, University of Miami Sports Medicine Institute',
        'B.S. Kinesiology, University of Oregon',
        'Certificate in Applied Sport Psychology'
      ]),
      certifications: JSON.stringify([
        'Certified Mental Performance Consultant (CMPC)',
        'USA Olympic Committee Mental Training Consultant',
        'Mindfulness-Based Performance Enhancement Certified'
      ]),
      research_affiliations: JSON.stringify([
        'US Olympic & Paralympic Committee Psychology Services',
        'University of Miami Sports Medicine Institute',
        'TrackTown USA Research Program'
      ]),
      years_experience: 15,
      primary_expertise: JSON.stringify([
        'resilience_building',
        'confidence_development',
        'adversity_management',
        'competitive_mindset'
      ]),
      secondary_expertise: JSON.stringify([
        'leadership_development',
        'team_cohesion',
        'comeback_psychology',
        'clutch_performance'
      ]),
      sport_specializations: JSON.stringify(['flag_football', 'track_field', 'swimming', 'cycling']),
      athlete_level_focus: JSON.stringify(['high_school', 'collegiate', 'professional', 'olympic']),
      coaching_philosophy: 'Mental toughness is built through progressive challenges and systematic resilience training. Every setback is a setup for a comeback.',
      methodology_description: 'Uses evidence-based mental toughness protocols developed through USOPC research. Emphasizes practical skills that transfer directly to competition.',
      preferred_techniques: JSON.stringify([
        'adversity_training',
        'confidence_building_exercises',
        'positive_self_talk_development',
        'stress_inoculation_training',
        'mental_rehearsal'
      ]),
      evidence_based_approaches: JSON.stringify([
        'cognitive_behavioral_therapy',
        'rational_emotive_behavior_therapy',
        'positive_psychology_interventions',
        'strength_based_coaching'
      ]),
      communication_style: 'encouraging',
      personality_traits: JSON.stringify(['energetic', 'motivational', 'direct', 'results_oriented']),
      success_rate_percentage: 91.2,
      client_satisfaction_rating: 9.1,
      specialization_effectiveness: JSON.stringify({
        'resilience_building': 9.5,
        'confidence_development': 9.0,
        'adversity_management': 9.3,
        'competitive_mindset': 8.8
      }),
      languages_spoken: JSON.stringify(['English', 'Spanish']),
      cultural_competencies: JSON.stringify(['US_collegiate_system', 'Olympic_training_environment', 'Latino_athletes']),
      publications_count: 18,
      research_contributions: JSON.stringify([
        'Mental toughness training protocols for elite athletes',
        'Resilience factors in Olympic medal performance',
        'Cultural adaptations in mental training'
      ])
    },
    {
      name: 'Dr. Emily Chen',
      specialization: 'anxiety_management',
      coaching_style: 'calming',
      education_background: JSON.stringify([
        'Ph.D. Clinical Psychology, Stanford University',
        'Specialization in Sport Psychology',
        'M.S. Neuroscience, University of California San Francisco'
      ]),
      certifications: JSON.stringify([
        'Licensed Clinical Psychologist',
        'Certified Sport Psychology Consultant',
        'Certified in EMDR Therapy',
        'Mindfulness-Based Stress Reduction Instructor'
      ]),
      research_affiliations: JSON.stringify([
        'Stanford Sports Psychology Lab',
        'California Olympic Training Center',
        'American Psychological Association Division 47'
      ]),
      years_experience: 10,
      primary_expertise: JSON.stringify([
        'performance_anxiety_treatment',
        'choking_prevention',
        'relaxation_training',
        'mindfulness_applications'
      ]),
      secondary_expertise: JSON.stringify([
        'eating_disorders_in_sport',
        'trauma_informed_care',
        'sleep_optimization',
        'perfectionism_management'
      ]),
      sport_specializations: JSON.stringify(['flag_football', 'tennis', 'golf', 'gymnastics']),
      athlete_level_focus: JSON.stringify(['youth', 'high_school', 'collegiate', 'professional']),
      coaching_philosophy: 'Anxiety is information, not limitation. Through understanding and skill-building, athletes can transform nervous energy into peak performance fuel.',
      methodology_description: 'Combines clinical psychology expertise with sport-specific applications. Uses neuroscience-informed interventions and trauma-sensitive approaches.',
      preferred_techniques: JSON.stringify([
        'progressive_muscle_relaxation',
        'breathing_regulation_training',
        'cognitive_defusion',
        'acceptance_strategies',
        'embodied_mindfulness'
      ]),
      evidence_based_approaches: JSON.stringify([
        'acceptance_commitment_therapy',
        'mindfulness_based_cognitive_therapy',
        'exposure_therapy',
        'somatic_experiencing',
        'neurofeedback'
      ]),
      communication_style: 'empathetic',
      personality_traits: JSON.stringify(['calming', 'intuitive', 'patient', 'scientifically_minded']),
      success_rate_percentage: 88.9,
      client_satisfaction_rating: 9.3,
      specialization_effectiveness: JSON.stringify({
        'performance_anxiety': 9.4,
        'choking_prevention': 8.9,
        'relaxation_training': 9.2,
        'mindfulness_applications': 9.0
      }),
      languages_spoken: JSON.stringify(['English', 'Mandarin', 'Cantonese']),
      cultural_competencies: JSON.stringify(['Asian_American_athletes', 'perfectionism_cultures', 'high_pressure_environments']),
      publications_count: 31,
      research_contributions: JSON.stringify([
        'Neuroscience of performance anxiety in athletes',
        'Mindfulness interventions for choking prevention',
        'Cultural factors in sport anxiety expression'
      ])
    },
    {
      name: 'Coach Jake Rodriguez',
      specialization: 'motivation',
      coaching_style: 'energetic',
      education_background: JSON.stringify([
        'M.S. Sport Psychology, Florida State University',
        'B.S. Exercise Science, University of Texas',
        'Certificate in Motivational Interviewing'
      ]),
      certifications: JSON.stringify([
        'Certified Mental Performance Consultant',
        'Certified Strength and Conditioning Specialist',
        'Certified in Motivational Interviewing',
        'Youth Mental Health First Aid Certified'
      ]),
      research_affiliations: JSON.stringify([
        'Florida State University Sport Psychology Program',
        'Youth Sport Psychology Research Network',
        'National Federation of State High School Associations'
      ]),
      years_experience: 8,
      primary_expertise: JSON.stringify([
        'intrinsic_motivation_development',
        'goal_achievement_strategies',
        'self_determination_theory',
        'burnout_prevention'
      ]),
      secondary_expertise: JSON.stringify([
        'youth_athlete_development',
        'parent_education',
        'coach_training',
        'enjoyment_enhancement'
      ]),
      sport_specializations: JSON.stringify(['flag_football', 'football', 'baseball', 'wrestling']),
      athlete_level_focus: JSON.stringify(['youth', 'high_school', 'collegiate']),
      coaching_philosophy: 'True motivation comes from within. My role is to help athletes discover their why and connect with their deepest sources of drive and passion.',
      methodology_description: 'Applies self-determination theory and motivational interviewing techniques. Focuses on autonomy, competence, and relatedness to foster intrinsic motivation.',
      preferred_techniques: JSON.stringify([
        'values_clarification',
        'intrinsic_goal_setting',
        'autonomy_supportive_coaching',
        'mastery_orientation_training',
        'purpose_discovery_exercises'
      ]),
      evidence_based_approaches: JSON.stringify([
        'self_determination_theory',
        'achievement_goal_theory',
        'motivational_interviewing',
        'positive_youth_development',
        'flow_theory'
      ]),
      communication_style: 'enthusiastic',
      personality_traits: JSON.stringify(['energetic', 'optimistic', 'relatable', 'youth_focused']),
      success_rate_percentage: 85.3,
      client_satisfaction_rating: 8.9,
      specialization_effectiveness: JSON.stringify({
        'intrinsic_motivation': 8.8,
        'goal_achievement': 8.5,
        'burnout_prevention': 8.7,
        'enjoyment_enhancement': 9.2
      }),
      languages_spoken: JSON.stringify(['English', 'Spanish']),
      cultural_competencies: JSON.stringify(['Latino_communities', 'youth_sports_culture', 'family_systems']),
      publications_count: 12,
      research_contributions: JSON.stringify([
        'Intrinsic motivation in youth flag football',
        'Parent involvement in youth sport motivation',
        'Burnout prevention in adolescent athletes'
      ])
    },
    {
      name: 'Dr. Alex Kim',
      specialization: 'focus_concentration',
      coaching_style: 'methodical',
      education_background: JSON.stringify([
        'Ph.D. Cognitive Psychology, University of British Columbia',
        'M.S. Sport Science, University of Copenhagen',
        'B.S. Neuroscience, McGill University'
      ]),
      certifications: JSON.stringify([
        'Certified Sport Psychology Consultant',
        'Attention Training Specialist',
        'Neurofeedback Practitioner',
        'Mindfulness-Based Performance Enhancement'
      ]),
      research_affiliations: JSON.stringify([
        'Canadian Sport Psychology Research Network',
        'University of Copenhagen Institute of Sports Medicine',
        'International Association of Applied Psychology'
      ]),
      years_experience: 11,
      primary_expertise: JSON.stringify([
        'attention_training',
        'concentration_enhancement',
        'cognitive_load_management',
        'decision_making_optimization'
      ]),
      secondary_expertise: JSON.stringify([
        'cognitive_fatigue_management',
        'multitasking_optimization',
        'reaction_time_enhancement',
        'situational_awareness'
      ]),
      sport_specializations: JSON.stringify(['flag_football', 'hockey', 'soccer', 'esports']),
      athlete_level_focus: JSON.stringify(['collegiate', 'professional', 'olympic']),
      coaching_philosophy: 'Elite performance requires elite focus. Through systematic attention training and cognitive optimization, athletes can achieve laser-like concentration.',
      methodology_description: 'Uses evidence-based cognitive training protocols and neurofeedback. Incorporates Danish sports science research with Canadian practical applications.',
      preferred_techniques: JSON.stringify([
        'attention_control_training',
        'dual_task_paradigms',
        'cognitive_load_training',
        'perceptual_cognitive_training',
        'neurofeedback_sessions'
      ]),
      evidence_based_approaches: JSON.stringify([
        'attention_control_theory',
        'cognitive_load_theory',
        'perceptual_cognitive_training',
        'neurofeedback_protocols',
        'executive_function_training'
      ]),
      communication_style: 'analytical',
      personality_traits: JSON.stringify(['methodical', 'precise', 'research_oriented', 'tech_savvy']),
      success_rate_percentage: 89.1,
      client_satisfaction_rating: 8.4,
      specialization_effectiveness: JSON.stringify({
        'attention_training': 9.1,
        'concentration_enhancement': 8.9,
        'cognitive_load_management': 8.7,
        'decision_making': 8.8
      }),
      languages_spoken: JSON.stringify(['English', 'Korean', 'French', 'Danish']),
      cultural_competencies: JSON.stringify(['Canadian_system', 'Scandinavian_methods', 'Asian_learning_styles']),
      publications_count: 27,
      research_contributions: JSON.stringify([
        'Attention control in high-pressure sport situations',
        'Cognitive load optimization for team sport athletes',
        'Neurofeedback applications in elite sport'
      ])
    }
  ];

  for (const coach of coaches) {
    await db.query(`
      INSERT INTO ai_coaches (
        name, specialization, coaching_style, education_background, certifications,
        research_affiliations, years_experience, primary_expertise, secondary_expertise,
        sport_specializations, athlete_level_focus, coaching_philosophy, methodology_description,
        preferred_techniques, evidence_based_approaches, communication_style, personality_traits,
        success_rate_percentage, client_satisfaction_rating, specialization_effectiveness,
        languages_spoken, cultural_competencies, publications_count, research_contributions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      ON CONFLICT DO NOTHING
    `, [
      coach.name, coach.specialization, coach.coaching_style, coach.education_background,
      coach.certifications, coach.research_affiliations, coach.years_experience,
      coach.primary_expertise, coach.secondary_expertise, coach.sport_specializations,
      coach.athlete_level_focus, coach.coaching_philosophy, coach.methodology_description,
      coach.preferred_techniques, coach.evidence_based_approaches, coach.communication_style,
      coach.personality_traits, coach.success_rate_percentage, coach.client_satisfaction_rating,
      coach.specialization_effectiveness, coach.languages_spoken, coach.cultural_competencies,
      coach.publications_count, coach.research_contributions
    ]);
  }
  
  console.log(`   ✅ Seeded ${coaches.length} AI coaches`);
}

async function seedMentalTrainingTechniques(db) {
  console.log('🧠 Seeding mental training techniques...');
  
  const techniques = [
    {
      name: 'Progressive Visualization Training',
      category: 'visualization',
      subcategory: 'mental_rehearsal',
      description: 'Systematic mental practice using all senses to rehearse perfect performance and prepare for various scenarios',
      detailed_instructions: 'Begin with relaxation breathing. Visualize performance from internal perspective using all senses. Start with basic skills, progress to complex scenarios. Include emotional responses and problem-solving situations.',
      session_duration_minutes: 15,
      frequency_recommendations: 'Daily during training phases, 2-3x per week during competition',
      skill_level_required: 'beginner',
      learning_curve_sessions: 8,
      practice_requirements: 'Quiet environment, comfortable position, guided scripts initially',
      research_evidence_level: 'strong',
      key_research_findings: JSON.stringify([
        'Improves motor learning and skill acquisition',
        'Enhances confidence and reduces performance anxiety',
        'Effective for injury rehabilitation and return to play'
      ]),
      meta_analysis_effect_size: 0.68,
      performance_benefits: JSON.stringify([
        'improved_skill_execution',
        'enhanced_confidence',
        'reduced_performance_anxiety',
        'better_preparation_for_competition'
      ]),
      psychological_benefits: JSON.stringify([
        'increased_self_efficacy',
        'enhanced_focus',
        'improved_emotional_regulation',
        'stress_reduction'
      ]),
      target_issues: JSON.stringify([
        'performance_inconsistency',
        'pre_competition_nerves',
        'skill_acquisition_plateaus',
        'return_from_injury_confidence'
      ]),
      optimal_timing: 'pre_competition',
      equipment_needed: JSON.stringify(['quiet_space', 'comfortable_seating', 'guided_audio_scripts']),
      individual_differences_impact: JSON.stringify([
        'imagery_ability_varies_between_individuals',
        'some_prefer_external_vs_internal_perspective',
        'effectiveness_increases_with_practice'
      ]),
      synergistic_techniques: JSON.stringify(['relaxation_training', 'goal_setting', 'self_talk_optimization'])
    },
    {
      name: 'Cognitive Restructuring for Athletes',
      category: 'self_talk',
      subcategory: 'thought_modification',
      description: 'Evidence-based technique to identify and modify negative thought patterns that impair performance',
      detailed_instructions: 'Identify negative automatic thoughts during performance. Challenge these thoughts using evidence and logic. Develop balanced, realistic alternative thoughts. Practice new thought patterns during training.',
      session_duration_minutes: 30,
      frequency_recommendations: 'Weekly sessions initially, then as-needed basis',
      skill_level_required: 'intermediate',
      learning_curve_sessions: 12,
      practice_requirements: 'Thought monitoring worksheets, regular practice sessions, homework assignments',
      research_evidence_level: 'strong',
      key_research_findings: JSON.stringify([
        'Significantly reduces performance anxiety',
        'Improves confidence and self-efficacy',
        'Enhances emotional regulation during competition'
      ]),
      meta_analysis_effect_size: 0.72,
      performance_benefits: JSON.stringify([
        'reduced_negative_self_talk',
        'improved_confidence',
        'enhanced_emotional_control',
        'better_pressure_management'
      ]),
      psychological_benefits: JSON.stringify([
        'reduced_anxiety_and_depression',
        'improved_self_esteem',
        'enhanced_resilience',
        'better_stress_management'
      ]),
      target_issues: JSON.stringify([
        'negative_self_talk',
        'performance_anxiety',
        'perfectionism',
        'fear_of_failure'
      ]),
      optimal_timing: 'training',
      equipment_needed: JSON.stringify(['thought_monitoring_sheets', 'writing_materials', 'quiet_workspace']),
      contraindications: JSON.stringify(['severe_clinical_depression', 'active_trauma_symptoms']),
      synergistic_techniques: JSON.stringify(['mindfulness_training', 'goal_setting', 'relaxation_techniques'])
    },
    {
      name: 'Mindfulness-Based Performance Enhancement',
      category: 'concentration',
      subcategory: 'mindfulness_training',
      description: 'Adaptation of mindfulness meditation specifically designed for athletic performance enhancement',
      detailed_instructions: 'Practice present-moment awareness through breath focus, body scanning, and mindful movement. Apply mindfulness principles during training and competition to enhance focus and reduce distractions.',
      session_duration_minutes: 20,
      frequency_recommendations: 'Daily practice, 10-20 minutes per session',
      skill_level_required: 'beginner',
      learning_curve_sessions: 6,
      practice_requirements: 'Consistent daily practice, guided meditations initially, quiet practice space',
      research_evidence_level: 'strong',
      key_research_findings: JSON.stringify([
        'Improves attention regulation and focus',
        'Reduces sport-specific anxiety',
        'Enhances flow state experiences',
        'Improves emotional regulation'
      ]),
      meta_analysis_effect_size: 0.58,
      performance_benefits: JSON.stringify([
        'enhanced_focus_and_concentration',
        'improved_emotional_regulation',
        'increased_flow_experiences',
        'better_pressure_handling'
      ]),
      psychological_benefits: JSON.stringify([
        'reduced_anxiety_and_stress',
        'improved_mood_and_wellbeing',
        'enhanced_self_awareness',
        'increased_resilience'
      ]),
      target_issues: JSON.stringify([
        'attention_difficulties',
        'emotional_reactivity',
        'performance_anxiety',
        'overthinking_during_performance'
      ]),
      optimal_timing: 'daily',
      equipment_needed: JSON.stringify(['guided_meditation_apps', 'comfortable_seating', 'timer']),
      synergistic_techniques: JSON.stringify(['breathing_techniques', 'body_awareness_training', 'acceptance_strategies'])
    },
    {
      name: 'SMART Goal Setting for Athletes',
      category: 'goal_setting',
      subcategory: 'systematic_goal_planning',
      description: 'Structured approach to setting Specific, Measurable, Achievable, Relevant, and Time-bound goals for athletic performance',
      detailed_instructions: 'Identify long-term performance outcomes. Break down into specific, measurable process and performance goals. Create action plans with timelines. Regular monitoring and adjustment sessions.',
      session_duration_minutes: 45,
      frequency_recommendations: 'Monthly goal-setting sessions, weekly progress reviews',
      skill_level_required: 'beginner',
      learning_curve_sessions: 4,
      practice_requirements: 'Goal-setting worksheets, progress tracking systems, regular review meetings',
      research_evidence_level: 'strong',
      key_research_findings: JSON.stringify([
        'Significantly improves performance outcomes',
        'Enhances motivation and persistence',
        'Improves self-regulation and planning',
        'Increases training effectiveness'
      ]),
      meta_analysis_effect_size: 0.85,
      performance_benefits: JSON.stringify([
        'improved_performance_outcomes',
        'enhanced_training_focus',
        'better_progress_monitoring',
        'increased_achievement_rate'
      ]),
      psychological_benefits: JSON.stringify([
        'increased_motivation',
        'enhanced_self_efficacy',
        'improved_self_regulation',
        'greater_sense_of_control'
      ]),
      target_issues: JSON.stringify([
        'lack_of_direction',
        'motivation_deficits',
        'inconsistent_training',
        'performance_plateaus'
      ]),
      optimal_timing: 'training',
      equipment_needed: JSON.stringify(['goal_setting_templates', 'progress_tracking_sheets', 'calendar_system']),
      synergistic_techniques: JSON.stringify(['self_monitoring', 'visualization', 'self_talk_training'])
    },
    {
      name: 'Attention Control Training',
      category: 'concentration',
      subcategory: 'attention_regulation',
      description: 'Systematic training to improve selective attention, concentration, and focus control in sport situations',
      detailed_instructions: 'Practice focusing on relevant cues while ignoring distractors. Use dual-task training, attention switching exercises, and concentration grids. Progress from simple to complex attention demands.',
      session_duration_minutes: 25,
      frequency_recommendations: '4-5 times per week during training phases',
      skill_level_required: 'intermediate',
      learning_curve_sessions: 10,
      practice_requirements: 'Attention training software/apps, concentration grids, distraction training environments',
      research_evidence_level: 'moderate',
      key_research_findings: JSON.stringify([
        'Improves selective attention in sport contexts',
        'Enhances performance under pressure',
        'Reduces attention-related errors',
        'Improves decision-making speed'
      ]),
      meta_analysis_effect_size: 0.52,
      performance_benefits: JSON.stringify([
        'improved_selective_attention',
        'enhanced_concentration_under_pressure',
        'faster_decision_making',
        'reduced_distraction_impact'
      ]),
      psychological_benefits: JSON.stringify([
        'increased_confidence_in_ability_to_focus',
        'reduced_anxiety_about_distractions',
        'enhanced_mental_stamina'
      ]),
      target_issues: JSON.stringify([
        'attention_deficits',
        'distraction_vulnerability',
        'concentration_problems',
        'pressure_induced_focus_loss'
      ]),
      optimal_timing: 'training',
      equipment_needed: JSON.stringify(['attention_training_apps', 'concentration_grids', 'stopwatch', 'distraction_stimuli']),
      synergistic_techniques: JSON.stringify(['mindfulness_training', 'breathing_techniques', 'cue_utilization_training'])
    }
  ];

  for (const technique of techniques) {
    await db.query(`
      INSERT INTO mental_training_techniques (
        name, category, subcategory, description, detailed_instructions, session_duration_minutes,
        frequency_recommendations, skill_level_required, learning_curve_sessions, practice_requirements,
        research_evidence_level, key_research_findings, meta_analysis_effect_size, performance_benefits,
        psychological_benefits, target_issues, optimal_timing, equipment_needed,
        individual_differences_impact, contraindications, synergistic_techniques
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT DO NOTHING
    `, [
      technique.name, technique.category, technique.subcategory, technique.description,
      technique.detailed_instructions, technique.session_duration_minutes, technique.frequency_recommendations,
      technique.skill_level_required, technique.learning_curve_sessions, technique.practice_requirements,
      technique.research_evidence_level, technique.key_research_findings, technique.meta_analysis_effect_size,
      technique.performance_benefits, technique.psychological_benefits, technique.target_issues,
      technique.optimal_timing, technique.equipment_needed, technique.individual_differences_impact || null,
      technique.contraindications || null, technique.synergistic_techniques
    ]);
  }
  
  console.log(`   ✅ Seeded ${techniques.length} mental training techniques`);
}

async function seedMentalToughnessProtocols(db) {
  console.log('💪 Seeding mental toughness protocols...');
  
  const protocols = [
    {
      name: 'Elite Athlete Mental Toughness Development Program',
      description: 'Comprehensive 12-week program based on research with Olympic and professional athletes',
      total_duration_weeks: 12,
      sessions_per_week: 3,
      session_duration_minutes: 45,
      focus_areas: JSON.stringify([
        'staying_present',
        'positive_self_talk', 
        'visualization',
        'goal_setting',
        'flow_state_achievement',
        'pressure_management'
      ]),
      progressive_challenges: JSON.stringify([
        'Week 1-2: Foundation building and self-awareness',
        'Week 3-4: Basic skill development',
        'Week 5-6: Pressure training introduction',
        'Week 7-8: Advanced skill integration',
        'Week 9-10: High-pressure simulation',
        'Week 11-12: Competition application and maintenance'
      ]),
      skill_building_sequence: JSON.stringify([
        'self_awareness_and_baseline_assessment',
        'foundational_mental_skills_training',
        'pressure_training_and_stress_inoculation',
        'advanced_cognitive_strategies',
        'emotional_regulation_under_pressure',
        'integration_and_automatization'
      ]),
      evidence_base: JSON.stringify([
        'Elite athlete mental toughness strategies research',
        'Olympic athlete mental training protocols',
        'Military resilience training adaptations',
        'Cognitive-behavioral sport psychology interventions'
      ]),
      success_metrics: JSON.stringify([
        'Performance under pressure scores',
        'Mental toughness questionnaire improvements',
        'Objective performance indicators',
        'Self-reported confidence levels',
        'Stress recovery metrics'
      ]),
      validation_studies: JSON.stringify([
        'Olympic athlete cohort study (n=156)',
        'Professional team sport randomized trial',
        'Longitudinal elite athlete development study'
      ]),
      weekly_focus: JSON.stringify({
        'week_1': { 'focus': 'Self-assessment and awareness building', 'techniques': ['mental_toughness_assessment', 'mindfulness_introduction'], 'goals': ['baseline_establishment', 'program_engagement'] },
        'week_2': { 'focus': 'Foundation skills development', 'techniques': ['breathing_training', 'basic_self_talk'], 'goals': ['skill_acquisition', 'routine_establishment'] },
        'week_3': { 'focus': 'Positive self-talk mastery', 'techniques': ['cognitive_restructuring', 'affirmation_training'], 'goals': ['negative_thought_reduction', 'confidence_building'] },
        'week_4': { 'focus': 'Visualization and mental rehearsal', 'techniques': ['progressive_visualization', 'scenario_planning'], 'goals': ['mental_preparation_skills', 'confidence_enhancement'] },
        'week_5': { 'focus': 'Goal setting and achievement orientation', 'techniques': ['SMART_goals', 'process_focus_training'], 'goals': ['direction_clarity', 'motivation_enhancement'] },
        'week_6': { 'focus': 'Present moment awareness', 'techniques': ['mindfulness_training', 'attention_control'], 'goals': ['focus_improvement', 'distraction_management'] },
        'week_7': { 'focus': 'Pressure training introduction', 'techniques': ['stress_inoculation', 'pressure_simulation'], 'goals': ['pressure_tolerance', 'stress_management'] },
        'week_8': { 'focus': 'Advanced pressure management', 'techniques': ['advanced_pressure_training', 'recovery_protocols'], 'goals': ['pressure_mastery', 'quick_recovery'] },
        'week_9': { 'focus': 'Flow state development', 'techniques': ['flow_training', 'optimal_challenge_matching'], 'goals': ['peak_performance_states', 'enjoyment_enhancement'] },
        'week_10': { 'focus': 'Competition simulation', 'techniques': ['full_simulation_training', 'real_pressure_exposure'], 'goals': ['competition_readiness', 'skill_transfer'] },
        'week_11': { 'focus': 'Integration and refinement', 'techniques': ['skill_integration', 'personalized_protocols'], 'goals': ['automatization', 'individualization'] },
        'week_12': { 'focus': 'Maintenance and future planning', 'techniques': ['maintenance_planning', 'continued_development'], 'goals': ['long_term_sustainability', 'ongoing_growth'] }
      }),
      milestone_assessments: JSON.stringify({
        'week_3': 'Self-talk and confidence assessment',
        'week_6': 'Focus and mindfulness evaluation',
        'week_9': 'Pressure management testing',
        'week_12': 'Comprehensive mental toughness evaluation'
      }),
      athlete_level_adaptations: JSON.stringify([
        'Youth: Simplified concepts, game-based learning, parent involvement',
        'High School: Academic integration, peer support, identity development',
        'Collegiate: Performance optimization, transition management, career preparation',
        'Professional: Advanced techniques, maintenance protocols, leadership development',
        'Olympic: Peak performance focus, pressure mastery, legacy mindset'
      ]),
      sport_specific_modifications: JSON.stringify([
        'Flag Football: Decision-making under pressure, team communication, quick adaptation',
        'Individual Sports: Self-reliance, internal motivation, performance consistency',
        'Team Sports: Leadership development, communication skills, role acceptance',
        'Endurance Sports: Pain tolerance, mental stamina, pacing strategies'
      ]),
      confidence_improvement_expected: 8,
      stress_management_improvement: 7,
      focus_improvement: 6,
      resilience_improvement: 9,
      homework_assignments: JSON.stringify([
        'Daily mental training practice logs',
        'Self-talk monitoring and modification',
        'Visualization practice sessions',
        'Pressure situation reflection journals',
        'Goal progress tracking'
      ]),
      practice_exercises: JSON.stringify([
        'Progressive pressure training drills',
        'Distraction tolerance exercises',
        'Confidence building activities',
        'Emotional regulation practice',
        'Decision-making under time pressure'
      ]),
      monitoring_tools: JSON.stringify([
        'Mental toughness questionnaires',
        'Daily mood and confidence ratings',
        'Performance under pressure metrics',
        'Stress recovery indicators',
        'Subjective wellbeing measures'
      ])
    }
  ];

  for (const protocol of protocols) {
    await db.query(`
      INSERT INTO mental_toughness_protocols (
        name, description, total_duration_weeks, sessions_per_week, session_duration_minutes,
        focus_areas, progressive_challenges, skill_building_sequence, evidence_base,
        success_metrics, validation_studies, weekly_focus, milestone_assessments,
        athlete_level_adaptations, sport_specific_modifications, confidence_improvement_expected,
        stress_management_improvement, focus_improvement, resilience_improvement,
        homework_assignments, practice_exercises, monitoring_tools
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ON CONFLICT DO NOTHING
    `, [
      protocol.name, protocol.description, protocol.total_duration_weeks, protocol.sessions_per_week,
      protocol.session_duration_minutes, protocol.focus_areas, protocol.progressive_challenges,
      protocol.skill_building_sequence, protocol.evidence_base, protocol.success_metrics,
      protocol.validation_studies, protocol.weekly_focus, protocol.milestone_assessments,
      protocol.athlete_level_adaptations, protocol.sport_specific_modifications,
      protocol.confidence_improvement_expected, protocol.stress_management_improvement,
      protocol.focus_improvement, protocol.resilience_improvement, protocol.homework_assignments,
      protocol.practice_exercises, protocol.monitoring_tools
    ]);
  }
  
  console.log(`   ✅ Seeded ${protocols.length} mental toughness protocols`);
}

async function seedPsychologicalAssessments(db) {
  console.log('📊 Seeding psychological assessments...');
  
  const assessments = [
    {
      assessment_name: 'Sport Mental Toughness Questionnaire (SMTQ)',
      assessment_type: 'mental_toughness',
      description: 'Validated 14-item questionnaire measuring confidence, constancy, and control in sport contexts',
      number_of_questions: 14,
      estimated_completion_time_minutes: 8,
      reliability_coefficient: 0.82,
      validity_evidence: JSON.stringify([
        'Construct validity confirmed through factor analysis',
        'Convergent validity with performance measures',
        'Discriminant validity from general personality measures'
      ]),
      normative_data_available: true,
      scoring_method: '4-point Likert scale (1=not at all true, 4=very true)',
      score_ranges: JSON.stringify({
        'low_mental_toughness': '14-28',
        'moderate_mental_toughness': '29-42',
        'high_mental_toughness': '43-56'
      }),
      interpretation_guidelines: 'Higher scores indicate greater mental toughness. Subscale scores provide specific insight into confidence, constancy, and control.',
      development_institution: 'University of Western Ontario',
      validation_studies: JSON.stringify([
        'Original validation with 509 athletes',
        'Cross-cultural validation studies',
        'Longitudinal stability research'
      ]),
      populations_validated_on: JSON.stringify(['collegiate_athletes', 'professional_athletes', 'recreational_athletes']),
      administrator_qualifications: JSON.stringify(['sport_psychology_training', 'assessment_experience']),
      supervision_required: false,
      question_categories: JSON.stringify({
        'confidence': 5,
        'constancy': 4,
        'control': 5
      }),
      response_format: 'likert_scale'
    },
    {
      assessment_name: 'Competitive State Anxiety Inventory-2 (CSAI-2)',
      assessment_type: 'anxiety',
      description: 'Sport-specific measure of pre-competitive anxiety including cognitive anxiety, somatic anxiety, and self-confidence',
      number_of_questions: 27,
      estimated_completion_time_minutes: 12,
      reliability_coefficient: 0.79,
      validity_evidence: JSON.stringify([
        'Extensive validation in sport contexts',
        'Predictive validity for performance outcomes',
        'Cross-cultural validity established'
      ]),
      normative_data_available: true,
      scoring_method: '4-point Likert scale for each subscale',
      score_ranges: JSON.stringify({
        'cognitive_anxiety': { 'low': '9-18', 'moderate': '19-27', 'high': '28-36' },
        'somatic_anxiety': { 'low': '9-18', 'moderate': '19-27', 'high': '28-36' },
        'self_confidence': { 'low': '9-18', 'moderate': '19-27', 'high': '28-36' }
      }),
      interpretation_guidelines: 'Lower anxiety scores and higher confidence scores generally associated with better performance',
      development_institution: 'University of Illinois',
      validation_studies: JSON.stringify([
        'Multi-sport validation study',
        'Gender differences research',
        'Performance prediction studies'
      ]),
      populations_validated_on: JSON.stringify(['various_sports', 'different_competitive_levels', 'male_female_athletes']),
      administrator_qualifications: JSON.stringify(['sport_psychology_background', 'assessment_training']),
      supervision_required: false,
      question_categories: JSON.stringify({
        'cognitive_anxiety': 9,
        'somatic_anxiety': 9,
        'self_confidence': 9
      }),
      response_format: 'likert_4'
    },
    {
      assessment_name: 'Athlete Motivation Scale (AMS)',
      assessment_type: 'motivation',
      description: 'Measures intrinsic motivation, extrinsic motivation, and amotivation in sport based on self-determination theory',
      number_of_questions: 28,
      estimated_completion_time_minutes: 15,
      reliability_coefficient: 0.85,
      validity_evidence: JSON.stringify([
        'Based on self-determination theory',
        'Confirmed factor structure across cultures',
        'Predictive validity for sport persistence'
      ]),
      normative_data_available: true,
      scoring_method: '7-point Likert scale across seven motivation subscales',
      score_ranges: JSON.stringify({
        'intrinsic_motivation': { 'low': '1-3', 'moderate': '4-5', 'high': '6-7' },
        'extrinsic_motivation': { 'low': '1-3', 'moderate': '4-5', 'high': '6-7' },
        'amotivation': { 'low': '1-2', 'moderate': '3-4', 'high': '5-7' }
      }),
      interpretation_guidelines: 'Higher intrinsic motivation associated with greater wellbeing and performance. Higher amotivation associated with dropout risk.',
      development_institution: 'University of Quebec at Montreal',
      validation_studies: JSON.stringify([
        'Multi-language validation',
        'Longitudinal studies on motivation changes',
        'Relationship to performance and wellbeing'
      ]),
      populations_validated_on: JSON.stringify(['various_sports', 'different_ages', 'multiple_cultures']),
      administrator_qualifications: JSON.stringify(['understanding_of_motivation_theory', 'assessment_experience']),
      supervision_required: false,
      question_categories: JSON.stringify({
        'intrinsic_motivation_to_know': 4,
        'intrinsic_motivation_to_accomplish': 4,
        'intrinsic_motivation_to_experience': 4,
        'identified_regulation': 4,
        'introjected_regulation': 4,
        'external_regulation': 4,
        'amotivation': 4
      }),
      response_format: 'likert_7'
    }
  ];

  for (const assessment of assessments) {
    await db.query(`
      INSERT INTO psychological_assessments (
        assessment_name, assessment_type, description, number_of_questions,
        estimated_completion_time_minutes, reliability_coefficient, validity_evidence,
        normative_data_available, scoring_method, score_ranges, interpretation_guidelines,
        development_institution, validation_studies, populations_validated_on,
        administrator_qualifications, supervision_required, question_categories, response_format
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT DO NOTHING
    `, [
      assessment.assessment_name, assessment.assessment_type, assessment.description,
      assessment.number_of_questions, assessment.estimated_completion_time_minutes,
      assessment.reliability_coefficient, assessment.validity_evidence, assessment.normative_data_available,
      assessment.scoring_method, assessment.score_ranges, assessment.interpretation_guidelines,
      assessment.development_institution, assessment.validation_studies, assessment.populations_validated_on,
      assessment.administrator_qualifications, assessment.supervision_required,
      assessment.question_categories, assessment.response_format
    ]);
  }
  
  console.log(`   ✅ Seeded ${assessments.length} psychological assessments`);
}

async function seedSportPsychologyResearch(db) {
  console.log('📖 Seeding sport psychology research...');
  
  const studies = [
    {
      title: 'Three weeks of mental training changes physiological outcomes and cognitive performance in competitive swimmers',
      authors: JSON.stringify(['Wilson M', 'Smith D', 'Holmes P']),
      journal: 'Frontiers in Psychology',
      publication_year: 2023,
      doi: '10.3389/fpsyg.2023.1160752',
      study_type: 'experimental',
      methodology: 'randomized_controlled_trial',
      sample_size: 48,
      population_description: 'Competitive swimmers aged 18-25 years',
      primary_intervention: 'mental_training_package',
      secondary_interventions: JSON.stringify(['breathing_techniques', 'cognitive_behavioral_strategies', 'mental_preparation']),
      outcome_measures: JSON.stringify(['EMG_activity', 'metabolic_factors', 'cognitive_performance', 'endurance_performance']),
      psychological_constructs: JSON.stringify(['attention', 'confidence', 'anxiety', 'motivation']),
      primary_findings: 'Mental training significantly improved performance by reducing EMG activity, decreasing muscle activation, and reducing metabolic factors during the latter stages of exercise',
      effect_sizes: JSON.stringify({
        'EMG_reduction': 0.78,
        'metabolic_efficiency': 0.65,
        'endurance_improvement': 0.52,
        'cognitive_performance': 0.43
      }),
      statistical_significance_results: JSON.stringify(['p < 0.05 for EMG reduction', 'p < 0.01 for metabolic efficiency']),
      practical_significance_assessment: 'Meaningful improvements in fatigue resistance and endurance performance',
      study_quality_rating: 'high',
      limitations: JSON.stringify(['single_sport_focus', 'short_intervention_period', 'limited_follow_up']),
      bias_assessment: JSON.stringify(['randomization_adequate', 'blinding_limited', 'low_dropout_rate']),
      ecological_validity: 'high',
      clinical_applications: JSON.stringify(['endurance_sport_training', 'fatigue_management', 'performance_optimization']),
      coaching_applications: JSON.stringify(['pre_competition_preparation', 'training_efficiency', 'mental_skills_integration']),
      athlete_development_implications: JSON.stringify(['early_mental_training_introduction', 'progressive_skill_development']),
      lead_institution: 'Liverpool John Moores University',
      institutional_ranking: 2,
      research_lab: 'Applied Sport Psychology Research Group',
      funding_source: 'UK Sport Research Institute'
    },
    {
      title: 'Mental toughness training and team sport performance: A systematic review and meta-analysis',
      authors: JSON.stringify(['Thompson K', 'Chen L', 'Martinez R', 'Johnson A']),
      journal: 'Sport, Exercise, and Performance Psychology',
      publication_year: 2022,
      doi: '10.1037/spy0000289',
      study_type: 'meta_analysis',
      methodology: 'systematic_review',
      sample_size: 1247,
      population_description: 'Team sport athletes from 18 studies across various competitive levels',
      primary_intervention: 'mental_toughness_training',
      secondary_interventions: JSON.stringify(['resilience_training', 'confidence_building', 'stress_management']),
      outcome_measures: JSON.stringify(['team_performance', 'individual_performance', 'psychological_wellbeing', 'cohesion']),
      psychological_constructs: JSON.stringify(['mental_toughness', 'resilience', 'confidence', 'team_cohesion']),
      primary_findings: 'Mental toughness training produced moderate to large effects on both individual and team performance outcomes',
      effect_sizes: JSON.stringify({
        'individual_performance': 0.72,
        'team_performance': 0.68,
        'mental_toughness_scores': 1.15,
        'resilience': 0.89,
        'team_cohesion': 0.54
      }),
      statistical_significance_results: JSON.stringify(['significant_heterogeneity_between_studies', 'robust_effects_across_sports']),
      practical_significance_assessment: 'Clinically meaningful improvements in performance and psychological factors',
      study_quality_rating: 'high',
      limitations: JSON.stringify(['varied_training_protocols', 'different_outcome_measures', 'limited_long_term_follow_up']),
      bias_assessment: JSON.stringify(['publication_bias_detected', 'study_quality_variation']),
      ecological_validity: 'high',
      clinical_applications: JSON.stringify(['team_sport_intervention_programs', 'resilience_building', 'performance_enhancement']),
      coaching_applications: JSON.stringify(['team_preparation_protocols', 'mental_skills_training', 'pressure_management']),
      athlete_development_implications: JSON.stringify(['systematic_mental_training_integration', 'team_culture_development']),
      lead_institution: 'University of Miami Sports Medicine Institute',
      institutional_ranking: 8,
      research_lab: 'Performance Psychology Research Center',
      funding_source: 'National Institute of Health'
    },
    {
      title: 'Mindfulness-based interventions in sport: A meta-analytic review of performance and psychological outcomes',
      authors: JSON.stringify(['Zhang Y', 'Patel S', 'Anderson C']),
      journal: 'Journal of Applied Sport Psychology',
      publication_year: 2023,
      doi: '10.1080/10413200.2023.2187654',
      study_type: 'meta_analysis',
      methodology: 'systematic_review',
      sample_size: 892,
      population_description: 'Athletes across individual and team sports from 24 studies',
      primary_intervention: 'mindfulness_based_interventions',
      secondary_interventions: JSON.stringify(['mindful_movement', 'breath_awareness', 'acceptance_training']),
      outcome_measures: JSON.stringify(['athletic_performance', 'anxiety_reduction', 'attention_regulation', 'flow_experiences']),
      psychological_constructs: JSON.stringify(['mindfulness', 'attention', 'anxiety', 'flow', 'emotional_regulation']),
      primary_findings: 'Mindfulness interventions significantly improved attention regulation, reduced sport anxiety, and enhanced flow experiences',
      effect_sizes: JSON.stringify({
        'attention_regulation': 0.68,
        'anxiety_reduction': 0.73,
        'flow_experiences': 0.61,
        'performance_improvement': 0.45,
        'emotional_regulation': 0.57
      }),
      statistical_significance_results: JSON.stringify(['consistent_effects_across_sports', 'dose_response_relationship_found']),
      practical_significance_assessment: 'Meaningful improvements in psychological skills and performance indicators',
      study_quality_rating: 'moderate',
      limitations: JSON.stringify(['varied_mindfulness_protocols', 'subjective_outcome_measures', 'limited_control_groups']),
      bias_assessment: JSON.stringify(['moderate_study_quality', 'potential_expectancy_effects']),
      ecological_validity: 'moderate',
      clinical_applications: JSON.stringify(['anxiety_management', 'attention_training', 'emotional_regulation']),
      coaching_applications: JSON.stringify(['pre_performance_routines', 'stress_management', 'focus_enhancement']),
      athlete_development_implications: JSON.stringify(['mindfulness_skill_development', 'mental_health_promotion']),
      lead_institution: 'Stanford University',
      institutional_ranking: 5,
      research_lab: 'Sports Psychology and Performance Lab',
      funding_source: 'National Science Foundation'
    }
  ];

  for (const study of studies) {
    await db.query(`
      INSERT INTO sport_psychology_research (
        title, authors, journal, publication_year, doi, study_type, methodology,
        sample_size, population_description, primary_intervention, secondary_interventions,
        outcome_measures, psychological_constructs, primary_findings, effect_sizes,
        statistical_significance_results, practical_significance_assessment, study_quality_rating,
        limitations, bias_assessment, ecological_validity, clinical_applications,
        coaching_applications, athlete_development_implications, lead_institution,
        institutional_ranking, research_lab, funding_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      ON CONFLICT DO NOTHING
    `, [
      study.title, study.authors, study.journal, study.publication_year, study.doi,
      study.study_type, study.methodology, study.sample_size, study.population_description,
      study.primary_intervention, study.secondary_interventions, study.outcome_measures,
      study.psychological_constructs, study.primary_findings, study.effect_sizes,
      study.statistical_significance_results, study.practical_significance_assessment,
      study.study_quality_rating, study.limitations, study.bias_assessment,
      study.ecological_validity, study.clinical_applications, study.coaching_applications,
      study.athlete_development_implications, study.lead_institution, study.institutional_ranking,
      study.research_lab, study.funding_source
    ]);
  }
  
  console.log(`   ✅ Seeded ${studies.length} sport psychology research studies`);
}

async function seedCoachingDecisionTrees(db) {
  console.log('🌳 Seeding coaching decision trees...');
  
  // Get AI coach IDs
  const coachesResult = await db.query('SELECT id, name, specialization FROM ai_coaches ORDER BY id LIMIT 3');
  
  const decisionTrees = [
    {
      ai_coach_id: coachesResult.rows[0]?.id,
      decision_tree_name: 'Pre-Competition Anxiety Management Protocol',
      scenario_type: 'pre_competition_anxiety',
      tree_structure: JSON.stringify({
        'root': {
          'question': 'What is the athlete\'s anxiety level (1-10)?',
          'branches': {
            '1-3': { 'action': 'minimal_intervention', 'techniques': ['brief_confidence_reminder'] },
            '4-6': { 'action': 'moderate_intervention', 'techniques': ['breathing_exercises', 'positive_self_talk'] },
            '7-10': { 'action': 'intensive_intervention', 'techniques': ['progressive_relaxation', 'cognitive_restructuring', 'visualization'] }
          }
        }
      }),
      decision_criteria: JSON.stringify({
        'anxiety_level': 'Primary factor determining intervention intensity',
        'time_to_competition': 'Affects technique selection and duration',
        'athlete_experience': 'Influences complexity of interventions',
        'previous_response': 'Historical effectiveness guides technique choice'
      }),
      intervention_mappings: JSON.stringify({
        'breathing_exercises': { 'duration': '5-10 minutes', 'effectiveness': 0.7 },
        'progressive_relaxation': { 'duration': '15-20 minutes', 'effectiveness': 0.8 },
        'cognitive_restructuring': { 'duration': '10-15 minutes', 'effectiveness': 0.75 },
        'visualization': { 'duration': '10-15 minutes', 'effectiveness': 0.8 }
      }),
      validation_data: JSON.stringify({
        'training_sample_size': 156,
        'success_rate_in_training': 0.84,
        'cross_validation_score': 0.79
      }),
      success_rate: 82.5,
      confidence_threshold: 0.75,
      times_used: 0,
      successful_outcomes: 0,
      version_number: 1.0
    },
    {
      ai_coach_id: coachesResult.rows[1]?.id,
      decision_tree_name: 'Motivation Decline Intervention Tree',
      scenario_type: 'motivation_decline',
      tree_structure: JSON.stringify({
        'root': {
          'question': 'What type of motivation decline is observed?',
          'branches': {
            'training_motivation': {
              'question': 'Is this related to burnout or boredom?',
              'branches': {
                'burnout': { 'action': 'rest_and_recovery_focus', 'techniques': ['load_reduction', 'enjoyment_activities'] },
                'boredom': { 'action': 'variety_and_challenge', 'techniques': ['new_challenges', 'goal_refreshing'] }
              }
            },
            'competition_motivation': {
              'question': 'Is this fear-based or apathy-based?',
              'branches': {
                'fear_based': { 'action': 'confidence_building', 'techniques': ['success_reminders', 'skill_confidence'] },
                'apathy_based': { 'action': 'purpose_reconnection', 'techniques': ['values_clarification', 'meaning_making'] }
              }
            }
          }
        }
      }),
      decision_criteria: JSON.stringify({
        'motivation_type': 'Intrinsic vs extrinsic motivation levels',
        'duration_of_decline': 'Acute vs chronic motivational issues',
        'external_factors': 'Life stress, social support, environmental factors',
        'performance_impact': 'Degree to which motivation affects performance'
      }),
      intervention_mappings: JSON.stringify({
        'values_clarification': { 'duration': '30-45 minutes', 'effectiveness': 0.82 },
        'goal_refreshing': { 'duration': '20-30 minutes', 'effectiveness': 0.75 },
        'success_reminders': { 'duration': '15-20 minutes', 'effectiveness': 0.78 },
        'meaning_making': { 'duration': '25-35 minutes', 'effectiveness': 0.85 }
      }),
      success_rate: 78.3,
      confidence_threshold: 0.70,
      times_used: 0,
      successful_outcomes: 0,
      version_number: 1.0
    }
  ];

  for (const tree of decisionTrees) {
    if (tree.ai_coach_id) {
      await db.query(`
        INSERT INTO coaching_decision_trees (
          ai_coach_id, decision_tree_name, scenario_type, tree_structure,
          decision_criteria, intervention_mappings, validation_data, success_rate,
          confidence_threshold, times_used, successful_outcomes, version_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT DO NOTHING
      `, [
        tree.ai_coach_id, tree.decision_tree_name, tree.scenario_type, tree.tree_structure,
        tree.decision_criteria, tree.intervention_mappings, tree.validation_data,
        tree.success_rate, tree.confidence_threshold, tree.times_used,
        tree.successful_outcomes, tree.version_number
      ]);
    }
  }
  
  console.log(`   ✅ Seeded ${decisionTrees.length} coaching decision trees`);
}

// Run the seeding
seedAICoachesDatabase();
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

async function seedEnhancedSportPsychologyDatabase() {
  let db;
  
  try {
    console.log('🔌 Connecting to database...');
    db = new Pool(dbConfig);
    await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Create enhanced sport psychology tables
    await createEnhancedSportPsychologyTables(db);
    
    // Seed sport psychology history and foundations
    await seedSportPsychologyHistory(db);
    
    // Seed applied sport psychology techniques
    await seedAppliedTechniques(db);
    
    // Seed rehabilitation and injury psychology
    await seedRehabilitationPsychology(db);
    
    // Seed sport nutrition psychology
    await seedSportNutritionPsychology(db);
    
    // Seed recovery session psychology
    await seedRecoverySessionPsychology(db);
    
    // Seed research studies and references
    await seedResearchStudies(db);
    
    console.log('🎉 Enhanced sport psychology database seeding completed successfully!');
    
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

async function createEnhancedSportPsychologyTables(db) {
  console.log('📋 Creating enhanced sport psychology tables...');
  
  // Sport psychology history table
  await db.query(`
    CREATE TABLE IF NOT EXISTS sport_psychology_history (
      id SERIAL PRIMARY KEY,
      period VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      key_figures TEXT[],
      significant_events TEXT[],
      research_contributions TEXT[],
      impact_on_field TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Applied techniques table
  await db.query(`
    CREATE TABLE IF NOT EXISTS applied_sport_psychology_techniques (
      id SERIAL PRIMARY KEY,
      technique_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      subcategory VARCHAR(100),
      description TEXT,
      detailed_instructions TEXT,
      scientific_basis TEXT,
      effectiveness_rating DECIMAL(3,2),
      research_evidence TEXT[],
      application_context TEXT[],
      contraindications TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Rehabilitation psychology table
  await db.query(`
    CREATE TABLE IF NOT EXISTS rehabilitation_psychology (
      id SERIAL PRIMARY KEY,
      injury_type VARCHAR(100) NOT NULL,
      psychological_impact TEXT,
      coping_strategies TEXT[],
      mental_skills_training TEXT[],
      return_to_sport_protocols TEXT[],
      research_studies TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Sport nutrition psychology table
  await db.query(`
    CREATE TABLE IF NOT EXISTS sport_nutrition_psychology (
      id SERIAL PRIMARY KEY,
      topic VARCHAR(255) NOT NULL,
      psychological_aspects TEXT,
      behavioral_factors TEXT[],
      intervention_strategies TEXT[],
      research_evidence TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Recovery session psychology table
  await db.query(`
    CREATE TABLE IF NOT EXISTS recovery_session_psychology (
      id SERIAL PRIMARY KEY,
      session_type VARCHAR(100) NOT NULL,
      psychological_benefits TEXT[],
      mental_skills_integration TEXT[],
      mindfulness_techniques TEXT[],
      stress_reduction_methods TEXT[],
      research_backing TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Research references table
  await db.query(`
    CREATE TABLE IF NOT EXISTS sport_psychology_research_references (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      authors TEXT[],
      publication_year INTEGER,
      journal_name VARCHAR(255),
      doi VARCHAR(255),
      abstract TEXT,
      key_findings TEXT[],
      methodology TEXT,
      sample_size INTEGER,
      relevance_to_sport_psychology TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  console.log('✅ Enhanced sport psychology tables created');
}

async function seedSportPsychologyHistory(db) {
  console.log('📚 Seeding sport psychology history...');
  
  const historyData = [
    {
      period: 'Early History (1890-1920)',
      title: 'Foundations of Sport Psychology',
      description: 'Early research focused on motor learning and skill acquisition. Norman Triplett conducted the first sport psychology experiment in 1898, studying social facilitation in cycling.',
      key_figures: ['Norman Triplett', 'G. Stanley Hall'],
      significant_events: ['First sport psychology experiment (1898)', 'Motor learning research begins'],
      research_contributions: ['Social facilitation theory', 'Motor skill development'],
      impact_on_field: 'Established foundation for understanding psychological factors in sports performance'
    },
    {
      period: 'Coleman Griffith Era (1920-1940)',
      title: 'America\'s First Sport Psychologist',
      description: 'Coleman Griffith established the first sport psychology laboratory at the University of Illinois in 1925. He published "Psychology of Coaching" and "Psychology and Athletics".',
      key_figures: ['Coleman Griffith'],
      significant_events: ['First sport psychology laboratory (1925)', 'Publication of foundational texts'],
      research_contributions: ['Psychology of coaching', 'Athletic performance psychology'],
      impact_on_field: 'Professionalized sport psychology as a distinct field of study'
    },
    {
      period: 'Post-War Development (1940-1960)',
      title: 'Growth and Institutionalization',
      description: 'Sport psychology gained recognition in academic institutions. Research expanded to include personality studies and performance psychology.',
      key_figures: ['Bruce Ogilvie', 'Thomas Tutko'],
      significant_events: ['Academic recognition', 'Personality research in sports'],
      research_contributions: ['Athletic personality profiles', 'Performance psychology'],
      impact_on_field: 'Established sport psychology as an academic discipline'
    },
    {
      period: 'Modern Era (1960-Present)',
      title: 'Applied Sport Psychology',
      description: 'Focus shifted to applied interventions and evidence-based practices. Professional organizations were established and certification programs developed.',
      key_figures: ['Rainer Martens', 'Robert Singer', 'Daniel Gould'],
      significant_events: ['AASP founding (1986)', 'Professional certification programs'],
      research_contributions: ['Applied interventions', 'Evidence-based practices'],
      impact_on_field: 'Established professional standards and applied focus'
    }
  ];
  
  for (const history of historyData) {
    await db.query(`
      INSERT INTO sport_psychology_history 
      (period, title, description, key_figures, significant_events, research_contributions, impact_on_field)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (period) DO NOTHING
    `, [
      history.period, history.title, history.description, history.key_figures,
      history.significant_events, history.research_contributions, history.impact_on_field
    ]);
  }
  
  console.log(`✅ Seeded ${historyData.length} historical periods`);
}

async function seedAppliedTechniques(db) {
  console.log('🧠 Seeding applied sport psychology techniques...');
  
  const techniques = [
    {
      technique_name: 'Arousal Regulation',
      category: 'Performance Enhancement',
      subcategory: 'Anxiety Management',
      description: 'Techniques to control physiological and psychological arousal levels for optimal performance',
      detailed_instructions: 'Use progressive muscle relaxation, breathing exercises, and biofeedback to regulate arousal levels. Practice in training to develop automatic control during competition.',
      scientific_basis: 'Based on Yerkes-Dodson Law and inverted-U theory of arousal-performance relationship',
      effectiveness_rating: 8.5,
      research_evidence: ['Yerkes-Dodson Law (1908)', 'Inverted-U theory research', 'Biofeedback studies'],
      application_context: ['Pre-competition', 'During competition', 'Post-competition recovery'],
      contraindications: ['Severe anxiety disorders', 'Cardiac conditions']
    },
    {
      technique_name: 'Goal Setting',
      category: 'Motivation',
      subcategory: 'Performance Planning',
      description: 'Systematic approach to setting and achieving performance goals using SMART principles',
      detailed_instructions: 'Set Specific, Measurable, Achievable, Relevant, and Time-bound goals. Include process, performance, and outcome goals. Review and adjust regularly.',
      scientific_basis: 'Locke and Latham\'s Goal Setting Theory (1990)',
      effectiveness_rating: 9.2,
      research_evidence: ['Locke & Latham meta-analysis', 'Sport-specific goal setting studies'],
      application_context: ['Season planning', 'Competition preparation', 'Skill development'],
      contraindications: ['Unrealistic expectations', 'Overemphasis on outcomes']
    },
    {
      technique_name: 'Imagery/Visualization',
      category: 'Mental Skills',
      subcategory: 'Cognitive Training',
      description: 'Mental practice of skills and scenarios to improve performance and confidence',
      detailed_instructions: 'Create vivid, detailed mental images of successful performance. Include all senses and practice regularly. Use both internal and external perspectives.',
      scientific_basis: 'Neuromuscular theory and symbolic learning theory',
      effectiveness_rating: 8.8,
      research_evidence: ['Neuromuscular activation studies', 'Symbolic learning research'],
      application_context: ['Skill learning', 'Competition preparation', 'Injury rehabilitation'],
      contraindications: ['Severe mental health conditions', 'Difficulty with visualization']
    },
    {
      technique_name: 'Self-Talk',
      category: 'Cognitive Control',
      subcategory: 'Thought Management',
      description: 'Systematic use of internal dialogue to enhance performance and manage emotions',
      detailed_instructions: 'Develop positive, instructional, and motivational self-talk. Practice replacing negative thoughts with constructive alternatives.',
      scientific_basis: 'Cognitive behavioral therapy principles and self-efficacy theory',
      effectiveness_rating: 8.3,
      research_evidence: ['Cognitive behavioral therapy studies', 'Self-efficacy research'],
      application_context: ['Performance enhancement', 'Stress management', 'Confidence building'],
      contraindications: ['Severe cognitive distortions', 'Mental health disorders']
    },
    {
      technique_name: 'Pre-Performance Routines',
      category: 'Performance Preparation',
      subcategory: 'Competition Readiness',
      description: 'Structured sequences of behaviors and thoughts before performance to optimize readiness',
      detailed_instructions: 'Develop consistent routines including physical preparation, mental focus, and performance cues. Practice until automatic.',
      scientific_basis: 'Attentional focus theory and automaticity research',
      effectiveness_rating: 8.7,
      research_evidence: ['Attentional focus studies', 'Routine effectiveness research'],
      application_context: ['Competition preparation', 'Skill execution', 'Pressure situations'],
      contraindications: ['Rigid adherence', 'Superstitious behaviors']
    }
  ];
  
  for (const technique of techniques) {
    await db.query(`
      INSERT INTO applied_sport_psychology_techniques 
      (technique_name, category, subcategory, description, detailed_instructions, scientific_basis, 
       effectiveness_rating, research_evidence, application_context, contraindications)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (technique_name) DO NOTHING
    `, [
      technique.technique_name, technique.category, technique.subcategory, technique.description,
      technique.detailed_instructions, technique.scientific_basis, technique.effectiveness_rating,
      technique.research_evidence, technique.application_context, technique.contraindications
    ]);
  }
  
  console.log(`✅ Seeded ${techniques.length} applied techniques`);
}

async function seedRehabilitationPsychology(db) {
  console.log('🏥 Seeding rehabilitation psychology...');
  
  const rehabilitationData = [
    {
      injury_type: 'ACL Reconstruction',
      psychological_impact: 'Significant psychological challenges including fear of re-injury, loss of identity, and depression. Athletes often experience anxiety about returning to sport.',
      coping_strategies: [
        'Cognitive restructuring to address fear of re-injury',
        'Goal setting for rehabilitation milestones',
        'Social support from teammates and family',
        'Mindfulness techniques for stress management'
      ],
      mental_skills_training: [
        'Imagery for rehabilitation exercises',
        'Self-talk for motivation during recovery',
        'Relaxation techniques for pain management',
        'Confidence building through small successes'
      ],
      return_to_sport_protocols: [
        'Gradual exposure to sport-specific movements',
        'Mental preparation for return to competition',
        'Anxiety management techniques',
        'Performance goal setting'
      ],
      research_studies: [
        'Psychological factors in ACL recovery (Ardern et al., 2011)',
        'Fear of re-injury in return to sport (Kvist et al., 2005)',
        'Mental skills training in rehabilitation (Cupal & Brewer, 2001)'
      ]
    },
    {
      injury_type: 'Concussion',
      psychological_impact: 'Cognitive and emotional changes including irritability, depression, anxiety, and difficulty concentrating. Athletes may experience identity loss and fear of permanent damage.',
      coping_strategies: [
        'Education about concussion recovery timeline',
        'Cognitive behavioral therapy for mood management',
        'Gradual return to cognitive activities',
        'Support groups for concussion recovery'
      ],
      mental_skills_training: [
        'Cognitive training exercises',
        'Stress management techniques',
        'Patience and acceptance strategies',
        'Focus training for attention deficits'
      ],
      return_to_sport_protocols: [
        'Gradual return to play protocols',
        'Cognitive assessment and monitoring',
        'Mental preparation for return',
        'Ongoing psychological support'
      ],
      research_studies: [
        'Psychological effects of concussion (Guskiewicz et al., 2007)',
        'Return to play after concussion (McCrory et al., 2017)',
        'Mental health outcomes in concussion (Kerr et al., 2014)'
      ]
    },
    {
      injury_type: 'Overuse Injuries',
      psychological_impact: 'Frustration from gradual onset, fear of chronic pain, and anxiety about performance decline. Athletes may experience burnout and loss of motivation.',
      coping_strategies: [
        'Pain management strategies',
        'Activity modification planning',
        'Stress reduction techniques',
        'Maintenance of social connections'
      ],
      mental_skills_training: [
        'Pain tolerance training',
        'Motivation maintenance strategies',
        'Patience and persistence development',
        'Alternative goal setting'
      ],
      return_to_sport_protocols: [
        'Gradual return to training',
        'Load management strategies',
        'Prevention education',
        'Ongoing monitoring'
      ],
      research_studies: [
        'Psychological factors in overuse injuries (Wiese-Bjornstal et al., 1998)',
        'Pain management in sports (Moseley, 2003)',
        'Burnout prevention strategies (Gustafsson et al., 2011)'
      ]
    }
  ];
  
  for (const rehab of rehabilitationData) {
    await db.query(`
      INSERT INTO rehabilitation_psychology 
      (injury_type, psychological_impact, coping_strategies, mental_skills_training, return_to_sport_protocols, research_studies)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (injury_type) DO NOTHING
    `, [
      rehab.injury_type, rehab.psychological_impact, rehab.coping_strategies,
      rehab.mental_skills_training, rehab.return_to_sport_protocols, rehab.research_studies
    ]);
  }
  
  console.log(`✅ Seeded ${rehabilitationData.length} rehabilitation protocols`);
}

async function seedSportNutritionPsychology(db) {
  console.log('🥗 Seeding sport nutrition psychology...');
  
  const nutritionPsychologyData = [
    {
      topic: 'Eating Disorders in Sports',
      psychological_aspects: 'High prevalence of eating disorders in sports, particularly in aesthetic and weight-class sports. Athletes may develop disordered eating patterns due to performance pressure.',
      behavioral_factors: [
        'Performance pressure and weight requirements',
        'Body image concerns',
        'Perfectionism and control issues',
        'Social comparison with teammates'
      ],
      intervention_strategies: [
        'Cognitive behavioral therapy for eating disorders',
        'Body image improvement programs',
        'Performance-focused nutrition education',
        'Team-based prevention programs'
      ],
      research_evidence: [
        'Prevalence of eating disorders in athletes (Sundgot-Borgen & Torstveit, 2004)',
        'Risk factors for disordered eating (Petrie & Greenleaf, 2007)',
        'Intervention effectiveness (Beals & Manore, 2002)'
      ]
    },
    {
      topic: 'Nutrition Adherence',
      psychological_aspects: 'Athletes often struggle with maintaining nutrition plans due to psychological barriers including lack of motivation, poor planning, and social influences.',
      behavioral_factors: [
        'Lack of nutrition knowledge',
        'Poor meal planning skills',
        'Social eating pressures',
        'Time management challenges'
      ],
      intervention_strategies: [
        'Goal setting for nutrition adherence',
        'Self-monitoring techniques',
        'Social support systems',
        'Habit formation strategies'
      ],
      research_evidence: [
        'Nutrition adherence in athletes (Heaney et al., 2011)',
        'Behavioral change strategies (Prochaska & Velicer, 1997)',
        'Social support in nutrition (Burke et al., 2011)'
      ]
    },
    {
      topic: 'Competition Nutrition Psychology',
      psychological_aspects: 'Psychological factors significantly influence nutrition choices before, during, and after competition. Anxiety and stress can affect appetite and food choices.',
      behavioral_factors: [
        'Competition anxiety affecting appetite',
        'Ritualistic eating behaviors',
        'Performance pressure on food choices',
        'Travel and routine disruption'
      ],
      intervention_strategies: [
        'Pre-competition nutrition routines',
        'Stress management for appetite control',
        'Flexible nutrition planning',
        'Performance-focused meal timing'
      ],
      research_evidence: [
        'Competition nutrition psychology (Burke et al., 2011)',
        'Anxiety and appetite (Torres & Nowson, 2007)',
        'Routine disruption effects (Reilly et al., 2007)'
      ]
    }
  ];
  
  for (const nutrition of nutritionPsychologyData) {
    await db.query(`
      INSERT INTO sport_nutrition_psychology 
      (topic, psychological_aspects, behavioral_factors, intervention_strategies, research_evidence)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (topic) DO NOTHING
    `, [
      nutrition.topic, nutrition.psychological_aspects, nutrition.behavioral_factors,
      nutrition.intervention_strategies, nutrition.research_evidence
    ]);
  }
  
  console.log(`✅ Seeded ${nutritionPsychologyData.length} nutrition psychology topics`);
}

async function seedRecoverySessionPsychology(db) {
  console.log('🧘 Seeding recovery session psychology...');
  
  const recoveryPsychologyData = [
    {
      session_type: 'Cryotherapy Recovery',
      psychological_benefits: [
        'Reduced anxiety and stress levels',
        'Improved mood and well-being',
        'Enhanced mental clarity',
        'Better sleep quality'
      ],
      mental_skills_integration: [
        'Mindfulness during cold exposure',
        'Breathing techniques for discomfort management',
        'Visualization of recovery benefits',
        'Positive self-talk for endurance'
      ],
      mindfulness_techniques: [
        'Present moment awareness during treatment',
        'Body scanning for tension release',
        'Acceptance of discomfort',
        'Gratitude for recovery opportunity'
      ],
      stress_reduction_methods: [
        'Progressive muscle relaxation',
        'Deep breathing exercises',
        'Mental imagery of cooling effects',
        'Focus on recovery benefits'
      ],
      research_backing: [
        'Psychological effects of cryotherapy (Banfi et al., 2010)',
        'Stress reduction through cold exposure (Shevchuk, 2008)',
        'Mindfulness in recovery (Kabat-Zinn, 1990)'
      ]
    },
    {
      session_type: 'Compression Therapy',
      psychological_benefits: [
        'Reduced anxiety about recovery',
        'Improved body awareness',
        'Enhanced comfort and relaxation',
        'Better sleep preparation'
      ],
      mental_skills_integration: [
        'Body awareness training',
        'Progressive relaxation techniques',
        'Recovery visualization',
        'Positive recovery mindset'
      ],
      mindfulness_techniques: [
        'Body scanning for tension areas',
        'Breath awareness during treatment',
        'Present moment focus',
        'Acceptance of physical sensations'
      ],
      stress_reduction_methods: [
        'Autogenic training',
        'Guided imagery for recovery',
        'Stress hormone reduction techniques',
        'Relaxation response activation'
      ],
      research_backing: [
        'Compression therapy psychological effects (MacRae et al., 2012)',
        'Body awareness in recovery (Mehling et al., 2009)',
        'Relaxation techniques in sports (Smith, 2007)'
      ]
    },
    {
      session_type: 'Foam Rolling Recovery',
      psychological_benefits: [
        'Reduced muscle tension anxiety',
        'Improved body-mind connection',
        'Enhanced relaxation response',
        'Better stress management'
      ],
      mental_skills_integration: [
        'Body awareness development',
        'Pain tolerance training',
        'Recovery mindset cultivation',
        'Self-care appreciation'
      ],
      mindfulness_techniques: [
        'Present moment awareness',
        'Body scanning for tight areas',
        'Breath synchronization',
        'Non-judgmental observation'
      ],
      stress_reduction_methods: [
        'Progressive muscle relaxation',
        'Autogenic training',
        'Stress hormone reduction',
        'Parasympathetic activation'
      ],
      research_backing: [
        'Foam rolling psychological effects (Cheatham et al., 2015)',
        'Body awareness in recovery (Price & Thompson, 2007)',
        'Mindfulness in sports recovery (Gardner & Moore, 2007)'
      ]
    }
  ];
  
  for (const recovery of recoveryPsychologyData) {
    await db.query(`
      INSERT INTO recovery_session_psychology 
      (session_type, psychological_benefits, mental_skills_integration, mindfulness_techniques, stress_reduction_methods, research_backing)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (session_type) DO NOTHING
    `, [
      recovery.session_type, recovery.psychological_benefits, recovery.mental_skills_integration,
      recovery.mindfulness_techniques, recovery.stress_reduction_methods, recovery.research_backing
    ]);
  }
  
  console.log(`✅ Seeded ${recoveryPsychologyData.length} recovery session types`);
}

async function seedResearchStudies(db) {
  console.log('📖 Seeding research studies and references...');
  
  const researchStudies = [
    {
      title: 'The Psychology of Coaching',
      authors: ['Coleman Griffith'],
      publication_year: 1926,
      journal_name: 'University of Illinois Press',
      doi: null,
      abstract: 'Foundational text establishing sport psychology as a field of study. Discussed psychological factors in coaching and athletic performance.',
      key_findings: ['Psychological factors influence athletic performance', 'Coaching psychology is distinct from general psychology'],
      methodology: 'Theoretical framework and observational studies',
      sample_size: null,
      relevance_to_sport_psychology: 'Established the foundation for applied sport psychology'
    },
    {
      title: 'Goal Setting and Task Performance: 1969-1980',
      authors: ['Edwin A. Locke', 'Gary P. Latham'],
      publication_year: 1990,
      journal_name: 'Psychological Bulletin',
      doi: '10.1037/0033-2909.90.1.125',
      abstract: 'Meta-analysis of goal setting research demonstrating the effectiveness of specific, challenging goals for performance improvement.',
      key_findings: ['Specific goals improve performance more than vague goals', 'Challenging goals lead to higher performance than easy goals'],
      methodology: 'Meta-analysis of 110 studies',
      sample_size: 40000,
      relevance_to_sport_psychology: 'Established evidence-based goal setting principles for sports'
    },
    {
      title: 'Mental Imagery in Sport',
      authors: ['Aidan Moran'],
      publication_year: 2009,
      journal_name: 'Routledge',
      doi: null,
      abstract: 'Comprehensive review of mental imagery research in sports, including neural mechanisms and practical applications.',
      key_findings: ['Imagery activates similar neural pathways as physical practice', 'Combined physical and mental practice is most effective'],
      methodology: 'Literature review and meta-analysis',
      sample_size: null,
      relevance_to_sport_psychology: 'Established evidence-based imagery techniques for sports'
    },
    {
      title: 'The Psychology of Injury in Sport',
      authors: ['Diane L. Gill'],
      publication_year: 2000,
      journal_name: 'Human Kinetics',
      doi: null,
      abstract: 'Comprehensive examination of psychological factors in sports injuries, including prevention, response, and rehabilitation.',
      key_findings: ['Psychological factors influence injury risk and recovery', 'Social support is crucial for injury rehabilitation'],
      methodology: 'Literature review and theoretical framework',
      sample_size: null,
      relevance_to_sport_psychology: 'Established psychological approaches to injury management'
    },
    {
      title: 'Applied Sport Psychology: Personal Growth to Peak Performance',
      authors: ['Jean M. Williams', 'Vikki Krane'],
      publication_year: 2015,
      journal_name: 'McGraw-Hill Education',
      doi: null,
      abstract: 'Comprehensive textbook covering applied sport psychology techniques and interventions for performance enhancement.',
      key_findings: ['Evidence-based interventions improve athletic performance', 'Individual differences require personalized approaches'],
      methodology: 'Literature review and case studies',
      sample_size: null,
      relevance_to_sport_psychology: 'Comprehensive resource for applied sport psychology practice'
    }
  ];
  
  for (const study of researchStudies) {
    await db.query(`
      INSERT INTO sport_psychology_research_references 
      (title, authors, publication_year, journal_name, doi, abstract, key_findings, methodology, sample_size, relevance_to_sport_psychology)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (title) DO NOTHING
    `, [
      study.title, study.authors, study.publication_year, study.journal_name, study.doi,
      study.abstract, study.key_findings, study.methodology, study.sample_size, study.relevance_to_sport_psychology
    ]);
  }
  
  console.log(`✅ Seeded ${researchStudies.length} research studies`);
}

// Run the seeding
seedEnhancedSportPsychologyDatabase().catch(console.error); 
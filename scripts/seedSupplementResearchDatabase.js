#!/usr/bin/env node

import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function seedSupplementResearchDatabase() {
  const client = await pool.connect();

  try {
    console.log("💊 Seeding Supplement Research Database...");

    // Ashwagandha Research (2020-2025)
    const ashwagandhaResearch = [
      {
        domain: "Adaptogens",
        subdomain: "Ashwagandha",
        study_title:
          "Effects of Ashwagandha (Withania somnifera) on Physical Performance: Systematic Review and Bayesian Meta-Analysis",
        authors: ["Bonilla", "D.A.", "Moreno", "Y.", "Gho", "C."],
        publication_year: 2021,
        journal: "Journal of Functional Morphology and Kinesiology",
        study_type: "Systematic Review with Bayesian Meta-Analysis",
        evidence_level: "High",
        sample_size: 13,
        population_studied: "Healthy Men and Women",
        key_findings: [
          "Ashwagandha supplementation more efficacious than placebo for strength/power",
          "Improved cardiorespiratory fitness and fatigue/recovery",
          "Probability >95% of at least small effect size favoring ashwagandha",
          "Low-to-moderate overall risk of bias detected",
        ],
        effect_size: 0.68,
        confidence_interval: "0.43-0.93",
        p_value: 0.001,
        practical_applications: [
          "Use 300-500mg aqueous root extract daily",
          "Take twice daily for 8-12 weeks",
          "Expect improvements in strength, power, and VO2max",
          "Monitor for individual response variations",
        ],
        limitations: [
          "Small sample sizes in individual studies",
          "High heterogeneity between studies",
          "Limited data on trained athletes",
        ],
        recommendations: [
          "Utilize under healthcare professional guidance",
          "Start with lower dose to assess tolerance",
          "Combine with structured training program",
          "Monitor sleep and stress responses",
        ],
        doi: "10.3390/jfmk6010020",
        pubmed_id: "33670194",
        citation_count: 78,
        meta_data: {
          dosage_range: "300-500mg/day",
          optimal_duration: "8-12 weeks",
          probability_benefit: ">95%",
        },
      },
      {
        domain: "Adaptogens",
        subdomain: "Ashwagandha VO2max",
        study_title:
          "The effect of Ashwagandha (Withania somnifera) on sports performance: a systematic review and meta-analysis",
        authors: ["Tadros", "R.", "Gonzalez", "A.M.", "Hoffman", "J.R."],
        publication_year: 2025,
        journal: "Turkish Journal of Sports Medicine",
        study_type: "Systematic Review with Meta-Analysis",
        evidence_level: "High",
        sample_size: null,
        population_studied: "Athletes and Active Adults",
        key_findings: [
          "Significantly increased VO2max by 4.09 ml/min/kg",
          "Improvements in cardiorespiratory fitness parameters",
          "Reductions in basal heart rate and heart rate recovery",
          "Enhanced white blood cell counts and hemoglobin",
        ],
        effect_size: 0.52,
        confidence_interval: "0.21-0.83",
        p_value: 0.001,
        practical_applications: [
          "Use for aerobic capacity improvement",
          "Implement 4-6 weeks before testing periods",
          "Combine with cardiovascular training",
          "Monitor heart rate recovery improvements",
        ],
        limitations: [
          "Variable extract standardization",
          "Limited long-term safety data",
          "Individual response variability",
        ],
        recommendations: [
          "Standardize extract composition",
          "Include baseline fitness assessments",
          "Track cardiovascular markers",
          "Consider sport-specific applications",
        ],
        doi: "10.47447/tjsm.0752",
        pubmed_id: null,
        citation_count: 8,
        meta_data: {
          vo2max_improvement: "4.09 ml/min/kg",
          cardiovascular_benefits: ["heart_rate", "recovery", "hemoglobin"],
          target_population: "endurance_athletes",
        },
      },
    ];

    // Rhodiola Rosea Research (2020-2025)
    const rhodiolaResearch = [
      {
        domain: "Adaptogens",
        subdomain: "Rhodiola Rosea",
        study_title:
          "Rhodiola rosea supplementation on sports performance: A systematic review of randomized controlled trials",
        authors: ["Sellami", "M.", "Slimeni", "O.", "Pokrywka", "A."],
        publication_year: 2023,
        journal: "Journal of Sports Medicine and Physical Fitness",
        study_type: "Systematic Review",
        evidence_level: "High",
        sample_size: 263,
        population_studied: "Athletes (198 men, 65 women, 18-65 years)",
        key_findings: [
          "Acute supplementation positive effect on endurance performance and RPE",
          "Chronic supplementation positive effect on anaerobic performance only",
          "Reduction in pain and muscle damage after exercise",
          "Enhanced antioxidant capacity and reduced oxidative stress",
        ],
        effect_size: 0.34,
        confidence_interval: "0.12-0.56",
        p_value: 0.003,
        practical_applications: [
          "Use acute dosing (200mg, 60 min pre-exercise) for endurance",
          "Use chronic dosing (1500-2400mg/day, 4-30 days) for anaerobic power",
          "Contains ~1% salidroside and ~3% rosavin for standardization",
          "Monitor individual response and tolerance",
        ],
        limitations: [
          "High heterogeneity between studies",
          "Variable supplementation protocols",
          "Unclear or high risk of bias in most studies",
        ],
        recommendations: [
          "Standardize extract composition and dosing",
          "Focus on acute use for endurance events",
          "Use chronic protocols for power/anaerobic sports",
          "Conduct higher quality RCTs",
        ],
        doi: "10.23736/S0022-4707.23.14881-5",
        pubmed_id: "37495266",
        citation_count: 23,
        meta_data: {
          acute_dose: "200mg 60min pre-exercise",
          chronic_dose: "1500-2400mg/day",
          standardization: "1% salidroside, 3% rosavin",
        },
      },
      {
        domain: "Adaptogens",
        subdomain: "Rhodiola Performance",
        study_title:
          "Effects of Rhodiola Rosea Supplementation on Exercise and Sport: A Systematic Review",
        authors: ["Ishaque", "S.", "Shamseer", "L.", "Bukutu", "C."],
        publication_year: 2022,
        journal: "Frontiers in Nutrition",
        study_type: "Systematic Review",
        evidence_level: "Moderate",
        sample_size: 10,
        population_studied: "Athletes and Active Individuals",
        key_findings: [
          "Most studies reported positive effect on athletic ability",
          "No obvious adverse reactions reported",
          "Improved skeletal muscle damage and recovery",
          "Increased athletic explosive power",
        ],
        effect_size: 0.28,
        confidence_interval: "0.05-0.51",
        p_value: 0.02,
        practical_applications: [
          "Safe for athletic populations with minimal side effects",
          "Use for recovery between training sessions",
          "Consider for explosive power development",
          "Implement as part of periodized supplementation",
        ],
        limitations: [
          "Small number of high-quality studies",
          "Variable outcome measures",
          "Limited dose-response data",
        ],
        recommendations: [
          "Conduct larger, well-controlled trials",
          "Standardize outcome measurements",
          "Establish optimal dosing protocols",
          "Investigate sport-specific applications",
        ],
        doi: "10.3389/fnut.2022.856287",
        pubmed_id: "35464040",
        citation_count: 34,
        meta_data: {
          safety_profile: "no_adverse_reactions",
          primary_benefits: ["muscle_recovery", "explosive_power"],
          study_quality: "variable",
        },
      },
    ];

    // Creatine Research (2020-2025)
    const creatineResearch = [
      {
        domain: "Performance Supplements",
        subdomain: "Creatine Monohydrate",
        study_title:
          "Effects of Creatine Supplementation and Resistance Training on Muscle Strength Gains in Adults <50 Years of Age: A Systematic Review and Meta-Analysis",
        authors: ["Chilibeck", "P.D.", "Kaviani", "M.", "Candow", "D.G."],
        publication_year: 2024,
        journal: "Nutrients",
        study_type: "Systematic Review with Meta-Analysis",
        evidence_level: "High",
        sample_size: null,
        population_studied: "Adults <50 Years Resistance Training",
        key_findings: [
          "Creatine supplementation significantly enhances strength gains from resistance training",
          "Benefits occur with or without loading phase",
          "Higher doses (>5g/day) lead to more substantial lower-body strength improvements",
          "Faster and greater strength improvements compared to training alone",
        ],
        effect_size: 0.67,
        confidence_interval: "0.45-0.89",
        p_value: 0.001,
        practical_applications: [
          "Loading: 20g/day (0.3g/kg/day) for 5-7 days, then 5g/day maintenance",
          "Alternative: 3-5g/day for 4 weeks (no loading)",
          "Higher doses (>5g/day) for enhanced lower-body strength",
          "Continue throughout training phases",
        ],
        limitations: [
          "Variable training protocols",
          "Limited female participant data",
          "Short intervention periods in some studies",
        ],
        recommendations: [
          "Use creatine monohydrate (most researched form)",
          "Maintain consistent daily dosing",
          "Combine with resistance training program",
          "Monitor individual response and tolerance",
        ],
        doi: "10.3390/nu16213665",
        pubmed_id: null,
        citation_count: 15,
        meta_data: {
          loading_protocol: "20g/day 5-7 days, then 5g/day",
          alternative_protocol: "3-5g/day continuous",
          optimal_dose: ">5g/day for strength",
        },
      },
      {
        domain: "Performance Supplements",
        subdomain: "Creatine Endurance",
        study_title:
          "Effects of Creatine Monohydrate on Endurance Performance in a Trained Population: A Systematic Review and Meta-Analysis",
        authors: ["Ruben", "R.A.", "Fernandez-Fernandez", "J.", "Otal", "A."],
        publication_year: 2023,
        journal: "Sports Medicine",
        study_type: "Systematic Review with Meta-Analysis",
        evidence_level: "High",
        sample_size: null,
        population_studied: "Trained Endurance Athletes",
        key_findings: [
          "Creatine monohydrate supplementation ineffective on endurance performance",
          "Robust evidence for short-term high-intensity exercise enhancement",
          "Controversial role during aerobic activities",
          "Weight-bearing athletes should avoid loading phase",
        ],
        effect_size: 0.05,
        confidence_interval: "-0.15 to 0.25",
        p_value: 0.62,
        practical_applications: [
          "Limited benefit for pure endurance activities",
          "Useful for repeated sprint efforts within endurance sports",
          "Avoid loading phase for weight-bearing endurance athletes",
          "Consider for sports with high-intensity intervals",
        ],
        limitations: [
          "Limited research in endurance-specific protocols",
          "Variable definitions of endurance performance",
          "Potential negative effects from weight gain",
        ],
        recommendations: [
          "Focus on power/strength athletes primarily",
          "Use lower maintenance doses for endurance athletes",
          "Consider sport-specific demands",
          "Monitor body weight changes",
        ],
        doi: "10.1007/s40279-023-01823-2",
        pubmed_id: "36877404",
        citation_count: 28,
        meta_data: {
          endurance_effectiveness: "limited",
          high_intensity_effectiveness: "robust",
          weight_bearing_concern: "avoid_loading",
        },
      },
    ];

    // Caffeine Research (2020-2025)
    const caffeineResearch = [
      {
        domain: "Performance Supplements",
        subdomain: "Caffeine Performance",
        study_title:
          "Efficacy of caffeine on athletic performance: A systematic review and meta-analysis",
        authors: ["Farias", "L.F.", "Browne", "R.A.V.", "Costa", "E.C."],
        publication_year: 2022,
        journal: "Physiology & Behavior",
        study_type: "Systematic Review with Meta-Analysis",
        evidence_level: "High",
        sample_size: null,
        population_studied: "Athletes - Various Sports",
        key_findings: [
          "Meaningful ergogenic effect on time to exhaustion in running",
          "Improved performance in running time trials",
          "Agility improvement at 3mg/kg body mass",
          "Reaction time improvement at 6mg/kg body mass",
        ],
        effect_size: 0.41,
        confidence_interval: "0.28-0.54",
        p_value: 0.001,
        practical_applications: [
          "Use 3-6mg/kg body mass for optimal performance",
          "Consume 60 minutes before exercise",
          "Effective for endurance and power activities",
          "Monitor individual tolerance and response",
        ],
        limitations: [
          "Substantial inter-individual variability",
          "Genetic factors affect response",
          "Timing protocols inconsistent between studies",
        ],
        recommendations: [
          "Personalize dosing based on individual response",
          "Consider genetic testing for ADORA2A variants",
          "Standardize timing protocols",
          "Monitor for side effects and tolerance",
        ],
        doi: "10.1016/j.physbeh.2022.113836",
        pubmed_id: null,
        citation_count: 45,
        meta_data: {
          optimal_dose: "3-6mg/kg",
          timing: "60 minutes pre-exercise",
          performance_types: ["endurance", "power", "agility"],
        },
      },
      {
        domain: "Performance Supplements",
        subdomain: "Caffeine Sleep",
        study_title:
          "Dose and timing effects of caffeine on subsequent sleep: a randomized clinical crossover trial",
        authors: ["Gardiner", "C.", "Weakley", "J.", "Burke", "L.M."],
        publication_year: 2025,
        journal: "Sleep",
        study_type: "Randomized Controlled Trial",
        evidence_level: "High",
        sample_size: null,
        population_studied: "Healthy Adults",
        key_findings: [
          "Coffee (107mg) should be consumed ≥8.8h before bedtime",
          "Pre-workout (217.5mg) should be consumed ≥13.2h before bedtime",
          "Higher doses require longer clearance times",
          "Individual genetic variations affect sleep sensitivity",
        ],
        effect_size: null,
        confidence_interval: null,
        p_value: null,
        practical_applications: [
          "Plan caffeine intake based on bedtime",
          "Use lower doses for afternoon training",
          "Consider individual caffeine sensitivity",
          "Monitor sleep quality after supplementation",
        ],
        limitations: [
          "Individual variation in caffeine metabolism",
          "Limited to specific dose ranges",
          "Laboratory vs real-world conditions",
        ],
        recommendations: [
          "Educate athletes on timing principles",
          "Adjust doses for afternoon/evening training",
          "Use alternative stimulants for late sessions",
          "Track sleep metrics when using caffeine",
        ],
        doi: "10.1093/sleep/zsae230",
        pubmed_id: null,
        citation_count: 3,
        meta_data: {
          coffee_clearance: "8.8 hours",
          pre_workout_clearance: "13.2 hours",
          individual_variation: "significant",
        },
      },
    ];

    // Beta-Alanine Research (2020-2025)
    const betaAlanineResearch = [
      {
        domain: "Performance Supplements",
        subdomain: "Beta-Alanine",
        study_title:
          "Effect of Beta-Alanine Supplementation on Maximal Intensity Exercise in Trained Young Male Individuals: A Systematic Review and Meta-Analysis",
        authors: ["Saunders", "B.", "Elliott-Sale", "K.", "Artioli", "G.G."],
        publication_year: 2024,
        journal:
          "International Journal of Sport Nutrition and Exercise Metabolism",
        study_type: "Systematic Review with Meta-Analysis",
        evidence_level: "High",
        sample_size: null,
        population_studied: "Trained Young Male Athletes",
        key_findings: [
          "Significant overall effect size of 0.18 for exercise performance",
          "Median improvement of 2.85% with 179g total beta-alanine",
          "Most effective for exercise lasting 60-240 seconds",
          "Greater effect sizes for exercise capacity vs performance",
        ],
        effect_size: 0.18,
        confidence_interval: "0.08-0.28",
        p_value: 0.001,
        practical_applications: [
          "Use 3-4g/day for 4-8 weeks",
          "Target exercises lasting 1-10 minutes",
          "Divide daily dose to minimize paresthesia",
          "Combine with sodium bicarbonate for enhanced effects",
        ],
        limitations: [
          "Paresthesia side effects common",
          "Limited benefit for <60 second activities",
          "Variable individual responses",
        ],
        recommendations: [
          "Start with lower doses to assess tolerance",
          "Use sustained-release formulations",
          "Time supplementation with training phases",
          "Monitor for tingling sensations",
        ],
        doi: "10.1123/ijsnem.2024-0089",
        pubmed_id: null,
        citation_count: 12,
        meta_data: {
          optimal_dose: "3-4g/day",
          duration: "4-8 weeks",
          exercise_duration_target: "60-240 seconds",
        },
      },
      {
        domain: "Performance Supplements",
        subdomain: "Beta-Alanine Transition Zones",
        study_title:
          "Effects of Beta-Alanine Supplementation on Physical Performance in Aerobic-Anaerobic Transition Zones: A Systematic Review and Meta-Analysis",
        authors: [
          "Santana",
          "J.O.",
          "de Freitas",
          "M.C.",
          "Dos Santos",
          "D.M.",
        ],
        publication_year: 2020,
        journal: "Nutrients",
        study_type: "Systematic Review with Meta-Analysis",
        evidence_level: "High",
        sample_size: null,
        population_studied: "Athletes in Transition Zone Activities",
        key_findings: [
          "Small but significant effects on aerobic-anaerobic transition performance",
          "Co-supplementation with sodium bicarbonate showed largest effect (0.43)",
          "Benefits most pronounced in trained individuals",
          "Effective for sports requiring repeated high-intensity efforts",
        ],
        effect_size: 0.23,
        confidence_interval: "0.11-0.35",
        p_value: 0.001,
        practical_applications: [
          "Particularly effective for team sports with transition zones",
          "Consider combining with sodium bicarbonate",
          "Use during high-intensity training phases",
          "Implement 4-6 weeks before competition",
        ],
        limitations: [
          "Limited research in female athletes",
          "Variable training status effects",
          "Optimal combination protocols unclear",
        ],
        recommendations: [
          "Focus on sports with repeated sprints",
          "Investigate female athlete responses",
          "Standardize combination supplement protocols",
          "Consider periodized supplementation",
        ],
        doi: "10.3390/nu12092490",
        pubmed_id: "32824885",
        citation_count: 67,
        meta_data: {
          transition_zone_effect: "small_significant",
          combination_effect: "0.43 with sodium bicarbonate",
          target_sports: "team_sports",
        },
      },
    ];

    // Combine all research data
    const allResearch = [
      ...ashwagandhaResearch,
      ...rhodiolaResearch,
      ...creatineResearch,
      ...caffeineResearch,
      ...betaAlanineResearch,
    ];

    // Insert all research data
    for (const study of allResearch) {
      await client.query(
        `
        INSERT INTO evidence_based_research (
          domain, subdomain, study_title, authors, publication_year, journal,
          study_type, evidence_level, sample_size, population_studied,
          key_findings, effect_size, confidence_interval, p_value,
          practical_applications, limitations, recommendations,
          doi, pubmed_id, citation_count, meta_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT DO NOTHING
      `,
        [
          study.domain,
          study.subdomain,
          study.study_title,
          study.authors,
          study.publication_year,
          study.journal,
          study.study_type,
          study.evidence_level,
          study.sample_size,
          study.population_studied,
          study.key_findings,
          study.effect_size,
          study.confidence_interval,
          study.p_value,
          study.practical_applications,
          study.limitations,
          study.recommendations,
          study.doi,
          study.pubmed_id,
          study.citation_count,
          JSON.stringify(study.meta_data),
        ],
      );
    }

    console.log(`✅ Seeded ${allResearch.length} supplement research studies`);
  } catch (error) {
    console.error("❌ Error seeding supplement research database:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSupplementResearchDatabase()
    .then(() => {
      console.log("🎉 Supplement research database seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export default seedSupplementResearchDatabase;

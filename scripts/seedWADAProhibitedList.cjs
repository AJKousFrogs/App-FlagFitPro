const { Pool } = require("pg");

class WADAProhibitedListSeeder {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  async seedCompleteWADAProhibitedList() {
    console.log("🚫 Seeding complete WADA prohibited substances list...");

    const prohibitedSubstances = [
      // S0 - Non-approved substances
      {
        substance_name: "Non-approved substances",
        substance_category: "non_approved_substances",
        prohibited_status: "prohibited_at_all_times",
        wada_code: "S0",
        risk_level: "high",
        flag_football_relevance: "low",
        detection_window_days: 30,
        common_sources: ["experimental_drugs", "research_compounds"],
      },

      // S1 - Anabolic agents
      {
        substance_name: "Testosterone",
        substance_category: "anabolic_agents",
        prohibited_status: "prohibited_at_all_times",
        wada_code: "S1.1",
        risk_level: "high",
        flag_football_relevance: "high",
        detection_window_days: 30,
        common_sources: [
          "anabolic_steroids",
          "testosterone_boosters",
          "prohormones",
        ],
      },
      {
        substance_name: "Nandrolone",
        substance_category: "anabolic_agents",
        prohibited_status: "prohibited_at_all_times",
        wada_code: "S1.2",
        risk_level: "high",
        flag_football_relevance: "high",
        detection_window_days: 45,
        common_sources: ["anabolic_steroids", "prohormones"],
      },
      {
        substance_name: "Stanozolol",
        substance_category: "anabolic_agents",
        prohibited_status: "prohibited_at_all_times",
        wada_code: "S1.3",
        risk_level: "high",
        flag_football_relevance: "high",
        detection_window_days: 60,
        common_sources: ["anabolic_steroids", "performance_enhancers"],
      },
      {
        substance_name: "SARMs (Selective Androgen Receptor Modulators)",
        substance_category: "anabolic_agents",
        prohibited_status: "prohibited_at_all_times",
        wada_code: "S1.4",
        risk_level: "high",
        flag_football_relevance: "high",
        detection_window_days: 30,
        common_sources: [
          "research_compounds",
          "online_supplements",
          "bodybuilding_supplements",
        ],
      },

      // S2 - Peptide hormones, growth factors, related substances
      {
        substance_name: "Erythropoietin (EPO)",
        substance_category: "peptide_hormones",
        prohibited_status: "prohibited_at_all_times",
        wada_code: "S2.1",
        risk_level: "high",
        flag_football_relevance: "moderate",
        detection_window_days: 7,
        common_sources: [
          "blood_doping",
          "recombinant_epo",
          "performance_clinics",
        ],
      },
      {
        substance_name: "Growth Hormone (hGH)",
        substance_category: "peptide_hormones",
        prohibited_status: "prohibited_at_all_times",
        wada_code: "S2.2",
        risk_level: "high",
        flag_football_relevance: "moderate",
        detection_window_days: 14,
        common_sources: [
          "anti_aging_clinics",
          "performance_clinics",
          "online_sources",
        ],
      },
      {
        substance_name: "Insulin-like Growth Factor-1 (IGF-1)",
        substance_category: "peptide_hormones",
        prohibited_status: "prohibited_at_all_times",
        wada_code: "S2.3",
        risk_level: "high",
        flag_football_relevance: "moderate",
        detection_window_days: 10,
        common_sources: ["performance_clinics", "research_compounds"],
      },

      // S3 - Beta-2 agonists
      {
        substance_name: "Salbutamol (Ventolin)",
        substance_category: "beta_2_agonists",
        prohibited_status: "prohibited_in_competition",
        wada_code: "S3.1",
        risk_level: "moderate",
        flag_football_relevance: "moderate",
        detection_window_days: 3,
        common_sources: ["asthma_inhalers", "prescription_medications"],
        exceptions: [
          "therapeutic_use_exemption_allowed",
          "max_1600_mcg_per_day",
          "max_800_mcg_per_12_hours",
        ],
      },
      {
        substance_name: "Formoterol",
        substance_category: "beta_2_agonists",
        prohibited_status: "prohibited_in_competition",
        wada_code: "S3.2",
        risk_level: "moderate",
        flag_football_relevance: "moderate",
        detection_window_days: 3,
        common_sources: ["asthma_medications", "prescription_inhalers"],
        exceptions: ["therapeutic_use_exemption_allowed", "max_54_mcg_per_day"],
      },
      {
        substance_name: "Terbutaline",
        substance_category: "beta_2_agonists",
        prohibited_status: "prohibited_in_competition",
        wada_code: "S3.3",
        risk_level: "moderate",
        flag_football_relevance: "moderate",
        detection_window_days: 3,
        common_sources: ["asthma_medications", "prescription_inhalers"],
        exceptions: ["therapeutic_use_exemption_allowed"],
      },

      // S4 - Hormone and metabolic modulators
      {
        substance_name: "Aromatase inhibitors",
        substance_category: "hormone_modulators",
        prohibited_status: "prohibited_at_all_times",
        wada_code: "S4.1",
        risk_level: "high",
        flag_football_relevance: "moderate",
        detection_window_days: 14,
        common_sources: [
          "cancer_treatments",
          "bodybuilding_supplements",
          "online_pharmacies",
        ],
      },
      {
        substance_name: "Selective estrogen receptor modulators (SERMs)",
        substance_category: "hormone_modulators",
        prohibited_status: "prohibited_at_all_times",
        wada_code: "S4.2",
        risk_level: "high",
        flag_football_relevance: "moderate",
        detection_window_days: 21,
        common_sources: [
          "cancer_treatments",
          "bodybuilding_supplements",
          "online_pharmacies",
        ],
      },

      // S5 - Diuretics and masking agents
      {
        substance_name: "Furosemide",
        substance_category: "diuretics",
        prohibited_status: "prohibited_at_all_times",
        wada_code: "S5.1",
        risk_level: "moderate",
        flag_football_relevance: "low",
        detection_window_days: 3,
        common_sources: [
          "prescription_medications",
          "blood_pressure_treatments",
        ],
      },
      {
        substance_name: "Hydrochlorothiazide",
        substance_category: "diuretics",
        prohibited_status: "prohibited_at_all_times",
        wada_code: "S5.2",
        risk_level: "moderate",
        flag_football_relevance: "low",
        detection_window_days: 3,
        common_sources: [
          "prescription_medications",
          "blood_pressure_treatments",
        ],
      },

      // S6 - Stimulants
      {
        substance_name: "Amphetamines",
        substance_category: "stimulants",
        prohibited_status: "prohibited_in_competition",
        wada_code: "S6.1",
        risk_level: "high",
        flag_football_relevance: "moderate",
        detection_window_days: 3,
        common_sources: [
          "ADHD_medications",
          "prescription_stimulants",
          "recreational_drugs",
        ],
      },
      {
        substance_name: "Methylphenidate (Ritalin)",
        substance_category: "stimulants",
        prohibited_status: "prohibited_in_competition",
        wada_code: "S6.2",
        risk_level: "moderate",
        flag_football_relevance: "moderate",
        detection_window_days: 3,
        common_sources: ["ADHD_medications", "prescription_stimulants"],
        exceptions: ["therapeutic_use_exemption_allowed"],
      },
      {
        substance_name: "Ephedrine",
        substance_category: "stimulants",
        prohibited_status: "prohibited_in_competition",
        wada_code: "S6.3",
        risk_level: "moderate",
        flag_football_relevance: "moderate",
        detection_window_days: 2,
        common_sources: [
          "cold_medications",
          "decongestants",
          "weight_loss_supplements",
        ],
        exceptions: ["concentration_limit_10_mcg_per_ml_urine"],
      },
      {
        substance_name: "Pseudoephedrine",
        substance_category: "stimulants",
        prohibited_status: "prohibited_in_competition",
        wada_code: "S6.4",
        risk_level: "moderate",
        flag_football_relevance: "moderate",
        detection_window_days: 2,
        common_sources: ["cold_medications", "decongestants"],
        exceptions: ["concentration_limit_150_mcg_per_ml_urine"],
      },

      // S7 - Narcotics
      {
        substance_name: "Morphine",
        substance_category: "narcotics",
        prohibited_status: "prohibited_in_competition",
        wada_code: "S7.1",
        risk_level: "moderate",
        flag_football_relevance: "low",
        detection_window_days: 3,
        common_sources: ["prescription_pain_medications", "hospitals"],
      },
      {
        substance_name: "Codeine",
        substance_category: "narcotics",
        prohibited_status: "prohibited_in_competition",
        wada_code: "S7.2",
        risk_level: "moderate",
        flag_football_relevance: "low",
        detection_window_days: 2,
        common_sources: ["prescription_pain_medications", "cough_syrups"],
        exceptions: ["concentration_limit_1.3_mcg_per_ml_urine"],
      },

      // S8 - Cannabinoids
      {
        substance_name: "Cannabis",
        substance_category: "cannabinoids",
        prohibited_status: "prohibited_in_competition",
        wada_code: "S8",
        risk_level: "moderate",
        flag_football_relevance: "low",
        detection_window_days: 30,
        common_sources: ["marijuana", "cbd_products", "hemp_products"],
        exceptions: ["cbd_isolate_allowed_if_no_thc"],
      },

      // S9 - Glucocorticoids
      {
        substance_name: "Prednisone",
        substance_category: "glucocorticoids",
        prohibited_status: "prohibited_in_competition",
        wada_code: "S9",
        risk_level: "low",
        flag_football_relevance: "low",
        detection_window_days: 2,
        common_sources: [
          "prescription_medications",
          "anti_inflammatory_treatments",
        ],
        exceptions: [
          "oral_rectal_iv_im_prohibited",
          "topical_inhalation_allowed",
        ],
      },
      {
        substance_name: "Dexamethasone",
        substance_category: "glucocorticoids",
        prohibited_status: "prohibited_in_competition",
        wada_code: "S9",
        risk_level: "low",
        flag_football_relevance: "low",
        detection_window_days: 2,
        common_sources: [
          "prescription_medications",
          "anti_inflammatory_treatments",
        ],
        exceptions: [
          "oral_rectal_iv_im_prohibited",
          "topical_inhalation_allowed",
        ],
      },

      // P1 - Beta-blockers
      {
        substance_name: "Propranolol",
        substance_category: "beta_blockers",
        prohibited_status: "prohibited_in_competition",
        wada_code: "P1.1",
        risk_level: "low",
        flag_football_relevance: "low",
        detection_window_days: 2,
        common_sources: [
          "blood_pressure_medications",
          "performance_anxiety_medications",
        ],
        exceptions: ["therapeutic_use_exemption_allowed"],
      },
      {
        substance_name: "Atenolol",
        substance_category: "beta_blockers",
        prohibited_status: "prohibited_in_competition",
        wada_code: "P1.2",
        risk_level: "low",
        flag_football_relevance: "low",
        detection_window_days: 2,
        common_sources: ["blood_pressure_medications", "heart_medications"],
        exceptions: ["therapeutic_use_exemption_allowed"],
      },
    ];

    for (const substance of prohibitedSubstances) {
      try {
        await this.pool.query(
          `
          INSERT INTO wada_prohibited_substances (
            substance_name, substance_category, prohibited_status, wada_code, risk_level,
            flag_football_relevance, detection_window_days, common_sources, exceptions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (substance_name) DO UPDATE SET
            substance_category = EXCLUDED.substance_category,
            prohibited_status = EXCLUDED.prohibited_status,
            wada_code = EXCLUDED.wada_code,
            risk_level = EXCLUDED.risk_level,
            flag_football_relevance = EXCLUDED.flag_football_relevance,
            detection_window_days = EXCLUDED.detection_window_days,
            common_sources = EXCLUDED.common_sources,
            exceptions = EXCLUDED.exceptions,
            updated_at = NOW()
        `,
          [
            substance.substance_name,
            substance.substance_category,
            substance.prohibited_status,
            substance.wada_code,
            substance.risk_level,
            substance.flag_football_relevance,
            substance.detection_window_days,
            substance.common_sources,
            substance.exceptions || null,
          ],
        );
      } catch (error) {
        console.error(
          `Error inserting ${substance.substance_name}:`,
          error.message,
        );
      }
    }

    console.log(
      `✅ Seeded ${prohibitedSubstances.length} WADA prohibited substances`,
    );
  }

  async seedCommonMedications() {
    console.log("💊 Seeding common medications and their WADA status...");

    const commonMedications = [
      {
        supplement_name: "Ventolin (Salbutamol)",
        brand: "GlaxoSmithKline",
        wada_status: "compliant_with_tue",
        contamination_risk_percentage: 0.0,
        third_party_tested: true,
        flag_football_safe: true,
        recommended_for_position: ["all_positions"],
        usage_guidelines:
          "Requires Therapeutic Use Exemption (TUE) for competition use. Max 1600mcg/day, 800mcg/12h.",
        compliance_notes:
          "Asthma medication - allowed with TUE. Monitor usage and maintain TUE documentation.",
        risk_mitigation_strategies: [
          "obtain_tue",
          "monitor_dosage",
          "keep_medical_documentation",
        ],
      },
      {
        supplement_name: "Advair (Fluticasone/Salmeterol)",
        brand: "GlaxoSmithKline",
        wada_status: "compliant_with_tue",
        contamination_risk_percentage: 0.0,
        third_party_tested: true,
        flag_football_safe: true,
        recommended_for_position: ["all_positions"],
        usage_guidelines:
          "Requires TUE. Contains salmeterol (beta-2 agonist) - prohibited in competition without TUE.",
        compliance_notes:
          "Combination asthma medication. Salmeterol component requires TUE for competition.",
        risk_mitigation_strategies: [
          "obtain_tue",
          "consult_sports_physician",
          "monitor_competition_use",
        ],
      },
      {
        supplement_name: "Albuterol Inhaler",
        brand: "Generic",
        wada_status: "compliant_with_tue",
        contamination_risk_percentage: 0.0,
        third_party_tested: true,
        flag_football_safe: true,
        recommended_for_position: ["all_positions"],
        usage_guidelines:
          "Requires TUE for competition use. Same as Ventolin (salbutamol).",
        compliance_notes: "Generic version of Ventolin. Same WADA rules apply.",
        risk_mitigation_strategies: [
          "obtain_tue",
          "monitor_dosage",
          "keep_medical_documentation",
        ],
      },
      {
        supplement_name: "Claritin (Loratadine)",
        brand: "Bayer",
        wada_status: "compliant",
        contamination_risk_percentage: 0.0,
        third_party_tested: true,
        flag_football_safe: true,
        recommended_for_position: ["all_positions"],
        usage_guidelines:
          "Non-sedating antihistamine - safe for competition use.",
        compliance_notes: "Allergy medication - not prohibited by WADA.",
        risk_mitigation_strategies: ["no_restrictions", "safe_for_competition"],
      },
      {
        supplement_name: "Zyrtec (Cetirizine)",
        brand: "Johnson & Johnson",
        wada_status: "compliant",
        contamination_risk_percentage: 0.0,
        third_party_tested: true,
        flag_football_safe: true,
        recommended_for_position: ["all_positions"],
        usage_guidelines:
          "Non-sedating antihistamine - safe for competition use.",
        compliance_notes: "Allergy medication - not prohibited by WADA.",
        risk_mitigation_strategies: ["no_restrictions", "safe_for_competition"],
      },
      {
        supplement_name: "Tylenol (Acetaminophen)",
        brand: "Johnson & Johnson",
        wada_status: "compliant",
        contamination_risk_percentage: 0.0,
        third_party_tested: true,
        flag_football_safe: true,
        recommended_for_position: ["all_positions"],
        usage_guidelines: "Pain reliever - safe for competition use.",
        compliance_notes: "Pain medication - not prohibited by WADA.",
        risk_mitigation_strategies: ["no_restrictions", "safe_for_competition"],
      },
      {
        supplement_name: "Ibuprofen",
        brand: "Generic",
        wada_status: "compliant",
        contamination_risk_percentage: 0.0,
        third_party_tested: true,
        flag_football_safe: true,
        recommended_for_position: ["all_positions"],
        usage_guidelines:
          "Anti-inflammatory pain reliever - safe for competition use.",
        compliance_notes: "Pain medication - not prohibited by WADA.",
        risk_mitigation_strategies: ["no_restrictions", "safe_for_competition"],
      },
    ];

    for (const medication of commonMedications) {
      try {
        await this.pool.query(
          `
          INSERT INTO supplement_wada_compliance (
            supplement_name, brand, wada_status, contamination_risk_percentage,
            third_party_tested, flag_football_safe, recommended_for_position,
            usage_guidelines, compliance_notes, risk_mitigation_strategies
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (supplement_name, brand) DO UPDATE SET
            wada_status = EXCLUDED.wada_status,
            contamination_risk_percentage = EXCLUDED.contamination_risk_percentage,
            third_party_tested = EXCLUDED.third_party_tested,
            flag_football_safe = EXCLUDED.flag_football_safe,
            recommended_for_position = EXCLUDED.recommended_for_position,
            usage_guidelines = EXCLUDED.usage_guidelines,
            compliance_notes = EXCLUDED.compliance_notes,
            risk_mitigation_strategies = EXCLUDED.risk_mitigation_strategies,
            updated_at = NOW()
        `,
          [
            medication.supplement_name,
            medication.brand,
            medication.wada_status,
            medication.contamination_risk_percentage,
            medication.third_party_tested,
            medication.flag_football_safe,
            medication.recommended_for_position,
            medication.usage_guidelines,
            medication.compliance_notes,
            medication.risk_mitigation_strategies,
          ],
        );
      } catch (error) {
        console.error(
          `Error inserting ${medication.supplement_name}:`,
          error.message,
        );
      }
    }

    console.log(`✅ Seeded ${commonMedications.length} common medications`);
  }

  async runAllSeeders() {
    try {
      console.log("🚀 Starting WADA prohibited list seeding...");

      await this.seedCompleteWADAProhibitedList();
      await this.seedCommonMedications();

      console.log("🎉 WADA prohibited list seeding completed successfully!");
    } catch (error) {
      console.error("❌ Error seeding WADA prohibited list:", error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }
}

// Run the seeder if called directly
if (require.main === module) {
  const seeder = new WADAProhibitedListSeeder();
  seeder.runAllSeeders();
}

module.exports = WADAProhibitedListSeeder;

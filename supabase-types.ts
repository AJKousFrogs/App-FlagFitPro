export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affordable_brand_products: {
        Row: {
          affordability_rating: number | null
          amateur_budget_tier: string
          best_for: string | null
          brand_name: string
          brand_website: string | null
          considerations: string[] | null
          created_at: string | null
          id: number
          price_euros: number
          product_category: string
          product_name: string
          quality_rating: number | null
          value_for_money: number | null
        }
        Insert: {
          affordability_rating?: number | null
          amateur_budget_tier: string
          best_for?: string | null
          brand_name: string
          brand_website?: string | null
          considerations?: string[] | null
          created_at?: string | null
          id?: number
          price_euros: number
          product_category: string
          product_name: string
          quality_rating?: number | null
          value_for_money?: number | null
        }
        Update: {
          affordability_rating?: number | null
          amateur_budget_tier?: string
          best_for?: string | null
          brand_name?: string
          brand_website?: string | null
          considerations?: string[] | null
          created_at?: string | null
          id?: number
          price_euros?: number
          product_category?: string
          product_name?: string
          quality_rating?: number | null
          value_for_money?: number | null
        }
        Relationships: []
      }
      affordable_equipment: {
        Row: {
          created_at: string | null
          description: string
          diy_alternatives: string[] | null
          equipment_category: string
          equipment_name: string
          expected_lifespan_months: number | null
          id: number
          maintenance_requirements: string[] | null
          performance_benefit: string | null
          price_range_max: number
          price_range_min: number
          priority_for_amateur: string | null
          where_to_buy: string[] | null
        }
        Insert: {
          created_at?: string | null
          description: string
          diy_alternatives?: string[] | null
          equipment_category: string
          equipment_name: string
          expected_lifespan_months?: number | null
          id?: number
          maintenance_requirements?: string[] | null
          performance_benefit?: string | null
          price_range_max: number
          price_range_min: number
          priority_for_amateur?: string | null
          where_to_buy?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string
          diy_alternatives?: string[] | null
          equipment_category?: string
          equipment_name?: string
          expected_lifespan_months?: number | null
          id?: number
          maintenance_requirements?: string[] | null
          performance_benefit?: string | null
          price_range_max?: number
          price_range_min?: number
          priority_for_amateur?: string | null
          where_to_buy?: string[] | null
        }
        Relationships: []
      }
      agility_patterns: {
        Row: {
          cone_spacing_yards: number | null
          created_at: string | null
          direction_changes_count: number | null
          execution_instructions: string[] | null
          flag_football_application: string | null
          id: number
          name: string
          pattern_type: string | null
          setup_description: string | null
          total_distance_yards: number | null
        }
        Insert: {
          cone_spacing_yards?: number | null
          created_at?: string | null
          direction_changes_count?: number | null
          execution_instructions?: string[] | null
          flag_football_application?: string | null
          id?: number
          name: string
          pattern_type?: string | null
          setup_description?: string | null
          total_distance_yards?: number | null
        }
        Update: {
          cone_spacing_yards?: number | null
          created_at?: string | null
          direction_changes_count?: number | null
          execution_instructions?: string[] | null
          flag_football_application?: string | null
          id?: number
          name?: string
          pattern_type?: string | null
          setup_description?: string | null
          total_distance_yards?: number | null
        }
        Relationships: []
      }
      altitude_environmental_factors: {
        Row: {
          acclimatization_requirements_days: number | null
          altitude_feet: number | null
          altitude_meters: number
          atmospheric_pressure_hpa: number | null
          created_at: string | null
          health_considerations: string[] | null
          humidity_variation_percent: number | null
          id: number
          location_id: string
          location_name: string
          oxygen_saturation_percent: number | null
          performance_impact_percentage: number | null
          temperature_lapse_rate: number | null
          training_recommendations: string[] | null
          wind_patterns: Json | null
        }
        Insert: {
          acclimatization_requirements_days?: number | null
          altitude_feet?: number | null
          altitude_meters: number
          atmospheric_pressure_hpa?: number | null
          created_at?: string | null
          health_considerations?: string[] | null
          humidity_variation_percent?: number | null
          id?: number
          location_id: string
          location_name: string
          oxygen_saturation_percent?: number | null
          performance_impact_percentage?: number | null
          temperature_lapse_rate?: number | null
          training_recommendations?: string[] | null
          wind_patterns?: Json | null
        }
        Update: {
          acclimatization_requirements_days?: number | null
          altitude_feet?: number | null
          altitude_meters?: number
          atmospheric_pressure_hpa?: number | null
          created_at?: string | null
          health_considerations?: string[] | null
          humidity_variation_percent?: number | null
          id?: number
          location_id?: string
          location_name?: string
          oxygen_saturation_percent?: number | null
          performance_impact_percentage?: number | null
          temperature_lapse_rate?: number | null
          training_recommendations?: string[] | null
          wind_patterns?: Json | null
        }
        Relationships: []
      }
      amateur_training_programs: {
        Row: {
          created_at: string | null
          equipment_required: string[] | null
          exercises: string[]
          expected_results: string[] | null
          id: number
          program_duration_weeks: number
          program_name: string
          program_type: string
          progression_plan: string[] | null
          safety_guidelines: string[] | null
          sessions_per_week: number
          skill_level: string | null
          space_requirements: string | null
          time_per_session_minutes: number
        }
        Insert: {
          created_at?: string | null
          equipment_required?: string[] | null
          exercises: string[]
          expected_results?: string[] | null
          id?: number
          program_duration_weeks: number
          program_name: string
          program_type: string
          progression_plan?: string[] | null
          safety_guidelines?: string[] | null
          sessions_per_week: number
          skill_level?: string | null
          space_requirements?: string | null
          time_per_session_minutes: number
        }
        Update: {
          created_at?: string | null
          equipment_required?: string[] | null
          exercises?: string[]
          expected_results?: string[] | null
          id?: number
          program_duration_weeks?: number
          program_name?: string
          program_type?: string
          progression_plan?: string[] | null
          safety_guidelines?: string[] | null
          sessions_per_week?: number
          skill_level?: string | null
          space_requirements?: string | null
          time_per_session_minutes?: number
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          browser: string | null
          created_at: string | null
          device_type: string | null
          event_data: Json | null
          event_type: string
          id: number
          os: string | null
          page_url: string | null
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string
          viewport_height: number | null
          viewport_width: number | null
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type: string
          id?: number
          os?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id: string
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_type?: string | null
          event_data?: Json | null
          event_type?: string
          id?: number
          os?: string | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Relationships: []
      }
      budget_categories: {
        Row: {
          category_description: string
          category_name: string
          created_at: string | null
          expected_roi_percentage: number | null
          id: number
          priority_level: string | null
          recommended_max_spend: number | null
          recommended_min_spend: number | null
          why_it_matters: string
        }
        Insert: {
          category_description: string
          category_name: string
          created_at?: string | null
          expected_roi_percentage?: number | null
          id?: number
          priority_level?: string | null
          recommended_max_spend?: number | null
          recommended_min_spend?: number | null
          why_it_matters: string
        }
        Update: {
          category_description?: string
          category_name?: string
          created_at?: string | null
          expected_roi_percentage?: number | null
          id?: number
          priority_level?: string | null
          recommended_max_spend?: number | null
          recommended_min_spend?: number | null
          why_it_matters?: string
        }
        Relationships: []
      }
      budget_friendly_alternatives: {
        Row: {
          affordable_brand_product_id: number | null
          alternative_cost_euros: number
          alternative_name: string
          alternative_source: string | null
          best_for_budget_tier: string | null
          cost_savings_euros: number
          created_at: string | null
          effectiveness_comparison: number
          id: number
          notes: string | null
        }
        Insert: {
          affordable_brand_product_id?: number | null
          alternative_cost_euros: number
          alternative_name: string
          alternative_source?: string | null
          best_for_budget_tier?: string | null
          cost_savings_euros: number
          created_at?: string | null
          effectiveness_comparison: number
          id?: number
          notes?: string | null
        }
        Update: {
          affordable_brand_product_id?: number | null
          alternative_cost_euros?: number
          alternative_name?: string
          alternative_source?: string | null
          best_for_budget_tier?: string | null
          cost_savings_euros?: number
          created_at?: string | null
          effectiveness_comparison?: number
          id?: number
          notes?: string | null
        }
        Relationships: []
      }
      budget_nutrition_plans: {
        Row: {
          batch_cooking_instructions: string[] | null
          budget_per_month_euros: number
          cost_breakdown: Json | null
          created_at: string | null
          id: number
          meal_plan_structure: string[] | null
          plan_name: string
          shopping_list: string[] | null
          supplement_recommendations: string[] | null
          target_calories: number | null
          target_protein_g: number | null
          time_saving_tips: string[] | null
        }
        Insert: {
          batch_cooking_instructions?: string[] | null
          budget_per_month_euros: number
          cost_breakdown?: Json | null
          created_at?: string | null
          id?: number
          meal_plan_structure?: string[] | null
          plan_name: string
          shopping_list?: string[] | null
          supplement_recommendations?: string[] | null
          target_calories?: number | null
          target_protein_g?: number | null
          time_saving_tips?: string[] | null
        }
        Update: {
          batch_cooking_instructions?: string[] | null
          budget_per_month_euros?: number
          cost_breakdown?: Json | null
          created_at?: string | null
          id?: number
          meal_plan_structure?: string[] | null
          plan_name?: string
          shopping_list?: string[] | null
          supplement_recommendations?: string[] | null
          target_calories?: number | null
          target_protein_g?: number | null
          time_saving_tips?: string[] | null
        }
        Relationships: []
      }
      chatbot_user_context: {
        Row: {
          created_at: string | null
          expertise_level: string | null
          id: string
          last_query_at: string | null
          preferred_topics: string[] | null
          primary_team_id: string | null
          team_type: string | null
          total_queries: number | null
          updated_at: string | null
          user_id: string
          user_role: string
        }
        Insert: {
          created_at?: string | null
          expertise_level?: string | null
          id?: string
          last_query_at?: string | null
          preferred_topics?: string[] | null
          primary_team_id?: string | null
          team_type?: string | null
          total_queries?: number | null
          updated_at?: string | null
          user_id: string
          user_role: string
        }
        Update: {
          created_at?: string | null
          expertise_level?: string | null
          id?: string
          last_query_at?: string | null
          preferred_topics?: string[] | null
          primary_team_id?: string | null
          team_type?: string | null
          total_queries?: number | null
          updated_at?: string | null
          user_id?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_user_context_primary_team_id_fkey"
            columns: ["primary_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_user_context_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cognitive_recovery_protocols: {
        Row: {
          cognitive_activities: string[] | null
          contraindications: string[] | null
          created_at: string | null
          digital_restrictions: Json | null
          environmental_requirements: Json | null
          expected_outcomes: string[] | null
          id: number
          physical_activities: string[] | null
          protocol_description: string
          protocol_name: string
          recovery_duration_minutes: number
          recovery_intensity: string | null
          recovery_metrics: string[] | null
          recovery_type: string | null
        }
        Insert: {
          cognitive_activities?: string[] | null
          contraindications?: string[] | null
          created_at?: string | null
          digital_restrictions?: Json | null
          environmental_requirements?: Json | null
          expected_outcomes?: string[] | null
          id?: number
          physical_activities?: string[] | null
          protocol_description: string
          protocol_name: string
          recovery_duration_minutes: number
          recovery_intensity?: string | null
          recovery_metrics?: string[] | null
          recovery_type?: string | null
        }
        Update: {
          cognitive_activities?: string[] | null
          contraindications?: string[] | null
          created_at?: string | null
          digital_restrictions?: Json | null
          environmental_requirements?: Json | null
          expected_outcomes?: string[] | null
          id?: number
          physical_activities?: string[] | null
          protocol_description?: string
          protocol_name?: string
          recovery_duration_minutes?: number
          recovery_intensity?: string | null
          recovery_metrics?: string[] | null
          recovery_type?: string | null
        }
        Relationships: []
      }
      community_activation_events: {
        Row: {
          created_at: string | null
          current_participants: number | null
          end_date: string
          event_category: string
          event_description: string
          event_format: string | null
          event_impact_score: number | null
          event_name: string
          event_status: string | null
          event_type: string
          id: number
          notes: string | null
          participation_rate_percentage: number | null
          prizes_awards: string[] | null
          start_date: string
          success_criteria: string[] | null
          target_participants: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_participants?: number | null
          end_date: string
          event_category: string
          event_description: string
          event_format?: string | null
          event_impact_score?: number | null
          event_name: string
          event_status?: string | null
          event_type: string
          id?: number
          notes?: string | null
          participation_rate_percentage?: number | null
          prizes_awards?: string[] | null
          start_date: string
          success_criteria?: string[] | null
          target_participants?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_participants?: number | null
          end_date?: string
          event_category?: string
          event_description?: string
          event_format?: string | null
          event_impact_score?: number | null
          event_name?: string
          event_status?: string | null
          event_type?: string
          id?: number
          notes?: string | null
          participation_rate_percentage?: number | null
          prizes_awards?: string[] | null
          start_date?: string
          success_criteria?: string[] | null
          target_participants?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cost_effective_alternatives: {
        Row: {
          affordable_alternative: string
          alternative_cost_euros: number
          cost_savings_euros: number
          created_at: string | null
          effectiveness_comparison: string
          id: number
          premium_cost_euros: number
          premium_solution: string
          trade_offs: string[] | null
          when_to_consider_premium: string | null
        }
        Insert: {
          affordable_alternative: string
          alternative_cost_euros: number
          cost_savings_euros: number
          created_at?: string | null
          effectiveness_comparison: string
          id?: number
          premium_cost_euros: number
          premium_solution: string
          trade_offs?: string[] | null
          when_to_consider_premium?: string | null
        }
        Update: {
          affordable_alternative?: string
          alternative_cost_euros?: number
          cost_savings_euros?: number
          created_at?: string | null
          effectiveness_comparison?: string
          id?: number
          premium_cost_euros?: number
          premium_solution?: string
          trade_offs?: string[] | null
          when_to_consider_premium?: string | null
        }
        Relationships: []
      }
      creatine_research: {
        Row: {
          contraindications: string[] | null
          control_group_used: boolean | null
          created_at: string | null
          creatine_form: string | null
          dosage_mg_per_kg: number | null
          flag_football_relevance_score: number | null
          id: number
          loading_phase_days: number | null
          long_term_safety_data: boolean | null
          maintenance_dose_mg_per_day: number | null
          muscle_mass_gain_kg: number | null
          population_size: number | null
          position_specific_benefits: string[] | null
          power_improvement_percentage: number | null
          research_study_id: number | null
          side_effects: string[] | null
          sprint_performance_improvement: number | null
          strength_improvement_percentage: number | null
          study_duration_weeks: number | null
        }
        Insert: {
          contraindications?: string[] | null
          control_group_used?: boolean | null
          created_at?: string | null
          creatine_form?: string | null
          dosage_mg_per_kg?: number | null
          flag_football_relevance_score?: number | null
          id?: number
          loading_phase_days?: number | null
          long_term_safety_data?: boolean | null
          maintenance_dose_mg_per_day?: number | null
          muscle_mass_gain_kg?: number | null
          population_size?: number | null
          position_specific_benefits?: string[] | null
          power_improvement_percentage?: number | null
          research_study_id?: number | null
          side_effects?: string[] | null
          sprint_performance_improvement?: number | null
          strength_improvement_percentage?: number | null
          study_duration_weeks?: number | null
        }
        Update: {
          contraindications?: string[] | null
          control_group_used?: boolean | null
          created_at?: string | null
          creatine_form?: string | null
          dosage_mg_per_kg?: number | null
          flag_football_relevance_score?: number | null
          id?: number
          loading_phase_days?: number | null
          long_term_safety_data?: boolean | null
          maintenance_dose_mg_per_day?: number | null
          muscle_mass_gain_kg?: number | null
          population_size?: number | null
          position_specific_benefits?: string[] | null
          power_improvement_percentage?: number | null
          research_study_id?: number | null
          side_effects?: string[] | null
          sprint_performance_improvement?: number | null
          strength_improvement_percentage?: number | null
          study_duration_weeks?: number | null
        }
        Relationships: []
      }
      daily_quotes: {
        Row: {
          author: string
          category: string | null
          created_at: string | null
          id: number
          is_active: boolean | null
          quote_text: string
        }
        Insert: {
          author: string
          category?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          quote_text: string
        }
        Update: {
          author?: string
          category?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          quote_text?: string
        }
        Relationships: []
      }
      defensive_schemes: {
        Row: {
          blitzers_count: number | null
          created_at: string | null
          defensive_backs_count: number | null
          description: string | null
          id: number
          ideal_situations: string[] | null
          player_requirements: Json | null
          scheme_name: string
          scheme_strengths: string[] | null
          scheme_weaknesses: string[] | null
        }
        Insert: {
          blitzers_count?: number | null
          created_at?: string | null
          defensive_backs_count?: number | null
          description?: string | null
          id?: number
          ideal_situations?: string[] | null
          player_requirements?: Json | null
          scheme_name: string
          scheme_strengths?: string[] | null
          scheme_weaknesses?: string[] | null
        }
        Update: {
          blitzers_count?: number | null
          created_at?: string | null
          defensive_backs_count?: number | null
          description?: string | null
          id?: number
          ideal_situations?: string[] | null
          player_requirements?: Json | null
          scheme_name?: string
          scheme_strengths?: string[] | null
          scheme_weaknesses?: string[] | null
        }
        Relationships: []
      }
      digital_wellness_protocols: {
        Row: {
          alternative_activities: string[] | null
          app_usage_restrictions: Json | null
          cognitive_enhancement_exercises: string[] | null
          contraindications: string[] | null
          created_at: string | null
          daily_digital_time_limit_hours: number | null
          digital_detox_periods: Json | null
          evidence_level: string
          expected_improvements: Json | null
          id: number
          implementation_duration_weeks: number
          notification_management: Json | null
          protocol_description: string
          protocol_name: string
          screen_free_blocks_hours: number[] | null
          sleep_hygiene_guidelines: string[] | null
          stress_reduction_techniques: string[] | null
          success_metrics: string[] | null
          target_cognitive_issue: string | null
        }
        Insert: {
          alternative_activities?: string[] | null
          app_usage_restrictions?: Json | null
          cognitive_enhancement_exercises?: string[] | null
          contraindications?: string[] | null
          created_at?: string | null
          daily_digital_time_limit_hours?: number | null
          digital_detox_periods?: Json | null
          evidence_level: string
          expected_improvements?: Json | null
          id?: number
          implementation_duration_weeks: number
          notification_management?: Json | null
          protocol_description: string
          protocol_name: string
          screen_free_blocks_hours?: number[] | null
          sleep_hygiene_guidelines?: string[] | null
          stress_reduction_techniques?: string[] | null
          success_metrics?: string[] | null
          target_cognitive_issue?: string | null
        }
        Update: {
          alternative_activities?: string[] | null
          app_usage_restrictions?: Json | null
          cognitive_enhancement_exercises?: string[] | null
          contraindications?: string[] | null
          created_at?: string | null
          daily_digital_time_limit_hours?: number | null
          digital_detox_periods?: Json | null
          evidence_level?: string
          expected_improvements?: Json | null
          id?: number
          implementation_duration_weeks?: number
          notification_management?: Json | null
          protocol_description?: string
          protocol_name?: string
          screen_free_blocks_hours?: number[] | null
          sleep_hygiene_guidelines?: string[] | null
          stress_reduction_techniques?: string[] | null
          success_metrics?: string[] | null
          target_cognitive_issue?: string | null
        }
        Relationships: []
      }
      diy_protocols: {
        Row: {
          cost_savings_euros: number | null
          created_at: string | null
          difficulty_level: string | null
          effectiveness_rating: number | null
          equipment_needed: string[] | null
          id: number
          protocol_name: string
          protocol_type: string
          safety_considerations: string[] | null
          step_by_step_instructions: string[] | null
          target_outcome: string
          time_required_minutes: number
          video_tutorial_url: string | null
        }
        Insert: {
          cost_savings_euros?: number | null
          created_at?: string | null
          difficulty_level?: string | null
          effectiveness_rating?: number | null
          equipment_needed?: string[] | null
          id?: number
          protocol_name: string
          protocol_type: string
          safety_considerations?: string[] | null
          step_by_step_instructions?: string[] | null
          target_outcome: string
          time_required_minutes: number
          video_tutorial_url?: string | null
        }
        Update: {
          cost_savings_euros?: number | null
          created_at?: string | null
          difficulty_level?: string | null
          effectiveness_rating?: number | null
          equipment_needed?: string[] | null
          id?: number
          protocol_name?: string
          protocol_type?: string
          safety_considerations?: string[] | null
          step_by_step_instructions?: string[] | null
          target_outcome?: string
          time_required_minutes?: number
          video_tutorial_url?: string | null
        }
        Relationships: []
      }
      environmental_adjustments: {
        Row: {
          adjustment_description: string
          adjustment_factor: number
          adjustment_magnitude: number | null
          adjustment_type: string
          adjustment_unit: string | null
          citation_references: string[] | null
          contraindications: string[] | null
          created_at: string | null
          environmental_parameter: string
          evidence_level: string | null
          id: number
          protocol_id: number
          protocol_type: string
          threshold_operator: string
          threshold_value: number
        }
        Insert: {
          adjustment_description: string
          adjustment_factor: number
          adjustment_magnitude?: number | null
          adjustment_type: string
          adjustment_unit?: string | null
          citation_references?: string[] | null
          contraindications?: string[] | null
          created_at?: string | null
          environmental_parameter: string
          evidence_level?: string | null
          id?: number
          protocol_id: number
          protocol_type: string
          threshold_operator: string
          threshold_value: number
        }
        Update: {
          adjustment_description?: string
          adjustment_factor?: number
          adjustment_magnitude?: number | null
          adjustment_type?: string
          adjustment_unit?: string | null
          citation_references?: string[] | null
          contraindications?: string[] | null
          created_at?: string | null
          environmental_parameter?: string
          evidence_level?: string | null
          id?: number
          protocol_id?: number
          protocol_type?: string
          threshold_operator?: string
          threshold_value?: number
        }
        Relationships: []
      }
      environmental_recovery_protocols: {
        Row: {
          altitude_requirements_meters: Json | null
          contraindications: string[] | null
          created_at: string | null
          environmental_condition: string
          evidence_level: string | null
          humidity_requirements_percent: Json | null
          hydration_protocols: Json | null
          id: number
          nutrition_protocols: Json | null
          protocol_description: string
          protocol_name: string
          recovery_duration_minutes: number
          recovery_modalities: string[] | null
          temperature_requirements_celsius: Json | null
        }
        Insert: {
          altitude_requirements_meters?: Json | null
          contraindications?: string[] | null
          created_at?: string | null
          environmental_condition: string
          evidence_level?: string | null
          humidity_requirements_percent?: Json | null
          hydration_protocols?: Json | null
          id?: number
          nutrition_protocols?: Json | null
          protocol_description: string
          protocol_name: string
          recovery_duration_minutes: number
          recovery_modalities?: string[] | null
          temperature_requirements_celsius?: Json | null
        }
        Update: {
          altitude_requirements_meters?: Json | null
          contraindications?: string[] | null
          created_at?: string | null
          environmental_condition?: string
          evidence_level?: string | null
          humidity_requirements_percent?: Json | null
          hydration_protocols?: Json | null
          id?: number
          nutrition_protocols?: Json | null
          protocol_description?: string
          protocol_name?: string
          recovery_duration_minutes?: number
          recovery_modalities?: string[] | null
          temperature_requirements_celsius?: Json | null
        }
        Relationships: []
      }
      equipment_alternatives_comparison: {
        Row: {
          alternative_cost_euros: number
          alternative_name: string
          convenience_rating: number | null
          created_at: string | null
          effectiveness_comparison: number
          id: number
          maintenance_effort: string | null
          notes: string | null
          primary_equipment_id: number | null
          setup_time_minutes: number | null
          space_requirements: string | null
        }
        Insert: {
          alternative_cost_euros: number
          alternative_name: string
          convenience_rating?: number | null
          created_at?: string | null
          effectiveness_comparison: number
          id?: number
          maintenance_effort?: string | null
          notes?: string | null
          primary_equipment_id?: number | null
          setup_time_minutes?: number | null
          space_requirements?: string | null
        }
        Update: {
          alternative_cost_euros?: number
          alternative_name?: string
          convenience_rating?: number | null
          created_at?: string | null
          effectiveness_comparison?: number
          id?: number
          maintenance_effort?: string | null
          notes?: string | null
          primary_equipment_id?: number | null
          setup_time_minutes?: number | null
          space_requirements?: string | null
        }
        Relationships: []
      }
      equipment_price_tracking: {
        Row: {
          availability_status: string | null
          created_at: string | null
          date_found: string
          equipment_name: string
          id: number
          notes: string | null
          price_euros: number
          shipping_cost_euros: number | null
          source_name: string | null
          source_url: string | null
          total_cost_euros: number | null
        }
        Insert: {
          availability_status?: string | null
          created_at?: string | null
          date_found: string
          equipment_name: string
          id?: number
          notes?: string | null
          price_euros: number
          shipping_cost_euros?: number | null
          source_name?: string | null
          source_url?: string | null
          total_cost_euros?: number | null
        }
        Update: {
          availability_status?: string | null
          created_at?: string | null
          date_found?: string
          equipment_name?: string
          id?: number
          notes?: string | null
          price_euros?: number
          shipping_cost_euros?: number | null
          source_name?: string | null
          source_url?: string | null
          total_cost_euros?: number | null
        }
        Relationships: []
      }
      european_championship_protocols: {
        Row: {
          altitude_variations_meters: number[] | null
          athlete_feedback_score: number | null
          average_humidity_percentage: number | null
          average_temperature_celsius: number | null
          between_games_hydration_strategy: string | null
          body_weight_monitoring_frequency: string | null
          championship_year: number
          climate_zone: string | null
          cognitive_testing_schedule: string[] | null
          created_at: string | null
          daily_hydration_targets_ml_per_kg: number | null
          games_per_team: number | null
          host_country: string | null
          hydration_related_injuries: number | null
          hydration_status_checks_per_day: number | null
          id: number
          performance_consistency_score: number | null
          pre_tournament_hydration_protocol: string | null
          recovery_hydration_protocol: string | null
          teams_participating: number | null
          tournament_duration_days: number | null
        }
        Insert: {
          altitude_variations_meters?: number[] | null
          athlete_feedback_score?: number | null
          average_humidity_percentage?: number | null
          average_temperature_celsius?: number | null
          between_games_hydration_strategy?: string | null
          body_weight_monitoring_frequency?: string | null
          championship_year: number
          climate_zone?: string | null
          cognitive_testing_schedule?: string[] | null
          created_at?: string | null
          daily_hydration_targets_ml_per_kg?: number | null
          games_per_team?: number | null
          host_country?: string | null
          hydration_related_injuries?: number | null
          hydration_status_checks_per_day?: number | null
          id?: number
          performance_consistency_score?: number | null
          pre_tournament_hydration_protocol?: string | null
          recovery_hydration_protocol?: string | null
          teams_participating?: number | null
          tournament_duration_days?: number | null
        }
        Update: {
          altitude_variations_meters?: number[] | null
          athlete_feedback_score?: number | null
          average_humidity_percentage?: number | null
          average_temperature_celsius?: number | null
          between_games_hydration_strategy?: string | null
          body_weight_monitoring_frequency?: string | null
          championship_year?: number
          climate_zone?: string | null
          cognitive_testing_schedule?: string[] | null
          created_at?: string | null
          daily_hydration_targets_ml_per_kg?: number | null
          games_per_team?: number | null
          host_country?: string | null
          hydration_related_injuries?: number | null
          hydration_status_checks_per_day?: number | null
          id?: number
          performance_consistency_score?: number | null
          pre_tournament_hydration_protocol?: string | null
          recovery_hydration_protocol?: string | null
          teams_participating?: number | null
          tournament_duration_days?: number | null
        }
        Relationships: []
      }
      fixtures: {
        Row: {
          athlete_id: string | null
          created_at: string | null
          game_start: string
          game_type: string | null
          id: string
          location: string | null
          opponent: string | null
          team_id: string | null
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string | null
          game_start: string
          game_type?: string | null
          id?: string
          location?: string | null
          opponent?: string | null
          team_id?: string | null
        }
        Update: {
          athlete_id?: string | null
          created_at?: string | null
          game_start?: string
          game_type?: string | null
          id?: string
          location?: string | null
          opponent?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      flag_football_performance_levels: {
        Row: {
          created_at: string | null
          description: string | null
          female_target: number | null
          id: number
          level_name: string | null
          male_target: number | null
          percentage_of_nfl_elite: number | null
          position: string | null
          test_name: string | null
          training_focus: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          female_target?: number | null
          id?: number
          level_name?: string | null
          male_target?: number | null
          percentage_of_nfl_elite?: number | null
          position?: string | null
          test_name?: string | null
          training_focus?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          female_target?: number | null
          id?: number
          level_name?: string | null
          male_target?: number | null
          percentage_of_nfl_elite?: number | null
          position?: string | null
          test_name?: string | null
          training_focus?: string[] | null
        }
        Relationships: []
      }
      flag_football_positions: {
        Row: {
          created_at: string | null
          id: number
          physical_requirements: Json | null
          position_category: string
          position_name: string
          primary_responsibilities: string[]
          tactical_understanding: string[]
          technical_skills: string[]
        }
        Insert: {
          created_at?: string | null
          id?: number
          physical_requirements?: Json | null
          position_category: string
          position_name: string
          primary_responsibilities: string[]
          tactical_understanding: string[]
          technical_skills: string[]
        }
        Update: {
          created_at?: string | null
          id?: number
          physical_requirements?: Json | null
          position_category?: string
          position_name?: string
          primary_responsibilities?: string[]
          tactical_understanding?: string[]
          technical_skills?: string[]
        }
        Relationships: []
      }
      game_day_workflows: {
        Row: {
          created_at: string | null
          estimated_duration_minutes: number | null
          id: number
          is_mandatory: boolean | null
          workflow_name: string
          workflow_steps: Json
          workflow_type: string
        }
        Insert: {
          created_at?: string | null
          estimated_duration_minutes?: number | null
          id?: number
          is_mandatory?: boolean | null
          workflow_name: string
          workflow_steps: Json
          workflow_type: string
        }
        Update: {
          created_at?: string | null
          estimated_duration_minutes?: number | null
          id?: number
          is_mandatory?: boolean | null
          workflow_name?: string
          workflow_steps?: Json
          workflow_type?: string
        }
        Relationships: []
      }
      hydration_research_studies: {
        Row: {
          authors: string[]
          citation_count: number | null
          competition_level: string | null
          confidence_interval_lower: number | null
          confidence_interval_upper: number | null
          created_at: string | null
          doi: string | null
          effect_size: number | null
          evidence_level: string | null
          id: number
          impact_factor: number | null
          journal: string | null
          key_findings: string[] | null
          last_updated: string | null
          limitations: string[] | null
          p_value: number | null
          population_studied: string | null
          practical_applications: string[] | null
          publication_year: number
          pubmed_id: string | null
          recommendations: string[] | null
          sample_size: number | null
          sport_specific: string | null
          study_title: string
          study_type: string | null
          updated_at: string | null
        }
        Insert: {
          authors: string[]
          citation_count?: number | null
          competition_level?: string | null
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          created_at?: string | null
          doi?: string | null
          effect_size?: number | null
          evidence_level?: string | null
          id?: number
          impact_factor?: number | null
          journal?: string | null
          key_findings?: string[] | null
          last_updated?: string | null
          limitations?: string[] | null
          p_value?: number | null
          population_studied?: string | null
          practical_applications?: string[] | null
          publication_year: number
          pubmed_id?: string | null
          recommendations?: string[] | null
          sample_size?: number | null
          sport_specific?: string | null
          study_title: string
          study_type?: string | null
          updated_at?: string | null
        }
        Update: {
          authors?: string[]
          citation_count?: number | null
          competition_level?: string | null
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          created_at?: string | null
          doi?: string | null
          effect_size?: number | null
          evidence_level?: string | null
          id?: number
          impact_factor?: number | null
          journal?: string | null
          key_findings?: string[] | null
          last_updated?: string | null
          limitations?: string[] | null
          p_value?: number | null
          population_studied?: string | null
          practical_applications?: string[] | null
          publication_year?: number
          pubmed_id?: string | null
          recommendations?: string[] | null
          sample_size?: number | null
          sport_specific?: string | null
          study_title?: string
          study_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ifaf_elo_ratings: {
        Row: {
          category: string
          country: string
          created_at: string | null
          draws: number | null
          elo_rating: number
          gender: string
          id: number
          k_factor: number | null
          loss_streak: number | null
          losses: number | null
          matches_played: number | null
          previous_rating: number | null
          rating_change: number | null
          rating_date: string
          win_streak: number | null
          wins: number | null
        }
        Insert: {
          category: string
          country: string
          created_at?: string | null
          draws?: number | null
          elo_rating: number
          gender: string
          id?: number
          k_factor?: number | null
          loss_streak?: number | null
          losses?: number | null
          matches_played?: number | null
          previous_rating?: number | null
          rating_change?: number | null
          rating_date: string
          win_streak?: number | null
          wins?: number | null
        }
        Update: {
          category?: string
          country?: string
          created_at?: string | null
          draws?: number | null
          elo_rating?: number
          gender?: string
          id?: number
          k_factor?: number | null
          loss_streak?: number | null
          losses?: number | null
          matches_played?: number | null
          previous_rating?: number | null
          rating_change?: number | null
          rating_date?: string
          win_streak?: number | null
          wins?: number | null
        }
        Relationships: []
      }
      ifaf_flag_rankings: {
        Row: {
          category: string
          confidence_score: number | null
          country: string
          created_at: string | null
          data_source: string | null
          draws: number | null
          gender: string
          goal_difference: number | null
          goals_against: number | null
          goals_for: number | null
          id: number
          last_match_date: string | null
          losses: number | null
          matches_played: number | null
          points: number
          points_change: number | null
          previous_rank: number | null
          rank: number
          ranking_date: string
          ranking_period: string
          update_date: string | null
          wins: number | null
        }
        Insert: {
          category: string
          confidence_score?: number | null
          country: string
          created_at?: string | null
          data_source?: string | null
          draws?: number | null
          gender: string
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: number
          last_match_date?: string | null
          losses?: number | null
          matches_played?: number | null
          points: number
          points_change?: number | null
          previous_rank?: number | null
          rank: number
          ranking_date: string
          ranking_period: string
          update_date?: string | null
          wins?: number | null
        }
        Update: {
          category?: string
          confidence_score?: number | null
          country?: string
          created_at?: string | null
          data_source?: string | null
          draws?: number | null
          gender?: string
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: number
          last_match_date?: string | null
          losses?: number | null
          matches_played?: number | null
          points?: number
          points_change?: number | null
          previous_rank?: number | null
          rank?: number
          ranking_date?: string
          ranking_period?: string
          update_date?: string | null
          wins?: number | null
        }
        Relationships: []
      }
      ifaf_hydration_protocols: {
        Row: {
          altitude_meters: number | null
          between_games_hydration_ml_per_kg: number | null
          body_weight_loss_limit_kg: number | null
          calcium_mg_per_liter: number | null
          cognitive_test_recommendations: string[] | null
          competition_level: string | null
          competition_type: string | null
          created_at: string | null
          during_game_hydration_ml_per_15min: number | null
          evidence_strength: string | null
          game_duration_minutes: number | null
          games_per_day: number | null
          id: number
          indoor_outdoor: string | null
          last_updated: string | null
          magnesium_mg_per_liter: number | null
          post_game_hydration_ml_per_kg: number | null
          potassium_mg_per_liter: number | null
          pre_game_hydration_ml_per_kg: number | null
          pre_game_timing_hours: number | null
          research_studies: number[] | null
          sodium_mg_per_liter: number | null
          time_between_games_minutes: number | null
          total_playing_time_minutes: number | null
          typical_humidity_percentage: number | null
          typical_temperature_celsius: number | null
          urine_color_target: number | null
        }
        Insert: {
          altitude_meters?: number | null
          between_games_hydration_ml_per_kg?: number | null
          body_weight_loss_limit_kg?: number | null
          calcium_mg_per_liter?: number | null
          cognitive_test_recommendations?: string[] | null
          competition_level?: string | null
          competition_type?: string | null
          created_at?: string | null
          during_game_hydration_ml_per_15min?: number | null
          evidence_strength?: string | null
          game_duration_minutes?: number | null
          games_per_day?: number | null
          id?: number
          indoor_outdoor?: string | null
          last_updated?: string | null
          magnesium_mg_per_liter?: number | null
          post_game_hydration_ml_per_kg?: number | null
          potassium_mg_per_liter?: number | null
          pre_game_hydration_ml_per_kg?: number | null
          pre_game_timing_hours?: number | null
          research_studies?: number[] | null
          sodium_mg_per_liter?: number | null
          time_between_games_minutes?: number | null
          total_playing_time_minutes?: number | null
          typical_humidity_percentage?: number | null
          typical_temperature_celsius?: number | null
          urine_color_target?: number | null
        }
        Update: {
          altitude_meters?: number | null
          between_games_hydration_ml_per_kg?: number | null
          body_weight_loss_limit_kg?: number | null
          calcium_mg_per_liter?: number | null
          cognitive_test_recommendations?: string[] | null
          competition_level?: string | null
          competition_type?: string | null
          created_at?: string | null
          during_game_hydration_ml_per_15min?: number | null
          evidence_strength?: string | null
          game_duration_minutes?: number | null
          games_per_day?: number | null
          id?: number
          indoor_outdoor?: string | null
          last_updated?: string | null
          magnesium_mg_per_liter?: number | null
          post_game_hydration_ml_per_kg?: number | null
          potassium_mg_per_liter?: number | null
          pre_game_hydration_ml_per_kg?: number | null
          pre_game_timing_hours?: number | null
          research_studies?: number[] | null
          sodium_mg_per_liter?: number | null
          time_between_games_minutes?: number | null
          total_playing_time_minutes?: number | null
          typical_humidity_percentage?: number | null
          typical_temperature_celsius?: number | null
          urine_color_target?: number | null
        }
        Relationships: []
      }
      implementation_steps: {
        Row: {
          actual_duration_days: number | null
          completion_date: string | null
          created_at: string | null
          dependencies: string[] | null
          estimated_duration_days: number
          id: number
          notes: string | null
          required_resources: string[] | null
          start_date: string | null
          step_category: string
          step_description: string
          step_name: string
          step_order: number
          step_status: string | null
          success_criteria: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_duration_days?: number | null
          completion_date?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          estimated_duration_days: number
          id?: number
          notes?: string | null
          required_resources?: string[] | null
          start_date?: string | null
          step_category: string
          step_description: string
          step_name: string
          step_order: number
          step_status?: string | null
          success_criteria: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_duration_days?: number | null
          completion_date?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          estimated_duration_days?: number
          id?: number
          notes?: string | null
          required_resources?: string[] | null
          start_date?: string | null
          step_category?: string
          step_description?: string
          step_name?: string
          step_order?: number
          step_status?: string | null
          success_criteria?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      local_premium_alternatives: {
        Row: {
          accessibility_rating: number | null
          availability_notes: string | null
          created_at: string | null
          effectiveness_comparison: number
          id: number
          local_alternative_cost_euros: number
          local_alternative_name: string
          local_alternative_type: string
          location_requirements: string | null
          premium_brand_id: number | null
        }
        Insert: {
          accessibility_rating?: number | null
          availability_notes?: string | null
          created_at?: string | null
          effectiveness_comparison: number
          id?: number
          local_alternative_cost_euros: number
          local_alternative_name: string
          local_alternative_type: string
          location_requirements?: string | null
          premium_brand_id?: number | null
        }
        Update: {
          accessibility_rating?: number | null
          availability_notes?: string | null
          created_at?: string | null
          effectiveness_comparison?: number
          id?: number
          local_alternative_cost_euros?: number
          local_alternative_name?: string
          local_alternative_type?: string
          location_requirements?: string | null
          premium_brand_id?: number | null
        }
        Relationships: []
      }
      national_team_profiles: {
        Row: {
          coaching_staff: Json | null
          contact_info: Json | null
          country_code: string
          created_at: string | null
          development_programs: string[] | null
          federation: string
          federation_established_year: number | null
          financial_resources: string | null
          formation_preferences: string[] | null
          home_venue: string | null
          id: number
          ifaf_member_since: string | null
          key_players: string[] | null
          major_tournament_results: Json | null
          play_style: string[]
          player_pool_size: number | null
          professional_league: boolean | null
          team_id: string
          training_facility: string | null
          updated_at: string | null
          world_ranking_history: Json | null
        }
        Insert: {
          coaching_staff?: Json | null
          contact_info?: Json | null
          country_code: string
          created_at?: string | null
          development_programs?: string[] | null
          federation: string
          federation_established_year?: number | null
          financial_resources?: string | null
          formation_preferences?: string[] | null
          home_venue?: string | null
          id?: number
          ifaf_member_since?: string | null
          key_players?: string[] | null
          major_tournament_results?: Json | null
          play_style: string[]
          player_pool_size?: number | null
          professional_league?: boolean | null
          team_id: string
          training_facility?: string | null
          updated_at?: string | null
          world_ranking_history?: Json | null
        }
        Update: {
          coaching_staff?: Json | null
          contact_info?: Json | null
          country_code?: string
          created_at?: string | null
          development_programs?: string[] | null
          federation?: string
          federation_established_year?: number | null
          financial_resources?: string | null
          formation_preferences?: string[] | null
          home_venue?: string | null
          id?: number
          ifaf_member_since?: string | null
          key_players?: string[] | null
          major_tournament_results?: Json | null
          play_style?: string[]
          player_pool_size?: number | null
          professional_league?: boolean | null
          team_id?: string
          training_facility?: string | null
          updated_at?: string | null
          world_ranking_history?: Json | null
        }
        Relationships: []
      }
      nfl_combine_benchmarks: {
        Row: {
          average_nfl_threshold: number | null
          created_at: string | null
          elite_threshold: number | null
          good_threshold: number | null
          id: number
          notes: string | null
          position: string | null
          record_holder: string | null
          record_time: number | null
          record_year: number | null
          test_name: string | null
        }
        Insert: {
          average_nfl_threshold?: number | null
          created_at?: string | null
          elite_threshold?: number | null
          good_threshold?: number | null
          id?: number
          notes?: string | null
          position?: string | null
          record_holder?: string | null
          record_time?: number | null
          record_year?: number | null
          test_name?: string | null
        }
        Update: {
          average_nfl_threshold?: number | null
          created_at?: string | null
          elite_threshold?: number | null
          good_threshold?: number | null
          id?: number
          notes?: string | null
          position?: string | null
          record_holder?: string | null
          record_time?: number | null
          record_year?: number | null
          test_name?: string | null
        }
        Relationships: []
      }
      nfl_combine_performances: {
        Row: {
          bench_press_reps: number | null
          broad_jump: number | null
          career_achievements: string[] | null
          career_stats: Json | null
          college: string | null
          combine_year: number | null
          created_at: string | null
          current_status: string | null
          draft_pick: number | null
          draft_round: number | null
          draft_year: number | null
          forty_yard_dash: number | null
          height_inches: number | null
          id: number
          nfl_seasons_played: number | null
          notable_achievements: string[] | null
          player_name: string
          position: string
          success_rating: number | null
          ten_yard_split: number | null
          three_cone_drill: number | null
          twenty_yard_shuttle: number | null
          twenty_yard_split: number | null
          vertical_jump: number | null
          weight_pounds: number | null
        }
        Insert: {
          bench_press_reps?: number | null
          broad_jump?: number | null
          career_achievements?: string[] | null
          career_stats?: Json | null
          college?: string | null
          combine_year?: number | null
          created_at?: string | null
          current_status?: string | null
          draft_pick?: number | null
          draft_round?: number | null
          draft_year?: number | null
          forty_yard_dash?: number | null
          height_inches?: number | null
          id?: number
          nfl_seasons_played?: number | null
          notable_achievements?: string[] | null
          player_name: string
          position: string
          success_rating?: number | null
          ten_yard_split?: number | null
          three_cone_drill?: number | null
          twenty_yard_shuttle?: number | null
          twenty_yard_split?: number | null
          vertical_jump?: number | null
          weight_pounds?: number | null
        }
        Update: {
          bench_press_reps?: number | null
          broad_jump?: number | null
          career_achievements?: string[] | null
          career_stats?: Json | null
          college?: string | null
          combine_year?: number | null
          created_at?: string | null
          current_status?: string | null
          draft_pick?: number | null
          draft_round?: number | null
          draft_year?: number | null
          forty_yard_dash?: number | null
          height_inches?: number | null
          id?: number
          nfl_seasons_played?: number | null
          notable_achievements?: string[] | null
          player_name?: string
          position?: string
          success_rating?: number | null
          ten_yard_split?: number | null
          three_cone_drill?: number | null
          twenty_yard_shuttle?: number | null
          twenty_yard_split?: number | null
          vertical_jump?: number | null
          weight_pounds?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          message: string
          notification_type: string
          priority: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message: string
          notification_type: string
          priority?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          message?: string
          notification_type?: string
          priority?: string | null
          user_id?: string
        }
        Relationships: []
      }
      olympic_games_protocols: {
        Row: {
          ai_powered_hydration_optimization: boolean | null
          anti_doping_compliance: string[] | null
          created_at: string | null
          cultural_dietary_considerations: string[] | null
          flag_football_status: string | null
          host_city: string | null
          id: number
          international_standards_application: string[] | null
          knowledge_transfer_programs: string[] | null
          long_term_impact_studies: boolean | null
          olympic_year: number
          real_time_biometric_monitoring: boolean | null
          research_collaborations: string[] | null
          wearable_technology_integration: boolean | null
        }
        Insert: {
          ai_powered_hydration_optimization?: boolean | null
          anti_doping_compliance?: string[] | null
          created_at?: string | null
          cultural_dietary_considerations?: string[] | null
          flag_football_status?: string | null
          host_city?: string | null
          id?: number
          international_standards_application?: string[] | null
          knowledge_transfer_programs?: string[] | null
          long_term_impact_studies?: boolean | null
          olympic_year: number
          real_time_biometric_monitoring?: boolean | null
          research_collaborations?: string[] | null
          wearable_technology_integration?: boolean | null
        }
        Update: {
          ai_powered_hydration_optimization?: boolean | null
          anti_doping_compliance?: string[] | null
          created_at?: string | null
          cultural_dietary_considerations?: string[] | null
          flag_football_status?: string | null
          host_city?: string | null
          id?: number
          international_standards_application?: string[] | null
          knowledge_transfer_programs?: string[] | null
          long_term_impact_studies?: boolean | null
          olympic_year?: number
          real_time_biometric_monitoring?: boolean | null
          research_collaborations?: string[] | null
          wearable_technology_integration?: boolean | null
        }
        Relationships: []
      }
      olympic_qualification: {
        Row: {
          created_at: string | null
          days_until_championship: number | null
          european_championship_date: string | null
          id: number
          olympic_date: string | null
          qualification_probability: number | null
          user_id: string
          world_championship_date: string | null
          world_ranking: number | null
        }
        Insert: {
          created_at?: string | null
          days_until_championship?: number | null
          european_championship_date?: string | null
          id?: number
          olympic_date?: string | null
          qualification_probability?: number | null
          user_id: string
          world_championship_date?: string | null
          world_ranking?: number | null
        }
        Update: {
          created_at?: string | null
          days_until_championship?: number | null
          european_championship_date?: string | null
          id?: number
          olympic_date?: string | null
          qualification_probability?: number | null
          user_id?: string
          world_championship_date?: string | null
          world_ranking?: number | null
        }
        Relationships: []
      }
      performance_benchmarks: {
        Row: {
          created_at: string | null
          current_value: number
          id: number
          metric_name: string
          target_value: number
          unit: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_value: number
          id?: number
          metric_name: string
          target_value: number
          unit?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_value?: number
          id?: number
          metric_name?: string
          target_value?: number
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      performance_competencies: {
        Row: {
          applicable_positions: string[] | null
          assessment_methods: string[] | null
          benchmark_standards: Json | null
          competency_category: string
          competency_description: string
          competency_levels: Json | null
          competency_name: string
          created_at: string | null
          development_activities: string[] | null
          evidence_level: string | null
          id: number
          position_specific: boolean | null
        }
        Insert: {
          applicable_positions?: string[] | null
          assessment_methods?: string[] | null
          benchmark_standards?: Json | null
          competency_category: string
          competency_description: string
          competency_levels?: Json | null
          competency_name: string
          created_at?: string | null
          development_activities?: string[] | null
          evidence_level?: string | null
          id?: number
          position_specific?: boolean | null
        }
        Update: {
          applicable_positions?: string[] | null
          assessment_methods?: string[] | null
          benchmark_standards?: Json | null
          competency_category?: string
          competency_description?: string
          competency_levels?: Json | null
          competency_name?: string
          created_at?: string | null
          development_activities?: string[] | null
          evidence_level?: string | null
          id?: number
          position_specific?: boolean | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          api_response_time: number | null
          bundle_size: number | null
          cls: number | null
          connection_type: string | null
          created_at: string | null
          fcp: number | null
          fid: number | null
          id: number
          lcp: number | null
          load_time: number | null
          memory_usage: number | null
          page_url: string
          performance_score: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          api_response_time?: number | null
          bundle_size?: number | null
          cls?: number | null
          connection_type?: string | null
          created_at?: string | null
          fcp?: number | null
          fid?: number | null
          id?: number
          lcp?: number | null
          load_time?: number | null
          memory_usage?: number | null
          page_url: string
          performance_score?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          api_response_time?: number | null
          bundle_size?: number | null
          cls?: number | null
          connection_type?: string | null
          created_at?: string | null
          fcp?: number | null
          fid?: number | null
          id?: number
          lcp?: number | null
          load_time?: number | null
          memory_usage?: number | null
          page_url?: string
          performance_score?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      performance_plan_templates: {
        Row: {
          budget_range_max: number | null
          budget_range_min: number | null
          core_pillars: string[]
          created_at: string | null
          id: number
          recommended_resources: string[] | null
          success_metrics: string[] | null
          target_athlete_type: string
          template_category: string
          template_description: string
          template_name: string
          template_status: string | null
          timeline_weeks: number
          updated_at: string | null
        }
        Insert: {
          budget_range_max?: number | null
          budget_range_min?: number | null
          core_pillars: string[]
          created_at?: string | null
          id?: number
          recommended_resources?: string[] | null
          success_metrics?: string[] | null
          target_athlete_type: string
          template_category: string
          template_description: string
          template_name: string
          template_status?: string | null
          timeline_weeks: number
          updated_at?: string | null
        }
        Update: {
          budget_range_max?: number | null
          budget_range_min?: number | null
          core_pillars?: string[]
          created_at?: string | null
          id?: number
          recommended_resources?: string[] | null
          success_metrics?: string[] | null
          target_athlete_type?: string
          template_category?: string
          template_description?: string
          template_name?: string
          template_status?: string | null
          timeline_weeks?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      player_archetypes: {
        Row: {
          agility_rating_max: number | null
          agility_rating_min: number | null
          archetype_name: string
          broad_jump_target: number | null
          created_at: string | null
          description: string | null
          forty_yard_sprint_target: number | null
          id: number
          ideal_sports_backgrounds: string[] | null
          l_drill_target: number | null
          position_suitability: Json | null
          power_rating_max: number | null
          power_rating_min: number | null
          secondary_sports_backgrounds: string[] | null
          speed_rating_max: number | null
          speed_rating_min: number | null
          ten_yard_sprint_target: number | null
          vertical_jump_target: number | null
        }
        Insert: {
          agility_rating_max?: number | null
          agility_rating_min?: number | null
          archetype_name: string
          broad_jump_target?: number | null
          created_at?: string | null
          description?: string | null
          forty_yard_sprint_target?: number | null
          id?: number
          ideal_sports_backgrounds?: string[] | null
          l_drill_target?: number | null
          position_suitability?: Json | null
          power_rating_max?: number | null
          power_rating_min?: number | null
          secondary_sports_backgrounds?: string[] | null
          speed_rating_max?: number | null
          speed_rating_min?: number | null
          ten_yard_sprint_target?: number | null
          vertical_jump_target?: number | null
        }
        Update: {
          agility_rating_max?: number | null
          agility_rating_min?: number | null
          archetype_name?: string
          broad_jump_target?: number | null
          created_at?: string | null
          description?: string | null
          forty_yard_sprint_target?: number | null
          id?: number
          ideal_sports_backgrounds?: string[] | null
          l_drill_target?: number | null
          position_suitability?: Json | null
          power_rating_max?: number | null
          power_rating_min?: number | null
          secondary_sports_backgrounds?: string[] | null
          speed_rating_max?: number | null
          speed_rating_min?: number | null
          ten_yard_sprint_target?: number | null
          vertical_jump_target?: number | null
        }
        Relationships: []
      }
      position_requirements: {
        Row: {
          acceleration_importance: number | null
          agility_importance: number | null
          catching_importance: number | null
          common_training_focus: string[] | null
          created_at: string | null
          decision_making_importance: number | null
          elite_benchmarks: Json | null
          endurance_importance: number | null
          evasion_importance: number | null
          field_vision_importance: number | null
          flag_pulling_importance: number | null
          id: number
          key_techniques: string[] | null
          leadership_importance: number | null
          position_name: string
          power_importance: number | null
          reaction_time_importance: number | null
          route_running_importance: number | null
          speed_importance: number | null
        }
        Insert: {
          acceleration_importance?: number | null
          agility_importance?: number | null
          catching_importance?: number | null
          common_training_focus?: string[] | null
          created_at?: string | null
          decision_making_importance?: number | null
          elite_benchmarks?: Json | null
          endurance_importance?: number | null
          evasion_importance?: number | null
          field_vision_importance?: number | null
          flag_pulling_importance?: number | null
          id?: number
          key_techniques?: string[] | null
          leadership_importance?: number | null
          position_name: string
          power_importance?: number | null
          reaction_time_importance?: number | null
          route_running_importance?: number | null
          speed_importance?: number | null
        }
        Update: {
          acceleration_importance?: number | null
          agility_importance?: number | null
          catching_importance?: number | null
          common_training_focus?: string[] | null
          created_at?: string | null
          decision_making_importance?: number | null
          elite_benchmarks?: Json | null
          endurance_importance?: number | null
          evasion_importance?: number | null
          field_vision_importance?: number | null
          flag_pulling_importance?: number | null
          id?: number
          key_techniques?: string[] | null
          leadership_importance?: number | null
          position_name?: string
          power_importance?: number | null
          reaction_time_importance?: number | null
          route_running_importance?: number | null
          speed_importance?: number | null
        }
        Relationships: []
      }
      premium_brand_analysis: {
        Row: {
          amateur_accessibility: number | null
          brand_category: string
          brand_name: string
          brand_website: string | null
          created_at: string | null
          id: number
          notes: string | null
          price_positioning: string
          quality_rating: number | null
          target_market: string
        }
        Insert: {
          amateur_accessibility?: number | null
          brand_category: string
          brand_name: string
          brand_website?: string | null
          created_at?: string | null
          id?: number
          notes?: string | null
          price_positioning: string
          quality_rating?: number | null
          target_market: string
        }
        Update: {
          amateur_accessibility?: number | null
          brand_category?: string
          brand_name?: string
          brand_website?: string | null
          created_at?: string | null
          id?: number
          notes?: string | null
          price_positioning?: string
          quality_rating?: number | null
          target_market?: string
        }
        Relationships: []
      }
      premium_product_alternatives: {
        Row: {
          affordable_alternative_name: string
          affordable_alternative_price_euros: number
          alternative_notes: string | null
          alternative_source: string | null
          cost_savings_euros: number
          created_at: string | null
          effectiveness_comparison: number
          id: number
          premium_brand_id: number | null
          premium_product_features: string[] | null
          premium_product_name: string
          premium_product_price_euros: number
        }
        Insert: {
          affordable_alternative_name: string
          affordable_alternative_price_euros: number
          alternative_notes?: string | null
          alternative_source?: string | null
          cost_savings_euros: number
          created_at?: string | null
          effectiveness_comparison: number
          id?: number
          premium_brand_id?: number | null
          premium_product_features?: string[] | null
          premium_product_name: string
          premium_product_price_euros: number
        }
        Update: {
          affordable_alternative_name?: string
          affordable_alternative_price_euros?: number
          alternative_notes?: string | null
          alternative_source?: string | null
          cost_savings_euros?: number
          created_at?: string | null
          effectiveness_comparison?: number
          id?: number
          premium_brand_id?: number | null
          premium_product_features?: string[] | null
          premium_product_name?: string
          premium_product_price_euros?: number
        }
        Relationships: []
      }
      readiness_scores: {
        Row: {
          acute_load: number | null
          acwr: number | null
          athlete_id: string
          chronic_load: number | null
          created_at: string | null
          day: string
          level: string
          proximity_score: number | null
          score: number
          sleep_score: number | null
          suggestion: string
          updated_at: string | null
          wellness_score: number | null
          workload_score: number | null
        }
        Insert: {
          acute_load?: number | null
          acwr?: number | null
          athlete_id: string
          chronic_load?: number | null
          created_at?: string | null
          day: string
          level: string
          proximity_score?: number | null
          score: number
          sleep_score?: number | null
          suggestion: string
          updated_at?: string | null
          wellness_score?: number | null
          workload_score?: number | null
        }
        Update: {
          acute_load?: number | null
          acwr?: number | null
          athlete_id?: string
          chronic_load?: number | null
          created_at?: string | null
          day?: string
          level?: string
          proximity_score?: number | null
          score?: number
          sleep_score?: number | null
          suggestion?: string
          updated_at?: string | null
          wellness_score?: number | null
          workload_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "readiness_scores_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      realistic_budget_categories: {
        Row: {
          category_description: string
          category_name: string
          created_at: string | null
          diy_alternatives: string[] | null
          expected_roi_percentage: number | null
          id: number
          local_resource_options: string[] | null
          max_spend_euros: number
          min_spend_euros: number
          priority_level: string | null
          why_it_matters: string
        }
        Insert: {
          category_description: string
          category_name: string
          created_at?: string | null
          diy_alternatives?: string[] | null
          expected_roi_percentage?: number | null
          id?: number
          local_resource_options?: string[] | null
          max_spend_euros: number
          min_spend_euros: number
          priority_level?: string | null
          why_it_matters: string
        }
        Update: {
          category_description?: string
          category_name?: string
          created_at?: string | null
          diy_alternatives?: string[] | null
          expected_roi_percentage?: number | null
          id?: number
          local_resource_options?: string[] | null
          max_spend_euros?: number
          min_spend_euros?: number
          priority_level?: string | null
          why_it_matters?: string
        }
        Relationships: []
      }
      realistic_performance_plans: {
        Row: {
          budget_tier: string
          core_components: string[]
          cost_breakdown: Json | null
          created_at: string | null
          diy_protocols_included: string[] | null
          equipment_requirements: string[] | null
          expected_outcomes: string[]
          id: number
          local_resource_needs: string[] | null
          plan_description: string
          plan_name: string
          target_athlete_profile: string
          timeline_weeks: number
          total_budget_euros: number
        }
        Insert: {
          budget_tier: string
          core_components: string[]
          cost_breakdown?: Json | null
          created_at?: string | null
          diy_protocols_included?: string[] | null
          equipment_requirements?: string[] | null
          expected_outcomes: string[]
          id?: number
          local_resource_needs?: string[] | null
          plan_description: string
          plan_name: string
          target_athlete_profile: string
          timeline_weeks: number
          total_budget_euros: number
        }
        Update: {
          budget_tier?: string
          core_components?: string[]
          cost_breakdown?: Json | null
          created_at?: string | null
          diy_protocols_included?: string[] | null
          equipment_requirements?: string[] | null
          expected_outcomes?: string[]
          id?: number
          local_resource_needs?: string[] | null
          plan_description?: string
          plan_name?: string
          target_athlete_profile?: string
          timeline_weeks?: number
          total_budget_euros?: number
        }
        Relationships: []
      }
      sleep_guidelines: {
        Row: {
          citation_authors: string[] | null
          citation_doi: string | null
          citation_id: string | null
          citation_journal: string | null
          citation_title: string | null
          citation_year: number | null
          contraindications: string[] | null
          created_at: string | null
          evidence_level: string
          expected_benefits: string[] | null
          id: number
          implementation_steps: string[] | null
          recommendation: string
          sleep_phase: string | null
          target_age_group: string | null
          target_athlete_type: string | null
          target_position: string | null
        }
        Insert: {
          citation_authors?: string[] | null
          citation_doi?: string | null
          citation_id?: string | null
          citation_journal?: string | null
          citation_title?: string | null
          citation_year?: number | null
          contraindications?: string[] | null
          created_at?: string | null
          evidence_level: string
          expected_benefits?: string[] | null
          id?: number
          implementation_steps?: string[] | null
          recommendation: string
          sleep_phase?: string | null
          target_age_group?: string | null
          target_athlete_type?: string | null
          target_position?: string | null
        }
        Update: {
          citation_authors?: string[] | null
          citation_doi?: string | null
          citation_id?: string | null
          citation_journal?: string | null
          citation_title?: string | null
          citation_year?: number | null
          contraindications?: string[] | null
          created_at?: string | null
          evidence_level?: string
          expected_benefits?: string[] | null
          id?: number
          implementation_steps?: string[] | null
          recommendation?: string
          sleep_phase?: string | null
          target_age_group?: string | null
          target_athlete_type?: string | null
          target_position?: string | null
        }
        Relationships: []
      }
      sleep_optimization_protocols: {
        Row: {
          air_quality_factors: string[] | null
          alcohol_recommendations: string | null
          bedding_recommendations: string[] | null
          bedroom_temperature_celsius: number | null
          caffeine_cutoff_hours: number | null
          cognitive_performance_benefits: string[] | null
          competition_sleep_preparation: string[] | null
          created_at: string | null
          deep_sleep_target_percentage: number | null
          electronic_device_cutoff_hours: number | null
          id: number
          immune_function_benefits: string[] | null
          injury_risk_reduction_percentage: number | null
          light_exposure_guidelines: string[] | null
          noise_management: string[] | null
          performance_improvement_with_optimization: number | null
          pre_sleep_nutrition_guidelines: string[] | null
          pre_sleep_routine_duration_minutes: number | null
          recommended_sleep_duration_hours: number | null
          recommended_tracking_metrics: string[] | null
          recovery_protocol_id: number | null
          rem_sleep_target_percentage: number | null
          room_darkness_requirements: string | null
          sleep_efficiency_target_percentage: number | null
          sleep_promoting_supplements: string[] | null
          supplements_to_avoid: string[] | null
          tracking_devices: string[] | null
          training_camp_sleep_optimization: string[] | null
          travel_sleep_strategies: string[] | null
        }
        Insert: {
          air_quality_factors?: string[] | null
          alcohol_recommendations?: string | null
          bedding_recommendations?: string[] | null
          bedroom_temperature_celsius?: number | null
          caffeine_cutoff_hours?: number | null
          cognitive_performance_benefits?: string[] | null
          competition_sleep_preparation?: string[] | null
          created_at?: string | null
          deep_sleep_target_percentage?: number | null
          electronic_device_cutoff_hours?: number | null
          id?: number
          immune_function_benefits?: string[] | null
          injury_risk_reduction_percentage?: number | null
          light_exposure_guidelines?: string[] | null
          noise_management?: string[] | null
          performance_improvement_with_optimization?: number | null
          pre_sleep_nutrition_guidelines?: string[] | null
          pre_sleep_routine_duration_minutes?: number | null
          recommended_sleep_duration_hours?: number | null
          recommended_tracking_metrics?: string[] | null
          recovery_protocol_id?: number | null
          rem_sleep_target_percentage?: number | null
          room_darkness_requirements?: string | null
          sleep_efficiency_target_percentage?: number | null
          sleep_promoting_supplements?: string[] | null
          supplements_to_avoid?: string[] | null
          tracking_devices?: string[] | null
          training_camp_sleep_optimization?: string[] | null
          travel_sleep_strategies?: string[] | null
        }
        Update: {
          air_quality_factors?: string[] | null
          alcohol_recommendations?: string | null
          bedding_recommendations?: string[] | null
          bedroom_temperature_celsius?: number | null
          caffeine_cutoff_hours?: number | null
          cognitive_performance_benefits?: string[] | null
          competition_sleep_preparation?: string[] | null
          created_at?: string | null
          deep_sleep_target_percentage?: number | null
          electronic_device_cutoff_hours?: number | null
          id?: number
          immune_function_benefits?: string[] | null
          injury_risk_reduction_percentage?: number | null
          light_exposure_guidelines?: string[] | null
          noise_management?: string[] | null
          performance_improvement_with_optimization?: number | null
          pre_sleep_nutrition_guidelines?: string[] | null
          pre_sleep_routine_duration_minutes?: number | null
          recommended_sleep_duration_hours?: number | null
          recommended_tracking_metrics?: string[] | null
          recovery_protocol_id?: number | null
          rem_sleep_target_percentage?: number | null
          room_darkness_requirements?: string | null
          sleep_efficiency_target_percentage?: number | null
          sleep_promoting_supplements?: string[] | null
          supplements_to_avoid?: string[] | null
          tracking_devices?: string[] | null
          training_camp_sleep_optimization?: string[] | null
          travel_sleep_strategies?: string[] | null
        }
        Relationships: []
      }
      sponsor_products: {
        Row: {
          category: string | null
          created_at: string | null
          id: number
          is_featured: boolean | null
          points_cost: number
          product_name: string
          relevance_score: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: number
          is_featured?: boolean | null
          points_cost: number
          product_name: string
          relevance_score?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: number
          is_featured?: boolean | null
          points_cost?: number
          product_name?: string
          relevance_score?: number | null
        }
        Relationships: []
      }
      sponsor_rewards: {
        Row: {
          available_points: number | null
          created_at: string | null
          current_tier: string | null
          id: number
          products_available: number | null
          tier_progress_percentage: number | null
          user_id: string
        }
        Insert: {
          available_points?: number | null
          created_at?: string | null
          current_tier?: string | null
          id?: number
          products_available?: number | null
          tier_progress_percentage?: number | null
          user_id: string
        }
        Update: {
          available_points?: number | null
          created_at?: string | null
          current_tier?: string | null
          id?: number
          products_available?: number | null
          tier_progress_percentage?: number | null
          user_id?: string
        }
        Relationships: []
      }
      sports_crossover_analysis: {
        Row: {
          agility_transfer: number | null
          common_weaknesses_to_address: string[] | null
          created_at: string | null
          id: number
          optimal_positions: string[] | null
          overall_transfer_rating: number | null
          professional_examples: string[] | null
          recommended_training_emphasis: string[] | null
          research_evidence: string | null
          secondary_positions: string[] | null
          skills_requiring_development: string[] | null
          source_sport: string
          speed_transfer: number | null
          tactical_transfer: number | null
          technical_transfer: number | null
          transferable_skills: string[] | null
        }
        Insert: {
          agility_transfer?: number | null
          common_weaknesses_to_address?: string[] | null
          created_at?: string | null
          id?: number
          optimal_positions?: string[] | null
          overall_transfer_rating?: number | null
          professional_examples?: string[] | null
          recommended_training_emphasis?: string[] | null
          research_evidence?: string | null
          secondary_positions?: string[] | null
          skills_requiring_development?: string[] | null
          source_sport: string
          speed_transfer?: number | null
          tactical_transfer?: number | null
          technical_transfer?: number | null
          transferable_skills?: string[] | null
        }
        Update: {
          agility_transfer?: number | null
          common_weaknesses_to_address?: string[] | null
          created_at?: string | null
          id?: number
          optimal_positions?: string[] | null
          overall_transfer_rating?: number | null
          professional_examples?: string[] | null
          recommended_training_emphasis?: string[] | null
          research_evidence?: string | null
          secondary_positions?: string[] | null
          skills_requiring_development?: string[] | null
          source_sport?: string
          speed_transfer?: number | null
          tactical_transfer?: number | null
          technical_transfer?: number | null
          transferable_skills?: string[] | null
        }
        Relationships: []
      }
      sprint_recovery_protocols: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          effectiveness_percentage: number | null
          id: number
          instructions: string | null
          name: string
          recommended_timing: string | null
          recovery_type: string | null
          temperature_fahrenheit: number | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          effectiveness_percentage?: number | null
          id?: number
          instructions?: string | null
          name: string
          recommended_timing?: string | null
          recovery_type?: string | null
          temperature_fahrenheit?: number | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          effectiveness_percentage?: number | null
          id?: number
          instructions?: string | null
          name?: string
          recommended_timing?: string | null
          recovery_type?: string | null
          temperature_fahrenheit?: number | null
        }
        Relationships: []
      }
      sprint_training_categories: {
        Row: {
          category_type: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          elite_method_origin: string | null
          equipment_needed: string[] | null
          id: number
          name: string
        }
        Insert: {
          category_type?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          elite_method_origin?: string | null
          equipment_needed?: string[] | null
          id?: number
          name: string
        }
        Update: {
          category_type?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          elite_method_origin?: string | null
          equipment_needed?: string[] | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      sprint_training_phases: {
        Row: {
          created_at: string | null
          description: string | null
          duration_weeks: number | null
          id: number
          intensity_focus: string | null
          name: string
          volume_percentage: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: number
          intensity_focus?: string | null
          name: string
          volume_percentage?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: number
          intensity_focus?: string | null
          name?: string
          volume_percentage?: number | null
        }
        Relationships: []
      }
      sprint_workouts: {
        Row: {
          category_id: number | null
          coaching_cues: string[] | null
          created_at: string | null
          distance_yards: number | null
          elite_application_notes: string | null
          gradient_percentage: number | null
          id: number
          intensity_percentage: number | null
          name: string
          phase_id: number | null
          recovery_between_sets_seconds: number | null
          reps_per_set: number | null
          rest_duration_seconds: number | null
          sets: number | null
          surface_type: string | null
        }
        Insert: {
          category_id?: number | null
          coaching_cues?: string[] | null
          created_at?: string | null
          distance_yards?: number | null
          elite_application_notes?: string | null
          gradient_percentage?: number | null
          id?: number
          intensity_percentage?: number | null
          name: string
          phase_id?: number | null
          recovery_between_sets_seconds?: number | null
          reps_per_set?: number | null
          rest_duration_seconds?: number | null
          sets?: number | null
          surface_type?: string | null
        }
        Update: {
          category_id?: number | null
          coaching_cues?: string[] | null
          created_at?: string | null
          distance_yards?: number | null
          elite_application_notes?: string | null
          gradient_percentage?: number | null
          id?: number
          intensity_percentage?: number | null
          name?: string
          phase_id?: number | null
          recovery_between_sets_seconds?: number | null
          reps_per_set?: number | null
          rest_duration_seconds?: number | null
          sets?: number | null
          surface_type?: string | null
        }
        Relationships: []
      }
      success_indicators: {
        Row: {
          baseline_value: number | null
          created_at: string | null
          current_value: number | null
          id: number
          improvement_target_percentage: number | null
          indicator_description: string
          indicator_domain: string
          indicator_name: string
          indicator_status: string | null
          measurement_frequency: string
          measurement_tool: string
          priority_level: string | null
          target_unit: string | null
          target_value: number | null
          updated_at: string | null
          verification_method: string
        }
        Insert: {
          baseline_value?: number | null
          created_at?: string | null
          current_value?: number | null
          id?: number
          improvement_target_percentage?: number | null
          indicator_description: string
          indicator_domain: string
          indicator_name: string
          indicator_status?: string | null
          measurement_frequency: string
          measurement_tool: string
          priority_level?: string | null
          target_unit?: string | null
          target_value?: number | null
          updated_at?: string | null
          verification_method: string
        }
        Update: {
          baseline_value?: number | null
          created_at?: string | null
          current_value?: number | null
          id?: number
          improvement_target_percentage?: number | null
          indicator_description?: string
          indicator_domain?: string
          indicator_name?: string
          indicator_status?: string | null
          measurement_frequency?: string
          measurement_tool?: string
          priority_level?: string | null
          target_unit?: string | null
          target_value?: number | null
          updated_at?: string | null
          verification_method?: string
        }
        Relationships: []
      }
      supplement_evidence_grades: {
        Row: {
          consistency_score: number | null
          created_at: string | null
          evidence_grade: string
          final_grade_justification: string | null
          flag_football_specific_score: number | null
          grade_calculation_date: string
          grade_reviewer: string | null
          high_quality_studies: number
          id: number
          negative_outcome_studies: number
          neutral_outcome_studies: number
          next_review_date: string | null
          overall_effect_size: number | null
          population_relevance_score: number | null
          positive_outcome_studies: number
          publication_bias_assessment: string | null
          sample_size_adequacy: string | null
          study_duration_adequacy: string | null
          supplement_id: number
          total_studies: number
        }
        Insert: {
          consistency_score?: number | null
          created_at?: string | null
          evidence_grade: string
          final_grade_justification?: string | null
          flag_football_specific_score?: number | null
          grade_calculation_date: string
          grade_reviewer?: string | null
          high_quality_studies: number
          id?: number
          negative_outcome_studies: number
          neutral_outcome_studies: number
          next_review_date?: string | null
          overall_effect_size?: number | null
          population_relevance_score?: number | null
          positive_outcome_studies: number
          publication_bias_assessment?: string | null
          sample_size_adequacy?: string | null
          study_duration_adequacy?: string | null
          supplement_id: number
          total_studies: number
        }
        Update: {
          consistency_score?: number | null
          created_at?: string | null
          evidence_grade?: string
          final_grade_justification?: string | null
          flag_football_specific_score?: number | null
          grade_calculation_date?: string
          grade_reviewer?: string | null
          high_quality_studies?: number
          id?: number
          negative_outcome_studies?: number
          neutral_outcome_studies?: number
          next_review_date?: string | null
          overall_effect_size?: number | null
          population_relevance_score?: number | null
          positive_outcome_studies?: number
          publication_bias_assessment?: string | null
          sample_size_adequacy?: string | null
          study_duration_adequacy?: string | null
          supplement_id?: number
          total_studies?: number
        }
        Relationships: []
      }
      supplement_interactions: {
        Row: {
          citation_references: string[] | null
          clinical_evidence: string | null
          contraindications: string[] | null
          created_at: string | null
          evidence_level: string | null
          id: number
          interaction_severity: string
          interaction_type: string
          mechanism_of_interaction: string | null
          monitoring_requirements: string[] | null
          recommendations: string[] | null
          supplement1_id: number
          supplement2_id: number
        }
        Insert: {
          citation_references?: string[] | null
          clinical_evidence?: string | null
          contraindications?: string[] | null
          created_at?: string | null
          evidence_level?: string | null
          id?: number
          interaction_severity: string
          interaction_type: string
          mechanism_of_interaction?: string | null
          monitoring_requirements?: string[] | null
          recommendations?: string[] | null
          supplement1_id: number
          supplement2_id: number
        }
        Update: {
          citation_references?: string[] | null
          clinical_evidence?: string | null
          contraindications?: string[] | null
          created_at?: string | null
          evidence_level?: string | null
          id?: number
          interaction_severity?: string
          interaction_type?: string
          mechanism_of_interaction?: string | null
          monitoring_requirements?: string[] | null
          recommendations?: string[] | null
          supplement1_id?: number
          supplement2_id?: number
        }
        Relationships: []
      }
      supplement_protocols: {
        Row: {
          administration_method: string | null
          break_duration_weeks: number | null
          contraindications: string[] | null
          created_at: string | null
          cycle_duration_weeks: number | null
          dosing_frequency: string
          drug_interactions: string[] | null
          evidence_strength: string | null
          expected_benefits: string[] | null
          expected_timeline_weeks: number | null
          goal: string
          id: number
          loading_phase_days: number | null
          maintenance_phase_days: number | null
          monitoring_parameters: string[] | null
          recommended_dose_mg_per_day: number | null
          recommended_dose_mg_per_kg: number | null
          risk_assessment_score: number | null
          safety_flags: string[] | null
          success_metrics: string[] | null
          supplement_id: number
          timing_relative_to_exercise: string | null
          updated_at: string | null
          user_id: string
          wada_compliance_status: string | null
        }
        Insert: {
          administration_method?: string | null
          break_duration_weeks?: number | null
          contraindications?: string[] | null
          created_at?: string | null
          cycle_duration_weeks?: number | null
          dosing_frequency: string
          drug_interactions?: string[] | null
          evidence_strength?: string | null
          expected_benefits?: string[] | null
          expected_timeline_weeks?: number | null
          goal: string
          id?: number
          loading_phase_days?: number | null
          maintenance_phase_days?: number | null
          monitoring_parameters?: string[] | null
          recommended_dose_mg_per_day?: number | null
          recommended_dose_mg_per_kg?: number | null
          risk_assessment_score?: number | null
          safety_flags?: string[] | null
          success_metrics?: string[] | null
          supplement_id: number
          timing_relative_to_exercise?: string | null
          updated_at?: string | null
          user_id: string
          wada_compliance_status?: string | null
        }
        Update: {
          administration_method?: string | null
          break_duration_weeks?: number | null
          contraindications?: string[] | null
          created_at?: string | null
          cycle_duration_weeks?: number | null
          dosing_frequency?: string
          drug_interactions?: string[] | null
          evidence_strength?: string | null
          expected_benefits?: string[] | null
          expected_timeline_weeks?: number | null
          goal?: string
          id?: number
          loading_phase_days?: number | null
          maintenance_phase_days?: number | null
          monitoring_parameters?: string[] | null
          recommended_dose_mg_per_day?: number | null
          recommended_dose_mg_per_kg?: number | null
          risk_assessment_score?: number | null
          safety_flags?: string[] | null
          success_metrics?: string[] | null
          supplement_id?: number
          timing_relative_to_exercise?: string | null
          updated_at?: string | null
          user_id?: string
          wada_compliance_status?: string | null
        }
        Relationships: []
      }
      supplement_research: {
        Row: {
          adverse_events: string[] | null
          authors: string[]
          clinical_significance: string | null
          confidence_interval_lower: number | null
          confidence_interval_upper: number | null
          created_at: string | null
          doi: string | null
          dose_studied_mg_per_day: number | null
          dose_studied_mg_per_kg: number | null
          dosing_frequency: string | null
          dropout_rate: number | null
          effect_size: number | null
          evidence_level: string | null
          flag_football_relevance: string | null
          id: number
          journal: string | null
          limitations: string[] | null
          loading_phase_days: number | null
          maintenance_phase_days: number | null
          outcome_measures: string[]
          p_value: number | null
          pmid: number | null
          population_description: string
          position_specific_benefits: string[] | null
          practical_applications: string[] | null
          primary_outcome: string
          publication_year: number | null
          risk_of_bias: string[] | null
          sample_size: number | null
          statistical_significance: boolean | null
          study_duration_weeks: number | null
          study_quality_score: number | null
          study_reference: string
          study_title: string
          supplement_id: number | null
        }
        Insert: {
          adverse_events?: string[] | null
          authors: string[]
          clinical_significance?: string | null
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          created_at?: string | null
          doi?: string | null
          dose_studied_mg_per_day?: number | null
          dose_studied_mg_per_kg?: number | null
          dosing_frequency?: string | null
          dropout_rate?: number | null
          effect_size?: number | null
          evidence_level?: string | null
          flag_football_relevance?: string | null
          id?: number
          journal?: string | null
          limitations?: string[] | null
          loading_phase_days?: number | null
          maintenance_phase_days?: number | null
          outcome_measures: string[]
          p_value?: number | null
          pmid?: number | null
          population_description: string
          position_specific_benefits?: string[] | null
          practical_applications?: string[] | null
          primary_outcome: string
          publication_year?: number | null
          risk_of_bias?: string[] | null
          sample_size?: number | null
          statistical_significance?: boolean | null
          study_duration_weeks?: number | null
          study_quality_score?: number | null
          study_reference: string
          study_title: string
          supplement_id?: number | null
        }
        Update: {
          adverse_events?: string[] | null
          authors?: string[]
          clinical_significance?: string | null
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          created_at?: string | null
          doi?: string | null
          dose_studied_mg_per_day?: number | null
          dose_studied_mg_per_kg?: number | null
          dosing_frequency?: string | null
          dropout_rate?: number | null
          effect_size?: number | null
          evidence_level?: string | null
          flag_football_relevance?: string | null
          id?: number
          journal?: string | null
          limitations?: string[] | null
          loading_phase_days?: number | null
          maintenance_phase_days?: number | null
          outcome_measures?: string[]
          p_value?: number | null
          pmid?: number | null
          population_description?: string
          position_specific_benefits?: string[] | null
          practical_applications?: string[] | null
          primary_outcome?: string
          publication_year?: number | null
          risk_of_bias?: string[] | null
          sample_size?: number | null
          statistical_significance?: boolean | null
          study_duration_weeks?: number | null
          study_quality_score?: number | null
          study_reference?: string
          study_title?: string
          supplement_id?: number | null
        }
        Relationships: []
      }
      supplement_wada_compliance: {
        Row: {
          banned_substances_detected: string[] | null
          brand: string | null
          compliance_notes: string | null
          contamination_risk_percentage: number | null
          created_at: string | null
          flag_football_safe: boolean | null
          id: number
          last_test_date: string | null
          recommended_for_position: string[] | null
          risk_mitigation_strategies: string[] | null
          supplement_name: string
          test_result: string | null
          testing_frequency: string | null
          testing_organization: string | null
          third_party_tested: boolean | null
          updated_at: string | null
          usage_guidelines: string | null
          wada_status: string | null
        }
        Insert: {
          banned_substances_detected?: string[] | null
          brand?: string | null
          compliance_notes?: string | null
          contamination_risk_percentage?: number | null
          created_at?: string | null
          flag_football_safe?: boolean | null
          id?: number
          last_test_date?: string | null
          recommended_for_position?: string[] | null
          risk_mitigation_strategies?: string[] | null
          supplement_name: string
          test_result?: string | null
          testing_frequency?: string | null
          testing_organization?: string | null
          third_party_tested?: boolean | null
          updated_at?: string | null
          usage_guidelines?: string | null
          wada_status?: string | null
        }
        Update: {
          banned_substances_detected?: string[] | null
          brand?: string | null
          compliance_notes?: string | null
          contamination_risk_percentage?: number | null
          created_at?: string | null
          flag_football_safe?: boolean | null
          id?: number
          last_test_date?: string | null
          recommended_for_position?: string[] | null
          risk_mitigation_strategies?: string[] | null
          supplement_name?: string
          test_result?: string | null
          testing_frequency?: string | null
          testing_organization?: string | null
          third_party_tested?: boolean | null
          updated_at?: string | null
          usage_guidelines?: string | null
          wada_status?: string | null
        }
        Relationships: []
      }
      supplements: {
        Row: {
          active_ingredients: Json | null
          banned_substance_risk: string | null
          brand: string | null
          category: string | null
          contraindications: string[] | null
          cost_per_serving: number | null
          created_at: string | null
          drug_interactions: string[] | null
          duration_of_use: string | null
          evidence_level: string | null
          food_interactions: string[] | null
          id: number
          key_studies: string[] | null
          name: string
          performance_benefits: string[] | null
          recommended_dosage: string | null
          recommended_timing: string | null
          research_summary: string | null
          safety_rating: string | null
          serving_size: string | null
          servings_per_container: number | null
          side_effects: string[] | null
          subcategory: string | null
          third_party_tested: boolean | null
          updated_at: string | null
        }
        Insert: {
          active_ingredients?: Json | null
          banned_substance_risk?: string | null
          brand?: string | null
          category?: string | null
          contraindications?: string[] | null
          cost_per_serving?: number | null
          created_at?: string | null
          drug_interactions?: string[] | null
          duration_of_use?: string | null
          evidence_level?: string | null
          food_interactions?: string[] | null
          id?: number
          key_studies?: string[] | null
          name: string
          performance_benefits?: string[] | null
          recommended_dosage?: string | null
          recommended_timing?: string | null
          research_summary?: string | null
          safety_rating?: string | null
          serving_size?: string | null
          servings_per_container?: number | null
          side_effects?: string[] | null
          subcategory?: string | null
          third_party_tested?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active_ingredients?: Json | null
          banned_substance_risk?: string | null
          brand?: string | null
          category?: string | null
          contraindications?: string[] | null
          cost_per_serving?: number | null
          created_at?: string | null
          drug_interactions?: string[] | null
          duration_of_use?: string | null
          evidence_level?: string | null
          food_interactions?: string[] | null
          id?: number
          key_studies?: string[] | null
          name?: string
          performance_benefits?: string[] | null
          recommended_dosage?: string | null
          recommended_timing?: string | null
          research_summary?: string | null
          safety_rating?: string | null
          serving_size?: string | null
          servings_per_container?: number | null
          side_effects?: string[] | null
          subcategory?: string | null
          third_party_tested?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_chemistry: {
        Row: {
          cohesion_score: number | null
          communication_score: number | null
          created_at: string | null
          id: number
          intervention_effectiveness: number | null
          last_intervention: string | null
          leadership_score: number | null
          overall_chemistry: number | null
          trust_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cohesion_score?: number | null
          communication_score?: number | null
          created_at?: string | null
          id?: number
          intervention_effectiveness?: number | null
          last_intervention?: string | null
          leadership_score?: number | null
          overall_chemistry?: number | null
          trust_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cohesion_score?: number | null
          communication_score?: number | null
          created_at?: string | null
          id?: number
          intervention_effectiveness?: number | null
          last_intervention?: string | null
          leadership_score?: number | null
          overall_chemistry?: number | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_resources: {
        Row: {
          availability_status: string | null
          created_at: string | null
          current_utilization_percentage: number | null
          depreciation_years: number | null
          description: string
          expected_lifespan_years: number | null
          id: number
          insurance_coverage: Json | null
          location: string | null
          maintenance_schedule: string[] | null
          one_time_cost: number
          ownership_model: string
          per_athlete_share: number
          resource_category: string
          resource_name: string
          resource_type: string
          total_athletes_capacity: number
          updated_at: string | null
        }
        Insert: {
          availability_status?: string | null
          created_at?: string | null
          current_utilization_percentage?: number | null
          depreciation_years?: number | null
          description: string
          expected_lifespan_years?: number | null
          id?: number
          insurance_coverage?: Json | null
          location?: string | null
          maintenance_schedule?: string[] | null
          one_time_cost: number
          ownership_model: string
          per_athlete_share: number
          resource_category: string
          resource_name: string
          resource_type: string
          total_athletes_capacity: number
          updated_at?: string | null
        }
        Update: {
          availability_status?: string | null
          created_at?: string | null
          current_utilization_percentage?: number | null
          depreciation_years?: number | null
          description?: string
          expected_lifespan_years?: number | null
          id?: number
          insurance_coverage?: Json | null
          location?: string | null
          maintenance_schedule?: string[] | null
          one_time_cost?: number
          ownership_model?: string
          per_athlete_share?: number
          resource_category?: string
          resource_name?: string
          resource_type?: string
          total_athletes_capacity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          country_code: string | null
          created_at: string | null
          id: string
          name: string | null
          region: string | null
          team_type: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          region?: string | null
          team_type?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          region?: string | null
          team_type?: string | null
        }
        Relationships: []
      }
      training_analytics: {
        Row: {
          created_at: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          equipment_used: string[] | null
          exercises_completed: number | null
          goals_achieved: number | null
          id: number
          improvement_percentage: number | null
          location_type: string | null
          performance_score: number | null
          personal_best: boolean | null
          session_id: string | null
          training_type: string | null
          user_id: string
          weather_conditions: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          equipment_used?: string[] | null
          exercises_completed?: number | null
          goals_achieved?: number | null
          id?: number
          improvement_percentage?: number | null
          location_type?: string | null
          performance_score?: number | null
          personal_best?: boolean | null
          session_id?: string | null
          training_type?: string | null
          user_id: string
          weather_conditions?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          equipment_used?: string[] | null
          exercises_completed?: number | null
          goals_achieved?: number | null
          id?: number
          improvement_percentage?: number | null
          location_type?: string | null
          performance_score?: number | null
          personal_best?: boolean | null
          session_id?: string | null
          training_type?: string | null
          user_id?: string
          weather_conditions?: string | null
        }
        Relationships: []
      }
      training_hydration_protocols: {
        Row: {
          altitude_adjustment_factor: number | null
          cognitive_function_maintenance: boolean | null
          created_at: string | null
          during_training_hydration_ml_per_15min: number | null
          humidity_adjustment_factor: number | null
          id: number
          maintain_performance_threshold: number | null
          post_training_hydration_ml_per_kg: number | null
          potassium_replacement_mg_per_hour: number | null
          pre_training_hydration_ml_per_kg: number | null
          pre_training_timing_hours: number | null
          sodium_replacement_mg_per_hour: number | null
          temperature_adjustment_factor: number | null
          training_duration_minutes: number | null
          training_intensity: string | null
          training_type: string | null
        }
        Insert: {
          altitude_adjustment_factor?: number | null
          cognitive_function_maintenance?: boolean | null
          created_at?: string | null
          during_training_hydration_ml_per_15min?: number | null
          humidity_adjustment_factor?: number | null
          id?: number
          maintain_performance_threshold?: number | null
          post_training_hydration_ml_per_kg?: number | null
          potassium_replacement_mg_per_hour?: number | null
          pre_training_hydration_ml_per_kg?: number | null
          pre_training_timing_hours?: number | null
          sodium_replacement_mg_per_hour?: number | null
          temperature_adjustment_factor?: number | null
          training_duration_minutes?: number | null
          training_intensity?: string | null
          training_type?: string | null
        }
        Update: {
          altitude_adjustment_factor?: number | null
          cognitive_function_maintenance?: boolean | null
          created_at?: string | null
          during_training_hydration_ml_per_15min?: number | null
          humidity_adjustment_factor?: number | null
          id?: number
          maintain_performance_threshold?: number | null
          post_training_hydration_ml_per_kg?: number | null
          potassium_replacement_mg_per_hour?: number | null
          pre_training_hydration_ml_per_kg?: number | null
          pre_training_timing_hours?: number | null
          sodium_replacement_mg_per_hour?: number | null
          temperature_adjustment_factor?: number | null
          training_duration_minutes?: number | null
          training_intensity?: string | null
          training_type?: string | null
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          athlete_id: string
          created_at: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          notes: string | null
          rpe: number | null
          session_date: string
          start_time: string | null
          team_id: string | null
          training_type: string | null
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          rpe?: number | null
          session_date: string
          start_time?: string | null
          team_id?: string | null
          training_type?: string | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          rpe?: number | null
          session_date?: string
          start_time?: string | null
          team_id?: string | null
          training_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behavior: {
        Row: {
          bounce_rate: boolean | null
          browser: string | null
          conversion_events: string[] | null
          created_at: string | null
          device_type: string | null
          entry_page: string | null
          exit_page: string | null
          features_used: string[] | null
          funnel_stage: string | null
          goals_created: number | null
          id: number
          page_sequence: string[] | null
          session_duration: number | null
          session_id: string
          total_page_views: number | null
          training_sessions_completed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bounce_rate?: boolean | null
          browser?: string | null
          conversion_events?: string[] | null
          created_at?: string | null
          device_type?: string | null
          entry_page?: string | null
          exit_page?: string | null
          features_used?: string[] | null
          funnel_stage?: string | null
          goals_created?: number | null
          id?: number
          page_sequence?: string[] | null
          session_duration?: number | null
          session_id: string
          total_page_views?: number | null
          training_sessions_completed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bounce_rate?: boolean | null
          browser?: string | null
          conversion_events?: string[] | null
          created_at?: string | null
          device_type?: string | null
          entry_page?: string | null
          exit_page?: string | null
          features_used?: string[] | null
          funnel_stage?: string | null
          goals_created?: number | null
          id?: number
          page_sequence?: string[] | null
          session_duration?: number | null
          session_id?: string
          total_page_views?: number | null
          training_sessions_completed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_teams: {
        Row: {
          created_at: string | null
          role: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          role?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          bio: string | null
          birth_date: string | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          experience_level: string | null
          first_name: string
          full_name: string | null
          height_cm: number | null
          id: string
          is_active: boolean | null
          last_login: string | null
          last_name: string
          password_hash: string
          position: string | null
          profile_picture: string | null
          updated_at: string | null
          username: string | null
          verification_token: string | null
          verification_token_expires_at: string | null
          weight_kg: number | null
        }
        Insert: {
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          experience_level?: string | null
          first_name: string
          full_name?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name: string
          password_hash: string
          position?: string | null
          profile_picture?: string | null
          updated_at?: string | null
          username?: string | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          experience_level?: string | null
          first_name?: string
          full_name?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string
          password_hash?: string
          position?: string | null
          profile_picture?: string | null
          updated_at?: string | null
          username?: string | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      wada_prohibited_substances: {
        Row: {
          common_sources: string[] | null
          created_at: string | null
          cross_contamination_risk: boolean | null
          detection_window_days: number | null
          exceptions: string[] | null
          flag_football_relevance: string | null
          id: number
          position_specific_risks: string[] | null
          prohibited_status: string | null
          prohibition_end_date: string | null
          prohibition_reason: string | null
          prohibition_start_date: string | null
          risk_level: string | null
          substance_category: string | null
          substance_name: string
          updated_at: string | null
          wada_code: string | null
        }
        Insert: {
          common_sources?: string[] | null
          created_at?: string | null
          cross_contamination_risk?: boolean | null
          detection_window_days?: number | null
          exceptions?: string[] | null
          flag_football_relevance?: string | null
          id?: number
          position_specific_risks?: string[] | null
          prohibited_status?: string | null
          prohibition_end_date?: string | null
          prohibition_reason?: string | null
          prohibition_start_date?: string | null
          risk_level?: string | null
          substance_category?: string | null
          substance_name: string
          updated_at?: string | null
          wada_code?: string | null
        }
        Update: {
          common_sources?: string[] | null
          created_at?: string | null
          cross_contamination_risk?: boolean | null
          detection_window_days?: number | null
          exceptions?: string[] | null
          flag_football_relevance?: string | null
          id?: number
          position_specific_risks?: string[] | null
          prohibited_status?: string | null
          prohibition_end_date?: string | null
          prohibition_reason?: string | null
          prohibition_start_date?: string | null
          risk_level?: string | null
          substance_category?: string | null
          substance_name?: string
          updated_at?: string | null
          wada_code?: string | null
        }
        Relationships: []
      }
      wearables_data: {
        Row: {
          connection_status: string | null
          created_at: string | null
          device_type: string | null
          heart_rate: number | null
          hrv: number | null
          id: number
          last_sync: string | null
          sleep_score: number | null
          training_load: number | null
          user_id: string
        }
        Insert: {
          connection_status?: string | null
          created_at?: string | null
          device_type?: string | null
          heart_rate?: number | null
          hrv?: number | null
          id?: number
          last_sync?: string | null
          sleep_score?: number | null
          training_load?: number | null
          user_id: string
        }
        Update: {
          connection_status?: string | null
          created_at?: string | null
          device_type?: string | null
          heart_rate?: number | null
          hrv?: number | null
          id?: number
          last_sync?: string | null
          sleep_score?: number | null
          training_load?: number | null
          user_id?: string
        }
        Relationships: []
      }
      wellness_logs: {
        Row: {
          athlete_id: string
          created_at: string | null
          energy: number | null
          fatigue: number
          id: string
          log_date: string
          mood: number | null
          sleep_hours: number | null
          sleep_quality: number
          soreness: number
          stress: number | null
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          energy?: number | null
          fatigue: number
          id?: string
          log_date: string
          mood?: number | null
          sleep_hours?: number | null
          sleep_quality: number
          soreness: number
          stress?: number | null
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          energy?: number | null
          fatigue?: number
          id?: string
          log_date?: string
          mood?: number | null
          sleep_hours?: number | null
          sleep_quality?: number
          soreness?: number
          stress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wellness_logs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      world_championship_protocols: {
        Row: {
          altitude_challenges: string[] | null
          championship_year: number
          climate_variations_across_venues: string[] | null
          climate_zone: string | null
          created_at: string | null
          data_collection_protocols: string[] | null
          emergency_hydration_protocols: string[] | null
          host_country: string | null
          id: number
          long_term_follow_up_studies: boolean | null
          performance_correlation_studies: boolean | null
          personalized_hydration_plans: boolean | null
          qualification_process: string | null
          real_time_hydration_monitoring: boolean | null
          teams_participating: number | null
          tournament_format: string | null
          travel_impact_on_hydration: string[] | null
        }
        Insert: {
          altitude_challenges?: string[] | null
          championship_year: number
          climate_variations_across_venues?: string[] | null
          climate_zone?: string | null
          created_at?: string | null
          data_collection_protocols?: string[] | null
          emergency_hydration_protocols?: string[] | null
          host_country?: string | null
          id?: number
          long_term_follow_up_studies?: boolean | null
          performance_correlation_studies?: boolean | null
          personalized_hydration_plans?: boolean | null
          qualification_process?: string | null
          real_time_hydration_monitoring?: boolean | null
          teams_participating?: number | null
          tournament_format?: string | null
          travel_impact_on_hydration?: string[] | null
        }
        Update: {
          altitude_challenges?: string[] | null
          championship_year?: number
          climate_variations_across_venues?: string[] | null
          climate_zone?: string | null
          created_at?: string | null
          data_collection_protocols?: string[] | null
          emergency_hydration_protocols?: string[] | null
          host_country?: string | null
          id?: number
          long_term_follow_up_studies?: boolean | null
          performance_correlation_studies?: boolean | null
          personalized_hydration_plans?: boolean | null
          qualification_process?: string | null
          real_time_hydration_monitoring?: boolean | null
          teams_participating?: number | null
          tournament_format?: string | null
          travel_impact_on_hydration?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_chatbot_context: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string | null
          expertise_level: string | null
          id: string
          last_query_at: string | null
          preferred_topics: string[] | null
          primary_team_id: string | null
          team_type: string | null
          total_queries: number | null
          updated_at: string | null
          user_id: string
          user_role: string
        }
        SetofOptions: {
          from: "*"
          to: "chatbot_user_context"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_team_member:
        | { Args: { p_team: string; p_user: string }; Returns: boolean }
        | {
            Args: { p_roles: string[]; p_team_id: string; p_user_id: string }
            Returns: boolean
          }
      update_chatbot_query_stats: {
        Args: { p_topic?: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      absence_requests: {
        Row: {
          created_at: string;
          event_id: string | null;
          id: string;
          notify_when_reviewed: boolean | null;
          player_id: string;
          reason_category: string;
          reason_details: string | null;
          request_date: string | null;
          request_date_end: string | null;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string | null;
          team_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          event_id?: string | null;
          id?: string;
          notify_when_reviewed?: boolean | null;
          player_id: string;
          reason_category: string;
          reason_details?: string | null;
          request_date?: string | null;
          request_date_end?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
          team_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          event_id?: string | null;
          id?: string;
          notify_when_reviewed?: boolean | null;
          player_id?: string;
          reason_category?: string;
          reason_details?: string | null;
          request_date?: string | null;
          request_date_end?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string | null;
          team_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "absence_requests_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "team_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "absence_requests_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      athlete_nutrition_profiles: {
        Row: {
          activity_level: string | null;
          base_hydration_ml: number | null;
          bmr_kcal: number | null;
          body_fat_percentage: number | null;
          caffeine_tolerance: string | null;
          carbs_target_g: number | null;
          created_at: string | null;
          dietary_restrictions: string[] | null;
          fat_target_g: number | null;
          food_allergies: string[] | null;
          height_cm: number | null;
          id: string;
          lean_mass_kg: number | null;
          position: string | null;
          preferred_meal_count: number | null;
          primary_goal: string | null;
          protein_target_g: number | null;
          sweat_rate_ml_per_hour: number | null;
          target_weight_kg: number | null;
          tdee_kcal: number | null;
          training_days_per_week: number | null;
          updated_at: string | null;
          user_id: string;
          uses_creatine: boolean | null;
          weight_kg: number | null;
        };
        Insert: {
          activity_level?: string | null;
          base_hydration_ml?: number | null;
          bmr_kcal?: number | null;
          body_fat_percentage?: number | null;
          caffeine_tolerance?: string | null;
          carbs_target_g?: number | null;
          created_at?: string | null;
          dietary_restrictions?: string[] | null;
          fat_target_g?: number | null;
          food_allergies?: string[] | null;
          height_cm?: number | null;
          id?: string;
          lean_mass_kg?: number | null;
          position?: string | null;
          preferred_meal_count?: number | null;
          primary_goal?: string | null;
          protein_target_g?: number | null;
          sweat_rate_ml_per_hour?: number | null;
          target_weight_kg?: number | null;
          tdee_kcal?: number | null;
          training_days_per_week?: number | null;
          updated_at?: string | null;
          user_id: string;
          uses_creatine?: boolean | null;
          weight_kg?: number | null;
        };
        Update: {
          activity_level?: string | null;
          base_hydration_ml?: number | null;
          bmr_kcal?: number | null;
          body_fat_percentage?: number | null;
          caffeine_tolerance?: string | null;
          carbs_target_g?: number | null;
          created_at?: string | null;
          dietary_restrictions?: string[] | null;
          fat_target_g?: number | null;
          food_allergies?: string[] | null;
          height_cm?: number | null;
          id?: string;
          lean_mass_kg?: number | null;
          position?: string | null;
          preferred_meal_count?: number | null;
          primary_goal?: string | null;
          protein_target_g?: number | null;
          sweat_rate_ml_per_hour?: number | null;
          target_weight_kg?: number | null;
          tdee_kcal?: number | null;
          training_days_per_week?: number | null;
          updated_at?: string | null;
          user_id?: string;
          uses_creatine?: boolean | null;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      hydration_logs: {
        Row: {
          context: string | null;
          created_at: string | null;
          fluid_ml: number;
          fluid_type: string | null;
          id: string;
          log_date: string;
          log_time: string | null;
          notes: string | null;
          potassium_mg: number | null;
          sodium_mg: number | null;
          user_id: string;
        };
        Insert: {
          context?: string | null;
          created_at?: string | null;
          fluid_ml: number;
          fluid_type?: string | null;
          id?: string;
          log_date?: string;
          log_time?: string | null;
          notes?: string | null;
          potassium_mg?: number | null;
          sodium_mg?: number | null;
          user_id: string;
        };
        Update: {
          context?: string | null;
          created_at?: string | null;
          fluid_ml?: number;
          fluid_type?: string | null;
          id?: string;
          log_date?: string;
          log_time?: string | null;
          notes?: string | null;
          potassium_mg?: number | null;
          sodium_mg?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      meal_templates: {
        Row: {
          calories: number | null;
          carbs_g: number | null;
          cook_time_minutes: number | null;
          created_at: string | null;
          day_type: string | null;
          description: string | null;
          dietary_flags: string[] | null;
          fat_g: number | null;
          fiber_g: number | null;
          grains_portion: string | null;
          hours_after_game: number | null;
          hours_before_game: number | null;
          id: string;
          ingredients: Json | null;
          instructions: string[] | null;
          is_active: boolean | null;
          meal_type: string;
          prep_time_minutes: number | null;
          protein_g: number | null;
          protein_portion: string | null;
          source: string | null;
          tags: string[] | null;
          template_name: string;
          timing_description: string | null;
          updated_at: string | null;
          vegetables_portion: string | null;
        };
        Insert: {
          calories?: number | null;
          carbs_g?: number | null;
          cook_time_minutes?: number | null;
          created_at?: string | null;
          day_type?: string | null;
          description?: string | null;
          dietary_flags?: string[] | null;
          fat_g?: number | null;
          fiber_g?: number | null;
          grains_portion?: string | null;
          hours_after_game?: number | null;
          hours_before_game?: number | null;
          id?: string;
          ingredients?: Json | null;
          instructions?: string[] | null;
          is_active?: boolean | null;
          meal_type: string;
          prep_time_minutes?: number | null;
          protein_g?: number | null;
          protein_portion?: string | null;
          source?: string | null;
          tags?: string[] | null;
          template_name: string;
          timing_description?: string | null;
          updated_at?: string | null;
          vegetables_portion?: string | null;
        };
        Update: {
          calories?: number | null;
          carbs_g?: number | null;
          cook_time_minutes?: number | null;
          created_at?: string | null;
          day_type?: string | null;
          description?: string | null;
          dietary_flags?: string[] | null;
          fat_g?: number | null;
          fiber_g?: number | null;
          grains_portion?: string | null;
          hours_after_game?: number | null;
          hours_before_game?: number | null;
          id?: string;
          ingredients?: Json | null;
          instructions?: string[] | null;
          is_active?: boolean | null;
          meal_type?: string;
          prep_time_minutes?: number | null;
          protein_g?: number | null;
          protein_portion?: string | null;
          source?: string | null;
          tags?: string[] | null;
          template_name?: string;
          timing_description?: string | null;
          updated_at?: string | null;
          vegetables_portion?: string | null;
        };
        Relationships: [];
      };
      nutrition_goals: {
        Row: {
          calories_target: number | null;
          carbs_target: number | null;
          created_at: string | null;
          fat_target: number | null;
          id: string;
          protein_target: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          calories_target?: number | null;
          carbs_target?: number | null;
          created_at?: string | null;
          fat_target?: number | null;
          id?: string;
          protein_target?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          calories_target?: number | null;
          carbs_target?: number | null;
          created_at?: string | null;
          fat_target?: number | null;
          id?: string;
          protein_target?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      nutrition_logs: {
        Row: {
          calories: number | null;
          carbohydrates: number | null;
          created_at: string | null;
          fat: number | null;
          fiber: number | null;
          food_id: number | null;
          food_name: string;
          id: string;
          logged_at: string | null;
          meal_type: string | null;
          notes: string | null;
          protein: number | null;
          user_id: string;
        };
        Insert: {
          calories?: number | null;
          carbohydrates?: number | null;
          created_at?: string | null;
          fat?: number | null;
          fiber?: number | null;
          food_id?: number | null;
          food_name: string;
          id?: string;
          logged_at?: string | null;
          meal_type?: string | null;
          notes?: string | null;
          protein?: number | null;
          user_id: string;
        };
        Update: {
          calories?: number | null;
          carbohydrates?: number | null;
          created_at?: string | null;
          fat?: number | null;
          fiber?: number | null;
          food_id?: number | null;
          food_name?: string;
          id?: string;
          logged_at?: string | null;
          meal_type?: string | null;
          notes?: string | null;
          protein?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      nutrition_plans: {
        Row: {
          calories_target: number | null;
          carbs_g: number | null;
          created_at: string | null;
          day_type: string;
          description: string | null;
          during_training_carbs_g_per_hour: number | null;
          electrolyte_needed: boolean | null;
          fat_g: number | null;
          fiber_g: number | null;
          hydration_target_ml: number | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          plan_name: string;
          plate_grains_percent: number | null;
          plate_protein_percent: number | null;
          plate_vegetables_percent: number | null;
          post_training_carbs_g: number | null;
          post_training_protein_g: number | null;
          pre_training_carbs_g: number | null;
          pre_training_timing_hours: number | null;
          protein_g: number | null;
          source: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          calories_target?: number | null;
          carbs_g?: number | null;
          created_at?: string | null;
          day_type: string;
          description?: string | null;
          during_training_carbs_g_per_hour?: number | null;
          electrolyte_needed?: boolean | null;
          fat_g?: number | null;
          fiber_g?: number | null;
          hydration_target_ml?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          plan_name: string;
          plate_grains_percent?: number | null;
          plate_protein_percent?: number | null;
          plate_vegetables_percent?: number | null;
          post_training_carbs_g?: number | null;
          post_training_protein_g?: number | null;
          pre_training_carbs_g?: number | null;
          pre_training_timing_hours?: number | null;
          protein_g?: number | null;
          source?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          calories_target?: number | null;
          carbs_g?: number | null;
          created_at?: string | null;
          day_type?: string;
          description?: string | null;
          during_training_carbs_g_per_hour?: number | null;
          electrolyte_needed?: boolean | null;
          fat_g?: number | null;
          fiber_g?: number | null;
          hydration_target_ml?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          plan_name?: string;
          plate_grains_percent?: number | null;
          plate_protein_percent?: number | null;
          plate_vegetables_percent?: number | null;
          post_training_carbs_g?: number | null;
          post_training_protein_g?: number | null;
          pre_training_carbs_g?: number | null;
          pre_training_timing_hours?: number | null;
          protein_g?: number | null;
          source?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      supplement_calculations: {
        Row: {
          beta_alanine_daily_g: number | null;
          beta_alanine_per_dose_g: number | null;
          beta_alanine_split_doses: number | null;
          body_weight_kg: number;
          caffeine_cutoff_hours_before_sleep: number | null;
          caffeine_dose_mg_per_kg: number | null;
          caffeine_max_daily_mg: number | null;
          caffeine_timing_before_exercise_min: number | null;
          caffeine_total_mg: number | null;
          calculation_date: string;
          created_at: string | null;
          creatine_loading_days: number | null;
          creatine_loading_dose_g: number | null;
          creatine_maintenance_dose_g: number | null;
          id: string;
          notes: string | null;
          potassium_per_hour_mg: number | null;
          sodium_per_hour_mg: number | null;
          user_id: string;
        };
        Insert: {
          beta_alanine_daily_g?: number | null;
          beta_alanine_per_dose_g?: number | null;
          beta_alanine_split_doses?: number | null;
          body_weight_kg: number;
          caffeine_cutoff_hours_before_sleep?: number | null;
          caffeine_dose_mg_per_kg?: number | null;
          caffeine_max_daily_mg?: number | null;
          caffeine_timing_before_exercise_min?: number | null;
          caffeine_total_mg?: number | null;
          calculation_date?: string;
          created_at?: string | null;
          creatine_loading_days?: number | null;
          creatine_loading_dose_g?: number | null;
          creatine_maintenance_dose_g?: number | null;
          id?: string;
          notes?: string | null;
          potassium_per_hour_mg?: number | null;
          sodium_per_hour_mg?: number | null;
          user_id: string;
        };
        Update: {
          beta_alanine_daily_g?: number | null;
          beta_alanine_per_dose_g?: number | null;
          beta_alanine_split_doses?: number | null;
          body_weight_kg?: number;
          caffeine_cutoff_hours_before_sleep?: number | null;
          caffeine_dose_mg_per_kg?: number | null;
          caffeine_max_daily_mg?: number | null;
          caffeine_timing_before_exercise_min?: number | null;
          caffeine_total_mg?: number | null;
          calculation_date?: string;
          created_at?: string | null;
          creatine_loading_days?: number | null;
          creatine_loading_dose_g?: number | null;
          creatine_maintenance_dose_g?: number | null;
          id?: string;
          notes?: string | null;
          potassium_per_hour_mg?: number | null;
          sodium_per_hour_mg?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      supplement_logs: {
        Row: {
          created_at: string | null;
          date: string;
          dosage: string | null;
          id: string;
          notes: string | null;
          supplement_name: string;
          taken: boolean | null;
          time_of_day: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          date?: string;
          dosage?: string | null;
          id?: string;
          notes?: string | null;
          supplement_name: string;
          taken?: boolean | null;
          time_of_day?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          date?: string;
          dosage?: string | null;
          id?: string;
          notes?: string | null;
          supplement_name?: string;
          taken?: boolean | null;
          time_of_day?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      sweat_rate_assessments: {
        Row: {
          assessment_date: string;
          created_at: string | null;
          exercise_duration_minutes: number;
          exercise_type: string | null;
          fluid_consumed_ml: number | null;
          humidity_percent: number | null;
          id: string;
          indoor_outdoor: string | null;
          intensity_level: string | null;
          notes: string | null;
          post_exercise_weight_kg: number;
          pre_exercise_weight_kg: number;
          recommended_fluid_per_hour_ml: number | null;
          recommended_sodium_per_hour_mg: number | null;
          sweat_loss_ml: number | null;
          sweat_rate_ml_per_hour: number | null;
          temperature_celsius: number | null;
          urine_output_ml: number | null;
          user_id: string;
          weight_loss_kg: number | null;
        };
        Insert: {
          assessment_date?: string;
          created_at?: string | null;
          exercise_duration_minutes: number;
          exercise_type?: string | null;
          fluid_consumed_ml?: number | null;
          humidity_percent?: number | null;
          id?: string;
          indoor_outdoor?: string | null;
          intensity_level?: string | null;
          notes?: string | null;
          post_exercise_weight_kg: number;
          pre_exercise_weight_kg: number;
          recommended_fluid_per_hour_ml?: number | null;
          recommended_sodium_per_hour_mg?: number | null;
          sweat_loss_ml?: number | null;
          sweat_rate_ml_per_hour?: number | null;
          temperature_celsius?: number | null;
          urine_output_ml?: number | null;
          user_id: string;
          weight_loss_kg?: number | null;
        };
        Update: {
          assessment_date?: string;
          created_at?: string | null;
          exercise_duration_minutes?: number;
          exercise_type?: string | null;
          fluid_consumed_ml?: number | null;
          humidity_percent?: number | null;
          id?: string;
          indoor_outdoor?: string | null;
          intensity_level?: string | null;
          notes?: string | null;
          post_exercise_weight_kg?: number;
          pre_exercise_weight_kg?: number;
          recommended_fluid_per_hour_ml?: number | null;
          recommended_sodium_per_hour_mg?: number | null;
          sweat_loss_ml?: number | null;
          sweat_rate_ml_per_hour?: number | null;
          temperature_celsius?: number | null;
          urine_output_ml?: number | null;
          user_id?: string;
          weight_loss_kg?: number | null;
        };
        Relationships: [];
      };
      tournament_nutrition_protocols: {
        Row: {
          between_games_carbs_g: number | null;
          between_games_fluid_ml: number | null;
          between_games_protein_g: number | null;
          caffeine_protocol: Json | null;
          created_at: string | null;
          day_before_carb_loading: boolean | null;
          day_before_carbs_g_per_kg: number | null;
          day_before_hydration_ml_per_kg: number | null;
          description: string | null;
          during_game_carbs_g_per_hour: number | null;
          during_game_fluid_ml_per_15min: number | null;
          during_game_sodium_mg_per_hour: number | null;
          games_per_day: number | null;
          id: string;
          is_default: boolean | null;
          morning_carbs_g: number | null;
          morning_fat_g: number | null;
          morning_meal_hours_before: number | null;
          morning_protein_g: number | null;
          post_final_game_carbs_g: number | null;
          post_final_game_protein_g: number | null;
          pre_game_carbs_g: number | null;
          pre_game_fluid_ml: number | null;
          protocol_name: string;
          recovery_meal_timing_hours: number | null;
          recovery_snack_options: string[] | null;
          source: string | null;
          time_between_games_hours: number | null;
          tournament_type: string;
          updated_at: string | null;
        };
        Insert: {
          between_games_carbs_g?: number | null;
          between_games_fluid_ml?: number | null;
          between_games_protein_g?: number | null;
          caffeine_protocol?: Json | null;
          created_at?: string | null;
          day_before_carb_loading?: boolean | null;
          day_before_carbs_g_per_kg?: number | null;
          day_before_hydration_ml_per_kg?: number | null;
          description?: string | null;
          during_game_carbs_g_per_hour?: number | null;
          during_game_fluid_ml_per_15min?: number | null;
          during_game_sodium_mg_per_hour?: number | null;
          games_per_day?: number | null;
          id?: string;
          is_default?: boolean | null;
          morning_carbs_g?: number | null;
          morning_fat_g?: number | null;
          morning_meal_hours_before?: number | null;
          morning_protein_g?: number | null;
          post_final_game_carbs_g?: number | null;
          post_final_game_protein_g?: number | null;
          pre_game_carbs_g?: number | null;
          pre_game_fluid_ml?: number | null;
          protocol_name: string;
          recovery_meal_timing_hours?: number | null;
          recovery_snack_options?: string[] | null;
          source?: string | null;
          time_between_games_hours?: number | null;
          tournament_type: string;
          updated_at?: string | null;
        };
        Update: {
          between_games_carbs_g?: number | null;
          between_games_fluid_ml?: number | null;
          between_games_protein_g?: number | null;
          caffeine_protocol?: Json | null;
          created_at?: string | null;
          day_before_carb_loading?: boolean | null;
          day_before_carbs_g_per_kg?: number | null;
          day_before_hydration_ml_per_kg?: number | null;
          description?: string | null;
          during_game_carbs_g_per_hour?: number | null;
          during_game_fluid_ml_per_15min?: number | null;
          during_game_sodium_mg_per_hour?: number | null;
          games_per_day?: number | null;
          id?: string;
          is_default?: boolean | null;
          morning_carbs_g?: number | null;
          morning_fat_g?: number | null;
          morning_meal_hours_before?: number | null;
          morning_protein_g?: number | null;
          post_final_game_carbs_g?: number | null;
          post_final_game_protein_g?: number | null;
          pre_game_carbs_g?: number | null;
          pre_game_fluid_ml?: number | null;
          protocol_name?: string;
          recovery_meal_timing_hours?: number | null;
          recovery_snack_options?: string[] | null;
          source?: string | null;
          time_between_games_hours?: number | null;
          tournament_type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      usda_foods: {
        Row: {
          brand_name: string | null;
          brand_owner: string | null;
          calcium_mg: number | null;
          carbohydrates_g: number | null;
          cholesterol_mg: number | null;
          created_at: string | null;
          data_type: string | null;
          description: string;
          energy_kcal: number | null;
          fat_g: number | null;
          fdc_id: number;
          fiber_g: number | null;
          food_category: string | null;
          household_serving_text: string | null;
          id: string;
          ingredients: string | null;
          iron_mg: number | null;
          is_active: boolean | null;
          modified_date: string | null;
          nutrients: Json | null;
          potassium_mg: number | null;
          protein_g: number | null;
          publication_date: string | null;
          saturated_fat_g: number | null;
          search_keywords: string[] | null;
          serving_size: number | null;
          serving_size_unit: string | null;
          sodium_mg: number | null;
          sugars_g: number | null;
          updated_at: string | null;
          vitamin_a_mcg: number | null;
          vitamin_c_mg: number | null;
          vitamin_d_mcg: number | null;
        };
        Insert: {
          brand_name?: string | null;
          brand_owner?: string | null;
          calcium_mg?: number | null;
          carbohydrates_g?: number | null;
          cholesterol_mg?: number | null;
          created_at?: string | null;
          data_type?: string | null;
          description: string;
          energy_kcal?: number | null;
          fat_g?: number | null;
          fdc_id: number;
          fiber_g?: number | null;
          food_category?: string | null;
          household_serving_text?: string | null;
          id?: string;
          ingredients?: string | null;
          iron_mg?: number | null;
          is_active?: boolean | null;
          modified_date?: string | null;
          nutrients?: Json | null;
          potassium_mg?: number | null;
          protein_g?: number | null;
          publication_date?: string | null;
          saturated_fat_g?: number | null;
          search_keywords?: string[] | null;
          serving_size?: number | null;
          serving_size_unit?: string | null;
          sodium_mg?: number | null;
          sugars_g?: number | null;
          updated_at?: string | null;
          vitamin_a_mcg?: number | null;
          vitamin_c_mg?: number | null;
          vitamin_d_mcg?: number | null;
        };
        Update: {
          brand_name?: string | null;
          brand_owner?: string | null;
          calcium_mg?: number | null;
          carbohydrates_g?: number | null;
          cholesterol_mg?: number | null;
          created_at?: string | null;
          data_type?: string | null;
          description?: string;
          energy_kcal?: number | null;
          fat_g?: number | null;
          fdc_id?: number;
          fiber_g?: number | null;
          food_category?: string | null;
          household_serving_text?: string | null;
          id?: string;
          ingredients?: string | null;
          iron_mg?: number | null;
          is_active?: boolean | null;
          modified_date?: string | null;
          nutrients?: Json | null;
          potassium_mg?: number | null;
          protein_g?: number | null;
          publication_date?: string | null;
          saturated_fat_g?: number | null;
          search_keywords?: string[] | null;
          serving_size?: number | null;
          serving_size_unit?: string | null;
          sodium_mg?: number | null;
          sugars_g?: number | null;
          updated_at?: string | null;
          vitamin_a_mcg?: number | null;
          vitamin_c_mg?: number | null;
          vitamin_d_mcg?: number | null;
        };
        Relationships: [];
      };
      sync_logs: {
        Row: {
          created_at: string | null;
          duration_ms: number | null;
          error_message: string | null;
          id: string;
          metadata: Json | null;
          records_added: number | null;
          records_failed: number | null;
          records_updated: number | null;
          result: string;
          severity: string;
          source: string;
          timestamp: string | null;
        };
        Insert: {
          created_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          records_added?: number | null;
          records_failed?: number | null;
          records_updated?: number | null;
          result: string;
          severity: string;
          source: string;
          timestamp?: string | null;
        };
        Update: {
          created_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          records_added?: number | null;
          records_failed?: number | null;
          records_updated?: number | null;
          result?: string;
          severity?: string;
          source?: string;
          timestamp?: string | null;
        };
        Relationships: [];
      };
      // Note: This is a partial type file containing only nutrition-related tables
      // The full generated types include all 200+ tables in the database
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      channel_type_enum:
        | "announcements"
        | "team_general"
        | "coaches_only"
        | "position_group"
        | "game_day"
        | "direct_message";
      notification_type_enum:
        | "training"
        | "achievement"
        | "team"
        | "wellness"
        | "general"
        | "game"
        | "tournament"
        | "injury_risk"
        | "weather"
        | "chat_mention"
        | "chat_announcement"
        | "chat_important"
        | "stats_uploaded"
        | "player_activity";
      training_session_status:
        | "planned"
        | "in_progress"
        | "completed"
        | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

// Nutrition-specific type exports for convenience
export type AthleteNutritionProfile = Tables<"athlete_nutrition_profiles">;
export type NutritionPlan = Tables<"nutrition_plans">;
export type MealTemplate = Tables<"meal_templates">;
export type HydrationLog = Tables<"hydration_logs">;
export type SweatRateAssessment = Tables<"sweat_rate_assessments">;
export type SupplementCalculation = Tables<"supplement_calculations">;
export type TournamentNutritionProtocol =
  Tables<"tournament_nutrition_protocols">;
export type USDAFood = Tables<"usda_foods">;
export type NutritionLog = Tables<"nutrition_logs">;
export type NutritionGoal = Tables<"nutrition_goals">;
export type SupplementLog = Tables<"supplement_logs">;
export type SyncLog = Tables<"sync_logs">;

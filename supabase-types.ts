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
      absence_requests: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          notify_when_reviewed: boolean | null
          player_id: string
          reason_category: string
          reason_details: string | null
          request_date: string | null
          request_date_end: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          team_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          notify_when_reviewed?: boolean | null
          player_id: string
          reason_category: string
          reason_details?: string | null
          request_date?: string | null
          request_date_end?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          team_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          notify_when_reviewed?: boolean | null
          player_id?: string
          reason_category?: string
          reason_details?: string | null
          request_date?: string | null
          request_date_end?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "absence_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "team_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      account_deletion_requests: {
        Row: {
          created_at: string
          error_message: string | null
          grace_period_ends_at: string | null
          hard_deleted_at: string | null
          id: string
          processed_by: string | null
          processing_notes: string | null
          reason: string | null
          requested_at: string
          scheduled_hard_delete_at: string | null
          sessions_revoked_at: string | null
          soft_deleted_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          grace_period_ends_at?: string | null
          hard_deleted_at?: string | null
          id?: string
          processed_by?: string | null
          processing_notes?: string | null
          reason?: string | null
          requested_at?: string
          scheduled_hard_delete_at?: string | null
          sessions_revoked_at?: string | null
          soft_deleted_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          grace_period_ends_at?: string | null
          hard_deleted_at?: string | null
          id?: string
          processed_by?: string | null
          processing_notes?: string | null
          reason?: string | null
          requested_at?: string
          scheduled_hard_delete_at?: string | null
          sessions_revoked_at?: string | null
          soft_deleted_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      account_pause_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          pause_until: string | null
          reason: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          pause_until?: string | null
          reason?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          pause_until?: string | null
          reason?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_pause_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_pause_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_definitions: {
        Row: {
          category: string
          created_at: string | null
          criteria: Json
          description: string
          display_order: number | null
          hidden_until_progress: boolean | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          points: number | null
          slug: string
          tier: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria: Json
          description: string
          display_order?: number | null
          hidden_until_progress?: boolean | null
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          points?: number | null
          slug: string
          tier?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria?: Json
          description?: string
          display_order?: number | null
          hidden_until_progress?: boolean | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          points?: number | null
          slug?: string
          tier?: string | null
        }
        Relationships: []
      }
      achievement_history: {
        Row: {
          achievement_id: string
          created_at: string | null
          event_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string | null
          event_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string | null
          event_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      acwr_calculations: {
        Row: {
          acute_load: number | null
          acwr_ratio: number | null
          calculation_date: string
          chronic_load: number | null
          created_at: string | null
          id: string
          load_type: string | null
          notes: string | null
          risk_zone: string | null
          user_id: string
        }
        Insert: {
          acute_load?: number | null
          acwr_ratio?: number | null
          calculation_date?: string
          chronic_load?: number | null
          created_at?: string | null
          id?: string
          load_type?: string | null
          notes?: string | null
          risk_zone?: string | null
          user_id: string
        }
        Update: {
          acute_load?: number | null
          acwr_ratio?: number | null
          calculation_date?: string
          chronic_load?: number | null
          created_at?: string | null
          id?: string
          load_type?: string | null
          notes?: string | null
          risk_zone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acwr_calculations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      acwr_reports: {
        Row: {
          average_acwr: number | null
          created_at: string | null
          days_in_danger_zone: number | null
          generated_at: string | null
          id: string
          peak_acwr: number | null
          recommendations: Json | null
          report_date: string
          report_type: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          average_acwr?: number | null
          created_at?: string | null
          days_in_danger_zone?: number | null
          generated_at?: string | null
          id?: string
          peak_acwr?: number | null
          recommendations?: Json | null
          report_date: string
          report_type: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          average_acwr?: number | null
          created_at?: string | null
          days_in_danger_zone?: number | null
          generated_at?: string | null
          id?: string
          peak_acwr?: number | null
          recommendations?: Json | null
          report_date?: string
          report_type?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acwr_reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acwr_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
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
      age_recovery_modifiers: {
        Row: {
          acwr_max_adjustment: number
          age_max: number
          age_min: number
          evidence_source: string
          evidence_url: string | null
          id: number
          min_hours_between_high_intensity: number
          notes: string | null
          recommended_sessions_per_week: number
          recovery_modifier: number
        }
        Insert: {
          acwr_max_adjustment: number
          age_max: number
          age_min: number
          evidence_source: string
          evidence_url?: string | null
          id?: number
          min_hours_between_high_intensity: number
          notes?: string | null
          recommended_sessions_per_week?: number
          recovery_modifier: number
        }
        Update: {
          acwr_max_adjustment?: number
          age_max?: number
          age_min?: number
          evidence_source?: string
          evidence_url?: string | null
          id?: number
          min_hours_between_high_intensity?: number
          notes?: string | null
          recommended_sessions_per_week?: number
          recovery_modifier?: number
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
      ai_chat_sessions: {
        Row: {
          context_snapshot: Json | null
          created_at: string
          ended_at: string | null
          goal: string | null
          id: string
          started_at: string
          team_id: string | null
          time_horizon: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context_snapshot?: Json | null
          created_at?: string
          ended_at?: string | null
          goal?: string | null
          id?: string
          started_at?: string
          team_id?: string | null
          time_horizon?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context_snapshot?: Json | null
          created_at?: string
          ended_at?: string | null
          goal?: string | null
          id?: string
          started_at?: string
          team_id?: string | null
          time_horizon?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_coach_interactions: {
        Row: {
          coach_id: string
          coach_response: string | null
          context: Json | null
          created_at: string | null
          id: string
          interaction_type: string
          requires_review: boolean | null
          response_time_ms: number | null
          review_outcome: string | null
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          tokens_used: number | null
          topic: string | null
          user_feedback: string | null
          user_id: string
          user_message: string | null
          user_rating: number | null
          was_helpful: boolean | null
        }
        Insert: {
          coach_id: string
          coach_response?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          requires_review?: boolean | null
          response_time_ms?: number | null
          review_outcome?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          tokens_used?: number | null
          topic?: string | null
          user_feedback?: string | null
          user_id: string
          user_message?: string | null
          user_rating?: number | null
          was_helpful?: boolean | null
        }
        Update: {
          coach_id?: string
          coach_response?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          requires_review?: boolean | null
          response_time_ms?: number | null
          review_outcome?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          tokens_used?: number | null
          topic?: string | null
          user_feedback?: string | null
          user_id?: string
          user_message?: string | null
          user_rating?: number | null
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_coach_interactions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "ai_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_coach_specializations: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      ai_coach_visibility: {
        Row: {
          coach_id: string
          coach_notes: string | null
          created_at: string
          id: string
          message_id: string | null
          override_reason: string | null
          player_id: string
          recommendation_id: string | null
          team_id: string | null
          viewed_at: string | null
          visibility_type: string
        }
        Insert: {
          coach_id: string
          coach_notes?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          override_reason?: string | null
          player_id: string
          recommendation_id?: string | null
          team_id?: string | null
          viewed_at?: string | null
          visibility_type: string
        }
        Update: {
          coach_id?: string
          coach_notes?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          override_reason?: string | null
          player_id?: string
          recommendation_id?: string | null
          team_id?: string | null
          viewed_at?: string | null
          visibility_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_coach_visibility_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_coach_visibility_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "ai_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_coach_visibility_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_coaches: {
        Row: {
          assessment_types: string[] | null
          avatar_url: string | null
          average_rating: number | null
          communication_style: string | null
          created_at: string | null
          expertise: Json | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_tokens: number | null
          mental_training_techniques: string[] | null
          name: string
          personality_type: string
          specializations: string[] | null
          supports_psychological_assessment: boolean | null
          system_prompt: string | null
          temperature: number | null
          total_interactions: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_types?: string[] | null
          avatar_url?: string | null
          average_rating?: number | null
          communication_style?: string | null
          created_at?: string | null
          expertise?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          mental_training_techniques?: string[] | null
          name: string
          personality_type?: string
          specializations?: string[] | null
          supports_psychological_assessment?: boolean | null
          system_prompt?: string | null
          temperature?: number | null
          total_interactions?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_types?: string[] | null
          avatar_url?: string | null
          average_rating?: number | null
          communication_style?: string | null
          created_at?: string | null
          expertise?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          mental_training_techniques?: string[] | null
          name?: string
          personality_type?: string
          specializations?: string[] | null
          supports_psychological_assessment?: boolean | null
          system_prompt?: string | null
          temperature?: number | null
          total_interactions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          chat_session_id: string | null
          created_at: string
          feedback_reason: string | null
          feedback_type: string
          flagged_for_review: boolean | null
          id: string
          message_id: string | null
          outcome: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          user_id: string
        }
        Insert: {
          chat_session_id?: string | null
          created_at?: string
          feedback_reason?: string | null
          feedback_type: string
          flagged_for_review?: boolean | null
          id?: string
          message_id?: string | null
          outcome?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id: string
        }
        Update: {
          chat_session_id?: string | null
          created_at?: string
          feedback_reason?: string | null
          feedback_type?: string
          flagged_for_review?: boolean | null
          id?: string
          message_id?: string | null
          outcome?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          citations: Json | null
          content: string
          created_at: string
          id: string
          intent: string | null
          metadata: Json | null
          risk_level: string | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          citations?: Json | null
          content: string
          created_at?: string
          id?: string
          intent?: string | null
          metadata?: Json | null
          risk_level?: string | null
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          citations?: Json | null
          content?: string
          created_at?: string
          id?: string
          intent?: string | null
          metadata?: Json | null
          risk_level?: string | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          accepted_at: string | null
          chat_session_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          message_id: string | null
          outcome: string | null
          reason: string
          recommendation_data: Json | null
          recommendation_type: string
          rejected_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          chat_session_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          outcome?: string | null
          reason: string
          recommendation_data?: Json | null
          recommendation_type: string
          rejected_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          chat_session_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          outcome?: string | null
          reason?: string
          recommendation_data?: Json | null
          recommendation_type?: string
          rejected_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_training_suggestions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          data_sources: Json | null
          description: string | null
          expires_at: string | null
          id: string
          priority: string | null
          status: string | null
          suggestion_type: string
          title: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          data_sources?: Json | null
          description?: string | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          suggestion_type: string
          title: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          data_sources?: Json | null
          description?: string | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          suggestion_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_training_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          user_id_uuid: string
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
          user_id_uuid: string
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
          user_id_uuid?: string
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Relationships: []
      }
      announcement_reads: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          created_at: string | null
          experience_level: string | null
          federation_affiliation: string | null
          id: string
          olympic_goals: string | null
          request_reason: string | null
          request_type: string
          requested_role: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          experience_level?: string | null
          federation_affiliation?: string | null
          id?: string
          olympic_goals?: string | null
          request_reason?: string | null
          request_type: string
          requested_role?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          experience_level?: string | null
          federation_affiliation?: string | null
          id?: string
          olympic_goals?: string | null
          request_reason?: string | null
          request_type?: string
          requested_role?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_consent_settings: {
        Row: {
          athlete_id: string
          created_at: string
          share_merlin_conversations_with_coach: boolean
          share_readiness_with_all_coaches: boolean
          share_readiness_with_coach: boolean
          share_training_notes_with_coach: boolean
          share_wellness_answers_with_coach: boolean
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          share_merlin_conversations_with_coach?: boolean
          share_readiness_with_all_coaches?: boolean
          share_readiness_with_coach?: boolean
          share_training_notes_with_coach?: boolean
          share_wellness_answers_with_coach?: boolean
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          share_merlin_conversations_with_coach?: boolean
          share_readiness_with_all_coaches?: boolean
          share_readiness_with_coach?: boolean
          share_training_notes_with_coach?: boolean
          share_wellness_answers_with_coach?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      athlete_drill_assignments: {
        Row: {
          actual_duration_minutes: number | null
          actual_load: number | null
          actual_rpe: number | null
          affects_periodization: boolean | null
          assigned_by: string
          assigned_date: string | null
          athlete_id: string
          athlete_notes: string | null
          coach_feedback: string | null
          completed_at: string | null
          created_at: string | null
          drill_category: string | null
          drill_description: string | null
          drill_name: string
          due_date: string | null
          estimated_duration_minutes: number | null
          estimated_load: number | null
          estimated_rpe: number | null
          id: string
          status: string | null
          target_session_date: string | null
          updated_at: string | null
          user_id: string | null
          video_id: string | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          actual_load?: number | null
          actual_rpe?: number | null
          affects_periodization?: boolean | null
          assigned_by: string
          assigned_date?: string | null
          athlete_id: string
          athlete_notes?: string | null
          coach_feedback?: string | null
          completed_at?: string | null
          created_at?: string | null
          drill_category?: string | null
          drill_description?: string | null
          drill_name: string
          due_date?: string | null
          estimated_duration_minutes?: number | null
          estimated_load?: number | null
          estimated_rpe?: number | null
          id?: string
          status?: string | null
          target_session_date?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_id?: string | null
        }
        Update: {
          actual_duration_minutes?: number | null
          actual_load?: number | null
          actual_rpe?: number | null
          affects_periodization?: boolean | null
          assigned_by?: string
          assigned_date?: string | null
          athlete_id?: string
          athlete_notes?: string | null
          coach_feedback?: string | null
          completed_at?: string | null
          created_at?: string | null
          drill_category?: string | null
          drill_description?: string | null
          drill_name?: string
          due_date?: string | null
          estimated_duration_minutes?: number | null
          estimated_load?: number | null
          estimated_rpe?: number | null
          id?: string
          status?: string | null
          target_session_date?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_drill_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_drill_assignments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "training_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_injuries: {
        Row: {
          activity_at_injury: string | null
          activity_restrictions: string[] | null
          actual_return_date: string | null
          created_at: string | null
          current_phase: string | null
          diagnosis: string | null
          exercise_modifications: Json | null
          expected_return_date: string | null
          id: string
          injury_date: string
          injury_grade: string | null
          injury_location: string
          injury_mechanism: string | null
          injury_type: string
          is_recurrence: boolean | null
          medical_clearance_date: string | null
          medical_notes: string | null
          previous_injury_id: string | null
          recovery_status: string | null
          recurrence_count: number | null
          rtp_progress: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_at_injury?: string | null
          activity_restrictions?: string[] | null
          actual_return_date?: string | null
          created_at?: string | null
          current_phase?: string | null
          diagnosis?: string | null
          exercise_modifications?: Json | null
          expected_return_date?: string | null
          id?: string
          injury_date: string
          injury_grade?: string | null
          injury_location: string
          injury_mechanism?: string | null
          injury_type: string
          is_recurrence?: boolean | null
          medical_clearance_date?: string | null
          medical_notes?: string | null
          previous_injury_id?: string | null
          recovery_status?: string | null
          recurrence_count?: number | null
          rtp_progress?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_at_injury?: string | null
          activity_restrictions?: string[] | null
          actual_return_date?: string | null
          created_at?: string | null
          current_phase?: string | null
          diagnosis?: string | null
          exercise_modifications?: Json | null
          expected_return_date?: string | null
          id?: string
          injury_date?: string
          injury_grade?: string | null
          injury_location?: string
          injury_mechanism?: string | null
          injury_type?: string
          is_recurrence?: boolean | null
          medical_clearance_date?: string | null
          medical_notes?: string | null
          previous_injury_id?: string | null
          recovery_status?: string | null
          recurrence_count?: number | null
          rtp_progress?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_injuries_previous_injury_id_fkey"
            columns: ["previous_injury_id"]
            isOneToOne: false
            referencedRelation: "athlete_injuries"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_nutrition_profiles: {
        Row: {
          activity_level: string | null
          base_hydration_ml: number | null
          bmr_kcal: number | null
          body_fat_percentage: number | null
          caffeine_tolerance: string | null
          carbs_target_g: number | null
          created_at: string | null
          dietary_restrictions: string[] | null
          fat_target_g: number | null
          food_allergies: string[] | null
          height_cm: number | null
          id: string
          lean_mass_kg: number | null
          position: string | null
          preferred_meal_count: number | null
          primary_goal: string | null
          protein_target_g: number | null
          sweat_rate_ml_per_hour: number | null
          target_weight_kg: number | null
          tdee_kcal: number | null
          training_days_per_week: number | null
          updated_at: string | null
          user_id: string
          uses_creatine: boolean | null
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          base_hydration_ml?: number | null
          bmr_kcal?: number | null
          body_fat_percentage?: number | null
          caffeine_tolerance?: string | null
          carbs_target_g?: number | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          fat_target_g?: number | null
          food_allergies?: string[] | null
          height_cm?: number | null
          id?: string
          lean_mass_kg?: number | null
          position?: string | null
          preferred_meal_count?: number | null
          primary_goal?: string | null
          protein_target_g?: number | null
          sweat_rate_ml_per_hour?: number | null
          target_weight_kg?: number | null
          tdee_kcal?: number | null
          training_days_per_week?: number | null
          updated_at?: string | null
          user_id: string
          uses_creatine?: boolean | null
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          base_hydration_ml?: number | null
          bmr_kcal?: number | null
          body_fat_percentage?: number | null
          caffeine_tolerance?: string | null
          carbs_target_g?: number | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          fat_target_g?: number | null
          food_allergies?: string[] | null
          height_cm?: number | null
          id?: string
          lean_mass_kg?: number | null
          position?: string | null
          preferred_meal_count?: number | null
          primary_goal?: string | null
          protein_target_g?: number | null
          sweat_rate_ml_per_hour?: number | null
          target_weight_kg?: number | null
          tdee_kcal?: number | null
          training_days_per_week?: number | null
          updated_at?: string | null
          user_id?: string
          uses_creatine?: boolean | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      athlete_performance_tests: {
        Row: {
          beep_test_level: number | null
          bench_press_reps: number | null
          broad_jump_cm: number | null
          coach_id: string | null
          conditions: string | null
          cooper_test_m: number | null
          created_at: string | null
          deadlift_max_kg: number | null
          id: string
          l_drill_sec: number | null
          notes: string | null
          percentile: number | null
          pro_agility_sec: number | null
          results: Json | null
          score: number | null
          squat_max_kg: number | null
          test_date: string
          test_name: string
          test_type: string
          three_cone_sec: number | null
          time_10m: number | null
          time_20m: number | null
          time_40m: number | null
          time_40yd: number | null
          unit: string | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
          vertical_jump_cm: number | null
          yo_yo_distance_m: number | null
        }
        Insert: {
          beep_test_level?: number | null
          bench_press_reps?: number | null
          broad_jump_cm?: number | null
          coach_id?: string | null
          conditions?: string | null
          cooper_test_m?: number | null
          created_at?: string | null
          deadlift_max_kg?: number | null
          id?: string
          l_drill_sec?: number | null
          notes?: string | null
          percentile?: number | null
          pro_agility_sec?: number | null
          results?: Json | null
          score?: number | null
          squat_max_kg?: number | null
          test_date?: string
          test_name: string
          test_type: string
          three_cone_sec?: number | null
          time_10m?: number | null
          time_20m?: number | null
          time_40m?: number | null
          time_40yd?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          vertical_jump_cm?: number | null
          yo_yo_distance_m?: number | null
        }
        Update: {
          beep_test_level?: number | null
          bench_press_reps?: number | null
          broad_jump_cm?: number | null
          coach_id?: string | null
          conditions?: string | null
          cooper_test_m?: number | null
          created_at?: string | null
          deadlift_max_kg?: number | null
          id?: string
          l_drill_sec?: number | null
          notes?: string | null
          percentile?: number | null
          pro_agility_sec?: number | null
          results?: Json | null
          score?: number | null
          squat_max_kg?: number | null
          test_date?: string
          test_name?: string
          test_type?: string
          three_cone_sec?: number | null
          time_10m?: number | null
          time_20m?: number | null
          time_40m?: number | null
          time_40yd?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          vertical_jump_cm?: number | null
          yo_yo_distance_m?: number | null
        }
        Relationships: []
      }
      athlete_periodization: {
        Row: {
          benchmark_results: Json | null
          created_at: string | null
          current_phase: string | null
          current_year: number | null
          id: string
          intensity_adjustment: number | null
          periodization_id: string | null
          personal_goals: string[] | null
          phase_completion_dates: Json | null
          target_event: string | null
          updated_at: string | null
          user_id: string
          volume_adjustment: number | null
        }
        Insert: {
          benchmark_results?: Json | null
          created_at?: string | null
          current_phase?: string | null
          current_year?: number | null
          id?: string
          intensity_adjustment?: number | null
          periodization_id?: string | null
          personal_goals?: string[] | null
          phase_completion_dates?: Json | null
          target_event?: string | null
          updated_at?: string | null
          user_id: string
          volume_adjustment?: number | null
        }
        Update: {
          benchmark_results?: Json | null
          created_at?: string | null
          current_phase?: string | null
          current_year?: number | null
          id?: string
          intensity_adjustment?: number | null
          periodization_id?: string | null
          personal_goals?: string[] | null
          phase_completion_dates?: Json | null
          target_event?: string | null
          updated_at?: string | null
          user_id?: string
          volume_adjustment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_periodization_periodization_id_fkey"
            columns: ["periodization_id"]
            isOneToOne: false
            referencedRelation: "multi_year_periodization"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_recovery_profiles: {
        Row: {
          areas_of_concern: Json | null
          athlete_id: string
          baseline_hrv: number | null
          baseline_recovery_score: number | null
          baseline_resting_hr: number | null
          baseline_sleep_score: number | null
          chronic_conditions: Json | null
          created_at: string | null
          favorite_protocols: Json | null
          id: string
          injury_history: Json | null
          last_assessment_date: string | null
          preferred_recovery_times: Json | null
          profile_completed: boolean | null
          protocol_effectiveness: Json | null
          recovery_accelerators: Json | null
          recovery_budget_monthly: number | null
          recovery_environment: string | null
          recovery_equipment_desired: Json | null
          recovery_equipment_owned: Json | null
          recovery_goals: Json | null
          recovery_preferences: Json | null
          sleep_pattern: Json | null
          stress_triggers: Json | null
          time_available_daily_minutes: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          areas_of_concern?: Json | null
          athlete_id: string
          baseline_hrv?: number | null
          baseline_recovery_score?: number | null
          baseline_resting_hr?: number | null
          baseline_sleep_score?: number | null
          chronic_conditions?: Json | null
          created_at?: string | null
          favorite_protocols?: Json | null
          id?: string
          injury_history?: Json | null
          last_assessment_date?: string | null
          preferred_recovery_times?: Json | null
          profile_completed?: boolean | null
          protocol_effectiveness?: Json | null
          recovery_accelerators?: Json | null
          recovery_budget_monthly?: number | null
          recovery_environment?: string | null
          recovery_equipment_desired?: Json | null
          recovery_equipment_owned?: Json | null
          recovery_goals?: Json | null
          recovery_preferences?: Json | null
          sleep_pattern?: Json | null
          stress_triggers?: Json | null
          time_available_daily_minutes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          areas_of_concern?: Json | null
          athlete_id?: string
          baseline_hrv?: number | null
          baseline_recovery_score?: number | null
          baseline_resting_hr?: number | null
          baseline_sleep_score?: number | null
          chronic_conditions?: Json | null
          created_at?: string | null
          favorite_protocols?: Json | null
          id?: string
          injury_history?: Json | null
          last_assessment_date?: string | null
          preferred_recovery_times?: Json | null
          profile_completed?: boolean | null
          protocol_effectiveness?: Json | null
          recovery_accelerators?: Json | null
          recovery_budget_monthly?: number | null
          recovery_environment?: string | null
          recovery_equipment_desired?: Json | null
          recovery_equipment_owned?: Json | null
          recovery_goals?: Json | null
          recovery_preferences?: Json | null
          sleep_pattern?: Json | null
          stress_triggers?: Json | null
          time_available_daily_minutes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_recovery_profiles_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_recovery_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_team_sync: {
        Row: {
          created_at: string | null
          deviation_approved_by: string | null
          deviation_end_date: string | null
          deviation_reason: string | null
          id: string
          individual_intensity_modifier: number | null
          individual_volume_modifier: number | null
          is_synced: boolean | null
          last_sync_date: string | null
          makeup_sessions_required: number | null
          missed_practices_count: number | null
          notes: string | null
          practice_attendance_percentage: number | null
          team_id: string
          team_periodization_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deviation_approved_by?: string | null
          deviation_end_date?: string | null
          deviation_reason?: string | null
          id?: string
          individual_intensity_modifier?: number | null
          individual_volume_modifier?: number | null
          is_synced?: boolean | null
          last_sync_date?: string | null
          makeup_sessions_required?: number | null
          missed_practices_count?: number | null
          notes?: string | null
          practice_attendance_percentage?: number | null
          team_id: string
          team_periodization_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deviation_approved_by?: string | null
          deviation_end_date?: string | null
          deviation_reason?: string | null
          id?: string
          individual_intensity_modifier?: number | null
          individual_volume_modifier?: number | null
          is_synced?: boolean | null
          last_sync_date?: string | null
          makeup_sessions_required?: number | null
          missed_practices_count?: number | null
          notes?: string | null
          practice_attendance_percentage?: number | null
          team_id?: string
          team_periodization_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_team_sync_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_team_sync_team_periodization_id_fkey"
            columns: ["team_periodization_id"]
            isOneToOne: false
            referencedRelation: "team_periodization"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_training_config: {
        Row: {
          acwr_target_max: number | null
          acwr_target_min: number | null
          age_recovery_modifier: number | null
          assigned_program_id: string | null
          available_equipment: string[] | null
          birth_date: string | null
          created_at: string | null
          current_limitations: Json | null
          flag_practice_schedule: Json | null
          has_field_access: boolean | null
          has_gym_access: boolean | null
          id: string
          max_sessions_per_week: number | null
          national_team_schedule: Json | null
          preferred_session_time: string | null
          preferred_training_days: number[] | null
          primary_position: string
          secondary_position: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acwr_target_max?: number | null
          acwr_target_min?: number | null
          age_recovery_modifier?: number | null
          assigned_program_id?: string | null
          available_equipment?: string[] | null
          birth_date?: string | null
          created_at?: string | null
          current_limitations?: Json | null
          flag_practice_schedule?: Json | null
          has_field_access?: boolean | null
          has_gym_access?: boolean | null
          id?: string
          max_sessions_per_week?: number | null
          national_team_schedule?: Json | null
          preferred_session_time?: string | null
          preferred_training_days?: number[] | null
          primary_position?: string
          secondary_position?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acwr_target_max?: number | null
          acwr_target_min?: number | null
          age_recovery_modifier?: number | null
          assigned_program_id?: string | null
          available_equipment?: string[] | null
          birth_date?: string | null
          created_at?: string | null
          current_limitations?: Json | null
          flag_practice_schedule?: Json | null
          has_field_access?: boolean | null
          has_gym_access?: boolean | null
          id?: string
          max_sessions_per_week?: number | null
          national_team_schedule?: Json | null
          preferred_session_time?: string | null
          preferred_training_days?: number[] | null
          primary_position?: string
          secondary_position?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_training_config_assigned_program_id_fkey"
            columns: ["assigned_program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_training_preferences: {
        Row: {
          age_years: number | null
          created_at: string | null
          current_limitations: string[] | null
          equipment_available: string[] | null
          experience_level: string | null
          has_gym_access: boolean | null
          has_outdoor_space: boolean | null
          height_cm: number | null
          id: string
          indoor_outdoor_preference: string | null
          location_city: string | null
          location_country: string | null
          position: string | null
          preferred_training_time: string | null
          previous_injuries: string[] | null
          primary_goal: string | null
          secondary_goals: string[] | null
          session_duration_minutes: number | null
          timezone: string | null
          training_age_months: number | null
          training_days_per_week: number | null
          updated_at: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          age_years?: number | null
          created_at?: string | null
          current_limitations?: string[] | null
          equipment_available?: string[] | null
          experience_level?: string | null
          has_gym_access?: boolean | null
          has_outdoor_space?: boolean | null
          height_cm?: number | null
          id?: string
          indoor_outdoor_preference?: string | null
          location_city?: string | null
          location_country?: string | null
          position?: string | null
          preferred_training_time?: string | null
          previous_injuries?: string[] | null
          primary_goal?: string | null
          secondary_goals?: string[] | null
          session_duration_minutes?: number | null
          timezone?: string | null
          training_age_months?: number | null
          training_days_per_week?: number | null
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          age_years?: number | null
          created_at?: string | null
          current_limitations?: string[] | null
          equipment_available?: string[] | null
          experience_level?: string | null
          has_gym_access?: boolean | null
          has_outdoor_space?: boolean | null
          height_cm?: number | null
          id?: string
          indoor_outdoor_preference?: string | null
          location_city?: string | null
          location_country?: string | null
          position?: string | null
          preferred_training_time?: string | null
          previous_injuries?: string[] | null
          primary_goal?: string | null
          secondary_goals?: string[] | null
          session_duration_minutes?: number | null
          timezone?: string | null
          training_age_months?: number | null
          training_days_per_week?: number | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      athlete_travel_log: {
        Row: {
          adaptation_day: number | null
          arrival_date: string
          competition_date: string | null
          competition_name: string | null
          created_at: string | null
          departure_date: string
          destination_city: string
          destination_timezone: string | null
          energy_level: number | null
          id: string
          jet_lag_severity: number | null
          notes: string | null
          origin_city: string
          origin_timezone: string | null
          protocol_adherence_percentage: number | null
          protocol_id: string | null
          sleep_quality_since_arrival: number | null
          timezone_difference: number | null
          training_readiness: number | null
          travel_purpose: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          adaptation_day?: number | null
          arrival_date: string
          competition_date?: string | null
          competition_name?: string | null
          created_at?: string | null
          departure_date: string
          destination_city: string
          destination_timezone?: string | null
          energy_level?: number | null
          id?: string
          jet_lag_severity?: number | null
          notes?: string | null
          origin_city: string
          origin_timezone?: string | null
          protocol_adherence_percentage?: number | null
          protocol_id?: string | null
          sleep_quality_since_arrival?: number | null
          timezone_difference?: number | null
          training_readiness?: number | null
          travel_purpose?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          adaptation_day?: number | null
          arrival_date?: string
          competition_date?: string | null
          competition_name?: string | null
          created_at?: string | null
          departure_date?: string
          destination_city?: string
          destination_timezone?: string | null
          energy_level?: number | null
          id?: string
          jet_lag_severity?: number | null
          notes?: string | null
          origin_city?: string
          origin_timezone?: string | null
          protocol_adherence_percentage?: number | null
          protocol_id?: string | null
          sleep_quality_since_arrival?: number | null
          timezone_difference?: number | null
          training_readiness?: number | null
          travel_purpose?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_travel_log_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "travel_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          absence_reason: string | null
          approved_by: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          event_id: string
          excuse_approved: boolean | null
          id: string
          is_self_reported: boolean | null
          limitation_reason: string | null
          minutes_late: number | null
          notes: string | null
          participation_level: string | null
          player_id: string
          recorded_by: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          absence_reason?: string | null
          approved_by?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          event_id: string
          excuse_approved?: boolean | null
          id?: string
          is_self_reported?: boolean | null
          limitation_reason?: string | null
          minutes_late?: number | null
          notes?: string | null
          participation_level?: string | null
          player_id: string
          recorded_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          absence_reason?: string | null
          approved_by?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          event_id?: string
          excuse_approved?: boolean | null
          id?: string
          is_self_reported?: boolean | null
          limitation_reason?: string | null
          minutes_late?: number | null
          notes?: string | null
          participation_level?: string | null
          player_id?: string
          recorded_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "team_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      authorization_violations: {
        Row: {
          action: string
          error_code: string
          error_message: string
          ip_address: unknown
          request_body: Json | null
          request_method: string | null
          request_path: string | null
          resource_id: string | null
          resource_type: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
          violation_id: string
        }
        Insert: {
          action: string
          error_code: string
          error_message: string
          ip_address?: unknown
          request_body?: Json | null
          request_method?: string | null
          request_path?: string | null
          resource_id?: string | null
          resource_type: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
          violation_id?: string
        }
        Update: {
          action?: string
          error_code?: string
          error_message?: string
          ip_address?: unknown
          request_body?: Json | null
          request_method?: string | null
          request_path?: string | null
          resource_id?: string | null
          resource_type?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
          violation_id?: string
        }
        Relationships: []
      }
      avatars: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          height: number | null
          id: string
          is_current: boolean | null
          mime_type: string | null
          storage_path: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          height?: number | null
          id?: string
          is_current?: boolean | null
          mime_type?: string | null
          storage_path: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          height?: number | null
          id?: string
          is_current?: boolean | null
          mime_type?: string | null
          storage_path?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "avatars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_user_id: string
          created_at: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          arm_cm: number | null
          body_fat_percentage: number | null
          chest_cm: number | null
          created_at: string | null
          height_cm: number | null
          id: string
          measurement_date: string
          muscle_mass_kg: number | null
          notes: string | null
          thigh_cm: number | null
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          arm_cm?: number | null
          body_fat_percentage?: number | null
          chest_cm?: number | null
          created_at?: string | null
          height_cm?: number | null
          id?: string
          measurement_date?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          thigh_cm?: number | null
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          arm_cm?: number | null
          body_fat_percentage?: number | null
          chest_cm?: number | null
          created_at?: string | null
          height_cm?: number | null
          id?: string
          measurement_date?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          thigh_cm?: number | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      calibration_logs: {
        Row: {
          acwr: number | null
          athlete_id: string
          created_at: string
          days_until_event: number | null
          event_importance: string | null
          id: string
          injury_date: string | null
          injury_flagged: boolean | null
          injury_type: string | null
          outcome_recorded_at: string | null
          performance_rating: number | null
          phase: string | null
          preset_id: string | null
          preset_version: string | null
          rationale: string | null
          readiness_score: number | null
          recommendation_type: string | null
          session_quality: number | null
          subjective_feedback: string | null
          timestamp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acwr?: number | null
          athlete_id: string
          created_at?: string
          days_until_event?: number | null
          event_importance?: string | null
          id?: string
          injury_date?: string | null
          injury_flagged?: boolean | null
          injury_type?: string | null
          outcome_recorded_at?: string | null
          performance_rating?: number | null
          phase?: string | null
          preset_id?: string | null
          preset_version?: string | null
          rationale?: string | null
          readiness_score?: number | null
          recommendation_type?: string | null
          session_quality?: number | null
          subjective_feedback?: string | null
          timestamp?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acwr?: number | null
          athlete_id?: string
          created_at?: string
          days_until_event?: number | null
          event_importance?: string | null
          id?: string
          injury_date?: string | null
          injury_flagged?: boolean | null
          injury_type?: string | null
          outcome_recorded_at?: string | null
          performance_rating?: number | null
          phase?: string | null
          preset_id?: string | null
          preset_version?: string | null
          rationale?: string | null
          readiness_score?: number | null
          recommendation_type?: string | null
          session_quality?: number | null
          subjective_feedback?: string | null
          timestamp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      channel_members: {
        Row: {
          can_post: boolean | null
          channel_id: string
          id: string
          is_admin: boolean | null
          is_muted: boolean | null
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          can_post?: boolean | null
          channel_id: string
          id?: string
          is_admin?: boolean | null
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          can_post?: boolean | null
          channel_id?: string
          id?: string
          is_admin?: boolean | null
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          allow_threads: boolean | null
          channel_type: Database["public"]["Enums"]["channel_type_enum"]
          created_at: string
          created_by: string | null
          description: string | null
          game_id: string | null
          id: string
          is_archived: boolean | null
          is_default: boolean | null
          is_group_dm: boolean | null
          name: string
          position_filter: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          allow_threads?: boolean | null
          channel_type?: Database["public"]["Enums"]["channel_type_enum"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          game_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          is_group_dm?: boolean | null
          name: string
          position_filter?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          allow_threads?: boolean | null
          channel_type?: Database["public"]["Enums"]["channel_type_enum"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          game_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          is_group_dm?: boolean | null
          name?: string
          position_filter?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          channel_id: string | null
          created_at: string | null
          id: string
          is_important: boolean | null
          is_pinned: boolean | null
          is_read: boolean | null
          mentions: string[] | null
          message: string
          message_type: string | null
          pinned_at: string | null
          pinned_by: string | null
          read_at: string | null
          recipient_id: string | null
          reply_count: number | null
          sender_id: string
          team_id: string | null
          thread_id: string | null
        }
        Insert: {
          attachments?: Json | null
          channel_id?: string | null
          created_at?: string | null
          id?: string
          is_important?: boolean | null
          is_pinned?: boolean | null
          is_read?: boolean | null
          mentions?: string[] | null
          message: string
          message_type?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          read_at?: string | null
          recipient_id?: string | null
          reply_count?: number | null
          sender_id: string
          team_id?: string | null
          thread_id?: string | null
        }
        Update: {
          attachments?: Json | null
          channel_id?: string | null
          created_at?: string | null
          id?: string
          is_important?: boolean | null
          is_pinned?: boolean | null
          is_read?: boolean | null
          mentions?: string[] | null
          message?: string
          message_type?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          read_at?: string | null
          recipient_id?: string | null
          reply_count?: number | null
          sender_id?: string
          team_id?: string | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_conversations: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          message: string
          message_order: number
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          message: string
          message_order: number
          role: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          message?: string
          message_order?: number
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_response_filters: {
        Row: {
          equipment_available_filter: string[] | null
          experience_level_filter: string | null
          filter_active: boolean | null
          hide_injured_exercises: boolean | null
          include_emojis: boolean | null
          max_response_length: string | null
          show_alternative_options: boolean | null
          show_only_current_phase: boolean | null
          show_research_citations: boolean | null
          show_video_links: boolean | null
          technical_terminology_level: string | null
          time_available_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          equipment_available_filter?: string[] | null
          experience_level_filter?: string | null
          filter_active?: boolean | null
          hide_injured_exercises?: boolean | null
          include_emojis?: boolean | null
          max_response_length?: string | null
          show_alternative_options?: boolean | null
          show_only_current_phase?: boolean | null
          show_research_citations?: boolean | null
          show_video_links?: boolean | null
          technical_terminology_level?: string | null
          time_available_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          equipment_available_filter?: string[] | null
          experience_level_filter?: string | null
          filter_active?: boolean | null
          hide_injured_exercises?: boolean | null
          include_emojis?: boolean | null
          max_response_length?: string | null
          show_alternative_options?: boolean | null
          show_only_current_phase?: boolean | null
          show_research_citations?: boolean | null
          show_video_links?: boolean | null
          technical_terminology_level?: string | null
          time_available_minutes?: number | null
          updated_at?: string | null
          user_id?: string
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
      chatbot_user_state: {
        Row: {
          active_injury_ids: string[] | null
          common_questions: string[] | null
          current_readiness_level: string | null
          current_training_phase: string | null
          current_training_program_id: string | null
          current_week_in_phase: number | null
          equipment_available: string[] | null
          expertise_level: string | null
          favorite_topics: string[] | null
          injury_restrictions: string[] | null
          last_updated: string | null
          latest_readiness_score: number | null
          long_term_goals: string[] | null
          preferred_response_style: string | null
          recent_performance_trends: Json | null
          short_term_goals: string[] | null
          total_conversations: number | null
          training_goal: string | null
          training_location: string | null
          trend_analysis_date: string | null
          typical_training_duration_minutes: number | null
          user_id: string
        }
        Insert: {
          active_injury_ids?: string[] | null
          common_questions?: string[] | null
          current_readiness_level?: string | null
          current_training_phase?: string | null
          current_training_program_id?: string | null
          current_week_in_phase?: number | null
          equipment_available?: string[] | null
          expertise_level?: string | null
          favorite_topics?: string[] | null
          injury_restrictions?: string[] | null
          last_updated?: string | null
          latest_readiness_score?: number | null
          long_term_goals?: string[] | null
          preferred_response_style?: string | null
          recent_performance_trends?: Json | null
          short_term_goals?: string[] | null
          total_conversations?: number | null
          training_goal?: string | null
          training_location?: string | null
          trend_analysis_date?: string | null
          typical_training_duration_minutes?: number | null
          user_id: string
        }
        Update: {
          active_injury_ids?: string[] | null
          common_questions?: string[] | null
          current_readiness_level?: string | null
          current_training_phase?: string | null
          current_training_program_id?: string | null
          current_week_in_phase?: number | null
          equipment_available?: string[] | null
          expertise_level?: string | null
          favorite_topics?: string[] | null
          injury_restrictions?: string[] | null
          last_updated?: string | null
          latest_readiness_score?: number | null
          long_term_goals?: string[] | null
          preferred_response_style?: string | null
          recent_performance_trends?: Json | null
          short_term_goals?: string[] | null
          total_conversations?: number | null
          training_goal?: string | null
          training_location?: string | null
          trend_analysis_date?: string | null
          typical_training_duration_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_user_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_activity_log: {
        Row: {
          activity_type: string
          coach_id: string | null
          created_at: string
          data: Json | null
          description: string | null
          id: string
          is_read: boolean | null
          player_id: string
          read_at: string | null
          team_id: string
          title: string
          user_id: string | null
        }
        Insert: {
          activity_type: string
          coach_id?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          is_read?: boolean | null
          player_id: string
          read_at?: string | null
          team_id: string
          title: string
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          coach_id?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          is_read?: boolean | null
          player_id?: string
          read_at?: string | null
          team_id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_activity_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_athlete_assignments: {
        Row: {
          assigned_at: string
          assignment_id: string
          athlete_id: string
          coach_id: string
        }
        Insert: {
          assigned_at?: string
          assignment_id?: string
          athlete_id: string
          coach_id: string
        }
        Update: {
          assigned_at?: string
          assignment_id?: string
          athlete_id?: string
          coach_id?: string
        }
        Relationships: []
      }
      coach_observations: {
        Row: {
          category: string | null
          coach_id: string
          content: string
          created_at: string
          followup_completed: boolean | null
          followup_notes: string | null
          game_id: string | null
          id: string
          observation_date: string
          observation_type: string
          position_group: string | null
          priority: string | null
          requires_followup: boolean | null
          sentiment: string | null
          tagged_players: string[] | null
          team_id: string
          title: string | null
          updated_at: string
          video_clip_id: string | null
          visibility: string | null
        }
        Insert: {
          category?: string | null
          coach_id: string
          content: string
          created_at?: string
          followup_completed?: boolean | null
          followup_notes?: string | null
          game_id?: string | null
          id?: string
          observation_date?: string
          observation_type: string
          position_group?: string | null
          priority?: string | null
          requires_followup?: boolean | null
          sentiment?: string | null
          tagged_players?: string[] | null
          team_id: string
          title?: string | null
          updated_at?: string
          video_clip_id?: string | null
          visibility?: string | null
        }
        Update: {
          category?: string | null
          coach_id?: string
          content?: string
          created_at?: string
          followup_completed?: boolean | null
          followup_notes?: string | null
          game_id?: string | null
          id?: string
          observation_date?: string
          observation_type?: string
          position_group?: string | null
          priority?: string | null
          requires_followup?: boolean | null
          sentiment?: string | null
          tagged_players?: string[] | null
          team_id?: string
          title?: string | null
          updated_at?: string
          video_clip_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_observations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_observations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "player_game_stats_aggregated"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "coach_observations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_observations_video_clip_id_fkey"
            columns: ["video_clip_id"]
            isOneToOne: false
            referencedRelation: "video_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_overrides: {
        Row: {
          active: boolean | null
          athlete_id: string
          coach_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          original_value: Json | null
          override_type: string
          override_value: Json | null
          reason: string | null
          starts_at: string | null
          team_id: string | null
        }
        Insert: {
          active?: boolean | null
          athlete_id: string
          coach_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          original_value?: Json | null
          override_type: string
          override_value?: Json | null
          reason?: string | null
          starts_at?: string | null
          team_id?: string | null
        }
        Update: {
          active?: boolean | null
          athlete_id?: string
          coach_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          original_value?: Json | null
          override_type?: string
          override_value?: Json | null
          reason?: string | null
          starts_at?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_overrides_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_overrides_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_overrides_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
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
      competition_readiness: {
        Row: {
          assessment_date: string
          athlete_id: string
          created_at: string | null
          id: string
          injury_status: string | null
          mental_readiness: number | null
          notes: string | null
          overall_readiness: number | null
          physical_readiness: number | null
          technical_readiness: number | null
          tournament_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assessment_date: string
          athlete_id: string
          created_at?: string | null
          id?: string
          injury_status?: string | null
          mental_readiness?: number | null
          notes?: string | null
          overall_readiness?: number | null
          physical_readiness?: number | null
          technical_readiness?: number | null
          tournament_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_date?: string
          athlete_id?: string
          created_at?: string | null
          id?: string
          injury_status?: string | null
          mental_readiness?: number | null
          notes?: string | null
          overall_readiness?: number | null
          physical_readiness?: number | null
          technical_readiness?: number | null
          tournament_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_readiness_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_readiness_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_access_log: {
        Row: {
          access_granted: boolean
          access_reason: string | null
          accessed_at: string | null
          accessor_user_id: string
          consent_type: string | null
          id: string
          resource_type: string
          target_user_id: string
          team_id: string | null
        }
        Insert: {
          access_granted: boolean
          access_reason?: string | null
          accessed_at?: string | null
          accessor_user_id: string
          consent_type?: string | null
          id?: string
          resource_type: string
          target_user_id: string
          team_id?: string | null
        }
        Update: {
          access_granted?: boolean
          access_reason?: string | null
          accessed_at?: string | null
          accessor_user_id?: string
          consent_type?: string | null
          id?: string
          resource_type?: string
          target_user_id?: string
          team_id?: string | null
        }
        Relationships: []
      }
      consent_change_log: {
        Row: {
          athlete_id: string
          change_id: string
          changed_at: string
          changed_by: string
          new_value: boolean
          previous_value: boolean
          reason: string | null
          setting_name: string
        }
        Insert: {
          athlete_id: string
          change_id?: string
          changed_at?: string
          changed_by: string
          new_value: boolean
          previous_value: boolean
          reason?: string | null
          setting_name: string
        }
        Update: {
          athlete_id?: string
          change_id?: string
          changed_at?: string
          changed_by?: string
          new_value?: boolean
          previous_value?: boolean
          reason?: string | null
          setting_name?: string
        }
        Relationships: []
      }
      consultation_reminders: {
        Row: {
          body: string
          consultation_id: string
          created_at: string | null
          error_message: string | null
          id: string
          reminder_status: string
          scheduled_for: string
          sent_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          consultation_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          reminder_status?: string
          scheduled_for: string
          sent_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          consultation_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          reminder_status?: string
          scheduled_for?: string
          sent_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_reminders_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "pending_professional_consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_summaries: {
        Row: {
          created_at: string
          goals_mentioned: Json | null
          id: string
          injuries_mentioned: Json | null
          last_referenced_at: string | null
          message_count: number
          period_end: string
          period_start: string
          preferences_learned: Json | null
          session_id: string | null
          summary_embedding: string | null
          summary_text: string
          summary_type: string
          times_referenced: number | null
          topics_discussed: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          goals_mentioned?: Json | null
          id?: string
          injuries_mentioned?: Json | null
          last_referenced_at?: string | null
          message_count?: number
          period_end: string
          period_start: string
          preferences_learned?: Json | null
          session_id?: string | null
          summary_embedding?: string | null
          summary_text: string
          summary_type: string
          times_referenced?: number | null
          topics_discussed?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          goals_mentioned?: Json | null
          id?: string
          injuries_mentioned?: Json | null
          last_referenced_at?: string | null
          message_count?: number
          period_end?: string
          period_start?: string
          preferences_learned?: Json | null
          session_id?: string | null
          summary_embedding?: string | null
          summary_text?: string
          summary_type?: string
          times_referenced?: number | null
          topics_discussed?: string[] | null
          user_id?: string
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
      daily_protocols: {
        Row: {
          actual_duration_minutes: number | null
          actual_load_au: number | null
          actual_rpe: number | null
          acwr_value: number | null
          ai_rationale: string | null
          completed_exercises: number | null
          confidence_metadata: Json | null
          evening_completed_at: string | null
          evening_status: string | null
          foam_roll_completed_at: string | null
          foam_roll_status: string | null
          generated_at: string | null
          id: string
          main_session_completed_at: string | null
          main_session_status: string | null
          morning_completed_at: string | null
          morning_status: string | null
          overall_progress: number | null
          protocol_date: string
          readiness_score: number | null
          session_notes: string | null
          total_exercises: number | null
          total_load_target_au: number | null
          training_focus: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          actual_load_au?: number | null
          actual_rpe?: number | null
          acwr_value?: number | null
          ai_rationale?: string | null
          completed_exercises?: number | null
          confidence_metadata?: Json | null
          evening_completed_at?: string | null
          evening_status?: string | null
          foam_roll_completed_at?: string | null
          foam_roll_status?: string | null
          generated_at?: string | null
          id?: string
          main_session_completed_at?: string | null
          main_session_status?: string | null
          morning_completed_at?: string | null
          morning_status?: string | null
          overall_progress?: number | null
          protocol_date: string
          readiness_score?: number | null
          session_notes?: string | null
          total_exercises?: number | null
          total_load_target_au?: number | null
          training_focus?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_duration_minutes?: number | null
          actual_load_au?: number | null
          actual_rpe?: number | null
          acwr_value?: number | null
          ai_rationale?: string | null
          completed_exercises?: number | null
          confidence_metadata?: Json | null
          evening_completed_at?: string | null
          evening_status?: string | null
          foam_roll_completed_at?: string | null
          foam_roll_status?: string | null
          generated_at?: string | null
          id?: string
          main_session_completed_at?: string | null
          main_session_status?: string | null
          morning_completed_at?: string | null
          morning_status?: string | null
          overall_progress?: number | null
          protocol_date?: string
          readiness_score?: number | null
          session_notes?: string | null
          total_exercises?: number | null
          total_load_target_au?: number | null
          training_focus?: string | null
          updated_at?: string | null
          user_id?: string
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
      daily_training_schedule: {
        Row: {
          actual_duration_minutes: number | null
          cooldown_completed: boolean | null
          created_at: string | null
          day_of_week: number | null
          foam_rolling_completed: boolean | null
          id: string
          isometrics_exercises: Json | null
          isometrics_included: boolean | null
          isometrics_total_duration_seconds: number | null
          morning_mobility_completed: boolean | null
          morning_mobility_duration_minutes: number | null
          planned_duration_minutes: number | null
          plyometrics_exercises: Json | null
          plyometrics_included: boolean | null
          plyometrics_total_contacts: number | null
          schedule_date: string
          session_completed: boolean | null
          session_focus: string[] | null
          session_notes: string | null
          session_rpe: number | null
          session_type: string | null
          updated_at: string | null
          user_id: string
          warmup_completed: boolean | null
          warmup_duration_minutes: number | null
          warmup_protocol: string | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          cooldown_completed?: boolean | null
          created_at?: string | null
          day_of_week?: number | null
          foam_rolling_completed?: boolean | null
          id?: string
          isometrics_exercises?: Json | null
          isometrics_included?: boolean | null
          isometrics_total_duration_seconds?: number | null
          morning_mobility_completed?: boolean | null
          morning_mobility_duration_minutes?: number | null
          planned_duration_minutes?: number | null
          plyometrics_exercises?: Json | null
          plyometrics_included?: boolean | null
          plyometrics_total_contacts?: number | null
          schedule_date: string
          session_completed?: boolean | null
          session_focus?: string[] | null
          session_notes?: string | null
          session_rpe?: number | null
          session_type?: string | null
          updated_at?: string | null
          user_id: string
          warmup_completed?: boolean | null
          warmup_duration_minutes?: number | null
          warmup_protocol?: string | null
        }
        Update: {
          actual_duration_minutes?: number | null
          cooldown_completed?: boolean | null
          created_at?: string | null
          day_of_week?: number | null
          foam_rolling_completed?: boolean | null
          id?: string
          isometrics_exercises?: Json | null
          isometrics_included?: boolean | null
          isometrics_total_duration_seconds?: number | null
          morning_mobility_completed?: boolean | null
          morning_mobility_duration_minutes?: number | null
          planned_duration_minutes?: number | null
          plyometrics_exercises?: Json | null
          plyometrics_included?: boolean | null
          plyometrics_total_contacts?: number | null
          schedule_date?: string
          session_completed?: boolean | null
          session_focus?: string[] | null
          session_notes?: string | null
          session_rpe?: number | null
          session_type?: string | null
          updated_at?: string | null
          user_id?: string
          warmup_completed?: boolean | null
          warmup_duration_minutes?: number | null
          warmup_protocol?: string | null
        }
        Relationships: []
      }
      daily_weather_conditions: {
        Row: {
          condition_date: string
          created_at: string | null
          cutting_training_safe: boolean | null
          feels_like_celsius: number | null
          grass_condition: string | null
          humidity_percentage: number | null
          id: string
          location_city: string | null
          location_country: string | null
          outdoor_training_safe: boolean | null
          precipitation_intensity: string | null
          precipitation_type: string | null
          safety_notes: string | null
          sprint_training_safe: boolean | null
          temperature_celsius: number | null
          track_condition: string | null
          training_recommendation: string | null
          turf_condition: string | null
          updated_at: string | null
          weather_source: string | null
          wind_speed_kmh: number | null
        }
        Insert: {
          condition_date: string
          created_at?: string | null
          cutting_training_safe?: boolean | null
          feels_like_celsius?: number | null
          grass_condition?: string | null
          humidity_percentage?: number | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          outdoor_training_safe?: boolean | null
          precipitation_intensity?: string | null
          precipitation_type?: string | null
          safety_notes?: string | null
          sprint_training_safe?: boolean | null
          temperature_celsius?: number | null
          track_condition?: string | null
          training_recommendation?: string | null
          turf_condition?: string | null
          updated_at?: string | null
          weather_source?: string | null
          wind_speed_kmh?: number | null
        }
        Update: {
          condition_date?: string
          created_at?: string | null
          cutting_training_safe?: boolean | null
          feels_like_celsius?: number | null
          grass_condition?: string | null
          humidity_percentage?: number | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          outdoor_training_safe?: boolean | null
          precipitation_intensity?: string | null
          precipitation_type?: string | null
          safety_notes?: string | null
          sprint_training_safe?: boolean | null
          temperature_celsius?: number | null
          track_condition?: string | null
          training_recommendation?: string | null
          turf_condition?: string | null
          updated_at?: string | null
          weather_source?: string | null
          wind_speed_kmh?: number | null
        }
        Relationships: []
      }
      daily_wellness_checkin: {
        Row: {
          calculated_readiness: number | null
          checkin_date: string
          created_at: string | null
          energy_level: number | null
          feeling_ill: boolean | null
          has_injury: boolean | null
          hrv_score: number | null
          hydration_yesterday: number | null
          id: string
          illness_symptoms: string | null
          injury_notes: string | null
          motivation: number | null
          muscle_soreness: number | null
          notes: string | null
          nutrition_yesterday: number | null
          resting_hr: number | null
          sleep_hours: number | null
          sleep_quality: number | null
          soreness_areas: Json | null
          stress_level: number | null
          user_id: string
        }
        Insert: {
          calculated_readiness?: number | null
          checkin_date: string
          created_at?: string | null
          energy_level?: number | null
          feeling_ill?: boolean | null
          has_injury?: boolean | null
          hrv_score?: number | null
          hydration_yesterday?: number | null
          id?: string
          illness_symptoms?: string | null
          injury_notes?: string | null
          motivation?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          nutrition_yesterday?: number | null
          resting_hr?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          soreness_areas?: Json | null
          stress_level?: number | null
          user_id: string
        }
        Update: {
          calculated_readiness?: number | null
          checkin_date?: string
          created_at?: string | null
          energy_level?: number | null
          feeling_ill?: boolean | null
          has_injury?: boolean | null
          hrv_score?: number | null
          hydration_yesterday?: number | null
          id?: string
          illness_symptoms?: string | null
          injury_notes?: string | null
          motivation?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          nutrition_yesterday?: number | null
          resting_hr?: number | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          soreness_areas?: Json | null
          stress_level?: number | null
          user_id?: string
        }
        Relationships: []
      }
      decision_ledger: {
        Row: {
          athlete_id: string
          created_at: string
          decision_basis: Json
          decision_category: string
          decision_summary: string
          decision_type: string
          id: string
          intended_duration: unknown
          made_by: string
          made_by_name: string | null
          made_by_role: string
          outcome_data: Json | null
          review_date: string
          review_notes: string | null
          review_outcome: string | null
          review_priority: string | null
          review_trigger: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          superseded_by: string | null
          supersedes: string[] | null
          team_id: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          decision_basis?: Json
          decision_category: string
          decision_summary: string
          decision_type: string
          id?: string
          intended_duration?: unknown
          made_by: string
          made_by_name?: string | null
          made_by_role: string
          outcome_data?: Json | null
          review_date: string
          review_notes?: string | null
          review_outcome?: string | null
          review_priority?: string | null
          review_trigger: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          superseded_by?: string | null
          supersedes?: string[] | null
          team_id: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          decision_basis?: Json
          decision_category?: string
          decision_summary?: string
          decision_type?: string
          id?: string
          intended_duration?: unknown
          made_by?: string
          made_by_name?: string | null
          made_by_role?: string
          outcome_data?: Json | null
          review_date?: string
          review_notes?: string | null
          review_outcome?: string | null
          review_priority?: string | null
          review_trigger?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          superseded_by?: string | null
          supersedes?: string[] | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_ledger_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "decision_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_ledger_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_review_reminders: {
        Row: {
          created_at: string
          decision_id: string
          id: string
          notification_sent: boolean | null
          notified_at: string | null
          notify_roles: string[] | null
          notify_user_ids: string[] | null
          reminder_type: string
          scheduled_for: string
          status: string | null
        }
        Insert: {
          created_at?: string
          decision_id: string
          id?: string
          notification_sent?: boolean | null
          notified_at?: string | null
          notify_roles?: string[] | null
          notify_user_ids?: string[] | null
          reminder_type: string
          scheduled_for: string
          status?: string | null
        }
        Update: {
          created_at?: string
          decision_id?: string
          id?: string
          notification_sent?: boolean | null
          notified_at?: string | null
          notify_roles?: string[] | null
          notify_user_ids?: string[] | null
          reminder_type?: string
          scheduled_for?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_review_reminders_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decision_ledger"
            referencedColumns: ["id"]
          },
        ]
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
      depth_chart_entries: {
        Row: {
          created_at: string
          depth_order: number
          effective_from: string | null
          effective_until: string | null
          id: string
          notes: string | null
          player_id: string
          position_code: string
          special_designations: string[] | null
          status: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          depth_order?: number
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          notes?: string | null
          player_id: string
          position_code: string
          special_designations?: string[] | null
          status?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          depth_order?: number
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          notes?: string | null
          player_id?: string
          position_code?: string
          special_designations?: string[] | null
          status?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "depth_chart_entries_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "depth_chart_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      depth_chart_history: {
        Row: {
          change_type: string
          changed_by: string
          created_at: string
          id: string
          new_depth: number | null
          player_id: string
          position_code: string
          previous_depth: number | null
          reason: string | null
          template_id: string
        }
        Insert: {
          change_type: string
          changed_by: string
          created_at?: string
          id?: string
          new_depth?: number | null
          player_id: string
          position_code: string
          previous_depth?: number | null
          reason?: string | null
          template_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string
          created_at?: string
          id?: string
          new_depth?: number | null
          player_id?: string
          position_code?: string
          previous_depth?: number | null
          reason?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "depth_chart_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "depth_chart_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      depth_chart_templates: {
        Row: {
          chart_type: string
          created_at: string
          created_by: string
          description: string | null
          display_layout: Json | null
          formation_name: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          positions: Json
          team_id: string
          updated_at: string
        }
        Insert: {
          chart_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          display_layout?: Json | null
          formation_name?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          positions?: Json
          team_id: string
          updated_at?: string
        }
        Update: {
          chart_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          display_layout?: Json | null
          formation_name?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          positions?: Json
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "depth_chart_templates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
      emergency_medical_records: {
        Row: {
          created_at: string
          disclosed_to: string[] | null
          disclosure_reason: string | null
          event_date: string
          event_type: string
          id: string
          location_data: Json | null
          medical_data: Json
          retention_expires_at: string
          user_email_hash: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          disclosed_to?: string[] | null
          disclosure_reason?: string | null
          event_date?: string
          event_type: string
          id?: string
          location_data?: Json | null
          medical_data: Json
          retention_expires_at?: string
          user_email_hash?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          disclosed_to?: string[] | null
          disclosure_reason?: string | null
          event_date?: string
          event_type?: string
          id?: string
          location_data?: Json | null
          medical_data?: Json
          retention_expires_at?: string
          user_email_hash?: string | null
          user_id?: string | null
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
      equipment_assignments: {
        Row: {
          actual_return_date: string | null
          assigned_by: string | null
          assigned_date: string | null
          created_at: string | null
          equipment_item_id: string
          expected_return_date: string | null
          id: string
          notes: string | null
          purpose: string | null
          quantity: number | null
          status: string | null
          team_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_return_date?: string | null
          assigned_by?: string | null
          assigned_date?: string | null
          created_at?: string | null
          equipment_item_id: string
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          quantity?: number | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_return_date?: string | null
          assigned_by?: string | null
          assigned_date?: string | null
          created_at?: string | null
          equipment_item_id?: string
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          quantity?: number | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_assignments_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_checkout_log: {
        Row: {
          actual_return_date: string | null
          checked_out_by: string | null
          checkout_date: string
          checkout_reason: string | null
          condition_at_checkout: string | null
          condition_at_return: string | null
          created_at: string
          damage_description: string | null
          damage_reported: boolean | null
          event_id: string | null
          expected_return_date: string | null
          game_id: string | null
          id: string
          inventory_item_id: string
          notes: string | null
          player_id: string
          quantity: number | null
          returned_to: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actual_return_date?: string | null
          checked_out_by?: string | null
          checkout_date?: string
          checkout_reason?: string | null
          condition_at_checkout?: string | null
          condition_at_return?: string | null
          created_at?: string
          damage_description?: string | null
          damage_reported?: boolean | null
          event_id?: string | null
          expected_return_date?: string | null
          game_id?: string | null
          id?: string
          inventory_item_id: string
          notes?: string | null
          player_id: string
          quantity?: number | null
          returned_to?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actual_return_date?: string | null
          checked_out_by?: string | null
          checkout_date?: string
          checkout_reason?: string | null
          condition_at_checkout?: string | null
          condition_at_return?: string | null
          created_at?: string
          damage_description?: string | null
          damage_reported?: boolean | null
          event_id?: string | null
          expected_return_date?: string | null
          game_id?: string | null
          id?: string
          inventory_item_id?: string
          notes?: string | null
          player_id?: string
          quantity?: number | null
          returned_to?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_checkout_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "team_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checkout_log_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checkout_log_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "player_game_stats_aggregated"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "equipment_checkout_log_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checkout_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_inventory: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          available_quantity: number | null
          color: string | null
          condition: string | null
          condition_notes: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_unique_item: boolean | null
          item_code: string | null
          item_name: string
          item_type: string
          notes: string | null
          number: number | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          size: string | null
          status: string | null
          storage_location: string | null
          team_id: string
          total_quantity: number | null
          updated_at: string
          vendor: string | null
          warranty_until: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          available_quantity?: number | null
          color?: string | null
          condition?: string | null
          condition_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_unique_item?: boolean | null
          item_code?: string | null
          item_name: string
          item_type: string
          notes?: string | null
          number?: number | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          size?: string | null
          status?: string | null
          storage_location?: string | null
          team_id: string
          total_quantity?: number | null
          updated_at?: string
          vendor?: string | null
          warranty_until?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          available_quantity?: number | null
          color?: string | null
          condition?: string | null
          condition_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_unique_item?: boolean | null
          item_code?: string | null
          item_name?: string
          item_type?: string
          notes?: string | null
          number?: number | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          size?: string | null
          status?: string | null
          storage_location?: string | null
          team_id?: string
          total_quantity?: number | null
          updated_at?: string
          vendor?: string | null
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_inventory_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_items: {
        Row: {
          brand: string | null
          category: string
          condition: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          quantity: number | null
          quantity_available: number | null
          serial_number: string | null
          status: string | null
          storage_location: string | null
          team_id: string | null
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          brand?: string | null
          category: string
          condition?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          quantity_available?: number | null
          serial_number?: string | null
          status?: string | null
          storage_location?: string | null
          team_id?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          brand?: string | null
          category?: string
          condition?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          quantity_available?: number | null
          serial_number?: string | null
          status?: string | null
          storage_location?: string | null
          team_id?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_maintenance_log: {
        Row: {
          completed_date: string | null
          condition_after: string | null
          condition_before: string | null
          cost: number | null
          created_at: string
          description: string
          id: string
          inventory_item_id: string
          maintenance_date: string
          maintenance_type: string
          notes: string | null
          performed_by: string | null
          status: string | null
          vendor: string | null
        }
        Insert: {
          completed_date?: string | null
          condition_after?: string | null
          condition_before?: string | null
          cost?: number | null
          created_at?: string
          description: string
          id?: string
          inventory_item_id: string
          maintenance_date?: string
          maintenance_type: string
          notes?: string | null
          performed_by?: string | null
          status?: string | null
          vendor?: string | null
        }
        Update: {
          completed_date?: string | null
          condition_after?: string | null
          condition_before?: string | null
          cost?: number | null
          created_at?: string
          description?: string
          id?: string
          inventory_item_id?: string
          maintenance_date?: string
          maintenance_type?: string
          notes?: string | null
          performed_by?: string | null
          status?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_log_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_inventory"
            referencedColumns: ["id"]
          },
        ]
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
      equipment_requests: {
        Row: {
          created_at: string
          fulfilled_at: string | null
          fulfilled_item_id: string | null
          id: string
          item_type: string
          needed_by_date: string | null
          player_id: string
          preferred_number: number | null
          quantity: number | null
          request_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          size: string | null
          status: string | null
          team_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_item_id?: string | null
          id?: string
          item_type: string
          needed_by_date?: string | null
          player_id: string
          preferred_number?: number | null
          quantity?: number | null
          request_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size?: string | null
          status?: string | null
          team_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_item_id?: string | null
          id?: string
          item_type?: string
          needed_by_date?: string | null
          player_id?: string
          preferred_number?: number | null
          quantity?: number | null
          request_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          size?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_requests_fulfilled_item_id_fkey"
            columns: ["fulfilled_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      execution_logs: {
        Row: {
          athlete_id: string
          duration_minutes: number | null
          exercise_id: string | null
          exercise_name: string | null
          load_kg: number | null
          log_id: string
          logged_at: string
          notes: string | null
          reps_completed: number | null
          rpe: number | null
          session_id: string
          session_version: number
          sets_completed: number | null
        }
        Insert: {
          athlete_id: string
          duration_minutes?: number | null
          exercise_id?: string | null
          exercise_name?: string | null
          load_kg?: number | null
          log_id?: string
          logged_at?: string
          notes?: string | null
          reps_completed?: number | null
          rpe?: number | null
          session_id: string
          session_version: number
          sets_completed?: number | null
        }
        Update: {
          athlete_id?: string
          duration_minutes?: number | null
          exercise_id?: string | null
          exercise_name?: string | null
          load_kg?: number | null
          log_id?: string
          logged_at?: string
          notes?: string | null
          reps_completed?: number | null
          rpe?: number | null
          session_id?: string
          session_version?: number
          sets_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          coach_feedback: string | null
          completed: boolean | null
          distance_meters: number | null
          duration_seconds: number | null
          exercise_category: string | null
          exercise_id: string
          exercise_name: string | null
          form_quality: number | null
          id: string
          logged_at: string | null
          notes: string | null
          pain_during_exercise: boolean | null
          pain_level: number | null
          pain_location: string | null
          perceived_effort: number | null
          range_of_motion: string | null
          reason_incomplete: string | null
          reps_completed: number | null
          resistance_level: string | null
          rest_before_set_seconds: number | null
          session_id: string | null
          set_number: number
          tempo: string | null
          user_id: string
          video_url: string | null
          weight_kg: number | null
        }
        Insert: {
          coach_feedback?: string | null
          completed?: boolean | null
          distance_meters?: number | null
          duration_seconds?: number | null
          exercise_category?: string | null
          exercise_id: string
          exercise_name?: string | null
          form_quality?: number | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          pain_during_exercise?: boolean | null
          pain_level?: number | null
          pain_location?: string | null
          perceived_effort?: number | null
          range_of_motion?: string | null
          reason_incomplete?: string | null
          reps_completed?: number | null
          resistance_level?: string | null
          rest_before_set_seconds?: number | null
          session_id?: string | null
          set_number: number
          tempo?: string | null
          user_id: string
          video_url?: string | null
          weight_kg?: number | null
        }
        Update: {
          coach_feedback?: string | null
          completed?: boolean | null
          distance_meters?: number | null
          duration_seconds?: number | null
          exercise_category?: string | null
          exercise_id?: string
          exercise_name?: string | null
          form_quality?: number | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          pain_during_exercise?: boolean | null
          pain_level?: number | null
          pain_location?: string | null
          perceived_effort?: number | null
          range_of_motion?: string | null
          reason_incomplete?: string | null
          reps_completed?: number | null
          resistance_level?: string | null
          rest_before_set_seconds?: number | null
          session_id?: string | null
          set_number?: number
          tempo?: string | null
          user_id?: string
          video_url?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_progressions: {
        Row: {
          acwr_adjustment_factor: number | null
          created_at: string | null
          exercise_id: string
          id: string
          increment_value: number | null
          max_value: number | null
          min_value: number | null
          progression_type: string
          requires_completion: boolean | null
          reset_threshold: number | null
          updated_at: string | null
        }
        Insert: {
          acwr_adjustment_factor?: number | null
          created_at?: string | null
          exercise_id: string
          id?: string
          increment_value?: number | null
          max_value?: number | null
          min_value?: number | null
          progression_type: string
          requires_completion?: boolean | null
          reset_threshold?: number | null
          updated_at?: string | null
        }
        Update: {
          acwr_adjustment_factor?: number | null
          created_at?: string | null
          exercise_id?: string
          id?: string
          increment_value?: number | null
          max_value?: number | null
          min_value?: number | null
          progression_type?: string
          requires_completion?: boolean | null
          reset_threshold?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_progressions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_research_citations: {
        Row: {
          authors: string[]
          citation_key: string
          created_at: string | null
          doi: string | null
          evidence_level: string | null
          id: string
          journal: string | null
          key_findings: string[] | null
          pmid: string | null
          population_type: string | null
          practical_applications: string[] | null
          publication_year: number
          related_exercises: string[] | null
          sample_size: number | null
          study_type: string | null
          title: string
        }
        Insert: {
          authors: string[]
          citation_key: string
          created_at?: string | null
          doi?: string | null
          evidence_level?: string | null
          id?: string
          journal?: string | null
          key_findings?: string[] | null
          pmid?: string | null
          population_type?: string | null
          practical_applications?: string[] | null
          publication_year: number
          related_exercises?: string[] | null
          sample_size?: number | null
          study_type?: string | null
          title: string
        }
        Update: {
          authors?: string[]
          citation_key?: string
          created_at?: string | null
          doi?: string | null
          evidence_level?: string | null
          id?: string
          journal?: string | null
          key_findings?: string[] | null
          pmid?: string | null
          population_type?: string | null
          practical_applications?: string[] | null
          publication_year?: number
          related_exercises?: string[] | null
          sample_size?: number | null
          study_type?: string | null
          title?: string
        }
        Relationships: []
      }
      exercise_substitutions: {
        Row: {
          alternative_name: string | null
          body_part_affected: string
          coaching_cues: string[] | null
          contraindicated_exercise_id: string | null
          created_at: string | null
          exercise_name: string | null
          id: string
          injury_type: string
          intensity_adjustment: number | null
          modification_description: string | null
          movement_to_avoid: string | null
          recommended_alternative_id: string | null
          rom_restriction: string | null
          safety_notes: string | null
          volume_adjustment: number | null
        }
        Insert: {
          alternative_name?: string | null
          body_part_affected: string
          coaching_cues?: string[] | null
          contraindicated_exercise_id?: string | null
          created_at?: string | null
          exercise_name?: string | null
          id?: string
          injury_type: string
          intensity_adjustment?: number | null
          modification_description?: string | null
          movement_to_avoid?: string | null
          recommended_alternative_id?: string | null
          rom_restriction?: string | null
          safety_notes?: string | null
          volume_adjustment?: number | null
        }
        Update: {
          alternative_name?: string | null
          body_part_affected?: string
          coaching_cues?: string[] | null
          contraindicated_exercise_id?: string | null
          created_at?: string | null
          exercise_name?: string | null
          id?: string
          injury_type?: string
          intensity_adjustment?: number | null
          modification_description?: string | null
          movement_to_avoid?: string | null
          recommended_alternative_id?: string | null
          rom_restriction?: string | null
          safety_notes?: string | null
          volume_adjustment?: number | null
        }
        Relationships: []
      }
      exercisedb_exercises: {
        Row: {
          applicable_positions: string[] | null
          approved_at: string | null
          approved_by: string | null
          body_part: string
          coaching_cues: string[] | null
          common_mistakes: string[] | null
          created_at: string | null
          difficulty_level: string | null
          equipment: string
          exercise_registry_id: string | null
          external_id: string
          ff_category: string | null
          ff_training_focus: string[] | null
          flag_football_relevance: number | null
          gif_url: string | null
          id: string
          imported_at: string | null
          instructions: string[] | null
          is_active: boolean | null
          is_approved: boolean | null
          is_curated: boolean | null
          last_synced_at: string | null
          name: string
          progression_tips: string[] | null
          recommended_reps: string | null
          recommended_rest_seconds: number | null
          recommended_sets: number | null
          relevance_notes: string | null
          safety_notes: string[] | null
          secondary_muscles: string[] | null
          target_muscle: string
          updated_at: string | null
        }
        Insert: {
          applicable_positions?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          body_part: string
          coaching_cues?: string[] | null
          common_mistakes?: string[] | null
          created_at?: string | null
          difficulty_level?: string | null
          equipment: string
          exercise_registry_id?: string | null
          external_id: string
          ff_category?: string | null
          ff_training_focus?: string[] | null
          flag_football_relevance?: number | null
          gif_url?: string | null
          id?: string
          imported_at?: string | null
          instructions?: string[] | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_curated?: boolean | null
          last_synced_at?: string | null
          name: string
          progression_tips?: string[] | null
          recommended_reps?: string | null
          recommended_rest_seconds?: number | null
          recommended_sets?: number | null
          relevance_notes?: string | null
          safety_notes?: string[] | null
          secondary_muscles?: string[] | null
          target_muscle: string
          updated_at?: string | null
        }
        Update: {
          applicable_positions?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          body_part?: string
          coaching_cues?: string[] | null
          common_mistakes?: string[] | null
          created_at?: string | null
          difficulty_level?: string | null
          equipment?: string
          exercise_registry_id?: string | null
          external_id?: string
          ff_category?: string | null
          ff_training_focus?: string[] | null
          flag_football_relevance?: number | null
          gif_url?: string | null
          id?: string
          imported_at?: string | null
          instructions?: string[] | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_curated?: boolean | null
          last_synced_at?: string | null
          name?: string
          progression_tips?: string[] | null
          recommended_reps?: string | null
          recommended_rest_seconds?: number | null
          recommended_sets?: number | null
          relevance_notes?: string | null
          safety_notes?: string[] | null
          secondary_muscles?: string[] | null
          target_muscle?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exercisedb_import_logs: {
        Row: {
          body_parts_filter: string[] | null
          completed_at: string | null
          created_at: string | null
          equipment_filter: string[] | null
          error_details: Json | null
          error_message: string | null
          id: string
          import_type: string
          started_at: string | null
          status: string
          total_errors: number | null
          total_fetched: number | null
          total_imported: number | null
          total_skipped: number | null
          total_updated: number | null
          triggered_by: string | null
        }
        Insert: {
          body_parts_filter?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          equipment_filter?: string[] | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          import_type: string
          started_at?: string | null
          status?: string
          total_errors?: number | null
          total_fetched?: number | null
          total_imported?: number | null
          total_skipped?: number | null
          total_updated?: number | null
          triggered_by?: string | null
        }
        Update: {
          body_parts_filter?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          equipment_filter?: string[] | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          import_type?: string
          started_at?: string | null
          status?: string
          total_errors?: number | null
          total_fetched?: number | null
          total_imported?: number | null
          total_skipped?: number | null
          total_updated?: number | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          active: boolean | null
          category: string
          coaching_cues: string[] | null
          compensation_text: string | null
          created_at: string | null
          default_duration_seconds: number | null
          default_hold_seconds: number | null
          default_reps: number | null
          default_sets: number | null
          description: string | null
          difficulty_level: string | null
          equipment_needed: string[] | null
          feel_text: string | null
          how_text: string | null
          id: string
          image_url: string | null
          instructions: string[] | null
          is_compound: boolean | null
          is_high_intensity: boolean | null
          is_plyometric: boolean | null
          is_unilateral: boolean | null
          load_contribution_au: number | null
          muscle_groups: string[] | null
          name: string
          position_specific: string[] | null
          slug: string | null
          subcategory: string | null
          thumbnail_url: string | null
          updated_at: string | null
          video_duration_seconds: number | null
          video_id: string | null
          video_url: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          coaching_cues?: string[] | null
          compensation_text?: string | null
          created_at?: string | null
          default_duration_seconds?: number | null
          default_hold_seconds?: number | null
          default_reps?: number | null
          default_sets?: number | null
          description?: string | null
          difficulty_level?: string | null
          equipment_needed?: string[] | null
          feel_text?: string | null
          how_text?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          is_compound?: boolean | null
          is_high_intensity?: boolean | null
          is_plyometric?: boolean | null
          is_unilateral?: boolean | null
          load_contribution_au?: number | null
          muscle_groups?: string[] | null
          name: string
          position_specific?: string[] | null
          slug?: string | null
          subcategory?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_id?: string | null
          video_url?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          coaching_cues?: string[] | null
          compensation_text?: string | null
          created_at?: string | null
          default_duration_seconds?: number | null
          default_hold_seconds?: number | null
          default_reps?: number | null
          default_sets?: number | null
          description?: string | null
          difficulty_level?: string | null
          equipment_needed?: string[] | null
          feel_text?: string | null
          how_text?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          is_compound?: boolean | null
          is_high_intensity?: boolean | null
          is_plyometric?: boolean | null
          is_unilateral?: boolean | null
          load_contribution_au?: number | null
          muscle_groups?: string[] | null
          name?: string
          position_specific?: string[] | null
          slug?: string | null
          subcategory?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_id?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      ff_exercise_mappings: {
        Row: {
          applicable_positions: string[] | null
          auto_curate: boolean | null
          body_part: string | null
          created_at: string | null
          default_relevance_score: number | null
          equipment: string | null
          ff_category: string
          ff_training_focus: string[]
          id: string
          notes: string | null
          priority_order: number | null
          target_muscle: string | null
        }
        Insert: {
          applicable_positions?: string[] | null
          auto_curate?: boolean | null
          body_part?: string | null
          created_at?: string | null
          default_relevance_score?: number | null
          equipment?: string | null
          ff_category: string
          ff_training_focus: string[]
          id?: string
          notes?: string | null
          priority_order?: number | null
          target_muscle?: string | null
        }
        Update: {
          applicable_positions?: string[] | null
          auto_curate?: boolean | null
          body_part?: string | null
          created_at?: string | null
          default_relevance_score?: number | null
          equipment?: string | null
          ff_category?: string
          ff_training_focus?: string[]
          id?: string
          notes?: string | null
          priority_order?: number | null
          target_muscle?: string | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      game_day_readiness: {
        Row: {
          acwr_at_checkin: number | null
          check_in_time: string | null
          confidence_level: number | null
          created_at: string | null
          energy_level: number | null
          game_id: string | null
          game_info: Json | null
          hydration_level: number | null
          id: string
          mental_focus: number | null
          muscle_soreness: number | null
          notes: string | null
          readiness_score: number | null
          sleep_quality: number | null
          user_id: string
        }
        Insert: {
          acwr_at_checkin?: number | null
          check_in_time?: string | null
          confidence_level?: number | null
          created_at?: string | null
          energy_level?: number | null
          game_id?: string | null
          game_info?: Json | null
          hydration_level?: number | null
          id?: string
          mental_focus?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          readiness_score?: number | null
          sleep_quality?: number | null
          user_id: string
        }
        Update: {
          acwr_at_checkin?: number | null
          check_in_time?: string | null
          confidence_level?: number | null
          created_at?: string | null
          energy_level?: number | null
          game_id?: string | null
          game_info?: Json | null
          hydration_level?: number | null
          id?: string
          mental_focus?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          readiness_score?: number | null
          sleep_quality?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_day_readiness_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_day_readiness_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "player_game_stats_aggregated"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "game_day_readiness_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      game_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          game_id: string
          game_time: string | null
          id: string
          player_id: string | null
          quarter: number | null
          recorded_by: string | null
          recorded_by_role: string | null
          yards: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          game_id: string
          game_time?: string | null
          id?: string
          player_id?: string | null
          quarter?: number | null
          recorded_by?: string | null
          recorded_by_role?: string | null
          yards?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          game_id?: string
          game_time?: string | null
          id?: string
          player_id?: string | null
          quarter?: number | null
          recorded_by?: string | null
          recorded_by_role?: string | null
          yards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "player_game_stats_aggregated"
            referencedColumns: ["game_id"]
          },
        ]
      }
      game_official_assignments: {
        Row: {
          check_in_time: string | null
          checked_in: boolean | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          decline_reason: string | null
          game_id: string
          id: string
          invited_at: string | null
          notes: string | null
          official_id: string
          paid_at: string | null
          pay_amount: number | null
          payment_status: string | null
          performance_notes: string | null
          performance_rating: number | null
          position: string
          rated_by: string | null
          responded_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          check_in_time?: string | null
          checked_in?: boolean | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          decline_reason?: string | null
          game_id: string
          id?: string
          invited_at?: string | null
          notes?: string | null
          official_id: string
          paid_at?: string | null
          pay_amount?: number | null
          payment_status?: string | null
          performance_notes?: string | null
          performance_rating?: number | null
          position?: string
          rated_by?: string | null
          responded_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          check_in_time?: string | null
          checked_in?: boolean | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          decline_reason?: string | null
          game_id?: string
          id?: string
          invited_at?: string | null
          notes?: string | null
          official_id?: string
          paid_at?: string | null
          pay_amount?: number | null
          payment_status?: string | null
          performance_notes?: string | null
          performance_rating?: number | null
          position?: string
          rated_by?: string | null
          responded_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_official_assignments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_official_assignments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "player_game_stats_aggregated"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "game_official_assignments_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      game_participations: {
        Row: {
          created_at: string | null
          game_id: string
          id: string
          minutes_played: number | null
          notes: string | null
          player_id: string
          position_played: string | null
          stats: Json | null
          status: string
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          game_id: string
          id?: string
          minutes_played?: number | null
          notes?: string | null
          player_id: string
          position_played?: string | null
          stats?: Json | null
          status?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: string
          id?: string
          minutes_played?: number | null
          notes?: string | null
          player_id?: string
          position_played?: string | null
          stats?: Json | null
          status?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_participations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "player_game_stats_aggregated"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "game_participations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_plans: {
        Row: {
          created_at: string
          created_by: string
          defensive_gameplan: Json | null
          description: string | null
          featured_plays: string[] | null
          game_date: string | null
          game_id: string | null
          id: string
          individual_assignments: Json | null
          key_matchups: string | null
          offensive_gameplan: Json | null
          opponent_name: string | null
          opponent_tendencies: string | null
          plan_date: string | null
          shared_at: string | null
          special_teams_gameplan: Json | null
          status: string | null
          team_focus_points: string[] | null
          team_id: string
          title: string
          updated_at: string
          week_number: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          defensive_gameplan?: Json | null
          description?: string | null
          featured_plays?: string[] | null
          game_date?: string | null
          game_id?: string | null
          id?: string
          individual_assignments?: Json | null
          key_matchups?: string | null
          offensive_gameplan?: Json | null
          opponent_name?: string | null
          opponent_tendencies?: string | null
          plan_date?: string | null
          shared_at?: string | null
          special_teams_gameplan?: Json | null
          status?: string | null
          team_focus_points?: string[] | null
          team_id: string
          title: string
          updated_at?: string
          week_number?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          defensive_gameplan?: Json | null
          description?: string | null
          featured_plays?: string[] | null
          game_date?: string | null
          game_id?: string | null
          id?: string
          individual_assignments?: Json | null
          key_matchups?: string | null
          offensive_gameplan?: Json | null
          opponent_name?: string | null
          opponent_tendencies?: string | null
          plan_date?: string | null
          shared_at?: string | null
          special_teams_gameplan?: Json | null
          status?: string | null
          team_focus_points?: string[] | null
          team_id?: string
          title?: string
          updated_at?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_plans_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_plans_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "player_game_stats_aggregated"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "game_plans_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_plays: {
        Row: {
          ball_carrier_id: string | null
          created_at: string | null
          defender_id: string | null
          distance: number | null
          down: number | null
          drop_reason: string | null
          drop_severity: string | null
          field_position: number | null
          game_id: string
          game_time: string | null
          id: string
          is_drop: boolean | null
          is_successful: boolean | null
          miss_reason: string | null
          outcome: string | null
          play_type: string
          player_id: string
          quarter: number | null
          quarterback_id: string | null
          receiver_id: string | null
          route_type: string | null
          updated_at: string | null
          yards_gained: number | null
        }
        Insert: {
          ball_carrier_id?: string | null
          created_at?: string | null
          defender_id?: string | null
          distance?: number | null
          down?: number | null
          drop_reason?: string | null
          drop_severity?: string | null
          field_position?: number | null
          game_id: string
          game_time?: string | null
          id?: string
          is_drop?: boolean | null
          is_successful?: boolean | null
          miss_reason?: string | null
          outcome?: string | null
          play_type: string
          player_id: string
          quarter?: number | null
          quarterback_id?: string | null
          receiver_id?: string | null
          route_type?: string | null
          updated_at?: string | null
          yards_gained?: number | null
        }
        Update: {
          ball_carrier_id?: string | null
          created_at?: string | null
          defender_id?: string | null
          distance?: number | null
          down?: number | null
          drop_reason?: string | null
          drop_severity?: string | null
          field_position?: number | null
          game_id?: string
          game_time?: string | null
          id?: string
          is_drop?: boolean | null
          is_successful?: boolean | null
          miss_reason?: string | null
          outcome?: string | null
          play_type?: string
          player_id?: string
          quarter?: number | null
          quarterback_id?: string | null
          receiver_id?: string | null
          route_type?: string | null
          updated_at?: string | null
          yards_gained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_plays_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_plays_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "player_game_stats_aggregated"
            referencedColumns: ["game_id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string | null
          created_by: string | null
          game_date: string
          game_type: string | null
          home_away: string | null
          id: string
          location: string | null
          notes: string | null
          opponent_name: string
          opponent_score: number | null
          opponent_team_id: string | null
          our_score: number | null
          owner_type: string | null
          player_owner_id: string | null
          status: string | null
          team_id: string | null
          updated_at: string | null
          visibility_scope: string | null
          weather_conditions: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          game_date: string
          game_type?: string | null
          home_away?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          opponent_name: string
          opponent_score?: number | null
          opponent_team_id?: string | null
          our_score?: number | null
          owner_type?: string | null
          player_owner_id?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          visibility_scope?: string | null
          weather_conditions?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          game_date?: string
          game_type?: string | null
          home_away?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          opponent_name?: string
          opponent_score?: number | null
          opponent_team_id?: string | null
          our_score?: number | null
          owner_type?: string | null
          player_owner_id?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          visibility_scope?: string | null
          weather_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "games_opponent_team_id_fkey"
            columns: ["opponent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_consent: {
        Row: {
          ai_recommendations_consent: boolean
          coach_data_sharing_consent: boolean
          consent_version: string
          consented_at: string
          data_collection_consent: boolean
          id: string
          ip_address: unknown
          performance_tracking_consent: boolean
          research_data_consent: boolean
          updated_at: string
          user_agent: string | null
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          ai_recommendations_consent?: boolean
          coach_data_sharing_consent?: boolean
          consent_version?: string
          consented_at?: string
          data_collection_consent?: boolean
          id?: string
          ip_address?: unknown
          performance_tracking_consent?: boolean
          research_data_consent?: boolean
          updated_at?: string
          user_agent?: string | null
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          ai_recommendations_consent?: boolean
          coach_data_sharing_consent?: boolean
          consent_version?: string
          consented_at?: string
          data_collection_consent?: boolean
          id?: string
          ip_address?: unknown
          performance_tracking_consent?: boolean
          research_data_consent?: boolean
          updated_at?: string
          user_agent?: string | null
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      gdpr_data_processing_log: {
        Row: {
          completed_at: string | null
          data_categories: string[] | null
          description: string | null
          id: string
          notes: string | null
          processed_by: string | null
          processing_type: string
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          data_categories?: string[] | null
          description?: string | null
          id?: string
          notes?: string | null
          processed_by?: string | null
          processing_type: string
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          data_categories?: string[] | null
          description?: string | null
          id?: string
          notes?: string | null
          processed_by?: string | null
          processing_type?: string
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_progress_updates: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          new_progress: number | null
          notes: string | null
          previous_progress: number | null
          update_type: string
          updated_by: string
          value_recorded: number | null
          video_clip_id: string | null
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          new_progress?: number | null
          notes?: string | null
          previous_progress?: number | null
          update_type: string
          updated_by: string
          value_recorded?: number | null
          video_clip_id?: string | null
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          new_progress?: number | null
          notes?: string | null
          previous_progress?: number | null
          update_type?: string
          updated_by?: string
          value_recorded?: number | null
          video_clip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_progress_updates_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "player_development_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_progress_updates_video_clip_id_fkey"
            columns: ["video_clip_id"]
            isOneToOne: false
            referencedRelation: "video_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      hrv_readings: {
        Row: {
          awake_minutes: number | null
          created_at: string | null
          deep_sleep_minutes: number | null
          device_type: string | null
          hrv_rmssd: number | null
          hrv_sdnn: number | null
          id: string
          light_sleep_minutes: number | null
          reading_date: string
          reading_time: string | null
          recovery_score: number | null
          rem_sleep_minutes: number | null
          resting_heart_rate: number | null
          sleep_duration_minutes: number | null
          sleep_efficiency_percentage: number | null
          strain_score: number | null
          sync_source: string | null
          training_recommendation: string | null
          user_id: string
        }
        Insert: {
          awake_minutes?: number | null
          created_at?: string | null
          deep_sleep_minutes?: number | null
          device_type?: string | null
          hrv_rmssd?: number | null
          hrv_sdnn?: number | null
          id?: string
          light_sleep_minutes?: number | null
          reading_date: string
          reading_time?: string | null
          recovery_score?: number | null
          rem_sleep_minutes?: number | null
          resting_heart_rate?: number | null
          sleep_duration_minutes?: number | null
          sleep_efficiency_percentage?: number | null
          strain_score?: number | null
          sync_source?: string | null
          training_recommendation?: string | null
          user_id: string
        }
        Update: {
          awake_minutes?: number | null
          created_at?: string | null
          deep_sleep_minutes?: number | null
          device_type?: string | null
          hrv_rmssd?: number | null
          hrv_sdnn?: number | null
          id?: string
          light_sleep_minutes?: number | null
          reading_date?: string
          reading_time?: string | null
          recovery_score?: number | null
          rem_sleep_minutes?: number | null
          resting_heart_rate?: number | null
          sleep_duration_minutes?: number | null
          sleep_efficiency_percentage?: number | null
          strain_score?: number | null
          sync_source?: string | null
          training_recommendation?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hydration_logs: {
        Row: {
          context: string | null
          created_at: string | null
          fluid_ml: number
          fluid_type: string | null
          id: string
          log_date: string
          log_time: string | null
          notes: string | null
          potassium_mg: number | null
          sodium_mg: number | null
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          fluid_ml: number
          fluid_type?: string | null
          id?: string
          log_date?: string
          log_time?: string | null
          notes?: string | null
          potassium_mg?: number | null
          sodium_mg?: number | null
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string | null
          fluid_ml?: number
          fluid_type?: string | null
          id?: string
          log_date?: string
          log_time?: string | null
          notes?: string | null
          potassium_mg?: number | null
          sodium_mg?: number | null
          user_id?: string
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
      injuries: {
        Row: {
          activity_restrictions: string[] | null
          actual_recovery_date: string | null
          body_part: string
          cleared_activities: string[] | null
          created_at: string | null
          diagnosis: string | null
          diagnosis_date: string | null
          exercises_to_avoid: string[] | null
          expected_recovery_date: string | null
          game_id: string | null
          id: string
          injury_date: string
          injury_type: string
          is_confidential: boolean | null
          mechanism_of_injury: string | null
          medical_facility: string | null
          medical_notes: string | null
          medications: string[] | null
          notes: string | null
          occurred_during: string | null
          pain_level: number | null
          recovery_percentage: number | null
          reported_by: string | null
          severity: string | null
          shared_with_team: boolean | null
          side: string | null
          status: string | null
          training_session_id: string | null
          treating_physician: string | null
          treatment_plan: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_restrictions?: string[] | null
          actual_recovery_date?: string | null
          body_part: string
          cleared_activities?: string[] | null
          created_at?: string | null
          diagnosis?: string | null
          diagnosis_date?: string | null
          exercises_to_avoid?: string[] | null
          expected_recovery_date?: string | null
          game_id?: string | null
          id?: string
          injury_date?: string
          injury_type: string
          is_confidential?: boolean | null
          mechanism_of_injury?: string | null
          medical_facility?: string | null
          medical_notes?: string | null
          medications?: string[] | null
          notes?: string | null
          occurred_during?: string | null
          pain_level?: number | null
          recovery_percentage?: number | null
          reported_by?: string | null
          severity?: string | null
          shared_with_team?: boolean | null
          side?: string | null
          status?: string | null
          training_session_id?: string | null
          treating_physician?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_restrictions?: string[] | null
          actual_recovery_date?: string | null
          body_part?: string
          cleared_activities?: string[] | null
          created_at?: string | null
          diagnosis?: string | null
          diagnosis_date?: string | null
          exercises_to_avoid?: string[] | null
          expected_recovery_date?: string | null
          game_id?: string | null
          id?: string
          injury_date?: string
          injury_type?: string
          is_confidential?: boolean | null
          mechanism_of_injury?: string | null
          medical_facility?: string | null
          medical_notes?: string | null
          medications?: string[] | null
          notes?: string | null
          occurred_during?: string | null
          pain_level?: number | null
          recovery_percentage?: number | null
          reported_by?: string | null
          severity?: string | null
          shared_with_team?: boolean | null
          side?: string | null
          status?: string | null
          training_session_id?: string | null
          treating_physician?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "injuries_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "injuries_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "player_game_stats_aggregated"
            referencedColumns: ["game_id"]
          },
        ]
      }
      injury_details: {
        Row: {
          actual_return_date: string | null
          anatomical_location: string
          baseline_rom: Json | null
          cleared_date: string | null
          cleared_exercises: string[] | null
          contraindicated_exercises: string[] | null
          contraindicated_movements: string[] | null
          created_at: string | null
          diagnosis: string | null
          expected_return_date: string | null
          id: string
          imaging_completed: boolean | null
          imaging_results: string | null
          injury_date: string | null
          injury_id: number | null
          injury_mechanism: string | null
          medical_professional_seen: boolean | null
          modified_exercises: Json | null
          movement_pattern_at_injury: string | null
          pain_level_current: number | null
          pain_level_history: Json | null
          phase_progression_criteria: Json | null
          return_to_sport_phase: string | null
          rom_measurements: Json | null
          severity_level: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actual_return_date?: string | null
          anatomical_location: string
          baseline_rom?: Json | null
          cleared_date?: string | null
          cleared_exercises?: string[] | null
          contraindicated_exercises?: string[] | null
          contraindicated_movements?: string[] | null
          created_at?: string | null
          diagnosis?: string | null
          expected_return_date?: string | null
          id?: string
          imaging_completed?: boolean | null
          imaging_results?: string | null
          injury_date?: string | null
          injury_id?: number | null
          injury_mechanism?: string | null
          medical_professional_seen?: boolean | null
          modified_exercises?: Json | null
          movement_pattern_at_injury?: string | null
          pain_level_current?: number | null
          pain_level_history?: Json | null
          phase_progression_criteria?: Json | null
          return_to_sport_phase?: string | null
          rom_measurements?: Json | null
          severity_level?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actual_return_date?: string | null
          anatomical_location?: string
          baseline_rom?: Json | null
          cleared_date?: string | null
          cleared_exercises?: string[] | null
          contraindicated_exercises?: string[] | null
          contraindicated_movements?: string[] | null
          created_at?: string | null
          diagnosis?: string | null
          expected_return_date?: string | null
          id?: string
          imaging_completed?: boolean | null
          imaging_results?: string | null
          injury_date?: string | null
          injury_id?: number | null
          injury_mechanism?: string | null
          medical_professional_seen?: boolean | null
          modified_exercises?: Json | null
          movement_pattern_at_injury?: string | null
          pain_level_current?: number | null
          pain_level_history?: Json | null
          phase_progression_criteria?: Json | null
          return_to_sport_phase?: string | null
          rom_measurements?: Json | null
          severity_level?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "injury_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      injury_recovery_protocols: {
        Row: {
          allowed_exercises: Json | null
          created_at: string | null
          evidence_level: string | null
          high_recurrence_risk: boolean | null
          id: string
          injury_grade: string | null
          injury_type: string
          minimum_duration_days: number
          modified_exercises: Json | null
          phases: Json
          prevention_protocols: string[] | null
          progression_criteria: Json
          prohibited_exercises: string[] | null
          protocol_name: string
          requires_medical_clearance: boolean | null
          research_citations: string[] | null
          risk_factors: string[] | null
          rtp_criteria: Json
          typical_duration_days: number
          updated_at: string | null
        }
        Insert: {
          allowed_exercises?: Json | null
          created_at?: string | null
          evidence_level?: string | null
          high_recurrence_risk?: boolean | null
          id?: string
          injury_grade?: string | null
          injury_type: string
          minimum_duration_days: number
          modified_exercises?: Json | null
          phases: Json
          prevention_protocols?: string[] | null
          progression_criteria: Json
          prohibited_exercises?: string[] | null
          protocol_name: string
          requires_medical_clearance?: boolean | null
          research_citations?: string[] | null
          risk_factors?: string[] | null
          rtp_criteria: Json
          typical_duration_days: number
          updated_at?: string | null
        }
        Update: {
          allowed_exercises?: Json | null
          created_at?: string | null
          evidence_level?: string | null
          high_recurrence_risk?: boolean | null
          id?: string
          injury_grade?: string | null
          injury_type?: string
          minimum_duration_days?: number
          modified_exercises?: Json | null
          phases?: Json
          prevention_protocols?: string[] | null
          progression_criteria?: Json
          prohibited_exercises?: string[] | null
          protocol_name?: string
          requires_medical_clearance?: boolean | null
          research_citations?: string[] | null
          risk_factors?: string[] | null
          rtp_criteria?: Json
          typical_duration_days?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      injury_tracking: {
        Row: {
          activity_type: string | null
          actual_return_date: string | null
          acute_load_at_injury: number | null
          acwr_at_injury: number | null
          body_part: string
          chronic_load_at_injury: number | null
          created_at: string | null
          days_missed: number | null
          diagnosed_by: string | null
          expected_return_date: string | null
          id: string
          injury_date: string
          injury_type: string
          mechanism: string | null
          notes: string | null
          player_id: string
          severity: string | null
          side: string | null
          status: string | null
          treatment_plan: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          actual_return_date?: string | null
          acute_load_at_injury?: number | null
          acwr_at_injury?: number | null
          body_part: string
          chronic_load_at_injury?: number | null
          created_at?: string | null
          days_missed?: number | null
          diagnosed_by?: string | null
          expected_return_date?: string | null
          id?: string
          injury_date: string
          injury_type: string
          mechanism?: string | null
          notes?: string | null
          player_id: string
          severity?: string | null
          side?: string | null
          status?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          actual_return_date?: string | null
          acute_load_at_injury?: number | null
          acwr_at_injury?: number | null
          body_part?: string
          chronic_load_at_injury?: number | null
          created_at?: string | null
          days_missed?: number | null
          diagnosed_by?: string | null
          expected_return_date?: string | null
          id?: string
          injury_date?: string
          injury_type?: string
          mechanism?: string | null
          notes?: string | null
          player_id?: string
          severity?: string | null
          side?: string | null
          status?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "injury_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      intent_classifications: {
        Row: {
          alternative_intents: Json | null
          clarification_asked: string | null
          clarification_received: string | null
          confidence_level: string
          confidence_score: number
          corrected_by: string | null
          correction_notes: string | null
          created_at: string
          detected_intent: string
          final_intent: string | null
          id: string
          message_id: string | null
          routing_action: string
          user_id: string
          was_correct: boolean | null
        }
        Insert: {
          alternative_intents?: Json | null
          clarification_asked?: string | null
          clarification_received?: string | null
          confidence_level: string
          confidence_score: number
          corrected_by?: string | null
          correction_notes?: string | null
          created_at?: string
          detected_intent: string
          final_intent?: string | null
          id?: string
          message_id?: string | null
          routing_action: string
          user_id: string
          was_correct?: boolean | null
        }
        Update: {
          alternative_intents?: Json | null
          clarification_asked?: string | null
          clarification_received?: string | null
          confidence_level?: string
          confidence_score?: number
          corrected_by?: string | null
          correction_notes?: string | null
          created_at?: string
          detected_intent?: string
          final_intent?: string | null
          id?: string
          message_id?: string | null
          routing_action?: string
          user_id?: string
          was_correct?: boolean | null
        }
        Relationships: []
      }
      isometrics_exercises: {
        Row: {
          category: string
          created_at: string | null
          description: string
          difficulty_level: string
          equipment_required: string[] | null
          evidence_level: string | null
          execution_cues: string[] | null
          id: string
          image_url: string | null
          injury_prevention_benefits: string[] | null
          intensity_percentage: number | null
          lifting_synergy_exercises: string[] | null
          muscle_groups: string[]
          name: string
          post_lifting_recommendation: boolean | null
          pre_lifting_recommendation: boolean | null
          protocol_type: string
          recommended_duration_seconds: number
          recommended_reps: number | null
          recommended_sets: number
          research_studies: string[] | null
          rest_period_seconds: number
          safety_notes: string | null
          setup_instructions: string
          sport_specific_applications: Json | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          difficulty_level: string
          equipment_required?: string[] | null
          evidence_level?: string | null
          execution_cues?: string[] | null
          id?: string
          image_url?: string | null
          injury_prevention_benefits?: string[] | null
          intensity_percentage?: number | null
          lifting_synergy_exercises?: string[] | null
          muscle_groups: string[]
          name: string
          post_lifting_recommendation?: boolean | null
          pre_lifting_recommendation?: boolean | null
          protocol_type: string
          recommended_duration_seconds: number
          recommended_reps?: number | null
          recommended_sets: number
          research_studies?: string[] | null
          rest_period_seconds: number
          safety_notes?: string | null
          setup_instructions: string
          sport_specific_applications?: Json | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          difficulty_level?: string
          equipment_required?: string[] | null
          evidence_level?: string | null
          execution_cues?: string[] | null
          id?: string
          image_url?: string | null
          injury_prevention_benefits?: string[] | null
          intensity_percentage?: number | null
          lifting_synergy_exercises?: string[] | null
          muscle_groups?: string[]
          name?: string
          post_lifting_recommendation?: boolean | null
          pre_lifting_recommendation?: boolean | null
          protocol_type?: string
          recommended_duration_seconds?: number
          recommended_reps?: number | null
          recommended_sets?: number
          research_studies?: string[] | null
          rest_period_seconds?: number
          safety_notes?: string | null
          setup_instructions?: string
          sport_specific_applications?: Json | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      isometrics_training_programs: {
        Row: {
          created_at: string | null
          duration_weeks: number
          exercise_sequence: Json | null
          id: string
          integration_with_lifting: Json | null
          program_name: string
          program_type: string
          progression_model: Json | null
          research_support: string[] | null
          sessions_per_week: number
          target_goal: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_weeks: number
          exercise_sequence?: Json | null
          id?: string
          integration_with_lifting?: Json | null
          program_name: string
          program_type: string
          progression_model?: Json | null
          research_support?: string[] | null
          sessions_per_week: number
          target_goal?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_weeks?: number
          exercise_sequence?: Json | null
          id?: string
          integration_with_lifting?: Json | null
          program_name?: string
          program_type?: string
          progression_model?: Json | null
          research_support?: string[] | null
          sessions_per_week?: number
          target_goal?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      jersey_assignments: {
        Row: {
          assigned_date: string
          created_at: string
          id: string
          inventory_item_id: string | null
          jersey_number: number
          jersey_type: string | null
          notes: string | null
          player_id: string
          returned_date: string | null
          season: string | null
          status: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          assigned_date?: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          jersey_number: number
          jersey_type?: string | null
          notes?: string | null
          player_id: string
          returned_date?: string | null
          season?: string | null
          status?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          assigned_date?: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          jersey_number?: number
          jersey_type?: string | null
          notes?: string | null
          player_id?: string
          returned_date?: string | null
          season?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jersey_assignments_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jersey_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_entries: {
        Row: {
          category: string
          content: string
          content_embedding: string | null
          created_at: string
          embedded_at: string | null
          embedding_model: string | null
          evidence_grade: string | null
          id: string
          is_active: boolean | null
          publication_date: string | null
          query_count: number | null
          requires_labs: boolean | null
          requires_professional: boolean | null
          risk_level: string | null
          source_quality_score: number | null
          source_title: string | null
          source_type: string | null
          source_url: string | null
          subcategory: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          content_embedding?: string | null
          created_at?: string
          embedded_at?: string | null
          embedding_model?: string | null
          evidence_grade?: string | null
          id?: string
          is_active?: boolean | null
          publication_date?: string | null
          query_count?: number | null
          requires_labs?: boolean | null
          requires_professional?: boolean | null
          risk_level?: string | null
          source_quality_score?: number | null
          source_title?: string | null
          source_type?: string | null
          source_url?: string | null
          subcategory?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          content_embedding?: string | null
          created_at?: string
          embedded_at?: string | null
          embedding_model?: string | null
          evidence_grade?: string | null
          id?: string
          is_active?: boolean | null
          publication_date?: string | null
          query_count?: number | null
          requires_labs?: boolean | null
          requires_professional?: boolean | null
          risk_level?: string | null
          source_quality_score?: number | null
          source_title?: string | null
          source_type?: string | null
          source_url?: string | null
          subcategory?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_entry_performance: {
        Row: {
          avg_position_in_results: number | null
          avg_similarity_when_retrieved: number | null
          entry_id: string
          helpfulness_score: number | null
          id: string
          last_reviewed_at: string | null
          needs_review: boolean | null
          negative_feedback_count: number | null
          positive_feedback_count: number | null
          retrieval_relevance_score: number | null
          review_reason: string | null
          times_retrieved: number | null
          times_used_in_response: number | null
          updated_at: string
        }
        Insert: {
          avg_position_in_results?: number | null
          avg_similarity_when_retrieved?: number | null
          entry_id: string
          helpfulness_score?: number | null
          id?: string
          last_reviewed_at?: string | null
          needs_review?: boolean | null
          negative_feedback_count?: number | null
          positive_feedback_count?: number | null
          retrieval_relevance_score?: number | null
          review_reason?: string | null
          times_retrieved?: number | null
          times_used_in_response?: number | null
          updated_at?: string
        }
        Update: {
          avg_position_in_results?: number | null
          avg_similarity_when_retrieved?: number | null
          entry_id?: string
          helpfulness_score?: number | null
          id?: string
          last_reviewed_at?: string | null
          needs_review?: boolean | null
          negative_feedback_count?: number | null
          positive_feedback_count?: number | null
          retrieval_relevance_score?: number | null
          review_reason?: string | null
          times_retrieved?: number | null
          times_used_in_response?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      league_settings: {
        Row: {
          admin_email: string | null
          admin_phone: string | null
          assignment_deadline_hours: number | null
          auto_assign_officials: boolean | null
          created_at: string
          default_pay_rate: number | null
          id: string
          is_active: boolean | null
          league_code: string | null
          league_name: string
          max_officials_per_game: number | null
          min_officials_per_game: number | null
          pay_rate_by_certification: Json | null
          required_certification_level: string | null
          updated_at: string
        }
        Insert: {
          admin_email?: string | null
          admin_phone?: string | null
          assignment_deadline_hours?: number | null
          auto_assign_officials?: boolean | null
          created_at?: string
          default_pay_rate?: number | null
          id?: string
          is_active?: boolean | null
          league_code?: string | null
          league_name: string
          max_officials_per_game?: number | null
          min_officials_per_game?: number | null
          pay_rate_by_certification?: Json | null
          required_certification_level?: string | null
          updated_at?: string
        }
        Update: {
          admin_email?: string | null
          admin_phone?: string | null
          assignment_deadline_hours?: number | null
          auto_assign_officials?: boolean | null
          created_at?: string
          default_pay_rate?: number | null
          id?: string
          is_active?: boolean | null
          league_code?: string | null
          league_name?: string
          max_officials_per_game?: number | null
          min_officials_per_game?: number | null
          pay_rate_by_certification?: Json | null
          required_certification_level?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      learned_user_preferences: {
        Row: {
          confidence_score: number
          created_at: string
          evidence_count: number
          id: string
          learned_from: string
          preference_key: string
          preference_type: string
          preference_value: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          evidence_count?: number
          id?: string
          learned_from: string
          preference_key: string
          preference_type: string
          preference_value: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          evidence_count?: number
          id?: string
          learned_from?: string
          preference_key?: string
          preference_type?: string
          preference_value?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      load_caps: {
        Row: {
          created_at: string | null
          id: string
          max_load_percent: number
          overridden_at: string | null
          overridden_by: string | null
          override_reason: string | null
          player_id: string
          reason: string | null
          sessions_remaining: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_load_percent: number
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          player_id: string
          reason?: string | null
          sessions_remaining?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_load_percent?: number
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          player_id?: string
          reason?: string | null
          sessions_remaining?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      load_daily: {
        Row: {
          created_at: string
          daily_load: number
          date: string
          id: string
          player_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          daily_load?: number
          date: string
          id?: string
          player_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          daily_load?: number
          date?: string
          id?: string
          player_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "load_daily_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      load_monitoring: {
        Row: {
          acute_load: number | null
          acwr: number | null
          calculated_at: string
          chronic_load: number | null
          created_at: string
          daily_load: number | null
          id: string
          injury_risk_level: string | null
          player_id: string
          workout_log_id: string
        }
        Insert: {
          acute_load?: number | null
          acwr?: number | null
          calculated_at?: string
          chronic_load?: number | null
          created_at?: string
          daily_load?: number | null
          id?: string
          injury_risk_level?: string | null
          player_id: string
          workout_log_id: string
        }
        Update: {
          acute_load?: number | null
          acwr?: number | null
          calculated_at?: string
          chronic_load?: number | null
          created_at?: string
          daily_load?: number | null
          id?: string
          injury_risk_level?: string | null
          player_id?: string
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "load_monitoring_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "v_workout_logs_consent"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_monitoring_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
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
      long_term_injury_tracking: {
        Row: {
          actual_recovery_date: string | null
          body_part: string
          created_at: string | null
          current_phase: string | null
          healthcare_providers: Json | null
          id: string
          initial_date: string
          injury_id: string | null
          injury_type: string
          progress_notes: string[] | null
          recovery_target_date: string | null
          restrictions: string[] | null
          severity: string | null
          treatment_plan: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_recovery_date?: string | null
          body_part: string
          created_at?: string | null
          current_phase?: string | null
          healthcare_providers?: Json | null
          id?: string
          initial_date: string
          injury_id?: string | null
          injury_type: string
          progress_notes?: string[] | null
          recovery_target_date?: string | null
          restrictions?: string[] | null
          severity?: string | null
          treatment_plan?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_recovery_date?: string | null
          body_part?: string
          created_at?: string | null
          current_phase?: string | null
          healthcare_providers?: Json | null
          id?: string
          initial_date?: string
          injury_id?: string | null
          injury_type?: string
          progress_notes?: string[] | null
          recovery_target_date?: string | null
          restrictions?: string[] | null
          severity?: string | null
          treatment_plan?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "long_term_injury_tracking_injury_id_fkey"
            columns: ["injury_id"]
            isOneToOne: false
            referencedRelation: "injury_tracking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "long_term_injury_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_templates: {
        Row: {
          calories: number | null
          carbs_g: number | null
          cook_time_minutes: number | null
          created_at: string | null
          day_type: string | null
          description: string | null
          dietary_flags: string[] | null
          fat_g: number | null
          fiber_g: number | null
          grains_portion: string | null
          hours_after_game: number | null
          hours_before_game: number | null
          id: string
          ingredients: Json | null
          instructions: string[] | null
          is_active: boolean | null
          meal_type: string
          prep_time_minutes: number | null
          protein_g: number | null
          protein_portion: string | null
          source: string | null
          tags: string[] | null
          template_name: string
          timing_description: string | null
          updated_at: string | null
          vegetables_portion: string | null
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          cook_time_minutes?: number | null
          created_at?: string | null
          day_type?: string | null
          description?: string | null
          dietary_flags?: string[] | null
          fat_g?: number | null
          fiber_g?: number | null
          grains_portion?: string | null
          hours_after_game?: number | null
          hours_before_game?: number | null
          id?: string
          ingredients?: Json | null
          instructions?: string[] | null
          is_active?: boolean | null
          meal_type: string
          prep_time_minutes?: number | null
          protein_g?: number | null
          protein_portion?: string | null
          source?: string | null
          tags?: string[] | null
          template_name: string
          timing_description?: string | null
          updated_at?: string | null
          vegetables_portion?: string | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          cook_time_minutes?: number | null
          created_at?: string | null
          day_type?: string | null
          description?: string | null
          dietary_flags?: string[] | null
          fat_g?: number | null
          fiber_g?: number | null
          grains_portion?: string | null
          hours_after_game?: number | null
          hours_before_game?: number | null
          id?: string
          ingredients?: Json | null
          instructions?: string[] | null
          is_active?: boolean | null
          meal_type?: string
          prep_time_minutes?: number | null
          protein_g?: number | null
          protein_portion?: string | null
          source?: string | null
          tags?: string[] | null
          template_name?: string
          timing_description?: string | null
          updated_at?: string | null
          vegetables_portion?: string | null
        }
        Relationships: []
      }
      mental_performance_logs: {
        Row: {
          anxiety_level: number | null
          confidence_level: number | null
          context: string | null
          created_at: string | null
          decision_making_clarity: number | null
          focus_level: number | null
          id: string
          life_stress_level: number | null
          log_date: string
          mental_readiness_score: number | null
          mental_rehearsal_minutes: number | null
          motivation_level: number | null
          notes: string | null
          pre_game_nerves: number | null
          reaction_time_feeling: number | null
          relationship_stress: number | null
          updated_at: string | null
          user_id: string
          visualization_completed: boolean | null
          work_school_stress: number | null
        }
        Insert: {
          anxiety_level?: number | null
          confidence_level?: number | null
          context?: string | null
          created_at?: string | null
          decision_making_clarity?: number | null
          focus_level?: number | null
          id?: string
          life_stress_level?: number | null
          log_date?: string
          mental_readiness_score?: number | null
          mental_rehearsal_minutes?: number | null
          motivation_level?: number | null
          notes?: string | null
          pre_game_nerves?: number | null
          reaction_time_feeling?: number | null
          relationship_stress?: number | null
          updated_at?: string | null
          user_id: string
          visualization_completed?: boolean | null
          work_school_stress?: number | null
        }
        Update: {
          anxiety_level?: number | null
          confidence_level?: number | null
          context?: string | null
          created_at?: string | null
          decision_making_clarity?: number | null
          focus_level?: number | null
          id?: string
          life_stress_level?: number | null
          log_date?: string
          mental_readiness_score?: number | null
          mental_rehearsal_minutes?: number | null
          motivation_level?: number | null
          notes?: string | null
          pre_game_nerves?: number | null
          reaction_time_feeling?: number | null
          relationship_stress?: number | null
          updated_at?: string | null
          user_id?: string
          visualization_completed?: boolean | null
          work_school_stress?: number | null
        }
        Relationships: []
      }
      mental_skills_protocols: {
        Row: {
          audio_guide_url: string | null
          best_time_to_practice: string | null
          best_used_for: string[] | null
          created_at: string | null
          description: string
          difficulty_level: string | null
          duration_minutes: number
          evidence_level: string | null
          flag_football_application: string | null
          frequency_recommendation: string | null
          id: string
          position_specific_benefits: Json | null
          protocol_category: string
          protocol_name: string
          research_citations: string[] | null
          step_by_step_instructions: Json
          target_mental_state: string | null
          video_guide_url: string | null
        }
        Insert: {
          audio_guide_url?: string | null
          best_time_to_practice?: string | null
          best_used_for?: string[] | null
          created_at?: string | null
          description: string
          difficulty_level?: string | null
          duration_minutes: number
          evidence_level?: string | null
          flag_football_application?: string | null
          frequency_recommendation?: string | null
          id?: string
          position_specific_benefits?: Json | null
          protocol_category: string
          protocol_name: string
          research_citations?: string[] | null
          step_by_step_instructions?: Json
          target_mental_state?: string | null
          video_guide_url?: string | null
        }
        Update: {
          audio_guide_url?: string | null
          best_time_to_practice?: string | null
          best_used_for?: string[] | null
          created_at?: string | null
          description?: string
          difficulty_level?: string | null
          duration_minutes?: number
          evidence_level?: string | null
          flag_football_application?: string | null
          frequency_recommendation?: string | null
          id?: string
          position_specific_benefits?: Json | null
          protocol_category?: string
          protocol_name?: string
          research_citations?: string[] | null
          step_by_step_instructions?: Json
          target_mental_state?: string | null
          video_guide_url?: string | null
        }
        Relationships: []
      }
      mental_training_sessions: {
        Row: {
          audio_url: string | null
          coach_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          effectiveness_rating: number | null
          id: string
          script: string | null
          technique: string
          title: string | null
          user_id: string
          user_notes: string | null
        }
        Insert: {
          audio_url?: string | null
          coach_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          effectiveness_rating?: number | null
          id?: string
          script?: string | null
          technique: string
          title?: string | null
          user_id: string
          user_notes?: string | null
        }
        Update: {
          audio_url?: string | null
          coach_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          effectiveness_rating?: number | null
          id?: string
          script?: string | null
          technique?: string
          title?: string | null
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mental_training_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "ai_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      mental_wellness_reports: {
        Row: {
          created_at: string | null
          generated_at: string | null
          id: string
          privacy_settings: Json | null
          report_data: Json
          report_type: string
          shared_with: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          privacy_settings?: Json | null
          report_data: Json
          report_type: string
          shared_with?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          privacy_settings?: Json | null
          report_data?: Json
          report_type?: string
          shared_with?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mental_wellness_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      merlin_violation_log: {
        Row: {
          endpoint: string
          request_body: string | null
          timestamp: string
          user_agent: string | null
          violation_id: string
          violation_type: string
        }
        Insert: {
          endpoint: string
          request_body?: string | null
          timestamp?: string
          user_agent?: string | null
          violation_id?: string
          violation_type: string
        }
        Update: {
          endpoint?: string
          request_body?: string | null
          timestamp?: string
          user_agent?: string | null
          violation_id?: string
          violation_type?: string
        }
        Relationships: []
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_training_data: {
        Row: {
          accuracy: number | null
          actual_result: Json | null
          created_at: string | null
          data: Json
          id: string
          prediction_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accuracy?: number | null
          actual_result?: Json | null
          created_at?: string | null
          data: Json
          id?: string
          prediction_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accuracy?: number | null
          actual_result?: Json | null
          created_at?: string | null
          data?: Json
          id?: string
          prediction_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_training_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      movement_patterns: {
        Row: {
          created_at: string | null
          description: string | null
          drills: Json | null
          frequency_per_week: number | null
          id: string
          load_progression: Json | null
          notes: string | null
          pattern_name: string
          pattern_type: string
          program_id: string | null
          weekly_volume_targets: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          drills?: Json | null
          frequency_per_week?: number | null
          id?: string
          load_progression?: Json | null
          notes?: string | null
          pattern_name: string
          pattern_type: string
          program_id?: string | null
          weekly_volume_targets?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          drills?: Json | null
          frequency_per_week?: number | null
          id?: string
          load_progression?: Json | null
          notes?: string | null
          pattern_name?: string
          pattern_type?: string
          program_id?: string | null
          weekly_volume_targets?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "movement_patterns_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      multi_year_periodization: {
        Row: {
          annual_phase: string
          calendar_year: number
          competition_density: string | null
          created_at: string | null
          cycle_name: string
          cycle_type: string
          endurance_emphasis: number | null
          expected_benchmarks: Json | null
          id: string
          intensity_target_percentage: number | null
          major_competitions: string[] | null
          periodization_model: string | null
          phase_focus: string
          power_emphasis: number | null
          primary_objectives: string[] | null
          research_basis: string[] | null
          secondary_objectives: string[] | null
          skill_emphasis: number | null
          speed_emphasis: number | null
          strength_emphasis: number | null
          target_date: string | null
          target_event: string | null
          updated_at: string | null
          volume_target_percentage: number | null
          year_number: number
        }
        Insert: {
          annual_phase: string
          calendar_year: number
          competition_density?: string | null
          created_at?: string | null
          cycle_name: string
          cycle_type: string
          endurance_emphasis?: number | null
          expected_benchmarks?: Json | null
          id?: string
          intensity_target_percentage?: number | null
          major_competitions?: string[] | null
          periodization_model?: string | null
          phase_focus: string
          power_emphasis?: number | null
          primary_objectives?: string[] | null
          research_basis?: string[] | null
          secondary_objectives?: string[] | null
          skill_emphasis?: number | null
          speed_emphasis?: number | null
          strength_emphasis?: number | null
          target_date?: string | null
          target_event?: string | null
          updated_at?: string | null
          volume_target_percentage?: number | null
          year_number: number
        }
        Update: {
          annual_phase?: string
          calendar_year?: number
          competition_density?: string | null
          created_at?: string | null
          cycle_name?: string
          cycle_type?: string
          endurance_emphasis?: number | null
          expected_benchmarks?: Json | null
          id?: string
          intensity_target_percentage?: number | null
          major_competitions?: string[] | null
          periodization_model?: string | null
          phase_focus?: string
          power_emphasis?: number | null
          primary_objectives?: string[] | null
          research_basis?: string[] | null
          secondary_objectives?: string[] | null
          skill_emphasis?: number | null
          speed_emphasis?: number | null
          strength_emphasis?: number | null
          target_date?: string | null
          target_event?: string | null
          updated_at?: string | null
          volume_target_percentage?: number | null
          year_number?: number
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      notification_preferences: {
        Row: {
          category_preferences: Json | null
          created_at: string
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          muted_channels: string[] | null
          muted_until: string | null
          push_enabled: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          team_overrides: Json | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_preferences?: Json | null
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          muted_channels?: string[] | null
          muted_until?: string | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          team_overrides?: Json | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_preferences?: Json | null
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          muted_channels?: string[] | null
          muted_until?: string | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          team_overrides?: Json | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string | null
          data: Json | null
          dismissed: boolean | null
          expires_at: string | null
          id: number
          is_read: boolean | null
          message: string
          notification_type: string
          priority: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sender_id: string | null
          severity: string | null
          source_id: string | null
          source_type: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          user_id_uuid: string
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          data?: Json | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: number
          is_read?: boolean | null
          message: string
          notification_type: string
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          severity?: string | null
          source_id?: string | null
          source_type?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          user_id_uuid: string
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          data?: Json | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: number
          is_read?: boolean | null
          message?: string
          notification_type?: string
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          severity?: string | null
          source_id?: string | null
          source_type?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          user_id_uuid?: string
        }
        Relationships: []
      }
      nutrition_goals: {
        Row: {
          calories_target: number | null
          carbs_target: number | null
          created_at: string | null
          fat_target: number | null
          id: string
          protein_target: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calories_target?: number | null
          carbs_target?: number | null
          created_at?: string | null
          fat_target?: number | null
          id?: string
          protein_target?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calories_target?: number | null
          carbs_target?: number | null
          created_at?: string | null
          fat_target?: number | null
          id?: string
          protein_target?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          calories: number | null
          carbohydrates: number | null
          created_at: string | null
          fat: number | null
          fiber: number | null
          food_id: number | null
          food_name: string
          id: string
          logged_at: string | null
          meal_type: string | null
          notes: string | null
          protein: number | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbohydrates?: number | null
          created_at?: string | null
          fat?: number | null
          fiber?: number | null
          food_id?: number | null
          food_name: string
          id?: string
          logged_at?: string | null
          meal_type?: string | null
          notes?: string | null
          protein?: number | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbohydrates?: number | null
          created_at?: string | null
          fat?: number | null
          fiber?: number | null
          food_id?: number | null
          food_name?: string
          id?: string
          logged_at?: string | null
          meal_type?: string | null
          notes?: string | null
          protein?: number | null
          user_id?: string
        }
        Relationships: []
      }
      nutrition_plans: {
        Row: {
          calories_target: number | null
          carbs_g: number | null
          created_at: string | null
          day_type: string
          description: string | null
          during_training_carbs_g_per_hour: number | null
          electrolyte_needed: boolean | null
          fat_g: number | null
          fiber_g: number | null
          hydration_target_ml: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          plan_name: string
          plate_grains_percent: number | null
          plate_protein_percent: number | null
          plate_vegetables_percent: number | null
          post_training_carbs_g: number | null
          post_training_protein_g: number | null
          pre_training_carbs_g: number | null
          pre_training_timing_hours: number | null
          protein_g: number | null
          source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calories_target?: number | null
          carbs_g?: number | null
          created_at?: string | null
          day_type: string
          description?: string | null
          during_training_carbs_g_per_hour?: number | null
          electrolyte_needed?: boolean | null
          fat_g?: number | null
          fiber_g?: number | null
          hydration_target_ml?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          plan_name: string
          plate_grains_percent?: number | null
          plate_protein_percent?: number | null
          plate_vegetables_percent?: number | null
          post_training_carbs_g?: number | null
          post_training_protein_g?: number | null
          pre_training_carbs_g?: number | null
          pre_training_timing_hours?: number | null
          protein_g?: number | null
          source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calories_target?: number | null
          carbs_g?: number | null
          created_at?: string | null
          day_type?: string
          description?: string | null
          during_training_carbs_g_per_hour?: number | null
          electrolyte_needed?: boolean | null
          fat_g?: number | null
          fiber_g?: number | null
          hydration_target_ml?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          plan_name?: string
          plate_grains_percent?: number | null
          plate_protein_percent?: number | null
          plate_vegetables_percent?: number | null
          post_training_carbs_g?: number | null
          post_training_protein_g?: number | null
          pre_training_carbs_g?: number | null
          pre_training_timing_hours?: number | null
          protein_g?: number | null
          source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      official_availability: {
        Row: {
          availability_type: string
          created_at: string
          date_from: string
          date_to: string
          id: string
          is_recurring: boolean | null
          official_id: string
          reason: string | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          time_from: string | null
          time_to: string | null
          updated_at: string
        }
        Insert: {
          availability_type?: string
          created_at?: string
          date_from: string
          date_to: string
          id?: string
          is_recurring?: boolean | null
          official_id: string
          reason?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          time_from?: string | null
          time_to?: string | null
          updated_at?: string
        }
        Update: {
          availability_type?: string
          created_at?: string
          date_from?: string
          date_to?: string
          id?: string
          is_recurring?: boolean | null
          official_id?: string
          reason?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          time_from?: string | null
          time_to?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_availability_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      official_incidents: {
        Row: {
          action_taken: string | null
          created_at: string
          description: string
          game_id: string | null
          id: string
          incident_date: string
          incident_type: string
          official_id: string
          reported_by: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string | null
          suspension_end: string | null
          suspension_start: string | null
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          description: string
          game_id?: string | null
          id?: string
          incident_date?: string
          incident_type: string
          official_id: string
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          suspension_end?: string | null
          suspension_start?: string | null
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          description?: string
          game_id?: string | null
          id?: string
          incident_date?: string
          incident_type?: string
          official_id?: string
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          suspension_end?: string | null
          suspension_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_incidents_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_incidents_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "player_game_stats_aggregated"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "official_incidents_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      official_ratings: {
        Row: {
          assignment_id: string | null
          communication_rating: number | null
          consistency_rating: number | null
          created_at: string
          game_control_rating: number | null
          game_id: string | null
          id: string
          improvement_areas: string | null
          incidents: string | null
          is_anonymous: boolean | null
          official_id: string
          overall_rating: number
          positive_feedback: string | null
          professionalism_rating: number | null
          rated_by: string
          rater_role: string | null
          rule_knowledge_rating: number | null
          visible_to_official: boolean | null
        }
        Insert: {
          assignment_id?: string | null
          communication_rating?: number | null
          consistency_rating?: number | null
          created_at?: string
          game_control_rating?: number | null
          game_id?: string | null
          id?: string
          improvement_areas?: string | null
          incidents?: string | null
          is_anonymous?: boolean | null
          official_id: string
          overall_rating: number
          positive_feedback?: string | null
          professionalism_rating?: number | null
          rated_by: string
          rater_role?: string | null
          rule_knowledge_rating?: number | null
          visible_to_official?: boolean | null
        }
        Update: {
          assignment_id?: string | null
          communication_rating?: number | null
          consistency_rating?: number | null
          created_at?: string
          game_control_rating?: number | null
          game_id?: string | null
          id?: string
          improvement_areas?: string | null
          incidents?: string | null
          is_anonymous?: boolean | null
          official_id?: string
          overall_rating?: number
          positive_feedback?: string | null
          professionalism_rating?: number | null
          rated_by?: string
          rater_role?: string | null
          rule_knowledge_rating?: number | null
          visible_to_official?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "official_ratings_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "game_official_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_ratings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_ratings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "player_game_stats_aggregated"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "official_ratings_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials"
            referencedColumns: ["id"]
          },
        ]
      }
      officials: {
        Row: {
          certification_date: string | null
          certification_expiry: string | null
          certification_level: string | null
          certification_number: string | null
          created_at: string
          email: string | null
          first_name: string
          games_officiated: number | null
          has_transportation: boolean | null
          home_location: string | null
          id: string
          last_name: string
          max_games_per_day: number | null
          max_games_per_week: number | null
          max_travel_distance_km: number | null
          notes: string | null
          overall_rating: number | null
          pay_rate_per_game: number | null
          payment_method: string | null
          phone: string | null
          preferred_days: string[] | null
          preferred_positions: string[] | null
          preferred_times: string[] | null
          specializations: string[] | null
          status: string | null
          total_ratings: number | null
          updated_at: string
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          certification_date?: string | null
          certification_expiry?: string | null
          certification_level?: string | null
          certification_number?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          games_officiated?: number | null
          has_transportation?: boolean | null
          home_location?: string | null
          id?: string
          last_name: string
          max_games_per_day?: number | null
          max_games_per_week?: number | null
          max_travel_distance_km?: number | null
          notes?: string | null
          overall_rating?: number | null
          pay_rate_per_game?: number | null
          payment_method?: string | null
          phone?: string | null
          preferred_days?: string[] | null
          preferred_positions?: string[] | null
          preferred_times?: string[] | null
          specializations?: string[] | null
          status?: string | null
          total_ratings?: number | null
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          certification_date?: string | null
          certification_expiry?: string | null
          certification_level?: string | null
          certification_number?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          games_officiated?: number | null
          has_transportation?: boolean | null
          home_location?: string | null
          id?: string
          last_name?: string
          max_games_per_day?: number | null
          max_games_per_week?: number | null
          max_travel_distance_km?: number | null
          notes?: string | null
          overall_rating?: number | null
          pay_rate_per_game?: number | null
          payment_method?: string | null
          phone?: string | null
          preferred_days?: string[] | null
          preferred_positions?: string[] | null
          preferred_times?: string[] | null
          specializations?: string[] | null
          status?: string | null
          total_ratings?: number | null
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
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
          user_id_uuid: string
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
          user_id_uuid: string
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
          user_id_uuid?: string
          world_championship_date?: string | null
          world_ranking?: number | null
        }
        Relationships: []
      }
      ownership_transitions: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          action_required: string | null
          completed_at: string | null
          created_at: string | null
          from_role: string
          id: string
          player_id: string
          status: string
          to_role: string
          trigger: string
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_required?: string | null
          completed_at?: string | null
          created_at?: string | null
          from_role: string
          id?: string
          player_id: string
          status?: string
          to_role: string
          trigger: string
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_required?: string | null
          completed_at?: string | null
          created_at?: string | null
          from_role?: string
          id?: string
          player_id?: string
          status?: string
          to_role?: string
          trigger?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      parental_consent: {
        Row: {
          biometrics_consent: boolean
          consent_status: string
          created_at: string
          expires_at: string | null
          guardian_email: string
          guardian_name: string | null
          guardian_relationship: string | null
          health_data_consent: boolean
          id: string
          location_consent: boolean
          minor_user_id: string
          research_consent: boolean
          revocation_reason: string | null
          revoked_at: string | null
          updated_at: string
          verification_ip_address: unknown
          verification_method: string | null
          verification_sent_at: string | null
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          biometrics_consent?: boolean
          consent_status?: string
          created_at?: string
          expires_at?: string | null
          guardian_email: string
          guardian_name?: string | null
          guardian_relationship?: string | null
          health_data_consent?: boolean
          id?: string
          location_consent?: boolean
          minor_user_id: string
          research_consent?: boolean
          revocation_reason?: string | null
          revoked_at?: string | null
          updated_at?: string
          verification_ip_address?: unknown
          verification_method?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          biometrics_consent?: boolean
          consent_status?: string
          created_at?: string
          expires_at?: string | null
          guardian_email?: string
          guardian_name?: string | null
          guardian_relationship?: string | null
          health_data_consent?: boolean
          id?: string
          location_consent?: boolean
          minor_user_id?: string
          research_consent?: boolean
          revocation_reason?: string | null
          revoked_at?: string | null
          updated_at?: string
          verification_ip_address?: unknown
          verification_method?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      pending_professional_consultations: {
        Row: {
          consultation_status: string
          conversation_context: Json | null
          created_at: string | null
          follow_up_date: string | null
          id: string
          last_reminder_sent_at: string | null
          max_reminders: number | null
          professional_exercises: Json | null
          professional_guidance: string | null
          professional_restrictions: Json | null
          recommended_professional: string
          referral_reason: string
          referral_type: string
          reminder_count: number | null
          reminder_date: string
          resolution_notes: string | null
          resolved_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consultation_status?: string
          conversation_context?: Json | null
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          last_reminder_sent_at?: string | null
          max_reminders?: number | null
          professional_exercises?: Json | null
          professional_guidance?: string | null
          professional_restrictions?: Json | null
          recommended_professional: string
          referral_reason: string
          referral_type: string
          reminder_count?: number | null
          reminder_date?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consultation_status?: string
          conversation_context?: Json | null
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          last_reminder_sent_at?: string | null
          max_reminders?: number | null
          professional_exercises?: Json | null
          professional_guidance?: string | null
          professional_restrictions?: Json | null
          recommended_professional?: string
          referral_reason?: string
          referral_type?: string
          reminder_count?: number | null
          reminder_date?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      performance_benchmarks: {
        Row: {
          average_female: number
          average_male: number
          below_average_female: number | null
          below_average_male: number | null
          created_at: string | null
          data_source: string | null
          elite_female: number
          elite_male: number
          equipment_needed: string[] | null
          good_female: number
          good_male: number
          id: string
          measurement_unit: string
          most_important_for_positions: string[] | null
          population_description: string | null
          sample_size: number | null
          test_category: string
          test_description: string | null
          test_name: string
          test_protocol: string | null
        }
        Insert: {
          average_female: number
          average_male: number
          below_average_female?: number | null
          below_average_male?: number | null
          created_at?: string | null
          data_source?: string | null
          elite_female: number
          elite_male: number
          equipment_needed?: string[] | null
          good_female: number
          good_male: number
          id?: string
          measurement_unit: string
          most_important_for_positions?: string[] | null
          population_description?: string | null
          sample_size?: number | null
          test_category: string
          test_description?: string | null
          test_name: string
          test_protocol?: string | null
        }
        Update: {
          average_female?: number
          average_male?: number
          below_average_female?: number | null
          below_average_male?: number | null
          created_at?: string | null
          data_source?: string | null
          elite_female?: number
          elite_male?: number
          equipment_needed?: string[] | null
          good_female?: number
          good_male?: number
          id?: string
          measurement_unit?: string
          most_important_for_positions?: string[] | null
          population_description?: string | null
          sample_size?: number | null
          test_category?: string
          test_description?: string | null
          test_name?: string
          test_protocol?: string | null
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
          user_id_uuid: string
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
          user_id_uuid: string
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
          user_id_uuid?: string
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
      performance_records: {
        Row: {
          back_squat: number | null
          bench_press: number | null
          body_fat_percentage: number | null
          body_weight: number | null
          broad_jump: number | null
          created_at: string | null
          dash_40: number | null
          deadlift: number | null
          id: string
          l_drill: number | null
          notes: string | null
          overall_score: number | null
          pro_agility: number | null
          reactive_agility: number | null
          rsi: number | null
          sprint_10m: number | null
          sprint_20m: number | null
          test_date: string | null
          updated_at: string | null
          user_id: string
          vertical_jump: number | null
        }
        Insert: {
          back_squat?: number | null
          bench_press?: number | null
          body_fat_percentage?: number | null
          body_weight?: number | null
          broad_jump?: number | null
          created_at?: string | null
          dash_40?: number | null
          deadlift?: number | null
          id?: string
          l_drill?: number | null
          notes?: string | null
          overall_score?: number | null
          pro_agility?: number | null
          reactive_agility?: number | null
          rsi?: number | null
          sprint_10m?: number | null
          sprint_20m?: number | null
          test_date?: string | null
          updated_at?: string | null
          user_id: string
          vertical_jump?: number | null
        }
        Update: {
          back_squat?: number | null
          bench_press?: number | null
          body_fat_percentage?: number | null
          body_weight?: number | null
          broad_jump?: number | null
          created_at?: string | null
          dash_40?: number | null
          deadlift?: number | null
          id?: string
          l_drill?: number | null
          notes?: string | null
          overall_score?: number | null
          pro_agility?: number | null
          reactive_agility?: number | null
          rsi?: number | null
          sprint_10m?: number | null
          sprint_20m?: number | null
          test_date?: string | null
          updated_at?: string | null
          user_id?: string
          vertical_jump?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_tests: {
        Row: {
          conditions: Json | null
          created_at: string | null
          id: string
          notes: string | null
          result_value: number
          target_value: number | null
          test_date: string
          test_type: string
          user_id: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          result_value: number
          target_value?: number | null
          test_date?: string
          test_type: string
          user_id: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          result_value?: number
          target_value?: number | null
          test_date?: string
          test_type?: string
          user_id?: string
        }
        Relationships: []
      }
      physical_measurements: {
        Row: {
          arm_cm: number | null
          bmi: number | null
          body_fat_percentage: number | null
          chest_cm: number | null
          created_at: string | null
          height_cm: number | null
          hip_cm: number | null
          id: string
          measurement_date: string
          muscle_mass_kg: number | null
          notes: string | null
          thigh_cm: number | null
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          arm_cm?: number | null
          bmi?: number | null
          body_fat_percentage?: number | null
          chest_cm?: number | null
          created_at?: string | null
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          measurement_date?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          thigh_cm?: number | null
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          arm_cm?: number | null
          bmi?: number | null
          body_fat_percentage?: number | null
          chest_cm?: number | null
          created_at?: string | null
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          measurement_date?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          thigh_cm?: number | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      playbook_entries: {
        Row: {
          category: string | null
          coaching_points: string[] | null
          created_at: string
          created_by: string
          description: string | null
          diagram_url: string | null
          formation: string | null
          id: string
          installed_date: string | null
          is_core_play: boolean | null
          key_reads: string[] | null
          last_practiced: string | null
          name: string
          personnel: string | null
          play_type: string
          situation_tags: string[] | null
          status: string | null
          subcategory: string | null
          tags: string[] | null
          team_id: string
          updated_at: string
          video_timestamp_seconds: number | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          coaching_points?: string[] | null
          created_at?: string
          created_by: string
          description?: string | null
          diagram_url?: string | null
          formation?: string | null
          id?: string
          installed_date?: string | null
          is_core_play?: boolean | null
          key_reads?: string[] | null
          last_practiced?: string | null
          name: string
          personnel?: string | null
          play_type: string
          situation_tags?: string[] | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          team_id: string
          updated_at?: string
          video_timestamp_seconds?: number | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          coaching_points?: string[] | null
          created_at?: string
          created_by?: string
          description?: string | null
          diagram_url?: string | null
          formation?: string | null
          id?: string
          installed_date?: string | null
          is_core_play?: boolean | null
          key_reads?: string[] | null
          last_practiced?: string | null
          name?: string
          personnel?: string | null
          play_type?: string
          situation_tags?: string[] | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          team_id?: string
          updated_at?: string
          video_timestamp_seconds?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_entries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_achievements: {
        Row: {
          achievement_id: string
          context_data: Json | null
          earned_at: string | null
          id: string
          shared: boolean | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          context_data?: Json | null
          earned_at?: string | null
          id?: string
          shared?: boolean | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          context_data?: Json | null
          earned_at?: string | null
          id?: string
          shared?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      player_activity_tracking: {
        Row: {
          activity_details: Json | null
          activity_type: string
          created_at: string | null
          device_info: Json | null
          id: string
          ip_address: unknown
          session_id: string | null
          user_id: string
        }
        Insert: {
          activity_details?: Json | null
          activity_type: string
          created_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: unknown
          session_id?: string | null
          user_id: string
        }
        Update: {
          activity_details?: Json | null
          activity_type?: string
          created_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: unknown
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_activity_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      player_attendance_stats: {
        Row: {
          attendance_percentage: number | null
          current_attendance_streak: number | null
          current_on_time_streak: number | null
          events_attended: number | null
          events_excused: number | null
          events_late: number | null
          events_unexcused: number | null
          id: string
          last_calculated_at: string | null
          longest_attendance_streak: number | null
          on_time_percentage: number | null
          period_end: string | null
          period_start: string
          player_id: string
          team_id: string
          total_events: number | null
          user_id: string | null
        }
        Insert: {
          attendance_percentage?: number | null
          current_attendance_streak?: number | null
          current_on_time_streak?: number | null
          events_attended?: number | null
          events_excused?: number | null
          events_late?: number | null
          events_unexcused?: number | null
          id?: string
          last_calculated_at?: string | null
          longest_attendance_streak?: number | null
          on_time_percentage?: number | null
          period_end?: string | null
          period_start: string
          player_id: string
          team_id: string
          total_events?: number | null
          user_id?: string | null
        }
        Update: {
          attendance_percentage?: number | null
          current_attendance_streak?: number | null
          current_on_time_streak?: number | null
          events_attended?: number | null
          events_excused?: number | null
          events_late?: number | null
          events_unexcused?: number | null
          id?: string
          last_calculated_at?: string | null
          longest_attendance_streak?: number | null
          on_time_percentage?: number | null
          period_end?: string | null
          period_start?: string
          player_id?: string
          team_id?: string
          total_events?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_attendance_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_attendance_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      player_development_goals: {
        Row: {
          achieved_at: string | null
          achievement_notes: string | null
          baseline_value: number | null
          coach_id: string
          coach_notes: string | null
          created_at: string
          current_value: number | null
          description: string | null
          goal_type: string
          id: string
          metric_type: string | null
          player_id: string
          player_notes: string | null
          priority: string | null
          progress_percentage: number | null
          skill_area: string | null
          start_date: string
          status: string | null
          target_date: string | null
          target_unit: string | null
          target_value: number | null
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          achieved_at?: string | null
          achievement_notes?: string | null
          baseline_value?: number | null
          coach_id: string
          coach_notes?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          goal_type: string
          id?: string
          metric_type?: string | null
          player_id: string
          player_notes?: string | null
          priority?: string | null
          progress_percentage?: number | null
          skill_area?: string | null
          start_date?: string
          status?: string | null
          target_date?: string | null
          target_unit?: string | null
          target_value?: number | null
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          achieved_at?: string | null
          achievement_notes?: string | null
          baseline_value?: number | null
          coach_id?: string
          coach_notes?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          metric_type?: string | null
          player_id?: string
          player_notes?: string | null
          priority?: string | null
          progress_percentage?: number | null
          skill_area?: string | null
          start_date?: string
          status?: string | null
          target_date?: string | null
          target_unit?: string | null
          target_value?: number | null
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_development_goals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_evaluations: {
        Row: {
          areas_for_improvement: string | null
          coach_comments: string | null
          coach_id: string
          coachability_grade: number | null
          created_at: string
          effort_grade: number | null
          evaluation_date: string
          evaluation_type: string
          focus_areas: string[] | null
          game_id: string | null
          id: string
          overall_grade: number | null
          player_id: string
          player_response: string | null
          player_viewed: boolean | null
          player_viewed_at: string | null
          recommended_drills: string[] | null
          shared_at: string | null
          shared_with_player: boolean | null
          skill_ratings: Json | null
          strengths: string | null
          team_id: string
          teamwork_grade: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          areas_for_improvement?: string | null
          coach_comments?: string | null
          coach_id: string
          coachability_grade?: number | null
          created_at?: string
          effort_grade?: number | null
          evaluation_date?: string
          evaluation_type: string
          focus_areas?: string[] | null
          game_id?: string | null
          id?: string
          overall_grade?: number | null
          player_id: string
          player_response?: string | null
          player_viewed?: boolean | null
          player_viewed_at?: string | null
          recommended_drills?: string[] | null
          shared_at?: string | null
          shared_with_player?: boolean | null
          skill_ratings?: Json | null
          strengths?: string | null
          team_id: string
          teamwork_grade?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          areas_for_improvement?: string | null
          coach_comments?: string | null
          coach_id?: string
          coachability_grade?: number | null
          created_at?: string
          effort_grade?: number | null
          evaluation_date?: string
          evaluation_type?: string
          focus_areas?: string[] | null
          game_id?: string | null
          id?: string
          overall_grade?: number | null
          player_id?: string
          player_response?: string | null
          player_viewed?: boolean | null
          player_viewed_at?: string | null
          recommended_drills?: string[] | null
          shared_at?: string | null
          shared_with_player?: boolean | null
          skill_ratings?: Json | null
          strengths?: string | null
          team_id?: string
          teamwork_grade?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_evaluations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_evaluations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "player_game_stats_aggregated"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "player_evaluations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_evaluations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      player_game_status: {
        Row: {
          created_at: string | null
          fatigue_score: number | null
          game_date: string | null
          id: number
          injury_risk_score: number | null
          player_id: string
        }
        Insert: {
          created_at?: string | null
          fatigue_score?: number | null
          game_date?: string | null
          id?: number
          injury_risk_score?: number | null
          player_id: string
        }
        Update: {
          created_at?: string | null
          fatigue_score?: number | null
          game_date?: string | null
          id?: number
          injury_risk_score?: number | null
          player_id?: string
        }
        Relationships: []
      }
      player_observation_reads: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          id: string
          observation_id: string
          player_id: string
          player_response: string | null
          read_at: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          id?: string
          observation_id: string
          player_id: string
          player_response?: string | null
          read_at?: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          id?: string
          observation_id?: string
          player_id?: string
          player_response?: string | null
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_observation_reads_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "coach_observations"
            referencedColumns: ["id"]
          },
        ]
      }
      player_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_type: string
          player_id: string
          receipt_url: string | null
          reference_number: string | null
          status: string | null
          team_id: string
          tournament_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_type: string
          player_id: string
          receipt_url?: string | null
          reference_number?: string | null
          status?: string | null
          team_id: string
          tournament_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: string
          player_id?: string
          receipt_url?: string | null
          reference_number?: string | null
          status?: string | null
          team_id?: string
          tournament_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_payments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_payments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_payments_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      player_position_history: {
        Row: {
          created_at: string | null
          id: number
          is_current: boolean | null
          player_id: string
          position_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_current?: boolean | null
          player_id: string
          position_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_current?: boolean | null
          player_id?: string
          position_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_position_history_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "flag_football_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      player_position_preferences: {
        Row: {
          coach_notes: string | null
          coach_rated_positions: Json | null
          created_at: string
          id: string
          player_id: string
          player_notes: string | null
          primary_position: string
          secondary_positions: string[] | null
          team_id: string
          updated_at: string
          user_id: string | null
          willing_to_learn: string[] | null
        }
        Insert: {
          coach_notes?: string | null
          coach_rated_positions?: Json | null
          created_at?: string
          id?: string
          player_id: string
          player_notes?: string | null
          primary_position: string
          secondary_positions?: string[] | null
          team_id: string
          updated_at?: string
          user_id?: string | null
          willing_to_learn?: string[] | null
        }
        Update: {
          coach_notes?: string | null
          coach_rated_positions?: Json | null
          created_at?: string
          id?: string
          player_id?: string
          player_notes?: string | null
          primary_position?: string
          secondary_positions?: string[] | null
          team_id?: string
          updated_at?: string
          user_id?: string | null
          willing_to_learn?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "player_position_preferences_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_position_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      player_program_cycles: {
        Row: {
          completed_at: string | null
          current_week_number: number | null
          cycle_id: string
          id: string
          personal_goals: Json | null
          personal_target_metrics: Json | null
          progress_notes: string | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_week_number?: number | null
          cycle_id: string
          id?: string
          personal_goals?: Json | null
          personal_target_metrics?: Json | null
          progress_notes?: string | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_week_number?: number | null
          cycle_id?: string
          id?: string
          personal_goals?: Json | null
          personal_target_metrics?: Json | null
          progress_notes?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_program_cycles_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "program_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_programs: {
        Row: {
          assigned_by: string | null
          completion_percentage: number | null
          created_at: string | null
          current_phase_id: string | null
          current_week: number | null
          end_date: string | null
          id: string
          modifications: Json | null
          notes: string | null
          player_id: string
          program_id: string | null
          start_date: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_phase_id?: string | null
          current_week?: number | null
          end_date?: string | null
          id?: string
          modifications?: Json | null
          notes?: string | null
          player_id: string
          program_id?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_phase_id?: string | null
          current_week?: number | null
          end_date?: string | null
          id?: string
          modifications?: Json | null
          notes?: string | null
          player_id?: string
          program_id?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_programs_current_phase_id_fkey"
            columns: ["current_phase_id"]
            isOneToOne: false
            referencedRelation: "training_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_programs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats_consent: {
        Row: {
          can_view_detailed_stats: boolean | null
          can_view_domestic_league: boolean | null
          can_view_historical: boolean | null
          can_view_personal_games: boolean | null
          coach_id: string
          consent_granted: boolean | null
          consent_type: string | null
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          id: string
          player_id: string
          revoked_at: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          can_view_detailed_stats?: boolean | null
          can_view_domestic_league?: boolean | null
          can_view_historical?: boolean | null
          can_view_personal_games?: boolean | null
          coach_id: string
          consent_granted?: boolean | null
          consent_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          player_id: string
          revoked_at?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          can_view_detailed_stats?: boolean | null
          can_view_domestic_league?: boolean | null
          can_view_historical?: boolean | null
          can_view_personal_games?: boolean | null
          coach_id?: string
          consent_granted?: boolean | null
          consent_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          player_id?: string
          revoked_at?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_consent_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_streaks: {
        Row: {
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          streak_history: Json | null
          streak_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_history?: Json | null
          streak_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_history?: Json | null
          streak_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      player_tournament_availability: {
        Row: {
          accommodation_needed: boolean | null
          amount_due: number | null
          amount_paid: number | null
          arrival_date: string | null
          created_at: string | null
          departure_date: string | null
          dietary_restrictions: string | null
          id: string
          payment_deadline: string | null
          payment_status: string | null
          player_id: string
          reason: string | null
          responded_at: string | null
          status: string
          team_id: string
          tournament_id: string
          transportation_needed: boolean | null
          updated_at: string | null
        }
        Insert: {
          accommodation_needed?: boolean | null
          amount_due?: number | null
          amount_paid?: number | null
          arrival_date?: string | null
          created_at?: string | null
          departure_date?: string | null
          dietary_restrictions?: string | null
          id?: string
          payment_deadline?: string | null
          payment_status?: string | null
          player_id: string
          reason?: string | null
          responded_at?: string | null
          status?: string
          team_id: string
          tournament_id: string
          transportation_needed?: boolean | null
          updated_at?: string | null
        }
        Update: {
          accommodation_needed?: boolean | null
          amount_due?: number | null
          amount_paid?: number | null
          arrival_date?: string | null
          created_at?: string | null
          departure_date?: string | null
          dietary_restrictions?: string | null
          id?: string
          payment_deadline?: string | null
          payment_status?: string | null
          player_id?: string
          reason?: string | null
          responded_at?: string | null
          status?: string
          team_id?: string
          tournament_id?: string
          transportation_needed?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_tournament_availability_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_tournament_availability_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_tournament_availability_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      player_training_stats: {
        Row: {
          current_month: string | null
          id: string
          month_load_au: number | null
          month_sessions: number | null
          total_achievements: number | null
          total_arm_care_sessions: number | null
          total_exercises: number | null
          total_load_au: number | null
          total_points: number | null
          total_sessions: number | null
          total_throws: number | null
          total_training_minutes: number | null
          tournaments_completed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_month?: string | null
          id?: string
          month_load_au?: number | null
          month_sessions?: number | null
          total_achievements?: number | null
          total_arm_care_sessions?: number | null
          total_exercises?: number | null
          total_load_au?: number | null
          total_points?: number | null
          total_sessions?: number | null
          total_throws?: number | null
          total_training_minutes?: number | null
          tournaments_completed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_month?: string | null
          id?: string
          month_load_au?: number | null
          month_sessions?: number | null
          total_achievements?: number | null
          total_arm_care_sessions?: number | null
          total_exercises?: number | null
          total_load_au?: number | null
          total_points?: number | null
          total_sessions?: number | null
          total_throws?: number | null
          total_training_minutes?: number | null
          tournaments_completed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plyometrics_exercises: {
        Row: {
          applicable_sports: string[] | null
          common_mistakes: string[] | null
          contraindications: string[] | null
          created_at: string | null
          description: string
          difficulty_level: string
          effectiveness_rating: number | null
          equipment_needed: string[] | null
          exercise_category: string
          exercise_name: string
          id: string
          image_url: string | null
          injury_risk_rating: string | null
          instructions: string[]
          intensity_level: string | null
          performance_improvements: Json | null
          position_applications: Json | null
          position_specific: boolean | null
          progression_guidelines: string[] | null
          proper_form_guidelines: string[] | null
          research_based: boolean | null
          rest_periods: string[] | null
          safety_notes: string[] | null
          space_requirements: string | null
          surface_requirements: string | null
          updated_at: string | null
          video_url: string | null
          volume_recommendations: string[] | null
        }
        Insert: {
          applicable_sports?: string[] | null
          common_mistakes?: string[] | null
          contraindications?: string[] | null
          created_at?: string | null
          description: string
          difficulty_level: string
          effectiveness_rating?: number | null
          equipment_needed?: string[] | null
          exercise_category: string
          exercise_name: string
          id?: string
          image_url?: string | null
          injury_risk_rating?: string | null
          instructions: string[]
          intensity_level?: string | null
          performance_improvements?: Json | null
          position_applications?: Json | null
          position_specific?: boolean | null
          progression_guidelines?: string[] | null
          proper_form_guidelines?: string[] | null
          research_based?: boolean | null
          rest_periods?: string[] | null
          safety_notes?: string[] | null
          space_requirements?: string | null
          surface_requirements?: string | null
          updated_at?: string | null
          video_url?: string | null
          volume_recommendations?: string[] | null
        }
        Update: {
          applicable_sports?: string[] | null
          common_mistakes?: string[] | null
          contraindications?: string[] | null
          created_at?: string | null
          description?: string
          difficulty_level?: string
          effectiveness_rating?: number | null
          equipment_needed?: string[] | null
          exercise_category?: string
          exercise_name?: string
          id?: string
          image_url?: string | null
          injury_risk_rating?: string | null
          instructions?: string[]
          intensity_level?: string | null
          performance_improvements?: Json | null
          position_applications?: Json | null
          position_specific?: boolean | null
          progression_guidelines?: string[] | null
          proper_form_guidelines?: string[] | null
          research_based?: boolean | null
          rest_periods?: string[] | null
          safety_notes?: string[] | null
          space_requirements?: string | null
          surface_requirements?: string | null
          updated_at?: string | null
          video_url?: string | null
          volume_recommendations?: string[] | null
        }
        Relationships: []
      }
      plyometrics_training_programs: {
        Row: {
          assessment_protocols: string[] | null
          created_at: string | null
          duration_weeks: number
          exercise_sequence: Json | null
          exercise_substitutions: Json | null
          exercises_per_session: number | null
          id: string
          intensity_progression: Json | null
          modification_guidelines: string[] | null
          performance_metrics: string[] | null
          program_name: string
          program_type: string
          progression_model: string | null
          research_based: boolean | null
          safety_guidelines: string[] | null
          sessions_per_week: number
          success_criteria: Json | null
          supporting_research_ids: string[] | null
          target_population: string | null
          updated_at: string | null
          verkhoshansky_influence: boolean | null
          volume_progression: Json | null
        }
        Insert: {
          assessment_protocols?: string[] | null
          created_at?: string | null
          duration_weeks: number
          exercise_sequence?: Json | null
          exercise_substitutions?: Json | null
          exercises_per_session?: number | null
          id?: string
          intensity_progression?: Json | null
          modification_guidelines?: string[] | null
          performance_metrics?: string[] | null
          program_name: string
          program_type: string
          progression_model?: string | null
          research_based?: boolean | null
          safety_guidelines?: string[] | null
          sessions_per_week: number
          success_criteria?: Json | null
          supporting_research_ids?: string[] | null
          target_population?: string | null
          updated_at?: string | null
          verkhoshansky_influence?: boolean | null
          volume_progression?: Json | null
        }
        Update: {
          assessment_protocols?: string[] | null
          created_at?: string | null
          duration_weeks?: number
          exercise_sequence?: Json | null
          exercise_substitutions?: Json | null
          exercises_per_session?: number | null
          id?: string
          intensity_progression?: Json | null
          modification_guidelines?: string[] | null
          performance_metrics?: string[] | null
          program_name?: string
          program_type?: string
          progression_model?: string | null
          research_based?: boolean | null
          safety_guidelines?: string[] | null
          sessions_per_week?: number
          success_criteria?: Json | null
          supporting_research_ids?: string[] | null
          target_population?: string | null
          updated_at?: string | null
          verkhoshansky_influence?: boolean | null
          volume_progression?: Json | null
        }
        Relationships: []
      }
      position_competitions: {
        Row: {
          coach_notes: string | null
          competitor_scores: Json | null
          competitors: string[]
          created_at: string
          created_by: string
          decision_rationale: string | null
          description: string | null
          end_date: string | null
          evaluation_criteria: Json | null
          id: string
          position_code: string
          start_date: string
          status: string | null
          team_id: string
          title: string | null
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          coach_notes?: string | null
          competitor_scores?: Json | null
          competitors: string[]
          created_at?: string
          created_by: string
          decision_rationale?: string | null
          description?: string | null
          end_date?: string | null
          evaluation_criteria?: Json | null
          id?: string
          position_code: string
          start_date?: string
          status?: string | null
          team_id: string
          title?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          coach_notes?: string | null
          competitor_scores?: Json | null
          competitors?: string[]
          created_at?: string
          created_by?: string
          decision_rationale?: string | null
          description?: string | null
          end_date?: string | null
          evaluation_criteria?: Json | null
          id?: string
          position_code?: string
          start_date?: string
          status?: string | null
          team_id?: string
          title?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "position_competitions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      position_exercise_modifiers: {
        Row: {
          additional_exercises: Json | null
          created_at: string | null
          exercise_category: string
          id: string
          intensity_modifier: number | null
          notes: string | null
          position: string
          priority: number | null
          skip_exercises: string[] | null
          volume_modifier: number | null
        }
        Insert: {
          additional_exercises?: Json | null
          created_at?: string | null
          exercise_category: string
          id?: string
          intensity_modifier?: number | null
          notes?: string | null
          position: string
          priority?: number | null
          skip_exercises?: string[] | null
          volume_modifier?: number | null
        }
        Update: {
          additional_exercises?: Json | null
          created_at?: string | null
          exercise_category?: string
          id?: string
          intensity_modifier?: number | null
          notes?: string | null
          position?: string
          priority?: number | null
          skip_exercises?: string[] | null
          volume_modifier?: number | null
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
      position_specific_metrics: {
        Row: {
          broad_jump: number | null
          created_at: string | null
          forty_yard_dash: number | null
          id: string
          metric_date: string
          notes: string | null
          player_id: string
          position_id: string | null
          pro_agility: number | null
          skill_metrics: Json | null
          test_conditions: string | null
          three_cone: number | null
          updated_at: string | null
          vertical_jump: number | null
        }
        Insert: {
          broad_jump?: number | null
          created_at?: string | null
          forty_yard_dash?: number | null
          id?: string
          metric_date?: string
          notes?: string | null
          player_id: string
          position_id?: string | null
          pro_agility?: number | null
          skill_metrics?: Json | null
          test_conditions?: string | null
          three_cone?: number | null
          updated_at?: string | null
          vertical_jump?: number | null
        }
        Update: {
          broad_jump?: number | null
          created_at?: string | null
          forty_yard_dash?: number | null
          id?: string
          metric_date?: string
          notes?: string | null
          player_id?: string
          position_id?: string | null
          pro_agility?: number | null
          skill_metrics?: Json | null
          test_conditions?: string | null
          three_cone?: number | null
          updated_at?: string | null
          vertical_jump?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "position_specific_metrics_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      post_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          likes_count: number | null
          location: string | null
          media_type: string | null
          media_url: string | null
          media_urls: string[] | null
          post_type: string | null
          shares_count: number | null
          team_id: string | null
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          media_urls?: string[] | null
          post_type?: string | null
          shares_count?: number | null
          team_id?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          media_urls?: string[] | null
          post_type?: string | null
          shares_count?: number | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_participation: {
        Row: {
          competitive_reps: number | null
          created_at: string | null
          defensive_reps: number | null
          first_team_reps: number | null
          id: string
          limitation_reason: string | null
          notes: string | null
          participation_level: string | null
          passing_reps: number | null
          position_group: string | null
          practice_date: string | null
          practice_intensity: string | null
          practice_type: string | null
          receiving_reps: number | null
          reps_with_mistakes: number | null
          rushing_reps: number | null
          scout_team_reps: number | null
          successful_reps: number | null
          team_id: string | null
          total_reps_taken: number
          unit_assignment: string
          user_id: string
        }
        Insert: {
          competitive_reps?: number | null
          created_at?: string | null
          defensive_reps?: number | null
          first_team_reps?: number | null
          id?: string
          limitation_reason?: string | null
          notes?: string | null
          participation_level?: string | null
          passing_reps?: number | null
          position_group?: string | null
          practice_date?: string | null
          practice_intensity?: string | null
          practice_type?: string | null
          receiving_reps?: number | null
          reps_with_mistakes?: number | null
          rushing_reps?: number | null
          scout_team_reps?: number | null
          successful_reps?: number | null
          team_id?: string | null
          total_reps_taken?: number
          unit_assignment: string
          user_id: string
        }
        Update: {
          competitive_reps?: number | null
          created_at?: string | null
          defensive_reps?: number | null
          first_team_reps?: number | null
          id?: string
          limitation_reason?: string | null
          notes?: string | null
          participation_level?: string | null
          passing_reps?: number | null
          position_group?: string | null
          practice_date?: string | null
          practice_intensity?: string | null
          practice_type?: string | null
          receiving_reps?: number | null
          reps_with_mistakes?: number | null
          rushing_reps?: number | null
          scout_team_reps?: number | null
          successful_reps?: number | null
          team_id?: string | null
          total_reps_taken?: number
          unit_assignment?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_participation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      privacy_audit_log: {
        Row: {
          action: string
          affected_data: Json | null
          affected_table: string | null
          created_at: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          affected_data?: Json | null
          affected_table?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          affected_data?: Json | null
          affected_table?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          ai_processing_consent_date: string | null
          ai_processing_enabled: boolean
          consent_version: string
          created_at: string
          emergency_contacts: Json | null
          emergency_sharing_level: string
          health_sharing_default: boolean
          marketing_consent_date: string | null
          marketing_opt_in: boolean
          performance_sharing_default: boolean
          research_consent_date: string | null
          research_opt_in: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_processing_consent_date?: string | null
          ai_processing_enabled?: boolean
          consent_version?: string
          created_at?: string
          emergency_contacts?: Json | null
          emergency_sharing_level?: string
          health_sharing_default?: boolean
          marketing_consent_date?: string | null
          marketing_opt_in?: boolean
          performance_sharing_default?: boolean
          research_consent_date?: string | null
          research_opt_in?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_processing_consent_date?: string | null
          ai_processing_enabled?: boolean
          consent_version?: string
          created_at?: string
          emergency_contacts?: Json | null
          emergency_sharing_level?: string
          health_sharing_default?: boolean
          marketing_consent_date?: string | null
          marketing_opt_in?: boolean
          performance_sharing_default?: boolean
          research_consent_date?: string | null
          research_opt_in?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proactive_checkins: {
        Row: {
          checkin_type: string
          created_at: string
          engaged_at: string | null
          id: string
          message_template: string
          personalization_data: Json | null
          related_game_id: string | null
          related_goal: string | null
          related_injury_id: string | null
          scheduled_for: string
          sent_at: string | null
          status: string | null
          trigger_event: string | null
          user_id: string
        }
        Insert: {
          checkin_type: string
          created_at?: string
          engaged_at?: string | null
          id?: string
          message_template: string
          personalization_data?: Json | null
          related_game_id?: string | null
          related_goal?: string | null
          related_injury_id?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          trigger_event?: string | null
          user_id: string
        }
        Update: {
          checkin_type?: string
          created_at?: string
          engaged_at?: string | null
          id?: string
          message_template?: string
          personalization_data?: Json | null
          related_game_id?: string | null
          related_goal?: string | null
          related_injury_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          trigger_event?: string | null
          user_id?: string
        }
        Relationships: []
      }
      program_cycles: {
        Row: {
          achieved_metrics: Json | null
          created_at: string | null
          cycle_goals: Json | null
          cycle_type: string
          cycle_year: number
          description: string | null
          end_date: string
          end_of_cycle_review: string | null
          id: string
          name: string
          primary_program_id: string | null
          start_date: string
          status: string | null
          target_event: string | null
          target_metrics: Json | null
          updated_at: string | null
          years_to_target: number | null
        }
        Insert: {
          achieved_metrics?: Json | null
          created_at?: string | null
          cycle_goals?: Json | null
          cycle_type: string
          cycle_year: number
          description?: string | null
          end_date: string
          end_of_cycle_review?: string | null
          id?: string
          name: string
          primary_program_id?: string | null
          start_date: string
          status?: string | null
          target_event?: string | null
          target_metrics?: Json | null
          updated_at?: string | null
          years_to_target?: number | null
        }
        Update: {
          achieved_metrics?: Json | null
          created_at?: string | null
          cycle_goals?: Json | null
          cycle_type?: string
          cycle_year?: number
          description?: string | null
          end_date?: string
          end_of_cycle_review?: string | null
          id?: string
          name?: string
          primary_program_id?: string | null
          start_date?: string
          status?: string | null
          target_event?: string | null
          target_metrics?: Json | null
          updated_at?: string | null
          years_to_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "program_cycles_primary_program_id_fkey"
            columns: ["primary_program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_completions: {
        Row: {
          athlete_notes: string | null
          badge_awarded: string | null
          block_type: string
          completed_at: string
          completion_date: string
          created_at: string | null
          exercise_id: string | null
          id: string
          logged_to_acwr: boolean | null
          logged_to_wellness: boolean | null
          protocol_exercise_id: string | null
          protocol_id: string
          skip_reason: string | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          athlete_notes?: string | null
          badge_awarded?: string | null
          block_type: string
          completed_at?: string
          completion_date: string
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          logged_to_acwr?: boolean | null
          logged_to_wellness?: boolean | null
          protocol_exercise_id?: string | null
          protocol_id: string
          skip_reason?: string | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          athlete_notes?: string | null
          badge_awarded?: string | null
          block_type?: string
          completed_at?: string
          completion_date?: string
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          logged_to_acwr?: boolean | null
          logged_to_wellness?: boolean | null
          protocol_exercise_id?: string | null
          protocol_id?: string
          skip_reason?: string | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_completions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_completions_protocol_exercise_id_fkey"
            columns: ["protocol_exercise_id"]
            isOneToOne: false
            referencedRelation: "protocol_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_completions_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "daily_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_exercises: {
        Row: {
          actual_duration_seconds: number | null
          actual_hold_seconds: number | null
          actual_reps: number | null
          actual_sets: number | null
          actual_weight_kg: number | null
          ai_note: string | null
          block_type: string
          completed_at: string | null
          created_at: string | null
          exercise_id: string
          id: string
          load_contribution_au: number | null
          prescribed_duration_seconds: number | null
          prescribed_hold_seconds: number | null
          prescribed_reps: number | null
          prescribed_sets: number
          prescribed_weight_kg: number | null
          progression_note: string | null
          protocol_id: string
          sequence_order: number
          status: string | null
          updated_at: string | null
          yesterday_hold_seconds: number | null
          yesterday_reps: number | null
          yesterday_sets: number | null
        }
        Insert: {
          actual_duration_seconds?: number | null
          actual_hold_seconds?: number | null
          actual_reps?: number | null
          actual_sets?: number | null
          actual_weight_kg?: number | null
          ai_note?: string | null
          block_type: string
          completed_at?: string | null
          created_at?: string | null
          exercise_id: string
          id?: string
          load_contribution_au?: number | null
          prescribed_duration_seconds?: number | null
          prescribed_hold_seconds?: number | null
          prescribed_reps?: number | null
          prescribed_sets: number
          prescribed_weight_kg?: number | null
          progression_note?: string | null
          protocol_id: string
          sequence_order: number
          status?: string | null
          updated_at?: string | null
          yesterday_hold_seconds?: number | null
          yesterday_reps?: number | null
          yesterday_sets?: number | null
        }
        Update: {
          actual_duration_seconds?: number | null
          actual_hold_seconds?: number | null
          actual_reps?: number | null
          actual_sets?: number | null
          actual_weight_kg?: number | null
          ai_note?: string | null
          block_type?: string
          completed_at?: string | null
          created_at?: string | null
          exercise_id?: string
          id?: string
          load_contribution_au?: number | null
          prescribed_duration_seconds?: number | null
          prescribed_hold_seconds?: number | null
          prescribed_reps?: number | null
          prescribed_sets?: number
          prescribed_weight_kg?: number | null
          progression_note?: string | null
          protocol_id?: string
          sequence_order?: number
          status?: string | null
          updated_at?: string | null
          yesterday_hold_seconds?: number | null
          yesterday_reps?: number | null
          yesterday_sets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "protocol_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_exercises_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "daily_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      psychological_assessments: {
        Row: {
          assessment_type: string
          coach_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          interpretation: string | null
          professional_notes: string | null
          questions: Json
          recommendations: Json | null
          requires_professional_review: boolean | null
          responses: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          assessment_type: string
          coach_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          interpretation?: string | null
          professional_notes?: string | null
          questions?: Json
          recommendations?: Json | null
          requires_professional_review?: boolean | null
          responses?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          assessment_type?: string
          coach_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          interpretation?: string | null
          professional_notes?: string | null
          questions?: Json
          recommendations?: Json | null
          requires_professional_review?: boolean | null
          responses?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychological_assessments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "ai_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notification_log: {
        Row: {
          body: string
          category: string | null
          delivered_at: string | null
          device_type: string | null
          error_code: string | null
          error_message: string | null
          id: string
          opened_at: string | null
          platform_message_id: string | null
          platform_response: Json | null
          queue_id: string | null
          sent_at: string
          status: string
          title: string
          token_used: string | null
          user_id: string
        }
        Insert: {
          body: string
          category?: string | null
          delivered_at?: string | null
          device_type?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          platform_message_id?: string | null
          platform_response?: Json | null
          queue_id?: string | null
          sent_at?: string
          status: string
          title: string
          token_used?: string | null
          user_id: string
        }
        Update: {
          body?: string
          category?: string | null
          delivered_at?: string | null
          device_type?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          platform_message_id?: string | null
          platform_response?: Json | null
          queue_id?: string | null
          sent_at?: string
          status?: string
          title?: string
          token_used?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_notification_log_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "push_notification_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notification_preferences: {
        Row: {
          achievement_notifications: boolean | null
          coach_messages: boolean | null
          created_at: string | null
          digest_frequency: string | null
          email_enabled: boolean | null
          game_reminders: boolean | null
          id: string
          push_enabled: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_enabled: boolean | null
          social_notifications: boolean | null
          team_announcements: boolean | null
          training_reminders: boolean | null
          updated_at: string | null
          user_id: string
          wellness_reminders: boolean | null
          workout_notifications: boolean | null
        }
        Insert: {
          achievement_notifications?: boolean | null
          coach_messages?: boolean | null
          created_at?: string | null
          digest_frequency?: string | null
          email_enabled?: boolean | null
          game_reminders?: boolean | null
          id?: string
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          social_notifications?: boolean | null
          team_announcements?: boolean | null
          training_reminders?: boolean | null
          updated_at?: string | null
          user_id: string
          wellness_reminders?: boolean | null
          workout_notifications?: boolean | null
        }
        Update: {
          achievement_notifications?: boolean | null
          coach_messages?: boolean | null
          created_at?: string | null
          digest_frequency?: string | null
          email_enabled?: boolean | null
          game_reminders?: boolean | null
          id?: string
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean | null
          social_notifications?: boolean | null
          team_announcements?: boolean | null
          training_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string
          wellness_reminders?: boolean | null
          workout_notifications?: boolean | null
        }
        Relationships: []
      }
      push_notification_queue: {
        Row: {
          apns_options: Json | null
          attempts: number | null
          body: string
          category: string
          created_at: string
          data: Json | null
          delivered_at: string | null
          expires_at: string | null
          fcm_options: Json | null
          id: string
          image_url: string | null
          last_error: string | null
          max_attempts: number | null
          opened_at: string | null
          priority: string | null
          scheduled_for: string | null
          sent_at: string | null
          source_id: string | null
          source_type: string | null
          status: string | null
          title: string
          token_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apns_options?: Json | null
          attempts?: number | null
          body: string
          category?: string
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          expires_at?: string | null
          fcm_options?: Json | null
          id?: string
          image_url?: string | null
          last_error?: string | null
          max_attempts?: number | null
          opened_at?: string | null
          priority?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          title: string
          token_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apns_options?: Json | null
          attempts?: number | null
          body?: string
          category?: string
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          expires_at?: string | null
          fcm_options?: Json | null
          id?: string
          image_url?: string | null
          last_error?: string | null
          max_attempts?: number | null
          opened_at?: string | null
          priority?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          title?: string
          token_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_notification_queue_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "push_notification_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notification_tokens: {
        Row: {
          app_version: string | null
          consecutive_failures: number | null
          created_at: string
          device_id: string | null
          device_model: string | null
          device_type: string | null
          id: string
          is_active: boolean | null
          last_failure_at: string | null
          last_failure_reason: string | null
          last_used_at: string | null
          os_version: string | null
          token: string
          token_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          consecutive_failures?: number | null
          created_at?: string
          device_id?: string | null
          device_model?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_failure_reason?: string | null
          last_used_at?: string | null
          os_version?: string | null
          token: string
          token_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          consecutive_failures?: number | null
          created_at?: string
          device_id?: string | null
          device_model?: string | null
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_failure_reason?: string | null
          last_used_at?: string | null
          os_version?: string | null
          token?: string
          token_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          active: boolean | null
          auth_key: string
          created_at: string | null
          device_info: Json | null
          endpoint: string
          id: string
          p256dh_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          auth_key: string
          created_at?: string | null
          device_info?: Json | null
          endpoint: string
          id?: string
          p256dh_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          auth_key?: string
          created_at?: string | null
          device_info?: Json | null
          endpoint?: string
          id?: string
          p256dh_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      qb_arm_care_log: {
        Row: {
          arm_care_type: string
          created_at: string | null
          duration_minutes: number | null
          elbow_soreness: number | null
          exercises_completed: Json | null
          forearm_soreness: number | null
          ice_applied: boolean | null
          ice_duration_minutes: number | null
          id: string
          log_date: string
          notes: string | null
          shoulder_soreness: number | null
          user_id: string
        }
        Insert: {
          arm_care_type: string
          created_at?: string | null
          duration_minutes?: number | null
          elbow_soreness?: number | null
          exercises_completed?: Json | null
          forearm_soreness?: number | null
          ice_applied?: boolean | null
          ice_duration_minutes?: number | null
          id?: string
          log_date: string
          notes?: string | null
          shoulder_soreness?: number | null
          user_id: string
        }
        Update: {
          arm_care_type?: string
          created_at?: string | null
          duration_minutes?: number | null
          elbow_soreness?: number | null
          exercises_completed?: Json | null
          forearm_soreness?: number | null
          ice_applied?: boolean | null
          ice_duration_minutes?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          shoulder_soreness?: number | null
          user_id?: string
        }
        Relationships: []
      }
      qb_throwing_sessions: {
        Row: {
          arm_care_duration_minutes: number | null
          arm_feeling_after: number | null
          arm_feeling_before: number | null
          created_at: string | null
          fatigue_level: number | null
          ice_applied: boolean | null
          id: string
          location: string | null
          long_throws: number | null
          mechanics_focus: string | null
          medium_throws: number | null
          notes: string | null
          post_throwing_arm_care_done: boolean | null
          pre_throwing_warmup_done: boolean | null
          session_date: string
          session_type: string | null
          short_throws: number | null
          throwing_duration_minutes: number | null
          total_throws: number
          updated_at: string | null
          user_id: string
          warmup_duration_minutes: number | null
        }
        Insert: {
          arm_care_duration_minutes?: number | null
          arm_feeling_after?: number | null
          arm_feeling_before?: number | null
          created_at?: string | null
          fatigue_level?: number | null
          ice_applied?: boolean | null
          id?: string
          location?: string | null
          long_throws?: number | null
          mechanics_focus?: string | null
          medium_throws?: number | null
          notes?: string | null
          post_throwing_arm_care_done?: boolean | null
          pre_throwing_warmup_done?: boolean | null
          session_date: string
          session_type?: string | null
          short_throws?: number | null
          throwing_duration_minutes?: number | null
          total_throws?: number
          updated_at?: string | null
          user_id: string
          warmup_duration_minutes?: number | null
        }
        Update: {
          arm_care_duration_minutes?: number | null
          arm_feeling_after?: number | null
          arm_feeling_before?: number | null
          created_at?: string | null
          fatigue_level?: number | null
          ice_applied?: boolean | null
          id?: string
          location?: string | null
          long_throws?: number | null
          mechanics_focus?: string | null
          medium_throws?: number | null
          notes?: string | null
          post_throwing_arm_care_done?: boolean | null
          pre_throwing_warmup_done?: boolean | null
          session_date?: string
          session_type?: string | null
          short_throws?: number | null
          throwing_duration_minutes?: number | null
          total_throws?: number
          updated_at?: string | null
          user_id?: string
          warmup_duration_minutes?: number | null
        }
        Relationships: []
      }
      query_understanding_cache: {
        Row: {
          avg_response_helpfulness: number | null
          confidence: number
          created_at: string
          detected_intent: string
          entities: Json | null
          hit_count: number | null
          id: string
          last_hit_at: string | null
          query_embedding: string | null
          query_hash: string
          query_normalized: string
          query_type: string | null
        }
        Insert: {
          avg_response_helpfulness?: number | null
          confidence: number
          created_at?: string
          detected_intent: string
          entities?: Json | null
          hit_count?: number | null
          id?: string
          last_hit_at?: string | null
          query_embedding?: string | null
          query_hash: string
          query_normalized: string
          query_type?: string | null
        }
        Update: {
          avg_response_helpfulness?: number | null
          confidence?: number
          created_at?: string
          detected_intent?: string
          entities?: Json | null
          hit_count?: number | null
          id?: string
          last_hit_at?: string | null
          query_embedding?: string | null
          query_hash?: string
          query_normalized?: string
          query_type?: string | null
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
          injury_risk: string | null
          level: string
          proximity_score: number | null
          score: number
          sleep_score: number | null
          suggestion: string
          updated_at: string | null
          user_id: string | null
          wellness_score: number | null
          workload_score: number | null
        }
        Insert: {
          acute_load?: number | null
          acwr?: number | null
          athlete_id?: string
          chronic_load?: number | null
          created_at?: string | null
          day: string
          injury_risk?: string | null
          level: string
          proximity_score?: number | null
          score: number
          sleep_score?: number | null
          suggestion: string
          updated_at?: string | null
          user_id?: string | null
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
          injury_risk?: string | null
          level?: string
          proximity_score?: number | null
          score?: number
          sleep_score?: number | null
          suggestion?: string
          updated_at?: string | null
          user_id?: string | null
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
      recovery_blocks: {
        Row: {
          block_date: string
          created_at: string | null
          focus: string | null
          id: string
          max_load_percent: number
          player_id: string
          protocol_type: string
          restrictions: Json | null
          updated_at: string | null
        }
        Insert: {
          block_date: string
          created_at?: string | null
          focus?: string | null
          id?: string
          max_load_percent: number
          player_id: string
          protocol_type: string
          restrictions?: Json | null
          updated_at?: string | null
        }
        Update: {
          block_date?: string
          created_at?: string | null
          focus?: string | null
          id?: string
          max_load_percent?: number
          player_id?: string
          protocol_type?: string
          restrictions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recovery_protocols: {
        Row: {
          benefits: Json | null
          category: string
          contraindications: Json | null
          created_at: string | null
          duration_minutes: number
          equipment_required: Json | null
          evidence_level: string | null
          frequency_recommendation: string | null
          icon: string | null
          id: string
          intensity_level: string | null
          is_active: boolean | null
          optimal_timing: string | null
          precautions: string | null
          priority: string | null
          protocol_description: string | null
          protocol_name: string
          steps: Json | null
          study_count: number | null
          target_athlete_type: string | null
          target_muscles: Json | null
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          category: string
          contraindications?: Json | null
          created_at?: string | null
          duration_minutes?: number
          equipment_required?: Json | null
          evidence_level?: string | null
          frequency_recommendation?: string | null
          icon?: string | null
          id?: string
          intensity_level?: string | null
          is_active?: boolean | null
          optimal_timing?: string | null
          precautions?: string | null
          priority?: string | null
          protocol_description?: string | null
          protocol_name: string
          steps?: Json | null
          study_count?: number | null
          target_athlete_type?: string | null
          target_muscles?: Json | null
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          category?: string
          contraindications?: Json | null
          created_at?: string | null
          duration_minutes?: number
          equipment_required?: Json | null
          evidence_level?: string | null
          frequency_recommendation?: string | null
          icon?: string | null
          id?: string
          intensity_level?: string | null
          is_active?: boolean | null
          optimal_timing?: string | null
          precautions?: string | null
          priority?: string | null
          protocol_description?: string | null
          protocol_name?: string
          steps?: Json | null
          study_count?: number | null
          target_athlete_type?: string | null
          target_muscles?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recovery_sessions: {
        Row: {
          athlete_id: string
          completed_at: string | null
          created_at: string | null
          duration_actual: number | null
          duration_planned: number | null
          id: string
          notes: string | null
          protocol_id: string
          protocol_name: string
          started_at: string
          status: string
          stopped_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          athlete_id: string
          completed_at?: string | null
          created_at?: string | null
          duration_actual?: number | null
          duration_planned?: number | null
          id?: string
          notes?: string | null
          protocol_id: string
          protocol_name: string
          started_at: string
          status?: string
          stopped_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          athlete_id?: string
          completed_at?: string | null
          created_at?: string | null
          duration_actual?: number | null
          duration_planned?: number | null
          id?: string
          notes?: string | null
          protocol_id?: string
          protocol_name?: string
          started_at?: string
          status?: string
          stopped_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rehab_protocols: {
        Row: {
          created_at: string | null
          evidence_level: string | null
          exercise_frequency_per_week: number | null
          id: string
          injury_severity: string | null
          injury_type: string
          intensity_level: string | null
          load_description: string | null
          phase_duration_days: number | null
          phase_goals: string[] | null
          phase_name: string
          phase_number: number
          progression_criteria: Json
          protocol_name: string
          recommended_exercises: string[] | null
          recommended_recovery_modalities: string[] | null
          reps_per_set: string | null
          research_support: string | null
          rest_between_sets: number | null
          sets_per_exercise: number | null
        }
        Insert: {
          created_at?: string | null
          evidence_level?: string | null
          exercise_frequency_per_week?: number | null
          id?: string
          injury_severity?: string | null
          injury_type: string
          intensity_level?: string | null
          load_description?: string | null
          phase_duration_days?: number | null
          phase_goals?: string[] | null
          phase_name: string
          phase_number: number
          progression_criteria: Json
          protocol_name: string
          recommended_exercises?: string[] | null
          recommended_recovery_modalities?: string[] | null
          reps_per_set?: string | null
          research_support?: string | null
          rest_between_sets?: number | null
          sets_per_exercise?: number | null
        }
        Update: {
          created_at?: string | null
          evidence_level?: string | null
          exercise_frequency_per_week?: number | null
          id?: string
          injury_severity?: string | null
          injury_type?: string
          intensity_level?: string | null
          load_description?: string | null
          phase_duration_days?: number | null
          phase_goals?: string[] | null
          phase_name?: string
          phase_number?: number
          progression_criteria?: Json
          protocol_name?: string
          recommended_exercises?: string[] | null
          recommended_recovery_modalities?: string[] | null
          reps_per_set?: string | null
          research_support?: string | null
          rest_between_sets?: number | null
          sets_per_exercise?: number | null
        }
        Relationships: []
      }
      research_articles: {
        Row: {
          authors: string[] | null
          categories: string[] | null
          created_at: string | null
          evidence_level: string | null
          id: string
          injury_types: string[] | null
          is_open_access: boolean | null
          key_findings: string | null
          keywords: string[] | null
          practical_applications: string[] | null
          primary_category: string | null
          publication_year: number | null
          publisher: string | null
          quality_score: number | null
          recovery_methods: string[] | null
          sport_type: string | null
          study_type: string | null
          tags: string[] | null
          title: string
          training_types: string[] | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          authors?: string[] | null
          categories?: string[] | null
          created_at?: string | null
          evidence_level?: string | null
          id?: string
          injury_types?: string[] | null
          is_open_access?: boolean | null
          key_findings?: string | null
          keywords?: string[] | null
          practical_applications?: string[] | null
          primary_category?: string | null
          publication_year?: number | null
          publisher?: string | null
          quality_score?: number | null
          recovery_methods?: string[] | null
          sport_type?: string | null
          study_type?: string | null
          tags?: string[] | null
          title: string
          training_types?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          authors?: string[] | null
          categories?: string[] | null
          created_at?: string | null
          evidence_level?: string | null
          id?: string
          injury_types?: string[] | null
          is_open_access?: boolean | null
          key_findings?: string | null
          keywords?: string[] | null
          practical_applications?: string[] | null
          primary_category?: string | null
          publication_year?: number | null
          publisher?: string | null
          quality_score?: number | null
          recovery_methods?: string[] | null
          sport_type?: string | null
          study_type?: string | null
          tags?: string[] | null
          title?: string
          training_types?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      research_institutions: {
        Row: {
          city: string | null
          country: string
          created_at: string | null
          department: string | null
          focus_areas: string[] | null
          id: string
          institution_name: string
          is_active: boolean | null
          openalex_id: string | null
          openalex_search_name: string | null
          priority_score: number | null
          ranking_year: number | null
          relevance_to_flag_football: string | null
          shanghai_rank: number | null
          short_name: string | null
          specializations: string[] | null
        }
        Insert: {
          city?: string | null
          country: string
          created_at?: string | null
          department?: string | null
          focus_areas?: string[] | null
          id?: string
          institution_name: string
          is_active?: boolean | null
          openalex_id?: string | null
          openalex_search_name?: string | null
          priority_score?: number | null
          ranking_year?: number | null
          relevance_to_flag_football?: string | null
          shanghai_rank?: number | null
          short_name?: string | null
          specializations?: string[] | null
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string | null
          department?: string | null
          focus_areas?: string[] | null
          id?: string
          institution_name?: string
          is_active?: boolean | null
          openalex_id?: string | null
          openalex_search_name?: string | null
          priority_score?: number | null
          ranking_year?: number | null
          relevance_to_flag_football?: string | null
          shanghai_rank?: number | null
          short_name?: string | null
          specializations?: string[] | null
        }
        Relationships: []
      }
      research_studies: {
        Row: {
          abstract: string | null
          authors: Json | null
          created_at: string | null
          doi: string | null
          evidence_level: string | null
          external_id: string | null
          fetched_at: string | null
          full_text_url: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_open_access: boolean | null
          journal: string | null
          key_findings: string | null
          keywords: string[] | null
          mesh_terms: string[] | null
          pdf_url: string | null
          practical_applications: string | null
          publication_date: string | null
          publication_year: number | null
          relevance_score: number | null
          source: string
          sports: string[] | null
          study_type: string | null
          title: string
          topics: string[] | null
          updated_at: string | null
        }
        Insert: {
          abstract?: string | null
          authors?: Json | null
          created_at?: string | null
          doi?: string | null
          evidence_level?: string | null
          external_id?: string | null
          fetched_at?: string | null
          full_text_url?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_open_access?: boolean | null
          journal?: string | null
          key_findings?: string | null
          keywords?: string[] | null
          mesh_terms?: string[] | null
          pdf_url?: string | null
          practical_applications?: string | null
          publication_date?: string | null
          publication_year?: number | null
          relevance_score?: number | null
          source: string
          sports?: string[] | null
          study_type?: string | null
          title: string
          topics?: string[] | null
          updated_at?: string | null
        }
        Update: {
          abstract?: string | null
          authors?: Json | null
          created_at?: string | null
          doi?: string | null
          evidence_level?: string | null
          external_id?: string | null
          fetched_at?: string | null
          full_text_url?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_open_access?: boolean | null
          journal?: string | null
          key_findings?: string | null
          keywords?: string[] | null
          mesh_terms?: string[] | null
          pdf_url?: string | null
          practical_applications?: string | null
          publication_date?: string | null
          publication_year?: number | null
          relevance_score?: number | null
          source?: string
          sports?: string[] | null
          study_type?: string | null
          title?: string
          topics?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      research_topics: {
        Row: {
          color_hex: string | null
          created_at: string | null
          description: string | null
          display_name: string
          europe_pmc_query: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          mesh_terms: string[] | null
          parent_topic_id: string | null
          pubmed_query: string | null
          relevance_to_flag_football: string | null
          sort_order: number | null
          topic_name: string
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          europe_pmc_query?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          mesh_terms?: string[] | null
          parent_topic_id?: string | null
          pubmed_query?: string | null
          relevance_to_flag_football?: string | null
          sort_order?: number | null
          topic_name: string
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          europe_pmc_query?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          mesh_terms?: string[] | null
          parent_topic_id?: string | null
          pubmed_query?: string | null
          relevance_to_flag_football?: string | null
          sort_order?: number | null
          topic_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_topics_parent_topic_id_fkey"
            columns: ["parent_topic_id"]
            isOneToOne: false
            referencedRelation: "research_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      return_to_play_protocols: {
        Row: {
          athlete_id: string
          clearance_notes: string | null
          cleared_at: string | null
          cleared_by: string | null
          created_at: string | null
          current_phase: number
          estimated_completion_date: string | null
          id: string
          injury_id: string | null
          phase_description: string | null
          phase_start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          clearance_notes?: string | null
          cleared_at?: string | null
          cleared_by?: string | null
          created_at?: string | null
          current_phase?: number
          estimated_completion_date?: string | null
          id?: string
          injury_id?: string | null
          phase_description?: string | null
          phase_start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          clearance_notes?: string | null
          cleared_at?: string | null
          cleared_by?: string | null
          created_at?: string | null
          current_phase?: number
          estimated_completion_date?: string | null
          id?: string
          injury_id?: string | null
          phase_description?: string | null
          phase_start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      roster_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
          performed_by_name: string | null
          target_id: string | null
          target_name: string | null
          target_type: string
          team_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type: string
          team_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string
          team_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_audit_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_override_log: {
        Row: {
          athlete_id: string
          athlete_notified: boolean | null
          athlete_notified_at: string | null
          data_disclosed: Json
          disclosed_to_roles: string[]
          disclosed_to_user_ids: string[]
          override_id: string
          override_timestamp: string
          trigger_type: string
          trigger_value: Json
        }
        Insert: {
          athlete_id: string
          athlete_notified?: boolean | null
          athlete_notified_at?: string | null
          data_disclosed: Json
          disclosed_to_roles: string[]
          disclosed_to_user_ids: string[]
          override_id?: string
          override_timestamp?: string
          trigger_type: string
          trigger_value: Json
        }
        Update: {
          athlete_id?: string
          athlete_notified?: boolean | null
          athlete_notified_at?: string | null
          data_disclosed?: Json
          disclosed_to_roles?: string[]
          disclosed_to_user_ids?: string[]
          override_id?: string
          override_timestamp?: string
          trigger_type?: string
          trigger_value?: Json
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          body_template: string
          category: string
          created_at: string
          created_by: string | null
          cron_expression: string | null
          current_occurrences: number | null
          event_id: string | null
          event_type: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          max_occurrences: number | null
          minutes_before: number | null
          next_trigger_at: string | null
          priority: string | null
          schedule_type: string
          target_id: string | null
          target_type: string
          template_data: Json | null
          timezone: string | null
          title_template: string
          updated_at: string
        }
        Insert: {
          body_template: string
          category: string
          created_at?: string
          created_by?: string | null
          cron_expression?: string | null
          current_occurrences?: number | null
          event_id?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          max_occurrences?: number | null
          minutes_before?: number | null
          next_trigger_at?: string | null
          priority?: string | null
          schedule_type: string
          target_id?: string | null
          target_type: string
          template_data?: Json | null
          timezone?: string | null
          title_template: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          category?: string
          created_at?: string
          created_by?: string | null
          cron_expression?: string | null
          current_occurrences?: number | null
          event_id?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          max_occurrences?: number | null
          minutes_before?: number | null
          next_trigger_at?: string | null
          priority?: string | null
          schedule_type?: string
          target_id?: string | null
          target_type?: string
          template_data?: Json | null
          timezone?: string | null
          title_template?: string
          updated_at?: string
        }
        Relationships: []
      }
      scouting_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          defensive_notes: string | null
          film_links: Json | null
          game_date: string | null
          game_plan: Json | null
          id: string
          key_players: Json | null
          location: string | null
          offensive_notes: string | null
          opponent_name: string
          opponent_profile: Json | null
          special_teams_notes: string | null
          status: string | null
          team_id: string | null
          tendencies: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          defensive_notes?: string | null
          film_links?: Json | null
          game_date?: string | null
          game_plan?: Json | null
          id?: string
          key_players?: Json | null
          location?: string | null
          offensive_notes?: string | null
          opponent_name: string
          opponent_profile?: Json | null
          special_teams_notes?: string | null
          status?: string | null
          team_id?: string | null
          tendencies?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          defensive_notes?: string | null
          film_links?: Json | null
          game_date?: string | null
          game_plan?: Json | null
          id?: string
          key_players?: Json | null
          location?: string | null
          offensive_notes?: string | null
          opponent_name?: string
          opponent_profile?: Json | null
          special_teams_notes?: string | null
          status?: string | null
          team_id?: string | null
          tendencies?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scouting_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scouting_reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_training_recommendations: {
        Row: {
          avoid_exercises: string[] | null
          coaching_notes: string | null
          created_at: string | null
          hemisphere: string | null
          id: string
          indoor_preference_score: number | null
          injury_prevention_focus: string[] | null
          isometric_session_percentage: number | null
          isometric_volume_modifier: number | null
          month: number
          outdoor_sprint_suitable: boolean | null
          plyometric_session_percentage: number | null
          plyometric_volume_modifier: number | null
          primary_focus: string
          recommended_isometrics: string[] | null
          recommended_plyometrics: string[] | null
          recommended_sprint_types: string[] | null
          research_citations: string[] | null
          scientific_rationale: string | null
          season: string
          secondary_focus: string | null
          skill_session_percentage: number | null
          sprint_session_percentage: number | null
          sprint_volume_modifier: number | null
          strength_session_percentage: number | null
          strength_volume_modifier: number | null
          training_phase: string | null
          typical_weather: string | null
          updated_at: string | null
        }
        Insert: {
          avoid_exercises?: string[] | null
          coaching_notes?: string | null
          created_at?: string | null
          hemisphere?: string | null
          id?: string
          indoor_preference_score?: number | null
          injury_prevention_focus?: string[] | null
          isometric_session_percentage?: number | null
          isometric_volume_modifier?: number | null
          month: number
          outdoor_sprint_suitable?: boolean | null
          plyometric_session_percentage?: number | null
          plyometric_volume_modifier?: number | null
          primary_focus: string
          recommended_isometrics?: string[] | null
          recommended_plyometrics?: string[] | null
          recommended_sprint_types?: string[] | null
          research_citations?: string[] | null
          scientific_rationale?: string | null
          season: string
          secondary_focus?: string | null
          skill_session_percentage?: number | null
          sprint_session_percentage?: number | null
          sprint_volume_modifier?: number | null
          strength_session_percentage?: number | null
          strength_volume_modifier?: number | null
          training_phase?: string | null
          typical_weather?: string | null
          updated_at?: string | null
        }
        Update: {
          avoid_exercises?: string[] | null
          coaching_notes?: string | null
          created_at?: string | null
          hemisphere?: string | null
          id?: string
          indoor_preference_score?: number | null
          injury_prevention_focus?: string[] | null
          isometric_session_percentage?: number | null
          isometric_volume_modifier?: number | null
          month?: number
          outdoor_sprint_suitable?: boolean | null
          plyometric_session_percentage?: number | null
          plyometric_volume_modifier?: number | null
          primary_focus?: string
          recommended_isometrics?: string[] | null
          recommended_plyometrics?: string[] | null
          recommended_sprint_types?: string[] | null
          research_citations?: string[] | null
          scientific_rationale?: string | null
          season?: string
          secondary_focus?: string | null
          skill_session_percentage?: number | null
          sprint_session_percentage?: number | null
          sprint_volume_modifier?: number | null
          strength_session_percentage?: number | null
          strength_volume_modifier?: number | null
          training_phase?: string | null
          typical_weather?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string | null
          end_date: string | null
          goals: Json | null
          id: string
          is_active: boolean | null
          name: string
          season_type: string | null
          start_date: string
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          season_type?: string | null
          start_date: string
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          season_type?: string | null
          start_date?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      session_exercises: {
        Row: {
          created_at: string | null
          distance_meters: number | null
          duration_seconds: number | null
          exercise_id: string | null
          exercise_name: string
          exercise_order: number
          id: string
          intensity: string | null
          is_superset: boolean | null
          load_description: string | null
          load_percentage: number | null
          notes: string | null
          reps: string | null
          rest_seconds: number | null
          session_template_id: string
          sets: number | null
          superset_group: number | null
          tempo: string | null
        }
        Insert: {
          created_at?: string | null
          distance_meters?: number | null
          duration_seconds?: number | null
          exercise_id?: string | null
          exercise_name: string
          exercise_order?: number
          id?: string
          intensity?: string | null
          is_superset?: boolean | null
          load_description?: string | null
          load_percentage?: number | null
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          session_template_id: string
          sets?: number | null
          superset_group?: number | null
          tempo?: string | null
        }
        Update: {
          created_at?: string | null
          distance_meters?: number | null
          duration_seconds?: number | null
          exercise_id?: string | null
          exercise_name?: string
          exercise_order?: number
          id?: string
          intensity?: string | null
          is_superset?: boolean | null
          load_description?: string | null
          load_percentage?: number | null
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          session_template_id?: string
          sets?: number | null
          superset_group?: number | null
          tempo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_session_template_id_fkey"
            columns: ["session_template_id"]
            isOneToOne: false
            referencedRelation: "training_session_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      session_summaries: {
        Row: {
          actual_duration_minutes: number | null
          athlete_notes: string | null
          average_rpe: number | null
          completed_exercises_count: number | null
          created_at: string | null
          high_intensity_sets_count: number | null
          id: string
          max_rpe: number | null
          overall_performance_rating: number | null
          pain_locations: string[] | null
          pain_reported: boolean | null
          planned_duration_minutes: number | null
          planned_exercises_count: number | null
          session_date: string | null
          session_id: string | null
          session_load: number | null
          session_rpe: number | null
          total_reps_completed: number | null
          total_sets_completed: number | null
          total_weight_lifted_kg: number | null
          user_id: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          athlete_notes?: string | null
          average_rpe?: number | null
          completed_exercises_count?: number | null
          created_at?: string | null
          high_intensity_sets_count?: number | null
          id?: string
          max_rpe?: number | null
          overall_performance_rating?: number | null
          pain_locations?: string[] | null
          pain_reported?: boolean | null
          planned_duration_minutes?: number | null
          planned_exercises_count?: number | null
          session_date?: string | null
          session_id?: string | null
          session_load?: number | null
          session_rpe?: number | null
          total_reps_completed?: number | null
          total_sets_completed?: number | null
          total_weight_lifted_kg?: number | null
          user_id: string
        }
        Update: {
          actual_duration_minutes?: number | null
          athlete_notes?: string | null
          average_rpe?: number | null
          completed_exercises_count?: number | null
          created_at?: string | null
          high_intensity_sets_count?: number | null
          id?: string
          max_rpe?: number | null
          overall_performance_rating?: number | null
          pain_locations?: string[] | null
          pain_reported?: boolean | null
          planned_duration_minutes?: number | null
          planned_exercises_count?: number | null
          session_date?: string | null
          session_id?: string | null
          session_load?: number | null
          session_rpe?: number | null
          total_reps_completed?: number | null
          total_sets_completed?: number | null
          total_weight_lifted_kg?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      session_version_history: {
        Row: {
          athlete_viewed_at: string | null
          created_at: string
          modification_reason: string | null
          modified_at: string
          modified_by_coach_id: string | null
          session_id: string
          session_structure: Json
          version_id: string
          version_number: number
          visible_to_athlete: boolean | null
        }
        Insert: {
          athlete_viewed_at?: string | null
          created_at?: string
          modification_reason?: string | null
          modified_at?: string
          modified_by_coach_id?: string | null
          session_id: string
          session_structure: Json
          version_id?: string
          version_number: number
          visible_to_athlete?: boolean | null
        }
        Update: {
          athlete_viewed_at?: string | null
          created_at?: string
          modification_reason?: string | null
          modified_at?: string
          modified_by_coach_id?: string | null
          session_id?: string
          session_structure?: Json
          version_id?: string
          version_number?: number
          visible_to_athlete?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "session_version_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_insights: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          insight_data: Json
          insight_type: string
          is_anonymous: boolean | null
          shared_with: string | null
          team_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          insight_data: Json
          insight_type: string
          is_anonymous?: boolean | null
          shared_with?: string | null
          team_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          insight_data?: Json
          insight_type?: string
          is_anonymous?: boolean | null
          shared_with?: string | null
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_insights_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      sponsor_contributions: {
        Row: {
          agreement_date: string | null
          contract_url: string | null
          contribution_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          fulfillment_date: string | null
          id: string
          monetary_value: number | null
          sponsor_contact_email: string | null
          sponsor_contact_phone: string | null
          sponsor_name: string
          status: string | null
          team_id: string
          tournament_id: string | null
          updated_at: string | null
        }
        Insert: {
          agreement_date?: string | null
          contract_url?: string | null
          contribution_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fulfillment_date?: string | null
          id?: string
          monetary_value?: number | null
          sponsor_contact_email?: string | null
          sponsor_contact_phone?: string | null
          sponsor_name: string
          status?: string | null
          team_id: string
          tournament_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agreement_date?: string | null
          contract_url?: string | null
          contribution_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fulfillment_date?: string | null
          id?: string
          monetary_value?: number | null
          sponsor_contact_email?: string | null
          sponsor_contact_phone?: string | null
          sponsor_name?: string
          status?: string | null
          team_id?: string
          tournament_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_contributions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_contributions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
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
          user_id_uuid: string
        }
        Insert: {
          available_points?: number | null
          created_at?: string | null
          current_tier?: string | null
          id?: number
          products_available?: number | null
          tier_progress_percentage?: number | null
          user_id: string
          user_id_uuid: string
        }
        Update: {
          available_points?: number | null
          created_at?: string | null
          current_tier?: string | null
          id?: number
          products_available?: number | null
          tier_progress_percentage?: number | null
          user_id?: string
          user_id_uuid?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          sponsor_type: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          sponsor_type?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          sponsor_type?: string | null
          updated_at?: string | null
          website_url?: string | null
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
      staff_roles: {
        Row: {
          can_delete_players: boolean | null
          can_manage_roster: boolean | null
          can_view_health_data: boolean | null
          category: string
          created_at: string | null
          display_name: string
          id: string
          sort_order: number | null
        }
        Insert: {
          can_delete_players?: boolean | null
          can_manage_roster?: boolean | null
          can_view_health_data?: boolean | null
          category: string
          created_at?: string | null
          display_name: string
          id: string
          sort_order?: number | null
        }
        Update: {
          can_delete_players?: boolean | null
          can_manage_roster?: boolean | null
          can_view_health_data?: boolean | null
          category?: string
          created_at?: string | null
          display_name?: string
          id?: string
          sort_order?: number | null
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
      superadmins: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      supplement_calculations: {
        Row: {
          beta_alanine_daily_g: number | null
          beta_alanine_per_dose_g: number | null
          beta_alanine_split_doses: number | null
          body_weight_kg: number
          caffeine_cutoff_hours_before_sleep: number | null
          caffeine_dose_mg_per_kg: number | null
          caffeine_max_daily_mg: number | null
          caffeine_timing_before_exercise_min: number | null
          caffeine_total_mg: number | null
          calculation_date: string
          created_at: string | null
          creatine_loading_days: number | null
          creatine_loading_dose_g: number | null
          creatine_maintenance_dose_g: number | null
          id: string
          notes: string | null
          potassium_per_hour_mg: number | null
          sodium_per_hour_mg: number | null
          user_id: string
        }
        Insert: {
          beta_alanine_daily_g?: number | null
          beta_alanine_per_dose_g?: number | null
          beta_alanine_split_doses?: number | null
          body_weight_kg: number
          caffeine_cutoff_hours_before_sleep?: number | null
          caffeine_dose_mg_per_kg?: number | null
          caffeine_max_daily_mg?: number | null
          caffeine_timing_before_exercise_min?: number | null
          caffeine_total_mg?: number | null
          calculation_date?: string
          created_at?: string | null
          creatine_loading_days?: number | null
          creatine_loading_dose_g?: number | null
          creatine_maintenance_dose_g?: number | null
          id?: string
          notes?: string | null
          potassium_per_hour_mg?: number | null
          sodium_per_hour_mg?: number | null
          user_id: string
        }
        Update: {
          beta_alanine_daily_g?: number | null
          beta_alanine_per_dose_g?: number | null
          beta_alanine_split_doses?: number | null
          body_weight_kg?: number
          caffeine_cutoff_hours_before_sleep?: number | null
          caffeine_dose_mg_per_kg?: number | null
          caffeine_max_daily_mg?: number | null
          caffeine_timing_before_exercise_min?: number | null
          caffeine_total_mg?: number | null
          calculation_date?: string
          created_at?: string | null
          creatine_loading_days?: number | null
          creatine_loading_dose_g?: number | null
          creatine_maintenance_dose_g?: number | null
          id?: string
          notes?: string | null
          potassium_per_hour_mg?: number | null
          sodium_per_hour_mg?: number | null
          user_id?: string
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
      supplement_logs: {
        Row: {
          created_at: string | null
          date: string
          dosage: string | null
          id: string
          notes: string | null
          supplement_name: string
          taken: boolean | null
          time_of_day: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          dosage?: string | null
          id?: string
          notes?: string | null
          supplement_name: string
          taken?: boolean | null
          time_of_day?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          dosage?: string | null
          id?: string
          notes?: string | null
          supplement_name?: string
          taken?: boolean | null
          time_of_day?: string | null
          user_id?: string
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
      sweat_rate_assessments: {
        Row: {
          assessment_date: string
          created_at: string | null
          exercise_duration_minutes: number
          exercise_type: string | null
          fluid_consumed_ml: number | null
          humidity_percent: number | null
          id: string
          indoor_outdoor: string | null
          intensity_level: string | null
          notes: string | null
          post_exercise_weight_kg: number
          pre_exercise_weight_kg: number
          recommended_fluid_per_hour_ml: number | null
          recommended_sodium_per_hour_mg: number | null
          sweat_loss_ml: number | null
          sweat_rate_ml_per_hour: number | null
          temperature_celsius: number | null
          urine_output_ml: number | null
          user_id: string
          weight_loss_kg: number | null
        }
        Insert: {
          assessment_date?: string
          created_at?: string | null
          exercise_duration_minutes: number
          exercise_type?: string | null
          fluid_consumed_ml?: number | null
          humidity_percent?: number | null
          id?: string
          indoor_outdoor?: string | null
          intensity_level?: string | null
          notes?: string | null
          post_exercise_weight_kg: number
          pre_exercise_weight_kg: number
          recommended_fluid_per_hour_ml?: number | null
          recommended_sodium_per_hour_mg?: number | null
          sweat_loss_ml?: number | null
          sweat_rate_ml_per_hour?: number | null
          temperature_celsius?: number | null
          urine_output_ml?: number | null
          user_id: string
          weight_loss_kg?: number | null
        }
        Update: {
          assessment_date?: string
          created_at?: string | null
          exercise_duration_minutes?: number
          exercise_type?: string | null
          fluid_consumed_ml?: number | null
          humidity_percent?: number | null
          id?: string
          indoor_outdoor?: string | null
          intensity_level?: string | null
          notes?: string | null
          post_exercise_weight_kg?: number
          pre_exercise_weight_kg?: number
          recommended_fluid_per_hour_ml?: number | null
          recommended_sodium_per_hour_mg?: number | null
          sweat_loss_ml?: number | null
          sweat_rate_ml_per_hour?: number | null
          temperature_celsius?: number | null
          urine_output_ml?: number | null
          user_id?: string
          weight_loss_kg?: number | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          records_added: number | null
          records_failed: number | null
          records_updated: number | null
          result: string
          severity: string
          source: string
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_added?: number | null
          records_failed?: number | null
          records_updated?: number | null
          result: string
          severity: string
          source: string
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_added?: number | null
          records_failed?: number | null
          records_updated?: number | null
          result?: string
          severity?: string
          source?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      team_activities: {
        Row: {
          created_at: string
          created_by_coach_id: string
          date: string
          end_time_local: string | null
          id: string
          location: string | null
          note: string | null
          replaces_session: boolean | null
          start_time_local: string | null
          team_id: string
          timezone: string
          type: string
          updated_at: string
          weather_override: Json | null
        }
        Insert: {
          created_at?: string
          created_by_coach_id: string
          date: string
          end_time_local?: string | null
          id?: string
          location?: string | null
          note?: string | null
          replaces_session?: boolean | null
          start_time_local?: string | null
          team_id: string
          timezone?: string
          type: string
          updated_at?: string
          weather_override?: Json | null
        }
        Update: {
          created_at?: string
          created_by_coach_id?: string
          date?: string
          end_time_local?: string | null
          id?: string
          location?: string | null
          note?: string | null
          replaces_session?: boolean | null
          start_time_local?: string | null
          team_id?: string
          timezone?: string
          type?: string
          updated_at?: string
          weather_override?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "team_activities_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_activity_attendance: {
        Row: {
          activity_id: string
          athlete_id: string
          created_at: string
          exclusion_reason: string | null
          id: string
          participation: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          athlete_id: string
          created_at?: string
          exclusion_reason?: string | null
          id?: string
          participation: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          athlete_id?: string
          created_at?: string
          exclusion_reason?: string | null
          id?: string
          participation?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_attendance_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "team_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      team_activity_audit: {
        Row: {
          action: string
          activity_id: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          performed_by_coach_id: string
        }
        Insert: {
          action: string
          activity_id: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by_coach_id: string
        }
        Update: {
          action?: string
          activity_id?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by_coach_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_audit_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "team_activities"
            referencedColumns: ["id"]
          },
        ]
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
          team_id: string | null
          trust_score: number | null
          updated_at: string | null
          user_id: string
          user_id_uuid: string
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
          team_id?: string | null
          trust_score?: number | null
          updated_at?: string | null
          user_id: string
          user_id_uuid: string
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
          team_id?: string | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string
          user_id_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_chemistry_team_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_chemistry_metrics: {
        Row: {
          cohesion_score: number | null
          communication_score: number | null
          coordination_score: number | null
          created_at: string | null
          id: number
          metric_date: string | null
          overall_chemistry_score: number | null
          team_id: string
          trust_score: number | null
        }
        Insert: {
          cohesion_score?: number | null
          communication_score?: number | null
          coordination_score?: number | null
          created_at?: string | null
          id?: number
          metric_date?: string | null
          overall_chemistry_score?: number | null
          team_id: string
          trust_score?: number | null
        }
        Update: {
          cohesion_score?: number | null
          communication_score?: number | null
          coordination_score?: number | null
          created_at?: string | null
          id?: number
          metric_date?: string | null
          overall_chemistry_score?: number | null
          team_id?: string
          trust_score?: number | null
        }
        Relationships: []
      }
      team_events: {
        Row: {
          attendance_required: boolean | null
          cancellation_reason: string | null
          coach_notes: string | null
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          event_date: string
          event_type: string
          field_conditions: string | null
          focus_areas: string[] | null
          id: string
          is_recurring: boolean | null
          is_virtual: boolean | null
          late_threshold_minutes: number | null
          location: string | null
          location_details: string | null
          parent_event_id: string | null
          recurrence_day_of_week: number | null
          recurrence_pattern: string | null
          start_time: string
          status: string | null
          team_id: string
          title: string
          updated_at: string
          virtual_link: string | null
          weather_conditions: string | null
        }
        Insert: {
          attendance_required?: boolean | null
          cancellation_reason?: string | null
          coach_notes?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          event_date: string
          event_type?: string
          field_conditions?: string | null
          focus_areas?: string[] | null
          id?: string
          is_recurring?: boolean | null
          is_virtual?: boolean | null
          late_threshold_minutes?: number | null
          location?: string | null
          location_details?: string | null
          parent_event_id?: string | null
          recurrence_day_of_week?: number | null
          recurrence_pattern?: string | null
          start_time: string
          status?: string | null
          team_id: string
          title: string
          updated_at?: string
          virtual_link?: string | null
          weather_conditions?: string | null
        }
        Update: {
          attendance_required?: boolean | null
          cancellation_reason?: string | null
          coach_notes?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          field_conditions?: string | null
          focus_areas?: string[] | null
          id?: string
          is_recurring?: boolean | null
          is_virtual?: boolean | null
          late_threshold_minutes?: number | null
          location?: string | null
          location_details?: string | null
          parent_event_id?: string | null
          recurrence_day_of_week?: number | null
          recurrence_pattern?: string | null
          start_time?: string
          status?: string | null
          team_id?: string
          title?: string
          updated_at?: string
          virtual_link?: string | null
          weather_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "team_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_games: {
        Row: {
          created_at: string | null
          game_date: string
          game_type: string | null
          home_away: string | null
          id: string
          location: string | null
          notes: string | null
          opponent_name: string
          opponent_score: number | null
          opponent_team_id: string | null
          result: string | null
          team_id: string
          team_score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          game_date: string
          game_type?: string | null
          home_away?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          opponent_name: string
          opponent_score?: number | null
          opponent_team_id?: string | null
          result?: string | null
          team_id: string
          team_score?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          game_date?: string
          game_type?: string | null
          home_away?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          opponent_name?: string
          opponent_score?: number | null
          opponent_team_id?: string | null
          result?: string | null
          team_id?: string
          team_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_games_opponent_team_id_fkey"
            columns: ["opponent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_games_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          jersey_number: number | null
          position: string | null
          role: string | null
          status: string | null
          team_id: string
          token: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          jersey_number?: number | null
          position?: string | null
          role?: string | null
          status?: string | null
          team_id: string
          token: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          jersey_number?: number | null
          position?: string | null
          role?: string | null
          status?: string | null
          team_id?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          jersey_number: number | null
          joined_at: string | null
          position: string | null
          role: string | null
          role_approval_status: string | null
          role_approved_at: string | null
          role_approved_by: string | null
          role_rejection_reason: string | null
          status: string | null
          team_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          jersey_number?: number | null
          joined_at?: string | null
          position?: string | null
          role?: string | null
          role_approval_status?: string | null
          role_approved_at?: string | null
          role_approved_by?: string | null
          role_rejection_reason?: string | null
          status?: string | null
          team_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          jersey_number?: number | null
          joined_at?: string | null
          position?: string | null
          role?: string | null
          role_approval_status?: string | null
          role_approved_at?: string | null
          role_approved_by?: string | null
          role_rejection_reason?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_periodization: {
        Row: {
          created_at: string | null
          current_phase: string | null
          id: string
          individual_adjustment_allowed: boolean | null
          mandatory_practice_days: number[] | null
          max_individual_deviation_percentage: number | null
          peak_competition_date: string | null
          phase_end_date: string | null
          phase_start_date: string | null
          season_end_date: string
          season_name: string
          season_start_date: string
          taper_start_date: string | null
          team_id: string
          team_intensity_focus: string | null
          team_training_days_per_week: number | null
          team_volume_target: number | null
          upcoming_competitions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_phase?: string | null
          id?: string
          individual_adjustment_allowed?: boolean | null
          mandatory_practice_days?: number[] | null
          max_individual_deviation_percentage?: number | null
          peak_competition_date?: string | null
          phase_end_date?: string | null
          phase_start_date?: string | null
          season_end_date: string
          season_name: string
          season_start_date: string
          taper_start_date?: string | null
          team_id: string
          team_intensity_focus?: string | null
          team_training_days_per_week?: number | null
          team_volume_target?: number | null
          upcoming_competitions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_phase?: string | null
          id?: string
          individual_adjustment_allowed?: boolean | null
          mandatory_practice_days?: number[] | null
          max_individual_deviation_percentage?: number | null
          peak_competition_date?: string | null
          phase_end_date?: string | null
          phase_start_date?: string | null
          season_end_date?: string
          season_name?: string
          season_start_date?: string
          taper_start_date?: string | null
          team_id?: string
          team_intensity_focus?: string | null
          team_training_days_per_week?: number | null
          team_volume_target?: number | null
          upcoming_competitions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_periodization_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_players: {
        Row: {
          age: number | null
          country: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          height: string | null
          id: string
          jersey_number: string | null
          name: string
          phone: string | null
          position: string | null
          stats: Json | null
          status: string | null
          team_id: string
          updated_at: string | null
          user_id: string | null
          weight: string | null
        }
        Insert: {
          age?: number | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          height?: string | null
          id?: string
          jersey_number?: string | null
          name: string
          phone?: string | null
          position?: string | null
          stats?: Json | null
          status?: string | null
          team_id: string
          updated_at?: string | null
          user_id?: string | null
          weight?: string | null
        }
        Update: {
          age?: number | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          height?: string | null
          id?: string
          jersey_number?: string | null
          name?: string
          phone?: string | null
          position?: string | null
          stats?: Json | null
          status?: string | null
          team_id?: string
          updated_at?: string | null
          user_id?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
      team_sharing_settings: {
        Row: {
          allowed_metric_categories: string[]
          created_at: string
          health_sharing_enabled: boolean
          id: string
          performance_sharing_enabled: boolean
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_metric_categories?: string[]
          created_at?: string
          health_sharing_enabled?: boolean
          id?: string
          performance_sharing_enabled?: boolean
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_metric_categories?: string[]
          created_at?: string
          health_sharing_enabled?: boolean
          id?: string
          performance_sharing_enabled?: boolean
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_sharing_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          application_notes: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          coach_id: string | null
          country_code: string | null
          created_at: string | null
          id: string
          name: string
          olympic_track: string | null
          region: string | null
          rejection_reason: string | null
          team_type: string | null
          updated_at: string | null
        }
        Insert: {
          application_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          coach_id?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          olympic_track?: string | null
          region?: string | null
          rejection_reason?: string | null
          team_type?: string | null
          updated_at?: string | null
        }
        Update: {
          application_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          coach_id?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          olympic_track?: string | null
          region?: string | null
          rejection_reason?: string | null
          team_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tournament_budgets: {
        Row: {
          accommodation_cost_per_night: number | null
          accommodation_notes: string | null
          actual_accommodation_cost: number | null
          actual_meals_cost: number | null
          actual_travel_cost: number | null
          budget_status: string | null
          created_at: string | null
          created_by: string | null
          entry_fee_per_player: number | null
          equipment_cost: number | null
          estimated_accommodation_total: number | null
          estimated_meals_total: number | null
          estimated_travel_cost: number | null
          id: string
          other_costs: number | null
          other_costs_description: string | null
          per_diem_per_player: number | null
          player_share_per_person: number | null
          registration_fee: number | null
          sponsor_contribution: number | null
          team_contribution: number | null
          team_id: string
          total_estimated_cost: number | null
          total_nights: number | null
          tournament_id: string
          travel_notes: string | null
          updated_at: string | null
        }
        Insert: {
          accommodation_cost_per_night?: number | null
          accommodation_notes?: string | null
          actual_accommodation_cost?: number | null
          actual_meals_cost?: number | null
          actual_travel_cost?: number | null
          budget_status?: string | null
          created_at?: string | null
          created_by?: string | null
          entry_fee_per_player?: number | null
          equipment_cost?: number | null
          estimated_accommodation_total?: number | null
          estimated_meals_total?: number | null
          estimated_travel_cost?: number | null
          id?: string
          other_costs?: number | null
          other_costs_description?: string | null
          per_diem_per_player?: number | null
          player_share_per_person?: number | null
          registration_fee?: number | null
          sponsor_contribution?: number | null
          team_contribution?: number | null
          team_id: string
          total_estimated_cost?: number | null
          total_nights?: number | null
          tournament_id: string
          travel_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          accommodation_cost_per_night?: number | null
          accommodation_notes?: string | null
          actual_accommodation_cost?: number | null
          actual_meals_cost?: number | null
          actual_travel_cost?: number | null
          budget_status?: string | null
          created_at?: string | null
          created_by?: string | null
          entry_fee_per_player?: number | null
          equipment_cost?: number | null
          estimated_accommodation_total?: number | null
          estimated_meals_total?: number | null
          estimated_travel_cost?: number | null
          id?: string
          other_costs?: number | null
          other_costs_description?: string | null
          per_diem_per_player?: number | null
          player_share_per_person?: number | null
          registration_fee?: number | null
          sponsor_contribution?: number | null
          team_contribution?: number | null
          team_id?: string
          total_estimated_cost?: number | null
          total_nights?: number | null
          tournament_id?: string
          travel_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_budgets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_budgets_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_calendar: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          end_date: string
          event_type: string | null
          external_url: string | null
          games_expected: number | null
          id: string
          is_national_team_event: boolean | null
          is_peak_event: boolean | null
          name: string
          notes: string | null
          start_date: string
          taper_weeks_before: number | null
          team_id: string | null
          throws_per_game_qb: number | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date: string
          event_type?: string | null
          external_url?: string | null
          games_expected?: number | null
          id?: string
          is_national_team_event?: boolean | null
          is_peak_event?: boolean | null
          name: string
          notes?: string | null
          start_date: string
          taper_weeks_before?: number | null
          team_id?: string | null
          throws_per_game_qb?: number | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          event_type?: string | null
          external_url?: string | null
          games_expected?: number | null
          id?: string
          is_national_team_event?: boolean | null
          is_peak_event?: boolean | null
          name?: string
          notes?: string | null
          start_date?: string
          taper_weeks_before?: number | null
          team_id?: string | null
          throws_per_game_qb?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tournament_nutrition_protocols: {
        Row: {
          between_games_carbs_g: number | null
          between_games_fluid_ml: number | null
          between_games_protein_g: number | null
          caffeine_protocol: Json | null
          created_at: string | null
          day_before_carb_loading: boolean | null
          day_before_carbs_g_per_kg: number | null
          day_before_hydration_ml_per_kg: number | null
          description: string | null
          during_game_carbs_g_per_hour: number | null
          during_game_fluid_ml_per_15min: number | null
          during_game_sodium_mg_per_hour: number | null
          games_per_day: number | null
          id: string
          is_default: boolean | null
          morning_carbs_g: number | null
          morning_fat_g: number | null
          morning_meal_hours_before: number | null
          morning_protein_g: number | null
          post_final_game_carbs_g: number | null
          post_final_game_protein_g: number | null
          pre_game_carbs_g: number | null
          pre_game_fluid_ml: number | null
          protocol_name: string
          recovery_meal_timing_hours: number | null
          recovery_snack_options: string[] | null
          source: string | null
          time_between_games_hours: number | null
          tournament_type: string
          updated_at: string | null
        }
        Insert: {
          between_games_carbs_g?: number | null
          between_games_fluid_ml?: number | null
          between_games_protein_g?: number | null
          caffeine_protocol?: Json | null
          created_at?: string | null
          day_before_carb_loading?: boolean | null
          day_before_carbs_g_per_kg?: number | null
          day_before_hydration_ml_per_kg?: number | null
          description?: string | null
          during_game_carbs_g_per_hour?: number | null
          during_game_fluid_ml_per_15min?: number | null
          during_game_sodium_mg_per_hour?: number | null
          games_per_day?: number | null
          id?: string
          is_default?: boolean | null
          morning_carbs_g?: number | null
          morning_fat_g?: number | null
          morning_meal_hours_before?: number | null
          morning_protein_g?: number | null
          post_final_game_carbs_g?: number | null
          post_final_game_protein_g?: number | null
          pre_game_carbs_g?: number | null
          pre_game_fluid_ml?: number | null
          protocol_name: string
          recovery_meal_timing_hours?: number | null
          recovery_snack_options?: string[] | null
          source?: string | null
          time_between_games_hours?: number | null
          tournament_type: string
          updated_at?: string | null
        }
        Update: {
          between_games_carbs_g?: number | null
          between_games_fluid_ml?: number | null
          between_games_protein_g?: number | null
          caffeine_protocol?: Json | null
          created_at?: string | null
          day_before_carb_loading?: boolean | null
          day_before_carbs_g_per_kg?: number | null
          day_before_hydration_ml_per_kg?: number | null
          description?: string | null
          during_game_carbs_g_per_hour?: number | null
          during_game_fluid_ml_per_15min?: number | null
          during_game_sodium_mg_per_hour?: number | null
          games_per_day?: number | null
          id?: string
          is_default?: boolean | null
          morning_carbs_g?: number | null
          morning_fat_g?: number | null
          morning_meal_hours_before?: number | null
          morning_protein_g?: number | null
          post_final_game_carbs_g?: number | null
          post_final_game_protein_g?: number | null
          pre_game_carbs_g?: number | null
          pre_game_fluid_ml?: number | null
          protocol_name?: string
          recovery_meal_timing_hours?: number | null
          recovery_snack_options?: string[] | null
          source?: string | null
          time_between_games_hours?: number | null
          tournament_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tournament_participation: {
        Row: {
          created_at: string | null
          final_placement: number | null
          id: string
          losses: number | null
          notes: string | null
          points_against: number | null
          points_for: number | null
          pool_assignment: string | null
          registration_status: string | null
          seed_number: number | null
          team_id: string | null
          tournament_id: string
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          created_at?: string | null
          final_placement?: number | null
          id?: string
          losses?: number | null
          notes?: string | null
          points_against?: number | null
          points_for?: number | null
          pool_assignment?: string | null
          registration_status?: string | null
          seed_number?: number | null
          team_id?: string | null
          tournament_id: string
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          created_at?: string | null
          final_placement?: number | null
          id?: string
          losses?: number | null
          notes?: string | null
          points_against?: number | null
          points_for?: number | null
          pool_assignment?: string | null
          registration_status?: string | null
          seed_number?: number | null
          team_id?: string | null
          tournament_id?: string
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participation_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participation_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_sessions: {
        Row: {
          created_at: string | null
          games_played: number | null
          id: string
          losses: number | null
          notes: string | null
          points_against: number | null
          points_for: number | null
          session_date: string
          session_type: string | null
          team_id: string | null
          tournament_id: string | null
          wins: number | null
        }
        Insert: {
          created_at?: string | null
          games_played?: number | null
          id?: string
          losses?: number | null
          notes?: string | null
          points_against?: number | null
          points_for?: number | null
          session_date: string
          session_type?: string | null
          team_id?: string | null
          tournament_id?: string | null
          wins?: number | null
        }
        Update: {
          created_at?: string | null
          games_played?: number | null
          id?: string
          losses?: number | null
          notes?: string | null
          points_against?: number | null
          points_for?: number | null
          session_date?: string
          session_type?: string | null
          team_id?: string | null
          tournament_id?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          competition_level: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          end_date: string
          expected_teams: number | null
          flag: string | null
          format: string | null
          id: string
          is_home_tournament: boolean | null
          location: string | null
          max_roster_size: number | null
          name: string
          notes: string | null
          player_id: string | null
          prize_pool: string | null
          registration_deadline: string | null
          short_name: string | null
          start_date: string
          tournament_type: string | null
          updated_at: string | null
          venue: string | null
          visibility_scope: string | null
          website_url: string | null
        }
        Insert: {
          competition_level?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date: string
          expected_teams?: number | null
          flag?: string | null
          format?: string | null
          id?: string
          is_home_tournament?: boolean | null
          location?: string | null
          max_roster_size?: number | null
          name: string
          notes?: string | null
          player_id?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          short_name?: string | null
          start_date: string
          tournament_type?: string | null
          updated_at?: string | null
          venue?: string | null
          visibility_scope?: string | null
          website_url?: string | null
        }
        Update: {
          competition_level?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          expected_teams?: number | null
          flag?: string | null
          format?: string | null
          id?: string
          is_home_tournament?: boolean | null
          location?: string | null
          max_roster_size?: number | null
          name?: string
          notes?: string | null
          player_id?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          short_name?: string | null
          start_date?: string
          tournament_type?: string | null
          updated_at?: string | null
          venue?: string | null
          visibility_scope?: string | null
          website_url?: string | null
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
          user_id_uuid: string
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
          user_id_uuid: string
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
          user_id_uuid?: string
          weather_conditions?: string | null
        }
        Relationships: []
      }
      training_exercises: {
        Row: {
          animation_url: string | null
          calories_per_minute: number | null
          category: string
          common_mistakes: string[] | null
          contraindications: string[] | null
          created_at: string | null
          created_by: string | null
          default_duration_seconds: number | null
          default_reps: string | null
          default_rest_seconds: number | null
          default_sets: number | null
          description: string | null
          difficulty_level: string | null
          display_name: string | null
          equipment_required: string[] | null
          exercise_type: string | null
          id: string
          images: string[] | null
          instructions: string | null
          is_active: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          met_value: number | null
          muscle_groups: string[] | null
          name: string
          positions: string[] | null
          primary_muscle: string | null
          progressions: Json | null
          regressions: Json | null
          safety_notes: string | null
          secondary_muscles: string[] | null
          source: string | null
          space_required: string | null
          sport_specific: boolean | null
          sports: string[] | null
          subcategory: string | null
          suitable_for_cooldown: boolean | null
          suitable_for_rehab: boolean | null
          suitable_for_warmup: boolean | null
          tags: string[] | null
          tempo: string | null
          thumbnail_url: string | null
          updated_at: string | null
          variations: Json | null
          video_url: string | null
        }
        Insert: {
          animation_url?: string | null
          calories_per_minute?: number | null
          category: string
          common_mistakes?: string[] | null
          contraindications?: string[] | null
          created_at?: string | null
          created_by?: string | null
          default_duration_seconds?: number | null
          default_reps?: string | null
          default_rest_seconds?: number | null
          default_sets?: number | null
          description?: string | null
          difficulty_level?: string | null
          display_name?: string | null
          equipment_required?: string[] | null
          exercise_type?: string | null
          id?: string
          images?: string[] | null
          instructions?: string | null
          is_active?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          met_value?: number | null
          muscle_groups?: string[] | null
          name: string
          positions?: string[] | null
          primary_muscle?: string | null
          progressions?: Json | null
          regressions?: Json | null
          safety_notes?: string | null
          secondary_muscles?: string[] | null
          source?: string | null
          space_required?: string | null
          sport_specific?: boolean | null
          sports?: string[] | null
          subcategory?: string | null
          suitable_for_cooldown?: boolean | null
          suitable_for_rehab?: boolean | null
          suitable_for_warmup?: boolean | null
          tags?: string[] | null
          tempo?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          variations?: Json | null
          video_url?: string | null
        }
        Update: {
          animation_url?: string | null
          calories_per_minute?: number | null
          category?: string
          common_mistakes?: string[] | null
          contraindications?: string[] | null
          created_at?: string | null
          created_by?: string | null
          default_duration_seconds?: number | null
          default_reps?: string | null
          default_rest_seconds?: number | null
          default_sets?: number | null
          description?: string | null
          difficulty_level?: string | null
          display_name?: string | null
          equipment_required?: string[] | null
          exercise_type?: string | null
          id?: string
          images?: string[] | null
          instructions?: string | null
          is_active?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          met_value?: number | null
          muscle_groups?: string[] | null
          name?: string
          positions?: string[] | null
          primary_muscle?: string | null
          progressions?: Json | null
          regressions?: Json | null
          safety_notes?: string | null
          secondary_muscles?: string[] | null
          source?: string | null
          space_required?: string | null
          sport_specific?: boolean | null
          sports?: string[] | null
          subcategory?: string | null
          suitable_for_cooldown?: boolean | null
          suitable_for_rehab?: boolean | null
          suitable_for_warmup?: boolean | null
          tags?: string[] | null
          tempo?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          variations?: Json | null
          video_url?: string | null
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
      training_load_metrics: {
        Row: {
          acute_load: number | null
          acwr: number | null
          chronic_load: number | null
          created_at: string | null
          date: string
          id: string
          recommendations: string[] | null
          risk_level: string | null
          session_duration_minutes: number | null
          session_load: number | null
          session_rpe: number | null
          training_monotony: number | null
          training_strain: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acute_load?: number | null
          acwr?: number | null
          chronic_load?: number | null
          created_at?: string | null
          date: string
          id?: string
          recommendations?: string[] | null
          risk_level?: string | null
          session_duration_minutes?: number | null
          session_load?: number | null
          session_rpe?: number | null
          training_monotony?: number | null
          training_strain?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acute_load?: number | null
          acwr?: number | null
          chronic_load?: number | null
          created_at?: string | null
          date?: string
          id?: string
          recommendations?: string[] | null
          risk_level?: string | null
          session_duration_minutes?: number | null
          session_load?: number | null
          session_rpe?: number | null
          training_monotony?: number | null
          training_strain?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      training_phases: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          focus_areas: string[] | null
          goals: string[] | null
          id: string
          load_progression: Json | null
          name: string
          phase_order: number
          program_id: string
          start_date: string | null
          target_tournament_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          focus_areas?: string[] | null
          goals?: string[] | null
          id?: string
          load_progression?: Json | null
          name: string
          phase_order?: number
          program_id: string
          start_date?: string | null
          target_tournament_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          focus_areas?: string[] | null
          goals?: string[] | null
          id?: string
          load_progression?: Json | null
          name?: string
          phase_order?: number
          program_id?: string
          start_date?: string | null
          target_tournament_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_phases_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_phases_target_tournament_id_fkey"
            columns: ["target_tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          duration_weeks: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          name: string
          position_id: string | null
          program_structure: Json | null
          program_type: string | null
          sessions_per_week: number | null
          start_date: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_weeks?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name: string
          position_id?: string | null
          program_structure?: Json | null
          program_type?: string | null
          sessions_per_week?: number | null
          start_date?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_weeks?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name?: string
          position_id?: string | null
          program_structure?: Json | null
          program_type?: string | null
          sessions_per_week?: number | null
          start_date?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_programs_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_programs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      training_protocols: {
        Row: {
          age_range_max: number | null
          age_range_min: number | null
          applicable_sports: string[] | null
          athlete_level: string | null
          category: string
          contraindications: string[] | null
          cool_down_protocol: Json | null
          created_at: string | null
          description: string | null
          duration_weeks: number | null
          evidence_level: string | null
          evidence_summary: string | null
          id: string
          intensity_guidelines: Json | null
          is_active: boolean | null
          is_featured: boolean | null
          key_research_findings: string | null
          main_exercises: Json | null
          phase: string | null
          prerequisites: string[] | null
          primary_goal: string | null
          progression_model: string | null
          protocol_name: string
          secondary_goals: string[] | null
          session_structure: Json | null
          sessions_per_week: number | null
          source: string | null
          source_url: string | null
          supporting_studies: string[] | null
          target_fiber_type: string | null
          target_muscle_groups: string[] | null
          updated_at: string | null
          volume_guidelines: Json | null
          warm_up_protocol: Json | null
        }
        Insert: {
          age_range_max?: number | null
          age_range_min?: number | null
          applicable_sports?: string[] | null
          athlete_level?: string | null
          category: string
          contraindications?: string[] | null
          cool_down_protocol?: Json | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          evidence_level?: string | null
          evidence_summary?: string | null
          id?: string
          intensity_guidelines?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          key_research_findings?: string | null
          main_exercises?: Json | null
          phase?: string | null
          prerequisites?: string[] | null
          primary_goal?: string | null
          progression_model?: string | null
          protocol_name: string
          secondary_goals?: string[] | null
          session_structure?: Json | null
          sessions_per_week?: number | null
          source?: string | null
          source_url?: string | null
          supporting_studies?: string[] | null
          target_fiber_type?: string | null
          target_muscle_groups?: string[] | null
          updated_at?: string | null
          volume_guidelines?: Json | null
          warm_up_protocol?: Json | null
        }
        Update: {
          age_range_max?: number | null
          age_range_min?: number | null
          applicable_sports?: string[] | null
          athlete_level?: string | null
          category?: string
          contraindications?: string[] | null
          cool_down_protocol?: Json | null
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          evidence_level?: string | null
          evidence_summary?: string | null
          id?: string
          intensity_guidelines?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          key_research_findings?: string | null
          main_exercises?: Json | null
          phase?: string | null
          prerequisites?: string[] | null
          primary_goal?: string | null
          progression_model?: string | null
          protocol_name?: string
          secondary_goals?: string[] | null
          session_structure?: Json | null
          sessions_per_week?: number | null
          source?: string | null
          source_url?: string | null
          supporting_studies?: string[] | null
          target_fiber_type?: string | null
          target_muscle_groups?: string[] | null
          updated_at?: string | null
          volume_guidelines?: Json | null
          warm_up_protocol?: Json | null
        }
        Relationships: []
      }
      training_session_templates: {
        Row: {
          cool_down_protocol: string | null
          created_at: string | null
          day_of_week: number | null
          description: string | null
          duration_minutes: number | null
          equipment_needed: string[] | null
          id: string
          intensity_level: string | null
          location: string | null
          notes: string | null
          program_id: string | null
          session_name: string
          session_order: number | null
          session_type: string | null
          updated_at: string | null
          warm_up_protocol: string | null
          week_id: string | null
        }
        Insert: {
          cool_down_protocol?: string | null
          created_at?: string | null
          day_of_week?: number | null
          description?: string | null
          duration_minutes?: number | null
          equipment_needed?: string[] | null
          id?: string
          intensity_level?: string | null
          location?: string | null
          notes?: string | null
          program_id?: string | null
          session_name: string
          session_order?: number | null
          session_type?: string | null
          updated_at?: string | null
          warm_up_protocol?: string | null
          week_id?: string | null
        }
        Update: {
          cool_down_protocol?: string | null
          created_at?: string | null
          day_of_week?: number | null
          description?: string | null
          duration_minutes?: number | null
          equipment_needed?: string[] | null
          id?: string
          intensity_level?: string | null
          location?: string | null
          notes?: string | null
          program_id?: string | null
          session_name?: string
          session_order?: number | null
          session_type?: string | null
          updated_at?: string | null
          warm_up_protocol?: string | null
          week_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_session_templates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_session_templates_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "training_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          adjusted_duration: number | null
          athlete_id: string
          completed_at: string | null
          cool_down_protocol: string | null
          created_at: string | null
          current_version: number
          day_of_week: number | null
          duration: number | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          intensity_level: number | null
          notes: string | null
          readiness_modifier: number | null
          rpe: number | null
          score: number | null
          session_date: string
          session_name: string | null
          session_order: number | null
          session_type: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["training_session_status"] | null
          team_id: string | null
          template_id: string | null
          training_type: string | null
          updated_at: string | null
          user_id: string | null
          warm_up_protocol: string | null
          week_id: string | null
          workload: number | null
          workout_type: string | null
        }
        Insert: {
          adjusted_duration?: number | null
          athlete_id: string
          completed_at?: string | null
          cool_down_protocol?: string | null
          created_at?: string | null
          current_version?: number
          day_of_week?: number | null
          duration?: number | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          intensity_level?: number | null
          notes?: string | null
          readiness_modifier?: number | null
          rpe?: number | null
          score?: number | null
          session_date: string
          session_name?: string | null
          session_order?: number | null
          session_type?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["training_session_status"] | null
          team_id?: string | null
          template_id?: string | null
          training_type?: string | null
          updated_at?: string | null
          user_id?: string | null
          warm_up_protocol?: string | null
          week_id?: string | null
          workload?: number | null
          workout_type?: string | null
        }
        Update: {
          adjusted_duration?: number | null
          athlete_id?: string
          completed_at?: string | null
          cool_down_protocol?: string | null
          created_at?: string | null
          current_version?: number
          day_of_week?: number | null
          duration?: number | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          intensity_level?: number | null
          notes?: string | null
          readiness_modifier?: number | null
          rpe?: number | null
          score?: number | null
          session_date?: string
          session_name?: string | null
          session_order?: number | null
          session_type?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["training_session_status"] | null
          team_id?: string | null
          template_id?: string | null
          training_type?: string | null
          updated_at?: string | null
          user_id?: string | null
          warm_up_protocol?: string | null
          week_id?: string | null
          workload?: number | null
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "training_session_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      training_suggestions: {
        Row: {
          athlete_id: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          priority: number | null
          reason: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          reason?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          reason?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      training_videos: {
        Row: {
          affects_periodization: boolean | null
          assigned_by: string | null
          assignment_date: string | null
          assignment_notes: string | null
          category: string | null
          completed_at: string | null
          completion_status: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          duration_seconds: number | null
          estimated_load: number | null
          exercise_id: string | null
          id: string
          position_id: string | null
          tags: string[] | null
          target_player_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string
          view_count: number | null
          visibility_type: string | null
        }
        Insert: {
          affects_periodization?: boolean | null
          assigned_by?: string | null
          assignment_date?: string | null
          assignment_notes?: string | null
          category?: string | null
          completed_at?: string | null
          completion_status?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          duration_seconds?: number | null
          estimated_load?: number | null
          exercise_id?: string | null
          id?: string
          position_id?: string | null
          tags?: string[] | null
          target_player_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url: string
          view_count?: number | null
          visibility_type?: string | null
        }
        Update: {
          affects_periodization?: boolean | null
          assigned_by?: string | null
          assignment_date?: string | null
          assignment_notes?: string | null
          category?: string | null
          completed_at?: string | null
          completion_status?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          duration_seconds?: number | null
          estimated_load?: number | null
          exercise_id?: string | null
          id?: string
          position_id?: string | null
          tags?: string[] | null
          target_player_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string
          view_count?: number | null
          visibility_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_videos_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_videos_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_weeks: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          focus: string | null
          id: string
          intensity_level: string | null
          load_percentage: number | null
          name: string | null
          notes: string | null
          phase_id: string
          start_date: string | null
          updated_at: string | null
          week_number: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          focus?: string | null
          id?: string
          intensity_level?: string | null
          load_percentage?: number | null
          name?: string | null
          notes?: string | null
          phase_id: string
          start_date?: string | null
          updated_at?: string | null
          week_number: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          focus?: string | null
          id?: string
          intensity_level?: string | null
          load_percentage?: number | null
          name?: string | null
          notes?: string | null
          phase_id?: string
          start_date?: string | null
          updated_at?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_weeks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "training_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_protocols: {
        Row: {
          adaptation_days_required: number
          caffeine_protocol: string | null
          competition_timing_recommendations: string[] | null
          compression_wear_recommendation: boolean | null
          created_at: string | null
          days_before_departure: number | null
          days_until_full_performance: number
          direction: string | null
          evidence_level: string | null
          flight_duration_hours: number | null
          hydration_multiplier: number | null
          id: string
          in_flight_hydration_ml_per_hour: number | null
          in_flight_movement_frequency_minutes: number | null
          in_flight_sleep_strategy: string | null
          light_exposure_protocol: Json | null
          meal_timing_adjustments: Json | null
          pre_travel_sleep_adjustments: Json | null
          pre_travel_training_modifications: string[] | null
          protocol_name: string
          research_citations: string[] | null
          sleep_schedule_adjustment: Json | null
          timezone_difference_hours: number
          training_intensity_by_day: Json | null
          travel_type: string
        }
        Insert: {
          adaptation_days_required: number
          caffeine_protocol?: string | null
          competition_timing_recommendations?: string[] | null
          compression_wear_recommendation?: boolean | null
          created_at?: string | null
          days_before_departure?: number | null
          days_until_full_performance: number
          direction?: string | null
          evidence_level?: string | null
          flight_duration_hours?: number | null
          hydration_multiplier?: number | null
          id?: string
          in_flight_hydration_ml_per_hour?: number | null
          in_flight_movement_frequency_minutes?: number | null
          in_flight_sleep_strategy?: string | null
          light_exposure_protocol?: Json | null
          meal_timing_adjustments?: Json | null
          pre_travel_sleep_adjustments?: Json | null
          pre_travel_training_modifications?: string[] | null
          protocol_name: string
          research_citations?: string[] | null
          sleep_schedule_adjustment?: Json | null
          timezone_difference_hours: number
          training_intensity_by_day?: Json | null
          travel_type: string
        }
        Update: {
          adaptation_days_required?: number
          caffeine_protocol?: string | null
          competition_timing_recommendations?: string[] | null
          compression_wear_recommendation?: boolean | null
          created_at?: string | null
          days_before_departure?: number | null
          days_until_full_performance?: number
          direction?: string | null
          evidence_level?: string | null
          flight_duration_hours?: number | null
          hydration_multiplier?: number | null
          id?: string
          in_flight_hydration_ml_per_hour?: number | null
          in_flight_movement_frequency_minutes?: number | null
          in_flight_sleep_strategy?: string | null
          light_exposure_protocol?: Json | null
          meal_timing_adjustments?: Json | null
          pre_travel_sleep_adjustments?: Json | null
          pre_travel_training_modifications?: string[] | null
          protocol_name?: string
          research_citations?: string[] | null
          sleep_schedule_adjustment?: Json | null
          timezone_difference_hours?: number
          training_intensity_by_day?: Json | null
          travel_type?: string
        }
        Relationships: []
      }
      trending_topics: {
        Row: {
          count: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          count?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      usda_foods: {
        Row: {
          brand_name: string | null
          brand_owner: string | null
          calcium_mg: number | null
          carbohydrates_g: number | null
          cholesterol_mg: number | null
          created_at: string | null
          data_type: string | null
          description: string
          energy_kcal: number | null
          fat_g: number | null
          fdc_id: number
          fiber_g: number | null
          food_category: string | null
          household_serving_text: string | null
          id: string
          ingredients: string | null
          iron_mg: number | null
          is_active: boolean | null
          modified_date: string | null
          nutrients: Json | null
          potassium_mg: number | null
          protein_g: number | null
          publication_date: string | null
          saturated_fat_g: number | null
          search_keywords: string[] | null
          serving_size: number | null
          serving_size_unit: string | null
          sodium_mg: number | null
          sugars_g: number | null
          updated_at: string | null
          vitamin_a_mcg: number | null
          vitamin_c_mg: number | null
          vitamin_d_mcg: number | null
        }
        Insert: {
          brand_name?: string | null
          brand_owner?: string | null
          calcium_mg?: number | null
          carbohydrates_g?: number | null
          cholesterol_mg?: number | null
          created_at?: string | null
          data_type?: string | null
          description: string
          energy_kcal?: number | null
          fat_g?: number | null
          fdc_id: number
          fiber_g?: number | null
          food_category?: string | null
          household_serving_text?: string | null
          id?: string
          ingredients?: string | null
          iron_mg?: number | null
          is_active?: boolean | null
          modified_date?: string | null
          nutrients?: Json | null
          potassium_mg?: number | null
          protein_g?: number | null
          publication_date?: string | null
          saturated_fat_g?: number | null
          search_keywords?: string[] | null
          serving_size?: number | null
          serving_size_unit?: string | null
          sodium_mg?: number | null
          sugars_g?: number | null
          updated_at?: string | null
          vitamin_a_mcg?: number | null
          vitamin_c_mg?: number | null
          vitamin_d_mcg?: number | null
        }
        Update: {
          brand_name?: string | null
          brand_owner?: string | null
          calcium_mg?: number | null
          carbohydrates_g?: number | null
          cholesterol_mg?: number | null
          created_at?: string | null
          data_type?: string | null
          description?: string
          energy_kcal?: number | null
          fat_g?: number | null
          fdc_id?: number
          fiber_g?: number | null
          food_category?: string | null
          household_serving_text?: string | null
          id?: string
          ingredients?: string | null
          iron_mg?: number | null
          is_active?: boolean | null
          modified_date?: string | null
          nutrients?: Json | null
          potassium_mg?: number | null
          protein_g?: number | null
          publication_date?: string | null
          saturated_fat_g?: number | null
          search_keywords?: string[] | null
          serving_size?: number | null
          serving_size_unit?: string | null
          sodium_mg?: number | null
          sugars_g?: number | null
          updated_at?: string | null
          vitamin_a_mcg?: number | null
          vitamin_c_mg?: number | null
          vitamin_d_mcg?: number | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_description: string | null
          achievement_icon: string | null
          achievement_id: string
          achievement_name: string
          category: string | null
          created_at: string | null
          id: string
          points: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_description?: string | null
          achievement_icon?: string | null
          achievement_id: string
          achievement_name: string
          category?: string | null
          created_at?: string | null
          id?: string
          points?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_description?: string | null
          achievement_icon?: string | null
          achievement_id?: string
          achievement_name?: string
          category?: string | null
          created_at?: string | null
          id?: string
          points?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_coach_assignments: {
        Row: {
          assigned_at: string | null
          coach_id: string
          id: string
          is_active: boolean | null
          preferences: Json | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          coach_id: string
          id?: string
          is_active?: boolean | null
          preferences?: Json | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          coach_id?: string
          id?: string
          is_active?: boolean | null
          preferences?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_coach_assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "ai_coaches"
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
          user_id_uuid: string
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
          user_id_uuid: string
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
          user_id_uuid?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string | null
          id: number
          in_app_enabled: boolean | null
          muted: boolean | null
          notification_type: Database["public"]["Enums"]["notification_type_enum"]
          push_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          in_app_enabled?: boolean | null
          muted?: boolean | null
          notification_type: Database["public"]["Enums"]["notification_type_enum"]
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          in_app_enabled?: boolean | null
          muted?: boolean | null
          notification_type?: Database["public"]["Enums"]["notification_type_enum"]
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_tokens: {
        Row: {
          created_at: string | null
          device_id: string | null
          device_name: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          current_injuries: Json | null
          email: string
          enable_reminders: boolean | null
          equipment_available: string[] | null
          evening_mobility: string | null
          foam_rolling_time: string | null
          id: string
          injury_history: string[] | null
          medical_notes: string | null
          morning_mobility: string | null
          notification_preferences: string[] | null
          practice_days: string[] | null
          practices_per_week: number | null
          reminder_time: string | null
          rest_day_preference: string | null
          schedule_type: string | null
          training_goals: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_injuries?: Json | null
          email: string
          enable_reminders?: boolean | null
          equipment_available?: string[] | null
          evening_mobility?: string | null
          foam_rolling_time?: string | null
          id?: string
          injury_history?: string[] | null
          medical_notes?: string | null
          morning_mobility?: string | null
          notification_preferences?: string[] | null
          practice_days?: string[] | null
          practices_per_week?: number | null
          reminder_time?: string | null
          rest_day_preference?: string | null
          schedule_type?: string | null
          training_goals?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_injuries?: Json | null
          email?: string
          enable_reminders?: boolean | null
          equipment_available?: string[] | null
          evening_mobility?: string | null
          foam_rolling_time?: string | null
          id?: string
          injury_history?: string[] | null
          medical_notes?: string | null
          morning_mobility?: string | null
          notification_preferences?: string[] | null
          practice_days?: string[] | null
          practices_per_week?: number | null
          reminder_time?: string | null
          rest_day_preference?: string | null
          schedule_type?: string | null
          training_goals?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          display_name: string | null
          email: string | null
          experience_level: string | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          locale: string | null
          onboarding_completed: boolean | null
          position: string | null
          profile_visibility: string | null
          team_id: string | null
          timezone: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          locale?: string | null
          onboarding_completed?: boolean | null
          position?: string | null
          profile_visibility?: string | null
          team_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          experience_level?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          locale?: string | null
          onboarding_completed?: boolean | null
          position?: string | null
          profile_visibility?: string | null
          team_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_saved_research: {
        Row: {
          id: string
          is_read: boolean | null
          notes: string | null
          saved_at: string | null
          study_id: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          id?: string
          is_read?: boolean | null
          notes?: string | null
          saved_at?: string | null
          study_id: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          id?: string
          is_read?: boolean | null
          notes?: string | null
          saved_at?: string | null
          study_id?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_research_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "research_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_security: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          last_2fa_verified_at: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          last_2fa_verified_at?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          last_2fa_verified_at?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_security_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          achievement_alerts: boolean | null
          coach_messages: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          game_alerts: boolean | null
          id: string
          language: string | null
          profile_visibility: string | null
          push_notifications: boolean | null
          show_stats: boolean | null
          team_announcements: boolean | null
          theme: string | null
          training_reminders: boolean | null
          updated_at: string | null
          user_id: string
          wellness_reminders: boolean | null
        }
        Insert: {
          achievement_alerts?: boolean | null
          coach_messages?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          game_alerts?: boolean | null
          id?: string
          language?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          show_stats?: boolean | null
          team_announcements?: boolean | null
          theme?: string | null
          training_reminders?: boolean | null
          updated_at?: string | null
          user_id: string
          wellness_reminders?: boolean | null
        }
        Update: {
          achievement_alerts?: boolean | null
          coach_messages?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          game_alerts?: boolean | null
          id?: string
          language?: string | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          show_stats?: boolean | null
          team_announcements?: boolean | null
          theme?: string | null
          training_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string
          wellness_reminders?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_supplements: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          dosage: string | null
          id: string
          name: string
          notes: string | null
          timing: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          dosage?: string | null
          id?: string
          name: string
          notes?: string | null
          timing?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          dosage?: string | null
          id?: string
          name?: string
          notes?: string | null
          timing?: string | null
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
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          email_verified: boolean | null
          experience_level: string | null
          first_name: string
          full_name: string | null
          gdpr_consent_date: string | null
          gdpr_consent_given: boolean | null
          gender: string | null
          height_cm: number | null
          id: string
          is_active: boolean | null
          jersey_number: number | null
          last_login: string | null
          last_name: string
          notification_last_opened_at: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          password_hash: string
          phone: string | null
          position: string | null
          preferred_units: string | null
          profile_photo_url: string | null
          profile_picture: string | null
          secondary_position: string | null
          team: string | null
          throwing_arm: string | null
          updated_at: string | null
          username: string | null
          verification_token: string | null
          verification_token_expires_at: string | null
          weight_kg: number | null
        }
        Insert: {
          bio?: string | null
          birth_date?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          email_verified?: boolean | null
          experience_level?: string | null
          first_name: string
          full_name?: string | null
          gdpr_consent_date?: string | null
          gdpr_consent_given?: boolean | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          last_login?: string | null
          last_name: string
          notification_last_opened_at?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          password_hash: string
          phone?: string | null
          position?: string | null
          preferred_units?: string | null
          profile_photo_url?: string | null
          profile_picture?: string | null
          secondary_position?: string | null
          team?: string | null
          throwing_arm?: string | null
          updated_at?: string | null
          username?: string | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          bio?: string | null
          birth_date?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          email_verified?: boolean | null
          experience_level?: string | null
          first_name?: string
          full_name?: string | null
          gdpr_consent_date?: string | null
          gdpr_consent_given?: boolean | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          last_login?: string | null
          last_name?: string
          notification_last_opened_at?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          password_hash?: string
          phone?: string | null
          position?: string | null
          preferred_units?: string | null
          profile_photo_url?: string | null
          profile_picture?: string | null
          secondary_position?: string | null
          team?: string | null
          throwing_arm?: string | null
          updated_at?: string | null
          username?: string | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      video_assignments: {
        Row: {
          assigned_by: string
          assigned_to: string
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          playlist_id: string | null
          status: string | null
          team_id: string
          video_id: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          playlist_id?: string | null
          status?: string | null
          team_id: string
          video_id: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          playlist_id?: string | null
          status?: string | null
          team_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_assignments_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "video_playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      video_bookmarks: {
        Row: {
          creator_username: string | null
          id: string
          notes: string | null
          saved_at: string | null
          user_id: string
          video_id: string
          video_title: string
          video_url: string
        }
        Insert: {
          creator_username?: string | null
          id?: string
          notes?: string | null
          saved_at?: string | null
          user_id: string
          video_id: string
          video_title: string
          video_url: string
        }
        Update: {
          creator_username?: string | null
          id?: string
          notes?: string | null
          saved_at?: string | null
          user_id?: string
          video_id?: string
          video_title?: string
          video_url?: string
        }
        Relationships: []
      }
      video_clip_assignments: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          assigned_at: string
          assigned_by: string
          coach_note: string | null
          due_date: string | null
          id: string
          is_priority: boolean | null
          player_id: string
          player_response: string | null
          player_role: string | null
          user_id: string | null
          video_clip_id: string
          view_duration_seconds: number | null
          viewed: boolean | null
          viewed_at: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          assigned_at?: string
          assigned_by: string
          coach_note?: string | null
          due_date?: string | null
          id?: string
          is_priority?: boolean | null
          player_id: string
          player_response?: string | null
          player_role?: string | null
          user_id?: string | null
          video_clip_id: string
          view_duration_seconds?: number | null
          viewed?: boolean | null
          viewed_at?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          assigned_at?: string
          assigned_by?: string
          coach_note?: string | null
          due_date?: string | null
          id?: string
          is_priority?: boolean | null
          player_id?: string
          player_response?: string | null
          player_role?: string | null
          user_id?: string | null
          video_clip_id?: string
          view_duration_seconds?: number | null
          viewed?: boolean | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_clip_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_clip_assignments_video_clip_id_fkey"
            columns: ["video_clip_id"]
            isOneToOne: false
            referencedRelation: "video_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      video_clip_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          is_edited: boolean | null
          mentions: string[] | null
          parent_comment_id: string | null
          timestamp_seconds: number | null
          updated_at: string
          user_id: string
          video_clip_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          mentions?: string[] | null
          parent_comment_id?: string | null
          timestamp_seconds?: number | null
          updated_at?: string
          user_id: string
          video_clip_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          mentions?: string[] | null
          parent_comment_id?: string | null
          timestamp_seconds?: number | null
          updated_at?: string
          user_id?: string
          video_clip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_clip_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "video_clip_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_clip_comments_video_clip_id_fkey"
            columns: ["video_clip_id"]
            isOneToOne: false
            referencedRelation: "video_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      video_clips: {
        Row: {
          category: string | null
          clip_type: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          duration_seconds: number | null
          end_time_seconds: number | null
          feedback_sentiment: string | null
          game_date: string | null
          game_id: string | null
          id: string
          is_archived: boolean | null
          is_required_viewing: boolean | null
          opponent_name: string | null
          play_name: string | null
          start_time_seconds: number | null
          subcategory: string | null
          tags: string[] | null
          team_id: string
          title: string
          updated_at: string
          video_platform: string | null
          video_url: string
          view_count: number | null
          visibility: string | null
        }
        Insert: {
          category?: string | null
          clip_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          duration_seconds?: number | null
          end_time_seconds?: number | null
          feedback_sentiment?: string | null
          game_date?: string | null
          game_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_required_viewing?: boolean | null
          opponent_name?: string | null
          play_name?: string | null
          start_time_seconds?: number | null
          subcategory?: string | null
          tags?: string[] | null
          team_id: string
          title: string
          updated_at?: string
          video_platform?: string | null
          video_url: string
          view_count?: number | null
          visibility?: string | null
        }
        Update: {
          category?: string | null
          clip_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          duration_seconds?: number | null
          end_time_seconds?: number | null
          feedback_sentiment?: string | null
          game_date?: string | null
          game_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_required_viewing?: boolean | null
          opponent_name?: string | null
          play_name?: string | null
          start_time_seconds?: number | null
          subcategory?: string | null
          tags?: string[] | null
          team_id?: string
          title?: string
          updated_at?: string
          video_platform?: string | null
          video_url?: string
          view_count?: number | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_clips_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_clips_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "player_game_stats_aggregated"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "video_clips_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      video_curation_status: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          status: string
          team_id: string
          updated_at: string | null
          updated_by: string | null
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          status: string
          team_id: string
          updated_at?: string | null
          updated_by?: string | null
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          team_id?: string
          updated_at?: string | null
          updated_by?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_curation_status_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      video_playlists: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          focus_areas: string[] | null
          id: string
          is_public: boolean | null
          name: string
          position: string | null
          team_id: string | null
          updated_at: string | null
          video_ids: string[]
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          focus_areas?: string[] | null
          id?: string
          is_public?: boolean | null
          name: string
          position?: string | null
          team_id?: string | null
          updated_at?: string | null
          video_ids?: string[]
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          focus_areas?: string[] | null
          id?: string
          is_public?: boolean | null
          name?: string
          position?: string | null
          team_id?: string | null
          updated_at?: string | null
          video_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "video_playlists_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      video_suggestions: {
        Row: {
          description: string
          id: string
          instagram_url: string
          positions: string[]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shortcode: string
          status: string
          submitted_at: string | null
          submitted_by: string
          submitted_by_name: string
          team_id: string | null
          title: string
          training_focus: string[]
          why_valuable: string | null
        }
        Insert: {
          description: string
          id?: string
          instagram_url: string
          positions?: string[]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shortcode: string
          status?: string
          submitted_at?: string | null
          submitted_by: string
          submitted_by_name: string
          team_id?: string | null
          title: string
          training_focus?: string[]
          why_valuable?: string | null
        }
        Update: {
          description?: string
          id?: string
          instagram_url?: string
          positions?: string[]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shortcode?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string
          submitted_by_name?: string
          team_id?: string | null
          title?: string
          training_focus?: string[]
          why_valuable?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_suggestions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      video_watch_history: {
        Row: {
          completed: boolean | null
          id: string
          user_id: string
          video_id: string
          watch_duration_seconds: number | null
          watched_at: string | null
        }
        Insert: {
          completed?: boolean | null
          id?: string
          user_id: string
          video_id: string
          watch_duration_seconds?: number | null
          watched_at?: string | null
        }
        Update: {
          completed?: boolean | null
          id?: string
          user_id?: string
          video_id?: string
          watch_duration_seconds?: number | null
          watched_at?: string | null
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
      warmup_protocols: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          equipment_needed: string[] | null
          id: string
          name: string
          notes: string | null
          program_id: string | null
          protocol_type: string | null
          steps: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          equipment_needed?: string[] | null
          id?: string
          name: string
          notes?: string | null
          program_id?: string | null
          protocol_type?: string | null
          steps?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          equipment_needed?: string[] | null
          id?: string
          name?: string
          notes?: string | null
          program_id?: string | null
          protocol_type?: string | null
          steps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "warmup_protocols_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
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
          user_id_uuid: string
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
          user_id_uuid: string
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
          user_id_uuid?: string
        }
        Relationships: []
      }
      weather_data: {
        Row: {
          conditions: string | null
          feels_like: number | null
          humidity: number | null
          icon: string | null
          id: string
          location: string
          precipitation: number | null
          recommendations: Json | null
          temperature: number | null
          timestamp: string | null
          uv_index: number | null
          wind_speed: number | null
        }
        Insert: {
          conditions?: string | null
          feels_like?: number | null
          humidity?: number | null
          icon?: string | null
          id?: string
          location: string
          precipitation?: number | null
          recommendations?: Json | null
          temperature?: number | null
          timestamp?: string | null
          uv_index?: number | null
          wind_speed?: number | null
        }
        Update: {
          conditions?: string | null
          feels_like?: number | null
          humidity?: number | null
          icon?: string | null
          id?: string
          location?: string
          precipitation?: number | null
          recommendations?: Json | null
          temperature?: number | null
          timestamp?: string | null
          uv_index?: number | null
          wind_speed?: number | null
        }
        Relationships: []
      }
      weather_training_rules: {
        Row: {
          alternative_session_type: string | null
          condition_type: string
          created_at: string | null
          cutting_allowed: boolean | null
          id: string
          indoor_alternative_required: boolean | null
          injury_risk_level: string | null
          max_cutting_intensity: number | null
          max_plyo_intensity: number | null
          max_sprint_intensity: number | null
          plyometrics_allowed: boolean | null
          primary_injury_risks: string[] | null
          prohibited_activities: string[] | null
          rationale: string | null
          recommended_activities: string[] | null
          required_modifications: string[] | null
          research_citations: string[] | null
          severity: string
          sprint_allowed: boolean | null
          surface_condition: string | null
          surface_type: string | null
        }
        Insert: {
          alternative_session_type?: string | null
          condition_type: string
          created_at?: string | null
          cutting_allowed?: boolean | null
          id?: string
          indoor_alternative_required?: boolean | null
          injury_risk_level?: string | null
          max_cutting_intensity?: number | null
          max_plyo_intensity?: number | null
          max_sprint_intensity?: number | null
          plyometrics_allowed?: boolean | null
          primary_injury_risks?: string[] | null
          prohibited_activities?: string[] | null
          rationale?: string | null
          recommended_activities?: string[] | null
          required_modifications?: string[] | null
          research_citations?: string[] | null
          severity: string
          sprint_allowed?: boolean | null
          surface_condition?: string | null
          surface_type?: string | null
        }
        Update: {
          alternative_session_type?: string | null
          condition_type?: string
          created_at?: string | null
          cutting_allowed?: boolean | null
          id?: string
          indoor_alternative_required?: boolean | null
          injury_risk_level?: string | null
          max_cutting_intensity?: number | null
          max_plyo_intensity?: number | null
          max_sprint_intensity?: number | null
          plyometrics_allowed?: boolean | null
          primary_injury_risks?: string[] | null
          prohibited_activities?: string[] | null
          rationale?: string | null
          recommended_activities?: string[] | null
          required_modifications?: string[] | null
          research_citations?: string[] | null
          severity?: string
          sprint_allowed?: boolean | null
          surface_condition?: string | null
          surface_type?: string | null
        }
        Relationships: []
      }
      wellness_entries: {
        Row: {
          athlete_id: string
          created_at: string | null
          date: string
          energy_level: number | null
          hydration_level: number | null
          id: string
          mood: number | null
          motivation_level: number | null
          muscle_soreness: number | null
          notes: string | null
          sleep_quality: number | null
          stress_level: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          date?: string
          energy_level?: number | null
          hydration_level?: number | null
          id?: string
          mood?: number | null
          motivation_level?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          date?: string
          energy_level?: number | null
          hydration_level?: number | null
          id?: string
          mood?: number | null
          motivation_level?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id?: string | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      workout_logs: {
        Row: {
          completed_at: string
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          player_id: string
          rpe: number | null
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          player_id: string
          rpe?: number | null
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          player_id?: string
          rpe?: number | null
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_modifications: {
        Row: {
          active_injury_ids: string[] | null
          auto_generated: boolean | null
          coach_approved: boolean | null
          created_at: string | null
          duration_adjustment: number | null
          fatigue_level: number | null
          id: string
          intensity_adjustment: number | null
          modification_date: string | null
          modification_rationale: string | null
          modified_exercises: Json
          original_session_id: string | null
          readiness_score: number | null
          session_type_change: string | null
          user_id: string
          volume_adjustment: number | null
          wellness_score: number | null
        }
        Insert: {
          active_injury_ids?: string[] | null
          auto_generated?: boolean | null
          coach_approved?: boolean | null
          created_at?: string | null
          duration_adjustment?: number | null
          fatigue_level?: number | null
          id?: string
          intensity_adjustment?: number | null
          modification_date?: string | null
          modification_rationale?: string | null
          modified_exercises: Json
          original_session_id?: string | null
          readiness_score?: number | null
          session_type_change?: string | null
          user_id: string
          volume_adjustment?: number | null
          wellness_score?: number | null
        }
        Update: {
          active_injury_ids?: string[] | null
          auto_generated?: boolean | null
          coach_approved?: boolean | null
          created_at?: string | null
          duration_adjustment?: number | null
          fatigue_level?: number | null
          id?: string
          intensity_adjustment?: number | null
          modification_date?: string | null
          modification_rationale?: string | null
          modified_exercises?: Json
          original_session_id?: string | null
          readiness_score?: number | null
          session_type_change?: string | null
          user_id?: string
          volume_adjustment?: number | null
          wellness_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_modifications_user_id_fkey"
            columns: ["user_id"]
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
      athlete_activity_unified: {
        Row: {
          activity_date: string | null
          activity_type: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string | null
          notes: string | null
          rpe: number | null
          user_id: string | null
        }
        Relationships: []
      }
      cached_table_schemas: {
        Row: {
          id: number | null
          object_type: unknown
          schema_name: unknown
          table_name: unknown
        }
        Relationships: []
      }
      daily_active_users: {
        Row: {
          active_users: number | null
          date: string | null
          total_events: number | null
        }
        Relationships: []
      }
      injury_risk_flags: {
        Row: {
          acwr: number | null
          athlete_id: string | null
          day: string | null
          injury_risk: string | null
          level: string | null
          score: number | null
        }
        Insert: {
          acwr?: number | null
          athlete_id?: string | null
          day?: string | null
          injury_risk?: string | null
          level?: string | null
          score?: number | null
        }
        Update: {
          acwr?: number | null
          athlete_id?: string | null
          day?: string | null
          injury_risk?: string | null
          level?: string | null
          score?: number | null
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
      injury_watchlist: {
        Row: {
          athlete_id: string | null
          avg_28d_score: number | null
          avg_7d_score: number | null
          day: string | null
          deload_days_7d: number | null
          level: string | null
          score: number | null
          suggestion: string | null
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
      isometric_exercises: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          equipment_required: string[] | null
          evidence_level: string | null
          execution_cues: string[] | null
          id: string | null
          image_url: string | null
          injury_prevention_benefits: string[] | null
          intensity_percentage: number | null
          lifting_synergy_exercises: string[] | null
          muscle_groups: string[] | null
          name: string | null
          post_lifting_recommendation: boolean | null
          pre_lifting_recommendation: boolean | null
          protocol_type: string | null
          recommended_duration_seconds: number | null
          recommended_reps: number | null
          recommended_sets: number | null
          research_studies: string[] | null
          rest_period_seconds: number | null
          safety_notes: string | null
          setup_instructions: string | null
          sport_specific_applications: Json | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          equipment_required?: string[] | null
          evidence_level?: string | null
          execution_cues?: string[] | null
          id?: string | null
          image_url?: string | null
          injury_prevention_benefits?: string[] | null
          intensity_percentage?: number | null
          lifting_synergy_exercises?: string[] | null
          muscle_groups?: string[] | null
          name?: string | null
          post_lifting_recommendation?: boolean | null
          pre_lifting_recommendation?: boolean | null
          protocol_type?: string | null
          recommended_duration_seconds?: number | null
          recommended_reps?: number | null
          recommended_sets?: number | null
          research_studies?: string[] | null
          rest_period_seconds?: number | null
          safety_notes?: string | null
          setup_instructions?: string | null
          sport_specific_applications?: Json | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          equipment_required?: string[] | null
          evidence_level?: string | null
          execution_cues?: string[] | null
          id?: string | null
          image_url?: string | null
          injury_prevention_benefits?: string[] | null
          intensity_percentage?: number | null
          lifting_synergy_exercises?: string[] | null
          muscle_groups?: string[] | null
          name?: string | null
          post_lifting_recommendation?: boolean | null
          pre_lifting_recommendation?: boolean | null
          protocol_type?: string | null
          recommended_duration_seconds?: number | null
          recommended_reps?: number | null
          recommended_sets?: number | null
          research_studies?: string[] | null
          rest_period_seconds?: number | null
          safety_notes?: string | null
          setup_instructions?: string | null
          sport_specific_applications?: Json | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      performance_summary: {
        Row: {
          avg_cls: number | null
          avg_fcp: number | null
          avg_lcp: number | null
          avg_load_time: number | null
          date: string | null
          sample_count: number | null
        }
        Relationships: []
      }
      player_game_stats_aggregated: {
        Row: {
          completions: number | null
          drops: number | null
          flag_pulls: number | null
          game_date: string | null
          game_id: string | null
          interceptions: number | null
          opponent_name: string | null
          owner_type: string | null
          player_id: string | null
          player_owner_id: string | null
          receptions: number | null
          team_id: string | null
          total_events: number | null
          total_yards: number | null
          touchdowns: number | null
          visibility_scope: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      plyometric_exercises: {
        Row: {
          applicable_sports: string[] | null
          common_mistakes: string[] | null
          contraindications: string[] | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          effectiveness_rating: number | null
          equipment_needed: string[] | null
          exercise_category: string | null
          exercise_name: string | null
          id: string | null
          image_url: string | null
          injury_risk_rating: string | null
          instructions: string[] | null
          intensity_level: string | null
          performance_improvements: Json | null
          position_applications: Json | null
          position_specific: boolean | null
          progression_guidelines: string[] | null
          proper_form_guidelines: string[] | null
          research_based: boolean | null
          rest_periods: string[] | null
          safety_notes: string[] | null
          space_requirements: string | null
          surface_requirements: string | null
          updated_at: string | null
          video_url: string | null
          volume_recommendations: string[] | null
        }
        Insert: {
          applicable_sports?: string[] | null
          common_mistakes?: string[] | null
          contraindications?: string[] | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          effectiveness_rating?: number | null
          equipment_needed?: string[] | null
          exercise_category?: string | null
          exercise_name?: string | null
          id?: string | null
          image_url?: string | null
          injury_risk_rating?: string | null
          instructions?: string[] | null
          intensity_level?: string | null
          performance_improvements?: Json | null
          position_applications?: Json | null
          position_specific?: boolean | null
          progression_guidelines?: string[] | null
          proper_form_guidelines?: string[] | null
          research_based?: boolean | null
          rest_periods?: string[] | null
          safety_notes?: string[] | null
          space_requirements?: string | null
          surface_requirements?: string | null
          updated_at?: string | null
          video_url?: string | null
          volume_recommendations?: string[] | null
        }
        Update: {
          applicable_sports?: string[] | null
          common_mistakes?: string[] | null
          contraindications?: string[] | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          effectiveness_rating?: number | null
          equipment_needed?: string[] | null
          exercise_category?: string | null
          exercise_name?: string | null
          id?: string | null
          image_url?: string | null
          injury_risk_rating?: string | null
          instructions?: string[] | null
          intensity_level?: string | null
          performance_improvements?: Json | null
          position_applications?: Json | null
          position_specific?: boolean | null
          progression_guidelines?: string[] | null
          proper_form_guidelines?: string[] | null
          research_based?: boolean | null
          rest_periods?: string[] | null
          safety_notes?: string[] | null
          space_requirements?: string | null
          surface_requirements?: string | null
          updated_at?: string | null
          video_url?: string | null
          volume_recommendations?: string[] | null
        }
        Relationships: []
      }
      popular_features: {
        Row: {
          event_type: string | null
          last_used: string | null
          unique_users: number | null
          usage_count: number | null
        }
        Relationships: []
      }
      postgrest_exposed_tables: {
        Row: {
          column_count: number | null
          is_core_table: boolean | null
          table_name: unknown
        }
        Relationships: []
      }
      qb_weekly_throwing_totals: {
        Row: {
          arm_care_compliance_pct: number | null
          avg_arm_feeling: number | null
          ice_sessions: number | null
          sessions_count: number | null
          user_id: string | null
          warmup_compliance_pct: number | null
          week_start: string | null
          weekly_throws: number | null
        }
        Relationships: []
      }
      readiness_trends: {
        Row: {
          athlete_id: string | null
          avg_28d_score: number | null
          avg_7d_score: number | null
          day: string | null
          deload_days_7d: number | null
          level: string | null
          score: number | null
          suggestion: string | null
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
      supplements_logs: {
        Row: {
          created_at: string | null
          date: string | null
          dosage: string | null
          id: string | null
          notes: string | null
          supplement_name: string | null
          taken: boolean | null
          time_of_day: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          dosage?: string | null
          id?: string | null
          notes?: string | null
          supplement_name?: string | null
          taken?: boolean | null
          time_of_day?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          dosage?: string | null
          id?: string | null
          notes?: string | null
          supplement_name?: string | null
          taken?: boolean | null
          time_of_day?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      team_readiness_dashboard: {
        Row: {
          athlete_count: number | null
          deload_athletes: number | null
          deload_pct: number | null
          high_count: number | null
          low_count: number | null
          moderate_count: number | null
          team_avg_28d: number | null
          team_avg_7d: number | null
          team_id: string | null
          team_status: string | null
        }
        Relationships: []
      }
      training_load_adjustments: {
        Row: {
          adjustment_reason: string | null
          athlete_id: string | null
          intensity_multiplier: number | null
          volume_multiplier: number | null
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
      user_journeys: {
        Row: {
          created_at: string | null
          entry_page: string | null
          exit_page: string | null
          features_used: string[] | null
          funnel_stage: string | null
          session_duration: number | null
          total_page_views: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          features_used?: string[] | null
          funnel_stage?: string | null
          session_duration?: number | null
          total_page_views?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          features_used?: string[] | null
          funnel_stage?: string | null
          session_duration?: number | null
          total_page_views?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_training_summary: {
        Row: {
          avg_duration_minutes: number | null
          avg_intensity: number | null
          avg_rpe: number | null
          completed_sessions: number | null
          first_session_date: string | null
          last_session_date: string | null
          planned_sessions: number | null
          total_sessions: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_chatbot_response_filters: {
        Row: {
          equipment_available_filter: string[] | null
          experience_level_filter: string | null
          filter_active: boolean | null
          hide_injured_exercises: boolean | null
          include_emojis: boolean | null
          max_response_length: string | null
          show_alternative_options: boolean | null
          show_only_current_phase: boolean | null
          show_research_citations: boolean | null
          show_video_links: boolean | null
          technical_terminology_level: string | null
          time_available_minutes: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          equipment_available_filter?: string[] | null
          experience_level_filter?: string | null
          filter_active?: boolean | null
          hide_injured_exercises?: boolean | null
          include_emojis?: boolean | null
          max_response_length?: string | null
          show_alternative_options?: boolean | null
          show_only_current_phase?: boolean | null
          show_research_citations?: boolean | null
          show_video_links?: boolean | null
          technical_terminology_level?: string | null
          time_available_minutes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          equipment_available_filter?: string[] | null
          experience_level_filter?: string | null
          filter_active?: boolean | null
          hide_injured_exercises?: boolean | null
          include_emojis?: boolean | null
          max_response_length?: string | null
          show_alternative_options?: boolean | null
          show_only_current_phase?: boolean | null
          show_research_citations?: boolean | null
          show_video_links?: boolean | null
          technical_terminology_level?: string | null
          time_available_minutes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_ff_exercise_library: {
        Row: {
          applicable_positions: string[] | null
          approved_at: string | null
          body_part: string | null
          coaching_cues: string[] | null
          difficulty_level: string | null
          equipment: string | null
          external_id: string | null
          ff_category: string | null
          ff_training_focus: string[] | null
          flag_football_relevance: number | null
          gif_url: string | null
          id: string | null
          instructions: string[] | null
          is_approved: boolean | null
          name: string | null
          recommended_reps: string | null
          recommended_rest_seconds: number | null
          recommended_sets: number | null
          safety_notes: string[] | null
          secondary_muscles: string[] | null
          source: string | null
          target_muscle: string | null
        }
        Insert: {
          applicable_positions?: string[] | null
          approved_at?: string | null
          body_part?: string | null
          coaching_cues?: string[] | null
          difficulty_level?: string | null
          equipment?: string | null
          external_id?: string | null
          ff_category?: string | null
          ff_training_focus?: string[] | null
          flag_football_relevance?: number | null
          gif_url?: string | null
          id?: string | null
          instructions?: string[] | null
          is_approved?: boolean | null
          name?: string | null
          recommended_reps?: string | null
          recommended_rest_seconds?: number | null
          recommended_sets?: number | null
          safety_notes?: string[] | null
          secondary_muscles?: string[] | null
          source?: never
          target_muscle?: string | null
        }
        Update: {
          applicable_positions?: string[] | null
          approved_at?: string | null
          body_part?: string | null
          coaching_cues?: string[] | null
          difficulty_level?: string | null
          equipment?: string | null
          external_id?: string | null
          ff_category?: string | null
          ff_training_focus?: string[] | null
          flag_football_relevance?: number | null
          gif_url?: string | null
          id?: string | null
          instructions?: string[] | null
          is_approved?: boolean | null
          name?: string | null
          recommended_reps?: string | null
          recommended_rest_seconds?: number | null
          recommended_sets?: number | null
          safety_notes?: string[] | null
          secondary_muscles?: string[] | null
          source?: never
          target_muscle?: string | null
        }
        Relationships: []
      }
      v_load_monitoring_consent: {
        Row: {
          access_reason: string | null
          acute_load: number | null
          acwr: number | null
          calculated_at: string | null
          chronic_load: number | null
          consent_blocked: boolean | null
          created_at: string | null
          daily_load: number | null
          id: string | null
          injury_risk_level: string | null
          player_id: string | null
          workout_log_id: string | null
        }
        Insert: {
          access_reason?: never
          acute_load?: never
          acwr?: never
          calculated_at?: string | null
          chronic_load?: never
          consent_blocked?: never
          created_at?: string | null
          daily_load?: never
          id?: string | null
          injury_risk_level?: never
          player_id?: string | null
          workout_log_id?: string | null
        }
        Update: {
          access_reason?: never
          acute_load?: never
          acwr?: never
          calculated_at?: string | null
          chronic_load?: never
          consent_blocked?: never
          created_at?: string | null
          daily_load?: never
          id?: string | null
          injury_risk_level?: never
          player_id?: string | null
          workout_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "load_monitoring_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "v_workout_logs_consent"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "load_monitoring_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_workout_logs_consent: {
        Row: {
          completed_at: string | null
          consent_blocked: boolean | null
          created_at: string | null
          duration_minutes: number | null
          id: string | null
          notes: string | null
          player_id: string | null
          rpe: number | null
          session_id: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: never
          consent_blocked?: never
          created_at?: string | null
          duration_minutes?: never
          id?: string | null
          notes?: never
          player_id?: string | null
          rpe?: never
          session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: never
          consent_blocked?: never
          created_at?: string | null
          duration_minutes?: never
          id?: string | null
          notes?: never
          player_id?: string | null
          rpe?: never
          session_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_checkins: {
        Row: {
          athlete_id: string | null
          checkin_date: string | null
          created_at: string | null
          energy_level: number | null
          hydration_level: number | null
          id: string | null
          mood: number | null
          motivation_level: number | null
          notes: string | null
          sleep_quality: number | null
          soreness_level: number | null
          stress_level: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          athlete_id?: string | null
          checkin_date?: string | null
          created_at?: string | null
          energy_level?: number | null
          hydration_level?: number | null
          id?: string | null
          mood?: number | null
          motivation_level?: number | null
          notes?: string | null
          sleep_quality?: number | null
          soreness_level?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id?: never
        }
        Update: {
          athlete_id?: string | null
          checkin_date?: string | null
          created_at?: string | null
          energy_level?: number | null
          hydration_level?: number | null
          id?: string | null
          mood?: number | null
          motivation_level?: number | null
          notes?: string | null
          sleep_quality?: number | null
          soreness_level?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id?: never
        }
        Relationships: []
      }
    }
    Functions: {
      accept_team_invitation: {
        Args: { p_invitation_id: string }
        Returns: Json
      }
      anonymize_user_data_for_research: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      approve_admin_role: {
        Args: { p_notes?: string; p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      approve_team: {
        Args: { p_notes?: string; p_team_id: string }
        Returns: boolean
      }
      award_achievement: {
        Args: {
          p_achievement_slug: string
          p_context?: Json
          p_user_id: string
        }
        Returns: boolean
      }
      calculate_acute_load: {
        Args: { player_uuid: string; reference_date: string }
        Returns: number
      }
      calculate_acwr_safe: {
        Args: { player_uuid: string; reference_date: string }
        Returns: {
          acute_load: number
          acwr: number
          chronic_load: number
          data_days: number
          is_reliable: boolean
          message: string
          risk_level: string
        }[]
      }
      calculate_age_recovery_modifier: {
        Args: { birth_date: string }
        Returns: {
          acwr_max_adjustment: number
          min_hours_between_high_intensity: number
          recovery_modifier: number
        }[]
      }
      calculate_chronic_load: {
        Args: { player_uuid: string; reference_date: string }
        Returns: number
      }
      calculate_daily_load: {
        Args: { log_date: string; player_uuid: string }
        Returns: number
      }
      calculate_player_tournament_cost: {
        Args: { p_team_id: string; p_tournament_id: string }
        Returns: number
      }
      calculate_readiness_score: {
        Args: {
          p_energy_level: number
          p_feeling_ill?: boolean
          p_has_injury?: boolean
          p_motivation: number
          p_muscle_soreness: number
          p_sleep_hours: number
          p_sleep_quality: number
          p_stress_level: number
        }
        Returns: number
      }
      calculate_review_date: {
        Args: {
          p_created_at: string
          p_next_game_date?: string
          p_next_session_date?: string
          p_trigger: string
        }
        Returns: string
      }
      calculate_review_priority: {
        Args: {
          p_confidence: number
          p_decision_category: string
          p_decision_type: string
          p_review_trigger: string
        }
        Returns: string
      }
      can_view_health_data: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      cancel_account_deletion: {
        Args: { p_request_id: string; p_user_id: string }
        Returns: boolean
      }
      check_ai_processing_enabled: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_health_sharing: {
        Args: { p_player_id: string; p_team_id: string }
        Returns: boolean
      }
      check_metric_category_allowed: {
        Args: { p_category: string; p_player_id: string; p_team_id: string }
        Returns: boolean
      }
      check_performance_sharing: {
        Args: { p_player_id: string; p_team_id: string }
        Returns: boolean
      }
      check_performance_sharing_safe: {
        Args: { p_player_id: string; p_team_id: string }
        Returns: boolean
      }
      cleanup_expired_emergency_records: { Args: never; Returns: number }
      cleanup_expired_notifications: { Args: never; Returns: number }
      complete_protocol_exercise: {
        Args: {
          p_actual_hold_seconds?: number
          p_actual_reps?: number
          p_actual_sets?: number
          p_protocol_exercise_id: string
        }
        Returns: boolean
      }
      compute_acwr: {
        Args: { athlete: string }
        Returns: {
          acute_load: number
          acwr: number
          chronic_load: number
          load: number
          session_date: string
        }[]
      }
      compute_acwr_ewma: {
        Args: { athlete: string }
        Returns: {
          acute_load: number
          acwr: number
          chronic_load: number
          load: number
          session_date: string
        }[]
      }
      create_emergency_medical_record: {
        Args: {
          p_event_type: string
          p_location_data?: Json
          p_medical_data: Json
          p_user_id: string
        }
        Returns: string
      }
      create_review_reminders: {
        Args: { p_decision_id: string }
        Returns: undefined
      }
      current_auth_uid: { Args: never; Returns: string }
      decline_team_invitation: {
        Args: { p_invitation_id: string }
        Returns: Json
      }
      decrement_comment_likes_count: {
        Args: { comment_id: string }
        Returns: undefined
      }
      decrement_comments_count: {
        Args: { post_id: string }
        Returns: undefined
      }
      decrement_likes_count: { Args: { post_id: string }; Returns: undefined }
      detect_acwr_trigger: { Args: { p_athlete_id: string }; Returns: string }
      detect_pain_trigger: {
        Args: {
          p_athlete_id: string
          p_pain_location: string
          p_pain_score: number
          p_pain_trend?: string
        }
        Returns: string
      }
      expire_old_invitations: { Args: never; Returns: number }
      get_age_recovery_modifier: {
        Args: { athlete_age: number }
        Returns: {
          acwr_max_adjustment: number
          min_hours_between_high_intensity: number
          notes: string
          recommended_sessions_per_week: number
          recovery_modifier: number
        }[]
      }
      get_ai_consent_status: {
        Args: { p_user_id: string }
        Returns: {
          ai_enabled: boolean
          can_process: boolean
          consent_date: string
          reason: string
        }[]
      }
      get_athlete_consent: {
        Args: { p_athlete_id: string; p_setting_name: string }
        Returns: boolean
      }
      get_athlete_readiness: {
        Args: { p_date?: string; p_user_id: string }
        Returns: {
          days_since_checkin: number
          energy_level: number
          has_checkin: boolean
          muscle_soreness: number
          readiness_score: number
          sleep_quality: number
          soreness_areas: Json
          stress_level: number
        }[]
      }
      get_chatbot_response_filters: {
        Args: never
        Returns: {
          equipment_available_filter: string[] | null
          experience_level_filter: string | null
          filter_active: boolean | null
          hide_injured_exercises: boolean | null
          include_emojis: boolean | null
          max_response_length: string | null
          show_alternative_options: boolean | null
          show_only_current_phase: boolean | null
          show_research_citations: boolean | null
          show_video_links: boolean | null
          technical_terminology_level: string | null
          time_available_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "chatbot_response_filters"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_coached_teams: { Args: never; Returns: string[] }
      get_current_program_cycle: {
        Args: { p_date?: string; p_user_id: string }
        Returns: {
          cycle_goals: Json
          cycle_id: string
          cycle_name: string
          cycle_type: string
          days_remaining: number
          progress_percent: number
          target_event: string
          years_to_target: number
        }[]
      }
      get_deletion_status: {
        Args: { p_user_id: string }
        Returns: {
          can_cancel: boolean
          days_until_deletion: number
          request_id: string
          requested_at: string
          scheduled_hard_delete_at: string
          status: string
        }[]
      }
      get_deletions_ready_for_processing: {
        Args: never
        Returns: {
          days_remaining: number
          request_id: string
          scheduled_at: string
          user_id: string
        }[]
      }
      get_executed_version: {
        Args: { p_athlete_id: string; p_session_id: string }
        Returns: number
      }
      get_ff_relevant_exercises: {
        Args: {
          p_category?: string
          p_equipment?: string
          p_limit?: number
          p_min_relevance?: number
          p_position?: string
        }
        Returns: {
          applicable_positions: string[]
          body_part: string
          difficulty_level: string
          equipment: string
          ff_category: string
          ff_training_focus: string[]
          flag_football_relevance: number
          gif_url: string
          id: string
          instructions: string[]
          name: string
          target_muscle: string
        }[]
      }
      get_injury_risk_level: { Args: { acwr_value: number }; Returns: string }
      get_or_create_daily_protocol: {
        Args: { p_date?: string; p_user_id: string }
        Returns: string
      }
      get_position_modifiers: {
        Args: { athlete_position: string }
        Returns: {
          additional_exercises: Json
          exercise_category: string
          intensity_modifier: number
          notes: string
          priority: number
          volume_modifier: number
        }[]
      }
      get_qb_throwing_progression: {
        Args: { p_user_id: string }
        Returns: {
          current_week_avg: number
          days_since_last_session: number
          progression_phase: string
          recommendation: string
          target_throws: number
          weekly_compliance_pct: number
        }[]
      }
      get_relevant_conversation_context: {
        Args: {
          p_max_results?: number
          p_query_embedding: string
          p_user_id: string
        }
        Returns: {
          goals: Json
          injuries: Json
          period_start: string
          relevance_score: number
          summary_text: string
          topics: string[]
        }[]
      }
      get_tournament_availability_summary: {
        Args: { p_team_id: string; p_tournament_id: string }
        Returns: {
          confirmed_count: number
          declined_count: number
          pending_count: number
          tentative_count: number
          total_players: number
        }[]
      }
      get_upcoming_tournaments: {
        Args: { from_date?: string; limit_count?: number }
        Returns: {
          days_until: number
          end_date: string
          id: string
          is_peak_event: boolean
          name: string
          start_date: string
          taper_start_date: string
        }[]
      }
      get_user_team_role: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: string
      }
      has_active_safety_override: {
        Args: { p_athlete_id: string; p_data_type?: string }
        Returns: boolean
      }
      has_approved_admin_role: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      has_role: { Args: { required_role: string }; Returns: boolean }
      increment_comment_likes_count: {
        Args: { comment_id: string }
        Returns: undefined
      }
      increment_comments_count: {
        Args: { post_id: string }
        Returns: undefined
      }
      increment_likes_count: { Args: { post_id: string }; Returns: undefined }
      increment_poll_votes: { Args: { option_id: string }; Returns: undefined }
      initiate_account_deletion: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: string
      }
      insert_late_execution_data: {
        Args: {
          p_athlete_id: string
          p_exercise_name: string
          p_logged_at?: string
          p_reps_completed: number
          p_rpe: number
          p_session_id: string
          p_sets_completed: number
        }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      is_coach: { Args: never; Returns: boolean }
      is_coach_of_athlete: {
        Args: { p_athlete_id: string; p_coach_id: string }
        Returns: boolean
      }
      is_staff_for_player: {
        Args: { p_player_id: string; p_roles: string[]; p_staff_id: string }
        Returns: boolean
      }
      is_staff_member: {
        Args: { p_roles: string[]; p_user_id: string }
        Returns: boolean
      }
      is_staff_role: { Args: never; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      is_team_approved: { Args: { p_team_id: string }; Returns: boolean }
      is_team_coach_or_higher: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_member:
        | { Args: { p_team_id: string; p_user_id: string }; Returns: boolean }
        | {
            Args: { p_roles: string[]; p_team_id: string; p_user_id: string }
            Returns: boolean
          }
      is_team_owner_or_admin: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_staff: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_staff_for_athlete: {
        Args: { p_athlete_id: string; p_staff_id: string }
        Returns: boolean
      }
      learn_user_preferences: {
        Args: { p_interaction_data: Json; p_user_id: string }
        Returns: number
      }
      log_roster_change: {
        Args: {
          p_action: string
          p_new_values: Json
          p_old_values: Json
          p_target_id: string
          p_target_name: string
          p_target_type: string
          p_team_id: string
        }
        Returns: string
      }
      process_hard_deletion: {
        Args: { p_request_id: string }
        Returns: boolean
      }
      queue_push_notification: {
        Args: {
          p_body: string
          p_category?: string
          p_data?: Json
          p_priority?: string
          p_scheduled_for?: string
          p_source_id?: string
          p_source_type?: string
          p_title: string
          p_user_id: string
        }
        Returns: string
      }
      reject_team: {
        Args: { p_reason: string; p_team_id: string }
        Returns: boolean
      }
      require_ai_consent: { Args: { p_user_id: string }; Returns: boolean }
      search_knowledge_semantic: {
        Args: {
          filter_category?: string
          filter_risk_level?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          evidence_grade: string
          id: string
          risk_level: string
          similarity: number
          source_quality_score: number
          source_type: string
          source_url: string
          subcategory: string
          title: string
        }[]
      }
      send_notification:
        | {
            Args: {
              p_action_url?: string
              p_category?: string
              p_data?: Json
              p_message: string
              p_notification_type: string
              p_related_entity_id?: string
              p_related_entity_type?: string
              p_sender_id?: string
              p_severity?: string
              p_title: string
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_expires_at?: string
              p_link?: string
              p_message: string
              p_title: string
              p_type?: string
              p_user_id: string
            }
            Returns: string
          }
      sql: { Args: { query: string }; Returns: Json[] }
      uid: { Args: never; Returns: string }
      update_chatbot_response_filters: {
        Args: {
          p_equipment_available_filter?: string[]
          p_experience_level_filter?: string
          p_filter_active?: boolean
          p_hide_injured_exercises?: boolean
          p_include_emojis?: boolean
          p_max_response_length?: string
          p_show_alternative_options?: boolean
          p_show_only_current_phase?: boolean
          p_show_research_citations?: boolean
          p_show_video_links?: boolean
          p_technical_terminology_level?: string
          p_time_available_minutes?: number
        }
        Returns: {
          equipment_available_filter: string[] | null
          experience_level_filter: string | null
          filter_active: boolean | null
          hide_injured_exercises: boolean | null
          include_emojis: boolean | null
          max_response_length: string | null
          show_alternative_options: boolean | null
          show_only_current_phase: boolean | null
          show_research_citations: boolean | null
          show_video_links: boolean | null
          technical_terminology_level: string | null
          time_available_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "chatbot_response_filters"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_chatbot_response_filters_as_user: {
        Args: {
          p_equipment_available_filter?: string[]
          p_experience_level_filter?: string
          p_filter_active?: boolean
          p_hide_injured_exercises?: boolean
          p_include_emojis?: boolean
          p_max_response_length?: string
          p_show_alternative_options?: boolean
          p_show_only_current_phase?: boolean
          p_show_research_citations?: boolean
          p_show_video_links?: boolean
          p_technical_terminology_level?: string
          p_time_available_minutes?: number
          p_user_id: string
        }
        Returns: {
          equipment_available_filter: string[] | null
          experience_level_filter: string | null
          filter_active: boolean | null
          hide_injured_exercises: boolean | null
          include_emojis: boolean | null
          max_response_length: string | null
          show_alternative_options: boolean | null
          show_only_current_phase: boolean | null
          show_research_citations: boolean | null
          show_video_links: boolean | null
          technical_terminology_level: string | null
          time_available_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "chatbot_response_filters"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_load_daily_for_date: {
        Args: { log_date: string; player_uuid: string }
        Returns: undefined
      }
      update_player_streak: {
        Args: {
          p_activity_date?: string
          p_streak_type: string
          p_user_id: string
        }
        Returns: {
          achievements_unlocked: string[]
          is_new_record: boolean
          new_streak: number
        }[]
      }
      user_id: { Args: never; Returns: string }
      user_id_is_team_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      user_is_team_coach: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      user_training_summary_fn: {
        Args: never
        Returns: {
          avg_duration_minutes: number
          full_name: string
          last_performance_score: number
          latest_readiness_score: number
          latest_session_date: string
          latest_session_duration: number
          latest_session_name: string
          total_minutes: number
          total_sessions: number
          user_id: string
        }[]
      }
      users_share_team: {
        Args: { p_user_id_1: string; p_user_id_2: string }
        Returns: boolean
      }
      verify_consent_indexes: {
        Args: never
        Returns: {
          idx_exists: boolean
          index_name: string
          table_name: string
        }[]
      }
    }
    Enums: {
      channel_type_enum:
        | "announcements"
        | "team_general"
        | "coaches_only"
        | "position_group"
        | "game_day"
        | "direct_message"
      notification_category:
        | "game"
        | "team"
        | "training"
        | "wellness"
        | "achievement"
        | "tournament"
        | "coach"
        | "system"
        | "general"
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
        | "player_activity"
      training_session_status:
        | "planned"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "scheduled"
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
    Enums: {
      channel_type_enum: [
        "announcements",
        "team_general",
        "coaches_only",
        "position_group",
        "game_day",
        "direct_message",
      ],
      notification_category: [
        "game",
        "team",
        "training",
        "wellness",
        "achievement",
        "tournament",
        "coach",
        "system",
        "general",
      ],
      notification_type_enum: [
        "training",
        "achievement",
        "team",
        "wellness",
        "general",
        "game",
        "tournament",
        "injury_risk",
        "weather",
        "chat_mention",
        "chat_announcement",
        "chat_important",
        "stats_uploaded",
        "player_activity",
      ],
      training_session_status: [
        "planned",
        "in_progress",
        "completed",
        "cancelled",
        "scheduled",
      ],
    },
  },
} as const

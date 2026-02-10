/**
 * Supabase Database Types
 * Auto-generated. Regenerate with: npx supabase gen types typescript --project-id <id> > supabase-types.ts
 */
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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      acwr_calculations: {
        Row: {
          acute_load_average: number | null
          acute_load_sessions: number | null
          acute_load_sum: number | null
          acute_period_days: number | null
          acwr: number | null
          acwr_method: string | null
          acwr_zone: string | null
          calculation_confidence: number | null
          calculation_date: string
          chronic_load_average: number | null
          chronic_load_sessions: number | null
          chronic_load_sum: number | null
          chronic_period_days: number | null
          created_at: string | null
          data_completeness: number | null
          fatigue_level: number | null
          fitness_level: number | null
          id: string
          injury_risk_multiplier: number | null
          load_adjustment_recommendation: number | null
          target_acute_load: number | null
          target_acwr: number | null
          training_status: string | null
          user_id: string
        }
        Insert: {
          acute_load_average?: number | null
          acute_load_sessions?: number | null
          acute_load_sum?: number | null
          acute_period_days?: number | null
          acwr?: number | null
          acwr_method?: string | null
          acwr_zone?: string | null
          calculation_confidence?: number | null
          calculation_date: string
          chronic_load_average?: number | null
          chronic_load_sessions?: number | null
          chronic_load_sum?: number | null
          chronic_period_days?: number | null
          created_at?: string | null
          data_completeness?: number | null
          fatigue_level?: number | null
          fitness_level?: number | null
          id?: string
          injury_risk_multiplier?: number | null
          load_adjustment_recommendation?: number | null
          target_acute_load?: number | null
          target_acwr?: number | null
          training_status?: string | null
          user_id: string
        }
        Update: {
          acute_load_average?: number | null
          acute_load_sessions?: number | null
          acute_load_sum?: number | null
          acute_period_days?: number | null
          acwr?: number | null
          acwr_method?: string | null
          acwr_zone?: string | null
          calculation_confidence?: number | null
          calculation_date?: string
          chronic_load_average?: number | null
          chronic_load_sessions?: number | null
          chronic_load_sum?: number | null
          chronic_period_days?: number | null
          created_at?: string | null
          data_completeness?: number | null
          fatigue_level?: number | null
          fitness_level?: number | null
          id?: string
          injury_risk_multiplier?: number | null
          load_adjustment_recommendation?: number | null
          target_acute_load?: number | null
          target_acwr?: number | null
          training_status?: string | null
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
      acwr_history: {
        Row: {
          acute_load: number | null
          acwr_ratio: number | null
          calculation_date: string
          chronic_load: number | null
          created_at: string | null
          id: string
          notes: string | null
          risk_level: string | null
          training_sessions_count: number | null
          user_id: string
        }
        Insert: {
          acute_load?: number | null
          acwr_ratio?: number | null
          calculation_date: string
          chronic_load?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          risk_level?: string | null
          training_sessions_count?: number | null
          user_id: string
        }
        Update: {
          acute_load?: number | null
          acwr_ratio?: number | null
          calculation_date?: string
          chronic_load?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          risk_level?: string | null
          training_sessions_count?: number | null
          user_id?: string
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
        Relationships: []
      }
      ai_followups: {
        Row: {
          created_at: string | null
          followup_type: string
          id: string
          message: string
          metadata: Json | null
          response: string | null
          scheduled_for: string
          sent_at: string | null
          session_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          followup_type: string
          id?: string
          message: string
          metadata?: Json | null
          response?: string | null
          scheduled_for: string
          sent_at?: string | null
          session_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          followup_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          response?: string | null
          scheduled_for?: string
          sent_at?: string | null
          session_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      ai_response_feedback: {
        Row: {
          created_at: string | null
          feedback_text: string | null
          feedback_type: string
          id: string
          message_id: string | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_text?: string | null
          feedback_type: string
          id?: string
          message_id?: string | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_text?: string | null
          feedback_type?: string
          id?: string
          message_id?: string | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_review_queue: {
        Row: {
          auto_flagged_reasons: string[] | null
          created_at: string | null
          id: string
          interaction_id: string
          priority: string | null
          review_notes: string | null
          review_type: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: string | null
        }
        Insert: {
          auto_flagged_reasons?: string[] | null
          created_at?: string | null
          id?: string
          interaction_id: string
          priority?: string | null
          review_notes?: string | null
          review_type: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string | null
        }
        Update: {
          auto_flagged_reasons?: string[] | null
          created_at?: string | null
          id?: string
          interaction_id?: string
          priority?: string | null
          review_notes?: string | null
          review_type?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      analytics_aggregates: {
        Row: {
          aggregate_type: string
          created_at: string | null
          id: string
          metrics: Json
          period_end: string
          period_start: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aggregate_type: string
          created_at?: string | null
          id?: string
          metrics?: Json
          period_end: string
          period_start: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aggregate_type?: string
          created_at?: string | null
          id?: string
          metrics?: Json
          period_end?: string
          period_start?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          approver_id: string
          created_at: string | null
          id: string
          request_data: Json
          request_type: string
          requester_id: string
          response_data: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approver_id: string
          created_at?: string | null
          id?: string
          request_data?: Json
          request_type: string
          requester_id: string
          response_data?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approver_id?: string
          created_at?: string | null
          id?: string
          request_data?: Json
          request_type?: string
          requester_id?: string
          response_data?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      article_search_index: {
        Row: {
          article_id: string | null
          created_at: string | null
          id: string
          keywords: string[] | null
          search_vector: unknown
          searchable_text: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          search_vector?: unknown
          searchable_text?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          search_vector?: unknown
          searchable_text?: string | null
        }
        Relationships: []
      }
      athlete_achievements: {
        Row: {
          achievement_data: Json
          achievement_type: string
          athlete_id: string
          created_at: string | null
          earned_at: string | null
          id: string
        }
        Insert: {
          achievement_data?: Json
          achievement_type: string
          athlete_id: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
        }
        Update: {
          achievement_data?: Json
          achievement_type?: string
          athlete_id?: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
        }
        Relationships: []
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
      athlete_daily_state: {
        Row: {
          athlete_id: string
          created_at: string | null
          fatigue_level: number | null
          id: string
          motivation_level: number | null
          readiness_score: number | null
          sleep_quality: number | null
          state_data: Json | null
          state_date: string
          stress_level: number | null
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          fatigue_level?: number | null
          id?: string
          motivation_level?: number | null
          readiness_score?: number | null
          sleep_quality?: number | null
          state_data?: Json | null
          state_date: string
          stress_level?: number | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          fatigue_level?: number | null
          id?: string
          motivation_level?: number | null
          readiness_score?: number | null
          sleep_quality?: number | null
          state_data?: Json | null
          state_date?: string
          stress_level?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
          user_id: string
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
          user_id: string
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
          user_id?: string
          violation_id?: string
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
      classification_history: {
        Row: {
          classification_type: string
          classified_by: string | null
          created_at: string | null
          id: string
          new_value: string | null
          previous_value: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          classification_type: string
          classified_by?: string | null
          created_at?: string | null
          id?: string
          new_value?: string | null
          previous_value?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          classification_type?: string
          classified_by?: string | null
          created_at?: string | null
          id?: string
          new_value?: string | null
          previous_value?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coach_alert_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          action_taken: string | null
          alert_type: string
          coach_id: string
          created_at: string | null
          id: string
          notes: string | null
          player_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          action_taken?: string | null
          alert_type: string
          coach_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          player_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          action_taken?: string | null
          alert_type?: string
          coach_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          player_id?: string | null
        }
        Relationships: []
      }
      coach_analytics_cache: {
        Row: {
          cache_data: Json
          cache_key: string
          coach_id: string
          created_at: string | null
          expires_at: string
          id: string
          team_id: string | null
        }
        Insert: {
          cache_data?: Json
          cache_key: string
          coach_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          team_id?: string | null
        }
        Update: {
          cache_data?: Json
          cache_key?: string
          coach_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_analytics_cache_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
      coach_inbox_items: {
        Row: {
          action_required: boolean | null
          action_taken: string | null
          actioned_at: string | null
          coach_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          item_type: string
          message: string | null
          metadata: Json | null
          player_id: string | null
          priority: string | null
          source: string | null
          status: string | null
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_required?: boolean | null
          action_taken?: string | null
          actioned_at?: string | null
          coach_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          item_type: string
          message?: string | null
          metadata?: Json | null
          player_id?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_required?: boolean | null
          action_taken?: string | null
          actioned_at?: string | null
          coach_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          item_type?: string
          message?: string | null
          metadata?: Json | null
          player_id?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_inbox_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_overrides: {
        Row: {
          coach_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          override_data: Json
          override_type: string
          player_id: string
          reason: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          override_data?: Json
          override_type: string
          player_id: string
          reason?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          override_data?: Json
          override_type?: string
          player_id?: string
          reason?: string | null
        }
        Relationships: []
      }
      consent_access_log: {
        Row: {
          access_type: string
          accessed_at: string | null
          accessed_by: string
          athlete_id: string
          consent_given: boolean | null
          data_category: string | null
          id: string
          reason: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          accessed_by: string
          athlete_id: string
          consent_given?: boolean | null
          data_category?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          accessed_by?: string
          athlete_id?: string
          consent_given?: boolean | null
          data_category?: string | null
          id?: string
          reason?: string | null
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
      conversation_context: {
        Row: {
          context_data: Json
          context_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          session_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_data?: Json
          context_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          session_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_data?: Json
          context_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_wellness_checkin: {
        Row: {
          calculated_readiness: number | null
          checkin_date: string
          created_at: string | null
          energy_level: number | null
          hydration_level: number | null
          id: string
          mood: number | null
          motivation_level: number | null
          muscle_soreness: number | null
          notes: string | null
          sleep_hours: number | null
          sleep_quality: number | null
          soreness_areas: string[] | null
          stress_level: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calculated_readiness?: number | null
          checkin_date: string
          created_at?: string | null
          energy_level?: number | null
          hydration_level?: number | null
          id?: string
          mood?: number | null
          motivation_level?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          soreness_areas?: string[] | null
          stress_level?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calculated_readiness?: number | null
          checkin_date?: string
          created_at?: string | null
          energy_level?: number | null
          hydration_level?: number | null
          id?: string
          mood?: number | null
          motivation_level?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          soreness_areas?: string[] | null
          stress_level?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_wellness_checkin_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_ledger: {
        Row: {
          created_at: string | null
          decision_data: Json
          decision_maker: string
          decision_type: string
          id: string
          rationale: string | null
          status: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          decision_data?: Json
          decision_maker: string
          decision_type: string
          id?: string
          rationale?: string | null
          status?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          decision_data?: Json
          decision_maker?: string
          decision_type?: string
          id?: string
          rationale?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
          created_at: string | null
          decision_id: string
          id: string
          reminder_date: string
          reminder_sent: boolean | null
        }
        Insert: {
          created_at?: string | null
          decision_id: string
          id?: string
          reminder_date: string
          reminder_sent?: boolean | null
        }
        Update: {
          created_at?: string | null
          decision_id?: string
          id?: string
          reminder_date?: string
          reminder_sent?: boolean | null
        }
        Relationships: []
      }
      digest_history: {
        Row: {
          content: Json
          created_at: string | null
          digest_date: string
          digest_type: string
          id: string
          opened_at: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          digest_date: string
          digest_type: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          digest_date?: string
          digest_type?: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          user_id?: string
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
      exercise_library: {
        Row: {
          category: string | null
          created_at: string
          default_params_json: Json | null
          id: string
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_params_json?: Json | null
          id: string
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          default_params_json?: Json | null
          id?: string
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          created_at: string | null
          distance_completed: number | null
          exercise_id: string | null
          exercise_version: number | null
          id: string
          notes: string | null
          performance_metrics: Json | null
          reps_completed: number | null
          session_exercise_id: string | null
          sets_completed: number | null
          time_completed: number | null
          weight_used: number | null
          workout_log_id: string | null
        }
        Insert: {
          created_at?: string | null
          distance_completed?: number | null
          exercise_id?: string | null
          exercise_version?: number | null
          id?: string
          notes?: string | null
          performance_metrics?: Json | null
          reps_completed?: number | null
          session_exercise_id?: string | null
          sets_completed?: number | null
          time_completed?: number | null
          weight_used?: number | null
          workout_log_id?: string | null
        }
        Update: {
          created_at?: string | null
          distance_completed?: number | null
          exercise_id?: string | null
          exercise_version?: number | null
          id?: string
          notes?: string | null
          performance_metrics?: Json | null
          reps_completed?: number | null
          session_exercise_id?: string | null
          sets_completed?: number | null
          time_completed?: number | null
          weight_used?: number | null
          workout_log_id?: string | null
        }
        Relationships: []
      }
      exercise_registry: {
        Row: {
          category: string | null
          created_at: string | null
          difficulty_level: string | null
          equipment_needed: string[] | null
          exercise_name: string
          id: string
          instructions: string | null
          muscle_groups: string[] | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          equipment_needed?: string[] | null
          exercise_name: string
          id?: string
          instructions?: string | null
          muscle_groups?: string[] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          equipment_needed?: string[] | null
          exercise_name?: string
          id?: string
          instructions?: string | null
          muscle_groups?: string[] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      exercisedb_exercises: {
        Row: {
          category: string | null
          created_at: string | null
          equipment: string[] | null
          exercisedb_id: string
          id: string
          image_url: string | null
          instructions: string | null
          muscle_groups: string[] | null
          name: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          equipment?: string[] | null
          exercisedb_id: string
          id?: string
          image_url?: string | null
          instructions?: string | null
          muscle_groups?: string[] | null
          name: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          equipment?: string[] | null
          exercisedb_id?: string
          id?: string
          image_url?: string | null
          instructions?: string | null
          muscle_groups?: string[] | null
          name?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      exercisedb_import_logs: {
        Row: {
          errors: Json | null
          exercises_imported: number | null
          exercises_updated: number | null
          id: string
          import_date: string | null
          status: string | null
        }
        Insert: {
          errors?: Json | null
          exercises_imported?: number | null
          exercises_updated?: number | null
          id?: string
          import_date?: string | null
          status?: string | null
        }
        Update: {
          errors?: Json | null
          exercises_imported?: number | null
          exercises_updated?: number | null
          id?: string
          import_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          applicable_positions: string[] | null
          category: string | null
          created_at: string | null
          description: string | null
          equipment_needed: string[] | null
          id: string
          metrics_tracked: string[] | null
          movement_pattern: string | null
          name: string
          position_specific: boolean | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          applicable_positions?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          equipment_needed?: string[] | null
          id?: string
          metrics_tracked?: string[] | null
          movement_pattern?: string | null
          name: string
          position_specific?: boolean | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          applicable_positions?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          equipment_needed?: string[] | null
          id?: string
          metrics_tracked?: string[] | null
          movement_pattern?: string | null
          name?: string
          position_specific?: boolean | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      ff_exercise_mappings: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          exercisedb_exercise_id: string
          flag_football_exercise_id: string | null
          id: string
          mapping_type: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          exercisedb_exercise_id: string
          flag_football_exercise_id?: string | null
          id?: string
          mapping_type?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          exercisedb_exercise_id?: string
          flag_football_exercise_id?: string | null
          id?: string
          mapping_type?: string | null
        }
        Relationships: []
      }
      fixtures: {
        Row: {
          created_at: string | null
          fixture_date: string
          fixture_time: string | null
          id: string
          is_home: boolean | null
          location: string | null
          notes: string | null
          opponent_score: number | null
          opponent_team_name: string
          status: string | null
          team_id: string | null
          team_score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fixture_date: string
          fixture_time?: string | null
          id?: string
          is_home?: boolean | null
          location?: string | null
          notes?: string | null
          opponent_score?: number | null
          opponent_team_name: string
          status?: string | null
          team_id?: string | null
          team_score?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fixture_date?: string
          fixture_time?: string | null
          id?: string
          is_home?: boolean | null
          location?: string | null
          notes?: string | null
          opponent_score?: number | null
          opponent_team_name?: string
          status?: string | null
          team_id?: string | null
          team_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      flag_pull_stats: {
        Row: {
          attempt_location: string | null
          attempt_type: string | null
          ball_carrier_id: string
          closing_speed: number | null
          created_at: string | null
          defender_id: string
          evasion_technique: string | null
          game_event_id: number | null
          game_id: string
          id: number
          is_successful: boolean
          miss_reason: string | null
          num_broken_tackles: number | null
          pursuit_angle_degrees: number | null
          reaction_time: number | null
          video_clip_url: string | null
          yards_after_contact: number | null
          yards_after_miss: number | null
          yards_before_pull: number | null
        }
        Insert: {
          attempt_location?: string | null
          attempt_type?: string | null
          ball_carrier_id: string
          closing_speed?: number | null
          created_at?: string | null
          defender_id: string
          evasion_technique?: string | null
          game_event_id?: number | null
          game_id: string
          id?: number
          is_successful: boolean
          miss_reason?: string | null
          num_broken_tackles?: number | null
          pursuit_angle_degrees?: number | null
          reaction_time?: number | null
          video_clip_url?: string | null
          yards_after_contact?: number | null
          yards_after_miss?: number | null
          yards_before_pull?: number | null
        }
        Update: {
          attempt_location?: string | null
          attempt_type?: string | null
          ball_carrier_id?: string
          closing_speed?: number | null
          created_at?: string | null
          defender_id?: string
          evasion_technique?: string | null
          game_event_id?: number | null
          game_id?: string
          id?: number
          is_successful?: boolean
          miss_reason?: string | null
          num_broken_tackles?: number | null
          pursuit_angle_degrees?: number | null
          reaction_time?: number | null
          video_clip_url?: string | null
          yards_after_contact?: number | null
          yards_after_miss?: number | null
          yards_before_pull?: number | null
        }
        Relationships: []
      }
      game_events: {
        Row: {
          created_at: string | null
          defender_ids: string[] | null
          distance: number | null
          down: number | null
          field_conditions: string | null
          field_zone: string | null
          game_id: string
          id: number
          is_penalty: boolean | null
          is_successful: boolean | null
          is_turnover: boolean | null
          penalty_type: string | null
          play_category: string | null
          play_notes: string | null
          play_number: number
          play_result: string | null
          play_type: string | null
          primary_player_id: string | null
          quarter: number | null
          score_differential: number | null
          secondary_player_ids: string[] | null
          team_id: string
          time_remaining: number | null
          timestamp: string | null
          video_clip_url: string | null
          video_timestamp: number | null
          weather_conditions: string | null
          yard_line: number | null
          yards_after_catch: number | null
          yards_gained: number | null
        }
        Insert: {
          created_at?: string | null
          defender_ids?: string[] | null
          distance?: number | null
          down?: number | null
          field_conditions?: string | null
          field_zone?: string | null
          game_id: string
          id?: number
          is_penalty?: boolean | null
          is_successful?: boolean | null
          is_turnover?: boolean | null
          penalty_type?: string | null
          play_category?: string | null
          play_notes?: string | null
          play_number: number
          play_result?: string | null
          play_type?: string | null
          primary_player_id?: string | null
          quarter?: number | null
          score_differential?: number | null
          secondary_player_ids?: string[] | null
          team_id: string
          time_remaining?: number | null
          timestamp?: string | null
          video_clip_url?: string | null
          video_timestamp?: number | null
          weather_conditions?: string | null
          yard_line?: number | null
          yards_after_catch?: number | null
          yards_gained?: number | null
        }
        Update: {
          created_at?: string | null
          defender_ids?: string[] | null
          distance?: number | null
          down?: number | null
          field_conditions?: string | null
          field_zone?: string | null
          game_id?: string
          id?: number
          is_penalty?: boolean | null
          is_successful?: boolean | null
          is_turnover?: boolean | null
          penalty_type?: string | null
          play_category?: string | null
          play_notes?: string | null
          play_number?: number
          play_result?: string | null
          play_type?: string | null
          primary_player_id?: string | null
          quarter?: number | null
          score_differential?: number | null
          secondary_player_ids?: string[] | null
          team_id?: string
          time_remaining?: number | null
          timestamp?: string | null
          video_clip_url?: string | null
          video_timestamp?: number | null
          weather_conditions?: string | null
          yard_line?: number | null
          yards_after_catch?: number | null
          yards_gained?: number | null
        }
        Relationships: []
      }
      games: {
        Row: {
          created_at: string | null
          field_conditions: string | null
          game_date: string
          game_id: string
          game_result: string | null
          game_time: string | null
          game_type: string | null
          game_video_url: string | null
          id: number
          is_home_game: boolean | null
          location: string | null
          opponent_score: number | null
          opponent_team_name: string
          season: string | null
          team_id: string
          team_score: number | null
          temperature: number | null
          tournament_name: string | null
          updated_at: string | null
          weather_conditions: string | null
        }
        Insert: {
          created_at?: string | null
          field_conditions?: string | null
          game_date: string
          game_id: string
          game_result?: string | null
          game_time?: string | null
          game_type?: string | null
          game_video_url?: string | null
          id?: number
          is_home_game?: boolean | null
          location?: string | null
          opponent_score?: number | null
          opponent_team_name: string
          season?: string | null
          team_id: string
          team_score?: number | null
          temperature?: number | null
          tournament_name?: string | null
          updated_at?: string | null
          weather_conditions?: string | null
        }
        Update: {
          created_at?: string | null
          field_conditions?: string | null
          game_date?: string
          game_id?: string
          game_result?: string | null
          game_time?: string | null
          game_type?: string | null
          game_video_url?: string | null
          id?: number
          is_home_game?: boolean | null
          location?: string | null
          opponent_score?: number | null
          opponent_team_name?: string
          season?: string | null
          team_id?: string
          team_score?: number | null
          temperature?: number | null
          tournament_name?: string | null
          updated_at?: string | null
          weather_conditions?: string | null
        }
        Relationships: []
      }
      injuries: {
        Row: {
          actual_recovery_date: string | null
          body_part: string | null
          created_at: string | null
          description: string | null
          expected_recovery_date: string | null
          id: string
          injury_date: string
          injury_type: string
          player_id: string
          recovery_start_date: string | null
          restrictions: Json | null
          severity: string | null
          status: string | null
          treatment_plan: string | null
          updated_at: string | null
        }
        Insert: {
          actual_recovery_date?: string | null
          body_part?: string | null
          created_at?: string | null
          description?: string | null
          expected_recovery_date?: string | null
          id?: string
          injury_date: string
          injury_type: string
          player_id: string
          recovery_start_date?: string | null
          restrictions?: Json | null
          severity?: string | null
          status?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_recovery_date?: string | null
          body_part?: string | null
          created_at?: string | null
          description?: string | null
          expected_recovery_date?: string | null
          id?: string
          injury_date?: string
          injury_type?: string
          player_id?: string
          recovery_start_date?: string | null
          restrictions?: Json | null
          severity?: string | null
          status?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      injury_risk_factors: {
        Row: {
          acwr_risk_multiplier: number | null
          acwr_risk_score: number | null
          acwr_value: number | null
          alert_level: string | null
          alert_triggered: boolean | null
          assessment_date: string
          asymmetry_index: number | null
          chronic_sleep_debt_hours: number | null
          consecutive_weeks_high_load: number | null
          created_at: string | null
          cutting_volume_spike: number | null
          days_since_last_injury: number | null
          id: string
          injury_history_risk_score: number | null
          injury_probability_30days: number | null
          intervention_priority_order: string[] | null
          load_spike_risk_score: number | null
          model_version: string | null
          monotony_risk_score: number | null
          movement_quality_score: number | null
          movement_risk_score: number | null
          notification_sent: boolean | null
          overall_injury_risk: number | null
          poor_recovery_days_count: number | null
          position_specific_load_ratio: number | null
          predicted_injury_window_days: number | null
          prediction_confidence: number | null
          previous_injury_count: number | null
          recommended_interventions: string[] | null
          recovery_risk_score: number | null
          recovery_score_7day_avg: number | null
          risk_level: string | null
          risk_reduction_with_intervention: number | null
          sprint_volume_spike: number | null
          target_risk_level: number | null
          top_risk_factors: Json | null
          training_monotony: number | null
          user_id: string
          week_over_week_load_change: number | null
          weeks_high_monotony: number | null
        }
        Insert: {
          acwr_risk_multiplier?: number | null
          acwr_risk_score?: number | null
          acwr_value?: number | null
          alert_level?: string | null
          alert_triggered?: boolean | null
          assessment_date: string
          asymmetry_index?: number | null
          chronic_sleep_debt_hours?: number | null
          consecutive_weeks_high_load?: number | null
          created_at?: string | null
          cutting_volume_spike?: number | null
          days_since_last_injury?: number | null
          id?: string
          injury_history_risk_score?: number | null
          injury_probability_30days?: number | null
          intervention_priority_order?: string[] | null
          load_spike_risk_score?: number | null
          model_version?: string | null
          monotony_risk_score?: number | null
          movement_quality_score?: number | null
          movement_risk_score?: number | null
          notification_sent?: boolean | null
          overall_injury_risk?: number | null
          poor_recovery_days_count?: number | null
          position_specific_load_ratio?: number | null
          predicted_injury_window_days?: number | null
          prediction_confidence?: number | null
          previous_injury_count?: number | null
          recommended_interventions?: string[] | null
          recovery_risk_score?: number | null
          recovery_score_7day_avg?: number | null
          risk_level?: string | null
          risk_reduction_with_intervention?: number | null
          sprint_volume_spike?: number | null
          target_risk_level?: number | null
          top_risk_factors?: Json | null
          training_monotony?: number | null
          user_id: string
          week_over_week_load_change?: number | null
          weeks_high_monotony?: number | null
        }
        Update: {
          acwr_risk_multiplier?: number | null
          acwr_risk_score?: number | null
          acwr_value?: number | null
          alert_level?: string | null
          alert_triggered?: boolean | null
          assessment_date?: string
          asymmetry_index?: number | null
          chronic_sleep_debt_hours?: number | null
          consecutive_weeks_high_load?: number | null
          created_at?: string | null
          cutting_volume_spike?: number | null
          days_since_last_injury?: number | null
          id?: string
          injury_history_risk_score?: number | null
          injury_probability_30days?: number | null
          intervention_priority_order?: string[] | null
          load_spike_risk_score?: number | null
          model_version?: string | null
          monotony_risk_score?: number | null
          movement_quality_score?: number | null
          movement_risk_score?: number | null
          notification_sent?: boolean | null
          overall_injury_risk?: number | null
          poor_recovery_days_count?: number | null
          position_specific_load_ratio?: number | null
          predicted_injury_window_days?: number | null
          prediction_confidence?: number | null
          previous_injury_count?: number | null
          recommended_interventions?: string[] | null
          recovery_risk_score?: number | null
          recovery_score_7day_avg?: number | null
          risk_level?: string | null
          risk_reduction_with_intervention?: number | null
          sprint_volume_spike?: number | null
          target_risk_level?: number | null
          top_risk_factors?: Json | null
          training_monotony?: number | null
          user_id?: string
          week_over_week_load_change?: number | null
          weeks_high_monotony?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "injury_risk_factors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      isometrics_exercises: {
        Row: {
          category: string | null
          created_at: string | null
          difficulty_level: string | null
          effectiveness_rating: number | null
          equipment_needed: string[] | null
          exercise_name: string
          hold_duration_seconds: number | null
          id: number
          instructions: string | null
          performance_metrics: Json | null
          target_muscles: string[] | null
          variations: string[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          effectiveness_rating?: number | null
          equipment_needed?: string[] | null
          exercise_name: string
          hold_duration_seconds?: number | null
          id?: number
          instructions?: string | null
          performance_metrics?: Json | null
          target_muscles?: string[] | null
          variations?: string[] | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          effectiveness_rating?: number | null
          equipment_needed?: string[] | null
          exercise_name?: string
          hold_duration_seconds?: number | null
          id?: number
          instructions?: string | null
          performance_metrics?: Json | null
          target_muscles?: string[] | null
          variations?: string[] | null
        }
        Relationships: []
      }
      knowledge_base_entries: {
        Row: {
          answer: string
          applicable_to: string[] | null
          best_practices: string[] | null
          consensus_level: string | null
          contraindications: string[] | null
          created_at: string | null
          dosage_guidelines: Json | null
          entry_type: string
          evidence_strength: string | null
          id: string
          last_queried_at: string | null
          protocols: Json | null
          query_count: number | null
          question: string | null
          safety_warnings: string[] | null
          sport_specificity: string | null
          summary: string | null
          supporting_articles: string[] | null
          topic: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          applicable_to?: string[] | null
          best_practices?: string[] | null
          consensus_level?: string | null
          contraindications?: string[] | null
          created_at?: string | null
          dosage_guidelines?: Json | null
          entry_type: string
          evidence_strength?: string | null
          id?: string
          last_queried_at?: string | null
          protocols?: Json | null
          query_count?: number | null
          question?: string | null
          safety_warnings?: string[] | null
          sport_specificity?: string | null
          summary?: string | null
          supporting_articles?: string[] | null
          topic: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          applicable_to?: string[] | null
          best_practices?: string[] | null
          consensus_level?: string | null
          contraindications?: string[] | null
          created_at?: string | null
          dosage_guidelines?: Json | null
          entry_type?: string
          evidence_strength?: string | null
          id?: string
          last_queried_at?: string | null
          protocols?: Json | null
          query_count?: number | null
          question?: string | null
          safety_warnings?: string[] | null
          sport_specificity?: string | null
          summary?: string | null
          supporting_articles?: string[] | null
          topic?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_base_governance_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          entry_id: string | null
          id: string
          performed_by: string | null
          reason: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          entry_id?: string | null
          id?: string
          performed_by?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          entry_id?: string | null
          id?: string
          performed_by?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      knowledge_search_index: {
        Row: {
          created_at: string | null
          entry_id: string | null
          id: string
          search_vector: unknown
          searchable_text: string | null
        }
        Insert: {
          created_at?: string | null
          entry_id?: string | null
          id?: string
          search_vector?: unknown
          searchable_text?: string | null
        }
        Update: {
          created_at?: string | null
          entry_id?: string | null
          id?: string
          search_vector?: unknown
          searchable_text?: string | null
        }
        Relationships: []
      }
      load_caps: {
        Row: {
          cap_type: string
          cap_value: number
          created_at: string | null
          effective_from: string
          effective_to: string | null
          id: string
          player_id: string
          reason: string | null
          updated_at: string | null
        }
        Insert: {
          cap_type: string
          cap_value: number
          created_at?: string | null
          effective_from: string
          effective_to?: string | null
          id?: string
          player_id: string
          reason?: string | null
          updated_at?: string | null
        }
        Update: {
          cap_type?: string
          cap_value?: number
          created_at?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          player_id?: string
          reason?: string | null
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
        }
        Insert: {
          created_at?: string
          daily_load: number
          date: string
          id?: string
          player_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_load?: number
          date?: string
          id?: string
          player_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      load_management_research: {
        Row: {
          absorption_tips: string[] | null
          authors: string[] | null
          cold_therapy_protocols: Json | null
          conclusions: string | null
          created_at: string | null
          doi: string | null
          evidence_level: string | null
          food_sources: Json | null
          id: string
          injury_types: string[] | null
          integrated_into_algorithms: boolean | null
          integration_notes: string | null
          journal: string | null
          key_findings: string | null
          massage_gun_protocols: Json | null
          methodology: string | null
          population_type: string | null
          practical_applications: string[] | null
          psychological_topics: string[] | null
          publication_year: number | null
          pubmed_id: string | null
          recovery_methods: string[] | null
          relevance_to_flag_football: number | null
          results_summary: string | null
          safety_warnings: string[] | null
          sample_size: number | null
          sauna_protocols: Json | null
          sport_type: string | null
          study_title: string
          study_type: string | null
          supplement_guidance: Json | null
          supplement_types: string[] | null
          training_types: string[] | null
        }
        Insert: {
          absorption_tips?: string[] | null
          authors?: string[] | null
          cold_therapy_protocols?: Json | null
          conclusions?: string | null
          created_at?: string | null
          doi?: string | null
          evidence_level?: string | null
          food_sources?: Json | null
          id?: string
          injury_types?: string[] | null
          integrated_into_algorithms?: boolean | null
          integration_notes?: string | null
          journal?: string | null
          key_findings?: string | null
          massage_gun_protocols?: Json | null
          methodology?: string | null
          population_type?: string | null
          practical_applications?: string[] | null
          psychological_topics?: string[] | null
          publication_year?: number | null
          pubmed_id?: string | null
          recovery_methods?: string[] | null
          relevance_to_flag_football?: number | null
          results_summary?: string | null
          safety_warnings?: string[] | null
          sample_size?: number | null
          sauna_protocols?: Json | null
          sport_type?: string | null
          study_title: string
          study_type?: string | null
          supplement_guidance?: Json | null
          supplement_types?: string[] | null
          training_types?: string[] | null
        }
        Update: {
          absorption_tips?: string[] | null
          authors?: string[] | null
          cold_therapy_protocols?: Json | null
          conclusions?: string | null
          created_at?: string | null
          doi?: string | null
          evidence_level?: string | null
          food_sources?: Json | null
          id?: string
          injury_types?: string[] | null
          integrated_into_algorithms?: boolean | null
          integration_notes?: string | null
          journal?: string | null
          key_findings?: string | null
          massage_gun_protocols?: Json | null
          methodology?: string | null
          population_type?: string | null
          practical_applications?: string[] | null
          psychological_topics?: string[] | null
          publication_year?: number | null
          pubmed_id?: string | null
          recovery_methods?: string[] | null
          relevance_to_flag_football?: number | null
          results_summary?: string | null
          safety_warnings?: string[] | null
          sample_size?: number | null
          sauna_protocols?: Json | null
          sport_type?: string | null
          study_title?: string
          study_type?: string | null
          supplement_guidance?: Json | null
          supplement_types?: string[] | null
          training_types?: string[] | null
        }
        Relationships: []
      }
      load_metrics: {
        Row: {
          baseline_days: number | null
          created_at: string | null
          daily_load: number | null
          date: string
          id: string
          player_id: string
          risk_level: string | null
          updated_at: string | null
        }
        Insert: {
          baseline_days?: number | null
          created_at?: string | null
          daily_load?: number | null
          date: string
          id?: string
          player_id: string
          risk_level?: string | null
          updated_at?: string | null
        }
        Update: {
          baseline_days?: number | null
          created_at?: string | null
          daily_load?: number | null
          date?: string
          id?: string
          player_id?: string
          risk_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      load_monitoring: {
        Row: {
          acute_load: number | null
          acwr: number | null
          chronic_load: number | null
          created_at: string | null
          id: string
          monitoring_date: string
          player_id: string
          risk_level: string | null
          updated_at: string | null
        }
        Insert: {
          acute_load?: number | null
          acwr?: number | null
          chronic_load?: number | null
          created_at?: string | null
          id?: string
          monitoring_date: string
          player_id: string
          risk_level?: string | null
          updated_at?: string | null
        }
        Update: {
          acute_load?: number | null
          acwr?: number | null
          chronic_load?: number | null
          created_at?: string | null
          id?: string
          monitoring_date?: string
          player_id?: string
          risk_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      metric_definitions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          max_value: number | null
          metric_name: string
          metric_type: string
          min_value: number | null
          target_value: number | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_value?: number | null
          metric_name: string
          metric_type: string
          min_value?: number | null
          target_value?: number | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_value?: number | null
          metric_name?: string
          metric_type?: string
          min_value?: number | null
          target_value?: number | null
          unit?: string | null
        }
        Relationships: []
      }
      metric_entries: {
        Row: {
          created_at: string | null
          id: string
          metric_id: string
          metric_value: number
          notes: string | null
          player_id: string
          recorded_at: string
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_id: string
          metric_value: number
          notes?: string | null
          player_id: string
          recorded_at?: string
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_id?: string
          metric_value?: number
          notes?: string | null
          player_id?: string
          recorded_at?: string
          session_id?: string | null
        }
        Relationships: []
      }
      micro_session_analytics: {
        Row: {
          avg_duration_seconds: number | null
          completion_rate: number | null
          created_at: string | null
          favorite_type: string | null
          id: string
          last_completed_at: string | null
          micro_session_id: string | null
          streak_days: number | null
          total_completed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_duration_seconds?: number | null
          completion_rate?: number | null
          created_at?: string | null
          favorite_type?: string | null
          id?: string
          last_completed_at?: string | null
          micro_session_id?: string | null
          streak_days?: number | null
          total_completed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_duration_seconds?: number | null
          completion_rate?: number | null
          created_at?: string | null
          favorite_type?: string | null
          id?: string
          last_completed_at?: string | null
          micro_session_id?: string | null
          streak_days?: number | null
          total_completed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "micro_session_analytics_micro_session_id_fkey"
            columns: ["micro_session_id"]
            isOneToOne: false
            referencedRelation: "micro_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_seconds: number
          id: string
          instructions: string[] | null
          notes: string | null
          scheduled_time: string | null
          session_type: string
          skipped: boolean | null
          title: string
          trigger_context: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds: number
          id?: string
          instructions?: string[] | null
          notes?: string | null
          scheduled_time?: string | null
          session_type: string
          skipped?: boolean | null
          title: string
          trigger_context?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number
          id?: string
          instructions?: string[] | null
          notes?: string | null
          scheduled_time?: string | null
          session_type?: string
          skipped?: boolean | null
          title?: string
          trigger_context?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ml_training_data: {
        Row: {
          created_at: string | null
          feature_vector: Json
          id: string
          model_version: string | null
          player_id: string
          prediction_type: string | null
          target_value: number | null
        }
        Insert: {
          created_at?: string | null
          feature_vector: Json
          id?: string
          model_version?: string | null
          player_id: string
          prediction_type?: string | null
          target_value?: number | null
        }
        Update: {
          created_at?: string | null
          feature_vector?: Json
          id?: string
          model_version?: string | null
          player_id?: string
          prediction_type?: string | null
          target_value?: number | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          notification_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          notification_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          notification_type?: string
          updated_at?: string | null
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
          id: string
          is_read: boolean | null
          message: string
          notification_type: string | null
          priority: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sender_id: string | null
          sender_name: string | null
          severity: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          data?: Json | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type?: string | null
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          sender_name?: string | null
          severity?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          data?: Json | null
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string | null
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          sender_name?: string | null
          severity?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_goals: {
        Row: {
          calories_target: number | null
          carbs_target: number | null
          created_at: string | null
          fat_target: number | null
          fiber_target: number | null
          goal_type: string | null
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
          fiber_target?: number | null
          goal_type?: string | null
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
          fiber_target?: number | null
          goal_type?: string | null
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
      opponent_analysis: {
        Row: {
          avg_points_per_game: number | null
          avg_yards_per_play: number | null
          created_at: string | null
          exploitable_matchups: string[] | null
          formation_tendencies: Json | null
          game_plan_recommendations: string | null
          id: number
          last_updated: string | null
          opponent_player_name: string | null
          opponent_team_name: string
          play_tendencies: Json | null
          scouting_notes: string | null
          season: string | null
          situational_tendencies: Json | null
          strengths: string[] | null
          turnover_rate: number | null
          weaknesses: string[] | null
        }
        Insert: {
          avg_points_per_game?: number | null
          avg_yards_per_play?: number | null
          created_at?: string | null
          exploitable_matchups?: string[] | null
          formation_tendencies?: Json | null
          game_plan_recommendations?: string | null
          id?: number
          last_updated?: string | null
          opponent_player_name?: string | null
          opponent_team_name: string
          play_tendencies?: Json | null
          scouting_notes?: string | null
          season?: string | null
          situational_tendencies?: Json | null
          strengths?: string[] | null
          turnover_rate?: number | null
          weaknesses?: string[] | null
        }
        Update: {
          avg_points_per_game?: number | null
          avg_yards_per_play?: number | null
          created_at?: string | null
          exploitable_matchups?: string[] | null
          formation_tendencies?: Json | null
          game_plan_recommendations?: string | null
          id?: number
          last_updated?: string | null
          opponent_player_name?: string | null
          opponent_team_name?: string
          play_tendencies?: Json | null
          scouting_notes?: string | null
          season?: string | null
          situational_tendencies?: Json | null
          strengths?: string[] | null
          turnover_rate?: number | null
          weaknesses?: string[] | null
        }
        Relationships: []
      }
      ownership_transitions: {
        Row: {
          created_at: string | null
          from_owner_id: string
          id: string
          status: string | null
          team_id: string
          to_owner_id: string
          transition_date: string
        }
        Insert: {
          created_at?: string | null
          from_owner_id: string
          id?: string
          status?: string | null
          team_id: string
          to_owner_id: string
          transition_date: string
        }
        Update: {
          created_at?: string | null
          from_owner_id?: string
          id?: string
          status?: string | null
          team_id?: string
          to_owner_id?: string
          transition_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_transitions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_guardian_links: {
        Row: {
          athlete_id: string
          can_communicate_coach: boolean | null
          can_view_nutrition: boolean | null
          can_view_training: boolean | null
          can_view_wellness: boolean | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          parent_id: string
          relationship: string | null
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          athlete_id: string
          can_communicate_coach?: boolean | null
          can_view_nutrition?: boolean | null
          can_view_training?: boolean | null
          can_view_wellness?: boolean | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          parent_id: string
          relationship?: string | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          athlete_id?: string
          can_communicate_coach?: boolean | null
          can_view_nutrition?: boolean | null
          can_view_training?: boolean | null
          can_view_wellness?: boolean | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          parent_id?: string
          relationship?: string | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      parent_notifications: {
        Row: {
          athlete_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          notification_type: string
          parent_id: string
          priority: string | null
          read_at: string | null
          title: string
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          notification_type: string
          parent_id: string
          priority?: string | null
          read_at?: string | null
          title: string
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          parent_id?: string
          priority?: string | null
          read_at?: string | null
          title?: string
        }
        Relationships: []
      }
      passing_stats: {
        Row: {
          coverage_type: string | null
          created_at: string | null
          defender_id: string | null
          drop_reason: string | null
          drop_severity: string | null
          game_event_id: number | null
          game_id: string
          hang_time: number | null
          id: number
          intended_spot_accuracy: number | null
          is_drop: boolean | null
          outcome: string | null
          qb_under_pressure: boolean | null
          quarterback_id: string
          receiver_id: string | null
          route_depth: number | null
          separation_at_catch: number | null
          target_location: string | null
          throw_accuracy: string | null
          throw_type: string | null
          throw_velocity: number | null
          time_to_throw: number | null
          video_clip_url: string | null
          video_end_time: number | null
          video_start_time: number | null
        }
        Insert: {
          coverage_type?: string | null
          created_at?: string | null
          defender_id?: string | null
          drop_reason?: string | null
          drop_severity?: string | null
          game_event_id?: number | null
          game_id: string
          hang_time?: number | null
          id?: number
          intended_spot_accuracy?: number | null
          is_drop?: boolean | null
          outcome?: string | null
          qb_under_pressure?: boolean | null
          quarterback_id: string
          receiver_id?: string | null
          route_depth?: number | null
          separation_at_catch?: number | null
          target_location?: string | null
          throw_accuracy?: string | null
          throw_type?: string | null
          throw_velocity?: number | null
          time_to_throw?: number | null
          video_clip_url?: string | null
          video_end_time?: number | null
          video_start_time?: number | null
        }
        Update: {
          coverage_type?: string | null
          created_at?: string | null
          defender_id?: string | null
          drop_reason?: string | null
          drop_severity?: string | null
          game_event_id?: number | null
          game_id?: string
          hang_time?: number | null
          id?: number
          intended_spot_accuracy?: number | null
          is_drop?: boolean | null
          outcome?: string | null
          qb_under_pressure?: boolean | null
          quarterback_id?: string
          receiver_id?: string | null
          route_depth?: number | null
          separation_at_catch?: number | null
          target_location?: string | null
          throw_accuracy?: string | null
          throw_type?: string | null
          throw_velocity?: number | null
          time_to_throw?: number | null
          video_clip_url?: string | null
          video_end_time?: number | null
          video_start_time?: number | null
        }
        Relationships: []
      }
      physical_measurements: {
        Row: {
          basal_metabolic_rate: number | null
          body_age: number | null
          body_fat: number | null
          body_water_mass: number | null
          body_water_percentage: number | null
          bone_mineral_content: number | null
          bone_mineral_percentage: number | null
          created_at: string | null
          fat_mass: number | null
          height: number | null
          id: string
          muscle_mass: number | null
          muscle_percentage: number | null
          notes: string | null
          protein_mass: number | null
          protein_percentage: number | null
          skeletal_muscle_mass: number | null
          updated_at: string | null
          user_id: string
          visceral_fat_rating: number | null
          waist_to_hip_ratio: number | null
          weight: number | null
        }
        Insert: {
          basal_metabolic_rate?: number | null
          body_age?: number | null
          body_fat?: number | null
          body_water_mass?: number | null
          body_water_percentage?: number | null
          bone_mineral_content?: number | null
          bone_mineral_percentage?: number | null
          created_at?: string | null
          fat_mass?: number | null
          height?: number | null
          id?: string
          muscle_mass?: number | null
          muscle_percentage?: number | null
          notes?: string | null
          protein_mass?: number | null
          protein_percentage?: number | null
          skeletal_muscle_mass?: number | null
          updated_at?: string | null
          user_id: string
          visceral_fat_rating?: number | null
          waist_to_hip_ratio?: number | null
          weight?: number | null
        }
        Update: {
          basal_metabolic_rate?: number | null
          body_age?: number | null
          body_fat?: number | null
          body_water_mass?: number | null
          body_water_percentage?: number | null
          bone_mineral_content?: number | null
          bone_mineral_percentage?: number | null
          created_at?: string | null
          fat_mass?: number | null
          height?: number | null
          id?: string
          muscle_mass?: number | null
          muscle_percentage?: number | null
          notes?: string | null
          protein_mass?: number | null
          protein_percentage?: number | null
          skeletal_muscle_mass?: number | null
          updated_at?: string | null
          user_id?: string
          visceral_fat_rating?: number | null
          waist_to_hip_ratio?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      player_game_summary: {
        Row: {
          created_at: string | null
          defensive_epa: number | null
          drops: number | null
          flag_pulls: number | null
          game_id: string
          id: number
          interceptions: number | null
          missed_flag_pulls: number | null
          offensive_epa: number | null
          passing_touchdowns: number | null
          passing_yards: number | null
          performance_decline_2nd_half: boolean | null
          performance_notes: string | null
          player_id: string
          plays_participated: number | null
          position: string | null
          receiving_touchdowns: number | null
          receiving_yards: number | null
          receptions: number | null
          red_zone_attempts: number | null
          red_zone_scores: number | null
          rushing_touchdowns: number | null
          rushing_yards: number | null
          sacks: number | null
          stamina_score: number | null
          tackles: number | null
          targets: number | null
          third_down_attempts: number | null
          third_down_conversions: number | null
          updated_at: string | null
          win_probability_added: number | null
        }
        Insert: {
          created_at?: string | null
          defensive_epa?: number | null
          drops?: number | null
          flag_pulls?: number | null
          game_id: string
          id?: number
          interceptions?: number | null
          missed_flag_pulls?: number | null
          offensive_epa?: number | null
          passing_touchdowns?: number | null
          passing_yards?: number | null
          performance_decline_2nd_half?: boolean | null
          performance_notes?: string | null
          player_id: string
          plays_participated?: number | null
          position?: string | null
          receiving_touchdowns?: number | null
          receiving_yards?: number | null
          receptions?: number | null
          red_zone_attempts?: number | null
          red_zone_scores?: number | null
          rushing_touchdowns?: number | null
          rushing_yards?: number | null
          sacks?: number | null
          stamina_score?: number | null
          tackles?: number | null
          targets?: number | null
          third_down_attempts?: number | null
          third_down_conversions?: number | null
          updated_at?: string | null
          win_probability_added?: number | null
        }
        Update: {
          created_at?: string | null
          defensive_epa?: number | null
          drops?: number | null
          flag_pulls?: number | null
          game_id?: string
          id?: number
          interceptions?: number | null
          missed_flag_pulls?: number | null
          offensive_epa?: number | null
          passing_touchdowns?: number | null
          passing_yards?: number | null
          performance_decline_2nd_half?: boolean | null
          performance_notes?: string | null
          player_id?: string
          plays_participated?: number | null
          position?: string | null
          receiving_touchdowns?: number | null
          receiving_yards?: number | null
          receptions?: number | null
          red_zone_attempts?: number | null
          red_zone_scores?: number | null
          rushing_touchdowns?: number | null
          rushing_yards?: number | null
          sacks?: number | null
          stamina_score?: number | null
          tackles?: number | null
          targets?: number | null
          third_down_attempts?: number | null
          third_down_conversions?: number | null
          updated_at?: string | null
          win_probability_added?: number | null
        }
        Relationships: []
      }
      player_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          player_id: string
          status: string | null
          team_id: string
          tournament_id: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          player_id: string
          status?: string | null
          team_id: string
          tournament_id: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          player_id?: string
          status?: string | null
          team_id?: string
          tournament_id?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_payments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_programs: {
        Row: {
          assigned_by: string | null
          compliance_rate: number | null
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          player_id: string | null
          program_id: string | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          compliance_rate?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          player_id?: string | null
          program_id?: string | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          compliance_rate?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          player_id?: string | null
          program_id?: string | null
          start_date?: string
          updated_at?: string | null
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
            foreignKeyName: "player_tournament_availability_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      plyometrics_exercises: {
        Row: {
          created_at: string | null
          difficulty_level: string | null
          effectiveness_rating: number | null
          equipment_needed: string[] | null
          exercise_category: string | null
          exercise_name: string
          id: number
          injury_risk_rating: number | null
          instructions: string | null
          performance_metrics: Json | null
          progressions: string[] | null
          regressions: string[] | null
          target_muscles: string[] | null
          variations: string[] | null
        }
        Insert: {
          created_at?: string | null
          difficulty_level?: string | null
          effectiveness_rating?: number | null
          equipment_needed?: string[] | null
          exercise_category?: string | null
          exercise_name: string
          id?: number
          injury_risk_rating?: number | null
          instructions?: string | null
          performance_metrics?: Json | null
          progressions?: string[] | null
          regressions?: string[] | null
          target_muscles?: string[] | null
          variations?: string[] | null
        }
        Update: {
          created_at?: string | null
          difficulty_level?: string | null
          effectiveness_rating?: number | null
          equipment_needed?: string[] | null
          exercise_category?: string | null
          exercise_name?: string
          id?: number
          injury_risk_rating?: number | null
          instructions?: string | null
          performance_metrics?: Json | null
          progressions?: string[] | null
          regressions?: string[] | null
          target_muscles?: string[] | null
          variations?: string[] | null
        }
        Relationships: []
      }
      position_specific_metrics: {
        Row: {
          created_at: string | null
          date: string
          id: string
          metric_name: string
          metric_unit: string | null
          metric_value: number
          monthly_total: number | null
          notes: string | null
          player_id: string | null
          position_id: string | null
          updated_at: string | null
          weekly_total: number | null
          workout_log_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          monthly_total?: number | null
          notes?: string | null
          player_id?: string | null
          position_id?: string | null
          updated_at?: string | null
          weekly_total?: number | null
          workout_log_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          monthly_total?: number | null
          notes?: string | null
          player_id?: string | null
          position_id?: string | null
          updated_at?: string | null
          weekly_total?: number | null
          workout_log_id?: string | null
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      program_assignments: {
        Row: {
          active_from: string
          active_to: string | null
          assigned_at: string
          assigned_by: string
          created_at: string
          id: string
          player_id: string
          program_id: string
          status: string
          updated_at: string
        }
        Insert: {
          active_from: string
          active_to?: string | null
          assigned_at?: string
          assigned_by: string
          created_at?: string
          id?: string
          player_id: string
          program_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          active_from?: string
          active_to?: string | null
          assigned_at?: string
          assigned_by?: string
          created_at?: string
          id?: string
          player_id?: string
          program_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh_key: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh_key: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh_key?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      readiness_scores: {
        Row: {
          acwr: number | null
          athlete_id: string
          created_at: string | null
          date: string
          fatigue_score: number | null
          id: string
          notes: string | null
          overall_readiness: number | null
          readiness_score: number | null
          sleep_score: number | null
          stress_score: number | null
          updated_at: string | null
          wellness_score: number | null
        }
        Insert: {
          acwr?: number | null
          athlete_id: string
          created_at?: string | null
          date?: string
          fatigue_score?: number | null
          id?: string
          notes?: string | null
          overall_readiness?: number | null
          readiness_score?: number | null
          sleep_score?: number | null
          stress_score?: number | null
          updated_at?: string | null
          wellness_score?: number | null
        }
        Update: {
          acwr?: number | null
          athlete_id?: string
          created_at?: string | null
          date?: string
          fatigue_score?: number | null
          id?: string
          notes?: string | null
          overall_readiness?: number | null
          readiness_score?: number | null
          sleep_score?: number | null
          stress_score?: number | null
          updated_at?: string | null
          wellness_score?: number | null
        }
        Relationships: []
      }
      receiving_stats: {
        Row: {
          contested_catch: boolean | null
          coverage_type: string | null
          created_at: string | null
          defender_id: string | null
          drop_severity: string | null
          game_event_id: number | null
          game_id: string
          id: number
          is_catch: boolean | null
          is_drop: boolean | null
          is_target: boolean | null
          is_touchdown: boolean | null
          quarterback_id: string | null
          receiver_id: string
          route_depth: number | null
          route_type: string | null
          separation_at_catch: number | null
          target_number: number | null
          video_clip_url: string | null
          yards_after_catch: number | null
          yards_gained: number | null
        }
        Insert: {
          contested_catch?: boolean | null
          coverage_type?: string | null
          created_at?: string | null
          defender_id?: string | null
          drop_severity?: string | null
          game_event_id?: number | null
          game_id: string
          id?: number
          is_catch?: boolean | null
          is_drop?: boolean | null
          is_target?: boolean | null
          is_touchdown?: boolean | null
          quarterback_id?: string | null
          receiver_id: string
          route_depth?: number | null
          route_type?: string | null
          separation_at_catch?: number | null
          target_number?: number | null
          video_clip_url?: string | null
          yards_after_catch?: number | null
          yards_gained?: number | null
        }
        Update: {
          contested_catch?: boolean | null
          coverage_type?: string | null
          created_at?: string | null
          defender_id?: string | null
          drop_severity?: string | null
          game_event_id?: number | null
          game_id?: string
          id?: number
          is_catch?: boolean | null
          is_drop?: boolean | null
          is_target?: boolean | null
          is_touchdown?: boolean | null
          quarterback_id?: string | null
          receiver_id?: string
          route_depth?: number | null
          route_type?: string | null
          separation_at_catch?: number | null
          target_number?: number | null
          video_clip_url?: string | null
          yards_after_catch?: number | null
          yards_gained?: number | null
        }
        Relationships: []
      }
      recovery_blocks: {
        Row: {
          block_end_date: string
          block_start_date: string
          block_type: string | null
          created_at: string | null
          id: string
          player_id: string
          reason: string | null
        }
        Insert: {
          block_end_date: string
          block_start_date: string
          block_type?: string | null
          created_at?: string | null
          id?: string
          player_id: string
          reason?: string | null
        }
        Update: {
          block_end_date?: string
          block_start_date?: string
          block_type?: string | null
          created_at?: string | null
          id?: string
          player_id?: string
          reason?: string | null
        }
        Relationships: []
      }
      recovery_protocols: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          effectiveness_rating: number | null
          equipment_needed: string[] | null
          id: string
          instructions: Json | null
          is_active: boolean | null
          name: string
          target_areas: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          effectiveness_rating?: number | null
          equipment_needed?: string[] | null
          id?: string
          instructions?: Json | null
          is_active?: boolean | null
          name: string
          target_areas?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          effectiveness_rating?: number | null
          equipment_needed?: string[] | null
          id?: string
          instructions?: Json | null
          is_active?: boolean | null
          name?: string
          target_areas?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recovery_sessions: {
        Row: {
          athlete_id: string
          completed_at: string | null
          created_at: string | null
          duration_actual_minutes: number | null
          effectiveness_rating: number | null
          id: string
          notes: string | null
          protocol_id: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          completed_at?: string | null
          created_at?: string | null
          duration_actual_minutes?: number | null
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          protocol_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          completed_at?: string | null
          created_at?: string | null
          duration_actual_minutes?: number | null
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          protocol_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recovery_sessions_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "recovery_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      role_change_audit: {
        Row: {
          change_reason: string | null
          changed_at: string | null
          changed_by: string | null
          id: number
          ip_address: unknown
          new_role: string
          old_role: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          ip_address?: unknown
          new_role: string
          old_role?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: number
          ip_address?: unknown
          new_role?: string
          old_role?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      roster_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          performed_by: string
          player_id: string | null
          reason: string | null
          team_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by: string
          player_id?: string | null
          reason?: string | null
          team_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string
          player_id?: string | null
          reason?: string | null
          team_id?: string
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
      session_exercises: {
        Row: {
          created_at: string | null
          distance: number | null
          duration_minutes: number | null
          exercise_id: string | null
          exercise_order: number
          id: string
          notes: string | null
          position_specific_params: Json | null
          reps: number | null
          rest_seconds: number | null
          session_id: string
          sets: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          distance?: number | null
          duration_minutes?: number | null
          exercise_id?: string | null
          exercise_order: number
          id?: string
          notes?: string | null
          position_specific_params?: Json | null
          reps?: number | null
          rest_seconds?: number | null
          session_id: string
          sets?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          distance?: number | null
          duration_minutes?: number | null
          exercise_id?: string | null
          exercise_order?: number
          id?: string
          notes?: string | null
          position_specific_params?: Json | null
          reps?: number | null
          rest_seconds?: number | null
          session_id?: string
          sets?: number | null
          updated_at?: string | null
          weight?: number | null
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
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_rpe_data: {
        Row: {
          athlete_notes: string | null
          coach_intended_rpe: number | null
          coach_notes: string | null
          cognitive_exertion: number | null
          created_at: string | null
          data_quality: string | null
          environmental_stress: number | null
          game_like_intensity: boolean | null
          heart_rate_session_avg: number | null
          hr_rpe_correlation: number | null
          id: string
          muscular_exertion: number | null
          normalized_training_load: number | null
          number_of_cuts: number | null
          number_of_sprints: number | null
          planned_vs_actual_difference: number | null
          position_demands: string | null
          pre_session_fatigue: number | null
          psychological_stress: number | null
          respiratory_exertion: number | null
          routes_completed: number | null
          rpe_collected_time: string | null
          rpe_interpretation: string | null
          session_date: string
          session_duration_minutes: number | null
          session_end_time: string | null
          session_id: string | null
          session_rpe: number | null
          session_start_time: string | null
          session_type: string | null
          time_post_session_minutes: number | null
          training_load: number | null
          user_id: string
        }
        Insert: {
          athlete_notes?: string | null
          coach_intended_rpe?: number | null
          coach_notes?: string | null
          cognitive_exertion?: number | null
          created_at?: string | null
          data_quality?: string | null
          environmental_stress?: number | null
          game_like_intensity?: boolean | null
          heart_rate_session_avg?: number | null
          hr_rpe_correlation?: number | null
          id?: string
          muscular_exertion?: number | null
          normalized_training_load?: number | null
          number_of_cuts?: number | null
          number_of_sprints?: number | null
          planned_vs_actual_difference?: number | null
          position_demands?: string | null
          pre_session_fatigue?: number | null
          psychological_stress?: number | null
          respiratory_exertion?: number | null
          routes_completed?: number | null
          rpe_collected_time?: string | null
          rpe_interpretation?: string | null
          session_date: string
          session_duration_minutes?: number | null
          session_end_time?: string | null
          session_id?: string | null
          session_rpe?: number | null
          session_start_time?: string | null
          session_type?: string | null
          time_post_session_minutes?: number | null
          training_load?: number | null
          user_id: string
        }
        Update: {
          athlete_notes?: string | null
          coach_intended_rpe?: number | null
          coach_notes?: string | null
          cognitive_exertion?: number | null
          created_at?: string | null
          data_quality?: string | null
          environmental_stress?: number | null
          game_like_intensity?: boolean | null
          heart_rate_session_avg?: number | null
          hr_rpe_correlation?: number | null
          id?: string
          muscular_exertion?: number | null
          normalized_training_load?: number | null
          number_of_cuts?: number | null
          number_of_sprints?: number | null
          planned_vs_actual_difference?: number | null
          position_demands?: string | null
          pre_session_fatigue?: number | null
          psychological_stress?: number | null
          respiratory_exertion?: number | null
          routes_completed?: number | null
          rpe_collected_time?: string | null
          rpe_interpretation?: string | null
          session_date?: string
          session_duration_minutes?: number | null
          session_end_time?: string | null
          session_id?: string | null
          session_rpe?: number | null
          session_start_time?: string | null
          session_type?: string | null
          time_post_session_minutes?: number | null
          training_load?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_rpe_data_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_rpe_data_user_id_fkey"
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
      sessions: {
        Row: {
          athlete_id: string
          created_at: string | null
          data_source: string | null
          date: string
          duration_minutes: number | null
          high_speed_distance: number | null
          id: string
          raw_data: Json | null
          rpe: number | null
          sprint_count: number | null
          total_volume: number | null
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          data_source?: string | null
          date: string
          duration_minutes?: number | null
          high_speed_distance?: number | null
          id?: string
          raw_data?: Json | null
          rpe?: number | null
          sprint_count?: number | null
          total_volume?: number | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          data_source?: string | null
          date?: string
          duration_minutes?: number | null
          high_speed_distance?: number | null
          id?: string
          raw_data?: Json | null
          rpe?: number | null
          sprint_count?: number | null
          total_volume?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_insights: {
        Row: {
          id: string
          insight_data: Json
          insight_type: string
          shared_at: string | null
          shared_by: string
          shared_with: string
        }
        Insert: {
          id?: string
          insight_data?: Json
          insight_type: string
          shared_at?: string | null
          shared_by: string
          shared_with: string
        }
        Update: {
          id?: string
          insight_data?: Json
          insight_type?: string
          shared_at?: string | null
          shared_by?: string
          shared_with?: string
        }
        Relationships: []
      }
      situational_stats: {
        Row: {
          attempts: number | null
          avg_yards: number | null
          created_at: string | null
          date_end: string | null
          date_start: string | null
          id: number
          player_id: string
          season: string | null
          situation_type: string | null
          success_rate: number | null
          successes: number | null
          touchdowns: number | null
          turnovers: number | null
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          avg_yards?: number | null
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: number
          player_id: string
          season?: string | null
          situation_type?: string | null
          success_rate?: number | null
          successes?: number | null
          touchdowns?: number | null
          turnovers?: number | null
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          avg_yards?: number | null
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: number
          player_id?: string
          season?: string | null
          situation_type?: string | null
          success_rate?: number | null
          successes?: number | null
          touchdowns?: number | null
          turnovers?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sponsor_contributions: {
        Row: {
          contribution_amount: number
          contribution_date: string
          contribution_type: string | null
          created_at: string | null
          id: string
          notes: string | null
          sponsor_id: number | null
          team_id: string
          tournament_id: string
          updated_at: string | null
        }
        Insert: {
          contribution_amount: number
          contribution_date: string
          contribution_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          sponsor_id?: number | null
          team_id: string
          tournament_id: string
          updated_at?: string | null
        }
        Update: {
          contribution_amount?: number
          contribution_date?: string
          contribution_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          sponsor_id?: number | null
          team_id?: string
          tournament_id?: string
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
        ]
      }
      sponsors: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: number
          is_active: boolean | null
          logo_url: string
          name: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          logo_url: string
          name: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          logo_url?: string
          name?: string
          updated_at?: string | null
          website_url?: string | null
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
      supplements_data: {
        Row: {
          created_at: string | null
          date: string
          dosage: string | null
          id: number
          name: string
          notes: string | null
          taken: boolean | null
          time_of_day: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          dosage?: string | null
          id?: number
          name: string
          notes?: string | null
          taken?: boolean | null
          time_of_day?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          dosage?: string | null
          id?: number
          name?: string
          notes?: string | null
          taken?: boolean | null
          time_of_day?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_insights: {
        Row: {
          created_at: string | null
          generated_at: string | null
          id: string
          insight_data: Json
          insight_type: string
          team_id: string
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          insight_data?: Json
          insight_type: string
          team_id: string
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          insight_data?: Json
          insight_type?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_insights_team_id_fkey"
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
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          message: string | null
          role: string
          status: string
          team_id: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          message?: string | null
          role?: string
          status?: string
          team_id: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          message?: string | null
          role?: string
          status?: string
          team_id?: string
          token?: string
          updated_at?: string
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
          created_at: string
          id: string
          jersey_number: number | null
          joined_at: string
          position: string | null
          positions: string[] | null
          role: string
          role_approval_status: string | null
          role_approved_at: string | null
          role_approved_by: string | null
          role_rejection_reason: string | null
          status: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          jersey_number?: number | null
          joined_at?: string
          position?: string | null
          positions?: string[] | null
          role: string
          role_approval_status?: string | null
          role_approved_at?: string | null
          role_approved_by?: string | null
          role_rejection_reason?: string | null
          status?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          jersey_number?: number | null
          joined_at?: string
          position?: string | null
          positions?: string[] | null
          role?: string
          role_approval_status?: string | null
          role_approved_at?: string | null
          role_approved_by?: string | null
          role_rejection_reason?: string | null
          status?: string
          team_id?: string
          updated_at?: string
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
      team_templates: {
        Row: {
          content: Json
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          team_id: string
          template_type: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          team_id: string
          template_type: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          team_id?: string
          template_type?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_templates_team_id_fkey"
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
          coach_id: string
          created_at: string
          description: string | null
          founded_year: number | null
          home_city: string | null
          id: string
          league: string | null
          motto: string | null
          name: string
          olympic_track: string | null
          primary_color: string | null
          rejection_reason: string | null
          season: string | null
          secondary_color: string | null
          team_logo_url: string | null
          updated_at: string
        }
        Insert: {
          application_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          coach_id: string
          created_at?: string
          description?: string | null
          founded_year?: number | null
          home_city?: string | null
          id?: string
          league?: string | null
          motto?: string | null
          name: string
          olympic_track?: string | null
          primary_color?: string | null
          rejection_reason?: string | null
          season?: string | null
          secondary_color?: string | null
          team_logo_url?: string | null
          updated_at?: string
        }
        Update: {
          application_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          coach_id?: string
          created_at?: string
          description?: string | null
          founded_year?: number | null
          home_city?: string | null
          id?: string
          league?: string | null
          motto?: string | null
          name?: string
          olympic_track?: string | null
          primary_color?: string | null
          rejection_reason?: string | null
          season?: string | null
          secondary_color?: string | null
          team_logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      template_assignments: {
        Row: {
          assigned_by: string
          assigned_date: string
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          player_id: string
          status: string | null
          template_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_by: string
          assigned_date: string
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          player_id: string
          status?: string | null
          template_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string
          assigned_date?: string
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          player_id?: string
          status?: string | null
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "team_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_budgets: {
        Row: {
          actual_cost: number | null
          budget_category: string
          created_at: string | null
          estimated_cost: number | null
          id: string
          notes: string | null
          team_id: string
          tournament_id: string
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          budget_category: string
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          team_id: string
          tournament_id: string
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          budget_category?: string
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          team_id?: string
          tournament_id?: string
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
        ]
      }
      training_load_metrics: {
        Row: {
          acceleration_count: number | null
          acute_load: number | null
          acwr: number | null
          average_heart_rate: number | null
          chronic_load: number | null
          contact_intensity_score: number | null
          created_at: string | null
          cutting_movements: number | null
          data_quality_score: number | null
          deceleration_count: number | null
          fatigue_index: number | null
          high_speed_running_meters: number | null
          hrv_pre_session: number | null
          id: string
          injury_risk_score: number | null
          max_heart_rate: number | null
          mood_rating: number | null
          muscle_soreness: number | null
          notes: string | null
          perceived_recovery: number | null
          player_load: number | null
          readiness_score: number | null
          recommended_load_adjustment: number | null
          recommended_session_intensity: string | null
          recovery_priority_areas: string[] | null
          recovery_score: number | null
          risk_factors: string[] | null
          risk_level: string | null
          route_running_volume: number | null
          session_date: string
          session_duration: number | null
          session_rpe: number | null
          session_type: string | null
          sleep_quality_previous_night: number | null
          sprint_distance_meters: number | null
          sprint_repetitions: number | null
          stress_level: number | null
          time_in_hr_zones: Json | null
          total_distance_meters: number | null
          training_load: number | null
          training_monotony: number | null
          training_strain: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acceleration_count?: number | null
          acute_load?: number | null
          acwr?: number | null
          average_heart_rate?: number | null
          chronic_load?: number | null
          contact_intensity_score?: number | null
          created_at?: string | null
          cutting_movements?: number | null
          data_quality_score?: number | null
          deceleration_count?: number | null
          fatigue_index?: number | null
          high_speed_running_meters?: number | null
          hrv_pre_session?: number | null
          id?: string
          injury_risk_score?: number | null
          max_heart_rate?: number | null
          mood_rating?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          perceived_recovery?: number | null
          player_load?: number | null
          readiness_score?: number | null
          recommended_load_adjustment?: number | null
          recommended_session_intensity?: string | null
          recovery_priority_areas?: string[] | null
          recovery_score?: number | null
          risk_factors?: string[] | null
          risk_level?: string | null
          route_running_volume?: number | null
          session_date: string
          session_duration?: number | null
          session_rpe?: number | null
          session_type?: string | null
          sleep_quality_previous_night?: number | null
          sprint_distance_meters?: number | null
          sprint_repetitions?: number | null
          stress_level?: number | null
          time_in_hr_zones?: Json | null
          total_distance_meters?: number | null
          training_load?: number | null
          training_monotony?: number | null
          training_strain?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acceleration_count?: number | null
          acute_load?: number | null
          acwr?: number | null
          average_heart_rate?: number | null
          chronic_load?: number | null
          contact_intensity_score?: number | null
          created_at?: string | null
          cutting_movements?: number | null
          data_quality_score?: number | null
          deceleration_count?: number | null
          fatigue_index?: number | null
          high_speed_running_meters?: number | null
          hrv_pre_session?: number | null
          id?: string
          injury_risk_score?: number | null
          max_heart_rate?: number | null
          mood_rating?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          perceived_recovery?: number | null
          player_load?: number | null
          readiness_score?: number | null
          recommended_load_adjustment?: number | null
          recommended_session_intensity?: string | null
          recovery_priority_areas?: string[] | null
          recovery_score?: number | null
          risk_factors?: string[] | null
          risk_level?: string | null
          route_running_volume?: number | null
          session_date?: string
          session_duration?: number | null
          session_rpe?: number | null
          session_type?: string | null
          sleep_quality_previous_night?: number | null
          sprint_distance_meters?: number | null
          sprint_repetitions?: number | null
          stress_level?: number | null
          time_in_hr_zones?: Json | null
          total_distance_meters?: number | null
          training_load?: number | null
          training_monotony?: number | null
          training_strain?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_load_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_phases: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          focus_areas: string[] | null
          id: string
          name: string
          phase_order: number
          program_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          focus_areas?: string[] | null
          id?: string
          name: string
          phase_order: number
          program_id: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          focus_areas?: string[] | null
          id?: string
          name?: string
          phase_order?: number
          program_id?: string
          start_date?: string
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
        ]
      }
      training_programs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          duration_weeks: number | null
          end_date: string
          id: string
          is_active: boolean | null
          is_template: boolean | null
          name: string
          position_id: string | null
          program_type: string | null
          sessions_per_week: number | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_weeks?: number | null
          end_date: string
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name: string
          position_id?: string | null
          program_type?: string | null
          sessions_per_week?: number | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_weeks?: number | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name?: string
          position_id?: string | null
          program_type?: string | null
          sessions_per_week?: number | null
          start_date?: string
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
        ]
      }
      training_sessions: {
        Row: {
          athlete_id: string | null
          coach_feedback: string | null
          coach_locked: boolean
          completed_at: string | null
          completion_rate: number | null
          created_at: string | null
          current_version: number
          drill_type: string | null
          duration_minutes: number
          equipment: string[] | null
          exercises: Json | null
          goals: string[] | null
          id: string
          intensity_level: number | null
          modified_at: string | null
          modified_by_coach_id: string | null
          notes: string | null
          performance_score: number | null
          rpe: number | null
          session_date: string
          session_state: string | null
          session_structure: Json | null
          session_type: string
          status: string | null
          team_id: string | null
          updated_at: string | null
          user_id: string
          verification_confidence: number | null
          workload: number | null
          xp_earned: number | null
        }
        Insert: {
          athlete_id?: string | null
          coach_feedback?: string | null
          coach_locked?: boolean
          completed_at?: string | null
          completion_rate?: number | null
          created_at?: string | null
          current_version?: number
          drill_type?: string | null
          duration_minutes: number
          equipment?: string[] | null
          exercises?: Json | null
          goals?: string[] | null
          id?: string
          intensity_level?: number | null
          modified_at?: string | null
          modified_by_coach_id?: string | null
          notes?: string | null
          performance_score?: number | null
          rpe?: number | null
          session_date: string
          session_state?: string | null
          session_structure?: Json | null
          session_type: string
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id: string
          verification_confidence?: number | null
          workload?: number | null
          xp_earned?: number | null
        }
        Update: {
          athlete_id?: string | null
          coach_feedback?: string | null
          coach_locked?: boolean
          completed_at?: string | null
          completion_rate?: number | null
          created_at?: string | null
          current_version?: number
          drill_type?: string | null
          duration_minutes?: number
          equipment?: string[] | null
          exercises?: Json | null
          goals?: string[] | null
          id?: string
          intensity_level?: number | null
          modified_at?: string | null
          modified_by_coach_id?: string | null
          notes?: string | null
          performance_score?: number | null
          rpe?: number | null
          session_date?: string
          session_state?: string | null
          session_structure?: Json | null
          session_type?: string
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
          verification_confidence?: number | null
          workload?: number | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_stress_balance: {
        Row: {
          alerts: string[] | null
          atl: number | null
          atl_ramp_rate: number | null
          calculation_date: string
          created_at: string | null
          ctl: number | null
          ctl_progression_rate: number | null
          ctl_ramp_rate: number | null
          daily_training_stress: number | null
          detraining_risk: number | null
          form_score: number | null
          id: string
          max_safe_tss_today: number | null
          optimal_competition_window: number | null
          overtraining_risk: number | null
          predicted_performance_change: number | null
          recommended_tss_today: number | null
          taper_status: string | null
          target_ctl: number | null
          target_ctl_date: string | null
          tsb: number | null
          tsb_interpretation: string | null
          user_id: string
          weekly_training_stress: number | null
        }
        Insert: {
          alerts?: string[] | null
          atl?: number | null
          atl_ramp_rate?: number | null
          calculation_date: string
          created_at?: string | null
          ctl?: number | null
          ctl_progression_rate?: number | null
          ctl_ramp_rate?: number | null
          daily_training_stress?: number | null
          detraining_risk?: number | null
          form_score?: number | null
          id?: string
          max_safe_tss_today?: number | null
          optimal_competition_window?: number | null
          overtraining_risk?: number | null
          predicted_performance_change?: number | null
          recommended_tss_today?: number | null
          taper_status?: string | null
          target_ctl?: number | null
          target_ctl_date?: string | null
          tsb?: number | null
          tsb_interpretation?: string | null
          user_id: string
          weekly_training_stress?: number | null
        }
        Update: {
          alerts?: string[] | null
          atl?: number | null
          atl_ramp_rate?: number | null
          calculation_date?: string
          created_at?: string | null
          ctl?: number | null
          ctl_progression_rate?: number | null
          ctl_ramp_rate?: number | null
          daily_training_stress?: number | null
          detraining_risk?: number | null
          form_score?: number | null
          id?: string
          max_safe_tss_today?: number | null
          optimal_competition_window?: number | null
          overtraining_risk?: number | null
          predicted_performance_change?: number | null
          recommended_tss_today?: number | null
          taper_status?: string | null
          target_ctl?: number | null
          target_ctl_date?: string | null
          tsb?: number | null
          tsb_interpretation?: string | null
          user_id?: string
          weekly_training_stress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_stress_balance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_videos: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean | null
          position: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          position?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          position?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string
          view_count?: number | null
        }
        Relationships: []
      }
      training_weeks: {
        Row: {
          created_at: string | null
          end_date: string
          focus: string | null
          id: string
          load_percentage: number | null
          phase_id: string
          start_date: string
          updated_at: string | null
          volume_multiplier: number | null
          week_number: number
        }
        Insert: {
          created_at?: string | null
          end_date: string
          focus?: string | null
          id?: string
          load_percentage?: number | null
          phase_id: string
          start_date: string
          updated_at?: string | null
          volume_multiplier?: number | null
          week_number: number
        }
        Update: {
          created_at?: string | null
          end_date?: string
          focus?: string | null
          id?: string
          load_percentage?: number | null
          phase_id?: string
          start_date?: string
          updated_at?: string | null
          volume_multiplier?: number | null
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
      user_age_groups: {
        Row: {
          age_group: string
          birth_year: number | null
          consent_given: boolean | null
          consent_given_at: string | null
          consent_given_by: string | null
          created_at: string | null
          id: string
          requires_parental_consent: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age_group: string
          birth_year?: number | null
          consent_given?: boolean | null
          consent_given_at?: string | null
          consent_given_by?: string | null
          created_at?: string | null
          id?: string
          requires_parental_consent?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age_group?: string
          birth_year?: number | null
          consent_given?: boolean | null
          consent_given_at?: string | null
          consent_given_by?: string | null
          created_at?: string | null
          id?: string
          requires_parental_consent?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_ai_preferences: {
        Row: {
          avoided_topics: string[] | null
          created_at: string | null
          focus_areas: string[] | null
          id: string
          language_preference: string | null
          proactive_suggestions: boolean | null
          reminder_frequency: string | null
          tone: string | null
          updated_at: string | null
          user_id: string
          verbosity: string | null
        }
        Insert: {
          avoided_topics?: string[] | null
          created_at?: string | null
          focus_areas?: string[] | null
          id?: string
          language_preference?: string | null
          proactive_suggestions?: boolean | null
          reminder_frequency?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id: string
          verbosity?: string | null
        }
        Update: {
          avoided_topics?: string[] | null
          created_at?: string | null
          focus_areas?: string[] | null
          id?: string
          language_preference?: string | null
          proactive_suggestions?: boolean | null
          reminder_frequency?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string
          verbosity?: string | null
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
        Relationships: []
      }
      user_security: {
        Row: {
          account_locked_until: string | null
          backup_codes: string[] | null
          created_at: string | null
          failed_login_attempts: number | null
          id: string
          last_password_change: string | null
          security_questions: Json | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_locked_until?: string | null
          backup_codes?: string[] | null
          created_at?: string | null
          failed_login_attempts?: number | null
          id?: string
          last_password_change?: string | null
          security_questions?: Json | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_locked_until?: string | null
          backup_codes?: string[] | null
          created_at?: string | null
          failed_login_attempts?: number | null
          id?: string
          last_password_change?: string | null
          security_questions?: Json | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
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
          height_cm: number | null
          id: string
          is_active: boolean | null
          last_login: string | null
          last_name: string
          notification_last_opened_at: string | null
          password_hash: string
          position: string | null
          profile_picture: string | null
          updated_at: string | null
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
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name: string
          notification_last_opened_at?: string | null
          password_hash: string
          position?: string | null
          profile_picture?: string | null
          updated_at?: string | null
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
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          last_name?: string
          notification_last_opened_at?: string | null
          password_hash?: string
          position?: string | null
          profile_picture?: string | null
          updated_at?: string | null
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
      weekly_training_analysis: {
        Row: {
          consecutive_high_load_days: number | null
          created_at: string | null
          daily_loads: number[] | null
          exceeds_monotony_threshold: boolean | null
          exceeds_strain_threshold: boolean | null
          high_load_days: string[] | null
          id: string
          load_change_from_previous_week: number | null
          load_distribution_quality: number | null
          load_progression_safety: string | null
          mean_daily_load: number | null
          monotony_injury_risk: number | null
          monotony_interpretation: string | null
          next_week_load_target: number | null
          recommended_load_variation: number | null
          recommended_rest_days: number | null
          recovery_day_adequacy: number | null
          rest_days_count: number | null
          standard_deviation: number | null
          strain_injury_risk: number | null
          strain_interpretation: string | null
          total_training_duration_minutes: number | null
          total_training_load: number | null
          total_training_sessions: number | null
          training_monotony: number | null
          training_strain: number | null
          user_id: string
          week_end_date: string
          week_start_date: string
          weeks_consecutive_high_monotony: number | null
        }
        Insert: {
          consecutive_high_load_days?: number | null
          created_at?: string | null
          daily_loads?: number[] | null
          exceeds_monotony_threshold?: boolean | null
          exceeds_strain_threshold?: boolean | null
          high_load_days?: string[] | null
          id?: string
          load_change_from_previous_week?: number | null
          load_distribution_quality?: number | null
          load_progression_safety?: string | null
          mean_daily_load?: number | null
          monotony_injury_risk?: number | null
          monotony_interpretation?: string | null
          next_week_load_target?: number | null
          recommended_load_variation?: number | null
          recommended_rest_days?: number | null
          recovery_day_adequacy?: number | null
          rest_days_count?: number | null
          standard_deviation?: number | null
          strain_injury_risk?: number | null
          strain_interpretation?: string | null
          total_training_duration_minutes?: number | null
          total_training_load?: number | null
          total_training_sessions?: number | null
          training_monotony?: number | null
          training_strain?: number | null
          user_id: string
          week_end_date: string
          week_start_date: string
          weeks_consecutive_high_monotony?: number | null
        }
        Update: {
          consecutive_high_load_days?: number | null
          created_at?: string | null
          daily_loads?: number[] | null
          exceeds_monotony_threshold?: boolean | null
          exceeds_strain_threshold?: boolean | null
          high_load_days?: string[] | null
          id?: string
          load_change_from_previous_week?: number | null
          load_distribution_quality?: number | null
          load_progression_safety?: string | null
          mean_daily_load?: number | null
          monotony_injury_risk?: number | null
          monotony_interpretation?: string | null
          next_week_load_target?: number | null
          recommended_load_variation?: number | null
          recommended_rest_days?: number | null
          recovery_day_adequacy?: number | null
          rest_days_count?: number | null
          standard_deviation?: number | null
          strain_injury_risk?: number | null
          strain_interpretation?: string | null
          total_training_duration_minutes?: number | null
          total_training_load?: number | null
          total_training_sessions?: number | null
          training_monotony?: number | null
          training_strain?: number | null
          user_id?: string
          week_end_date?: string
          week_start_date?: string
          weeks_consecutive_high_monotony?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_training_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_data: {
        Row: {
          created_at: string | null
          date: string
          energy: number | null
          hydration: number | null
          id: number
          mood: number | null
          motivation: number | null
          notes: string | null
          sleep: number | null
          soreness: number | null
          stress: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          energy?: number | null
          hydration?: number | null
          id?: number
          mood?: number | null
          motivation?: number | null
          notes?: string | null
          sleep?: number | null
          soreness?: number | null
          stress?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          energy?: number | null
          hydration?: number | null
          id?: number
          mood?: number | null
          motivation?: number | null
          notes?: string | null
          sleep?: number | null
          soreness?: number | null
          stress?: number | null
          updated_at?: string | null
          user_id?: string
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
        }
        Relationships: []
      }
      wellness_logs: {
        Row: {
          athlete_id: string
          created_at: string | null
          energy_level: number | null
          hydration_level: number | null
          id: string
          log_date: string
          mood: number | null
          motivation: number | null
          muscle_soreness: number | null
          notes: string | null
          sleep_hours: number | null
          sleep_quality: number | null
          stress_level: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          energy_level?: number | null
          hydration_level?: number | null
          id?: string
          log_date?: string
          mood?: number | null
          motivation?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          energy_level?: number | null
          hydration_level?: number | null
          id?: string
          log_date?: string
          mood?: number | null
          motivation?: number | null
          muscle_soreness?: number | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wellness_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          intensity_level: number | null
          planned_date: string | null
          player_id: string
          rpe: number | null
          source_session_id: string | null
          updated_at: string | null
          workout_type: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          intensity_level?: number | null
          planned_date?: string | null
          player_id: string
          rpe?: number | null
          source_session_id?: string | null
          updated_at?: string | null
          workout_type?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          intensity_level?: number | null
          planned_date?: string | null
          player_id?: string
          rpe?: number | null
          source_session_id?: string | null
          updated_at?: string | null
          workout_type?: string | null
        }
        Relationships: []
      }
      youth_athlete_settings: {
        Row: {
          created_at: string | null
          dietary_restrictions: string[] | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          grade_level: number | null
          id: string
          max_training_hours_per_week: number | null
          medical_clearance_date: string | null
          parent_email: string | null
          parent_phone: string | null
          rest_day_requirements: number | null
          school_name: string | null
          special_needs_notes: string | null
          sport_experience_years: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dietary_restrictions?: string[] | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          grade_level?: number | null
          id?: string
          max_training_hours_per_week?: number | null
          medical_clearance_date?: string | null
          parent_email?: string | null
          parent_phone?: string | null
          rest_day_requirements?: number | null
          school_name?: string | null
          special_needs_notes?: string | null
          sport_experience_years?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dietary_restrictions?: string[] | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          grade_level?: number | null
          id?: string
          max_training_hours_per_week?: number | null
          medical_clearance_date?: string | null
          parent_email?: string | null
          parent_phone?: string | null
          rest_day_requirements?: number | null
          school_name?: string | null
          special_needs_notes?: string | null
          sport_experience_years?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_acute_load: {
        Args: { player_uuid: string; reference_date: string }
        Returns: number
      }
      calculate_acwr_safe: {
        Args: { player_uuid: string; reference_date: string }
        Returns: {
          acwr: number
          baseline_days: number
          risk_level: string
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
      can_view_health_data: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      expire_old_invitations: { Args: never; Returns: undefined }
      get_athlete_consent: {
        Args: { p_athlete_id: string; p_setting_name: string }
        Returns: boolean
      }
      get_current_role: { Args: never; Returns: string }
      get_executed_version: {
        Args: { p_athlete_id: string; p_session_id: string }
        Returns: number
      }
      get_injury_risk_level: { Args: { acwr_value: number }; Returns: string }
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
      get_tournament_availability_summary: {
        Args: { p_team_id: string; p_tournament_id: string }
        Returns: {
          confirmed_count: number
          declined_count: number
          pending_count: number
          tentative_count: number
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
      is_superadmin: { Args: never; Returns: boolean }
      is_team_approved: { Args: { p_team_id: string }; Returns: boolean }
      is_team_coach_or_higher: {
        Args: { p_team_id: string; p_user_id: string }
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
      log_roster_change: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_performed_by: string
          p_player_id: string
          p_reason?: string
          p_team_id: string
        }
        Returns: string
      }
    }
    Enums: {
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
      ],
    },
  },
} as const

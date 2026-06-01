// Supabase-generated database types — canonical DB↔TS contract.
// Generated via Supabase MCP generate_typescript_types (project grfjmnjpzvknmsxrwesx), 2026-06-01.
// Regenerate after schema changes; do not hand-edit. Adopt across core services during the UI rebuild.

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
      account_deletion_requests: {
        Row: {
          created_at: string
          error_message: string | null
          hard_deleted_at: string | null
          id: string
          reason: string | null
          requested_at: string | null
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
          hard_deleted_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string | null
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
          hard_deleted_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string | null
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
          acwr_frozen: boolean
          created_at: string
          id: string
          is_active: boolean
          paused_at: string
          paused_until: string | null
          reason: string | null
          resumed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acwr_frozen?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          paused_at?: string
          paused_until?: string | null
          reason?: string | null
          resumed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acwr_frozen?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          paused_at?: string
          paused_until?: string | null
          reason?: string | null
          resumed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
          created_at: string
          criteria: Json
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          points: number
          slug: string
        }
        Insert: {
          category: string
          created_at?: string
          criteria?: Json
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          points?: number
          slug: string
        }
        Update: {
          category?: string
          created_at?: string
          criteria?: Json
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          points?: number
          slug?: string
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
      ai_training_suggestions: {
        Row: {
          accepted: boolean
          affected_session_id: string | null
          applied_at: string | null
          confidence_score: number | null
          created_at: string
          data_sources: Json | null
          description: string | null
          dismissed: boolean
          dismissed_at: string | null
          expires_at: string | null
          id: string
          message: string | null
          priority: string | null
          reason: string | null
          status: string | null
          suggested_changes: Json | null
          suggestion_type: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted?: boolean
          affected_session_id?: string | null
          applied_at?: string | null
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          description?: string | null
          dismissed?: boolean
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          priority?: string | null
          reason?: string | null
          status?: string | null
          suggested_changes?: Json | null
          suggestion_type: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted?: boolean
          affected_session_id?: string | null
          applied_at?: string | null
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          description?: string | null
          dismissed?: boolean
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          priority?: string | null
          reason?: string | null
          status?: string | null
          suggested_changes?: Json | null
          suggestion_type?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_training_suggestions_affected_session_id_fkey"
            columns: ["affected_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_suggestions_affected_session_id_fkey"
            columns: ["affected_session_id"]
            isOneToOne: false
            referencedRelation: "v_training_sessions_consent"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
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
      athlete_consent_settings: {
        Row: {
          created_at: string
          share_merlin_conversations_with_coach: boolean
          share_readiness_with_all_coaches: boolean
          share_readiness_with_coach: boolean
          share_training_notes_with_coach: boolean
          share_wellness_answers_with_coach: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          share_merlin_conversations_with_coach?: boolean
          share_readiness_with_all_coaches?: boolean
          share_readiness_with_coach?: boolean
          share_training_notes_with_coach?: boolean
          share_wellness_answers_with_coach?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          share_merlin_conversations_with_coach?: boolean
          share_readiness_with_all_coaches?: boolean
          share_readiness_with_coach?: boolean
          share_training_notes_with_coach?: boolean
          share_wellness_answers_with_coach?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      athlete_hydration_logs: {
        Row: {
          amount_ml: number
          beverage_type: string
          created_at: string
          id: string
          logged_at: string
          metadata: Json
          note: string | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          beverage_type?: string
          created_at?: string
          id?: string
          logged_at?: string
          metadata?: Json
          note?: string | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          beverage_type?: string
          created_at?: string
          id?: string
          logged_at?: string
          metadata?: Json
          note?: string | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      athlete_training_config: {
        Row: {
          acwr_target_max: number
          acwr_target_min: number
          age_recovery_modifier: number
          available_equipment: Json
          birth_date: string | null
          created_at: string
          current_limitations: Json | null
          daily_routine: Json
          flag_practice_schedule: Json
          has_field_access: boolean
          has_gym_access: boolean
          max_sessions_per_week: number
          preferred_training_days: number[]
          primary_position: string
          secondary_position: string | null
          updated_at: string
          user_id: string
          warmup_focus: string | null
        }
        Insert: {
          acwr_target_max?: number
          acwr_target_min?: number
          age_recovery_modifier?: number
          available_equipment?: Json
          birth_date?: string | null
          created_at?: string
          current_limitations?: Json | null
          daily_routine?: Json
          flag_practice_schedule?: Json
          has_field_access?: boolean
          has_gym_access?: boolean
          max_sessions_per_week?: number
          preferred_training_days?: number[]
          primary_position?: string
          secondary_position?: string | null
          updated_at?: string
          user_id: string
          warmup_focus?: string | null
        }
        Update: {
          acwr_target_max?: number
          acwr_target_min?: number
          age_recovery_modifier?: number
          available_equipment?: Json
          birth_date?: string | null
          created_at?: string
          current_limitations?: Json | null
          daily_routine?: Json
          flag_practice_schedule?: Json
          has_field_access?: boolean
          has_gym_access?: boolean
          max_sessions_per_week?: number
          preferred_training_days?: number[]
          primary_position?: string
          secondary_position?: string | null
          updated_at?: string
          user_id?: string
          warmup_focus?: string | null
        }
        Relationships: []
      }
      athlete_travel_log: {
        Row: {
          adaptation_day: number | null
          arrival_date: string
          created_at: string
          id: string
          notes: string | null
          timezone_difference: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adaptation_day?: number | null
          arrival_date: string
          created_at?: string
          id?: string
          notes?: string | null
          timezone_difference?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adaptation_day?: number | null
          arrival_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          timezone_difference?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          can_provide_ride: boolean
          created_at: string
          event_id: string
          guests: number
          id: string
          needs_ride: boolean
          notes: string | null
          status: string
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_provide_ride?: boolean
          created_at?: string
          event_id: string
          guests?: number
          id?: string
          needs_ride?: boolean
          notes?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_provide_ride?: boolean
          created_at?: string
          event_id?: string
          guests?: number
          id?: string
          needs_ride?: boolean
          notes?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
      blocked_users: {
        Row: {
          blocked_user_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_members: {
        Row: {
          can_post: boolean
          channel_id: string
          id: string
          is_admin: boolean
          is_muted: boolean
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          can_post?: boolean
          channel_id: string
          id?: string
          is_admin?: boolean
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          can_post?: boolean
          channel_id?: string
          id?: string
          is_admin?: boolean
          is_muted?: boolean
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
          allow_threads: boolean
          channel_type: string
          created_at: string
          created_by: string | null
          description: string | null
          game_id: string | null
          id: string
          is_archived: boolean
          is_default: boolean
          is_group_dm: boolean
          name: string
          position_filter: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          allow_threads?: boolean
          channel_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          game_id?: string | null
          id?: string
          is_archived?: boolean
          is_default?: boolean
          is_group_dm?: boolean
          name: string
          position_filter?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          allow_threads?: boolean
          channel_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          game_id?: string | null
          id?: string
          is_archived?: boolean
          is_default?: boolean
          is_group_dm?: boolean
          name?: string
          position_filter?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["game_id"]
          },
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
          attachments: Json
          channel: string | null
          channel_id: string | null
          created_at: string
          id: string
          is_edited: boolean
          is_important: boolean
          is_pinned: boolean
          is_read: boolean
          mentions: string[]
          message: string
          message_type: string
          metadata: Json
          pinned_at: string | null
          pinned_by: string | null
          read_at: string | null
          recipient_id: string | null
          reply_count: number
          reply_to: string | null
          sender_id: string | null
          team_id: string | null
          thread_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attachments?: Json
          channel?: string | null
          channel_id?: string | null
          created_at?: string
          id?: string
          is_edited?: boolean
          is_important?: boolean
          is_pinned?: boolean
          is_read?: boolean
          mentions?: string[]
          message: string
          message_type?: string
          metadata?: Json
          pinned_at?: string | null
          pinned_by?: string | null
          read_at?: string | null
          recipient_id?: string | null
          reply_count?: number
          reply_to?: string | null
          sender_id?: string | null
          team_id?: string | null
          thread_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attachments?: Json
          channel?: string | null
          channel_id?: string | null
          created_at?: string
          id?: string
          is_edited?: boolean
          is_important?: boolean
          is_pinned?: boolean
          is_read?: boolean
          mentions?: string[]
          message?: string
          message_type?: string
          metadata?: Json
          pinned_at?: string | null
          pinned_by?: string | null
          read_at?: string | null
          recipient_id?: string | null
          reply_count?: number
          reply_to?: string | null
          sender_id?: string | null
          team_id?: string | null
          thread_id?: string | null
          updated_at?: string
          user_id?: string | null
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
            foreignKeyName: "chat_messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
      coach_activity_log: {
        Row: {
          activity_type: string
          coach_id: string | null
          created_at: string
          data: Json
          description: string | null
          id: string
          is_read: boolean
          read_at: string | null
          team_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type: string
          coach_id?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          id?: string
          is_read?: boolean
          read_at?: string | null
          team_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          coach_id?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          id?: string
          is_read?: boolean
          read_at?: string | null
          team_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_activity_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          action_taken?: string | null
          alert_type: string
          coach_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          action_taken?: string | null
          alert_type?: string
          coach_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string | null
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
          coach_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assignment_id?: string
          coach_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assignment_id?: string
          coach_id?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_film_sessions: {
        Row: {
          assignment: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          duration: string
          film_type: string
          id: string
          not_watched: Json
          tag_count: number
          team_id: string
          thumbnail_url: string | null
          title: string
          total_assigned: number
          updated_at: string
          upload_date: string
          video_url: string
          watched_count: number
        }
        Insert: {
          assignment?: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          duration?: string
          film_type: string
          id?: string
          not_watched?: Json
          tag_count?: number
          team_id: string
          thumbnail_url?: string | null
          title: string
          total_assigned?: number
          updated_at?: string
          upload_date?: string
          video_url: string
          watched_count?: number
        }
        Update: {
          assignment?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          duration?: string
          film_type?: string
          id?: string
          not_watched?: Json
          tag_count?: number
          team_id?: string
          thumbnail_url?: string | null
          title?: string
          total_assigned?: number
          updated_at?: string
          upload_date?: string
          video_url?: string
          watched_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coach_film_sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_film_tags: {
        Row: {
          coach_id: string
          comment: string
          created_at: string
          id: string
          play_id: string | null
          player_ids: string[]
          session_id: string
          tag_type: string
          target: string
          team_id: string
          timestamp_label: string
          timestamp_seconds: number
          updated_at: string
        }
        Insert: {
          coach_id: string
          comment: string
          created_at?: string
          id?: string
          play_id?: string | null
          player_ids?: string[]
          session_id: string
          tag_type: string
          target: string
          team_id: string
          timestamp_label: string
          timestamp_seconds?: number
          updated_at?: string
        }
        Update: {
          coach_id?: string
          comment?: string
          created_at?: string
          id?: string
          play_id?: string | null
          player_ids?: string[]
          session_id?: string
          tag_type?: string
          target?: string
          team_id?: string
          timestamp_label?: string
          timestamp_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_film_tags_play_id_fkey"
            columns: ["play_id"]
            isOneToOne: false
            referencedRelation: "coach_playbook_plays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_film_tags_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coach_film_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_film_tags_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
          priority: string | null
          source: string | null
          status: string | null
          team_id: string | null
          title: string
          updated_at: string | null
          user_id: string | null
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
          priority?: string | null
          source?: string | null
          status?: string | null
          team_id?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
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
          priority?: string | null
          source?: string | null
          status?: string | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
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
          reason: string | null
          user_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          override_data?: Json
          override_type: string
          reason?: string | null
          user_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          override_data?: Json
          override_type?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coach_playbook_plays: {
        Row: {
          assignments: Json
          coach_notes: string | null
          created_at: string
          created_by: string
          formation: string
          id: string
          name: string
          situation: string
          status: string
          team_id: string
          team_memorized: number
          type: string
          updated_at: string
        }
        Insert: {
          assignments?: Json
          coach_notes?: string | null
          created_at?: string
          created_by: string
          formation: string
          id?: string
          name: string
          situation: string
          status?: string
          team_id: string
          team_memorized?: number
          type: string
          updated_at?: string
        }
        Update: {
          assignments?: Json
          coach_notes?: string | null
          created_at?: string
          created_by?: string
          formation?: string
          id?: string
          name?: string
          situation?: string
          status?: string
          team_id?: string
          team_memorized?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_playbook_plays_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
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
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_poll_options: {
        Row: {
          id: string
          option_text: string
          poll_id: string
          votes_count: number
        }
        Insert: {
          id?: string
          option_text: string
          poll_id: string
          votes_count?: number
        }
        Update: {
          id?: string
          option_text?: string
          poll_id?: string
          votes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      community_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "community_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_polls: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          post_id: string
          question: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          post_id: string
          question: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          post_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_events: {
        Row: {
          competition_id: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          expected_game_count: number
          external_id: string | null
          id: string
          importance: string
          label: string | null
          location: string | null
          metadata: Json
          notes: string | null
          starts_at: string
          status: string
          team_id: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          expected_game_count?: number
          external_id?: string | null
          id?: string
          importance?: string
          label?: string | null
          location?: string | null
          metadata?: Json
          notes?: string | null
          starts_at: string
          status?: string
          team_id: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          expected_game_count?: number
          external_id?: string | null
          id?: string
          importance?: string
          label?: string | null
          location?: string | null
          metadata?: Json
          notes?: string | null
          starts_at?: string
          status?: string
          team_id?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_events_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          country: string | null
          created_at: string
          created_by: string | null
          ends_on: string | null
          external_id: string | null
          format: string | null
          governing_body: string | null
          id: string
          kind: string
          level: string
          metadata: Json
          name: string
          season_year: number | null
          short_name: string | null
          source: string
          starts_on: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          external_id?: string | null
          format?: string | null
          governing_body?: string | null
          id?: string
          kind?: string
          level?: string
          metadata?: Json
          name: string
          season_year?: number | null
          short_name?: string | null
          source?: string
          starts_on?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          external_id?: string | null
          format?: string | null
          governing_body?: string | null
          id?: string
          kind?: string
          level?: string
          metadata?: Json
          name?: string
          season_year?: number | null
          short_name?: string | null
          source?: string
          starts_on?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      consent_access_log: {
        Row: {
          access_type: string
          accessed_at: string | null
          accessed_by: string
          consent_given: boolean | null
          data_category: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          accessed_by: string
          consent_given?: boolean | null
          data_category?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          accessed_by?: string
          consent_given?: boolean | null
          data_category?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      consent_change_log: {
        Row: {
          change_id: string
          changed_at: string
          changed_by: string
          new_value: boolean
          previous_value: boolean
          reason: string | null
          setting_name: string
          user_id: string
        }
        Insert: {
          change_id?: string
          changed_at?: string
          changed_by: string
          new_value: boolean
          previous_value: boolean
          reason?: string | null
          setting_name: string
          user_id: string
        }
        Update: {
          change_id?: string
          changed_at?: string
          changed_by?: string
          new_value?: boolean
          previous_value?: boolean
          reason?: string | null
          setting_name?: string
          user_id?: string
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
      cycle_tracking_entries: {
        Row: {
          created_at: string
          end_date: string | null
          flow_intensity: string
          id: string
          notes: string | null
          start_date: string
          symptoms: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          flow_intensity?: string
          id?: string
          notes?: string | null
          start_date: string
          symptoms?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          flow_intensity?: string
          id?: string
          notes?: string | null
          start_date?: string
          symptoms?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cycle_tracking_symptoms: {
        Row: {
          created_at: string
          id: string
          logged_date: string
          severity: string
          symptoms: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logged_date: string
          severity?: string
          symptoms?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logged_date?: string
          severity?: string
          symptoms?: string[]
          updated_at?: string
          user_id?: string
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
          coach_acknowledged: boolean | null
          coach_acknowledged_at: string | null
          coach_alert_active: boolean | null
          coach_alert_message: string | null
          coach_alert_requires_acknowledgment: boolean | null
          coach_note: string | null
          coach_note_priority: string | null
          completed_exercises: number | null
          conditioning_completed_at: string | null
          conditioning_status: string | null
          confidence_metadata: Json | null
          cool_down_completed_at: string | null
          cool_down_status: string | null
          evening_completed_at: string | null
          evening_status: string | null
          foam_roll_completed_at: string | null
          foam_roll_status: string | null
          generated_at: string | null
          id: string
          isometrics_completed_at: string | null
          isometrics_status: string | null
          main_session_completed_at: string | null
          main_session_status: string | null
          modified_at: string | null
          modified_by_coach_id: string | null
          modified_by_coach_name: string | null
          morning_completed_at: string | null
          morning_status: string | null
          overall_progress: number | null
          plyometrics_completed_at: string | null
          plyometrics_status: string | null
          protocol_date: string
          readiness_score: number | null
          session_notes: string | null
          skill_drills_completed_at: string | null
          skill_drills_status: string | null
          strength_completed_at: string | null
          strength_status: string | null
          total_exercises: number | null
          total_load_target_au: number | null
          training_focus: string | null
          updated_at: string | null
          user_id: string
          warm_up_completed_at: string | null
          warm_up_status: string | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          actual_load_au?: number | null
          actual_rpe?: number | null
          acwr_value?: number | null
          ai_rationale?: string | null
          coach_acknowledged?: boolean | null
          coach_acknowledged_at?: string | null
          coach_alert_active?: boolean | null
          coach_alert_message?: string | null
          coach_alert_requires_acknowledgment?: boolean | null
          coach_note?: string | null
          coach_note_priority?: string | null
          completed_exercises?: number | null
          conditioning_completed_at?: string | null
          conditioning_status?: string | null
          confidence_metadata?: Json | null
          cool_down_completed_at?: string | null
          cool_down_status?: string | null
          evening_completed_at?: string | null
          evening_status?: string | null
          foam_roll_completed_at?: string | null
          foam_roll_status?: string | null
          generated_at?: string | null
          id?: string
          isometrics_completed_at?: string | null
          isometrics_status?: string | null
          main_session_completed_at?: string | null
          main_session_status?: string | null
          modified_at?: string | null
          modified_by_coach_id?: string | null
          modified_by_coach_name?: string | null
          morning_completed_at?: string | null
          morning_status?: string | null
          overall_progress?: number | null
          plyometrics_completed_at?: string | null
          plyometrics_status?: string | null
          protocol_date: string
          readiness_score?: number | null
          session_notes?: string | null
          skill_drills_completed_at?: string | null
          skill_drills_status?: string | null
          strength_completed_at?: string | null
          strength_status?: string | null
          total_exercises?: number | null
          total_load_target_au?: number | null
          training_focus?: string | null
          updated_at?: string | null
          user_id: string
          warm_up_completed_at?: string | null
          warm_up_status?: string | null
        }
        Update: {
          actual_duration_minutes?: number | null
          actual_load_au?: number | null
          actual_rpe?: number | null
          acwr_value?: number | null
          ai_rationale?: string | null
          coach_acknowledged?: boolean | null
          coach_acknowledged_at?: string | null
          coach_alert_active?: boolean | null
          coach_alert_message?: string | null
          coach_alert_requires_acknowledgment?: boolean | null
          coach_note?: string | null
          coach_note_priority?: string | null
          completed_exercises?: number | null
          conditioning_completed_at?: string | null
          conditioning_status?: string | null
          confidence_metadata?: Json | null
          cool_down_completed_at?: string | null
          cool_down_status?: string | null
          evening_completed_at?: string | null
          evening_status?: string | null
          foam_roll_completed_at?: string | null
          foam_roll_status?: string | null
          generated_at?: string | null
          id?: string
          isometrics_completed_at?: string | null
          isometrics_status?: string | null
          main_session_completed_at?: string | null
          main_session_status?: string | null
          modified_at?: string | null
          modified_by_coach_id?: string | null
          modified_by_coach_name?: string | null
          morning_completed_at?: string | null
          morning_status?: string | null
          overall_progress?: number | null
          plyometrics_completed_at?: string | null
          plyometrics_status?: string | null
          protocol_date?: string
          readiness_score?: number | null
          session_notes?: string | null
          skill_drills_completed_at?: string | null
          skill_drills_status?: string | null
          strength_completed_at?: string | null
          strength_status?: string | null
          total_exercises?: number | null
          total_load_target_au?: number | null
          training_focus?: string | null
          updated_at?: string | null
          user_id?: string
          warm_up_completed_at?: string | null
          warm_up_status?: string | null
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
          motivation: number | null
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
          motivation?: number | null
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
          motivation?: number | null
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
      emergency_medical_records: {
        Row: {
          created_at: string
          event_date: string | null
          event_type: string | null
          id: string
          location_data: Json | null
          medical_data: Json | null
          record_data: Json
          record_type: string | null
          retention_expires_at: string | null
          retention_until: string | null
          updated_at: string
          user_email_hash: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          location_data?: Json | null
          medical_data?: Json | null
          record_data?: Json
          record_type?: string | null
          retention_expires_at?: string | null
          retention_until?: string | null
          updated_at?: string
          user_email_hash?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          location_data?: Json | null
          medical_data?: Json | null
          record_data?: Json
          record_type?: string | null
          retention_expires_at?: string | null
          retention_until?: string | null
          updated_at?: string
          user_email_hash?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_availability: {
        Row: {
          accommodation_needed: boolean | null
          amount_due: number | null
          amount_paid: number | null
          arrival_date: string | null
          competition_event_id: string
          created_at: string | null
          departure_date: string | null
          dietary_restrictions: string | null
          id: string
          payment_deadline: string | null
          payment_status: string | null
          reason: string | null
          responded_at: string | null
          status: string
          team_id: string
          transportation_needed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accommodation_needed?: boolean | null
          amount_due?: number | null
          amount_paid?: number | null
          arrival_date?: string | null
          competition_event_id: string
          created_at?: string | null
          departure_date?: string | null
          dietary_restrictions?: string | null
          id?: string
          payment_deadline?: string | null
          payment_status?: string | null
          reason?: string | null
          responded_at?: string | null
          status?: string
          team_id: string
          transportation_needed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accommodation_needed?: boolean | null
          amount_due?: number | null
          amount_paid?: number | null
          arrival_date?: string | null
          competition_event_id?: string
          created_at?: string | null
          departure_date?: string | null
          dietary_restrictions?: string | null
          id?: string
          payment_deadline?: string | null
          payment_status?: string | null
          reason?: string | null
          responded_at?: string | null
          status?: string
          team_id?: string
          transportation_needed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_availability_event_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "competition_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_availability_event_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "v_athlete_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_availability_event_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "v_pending_event_participation"
            referencedColumns: ["competition_event_id"]
          },
          {
            foreignKeyName: "player_tournament_availability_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      event_lineups: {
        Row: {
          competition_event_id: string
          created_at: string
          id: string
          notes: string | null
          saved_by: string
          slots: Json
          team_id: string
          updated_at: string
        }
        Insert: {
          competition_event_id: string
          created_at?: string
          id?: string
          notes?: string | null
          saved_by: string
          slots?: Json
          team_id: string
          updated_at?: string
        }
        Update: {
          competition_event_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          saved_by?: string
          slots?: Json
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_lineups_event_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "competition_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_lineups_event_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "v_athlete_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_lineups_event_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "v_pending_event_participation"
            referencedColumns: ["competition_event_id"]
          },
          {
            foreignKeyName: "tournament_lineups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participation: {
        Row: {
          attended: boolean
          avg_rpe: number | null
          competition_event_id: string
          created_at: string | null
          games_expected: number | null
          games_played: number
          id: string
          load_au: number | null
          notes: string | null
          recorded_at: string | null
          recorded_by: string | null
          status: string
          team_id: string | null
          total_minutes: number | null
          training_session_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attended?: boolean
          avg_rpe?: number | null
          competition_event_id: string
          created_at?: string | null
          games_expected?: number | null
          games_played?: number
          id?: string
          load_au?: number | null
          notes?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          status?: string
          team_id?: string | null
          total_minutes?: number | null
          training_session_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attended?: boolean
          avg_rpe?: number | null
          competition_event_id?: string
          created_at?: string | null
          games_expected?: number | null
          games_played?: number
          id?: string
          load_au?: number | null
          notes?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          status?: string
          team_id?: string | null
          total_minutes?: number | null
          training_session_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participation_competition_event_id_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "competition_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participation_competition_event_id_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "v_athlete_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participation_competition_event_id_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "v_pending_event_participation"
            referencedColumns: ["competition_event_id"]
          },
          {
            foreignKeyName: "event_participation_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participation_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participation_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "v_training_sessions_consent"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_logs: {
        Row: {
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
          user_id: string
        }
        Insert: {
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
          user_id: string
        }
        Update: {
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
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_training_sessions_consent"
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
          body_part: string | null
          category: string | null
          created_at: string | null
          difficulty_level: string | null
          equipment: string[] | null
          exercisedb_id: string
          flag_football_relevance: number | null
          id: string
          image_url: string | null
          instructions: string | null
          is_active: boolean | null
          is_approved: boolean | null
          is_curated: boolean | null
          muscle_groups: string[] | null
          name: string
          target_muscle: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          body_part?: string | null
          category?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          equipment?: string[] | null
          exercisedb_id: string
          flag_football_relevance?: number | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_curated?: boolean | null
          muscle_groups?: string[] | null
          name: string
          target_muscle?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          body_part?: string | null
          category?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          equipment?: string[] | null
          exercisedb_id?: string
          flag_football_relevance?: number | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_curated?: boolean | null
          muscle_groups?: string[] | null
          name?: string
          target_muscle?: string | null
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
          active: boolean | null
          applicable_positions: string[] | null
          category: string | null
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
          equipment_required: string[] | null
          feel_text: string | null
          how_text: string | null
          id: string
          image_url: string | null
          instructions: string[] | null
          is_high_intensity: boolean | null
          load_contribution_au: number | null
          metrics_tracked: string[] | null
          movement_pattern: string | null
          muscle_groups: string[] | null
          name: string
          position_specific: string[] | null
          slug: string | null
          subcategory: string | null
          target_muscles: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          video_duration_seconds: number | null
          video_id: string | null
          video_url: string | null
        }
        Insert: {
          active?: boolean | null
          applicable_positions?: string[] | null
          category?: string | null
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
          equipment_required?: string[] | null
          feel_text?: string | null
          how_text?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          is_high_intensity?: boolean | null
          load_contribution_au?: number | null
          metrics_tracked?: string[] | null
          movement_pattern?: string | null
          muscle_groups?: string[] | null
          name: string
          position_specific?: string[] | null
          slug?: string | null
          subcategory?: string | null
          target_muscles?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_id?: string | null
          video_url?: string | null
        }
        Update: {
          active?: boolean | null
          applicable_positions?: string[] | null
          category?: string | null
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
          equipment_required?: string[] | null
          feel_text?: string | null
          how_text?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          is_high_intensity?: boolean | null
          load_contribution_au?: number | null
          metrics_tracked?: string[] | null
          movement_pattern?: string | null
          muscle_groups?: string[] | null
          name?: string
          position_specific?: string[] | null
          slug?: string | null
          subcategory?: string | null
          target_muscles?: string[] | null
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
      frontend_logs: {
        Row: {
          context: Json
          id: string
          level: string
          message: string
          timestamp: string
          trace_id: string | null
          user_id: string
        }
        Insert: {
          context?: Json
          id?: string
          level: string
          message: string
          timestamp?: string
          trace_id?: string | null
          user_id: string
        }
        Update: {
          context?: Json
          id?: string
          level?: string
          message?: string
          timestamp?: string
          trace_id?: string | null
          user_id?: string
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
      game_participations: {
        Row: {
          created_at: string
          game_id: string
          id: string
          notes: string | null
          position: string | null
          status: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          notes?: string | null
          position?: string | null
          status?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          notes?: string | null
          position?: string | null
          status?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_participations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["game_id"]
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
      games: {
        Row: {
          competition_event_id: string | null
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
          competition_event_id?: string | null
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
          competition_event_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "games_competition_event_id_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "competition_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_competition_event_id_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "v_athlete_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_competition_event_id_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "v_pending_event_participation"
            referencedColumns: ["competition_event_id"]
          },
        ]
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
          recovery_start_date: string | null
          restrictions: Json | null
          severity: string | null
          status: string | null
          treatment_plan: string | null
          updated_at: string | null
          user_id: string
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
          recovery_start_date?: string | null
          restrictions?: Json | null
          severity?: string | null
          status?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          user_id: string
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
          recovery_start_date?: string | null
          restrictions?: Json | null
          severity?: string | null
          status?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          is_merlin_approved: boolean
          last_queried_at: string | null
          merlin_approval_notes: string | null
          merlin_approval_status: string
          merlin_approved_at: string | null
          merlin_approved_by: string | null
          merlin_approved_by_role: string | null
          merlin_submitted_at: string
          merlin_submitted_by: string | null
          merlin_submitted_by_role: string | null
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
          is_merlin_approved?: boolean
          last_queried_at?: string | null
          merlin_approval_notes?: string | null
          merlin_approval_status?: string
          merlin_approved_at?: string | null
          merlin_approved_by?: string | null
          merlin_approved_by_role?: string | null
          merlin_submitted_at?: string
          merlin_submitted_by?: string | null
          merlin_submitted_by_role?: string | null
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
          is_merlin_approved?: boolean
          last_queried_at?: string | null
          merlin_approval_notes?: string | null
          merlin_approval_status?: string
          merlin_approved_at?: string | null
          merlin_approved_by?: string | null
          merlin_approved_by_role?: string | null
          merlin_submitted_at?: string
          merlin_submitted_by?: string | null
          merlin_submitted_by_role?: string | null
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
      knowledge_review_audit: {
        Row: {
          action: string
          created_at: string
          entry_id: string
          id: number
          notes: string | null
          quality_gate_override: boolean
          quality_issues: Json
          reviewed_by: string
          reviewed_by_role: string
        }
        Insert: {
          action: string
          created_at?: string
          entry_id: string
          id?: number
          notes?: string | null
          quality_gate_override?: boolean
          quality_issues?: Json
          reviewed_by: string
          reviewed_by_role: string
        }
        Update: {
          action?: string
          created_at?: string
          entry_id?: string
          id?: number
          notes?: string | null
          quality_gate_override?: boolean
          quality_issues?: Json
          reviewed_by?: string
          reviewed_by_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_review_audit_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_entries"
            referencedColumns: ["id"]
          },
        ]
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
      learned_user_preferences: {
        Row: {
          created_at: string
          dismissed_responses: number
          helpful_responses: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dismissed_responses?: number
          helpful_responses?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dismissed_responses?: number
          helpful_responses?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learned_user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
          recorded_at: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_id: string
          metric_value: number
          notes?: string | null
          recorded_at?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_id?: string
          metric_value?: number
          notes?: string | null
          recorded_at?: string
          session_id?: string | null
          user_id?: string
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
          prediction_type: string | null
          target_value: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature_vector: Json
          id?: string
          model_version?: string | null
          prediction_type?: string | null
          target_value?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature_vector?: Json
          id?: string
          model_version?: string | null
          prediction_type?: string | null
          target_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      movement_patterns: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          program_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          program_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          program_id?: string | null
          updated_at?: string | null
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
          user_id: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
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
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
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
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      parent_notifications: {
        Row: {
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
          user_id: string
        }
        Insert: {
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
          user_id: string
        }
        Update: {
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
          user_id?: string
        }
        Relationships: []
      }
      parental_consent: {
        Row: {
          consent_scope: Json
          created_at: string
          expires_at: string | null
          guardian_email: string | null
          guardian_name: string | null
          id: string
          minor_user_id: string
          relationship: string | null
          status: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          consent_scope?: Json
          created_at?: string
          expires_at?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          id?: string
          minor_user_id: string
          relationship?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          consent_scope?: Json
          created_at?: string
          expires_at?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          id?: string
          minor_user_id?: string
          relationship?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
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
      performance_records: {
        Row: {
          back_squat: number | null
          bench_press: number | null
          body_weight: number | null
          broad_jump: number | null
          created_at: string
          dash_40: number | null
          deadlift: number | null
          id: string
          l_drill: number | null
          notes: string | null
          overall_score: number | null
          performance_day: string
          pro_agility: number | null
          reactive_agility: number | null
          recorded_at: string
          rsi: number | null
          sprint_10m: number | null
          sprint_20m: number | null
          updated_at: string
          user_id: string
          vertical_jump: number | null
        }
        Insert: {
          back_squat?: number | null
          bench_press?: number | null
          body_weight?: number | null
          broad_jump?: number | null
          created_at?: string
          dash_40?: number | null
          deadlift?: number | null
          id?: string
          l_drill?: number | null
          notes?: string | null
          overall_score?: number | null
          performance_day: string
          pro_agility?: number | null
          reactive_agility?: number | null
          recorded_at?: string
          rsi?: number | null
          sprint_10m?: number | null
          sprint_20m?: number | null
          updated_at?: string
          user_id: string
          vertical_jump?: number | null
        }
        Update: {
          back_squat?: number | null
          bench_press?: number | null
          body_weight?: number | null
          broad_jump?: number | null
          created_at?: string
          dash_40?: number | null
          deadlift?: number | null
          id?: string
          l_drill?: number | null
          notes?: string | null
          overall_score?: number | null
          performance_day?: string
          pro_agility?: number | null
          reactive_agility?: number | null
          recorded_at?: string
          rsi?: number | null
          sprint_10m?: number | null
          sprint_20m?: number | null
          updated_at?: string
          user_id?: string
          vertical_jump?: number | null
        }
        Relationships: []
      }
      performance_tests: {
        Row: {
          conditions: Json | null
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
      player_achievements: {
        Row: {
          achievement_id: string
          context_data: Json
          created_at: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          context_data?: Json
          created_at?: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          context_data?: Json
          created_at?: string
          earned_at?: string
          id?: string
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
          {
            foreignKeyName: "player_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      player_development_goals: {
        Row: {
          category: string
          coach_id: string
          created_at: string
          current_value: string | null
          due_date: string | null
          id: string
          metric: string
          notes: string | null
          progress: number
          start_value: string | null
          status: string
          target_value: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          coach_id: string
          created_at?: string
          current_value?: string | null
          due_date?: string | null
          id?: string
          metric: string
          notes?: string | null
          progress?: number
          start_value?: string | null
          status?: string
          target_value: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          coach_id?: string
          created_at?: string
          current_value?: string | null
          due_date?: string | null
          id?: string
          metric?: string
          notes?: string | null
          progress?: number
          start_value?: string | null
          status?: string
          target_value?: string
          team_id?: string
          updated_at?: string
          user_id?: string
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
      player_development_notes: {
        Row: {
          coach_id: string
          content: string
          created_at: string
          id: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coach_id: string
          content: string
          created_at?: string
          id?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coach_id?: string
          content?: string
          created_at?: string
          id?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_development_notes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
          status: string | null
          team_id: string
          tournament_id: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          status?: string | null
          team_id: string
          tournament_id: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          status?: string | null
          team_id?: string
          tournament_id?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
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
          assigned_position_id: string | null
          assigned_timezone: string | null
          completion_percentage: number | null
          compliance_rate: number | null
          created_at: string | null
          current_phase_id: string | null
          current_week: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          modifications: Json | null
          notes: string | null
          paused_at: string | null
          paused_reason: string | null
          program_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["program_status_enum"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_position_id?: string | null
          assigned_timezone?: string | null
          completion_percentage?: number | null
          compliance_rate?: number | null
          created_at?: string | null
          current_phase_id?: string | null
          current_week?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          modifications?: Json | null
          notes?: string | null
          paused_at?: string | null
          paused_reason?: string | null
          program_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["program_status_enum"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_position_id?: string | null
          assigned_timezone?: string | null
          completion_percentage?: number | null
          compliance_rate?: number | null
          created_at?: string | null
          current_phase_id?: string | null
          current_week?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          modifications?: Json | null
          notes?: string | null
          paused_at?: string | null
          paused_reason?: string | null
          program_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["program_status_enum"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_programs_assigned_position_id_fkey"
            columns: ["assigned_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
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
        ]
      }
      player_skill_assessments: {
        Row: {
          coach_id: string
          created_at: string
          grade: string
          id: string
          score: number
          skill: string
          skill_key: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          grade: string
          id?: string
          score: number
          skill: string
          skill_key: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          grade?: string
          id?: string
          score?: number
          skill?: string
          skill_key?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_skill_assessments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          streak_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          streak_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          streak_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      player_training_stats: {
        Row: {
          created_at: string
          total_achievements: number
          total_exercises: number
          total_load_au: number
          total_points: number
          total_sessions: number
          total_throws: number
          total_training_minutes: number
          tournaments_completed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          total_achievements?: number
          total_exercises?: number
          total_load_au?: number
          total_points?: number
          total_sessions?: number
          total_throws?: number
          total_training_minutes?: number
          tournaments_completed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          total_achievements?: number
          total_exercises?: number
          total_load_au?: number
          total_points?: number
          total_sessions?: number
          total_throws?: number
          total_training_minutes?: number
          tournaments_completed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_training_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
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
          position_id: string | null
          updated_at: string | null
          user_id: string | null
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
          position_id?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          position_id?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      post_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
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
          {
            foreignKeyName: "post_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
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
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          id: string
          is_published: boolean
          likes_count: number
          location: string | null
          media_type: string | null
          media_url: string | null
          post_type: string
          shares_count: number
          team_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          likes_count?: number
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          post_type?: string
          shares_count?: number
          team_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          likes_count?: number
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          post_type?: string
          shares_count?: number
          team_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_plans: {
        Row: {
          activities: Json
          attendance: Json
          coach_notes: string | null
          created_at: string
          created_by: string
          duration_minutes: number
          end_time: string
          equipment: Json
          focus: string | null
          id: string
          location: string
          practice_date: string
          start_time: string
          status: string
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          activities?: Json
          attendance?: Json
          coach_notes?: string | null
          created_at?: string
          created_by: string
          duration_minutes?: number
          end_time: string
          equipment?: Json
          focus?: string | null
          id?: string
          location: string
          practice_date: string
          start_time: string
          status?: string
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          activities?: Json
          attendance?: Json
          coach_notes?: string | null
          created_at?: string
          created_by?: string
          duration_minutes?: number
          end_time?: string
          equipment?: Json
          focus?: string | null
          id?: string
          location?: string
          practice_date?: string
          start_time?: string
          status?: string
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_plans_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          affected_data: Json
          affected_table: string | null
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          affected_data?: Json
          affected_table?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          affected_data?: Json
          affected_table?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          ai_processing_consent_date: string | null
          ai_processing_enabled: boolean
          created_at: string
          health_sharing_default: boolean
          performance_sharing_default: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_processing_consent_date?: string | null
          ai_processing_enabled?: boolean
          created_at?: string
          health_sharing_default?: boolean
          performance_sharing_default?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_processing_consent_date?: string | null
          ai_processing_enabled?: boolean
          created_at?: string
          health_sharing_default?: boolean
          performance_sharing_default?: boolean
          updated_at?: string
          user_id?: string
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
          program_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_from: string
          active_to?: string | null
          assigned_at?: string
          assigned_by: string
          created_at?: string
          id?: string
          program_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_from?: string
          active_to?: string | null
          assigned_at?: string
          assigned_by?: string
          created_at?: string
          id?: string
          program_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          prescribed_sets: number | null
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
          prescribed_sets?: number | null
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
          prescribed_sets?: number | null
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
      protocol_generation_requests: {
        Row: {
          created_at: string
          error: string | null
          id: string
          idempotency_key: string
          protocol_date: string
          protocol_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          idempotency_key: string
          protocol_date: string
          protocol_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          idempotency_key?: string
          protocol_date?: string
          protocol_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_generation_requests_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "daily_protocols"
            referencedColumns: ["id"]
          },
        ]
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
      qb_throwing_sessions: {
        Row: {
          arm_care_duration_minutes: number | null
          arm_feeling_after: number | null
          arm_feeling_before: number | null
          created_at: string
          fatigue_level: number | null
          ice_applied: boolean
          id: string
          location: string | null
          long_throws: number
          mechanics_focus: string | null
          medium_throws: number
          notes: string | null
          post_throwing_arm_care_done: boolean
          pre_throwing_warmup_done: boolean
          session_date: string
          session_type: string
          short_throws: number
          throwing_duration_minutes: number | null
          total_throws: number
          updated_at: string
          user_id: string
          warmup_duration_minutes: number | null
        }
        Insert: {
          arm_care_duration_minutes?: number | null
          arm_feeling_after?: number | null
          arm_feeling_before?: number | null
          created_at?: string
          fatigue_level?: number | null
          ice_applied?: boolean
          id?: string
          location?: string | null
          long_throws?: number
          mechanics_focus?: string | null
          medium_throws?: number
          notes?: string | null
          post_throwing_arm_care_done?: boolean
          pre_throwing_warmup_done?: boolean
          session_date: string
          session_type: string
          short_throws?: number
          throwing_duration_minutes?: number | null
          total_throws?: number
          updated_at?: string
          user_id: string
          warmup_duration_minutes?: number | null
        }
        Update: {
          arm_care_duration_minutes?: number | null
          arm_feeling_after?: number | null
          arm_feeling_before?: number | null
          created_at?: string
          fatigue_level?: number | null
          ice_applied?: boolean
          id?: string
          location?: string | null
          long_throws?: number
          mechanics_focus?: string | null
          medium_throws?: number
          notes?: string | null
          post_throwing_arm_care_done?: boolean
          pre_throwing_warmup_done?: boolean
          session_date?: string
          session_type?: string
          short_throws?: number
          throwing_duration_minutes?: number | null
          total_throws?: number
          updated_at?: string
          user_id?: string
          warmup_duration_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "qb_throwing_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      readiness_scores: {
        Row: {
          acute_load: number | null
          acwr: number | null
          chronic_load: number | null
          created_at: string | null
          day: string
          id: string
          level: string | null
          notes: string | null
          proximity_score: number | null
          score: number | null
          sleep_score: number | null
          suggestion: string | null
          updated_at: string | null
          user_id: string
          wellness_score: number | null
          workload_score: number | null
        }
        Insert: {
          acute_load?: number | null
          acwr?: number | null
          chronic_load?: number | null
          created_at?: string | null
          day: string
          id?: string
          level?: string | null
          notes?: string | null
          proximity_score?: number | null
          score?: number | null
          sleep_score?: number | null
          suggestion?: string | null
          updated_at?: string | null
          user_id: string
          wellness_score?: number | null
          workload_score?: number | null
        }
        Update: {
          acute_load?: number | null
          acwr?: number | null
          chronic_load?: number | null
          created_at?: string | null
          day?: string
          id?: string
          level?: string | null
          notes?: string | null
          proximity_score?: number | null
          score?: number | null
          sleep_score?: number | null
          suggestion?: string | null
          updated_at?: string | null
          user_id?: string
          wellness_score?: number | null
          workload_score?: number | null
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
          reason: string | null
          user_id: string
        }
        Insert: {
          block_end_date: string
          block_start_date: string
          block_type?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          block_end_date?: string
          block_start_date?: string
          block_type?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          user_id?: string
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
          user_id: string
        }
        Insert: {
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
          user_id: string
        }
        Update: {
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
          user_id?: string
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
      research_articles: {
        Row: {
          absorption_tips: string[] | null
          abstract: string | null
          altmetric_score: number | null
          arxiv_id: string | null
          authors: string[] | null
          categories: string[] | null
          chatbot_usage_count: number | null
          citation_count: number | null
          cold_therapy_protocols: Json | null
          conclusions: string | null
          created_at: string | null
          doi: string | null
          evidence_level: string | null
          food_sources: Json | null
          full_text: string | null
          full_text_url: string | null
          id: string
          impact_factor: number | null
          injury_types: string[] | null
          integrated_into_chatbot: boolean | null
          is_open_access: boolean | null
          journal: string | null
          key_findings: string | null
          keywords: string[] | null
          last_used_at: string | null
          license_type: string | null
          massage_gun_protocols: Json | null
          mental_training_methods: string[] | null
          mesh_terms: string[] | null
          methodology: string | null
          pdf_url: string | null
          periodization_phases: string[] | null
          pmc_id: string | null
          population_type: string | null
          practical_applications: string[] | null
          primary_category: string | null
          psychological_techniques: string[] | null
          psychological_topics: string[] | null
          publication_year: number | null
          publisher: string | null
          pubmed_id: string | null
          quality_score: number | null
          recovery_methods: string[] | null
          results_summary: string | null
          safety_warnings: string[] | null
          sample_size: number | null
          sauna_protocols: Json | null
          semantic_scholar_id: string | null
          source_type: string | null
          sport_type: string | null
          study_type: string | null
          supplement_guidance: Json | null
          supplement_types: string[] | null
          tags: string[] | null
          title: string
          training_protocols: Json | null
          training_types: string[] | null
          updated_at: string | null
          verification_date: string | null
          verified: boolean | null
          verified_by: string | null
        }
        Insert: {
          absorption_tips?: string[] | null
          abstract?: string | null
          altmetric_score?: number | null
          arxiv_id?: string | null
          authors?: string[] | null
          categories?: string[] | null
          chatbot_usage_count?: number | null
          citation_count?: number | null
          cold_therapy_protocols?: Json | null
          conclusions?: string | null
          created_at?: string | null
          doi?: string | null
          evidence_level?: string | null
          food_sources?: Json | null
          full_text?: string | null
          full_text_url?: string | null
          id?: string
          impact_factor?: number | null
          injury_types?: string[] | null
          integrated_into_chatbot?: boolean | null
          is_open_access?: boolean | null
          journal?: string | null
          key_findings?: string | null
          keywords?: string[] | null
          last_used_at?: string | null
          license_type?: string | null
          massage_gun_protocols?: Json | null
          mental_training_methods?: string[] | null
          mesh_terms?: string[] | null
          methodology?: string | null
          pdf_url?: string | null
          periodization_phases?: string[] | null
          pmc_id?: string | null
          population_type?: string | null
          practical_applications?: string[] | null
          primary_category?: string | null
          psychological_techniques?: string[] | null
          psychological_topics?: string[] | null
          publication_year?: number | null
          publisher?: string | null
          pubmed_id?: string | null
          quality_score?: number | null
          recovery_methods?: string[] | null
          results_summary?: string | null
          safety_warnings?: string[] | null
          sample_size?: number | null
          sauna_protocols?: Json | null
          semantic_scholar_id?: string | null
          source_type?: string | null
          sport_type?: string | null
          study_type?: string | null
          supplement_guidance?: Json | null
          supplement_types?: string[] | null
          tags?: string[] | null
          title: string
          training_protocols?: Json | null
          training_types?: string[] | null
          updated_at?: string | null
          verification_date?: string | null
          verified?: boolean | null
          verified_by?: string | null
        }
        Update: {
          absorption_tips?: string[] | null
          abstract?: string | null
          altmetric_score?: number | null
          arxiv_id?: string | null
          authors?: string[] | null
          categories?: string[] | null
          chatbot_usage_count?: number | null
          citation_count?: number | null
          cold_therapy_protocols?: Json | null
          conclusions?: string | null
          created_at?: string | null
          doi?: string | null
          evidence_level?: string | null
          food_sources?: Json | null
          full_text?: string | null
          full_text_url?: string | null
          id?: string
          impact_factor?: number | null
          injury_types?: string[] | null
          integrated_into_chatbot?: boolean | null
          is_open_access?: boolean | null
          journal?: string | null
          key_findings?: string | null
          keywords?: string[] | null
          last_used_at?: string | null
          license_type?: string | null
          massage_gun_protocols?: Json | null
          mental_training_methods?: string[] | null
          mesh_terms?: string[] | null
          methodology?: string | null
          pdf_url?: string | null
          periodization_phases?: string[] | null
          pmc_id?: string | null
          population_type?: string | null
          practical_applications?: string[] | null
          primary_category?: string | null
          psychological_techniques?: string[] | null
          psychological_topics?: string[] | null
          publication_year?: number | null
          publisher?: string | null
          pubmed_id?: string | null
          quality_score?: number | null
          recovery_methods?: string[] | null
          results_summary?: string | null
          safety_warnings?: string[] | null
          sample_size?: number | null
          sauna_protocols?: Json | null
          semantic_scholar_id?: string | null
          source_type?: string | null
          sport_type?: string | null
          study_type?: string | null
          supplement_guidance?: Json | null
          supplement_types?: string[] | null
          tags?: string[] | null
          title?: string
          training_protocols?: Json | null
          training_types?: string[] | null
          updated_at?: string | null
          verification_date?: string | null
          verified?: boolean | null
          verified_by?: string | null
        }
        Relationships: []
      }
      return_to_play_protocols: {
        Row: {
          created_at: string
          current_phase: number
          estimated_completion_date: string | null
          id: string
          phase_description: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_phase?: number
          estimated_completion_date?: string | null
          id?: string
          phase_description?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_phase?: number
          estimated_completion_date?: string | null
          id?: string
          phase_description?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          reason: string | null
          team_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by: string
          reason?: string | null
          team_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string
          reason?: string | null
          team_id?: string
          user_id?: string | null
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
          athlete_notified: boolean | null
          athlete_notified_at: string | null
          data_disclosed: Json
          disclosed_to_roles: string[]
          disclosed_to_user_ids: string[]
          override_id: string
          override_timestamp: string
          trigger_type: string
          trigger_value: Json
          user_id: string
        }
        Insert: {
          athlete_notified?: boolean | null
          athlete_notified_at?: string | null
          data_disclosed: Json
          disclosed_to_roles: string[]
          disclosed_to_user_ids: string[]
          override_id?: string
          override_timestamp?: string
          trigger_type: string
          trigger_value: Json
          user_id: string
        }
        Update: {
          athlete_notified?: boolean | null
          athlete_notified_at?: string | null
          data_disclosed?: Json
          disclosed_to_roles?: string[]
          disclosed_to_user_ids?: string[]
          override_id?: string
          override_timestamp?: string
          trigger_type?: string
          trigger_value?: Json
          user_id?: string
        }
        Relationships: []
      }
      season_archives: {
        Row: {
          archived_at: string
          id: string
          metadata: Json
          season_id: string
        }
        Insert: {
          archived_at?: string
          id?: string
          metadata?: Json
          season_id: string
        }
        Update: {
          archived_at?: string
          id?: string
          metadata?: Json
          season_id?: string
        }
        Relationships: []
      }
      session_exercises: {
        Row: {
          created_at: string | null
          distance: number | null
          distance_meters: number | null
          duration_minutes: number | null
          duration_seconds: number | null
          exercise_id: string | null
          exercise_name: string | null
          exercise_order: number
          id: string
          intensity: string | null
          load_description: string | null
          load_percentage: number | null
          load_type: string | null
          load_value: number | null
          notes: string | null
          position_specific_params: Json | null
          reps: string | null
          rest_seconds: number | null
          session_id: string | null
          session_template_id: string | null
          sets: number | null
          tempo: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          distance?: number | null
          distance_meters?: number | null
          duration_minutes?: number | null
          duration_seconds?: number | null
          exercise_id?: string | null
          exercise_name?: string | null
          exercise_order: number
          id?: string
          intensity?: string | null
          load_description?: string | null
          load_percentage?: number | null
          load_type?: string | null
          load_value?: number | null
          notes?: string | null
          position_specific_params?: Json | null
          reps?: string | null
          rest_seconds?: number | null
          session_id?: string | null
          session_template_id?: string | null
          sets?: number | null
          tempo?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          distance?: number | null
          distance_meters?: number | null
          duration_minutes?: number | null
          duration_seconds?: number | null
          exercise_id?: string | null
          exercise_name?: string | null
          exercise_order?: number
          id?: string
          intensity?: string | null
          load_description?: string | null
          load_percentage?: number | null
          load_type?: string | null
          load_value?: number | null
          notes?: string | null
          position_specific_params?: Json | null
          reps?: string | null
          rest_seconds?: number | null
          session_id?: string | null
          session_template_id?: string | null
          sets?: number | null
          tempo?: string | null
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
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_training_sessions_consent"
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
          {
            foreignKeyName: "session_version_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_training_sessions_consent"
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
          season: string | null
          situation_type: string | null
          success_rate: number | null
          successes: number | null
          touchdowns: number | null
          turnovers: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          avg_yards?: number | null
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: number
          season?: string | null
          situation_type?: string | null
          success_rate?: number | null
          successes?: number | null
          touchdowns?: number | null
          turnovers?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          avg_yards?: number | null
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          id?: number
          season?: string | null
          situation_type?: string | null
          success_rate?: number | null
          successes?: number | null
          touchdowns?: number | null
          turnovers?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      state_transition_history: {
        Row: {
          actor_id: string | null
          actor_role: string
          from_state: string | null
          id: string
          metadata: Json | null
          reason: string | null
          session_id: string
          to_state: string
          transitioned_at: string
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string
          from_state?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          session_id: string
          to_state: string
          transitioned_at?: string
        }
        Update: {
          actor_id?: string | null
          actor_role?: string
          from_state?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          session_id?: string
          to_state?: string
          transitioned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "state_transition_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_transition_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_training_sessions_consent"
            referencedColumns: ["id"]
          },
        ]
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
      supplement_logs: {
        Row: {
          created_at: string
          date: string
          dosage: string | null
          id: string
          notes: string | null
          supplement_name: string
          taken: boolean
          time_of_day: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          dosage?: string | null
          id?: string
          notes?: string | null
          supplement_name: string
          taken?: boolean
          time_of_day?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          dosage?: string | null
          id?: string
          notes?: string | null
          supplement_name?: string
          taken?: boolean
          time_of_day?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          event_type: string
          id: string
          is_mandatory: boolean
          location: string | null
          rsvp_deadline: string | null
          start_time: string
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          is_mandatory?: boolean
          location?: string | null
          rsvp_deadline?: string | null
          start_time: string
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          is_mandatory?: boolean
          location?: string | null
          rsvp_deadline?: string | null
          start_time?: string
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
      team_preferences: {
        Row: {
          allow_players_view_analytics: boolean
          auto_send_rsvp_reminders: boolean
          created_at: string
          created_by: string | null
          require_coach_approval_posts: boolean
          require_wellness_checkin: boolean
          team_id: string
          updated_at: string
        }
        Insert: {
          allow_players_view_analytics?: boolean
          auto_send_rsvp_reminders?: boolean
          created_at?: string
          created_by?: string | null
          require_coach_approval_posts?: boolean
          require_wellness_checkin?: boolean
          team_id: string
          updated_at?: string
        }
        Update: {
          allow_players_view_analytics?: boolean
          auto_send_rsvp_reminders?: boolean
          created_at?: string
          created_by?: string | null
          require_coach_approval_posts?: boolean
          require_wellness_checkin?: boolean
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_preferences_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
          home_field: string | null
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
          home_field?: string | null
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
          home_field?: string | null
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
          status: string | null
          template_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_by: string
          assigned_date: string
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          template_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string
          assigned_date?: string
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          template_id?: string
          updated_at?: string | null
          user_id?: string
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
      tournament_day_plans: {
        Row: {
          created_at: string
          games: Json
          id: string
          nutrition_windows: Json
          team_id: string | null
          tournament_date: string
          tournament_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          games?: Json
          id?: string
          nutrition_windows?: Json
          team_id?: string | null
          tournament_date: string
          tournament_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          games?: Json
          id?: string
          nutrition_windows?: Json
          team_id?: string | null
          tournament_date?: string
          tournament_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_day_plans_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
      training_session_templates: {
        Row: {
          created_at: string | null
          day_of_week: number
          description: string | null
          duration_minutes: number | null
          equipment_needed: string[] | null
          id: string
          intensity_level: string | null
          is_outdoor: boolean | null
          is_team_practice: boolean | null
          notes: string | null
          program_id: string
          session_name: string
          session_order: number
          session_type: string | null
          updated_at: string | null
          warm_up_protocol: string | null
          weather_sensitive: boolean | null
          week_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          description?: string | null
          duration_minutes?: number | null
          equipment_needed?: string[] | null
          id?: string
          intensity_level?: string | null
          is_outdoor?: boolean | null
          is_team_practice?: boolean | null
          notes?: string | null
          program_id: string
          session_name: string
          session_order?: number
          session_type?: string | null
          updated_at?: string | null
          warm_up_protocol?: string | null
          weather_sensitive?: boolean | null
          week_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          description?: string | null
          duration_minutes?: number | null
          equipment_needed?: string[] | null
          id?: string
          intensity_level?: string | null
          is_outdoor?: boolean | null
          is_team_practice?: boolean | null
          notes?: string | null
          program_id?: string
          session_name?: string
          session_order?: number
          session_type?: string | null
          updated_at?: string | null
          warm_up_protocol?: string | null
          weather_sensitive?: boolean | null
          week_id?: string
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
          coach_feedback: string | null
          coach_locked: boolean
          completed_at: string | null
          completion_rate: number | null
          conflicts: Json | null
          created_at: string | null
          current_version: number
          drill_type: string | null
          duration_minutes: number
          equipment: string[] | null
          exercises: Json | null
          goals: string[] | null
          hours_delayed: number | null
          id: string
          intensity_level: number | null
          location: string | null
          log_status: string | null
          modified_at: string | null
          modified_by_coach_id: string | null
          notes: string | null
          performance_score: number | null
          requires_coach_approval: boolean | null
          rpe: number | null
          session_date: string
          session_state: string | null
          session_structure: Json | null
          session_type: string
          status: string | null
          team_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          verification_confidence: number | null
          workload: number | null
          xp_earned: number | null
        }
        Insert: {
          coach_feedback?: string | null
          coach_locked?: boolean
          completed_at?: string | null
          completion_rate?: number | null
          conflicts?: Json | null
          created_at?: string | null
          current_version?: number
          drill_type?: string | null
          duration_minutes: number
          equipment?: string[] | null
          exercises?: Json | null
          goals?: string[] | null
          hours_delayed?: number | null
          id?: string
          intensity_level?: number | null
          location?: string | null
          log_status?: string | null
          modified_at?: string | null
          modified_by_coach_id?: string | null
          notes?: string | null
          performance_score?: number | null
          requires_coach_approval?: boolean | null
          rpe?: number | null
          session_date: string
          session_state?: string | null
          session_structure?: Json | null
          session_type: string
          status?: string | null
          team_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          verification_confidence?: number | null
          workload?: number | null
          xp_earned?: number | null
        }
        Update: {
          coach_feedback?: string | null
          coach_locked?: boolean
          completed_at?: string | null
          completion_rate?: number | null
          conflicts?: Json | null
          created_at?: string | null
          current_version?: number
          drill_type?: string | null
          duration_minutes?: number
          equipment?: string[] | null
          exercises?: Json | null
          goals?: string[] | null
          hours_delayed?: number | null
          id?: string
          intensity_level?: number | null
          location?: string | null
          log_status?: string | null
          modified_at?: string | null
          modified_by_coach_id?: string | null
          notes?: string | null
          performance_score?: number | null
          requires_coach_approval?: boolean | null
          rpe?: number | null
          session_date?: string
          session_state?: string | null
          session_structure?: Json | null
          session_type?: string
          status?: string | null
          team_id?: string | null
          title?: string | null
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
      trending_topics: {
        Row: {
          count: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      user_preferences: {
        Row: {
          consent_ai_coach: boolean
          consent_data_usage: boolean
          consent_email_updates: boolean
          consent_privacy_policy: boolean
          consent_terms_of_service: boolean
          consent_updated_at: string | null
          created_at: string
          current_injuries: Json
          email: string | null
          enable_reminders: boolean
          equipment_available: string[]
          evening_mobility: string | null
          foam_rolling_time: string | null
          injury_history: string[]
          medical_notes: string | null
          morning_mobility: string | null
          notification_preferences: string[]
          practice_days: string[]
          practices_per_week: number | null
          reminder_time: string | null
          rest_day_preference: string | null
          schedule_type: string | null
          training_goals: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_ai_coach?: boolean
          consent_data_usage?: boolean
          consent_email_updates?: boolean
          consent_privacy_policy?: boolean
          consent_terms_of_service?: boolean
          consent_updated_at?: string | null
          created_at?: string
          current_injuries?: Json
          email?: string | null
          enable_reminders?: boolean
          equipment_available?: string[]
          evening_mobility?: string | null
          foam_rolling_time?: string | null
          injury_history?: string[]
          medical_notes?: string | null
          morning_mobility?: string | null
          notification_preferences?: string[]
          practice_days?: string[]
          practices_per_week?: number | null
          reminder_time?: string | null
          rest_day_preference?: string | null
          schedule_type?: string | null
          training_goals?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_ai_coach?: boolean
          consent_data_usage?: boolean
          consent_email_updates?: boolean
          consent_privacy_policy?: boolean
          consent_terms_of_service?: boolean
          consent_updated_at?: string | null
          created_at?: string
          current_injuries?: Json
          email?: string | null
          enable_reminders?: boolean
          equipment_available?: string[]
          evening_mobility?: string | null
          foam_rolling_time?: string | null
          injury_history?: string[]
          medical_notes?: string | null
          morning_mobility?: string | null
          notification_preferences?: string[]
          practice_days?: string[]
          practices_per_week?: number | null
          reminder_time?: string | null
          rest_day_preference?: string | null
          schedule_type?: string | null
          training_goals?: string[]
          updated_at?: string
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
          account_status: string | null
          avatar_url: string | null
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
          gender: string | null
          height_cm: number | null
          id: string
          is_active: boolean | null
          jersey_number: number | null
          last_login: string | null
          last_name: string
          name: string | null
          notification_last_opened_at: string | null
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          password_hash: string | null
          phone: string | null
          position: string | null
          preferred_units: string | null
          profile_photo_url: string | null
          profile_picture: string | null
          secondary_position: string | null
          team: string | null
          throwing_arm: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
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
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          last_login?: string | null
          last_name: string
          name?: string | null
          notification_last_opened_at?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          password_hash?: string | null
          phone?: string | null
          position?: string | null
          preferred_units?: string | null
          profile_photo_url?: string | null
          profile_picture?: string | null
          secondary_position?: string | null
          team?: string | null
          throwing_arm?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
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
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          jersey_number?: number | null
          last_login?: string | null
          last_name?: string
          name?: string | null
          notification_last_opened_at?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          password_hash?: string | null
          phone?: string | null
          position?: string | null
          preferred_units?: string | null
          profile_photo_url?: string | null
          profile_picture?: string | null
          secondary_position?: string | null
          team?: string | null
          throwing_arm?: string | null
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
      warmup_protocols: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          program_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          program_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          program_id?: string | null
          updated_at?: string | null
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
      physical_measurements_latest: {
        Row: {
          basal_metabolic_rate: number | null
          body_age: number | null
          body_fat: number | null
          body_water_percentage: number | null
          created_at: string | null
          height: number | null
          id: string | null
          muscle_mass: number | null
          previous_body_fat: number | null
          previous_weight: number | null
          user_id: string | null
          visceral_fat_rating: number | null
          weight: number | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_name: string | null
          achievement_slug: string | null
          category: string | null
          id: string | null
          metadata: Json | null
          unlocked_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_athlete_schedule: {
        Row: {
          competition_country: string | null
          competition_id: string | null
          competition_kind: string | null
          competition_level: string | null
          competition_name: string | null
          competition_season_year: number | null
          competition_short_name: string | null
          created_at: string | null
          ends_at: string | null
          expected_game_count: number | null
          external_id: string | null
          id: string | null
          importance: string | null
          label: string | null
          location: string | null
          metadata: Json | null
          notes: string | null
          starts_at: string | null
          status: string | null
          team_id: string | null
          team_name: string | null
          updated_at: string | null
          user_id: string | null
          venue: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_events_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pending_event_participation: {
        Row: {
          availability_status: string | null
          competition_event_id: string | null
          competition_name: string | null
          ends_at: string | null
          expected_game_count: number | null
          label: string | null
          starts_at: string | null
          team_id: string | null
          team_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      v_training_sessions_consent: {
        Row: {
          access_reason: string | null
          completed_at: string | null
          completion_rate: number | null
          consent_blocked: boolean | null
          created_at: string | null
          drill_type: string | null
          duration_minutes: number | null
          id: string | null
          intensity_level: number | null
          location: string | null
          notes: string | null
          performance_score: number | null
          rpe: number | null
          session_date: string | null
          session_state: string | null
          session_type: string | null
          status: string | null
          team_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          workload: number | null
        }
        Insert: {
          access_reason?: never
          completed_at?: never
          completion_rate?: never
          consent_blocked?: never
          created_at?: string | null
          drill_type?: string | null
          duration_minutes?: never
          id?: string | null
          intensity_level?: never
          location?: string | null
          notes?: never
          performance_score?: never
          rpe?: never
          session_date?: string | null
          session_state?: string | null
          session_type?: string | null
          status?: string | null
          team_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          workload?: never
        }
        Update: {
          access_reason?: never
          completed_at?: never
          completion_rate?: never
          consent_blocked?: never
          created_at?: string | null
          drill_type?: string | null
          duration_minutes?: never
          id?: string | null
          intensity_level?: never
          location?: string | null
          notes?: never
          performance_score?: never
          rpe?: never
          session_date?: string | null
          session_state?: string | null
          session_type?: string | null
          status?: string | null
          team_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          workload?: never
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
    }
    Functions: {
      accept_team_invitation: {
        Args: { p_invitation_id: string }
        Returns: Json
      }
      archive_season_data: { Args: { p_season_id: string }; Returns: boolean }
      auth_user_team_ids: { Args: never; Returns: string[] }
      award_achievement: {
        Args: {
          p_achievement_slug: string
          p_context?: Json
          p_user_id: string
        }
        Returns: string
      }
      calculate_player_tournament_cost: {
        Args: { p_team_id: string; p_tournament_id: string }
        Returns: number
      }
      can_view_health_data: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      can_view_player_health: {
        Args: { p_player_id: string; p_viewer_id: string }
        Returns: boolean
      }
      can_view_player_performance: {
        Args: { p_player_id: string; p_viewer_id: string }
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
      cleanup_expired_emergency_records: { Args: never; Returns: number }
      complete_training_session: {
        Args: {
          p_duration_minutes?: number
          p_intensity_level?: number
          p_notes?: string
          p_rpe?: number
          p_session_id: string
          p_user_id: string
          p_workload?: number
        }
        Returns: {
          session_id: string
          workload: number
          workout_log_id: string
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
      debug_count_public_user_refs: {
        Args: { p_user_id: string }
        Returns: {
          column_name: string
          ref_count: number
          table_name: string
        }[]
      }
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
          p_pain_location?: string
          p_pain_score: number
          p_pain_trend?: string
        }
        Returns: string
      }
      ensure_public_user_profile: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      expire_old_invitations: { Args: never; Returns: undefined }
      ff_can_access_channel: {
        Args: { p_channel_id: string; p_user_id?: string }
        Returns: boolean
      }
      ff_can_manage_channel: {
        Args: { p_channel_id: string; p_user_id?: string }
        Returns: boolean
      }
      ff_can_post_to_channel: {
        Args: { p_channel_id: string; p_user_id?: string }
        Returns: boolean
      }
      ff_is_active_team_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      ff_is_team_staff: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      ff_share_active_team: {
        Args: { p_actor_user_id: string; p_subject_user_id: string }
        Returns: boolean
      }
      generate_protocol_transactional: {
        Args: {
          p_acwr_value: number
          p_ai_rationale: string
          p_confidence_metadata: Json
          p_exercises: Json
          p_protocol_date: string
          p_readiness_score: number
          p_total_load_target_au: number
          p_training_focus: string
          p_user_id: string
        }
        Returns: string
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
        Args: { p_date: string; p_user_id: string }
        Returns: {
          energy_level: number
          has_checkin: boolean
          muscle_soreness: number
          readiness_score: number
          sleep_quality: number
          soreness_areas: string[]
          stress_level: number
        }[]
      }
      get_channel_members: {
        Args: { p_channel_id: string }
        Returns: {
          avatar_url: string
          can_post: boolean
          email: string
          full_name: string
          is_explicit_member: boolean
          jersey_number: number
          joined_at: string
          position: string
          role: string
          user_id: string
        }[]
      }
      get_coached_teams: { Args: never; Returns: string[] }
      get_current_role: { Args: never; Returns: string }
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
      get_injury_risk_level: { Args: { acwr_value: number }; Returns: string }
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
      increment_preference_counter: {
        Args: { p_field: string; p_user_id: string }
        Returns: undefined
      }
      increment_reply_count: { Args: { message_id: string }; Returns: number }
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
      is_active_superadmin: { Args: never; Returns: boolean }
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
      log_training_session: {
        Args: {
          p_duration_minutes: number
          p_intensity_level?: number
          p_notes?: string
          p_rpe?: number
          p_session_date: string
          p_session_type: string
          p_status?: string
          p_team_id?: string
          p_user_id: string
          p_workload?: number
        }
        Returns: {
          session_id: string
          workout_log_id: string
        }[]
      }
      normalize_notification_priority_value: {
        Args: { p_priority: string }
        Returns: string
      }
      pause_account: {
        Args: { p_paused_until?: string; p_reason?: string; p_user_id: string }
        Returns: string
      }
      process_hard_deletion: {
        Args: { p_request_id: string }
        Returns: boolean
      }
      record_event_participation: {
        Args: {
          p_attended: boolean
          p_avg_rpe?: number
          p_competition_event_id: string
          p_games_played?: number
          p_notes?: string
          p_total_minutes?: number
          p_user_id: string
        }
        Returns: string
      }
      require_ai_consent: { Args: { p_user_id: string }; Returns: boolean }
      resume_account: { Args: { p_user_id: string }; Returns: boolean }
      sync_public_user_from_auth_row: {
        Args: { p_auth_user: Database["public"]["Tables"]["users"]["Row"] }
        Returns: undefined
      }
      update_player_streak: {
        Args: {
          p_activity_date: string
          p_streak_type: string
          p_user_id: string
        }
        Returns: {
          achievements_unlocked: string[]
          longest_streak: number
          new_streak: number
          streak_type: string
        }[]
      }
      upsert_wellness_checkin: {
        Args: {
          p_calculated_readiness?: number
          p_checkin_date: string
          p_energy_level?: number
          p_hydration_level?: number
          p_mood?: number
          p_motivation_level?: number
          p_muscle_soreness?: number
          p_notes?: string
          p_sleep_hours?: number
          p_sleep_quality?: number
          p_soreness_areas?: string[]
          p_stress_level?: number
          p_user_id: string
        }
        Returns: {
          checkin_id: string
          legacy_entry_id: string
          saved_checkin_date: string
        }[]
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
      program_status_enum: "active" | "paused" | "completed" | "inactive"
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
      program_status_enum: ["active", "paused", "completed", "inactive"],
    },
  },
} as const

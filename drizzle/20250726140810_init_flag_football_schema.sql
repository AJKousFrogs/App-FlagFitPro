CREATE TABLE "backups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"type" varchar(50) NOT NULL,
	"category" varchar(50) DEFAULT 'general',
	"size" integer,
	"checksum" varchar(64),
	"metadata" json NOT NULL,
	"storage_location" text,
	"is_encrypted" boolean DEFAULT true,
	"created_by" uuid,
	"status" varchar(20) DEFAULT 'pending',
	"error" text,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "game_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"position" varchar(50),
	"stats" json NOT NULL,
	"play_time" integer,
	"injuries" json,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_team_id" uuid NOT NULL,
	"away_team_id" uuid NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"location" varchar(200),
	"league" varchar(100),
	"game_type" varchar(50) DEFAULT 'regular',
	"status" varchar(20) DEFAULT 'scheduled',
	"home_score" integer DEFAULT 0,
	"away_score" integer DEFAULT 0,
	"weather" json,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"priority" varchar(20) DEFAULT 'normal',
	"channels" json NOT NULL,
	"metadata" json,
	"sent_at" timestamp,
	"read_at" timestamp,
	"delivery_status" json,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"metric_type" varchar(50) NOT NULL,
	"value" numeric(10, 3) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"notes" text,
	"recorded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" varchar(20) NOT NULL,
	"component" varchar(100) NOT NULL,
	"action" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"user_id" uuid,
	"metadata" json,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "team_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) DEFAULT 'general',
	"attachments" json,
	"mentions" json,
	"parent_id" uuid,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"coach_id" uuid,
	"league" varchar(100),
	"division" varchar(50),
	"home_field" varchar(200),
	"team_chemistry" numeric(3, 1) DEFAULT '0.0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"difficulty" varchar(20) DEFAULT 'beginner',
	"duration" integer,
	"equipment" json,
	"instructions" json,
	"video_url" text,
	"created_by" uuid,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"program_id" uuid,
	"team_id" uuid,
	"session_type" varchar(50) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"notes" text,
	"weather" json,
	"location" varchar(200),
	"performance" json,
	"injuries" json,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"avatar" text,
	"role" varchar(50) DEFAULT 'player' NOT NULL,
	"position" varchar(50),
	"phone_number" varchar(20),
	"emergency_contact" json,
	"medical_info" json,
	"preferences" json DEFAULT '{}'::json,
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "backups" ADD CONSTRAINT "backups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_stats" ADD CONSTRAINT "game_stats_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_stats" ADD CONSTRAINT "game_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_stats" ADD CONSTRAINT "game_stats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_session_id_training_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_messages" ADD CONSTRAINT "team_messages_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_messages" ADD CONSTRAINT "team_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_messages" ADD CONSTRAINT "team_messages_parent_id_team_messages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."team_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "backups_type_idx" ON "backups" USING btree ("type");--> statement-breakpoint
CREATE INDEX "backups_status_idx" ON "backups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "backups_date_idx" ON "backups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "backups_created_by_idx" ON "backups" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "game_stats_game_user_idx" ON "game_stats" USING btree ("game_id","user_id");--> statement-breakpoint
CREATE INDEX "game_stats_game_idx" ON "game_stats" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "game_stats_user_idx" ON "game_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "game_stats_team_idx" ON "game_stats" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "games_home_team_idx" ON "games" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "games_away_team_idx" ON "games" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "games_scheduled_idx" ON "games" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "games_status_idx" ON "games" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_priority_idx" ON "notifications" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_date_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "performance_metrics_user_metric_idx" ON "performance_metrics" USING btree ("user_id","metric_type");--> statement-breakpoint
CREATE INDEX "performance_metrics_session_idx" ON "performance_metrics" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "performance_metrics_date_idx" ON "performance_metrics" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "system_logs_level_idx" ON "system_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "system_logs_component_idx" ON "system_logs" USING btree ("component");--> statement-breakpoint
CREATE INDEX "system_logs_user_idx" ON "system_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "system_logs_date_idx" ON "system_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_user_idx" ON "team_members" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "team_members_team_idx" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_members_user_idx" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_messages_team_idx" ON "team_messages" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_messages_sender_idx" ON "team_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "team_messages_date_idx" ON "team_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "team_messages_type_idx" ON "team_messages" USING btree ("type");--> statement-breakpoint
CREATE INDEX "training_programs_type_idx" ON "training_programs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "training_programs_difficulty_idx" ON "training_programs" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "training_programs_active_idx" ON "training_programs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "training_sessions_user_idx" ON "training_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "training_sessions_team_idx" ON "training_sessions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "training_sessions_date_idx" ON "training_sessions" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "training_sessions_type_idx" ON "training_sessions" USING btree ("session_type");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("is_active");
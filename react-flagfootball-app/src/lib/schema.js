import { pgTable, text, serial, timestamp, boolean, integer, jsonb, varchar, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatar: text('avatar'),
  role: varchar('role', { length: 50 }).default('athlete'), // athlete, coach, admin
  isActive: boolean('is_active').default(true),
  emailVerified: boolean('email_verified').default(false),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Training Sessions table
export const trainingSessions = pgTable('training_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 100 }), // drill, workout, scrimmage, etc.
  duration: integer('duration'), // in minutes
  difficulty: varchar('difficulty', { length: 20 }), // beginner, intermediate, advanced
  status: varchar('status', { length: 20 }).default('planned'), // planned, active, completed, cancelled
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
  tags: jsonb('tags'), // array of tags
  metadata: jsonb('metadata'), // flexible data storage
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Training Goals table
export const trainingGoals = pgTable('training_goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 100 }), // speed, agility, endurance, skill, etc.
  targetValue: integer('target_value'),
  currentValue: integer('current_value').default(0),
  unit: varchar('unit', { length: 50 }), // seconds, meters, reps, etc.
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high
  status: varchar('status', { length: 20 }).default('active'), // active, completed, paused, archived
  targetDate: timestamp('target_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Analytics Events table
export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  sessionId: varchar('session_id', { length: 255 }),
  event: varchar('event', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  action: varchar('action', { length: 100 }),
  label: varchar('label', { length: 255 }),
  value: integer('value'),
  properties: jsonb('properties'),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  referrer: text('referrer'),
  pathname: text('pathname'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Drill Library table
export const drills = pgTable('drills', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // speed, agility, passing, defense, etc.
  difficulty: varchar('difficulty', { length: 20 }), // beginner, intermediate, advanced
  duration: integer('duration'), // in minutes
  equipmentNeeded: jsonb('equipment_needed'), // array of equipment
  instructions: jsonb('instructions'), // array of steps
  videoUrl: text('video_url'),
  imageUrl: text('image_url'),
  tags: jsonb('tags'),
  isPublic: boolean('is_public').default(true),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User Progress table
export const userProgress = pgTable('user_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  drillId: uuid('drill_id').references(() => drills.id),
  sessionId: uuid('session_id').references(() => trainingSessions.id),
  metric: varchar('metric', { length: 100 }), // time, reps, distance, accuracy, etc.
  value: integer('value'),
  unit: varchar('unit', { length: 50 }),
  notes: text('notes'),
  recordedAt: timestamp('recorded_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Teams table (for multi-team functionality)
export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').references(() => users.id),
  isActive: boolean('is_active').default(true),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Team Members table
export const teamMembers = pgTable('team_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').references(() => teams.id),
  userId: uuid('user_id').references(() => users.id),
  role: varchar('role', { length: 50 }).default('member'), // owner, coach, member
  status: varchar('status', { length: 20 }).default('active'), // active, invited, inactive
  joinedAt: timestamp('joined_at').defaultNow(),
});

// Define relationships
export const userRelations = relations(users, ({ many }) => ({
  trainingSessions: many(trainingSessions),
  trainingGoals: many(trainingGoals),
  analyticsEvents: many(analyticsEvents),
  createdDrills: many(drills),
  userProgress: many(userProgress),
  ownedTeams: many(teams),
  teamMemberships: many(teamMembers),
}));

export const trainingSessionRelations = relations(trainingSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [trainingSessions.userId],
    references: [users.id],
  }),
  userProgress: many(userProgress),
}));

export const trainingGoalRelations = relations(trainingGoals, ({ one }) => ({
  user: one(users, {
    fields: [trainingGoals.userId],
    references: [users.id],
  }),
}));

export const analyticsEventRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id],
  }),
}));

export const drillRelations = relations(drills, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [drills.createdBy],
    references: [users.id],
  }),
  userProgress: many(userProgress),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  drill: one(drills, {
    fields: [userProgress.drillId],
    references: [drills.id],
  }),
  session: one(trainingSessions, {
    fields: [userProgress.sessionId],
    references: [trainingSessions.id],
  }),
}));

export const teamRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
  }),
  members: many(teamMembers),
}));

export const teamMemberRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));
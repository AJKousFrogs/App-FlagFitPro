import { getDatabase, executeRawQuery, isDemoMode, testConnection } from '../lib/neon-db';
import { users, trainingSessions, trainingGoals, analyticsEvents, drills, userProgress, teams, teamMembers } from '../lib/schema';
import { eq, desc, and, or, count, sql } from 'drizzle-orm';

class NeonDatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.demoMode = isDemoMode();
  }

  async initialize() {
    if (this.isInitialized) return this.db;

    if (this.demoMode) {
      console.log('🔧 Running in demo mode - no database connection');
      this.isInitialized = true;
      return null;
    }

    try {
      this.db = getDatabase();
      if (this.db) {
        await testConnection();
        this.isInitialized = true;
        console.log('✅ Neon database service initialized');
      }
      return this.db;
    } catch (error) {
      console.error('❌ Failed to initialize database service:', error);
      this.demoMode = true; // Fallback to demo mode
      return null;
    }
  }

  // Demo data generators
  getDemoUsers() {
    return [
      {
        id: 'demo-user-1',
        email: 'demo@flagfit.com',
        username: 'demo_athlete',
        firstName: 'Demo',
        lastName: 'Athlete',
        role: 'athlete',
        isActive: true,
        createdAt: new Date().toISOString(),
      }
    ];
  }

  getDemoTrainingSessions() {
    return [
      {
        id: 'demo-session-1',
        userId: 'demo-user-1',
        title: 'Speed & Agility Training',
        description: 'Focus on footwork and quick direction changes',
        type: 'drill',
        duration: 45,
        difficulty: 'intermediate',
        status: 'completed',
        scheduledAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        completedAt: new Date(Date.now() - 86400000 + 2700000).toISOString(), // 45 min later
        tags: ['speed', 'agility', 'footwork'],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo-session-2',
        userId: 'demo-user-1',
        title: 'Route Running Practice',
        description: 'Work on precision routes and timing',
        type: 'drill',
        duration: 60,
        difficulty: 'advanced',
        status: 'planned',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        tags: ['routes', 'precision', 'timing'],
        createdAt: new Date().toISOString(),
      }
    ];
  }

  getDemoGoals() {
    return [
      {
        id: 'demo-goal-1',
        userId: 'demo-user-1',
        title: 'Improve 40-yard dash time',
        description: 'Target sub-5.0 seconds',
        type: 'speed',
        targetValue: 500, // 5.00 seconds in centiseconds
        currentValue: 520, // 5.20 seconds
        unit: 'centiseconds',
        priority: 'high',
        status: 'active',
        targetDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
        createdAt: new Date().toISOString(),
      }
    ];
  }

  // User operations
  async getUser(id) {
    if (this.demoMode) {
      return this.getDemoUsers().find(u => u.id === id);
    }

    const db = await this.initialize();
    if (!db) return null;

    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async getUserByEmail(email) {
    if (this.demoMode) {
      return this.getDemoUsers().find(u => u.email === email);
    }

    const db = await this.initialize();
    if (!db) return null;

    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  async createUser(userData) {
    if (this.demoMode) {
      const newUser = {
        id: `demo-user-${Date.now()}`,
        ...userData,
        createdAt: new Date().toISOString(),
      };
      return newUser;
    }

    const db = await this.initialize();
    if (!db) return null;

    try {
      const result = await db.insert(users).values(userData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id, updates) {
    if (this.demoMode) {
      return { id, ...updates, updatedAt: new Date().toISOString() };
    }

    const db = await this.initialize();
    if (!db) return null;

    try {
      const result = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Training Session operations
  async getTrainingSessions(userId, options = {}) {
    if (this.demoMode) {
      return this.getDemoTrainingSessions().filter(s => !userId || s.userId === userId);
    }

    const db = await this.initialize();
    if (!db) return [];

    try {
      let query = db.select().from(trainingSessions);
      
      if (userId) {
        query = query.where(eq(trainingSessions.userId, userId));
      }

      query = query.orderBy(desc(trainingSessions.scheduledAt));

      if (options.limit) {
        query = query.limit(options.limit);
      }

      return await query;
    } catch (error) {
      console.error('Error fetching training sessions:', error);
      return [];
    }
  }

  async createTrainingSession(sessionData) {
    if (this.demoMode) {
      return {
        id: `demo-session-${Date.now()}`,
        ...sessionData,
        createdAt: new Date().toISOString(),
      };
    }

    const db = await this.initialize();
    if (!db) return null;

    try {
      const result = await db.insert(trainingSessions).values(sessionData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating training session:', error);
      throw error;
    }
  }

  // Training Goals operations
  async getTrainingGoals(userId) {
    if (this.demoMode) {
      return this.getDemoGoals().filter(g => !userId || g.userId === userId);
    }

    const db = await this.initialize();
    if (!db) return [];

    try {
      let query = db.select().from(trainingGoals);
      
      if (userId) {
        query = query.where(eq(trainingGoals.userId, userId));
      }

      return await query.orderBy(desc(trainingGoals.createdAt));
    } catch (error) {
      console.error('Error fetching training goals:', error);
      return [];
    }
  }

  async createTrainingGoal(goalData) {
    if (this.demoMode) {
      return {
        id: `demo-goal-${Date.now()}`,
        ...goalData,
        createdAt: new Date().toISOString(),
      };
    }

    const db = await this.initialize();
    if (!db) return null;

    try {
      const result = await db.insert(trainingGoals).values(goalData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating training goal:', error);
      throw error;
    }
  }

  // Analytics operations
  async trackEvent(eventData) {
    if (this.demoMode) {
      console.log('📊 Demo mode - tracking event:', eventData);
      return { id: `demo-event-${Date.now()}`, ...eventData };
    }

    const db = await this.initialize();
    if (!db) return null;

    try {
      const result = await db.insert(analyticsEvents).values(eventData).returning();
      return result[0];
    } catch (error) {
      console.error('Error tracking event:', error);
      return null;
    }
  }

  // Health check
  async healthCheck() {
    if (this.demoMode) {
      return { status: 'demo', message: 'Running in demo mode' };
    }

    try {
      const db = await this.initialize();
      if (!db) {
        return { status: 'error', message: 'Database not available' };
      }

      await testConnection();
      return { status: 'healthy', message: 'Database connection successful' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // Authentication helpers
  async authenticate(email, password) {
    if (this.demoMode) {
      // Demo authentication - accept any credentials
      const demoUser = this.getDemoUsers()[0];
      return {
        user: demoUser,
        token: `demo-token-${Date.now()}`,
        success: true
      };
    }

    // In a real implementation, you would:
    // 1. Hash the password and compare with stored hash
    // 2. Generate a JWT token
    // 3. Return user data and token

    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // TODO: Implement proper password verification
    // For now, returning the user (this is not secure!)
    return {
      user,
      token: `token-${user.id}-${Date.now()}`,
      success: true
    };
  }

  // Utility methods
  isInDemoMode() {
    return this.demoMode;
  }

  async getDashboardStats(userId) {
    if (this.demoMode) {
      return {
        totalSessions: 12,
        completedSessions: 8,
        activeGoals: 3,
        averageSessionDuration: 52
      };
    }

    const db = await this.initialize();
    if (!db) return null;

    try {
      // Get stats using SQL queries
      const [totalSessions] = await db
        .select({ count: count() })
        .from(trainingSessions)
        .where(eq(trainingSessions.userId, userId));

      const [completedSessions] = await db
        .select({ count: count() })
        .from(trainingSessions)
        .where(and(
          eq(trainingSessions.userId, userId),
          eq(trainingSessions.status, 'completed')
        ));

      const [activeGoals] = await db
        .select({ count: count() })
        .from(trainingGoals)
        .where(and(
          eq(trainingGoals.userId, userId),
          eq(trainingGoals.status, 'active')
        ));

      return {
        totalSessions: totalSessions.count,
        completedSessions: completedSessions.count,
        activeGoals: activeGoals.count,
        averageSessionDuration: 45 // Calculate from actual data
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return null;
    }
  }
}

// Export singleton instance
const neonDatabaseService = new NeonDatabaseService();
export default neonDatabaseService;
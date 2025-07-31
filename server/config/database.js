/**
 * Database Configuration
 * Handles Neon PostgreSQL connection
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

class DatabaseService {
  constructor() {
    this.sql = null;
    this.isConnected = false;
    this.connectionString = process.env.DATABASE_URL;
    
    if (!this.connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
  }

  async connect() {
    try {
      this.sql = neon(this.connectionString);
      
      // Test connection
      await this.sql`SELECT 1 as test`;
      
      this.isConnected = true;
      console.log('✅ Database connected successfully');
      return this.sql;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async query(sqlQuery, params = []) {
    if (!this.isConnected || !this.sql) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.sql(sqlQuery, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const result = await this.sql`SELECT NOW() as timestamp, 'healthy' as status`;
      return {
        healthy: true,
        timestamp: result[0]?.timestamp,
        status: result[0]?.status
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  // User operations
  async getUserByEmail(email) {
    const result = await this.sql`
      SELECT id, email, username, first_name, last_name, profile_image, created_at, updated_at
      FROM users 
      WHERE email = ${email}
    `;
    return result[0] || null;
  }

  async getUserById(id) {
    const result = await this.sql`
      SELECT id, email, username, first_name, last_name, profile_image, created_at, updated_at
      FROM users 
      WHERE id = ${id}
    `;
    return result[0] || null;
  }

  async createUser(userData) {
    const { email, username, firstName, lastName, passwordHash } = userData;
    
    const result = await this.sql`
      INSERT INTO users (email, username, first_name, last_name, password_hash)
      VALUES (${email}, ${username}, ${firstName}, ${lastName}, ${passwordHash})
      RETURNING id, email, username, first_name, last_name, created_at
    `;
    return result[0];
  }

  async updateUser(id, updateData) {
    const { email, username, firstName, lastName, profileImage } = updateData;
    
    const result = await this.sql`
      UPDATE users 
      SET 
        email = COALESCE(${email}, email),
        username = COALESCE(${username}, username),
        first_name = COALESCE(${firstName}, first_name),
        last_name = COALESCE(${lastName}, last_name),
        profile_image = COALESCE(${profileImage}, profile_image),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, username, first_name, last_name, profile_image, updated_at
    `;
    return result[0];
  }

  // Training operations
  async getUserTrainingSessions(userId, limit = 50) {
    const result = await this.sql`
      SELECT * FROM training_sessions 
      WHERE user_id = ${userId}
      ORDER BY session_date DESC
      LIMIT ${limit}
    `;
    return result;
  }

  async createTrainingSession(sessionData) {
    const { userId, sessionType, duration, exercises, notes } = sessionData;
    
    const result = await this.sql`
      INSERT INTO training_sessions (user_id, session_type, duration, exercises, notes)
      VALUES (${userId}, ${sessionType}, ${duration}, ${JSON.stringify(exercises)}, ${notes})
      RETURNING *
    `;
    return result[0];
  }

  // Nutrition operations
  async getUserNutritionLogs(userId, limit = 100) {
    const result = await this.sql`
      SELECT * FROM nutrition_logs 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result;
  }

  async createNutritionLog(logData) {
    const { userId, foodName, calories, protein, carbs, fat, mealType } = logData;
    
    const result = await this.sql`
      INSERT INTO nutrition_logs (user_id, food_name, calories, protein, carbs, fat, meal_type)
      VALUES (${userId}, ${foodName}, ${calories}, ${protein}, ${carbs}, ${fat}, ${mealType})
      RETURNING *
    `;
    return result[0];
  }

  // Analytics operations
  async logAnalyticsEvent(eventData) {
    const { userId, eventType, eventData: data, sessionId, pageUrl, userAgent } = eventData;
    
    const result = await this.sql`
      INSERT INTO analytics_events (user_id, event_type, event_data, session_id, page_url, user_agent)
      VALUES (${userId}, ${eventType}, ${JSON.stringify(data)}, ${sessionId}, ${pageUrl}, ${userAgent})
      RETURNING *
    `;
    return result[0];
  }
}

// Export singleton instance
const db = new DatabaseService();
export default db;
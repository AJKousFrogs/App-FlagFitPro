import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Sample data for dashboard
const sampleData = {
  // Training sessions
  trainingSessions: [
    {
      user_id: "1",
      session_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      session_type: "Speed & Agility",
      status: "completed",
      duration_minutes: 90,
      performance_score: 8.5,
    },
    {
      user_id: "1",
      session_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      session_type: "Route Running",
      status: "completed",
      duration_minutes: 75,
      performance_score: 8.8,
    },
    {
      user_id: "1",
      session_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      session_type: "Strength Training",
      status: "completed",
      duration_minutes: 120,
      performance_score: 8.2,
    },
    {
      user_id: "1",
      session_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      session_type: "Film Study",
      status: "completed",
      duration_minutes: 60,
      performance_score: 9.0,
    },
    {
      user_id: "1",
      session_date: new Date(), // Today
      session_type: "Olympic Prep",
      status: "active",
      duration_minutes: 150,
      performance_score: null,
    },
    {
      user_id: "1",
      session_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      session_type: "Recovery",
      status: "scheduled",
      duration_minutes: 45,
      performance_score: null,
    },
    {
      user_id: "1",
      session_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      session_type: "Game Day",
      status: "scheduled",
      duration_minutes: 180,
      performance_score: null,
    },
  ],

  // Performance metrics
  performanceMetrics: [
    {
      user_id: "1",
      performance_score: 8.4,
      metric_type: "overall",
      created_at: new Date(),
    },
    {
      user_id: "1",
      performance_score: 8.7,
      metric_type: "overall",
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: "1",
      performance_score: 8.1,
      metric_type: "overall",
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  ],

  // Team chemistry
  teamChemistry: [
    {
      user_id: "1",
      chemistry_score: 8.4,
      communication_score: 9.1,
      trust_score: 8.7,
      leadership_score: 8.2,
      created_at: new Date(),
    },
  ],

  // Olympic qualification
  olympicQualification: [
    {
      user_id: "1",
      qualification_probability: 73,
      world_ranking: 8,
      days_until_championship: 124,
      european_championship_date: "2025-09-24",
      world_championship_date: "2026-07-15",
      olympic_date: "2028-07-14",
      created_at: new Date(),
    },
  ],

  // Performance benchmarks
  performanceBenchmarks: [
    {
      user_id: "1",
      metric_name: "40-Yard Dash",
      current_value: 4.52,
      target_value: 4.4,
      unit: "s",
    },
    {
      user_id: "1",
      metric_name: "Passing Accuracy",
      current_value: 82.5,
      target_value: 85,
      unit: "%",
    },
    {
      user_id: "1",
      metric_name: "Agility Shuttle",
      current_value: 4.18,
      target_value: 4.0,
      unit: "s",
    },
    {
      user_id: "1",
      metric_name: "Game IQ Score",
      current_value: 87,
      target_value: 90,
      unit: "",
    },
  ],

  // Sponsor rewards
  sponsorRewards: [
    {
      user_id: "1",
      available_points: 2847,
      current_tier: "GOLD",
      products_available: 236,
      tier_progress_percentage: 65,
      created_at: new Date(),
    },
  ],

  // Sponsor products
  sponsorProducts: [
    {
      product_name: "Pro Grip Football Socks",
      points_cost: 350,
      relevance_score: 92,
      category: "Gear",
      is_featured: true,
    },
    {
      product_name: "Recovery Massage Gun",
      points_cost: 1650,
      relevance_score: 78,
      category: "Recovery",
      is_featured: true,
    },
    {
      product_name: "Elite Training Shorts",
      points_cost: 780,
      relevance_score: 89,
      category: "Gear",
      is_featured: true,
    },
    {
      product_name: "Recovery Band Set",
      points_cost: 420,
      relevance_score: 94,
      category: "Recovery",
      is_featured: true,
    },
  ],

  // Wearables data
  wearablesData: [
    {
      user_id: "1",
      device_type: "Apple Watch",
      heart_rate: 142,
      hrv: 38,
      sleep_score: 87,
      training_load: 247,
      last_sync: new Date(),
      connection_status: "connected",
    },
  ],

  // Notifications
  notifications: [
    {
      user_id: "1",
      notification_type: "injury_risk",
      message: "Injury risk alert: Landing mechanics suboptimal",
      is_read: false,
      priority: "high",
      created_at: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      user_id: "1",
      notification_type: "weather",
      message: "Weather alert: Tomorrow's practice moved to 6PM",
      is_read: false,
      priority: "medium",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      user_id: "1",
      notification_type: "tournament",
      message: "European Championship bracket updated",
      is_read: false,
      priority: "low",
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  ],

  // Daily quotes
  dailyQuotes: [
    {
      quote_text:
        "Champions aren't made in comfort zones. Today's training is tomorrow's victory.",
      author: "FlagFit Pro",
      category: "motivation",
      is_active: true,
    },
    {
      quote_text:
        "The difference between the impossible and the possible lies in determination.",
      author: "Tommy Lasorda",
      category: "motivation",
      is_active: true,
    },
    {
      quote_text:
        "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.",
      author: "Pelé",
      category: "motivation",
      is_active: true,
    },
  ],
};

// Create tables if they don't exist
const createTables = async () => {
  try {
    // Training sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS training_sessions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        session_date DATE NOT NULL,
        session_type VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        duration_minutes INTEGER,
        performance_score DECIMAL(3,1),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Performance metrics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        performance_score DECIMAL(3,1) NOT NULL,
        metric_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Team chemistry table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_chemistry (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        chemistry_score DECIMAL(3,1) NOT NULL,
        communication_score DECIMAL(3,1),
        trust_score DECIMAL(3,1),
        leadership_score DECIMAL(3,1),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Olympic qualification table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS olympic_qualification (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        qualification_probability INTEGER,
        world_ranking INTEGER,
        days_until_championship INTEGER,
        european_championship_date DATE,
        world_championship_date DATE,
        olympic_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Performance benchmarks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS performance_benchmarks (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        metric_name VARCHAR(255) NOT NULL,
        current_value DECIMAL(6,2),
        target_value DECIMAL(6,2),
        unit VARCHAR(10)
      )
    `);

    // Sponsor rewards table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sponsor_rewards (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        available_points INTEGER DEFAULT 0,
        current_tier VARCHAR(50) DEFAULT 'BRONZE',
        products_available INTEGER DEFAULT 0,
        tier_progress_percentage INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sponsor products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sponsor_products (
        id SERIAL PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        points_cost INTEGER NOT NULL,
        relevance_score INTEGER,
        category VARCHAR(100),
        is_featured BOOLEAN DEFAULT false
      )
    `);

    // Wearables data table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wearables_data (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        device_type VARCHAR(100),
        heart_rate INTEGER,
        hrv INTEGER,
        sleep_score INTEGER,
        training_load INTEGER,
        last_sync TIMESTAMP,
        connection_status VARCHAR(50)
      )
    `);

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        notification_type VARCHAR(100),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        priority VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Daily quotes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_quotes (
        id SERIAL PRIMARY KEY,
        quote_text TEXT NOT NULL,
        author VARCHAR(255),
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ All tables created successfully");
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    throw error;
  }
};

// Insert sample data
const insertSampleData = async () => {
  try {
    // Insert training sessions
    for (const session of sampleData.trainingSessions) {
      await pool.query(
        `
        INSERT INTO training_sessions (user_id, session_date, session_type, status, duration_minutes, performance_score)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          session.user_id,
          session.session_date,
          session.session_type,
          session.status,
          session.duration_minutes,
          session.performance_score,
        ],
      );
    }

    // Insert performance metrics
    for (const metric of sampleData.performanceMetrics) {
      await pool.query(
        `
        INSERT INTO performance_metrics (user_id, performance_score, metric_type, created_at)
        VALUES ($1, $2, $3, $4)
      `,
        [
          metric.user_id,
          metric.performance_score,
          metric.metric_type,
          metric.created_at,
        ],
      );
    }

    // Insert team chemistry
    for (const chemistry of sampleData.teamChemistry) {
      await pool.query(
        `
        INSERT INTO team_chemistry (user_id, chemistry_score, communication_score, trust_score, leadership_score, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          chemistry.user_id,
          chemistry.chemistry_score,
          chemistry.communication_score,
          chemistry.trust_score,
          chemistry.leadership_score,
          chemistry.created_at,
        ],
      );
    }

    // Insert Olympic qualification
    for (const olympic of sampleData.olympicQualification) {
      await pool.query(
        `
        INSERT INTO olympic_qualification (user_id, qualification_probability, world_ranking, days_until_championship, european_championship_date, world_championship_date, olympic_date, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
        [
          olympic.user_id,
          olympic.qualification_probability,
          olympic.world_ranking,
          olympic.days_until_championship,
          olympic.european_championship_date,
          olympic.world_championship_date,
          olympic.olympic_date,
          olympic.created_at,
        ],
      );
    }

    // Insert performance benchmarks
    for (const benchmark of sampleData.performanceBenchmarks) {
      await pool.query(
        `
        INSERT INTO performance_benchmarks (user_id, metric_name, current_value, target_value, unit)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          benchmark.user_id,
          benchmark.metric_name,
          benchmark.current_value,
          benchmark.target_value,
          benchmark.unit,
        ],
      );
    }

    // Insert sponsor rewards
    for (const reward of sampleData.sponsorRewards) {
      await pool.query(
        `
        INSERT INTO sponsor_rewards (user_id, available_points, current_tier, products_available, tier_progress_percentage, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          reward.user_id,
          reward.available_points,
          reward.current_tier,
          reward.products_available,
          reward.tier_progress_percentage,
          reward.created_at,
        ],
      );
    }

    // Insert sponsor products
    for (const product of sampleData.sponsorProducts) {
      await pool.query(
        `
        INSERT INTO sponsor_products (product_name, points_cost, relevance_score, category, is_featured)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          product.product_name,
          product.points_cost,
          product.relevance_score,
          product.category,
          product.is_featured,
        ],
      );
    }

    // Insert wearables data
    for (const wearable of sampleData.wearablesData) {
      await pool.query(
        `
        INSERT INTO wearables_data (user_id, device_type, heart_rate, hrv, sleep_score, training_load, last_sync, connection_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
        [
          wearable.user_id,
          wearable.device_type,
          wearable.heart_rate,
          wearable.hrv,
          wearable.sleep_score,
          wearable.training_load,
          wearable.last_sync,
          wearable.connection_status,
        ],
      );
    }

    // Insert notifications
    for (const notification of sampleData.notifications) {
      await pool.query(
        `
        INSERT INTO notifications (user_id, notification_type, message, is_read, priority, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          notification.user_id,
          notification.notification_type,
          notification.message,
          notification.is_read,
          notification.priority,
          notification.created_at,
        ],
      );
    }

    // Insert daily quotes
    for (const quote of sampleData.dailyQuotes) {
      await pool.query(
        `
        INSERT INTO daily_quotes (quote_text, author, category, is_active)
        VALUES ($1, $2, $3, $4)
      `,
        [quote.quote_text, quote.author, quote.category, quote.is_active],
      );
    }

    console.log("✅ Sample data inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting sample data:", error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    console.log("🚀 Starting dashboard data seeding...");

    await createTables();
    await insertSampleData();

    console.log("🎉 Dashboard data seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("💥 Dashboard data seeding failed:", error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

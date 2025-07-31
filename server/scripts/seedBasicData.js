/**
 * Basic Database Seeder
 * Seeds essential data for the FlagFit Pro application
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const sql = neon(process.env.DATABASE_URL);

// Sample users data
const sampleUsers = [
  {
    email: 'coach@flagfit.com',
    first_name: 'Mike',
    last_name: 'Johnson',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWK.3nE8WYWj8w7WCTzSO5UK', // password: 'coach123'
    position: 'QB'
  },
  {
    email: 'player@flagfit.com',
    first_name: 'Alex',
    last_name: 'Thompson',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWK.3nE8WYWj8w7WCTzSO5UK', // password: 'player123'
    position: 'WR'  
  }
];

// Sample food categories
const foodCategories = [
  { id: 1, category_name: 'Proteins', description: 'Meat, fish, eggs, dairy', color_code: '#FF6B6B', display_order: 1, is_active: true },
  { id: 2, category_name: 'Carbohydrates', description: 'Grains, fruits, vegetables', color_code: '#4ECDC4', display_order: 2, is_active: true },
  { id: 3, category_name: 'Fats', description: 'Oils, nuts, avocados', color_code: '#45B7D1', display_order: 3, is_active: true },
  { id: 4, category_name: 'Vegetables', description: 'Fresh and cooked vegetables', color_code: '#96CEB4', display_order: 4, is_active: true },
  { id: 5, category_name: 'Fruits', description: 'Fresh and dried fruits', color_code: '#FFEAA7', display_order: 5, is_active: true }
];

// Sample food items
const foodItems = [
  {
    id: 1,
    food_name: 'Chicken Breast',
    calories_per_100g: 165,
    protein_per_100g: 31,
    carbs_per_100g: 0,
    fat_per_100g: 3.6,
    category: 'Proteins',
    brand: null
  },
  {
    id: 2,
    food_name: 'Brown Rice',
    calories_per_100g: 111,
    protein_per_100g: 2.6,
    carbs_per_100g: 23,
    fat_per_100g: 0.9,
    category: 'Carbohydrates',
    brand: null
  },
  {
    id: 3,
    food_name: 'Banana',
    calories_per_100g: 89,
    protein_per_100g: 1.1,
    carbs_per_100g: 23,
    fat_per_100g: 0.3,
    category: 'Fruits',
    brand: null
  },
  {
    id: 4,
    food_name: 'Salmon',
    calories_per_100g: 208,
    protein_per_100g: 25,
    carbs_per_100g: 0,
    fat_per_100g: 12,
    category: 'Proteins',
    brand: null
  },
  {
    id: 5,
    food_name: 'Sweet Potato',
    calories_per_100g: 86,
    protein_per_100g: 1.6,
    carbs_per_100g: 20,
    fat_per_100g: 0.1,
    category: 'Carbohydrates',
    brand: null
  }
];

// Sample training categories
const trainingCategories = [
  {
    id: 1,
    name: 'Speed Training',
    description: 'Exercises to improve running speed and acceleration',
    difficulty_level: 'intermediate',
    equipment_needed: ['cones', 'timer'],
    focus_areas: ['acceleration', 'top_speed', 'deceleration'],
    estimated_duration: 30,
    display_order: 1,
    is_active: true
  },
  {
    id: 2,
    name: 'Agility Drills',
    description: 'Quick direction changes and footwork drills',
    difficulty_level: 'beginner',
    equipment_needed: ['cones', 'ladder'],
    focus_areas: ['footwork', 'direction_change', 'coordination'],
    estimated_duration: 25,
    display_order: 2,
    is_active: true
  },
  {
    id: 3,
    name: 'Route Running',
    description: 'Practice flag football routes and patterns',
    difficulty_level: 'intermediate',
    equipment_needed: ['cones', 'flags'],
    focus_areas: ['route_precision', 'timing', 'cuts'],
    estimated_duration: 35,
    display_order: 3,
    is_active: true
  }
];

// Sample AI coach knowledge
const aiCoachKnowledge = [
  {
    id: 1,
    knowledge_type: 'training_tip',
    title: 'Pre-Training Warm-up',
    content: 'Always start with 5-10 minutes of dynamic warm-up including leg swings, high knees, and butt kicks to prepare your muscles and prevent injury.',
    confidence_score: 0.95,
    source: 'Sports Science Research',
    tags: ['warmup', 'injury_prevention']
  },
  {
    id: 2,
    knowledge_type: 'nutrition_tip',
    title: 'Post-Workout Protein',
    content: 'Consume 20-30g of protein within 30 minutes after training to optimize muscle recovery and adaptation.',
    confidence_score: 0.90,
    source: 'Sports Nutrition Guidelines',
    tags: ['recovery', 'protein', 'timing']
  },
  {
    id: 3,
    knowledge_type: 'training_recommendation',
    title: 'Speed Development',
    content: 'Focus on acceleration mechanics first, then gradually increase distance. Quality over quantity - full recovery between sprints.',
    confidence_score: 0.88,
    source: 'Track and Field Coaching Manual',
    tags: ['speed', 'progression', 'recovery']
  }
];

// Sample recovery protocols
const recoveryProtocols = [
  {
    id: 1,
    protocol_name: 'Active Recovery Walk',
    description: 'Light 15-20 minute walk to promote blood flow and reduce muscle stiffness',
    duration_minutes: 20,
    equipment_needed: [],
    target_recovery_type: 'active',
    effectiveness_rating: 8,
    is_active: true
  },
  {
    id: 2,
    protocol_name: 'Foam Rolling Session',
    description: 'Full body foam rolling focusing on major muscle groups',
    duration_minutes: 15,
    equipment_needed: ['foam_roller'],
    target_recovery_type: 'muscle_recovery',
    effectiveness_rating: 9,
    is_active: true
  },
  {
    id: 3,
    protocol_name: 'Ice Bath',
    description: 'Cold water immersion for inflammation reduction',
    duration_minutes: 10,
    equipment_needed: ['ice_bath'],
    target_recovery_type: 'inflammation',
    effectiveness_rating: 9,
    is_active: true
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Clearing existing data...');
    
    await sql`DELETE FROM nutrition_logs`;
    await sql`DELETE FROM training_sessions`;
    await sql`DELETE FROM recovery_protocols`;
    await sql`DELETE FROM ai_coach_knowledge`;
    await sql`DELETE FROM enhanced_training_categories`;
    await sql`DELETE FROM food_items`;
    await sql`DELETE FROM food_categories`;
    await sql`DELETE FROM users`;

    // Skip sequence reset as they may not exist yet

    // Seed users
    console.log('👥 Seeding users...');
    for (const user of sampleUsers) {
      await sql`
        INSERT INTO users (email, first_name, last_name, password_hash, position)
        VALUES (${user.email}, ${user.first_name}, ${user.last_name}, ${user.password_hash}, ${user.position})
      `;
    }

    // Seed food categories
    console.log('🍎 Seeding food categories...');
    for (const category of foodCategories) {
      await sql`
        INSERT INTO food_categories (id, category_name, description, color_code, display_order, is_active)
        VALUES (${category.id}, ${category.category_name}, ${category.description}, ${category.color_code}, ${category.display_order}, ${category.is_active})
      `;
    }

    // Seed food items
    console.log('🥗 Seeding food items...');
    for (const food of foodItems) {
      await sql`
        INSERT INTO food_items (id, food_name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category, brand)
        VALUES (${food.id}, ${food.food_name}, ${food.calories_per_100g}, ${food.protein_per_100g}, ${food.carbs_per_100g}, ${food.fat_per_100g}, ${food.category}, ${food.brand})
      `;
    }

    // Seed training categories
    console.log('🏃 Seeding training categories...');
    for (const category of trainingCategories) {
      await sql`
        INSERT INTO enhanced_training_categories (id, name, description, difficulty_level, equipment_needed, focus_areas, estimated_duration, display_order, is_active)
        VALUES (${category.id}, ${category.name}, ${category.description}, ${category.difficulty_level}, ${JSON.stringify(category.equipment_needed)}, ${JSON.stringify(category.focus_areas)}, ${category.estimated_duration}, ${category.display_order}, ${category.is_active})
      `;
    }

    // Seed AI coach knowledge
    console.log('🤖 Seeding AI coach knowledge...');
    for (const knowledge of aiCoachKnowledge) {
      await sql`
        INSERT INTO ai_coach_knowledge (id, knowledge_type, title, content, confidence_score, source, tags)
        VALUES (${knowledge.id}, ${knowledge.knowledge_type}, ${knowledge.title}, ${knowledge.content}, ${knowledge.confidence_score}, ${knowledge.source}, ${JSON.stringify(knowledge.tags)})
      `;
    }

    // Seed recovery protocols
    console.log('💆 Seeding recovery protocols...');
    for (const protocol of recoveryProtocols) {
      await sql`
        INSERT INTO recovery_protocols (id, protocol_name, description, duration_minutes, equipment_needed, target_recovery_type, effectiveness_rating, is_active)
        VALUES (${protocol.id}, ${protocol.protocol_name}, ${protocol.description}, ${protocol.duration_minutes}, ${JSON.stringify(protocol.equipment_needed)}, ${protocol.target_recovery_type}, ${protocol.effectiveness_rating}, ${protocol.is_active})
      `;
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Data Summary:
- Users: ${sampleUsers.length}
- Food Categories: ${foodCategories.length}
- Food Items: ${foodItems.length}
- Training Categories: ${trainingCategories.length}
- AI Coach Knowledge: ${aiCoachKnowledge.length}
- Recovery Protocols: ${recoveryProtocols.length}

🔑 Test Accounts:
- Coach: coach@flagfit.com / coach123
- Player: player@flagfit.com / player123
    `);

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedDatabase;
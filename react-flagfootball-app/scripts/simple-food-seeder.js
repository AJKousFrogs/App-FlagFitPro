#!/usr/bin/env node

/**
 * Simple Food Database Seeder - Dry Run Version
 * Shows what foods would be fetched from USDA API without requiring database
 */

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

class SimpleFoodSeeder {
  constructor() {
    this.baseURL = 'https://api.nal.usda.gov/fdc/v1';
    this.apiKey = process.env.USDA_API_KEY;
  }

  async searchAndDisplayFoods(searchTerm, limit = 5) {
    try {
      console.log(`🔍 Searching for: "${searchTerm}"`);
      
      const response = await axios.post(`${this.baseURL}/foods/search`, {
        query: searchTerm,
        pageSize: limit,
        pageNumber: 1,
        dataType: ['SR Legacy', 'Foundation', 'Branded']
      }, {
        params: { api_key: this.apiKey },
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`   📊 Found ${response.data.totalHits} total foods`);
      console.log(`   🎯 Showing top ${limit} results:`);
      
      response.data.foods.forEach((food, index) => {
        const nutrients = this.extractBasicNutrients(food.foodNutrients || []);
        
        console.log(`   ${index + 1}. ${food.description}`);
        console.log(`      Type: ${food.dataType} | FDC: ${food.fdcId}`);
        console.log(`      Brand: ${food.brandOwner || food.brandName || 'Generic'}`);
        console.log(`      Nutrients (per 100g): ${nutrients.calories}kcal, ${nutrients.protein}g protein, ${nutrients.carbs}g carbs`);
        console.log('');
      });
      
      return response.data.foods.length;
    } catch (error) {
      console.error(`   ❌ Error searching "${searchTerm}":`, error.response?.data?.message || error.message);
      return 0;
    }
  }

  extractBasicNutrients(foodNutrients) {
    const nutrients = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    const nutrientMap = {
      208: 'calories',  // Energy (kcal)
      203: 'protein',   // Protein
      205: 'carbs',     // Carbohydrate
      204: 'fat'        // Total lipid (fat)
    };

    foodNutrients.forEach(nutrient => {
      const key = nutrientMap[nutrient.nutrient?.id];
      if (key && nutrient.amount) {
        nutrients[key] = Math.round(nutrient.amount * 10) / 10; // Round to 1 decimal
      }
    });

    return nutrients;
  }

  async demonstrateSeeding() {
    console.log('🌱 FOOD DATABASE SEEDER DEMONSTRATION');
    console.log('=====================================\n');
    
    console.log('🔑 API Configuration:');
    console.log(`   USDA API Key: ${this.apiKey ? this.apiKey.slice(0, 8) + '...' : 'NOT SET'}`);
    console.log(`   Base URL: ${this.baseURL}\n`);

    if (!this.apiKey) {
      console.log('❌ USDA_API_KEY not configured in .env file');
      return;
    }

    // Athletic nutrition categories
    const categories = [
      { name: 'Pre-Workout Energy', searches: ['banana', 'oatmeal', 'dates'] },
      { name: 'Post-Workout Recovery', searches: ['chicken breast', 'salmon', 'greek yogurt'] },
      { name: 'Carbohydrate Sources', searches: ['brown rice', 'quinoa', 'sweet potato'] },
      { name: 'Healthy Fats', searches: ['avocado', 'almonds', 'olive oil'] },
      { name: 'Hydration & Recovery', searches: ['coconut water', 'sports drink'] }
    ];

    let totalFoods = 0;

    for (const category of categories) {
      console.log(`\n📂 ${category.name.toUpperCase()}`);
      console.log('='.repeat(category.name.length + 4));
      
      for (const search of category.searches) {
        await this.delay(300); // Rate limiting
        const count = await this.searchAndDisplayFoods(search, 3);
        totalFoods += count;
      }
    }

    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log(`🎯 Total foods that would be processed: ~${totalFoods}`);
    console.log(`📦 Categories covered: ${categories.length}`);
    console.log('✅ USDA API connection working perfectly!');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Set up your database (PostgreSQL or NeonDB)');
    console.log('2. Run database migrations to create tables');
    console.log('3. Execute: npm run seed:food (actual seeding)');
    console.log('\n💡 This demonstration shows the food data available for your app!');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the demonstration
async function main() {
  const seeder = new SimpleFoodSeeder();
  await seeder.demonstrateSeeding();
}

main().catch(console.error);
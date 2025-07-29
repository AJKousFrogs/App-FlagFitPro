import USDAFoodDataService from './external/USDAFoodDataService.js';

class FoodDatabaseSeeder {
  constructor(database) {
    this.db = database;
    this.usdaService = new USDAFoodDataService();
  }

  // Seed database with athletic-focused foods
  async seedAthleticFoods() {
    console.log('🚀 Starting athletic food database seeding...');
    
    try {
      // Define athletic nutrition categories with search terms
      const athleticFoodCategories = [
        // Pre-workout energy foods
        { category: 'pre_workout', searches: ['banana', 'oatmeal', 'whole grain bread', 'dates', 'honey'] },
        
        // Post-workout recovery foods
        { category: 'post_workout', searches: ['chicken breast', 'lean beef', 'salmon', 'tuna', 'eggs', 'greek yogurt', 'cottage cheese', 'protein powder'] },
        
        // Carbohydrate sources
        { category: 'carbs', searches: ['brown rice', 'quinoa', 'sweet potato', 'pasta whole wheat', 'bagel', 'rice cakes'] },
        
        // Healthy fats
        { category: 'fats', searches: ['avocado', 'almonds', 'peanut butter', 'olive oil', 'salmon', 'nuts mixed'] },
        
        // Hydration and recovery
        { category: 'hydration', searches: ['coconut water', 'sports drink', 'chocolate milk', 'water'] },
        
        // Fruits for vitamins and quick energy
        { category: 'fruits', searches: ['apple', 'orange', 'berries mixed', 'strawberries', 'blueberries', 'grapes'] },
        
        // Vegetables for micronutrients
        { category: 'vegetables', searches: ['spinach', 'broccoli', 'carrots', 'bell peppers', 'tomatoes', 'kale'] },
        
        // Common snacks and convenience foods
        { category: 'snacks', searches: ['energy bar', 'granola bar', 'trail mix', 'crackers', 'pretzels'] }
      ];

      let totalFoodsAdded = 0;
      const errors = [];

      for (const { category, searches } of athleticFoodCategories) {
        console.log(`📂 Processing ${category} foods...`);
        
        for (const searchTerm of searches) {
          try {
            await this.delay(200); // Rate limiting - 5 requests per second
            
            const searchResults = await this.usdaService.searchFoods(searchTerm, 10, 1);
            
            for (const food of searchResults.foods) {
              try {
                const added = await this.addFoodToDatabase(food);
                if (added) {
                  totalFoodsAdded++;
                  console.log(`✅ Added: ${food.name}`);
                }
              } catch (error) {
                console.log(`⚠️ Skipped: ${food.name} (${error.message})`);
                errors.push({ food: food.name, error: error.message });
              }
            }
            
            console.log(`   ✅ Processed search: "${searchTerm}" (${searchResults.foods.length} foods)`);
          } catch (error) {
            console.error(`❌ Error searching for "${searchTerm}":`, error.message);
            errors.push({ search: searchTerm, error: error.message });
          }
        }
      }

      // Add some manually curated foods for sports nutrition
      await this.addManualSportsNutritionFoods();

      console.log(`🎉 Food database seeding completed!`);
      console.log(`📊 Total foods added: ${totalFoodsAdded}`);
      console.log(`⚠️ Errors encountered: ${errors.length}`);
      
      if (errors.length > 0) {
        console.log('Error summary:', errors.slice(0, 10)); // Show first 10 errors
      }

      return {
        success: true,
        totalAdded: totalFoodsAdded,
        errors
      };

    } catch (error) {
      console.error('💥 Critical error during food seeding:', error);
      throw error;
    }
  }

  // Add a single food item to database
  async addFoodToDatabase(foodData) {
    try {
      // Check if food already exists
      const existingFood = await this.db.query(
        'SELECT id FROM food_items WHERE name = $1 AND (brand = $2 OR (brand IS NULL AND $2 IS NULL))',
        [foodData.name, foodData.brand]
      );

      if (existingFood.rows.length > 0) {
        return false; // Already exists
      }

      const query = `
        INSERT INTO food_items (
          name, brand, barcode, category, calories_per_100g, protein_per_100g,
          carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g,
          vitamin_c_per_100g, vitamin_d_per_100g, calcium_per_100g, iron_per_100g, 
          potassium_per_100g, default_serving_size, default_serving_description,
          glycemic_index, performance_category, digestibility_rating, source, verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING id
      `;

      const result = await this.db.query(query, [
        foodData.name,
        foodData.brand,
        foodData.upc,
        foodData.category,
        foodData.calories_per_100g,
        foodData.protein_per_100g,
        foodData.carbs_per_100g,
        foodData.fat_per_100g,
        foodData.fiber_per_100g,
        foodData.sugar_per_100g,
        foodData.sodium_per_100g,
        foodData.vitamin_c_per_100g,
        foodData.vitamin_d_per_100g,
        foodData.calcium_per_100g,
        foodData.iron_per_100g,
        foodData.potassium_per_100g,
        foodData.default_serving_size,
        foodData.default_serving_description,
        foodData.glycemic_index,
        foodData.performance_category,
        foodData.digestibility_rating,
        foodData.source,
        foodData.verified
      ]);

      return result.rows[0].id;
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        return false; // Duplicate
      }
      throw error;
    }
  }

  // Add manually curated sports nutrition foods
  async addManualSportsNutritionFoods() {
    console.log('📝 Adding manual sports nutrition foods...');
    
    const manualFoods = [
      {
        name: 'Sports Drink - Electrolyte',
        brand: 'Generic',
        category: 'beverages',
        calories_per_100g: 25,
        protein_per_100g: 0,
        carbs_per_100g: 6,
        fat_per_100g: 0,
        sodium_per_100g: 100,
        potassium_per_100g: 50,
        default_serving_size: 500,
        default_serving_description: '500ml bottle',
        performance_category: 'hydration',
        digestibility_rating: 5,
        source: 'manual',
        verified: true
      },
      {
        name: 'Recovery Smoothie - Banana Protein',
        brand: 'Generic',
        category: 'beverages',
        calories_per_100g: 80,
        protein_per_100g: 8,
        carbs_per_100g: 12,
        fat_per_100g: 1,
        potassium_per_100g: 200,
        default_serving_size: 300,
        default_serving_description: '300ml serving',
        performance_category: 'post_workout',
        digestibility_rating: 4,
        source: 'manual',
        verified: true
      },
      {
        name: 'Energy Gel - Carbohydrate',
        brand: 'Generic',
        category: 'snacks',
        calories_per_100g: 300,
        protein_per_100g: 0,
        carbs_per_100g: 75,
        fat_per_100g: 0,
        sodium_per_100g: 150,
        default_serving_size: 30,
        default_serving_description: '1 gel packet',
        glycemic_index: 85,
        performance_category: 'pre_workout',
        digestibility_rating: 5,
        source: 'manual',
        verified: true
      },
      {
        name: 'Post-Workout Protein Bar',
        brand: 'Generic',
        category: 'snacks',
        calories_per_100g: 400,
        protein_per_100g: 25,
        carbs_per_100g: 35,
        fat_per_100g: 15,
        fiber_per_100g: 5,
        default_serving_size: 50,
        default_serving_description: '1 bar',
        performance_category: 'post_workout',
        digestibility_rating: 3,
        source: 'manual',
        verified: true
      }
    ];

    let addedCount = 0;
    for (const food of manualFoods) {
      try {
        const added = await this.addFoodToDatabase(food);
        if (added) {
          addedCount++;
          console.log(`✅ Added manual food: ${food.name}`);
        }
      } catch (error) {
        console.log(`⚠️ Failed to add manual food: ${food.name} - ${error.message}`);
      }
    }

    console.log(`📝 Added ${addedCount} manual sports nutrition foods`);
  }

  // Seed common meal templates
  async seedMealTemplates() {
    console.log('🍽️ Seeding meal templates...');

    const templates = [
      {
        name: 'Pre-Training Energy Bowl',
        description: 'Quick energy before training with easily digestible carbs',
        meal_type: 'pre_workout',
        prep_time_minutes: 5,
        suitable_for_training_day: true,
        performance_rating: 5,
        energy_level: 'high',
        digestibility: 'easy',
        tags: ['quick', 'energy', 'pre_workout'],
        is_public: true
      },
      {
        name: 'Post-Training Recovery Meal',
        description: 'Protein and carbs for optimal recovery',
        meal_type: 'post_workout',
        prep_time_minutes: 15,
        suitable_for_training_day: true,
        performance_rating: 5,
        energy_level: 'moderate',
        digestibility: 'moderate',
        tags: ['recovery', 'protein', 'post_workout'],
        is_public: true
      },
      {
        name: 'Game Day Breakfast',
        description: 'Sustained energy for competition day',
        meal_type: 'breakfast',
        prep_time_minutes: 10,
        suitable_for_game_day: true,
        performance_rating: 5,
        energy_level: 'high',
        digestibility: 'easy',
        tags: ['game_day', 'breakfast', 'sustained_energy'],
        is_public: true
      },
      {
        name: 'Hydration Smoothie',
        description: 'Electrolyte-rich smoothie for hydration',
        meal_type: 'snack',
        prep_time_minutes: 3,
        suitable_for_training_day: true,
        performance_rating: 4,
        energy_level: 'moderate',
        digestibility: 'easy',
        tags: ['hydration', 'quick', 'smoothie'],
        is_public: true
      }
    ];

    let addedTemplates = 0;
    for (const template of templates) {
      try {
        const query = `
          INSERT INTO meal_templates (
            name, description, meal_type, prep_time_minutes, suitable_for_training_day,
            suitable_for_game_day, performance_rating, energy_level, digestibility,
            tags, is_public
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (name) DO NOTHING
          RETURNING id
        `;

        const result = await this.db.query(query, [
          template.name,
          template.description,
          template.meal_type,
          template.prep_time_minutes,
          template.suitable_for_training_day,
          template.suitable_for_game_day || false,
          template.performance_rating,
          template.energy_level,
          template.digestibility,
          template.tags,
          template.is_public
        ]);

        if (result.rows.length > 0) {
          addedTemplates++;
          console.log(`✅ Added meal template: ${template.name}`);
        }
      } catch (error) {
        console.log(`⚠️ Failed to add meal template: ${template.name} - ${error.message}`);
      }
    }

    console.log(`🍽️ Added ${addedTemplates} meal templates`);
  }

  // Update food performance categories based on nutritional analysis
  async updatePerformanceCategories() {
    console.log('🔄 Updating food performance categories...');

    const updates = [
      {
        condition: 'carbs_per_100g > 60 AND fat_per_100g < 5 AND protein_per_100g < 10',
        category: 'pre_workout',
        description: 'High carb, low fat foods for quick energy'
      },
      {
        condition: 'protein_per_100g > 20 OR (protein_per_100g > 15 AND carbs_per_100g > 10)',
        category: 'post_workout',
        description: 'High protein foods for recovery'
      },
      {
        condition: 'category = \'vegetables\' OR vitamin_c_per_100g > 20',
        category: 'recovery',
        description: 'Anti-inflammatory foods for recovery'
      },
      {
        condition: 'category = \'beverages\'',
        category: 'hydration',
        description: 'Beverages for hydration'
      }
    ];

    let totalUpdated = 0;
    for (const update of updates) {
      try {
        const query = `
          UPDATE food_items 
          SET performance_category = $1
          WHERE ${update.condition} AND performance_category IS NULL
        `;

        const result = await this.db.query(query, [update.category]);
        totalUpdated += result.rowCount;
        console.log(`✅ ${update.description}: ${result.rowCount} foods updated`);
      } catch (error) {
        console.log(`⚠️ Failed to update ${update.description}: ${error.message}`);
      }
    }

    console.log(`🔄 Total foods updated: ${totalUpdated}`);
  }

  // Verify and fix nutritional data
  async verifyNutritionalData() {
    console.log('🔍 Verifying nutritional data...');

    // Check for foods with missing essential nutrients
    const missingNutrients = await this.db.query(`
      SELECT COUNT(*) as count
      FROM food_items
      WHERE calories_per_100g = 0 OR calories_per_100g IS NULL
    `);

    console.log(`⚠️ Foods with missing calories: ${missingNutrients.rows[0].count}`);

    // Update digestibility ratings based on fiber content
    await this.db.query(`
      UPDATE food_items 
      SET digestibility_rating = CASE 
        WHEN fiber_per_100g > 10 THEN 2
        WHEN fiber_per_100g > 5 THEN 3
        WHEN fiber_per_100g > 2 THEN 4
        ELSE 5
      END
      WHERE digestibility_rating IS NULL
    `);

    console.log('✅ Updated digestibility ratings based on fiber content');
  }

  // Utility function for rate limiting
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Run complete seeding process
  async seedAll() {
    try {
      console.log('🌱 Starting complete food database seeding...');
      
      const athleticFoodResults = await this.seedAthleticFoods();
      await this.seedMealTemplates();
      await this.updatePerformanceCategories();
      await this.verifyNutritionalData();
      
      console.log('✅ Complete food database seeding finished!');
      return athleticFoodResults;
    } catch (error) {
      console.error('💥 Error during complete seeding:', error);
      throw error;
    }
  }
}

export default FoodDatabaseSeeder;
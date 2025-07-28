import axios from 'axios';

class USDAFoodDataService {
  constructor() {
    this.baseURL = 'https://api.nal.usda.gov/fdc/v1';
    this.apiKey = process.env.USDA_API_KEY; // Get free API key from fdc.nal.usda.gov
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Search for foods by query
  async searchFoods(query, pageSize = 50, pageNumber = 1) {
    try {
      const cacheKey = `search_${query}_${pageSize}_${pageNumber}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.post(`${this.baseURL}/foods/search`, {
        query,
        pageSize,
        pageNumber,
        sortBy: 'dataType.keyword', // Prioritize SR Legacy and Foundation Foods
        sortOrder: 'asc',
        dataType: ['SR Legacy', 'Foundation', 'Branded'], // Exclude experimental
        requireAllWords: false
      }, {
        params: {
          api_key: this.apiKey
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = {
        totalHits: response.data.totalHits,
        totalPages: response.data.totalPages,
        pageNumber: response.data.pageNumber,
        foods: response.data.foods.map(food => this.transformUSDAFood(food))
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error searching USDA foods:', error);
      throw new Error('Failed to search foods from USDA database');
    }
  }

  // Get detailed food information by FDC ID
  async getFoodDetails(fdcId) {
    try {
      const cacheKey = `food_${fdcId}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.get(`${this.baseURL}/food/${fdcId}`, {
        params: {
          api_key: this.apiKey,
          format: 'full'
        }
      });

      const result = this.transformUSDAFoodDetails(response.data);
      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error getting USDA food details:', error);
      throw new Error('Failed to get food details from USDA database');
    }
  }

  // Get foods by UPC/barcode
  async getFoodByBarcode(upc) {
    try {
      const response = await this.searchFoods(`upc:${upc}`, 5, 1);
      return response.foods.length > 0 ? response.foods[0] : null;
    } catch (error) {
      console.error('Error searching food by barcode:', error);
      return null;
    }
  }

  // Get multiple foods by FDC IDs
  async getFoods(fdcIds, format = 'abridged') {
    try {
      const cacheKey = `foods_${fdcIds.join(',')}_${format}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.post(`${this.baseURL}/foods`, {
        fdcIds,
        format,
        nutrients: this.getEssentialNutrients()
      }, {
        params: {
          api_key: this.apiKey
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = response.data.map(food => this.transformUSDAFood(food));
      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error getting multiple USDA foods:', error);
      throw new Error('Failed to get foods from USDA database');
    }
  }

  // Transform USDA food data to our database format
  transformUSDAFood(usdaFood) {
    const nutrients = this.extractNutrients(usdaFood.foodNutrients);
    
    return {
      external_id: `usda_${usdaFood.fdcId}`,
      source: 'usda',
      name: usdaFood.description,
      brand: usdaFood.brandOwner || usdaFood.brandName || null,
      upc: usdaFood.gtinUpc || null,
      category: this.categorizeFood(usdaFood.foodCategory),
      
      // Nutritional information per 100g
      calories_per_100g: nutrients.calories || 0,
      protein_per_100g: nutrients.protein || 0,
      carbs_per_100g: nutrients.carbs || 0,
      fat_per_100g: nutrients.fat || 0,
      fiber_per_100g: nutrients.fiber || 0,
      sugar_per_100g: nutrients.sugar || 0,
      sodium_per_100g: nutrients.sodium || 0,
      
      // Micronutrients
      vitamin_c_per_100g: nutrients.vitaminC || 0,
      vitamin_d_per_100g: nutrients.vitaminD || 0,
      calcium_per_100g: nutrients.calcium || 0,
      iron_per_100g: nutrients.iron || 0,
      potassium_per_100g: nutrients.potassium || 0,
      
      // Serving information
      default_serving_size: usdaFood.servingSize || 100,
      default_serving_description: usdaFood.servingSizeUnit || 'g',
      
      // Athletic performance factors
      glycemic_index: this.estimateGlycemicIndex(usdaFood.foodCategory, nutrients),
      performance_category: this.determinePerformanceCategory(nutrients, usdaFood.foodCategory),
      digestibility_rating: this.estimateDigestibility(usdaFood.foodCategory, nutrients),
      
      // Source verification
      verified: true,
      data_type: usdaFood.dataType,
      publication_date: usdaFood.publicationDate
    };
  }

  transformUSDAFoodDetails(usdaFood) {
    const basicTransform = this.transformUSDAFood(usdaFood);
    
    return {
      ...basicTransform,
      ingredients: usdaFood.ingredients || null,
      food_portions: usdaFood.foodPortions?.map(portion => ({
        amount: portion.amount,
        unit: portion.modifier,
        gram_weight: portion.gramWeight
      })) || [],
      nutrient_details: usdaFood.foodNutrients?.map(nutrient => ({
        nutrient_id: nutrient.nutrient.id,
        nutrient_name: nutrient.nutrient.name,
        amount: nutrient.amount,
        unit: nutrient.nutrient.unitName
      })) || []
    };
  }

  // Extract essential nutrients from USDA nutrient array
  extractNutrients(foodNutrients) {
    if (!foodNutrients) return {};

    const nutrientMap = {};
    
    // USDA Nutrient IDs mapping
    const nutrientIds = {
      208: 'calories',      // Energy (kcal)
      203: 'protein',       // Protein
      205: 'carbs',         // Carbohydrate, by difference
      204: 'fat',           // Total lipid (fat)
      291: 'fiber',         // Fiber, total dietary
      269: 'sugar',         // Sugars, total including NLEA
      307: 'sodium',        // Sodium, Na
      401: 'vitaminC',      // Vitamin C, total ascorbic acid
      328: 'vitaminD',      // Vitamin D (D2 + D3)
      301: 'calcium',       // Calcium, Ca
      303: 'iron',          // Iron, Fe
      306: 'potassium'      // Potassium, K
    };

    foodNutrients.forEach(nutrient => {
      const key = nutrientIds[nutrient.nutrient?.id];
      if (key && nutrient.amount) {
        // Convert to per 100g if needed
        let amount = nutrient.amount;
        
        // Convert sodium from mg to mg (already correct unit)
        // Convert vitamins from IU to mg/mcg as needed
        if (key === 'vitaminD' && nutrient.nutrient.unitName === 'IU') {
          amount = amount * 0.025; // IU to mcg conversion for Vitamin D
        }
        
        nutrientMap[key] = amount;
      }
    });

    return nutrientMap;
  }

  // Categorize food based on USDA food category
  categorizeFood(usdaCategory) {
    if (!usdaCategory) return 'other';
    
    const category = usdaCategory.toLowerCase();
    
    const categoryMap = {
      'dairy and egg products': 'dairy',
      'spices and herbs': 'seasonings',
      'baby foods': 'other',
      'fats and oils': 'fats',
      'poultry products': 'proteins',
      'soups, sauces, and gravies': 'prepared_foods',
      'sausages and luncheon meats': 'proteins',
      'breakfast cereals': 'grains',
      'fruits and fruit juices': 'fruits',
      'pork products': 'proteins',
      'vegetables and vegetable products': 'vegetables',
      'nut and seed products': 'nuts_seeds',
      'beef products': 'proteins',
      'beverages': 'beverages',
      'finfish and shellfish products': 'proteins',
      'legumes and legume products': 'legumes',
      'lamb, veal, and game products': 'proteins',
      'baked products': 'grains',
      'sweets': 'snacks',
      'cereal grains and pasta': 'grains',
      'fast foods': 'prepared_foods',
      'meals, entrees, and side dishes': 'prepared_foods',
      'snacks': 'snacks'
    };

    return categoryMap[category] || 'other';
  }

  // Estimate glycemic index based on food category and nutrients
  estimateGlycemicIndex(category, nutrients) {
    if (!category) return null;
    
    const categoryLower = category.toLowerCase();
    
    // High GI foods (70+)
    if (categoryLower.includes('sweets') || 
        categoryLower.includes('breakfast cereals') ||
        categoryLower.includes('baked products')) {
      return 75;
    }
    
    // Medium GI foods (55-70)
    if (categoryLower.includes('fruits') ||
        categoryLower.includes('cereal grains')) {
      return 60;
    }
    
    // Low GI foods (<55)
    if (categoryLower.includes('vegetables') ||
        categoryLower.includes('legumes') ||
        categoryLower.includes('dairy') ||
        nutrients.fiber > 5) {
      return 35;
    }
    
    return null; // Cannot estimate
  }

  // Determine performance category for athletic nutrition
  determinePerformanceCategory(nutrients, category) {
    const categoryLower = category?.toLowerCase() || '';
    
    // Pre-workout foods (quick energy)
    if ((nutrients.carbs > 20 && nutrients.fat < 5) || 
        categoryLower.includes('fruits')) {
      return 'pre_workout';
    }
    
    // Post-workout foods (protein + carbs)
    if (nutrients.protein > 15 || 
        categoryLower.includes('dairy') ||
        categoryLower.includes('poultry') ||
        categoryLower.includes('beef')) {
      return 'post_workout';
    }
    
    // Recovery foods (anti-inflammatory)
    if (categoryLower.includes('vegetables') ||
        categoryLower.includes('nuts') ||
        nutrients.vitaminC > 10) {
      return 'recovery';
    }
    
    // Hydration (beverages)
    if (categoryLower.includes('beverages')) {
      return 'hydration';
    }
    
    return 'general';
  }

  // Estimate digestibility rating
  estimateDigestibility(category, nutrients) {
    const categoryLower = category?.toLowerCase() || '';
    
    // Easy to digest (5)
    if (categoryLower.includes('fruits') ||
        categoryLower.includes('dairy') ||
        nutrients.fiber < 2) {
      return 5;
    }
    
    // Moderate (3-4)
    if (categoryLower.includes('vegetables') ||
        categoryLower.includes('grains') ||
        nutrients.fiber < 5) {
      return 4;
    }
    
    // Harder to digest (1-2)
    if (categoryLower.includes('legumes') ||
        nutrients.fiber > 10 ||
        nutrients.fat > 20) {
      return 2;
    }
    
    return 3; // Default moderate
  }

  // Get essential nutrients list for API requests
  getEssentialNutrients() {
    return [208, 203, 205, 204, 291, 269, 307, 401, 328, 301, 303, 306];
  }

  // Cache management
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear expired cache entries
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }
}

export default USDAFoodDataService;
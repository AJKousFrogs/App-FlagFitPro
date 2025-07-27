

const nutritionResolvers = {
  Query: {
    nutritionTargets: async (parent, args, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      return await dataSources.nutritionAPI.getNutritionTargets(user.id);
    },

    dailyNutritionSummary: async (parent, { date }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      return await dataSources.nutritionAPI.getDailyNutritionSummary(user.id, date);
    },

    searchFoodItems: async (parent, { searchTerm, category, limit = 20 }, { dataSources }) => {
      return await dataSources.nutritionAPI.searchFoodItems(searchTerm, category, limit);
    },

    mealTemplates: async (parent, { mealType, targetCalories }, { user, dataSources }) => {
      return await dataSources.nutritionAPI.getMealTemplates({
        mealType,
        targetCalories,
        userId: user?.id
      });
    },

    userMeals: async (parent, { startDate, endDate }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      return await dataSources.nutritionAPI.getUserMeals(user.id, startDate, endDate);
    },
  },

  Mutation: {
    logMeal: async (parent, { input }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      
      const mealData = {
        userId: user.id,
        teamId: input.teamId,
        date: input.date,
        mealType: input.mealType,
        mealTime: input.mealTime,
        foods: input.foods,
        satisfactionRating: input.satisfactionRating,
        energyLevelAfter: input.energyLevelAfter,
        notes: input.notes,
        loggedVia: 'manual'
      };

      return await dataSources.nutritionAPI.logMeal(mealData);
    },

    updateMeal: async (parent, { id, input }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      
      // Verify meal belongs to user
      const existingMeal = await dataSources.nutritionAPI.getUserMeal(id);
      if (!existingMeal || existingMeal.user_id !== user.id) {
        throw new Error('Meal not found or access denied');
      }

      const mealData = {
        userId: user.id,
        teamId: input.teamId,
        date: input.date,
        mealType: input.mealType,
        mealTime: input.mealTime,
        foods: input.foods,
        satisfactionRating: input.satisfactionRating,
        energyLevelAfter: input.energyLevelAfter,
        notes: input.notes,
        loggedVia: 'manual_update'
      };

      return await dataSources.nutritionAPI.updateMeal(id, mealData);
    },

    deleteMeal: async (parent, { id }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      
      // Verify meal belongs to user
      const existingMeal = await dataSources.nutritionAPI.getUserMeal(id);
      if (!existingMeal || existingMeal.user_id !== user.id) {
        throw new Error('Meal not found or access denied');
      }

      return await dataSources.nutritionAPI.deleteMeal(id);
    },

    logHydration: async (parent, { amountMl, beverageType = 'water', timestamp }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      
      const hydrationData = {
        userId: user.id,
        amountMl,
        beverageType,
        timestamp: timestamp || new Date(),
        loggedVia: 'manual'
      };

      return await dataSources.nutritionAPI.logHydration(hydrationData);
    },
  },
};

export default nutritionResolvers;
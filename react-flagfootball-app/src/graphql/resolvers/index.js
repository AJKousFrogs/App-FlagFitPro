import userResolvers from './userResolvers.js';
import trainingResolvers from './trainingResolvers.js';
import nutritionResolvers from './nutritionResolvers.js';
import recoveryResolvers from './recoveryResolvers.js';
import aiCoachResolvers from './aiCoachResolvers.js';
import teamResolvers from './teamResolvers.js';
import analyticsResolvers from './analyticsResolvers.js';

import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

// Custom scalar types
const scalarResolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value); // Convert incoming integer to Date
    },
    serialize(value) {
      return value.getTime ? value.getTime() : value; // Convert outgoing Date to integer
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(parseInt(ast.value, 10)); // Convert hard-coded AST string to integer and then to Date
      }
      return null; // Invalid hard-coded value (not an integer)
    },
  }),

  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'DateTime custom scalar type',
    parseValue(value) {
      return new Date(value); // Convert incoming value to Date
    },
    serialize(value) {
      return value.toISOString ? value.toISOString() : value; // Convert outgoing Date to ISO string
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        return new Date(ast.value); // Convert hard-coded AST string to Date
      }
      return null;
    },
  }),

  JSON: new GraphQLScalarType({
    name: 'JSON',
    description: 'JSON custom scalar type',
    parseValue(value) {
      return typeof value === 'object' ? value : JSON.parse(value);
    },
    serialize(value) {
      return typeof value === 'object' ? value : JSON.parse(value);
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        return JSON.parse(ast.value);
      }
      return null;
    },
  }),
};

// Merge all resolvers
const resolvers = {
  ...scalarResolvers,
  
  Query: {
    ...userResolvers.Query,
    ...trainingResolvers.Query,
    ...nutritionResolvers.Query,
    ...recoveryResolvers.Query,
    ...aiCoachResolvers.Query,
    ...teamResolvers.Query,
    ...analyticsResolvers.Query,
  },

  Mutation: {
    ...userResolvers.Mutation,
    ...trainingResolvers.Mutation,
    ...nutritionResolvers.Mutation,
    ...recoveryResolvers.Mutation,
    ...aiCoachResolvers.Mutation,
    ...teamResolvers.Mutation,
  },

  Subscription: {
    ...trainingResolvers.Subscription,
    ...aiCoachResolvers.Subscription,
    ...teamResolvers.Subscription,
    ...recoveryResolvers.Subscription,
  },

  // Type resolvers for complex relationships
  User: {
    teams: async (user, args, { dataSources }) => {
      return await dataSources.teamAPI.getTeamMembershipsByUserId(user.id);
    },
    trainingStats: async (user, args, { dataSources }) => {
      return await dataSources.trainingAPI.getUserTrainingStats(user.id);
    },
    nutritionTargets: async (user, args, { dataSources }) => {
      return await dataSources.nutritionAPI.getNutritionTargets(user.id);
    },
    recoveryScore: async (user, args, { dataSources }) => {
      return await dataSources.recoveryAPI.getRecoveryScore(user.id);
    },
    aiCoachPreferences: async (user, args, { dataSources }) => {
      return await dataSources.aiCoachAPI.getUserCoachPreferences(user.id);
    },
  },

  Team: {
    members: async (team, args, { dataSources }) => {
      return await dataSources.teamAPI.getTeamMembers(team.id);
    },
    coaches: async (team, args, { dataSources }) => {
      return await dataSources.teamAPI.getTeamCoaches(team.id);
    },
    trainingTemplates: async (team, args, { dataSources }) => {
      return await dataSources.trainingAPI.getTeamTrainingTemplates(team.id);
    },
    mealTemplates: async (team, args, { dataSources }) => {
      return await dataSources.nutritionAPI.getTeamMealTemplates(team.id);
    },
    teamChemistry: async (team, args, { dataSources }) => {
      return await dataSources.teamAPI.getTeamChemistryStats(team.id);
    },
  },

  TrainingSession: {
    user: async (session, args, { dataSources }) => {
      return await dataSources.userAPI.getUserById(session.user_id);
    },
    team: async (session, args, { dataSources }) => {
      return session.team_id ? await dataSources.teamAPI.getTeamById(session.team_id) : null;
    },
    verificationEvents: async (session, args, { dataSources }) => {
      return await dataSources.trainingAPI.getVerificationEvents(session.id);
    },
    weatherConditions: async (session, args, { dataSources }) => {
      return await dataSources.weatherAPI.getWeatherForSession(session.id);
    },
  },

  TrainingTemplate: {
    drills: async (template, args, { dataSources }) => {
      return await dataSources.trainingAPI.getTemplateDrills(template.id);
    },
  },

  UserMeal: {
    user: async (meal, args, { dataSources }) => {
      return await dataSources.userAPI.getUserById(meal.user_id);
    },
    foods: async (meal, args, { dataSources }) => {
      return await dataSources.nutritionAPI.getMealFoods(meal.id);
    },
  },

  MealTemplate: {
    ingredients: async (template, args, { dataSources }) => {
      return await dataSources.nutritionAPI.getMealTemplateIngredients(template.id);
    },
  },

  SleepSession: {
    user: async (session, args, { dataSources }) => {
      return await dataSources.userAPI.getUserById(session.user_id);
    },
  },

  RecoverySession: {
    user: async (session, args, { dataSources }) => {
      return await dataSources.userAPI.getUserById(session.user_id);
    },
  },

  WellnessMetrics: {
    user: async (metrics, args, { dataSources }) => {
      return await dataSources.userAPI.getUserById(metrics.user_id);
    },
  },

  AIConversation: {
    user: async (conversation, args, { dataSources }) => {
      return await dataSources.userAPI.getUserById(conversation.user_id);
    },
    coachProfile: async (conversation, args, { dataSources }) => {
      return await dataSources.aiCoachAPI.getCoachProfile(conversation.ai_coach_profile_id);
    },
    messages: async (conversation, args, { dataSources }) => {
      return await dataSources.aiCoachAPI.getConversationMessages(conversation.id);
    },
  },

  AICoachPreferences: {
    user: async (preferences, args, { dataSources }) => {
      return await dataSources.userAPI.getUserById(preferences.user_id);
    },
    coachProfile: async (preferences, args, { dataSources }) => {
      return await dataSources.aiCoachAPI.getCoachProfile(preferences.ai_coach_profile_id);
    },
  },

  ChemistryPairing: {
    playerA: async (pairing, args, { dataSources }) => {
      return await dataSources.userAPI.getUserById(pairing.player_a_id);
    },
    playerB: async (pairing, args, { dataSources }) => {
      return await dataSources.userAPI.getUserById(pairing.player_b_id);
    },
  },

  TeamMember: {
    user: async (member, args, { dataSources }) => {
      return await dataSources.userAPI.getUserById(member.user_id);
    },
    team: async (member, args, { dataSources }) => {
      return await dataSources.teamAPI.getTeamById(member.team_id);
    },
  },

  NutritionTargets: {
    // Convert database snake_case to GraphQL camelCase
    dailyCaloriesTarget: (targets) => targets.daily_calories_target,
    dailyCaloriesMin: (targets) => targets.daily_calories_min,
    dailyCaloriesMax: (targets) => targets.daily_calories_max,
    proteinTarget: (targets) => targets.protein_target,
    carbsTarget: (targets) => targets.carbs_target,
    fatTarget: (targets) => targets.fat_target,
    fiberTarget: (targets) => targets.fiber_target,
    waterTarget: (targets) => targets.water_target,
    startDate: (targets) => targets.start_date,
  },

  UserMealFood: {
    foodItem: async (mealFood, args, { dataSources }) => {
      return await dataSources.nutritionAPI.getFoodItem(mealFood.food_item_id);
    },
  },

  MealIngredient: {
    foodItem: async (ingredient, args, { dataSources }) => {
      return await dataSources.nutritionAPI.getFoodItem(ingredient.food_item_id);
    },
  },
};

export default resolvers;
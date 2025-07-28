import { gql } from 'apollo-server-express';

const typeDefs = gql`
  scalar Date
  scalar DateTime
  scalar JSON

  # Enums
  enum Position {
    QB
    WR
    RB
    DB
    LB
    K
    FLEX
  }

  enum UserRole {
    PLAYER
    COACH
    ASSISTANT_COACH
    PARENT
    ADMIN
  }

  enum TrainingIntensity {
    VERY_LOW
    LOW
    MODERATE
    HIGH
    VERY_HIGH
  }

  enum MealType {
    BREAKFAST
    LUNCH
    DINNER
    SNACK
    PRE_WORKOUT
    POST_WORKOUT
  }

  enum RecoveryType {
    STRETCHING
    MASSAGE
    FOAM_ROLLING
    ICE_BATH
    SAUNA
    MEDITATION
    YOGA
    LIGHT_WALKING
  }

  # User Management
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    position: Position!
    experienceLevel: String!
    height: Float
    weight: Float
    birthDate: Date
    profilePicture: String
    teams: [TeamMember!]!
    trainingStats: UserTrainingStats
    nutritionTargets: NutritionTargets
    recoveryScore: RecoveryScore
    aiCoachPreferences: AICoachPreferences
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Team {
    id: ID!
    name: String!
    description: String
    location: String
    members: [TeamMember!]!
    coaches: [User!]!
    trainingTemplates: [TrainingTemplate!]!
    mealTemplates: [MealTemplate!]!
    teamChemistry: TeamChemistryStats
    createdAt: DateTime!
  }

  type TeamMember {
    id: ID!
    user: User!
    team: Team!
    role: UserRole!
    position: Position!
    jerseyNumber: Int
    joinedAt: DateTime!
    isActive: Boolean!
  }

  # Training System
  type TrainingSession {
    id: ID!
    user: User!
    team: Team
    sessionDate: Date!
    sessionType: String!
    drillType: String!
    intensityLevel: TrainingIntensity!
    duration: Int!
    completionRate: Float!
    performanceScore: Float
    xpEarned: Int!
    verificationEvents: [VerificationEvent!]!
    weatherConditions: WeatherConditions
    notes: String
    aiCoachFeedback: String
    createdAt: DateTime!
  }

  type TrainingTemplate {
    id: ID!
    name: String!
    description: String
    category: String!
    difficulty: String!
    estimatedDuration: Int!
    drills: [DrillTemplate!]!
    aiRecommended: Boolean!
    positions: [Position!]!
    tags: [String!]!
  }

  type DrillTemplate {
    id: ID!
    name: String!
    description: String!
    category: String!
    difficulty: String!
    estimatedDuration: Int!
    instructions: [String!]!
    equipment: [String!]!
    positions: [Position!]!
    performanceMetrics: [String!]!
    videoUrl: String
    diagramUrl: String
  }

  type VerificationEvent {
    id: ID!
    eventType: String!
    confidenceScore: Float!
    biometricData: JSON
    motionData: JSON
    peerVerification: Boolean
    timestamp: DateTime!
  }

  type WeatherConditions {
    temperature: Float!
    humidity: Float!
    windSpeed: Float!
    conditions: String!
    visibility: Float!
  }

  type UserTrainingStats {
    totalSessions: Int!
    totalXP: Int!
    averagePerformance: Float!
    averageIntensity: Float!
    streakDays: Int!
    favoriteCategory: String
    weeklyGoalProgress: Float!
    monthlyProgress: TrainingProgress!
  }

  type TrainingProgress {
    completedSessions: Int!
    totalPlanned: Int!
    averageScore: Float!
    improvementTrend: String!
  }

  # Team Chemistry System
  type TeamChemistryStats {
    overallRating: Float!
    communicationScore: Float!
    trustLevel: Float!
    onFieldSynergy: Float!
    recentTrend: String!
    pairings: [ChemistryPairing!]!
  }

  type ChemistryPairing {
    playerA: User!
    playerB: User!
    chemistryScore: Float!
    sharedTrainingHours: Float!
    performanceCorrelation: Float!
    lastUpdated: DateTime!
  }

  # Nutrition System
  type NutritionTargets {
    id: ID!
    dailyCaloriesTarget: Int!
    dailyCaloriesMin: Int!
    dailyCaloriesMax: Int!
    proteinTarget: Float!
    carbsTarget: Float!
    fatTarget: Float!
    fiberTarget: Float!
    waterTarget: Float!
    goal: String!
    startDate: Date!
  }

  type FoodItem {
    id: ID!
    name: String!
    brand: String
    category: String!
    caloriesPer100g: Float!
    proteinPer100g: Float!
    carbsPer100g: Float!
    fatPer100g: Float!
    defaultServingSize: Float!
    defaultServingDescription: String
    performanceCategory: String
    verified: Boolean!
  }

  type MealTemplate {
    id: ID!
    name: String!
    description: String
    mealType: MealType!
    totalCalories: Float!
    totalProtein: Float!
    totalCarbs: Float!
    totalFat: Float!
    prepTimeMinutes: Int
    performanceRating: Int
    ingredients: [MealIngredient!]!
    suitableForGameDay: Boolean!
    tags: [String!]!
  }

  type MealIngredient {
    foodItem: FoodItem!
    quantity: Float!
    servingDescription: String
  }

  type UserMeal {
    id: ID!
    user: User!
    date: Date!
    mealType: MealType!
    mealTime: DateTime!
    totalCalories: Float!
    totalProtein: Float!
    totalCarbs: Float!
    totalFat: Float!
    foods: [UserMealFood!]!
    satisfactionRating: Int
    energyLevelAfter: Int
    notes: String
  }

  type UserMealFood {
    foodItem: FoodItem!
    quantity: Float!
    calories: Float!
    protein: Float!
    carbs: Float!
    fat: Float!
  }

  type DailyNutritionSummary {
    date: Date!
    nutrition: NutritionSummary!
    hydration: HydrationSummary!
    targets: NutritionTargets
    compliance: NutritionCompliance
  }

  type NutritionSummary {
    calories: Float!
    protein: Float!
    carbs: Float!
    fat: Float!
    mealsLogged: Int!
    avgSatisfaction: Float
    avgEnergyLevel: Float
  }

  type HydrationSummary {
    totalWaterMl: Int!
    totalWaterLiters: Float!
  }

  type NutritionCompliance {
    caloriesPercentage: Float!
    proteinPercentage: Float!
    carbsPercentage: Float!
    fatPercentage: Float!
    waterPercentage: Float!
  }

  # Recovery System
  type RecoveryScore {
    overallScore: Int!
    sleepScore: Int!
    wellnessScore: Int!
    trainingLoadScore: Int!
    interpretation: RecoveryInterpretation!
    recommendations: [RecoveryRecommendation!]!
    lastUpdated: DateTime!
  }

  type RecoveryInterpretation {
    level: String!
    description: String!
  }

  type SleepSession {
    id: ID!
    user: User!
    sleepDate: Date!
    bedtime: DateTime!
    wakeTime: DateTime!
    totalSleepTime: Int!
    sleepEfficiency: Float!
    sleepQuality: Int!
    morningEnergyLevel: Int!
    muscleSorenessLevel: Int!
    trackingMethod: String!
    notes: String
  }

  type RecoverySession {
    id: ID!
    user: User!
    sessionDate: Date!
    startTime: DateTime!
    endTime: DateTime
    recoveryType: RecoveryType!
    intensityLevel: String!
    duration: Int
    preSessionSoreness: Int!
    postSessionSoreness: Int!
    effectivenessRating: Int!
    notes: String
  }

  type WellnessMetrics {
    id: ID!
    user: User!
    metricDate: Date!
    overallWellness: Int!
    energyLevel: Int!
    muscleSoreness: Int!
    stressLevel: Int!
    readinessToTrain: Int!
    moodRating: Int
    notes: String
  }

  type RecoveryRecommendation {
    id: ID!
    recommendationType: String!
    priorityLevel: String!
    title: String!
    description: String!
    recommendedActivities: [String!]!
    timingGuidance: String
    confidenceScore: Float!
    dateGenerated: Date!
  }

  type RecoveryTrends {
    trends: [DailyRecoveryData!]!
    summary: RecoveryTrendSummary!
  }

  type DailyRecoveryData {
    date: Date!
    recoveryScore: Int!
    sleepScore: Int!
    wellnessScore: Int!
    metrics: JSON!
  }

  type RecoveryTrendSummary {
    avgRecoveryScore: Float!
    bestDay: DailyRecoveryData!
    worstDay: DailyRecoveryData!
    trendDirection: String!
  }

  # AI Coach System
  type AICoachProfile {
    id: ID!
    coachName: String!
    personalityType: String!
    coachingStyle: String!
    specializations: [String!]!
    formalityLevel: String!
    encouragementFrequency: String!
    humorLevel: String!
    totalConversations: Int!
    userSatisfactionAvg: Float
  }

  type AICoachPreferences {
    id: ID!
    user: User!
    coachProfile: AICoachProfile!
    preferredName: String
    communicationStyle: String!
    proactiveMessages: Boolean!
    correctionStyle: String!
    praiseFrequency: String!
    focusAreas: [String!]!
  }

  type AIConversation {
    id: ID!
    user: User!
    coachProfile: AICoachProfile!
    conversationTitle: String
    startedAt: DateTime!
    endedAt: DateTime
    initiatedBy: String!
    conversationTrigger: String!
    totalMessages: Int!
    messages: [AIMessage!]!
    userSatisfaction: Int
    conversationSummary: String
    actionItems: [String!]!
  }

  type AIMessage {
    id: ID!
    messageIndex: Int!
    senderType: String!
    messageText: String!
    aiConfidence: Float
    timestamp: DateTime!
    userFeedback: Int
    helpful: Boolean
  }

  # Predictive Analytics
  type PerformancePrediction {
    userId: ID!
    predictionDate: Date!
    gameDate: Date
    predictedCompletionRate: Float!
    predictedPassingYards: Int!
    predictedChemistryImpact: Float!
    confidenceLevel: Float!
    environmentalFactors: EnvironmentalFactors!
    recommendations: [String!]!
  }

  type EnvironmentalFactors {
    weatherImpact: Float!
    temperatureOptimal: Boolean!
    windImpact: Float!
    teamChemistryBonus: Float!
  }

  type TrainingOptimization {
    userId: ID!
    currentEffectiveness: Float!
    optimizedPotential: Float!
    recommendations: [OptimizationRecommendation!]!
  }

  type OptimizationRecommendation {
    type: String!
    description: String!
    expectedImprovement: Float!
    priority: String!
  }

  # Equipment and Gear
  type EquipmentRecommendation {
    equipmentType: String!
    currentItem: String
    recommendedItem: String!
    predictedPerformanceGain: Float!
    confidence: Float!
    cost: Float
    reasoning: String!
  }

  # Input Types
  input CreateUserInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    position: Position!
    experienceLevel: String!
    height: Float
    weight: Float
    birthDate: Date
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    position: Position
    height: Float
    weight: Float
    profilePicture: String
  }

  input CreateTrainingSessionInput {
    teamId: ID
    sessionDate: Date!
    sessionType: String!
    drillType: String!
    intensityLevel: TrainingIntensity!
    duration: Int!
    completionRate: Float!
    performanceScore: Float
    notes: String
  }

  input LogMealInput {
    teamId: ID
    date: Date!
    mealType: MealType!
    mealTime: DateTime!
    foods: [MealFoodInput!]!
    satisfactionRating: Int
    energyLevelAfter: Int
    notes: String
  }

  input MealFoodInput {
    foodItemId: ID!
    quantity: Float!
    servingDescription: String
  }

  input LogSleepInput {
    sleepDate: Date!
    bedtime: DateTime!
    wakeTime: DateTime!
    sleepQuality: Int!
    morningEnergyLevel: Int!
    muscleSorenessLevel: Int
    notes: String
  }

  input LogWellnessInput {
    metricDate: Date!
    overallWellness: Int!
    energyLevel: Int!
    muscleSoreness: Int!
    stressLevel: Int!
    readinessToTrain: Int!
    moodRating: Int
    notes: String
  }

  input CreateRecoverySessionInput {
    teamId: ID
    sessionDate: Date!
    startTime: DateTime!
    endTime: DateTime
    recoveryType: RecoveryType!
    intensityLevel: String!
    preSessionSoreness: Int!
    postSessionSoreness: Int!
    effectivenessRating: Int!
    notes: String
  }

  input SendAIMessageInput {
    conversationId: ID!
    message: String!
  }

  input StartAIConversationInput {
    trigger: String!
    context: JSON
  }

  # Query Types
  type Query {
    # User Queries
    me: User
    user(id: ID!): User
    users(teamId: ID): [User!]!

    # Team Queries
    team(id: ID!): Team
    myTeams: [Team!]!

    # Training Queries
    trainingSession(id: ID!): TrainingSession
    myTrainingSessions(limit: Int, offset: Int): [TrainingSession!]!
    trainingTemplates(category: String, position: Position): [TrainingTemplate!]!
    drillTemplates(category: String, difficulty: String): [DrillTemplate!]!

    # Nutrition Queries
    nutritionTargets: NutritionTargets
    dailyNutritionSummary(date: Date!): DailyNutritionSummary!
    searchFoodItems(searchTerm: String!, category: String, limit: Int): [FoodItem!]!
    mealTemplates(mealType: MealType, targetCalories: Int): [MealTemplate!]!
    userMeals(startDate: Date!, endDate: Date!): [UserMeal!]!

    # Recovery Queries
    recoveryScore(date: Date): RecoveryScore!
    sleepSessions(startDate: Date!, endDate: Date!): [SleepSession!]!
    recoverySessions(startDate: Date!, endDate: Date!): [RecoverySession!]!
    wellnessMetrics(startDate: Date!, endDate: Date!): [WellnessMetrics!]!
    recoveryTrends(days: Int): RecoveryTrends!
    recoveryRecommendations: [RecoveryRecommendation!]!

    # AI Coach Queries
    aiCoachProfiles: [AICoachProfile!]!
    myAICoachPreferences: AICoachPreferences
    aiConversations(limit: Int): [AIConversation!]!
    aiConversation(id: ID!): AIConversation

    # Analytics Queries
    performancePrediction(gameDate: Date): PerformancePrediction
    trainingOptimization: TrainingOptimization!
    equipmentRecommendations: [EquipmentRecommendation!]!

    # Team Chemistry Queries
    teamChemistry(teamId: ID!): TeamChemistryStats
    myChemistryRatings(teamId: ID!): [ChemistryPairing!]!
  }

  # Mutation Types
  type Mutation {
    # User Mutations
    createUser(input: CreateUserInput!): User!
    updateUser(input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!

    # Training Mutations
    createTrainingSession(input: CreateTrainingSessionInput!): TrainingSession!
    updateTrainingSession(id: ID!, input: CreateTrainingSessionInput!): TrainingSession!
    deleteTrainingSession(id: ID!): Boolean!

    # Nutrition Mutations
    logMeal(input: LogMealInput!): UserMeal!
    updateMeal(id: ID!, input: LogMealInput!): UserMeal!
    deleteMeal(id: ID!): Boolean!
    logHydration(amountMl: Int!, beverageType: String, timestamp: DateTime): Boolean!

    # Recovery Mutations
    logSleep(input: LogSleepInput!): SleepSession!
    updateSleep(id: ID!, input: LogSleepInput!): SleepSession!
    logWellness(input: LogWellnessInput!): WellnessMetrics!
    createRecoverySession(input: CreateRecoverySessionInput!): RecoverySession!

    # AI Coach Mutations
    startAIConversation(input: StartAIConversationInput!): AIConversation!
    sendAIMessage(input: SendAIMessageInput!): AIMessage!
    rateAIMessage(messageId: ID!, rating: Int!, helpful: Boolean): Boolean!
    updateAICoachPreferences(communicationStyle: String, focusAreas: [String!]): AICoachPreferences!

    # Team Mutations
    joinTeam(teamId: ID!, position: Position!): TeamMember!
    leaveTeam(teamId: ID!): Boolean!
    rateTeammate(teammateId: ID!, rating: Int!, context: String): Boolean!
  }

  # Subscription Types
  type Subscription {
    # Real-time training updates
    trainingSessionUpdated(userId: ID!): TrainingSession!
    
    # AI Coach message notifications
    newAIMessage(conversationId: ID!): AIMessage!
    
    # Team updates
    teamChemistryUpdated(teamId: ID!): TeamChemistryStats!
    
    # Recovery alerts
    recoveryRecommendationGenerated(userId: ID!): RecoveryRecommendation!
  }
`;

module.exports = typeDefs;
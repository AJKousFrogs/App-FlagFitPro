import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

const recoveryResolvers = {
  Query: {
    recoveryScore: async (parent, { date }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      const targetDate = date || new Date();
      return await dataSources.recoveryAPI.getRecoveryScore(user.id, targetDate);
    },

    sleepSessions: async (parent, { startDate, endDate }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      return await dataSources.recoveryAPI.getSleepSessions(user.id, startDate, endDate);
    },

    recoverySessions: async (parent, { startDate, endDate }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      return await dataSources.recoveryAPI.getRecoverySessions(user.id, startDate, endDate);
    },

    wellnessMetrics: async (parent, { startDate, endDate }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      return await dataSources.recoveryAPI.getWellnessMetrics(user.id, startDate, endDate);
    },

    recoveryTrends: async (parent, { days = 30 }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      return await dataSources.recoveryAPI.getRecoveryTrends(user.id, days);
    },

    recoveryRecommendations: async (parent, args, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      return await dataSources.recoveryAPI.getActiveRecommendations(user.id);
    },
  },

  Mutation: {
    logSleep: async (parent, { input }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      
      const sleepData = {
        userId: user.id,
        sleepDate: input.sleepDate,
        bedtime: input.bedtime,
        wakeTime: input.wakeTime,
        sleepQuality: input.sleepQuality,
        morningEnergyLevel: input.morningEnergyLevel,
        muscleSorenessLevel: input.muscleSorenessLevel,
        notes: input.notes,
        trackingMethod: 'manual'
      };

      // Calculate derived metrics
      const bedtimeDate = new Date(input.bedtime);
      const wakeTimeDate = new Date(input.wakeTime);
      const timeInBedMinutes = Math.round((wakeTimeDate - bedtimeDate) / (1000 * 60));
      
      sleepData.timeInBedMinutes = timeInBedMinutes;
      sleepData.totalSleepTimeMinutes = Math.round(timeInBedMinutes * 0.9); // Assume 90% efficiency
      sleepData.sleepEfficiency = 90; // Default for manual entry

      const result = await dataSources.recoveryAPI.logSleep(sleepData);
      
      // Trigger recovery score recalculation
      const updatedRecoveryScore = await dataSources.recoveryAPI.getRecoveryScore(user.id, input.sleepDate);
      
      // Check if new recommendations should be generated
      if (updatedRecoveryScore.overallScore < 70) {
        const recommendations = await dataSources.recoveryAPI.generateRecommendations(user.id);
        for (const rec of recommendations) {
          pubsub.publish('RECOVERY_RECOMMENDATION_GENERATED', {
            recoveryRecommendationGenerated: rec,
            userId: user.id
          });
        }
      }

      return result;
    },

    updateSleep: async (parent, { id, input }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      
      // Verify sleep session belongs to user
      const existingSleep = await dataSources.recoveryAPI.getSleepSession(id);
      if (!existingSleep || existingSleep.user_id !== user.id) {
        throw new Error('Sleep session not found or access denied');
      }

      const sleepData = {
        userId: user.id,
        sleepDate: input.sleepDate,
        bedtime: input.bedtime,
        wakeTime: input.wakeTime,
        sleepQuality: input.sleepQuality,
        morningEnergyLevel: input.morningEnergyLevel,
        muscleSorenessLevel: input.muscleSorenessLevel,
        notes: input.notes,
        trackingMethod: 'manual_update'
      };

      return await dataSources.recoveryAPI.updateSleep(id, sleepData);
    },

    logWellness: async (parent, { input }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      
      const wellnessData = {
        userId: user.id,
        metricDate: input.metricDate,
        overallWellness: input.overallWellness,
        energyLevel: input.energyLevel,
        muscleSoreness: input.muscleSoreness,
        stressLevel: input.stressLevel,
        motivationLevel: input.motivationLevel,
        readinessToTrain: input.readinessToTrain,
        moodRating: input.moodRating,
        focusLevel: input.focusLevel,
        anxietyLevel: input.anxietyLevel,
        notes: input.notes
      };

      const result = await dataSources.recoveryAPI.logWellness(wellnessData);
      
      // Trigger recovery score recalculation
      await dataSources.recoveryAPI.getRecoveryScore(user.id, input.metricDate);
      
      // Generate recommendations if wellness indicates issues
      if (input.overallWellness <= 5 || input.readinessToTrain <= 4) {
        const recommendations = await dataSources.recoveryAPI.generateRecommendations(user.id);
        for (const rec of recommendations) {
          pubsub.publish('RECOVERY_RECOMMENDATION_GENERATED', {
            recoveryRecommendationGenerated: rec,
            userId: user.id
          });
        }
      }

      return result;
    },

    createRecoverySession: async (parent, { input }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      
      const sessionData = {
        userId: user.id,
        teamId: input.teamId,
        sessionDate: input.sessionDate,
        startTime: input.startTime,
        endTime: input.endTime,
        recoveryType: input.recoveryType,
        intensityLevel: input.intensityLevel,
        preSessions: {
          soreness: input.preSessionSoreness,
          stiffness: 5, // Default if not provided
          energy: 5
        },
        postSessions: {
          soreness: input.postSessionSoreness,
          stiffness: Math.max(1, input.preSessionSoreness - 2), // Assume improvement
          energy: Math.min(10, 5 + 2) // Assume energy boost
        },
        effectivenessRating: input.effectivenessRating,
        notes: input.notes
      };

      return await dataSources.recoveryAPI.createRecoverySession(sessionData);
    },
  },

  Subscription: {
    recoveryRecommendationGenerated: {
      subscribe: () => {
        return pubsub.asyncIterator(['RECOVERY_RECOMMENDATION_GENERATED']);
      },
      resolve: (payload, { userId }) => {
        // Only send to the specific user
        if (payload.userId === userId) {
          return payload.recoveryRecommendationGenerated;
        }
        return null;
      },
    },
  },
};

export default recoveryResolvers;
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

const aiCoachResolvers = {
  Query: {
    aiCoachProfiles: async (parent, args, { dataSources }) => {
      return await dataSources.aiCoachAPI.getAvailableCoachProfiles();
    },

    myAICoachPreferences: async (parent, args, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      return await dataSources.aiCoachAPI.getUserCoachPreferences(user.id);
    },

    aiConversations: async (parent, { limit = 20 }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      return await dataSources.aiCoachAPI.getUserConversations(user.id, limit);
    },

    aiConversation: async (parent, { id }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      
      const conversation = await dataSources.aiCoachAPI.getConversation(id);
      if (!conversation || conversation.user_id !== user.id) {
        throw new Error('Conversation not found or access denied');
      }
      
      return conversation;
    },
  },

  Mutation: {
    startAIConversation: async (parent, { input }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      
      const { trigger, context } = input;
      
      const conversation = await dataSources.aiCoachAPI.startConversation(
        user.id, 
        trigger, 
        context || {}
      );

      // Publish to subscription for real-time updates
      const initialMessage = await dataSources.aiCoachAPI.getLatestMessage(conversation.conversation.id);
      if (initialMessage) {
        pubsub.publish('NEW_AI_MESSAGE', {
          newAIMessage: initialMessage,
          conversationId: conversation.conversation.id
        });
      }

      return conversation.conversation;
    },

    sendAIMessage: async (parent, { input }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      
      const { conversationId, message } = input;
      
      // Verify conversation belongs to user
      const conversation = await dataSources.aiCoachAPI.getConversation(conversationId);
      if (!conversation || conversation.user_id !== user.id) {
        throw new Error('Conversation not found or access denied');
      }

      await dataSources.aiCoachAPI.sendMessage(conversationId, message);
      
      // Get the AI's response message
      const aiMessage = await dataSources.aiCoachAPI.getLatestMessage(conversationId);
      
      // Publish to subscription for real-time updates
      pubsub.publish('NEW_AI_MESSAGE', {
        newAIMessage: aiMessage,
        conversationId
      });

      return aiMessage;
    },

    rateAIMessage: async (parent, { messageId, rating, helpful }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      
      // Verify message belongs to user's conversation
      const message = await dataSources.aiCoachAPI.getMessage(messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      
      const conversation = await dataSources.aiCoachAPI.getConversation(message.conversation_id);
      if (!conversation || conversation.user_id !== user.id) {
        throw new Error('Access denied');
      }

      return await dataSources.aiCoachAPI.rateMessage(messageId, rating, helpful);
    },

    updateAICoachPreferences: async (parent, { communicationStyle, focusAreas }, { user, dataSources }) => {
      if (!user) throw new Error('Authentication required');
      
      const updateData = {};
      if (communicationStyle) updateData.communicationStyle = communicationStyle;
      if (focusAreas) updateData.focusAreas = focusAreas;

      return await dataSources.aiCoachAPI.updateUserPreferences(user.id, updateData);
    },
  },

  Subscription: {
    newAIMessage: {
      subscribe: () => {
        return pubsub.asyncIterator(['NEW_AI_MESSAGE']);
      },
      resolve: (payload, { conversationId }) => {
        // Only send messages for the specific conversation
        if (payload.conversationId === conversationId) {
          return payload.newAIMessage;
        }
        return null;
      },
    },
  },

  // Type resolvers for AI-specific field transformations
  AIConversation: {
    conversationTitle: (conversation) => conversation.conversation_title,
    startedAt: (conversation) => conversation.started_at,
    endedAt: (conversation) => conversation.ended_at,
    initiatedBy: (conversation) => conversation.initiated_by,
    conversationTrigger: (conversation) => conversation.conversation_trigger,
    totalMessages: (conversation) => conversation.total_messages,
    userSatisfaction: (conversation) => conversation.user_satisfaction,
    conversationSummary: (conversation) => conversation.conversation_summary,
    actionItems: (conversation) => conversation.action_items || [],
  },

  AIMessage: {
    messageIndex: (message) => message.message_index,
    senderType: (message) => message.sender_type,
    messageText: (message) => message.message_text,
    aiConfidence: (message) => message.ai_confidence,
    userFeedback: (message) => message.user_feedback,
    helpful: (message) => message.helpful_rating,
  },

  AICoachProfile: {
    coachName: (profile) => profile.coach_name,
    personalityType: (profile) => profile.personality_type,
    coachingStyle: (profile) => profile.coaching_style,
    formalityLevel: (profile) => profile.formality_level,
    encouragementFrequency: (profile) => profile.encouragement_frequency,
    humorLevel: (profile) => profile.humor_level,
    totalConversations: (profile) => profile.total_conversations,
    userSatisfactionAvg: (profile) => profile.user_satisfaction_avg,
  },

  AICoachPreferences: {
    preferredName: (prefs) => prefs.preferred_name,
    communicationStyle: (prefs) => prefs.communication_style,
    proactiveMessages: (prefs) => prefs.proactive_messages,
    correctionStyle: (prefs) => prefs.correction_style,
    praiseFrequency: (prefs) => prefs.praise_frequency,
    focusAreas: (prefs) => prefs.focus_areas || [],
  },
};

export default aiCoachResolvers;
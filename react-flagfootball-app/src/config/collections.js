/**
 * PocketBase Collection Constants
 * Centralized collection names to prevent typos and make schema changes easier
 */

export const COLLECTIONS = {
  // Authentication
  USERS: '_pb_users_auth_',
  
  // Training
  TRAINING_SESSIONS: 'training_sessions',
  TRAINING_GOALS: 'training_goals',
  
  // Analytics
  ANALYTICS_EVENTS: 'analytics_events',
  
  // Media
  PROGRESS_PHOTOS: 'progress_photos',
  TRAINING_VIDEOS: 'training_videos',
  
  // System
  FILES: 'files',
  
  // Future collections (commented for reference)
  // CONVERSION_FUNNELS: 'conversion_funnels',
  // AB_TEST_RESULTS: 'ab_test_results',
  // WEEKLY_CHALLENGES: 'weekly_challenges',
  // TOURNAMENTS: 'tournaments'
};

/**
 * Collection field mappings for common operations
 */
export const COLLECTION_FIELDS = {
  [COLLECTIONS.USERS]: {
    ID: 'id',
    EMAIL: 'email',
    NAME: 'name',
    VERIFIED: 'verified',
    CREATED: 'created',
    UPDATED: 'updated'
  },
  
  [COLLECTIONS.TRAINING_SESSIONS]: {
    ID: 'id',
    USER_ID: 'user_id',
    SESSION_TYPE: 'session_type',
    DURATION: 'duration',
    EXERCISES: 'exercises',
    NOTES: 'notes',
    CREATED: 'created',
    UPDATED: 'updated'
  },
  
  [COLLECTIONS.TRAINING_GOALS]: {
    ID: 'id',
    USER_ID: 'user_id',
    TITLE: 'title',
    DESCRIPTION: 'description',
    TARGET_DATE: 'target_date',
    COMPLETED: 'completed',
    PROGRESS: 'progress',
    CREATED: 'created',
    UPDATED: 'updated'
  },
  
  [COLLECTIONS.ANALYTICS_EVENTS]: {
    ID: 'id',
    USER_ID: 'user_id',
    EVENT_TYPE: 'event_type',
    EVENT_DATA: 'event_data',
    SESSION_ID: 'session_id',
    TIMESTAMP: 'timestamp',
    PAGE_URL: 'page_url',
    USER_AGENT: 'user_agent',
    CREATED: 'created'
  }
};

/**
 * Utility function to get collection name safely
 * @param {string} collectionKey - Key from COLLECTIONS object
 * @returns {string} Collection name or throws error if not found
 */
export function getCollectionName(collectionKey) {
  const collectionName = COLLECTIONS[collectionKey];
  if (!collectionName) {
    throw new Error(`Collection key "${collectionKey}" not found. Available keys: ${Object.keys(COLLECTIONS).join(', ')}`);
  }
  return collectionName;
}

/**
 * Utility function to get field name safely
 * @param {string} collectionKey - Key from COLLECTIONS object
 * @param {string} fieldKey - Key from COLLECTION_FIELDS object
 * @returns {string} Field name or throws error if not found
 */
export function getFieldName(collectionKey, fieldKey) {
  const fields = COLLECTION_FIELDS[COLLECTIONS[collectionKey]];
  if (!fields) {
    throw new Error(`Fields for collection "${collectionKey}" not found`);
  }
  
  const fieldName = fields[fieldKey];
  if (!fieldName) {
    throw new Error(`Field key "${fieldKey}" not found for collection "${collectionKey}". Available fields: ${Object.keys(fields).join(', ')}`);
  }
  
  return fieldName;
}

export default COLLECTIONS;
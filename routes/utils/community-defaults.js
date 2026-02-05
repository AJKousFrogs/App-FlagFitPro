/**
 * Community route defaults and fallback messages.
 *
 * @module routes/utils/community-defaults
 * @version 1.0.0
 */

export const COMMUNITY_DB_NOT_CONFIGURED_MESSAGE = "Database not configured";

export const COMMUNITY_DB_OR_MISSING_POST_ID_MESSAGE =
  "Database not configured or missing postId";

export const COMMUNITY_DB_OR_MISSING_COMMENT_ID_MESSAGE =
  "Database not configured or missing commentId";

export const COMMUNITY_DB_OR_MISSING_DATA_MESSAGE =
  "Database not configured or missing data";

export const COMMUNITY_DB_OR_MISSING_OPTION_ID_MESSAGE =
  "Database not configured or missing optionId";

export const COMMUNITY_DEFAULT_TOPICS = [
  { name: "Training", count: 45 },
  { name: "GameDay", count: 38 },
  { name: "Quarterback", count: 27 },
  { name: "Defense", count: 19 },
  { name: "Fitness", count: 15 },
];

export const COMMUNITY_EMPTY_FEED_RESPONSE = {
  posts: [],
};

export const COMMUNITY_EMPTY_LIST_RESPONSE = [];

export const COMMUNITY_EMPTY_COMMENTS_RESPONSE = {
  comments: [],
};

export const COMMUNITY_EMPTY_POLL_RESPONSE = {
  options: [],
  totalVotes: 0,
};

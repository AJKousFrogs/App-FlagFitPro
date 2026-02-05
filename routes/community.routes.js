/**
 * Community Routes
 * Handles community posts, likes, comments, polls, and trending topics
 *
 * @module routes/community
 * @version 1.0.0
 */

import express from "express";
import { authenticateToken } from "./middleware/auth.middleware.js";
import { supabase } from "./utils/database.js";
import {
  COMMUNITY_DB_NOT_CONFIGURED_MESSAGE,
  COMMUNITY_DB_OR_MISSING_COMMENT_ID_MESSAGE,
  COMMUNITY_DB_OR_MISSING_DATA_MESSAGE,
  COMMUNITY_DB_OR_MISSING_OPTION_ID_MESSAGE,
  COMMUNITY_DB_OR_MISSING_POST_ID_MESSAGE,
  COMMUNITY_DEFAULT_TOPICS,
  COMMUNITY_EMPTY_COMMENTS_RESPONSE,
  COMMUNITY_EMPTY_FEED_RESPONSE,
  COMMUNITY_EMPTY_LIST_RESPONSE,
  COMMUNITY_EMPTY_POLL_RESPONSE,
} from "./utils/community-defaults.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { serverLogger } from "./utils/server-logger.js";
import {
  createSuccessResponse,
  getErrorMessage,
  sendError,
  sendErrorResponse,
  sendSuccess,
  validatePagination,
} from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "community";

// Helper functions for logging
const logRequest = (req, message) => {
  serverLogger.info(`[${ROUTE_NAME}] ${message}`, {
    method: req.method,
    path: req.path,
    userId: req.userId,
  });
};

const logError = (message, error) => {
  serverLogger.error(`[${ROUTE_NAME}] ${message}`, { error });
};

/**
 * Get user's team ID(s) from team_members table
 * This allows team-scoped posts visibility
 */
async function getUserTeams(userId) {
  if (!supabase) {
    return [];
  }

  const { data: teams } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("status", "active");

  return teams?.map((t) => t.team_id) || [];
}

/**
 * GET /api/community?feed=true
 * Get community feed posts (team-scoped)
 */
async function getCommunityFeed(req, res) {
  try {
    logRequest(req, "GET /api/community?feed=true");
    const { userId } = req;
    const pagination = validatePagination(1, req.query.limit, 100);
    if (!pagination.isValid) {
      return sendError(res, pagination.error, "INVALID_PAGINATION", 400);
    }
    const { limit } = pagination;
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    if (!supabase) {
      return sendSuccess(
        res,
        COMMUNITY_EMPTY_FEED_RESPONSE,
        COMMUNITY_DB_NOT_CONFIGURED_MESSAGE,
      );
    }

    // Get user's team(s) to filter posts
    const teamIds = await getUserTeams(userId);

    // Build query - get posts from same team(s)
    let query = supabase
      .from("community_posts")
      .select(
        `
        id,
        content,
        location,
        media_url,
        media_type,
        created_at,
        user_id,
        team_id,
        users:user_id(full_name, email),
        post_likes(count),
        post_comments(count)
      `,
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by team if user has teams
    if (teamIds.length > 0) {
      query = query.in("team_id", teamIds);
    }

    const { data: posts, error } = await query;

    if (error) {
      throw error;
    }

    const postIds = (posts || []).map((post) => post.id);
    let likedPostIds = new Set();
    let bookmarkedPostIds = new Set();

    if (postIds.length > 0) {
      const { data: likes, error: likesError } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds);

      if (likesError) {
        throw likesError;
      }

      const { data: bookmarks, error: bookmarksError } = await supabase
        .from("post_bookmarks")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds);

      if (bookmarksError) {
        throw bookmarksError;
      }

      likedPostIds = new Set((likes || []).map((like) => like.post_id));
      bookmarkedPostIds = new Set(
        (bookmarks || []).map((bookmark) => bookmark.post_id),
      );
    }

    const postsWithLikes = (posts || []).map((post) => ({
      id: post.id,
      content: post.content,
      location: post.location,
      mediaUrl: post.media_url,
      mediaType: post.media_type,
      timestamp: post.created_at,
      authorName: post.users?.full_name || post.users?.email || "Unknown",
      likes: post.post_likes?.[0]?.count || 0,
      comments: post.post_comments?.[0]?.count || 0,
      shares: 0,
      isLiked: likedPostIds.has(post.id),
      isBookmarked: bookmarkedPostIds.has(post.id),
    }));

    return sendSuccess(res, { posts: postsWithLikes });
  } catch (error) {
    const errorMessage = getErrorMessage(
      error,
      "Failed to fetch community feed",
    );
    logError(`Error fetching community feed: ${errorMessage}`, error);
    return sendErrorResponse(
      res,
      error,
      "Failed to fetch community feed",
      "FETCH_ERROR",
      500,
    );
  }
}

/**
 * POST /api/community
 * Create a new community post
 */
async function createCommunityPost(req, res) {
  try {
    logRequest(req, "POST /api/community");
    const { userId } = req;
    const { content, location, media_url, media_type, post_type } = req.body;

    if (!supabase) {
      return sendSuccess(
        res,
        {
          id: Date.now().toString(),
          content,
          location,
          authorName: "You",
        },
        COMMUNITY_DB_NOT_CONFIGURED_MESSAGE,
      );
    }

    // Get user's primary team
    const teamIds = await getUserTeams(userId);
    const teamId = teamIds.length > 0 ? teamIds[0] : null;

    // Insert post
    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: userId,
        team_id: teamId,
        content: content || "",
        location: location || null,
        media_url: media_url || null,
        media_type: media_type || null,
        is_published: true,
        is_pinned: post_type === "announcement",
      })
      .select(
        `
        id,
        content,
        location,
        media_url,
        media_type,
        created_at,
        users:user_id(full_name, email)
      `,
      )
      .single();

    if (error) {
      throw error;
    }

    return sendSuccess(res, {
      id: post.id,
      content: post.content,
      location: post.location,
      authorName: post.users?.full_name || post.users?.email || "You",
    });
  } catch (error) {
    logError("Error creating community post", error);
    return sendError(res, "Failed to create post", "CREATE_ERROR", 500);
  }
}

/**
 * POST /api/community?postId=xxx&like=true
 * Toggle like on a post
 */
async function togglePostLike(req, res) {
  try {
    logRequest(req, "POST /api/community?like=true");
    const { userId } = req;
    const { postId } = req.query;

    if (!supabase || !postId) {
      return sendSuccess(res, null, COMMUNITY_DB_OR_MISSING_POST_ID_MESSAGE);
    }

    // Check if like exists
    const { data: existingLike } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (existingLike) {
      // Unlike
      await supabase.from("post_likes").delete().eq("id", existingLike.id);
    } else {
      // Like
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: userId,
      });
    }

    return sendSuccess(res, null);
  } catch (error) {
    logError("Error toggling post like", error);
    return sendSuccess(res, null, "Could not update like");
  }
}

/**
 * POST /api/community?postId=xxx&bookmark=true
 * Toggle bookmark on a post
 */
async function togglePostBookmark(req, res) {
  try {
    logRequest(req, "POST /api/community?bookmark=true");
    const { userId } = req;
    const { postId } = req.query;

    if (!supabase || !postId) {
      return sendSuccess(res, null, COMMUNITY_DB_OR_MISSING_POST_ID_MESSAGE);
    }

    // Check if bookmark exists
    const { data: existingBookmark } = await supabase
      .from("post_bookmarks")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .single();

    if (existingBookmark) {
      // Remove bookmark
      await supabase
        .from("post_bookmarks")
        .delete()
        .eq("id", existingBookmark.id);
    } else {
      // Add bookmark
      await supabase.from("post_bookmarks").insert({
        post_id: postId,
        user_id: userId,
      });
    }

    return sendSuccess(res, null);
  } catch (error) {
    logError("Error toggling bookmark", error);
    return sendError(res, "Failed to update bookmark", "UPDATE_ERROR", 500);
  }
}

/**
 * GET /api/community?postId=xxx&comment=true
 * Get comments for a post
 */
async function getPostComments(req, res) {
  try {
    logRequest(req, "GET /api/community?comment=true");
    const { postId } = req.query;

    if (!supabase || !postId) {
      return sendSuccess(
        res,
        COMMUNITY_EMPTY_COMMENTS_RESPONSE,
        COMMUNITY_DB_OR_MISSING_POST_ID_MESSAGE,
      );
    }

    const { data: comments, error } = await supabase
      .from("post_comments")
      .select(
        `
        id,
        content,
        likes_count,
        created_at,
        users:user_id(full_name, email)
      `,
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    const formattedComments = (comments || []).map((c) => ({
      id: c.id,
      author: c.users?.full_name || c.users?.email || "Unknown",
      content: c.content,
      likes: c.likes_count || 0,
      timeAgo: getRelativeTime(new Date(c.created_at)),
    }));

    return sendSuccess(res, { comments: formattedComments });
  } catch (error) {
    logError("Error fetching comments", error);
    return sendSuccess(
      res,
      COMMUNITY_EMPTY_COMMENTS_RESPONSE,
      "Could not load comments",
    );
  }
}

/**
 * POST /api/community?postId=xxx&comment=true
 * Add a comment to a post
 */
async function addPostComment(req, res) {
  try {
    logRequest(req, "POST /api/community?comment=true");
    const { userId } = req;
    const { postId } = req.query;
    const { content } = req.body;

    if (!supabase || !postId || !content) {
      return sendSuccess(
        res,
        { id: Date.now().toString() },
        COMMUNITY_DB_OR_MISSING_DATA_MESSAGE,
      );
    }

    const { data: comment, error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: userId,
        content,
      })
      .select(
        `
        id,
        content,
        users:user_id(full_name, email)
      `,
      )
      .single();

    if (error) {
      throw error;
    }

    return sendSuccess(res, {
      id: comment.id,
      author: comment.users?.full_name || comment.users?.email || "You",
    });
  } catch (error) {
    logError("Error adding comment", error);
    return sendError(res, "Failed to add comment", "CREATE_ERROR", 500);
  }
}

/**
 * POST /api/community?commentId=xxx&commentLike=true
 * Toggle like on a comment
 */
async function toggleCommentLike(req, res) {
  try {
    logRequest(req, "POST /api/community?commentLike=true");
    const { userId } = req;
    const { commentId } = req.query;

    if (!supabase || !commentId) {
      return sendSuccess(res, null, COMMUNITY_DB_OR_MISSING_COMMENT_ID_MESSAGE);
    }

    // Check if like exists
    const { data: existingLike } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .single();

    if (existingLike) {
      // Unlike
      await supabase.from("comment_likes").delete().eq("id", existingLike.id);

      // Decrement count
      await supabase.rpc("decrement_comment_likes_count", {
        comment_id: commentId,
      });
    } else {
      // Like
      await supabase.from("comment_likes").insert({
        comment_id: commentId,
        user_id: userId,
      });

      // Increment count
      await supabase.rpc("increment_comment_likes_count", {
        comment_id: commentId,
      });
    }

    return sendSuccess(res, null);
  } catch (error) {
    logError("Error toggling comment like", error);
    return sendSuccess(res, null, "Could not update comment like");
  }
}

/**
 * GET /api/community?leaderboard=true
 * Get community leaderboard
 */
async function getLeaderboard(req, res) {
  try {
    logRequest(req, "GET /api/community?leaderboard=true");

    if (!supabase) {
      return sendSuccess(
        res,
        COMMUNITY_EMPTY_LIST_RESPONSE,
        COMMUNITY_DB_NOT_CONFIGURED_MESSAGE,
      );
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions } = await supabase
      .from("training_sessions")
      .select(
        `
        user_id,
        users:user_id(full_name, email)
      `,
      )
      .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
      .eq("status", "completed");

    // Aggregate by user
    const userStats = {};
    sessions?.forEach((s) => {
      if (s.user_id && s.users) {
        if (!userStats[s.user_id]) {
          userStats[s.user_id] = {
            name: s.users.full_name || s.users.email || "Unknown",
            sessions: 0,
            points: 0,
          };
        }
        userStats[s.user_id].sessions++;
        userStats[s.user_id].points += 10;
      }
    });

    const ranked = Object.values(userStats)
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((u, i) => ({
        rank: i + 1,
        name: u.name,
        points: u.points,
      }));

    return sendSuccess(res, ranked);
  } catch (error) {
    logError("Error fetching leaderboard", error);
    return sendSuccess(res, COMMUNITY_EMPTY_LIST_RESPONSE, "No data available");
  }
}

/**
 * GET /api/community?trending=true
 * Get trending topics
 */
async function getTrendingTopics(req, res) {
  try {
    logRequest(req, "GET /api/community?trending=true");

    if (!supabase) {
      return sendSuccess(
        res,
        {
          topics: [
            { name: "Training", count: 45 },
            { name: "GameDay", count: 38 },
            { name: "Quarterback", count: 27 },
            { name: "Defense", count: 19 },
            { name: "Fitness", count: 15 },
          ],
        },
        COMMUNITY_DB_NOT_CONFIGURED_MESSAGE,
      );
    }

    const { data: topics, error } = await supabase
      .from("trending_topics")
      .select("name, count")
      .eq("is_active", true)
      .order("count", { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }

    return sendSuccess(res, {
      topics: topics || COMMUNITY_DEFAULT_TOPICS,
    });
  } catch (error) {
    logError("Error fetching trending topics", error);
    return sendSuccess(
      res,
      {
        topics: COMMUNITY_DEFAULT_TOPICS,
      },
      "Using default topics",
    );
  }
}

/**
 * POST /api/community?optionId=xxx&pollVote=true
 * Vote on a poll option
 */
async function votePoll(req, res) {
  try {
    logRequest(req, "POST /api/community?pollVote=true");
    const { userId } = req;
    const { optionId } = req.query;

    if (!supabase || !optionId) {
      return sendSuccess(
        res,
        COMMUNITY_EMPTY_POLL_RESPONSE,
        COMMUNITY_DB_OR_MISSING_OPTION_ID_MESSAGE,
      );
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("community_poll_votes")
      .select("id")
      .eq("option_id", optionId)
      .eq("user_id", userId)
      .single();

    if (existingVote) {
      return sendError(res, "Already voted", "ALREADY_VOTED", 200);
    }

    // Add vote
    await supabase.from("community_poll_votes").insert({
      option_id: optionId,
      user_id: userId,
    });

    // Increment vote count
    await supabase.rpc("increment_poll_votes", { option_id: optionId });

    // Get updated poll data
    const { data: option } = await supabase
      .from("community_poll_options")
      .select(
        `
        poll_id,
        community_polls!inner(post_id)
      `,
      )
      .eq("id", optionId)
      .single();

    const { data: allOptions } = await supabase
      .from("community_poll_options")
      .select("id, option_text, votes_count")
      .eq("poll_id", option.poll_id);

    const totalVotes = allOptions?.reduce(
      (sum, opt) => sum + (opt.votes_count || 0),
      0,
    );

    return sendSuccess(res, {
      options: allOptions?.map((opt) => ({
        id: opt.id,
        text: opt.option_text,
        votes: opt.votes_count || 0,
        percentage: totalVotes
          ? Math.round((opt.votes_count / totalVotes) * 100)
          : 0,
      })),
      totalVotes,
    });
  } catch (error) {
    logError("Error voting on poll", error);
    return sendError(res, "Failed to record vote", "CREATE_ERROR", 500);
  }
}

/**
 * Utility: Get relative time string
 */
function getRelativeTime(date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  return "Just now";
}

// =============================================================================
// ROUTE DEFINITIONS - RESTful API (v2.0.0)
// =============================================================================

// Health check
router.get("/health", createHealthCheckHandler(ROUTE_NAME, "2.0.0"));

// =============================================================================
// RESTful Routes (Primary - Use these)
// =============================================================================

// GET /api/community/posts - Get community feed
router.get("/posts", authenticateToken, getCommunityFeed);

// POST /api/community/posts - Create new post
router.post("/posts", authenticateToken, createCommunityPost);

// POST /api/community/posts/:postId/like - Toggle like on a post
router.post("/posts/:postId/like", authenticateToken, async (req, res) => {
  req.query.postId = req.params.postId;
  return togglePostLike(req, res);
});

// POST /api/community/posts/:postId/bookmark - Toggle bookmark on a post
router.post("/posts/:postId/bookmark", authenticateToken, async (req, res) => {
  req.query.postId = req.params.postId;
  return togglePostBookmark(req, res);
});

// GET /api/community/posts/:postId/comments - Get comments for a post
router.get("/posts/:postId/comments", authenticateToken, async (req, res) => {
  req.query.postId = req.params.postId;
  return getPostComments(req, res);
});

// POST /api/community/posts/:postId/comments - Add comment to a post
router.post("/posts/:postId/comments", authenticateToken, async (req, res) => {
  req.query.postId = req.params.postId;
  return addPostComment(req, res);
});

// POST /api/community/comments/:commentId/like - Toggle like on a comment
router.post(
  "/comments/:commentId/like",
  authenticateToken,
  async (req, res) => {
    req.query.commentId = req.params.commentId;
    return toggleCommentLike(req, res);
  },
);

// POST /api/community/polls/:optionId/vote - Vote on a poll option
router.post("/polls/:optionId/vote", authenticateToken, async (req, res) => {
  req.query.optionId = req.params.optionId;
  return votePoll(req, res);
});

// GET /api/community/leaderboard - Get leaderboard
router.get("/leaderboard", authenticateToken, getLeaderboard);

// GET /api/community/trending - Get trending topics
router.get("/trending", authenticateToken, getTrendingTopics);

// =============================================================================
// Legacy Routes (Deprecated - For backwards compatibility)
// Query parameter-based routes will be removed in v3.0.0
// =============================================================================

// GET /api/community (with query params) - DEPRECATED
router.get("/", authenticateToken, async (req, res) => {
  // Log deprecation warning
  serverLogger.warn(
    `[${ROUTE_NAME}] DEPRECATED: Use RESTful routes instead of query params. Path: ${req.originalUrl}`,
  );

  if (req.query.feed === "true") {
    return getCommunityFeed(req, res);
  }
  if (req.query.leaderboard === "true") {
    return getLeaderboard(req, res);
  }
  if (req.query.trending === "true") {
    return getTrendingTopics(req, res);
  }
  if (req.query.postId && req.query.comment === "true") {
    return getPostComments(req, res);
  }

  // Default: return API status with migration notice
  const response = createSuccessResponse(null);
  res.json({
    ...response,
    status: "Community API is running",
    version: "2.0.0",
    migration_notice:
      "Query parameter routes are deprecated. Use RESTful routes: /posts, /posts/:id/like, /leaderboard, etc.",
    timestamp: new Date().toISOString(),
  });
});

// POST /api/community (with query params) - DEPRECATED
router.post("/", authenticateToken, async (req, res) => {
  // Log deprecation warning
  serverLogger.warn(
    `[${ROUTE_NAME}] DEPRECATED: Use RESTful routes instead of query params. Path: ${req.originalUrl}`,
  );

  if (req.query.postId && req.query.like === "true") {
    return togglePostLike(req, res);
  }
  if (req.query.postId && req.query.bookmark === "true") {
    return togglePostBookmark(req, res);
  }
  if (req.query.postId && req.query.comment === "true") {
    return addPostComment(req, res);
  }
  if (req.query.commentId && req.query.commentLike === "true") {
    return toggleCommentLike(req, res);
  }
  if (req.query.optionId && req.query.pollVote === "true") {
    return votePoll(req, res);
  }

  // Default: create post
  return createCommunityPost(req, res);
});

// Legacy route aliases (for backwards compatibility)
router.get("/feed", authenticateToken, getCommunityFeed);

export default router;

/**
 * Community Routes
 * Handles community posts, likes, comments, polls, and trending topics
 *
 * @module routes/community
 * @version 1.0.0
 */

import express from "express";
import { supabase } from "./utils/database.js";
import { serverLogger } from "./utils/server-logger.js";
import { authenticateToken } from "./middleware/auth.middleware.js";
import { createHealthCheckHandler } from "./utils/health-check.js";

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
  if (!supabase) {return [];}
  
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
    const {userId} = req;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    if (!supabase) {
      return res.json({
        success: true,
        data: { posts: [] },
        message: "Database not configured",
      });
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

    if (error) {throw error;}

    // Check if current user liked each post
    const postsWithLikes = await Promise.all(
      (posts || []).map(async (post) => {
        const { data: userLike } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", userId)
          .single();

        const { data: userBookmark } = await supabase
          .from("post_bookmarks")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", userId)
          .single();

        return {
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
          isLiked: !!userLike,
          isBookmarked: !!userBookmark,
        };
      }),
    );

    res.json({
      success: true,
      data: { posts: postsWithLikes },
    });
  } catch (error) {
    logError("Error fetching community feed", error);
    res.json({
      success: true,
      data: { posts: [] },
      message: "No data available",
    });
  }
}

/**
 * POST /api/community
 * Create a new community post
 */
async function createCommunityPost(req, res) {
  try {
    logRequest(req, "POST /api/community");
    const {userId} = req;
    const { content, location, media_url, media_type, post_type } = req.body;

    if (!supabase) {
      return res.json({
        success: true,
        data: {
          id: Date.now().toString(),
          content,
          location,
          authorName: "You",
        },
        message: "Database not configured",
      });
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

    if (error) {throw error;}

    res.json({
      success: true,
      data: {
        id: post.id,
        content: post.content,
        location: post.location,
        authorName: post.users?.full_name || post.users?.email || "You",
      },
    });
  } catch (error) {
    logError("Error creating community post", error);
    res.status(500).json({
      success: false,
      error: "Failed to create post",
    });
  }
}

/**
 * POST /api/community?postId=xxx&like=true
 * Toggle like on a post
 */
async function togglePostLike(req, res) {
  try {
    logRequest(req, "POST /api/community?like=true");
    const {userId} = req;
    const {postId} = req.query;

    if (!supabase || !postId) {
      return res.json({
        success: true,
        message: "Database not configured or missing postId",
      });
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
      await supabase
        .from("post_likes")
        .delete()
        .eq("id", existingLike.id);
    } else {
      // Like
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: userId,
      });
    }

    res.json({ success: true });
  } catch (error) {
    logError("Error toggling post like", error);
    res.json({ success: true, message: "Could not update like" });
  }
}

/**
 * POST /api/community?postId=xxx&bookmark=true
 * Toggle bookmark on a post
 */
async function togglePostBookmark(req, res) {
  try {
    logRequest(req, "POST /api/community?bookmark=true");
    const {userId} = req;
    const {postId} = req.query;

    if (!supabase || !postId) {
      return res.json({
        success: true,
        message: "Database not configured or missing postId",
      });
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

    res.json({ success: true });
  } catch (error) {
    logError("Error toggling bookmark", error);
    res.status(500).json({
      success: false,
      error: "Failed to update bookmark",
    });
  }
}

/**
 * GET /api/community?postId=xxx&comment=true
 * Get comments for a post
 */
async function getPostComments(req, res) {
  try {
    logRequest(req, "GET /api/community?comment=true");
    const {postId} = req.query;

    if (!supabase || !postId) {
      return res.json({
        success: true,
        data: { comments: [] },
        message: "Database not configured or missing postId",
      });
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

    if (error) {throw error;}

    const formattedComments = (comments || []).map((c) => ({
      id: c.id,
      author: c.users?.full_name || c.users?.email || "Unknown",
      content: c.content,
      likes: c.likes_count || 0,
      timeAgo: getRelativeTime(new Date(c.created_at)),
    }));

    res.json({
      success: true,
      data: { comments: formattedComments },
    });
  } catch (error) {
    logError("Error fetching comments", error);
    res.json({
      success: true,
      data: { comments: [] },
      message: "Could not load comments",
    });
  }
}

/**
 * POST /api/community?postId=xxx&comment=true
 * Add a comment to a post
 */
async function addPostComment(req, res) {
  try {
    logRequest(req, "POST /api/community?comment=true");
    const {userId} = req;
    const {postId} = req.query;
    const { content } = req.body;

    if (!supabase || !postId || !content) {
      return res.json({
        success: true,
        data: { id: Date.now().toString() },
        message: "Database not configured or missing data",
      });
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

    if (error) {throw error;}

    res.json({
      success: true,
      data: {
        id: comment.id,
        author: comment.users?.full_name || comment.users?.email || "You",
      },
    });
  } catch (error) {
    logError("Error adding comment", error);
    res.status(500).json({
      success: false,
      error: "Failed to add comment",
    });
  }
}

/**
 * POST /api/community?commentId=xxx&commentLike=true
 * Toggle like on a comment
 */
async function toggleCommentLike(req, res) {
  try {
    logRequest(req, "POST /api/community?commentLike=true");
    const {userId} = req;
    const {commentId} = req.query;

    if (!supabase || !commentId) {
      return res.json({
        success: true,
        message: "Database not configured or missing commentId",
      });
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
      await supabase
        .from("comment_likes")
        .delete()
        .eq("id", existingLike.id);

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

    res.json({ success: true });
  } catch (error) {
    logError("Error toggling comment like", error);
    res.json({ success: true, message: "Could not update comment like" });
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
      return res.json({
        success: true,
        data: [],
        message: "Database not configured",
      });
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

    res.json({
      success: true,
      data: ranked,
    });
  } catch (error) {
    logError("Error fetching leaderboard", error);
    res.json({
      success: true,
      data: [],
      message: "No data available",
    });
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
      return res.json({
        success: true,
        data: {
          topics: [
            { name: "Training", count: 45 },
            { name: "GameDay", count: 38 },
            { name: "Quarterback", count: 27 },
            { name: "Defense", count: 19 },
            { name: "Fitness", count: 15 },
          ],
        },
        message: "Database not configured",
      });
    }

    const { data: topics, error } = await supabase
      .from("trending_topics")
      .select("name, count")
      .eq("is_active", true)
      .order("count", { ascending: false })
      .limit(5);

    if (error) {throw error;}

    res.json({
      success: true,
      data: {
        topics: topics || [
          { name: "Training", count: 45 },
          { name: "GameDay", count: 38 },
          { name: "Quarterback", count: 27 },
          { name: "Defense", count: 19 },
          { name: "Fitness", count: 15 },
        ],
      },
    });
  } catch (error) {
    logError("Error fetching trending topics", error);
    res.json({
      success: true,
      data: {
        topics: [
          { name: "Training", count: 45 },
          { name: "GameDay", count: 38 },
          { name: "Quarterback", count: 27 },
          { name: "Defense", count: 19 },
          { name: "Fitness", count: 15 },
        ],
      },
      message: "Using default topics",
    });
  }
}

/**
 * POST /api/community?optionId=xxx&pollVote=true
 * Vote on a poll option
 */
async function votePoll(req, res) {
  try {
    logRequest(req, "POST /api/community?pollVote=true");
    const {userId} = req;
    const {optionId} = req.query;

    if (!supabase || !optionId) {
      return res.json({
        success: true,
        data: { options: [], totalVotes: 0 },
        message: "Database not configured or missing optionId",
      });
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("community_poll_votes")
      .select("id")
      .eq("option_id", optionId)
      .eq("user_id", userId)
      .single();

    if (existingVote) {
      return res.json({
        success: false,
        error: "Already voted",
      });
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

    res.json({
      success: true,
      data: {
        options: allOptions?.map((opt) => ({
          id: opt.id,
          text: opt.option_text,
          votes: opt.votes_count || 0,
          percentage: totalVotes
            ? Math.round((opt.votes_count / totalVotes) * 100)
            : 0,
        })),
        totalVotes,
      },
    });
  } catch (error) {
    logError("Error voting on poll", error);
    res.status(500).json({
      success: false,
      error: "Failed to record vote",
    });
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

  if (days > 0) {return `${days}d ago`;}
  if (hours > 0) {return `${hours}h ago`;}
  return "Just now";
}

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

// Health check
router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.0.0"));

// GET /api/community
router.get("/", authenticateToken, async (req, res) => {
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

  // Default: return health check
  res.json({
    success: true,
    status: "Community API is running",
    timestamp: new Date().toISOString(),
  });
});

// POST /api/community
router.post("/", authenticateToken, async (req, res) => {
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

// Legacy routes for backwards compatibility
router.get("/feed", authenticateToken, getCommunityFeed);
router.get("/leaderboard", authenticateToken, getLeaderboard);
router.post("/posts", authenticateToken, createCommunityPost);

export default router;

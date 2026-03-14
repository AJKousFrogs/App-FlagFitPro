import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { checkEnvVars, supabaseAdmin } from "./supabase-client.js";
import { parseJsonObjectBody, sanitizeObject } from "./utils/input-validator.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { authenticateRequest } from "./utils/auth-helper.js";

// Netlify Function: Community API
// Returns community feed, posts, and leaderboard data

const parseBoundedInt = (value, fieldName, { min, max }) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const normalized = String(value).trim();
  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return parsed;
};

// Get community feed from database with privacy filtering
const getCommunityFeed = async (userId, limit = 20, offset = 0) => {
  try {
    checkEnvVars();

    // SECURITY: Build query with privacy filters
    let query = supabaseAdmin
      .from("posts")
      .select(
        `
        *,
        users:user_id (
          id,
          email,
          name,
          avatar_url
        )
      `,
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // SECURITY: If user is authenticated, apply privacy filters
    if (userId) {
      // Get user's team membership for team-only posts
      const { data: teamMemberships } = await supabaseAdmin
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId);

      const _userTeamIds = teamMemberships?.map((m) => m.team_id) || [];

      // Get blocked users (both ways)
      const { data: blockedUsers } = await supabaseAdmin
        .from("blocked_users")
        .select("blocked_user_id")
        .eq("user_id", userId);

      const { data: blockedBy } = await supabaseAdmin
        .from("blocked_users")
        .select("user_id")
        .eq("blocked_user_id", userId);

      const blockedUserIds = [
        ...(blockedUsers?.map((b) => b.blocked_user_id) || []),
        ...(blockedBy?.map((b) => b.user_id) || []),
      ];

      // SECURITY: Exclude posts from blocked users
      if (blockedUserIds.length > 0) {
        query = query.not("user_id", "in", `(${blockedUserIds.join(",")})`);
      }
    }

    const { data: posts, error } = await query;

    if (error) {
      throw error;
    }

    // Get user's likes if authenticated
    let userLikedPostIds = new Set();
    let userBookmarkedPostIds = new Set();
    if (userId && posts?.length > 0) {
      const postIds = posts.map((p) => p.id);

      // Get user's likes
      const { data: userLikes } = await supabaseAdmin
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds);

      userLikedPostIds = new Set((userLikes || []).map((l) => l.post_id));

      // Get user's bookmarks
      const { data: userBookmarks } = await supabaseAdmin
        .from("post_bookmarks")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds);

      userBookmarkedPostIds = new Set(
        (userBookmarks || []).map((b) => b.post_id),
      );
    }

    // Transform database format to match frontend format
    return (posts || []).map((post) => ({
      id: post.id,
      author: post.users?.email || post.user_id,
      authorName: post.users?.name || "Unknown User",
      authorAvatar: post.users?.avatar_url || null,
      content: post.content,
      title: post.title || null,
      timestamp: post.created_at,
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      shares: post.shares_count || 0,
      isLiked: userLikedPostIds.has(post.id),
      isBookmarked: userBookmarkedPostIds.has(post.id),
      postType: post.post_type || "general",
      location: post.location || null,
      mediaUrl: post.media_url || null,
      mediaType: post.media_type || null,
    }));
  } catch (error) {
    console.error("Error fetching community feed:", error);
    // Return empty array on error
    return [];
  }
};

// Get community leaderboard
const getCommunityLeaderboard = async (_category = "overall", limit = 10) => {
  try {
    checkEnvVars();

    // Calculate leaderboard from posts and user engagement
    // This aggregates data from posts table
    const { data: leaderboardData, error } = await supabaseAdmin
      .from("posts")
      .select(
        `
        user_id,
        users:user_id (
          id,
          name,
          avatar_url
        )
      `,
      )
      .eq("is_published", true);

    if (error) {
      throw error;
    }

    // Aggregate by user
    const userStats = {};
    (leaderboardData || []).forEach((post) => {
      const userId = post.user_id;
      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          name: post.users?.name || "Unknown User",
          avatar: post.users?.avatar_url || null,
          posts: 0,
          likes: 0,
          comments: 0,
          points: 0,
        };
      }
      userStats[userId].posts += 1;
      // Points calculation: posts * 10 + likes * 2 + comments * 5
      userStats[userId].points += 10;
    });

    // Convert to array and sort by points
    const leaderboard = Object.values(userStats)
      .sort((a, b) => b.points - a.points)
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        name: user.name,
        avatar: user.avatar,
        points: user.points,
        posts: user.posts,
        wins: user.wins || 0,
        losses: 0,
        pointsScored: user.points,
      }));

    return leaderboard;
  } catch (error) {
    console.error("Error fetching community leaderboard:", error);
    // Return empty array on error
    return [];
  }
};

// Create a new post with validation
const createPost = async (userId, postData) => {
  try {
    checkEnvVars();

    // SECURITY: Sanitize input to prevent XSS
    const sanitizedData = sanitizeObject(postData);

    // SECURITY: Validate required fields
    if (!sanitizedData.content && !sanitizedData.text) {
      throw new Error("Post content is required");
    }

    const content = sanitizedData.content || sanitizedData.text || "";

    // SECURITY: Validate content length
    if (content.length < 1) {
      throw new Error("Post content cannot be empty");
    }
    if (content.length > 5000) {
      throw new Error("Post content must be at most 5000 characters");
    }

    // SECURITY: Validate title length if provided
    if (sanitizedData.title && sanitizedData.title.length > 200) {
      throw new Error("Post title must be at most 200 characters");
    }

    // SECURITY: Validate post type
    const validPostTypes = [
      "general",
      "achievement",
      "question",
      "announcement",
      "training",
      "game",
    ];
    const postType = sanitizedData.post_type || sanitizedData.type || "general";
    if (!validPostTypes.includes(postType)) {
      throw new Error(
        `Invalid post type. Must be one of: ${validPostTypes.join(", ")}`,
      );
    }

    // Insert post into database
    const postToCreate = {
      user_id: userId,
      content,
      title: sanitizedData.title || null,
      post_type: postType,
      location: sanitizedData.location || null,
      media_url: sanitizedData.media_url || null,
      media_type: sanitizedData.media_type || null,
      is_published: sanitizedData.is_published !== false, // Default to published
    };

    const { data: newPost, error } = await supabaseAdmin
      .from("posts")
      .insert(postToCreate)
      .select(
        `
        *,
        users:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `,
      )
      .single();

    if (error) {
      throw error;
    }

    // Transform to match frontend format
    return {
      id: newPost.id,
      author: newPost.users?.email || userId,
      authorName: newPost.users?.name || "Unknown User",
      authorAvatar: newPost.users?.avatar_url || null,
      content: newPost.content,
      title: newPost.title,
      timestamp: newPost.created_at,
      likes: newPost.likes_count || 0,
      comments: newPost.comments_count || 0,
      shares: newPost.shares_count || 0,
      isLiked: false,
      isBookmarked: false,
      postType: newPost.post_type || "general",
      location: newPost.location || null,
      mediaUrl: newPost.media_url || null,
      mediaType: newPost.media_type || null,
    };
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

// Toggle like on a post
const toggleLike = async (userId, postId) => {
  try {
    checkEnvVars();

    // Check if user already liked this post
    const { data: existingLike } = await supabaseAdmin
      .from("post_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    if (existingLike) {
      // Unlike: remove the like
      await supabaseAdmin.from("post_likes").delete().eq("id", existingLike.id);

      // Decrement likes count
      await supabaseAdmin.rpc("decrement_likes_count", { post_id: postId });

      return { liked: false, message: "Post unliked" };
    } else {
      // Like: add a new like
      await supabaseAdmin.from("post_likes").insert({
        user_id: userId,
        post_id: postId,
      });

      // Increment likes count
      await supabaseAdmin.rpc("increment_likes_count", { post_id: postId });

      return { liked: true, message: "Post liked" };
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};

// Toggle bookmark on a post
const toggleBookmark = async (userId, postId) => {
  try {
    checkEnvVars();

    // Check if user already bookmarked this post
    const { data: existingBookmark } = await supabaseAdmin
      .from("post_bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    if (existingBookmark) {
      // Remove bookmark
      await supabaseAdmin
        .from("post_bookmarks")
        .delete()
        .eq("id", existingBookmark.id);

      return { bookmarked: false, message: "Bookmark removed" };
    } else {
      // Add bookmark
      await supabaseAdmin.from("post_bookmarks").insert({
        user_id: userId,
        post_id: postId,
      });

      return { bookmarked: true, message: "Post bookmarked" };
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    throw error;
  }
};

// Get comments for a post
const getPostComments = async (postId, userId = null) => {
  try {
    checkEnvVars();

    const { data: comments, error } = await supabaseAdmin
      .from("post_comments")
      .select(
        `
        *,
        users:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `,
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    // Get user's comment likes if authenticated
    let userLikedCommentIds = new Set();
    if (userId && comments?.length > 0) {
      const commentIds = comments.map((c) => c.id);
      const { data: userCommentLikes } = await supabaseAdmin
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", userId)
        .in("comment_id", commentIds);

      userLikedCommentIds = new Set(
        (userCommentLikes || []).map((l) => l.comment_id),
      );
    }

    return (comments || []).map((comment) => ({
      id: comment.id,
      author: comment.users?.name || "Unknown User",
      authorInitials: getInitials(comment.users?.name || "??"),
      authorAvatar: comment.users?.avatar_url || null,
      content: comment.content,
      timeAgo: getRelativeTime(new Date(comment.created_at)),
      likes: comment.likes_count || 0,
      isLiked: userLikedCommentIds.has(comment.id),
    }));
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

// Add a comment to a post
const addComment = async (userId, postId, content) => {
  try {
    checkEnvVars();

    // SECURITY: Validate content
    if (!content || content.trim().length === 0) {
      throw new Error("Comment content is required");
    }
    if (content.length > 2000) {
      throw new Error("Comment must be at most 2000 characters");
    }

    // Insert comment
    const { data: newComment, error } = await supabaseAdmin
      .from("post_comments")
      .insert({
        user_id: userId,
        post_id: postId,
        content: content.trim(),
      })
      .select(
        `
        *,
        users:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `,
      )
      .single();

    if (error) {
      throw error;
    }

    // Increment comments count on the post
    await supabaseAdmin.rpc("increment_comments_count", { post_id: postId });

    return {
      id: newComment.id,
      author: newComment.users?.name || "Unknown User",
      authorInitials: getInitials(newComment.users?.name || "??"),
      authorAvatar: newComment.users?.avatar_url || null,
      content: newComment.content,
      timeAgo: "Just now",
      likes: 0,
      isLiked: false,
    };
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

// Toggle like on a comment
const toggleCommentLike = async (userId, commentId) => {
  try {
    checkEnvVars();

    // Check if user already liked this comment
    const { data: existingLike } = await supabaseAdmin
      .from("comment_likes")
      .select("id")
      .eq("user_id", userId)
      .eq("comment_id", commentId)
      .single();

    if (existingLike) {
      // Unlike
      await supabaseAdmin
        .from("comment_likes")
        .delete()
        .eq("id", existingLike.id);

      // Decrement likes count
      await supabaseAdmin.rpc("decrement_comment_likes_count", {
        comment_id: commentId,
      });

      return { liked: false, message: "Comment unliked" };
    } else {
      // Like
      await supabaseAdmin.from("comment_likes").insert({
        user_id: userId,
        comment_id: commentId,
      });

      // Increment likes count
      await supabaseAdmin.rpc("increment_comment_likes_count", {
        comment_id: commentId,
      });

      return { liked: true, message: "Comment liked" };
    }
  } catch (error) {
    console.error("Error toggling comment like:", error);
    throw error;
  }
};

// Get trending topics
const getTrendingTopics = async (limit = 5) => {
  try {
    checkEnvVars();

    const { data: topics, error } = await supabaseAdmin
      .from("trending_topics")
      .select("*")
      .eq("is_active", true)
      .order("count", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (topics || []).map((topic) => ({
      id: topic.id,
      name: topic.name,
      count: topic.count,
    }));
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return [];
  }
};

// Helper function to get initials
const getInitials = (name) => {
  if (!name) {
    return "??";
  }
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to get relative time
const getRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return `${Math.floor(diffDays / 7)}w ago`;
};

// Create a poll for a post (exported for future use)
const _createPoll = async (postId, pollData) => {
  try {
    checkEnvVars();

    const { question, options, endsAt } = pollData;

    // Validate
    if (!question || question.trim().length === 0) {
      throw new Error("Poll question is required");
    }
    if (!options || options.length < 2) {
      throw new Error("At least 2 options are required");
    }

    // Create poll
    const { data: poll, error: pollError } = await supabaseAdmin
      .from("community_polls")
      .insert({
        post_id: postId,
        question: question.trim(),
        ends_at: endsAt || null,
      })
      .select()
      .single();

    if (pollError) {
      throw pollError;
    }

    // Create poll options
    const optionsToInsert = options.map((text) => ({
      poll_id: poll.id,
      option_text: text.trim(),
      votes_count: 0,
    }));

    const { data: pollOptions, error: optionsError } = await supabaseAdmin
      .from("community_poll_options")
      .insert(optionsToInsert)
      .select();

    if (optionsError) {
      throw optionsError;
    }

    return {
      id: poll.id,
      question: poll.question,
      options: pollOptions.map((opt) => ({
        id: opt.id,
        text: opt.option_text,
        votes: opt.votes_count,
        percentage: 0,
      })),
      totalVotes: 0,
      endsAt: poll.ends_at,
    };
  } catch (error) {
    console.error("Error creating poll:", error);
    throw error;
  }
};

// Vote on a poll
const votePoll = async (userId, optionId) => {
  const expectedMessages = new Set([
    "Poll option not found",
    "You have already voted on this poll",
  ]);
  try {
    checkEnvVars();

    // Check if user already voted on this poll
    const { data: option } = await supabaseAdmin
      .from("community_poll_options")
      .select("poll_id")
      .eq("id", optionId)
      .single();

    if (!option) {
      throw new Error("Poll option not found");
    }

    const { data: existingVote } = await supabaseAdmin
      .from("community_poll_votes")
      .select("id")
      .eq("user_id", userId)
      .eq("option_id", optionId)
      .single();

    if (existingVote) {
      throw new Error("You have already voted on this poll");
    }

    // Check if user voted on any option in this poll
    const { data: pollOptions } = await supabaseAdmin
      .from("community_poll_options")
      .select("id")
      .eq("poll_id", option.poll_id);

    const optionIds = pollOptions?.map((o) => o.id) || [];

    const { data: anyVote } = await supabaseAdmin
      .from("community_poll_votes")
      .select("id")
      .eq("user_id", userId)
      .in("option_id", optionIds)
      .limit(1);

    if (anyVote && anyVote.length > 0) {
      throw new Error("You have already voted on this poll");
    }

    // Record vote
    await supabaseAdmin.from("community_poll_votes").insert({
      option_id: optionId,
      user_id: userId,
    });

    // Increment vote count
    await supabaseAdmin.rpc("increment_poll_votes", { option_id: optionId });

    // Get updated poll data
    const { data: updatedOptions } = await supabaseAdmin
      .from("community_poll_options")
      .select("*")
      .eq("poll_id", option.poll_id);

    const totalVotes = (updatedOptions || []).reduce(
      (sum, opt) => sum + opt.votes_count,
      0,
    );

    return {
      voted: true,
      optionId,
      options: (updatedOptions || []).map((opt) => ({
        id: opt.id,
        text: opt.option_text,
        votes: opt.votes_count,
        percentage:
          totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0,
      })),
      totalVotes,
    };
  } catch (error) {
    if (!expectedMessages.has(error?.message)) {
      console.error("Error voting on poll:", error);
    }
    throw error;
  }
};

// Get poll for a post
const getPollForPost = async (postId, userId = null) => {
  try {
    checkEnvVars();

    const { data: poll, error } = await supabaseAdmin
      .from("community_polls")
      .select(
        `
        *,
        community_poll_options (*)
      `,
      )
      .eq("post_id", postId)
      .single();

    if (error || !poll) {
      return null;
    }

    const options = poll.community_poll_options || [];
    const totalVotes = options.reduce((sum, opt) => sum + opt.votes_count, 0);

    // Check if user has voted
    let userVote = null;
    if (userId) {
      const optionIds = options.map((o) => o.id);
      const { data: vote } = await supabaseAdmin
        .from("community_poll_votes")
        .select("option_id")
        .eq("user_id", userId)
        .in("option_id", optionIds)
        .single();

      userVote = vote?.option_id || null;
    }

    return {
      id: poll.id,
      question: poll.question,
      options: options.map((opt) => ({
        id: opt.id,
        text: opt.option_text,
        votes: opt.votes_count,
        percentage:
          totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0,
      })),
      totalVotes,
      userVote,
      endsAt: poll.ends_at,
    };
  } catch (error) {
    console.error("Error getting poll:", error);
    return null;
  }
};

const handler = async (event, context) => {
  // Community has special auth handling: optional for GET, required for POST
  const rateLimitType = event.httpMethod === "POST" ? "CREATE" : "READ";

  if (event.httpMethod === "POST" || event.httpMethod === "DELETE") {
    return baseHandler(event, context, {
      functionName: "community",
      allowedMethods: ["GET", "POST", "DELETE"],
      rateLimitType,
      requireAuth: true,
      handler: async (event, _context, { requestId }) => {
        return handleCommunityRequest(event, requestId);
      },
    });
  }

  return baseHandler(event, context, {
    functionName: "community",
    allowedMethods: ["GET", "POST", "DELETE"],
    rateLimitType,
    requireAuth: false, // Optional auth for read-only access
    handler: async (event, _context, { requestId }) => {
      return handleCommunityRequest(event, requestId);
    },
  });
};

async function handleCommunityRequest(event, requestId) {
      // SECURITY: Authentication (optional for GET, required for POST/DELETE)
      let userId = null;
      const headers = event.headers || {};
      const authHeader = headers.authorization || headers.Authorization;

      // SECURITY FIX: Require auth header for POST/DELETE even before checking token
      if (event.httpMethod === "POST" || event.httpMethod === "DELETE") {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return createErrorResponse(
            "Authentication required",
            401,
            "auth_required",
            requestId,
          );
        }
      }

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const auth = await authenticateRequest(event);
        if (auth.success) {
          userId = auth.user.id;
        } else if (
          event.httpMethod === "POST" ||
          event.httpMethod === "DELETE"
        ) {
          return createErrorResponse(
            "Authentication required",
            401,
            "auth_required",
            requestId,
          );
        }
      }

      const queryParams = event.queryStringParameters || {};
      const {
        feed,
        leaderboard,
        postId,
        like,
        bookmark,
        comment,
        commentId,
        commentLike,
        trending,
        poll,
        pollVote,
        optionId,
        limit,
        offset,
        category,
      } = queryParams;

      let parsedLimit;
      let parsedOffset;
      try {
        parsedLimit = parseBoundedInt(limit, "limit", { min: 1, max: 200 });
        parsedOffset = parseBoundedInt(offset, "offset", { min: 0, max: 1000000 });
      } catch (error) {
        return createErrorResponse(
          error.message || "Invalid query parameter",
          422,
          "validation_error",
          requestId,
        );
      }

      // Handle GET requests
      if (event.httpMethod === "GET") {
        // Get feed
        if (feed === "true" || feed === true) {
          const feedData = await getCommunityFeed(
            userId,
            parsedLimit ?? 20,
            parsedOffset ?? 0,
          );
          return createSuccessResponse({ posts: feedData }, requestId);
        }

        // Get leaderboard
        if (leaderboard === "true" || leaderboard === true) {
          const leaderboardData = await getCommunityLeaderboard(
            category || "overall",
            parsedLimit ?? 10,
          );
          return createSuccessResponse(leaderboardData, requestId);
        }

        // Get trending topics
        if (trending === "true" || trending === true) {
          const topics = await getTrendingTopics(parsedLimit ?? 5);
          return createSuccessResponse({ topics }, requestId);
        }

        // Get comments for a post
        if (postId && comment === "true") {
          const comments = await getPostComments(postId, userId);
          return createSuccessResponse({ comments }, requestId);
        }

        // Get poll for a post
        if (postId && poll === "true") {
          const pollData = await getPollForPost(postId, userId);
          return createSuccessResponse({ poll: pollData }, requestId);
        }

        // Default: return feed
        const feedData = await getCommunityFeed(
          userId,
          parsedLimit ?? 20,
          parsedOffset ?? 0,
        );
        return createSuccessResponse({ posts: feedData }, requestId);
      }

      // Handle POST requests
      if (event.httpMethod === "POST") {
        if (!userId) {
          return createErrorResponse(
            "Authentication required",
            401,
            "auth_required",
            requestId,
          );
        }

        // Toggle like on a post
        if (postId && like === "true") {
          const result = await toggleLike(userId, postId);
          return createSuccessResponse(result, requestId);
        }

        // Toggle bookmark on a post
        if (postId && bookmark === "true") {
          const result = await toggleBookmark(userId, postId);
          return createSuccessResponse(result, requestId);
        }

        // Add comment to a post
        if (postId && comment === "true") {
          let body = {};
          try {
            body = parseJsonObjectBody(event.body);
          } catch (error) {
            if (
              error?.code === "INVALID_JSON_BODY" &&
              error?.message === "Invalid JSON in request body"
            ) {
              return createErrorResponse(
                "Invalid JSON in request body",
                400,
                "invalid_json",
                requestId,
              );
            }
            return createErrorResponse(
              error.message,
              422,
              "validation_error",
              requestId,
            );
          }

          const newComment = await addComment(userId, postId, body.content);
          return createSuccessResponse(
            { ...newComment, message: "Comment added" },
            requestId,
            201,
          );
        }

        // Toggle like on a comment
        if (commentId && commentLike === "true") {
          const result = await toggleCommentLike(userId, commentId);
          return createSuccessResponse(result, requestId);
        }

        // Vote on a poll
        if (optionId && pollVote === "true") {
          try {
            const result = await votePoll(userId, optionId);
            return createSuccessResponse(result, requestId);
          } catch (error) {
            if (error.message === "Poll option not found") {
              return createErrorResponse(
                "Poll option not found",
                404,
                "not_found",
                requestId,
              );
            }
            if (error.message === "You have already voted on this poll") {
              return createErrorResponse(
                "You have already voted on this poll",
                409,
                "conflict",
                requestId,
              );
            }
            return createErrorResponse(
              "Failed to vote",
              500,
              "server_error",
              requestId,
            );
          }
        }

        // Create a new post
        let postData = {};
        try {
          postData = parseJsonObjectBody(event.body);
        } catch (error) {
          if (
            error?.code === "INVALID_JSON_BODY" &&
            error?.message === "Invalid JSON in request body"
          ) {
            return createErrorResponse(
              "Invalid JSON in request body",
              400,
              "invalid_json",
              requestId,
            );
          }
          return createErrorResponse(
            error.message,
            422,
            "validation_error",
            requestId,
          );
        }

        const newPost = await createPost(userId, postData);
        return createSuccessResponse(
          { ...newPost, message: "Post created successfully" },
          requestId,
          201,
        );
      }

      return createErrorResponse(
        "Method not allowed",
        405,
        "method_not_allowed",
        requestId,
      );
}

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);

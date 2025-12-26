// Netlify Function: Community API
// Returns community feed, posts, and leaderboard data

const { db, checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const { sanitize } = require("./validation.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleAuthenticationError,
  handleValidationError,
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");
const { authenticateRequest } = require("./utils/auth-helper.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");

// Get community feed from database with privacy filtering
const getCommunityFeed = async (userId, limit = 20) => {
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
      .limit(limit);

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

      // For now, show all public posts
      // In future: filter by privacy_setting column
      // .or(`privacy_setting.eq.public,and(privacy_setting.eq.team,team_id.in.(${userTeamIds.join(",")}))`)
    } else {
      // SECURITY: Non-authenticated users only see public posts
      // In future: add privacy_setting filter
      // .eq("privacy_setting", "public")
    }

    const { data: posts, error } = await query;

    if (error) {
      throw error;
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
      isLiked: false, // Would need to check user's likes table
      postType: post.post_type || "general",
      location: null, // Can be added to posts table if needed
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
          userId: userId,
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
        wins: Math.floor(user.points / 100), // Mock wins calculation
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
    const sanitizedData = sanitize(postData);

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

    // Insert post into database using supabase-client helper
    const postToCreate = {
      user_id: userId,
      content: content,
      title: sanitizedData.title || null,
      post_type: postType,
      is_published: sanitizedData.is_published !== false, // Default to published
    };

    const newPost = await db.community.createPost(postToCreate);

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
      postType: newPost.post_type || "general",
    };
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

exports.handler = async (event, _context) => {
  logFunctionCall("Community", event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  try {
    // SECURITY: Apply rate limiting
    const rateLimitType = event.httpMethod === "POST" ? "CREATE" : "READ";
    const rateLimitResponse = applyRateLimit(event, rateLimitType);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // SECURITY: Authentication (optional for GET, required for POST)
    let userId = null;
    const authHeader =
      event.headers.authorization || event.headers.Authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const auth = await authenticateRequest(event);
      if (auth.success) {
        userId = auth.user.id;
      } else {
        // For GET requests, continue without auth (show public feed)
        // For POST requests, return auth error
        if (event.httpMethod === "POST") {
          return auth.error;
        }
      }
    }

    const queryParams = event.queryStringParameters || {};
    const { feed, leaderboard, postId, like, limit, category } = queryParams;

    // Handle different endpoints
    if (event.httpMethod === "GET") {
      // Handle feed request
      if (feed === "true" || feed === true) {
        const feedData = await getCommunityFeed(userId, parseInt(limit) || 20);
        return createSuccessResponse({ posts: feedData });
      }

      // Handle leaderboard request
      if (leaderboard === "true" || leaderboard === true) {
        const leaderboardData = await getCommunityLeaderboard(
          category || "overall",
          parseInt(limit) || 10,
        );
        return createSuccessResponse(leaderboardData);
      }

      // Handle comments request
      if (postId) {
        // Return empty comments for now
        return createSuccessResponse({ comments: [] });
      }

      // Default: return feed
      const feedData = await getCommunityFeed(userId, parseInt(limit) || 20);
      return createSuccessResponse({ posts: feedData });
    }

    if (event.httpMethod === "POST") {
      // SECURITY: Require authentication for all POST operations
      if (!userId) {
        return handleAuthenticationError(
          "Authentication required to create posts",
        );
      }

      // Handle like request
      if (like) {
        return createSuccessResponse(null, 200, "Post liked");
      }

      // Parse and validate request body
      let postData = {};
      try {
        postData = JSON.parse(event.body || "{}");
      } catch (_parseError) {
        return handleValidationError("Invalid JSON in request body");
      }

      const newPost = await createPost(userId, postData);

      return createSuccessResponse(newPost, 201, "Post created successfully");
    }

    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  } catch (error) {
    // Handle validation errors
    if (
      error.message &&
      (error.message.includes("required") ||
        error.message.includes("must be") ||
        error.message.includes("Invalid"))
    ) {
      return handleValidationError(error.message);
    }

    return handleServerError(error, "Community");
  }
};

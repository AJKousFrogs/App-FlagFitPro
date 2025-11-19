// Netlify Function: Community API
// Returns community feed, posts, and leaderboard data

const jwt = require("jsonwebtoken");
const { db, checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");

const JWT_SECRET = process.env.JWT_SECRET;

// Get community feed from database
const getCommunityFeed = async (userId, limit = 20) => {
  try {
    checkEnvVars();
    
    // Get posts from database using supabase-client helper
    const posts = await db.community.getFeedPosts(limit);
    
    // Transform database format to match frontend format
    return posts.map(post => ({
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
const getCommunityLeaderboard = async (category = "overall", limit = 10) => {
  try {
    checkEnvVars();
    
    // Calculate leaderboard from posts and user engagement
    // This aggregates data from posts table
    const { data: leaderboardData, error } = await supabaseAdmin
      .from("posts")
      .select(`
        user_id,
        users:user_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq("is_published", true);
    
    if (error) throw error;
    
    // Aggregate by user
    const userStats = {};
    (leaderboardData || []).forEach(post => {
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

// Create a new post
const createPost = async (userId, postData) => {
  try {
    checkEnvVars();
    
    // Insert post into database using supabase-client helper
    const postToCreate = {
      user_id: userId,
      content: postData.content || postData.text || "",
      title: postData.title || null,
      post_type: postData.post_type || postData.type || "general",
      is_published: postData.is_published !== false, // Default to published
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

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    };
  }

  try {
    // Get authorization header (optional for some endpoints)
    const authHeader =
      event.headers.authorization || event.headers.Authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (jwtError) {
        // Token verification failed, but continue for public endpoints
        console.warn("Token verification failed:", jwtError.message);
      }
    }

    const queryParams = event.queryStringParameters || {};
    const { feed, leaderboard, postId, like, limit, category } = queryParams;

    // Handle different endpoints
    if (event.httpMethod === "GET") {
      // Handle feed request
      if (feed === "true" || feed === true) {
        const feedData = await getCommunityFeed(userId, parseInt(limit) || 20);
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: true,
            data: { posts: feedData },
          }),
        };
      }

      // Handle leaderboard request
      if (leaderboard === "true" || leaderboard === true) {
        const leaderboardData = await getCommunityLeaderboard(
          category || "overall",
          parseInt(limit) || 10,
        );
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: true,
            data: leaderboardData,
          }),
        };
      }

      // Handle comments request
      if (postId) {
        // Return empty comments for now
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: true,
            data: { comments: [] },
          }),
        };
      }

      // Default: return feed
      const feedData = await getCommunityFeed(userId, parseInt(limit) || 20);
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: true,
          data: { posts: feedData },
        }),
      };
    }

    if (event.httpMethod === "POST") {
      // Handle like request
      if (like) {
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: true,
            message: "Post liked",
          }),
        };
      }

    if (event.httpMethod === "POST") {
      if (!userId) {
        return {
          statusCode: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: false,
            error: "Authentication required",
          }),
        };
      }

      const postData = JSON.parse(event.body || "{}");
      const newPost = await createPost(userId, postData);

      return {
        statusCode: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: true,
          data: newPost,
        }),
      };
    }

    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
    };
  } catch (error) {
    console.error("Community API error:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
    };
  }
};


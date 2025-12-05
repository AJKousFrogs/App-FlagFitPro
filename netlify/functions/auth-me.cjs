// Netlify Function: Get Current User
// Returns current user information from JWT token using Supabase

const jwt = require("jsonwebtoken");
const { db, checkEnvVars } = require("./supabase-client.cjs");
const {
  validateJWT,
  createSuccessResponse,
  handleNotFoundError,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

// JWT_SECRET will be checked at runtime, not module load time
// This prevents the function from failing to load if env var is missing
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("CRITICAL: JWT_SECRET environment variable is not set!");
    throw new Error("JWT_SECRET environment variable is required for security");
  }
  return secret;
};

exports.handler = async (event, context) => {
  // Log function call
  logFunctionCall('Auth-Me', event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
    };
  }

  try {
    // Check environment variables
    checkEnvVars();
    
    // Get JWT_SECRET
    const JWT_SECRET = getJWTSecret();

    // Validate JWT token using standardized error handling
    const jwtValidation = validateJWT(event, jwt, JWT_SECRET);
    if (!jwtValidation.success) {
      return jwtValidation.error;
    }
    const { decoded } = jwtValidation;

    // Get user by ID from database
    let user;
    try {
      user = await db.users.findById(decoded.userId);
    } catch (dbError) {
      console.error("Database error finding user:", dbError);
      return handleServerError(dbError, "Failed to retrieve user");
    }
    
    if (!user) {
      return handleNotFoundError('User');
    }

    // Return user data (exclude password)
    const { password: _, ...safeUser } = user;

    return createSuccessResponse({ user: safeUser });
  } catch (error) {
    console.error("Error in auth-me function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    return handleServerError(error, 'Auth-Me');
  }
};

// Netlify Function: User Authentication - Registration
// Handles new user registration with email/password using Supabase

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { db, checkEnvVars } = require("./supabase-client.cjs");
const { validateRequestBody } = require("./validation.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");
const { applyCSRFProtection } = require("./utils/csrf-protection.cjs");
const {
  createSuccessResponse,
  handleServerError,
  handleConflictError,
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
  logFunctionCall('Auth-Register', event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
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
  }

  // SECURITY: Apply rate limiting - 5 registration attempts per 15 minutes
  const rateLimitError = applyRateLimit(event, 5, 900000);
  if (rateLimitError) {
    rateLimitError.headers["Access-Control-Allow-Origin"] = "*";
    return rateLimitError;
  }

  // SECURITY: Apply CSRF protection
  const csrfError = applyCSRFProtection(event);
  if (csrfError) {
    csrfError.headers["Access-Control-Allow-Origin"] = "*";
    return csrfError;
  }

  try {
    // Check environment variables
    checkEnvVars();
    
    // Check JWT_SECRET
    const JWT_SECRET = getJWTSecret();

    // Validate request body
    const validation = validateRequestBody(event.body, 'register');
    if (!validation.valid) {
      return validation.response;
    }

    // Use sanitized data
    const { name, email, password, role } = validation.data;

    // Check if user already exists in database
    const normalizedEmail = email.toLowerCase();
    let existingUser;
    try {
      existingUser = await db.users.findByEmail(normalizedEmail);
    } catch (dbError) {
      console.error("Database error checking existing user:", dbError);
      return handleServerError(dbError, "Failed to check user existence");
    }

    if (existingUser) {
      return handleConflictError("User with this email already exists");
    }

    // Hash password
    let hashedPassword;
    try {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch (bcryptError) {
      console.error("Error hashing password:", bcryptError);
      return handleServerError(bcryptError, "Failed to process password");
    }

    // Create new user in database
    let newUser;
    try {
      newUser = await db.users.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "player",
      });
    } catch (dbError) {
      console.error("Database error creating user:", dbError);
      return handleServerError(dbError, "Failed to create user account");
    }

    // Generate JWT token
    let token;
    try {
      token = jwt.sign(
        {
          userId: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      );
    } catch (jwtError) {
      console.error("Error generating JWT token:", jwtError);
      return handleServerError(jwtError, "Failed to generate authentication token");
    }

    // Return success response (exclude password)
    const { password: _, ...safeUser } = newUser;

    return createSuccessResponse(
      { token, user: safeUser },
      201,
      "Account created successfully"
    );
  } catch (error) {
    console.error("Error in auth-register function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    return handleServerError(error, 'Auth-Register');
  }
};

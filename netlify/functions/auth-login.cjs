// Netlify Function: User Authentication - Login
// Handles user login with email/password authentication using Supabase

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { db, checkEnvVars } = require("./supabase-client.cjs");
const { validateRequestBody } = require("./validation.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");
const { applyCSRFProtection } = require("./utils/csrf-protection.cjs");
const {
  createSuccessResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

// Demo users to seed if database is empty
const demoUsers = [
  {
    email: "test@flagfitpro.com",
    name: "Test User",
    password: "demo123",
    role: "player",
  },
  {
    email: "demo@flagfitpro.com",
    name: "Demo User",
    password: "demo123",
    role: "player",
  },
  {
    email: "coach@flagfitpro.com",
    name: "Coach Mike",
    password: "demo123",
    role: "coach",
  },
];

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

// Seed demo users if they don't exist
async function seedDemoUsers() {
  try {
    for (const userData of demoUsers) {
      const existingUser = await db.users.findByEmail(userData.email);

      if (!existingUser) {
        // Hash password and create user
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await db.users.create({
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
        });
        console.log(`Seeded demo user: ${userData.email}`);
      }
    }
  } catch (error) {
    console.warn("Failed to seed demo users:", error);
  }
}

exports.handler = async (event, context) => {
  // Log function call
  logFunctionCall('Auth-Login', event);

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

  // SECURITY: Apply rate limiting - 5 login attempts per 15 minutes
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

    // Seed demo users on first run (don't fail if seeding fails)
    try {
      await seedDemoUsers();
    } catch (seedError) {
      console.warn("Failed to seed demo users (non-critical):", seedError);
      // Continue execution - seeding is not critical for login
    }

    // Validate request body
    const validation = validateRequestBody(event.body, 'login');
    if (!validation.valid) {
      return validation.response;
    }

    // Use sanitized data
    const { email, password } = validation.data;
    
    // Get JWT_SECRET for token generation
    const JWT_SECRET = getJWTSecret();

    // Find user in database
    let user;
    try {
      user = await db.users.findByEmail(email.toLowerCase());
    } catch (dbError) {
      console.error("Database error finding user:", dbError);
      return handleServerError(dbError, "Failed to authenticate user");
    }
    if (!user) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Invalid email or password",
        }),
      };
    }

    // Verify password
    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error("Error comparing password:", bcryptError);
      return handleServerError(bcryptError, "Failed to verify password");
    }
    
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Invalid email or password",
        }),
      };
    }

    // Generate JWT token
    let token;
    try {
      token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      );
    } catch (jwtError) {
      console.error("Error generating JWT token:", jwtError);
      return handleServerError(jwtError, "Failed to generate authentication token");
    }

    // Return success response (exclude password)
    const { password: _, ...safeUser } = user;

    return createSuccessResponse(
      { token, user: safeUser },
      200,
      "Login successful"
    );
  } catch (error) {
    console.error("Error in auth-login function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    return handleServerError(error, 'Auth-Login');
  }
};

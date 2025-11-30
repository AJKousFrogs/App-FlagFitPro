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

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET environment variable is not set!");
  throw new Error("JWT_SECRET environment variable is required for security");
}

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

    // Seed demo users on first run
    await seedDemoUsers();

    // Validate request body
    const validation = validateRequestBody(event.body, 'login');
    if (!validation.valid) {
      return validation.response;
    }

    // Use sanitized data
    const { email, password } = validation.data;

    // Find user in database
    const user = await db.users.findByEmail(email.toLowerCase());
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
    const isValidPassword = await bcrypt.compare(password, user.password);
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
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Return success response (exclude password)
    const { password: _, ...safeUser } = user;

    return createSuccessResponse(
      { token, user: safeUser },
      200,
      "Login successful"
    );
  } catch (error) {
    return handleServerError(error, 'Auth-Login');
  }
};

// Netlify Function: User Authentication - Registration
// Handles new user registration with email/password using Supabase

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { randomBytes } = require("crypto");
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
      
      // Provide specific error for connection issues
      if (dbError.code === 'SUPABASE_CONNECTION_ERROR' || dbError.message?.includes('connect to Supabase')) {
        return {
          statusCode: 503,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: false,
            error: "Database connection failed. Please check your Supabase configuration.",
            errorType: "database_error",
            details: dbError.message,
          }),
        };
      }
      
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

    // Generate email verification token
    const verificationToken = randomBytes(32).toString("hex");

    // Parse name into first_name and last_name
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Create new user in database (email_verified defaults to false)
    let newUser;
    try {
      // Try to create user with verification fields first
      const userData = {
        first_name: firstName,
        last_name: lastName,
        email: normalizedEmail,
        password_hash: hashedPassword,
        email_verified: false,
        verification_token: verificationToken,
        verification_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };

      newUser = await db.users.create(userData);
    } catch (dbError) {
      console.error("Database error creating user:", dbError);
      console.error("Database error details:", {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
      });
      
      // Check if error is about missing columns (PostgreSQL 42703 or PostgREST PGRST204)
      const isColumnError = dbError.code === '42703' || dbError.code === 'PGRST204';
      const isVerificationColumnError = isColumnError && (
        dbError.message?.includes('verification_token') || 
        dbError.message?.includes('verification_token_expires_at')
      );
      
      // Handle PostgREST schema cache errors - these usually mean the schema cache is stale
      // or there's a mismatch between expected and actual schema
      if (dbError.code === 'PGRST204' && dbError.message?.includes("'name' column")) {
        console.error("PostgREST schema cache error: 'name' column not found. This suggests a schema mismatch.");
        console.error("The database schema uses 'first_name' and 'last_name', not 'name'.");
        console.error("PostgREST schema cache may need to be refreshed. Trying with correct column names...");
        // Try again with correct schema (first_name/last_name) without verification fields
        try {
          newUser = await db.users.create({
            first_name: firstName,
            last_name: lastName,
            email: normalizedEmail,
            password_hash: hashedPassword,
            email_verified: false,
          });
          console.log("User created successfully after schema cache error");
        } catch (retryError) {
          console.error("Failed after schema cache error:", retryError);
          // If password_hash doesn't work, try password
          if (retryError.code === 'PGRST204' && retryError.message?.includes('password')) {
            try {
              newUser = await db.users.create({
                first_name: firstName,
                last_name: lastName,
                email: normalizedEmail,
                password: hashedPassword,
                email_verified: false,
              });
              console.log("User created successfully with 'password' column");
            } catch (passwordError) {
              throw passwordError;
            }
          } else {
            throw retryError;
          }
        }
      } else if (isVerificationColumnError) {
        console.warn("Verification columns not found, creating user without verification fields");
        try {
          newUser = await db.users.create({
            first_name: firstName,
            last_name: lastName,
            email: normalizedEmail,
            password_hash: hashedPassword,
            email_verified: false,
          });
          console.log("User created successfully without verification fields");
        } catch (retryError) {
          console.error("Failed to create user even without verification fields:", retryError);
          // Check if it's a column error for password_hash vs password
          if (retryError.code === '42703' || retryError.code === 'PGRST204') {
            if (retryError.message?.includes('password_hash') || retryError.message?.includes('password')) {
              console.warn("Trying with 'password' column instead of 'password_hash'");
              try {
                newUser = await db.users.create({
                  first_name: firstName,
                  last_name: lastName,
                  email: normalizedEmail,
                  password: hashedPassword,
                  email_verified: false,
                });
                console.log("User created successfully with 'password' column");
              } catch (passwordError) {
                console.error("Failed with 'password' column:", passwordError);
                throw passwordError;
              }
            } else {
              throw retryError;
            }
          } else {
            throw retryError;
          }
        }
      } else if (dbError.code === '23505') {
        // Unique constraint violation
        return handleConflictError("User with this email already exists");
      } else if (dbError.code === '23502') {
        // Not null constraint violation
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: false,
            error: "Missing required fields. Please check your registration data.",
            errorType: "validation_error",
            details: dbError.message,
          }),
        };
      } else {
        // Re-throw to be handled by outer catch
        throw dbError;
      }
    }

    // Send verification email
    try {
      const appUrl = process.env.APP_URL || process.env.URL || "https://webflagfootballfrogs.netlify.app";
      const verificationUrl = `${appUrl}/verify-email.html?token=${verificationToken}`;

      // Determine the base URL for the send-email function
      // In Netlify Functions, we can use the event's request context
      const baseUrl = event.headers['x-forwarded-proto'] 
        ? `${event.headers['x-forwarded-proto']}://${event.headers.host}`
        : appUrl;
      
      const sendEmailUrl = `${baseUrl}/.netlify/functions/send-email`;

      // Call send-email function
      const emailResponse = await fetch(sendEmailUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "verification",
          to: normalizedEmail,
          name: name.trim(),
          verificationUrl,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.warn("Failed to send verification email, but user was created:", errorText);
        // Don't fail registration if email fails - user can request resend
      } else {
        console.log("✅ Verification email sent to:", normalizedEmail);
      }
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Don't fail registration if email fails - user can request resend
    }

    // Return success response (exclude password/password_hash and verification token)
    const { password, password_hash, verification_token, verification_token_expires_at, ...safeUser } = newUser;

    return createSuccessResponse(
      { 
        user: safeUser,
        message: "Account created successfully. Please check your email to verify your account.",
        requiresVerification: true
      },
      201,
      "Account created successfully. Please verify your email."
    );
  } catch (error) {
    console.error("Error in auth-register function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    
    // Check for RLS policy errors
    if (error.message?.includes('new row violates row-level security policy') || 
        error.code === '42501' || 
        error.message?.includes('permission denied')) {
      console.error("RLS Policy Error detected - service role may not have INSERT permission");
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: "Registration failed due to database security policy. Please contact support.",
          errorType: "database_error",
          details: process.env.NETLIFY_DEV === 'true' ? error.message : undefined,
        }),
      };
    }
    
    return handleServerError(error, 'Auth-Register');
  }
};

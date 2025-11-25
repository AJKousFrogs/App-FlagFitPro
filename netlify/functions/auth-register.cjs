// Netlify Function: User Authentication - Registration
// Handles new user registration with email/password using Supabase

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { db, checkEnvVars } = require("./supabase-client.cjs");
const { validateRequestBody } = require("./validation.cjs");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
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

  try {
    // Check environment variables
    checkEnvVars();

    // Validate request body
    const validation = validateRequestBody(event.body, 'register');
    if (!validation.valid) {
      return validation.response;
    }

    // Use sanitized data
    const { name, email, password, role } = validation.data;

    // Check if user already exists in database
    const normalizedEmail = email.toLowerCase();
    const existingUser = await db.users.findByEmail(normalizedEmail);

    if (existingUser) {
      return {
        statusCode: 409,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "User with this email already exists",
        }),
      };
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user in database
    const newUser = await db.users.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "player",
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Return success response (exclude password)
    const { password: _, ...safeUser } = newUser;

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        token,
        user: safeUser,
        message: "Account created successfully",
      }),
    };
  } catch (error) {
    console.error("Registration error:", error);

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

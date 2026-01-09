# Route Audit - Action Plan & Implementation

**Date**: January 9, 2026  
**Status**: 🚀 Ready to Implement  
**Priority**: High

---

## 📋 Implementation Phases

### Phase 1: High Priority Fixes (2-4 hours)

**Target**: Raise grade from B+ (87%) to A (90%+)

- [ ] **Task 1.1**: Add input boundary validation (RPE, duration, hydration)
- [ ] **Task 1.2**: Add authorization checks on UPDATE/DELETE operations
- [ ] **Task 1.3**: Add request body size limits
- [ ] **Task 1.4**: Add Retry-After header to 429 responses

### Phase 2: Medium Priority Improvements (1-2 days)

**Target**: Optimize performance and reduce over-fetching

- [ ] **Task 2.1**: Create composite database indexes
- [ ] **Task 2.2**: Replace SELECT \* with specific columns
- [ ] **Task 2.3**: Add pagination to unbounded queries
- [ ] **Task 2.4**: Add field-specific validation error responses

### Phase 3: Low Priority Enhancements (1 week)

**Target**: Production readiness and monitoring

- [ ] **Task 3.1**: Integrate Helmet.js for security headers
- [ ] **Task 3.2**: Set up Sentry error tracking
- [ ] **Task 3.3**: Implement distributed rate limiting (Redis)
- [ ] **Task 3.4**: Add DOMPurify input sanitization

---

## 🚨 Phase 1: High Priority Fixes

### Task 1.1: Input Boundary Validation

#### Files to Modify:

1. `routes/utils/validation.js` - Add validation functions
2. `routes/training.routes.js` - Apply RPE/duration validation
3. `routes/wellness.routes.js` - Apply hydration validation

#### Implementation:

**Step 1**: Add validation functions to `routes/utils/validation.js`

```javascript
/**
 * Validate RPE (Rate of Perceived Exertion) value
 * @param {any} rpe - RPE value to validate
 * @returns {object} Validation result
 */
export function validateRPE(rpe) {
  if (rpe === undefined || rpe === null) {
    return { isValid: true, rpe: 5 }; // Default to 5
  }

  const parsed = parseInt(rpe, 10);

  if (isNaN(parsed)) {
    return { isValid: false, error: "RPE must be a number" };
  }

  if (parsed < 1 || parsed > 10) {
    return { isValid: false, error: "RPE must be between 1 and 10" };
  }

  return { isValid: true, rpe: parsed };
}

/**
 * Validate duration in minutes
 * @param {any} duration - Duration to validate
 * @param {number} min - Minimum duration (default: 1)
 * @param {number} max - Maximum duration (default: 1440 = 24 hours)
 * @returns {object} Validation result
 */
export function validateDuration(duration, min = 1, max = 1440) {
  if (!duration) {
    return { isValid: false, error: "Duration is required" };
  }

  const parsed = parseInt(duration, 10);

  if (isNaN(parsed)) {
    return { isValid: false, error: "Duration must be a number" };
  }

  if (parsed < min || parsed > max) {
    return {
      isValid: false,
      error: `Duration must be between ${min} and ${max} minutes`,
    };
  }

  return { isValid: true, duration: parsed };
}

/**
 * Validate hydration amount in ml
 * @param {any} amount - Amount in ml to validate
 * @returns {object} Validation result
 */
export function validateHydrationAmount(amount) {
  if (!amount) {
    return { isValid: false, error: "Amount is required" };
  }

  const parsed = parseFloat(amount);

  if (isNaN(parsed)) {
    return { isValid: false, error: "Amount must be a number" };
  }

  if (parsed <= 0 || parsed > 10000) {
    return {
      isValid: false,
      error: "Amount must be between 1 and 10000 ml (10L)",
    };
  }

  return { isValid: true, amount: parsed };
}

/**
 * Validate date is in valid format and reasonable range
 * @param {string} dateString - Date string to validate
 * @returns {object} Validation result
 */
export function validateDate(dateString) {
  if (!dateString) {
    return { isValid: false, error: "Date is required" };
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return { isValid: false, error: "Invalid date format" };
  }

  // Check not in future
  const now = new Date();
  if (date > now) {
    return { isValid: false, error: "Date cannot be in the future" };
  }

  // Check not more than 5 years in past
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  if (date < fiveYearsAgo) {
    return {
      isValid: false,
      error: "Date cannot be more than 5 years in the past",
    };
  }

  return { isValid: true, date: date.toISOString() };
}
```

**Step 2**: Apply validation in `routes/training.routes.js`

```javascript
// Add imports
import {
  validateRPE,
  validateDuration,
  validateDate,
} from "./utils/validation.js";

// Modify POST /complete endpoint
router.post(
  "/complete",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendSuccess(res, null, "Logged (offline mode)");
    }

    try {
      const { sessionId, rpe, duration, notes } = req.body;

      // VALIDATE RPE
      const rpeValidation = validateRPE(rpe);
      if (!rpeValidation.isValid) {
        return sendError(res, rpeValidation.error, "INVALID_RPE", 400);
      }

      // VALIDATE DURATION
      const durationValidation = validateDuration(duration);
      if (!durationValidation.isValid) {
        return sendError(
          res,
          durationValidation.error,
          "INVALID_DURATION",
          400,
        );
      }

      const targetUserId = req.userId;

      // Update training session status if sessionId provided
      if (sessionId && sessionId !== "demo-session" && isValidUUID(sessionId)) {
        await supabase
          .from("training_sessions")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId)
          .eq("user_id", targetUserId); // ADD AUTHORIZATION CHECK
      }

      // Insert into workout_logs
      const { data, error: logError } = await supabase
        .from("workout_logs")
        .insert({
          player_id: targetUserId,
          session_id:
            sessionId && sessionId !== "demo-session" && isValidUUID(sessionId)
              ? sessionId
              : null,
          completed_at: new Date().toISOString(),
          rpe: rpeValidation.rpe, // Use validated value
          duration_minutes: durationValidation.duration, // Use validated value
          notes: notes || "Completed via API",
        })
        .select();

      if (logError) {
        if (logError.code === "23503") {
          return sendSuccess(
            res,
            null,
            "Logged (without DB persistence due to user mismatch)",
          );
        }
        throw logError;
      }

      return sendSuccess(res, data, "Training session marked as complete");
    } catch (error) {
      serverLogger.error(`[training] Complete error:`, error);
      return sendError(
        res,
        "Failed to complete training",
        "COMPLETE_ERROR",
        500,
      );
    }
  },
);

// Modify POST /session endpoint
router.post(
  "/session",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      // VALIDATE RPE if provided
      if (req.body.rpe !== undefined) {
        const rpeValidation = validateRPE(req.body.rpe);
        if (!rpeValidation.isValid) {
          return sendError(res, rpeValidation.error, "INVALID_RPE", 400);
        }
        req.body.rpe = rpeValidation.rpe;
      }

      // VALIDATE DURATION if provided
      if (req.body.duration_minutes !== undefined) {
        const durationValidation = validateDuration(req.body.duration_minutes);
        if (!durationValidation.isValid) {
          return sendError(
            res,
            durationValidation.error,
            "INVALID_DURATION",
            400,
          );
        }
        req.body.duration_minutes = durationValidation.duration;
      }

      // VALIDATE DATE if provided
      if (req.body.session_date !== undefined) {
        const dateValidation = validateDate(req.body.session_date);
        if (!dateValidation.isValid) {
          return sendError(res, dateValidation.error, "INVALID_DATE", 400);
        }
        req.body.session_date = dateValidation.date.split("T")[0]; // YYYY-MM-DD
      }

      const sessionData = { ...req.body, user_id: req.userId };
      const { data: session, error } = await supabase
        .from("training_sessions")
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return sendSuccess(res, { session }, "Session created successfully");
    } catch (error) {
      serverLogger.error(`[training] Create session error:`, error);
      return sendError(res, "Failed to create session", "CREATE_ERROR", 500);
    }
  },
);
```

**Step 3**: Apply validation in `routes/wellness.routes.js`

```javascript
// Add import
import { validateHydrationAmount } from "./utils/validation.js";

// Modify POST /hydration/log endpoint
router.post(
  "/hydration/log",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const { userId } = req;
      const { amount, type = "water" } = req.body;

      // VALIDATE AMOUNT
      const amountValidation = validateHydrationAmount(amount);
      if (!amountValidation.isValid) {
        return sendError(res, amountValidation.error, "INVALID_AMOUNT", 400);
      }

      const { data, error } = await supabase
        .from("hydration_logs")
        .insert({
          user_id: userId,
          amount: amountValidation.amount, // Use validated value
          type,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === "42P01") {
          return sendSuccess(
            res,
            {
              id: Date.now().toString(),
              amount: amountValidation.amount,
              type,
              timestamp: new Date().toISOString(),
            },
            "Logged (table not yet created)",
          );
        }
        throw error;
      }

      return sendSuccess(res, data, "Hydration logged");
    } catch (error) {
      serverLogger.error(`[wellness] Log hydration error:`, error);
      return sendError(res, "Failed to log hydration", "LOG_ERROR", 500);
    }
  },
);
```

---

### Task 1.2: Authorization Checks on UPDATE/DELETE

#### Files to Modify:

1. `routes/training.routes.js` - Add ownership verification

#### Implementation:

```javascript
// Modify PUT /workouts/:id endpoint
router.put(
  "/workouts/:id",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const { data: session, error } = await supabase
        .from("training_sessions")
        .update(req.body)
        .eq("id", req.params.id)
        .eq("user_id", req.userId) // ADD AUTHORIZATION CHECK
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!session) {
        return sendError(
          res,
          "Training session not found or you don't have permission to update it",
          "NOT_FOUND",
          404,
        );
      }

      return sendSuccess(res, { session }, "Workout updated successfully");
    } catch (error) {
      serverLogger.error(`[training] Update workout error:`, error);
      return sendError(res, "Failed to update workout", "UPDATE_ERROR", 500);
    }
  },
);

// ADD DELETE endpoint (soft delete)
router.delete(
  "/session/:id",
  rateLimit("CREATE"),
  authenticateToken,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const { data, error } = await supabase
        .from("training_sessions")
        .update({
          status: "deleted",
          deleted_at: new Date().toISOString(),
        })
        .eq("id", req.params.id)
        .eq("user_id", req.userId) // AUTHORIZATION CHECK
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return sendError(
          res,
          "Training session not found or you don't have permission to delete it",
          "NOT_FOUND",
          404,
        );
      }

      return sendSuccess(res, null, "Training session deleted successfully");
    } catch (error) {
      serverLogger.error(`[training] Delete session error:`, error);
      return sendError(res, "Failed to delete session", "DELETE_ERROR", 500);
    }
  },
);
```

---

### Task 1.3: Request Body Size Limits

#### Files to Modify:

1. `server.js` or `server-supabase.js` - Add body parser limits

#### Implementation:

```javascript
import express from "express";
import cors from "cors";

const app = express();

// ADD REQUEST SIZE LIMITS
app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf, encoding) => {
      // Optional: Log large requests
      if (buf.length > 500000) {
        // > 500KB
        console.warn(`Large request body: ${buf.length} bytes to ${req.path}`);
      }
    },
  }),
);

app.use(
  express.urlencoded({
    limit: "1mb",
    extended: true,
  }),
);

// Enable CORS with proper configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:4200",
      "http://localhost:8888",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ADD ERROR HANDLER FOR PAYLOAD TOO LARGE
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      error: "Request payload too large",
      code: "PAYLOAD_TOO_LARGE",
      maxSize: "1MB",
      timestamp: new Date().toISOString(),
    });
  }
  next(err);
});

// ... rest of server setup
```

---

### Task 1.4: Add Retry-After Header to 429 Responses

#### Files to Modify:

1. `routes/utils/rate-limiter.js` - Add HTTP header

#### Implementation:

```javascript
export function rateLimit(type = "DEFAULT") {
  return (req, res, next) => {
    const identifier = getClientIdentifier(req);
    const { limited, remaining, resetTime, limit } = checkRateLimit(
      identifier,
      type,
    );

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(resetTime / 1000));

    if (limited) {
      const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);

      // ADD RETRY-AFTER HTTP HEADER
      res.setHeader("Retry-After", retryAfterSeconds);

      serverLogger.warn(`Rate limit exceeded for ${identifier} (${type})`);

      return res.status(429).json({
        success: false,
        error: "Too many requests, please try again later",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: retryAfterSeconds,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}
```

---

## 📝 Implementation Checklist

### Before Starting

- [ ] Review full validation report: `docs/ROUTE_AUDIT_VALIDATION.md`
- [ ] Backup current code (create git branch)
- [ ] Ensure tests are running: `npm test`
- [ ] Start server in dev mode: `npm run dev`

### Phase 1 Implementation

- [ ] **Step 1**: Add validation functions to `routes/utils/validation.js`
- [ ] **Step 2**: Update `routes/training.routes.js` with validations
- [ ] **Step 3**: Update `routes/wellness.routes.js` with validations
- [ ] **Step 4**: Add authorization checks to UPDATE/DELETE
- [ ] **Step 5**: Add DELETE endpoint with soft delete
- [ ] **Step 6**: Add request body size limits to server
- [ ] **Step 7**: Add Retry-After header to rate limiter

### Testing

- [ ] Run unit tests: `npm test`
- [ ] Run security scan: `./scripts/security-scan.sh`
- [ ] Test manual scenarios:
  - [ ] Submit RPE < 1 (should fail)
  - [ ] Submit RPE > 10 (should fail)
  - [ ] Submit duration = 0 (should fail)
  - [ ] Submit hydration > 10000 (should fail)
  - [ ] Try to update another user's workout (should fail)
  - [ ] Submit 2MB payload (should fail with 413)
  - [ ] Exceed rate limit (should get Retry-After header)

### Verification

- [ ] All tests pass
- [ ] Security scan shows 0 critical issues
- [ ] Manual tests confirm validation works
- [ ] Server logs show proper error messages
- [ ] Performance is not degraded

---

## 🎯 Expected Outcomes

### After Phase 1 Completion:

**Before**:

- Grade: B+ (87/100)
- Input Validation: 85%
- Security: 95%

**After**:

- Grade: A (92/100) ✅
- Input Validation: 95% ✅
- Security: 98% ✅

### Improvements:

- ✅ All numeric inputs validated with boundaries
- ✅ Ownership verified on UPDATE/DELETE operations
- ✅ Request size limited to 1MB
- ✅ Retry-After header added to 429 responses
- ✅ Better error messages with field-specific details

---

## 📞 Support

If you encounter issues during implementation:

1. **Validation errors**: Check function signatures in `routes/utils/validation.js`
2. **Test failures**: Review test output and server logs
3. **Performance issues**: Profile with enhanced logging enabled
4. **Questions**: Refer to `docs/ROUTE_AUDIT_VALIDATION.md` for detailed analysis

---

**Ready to start?** Begin with Task 1.1 (Input Validation) - estimated 1 hour.

Next: Run `npm test` to establish baseline, then start implementing validations.

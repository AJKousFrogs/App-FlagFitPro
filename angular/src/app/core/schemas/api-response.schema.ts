/**
 * API Response Validation Schemas
 *
 * Zod-like runtime validation for API responses.
 * Prevents runtime errors from malformed API data.
 *
 * Note: Uses a lightweight custom implementation to avoid adding Zod dependency.
 * For full Zod, install: npm install zod
 *
 * @version 1.0.0
 */

// ============================================================================
// Schema Types
// ============================================================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

export interface ValidationError {
  path: string[];
  message: string;
  expected: string;
  received: string;
}

// ============================================================================
// Schema Builder (Lightweight Zod Alternative)
// ============================================================================

type SchemaType<T> = {
  parse: (data: unknown) => T;
  safeParse: (data: unknown) => ValidationResult<T>;
  optional: () => SchemaType<T | undefined>;
  nullable: () => SchemaType<T | null>;
};

function createSchema<T>(
  validator: (data: unknown) => T,
  typeName: string,
): SchemaType<T> {
  const schema: SchemaType<T> = {
    parse: (data: unknown): T => {
      const result = schema.safeParse(data);
      if (!result.success) {
        throw new Error(
          `Validation failed: ${result.error.message} at ${result.error.path.join(".")}`,
        );
      }
      return result.data;
    },

    safeParse: (data: unknown): ValidationResult<T> => {
      try {
        return { success: true, data: validator(data) };
      } catch (e) {
        return {
          success: false,
          error: {
            path: [],
            message: e instanceof Error ? e.message : "Validation failed",
            expected: typeName,
            received: typeof data,
          },
        };
      }
    },

    optional: () =>
      createSchema<T | undefined>(
        (data) => (data === undefined ? undefined : validator(data)),
        `${typeName} | undefined`,
      ),

    nullable: () =>
      createSchema<T | null>(
        (data) => (data === null ? null : validator(data)),
        `${typeName} | null`,
      ),
  };

  return schema;
}

// ============================================================================
// Primitive Schemas
// ============================================================================

export const z = {
  string: () =>
    createSchema<string>((data) => {
      if (typeof data !== "string") {
        throw new Error(`Expected string, got ${typeof data}`);
      }
      return data;
    }, "string"),

  number: () =>
    createSchema<number>((data) => {
      if (typeof data !== "number" || isNaN(data)) {
        throw new Error(`Expected number, got ${typeof data}`);
      }
      return data;
    }, "number"),

  boolean: () =>
    createSchema<boolean>((data) => {
      if (typeof data !== "boolean") {
        throw new Error(`Expected boolean, got ${typeof data}`);
      }
      return data;
    }, "boolean"),

  date: () =>
    createSchema<Date>((data) => {
      if (data instanceof Date) return data;
      if (typeof data === "string" || typeof data === "number") {
        const date = new Date(data);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date: ${data}`);
        }
        return date;
      }
      throw new Error(`Expected date, got ${typeof data}`);
    }, "Date"),

  array: <T>(itemSchema: SchemaType<T>) =>
    createSchema<T[]>((data) => {
      if (!Array.isArray(data)) {
        throw new Error(`Expected array, got ${typeof data}`);
      }
      return data.map((item, index) => {
        const result = itemSchema.safeParse(item);
        if (!result.success) {
          throw new Error(`Array item [${index}]: ${result.error.message}`);
        }
        return result.data;
      });
    }, "array"),

  object: <T extends Record<string, SchemaType<unknown>>>(shape: T) =>
    createSchema<{ [K in keyof T]: ReturnType<T[K]["parse"]> }>((data) => {
      if (typeof data !== "object" || data === null) {
        throw new Error(`Expected object, got ${typeof data}`);
      }

      const result: Record<string, unknown> = {};
      const obj = data as Record<string, unknown>;

      for (const [key, schema] of Object.entries(shape)) {
        const value = obj[key];
        const parseResult = schema.safeParse(value);
        if (!parseResult.success) {
          throw new Error(`Property "${key}": ${parseResult.error.message}`);
        }
        result[key] = parseResult.data;
      }

      return result as { [K in keyof T]: ReturnType<T[K]["parse"]> };
    }, "object"),

  enum: <T extends string>(values: readonly T[]) =>
    createSchema<T>(
      (data) => {
        if (typeof data !== "string" || !values.includes(data as T)) {
          throw new Error(
            `Expected one of [${values.join(", ")}], got ${data}`,
          );
        }
        return data as T;
      },
      `enum(${values.join("|")})`,
    ),

  literal: <T extends string | number | boolean>(value: T) =>
    createSchema<T>((data) => {
      if (data !== value) {
        throw new Error(`Expected ${value}, got ${data}`);
      }
      return value;
    }, `literal(${value})`),

  union: <T extends SchemaType<unknown>[]>(...schemas: T) =>
    createSchema<ReturnType<T[number]["parse"]>>((data) => {
      for (const schema of schemas) {
        const result = schema.safeParse(data);
        if (result.success) {
          return result.data as ReturnType<T[number]["parse"]>;
        }
      }
      throw new Error(`No matching schema in union`);
    }, "union"),

  unknown: () => createSchema<unknown>((data) => data, "unknown"),
};

// ============================================================================
// Training Session Schema
// ============================================================================

export const TrainingSessionSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  session_date: z.string(),
  duration_minutes: z.number(),
  rpe: z.number().optional(),
  intensity_level: z.number().optional(),
  session_type: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"] as const),
});

export type TrainingSessionDTO = ReturnType<typeof TrainingSessionSchema.parse>;

// ============================================================================
// ACWR Data Schema
// ============================================================================

export const ACWRDataSchema = z.object({
  acwr: z.number(),
  acute_load: z.number(),
  chronic_load: z.number(),
  risk_zone: z.enum([
    "detraining",
    "sweet-spot",
    "caution",
    "danger",
    "critical",
    "insufficient_data",
  ] as const),
  data_quality: z
    .object({
      level: z.enum(["high", "medium", "low", "insufficient"] as const),
      confidence: z.number(),
      sessions_count: z.number(),
      days_with_data: z.number(),
    })
    .optional(),
});

export type ACWRDataDTO = ReturnType<typeof ACWRDataSchema.parse>;

// ============================================================================
// AI Chat Response Schema
// ============================================================================

export const AIChatResponseSchema = z.object({
  answer_markdown: z.string(),
  risk_level: z.enum(["low", "medium", "high"] as const),
  disclaimer: z.string().optional(),
  citations: z.array(
    z.object({
      title: z.string(),
      url: z.string().optional(),
      evidence_grade: z.string().optional(),
    }),
  ),
  suggested_actions: z.array(
    z.object({
      type: z.string(),
      reason: z.string(),
      label: z.string(),
    }),
  ),
  chat_session_id: z.string(),
  message_id: z.string(),
  metadata: z
    .object({
      source: z.string().optional(),
      model: z.string().optional(),
      acwr_safety: z
        .object({
          blocked: z.boolean(),
          acwr: z.number(),
          risk_zone: z.string(),
        })
        .optional(),
    })
    .optional(),
});

export type AIChatResponseDTO = ReturnType<typeof AIChatResponseSchema.parse>;

// ============================================================================
// User Profile Schema
// ============================================================================

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string().optional(),
  role: z.enum(["athlete", "coach", "admin"] as const),
  team_id: z.string().optional(),
  avatar_url: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export type UserProfileDTO = ReturnType<typeof UserProfileSchema.parse>;

// ============================================================================
// Wellness Entry Schema
// ============================================================================

export const WellnessEntrySchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  date: z.string(),
  sleep_hours: z.number().optional(),
  sleep_quality: z.number().optional(),
  stress_level: z.number().optional(),
  energy_level: z.number().optional(),
  muscle_soreness: z.number().optional(),
  mood: z.number().optional(),
  notes: z.string().optional(),
});

export type WellnessEntryDTO = ReturnType<typeof WellnessEntrySchema.parse>;

// ============================================================================
// API Response Wrapper Schema
// ============================================================================

export function createApiResponseSchema<T>(dataSchema: SchemaType<T>) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });
}

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validate API response data
 *
 * @example
 * const result = validateApiResponse(response.data, TrainingSessionSchema);
 * if (result.success) {
 *   // result.data is typed as TrainingSessionDTO
 * } else {
 *   console.error(result.error);
 * }
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: SchemaType<T>,
): ValidationResult<T> {
  return schema.safeParse(data);
}

/**
 * Validate and throw on failure
 */
export function parseApiResponse<T>(data: unknown, schema: SchemaType<T>): T {
  return schema.parse(data);
}

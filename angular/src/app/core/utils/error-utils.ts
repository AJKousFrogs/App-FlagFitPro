/**
 * Utility functions for handling errors and converting unknown types to Error objects
 * @module core/utils/error-utils
 * 
 * This module provides:
 * - toError: Convert unknown error to Error instance
 * - toLogContext: Convert unknown value to LogContext
 * 
 * NOTE: getErrorMessage is re-exported from shared/utils/error.utils.ts
 * which is the canonical implementation with additional features.
 */

// Re-export getErrorMessage from shared utils to avoid duplication
// The shared version has more comprehensive error handling (HTTP codes, API responses, etc.)
export { getErrorMessage } from "../../shared/utils/error.utils";

/**
 * Convert unknown error to Error instance
 * Safely converts any caught error to a proper Error object
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  if (error && typeof error === "object") {
    // Handle PostgrestError and similar objects
    if ("message" in error && typeof error.message === "string") {
      const err = new Error(error.message);
      if ("code" in error) {
        (err as Error & { code?: unknown }).code = error.code;
      }
      if ("details" in error) {
        (err as Error & { details?: unknown }).details = error.details;
      }
      return err;
    }

    // Try to JSON stringify the object
    try {
      return new Error(JSON.stringify(error));
    } catch {
      return new Error(String(error));
    }
  }

  return new Error(String(error));
}

/**
 * Convert unknown value to LogContext
 */
export function toLogContext(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    return { data: value };
  }

  if (typeof value === "object" && value !== null) {
    // Check if it's already a valid LogContext (has string index signature)
    if (isPlainObject(value)) {
      return value as Record<string, unknown>;
    }

    // Convert to plain object
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return { data: String(value) };
    }
  }

  return { data: value };
}

/**
 * Check if value is a plain object (not an array, null, or class instance)
 */
function isPlainObject(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

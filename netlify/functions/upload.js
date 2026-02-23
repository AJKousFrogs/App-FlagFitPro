import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: File Upload API
// Handles image and video uploads to Supabase Storage

import { checkEnvVars, supabaseAdmin } from "./utils/supabase-client.js";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { authenticateRequest } from "./utils/auth-helper.js";

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

// Max file sizes (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const createUploadValidationError = (message) => {
  const error = new Error(message);
  error.code = "UPLOAD_VALIDATION";
  return error;
};

// Upload file to Supabase Storage
const uploadFile = async (userId, fileData, fileType, fileName) => {
  try {
    checkEnvVars();

    // Determine bucket and validate file type
    const bucket = "community-media";
    let maxSize = MAX_IMAGE_SIZE;
    let mediaType = "image";

    if (ALLOWED_VIDEO_TYPES.includes(fileType)) {
      maxSize = MAX_VIDEO_SIZE;
      mediaType = "video";
    } else if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
      throw createUploadValidationError(
        `Invalid file type: ${fileType}. Allowed types: ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(", ")}`,
      );
    }

    if (typeof fileData !== "string" || fileData.trim().length === 0) {
      throw createUploadValidationError("file must be a non-empty base64 string");
    }
    if (typeof fileName !== "string" || fileName.trim().length === 0) {
      throw createUploadValidationError("fileName must be a non-empty string");
    }

    // Decode base64 file data
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    if (!buffer || buffer.length === 0) {
      throw createUploadValidationError("file must contain decodable base64 data");
    }

    // Validate file size
    if (buffer.length > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      throw createUploadValidationError(
        `File too large. Maximum size for ${mediaType}s is ${maxSizeMB}MB`,
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${userId}/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
      mediaType,
      fileName: sanitizedFileName,
      size: buffer.length,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Delete file from Supabase Storage
const deleteFile = async (filePath) => {
  try {
    checkEnvVars();

    const { error } = await supabaseAdmin.storage
      .from("community-media")
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "upload",
    allowedMethods: ["POST", "DELETE"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (event, _context, { requestId }) => {
      // Authenticate request
      const auth = await authenticateRequest(event);
      if (!auth.success) {
      return createErrorResponse(
        "Authentication required",
        401,
        "authentication_error",
        requestId,
      );
      }

      const userId = auth.user.id;

      // Handle POST (upload)
      if (event.httpMethod === "POST") {
        let body = {};
        try {
          body = JSON.parse(event.body || "{}");
        } catch {
          return createErrorResponse(
            "Invalid JSON in request body",
            400,
            "invalid_json",
            requestId,
          );
        }

        if (body === null || typeof body !== "object" || Array.isArray(body)) {
          return createErrorResponse(
            "Request body must be an object",
            400,
            "validation_error",
            requestId,
          );
        }

        const { file, fileType, fileName } = body;

        if (!file || !fileType || !fileName) {
          return createErrorResponse(
            "Missing required fields: file, fileType, fileName",
            400,
            "validation_error",
            requestId,
          );
        }

        try {
          const result = await uploadFile(userId, file, fileType, fileName);
          return createSuccessResponse(
            { ...result, message: "File uploaded successfully" },
            201,
            "File uploaded successfully",
          );
        } catch (error) {
          if (error?.code === "UPLOAD_VALIDATION") {
            return createErrorResponse(
              error.message,
              400,
              "validation_error",
              requestId,
            );
          }
          return createErrorResponse(
            "Upload failed",
            500,
            "upload_failed",
            requestId,
          );
        }
      }

      // Handle DELETE
      if (event.httpMethod === "DELETE") {
        const queryParams = event.queryStringParameters || {};
        const { path: filePath } = queryParams;

        if (!filePath) {
          return createErrorResponse(
            "Missing required parameter: path",
            400,
            "validation_error",
            requestId,
          );
        }

        // P1-002: Secure path ownership verification
        // Normalize path to prevent traversal attacks (e.g., "../other-user/file")
        const normalizedPath = filePath.replace(/\\/g, "/"); // Normalize slashes
        const pathParts = normalizedPath.split("/");

        // Path must start with userId as the first directory component
        // Valid: "user-uuid/timestamp_filename.jpg"
        // Invalid: "../user-uuid/file", "user-uuid/../other/file"
        if (
          pathParts.length < 2 ||
          pathParts[0] !== userId ||
          pathParts.some((part) => part === ".." || part === ".")
        ) {
          return createErrorResponse(
            "Not authorized to delete this file",
            403,
            "not_authorized",
            requestId,
          );
        }

        try {
          await deleteFile(normalizedPath);
          return createSuccessResponse(
            { message: "File deleted successfully" },
            200,
          );
        } catch (error) {
          return createErrorResponse(
            "Delete failed",
            500,
            "delete_failed",
            requestId,
          );
        }
      }

      return createErrorResponse(
        "Method not allowed",
        405,
        "method_not_allowed",
        requestId,
      );
    },
  });
};

export const testHandler = handler;
export default createRuntimeV2Handler(handler);

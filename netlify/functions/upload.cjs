// Netlify Function: File Upload API
// Handles image and video uploads to Supabase Storage

const { checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const { authenticateRequest } = require("./utils/auth-helper.cjs");

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
      throw new Error(
        `Invalid file type: ${fileType}. Allowed types: ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(", ")}`,
      );
    }

    // Decode base64 file data
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Validate file size
    if (buffer.length > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      throw new Error(
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

exports.handler = async (event, context) => {
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
          "auth_required",
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

        const { file, fileType, fileName } = body;

        if (!file || !fileType || !fileName) {
          return createErrorResponse(
            "Missing required fields: file, fileType, fileName",
            400,
            "missing_fields",
            requestId,
          );
        }

        try {
          const result = await uploadFile(userId, file, fileType, fileName);
          return createSuccessResponse(
            { ...result, message: "File uploaded successfully" },
            requestId,
            201,
          );
        } catch (error) {
          return createErrorResponse(
            error.message || "Upload failed",
            400,
            "upload_failed",
            requestId,
          );
        }
      }

      // Handle DELETE
      if (event.httpMethod === "DELETE") {
        const queryParams = event.queryStringParameters || {};
        const { path } = queryParams;

        if (!path) {
          return createErrorResponse(
            "Missing required parameter: path",
            400,
            "missing_path",
            requestId,
          );
        }

        // Verify user owns this file (path starts with their userId)
        if (!path.startsWith(userId)) {
          return createErrorResponse(
            "Not authorized to delete this file",
            403,
            "not_authorized",
            requestId,
          );
        }

        try {
          await deleteFile(path);
          return createSuccessResponse(
            { message: "File deleted successfully" },
            requestId,
          );
        } catch (error) {
          return createErrorResponse(
            error.message || "Delete failed",
            400,
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

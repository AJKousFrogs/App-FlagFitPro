// Netlify Function: Sponsor Logo Proxy
// Proxies sponsor logo images to bypass COEP restrictions
// Serves images from our own domain with proper CORS headers

const https = require("https");
const http = require("http");
const {
  createSuccessResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");

// Cache for logo data (in-memory, resets on function restart)
const logoCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Fetch image from URL and return as base64
async function fetchImageAsBase64(imageUrl) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith("https") ? https : http;

    const request = protocol.get(
      imageUrl,
      {
        timeout: 10000, // 10 second timeout
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Netlify Function)",
        },
      },
      (response) => {
        // Check if response is successful
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to fetch image: ${response.statusCode}`));
          return;
        }

        // Check content type
        const contentType =
          response.headers["content-type"] ||
          response.headers["Content-Type"] ||
          "image/png";
        if (!contentType.startsWith("image/")) {
          reject(new Error(`Invalid content type: ${contentType}`));
          return;
        }

        // Collect image data with size limit (5MB)
        const chunks = [];
        let totalSize = 0;
        const maxSize = 5 * 1024 * 1024; // 5MB

        response.on("data", (chunk) => {
          totalSize += chunk.length;
          if (totalSize > maxSize) {
            request.destroy();
            reject(new Error("Image too large"));
            return;
          }
          chunks.push(chunk);
        });

        response.on("end", () => {
          try {
            const buffer = Buffer.concat(chunks);
            const base64 = buffer.toString("base64");
            resolve({
              data: base64,
              contentType: contentType,
            });
          } catch (error) {
            reject(new Error(`Failed to process image: ${error.message}`));
          }
        });
      },
    );

    request.on("error", (error) => {
      reject(error);
    });

    request.on("timeout", () => {
      request.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

exports.handler = async (event, context) => {
  // Log function call
  logFunctionCall("sponsor-logo", event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: "",
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Get image URL from query parameter
    const imageUrl = event.queryStringParameters?.url;

    if (!imageUrl) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Missing 'url' query parameter" }),
      };
    }

    // Validate URL is from allowed domains
    const allowedDomains = [
      "laprimafit.com",
      "chemius.net",
      "gearxpro-sports.com",
    ];

    let urlObj;
    try {
      urlObj = new URL(imageUrl);
    } catch (urlError) {
      console.error("Invalid URL:", imageUrl, urlError);
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Invalid URL format" }),
      };
    }

    const isAllowed = allowedDomains.some((domain) =>
      urlObj.hostname.includes(domain),
    );

    if (!isAllowed) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Domain not allowed" }),
      };
    }

    // Check cache
    const cacheKey = imageUrl;
    const cached = logoCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        statusCode: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=86400", // 24 hours
          "Cross-Origin-Resource-Policy": "cross-origin",
        },
        body: cached.data,
        isBase64Encoded: true,
      };
    }

    // Fetch image
    const imageData = await fetchImageAsBase64(imageUrl);

    // Cache the result
    logoCache.set(cacheKey, {
      data: imageData.data,
      contentType: imageData.contentType,
      timestamp: Date.now(),
    });

    // Return image with proper headers
    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": imageData.contentType,
        "Cache-Control": "public, max-age=86400", // 24 hours
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
      body: imageData.data,
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("Error proxying sponsor logo:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });

    // Return a proper error response instead of crashing
    try {
      return handleServerError(error, "Failed to proxy sponsor logo");
    } catch (handlerError) {
      // Fallback if error handler itself fails
      console.error("Error handler failed:", handlerError);
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Failed to proxy sponsor logo",
          errorType: "server_error",
        }),
      };
    }
  }
};

// Netlify Function: Sponsor Logo Proxy
// Proxies sponsor logo images to bypass COEP restrictions
// Serves images from our own domain with proper CORS headers

const https = require("https");
const http = require("http");
const {
  createSuccessResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

// Cache for logo data (in-memory, resets on function restart)
const logoCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Fetch image from URL and return as base64
async function fetchImageAsBase64(imageUrl) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith("https") ? https : http;
    
    protocol.get(imageUrl, (response) => {
      // Check if response is successful
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch image: ${response.statusCode}`));
        return;
      }

      // Check content type
      const contentType = response.headers["content-type"] || "image/png";
      if (!contentType.startsWith("image/")) {
        reject(new Error(`Invalid content type: ${contentType}`));
        return;
      }

      // Collect image data
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString("base64");
        resolve({
          data: base64,
          contentType: contentType,
        });
      });
    }).on("error", (error) => {
      reject(error);
    });
  });
}

exports.handler = async (event, context) => {
  // Log function call
  logFunctionCall("sponsor-logo", event.httpMethod, event.path);

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
    
    const urlObj = new URL(imageUrl);
    const isAllowed = allowedDomains.some((domain) =>
      urlObj.hostname.includes(domain)
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
    return handleServerError(error, "Failed to proxy sponsor logo");
  }
};


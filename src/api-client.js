/**
 * API Client Module
 * Re-exports apiClient and API_ENDPOINTS from api-config.js
 * This file exists for backward compatibility with imports that reference api-client.js
 */

export { apiClient, API_ENDPOINTS, ApiClient } from "./api-config.js";

// Also export as default for convenience
export { apiClient as default } from "./api-config.js";


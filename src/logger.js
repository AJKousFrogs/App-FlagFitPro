// Minimal logger for email service
// Only used by src/email-service.js

const logger = {
  debug: (...args) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[DEBUG]", ...args);
    }
  },
  error: (...args) => {
    console.error("[ERROR]", ...args);
  },
  info: (...args) => {
    console.log("[INFO]", ...args);
  },
  warn: (...args) => {
    console.warn("[WARN]", ...args);
  },
};

export { logger };
export default logger;


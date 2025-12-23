// Minimal logger for email service
// Only used by src/email-service.js

const logger = {
  debug: (...args) => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[DEBUG]", ...args);
    }
  },
  error: (...args) => {
    // eslint-disable-next-line no-console
    console.error("[ERROR]", ...args);
  },
  info: (...args) => {
    // eslint-disable-next-line no-console
    console.log("[INFO]", ...args);
  },
  warn: (...args) => {
    // eslint-disable-next-line no-console
    console.warn("[WARN]", ...args);
  },
};

export { logger };
export default logger;

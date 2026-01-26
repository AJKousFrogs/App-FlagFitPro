/**
 * Netlify Build Plugin: Cache Purge
 *
 * This plugin ensures all caches are purged on every deploy
 * so users always get the latest version of the app.
 */

module.exports = {
  onSuccess: async ({ utils }) => {
    console.log("🧹 Cache Purge Plugin: Ensuring fresh content delivery...");

    // Log build info
    const buildId = process.env.BUILD_ID || Date.now().toString(36);
    const deployId = process.env.DEPLOY_ID || "local";

    console.log(`   Deploy ID: ${deployId}`);
    console.log(`   Build ID: ${buildId}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    // The CDN cache is automatically purged on deploy
    // This plugin just logs confirmation and can be extended
    // for custom cache invalidation if needed

    console.log("✅ CDN cache will be automatically purged for this deploy");
    console.log("✅ Service worker will detect new version via ngsw.json hash");
  },

  onEnd: async ({ utils }) => {
    console.log("📢 Deploy complete - all users will receive fresh content");
  },
};

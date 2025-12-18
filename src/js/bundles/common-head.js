/**
 * Common Head Scripts Bundle
 * Bundles all common head scripts into a single import
 * 
 * This replaces individual script tags:
 * - Lucide Icons
 * - icon-helper.js
 * - theme-switcher.js
 * 
 * Note: This is a module bundle. For non-module usage, include scripts individually.
 * 
 * Usage: <script type="module" src="./src/js/bundles/common-head.js" defer></script>
 */

// Note: Lucide icons must be loaded via script tag (not ES module)
// This file is for documentation purposes and to load helper scripts

// Load icon helper (initializes Lucide icons after DOM is ready)
import '../../icon-helper.js';

// Load theme switcher
import '../../theme-switcher.js';

console.log('[Common Head] Head scripts loaded');


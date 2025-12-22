/**
 * Common Component Loaders
 * Bundles all common component loaders into a single import
 * 
 * This replaces individual loader script tags:
 * - sidebar-loader.js
 * - top-bar-loader.js
 * - footer-loader.js
 * 
 * Usage: <script type="module" src="./src/js/components/common-loaders.js" defer></script>
 */

// Load sidebar
import './sidebar-loader.js';

// Load top bar
import './top-bar-loader.js';

// Load footer
import './footer-loader.js';
import { logger } from '../logger.js';

logger.info('[Common Loaders] All common components loaded');


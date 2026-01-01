#!/usr/bin/env node
/**
 * Generate PWA icons for FlagFit Pro
 * Creates simple SVG icons that can be used as PNG placeholders
 * For production, replace with actual designed PNG icons
 */

const fs = require("fs");
const path = require("path");

const ICONS_DIR = path.join(__dirname, "../angular/src/assets/icons");
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate SVG icon for each size
SIZES.forEach((size) => {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6"/>
      <stop offset="100%" style="stop-color:#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${Math.round(size * 0.15)}"/>
  <text x="${size / 2}" y="${size * 0.72}" font-size="${Math.round(size * 0.55)}" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif">🏈</text>
</svg>`;

  // Save as SVG (browsers can use these)
  const svgPath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✅ Created ${svgPath}`);
});

// Create a simple 1x1 PNG placeholder for each size
// This is a minimal valid PNG that browsers will accept
// In production, replace with real PNG icons
const minimalPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const minimalPng = Buffer.from(minimalPngBase64, "base64");

SIZES.forEach((size) => {
  const pngPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
  // Create a simple placeholder PNG
  // Note: This is a 1x1 pixel PNG - for real icons, use a tool like sharp or Jimp
  fs.writeFileSync(pngPath, minimalPng);
  console.log(`✅ Created ${pngPath} (placeholder)`);
});

console.log("\n📱 Icon generation complete!");
console.log(
  "Note: These are placeholder icons. For production, generate proper PNG icons from a design tool.",
);
console.log(
  "Recommended: Use https://realfavicongenerator.net/ or similar to generate all required sizes.",
);

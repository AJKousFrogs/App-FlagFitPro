#!/usr/bin/env node
/**
 * Generate PWA icons for FlagFit Pro
 * Creates proper PNG icons from SVG using sharp
 */

const fs = require("fs");
const path = require("path");

const ICONS_DIR = path.join(__dirname, "../angular/src/assets/icons");
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Try to use sharp for proper PNG generation
async function generateWithSharp() {
  try {
    const sharp = require("sharp");

    for (const size of SIZES) {
      // Create an SVG with a proper icon design
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6"/>
      <stop offset="100%" style="stop-color:#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${Math.round(size * 0.15)}"/>
  <text x="${size / 2}" y="${size * 0.68}" font-size="${Math.round(size * 0.5)}" text-anchor="middle" dominant-baseline="middle">🏈</text>
</svg>`;

      // Save SVG
      const svgPath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
      fs.writeFileSync(svgPath, svgContent);
      console.log(`✅ Created ${path.basename(svgPath)}`);

      // Convert SVG to PNG using sharp
      const pngPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(pngPath);
      console.log(`✅ Created ${path.basename(pngPath)}`);
    }

    return true;
  } catch (err) {
    console.log("Sharp not available or failed:", err.message);
    return false;
  }
}

// Fallback: create simple colored PNG icons without emoji
async function generateFallbackPngs() {
  try {
    const sharp = require("sharp");

    for (const size of SIZES) {
      // Create a simple solid color icon (blue gradient approximation)
      const pngPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);

      // Create a blue square with rounded corners effect
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 59, g: 130, b: 246, alpha: 1 }, // #3B82F6
        },
      })
        .png()
        .toFile(pngPath);

      console.log(`✅ Created ${path.basename(pngPath)} (solid color)`);
    }
    return true;
  } catch (err) {
    console.log("Fallback also failed:", err.message);
    return false;
  }
}

// Create SVGs only (as ultimate fallback)
function generateSvgsOnly() {
  for (const size of SIZES) {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6"/>
      <stop offset="100%" style="stop-color:#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${Math.round(size * 0.15)}"/>
  <text x="${size / 2}" y="${size * 0.68}" font-size="${Math.round(size * 0.5)}" text-anchor="middle" dominant-baseline="middle">🏈</text>
</svg>`;

    const svgPath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
    fs.writeFileSync(svgPath, svgContent);
    console.log(`✅ Created ${path.basename(svgPath)}`);
  }
}

async function main() {
  console.log("🎨 Generating PWA icons for FlagFit Pro...\n");

  // Try sharp first
  let success = await generateWithSharp();

  if (!success) {
    console.log("\n⚠️  Trying fallback PNG generation...\n");
    success = await generateFallbackPngs();
  }

  if (!success) {
    console.log("\n⚠️  Creating SVG icons only (PNG generation failed)\n");
    generateSvgsOnly();
  }

  console.log("\n📱 Icon generation complete!");
  console.log(`Icons saved to: ${ICONS_DIR}`);
}

main().catch(console.error);

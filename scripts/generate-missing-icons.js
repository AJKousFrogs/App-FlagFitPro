#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Missing icon sizes that need to be generated
const missingSizes = [96, 128, 144, 152, 384];
const iconsDir = path.join(__dirname, '../public/icons');

function createPlaceholderIcon(size) {
  // Create a simple SVG-based icon that matches the design
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4a7c59;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad1)" rx="${size * 0.125}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="${size * 0.008}"/>
  <text x="${size/2}" y="${size/2 - size * 0.14}" font-family="Arial, sans-serif" font-size="${size * 0.23}" font-weight="bold" text-anchor="middle" fill="white">FF</text>
  <text x="${size/2}" y="${size/2 + size * 0.18}" font-family="Arial, sans-serif" font-size="${size * 0.078}" text-anchor="middle" fill="rgba(255,255,255,0.8)">Pro</text>
</svg>`;

  return svgContent;
}

function generateMissingIcons() {
  console.log('🎨 Generating missing PWA icons...');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  let generatedCount = 0;
  
  missingSizes.forEach(size => {
    try {
      const filename = `icon-${size}x${size}.svg`;
      const filepath = path.join(iconsDir, filename);
      
      // Check if file already exists
      if (fs.existsSync(filepath)) {
        console.log(`⚠️  ${filename} already exists, skipping...`);
        return;
      }
      
      const svgContent = createPlaceholderIcon(size);
      fs.writeFileSync(filepath, svgContent);
      console.log(`✅ Generated ${filename}`);
      generatedCount++;
      
    } catch (error) {
      console.error(`❌ Failed to generate icon-${size}x${size}.svg:`, error.message);
    }
  });
  
  console.log(`\n🎉 Icon generation complete! Generated ${generatedCount} new icons.`);
  
  if (generatedCount > 0) {
    console.log('\n📋 Next steps:');
    console.log('1. Convert SVG files to PNG using the icon generator tool');
    console.log('2. Run: npm run generate-icons');
    console.log('3. Use the "Download All Icons" button to get PNG versions');
    console.log('4. Replace the SVG files with the PNG versions');
  }
  
  console.log('\n📋 Generated SVG icons:');
  missingSizes.forEach(size => {
    const filename = `icon-${size}x${size}.svg`;
    const filepath = path.join(iconsDir, filename);
    if (fs.existsSync(filepath)) {
      console.log(`   ✅ ${filename}`);
    } else {
      console.log(`   ❌ ${filename} (failed to generate)`);
    }
  });
}

// Run the generator
generateMissingIcons(); 
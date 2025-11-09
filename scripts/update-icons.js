// Script to update all HTML files with Lucide Icons
// Run with: node scripts/update-icons.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Emoji to Lucide icon mapping
const iconMap = {
    '📊': 'layout-dashboard',
    '👥': 'users',
    '⚡': 'zap',
    '🏆': 'trophy',
    '📈': 'bar-chart-3',
    '💬': 'message-circle',
    '⚙️': 'settings',
    '❓': 'help-circle',
    '🔔': 'bell',
    '🏈': 'football',
    '📋': 'clipboard-list',
    '💪': 'dumbbell',
    '🎯': 'target',
    '🤝': 'users',
    '📏': 'ruler',
    '🧘': 'heart-pulse',
    '🧘‍♂️': 'heart-pulse',
    '💊': 'pill',
    '🩹': 'bandage',
    '🤖': 'bot',
    '🔍': 'search',
    '📅': 'calendar',
    '💡': 'lightbulb',
    '📊': 'bar-chart-3',
    '💚': 'heart',
    '⚖️': 'scale',
    '↗': 'trending-up',
    '↘': 'trending-down',
    '←': 'chevron-left',
    '→': 'chevron-right',
    '✕': 'x',
    '➕': 'plus',
    '❌': 'x-circle',
    '✅': 'check-circle',
};

// Function to replace emoji with Lucide icon in HTML content
function replaceEmojiWithIcon(htmlContent) {
    let updated = htmlContent;
    
    // Add Lucide Icons CDN if not present
    if (!updated.includes('unpkg.com/lucide')) {
        updated = updated.replace(
            /(<link rel="stylesheet" href="\.\/src\/hover-effects\.css">)/,
            '$1\n    <!-- Lucide Icons - Modern icon library similar to Radix UI -->\n    <script src="https://unpkg.com/lucide@latest"></script>\n    <script src="./src/icon-helper.js"></script>'
        );
    }
    
    // Replace emojis in sidebar icons
    Object.entries(iconMap).forEach(([emoji, iconName]) => {
        // Pattern for sidebar icons: <span class="nav-icon">📊</span>
        const sidebarPattern = new RegExp(`<span class="nav-icon">${emoji}</span>`, 'g');
        updated = updated.replace(sidebarPattern, `<i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i>`);
        
        // Pattern for standalone emojis in text
        const textPattern = new RegExp(emoji, 'g');
        // Only replace if not already in an icon tag
        updated = updated.replace(textPattern, (match, offset, string) => {
            // Check if already replaced
            if (string.substring(Math.max(0, offset - 50), offset + 50).includes('data-lucide')) {
                return match;
            }
            return `<i data-lucide="${iconName}" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i>`;
        });
    });
    
    // Add icon initialization in DOMContentLoaded if present
    if (updated.includes('DOMContentLoaded') && !updated.includes('lucide.createIcons')) {
        updated = updated.replace(
            /(document\.addEventListener\('DOMContentLoaded',\s*(?:async\s+)?function\(\)\s*\{)/,
            `$1\n            // Initialize Lucide icons\n            if (typeof lucide !== 'undefined') {\n                lucide.createIcons();\n            }`
        );
    }
    
    return updated;
}

// Get all HTML files
function getAllHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            results = results.concat(getAllHtmlFiles(filePath));
        } else if (file.endsWith('.html')) {
            results.push(filePath);
        }
    });
    
    return results;
}

// Main execution
const htmlFiles = getAllHtmlFiles(path.join(__dirname, '..'));

console.log(`Found ${htmlFiles.length} HTML files to process...`);

htmlFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const updated = replaceEmojiWithIcon(content);
        
        if (content !== updated) {
            fs.writeFileSync(file, updated, 'utf8');
            console.log(`✅ Updated: ${path.relative(path.join(__dirname, '..'), file)}`);
        }
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log('\n✨ Icon update complete!');


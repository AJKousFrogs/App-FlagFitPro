// Comprehensive Design System Fix Script
// Fixes all issues found in the audit

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color replacements - map hardcoded colors to CSS variables
const colorReplacements = {
    // Forbidden colors -> Green theme
    '#3B82F6': 'var(--primary-500)',
    '#8B5CF6': 'var(--primary-500)',
    '#0369a1': 'var(--primary-600)',
    '#1e3a8a': 'var(--primary-700)',
    '#0c4a6e': 'var(--primary-700)',
    '#be185d': 'var(--secondary-500)',
    '#9d174d': 'var(--secondary-600)',
    
    // Hardcoded green colors -> CSS variables
    '#10b981': 'var(--primary-500)',
    '#059669': 'var(--primary-600)',
    '#047857': 'var(--primary-700)',
    '#065f46': 'var(--primary-800)',
    
    // Neutral grays -> CSS variables
    '#1f2937': 'var(--dark-text-primary)',
    '#374151': 'var(--dark-text-secondary)',
    '#6b7280': 'var(--dark-text-muted)',
    '#9ca3af': 'var(--dark-text-muted)',
    '#f3f4f6': 'var(--dark-bg-secondary)',
    '#f8f9fa': 'var(--dark-bg-secondary)',
    '#ddd': 'var(--dark-border)',
    '#ffffff': 'var(--dark-card-bg)',
    'white': 'var(--dark-text-primary)',
    
    // Warning/tertiary colors -> CSS variables
    '#f59e0b': 'var(--tertiary-500)',
    '#d97706': 'var(--tertiary-600)',
    '#92400e': 'var(--tertiary-700)',
    '#78350f': 'var(--tertiary-800)',
    '#fef3c7': 'var(--tertiary-100)',
    '#fbbf24': 'var(--tertiary-400)',
    
    // Success colors -> CSS variables
    '#34d399': 'var(--success-400)',
    '#d1fae5': 'var(--success-100)',
    '#dcfce7': 'var(--success-100)',
    '#f0fdf4': 'var(--success-50)',
    '#16a34a': 'var(--success-600)',
    '#15803d': 'var(--success-700)',
    '#14532d': 'var(--success-900)',
    
    // Error colors -> CSS variables
    '#ef4444': 'var(--error-500)',
    '#dc2626': 'var(--error-600)',
    '#b91c1c': 'var(--error-700)',
    '#991b1b': 'var(--error-800)',
    '#7f1d1d': 'var(--error-900)',
    '#fee2e2': 'var(--error-100)',
    '#fef2f2': 'var(--error-50)',
    '#fca5a5': 'var(--error-300)',
    
    // Info/blue colors -> Primary green
    '#06b6d4': 'var(--primary-500)',
    '#84cc16': 'var(--secondary-500)',
    '#e0f2fe': 'var(--primary-50)',
    '#2196f3': 'var(--primary-500)',
    '#1976d2': 'var(--primary-600)',
    '#e3f2fd': 'var(--primary-50)',
    
    // Other colors
    '#ff6b35': 'var(--tertiary-500)',
    '#c0c0c0': 'var(--dark-text-muted)',
    '#a0a0a0': 'var(--dark-text-muted)',
    '#cd7f32': 'var(--tertiary-600)',
    '#b87333': 'var(--tertiary-700)',
};

function getAllHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'docs' && file !== 'netlify') {
            results = results.concat(getAllHtmlFiles(filePath));
        } else if (file.endsWith('.html') && !file.includes('design-system-example')) {
            results.push(filePath);
        }
    });
    
    return results;
}

function replaceColors(content) {
    let updated = content;
    
    // Replace hex colors
    Object.entries(colorReplacements).forEach(([oldColor, newColor]) => {
        const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        updated = updated.replace(regex, newColor);
    });
    
    // Replace in specific contexts
    // Inline styles with hardcoded colors
    updated = updated.replace(
        /style="([^"]*?)color:\s*#([0-9a-fA-F]{3,6})([^"]*?)"/gi,
        (match, before, color, after) => {
            const upperColor = `#${color.toUpperCase()}`;
            if (colorReplacements[upperColor]) {
                return `style="${before}color: ${colorReplacements[upperColor]}${after}"`;
            }
            return match;
        }
    );
    
    // Background colors
    updated = updated.replace(
        /style="([^"]*?)background:\s*#([0-9a-fA-F]{3,6})([^"]*?)"/gi,
        (match, before, color, after) => {
            const upperColor = `#${color.toUpperCase()}`;
            if (colorReplacements[upperColor]) {
                return `style="${before}background: ${colorReplacements[upperColor]}${after}"`;
            }
            return match;
        }
    );
    
    // Border colors
    updated = updated.replace(
        /style="([^"]*?)border[^:]*:\s*[^;]*#([0-9a-fA-F]{3,6})([^"]*?)"/gi,
        (match, before, color, after) => {
            const upperColor = `#${color.toUpperCase()}`;
            if (colorReplacements[upperColor]) {
                return match.replace(`#${color}`, colorReplacements[upperColor]);
            }
            return match;
        }
    );
    
    return updated;
}

function addMissingCSSLinks(content, filePath) {
    let updated = content;
    const isAuthPage = filePath.includes('login') || filePath.includes('register') || filePath.includes('reset-password') || filePath.includes('index.html');
    
    // Add dark-theme.css if missing (except auth pages)
    if (!isAuthPage && !updated.includes('dark-theme.css')) {
        // Find where to insert (after other CSS links or in head)
        if (updated.includes('ui-design-system.css')) {
            updated = updated.replace(
                /(<link[^>]*ui-design-system\.css[^>]*>)/i,
                `$1\n    <link rel="stylesheet" href="./src/dark-theme.css">`
            );
        } else if (updated.includes('</head>')) {
            updated = updated.replace(
                /(<\/head>)/i,
                `    <link rel="stylesheet" href="./src/dark-theme.css">\n$1`
            );
        }
    }
    
    // Add light-theme.css link (disabled) if missing
    if (!updated.includes('light-theme.css')) {
        if (updated.includes('dark-theme.css')) {
            updated = updated.replace(
                /(<link[^>]*dark-theme\.css[^>]*>)/i,
                `$1\n    <link rel="stylesheet" href="./src/light-theme.css" id="light-theme" disabled>`
            );
        }
    }
    
    return updated;
}

function addMissingScripts(content, filePath) {
    let updated = content;
    const isAuthPage = filePath.includes('login') || filePath.includes('register') || filePath.includes('reset-password');
    
    // Add theme-switcher.js if missing (except auth pages)
    if (!isAuthPage && !updated.includes('theme-switcher.js')) {
        if (updated.includes('icon-helper.js')) {
            updated = updated.replace(
                /(<script[^>]*icon-helper\.js[^>]*><\/script>)/i,
                `$1\n    <script src="./src/theme-switcher.js"></script>`
            );
        } else if (updated.includes('</head>')) {
            updated = updated.replace(
                /(<\/head>)/i,
                `    <script src="./src/theme-switcher.js"></script>\n$1`
            );
        }
    }
    
    // Add Lucide CDN if using Lucide icons but missing CDN
    if (updated.includes('data-lucide') && !updated.includes('lucide@latest')) {
        if (updated.includes('</head>')) {
            updated = updated.replace(
                /(<\/head>)/i,
                `    <script src="https://unpkg.com/lucide@latest"></script>\n$1`
            );
        }
    }
    
    return updated;
}

const htmlFiles = getAllHtmlFiles(path.join(__dirname, '..'));

console.log(`\n🔧 FIXING DESIGN SYSTEM ISSUES\n`);
console.log(`Processing ${htmlFiles.length} HTML files...\n`);

let fixedCount = 0;
let totalReplacements = 0;

htmlFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        let updated = content;
        
        // Replace colors
        updated = replaceColors(updated);
        
        // Add missing CSS links
        updated = addMissingCSSLinks(updated, file);
        
        // Add missing scripts
        updated = addMissingScripts(updated, file);
        
        if (content !== updated) {
            fs.writeFileSync(file, updated, 'utf8');
            const relativePath = path.relative(path.join(__dirname, '..'), file);
            console.log(`✅ Fixed: ${relativePath}`);
            fixedCount++;
        }
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log(`\n✨ Fixed ${fixedCount} files!\n`);


// Script to replace all purple, blue, pink colors with green theme colors
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color mapping: old colors -> green theme colors
const colorReplacements = {
    // Purple gradients -> Green gradients
    '#667eea': 'var(--primary-500)', // #10c96b
    '#764ba2': 'var(--primary-600)', // #0ab85a
    'linear-gradient(135deg, #667eea': 'linear-gradient(135deg, var(--primary-500)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)': 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
    'linear-gradient(90deg, #667eea 0%, #764ba2 100%)': 'linear-gradient(90deg, var(--primary-500) 0%, var(--primary-600) 100%)',
    
    // Blue colors -> Primary green
    '#3b82f6': 'var(--primary-500)',
    '#1e40af': 'var(--primary-700)',
    '#0ea5e9': 'var(--primary-500)',
    '#0284c7': 'var(--primary-600)',
    'rgba(99, 102, 241': 'rgba(16, 201, 107', // Purple rgba -> Green rgba
    
    // Pink colors -> Secondary lime or tertiary gold
    '#ec4899': 'var(--secondary-500)', // Pink -> Lime green
    'rgba(236, 72, 153': 'rgba(137, 195, 0', // Pink rgba -> Lime rgba
    
    // Blue backgrounds -> Green theme backgrounds
    '#dbeafe': 'var(--primary-100)', // Light blue -> Light green
    '#eff6ff': 'var(--primary-50)', // Very light blue -> Very light green
    '#fce7f3': 'var(--secondary-100)', // Light pink -> Light lime
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

function replaceColors(htmlContent) {
    let updated = htmlContent;
    
    // Replace all color mappings
    Object.entries(colorReplacements).forEach(([oldColor, newColor]) => {
        // Replace exact matches
        updated = updated.replace(new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newColor);
    });
    
    // Replace specific gradient patterns
    updated = updated.replace(
        /linear-gradient\(135deg,\s*#3b82f6[^)]*\)/g,
        'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)'
    );
    
    updated = updated.replace(
        /background:\s*#3b82f6/g,
        'background: var(--primary-500)'
    );
    
    updated = updated.replace(
        /border.*#3b82f6/g,
        'border-color: var(--primary-500)'
    );
    
    updated = updated.replace(
        /color:\s*#3b82f6/g,
        'color: var(--primary-500)'
    );
    
    // Replace pink backgrounds with secondary colors
    updated = updated.replace(
        /background:\s*#ec4899/g,
        'background: var(--secondary-500)'
    );
    
    updated = updated.replace(
        /color:\s*#ec4899/g,
        'color: var(--secondary-500)'
    );
    
    // Replace rgba purple with rgba green
    updated = updated.replace(
        /rgba\(99,\s*102,\s*241/g,
        'rgba(16, 201, 107'
    );
    
    // Replace rgba pink with rgba lime
    updated = updated.replace(
        /rgba\(236,\s*72,\s*153/g,
        'rgba(137, 195, 0'
    );
    
    return updated;
}

const htmlFiles = getAllHtmlFiles(path.join(__dirname, '..'));

console.log(`Replacing non-green colors in ${htmlFiles.length} HTML files...\n`);

htmlFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const updated = replaceColors(content);
        
        if (content !== updated) {
            fs.writeFileSync(file, updated, 'utf8');
            console.log(`✅ Updated colors: ${path.relative(path.join(__dirname, '..'), file)}`);
        }
    } catch (error) {
        console.error(`❌ Error: ${file}:`, error.message);
    }
});

console.log('\n✨ Color replacement complete!');


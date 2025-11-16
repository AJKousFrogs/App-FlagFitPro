#!/usr/bin/env node

/**
 * CSS Build and Optimization Script
 * Bundles CSS files and optimizes them for production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.join(__dirname, '..');

class CSSBuilder {
    constructor() {
        this.cssFiles = [];
        this.bundleMap = {
            'main-bundle.css': ['main.css', 'tokens.css', 'breakpoints.css'],
            'components-bundle.css': ['components/**/*.css'],
            'pages-bundle.css': ['pages/**/*.css'],
            'utilities-bundle.css': ['animations.css', 'loading-states.css', 'hooks.css']
        };
        this.outputDir = path.join(projectRoot, 'dist', 'css');
    }

    /**
     * Find all CSS files
     */
    findCSSFiles() {
        const findFiles = (dir, fileList = []) => {
            const files = fs.readdirSync(dir);
            
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory() && !file.startsWith('.')) {
                    findFiles(filePath, fileList);
                } else if (file.endsWith('.css') && !file.includes('bundle') && !file.includes('optimized')) {
                    fileList.push({
                        path: filePath,
                        relativePath: path.relative(path.join(projectRoot, 'src', 'css'), filePath),
                        size: stat.size
                    });
                }
            });
            
            return fileList;
        };
        
        this.cssFiles = findFiles(path.join(projectRoot, 'src', 'css'));
        console.log(`📄 Found ${this.cssFiles.length} CSS files`);
    }

    /**
     * Create output directory
     */
    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Minify CSS content (simple minification)
     */
    minifyCSS(cssContent) {
        return cssContent
            // Remove comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove unnecessary whitespace
            .replace(/\s+/g, ' ')
            // Remove spaces around certain characters
            .replace(/\s*{\s*/g, '{')
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*:\s*/g, ':')
            .replace(/\s*;\s*/g, ';')
            .replace(/\s*,\s*/g, ',')
            // Remove trailing semicolons before }
            .replace(/;}/g, '}')
            // Remove unnecessary quotes from URLs
            .replace(/url\(\s*["']([^"']+)["']\s*\)/g, 'url($1)')
            .trim();
    }

    /**
     * Bundle CSS files based on bundle configuration
     */
    createBundles() {
        console.log('📦 Creating CSS bundles...');
        const bundleStats = {};

        Object.entries(this.bundleMap).forEach(([bundleName, patterns]) => {
            const bundleFiles = [];
            let totalSize = 0;
            
            patterns.forEach(pattern => {
                if (pattern.includes('**')) {
                    // Handle glob patterns
                    const basePath = pattern.split('**')[0];
                    const matchingFiles = this.cssFiles.filter(file => 
                        file.relativePath.startsWith(basePath)
                    );
                    bundleFiles.push(...matchingFiles);
                } else {
                    // Handle exact file matches
                    const matchingFile = this.cssFiles.find(file => 
                        file.relativePath === pattern || file.relativePath.endsWith(pattern)
                    );
                    if (matchingFile) {
                        bundleFiles.push(matchingFile);
                    }
                }
            });

            if (bundleFiles.length === 0) {
                console.log(`⚠️  No files found for bundle: ${bundleName}`);
                return;
            }

            // Read and concatenate CSS files
            let bundledCSS = `/* ${bundleName} - Generated bundle */\n`;
            bundleFiles.forEach(file => {
                try {
                    const cssContent = fs.readFileSync(file.path, 'utf8');
                    bundledCSS += `\n/* File: ${file.relativePath} */\n`;
                    bundledCSS += cssContent + '\n';
                    totalSize += file.size;
                } catch (error) {
                    console.error(`❌ Error reading ${file.path}:`, error.message);
                }
            });

            // Minify the bundled CSS
            const minifiedCSS = this.minifyCSS(bundledCSS);
            
            // Write bundle file
            const bundlePath = path.join(this.outputDir, bundleName);
            fs.writeFileSync(bundlePath, minifiedCSS, 'utf8');
            
            bundleStats[bundleName] = {
                files: bundleFiles.length,
                originalSize: totalSize,
                bundledSize: minifiedCSS.length,
                compression: ((totalSize - minifiedCSS.length) / totalSize * 100).toFixed(1)
            };

            console.log(`✅ Created ${bundleName}: ${bundleFiles.length} files, ${(minifiedCSS.length / 1024).toFixed(1)}KB`);
        });

        return bundleStats;
    }

    /**
     * Create critical CSS for above-the-fold content
     */
    createCriticalCSS() {
        console.log('🎯 Creating critical CSS...');
        
        // Define critical styles (these would typically be extracted from actual usage)
        const criticalSelectors = [
            'html', 'body', 
            '.loading-overlay', '.loading-spinner',
            '.hero-section', '.hero-content',
            '.nav', '.header',
            '.btn', '.btn-primary',
            '.error-message', '.success-message'
        ];

        let criticalCSS = '/* Critical CSS - Above the fold styles */\n';

        this.cssFiles.forEach(file => {
            try {
                const cssContent = fs.readFileSync(file.path, 'utf8');
                
                // Extract styles for critical selectors (simplified approach)
                criticalSelectors.forEach(selector => {
                    const regex = new RegExp(`\\${selector}[^{]*\\{[^}]+\\}`, 'g');
                    const matches = cssContent.match(regex);
                    if (matches) {
                        matches.forEach(match => {
                            if (!criticalCSS.includes(match)) {
                                criticalCSS += match + '\n';
                            }
                        });
                    }
                });
            } catch (error) {
                console.error(`Error processing ${file.path}:`, error.message);
            }
        });

        const minifiedCriticalCSS = this.minifyCSS(criticalCSS);
        const criticalPath = path.join(this.outputDir, 'critical.css');
        fs.writeFileSync(criticalPath, minifiedCriticalCSS, 'utf8');
        
        console.log(`✅ Created critical.css: ${(minifiedCriticalCSS.length / 1024).toFixed(1)}KB`);
        return minifiedCriticalCSS.length;
    }

    /**
     * Generate HTML templates with optimized CSS loading
     */
    generateOptimizedHTMLTemplates() {
        console.log('🚀 Generating optimized HTML templates...');
        
        const templateDir = path.join(this.outputDir, 'templates');
        if (!fs.existsSync(templateDir)) {
            fs.mkdirSync(templateDir);
        }

        // CSS loading template
        const cssLoadingTemplate = `
<!-- Critical CSS (inline for fastest loading) -->
<style>
/* Critical CSS content goes here */
</style>

<!-- Preload main CSS bundle -->
<link rel="preload" href="./dist/css/main-bundle.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="./dist/css/main-bundle.css"></noscript>

<!-- Load component CSS asynchronously -->
<link rel="preload" href="./dist/css/components-bundle.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="./dist/css/components-bundle.css"></noscript>

<!-- Load page-specific CSS based on page type -->
<!-- For dashboard pages -->
<link rel="preload" href="./dist/css/pages-bundle.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="./dist/css/pages-bundle.css"></noscript>

<!-- Load utilities CSS -->
<link rel="preload" href="./dist/css/utilities-bundle.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="./dist/css/utilities-bundle.css"></noscript>

<!-- Polyfill for browsers that don't support rel=preload -->
<script>
!function(e){"use strict";var t=function(t,n,r){function o(e){return i.body?e():void setTimeout(function(){o(e)})}function a(){d.addEventListener&&d.removeEventListener("load",a),d.media=r||"all"}var i=e.document,d=i.createElement("link");if(n)d.href=n;else{if(!t)return;d.href=t.href,t.media="only x"}return d.rel="stylesheet",d.addEventListener("load",a),setTimeout(a,3e3),o(function(){i.head.appendChild(d)}),d};"undefined"!=typeof module?module.exports=t:e.loadCSS=t}("undefined"!=typeof global?global:this);
</script>
`;

        fs.writeFileSync(path.join(templateDir, 'optimized-css-loading.html'), cssLoadingTemplate);
        console.log('✅ Generated optimized CSS loading template');
    }

    /**
     * Update HTML files to use bundled CSS
     */
    updateHTMLFiles() {
        console.log('🔄 Updating HTML files to use bundled CSS...');
        
        const htmlFiles = [];
        const findHTMLFiles = (dir) => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
                    findHTMLFiles(filePath);
                } else if (file.endsWith('.html')) {
                    htmlFiles.push(filePath);
                }
            });
        };
        
        findHTMLFiles(projectRoot);
        
        let updatedFiles = 0;
        htmlFiles.forEach(filePath => {
            try {
                let content = fs.readFileSync(filePath, 'utf8');
                let originalContent = content;
                
                // Replace individual CSS file references with bundle references
                content = content.replace(
                    /<!-- Design System CSS -->\s*<link rel="stylesheet" href="\.\/src\/css\/main\.css" \/>/,
                    '<!-- Optimized CSS Bundles -->\n    <link rel="stylesheet" href="./dist/css/main-bundle.css">'
                );
                
                // Replace component CSS references
                content = content.replace(
                    /<link rel="stylesheet" href="\.\/src\/css\/components\/[^"]*\.css" \/>/g,
                    ''
                );
                
                // Add component bundle after main bundle
                if (content.includes('./dist/css/main-bundle.css') && !content.includes('./dist/css/components-bundle.css')) {
                    content = content.replace(
                        '<link rel="stylesheet" href="./dist/css/main-bundle.css">',
                        '<link rel="stylesheet" href="./dist/css/main-bundle.css">\n    <link rel="stylesheet" href="./dist/css/components-bundle.css">'
                    );
                }
                
                // Replace page-specific CSS references
                content = content.replace(
                    /<link rel="stylesheet" href="\.\/src\/css\/pages\/[^"]*\.css" \/>/g,
                    '<link rel="stylesheet" href="./dist/css/pages-bundle.css">'
                );
                
                if (content !== originalContent) {
                    fs.writeFileSync(filePath, content, 'utf8');
                    updatedFiles++;
                    console.log(`✅ Updated ${path.relative(projectRoot, filePath)}`);
                }
            } catch (error) {
                console.error(`❌ Error updating ${filePath}:`, error.message);
            }
        });
        
        console.log(`🎉 Updated ${updatedFiles} HTML files`);
    }

    /**
     * Generate build report
     */
    generateReport(bundleStats, criticalCSSSize) {
        const totalOriginalSize = Object.values(bundleStats).reduce((sum, bundle) => sum + bundle.originalSize, 0);
        const totalBundledSize = Object.values(bundleStats).reduce((sum, bundle) => sum + bundle.bundledSize, 0);
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                bundles: Object.keys(bundleStats).length,
                totalFiles: this.cssFiles.length,
                originalSize: totalOriginalSize,
                bundledSize: totalBundledSize,
                criticalCSSSize,
                compressionRatio: ((totalOriginalSize - totalBundledSize) / totalOriginalSize * 100).toFixed(1) + '%',
                sizeSaved: ((totalOriginalSize - totalBundledSize) / 1024).toFixed(1) + 'KB'
            },
            bundles: bundleStats,
            recommendations: [
                'Use critical CSS inline in HTML head for fastest loading',
                'Load non-critical CSS asynchronously to improve FCP',
                'Consider implementing CSS-in-JS for component-specific styles',
                'Monitor bundle sizes and split if they exceed 50KB',
                'Use HTTP/2 server push for critical resources',
                'Implement CSS purging to remove unused styles in production'
            ]
        };
        
        const reportPath = path.join(this.outputDir, 'build-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📊 Build Report:');
        console.log(`   Bundles created: ${report.summary.bundles}`);
        console.log(`   Original size: ${(report.summary.originalSize / 1024).toFixed(1)}KB`);
        console.log(`   Bundled size: ${(report.summary.bundledSize / 1024).toFixed(1)}KB`);
        console.log(`   Size saved: ${report.summary.sizeSaved} (${report.summary.compressionRatio})`);
        console.log(`   Critical CSS: ${(criticalCSSSize / 1024).toFixed(1)}KB`);
    }

    /**
     * Main build process
     */
    async build() {
        console.log('🏗️  Starting CSS build and optimization...\n');
        
        this.ensureOutputDir();
        this.findCSSFiles();
        
        const bundleStats = this.createBundles();
        const criticalCSSSize = this.createCriticalCSS();
        
        this.generateOptimizedHTMLTemplates();
        this.updateHTMLFiles();
        
        this.generateReport(bundleStats, criticalCSSSize);
        
        console.log('\n🎉 CSS build completed successfully!');
        console.log('📁 Output directory:', this.outputDir);
        console.log('📋 Next steps:');
        console.log('  1. Test bundled CSS in development');
        console.log('  2. Update critical CSS with actual above-the-fold content');
        console.log('  3. Configure CDN caching for CSS bundles');
        console.log('  4. Monitor performance impact in production');
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const builder = new CSSBuilder();
    builder.build().catch(console.error);
}

export default CSSBuilder;
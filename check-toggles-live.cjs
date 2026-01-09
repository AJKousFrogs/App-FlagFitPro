#!/usr/bin/env node
/**
 * Toggle Switch Visibility Checker
 * Checks if p-toggleswitch elements are visible on the live site
 */

const https = require('https');

const url = 'https://webflagfootballfrogs.netlify.app/settings';

console.log('🔍 Checking toggle switches on:', url);
console.log('─'.repeat(60));

https.get(url, (res) => {
  let html = '';
  
  res.on('data', (chunk) => {
    html += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📊 Analysis Results:\n');
    
    // Check if p-toggleswitch exists in HTML
    const toggleMatches = html.match(/<p-toggleswitch/g);
    console.log(`✓ Found ${toggleMatches ? toggleMatches.length : 0} <p-toggleswitch> tags in HTML`);
    
    // Check if PrimeNG is loaded
    const primengLoaded = html.includes('primeng') || html.includes('p-toggleswitch');
    console.log(`${primengLoaded ? '✓' : '✗'} PrimeNG references found: ${primengLoaded}`);
    
    // Check if Angular is loaded
    const angularLoaded = html.includes('ng-version') || html.includes('angular');
    console.log(`${angularLoaded ? '✓' : '✗'} Angular detected: ${angularLoaded}`);
    
    // Check for app-root
    const appRootExists = html.includes('<app-root');
    console.log(`${appRootExists ? '✓' : '✗'} Angular app-root found: ${appRootExists}`);
    
    // Check for CSS files
    const cssFiles = html.match(/<link[^>]*\.css/g) || [];
    console.log(`\n📦 CSS Files: ${cssFiles.length}`);
    
    // Check for JS files
    const jsFiles = html.match(/<script[^>]*\.js/g) || [];
    console.log(`📦 JS Files: ${jsFiles.length}`);
    
    console.log('\n─'.repeat(60));
    console.log('\n💡 Key Findings:');
    
    if (toggleMatches && toggleMatches.length > 0) {
      console.log('  ⚠️  Toggle switches ARE present in the HTML source');
      console.log('  🔍 This means they might be hidden by CSS or JS errors');
      console.log('  📝 Check browser console for JavaScript errors');
    } else {
      console.log('  ⚠️  Toggle switches NOT found in initial HTML');
      console.log('  🔍 This is expected for Angular SPAs - they render via JavaScript');
      console.log('  📝 The issue is likely:');
      console.log('     - Angular not bootstrapping correctly');
      console.log('     - Settings route not loading');
      console.log('     - PrimeNG ToggleSwitch module not included in build');
    }
    
    console.log('\n🔧 Recommended Actions:');
    console.log('  1. Open DevTools (F12) on the live site');
    console.log('  2. Check Console tab for errors');
    console.log('  3. Check Network tab for failed requests');
    console.log('  4. Inspect DOM to see if <p-toggleswitch> elements exist');
    console.log('  5. Check computed styles on toggle elements');
    
    console.log('\n─'.repeat(60));
  });
}).on('error', (err) => {
  console.error('❌ Error fetching URL:', err.message);
});

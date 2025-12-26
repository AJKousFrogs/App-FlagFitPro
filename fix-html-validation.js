const fs = require('fs');
const path = require('path');

// Get all HTML files from wireframes directory
const wireframesDir = './Wireframes clean';
const files = fs.readdirSync(wireframesDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(wireframesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix DOCTYPE (case-insensitive replacement)
  content = content.replace(/<!doctype\s+html>/i, '<!DOCTYPE html>');
  
  // Fix self-closing void elements
  content = content.replace(/<meta([^>]*)\s*\/>/g, '<meta$1>');
  content = content.replace(/<link([^>]*)\s*\/>/g, '<link$1>');
  content = content.replace(/<br\s*\/>/g, '<br>');
  content = content.replace(/<hr\s*\/>/g, '<hr>');
  content = content.replace(/<input([^>]*)\s*\/>/g, '<input$1>');
  content = content.replace(/<img([^>]*)\s*\/>/g, '<img$1>');
  
  // Fix raw & characters (but not in &amp; or other entities)
  content = content.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;');
  
  // Add type="button" to buttons that don't have a type attribute
  content = content.replace(/<button(?![^>]*\btype\s*=)([^>]*)>/g, '<button type="button"$1>');
  
  // Remove redundant role="contentinfo" from footer
  content = content.replace(/<footer\s+role="contentinfo"/g, '<footer');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${file}`);
});

console.log('Done!');

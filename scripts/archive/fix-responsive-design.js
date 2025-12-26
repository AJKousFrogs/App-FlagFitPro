// Script to fix responsive design issues across all files
import fs from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getAllHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (
      stat &&
      stat.isDirectory() &&
      !file.startsWith(".") &&
      file !== "node_modules" &&
      file !== "docs" &&
      file !== "netlify"
    ) {
      results = results.concat(getAllHtmlFiles(filePath));
    } else if (
      file.endsWith(".html") &&
      !file.includes("design-system-example")
    ) {
      results.push(filePath);
    }
  });

  return results;
}

function addViewportMeta(htmlContent) {
  // Check if viewport already exists
  if (htmlContent.includes("viewport")) {
    return htmlContent;
  }

  // Add viewport meta tag after charset
  const viewportMeta =
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">';

  if (htmlContent.includes("<meta charset")) {
    htmlContent = htmlContent.replace(
      /(<meta charset[^>]*>)/i,
      `$1\n${viewportMeta}`,
    );
  } else if (htmlContent.includes("<head>")) {
    htmlContent = htmlContent.replace(/(<head>)/i, `$1\n${viewportMeta}`);
  }

  return htmlContent;
}

function enhanceDarkThemeCSS(cssContent) {
  let updated = cssContent;

  // Check if responsive section exists
  if (
    !cssContent.includes("/* RESPONSIVE DESIGN */") &&
    !cssContent.includes("@media (max-width: 768px)")
  ) {
    // Add comprehensive responsive design section
    const responsiveCSS = `

/* ====================================================================
   15. COMPREHENSIVE RESPONSIVE DESIGN - All Devices
   ==================================================================== */

/* Mobile Small (320px - 480px) - iPhone SE, Small Android */
@media (max-width: 480px) {
    .sidebar {
        transform: translateX(-100%);
        transition: transform 200ms ease;
    }
    
    .sidebar.open {
        transform: translateX(0);
    }
    
    .top-bar {
        left: 0;
        padding: 0 12px;
    }
    
    .main-content {
        margin-left: 0;
        padding: 16px 12px;
    }
    
    .search-container {
        max-width: 150px;
    }
    
    .search-input {
        font-size: 16px; /* Prevents zoom on iOS */
        padding: 8px 32px 8px 12px;
    }
    
    .card, .stat-card, .chart-card {
        padding: 16px;
        margin-bottom: 16px;
    }
    
    .btn-primary, .btn-secondary {
        width: 100%;
        padding: 14px 20px; /* 44px minimum touch target */
        font-size: 16px;
    }
    
    h1 { font-size: 1.75rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    
    .header-right {
        gap: 8px;
    }
    
    .header-icon {
        width: 36px;
        height: 36px;
    }
}

/* Mobile Medium (481px - 768px) - iPhone 12/13/14, Samsung Galaxy */
@media (min-width: 481px) and (max-width: 768px) {
    .sidebar {
        transform: translateX(-100%);
        transition: transform 200ms ease;
    }
    
    .sidebar.open {
        transform: translateX(0);
    }
    
    .top-bar {
        left: 0;
        padding: 0 16px;
    }
    
    .main-content {
        margin-left: 0;
        padding: 20px 16px;
    }
    
    .search-container {
        max-width: 250px;
    }
    
    .search-input {
        font-size: 16px; /* Prevents zoom on iOS */
    }
    
    .btn-primary, .btn-secondary {
        min-height: 44px; /* Touch target */
        padding: 12px 24px;
        font-size: 16px;
    }
}

/* Tablet Portrait (769px - 1024px) - iPad, iPad Mini */
@media (min-width: 769px) and (max-width: 1024px) {
    .sidebar {
        width: 64px;
    }
    
    .top-bar {
        left: 64px;
    }
    
    .main-content {
        margin-left: 64px;
        padding: 24px;
    }
    
    .search-container {
        max-width: 300px;
    }
    
    .card, .stat-card {
        padding: 20px;
    }
}

/* Tablet Landscape / Small Desktop (1025px - 1280px) */
@media (min-width: 1025px) and (max-width: 1280px) {
    .main-content {
        padding: 24px;
    }
    
    .container {
        max-width: 1200px;
        margin: 0 auto;
    }
}

/* Large Desktop (1281px+) */
@media (min-width: 1281px) {
    .main-content {
        padding: 32px;
    }
    
    .container {
        max-width: 1400px;
        margin: 0 auto;
    }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
    /* Increase touch targets */
    button, .btn, a, .header-icon, .sidebar-icon {
        min-height: 44px;
        min-width: 44px;
    }
    
    /* Remove hover effects on touch devices */
    .card:hover, .stat-card:hover {
        transform: none;
    }
    
    /* Larger tap targets */
    input, textarea, select {
        min-height: 44px;
        font-size: 16px; /* Prevents zoom on iOS */
    }
}

/* Landscape Orientation */
@media (orientation: landscape) and (max-height: 500px) {
    .top-bar {
        height: 56px;
    }
    
    .main-content {
        margin-top: 56px;
        padding: 16px;
    }
    
    .sidebar {
        padding: 12px 0;
    }
}
`;

    // Add before the contrast verification section
    if (updated.includes("CONTRAST VERIFICATION")) {
      updated = updated.replace(
        "/* ====================================================================\n   14. CONTRAST VERIFICATION",
        responsiveCSS +
          "\n/* ====================================================================\n   14. CONTRAST VERIFICATION",
      );
    } else {
      updated += responsiveCSS;
    }
  }

  // Ensure inputs have 16px font-size
  if (!cssContent.includes("font-size: 16px") && cssContent.includes("input")) {
    updated = updated.replace(
      /(input[^}]*\{[^}]*)(font-size[^;]*;)?/gi,
      (match) => {
        if (!match.includes("font-size")) {
          return match.replace(
            "{",
            "{\n    font-size: 16px; /* Prevents zoom on iOS */",
          );
        }
        return match;
      },
    );
  }

  return updated;
}

function enhanceLightThemeCSS(cssContent) {
  let updated = cssContent;

  // Add responsive design section if missing
  if (!cssContent.includes("@media (max-width: 768px)")) {
    const responsiveCSS = `

/* ====================================================================
   13. RESPONSIVE DESIGN - Light Mode
   ==================================================================== */

/* Mobile Small (320px - 480px) */
@media (max-width: 480px) {
    [data-theme="light"] .sidebar {
        transform: translateX(-100%);
    }
    
    [data-theme="light"] .sidebar.open {
        transform: translateX(0);
    }
    
    [data-theme="light"] .top-bar {
        left: 0;
        padding: 0 12px;
    }
    
    [data-theme="light"] .main-content {
        margin-left: 0;
        padding: 16px 12px;
    }
    
    [data-theme="light"] .btn-primary,
    [data-theme="light"] .btn-secondary {
        width: 100%;
        min-height: 44px;
        font-size: 16px;
    }
    
    [data-theme="light"] input,
    [data-theme="light"] textarea,
    [data-theme="light"] select {
        font-size: 16px; /* Prevents zoom on iOS */
        min-height: 44px;
    }
}

/* Mobile Medium (481px - 768px) */
@media (min-width: 481px) and (max-width: 768px) {
    [data-theme="light"] .sidebar {
        transform: translateX(-100%);
    }
    
    [data-theme="light"] .sidebar.open {
        transform: translateX(0);
    }
    
    [data-theme="light"] .top-bar {
        left: 0;
    }
    
    [data-theme="light"] .main-content {
        margin-left: 0;
    }
    
    [data-theme="light"] input,
    [data-theme="light"] textarea,
    [data-theme="light"] select {
        font-size: 16px; /* Prevents zoom on iOS */
    }
}

/* Tablet (769px - 1024px) */
@media (min-width: 769px) and (max-width: 1024px) {
    [data-theme="light"] .sidebar {
        width: 64px;
    }
    
    [data-theme="light"] .top-bar {
        left: 64px;
    }
    
    [data-theme="light"] .main-content {
        margin-left: 64px;
    }
}
`;

    updated += responsiveCSS;
  }

  return updated;
}

const htmlFiles = getAllHtmlFiles(path.join(__dirname, ".."));

console.log(`\n🔧 FIXING RESPONSIVE DESIGN ISSUES\n`);
console.log(`Processing ${htmlFiles.length} HTML files...\n`);

let fixedHTML = 0;
htmlFiles.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf8");
    const updated = addViewportMeta(content);

    if (content !== updated) {
      fs.writeFileSync(file, updated, "utf8");
      const relativePath = path.relative(path.join(__dirname, ".."), file);
      console.log(`✅ Added viewport: ${relativePath}`);
      fixedHTML++;
    }
  } catch (error) {
    console.error(`❌ Error: ${file}:`, error.message);
  }
});

// Fix CSS files
const darkThemePath = path.join(__dirname, "..", "src", "dark-theme.css");
const lightThemePath = path.join(__dirname, "..", "src", "light-theme.css");

if (fs.existsSync(darkThemePath)) {
  const content = fs.readFileSync(darkThemePath, "utf8");
  const updated = enhanceDarkThemeCSS(content);
  if (content !== updated) {
    fs.writeFileSync(darkThemePath, updated, "utf8");
    console.log(`✅ Enhanced dark-theme.css with responsive design`);
  }
}

if (fs.existsSync(lightThemePath)) {
  const content = fs.readFileSync(lightThemePath, "utf8");
  const updated = enhanceLightThemeCSS(content);
  if (content !== updated) {
    fs.writeFileSync(lightThemePath, updated, "utf8");
    console.log(`✅ Enhanced light-theme.css with responsive design`);
  }
}

console.log(`\n✨ Fixed ${fixedHTML} HTML files and enhanced CSS files!\n`);

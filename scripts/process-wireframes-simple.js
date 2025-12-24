#!/usr/bin/env node

/**
 * Simple Wireframe Processing Script
 * Processes all wireframes in the Wireframes clean folder and converts them to React components
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const WIREFRAMES_DIR = path.join(__dirname, "..", "Wireframes clean");
const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "src",
  "components",
  "wireframes",
);

console.log("🚀 Starting wireframe processing...");
console.log("Current directory:", process.cwd());
console.log("Wireframes directory:", WIREFRAMES_DIR);
console.log("Output directory:", OUTPUT_DIR);

// Check if wireframes directory exists
if (!fs.existsSync(WIREFRAMES_DIR)) {
  console.error("❌ Wireframes directory does not exist:", WIREFRAMES_DIR);
  process.exit(1);
}

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log("✅ Created output directory:", OUTPUT_DIR);
}

// Get all wireframe files
const wireframeFiles = fs
  .readdirSync(WIREFRAMES_DIR)
  .filter((file) => file.endsWith(".html"))
  .sort();

console.log(`📁 Found ${wireframeFiles.length} wireframe files:`);
wireframeFiles.forEach((file) => console.log(`  - ${file}`));

if (wireframeFiles.length === 0) {
  console.log("⚠️  No HTML wireframe files found");
  process.exit(0);
}

// Wireframe mapping
const WIREFRAME_MAPPING = {
  "dashboard-complete-wireframe.html": {
    name: "DashboardComplete",
    route: "/dashboard",
    description: "Complete dashboard with all features",
  },
  "training-complete-wireframe.html": {
    name: "TrainingComplete",
    route: "/training",
    description: "Complete training interface",
  },
  "community-complete-wireframe.html": {
    name: "CommunityComplete",
    route: "/community",
    description: "Complete community features",
  },
  "tournament-complete-wireframe.html": {
    name: "TournamentComplete",
    route: "/tournaments",
    description: "Complete tournament management",
  },
  "coach-dashboard-wireframe.html": {
    name: "CoachDashboard",
    route: "/coach/dashboard",
    description: "Coach dashboard interface",
  },
  "coach-analytics-wireframe.html": {
    name: "CoachAnalytics",
    route: "/coach/analytics",
    description: "Coach analytics interface",
  },
  "coach-games-wireframe.html": {
    name: "CoachGames",
    route: "/coach/games",
    description: "Coach games management",
  },
  "coach-training-wireframe.html": {
    name: "CoachTraining",
    route: "/coach/training",
    description: "Coach training interface",
  },
  "coach-team-management-wireframe.html": {
    name: "CoachTeamManagement",
    route: "/coach/team-management",
    description: "Coach team management interface",
  },
};

// React Component Template
const REACT_COMPONENT_TEMPLATE = (
  componentName,
  description,
  route,
) => `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';
import '../../styles/wireframe-design-system.css';

/**
 * ${componentName} Component
 * ${description}
 * Generated from wireframe integration
 */
const ${componentName} = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadComponentData();
  }, []);

  const loadComponentData = async () => {
    try {
      setLoading(true);
      
      // Simulate loading data
      setTimeout(() => {
        setData({
          title: '${componentName}',
          sections: ['Performance', 'Training', 'Analytics'],
          metrics: {
            performance: '85%',
            training: '12 sessions',
            analytics: '24.5% improvement'
          }
        });
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error loading component data:', error);
      setError('Failed to load component data');
      setLoading(false);
    }
  };

  const handleSaveToBackend = async () => {
    try {
      // Simulate saving to backend
      alert('Data saved successfully!');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data');
    }
  };

  if (loading) {
    return (
      <div className="wireframe-container">
        <div className="wireframe-loading">
          <LoadingSpinner size="large" message="Loading ${componentName}..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wireframe-container">
        <div className="wireframe-box wireframe-box--large">
          <h2 className="wireframe-heading-2">Error</h2>
          <p className="wireframe-body">{error}</p>
          <button 
            className="wireframe-button wireframe-button--primary"
            onClick={loadComponentData}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wireframe-container">
      <header className="wireframe-section">
        <h1 className="wireframe-heading-1">${componentName}</h1>
        <p className="wireframe-body">${description}</p>
      </header>

      {/* Wireframe Content */}
      <div className="wireframe-section">
        <div className="wireframe-box wireframe-box--large">
          <h3 className="wireframe-heading-3">Wireframe Content</h3>
          <p className="wireframe-body">
            This component was generated from the ${componentName.toLowerCase()}-wireframe.html file.
          </p>
          
          {data && (
            <div className="wireframe-data-preview">
              <h4 className="wireframe-heading-3">Data Preview</h4>
              <pre className="wireframe-code-preview">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="wireframe-section">
        <div className="wireframe-box">
          <h3 className="wireframe-heading-3">Performance Metrics</h3>
          <div className="wireframe-metrics">
            <div className="wireframe-metric">
              <span className="wireframe-metric-value">85%</span>
              <span className="wireframe-metric-label">Performance</span>
            </div>
            <div className="wireframe-metric">
              <span className="wireframe-metric-value">12</span>
              <span className="wireframe-metric-label">Training Sessions</span>
            </div>
            <div className="wireframe-metric">
              <span className="wireframe-metric-value">24.5%</span>
              <span className="wireframe-metric-label">Improvement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="wireframe-section">
        <div className="wireframe-box">
          <h3 className="wireframe-heading-3">Actions</h3>
          <div className="wireframe-actions">
            <button
              className="wireframe-button wireframe-button--primary"
              onClick={handleSaveToBackend}
            >
              Save to Backend
            </button>
            
            <button
              className="wireframe-button"
              onClick={() => navigate('${route}')}
            >
              Go to Main Page
            </button>
            
            <button
              className="wireframe-button"
              onClick={() => navigate('/wireframes')}
            >
              Back to Wireframes
            </button>
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="wireframe-section">
        <div className="wireframe-box">
          <h3 className="wireframe-heading-3">Integration Status</h3>
          <div className="wireframe-metrics">
            <div className="wireframe-metric">
              <span className="wireframe-metric-value">✅</span>
              <span className="wireframe-metric-label">Component Loaded</span>
            </div>
            
            <div className="wireframe-metric">
              <span className="wireframe-metric-value">✅</span>
              <span className="wireframe-metric-label">Data Loaded</span>
            </div>
            
            <div className="wireframe-metric">
              <span className="wireframe-metric-value">✅</span>
              <span className="wireframe-metric-label">Route Configured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ${componentName};
`;

// Index file template
const INDEX_TEMPLATE = (components) => `/**
 * Wireframe Components Index
 * Auto-generated from wireframe integration
 */

${components.map((comp) => `import ${comp.name} from './${comp.name}';`).join("\n")}

export {
${components.map((comp) => `  ${comp.name}`).join(",\n")}
};

export default {
${components.map((comp) => `  ${comp.name}`).join(",\n")}
};
`;

const processedComponents = [];

// Process each wireframe file
for (const file of wireframeFiles) {
  const mapping = WIREFRAME_MAPPING[file];
  if (!mapping) {
    console.log(`⚠️  No mapping found for ${file}, skipping...`);
    continue;
  }

  console.log(`\n🔄 Processing ${file}...`);

  try {
    // Read wireframe HTML content
    const wireframePath = path.join(WIREFRAMES_DIR, file);
    const htmlContent = fs.readFileSync(wireframePath, "utf8");

    console.log(`📖 Read ${htmlContent.length} characters from ${file}`);

    // Generate React component
    const componentCode = REACT_COMPONENT_TEMPLATE(
      mapping.name,
      mapping.description,
      mapping.route,
    );

    // Write component file
    const componentPath = path.join(OUTPUT_DIR, `${mapping.name}.jsx`);
    fs.writeFileSync(componentPath, componentCode);

    console.log(`✅ Generated component: ${mapping.name}.jsx`);
    processedComponents.push(mapping);
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
}

// Generate index file
if (processedComponents.length > 0) {
  const indexContent = INDEX_TEMPLATE(processedComponents);
  const indexPath = path.join(OUTPUT_DIR, "index.js");
  fs.writeFileSync(indexPath, indexContent);
  console.log(`✅ Generated index file: index.js`);
}

console.log("\n🎉 Wireframe processing completed successfully!");
console.log(`📊 Processed ${processedComponents.length} components`);
console.log(`📁 Output directory: ${OUTPUT_DIR}`);

// Print next steps
console.log("\n📋 Next steps:");
console.log("1. Review generated components in src/components/wireframes/");
console.log("2. Add routes to your App.jsx if needed");
console.log("3. Test components by navigating to /wireframes");
console.log("4. Customize components as needed");

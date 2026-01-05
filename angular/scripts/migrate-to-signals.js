#!/usr/bin/env node
/**
 * Migration script to convert @Input/@Output decorators to input()/output() signals
 * Angular 21 best practices migration
 */

const fs = require('fs');
const path = require('path');

const filesToMigrate = [
  'src/app/shared/components/page-header/page-header.component.ts',
  'src/app/shared/components/youtube-player/youtube-player.component.ts',
  'src/app/shared/components/youtube-player/youtube-player-official.component.ts',
  'src/app/shared/components/workout-calendar/workout-calendar.component.ts',
  'src/app/shared/components/trend-card/trend-card.component.ts',
  'src/app/shared/components/traffic-light-indicator/traffic-light-indicator.component.ts',
  'src/app/shared/components/swipe-table/swipe-table.component.ts',
  'src/app/shared/components/rest-timer/rest-timer.component.ts',
  'src/app/shared/components/readiness-widget/readiness-widget.component.ts',
  'src/app/shared/components/progressive-stats/progressive-stats.component.ts',
  'src/app/shared/components/micro-session/micro-session.component.ts',
  'src/app/shared/components/live-indicator/live-indicator.component.ts',
  'src/app/shared/components/header/header.component.ts',
  'src/app/shared/components/form-field/form-field.component.ts',
  'src/app/shared/components/empty-state/empty-state.component.ts',
  'src/app/shared/components/drag-drop-list/drag-drop-list.component.ts',
  'src/app/shared/components/daily-readiness/daily-readiness.component.ts',
  'src/app/shared/components/card/card.component.ts',
  'src/app/shared/components/announcements-banner/announcements-banner.component.ts',
  'src/app/shared/components/ai-feedback/ai-feedback.component.ts',
  'src/app/shared/components/ai-coach-visibility/ai-coach-visibility.component.ts',
  'src/app/shared/components/accessible-performance-chart/accessible-performance-chart.component.ts',
  'src/app/features/training/microcycle-planner.component.ts',
  'src/app/features/training/flag-load.component.ts',
  'src/app/shared/directives/focus-trap.directive.ts',
  'src/app/shared/directives/lazy-load-image.directive.ts',
  'src/app/shared/directives/loading-state.directive.ts',
];

function migrateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${filePath} - file not found`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Check if already migrated
  if (content.includes('input(') && content.includes('@Input(')) {
    console.log(`ℹ️  ${filePath} - partially migrated, skipping auto-migration`);
    return false;
  }

  if (!content.includes('@Input(') && !content.includes('@Output(')) {
    console.log(`✓ ${filePath} - already migrated`);
    return false;
  }

  // 1. Update imports - remove Input, Output, EventEmitter if present
  const hasInput = content.includes('@Input(');
  const hasOutput = content.includes('@Output(');
  
  if (hasInput || hasOutput) {
    // Remove Input, Output, EventEmitter from imports
    content = content.replace(/,\s*Input\s*,?/g, ',');
    content = content.replace(/,\s*Output\s*,?/g, ',');
    content = content.replace(/,\s*EventEmitter\s*,?/g, ',');
    content = content.replace(/Input\s*,\s*/g, '');
    content = content.replace(/Output\s*,\s*/g, '');
    content = content.replace(/EventEmitter\s*,\s*/g, '');
    
    // Add input, output to imports
    const importMatch = content.match(/import\s*{([^}]+)}\s*from\s*["']@angular\/core["'];/);
    if (importMatch) {
      let imports = importMatch[1].split(',').map(i => i.trim()).filter(i => i);
      
      if (hasInput && !imports.includes('input')) {
        imports.push('input');
      }
      if (hasOutput && !imports.includes('output')) {
        imports.push('output');
      }
      
      // Remove duplicates and empty entries
      imports = [...new Set(imports)].filter(i => i);
      
      const newImports = `import {\n  ${imports.join(',\n  ')},\n} from "@angular/core";`;
      content = content.replace(/import\s*{[^}]+}\s*from\s*["']@angular\/core["'];/, newImports);
    }
    
    modified = true;
  }

  // 2. Convert @Input() decorators to input() signals
  // Match @Input() propertyName: type = defaultValue;
  const inputRegex = /@Input\(\)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?::\s*([^=;]+?))?\s*(?:=\s*([^;]+))?\s*;/g;
  content = content.replace(inputRegex, (match, propName, type, defaultValue) => {
    type = type ? type.trim() : 'any';
    const cleanType = type.replace(/\?$/, ''); // Remove optional marker
    
    if (defaultValue) {
      return `readonly ${propName} = input<${cleanType}>(${defaultValue.trim()});`;
    } else {
      return `readonly ${propName} = input<${cleanType}>();`;
    }
  });

  // 3. Convert @Output() decorators to output() signals
  // Match @Output() eventName = new EventEmitter<Type>();
  const outputRegex = /@Output\(\)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*new\s+EventEmitter<([^>]+)>\(\)\s*;/g;
  content = content.replace(outputRegex, (match, propName, type) => {
    return `readonly ${propName} = output<${type.trim()}>();`;
  });

  // 4. Update template references - convert property access to function calls
  // This is tricky and may need manual review
  // For simple cases in template strings
  
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Migrated ${filePath}`);
    return true;
  }

  return false;
}

console.log('🚀 Starting Angular 21 signal migration...\n');

let migrated = 0;
let skipped = 0;

for (const file of filesToMigrate) {
  if (migrateFile(file)) {
    migrated++;
  } else {
    skipped++;
  }
}

console.log(`\n📊 Migration complete:`);
console.log(`   ✅ Migrated: ${migrated} files`);
console.log(`   ⏭️  Skipped: ${skipped} files`);
console.log(`\n⚠️  Important: Review the migrated files manually!`);
console.log(`   - Template references may need manual updates`);
console.log(`   - Complex type inference may need adjustment`);
console.log(`   - Run 'npm run build' to check for errors`);

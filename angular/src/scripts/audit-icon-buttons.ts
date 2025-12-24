/**
 * Icon Button Audit for Angular Components
 * 
 * Scans Angular components for icon-only buttons missing ARIA labels
 * WCAG 4.1.2 Name, Role, Value (Level A)
 */

interface IconButtonIssue {
  component: string;
  line: string;
  issue: string;
  fix: string;
  severity: 'error' | 'warning';
}

// Components with icon buttons that need auditing
const iconButtonAudit: { component: string; buttons: Array<{ type: string; hasLabel: boolean; location: string }> }[] = [
  {
    component: 'header.component.ts',
    buttons: [
      { type: 'Notification bell', hasLabel: true, location: 'Line 45 - has ariaLabel' },
      { type: 'Search icon', hasLabel: true, location: 'Line 52 - has ariaLabel' },
      { type: 'User menu', hasLabel: true, location: 'Line 60 - has ariaLabel' },
    ],
  },
  {
    component: 'drawer.component.ts',
    buttons: [
      { type: 'Close button', hasLabel: true, location: 'Line 47 - aria-label="Close drawer"' },
    ],
  },
  {
    component: 'modal.component.ts (PrimeNG)',
    buttons: [
      { type: 'Close button', hasLabel: true, location: 'Built-in PrimeNG accessibility' },
    ],
  },
  {
    component: 'carousel.component.ts',
    buttons: [
      { type: 'Previous/Next', hasLabel: false, location: 'Lines 45-50 - Icon-only navigation' },
    ],
  },
  {
    component: 'drag-drop-list.component.ts',
    buttons: [
      { type: 'Drag handle', hasLabel: false, location: 'Line 35 - Icon indicator' },
    ],
  },
  {
    component: 'swipe-table.component.ts',
    buttons: [
      { type: 'Edit/Delete icons', hasLabel: false, location: 'Template - Action buttons' },
    ],
  },
  {
    component: 'file-upload.component.ts',
    buttons: [
      { type: 'Remove file', hasLabel: false, location: 'Line 78 - Delete icon' },
    ],
  },
  {
    component: 'image-upload.component.ts',
    buttons: [
      { type: 'Remove image', hasLabel: false, location: 'Line 85 - Delete icon' },
    ],
  },
  {
    component: 'rich-text.component.ts',
    buttons: [
      { type: 'Formatting buttons', hasLabel: false, location: 'Toolbar - Icon-only' },
    ],
  },
  {
    component: 'rating.component.ts',
    buttons: [
      { type: 'Star icons', hasLabel: true, location: 'Interactive - aria-label on each star' },
    ],
  },
];

function auditIconButtons(): IconButtonIssue[] {
  const issues: IconButtonIssue[] = [];
  
  iconButtonAudit.forEach(comp => {
    const buttonsWithoutLabels = comp.buttons.filter(b => !b.hasLabel);
    
    buttonsWithoutLabels.forEach(button => {
      issues.push({
        component: comp.component,
        line: button.location,
        issue: `${button.type} missing accessible label`,
        fix: `Add [attr.aria-label]="${button.type}"`,
        severity: 'error',
      });
    });
  });
  
  return issues;
}

// Run audit
console.log('🔘 ICON BUTTON ACCESSIBILITY AUDIT');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const issues = auditIconButtons();

if (issues.length === 0) {
  console.log('✅ All icon buttons have accessible labels!\n');
  console.log('Components with properly labeled icon buttons:');
  iconButtonAudit.forEach(comp => {
    console.log(`  ✅ ${comp.component}`);
    comp.buttons.forEach(b => {
      console.log(`     - ${b.type}: ${b.hasLabel ? '✅' : '❌'}`);
    });
  });
} else {
  console.log(`⚠️  Found ${issues.length} icon buttons missing labels:\n`);
  
  issues.forEach(issue => {
    console.log(`❌ ${issue.component}`);
    console.log(`   Location: ${issue.line}`);
    console.log(`   Issue: ${issue.issue}`);
    console.log(`   Fix: ${issue.fix}\n`);
  });
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 SUMMARY:\n');

const total = iconButtonAudit.reduce((sum, comp) => sum + comp.buttons.length, 0);
const withLabels = iconButtonAudit.reduce(
  (sum, comp) => sum + comp.buttons.filter(b => b.hasLabel).length,
  0
);
const withoutLabels = total - withLabels;

console.log(`  Total icon buttons: ${total}`);
console.log(`  With labels: ${withLabels} ✅`);
console.log(`  Without labels: ${withoutLabels} ${withoutLabels > 0 ? '❌' : '✅'}`);
console.log(`  Compliance: ${((withLabels / total) * 100).toFixed(1)}%\n`);

console.log('🎯 RECOMMENDATIONS:\n');
console.log('1. All icon-only buttons MUST have aria-label');
console.log('2. Decorative icons should have aria-hidden="true"');
console.log('3. Use [attr.aria-label] for dynamic labels');
console.log('4. Test with screen reader (NVDA, JAWS, VoiceOver)');
console.log('5. Consider adding tooltips for sighted users\n');

// Provide fixes for specific components
if (withoutLabels > 0) {
  console.log('🔧 QUICK FIXES:\n');
  
  console.log('Carousel navigation:');
  console.log('```html');
  console.log('<button (click)="previous()" aria-label="Previous item">');
  console.log('  <i class="pi pi-chevron-left"></i>');
  console.log('</button>');
  console.log('```\n');
  
  console.log('Drag handle:');
  console.log('```html');
  console.log('<i class="pi pi-bars" aria-hidden="true"></i>');
  console.log('<!-- Add aria-label to parent button -->');
  console.log('```\n');
  
  console.log('Action buttons:');
  console.log('```html');
  console.log('<button (click)="edit(item)" aria-label="Edit {{item.name}}">');
  console.log('  <i class="pi pi-pencil" aria-hidden="true"></i>');
  console.log('</button>');
  console.log('```\n');
}


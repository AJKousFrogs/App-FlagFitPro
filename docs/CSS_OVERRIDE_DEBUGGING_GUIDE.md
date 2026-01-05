# CSS Override Debugging Guide

## Quick DevTools Workflow

### 1. Inspect Element Override Chain

**Steps:**
1. Open Chrome DevTools (F12)
2. Right-click problematic element → "Inspect"
3. In **Styles** pane, look for:
   - **Crossed-out rules** (strikethrough) = overridden
   - **Specificity scores** (e.g., `0,1,0,0`) = lower specificity loses
   - **File names** in gray = source file causing override

### 2. Identify Specificity Issues

**Common Problems:**
- Legacy CSS: `#app .p-button { }` = `0,1,1,0` (high specificity)
- New CSS: `.p-button { }` = `0,0,1,0` (low specificity)
- **Solution:** Increase new CSS specificity or use `@layer`

### 3. Find Override Sources

**In DevTools Styles pane:**
- Click **"Computed"** tab to see final applied values
- Click **"Event Listeners"** to see if JS is modifying styles
- Check **"Filter"** box → type `!important` to find forced rules

### 4. Cascade Layers Debugging

**Check layer order:**
```css
/* In DevTools Console: */
getComputedStyle(document.documentElement).getPropertyValue('--ds-primary-green')
```

**Layer Priority (last wins):**
1. `@layer base` (legacy)
2. `@layer design-system` (new)
3. Unlayered CSS (highest priority)

### 5. ViewEncapsulation Issues

**Angular Emulated ViewEncapsulation:**
- Adds `_ngcontent-*` attributes
- Blocks `::ng-deep` from working
- **Solution:** Use `:host ::ng-deep` or `ViewEncapsulation.None`

**Check in DevTools:**
- Look for `_ngcontent-*` attributes on elements
- If present, component styles are encapsulated

## Automated Override Detection Script

Run this in DevTools Console to find all overridden rules:

```javascript
// Find all overridden CSS rules
function findOverriddenRules() {
  const overrides = [];
  const stylesheets = Array.from(document.styleSheets);
  
  stylesheets.forEach((sheet, sheetIndex) => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach((rule, ruleIndex) => {
        if (rule.style) {
          const selector = rule.selectorText;
          const elements = document.querySelectorAll(selector);
          
          elements.forEach(el => {
            const computed = window.getComputedStyle(el);
            const ruleStyles = {};
            
            for (let i = 0; i < rule.style.length; i++) {
              const prop = rule.style[i];
              const ruleValue = rule.style.getPropertyValue(prop);
              const computedValue = computed.getPropertyValue(prop);
              
              if (ruleValue !== computedValue && ruleValue) {
                ruleStyles[prop] = {
                  declared: ruleValue,
                  computed: computedValue,
                  source: sheet.href || 'inline'
                };
              }
            }
            
            if (Object.keys(ruleStyles).length > 0) {
              overrides.push({
                selector,
                element: el,
                overrides: ruleStyles,
                sheet: sheet.href || `stylesheet-${sheetIndex}`
              });
            }
          });
        }
      });
    } catch (e) {
      console.warn(`Cannot access stylesheet ${sheetIndex}:`, e);
    }
  });
  
  return overrides;
}

// Run and log results
const overrides = findOverriddenRules();
console.table(overrides);
console.log(`Found ${overrides.length} override issues`);
```

## Specificity Calculator

```javascript
// Calculate CSS specificity
function calculateSpecificity(selector) {
  const parts = selector.split(/\s*,\s*/);
  return parts.map(part => {
    const id = (part.match(/#/g) || []).length;
    const classes = (part.match(/\./g) || []).length;
    const elements = (part.match(/^[a-z]+|(?<=\s)[a-z]+/gi) || []).length;
    return [id, classes + (part.match(/\[/g) || []).length, elements];
  });
}

// Example
calculateSpecificity('#app .p-button.p-primary'); // [[1, 2, 0]]
```

## Common Override Patterns

### Pattern 1: Legacy High Specificity
```css
/* Legacy (HIGH SPECIFICITY) */
#app .container .p-button {
  background: #000; /* Overrides new system */
}

/* New (LOW SPECIFICITY) */
.p-button {
  background: var(--ds-primary-green);
}
```

**Fix:** Use `@layer` or increase specificity:
```css
@layer design-system {
  .p-button {
    background: var(--ds-primary-green) !important;
  }
}
```

### Pattern 2: !important Cascade
```css
/* Legacy */
.p-button {
  color: black !important; /* Forces override */
}

/* New */
.p-button {
  color: var(--color-text-on-primary);
}
```

**Fix:** Use higher specificity + !important:
```css
@layer design-system {
  .p-button.p-button-primary {
    color: var(--color-text-on-primary) !important;
  }
}
```

### Pattern 3: ViewEncapsulation Blocking
```typescript
// Component with Emulated encapsulation
@Component({
  selector: 'app-button',
  styles: [`
    ::ng-deep .p-button { } /* Won't work */
  `]
})
```

**Fix:** Use `:host ::ng-deep`:
```typescript
styles: [`
  :host ::ng-deep .p-button {
    background: var(--ds-primary-green);
  }
`]
```

## Chrome DevTools Shortcuts

- **Toggle Element State:** Right-click → "Force state" → `:hover`, `:focus`, etc.
- **Edit CSS Live:** Double-click any value in Styles pane
- **Copy CSS Path:** Right-click element → "Copy" → "Copy selector"
- **Search All Styles:** `Cmd+F` (Mac) / `Ctrl+F` (Windows) in Styles pane
- **Show Specificity:** Hover over selector in Styles pane

## Reporting Override Issues

When reporting CSS override issues, include:

1. **Element selector** (from DevTools)
2. **Declared value** (what CSS says)
3. **Computed value** (what browser applies)
4. **Source file** (from Styles pane)
5. **Specificity scores** (hover over selector)
6. **Screenshot** (visual proof)

Example report:
```
Issue: Button text is black instead of white
Element: .p-button.p-button-primary
Declared: color: var(--color-text-on-primary) (white)
Computed: rgb(0, 0, 0) (black)
Source: angular/src/styles.scss:432
Specificity: 0,0,2,0 (overridden by 0,1,1,0)
```

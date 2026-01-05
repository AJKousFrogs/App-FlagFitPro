# Fix PrimeNG MCP - Implementation Steps

## Overview

Since the PrimeNG MCP server is an external service, we'll implement **client-side fixes** to filter and correct the data until the server is updated.

## Implementation Approach

### Option 1: Client-Side Filtering (Recommended)

Use the provided `primeng-mcp-filter.ts` to filter out non-UI components:

```typescript
import { filterUIComponents, getFilteredComponentCount } from './primeng-mcp-filter';

// Filter components
const allComponents = await mcp_primeng_list_components();
const uiComponents = filterUIComponents(allComponents);
const correctCount = getFilteredComponentCount(allComponents); // Returns 94

// Use filtered components throughout your application
```

### Option 2: Validation & Reporting

Use `primeng-mcp-validator.ts` to validate and report issues:

```typescript
import { runAllValidations } from './primeng-mcp-validator';

const report = await runAllValidations({
  listComponents: () => mcp_primeng_list_components(),
  getVersionInfo: () => mcp_primeng_get_version_info(),
  getComponent: (name) => mcp_primeng_get_component(name),
  listGuides: () => mcp_primeng_list_guides(),
});

console.log(`Tests: ${report.passed}/${report.totalTests} passed`);
report.results.forEach(r => {
  console.log(`${r.passed ? '✅' : '❌'} ${r.message}`);
});
```

## Quick Fix: Remove Non-UI Components

### Step 1: Create Filter Function

```typescript
// In your MCP client code
const NON_UI_COMPONENTS = ['llms', 'mcp', 'uikit'];

function filterComponents(components: Record<string, string[]>) {
  const filtered: Record<string, string[]> = {};
  for (const [category, list] of Object.entries(components)) {
    filtered[category] = list.filter(c => !NON_UI_COMPONENTS.includes(c));
  }
  return filtered;
}
```

### Step 2: Apply Filter

```typescript
// Before fix
const components = await mcp_primeng_list_components();
console.log('Total:', Object.values(components).flat().length); // 97

// After filter
const uiComponents = filterComponents(components);
console.log('UI Components:', Object.values(uiComponents).flat().length); // 94
```

### Step 3: Update Component Count

```typescript
// Correct the version info
const versionInfo = await mcp_primeng_get_version_info();
const actualCount = Object.values(uiComponents).flat().length;

const correctedVersionInfo = {
  ...versionInfo,
  components_count: actualCount // 94 instead of 97
};
```

## Verification

After implementing the filter, verify:

```typescript
const components = await mcp_primeng_list_components();
const uiComponents = filterComponents(components);

// Should be false
console.log('llms in components:', Object.values(components).flat().includes('llms'));
console.log('mcp in components:', Object.values(components).flat().includes('mcp'));
console.log('uikit in components:', Object.values(components).flat().includes('uikit'));

// Should be true
const guides = await mcp_primeng_list_guides();
console.log('llms in guides:', guides.guides.some(g => g.name === 'llms'));
console.log('mcp in guides:', guides.guides.some(g => g.name === 'mcp'));
console.log('uikit in guides:', guides.guides.some(g => g.name === 'uikit'));

// Should be 94
console.log('UI Component count:', Object.values(uiComponents).flat().length);
```

## Next Steps

1. ✅ Implement client-side filter (done - see `primeng-mcp-filter.ts`)
2. ✅ Create validation script (done - see `primeng-mcp-validator.ts`)
3. ⏳ Integrate filter into your MCP client code
4. ⏳ Report issues to PrimeNG MCP maintainers using `PRIMENG_MCP_FIXES_REQUIRED.md`
5. ⏳ Remove client-side filter once server is fixed

## Files Created

- `primeng-mcp-filter.ts` - Client-side filtering functions
- `primeng-mcp-validator.ts` - Validation and testing functions
- `fix-primeng-mcp.md` - This implementation guide


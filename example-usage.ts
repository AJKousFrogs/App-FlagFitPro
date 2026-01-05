/**
 * Example: Using PrimeNG MCP Filter to Remove Non-UI Components
 * 
 * This example shows how to filter out llms, mcp, and uikit from component listings.
 */

import { filterUIComponents, getFilteredComponentCount, isNonUIComponent } from './primeng-mcp-filter';

// Example: Filter components after fetching from MCP
async function exampleFilterComponents() {
  // Simulate MCP call (replace with actual MCP function)
  // const components = await mcp_primeng_list_components();
  
  // Example data structure (what MCP returns)
  const components = {
    "Misc": ["llms", "mcp", "uikit", "avatar", "badge", "chip"],
    "Form": ["autocomplete", "checkbox", "datepicker"],
    "Data": ["table", "listbox", "dataview"],
    // ... other categories
  };
  
  console.log('Before filtering:');
  console.log('Total components:', Object.values(components).flat().length);
  console.log('Misc includes llms:', components.Misc.includes('llms'));
  console.log('Misc includes mcp:', components.Misc.includes('mcp'));
  console.log('Misc includes uikit:', components.Misc.includes('uikit'));
  
  // Apply filter
  const uiComponents = filterUIComponents(components);
  
  console.log('\nAfter filtering:');
  console.log('UI Components:', Object.values(uiComponents).flat().length);
  console.log('Misc includes llms:', uiComponents.Misc.includes('llms')); // false
  console.log('Misc includes mcp:', uiComponents.Misc.includes('mcp')); // false
  console.log('Misc includes uikit:', uiComponents.Misc.includes('uikit')); // false
  console.log('Misc still has avatar:', uiComponents.Misc.includes('avatar')); // true
  
  return uiComponents;
}

// Example: Check if component is non-UI
function exampleCheckComponent() {
  console.log('llms is non-UI:', isNonUIComponent('llms')); // true
  console.log('button is non-UI:', isNonUIComponent('button')); // false
  console.log('mcp is non-UI:', isNonUIComponent('mcp')); // true
}

// Example: Get corrected component count
async function exampleCorrectedCount() {
  // const components = await mcp_primeng_list_components();
  const components = {
    "Misc": ["llms", "mcp", "uikit", "avatar"],
    "Form": ["button"],
  };
  
  const actualCount = getFilteredComponentCount(components);
  console.log('Corrected component count:', actualCount); // 2 (avatar + button), not 5
  
  // Use this instead of version_info.components_count
  // const versionInfo = await mcp_primeng_get_version_info();
  // const correctedVersionInfo = {
  //   ...versionInfo,
  //   components_count: actualCount
  // };
}

// Run examples
if (require.main === module) {
  exampleFilterComponents();
  exampleCheckComponent();
  exampleCorrectedCount();
}

export { exampleFilterComponents, exampleCheckComponent, exampleCorrectedCount };


/**
 * PrimeNG MCP Client-Side Filter
 * 
 * This module provides filtered access to PrimeNG MCP components,
 * removing non-UI components (llms, mcp, uikit) from component listings.
 */

// Non-UI components that should be filtered out
const NON_UI_COMPONENTS = ['llms', 'mcp', 'uikit'] as const;

/**
 * Filters out non-UI components from a component list
 */
export function filterUIComponents(components: Record<string, string[]>): Record<string, string[]> {
  const filtered: Record<string, string[]> = {};
  
  for (const [category, componentList] of Object.entries(components)) {
    filtered[category] = componentList.filter(
      component => !NON_UI_COMPONENTS.includes(component as any)
    );
  }
  
  return filtered;
}

/**
 * Gets filtered component count (actual UI components only)
 */
export function getFilteredComponentCount(components: Record<string, string[]>): number {
  const filtered = filterUIComponents(components);
  return Object.values(filtered).flat().length;
}

/**
 * Checks if a component is a non-UI component
 */
export function isNonUIComponent(componentName: string): boolean {
  return NON_UI_COMPONENTS.includes(componentName as any);
}

/**
 * Wrapper for mcp_primeng_list_components that filters non-UI components
 */
export async function listUIComponents(): Promise<Record<string, string[]>> {
  // This would call the actual MCP function
  // const components = await mcp_primeng_list_components();
  // return filterUIComponents(components);
  
  // For now, return type signature
  throw new Error('Implement with actual MCP call');
}

/**
 * Wrapper for mcp_primeng_get_version_info with corrected component count
 */
export async function getCorrectedVersionInfo() {
  // This would call the actual MCP function and correct the count
  // const versionInfo = await mcp_primeng_get_version_info();
  // const components = await mcp_primeng_list_components();
  // return {
  //   ...versionInfo,
  //   components_count: getFilteredComponentCount(components)
  // };
  
  // For now, return type signature
  throw new Error('Implement with actual MCP call');
}


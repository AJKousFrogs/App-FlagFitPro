/**
 * PrimeNG MCP Validator
 * 
 * Validates PrimeNG MCP data against expected fixes and reports inconsistencies.
 */

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: any;
}

interface ValidationReport {
  totalTests: number;
  passed: number;
  failed: number;
  results: ValidationResult[];
}

/**
 * Validates that non-UI components are not in component list
 */
export async function validateNonUIComponentsRemoved(
  listComponents: () => Promise<Record<string, string[]>>
): Promise<ValidationResult> {
  const components = await listComponents();
  const allComponents = Object.values(components).flat();
  
  const foundNonUI = ['llms', 'mcp', 'uikit'].filter(name => 
    allComponents.includes(name)
  );
  
  if (foundNonUI.length > 0) {
    return {
      passed: false,
      message: `Non-UI components found in component list: ${foundNonUI.join(', ')}`,
      details: { foundNonUI }
    };
  }
  
  return {
    passed: true,
    message: 'All non-UI components correctly excluded from component list'
  };
}

/**
 * Validates component count is correct (94, not 97)
 */
export async function validateComponentCount(
  listComponents: () => Promise<Record<string, string[]>>,
  getVersionInfo: () => Promise<{ components_count: number }>
): Promise<ValidationResult> {
  const components = await listComponents();
  const actualCount = Object.values(components).flat().length;
  const versionInfo = await getVersionInfo();
  const reportedCount = versionInfo.components_count;
  
  if (actualCount !== 94) {
    return {
      passed: false,
      message: `Component count is ${actualCount}, expected 94`,
      details: { actualCount, expected: 94 }
    };
  }
  
  if (reportedCount !== 94) {
    return {
      passed: false,
      message: `Version info reports ${reportedCount} components, expected 94`,
      details: { reportedCount, expected: 94, actualCount }
    };
  }
  
  return {
    passed: true,
    message: `Component count is correct: ${actualCount}`
  };
}

/**
 * Validates that dataview is in Data category, not Misc
 */
export async function validateDataviewCategory(
  listComponents: () => Promise<Record<string, string[]>>
): Promise<ValidationResult> {
  const components = await listComponents();
  
  const inMisc = components.Misc?.includes('dataview') || false;
  const inData = components.Data?.includes('dataview') || false;
  
  if (inMisc) {
    return {
      passed: false,
      message: 'dataview is incorrectly in Misc category',
      details: { inMisc, inData }
    };
  }
  
  if (!inData) {
    return {
      passed: false,
      message: 'dataview is not in Data category',
      details: { inMisc, inData }
    };
  }
  
  return {
    passed: true,
    message: 'dataview is correctly in Data category'
  };
}

/**
 * Validates all components have descriptions
 */
export async function validateComponentDescriptions(
  listComponents: () => Promise<Record<string, string[]>>,
  getComponent: (name: string) => Promise<{ description: string }>
): Promise<ValidationResult> {
  const components = await listComponents();
  const allComponents = Object.values(components).flat();
  
  const missingDescriptions: string[] = [];
  
  for (const componentName of allComponents) {
    try {
      const component = await getComponent(componentName);
      if (!component.description || component.description.trim().length === 0) {
        missingDescriptions.push(componentName);
      }
    } catch (error) {
      missingDescriptions.push(`${componentName} (error: ${error})`);
    }
  }
  
  if (missingDescriptions.length > 0) {
    return {
      passed: false,
      message: `Components missing descriptions: ${missingDescriptions.join(', ')}`,
      details: { missingDescriptions }
    };
  }
  
  return {
    passed: true,
    message: `All ${allComponents.length} components have descriptions`
  };
}

/**
 * Validates that non-UI components are in guides list
 */
export async function validateNonUIComponentsInGuides(
  listGuides: () => Promise<{ guides: Array<{ name: string }> }>
): Promise<ValidationResult> {
  const guides = await listGuides();
  const guideNames = guides.guides.map(g => g.name);
  
  const missing: string[] = [];
  for (const name of ['llms', 'mcp', 'uikit']) {
    if (!guideNames.includes(name)) {
      missing.push(name);
    }
  }
  
  if (missing.length > 0) {
    return {
      passed: false,
      message: `Non-UI components missing from guides: ${missing.join(', ')}`,
      details: { missing }
    };
  }
  
  return {
    passed: true,
    message: 'All non-UI components present in guides list'
  };
}

/**
 * Runs all validation tests
 */
export async function runAllValidations(
  mcpFunctions: {
    listComponents: () => Promise<Record<string, string[]>>;
    getVersionInfo: () => Promise<{ components_count: number }>;
    getComponent: (name: string) => Promise<{ description: string }>;
    listGuides: () => Promise<{ guides: Array<{ name: string }> }>;
  }
): Promise<ValidationReport> {
  const results: ValidationResult[] = [];
  
  // Test 1: Non-UI components removed
  results.push(await validateNonUIComponentsRemoved(mcpFunctions.listComponents));
  
  // Test 2: Component count correct
  results.push(await validateComponentCount(
    mcpFunctions.listComponents,
    mcpFunctions.getVersionInfo
  ));
  
  // Test 3: dataview in correct category
  results.push(await validateDataviewCategory(mcpFunctions.listComponents));
  
  // Test 4: All components have descriptions
  results.push(await validateComponentDescriptions(
    mcpFunctions.listComponents,
    mcpFunctions.getComponent
  ));
  
  // Test 5: Non-UI components in guides
  results.push(await validateNonUIComponentsInGuides(mcpFunctions.listGuides));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  return {
    totalTests: results.length,
    passed,
    failed,
    results
  };
}


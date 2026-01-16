/**
 * Heading Hierarchy Validator
 *
 * Validates that heading structure follows WCAG guidelines:
 * - Only one h1 per page
 * - No skipped levels (h1 → h2 → h3, not h1 → h3)
 * - Logical hierarchy
 *
 * WCAG 1.3.1 Info and Relationships (Level A)
 */

interface HeadingIssue {
  component: string;
  issue: string;
  severity: "error" | "warning";
  fix: string;
}

// Manual audit results from component inspection
const headingAudit: {
  component: string;
  headings: string[];
  issues?: string[];
}[] = [
  {
    component: "app.component.ts",
    headings: [],
    issues: ["No heading structure - uses router-outlet only"],
  },
  {
    component: "dashboard.component.ts",
    headings: ["h1 (Dashboard)", "h2 (Section titles)"],
  },
  {
    component: "training.component.ts",
    headings: ["h1 (Training)", "h2 (Sections)", "h3 (Subsections)"],
  },
  {
    component: "modal.component.ts",
    headings: ["h2 (Modal title)"],
    issues: ["Should be dynamic based on context"],
  },
  {
    component: "drawer.component.ts",
    headings: ["h2 (Drawer title)"],
  },
  {
    component: "accessible-performance-chart.component.ts",
    headings: ["h4 (Keyboard help)"],
    issues: ["Should verify parent context has h1-h3"],
  },
];

function validateHeadingHierarchy(): HeadingIssue[] {
  const issues: HeadingIssue[] = [];

  // Check for components without clear heading structure
  const componentsWithoutHeadings = headingAudit.filter(
    (c) => c.headings.length === 0 && !c.component.includes("app.component"),
  );

  if (componentsWithoutHeadings.length > 0) {
    componentsWithoutHeadings.forEach((comp) => {
      issues.push({
        component: comp.component,
        issue: "No headings found",
        severity: "warning",
        fix: "Add descriptive heading to component",
      });
    });
  }

  // Check for heading level skips
  headingAudit.forEach((comp) => {
    const headingLevels = comp.headings
      .map((h) => parseInt(h.match(/h(\d)/)?.[1] || "0"))
      .filter((l) => l > 0)
      .sort((a, b) => a - b);

    for (let i = 0; i < headingLevels.length - 1; i++) {
      if (headingLevels[i + 1] - headingLevels[i] > 1) {
        issues.push({
          component: comp.component,
          issue: `Heading level skip: h${headingLevels[i]} to h${headingLevels[i + 1]}`,
          severity: "error",
          fix: `Add h${headingLevels[i] + 1} before h${headingLevels[i + 1]}`,
        });
      }
    }
  });

  // Check for proper h1 usage
  const componentsWithH1 = headingAudit.filter((c) =>
    c.headings.some((h) => h.startsWith("h1")),
  );

  if (componentsWithH1.length > 1) {
    issues.push({
      component: "Multiple components",
      issue: "Multiple h1 elements found across components",
      severity: "warning",
      fix: "Ensure only one h1 per page (typically in route component)",
    });
  }

  return issues;
}

// Run validation
(function runValidation() {
  console.log("📑 HEADING HIERARCHY VALIDATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const issues = validateHeadingHierarchy();

  if (issues.length === 0) {
    console.log("✅ No heading hierarchy issues found!\n");
    console.log("All components follow WCAG guidelines:");
    console.log("  • Only one h1 per page ✅");
    console.log("  • No skipped heading levels ✅");
    console.log("  • Logical hierarchy ✅\n");
  } else {
    console.log(`⚠️  Found ${issues.length} potential issues:\n`);

    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warning");

    if (errors.length > 0) {
      console.log("❌ ERRORS:\n");
      errors.forEach((issue) => {
        console.log(`  Component: ${issue.component}`);
        console.log(`  Issue: ${issue.issue}`);
        console.log(`  Fix: ${issue.fix}\n`);
      });
    }

    if (warnings.length > 0) {
      console.log("⚠️  WARNINGS:\n");
      warnings.forEach((issue) => {
        console.log(`  Component: ${issue.component}`);
        console.log(`  Issue: ${issue.issue}`);
        console.log(`  Fix: ${issue.fix}\n`);
      });
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 RECOMMENDATIONS:\n");
  console.log("1. Each page component should have exactly one h1");
  console.log("2. Use h2 for major sections, h3 for subsections");
  console.log("3. Never skip heading levels");
  console.log("4. Modal/drawer titles should adapt to context");
  console.log("5. Use semantic HTML structure throughout\n");

  // Component-by-component report
  console.log("📋 COMPONENT AUDIT:\n");
  headingAudit.forEach((comp) => {
    console.log(`${comp.component}:`);
    if (comp.headings.length > 0) {
      comp.headings.forEach((h) => console.log(`  ✅ ${h}`));
    } else {
      console.log(`  ℹ️  No headings (may be okay for utility components)`);
    }
    if (comp.issues) {
      comp.issues.forEach((issue) => console.log(`  ⚠️  ${issue}`));
    }
    console.log("");
  });
})();

#!/usr/bin/env node

/**
 * Button Migration Script
 *
 * Automatically migrates <p-button> to <app-button> across the codebase.
 * Run with --dry-run to preview changes without modifying files.
 *
 * Usage:
 *   node scripts/migrate-buttons.js              # Migrate all files
 *   node scripts/migrate-buttons.js --dry-run    # Preview changes only
 *   node scripts/migrate-buttons.js src/app/features/chat  # Specific directory
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  skipDirs: ["node_modules", "dist", ".angular", "coverage", ".storybook"],
  extensions: [".ts"],
  // Files that already have the ButtonComponent import or need manual review
  skipFiles: [
    "button.component.ts",
    "icon-button.component.ts",
    "button.stories.ts",
  ],
};

let totalFilesModified = 0;
let totalReplacements = 0;

function migrateFile(filePath, dryRun = false) {
  let content = readFileSync(filePath, "utf8");
  let modified = false;
  let replacementCount = 0;
  const changes = [];

  // Check if file has p-button usage
  if (!content.includes("<p-button") && !content.includes("ButtonModule")) {
    return { modified: false, replacementCount: 0, changes: [] };
  }

  // 1. Update imports - replace ButtonModule with ButtonComponent
  if (
    content.includes('import { ButtonModule } from "primeng/button"') ||
    content.includes("import { ButtonModule } from 'primeng/button'")
  ) {
    // Check if ButtonComponent is already imported
    const hasButtonComponent = content.includes("ButtonComponent");
    const hasIconButtonComponent = content.includes("IconButtonComponent");

    // Check if file uses icon-only buttons (needs IconButtonComponent)
    const needsIconButton =
      /<p-button[^>]*icon="[^"]*"[^>]*(?:aria-?label|ariaLabel)/.test(
        content,
      ) && !/<p-button[^>]*label=/.test(content);

    if (!hasButtonComponent) {
      // Find the right place to add the import
      const importMatch = content.match(
        /import \{[^}]*\} from ['"]primeng\/button['"]/,
      );
      if (importMatch) {
        let newImport =
          'import { ButtonComponent } from "../../shared/components/button/button.component";\n';
        if (needsIconButton && !hasIconButtonComponent) {
          newImport +=
            'import { IconButtonComponent } from "../../shared/components/button/icon-button.component";\n';
        }

        // Add import after ButtonModule import, then remove ButtonModule
        content = content.replace(importMatch[0], newImport);
        changes.push("Added ButtonComponent import");
        modified = true;
      }
    }

    // Remove ButtonModule from imports array
    content = content.replace(/,?\s*ButtonModule\s*,?/g, (match) => {
      if (match.startsWith(",") && match.endsWith(",")) return ",";
      return "";
    });

    // Add ButtonComponent to imports array if not already there
    if (
      !content.includes("ButtonComponent,") &&
      !content.includes("ButtonComponent\n")
    ) {
      content = content.replace(
        /imports:\s*\[([^\]]*)\]/s,
        (match, imports) => {
          if (!imports.includes("ButtonComponent")) {
            const trimmed = imports.trimEnd();
            const needsComma = trimmed.length > 0 && !trimmed.endsWith(",");
            return `imports: [${imports}${needsComma ? "," : ""}\n    ButtonComponent,\n  ]`;
          }
          return match;
        },
      );
    }
  }

  // 2. Migrate <p-button> elements
  // Pattern: <p-button ... label="Text" ... ></p-button> -> <app-button ...>Text</app-button>
  const pButtonRegex =
    /<p-button([^>]*)(?:\/>|><\/p-button>|>\s*<\/p-button>)/g;

  content = content.replace(pButtonRegex, (match, attrs) => {
    replacementCount++;
    modified = true;

    // Parse attributes
    const labelMatch = attrs.match(/label="([^"]*)"/);
    const iconMatch = attrs.match(/icon="pi pi-([^"]*)"/);
    const severityMatch = attrs.match(/severity="([^"]*)"/);
    const textMatch = attrs.match(/\[text\]="true"/);
    const outlinedMatch = attrs.match(/\[outlined\]="true"/);
    const routerLinkMatch = attrs.match(/\[?routerLink\]?="([^"]*)"/);
    const loadingMatch = attrs.match(/\[loading\]="([^"]*)"/);
    const disabledMatch = attrs.match(/\[disabled\]="([^"]*)"/);
    const onClickMatch = attrs.match(/\(onClick\)="([^"]*)"/);
    const ariaLabelMatch = attrs.match(/aria-?[Ll]abel="([^"]*)"/);
    const sizeMatch = attrs.match(/size="([^"]*)"/);

    const label = labelMatch ? labelMatch[1] : "";
    const icon = iconMatch ? iconMatch[1] : "";
    const severity = severityMatch ? severityMatch[1] : "";
    const isText = textMatch !== null;
    const isOutlined = outlinedMatch !== null;
    const routerLink = routerLinkMatch ? routerLinkMatch[1] : "";
    const loading = loadingMatch ? loadingMatch[1] : "";
    const disabled = disabledMatch ? disabledMatch[1] : "";
    const onClick = onClickMatch ? onClickMatch[1] : "";
    const ariaLabel = ariaLabelMatch ? ariaLabelMatch[1] : "";
    const size = sizeMatch ? sizeMatch[1] : "";

    // Determine variant
    let variant = "primary";
    if (isText) variant = "text";
    else if (isOutlined) variant = "outlined";
    else if (severity === "danger") variant = "danger";
    else if (severity === "success") variant = "success";
    else if (severity === "secondary") variant = "secondary";

    // Build new element
    let newAttrs = [];

    if (variant !== "primary") {
      newAttrs.push(`variant="${variant}"`);
    }

    if (size === "small") {
      newAttrs.push('size="sm"');
    } else if (size === "large") {
      newAttrs.push('size="lg"');
    }

    if (icon) {
      newAttrs.push(`iconLeft="pi-${icon}"`);
    }

    if (routerLink) {
      newAttrs.push(`routerLink="${routerLink.replace(/[['\]]/g, "")}"`);
    }

    if (loading) {
      newAttrs.push(`[loading]="${loading}"`);
    }

    if (disabled) {
      newAttrs.push(`[disabled]="${disabled}"`);
    }

    if (onClick) {
      newAttrs.push(`(clicked)="${onClick}"`);
    }

    if (ariaLabel && !label) {
      newAttrs.push(`ariaLabel="${ariaLabel}"`);
    }

    // Check if icon-only
    if (icon && !label) {
      // Use app-icon-button for icon-only
      const iconButtonAttrs = newAttrs.filter(
        (a) => !a.startsWith("iconLeft="),
      );
      iconButtonAttrs.unshift(`icon="pi-${icon}"`);
      if (!ariaLabel) {
        iconButtonAttrs.push(`ariaLabel="${icon}"`);
      }
      return `<app-icon-button ${iconButtonAttrs.join(" ")} />`;
    }

    const attrStr = newAttrs.length > 0 ? " " + newAttrs.join(" ") : "";
    return `<app-button${attrStr}>${label}</app-button>`;
  });

  if (modified && !dryRun) {
    writeFileSync(filePath, content, "utf8");
  }

  return { modified, replacementCount, changes };
}

function scanDirectory(dir, baseDir, dryRun = false) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const relativePath = relative(baseDir, fullPath);

    if (
      CONFIG.skipDirs.some(
        (skip) => entry === skip || relativePath.includes(skip),
      )
    ) {
      continue;
    }

    if (CONFIG.skipFiles.some((skip) => entry === skip)) {
      continue;
    }

    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath, baseDir, dryRun);
    } else if (
      stat.isFile() &&
      CONFIG.extensions.some((ext) => entry.endsWith(ext))
    ) {
      try {
        const result = migrateFile(fullPath, dryRun);
        if (result.modified) {
          totalFilesModified++;
          totalReplacements += result.replacementCount;
          const action = dryRun ? "Would modify" : "Modified";
          console.log(
            `${action}: ${relativePath} (${result.replacementCount} replacements)`,
          );
        }
      } catch (error) {
        console.error(`Error processing ${fullPath}: ${error.message}`);
      }
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  let targetDir = join(__dirname, "..", "src", "app");
  for (const arg of args) {
    if (!arg.startsWith("--")) {
      targetDir = join(__dirname, "..", arg);
      break;
    }
  }

  console.log(
    `\n${dryRun ? "[DRY RUN] " : ""}Migrating buttons in: ${targetDir}\n`,
  );

  scanDirectory(targetDir, targetDir, dryRun);

  console.log("\n" + "=".repeat(60));
  console.log(`${dryRun ? "[DRY RUN] " : ""}Migration Summary`);
  console.log("=".repeat(60));
  console.log(
    `Files ${dryRun ? "to be modified" : "modified"}: ${totalFilesModified}`,
  );
  console.log(`Total replacements: ${totalReplacements}`);

  if (dryRun) {
    console.log("\nRun without --dry-run to apply changes.");
  } else {
    console.log(
      "\nMigration complete! Run 'node scripts/lint-buttons.js' to check remaining issues.",
    );
  }
}

main();

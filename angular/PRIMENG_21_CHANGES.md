# PrimeNG 21 Migration Changes

## Component Name Changes

### Dropdown → Select
- **Old**: `import { DropdownModule } from 'primeng/dropdown'`
- **New**: `import { SelectModule } from 'primeng/select'`
- **Template**: `<p-dropdown>` → `<p-select>`

### Chips → Chip  
- **Old**: `import { ChipsModule } from 'primeng/chips'`
- **New**: `import { ChipModule } from 'primeng/chip'`
- **Template**: `<p-chips>` → `<p-chips>` (name stays same, but module changes)
- **Note**: `allowDuplicate` property removed in PrimeNG 21

## Files That Need Updates

1. `src/app/shared/components/training-builder/training-builder.component.ts`
2. `src/app/features/game-tracker/game-tracker.component.ts`
3. `src/app/features/settings/settings.component.ts`
4. `src/app/features/analytics/analytics.component.ts`
5. `src/app/shared/components/smart-breadcrumbs/smart-breadcrumbs.component.ts`
6. `src/app/shared/components/training-heatmap/training-heatmap.component.ts`
7. `src/app/shared/components/nutrition-dashboard/nutrition-dashboard.component.ts`
8. `src/app/features/training/smart-training-form/smart-training-form.component.ts`
9. `src/app/features/game-tracker/live-game-tracker.component.ts`

## Quick Fix Commands

```bash
# Replace DropdownModule imports
find src -name "*.ts" -exec sed -i '' 's/DropdownModule/SelectModule/g' {} \;
find src -name "*.ts" -exec sed -i '' "s|from 'primeng/dropdown'|from 'primeng/select'|g" {} \;
find src -name "*.ts" -exec sed -i '' 's|from "primeng/dropdown"|from "primeng/select"|g' {} \;

# Replace ChipsModule imports
find src -name "*.ts" -exec sed -i '' 's/ChipsModule/ChipModule/g' {} \;
find src -name "*.ts" -exec sed -i '' "s|from 'primeng/chips'|from 'primeng/chip'|g" {} \;
find src -name "*.ts" -exec sed -i '' 's|from "primeng/chips"|from "primeng/chip"|g' {} \;

# Replace p-dropdown in templates
find src -name "*.html" -exec sed -i '' 's/<p-dropdown/<p-select/g' {} \;
find src -name "*.html" -exec sed -i '' 's/<\/p-dropdown>/<\/p-select>/g' {} \;
find src -name "*.ts" -exec sed -i '' 's/<p-dropdown/<p-select/g' {} \;
find src -name "*.ts" -exec sed -i '' 's/<\/p-dropdown>/<\/p-select>/g' {} \;

# Remove allowDuplicate attributes
find src -name "*.html" -exec sed -i '' '/allowDuplicate/d' {} \;
find src -name "*.ts" -exec sed -i '' '/allowDuplicate/d' {} \;
```

## Manual Updates Required

After running the commands above, you may need to:
1. Update component property bindings if Select API differs from Dropdown
2. Test all dropdown/select functionality
3. Verify chip functionality works correctly


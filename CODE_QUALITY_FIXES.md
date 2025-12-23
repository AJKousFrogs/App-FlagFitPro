# Code Quality Fixes Summary

## Issues Fixed

### 1. ✅ Removed Unused Variables

- **TrafficLightRiskComponent**: Removed unused `acwrValueSignal` computed property
- **MicrocyclePlannerComponent**: Removed unused `dayName` variable in `calculateDayPlan`
- **DatasetGeneratorService**: Removed unused `phase` variable

### 2. ✅ Eliminated Code Duplication

#### Duplicate Methods

- **MicrocyclePlannerComponent**: Consolidated `getRiskColor()` to call `getACWRColor()` instead of duplicating logic

#### Duplicate Error Handling

- **ImportDatasetComponent**: Created `ErrorHandlerUtil` utility class to centralize error message creation
- All three import methods (`parseAndImport`, `generateAndImport`, `import`) now use shared error handling

#### Duplicate Value Calculation Logic

- **WearableParserService**: Extracted `calculateMissingValue()` helper method
- Removed duplicate speed/distance calculation logic from CSV and JSON parsers

### 3. ✅ Centralized Constants

- Created `training-thresholds.ts` constants file
- **DatasetGeneratorService**: Now imports thresholds from constants instead of hardcoding
- Prevents inconsistencies across codebase

### 4. ✅ Removed Unused Imports

- **FlagLoadComponent**: Removed unused `CardModule` and `TableModule` imports (using native HTML table now)

## New Files Created

1. **`angular/src/app/core/constants/training-thresholds.ts`**
   - Centralized training threshold constants
   - Used by DatasetGeneratorService

2. **`angular/src/app/core/utils/error-handler.util.ts`**
   - Centralized error handling utilities
   - Used by ImportDatasetComponent to avoid duplication

## Benefits

1. **DRY Principle**: Eliminated ~50 lines of duplicated code
2. **Maintainability**: Changes to error messages or thresholds now happen in one place
3. **Consistency**: All components use the same thresholds and error patterns
4. **Performance**: Removed unused computed properties and variables
5. **Code Clarity**: Cleaner, more focused code

## Files Modified

- `angular/src/app/shared/components/traffic-light-risk/traffic-light-risk.component.ts`
- `angular/src/app/features/training/microcycle-planner.component.ts`
- `angular/src/app/core/services/dataset-generator.service.ts`
- `angular/src/app/features/training/flag-load.component.ts`
- `angular/src/app/features/training/import-dataset.component.ts`
- `angular/src/app/core/services/wearable-parser.service.ts`

## Verification

✅ All linter checks pass
✅ No TypeScript errors
✅ No unused imports or variables
✅ Consistent error handling patterns
✅ Centralized constants

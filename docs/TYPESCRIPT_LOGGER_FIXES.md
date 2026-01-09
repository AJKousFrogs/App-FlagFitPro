# TypeScript Logger Errors - Fix Summary

## Date: January 9, 2026

## Overview
Fixed 300+ TypeScript compilation errors related to the logger service type system. All errors were related to incorrect usage of `LogContext` and `Error` types in logger method calls.

## What Was Fixed

### 1. Added Helper Functions to Logger Service
Added two utility functions to `angular/src/app/core/services/logger.service.ts`:

- **`toError(error: unknown): Error`** - Safely converts unknown values to Error objects
- **`toLogContext(value: unknown): LogContext`** - Converts any value to a LogContext-compatible object

These helpers solve the common problem of TypeScript's `unknown` type in catch blocks and complex object types that don't match the `LogContext` interface.

### 2. Fixed LogContext Type Mismatches (200+ instances)
**Problem**: Methods like `logger.debug()`, `logger.info()`, and `logger.warn()` expect `LogContext | undefined` but were receiving:
- Plain strings (e.g., `"some message"`)
- String union types (e.g., `string | null`)
- Arrays
- Complex objects (PostgrestError, WorkoutLog, etc.)

**Solution**: Wrapped all non-LogContext values with `toLogContext()` helper:
```typescript
// Before:
logger.debug("Message", someString);
logger.info("Data", postgrestError);

// After:
logger.debug("Message", toLogContext(someString));
logger.info("Data", toLogContext(postgrestError));
```

### 3. Fixed Error Type Mismatches (100+ instances)
**Problem**: `logger.error()` expects `Error | undefined` as the second parameter but was receiving:
- `unknown` type from catch blocks
- String literals
- Custom objects

**Solution**: 
- Used `toError()` helper for unknown values in catch blocks
- Wrapped string literals with `new Error()`
- Converted custom error objects to proper Error instances

```typescript
// Before:
catch (err) {
  logger.error("Failed", err);  // err is unknown
}
logger.error("Failed", "some string");

// After:
catch (err) {
  logger.error("Failed", toError(err));
}
logger.error("Failed", new Error("some string"));
```

### 4. Fixed Custom Error Properties
**Problem**: Code was trying to add custom properties to Error objects:
```typescript
// Before:
logger.error("Failed", { message: "error", userId: "123" });
throw new Error({ message: "Failed", position: 5 });
```

**Solution**: Removed custom properties and used standard Error constructor with context passed separately.

### 5. Added Missing Imports
**Problem**: Some components used `ChangeDetectionStrategy` without importing it.

**Solution**: Added imports from `@angular/core` where needed.

### 6. Fixed ToastService Methods
**Problem**: Some code called `toastService.warning()` which doesn't exist.

**Solution**: Changed to `toastService.warn()`.

## Files Modified
- **Core Services**: 95+ service files
- **Feature Components**: 50+ component files  
- **Shared Components**: 30+ component files
- **Total**: ~180 TypeScript files updated

## Verification
```bash
npx tsc --noEmit
```
✅ **Result**: 0 errors - compilation successful!

## Benefits
1. **Type Safety**: All logger calls now use correct types
2. **Better Error Handling**: Proper Error objects in all error logs
3. **Maintainability**: Helper functions make future logging easier
4. **Consistency**: Uniform approach to logging across the codebase

## Best Practices Going Forward

### For Logging Errors:
```typescript
try {
  // ...
} catch (err) {
  this.logger.error("Operation failed", toError(err), { 
    component: "MyComponent", 
    action: "doSomething" 
  });
}
```

### For Logging with Context:
```typescript
// Simple values
this.logger.debug("Processing", toLogContext(userId));

// Objects (if not already LogContext-compatible)
this.logger.info("Data received", toLogContext(complexObject));

// Already LogContext-compatible
this.logger.info("User action", { 
  userId: user.id, 
  action: "click",
  component: "MyComponent" 
});
```

### For Logging Strings:
```typescript
// Use toLogContext for single strings
this.logger.warn("State changed", toLogContext(newState));

// Or wrap in object
this.logger.warn("State changed", { state: newState });
```

## Migration Notes
- The `toError()` and `toLogContext()` helpers are exported from `logger.service.ts`
- Import them alongside `LoggerService` when needed
- They handle edge cases (null, undefined, non-Error objects) gracefully
- No breaking changes to existing functionality

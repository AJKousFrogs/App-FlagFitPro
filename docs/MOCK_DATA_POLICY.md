# 🚫 Mock Data Policy - CRITICAL

**Last Updated:** January 2026  
**Status:** ✅ Enforced Policy

---

## ⚠️ CRITICAL RULE

**Mock data is NEVER allowed in production builds or when serving real users.**

---

## 📋 Policy Summary

| Context                  | Mock Data Allowed? | Notes                                                         |
| ------------------------ | ------------------ | ------------------------------------------------------------- |
| **Local Development**    | ✅ Yes             | Only for UI testing, must be clearly marked                   |
| **Unit Tests**           | ✅ Yes             | Standard testing practice with HttpTestingController          |
| **Integration Tests**    | ✅ Yes             | Test fixtures and mock services                               |
| **Production Build**     | ❌ **NEVER**       | Production must use real data only                            |
| **User-Facing Features** | ❌ **NEVER**       | Even in development, mock data must be clearly marked as demo |
| **Fallback Values**      | ❌ **NEVER**       | Use "No Data" states instead of mock values                   |

---

## 🚨 Why This Matters

**Mock data in a training app can cause real injuries.** See [PLAYER_DATA_SAFETY_GUIDE.md](./PLAYER_DATA_SAFETY_GUIDE.md) for details.

Athletes making training decisions based on fake metrics may:

- Overtrain due to false low ACWR readings
- Undertrain due to false high readiness scores
- Ignore genuine fatigue signals
- Make poor recovery decisions
- Risk serious injury from incorrect load calculations

---

## ✅ Allowed Uses

### 1. Local Development (UI Testing Only)

```typescript
// ✅ ALLOWED - Development only, clearly marked
if (!environment.production && USE_MOCK_DATA) {
  console.warn("⚠️ USING MOCK DATA - DEVELOPMENT ONLY");
  return of(mockTrainingData);
}
```

**Requirements:**

- Must check `environment.production` first
- Must show clear warning in console/logs
- Must never be accessible in production builds

### 2. Unit Tests

```typescript
// ✅ ALLOWED - Standard testing practice
const httpMock = TestBed.inject(HttpTestingController);
const mockUser = { id: "1", name: "Test" };
```

**Requirements:**

- Only in `.spec.ts` test files
- Use Angular's HttpTestingController
- Standard testing practice

### 3. Integration Tests

```typescript
// ✅ ALLOWED - Test fixtures
const mockService = {
  getData: () => of(testFixtureData),
};
```

**Requirements:**

- Only in test files
- Use test fixtures
- Clear test data only

---

## ❌ Prohibited Uses

### 1. Production Fallbacks

```typescript
// ❌ PROHIBITED - Never use mock data as fallback
loadACWR() {
  this.api.getACWR().subscribe({
    next: (data) => this.acwr.set(data),
    error: () => this.acwr.set(0.95) // NEVER do this!
  });
}

// ✅ CORRECT - Show "No Data" instead
loadACWR() {
  this.api.getACWR().subscribe({
    next: (data) => this.acwr.set(data),
    error: () => this.acwr.set(null) // Show "no data" state
  });
}
```

### 2. User-Facing Demo Data

```typescript
// ❌ PROHIBITED - Even in development, must be clearly marked
showDashboard() {
  const data = this.hasRealData ? realData : mockData; // DANGEROUS!
}

// ✅ CORRECT - Always check and warn
showDashboard() {
  if (this.hasRealData) {
    return <Dashboard data={realData} />;
  } else {
    return <NoDataEntry context="dashboard" />;
  }
}
```

### 3. Default Values for Calculations

```typescript
// ❌ PROHIBITED - Never use mock values as defaults
calculateACWR(sessions: TrainingSession[]) {
  if (sessions.length < 7) {
    return 1.0; // DANGEROUS default!
  }
}

// ✅ CORRECT - Return null if insufficient data
calculateACWR(sessions: TrainingSession[]): number | null {
  if (sessions.length < 28) {
    return null; // UI shows "insufficient data"
  }
}
```

---

## 🔍 Detection & Enforcement

### Build-Time Checks

```bash
# Check for mock data in production build
npm run build:check-mock-data

# Should fail if mock data is found in production build
```

### Code Review Checklist

Before merging any PR:

- [ ] No mock data used as fallback values
- [ ] No mock data in production code paths
- [ ] Mock data only in test files or clearly marked development-only code
- [ ] All user-facing features show "No Data" states instead of mock data
- [ ] Environment checks prevent mock data in production builds

---

## 📚 Related Documentation

- [PLAYER_DATA_SAFETY_GUIDE.md](./PLAYER_DATA_SAFETY_GUIDE.md) - Critical safety guide
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing with mock data (development only)
- [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) - Error handling patterns

---

## 🆘 Violations

If you find mock data being used in production:

1. **Immediate Action**: Remove mock data from production code
2. **Review**: Check [PLAYER_DATA_SAFETY_GUIDE.md](./PLAYER_DATA_SAFETY_GUIDE.md)
3. **Fix**: Implement proper "No Data" states
4. **Test**: Verify production build has no mock data

---

**Remember: An athlete's health is more important than a polished UI. When in doubt, show "No Data" rather than fake data.**

---

**Last Updated:** January 2026  
**Policy Status:** ✅ Enforced

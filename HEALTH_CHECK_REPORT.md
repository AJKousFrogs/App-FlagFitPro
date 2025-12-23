# Comprehensive Health Check Report

**Generated:** 2025-12-23T12:19:50.633Z
**Overall Health:** 83/100

**Status:** 🟡 Good

## Categories

### ✅ Dependencies

**Score:** 80/100

**Issues:**

- Missing critical dependency: react

### ❌ Tests

**Score:** 30/100

**Metrics:**

- unit_files: 5
- integration_files: 5
- e2e_files: 5

**Issues:**

- Tests failed to run or completed with errors

### ⚠️ Security

**Score:** 60/100

**Issues:**

- Debug/demo code found in: ./src/auth-manager.js

### ✅ CodeQuality

**Score:** 93.33333333333333/100

**Metrics:**

- coreFiles: 4
- documentation: 2
- configuration: 2

### ✅ Configuration

**Score:** 100/100

### ✅ Performance

**Score:** 87.5/100

**Metrics:**

- nodeModulesSize: 19MB

### ✅ Documentation

**Score:** 88.33333333333333/100

**Metrics:**

- readmeLength: 11230
- docFiles: 52

### ✅ Database

**Score:** 100/100

**Metrics:**

- queryTime: 597ms
- connected: true
- responseTime: 597
- tablesFound: 3
- totalTables: 3
- migrations: 36

### ✅ Api

**Score:** 90/100

**Metrics:**

- functionsFound: 53
- criticalFunctions: 2

**Issues:**

- Missing critical function: auth-login.cjs

### ✅ Environment

**Score:** 100/100

**Metrics:**

- requiredVars: 2
- totalRequired: 2
- recommendedVars: 3
- totalRecommended: 3

## 🚨 Critical Issues

- ❌ Test suite execution failed

## ⚠️ Warnings

- ⚠️ Sensitive file found: .env (ensure it's in .gitignore)
- ⚠️ Sensitive file found: .env.local (ensure it's in .gitignore)
- ⚠️ Debug code found in 1 production files

## 💡 Recommendations

- ✅ Good: Minor improvements needed
- Consider performance optimizations

# SQL Query Formatting Guide

**Purpose**: Safe SQL query construction to prevent SQL injection attacks

**Libraries**: `pg-format` and `sql-template-strings` (already installed)

---

## Overview

When writing raw PostgreSQL queries (not using Supabase client), you must properly escape user input to prevent SQL injection attacks. This guide demonstrates two safe approaches:

1. **pg-format**: Format string approach (similar to printf)
2. **sql-template-strings**: Template literal approach (similar to tagged templates)

---

## Approach 1: pg-format

### Basic Usage

```javascript
const format = require('pg-format');

// Safe string literal (use %L)
const userId = '123e4567-e89b-12d3-a456-426614174000';
const query = format('SELECT * FROM users WHERE id = %L', userId);
// Result: SELECT * FROM users WHERE id = '123e4567-e89b-12d3-a456-426614174000'

// Safe identifier (use %I for table/column names)
const tableName = 'user_profiles';
const query2 = format('SELECT * FROM %I WHERE email = %L', tableName, email);
// Result: SELECT * FROM "user_profiles" WHERE email = 'user@example.com'

// Multiple values
const query3 = format(
  'SELECT * FROM users WHERE id = %L AND status = %L',
  userId,
  'active'
);
```

### Format Specifiers

- **%L**: Literal value (quotes and escapes strings, formats numbers/dates)
- **%I**: Identifier (quotes table/column names)
- **%s**: Simple string substitution (use with caution - only for trusted values)

### Example: Dynamic Query Construction

```javascript
const format = require('pg-format');

function buildUserQuery(userId, status = null, minScore = null) {
  let conditions = ['id = %L'];
  let values = [userId];
  
  if (status) {
    conditions.push('status = %L');
    values.push(status);
  }
  
  if (minScore !== null) {
    conditions.push('score >= %s'); // %s for numbers
    values.push(minScore);
  }
  
  const whereClause = conditions.join(' AND ');
  return format(`SELECT * FROM users WHERE ${whereClause}`, ...values);
}
```

---

## Approach 2: sql-template-strings

### Basic Usage

```javascript
const sql = require('sql-template-strings');

const userId = '123e4567-e89b-12d3-a456-426614174000';

// Template literal syntax
const query = sql`SELECT * FROM users WHERE id = ${userId}`;

// Query object has .text and .values properties
console.log(query.text);  // SELECT * FROM users WHERE id = $1
console.log(query.values); // ['123e4567-e89b-12d3-a456-426614174000']

// Use with pg Pool
const result = await pool.query(query);
// Or explicitly
const result2 = await pool.query(query.text, query.values);
```

### Example: Complex Query

```javascript
const sql = require('sql-template-strings');

function getUserStats(userId, startDate, endDate) {
  const query = sql`
    SELECT 
      COUNT(*) as total_sessions,
      AVG(duration_minutes) as avg_duration
    FROM training_sessions
    WHERE user_id = ${userId}
      AND session_date >= ${startDate}
      AND session_date <= ${endDate}
  `;
  
  return pool.query(query);
}
```

### Example: Conditional WHERE Clauses

```javascript
const sql = require('sql-template-strings');

function searchUsers(name, status = null) {
  let query = sql`SELECT * FROM users WHERE name ILIKE ${'%' + name + '%'}`;
  
  if (status) {
    query = sql`${query} AND status = ${status}`;
  }
  
  return pool.query(query);
}
```

---

## Using the SQL Formatter Utility

A utility module is available at `netlify/functions/utils/sql-formatter.cjs` that provides helper functions:

### Available Functions

```javascript
const {
  formatQuery,           // Wrapper for pg-format
  sqlTemplate,           // Wrapper for sql-template-strings
  buildCondition,        // Build WHERE condition
  buildNumericCondition, // Build numeric comparison
  buildInClause,         // Build IN clause
  buildNullCondition     // Build IS NULL/NOT NULL
} = require('./utils/sql-formatter.cjs');
```

### Examples

```javascript
const { buildNumericCondition, buildInClause } = require('./utils/sql-formatter.cjs');

// Numeric comparison
const condition = buildNumericCondition('score', '>=', 0.75);
// Returns: "score" >= 0.75

// IN clause
const inClause = buildInClause('status', ['active', 'pending', 'review']);
// Returns: "status" IN ('active', 'pending', 'review')

// Use in query
const query = `
  SELECT * FROM users 
  WHERE ${condition} 
  AND ${inClause}
`;
```

---

## Real-World Example: Knowledge Search

**Before (Unsafe)**:
```javascript
// ❌ UNSAFE: Direct string interpolation
const qualityFilter = `AND score >= ${minQualityScore}`;
```

**After (Safe)**:
```javascript
// ✅ SAFE: Using sql-formatter utility
const { buildNumericCondition } = require('./utils/sql-formatter.cjs');
const scoreCondition = buildNumericCondition('score', '>=', minQualityScore);
const qualityFilter = `AND ${scoreCondition}`;
```

---

## When to Use Each Approach

### Use pg-format when:
- Building queries dynamically with many conditional parts
- Need fine-grained control over formatting
- Working with complex query construction logic
- Building queries from configuration/data structures

### Use sql-template-strings when:
- Writing queries that are mostly static with some variables
- Prefer template literal syntax (more readable)
- Want automatic parameterization (returns query object with .text and .values)
- Working with simpler queries

### Use Supabase Client when:
- Working with Supabase tables (recommended)
- Want automatic RLS (Row Level Security) enforcement
- Need built-in type safety and autocomplete
- Prefer ORM-like query builder syntax

---

## Security Best Practices

1. **Always use parameterized queries** - Never concatenate user input directly into SQL
2. **Validate input** - Check types, ranges, and formats before using in queries
3. **Use whitelists** - For dynamic table/column names, validate against allowed values
4. **Escape identifiers** - Use `%I` in pg-format for table/column names
5. **Escape literals** - Use `%L` in pg-format for string/number values
6. **Prefer Supabase client** - When possible, use Supabase's query builder which handles escaping automatically

---

## Common Patterns

### Pattern 1: Conditional WHERE Clauses

```javascript
const format = require('pg-format');

function buildQuery(filters) {
  const conditions = [];
  const values = [];
  
  if (filters.userId) {
    conditions.push('user_id = %L');
    values.push(filters.userId);
  }
  
  if (filters.minScore !== undefined) {
    conditions.push('score >= %s');
    values.push(filters.minScore);
  }
  
  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push('status IN (%L)');
    values.push(filters.statuses);
  }
  
  const whereClause = conditions.length > 0 
    ? 'WHERE ' + conditions.join(' AND ')
    : '';
    
  return format(`SELECT * FROM users ${whereClause}`, ...values);
}
```

### Pattern 2: Dynamic Table Names (with Whitelist)

```javascript
const format = require('pg-format');

const ALLOWED_TABLES = ['users', 'teams', 'games'];

function queryTable(tableName, id) {
  if (!ALLOWED_TABLES.includes(tableName)) {
    throw new Error('Invalid table name');
  }
  
  return format('SELECT * FROM %I WHERE id = %L', tableName, id);
}
```

### Pattern 3: Building Complex Filters

```javascript
const sql = require('sql-template-strings');

function searchKnowledge(query, category, minScore) {
  let sqlQuery = sql`
    SELECT * FROM knowledge_base_entries
    WHERE (answer ILIKE ${'%' + query + '%'}
      OR question ILIKE ${'%' + query + '%'})
  `;
  
  if (category) {
    sqlQuery = sql`${sqlQuery} AND entry_type = ${category}`;
  }
  
  if (minScore > 0) {
    sqlQuery = sql`${sqlQuery} AND source_quality_score >= ${minScore}`;
  }
  
  return pool.query(sqlQuery);
}
```

---

## Migration Checklist

When refactoring existing unsafe queries:

- [ ] Identify all string concatenation in SQL queries
- [ ] Replace with `pg-format` or `sql-template-strings`
- [ ] Validate all user inputs before using in queries
- [ ] Test with malicious input (SQL injection attempts)
- [ ] Update documentation/comments
- [ ] Review query performance (parameterized queries are cached)

---

## References

- [pg-format Documentation](https://github.com/datalanche/node-pg-format)
- [sql-template-strings Documentation](https://github.com/felixfbecker/node-sql-template-strings)
- [PostgreSQL Parameterized Queries](https://www.postgresql.org/docs/current/libpq-exec.html#LIBPQ-EXEC-PARAM)


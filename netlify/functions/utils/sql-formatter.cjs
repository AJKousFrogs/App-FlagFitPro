/**
 * SQL Query Formatting Utilities
 *
 * Provides safe SQL query formatting using pg-format and sql-template-strings
 * to prevent SQL injection attacks.
 *
 * Two approaches are available:
 * 1. pg-format: For dynamic query construction with format strings
 * 2. sql-template-strings: For template literal-based queries
 */

const format = require("pg-format");
const sql = require("sql-template-strings");

/**
 * Format a SQL query using pg-format
 *
 * Format specifiers:
 * - %L: Literal (quotes and escapes strings)
 * - %I: Identifier (quotes identifiers like table/column names)
 * - %s: String (simple string substitution, use with caution)
 *
 * @param {string} query - SQL query with format specifiers
 * @param {...any} values - Values to format into the query
 * @returns {string} Formatted SQL query
 *
 * @example
 * const { formatQuery } = require("./utils/sql-formatter.cjs");
 *
 * // Safe string literal
 * const query = formatQuery('SELECT * FROM users WHERE id = %L', userId);
 *
 * // Safe identifier (table/column name)
 * const query2 = formatQuery('SELECT * FROM %I WHERE email = %L', 'users', email);
 *
 * // Multiple values
 * const query3 = formatQuery(
 *   'SELECT * FROM users WHERE id = %L AND status = %L',
 *   userId,
 *   'active'
 * );
 */
function formatQuery(query, ...values) {
  return format(query, ...values);
}

/**
 * Create a SQL query using template strings
 *
 * Automatically escapes values and provides a clean template literal syntax.
 * The result has a `.text` property (SQL string) and `.values` property (parameter array).
 *
 * @param {TemplateStringsArray} strings - Template string parts
 * @param {...any} values - Values to interpolate
 * @returns {object} { text: string, values: array }
 *
 * @example
 * const { sqlTemplate } = require("./utils/sql-formatter.cjs");
 *
 * const userId = '123e4567-e89b-12d3-a456-426614174000';
 * const query = sqlTemplate`SELECT * FROM users WHERE id = ${userId}`;
 *
 * // Use with pg Pool
 * const result = await pool.query(query.text, query.values);
 *
 * // Or use directly (sql-template-strings returns a query object)
 * const result = await pool.query(query);
 *
 * @example
 * // Multiple values
 * const query = sqlTemplate`
 *   SELECT * FROM users
 *   WHERE email = ${email}
 *   AND status = ${status}
 * `;
 */
function sqlTemplate(strings, ...values) {
  return sql(strings, ...values);
}

/**
 * Build a WHERE clause condition safely
 *
 * @param {string} column - Column name (will be quoted as identifier)
 * @param {string} operator - SQL operator (=, >=, <=, >, <, LIKE, ILIKE, etc.)
 * @param {any} value - Value to compare (will be escaped as literal)
 * @returns {string} Safe WHERE clause condition
 *
 * @example
 * const { buildCondition } = require("./utils/sql-formatter.cjs");
 *
 * const condition = buildCondition('source_quality_score', '>=', 0.5);
 * // Returns: "source_quality_score" >= 0.5
 */
function buildCondition(column, operator, value) {
  return format("%I %s %L", column, operator, value);
}

/**
 * Build a safe numeric comparison condition
 * Useful for numeric filters where you want to ensure proper formatting
 *
 * @param {string} column - Column name
 * @param {string} operator - Comparison operator (>=, <=, >, <, =)
 * @param {number} value - Numeric value
 * @returns {string} Safe WHERE clause condition
 *
 * @example
 * const { buildNumericCondition } = require("./utils/sql-formatter.cjs");
 *
 * const condition = buildNumericCondition('score', '>=', 0.75);
 * // Returns: "score" >= 0.75
 */
function buildNumericCondition(column, operator, value) {
  // Validate that value is a number
  if (typeof value !== "number" || isNaN(value)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  return format("%I %s %s", column, operator, value);
}

/**
 * Build a safe IN clause
 *
 * @param {string} column - Column name
 * @param {array} values - Array of values to match
 * @returns {string} Safe IN clause
 *
 * @example
 * const { buildInClause } = require("./utils/sql-formatter.cjs");
 *
 * const condition = buildInClause('status', ['active', 'pending']);
 * // Returns: "status" IN ('active', 'pending')
 */
function buildInClause(column, values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Values must be a non-empty array");
  }
  return format("%I IN (%L)", column, values);
}

/**
 * Build a safe IS NULL or IS NOT NULL condition
 *
 * @param {string} column - Column name
 * @param {boolean} isNull - If true, use IS NULL; if false, use IS NOT NULL
 * @returns {string} Safe NULL check condition
 *
 * @example
 * const { buildNullCondition } = require("./utils/sql-formatter.cjs");
 *
 * const condition = buildNullCondition('deleted_at', true);
 * // Returns: "deleted_at" IS NULL
 */
function buildNullCondition(column, isNull = true) {
  return format("%I IS %s", column, isNull ? "NULL" : "NOT NULL");
}

module.exports = {
  formatQuery,
  sqlTemplate,
  buildCondition,
  buildNumericCondition,
  buildInClause,
  buildNullCondition,
};

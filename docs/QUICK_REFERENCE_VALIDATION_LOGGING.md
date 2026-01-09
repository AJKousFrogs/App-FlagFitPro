# Quick Reference: Validation, Indexes & Logging

**Version:** 1.0.0  
**Last Updated:** January 9, 2026

---

## Input Validation

### Client-Side (TypeScript)

```typescript
import { 
  isEmail, 
  isStrongPassword, 
  getPasswordStrength,
  sanitizeString,
  isUUID,
  isValidPlayerName
} from '@shared/utils/validation.utils';

// Email validation
if (!isEmail(email)) {
  showError('Invalid email');
}

// Password validation with strength check
const strength = getPasswordStrength(password);
if (!isStrongPassword(password)) {
  showError('Password must be 8+ chars with uppercase, lowercase, number, and special char');
}

// XSS prevention
const safeName = sanitizeString(userInput);

// UUID validation
if (!isUUID(playerId)) {
  showError('Invalid player ID');
}

// Name validation
if (!isValidPlayerName(name)) {
  showError('Name must be 2-100 characters, letters only');
}
```

### Validation Service

```typescript
constructor(private validationService: ValidationService) {}

// Training load validation
const result = this.validationService.validateTrainingLoad({
  duration: 90,
  intensity: 8,
  rpe: 7
});

if (!result.valid) {
  this.showErrors(result.errors);
}

if (result.warnings.length > 0) {
  this.showWarnings(result.warnings);
}

// Athlete profile validation
const profileResult = this.validationService.validateAthleteProfile({
  name: 'John Doe',
  email: 'john@example.com',
  dateOfBirth: '2000-01-01',
  jerseyNumber: 10
});

// File upload validation
const fileResult = this.validationService.validateFileUpload(file, {
  maxSizeMB: 10,
  allowedTypes: ['image/jpeg', 'image/png'],
  allowedExtensions: ['.jpg', '.jpeg', '.png']
});
```

### Server-Side (JavaScript)

```javascript
import {
  validateUserId,
  validateWeeks,
  validatePeriod,
  validatePagination,
  validateRPE,
  validateDuration,
  sanitizeText,
  sanitizeFields
} from './utils/validation.js';

// User ID validation
const userIdValidation = validateUserId(req.params.userId);
if (!userIdValidation.isValid) {
  return res.status(400).json({ error: userIdValidation.error });
}

// Sanitize text inputs
const sanitizedNotes = sanitizeText(req.body.notes);

// Sanitize multiple fields
const sanitized = sanitizeFields(req.body, ['notes', 'description', 'feedback']);

// Pagination
const pagination = validatePagination(req.query.page, req.query.limit, 100);
if (!pagination.isValid) {
  return res.status(400).json({ error: pagination.error });
}
```

---

## Structured Logging

### Client-Side (Angular)

```typescript
constructor(private logger: LoggerService) {
  // Set global context for user session
  this.logger.setGlobalContext({
    userId: this.authService.currentUserId,
    sessionId: this.sessionId
  });
}

// Info logging with context
this.logger.info('Training session saved', {
  component: 'TrainingComponent',
  action: 'saveSession'
}, {
  sessionId: session.id,
  duration: session.duration
});

// Warning logging
this.logger.warn('Low readiness score detected', {
  component: 'DashboardComponent'
}, {
  score: readinessScore,
  threshold: 6
});

// Error logging with full context
try {
  await this.saveSession(session);
} catch (error) {
  this.logger.error(
    'Failed to save training session',
    error,
    { component: 'TrainingComponent', action: 'saveSession' },
    { sessionId: session.id }
  );
}

// Performance logging
const start = Date.now();
await this.loadDashboardData();
this.logger.performance(
  'Dashboard Load',
  Date.now() - start,
  { component: 'DashboardComponent' }
);

// Debug logging (dev only)
this.logger.debug('Processing data', {
  component: 'DataProcessor'
}, {
  itemCount: items.length
});

// Get recent logs for debugging
const recentLogs = this.logger.getRecentLogs(20);
console.table(recentLogs);
```

### Server-Side (Node.js)

```javascript
import { serverLogger } from './utils/server-logger.js';

// Set global context
serverLogger.setGlobalContext({
  service: 'training-api',
  version: '1.0.0'
});

// Info logging
serverLogger.info('Training session created', {
  userId: req.user.id,
  endpoint: '/training/sessions'
}, {
  sessionId: session.id,
  duration: session.duration
});

// Request logging helper
serverLogger.request(req, 'Processing training request', {
  sessionId: session.id
});

// Warning logging
serverLogger.warn('High training load detected', {
  userId: req.user.id
}, {
  load: trainingLoad,
  threshold: 1000
});

// Error logging
try {
  await saveSession(data);
} catch (error) {
  serverLogger.error(
    'Failed to save session',
    error,
    { userId: req.user.id, endpoint: req.path },
    { sessionData: data }
  );
}

// Performance logging
const start = Date.now();
await processData();
serverLogger.performance(
  'Data Processing',
  Date.now() - start,
  { userId: req.user.id }
);

// Debug logging (dev only)
serverLogger.debug('Query executed', {
  query: 'SELECT * FROM sessions'
}, {
  rowCount: results.length
});
```

---

## Database Indexes

### Check Index Usage

```sql
-- List all indexes on a table
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'training_sessions';

-- Check index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename = 'training_sessions'
ORDER BY idx_scan DESC;
```

### Find Missing Indexes

```sql
-- Find tables with high sequential scans
SELECT 
  schemaname,
  tablename,
  seq_scan as sequential_scans,
  idx_scan as index_scans,
  ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2) as seq_scan_percentage
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND seq_scan > idx_scan
ORDER BY seq_scan DESC
LIMIT 10;
```

### Verify New Indexes

```sql
-- Run the validation script
\i database/validate_indexes.sql

-- Or check specific indexes
SELECT 
  indexname,
  indexdef,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_indexes
LEFT JOIN pg_stat_user_indexes USING (schemaname, tablename, indexname)
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_wellness_checkin%'
ORDER BY indexname;
```

### Apply Migrations

```bash
# Apply new index migration (Supabase)
supabase migration up

# Or apply manually
psql -h your-db-host -U postgres -d your-database \
  -f database/migrations/111_comprehensive_index_optimization.sql

# Verify indexes were created
psql -h your-db-host -U postgres -d your-database \
  -f database/validate_indexes.sql
```

---

## Common Patterns

### Form Validation Pattern

```typescript
// Component
constructor(
  private fb: FormBuilder,
  private validationService: ValidationService,
  private logger: LoggerService
) {}

createForm() {
  this.form = this.fb.group({
    email: ['', [Validators.required, this.emailValidator]],
    password: ['', [Validators.required, this.passwordValidator]],
    duration: ['', [Validators.required, this.durationValidator]]
  });
}

// Custom validators
emailValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  return isEmail(control.value) ? null : { invalidEmail: true };
};

passwordValidator = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;
  const strength = getPasswordStrength(control.value);
  return strength >= 3 ? null : { weakPassword: { strength } };
};

// Submit with logging
async onSubmit() {
  if (!this.form.valid) {
    this.logger.warn('Form validation failed', {
      component: 'MyForm',
      action: 'submit'
    }, {
      errors: this.form.errors
    });
    return;
  }

  try {
    const sanitizedData = {
      email: this.form.value.email,
      password: this.form.value.password,
      notes: sanitizeString(this.form.value.notes)
    };

    await this.save(sanitizedData);
    
    this.logger.success('Form submitted successfully', {
      component: 'MyForm',
      action: 'submit'
    });
  } catch (error) {
    this.logger.error(
      'Form submission failed',
      error,
      { component: 'MyForm', action: 'submit' }
    );
  }
}
```

### API Endpoint Pattern

```javascript
// routes/my-route.js
import { serverLogger } from './utils/server-logger.js';
import { validateUserId, sanitizeText, sendError, sendSuccess } from './utils/validation.js';

export default async function handler(req, res) {
  const startTime = Date.now();

  try {
    // Validate input
    const userIdValidation = validateUserId(req.params.userId);
    if (!userIdValidation.isValid) {
      serverLogger.warn('Invalid user ID', {
        endpoint: req.path,
        userId: req.params.userId
      }, {
        error: userIdValidation.error
      });
      return sendError(res, userIdValidation.error, 'VALIDATION_ERROR', 400);
    }

    // Sanitize input
    const sanitizedData = {
      notes: sanitizeText(req.body.notes),
      description: sanitizeText(req.body.description)
    };

    // Process request
    const result = await processData(sanitizedData);

    // Log success
    serverLogger.request(req, 'Request processed successfully', {
      resultId: result.id
    });

    // Log performance
    serverLogger.performance(
      'API Request',
      Date.now() - startTime,
      { endpoint: req.path, userId: userIdValidation.userId }
    );

    return sendSuccess(res, result);

  } catch (error) {
    serverLogger.error(
      'Request failed',
      error,
      { endpoint: req.path, userId: req.params.userId }
    );
    return sendError(res, 'Internal server error', 'SERVER_ERROR', 500);
  }
}
```

---

## Performance Tips

### Validation

- ✅ Validate on both client and server
- ✅ Use built-in validators before custom ones
- ✅ Cache validation results when possible
- ✅ Provide real-time feedback for better UX

### Indexes

- ✅ Use partial indexes for common filters (WHERE clauses)
- ✅ Include covering indexes for frequently accessed columns
- ✅ Monitor index usage monthly and drop unused ones
- ✅ Run ANALYZE after creating indexes

### Logging

- ✅ Use appropriate log levels (debug < info < warn < error)
- ✅ Set global context once per session
- ✅ Log performance for operations >1000ms
- ✅ Review recent logs during debugging

---

## Troubleshooting

### Validation Not Working

```typescript
// Check if validators are applied
console.log(this.form.get('email')?.validator);

// Check validation errors
console.log(this.form.get('email')?.errors);

// Manual validation
const result = isEmail(emailValue);
console.log('Email valid?', result);
```

### Index Not Being Used

```sql
-- Check query plan
EXPLAIN ANALYZE
SELECT * FROM training_sessions 
WHERE user_id = 'xxx' 
  AND status = 'completed'
ORDER BY session_date DESC;

-- Look for "Index Scan using idx_name"
-- If you see "Seq Scan", the index isn't being used

-- Update table statistics
ANALYZE training_sessions;
```

### Logs Not Appearing

```typescript
// Check log level
console.log(logger.getLogLevel());

// Try setting to debug
logger.setLevel('debug');

// Check if logs are in buffer
const logs = logger.getRecentLogs(10);
console.table(logs);
```

---

## See Also

- Full documentation: `docs/VALIDATION_INDEXES_LOGGING_IMPROVEMENTS.md`
- Style guide: `docs/STYLE_GUIDE.md`
- Testing guide: `docs/TESTING_GUIDE.md`
- Security audit: `SECURITY_AUDIT_REPORT.md`

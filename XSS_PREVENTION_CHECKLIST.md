# XSS Prevention Code Review Checklist

**Purpose**: Ensure all code changes follow XSS prevention best practices before merging.

**Last Updated**: 2025-01-22  
**Status**: Active

---

## 🔒 CRITICAL CHECKS (Must Pass)

### 1. DOM Manipulation
- [ ] **No `innerHTML` usage** - Use `setSafeContent()` or DOM methods instead
  - ✅ **Allowed**: `setSafeContent(element, content, isHTML, allowRichText)` from `utils/shared.js`
  - ✅ **Allowed**: `textContent`, `createElement()`, `appendChild()`, `replaceChildren()`
  - ✅ **Exception**: Safe helper functions using temp container pattern with sanitization
  - ❌ **Forbidden**: Direct `element.innerHTML = userInput` or unsanitized content

### 2. Event Handlers
- [ ] **No `onclick` attributes** - Use `addEventListener()` instead
  - ✅ **Correct**: `button.addEventListener('click', handler)`
  - ❌ **Wrong**: `<button onclick="handler()">`

### 3. URL Handling
- [ ] **All URLs sanitized** - Use `sanitizeUrl()` from `utils/sanitize.js`
  - ✅ **Required**: When creating `<a href>` tags from user input
  - ✅ **Required**: When using URLs in `window.location` or `fetch()`

### 4. User Input Sanitization
- [ ] **All user input escaped** - Use `escapeHtml()` or `sanitizeRichText()`
  - ✅ **Plain text**: `element.textContent = userInput`
  - ✅ **Rich text**: `setSafeContent(element, userInput, true, true)`
  - ✅ **HTML attributes**: `sanitizeAttribute()` from `utils/sanitize.js`

---

## ⚠️ WARNING SIGNS (Review Carefully)

### Red Flags:
- [ ] `innerHTML` assignment with variables (especially user input)
- [ ] `eval()` or `new Function()` usage
- [ ] `onclick`, `onerror`, `onload` attributes in HTML strings
- [ ] Unsanitized URLs in `href` or `src` attributes
- [ ] Template literals with user data inserted directly into HTML
- [ ] `document.write()` or `document.writeln()`

### Yellow Flags (May be acceptable):
- [ ] `innerHTML` in helper functions (verify sanitization)
- [ ] Dynamic `style` attribute values (verify no `javascript:` URLs)
- [ ] `setAttribute()` with user data (verify sanitization)

---

## ✅ SAFE PATTERNS (Pre-approved)

### Pattern 1: Plain Text Content
```javascript
// ✅ SAFE
element.textContent = userInput;
element.textContent = `Hello ${userName}`; // userName is trusted
```

### Pattern 2: Rich HTML Content
```javascript
// ✅ SAFE
import { setSafeContent } from '../utils/shared.js';
setSafeContent(element, htmlContent, true, true);
```

### Pattern 3: DOM Element Creation
```javascript
// ✅ SAFE
const button = document.createElement('button');
button.textContent = 'Click me';
button.addEventListener('click', handler);
element.appendChild(button);
```

### Pattern 4: URL Sanitization
```javascript
// ✅ SAFE
import { sanitizeUrl } from '../utils/sanitize.js';
const safeUrl = sanitizeUrl(userProvidedUrl);
const link = document.createElement('a');
link.href = safeUrl;
```

### Pattern 5: Safe Temp Container (Helper Functions Only)
```javascript
// ✅ SAFE (only in helper functions with sanitization)
const temp = document.createElement('div');
temp.textContent = content; // Escape first
let sanitized = temp.innerHTML;
// Apply allowlist for safe tags if needed
element.innerHTML = sanitized; // Now safe
```

---

## 🚫 FORBIDDEN PATTERNS (Never Use)

### Pattern 1: Direct innerHTML with User Input
```javascript
// ❌ FORBIDDEN
element.innerHTML = userInput;
element.innerHTML = `<div>${userInput}</div>`;
element.innerHTML = userInput + '<script>alert("XSS")</script>';
```

### Pattern 2: onclick Attributes
```javascript
// ❌ FORBIDDEN
button.innerHTML = `<button onclick="doSomething()">Click</button>`;
element.innerHTML = `<div onclick="${handler}">Content</div>`;
```

### Pattern 3: Unsanitized URLs
```javascript
// ❌ FORBIDDEN
link.href = userProvidedUrl;
img.src = userProvidedUrl;
window.location = userProvidedUrl;
```

### Pattern 4: eval() or Function Constructor
```javascript
// ❌ FORBIDDEN
eval(userCode);
new Function(userCode)();
setTimeout(userCode, 100);
```

---

## 📋 REVIEW PROCESS

### Step 1: Automated Checks
1. Run `npm run lint` - Must pass with 0 errors
2. Check ESLint output for `innerHTML` violations
3. Verify no `onclick` attributes in code

### Step 2: Manual Review
1. Search for `innerHTML` in changed files
2. Search for `onclick=` in changed files
3. Verify all user input is sanitized
4. Check URL handling for `sanitizeUrl()` usage

### Step 3: Testing
1. Test with malicious input (XSS payloads)
2. Verify no script execution
3. Check browser console for errors
4. Test in multiple browsers

---

## 🧪 XSS TEST PAYLOADS

Use these to test XSS prevention:

```javascript
// Basic XSS
<script>alert('XSS')</script>

// Event handler XSS
<img src=x onerror="alert('XSS')">

// JavaScript URL XSS
javascript:alert('XSS')

// SVG XSS
<svg onload="alert('XSS')">

// Data URL XSS
data:text/html,<script>alert('XSS')</script>
```

**Expected Result**: All payloads should be escaped/sanitized and NOT execute.

---

## 📚 REFERENCE DOCUMENTATION

- **Safe DOM Utils**: `src/js/utils/shared.js` - `setSafeContent()` function
- **Sanitization Utils**: `src/js/utils/sanitize.js` - `escapeHtml()`, `sanitizeUrl()`, `sanitizeRichText()`
- **ESLint Config**: `eslint.config.js` - Rules for XSS prevention
- **Best Practices**: `CLAUDE.md` - Project coding standards

---

## 🔍 QUICK CHECK COMMANDS

```bash
# Find all innerHTML usage
grep -r "\.innerHTML\s*=" src/js/ --exclude-dir=node_modules

# Find all onclick attributes
grep -r "onclick=" src/js/ --exclude-dir=node_modules

# Run linting
npm run lint

# Run tests
npm test
```

---

## ✅ APPROVAL CRITERIA

**Code can be merged if:**
- [x] All automated checks pass (lint, tests)
- [x] No `innerHTML` usage (except safe helpers)
- [x] No `onclick` attributes
- [x] All user input sanitized
- [x] All URLs sanitized
- [x] Manual review completed
- [x] XSS payloads tested

**Code must be rejected if:**
- ❌ Direct `innerHTML` with user input
- ❌ `onclick` attributes in HTML strings
- ❌ Unsanitized URLs
- ❌ `eval()` or `new Function()` usage
- ❌ ESLint errors for XSS prevention rules

---

## 📝 NOTES

- **Helper Functions**: The 3 remaining `innerHTML` instances in helper functions are acceptable because they use the temp container pattern with sanitization.
- **Legacy Code**: Files in `Wireframes clean/` directory still have `innerHTML` - these are lower priority and will be refactored separately.
- **Angular Files**: Angular templates use property binding which is safe - this checklist applies to vanilla JS files.

---

**Questions?** Contact the security team or refer to `CLAUDE.md` for coding standards.


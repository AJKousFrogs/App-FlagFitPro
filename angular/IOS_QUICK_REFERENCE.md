# iOS Safari Debugging - Quick Reference Card

## 🚀 Quick Start (3 Steps)

1. **Open Simulator**
   ```bash
   open -a Simulator
   ```

2. **Navigate to App**
   ```
   Safari (Simulator) → http://localhost:4200
   ```

3. **Connect Web Inspector**
   ```
   Safari (Mac) → Develop → Simulator → localhost:4200
   ```

---

## 📋 Essential Console Commands

```javascript
// === Check Platform ===
document.body.classList.contains('platform-ios')
document.body.classList.contains('browser-safari')

// === Find Flex Overflow ===
document.querySelectorAll('.flex-wrap').forEach((el, i) => {
  console.log(`${i}:`, el.scrollWidth > el.offsetWidth ? '⚠️ OVERFLOW' : '✅ OK');
});

// === Add Debug Outline ===
document.querySelectorAll('.flex-wrap').forEach(el => {
  el.classList.add('debug-ios-flex');
});

// === Check Gap Support ===
CSS.supports('gap', '1rem')
```

---

## 🎨 Usage Patterns

### Pattern 1: Host Directive (Recommended)
```typescript
@Component({
  hostDirectives: [PlatformHostDirective]
})
```

### Pattern 2: Conditional Class
```typescript
getClass() {
  return this.platformService.isIOS() ? 'gap-ios-2' : 'gap-2';
}
```

### Pattern 3: Platform CSS
```scss
:host(.platform-ios) {
  .gap-2 { gap: 0; margin: -0.5rem; > * { margin: 0.5rem; } }
}
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Flex overflow | Use `.gap-ios-2` class |
| Input zoom | Font-size: 16px minimum |
| Viewport height | Use `-webkit-fill-available` |
| Safe area | Use `env(safe-area-inset-*)` |
| Gap not working | Use margin-based spacing |

---

## 📱 Testing Devices

| Device | Viewport | Status |
|--------|----------|--------|
| iPhone SE | 375x667 | ✅ Test |
| iPhone 15 | 393x852 | ✅ Test |
| iPhone 15 Pro Max | 430x932 | ✅ Test |
| iPad Pro | 1024x1366 | ✅ Test |

---

## 🔍 Debug Classes

| Class | Effect |
|-------|--------|
| `.platform-ios` | iOS-specific styles |
| `.browser-safari` | Safari-specific styles |
| `.gap-ios-2` | iOS-safe gap spacing |
| `.debug-ios-flex` | Visual debug outline |

---

## ⚡ Quick Fixes

```scss
// Fix 1: Flex gap overflow
.platform-ios .flex-wrap.gap-2 {
  gap: 0 !important;
  margin: -0.5rem;
  > * { margin: 0.5rem; }
}

// Fix 2: Input zoom
.platform-ios input {
  font-size: max(16px, 1rem);
}

// Fix 3: Viewport height
.platform-ios .full-height {
  height: -webkit-fill-available;
}

// Fix 4: Safe area
.platform-ios {
  padding-top: env(safe-area-inset-top);
}
```

---

## 📚 Files Created

- `platform-detection.service.ts` - Auto-detect platform
- `platform-host.directive.ts` - Host class binding
- `_ios-safari-fixes.scss` - iOS CSS fixes
- `IOS_DEBUGGING_GUIDE.md` - Full guide
- `IOS_MOBILE_DEBUGGING_SUMMARY.md` - Complete summary

---

## ✅ Verification

```javascript
// Should return true on iOS
document.body.classList.contains('platform-ios')

// Should see these logs
// 🔍 [PlatformDetection] Platform detected
// 📱 [PlatformDetection] iOS detected
```

---

**Quick Help:** Open `IOS_DEBUGGING_GUIDE.md` for detailed instructions

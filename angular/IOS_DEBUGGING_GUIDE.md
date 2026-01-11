# iOS Safari Web Inspector Debugging Guide

## 🎯 Objective

Debug mobile-specific issues on iOS Safari, particularly:

- Flex overflow issues with `gap-2` and `flex-wrap`
- Platform-specific styling
- Touch interactions
- Layout problems on iPhone/iPad

---

## 🛠️ Setup

### 1. Install Platform Detection Service

Already created:

- **`platform-detection.service.ts`** - Detects iOS, Android, Safari, Chrome
- **`platform-host.directive.ts`** - Adds platform classes to components
- **`_ios-safari-fixes.scss`** - iOS-specific CSS fixes

### 2. Import iOS Fixes in `styles.scss`

```scss
// Add to your main styles.scss
@import "ios-safari-fixes";
```

### 3. Initialize Platform Detection

The service auto-initializes. To use in components:

```typescript
import { PlatformDetectionService } from "./core/services/platform-detection.service";

export class MyComponent {
  private platformService = inject(PlatformDetectionService);

  ngOnInit() {
    if (this.platformService.isIOS()) {
      console.log("Running on iOS");
    }
  }
}
```

---

## 📱 iOS Simulator Setup

### Option 1: Xcode Simulator (Mac Only)

1. **Open Xcode**

   ```bash
   open -a Xcode
   ```

2. **Open Simulator**
   - Go to `Xcode` → `Open Developer Tool` → `Simulator`
   - Or press `Cmd+Shift+2`

3. **Choose Device**
   - `File` → `Open Simulator` → Select iPhone/iPad model
   - Recommended: iPhone 15 Pro, iPhone 15 Pro Max, iPad Pro

4. **Open Safari**
   - Launch Safari app in simulator
   - Navigate to: `http://localhost:4200`

### Option 2: Physical iOS Device

1. **Enable Web Inspector on Device**
   - Settings → Safari → Advanced → Enable "Web Inspector"

2. **Connect to Mac**
   - Connect iPhone/iPad via USB
   - Trust the computer when prompted

3. **Enable Developer Menu on Mac Safari**
   - Safari → Settings → Advanced → Check "Show Develop menu"

---

## 🔍 Safari Web Inspector Usage

### 1. Connect to Simulator/Device

**On Mac Safari:**

1. Open Safari (desktop)
2. Go to `Develop` menu
3. Look for your simulator/device name
4. Click on `localhost:4200` (or your app URL)

**Web Inspector opens with:**

- Elements tab (inspect DOM)
- Console tab (view logs)
- Network tab (API calls)
- Timeline tab (performance)
- Storage tab (localStorage, cookies)

### 2. Inspect Elements

```javascript
// In Web Inspector Console:

// Check if platform classes are applied
document.body.classList;

// Should see:
// ['platform-ios', 'platform-mobile', 'browser-safari']

// Find elements with flex-wrap
document.querySelectorAll(".flex-wrap");

// Check computed styles
getComputedStyle(document.querySelector(".flex-wrap"));
```

### 3. Debug Flex Overflow

**Find problematic flex containers:**

```javascript
// In Web Inspector Console:

// Find all flex-wrap containers
const flexWraps = document.querySelectorAll(".flex-wrap");
console.log(`Found ${flexWraps.length} flex-wrap containers`);

// Check each for overflow
flexWraps.forEach((el, i) => {
  const styles = getComputedStyle(el);
  console.log(`Container ${i}:`, {
    gap: styles.gap,
    display: styles.display,
    flexWrap: styles.flexWrap,
    width: el.offsetWidth,
    scrollWidth: el.scrollWidth,
    isOverflowing: el.scrollWidth > el.offsetWidth,
  });
});

// Find elements with gap-2
const gap2Elements = document.querySelectorAll(".gap-2");
console.log(`Found ${gap2Elements.length} .gap-2 elements`);

// Add debug class to visualize
gap2Elements.forEach((el) => el.classList.add("debug-ios-flex"));
```

### 4. Check Platform Detection

```javascript
// In Web Inspector Console:

// Check platform info (from window after service runs)
console.log("Is iOS:", document.body.classList.contains("platform-ios"));
console.log("Is Safari:", document.body.classList.contains("browser-safari"));
console.log("Is Mobile:", document.body.classList.contains("platform-mobile"));

// Check user agent
console.log("User Agent:", navigator.userAgent);
console.log("Platform:", navigator.platform);
console.log("Touch points:", navigator.maxTouchPoints);
```

---

## 🎨 Platform-Specific Styling

### Method 1: Use Platform Classes

```scss
// Automatic on iOS
.my-component {
  display: flex;
  gap: 0.5rem;

  // iOS-specific fix
  .platform-ios & {
    gap: 0; // Disable gap on iOS
    margin: -0.5rem;

    > * {
      margin: 0.5rem; // Use margins instead
    }
  }
}
```

### Method 2: Use Host Binding

```typescript
import { Component, inject } from "@angular/core";
import { PlatformDetectionService } from "./core/services/platform-detection.service";

@Component({
  selector: "app-my-component",
  template: `...`,
  host: {
    "[class.platform-ios]": "platformService.isIOS()",
    "[class.platform-android]": "platformService.isAndroid()",
    "[class.browser-safari]": "platformService.isSafari()",
  },
})
export class MyComponent {
  platformService = inject(PlatformDetectionService);
}
```

### Method 3: Use Platform Host Directive

```typescript
import { PlatformHostDirective } from "./shared/directives/platform-host.directive";

@Component({
  selector: "app-my-component",
  standalone: true,
  hostDirectives: [PlatformHostDirective],
  template: `...`,
})
export class MyComponent {
  // Platform classes automatically added to host element
}
```

---

## 🐛 Common iOS Issues & Fixes

### Issue 1: Flex Gap Not Working with Flex-Wrap

**Problem:**

```html
<div class="flex flex-wrap gap-2">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

iOS Safari doesn't properly handle `gap` with `flex-wrap`.

**Solution 1 - Use iOS utility class:**

```html
<div class="flex flex-wrap gap-ios-2">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

**Solution 2 - Platform-specific CSS:**

```scss
.my-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  .platform-ios & {
    gap: 0;
    margin: -0.5rem;

    > * {
      margin: 0.5rem;
    }
  }
}
```

### Issue 2: Horizontal Overflow

**Problem:**
Flex container scrolls horizontally on iOS but not on desktop.

**Debug:**

```javascript
// In Web Inspector:
const container = document.querySelector(".flex-wrap");
console.log({
  width: container.offsetWidth,
  scrollWidth: container.scrollWidth,
  isOverflowing: container.scrollWidth > container.offsetWidth,
});
```

**Fix:**

```scss
.platform-ios {
  .flex-overflow-fix {
    -webkit-overflow-scrolling: touch;
    overflow-x: auto;

    > * {
      flex-shrink: 0;
    }
  }
}
```

### Issue 3: Input Zoom on Focus

**Problem:**
iOS Safari zooms in when focusing inputs with font-size < 16px.

**Fix:**

```scss
.platform-ios {
  input[type="text"],
  input[type="email"],
  input[type="password"] {
    font-size: max(16px, 1rem); // Prevent zoom
  }
}
```

### Issue 4: Viewport Height Issues

**Problem:**
`100vh` includes Safari's bottom toolbar on iOS.

**Fix:**

```scss
.platform-ios.browser-safari {
  .full-height {
    height: 100vh;
    height: -webkit-fill-available; // iOS-specific
  }
}
```

### Issue 5: Safe Area Insets (Notch)

**Problem:**
Content hidden behind iPhone notch or home indicator.

**Fix:**

```scss
.platform-ios.browser-safari {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

---

## 🧪 Testing Checklist

### Flex & Gap Issues

- [ ] Test all `.flex-wrap` containers
- [ ] Check `.gap-2`, `.gap-3`, `.gap-4` classes
- [ ] Verify no horizontal overflow
- [ ] Test on different screen sizes:
  - [ ] iPhone SE (375px)
  - [ ] iPhone 15 (393px)
  - [ ] iPhone 15 Pro Max (430px)
  - [ ] iPad (768px)

### Platform Detection

- [ ] Verify `.platform-ios` class on body
- [ ] Verify `.browser-safari` class on body
- [ ] Check console for detection logs
- [ ] Test on actual device (not just simulator)

### Touch Interactions

- [ ] Test button taps (no double-tap delay)
- [ ] Test scrolling (smooth momentum)
- [ ] Test sticky headers
- [ ] Test overflow containers

### Visual Issues

- [ ] Check safe area insets (notch/home indicator)
- [ ] Verify viewport height (no toolbar issues)
- [ ] Test input focus (no zoom)
- [ ] Check fixed/sticky positioning

---

## 📊 Debug Utilities

### 1. Add Debug Outline

```html
<div class="flex flex-wrap gap-2 debug-ios-flex">
  <!-- Items will have colored outlines on iOS -->
</div>
```

### 2. Platform Indicator

On mobile, you'll see a badge in top-right corner:

- Blue "iOS Safari" badge on iOS
- Green "Android Chrome" badge on Android

### 3. Console Logging

```javascript
// Enable detailed logging
localStorage.setItem("debug-platform", "true");

// Check flex containers
document.querySelectorAll(".flex-wrap").forEach((el, i) => {
  console.log(`Flex container ${i}:`, {
    classes: Array.from(el.classList),
    gap: getComputedStyle(el).gap,
    isOverflowing: el.scrollWidth > el.offsetWidth,
  });
});
```

---

## 🔧 Web Inspector Commands

### Check Gap Support

```javascript
// Test if browser supports gap on flexbox
CSS.supports("gap", "1rem");
// true on modern browsers, false on older Safari
```

### Find Elements with Gap

```javascript
// Find all elements using gap
const gapElements = Array.from(document.querySelectorAll("*")).filter((el) => {
  const gap = getComputedStyle(el).gap;
  return gap !== "normal" && gap !== "0px";
});

console.log(`Found ${gapElements.length} elements with gap:`, gapElements);
```

### Check Flex Overflow

```javascript
// Find overflowing flex containers
const overflowing = Array.from(document.querySelectorAll(".flex-wrap")).filter(
  (el) => {
    return el.scrollWidth > el.offsetWidth || el.scrollHeight > el.offsetHeight;
  },
);

console.log(`Found ${overflowing.length} overflowing containers:`, overflowing);
```

### Monitor Touch Events

```javascript
// Log all touch events
document.addEventListener(
  "touchstart",
  (e) => {
    console.log("Touch start:", e.touches.length, "touches");
  },
  { passive: true },
);

document.addEventListener(
  "touchmove",
  (e) => {
    console.log("Touch move:", e.touches[0].clientX, e.touches[0].clientY);
  },
  { passive: true },
);
```

---

## 📱 Testing on Real Device

### 1. Connect iPhone/iPad

```bash
# Check connected devices
system_profiler SPUSBDataType | grep iPhone

# Or use Xcode
Xcode → Window → Devices and Simulators
```

### 2. Access from Mac Safari

1. Safari (Mac) → Develop → [Your Device Name] → localhost:4200
2. Web Inspector opens
3. All console.log() from device appears in Mac console

### 3. Remote Debugging Tips

- Keep USB cable connected
- Don't let device sleep (Settings → Display → Auto-Lock → Never)
- Use `console.log()` liberally
- Use `debugger;` statements to pause execution

---

## 🎯 Quick Debug Commands

Copy-paste these into Safari Web Inspector Console:

```javascript
// === PLATFORM DETECTION ===
console.log("iOS:", document.body.classList.contains("platform-ios"));
console.log("Safari:", document.body.classList.contains("browser-safari"));
console.log("Mobile:", document.body.classList.contains("platform-mobile"));

// === FLEX CONTAINERS ===
document.querySelectorAll(".flex-wrap").forEach((el, i) => {
  const s = getComputedStyle(el);
  console.log(`Flex ${i}:`, {
    gap: s.gap,
    overflow: el.scrollWidth > el.offsetWidth,
    width: `${el.offsetWidth}/${el.scrollWidth}px`,
  });
});

// === GAP ELEMENTS ===
Array.from(document.querySelectorAll('[class*="gap-"]')).forEach((el) => {
  console.log("Gap element:", el.className, getComputedStyle(el).gap);
});

// === ADD DEBUG OUTLINE ===
document.querySelectorAll(".flex-wrap").forEach((el) => {
  el.classList.add("debug-ios-flex");
});

// === VIEWPORT INFO ===
console.log("Viewport:", {
  width: window.innerWidth,
  height: window.innerHeight,
  devicePixelRatio: window.devicePixelRatio,
  safeArea: {
    top: getComputedStyle(document.documentElement).getPropertyValue(
      "env(safe-area-inset-top)",
    ),
    bottom: getComputedStyle(document.documentElement).getPropertyValue(
      "env(safe-area-inset-bottom)",
    ),
  },
});
```

---

## 📚 Additional Resources

- [Safari Web Inspector Guide](https://webkit.org/web-inspector/)
- [iOS Safari CSS Support](https://caniuse.com/?compare=ios_saf+17.2,chrome+120&compareCats=CSS)
- [Flexbox Gap Browser Support](https://caniuse.com/flexbox-gap)
- [iOS Safe Area](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)

---

## 🆘 Troubleshooting

### Web Inspector Not Showing

1. Check "Web Inspector" is enabled on device (Settings → Safari → Advanced)
2. Trust computer on device
3. Restart Safari on Mac
4. Reconnect USB cable

### Platform Classes Not Applied

1. Check service is initialized:

   ```javascript
   console.log("Service initialized:", window.angularDebug);
   ```

2. Check body classes:
   ```javascript
   console.log("Body classes:", Array.from(document.body.classList));
   ```

### Flex Still Overflowing

1. Add `.debug-ios-flex` class
2. Check actual computed values:

   ```javascript
   const el = document.querySelector(".flex-wrap");
   console.log(getComputedStyle(el));
   ```

3. Try margin-based approach:
   ```scss
   .platform-ios .my-flex {
     gap: 0 !important;
     margin: -0.5rem;
     > * {
       margin: 0.5rem;
     }
   }
   ```

---

**Setup completed:** January 11, 2026  
**iOS version tested:** iOS 17.2+  
**Safari version tested:** Safari 17+  
**Xcode version:** 15.0+

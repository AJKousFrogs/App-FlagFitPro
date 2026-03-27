# Number Counter Animation Guide

## Overview

Number counter animations provide smooth counting effects for stats, dashboards, and metrics. Numbers animate from their current value to the new target value, creating engaging visual feedback.

**Implementation**: Week 3 Phase 3A (v3.1 Improvements)

**Components**:
- `AnimateNumberDirective` - Angular directive for animating numbers
- `number-format.utils.ts` - Formatting utilities (K/M/B, currency, %)
- Stat animation CSS classes - Visual effects for stat changes

---

## AnimateNumberDirective

### Basic Usage

```typescript
import { AnimateNumberDirective } from '@shared/directives/animate-number.directive';

@Component({
  imports: [AnimateNumberDirective],
  template: `
    <h2 [appAnimateNumber]="totalScore">0</h2>
  `
})
export class StatsComponent {
  totalScore = signal(1250);
}
```

**Result**: Number animates from 0 to 1250 over 800ms

---

### Directive Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `appAnimateNumber` | `number` | *required* | Target number to animate to |
| `animDuration` | `number` | `800` | Animation duration in ms |
| `animDecimals` | `number` | `0` | Number of decimal places |
| `animPrefix` | `string` | `""` | Text prefix (e.g., "$", "+") |
| `animSuffix` | `string` | `""` | Text suffix (e.g., "%", "pts", "K") |
| `animSeparator` | `string` | `","` | Thousands separator |
| `animEasing` | `"linear" \| "ease-out" \| "ease-in-out"` | `"ease-out"` | Easing function |
| `animAutoplay` | `boolean` | `true` | Start animation on mount |

---

## Examples

### 1. Simple Counter
```html
<h2 [appAnimateNumber]="totalPoints">0</h2>
```
**Output**: 0 → 1,250 (with thousands separator)

---

### 2. Currency with Prefix
```html
<span
  [appAnimateNumber]="revenue"
  [animPrefix]="'$'"
  [animDecimals]="2">
  $0.00
</span>
```
**Output**: $0.00 → $12,345.67

---

### 3. Percentage with Suffix
```html
<span
  [appAnimateNumber]="completion"
  [animSuffix]="'%'"
  [animDecimals]="1">
  0%
</span>
```
**Output**: 0% → 85.4%

---

### 4. Large Numbers with K/M Suffix
```html
<span
  [appAnimateNumber]="followers"
  [animSuffix]="'K'">
  0K
</span>
```
**Output**: 0K → 125K

---

### 5. Custom Duration and Easing
```html
<span
  [appAnimateNumber]="score"
  [animDuration]="1500"
  [animEasing]="'ease-in-out'">
  0
</span>
```
**Output**: Slower animation (1.5s) with ease-in-out timing

---

### 6. With Highlight Effect
```html
<span
  [appAnimateNumber]="newScore"
  class="stat-highlight">
  {{ newScore() }}
</span>
```
**Output**: Number counts up + green highlight flash

---

## Number Formatting Utilities

### formatLargeNumber()
```typescript
import { formatLargeNumber } from '@shared/utils/number-format.utils';

formatLargeNumber(1500);          // "1.5K"
formatLargeNumber(1234567);       // "1.2M"
formatLargeNumber(1234567890);    // "1.2B"
formatLargeNumber(999);           // "999"
formatLargeNumber(1500, 0);       // "2K"
```

### formatPercentage()
```typescript
import { formatPercentage } from '@shared/utils/number-format.utils';

formatPercentage(0.8542);      // "85.4%"
formatPercentage(0.8542, 0);   // "85%"
formatPercentage(0.8542, 2);   // "85.42%"
```

### formatCurrency()
```typescript
import { formatCurrency } from '@shared/utils/number-format.utils';

formatCurrency(1234.56);              // "$1,234.56"
formatCurrency(1234.56, "€");         // "€1,234.56"
formatCurrency(1234.56, "$", 0);      // "$1,235"
```

### formatWithSeparator()
```typescript
import { formatWithSeparator } from '@shared/utils/number-format.utils';

formatWithSeparator(1234567);         // "1,234,567"
formatWithSeparator(1234567.89, ",", 2); // "1,234,567.89"
formatWithSeparator(1234567, " ");    // "1 234 567"
```

### formatDuration()
```typescript
import { formatDuration } from '@shared/utils/number-format.utils';

formatDuration(65);      // "01:05"
formatDuration(3661);    // "61:01"
formatDuration(0);       // "00:00"
```

### formatWithSign()
```typescript
import { formatWithSign } from '@shared/utils/number-format.utils';

formatWithSign(15);       // "+15"
formatWithSign(-15);      // "-15"
formatWithSign(0);        // "0"
formatWithSign(12.5, 1);  // "+12.5"
```

### getCompactNumber()
```typescript
import { getCompactNumber } from '@shared/utils/number-format.utils';

getCompactNumber(1500);
// { value: 1.5, suffix: "K", formatted: "1.5K" }

getCompactNumber(1234567);
// { value: 1.2, suffix: "M", formatted: "1.2M" }
```

---

## CSS Animation Classes

### .stat-highlight
Flash effect when stat changes (green highlight).

```html
<span [appAnimateNumber]="score" class="stat-highlight">
  {{ score() }}
</span>
```

**Effect**: Green background flash + subtle scale (1.05)

---

### .stat-pulse
Continuous pulse animation for important stats.

```html
<div class="stat-pulse">
  <span [appAnimateNumber]="liveCount">0</span>
</div>
```

**Effect**: Pulses between opacity 1 and 0.9, scale 1 and 1.02 (infinite loop)

---

### .stat-increase
Shows up arrow (↑) when value increases.

```html
<span [appAnimateNumber]="points" class="stat-increase">
  {{ points() }}
</span>
```

**Effect**: Green up arrow appears on the right with slide-up animation

---

### .stat-decrease
Shows down arrow (↓) when value decreases.

```html
<span [appAnimateNumber]="errors" class="stat-decrease">
  {{ errors() }}
</span>
```

**Effect**: Red down arrow appears on the right with slide-down animation

---

### .stat-change
Generic color flash on value change.

```html
<span [appAnimateNumber]="value" class="stat-change">
  {{ value() }}
</span>
```

**Effect**: Text color flashes to primary green and back

---

### .stat-shimmer
Loading shimmer effect for skeleton stats.

```html
<div class="stat-shimmer" style="width: 4rem; height: 2rem;">
  <!-- Placeholder -->
</div>
```

**Effect**: Animated gradient shimmer (left to right)

---

## Dashboard Integration Examples

### Stats Card with Counter
```typescript
@Component({
  selector: 'app-stats-card',
  imports: [AnimateNumberDirective],
  template: `
    <div class="stats-card">
      <div class="stat-item">
        <span class="stat-label">Total Points</span>
        <h2
          [appAnimateNumber]="totalPoints()"
          class="stat-value stat-highlight">
          0
        </h2>
      </div>

      <div class="stat-item">
        <span class="stat-label">Win Rate</span>
        <h2
          [appAnimateNumber]="winRate()"
          [animSuffix]="'%'"
          [animDecimals]="1"
          class="stat-value">
          0%
        </h2>
      </div>

      <div class="stat-item">
        <span class="stat-label">Revenue</span>
        <h2
          [appAnimateNumber]="revenue()"
          [animPrefix]="'$'"
          [animDecimals]="2"
          class="stat-value">
          $0.00
        </h2>
      </div>
    </div>
  `
})
export class StatsCardComponent {
  totalPoints = signal(1250);
  winRate = signal(85.4);
  revenue = signal(12345.67);
}
```

---

### Live Stat with Pulse
```typescript
@Component({
  selector: 'app-live-counter',
  imports: [AnimateNumberDirective],
  template: `
    <div class="live-stat stat-pulse">
      <i class="pi pi-circle-fill live-indicator"></i>
      <span class="live-label">Active Users</span>
      <h3 [appAnimateNumber]="activeUsers()">0</h3>
    </div>
  `
})
export class LiveCounterComponent {
  activeUsers = signal(0);

  constructor() {
    // Simulate live updates
    setInterval(() => {
      this.activeUsers.update(val => val + Math.floor(Math.random() * 10));
    }, 3000);
  }
}
```

---

### Comparison Stats with Arrows
```typescript
@Component({
  selector: 'app-comparison-stat',
  imports: [AnimateNumberDirective],
  template: `
    <div class="comparison-stat">
      <div class="stat-current">
        <span class="stat-label">Current Week</span>
        <h3
          [appAnimateNumber]="currentWeek()"
          [class.stat-increase]="currentWeek() > previousWeek()"
          [class.stat-decrease]="currentWeek() < previousWeek()">
          0
        </h3>
      </div>

      <div class="stat-previous">
        <span class="stat-label">Previous Week</span>
        <h4 [appAnimateNumber]="previousWeek()">0</h4>
      </div>
    </div>
  `
})
export class ComparisonStatComponent {
  currentWeek = signal(185);
  previousWeek = signal(142);
}
```

---

## Performance Considerations

### Animation Performance
- Uses `requestAnimationFrame` for smooth 60 FPS
- Single DOM update per frame (`textContent` only)
- Cancels animation on component destroy
- GPU-accelerated (no layout thrashing)

### Bundle Impact
- Directive: ~2-3 KB (minified)
- Utilities: ~1-2 KB (tree-shakeable)
- CSS animations: ~1.74 KB

**Total**: ~5-7 KB for complete number counter system

---

## Accessibility

### Reduced Motion Support
- Automatically detects `prefers-reduced-motion: reduce`
- Instantly sets final value (no animation)
- Applies to both directive and CSS classes

### Screen Reader Support
- Directive adds `aria-live="polite"` automatically
- Sets `role="status"` for semantic meaning
- Final value is announced to screen readers
- Intermediate values are not announced (to avoid spam)

### Best Practices
```html
<!-- ✅ GOOD: Accessible counter -->
<span
  [appAnimateNumber]="score"
  aria-label="Player score">
  0
</span>

<!-- ❌ BAD: Missing context -->
<span [appAnimateNumber]="42">0</span>
```

---

## Troubleshooting

### Counter Not Animating

**Check**:
1. Is `AnimateNumberDirective` imported in component?
2. Is `appAnimateNumber` input bound correctly?
3. Is value actually changing (use `signal()` or `@Input()`)?
4. Check browser console for errors

---

### Animation Stuttering

**Causes**:
- Heavy computations during animation
- Large DOM updates on same frame
- Many counters animating simultaneously

**Solutions**:
- Stagger counter starts with `animAutoplay="false"` + manual trigger
- Reduce `animDuration` for faster completion
- Use `animEasing="linear"` for consistent frame time

---

### Numbers Formatted Incorrectly

**Check**:
- `animDecimals` matches expected precision
- `animSeparator` is correct for locale
- `animPrefix`/`animSuffix` don't have extra spaces
- Value is a valid number (not string)

---

## Migration Guide

### Upgrading from Static Numbers

**Before**:
```html
<h2>{{ totalPoints }}</h2>
```

**After**:
```typescript
// 1. Import directive
import { AnimateNumberDirective } from '@shared/directives/animate-number.directive';

@Component({
  imports: [AnimateNumberDirective],
  template: `
    <h2 [appAnimateNumber]="totalPoints()">0</h2>
  `
})
export class MyComponent {
  // 2. Convert to signal
  totalPoints = signal(0);

  // 3. Update value via signal
  updatePoints(newValue: number) {
    this.totalPoints.set(newValue);
  }
}
```

---

## Related Documentation

- [Animation Primitives Guide](/docs/ANIMATION_PRIMITIVES.md) - Base animation classes
- [Route Animations Guide](/docs/ROUTE_ANIMATIONS_GUIDE.md) - Page transitions
- [Design System Tokens](/src/scss/tokens/design-system-tokens.scss) - Motion tokens

---

**Last Updated**: Week 3 Phase 3A (March 2026)
**Maintained By**: Frontend Team
**Questions?**: Contact the UI/UX team for animation guidance

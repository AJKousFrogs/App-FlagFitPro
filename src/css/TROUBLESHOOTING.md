# Troubleshooting Guide - CSS Architecture

## Common Issues and Solutions

### Issue 1: Styles Not Applying

**Symptoms:**
- CSS variables not working
- Styles not rendering
- Specificity conflicts

**Solutions:**

1. **Check CSS Import Order**
   ```html
   <!-- Correct order -->
   <link rel="stylesheet" href="./src/css/main.css">
   ```

2. **Verify Cascade Layers**
   - Check browser console for layer errors
   - Ensure `@layer` declarations are correct
   - Verify imports use `layer()` syntax

3. **Check Specificity**
   - Use `.u-` utilities for highest specificity
   - Use `!important` sparingly (only in utilities)
   - Check for conflicting styles

### Issue 2: Theme Switching Not Working

**Symptoms:**
- Dark theme not applying
- Theme toggle has no effect
- Colors not changing

**Solutions:**

1. **Check Theme Attribute**
   ```html
   <!-- Correct -->
   <html data-theme="dark">
   <!-- or -->
   <html class="dark">
   ```

2. **Verify Theme CSS Loaded**
   - Check Network tab for theme files
   - Ensure theme files are imported in `main.css`
   - Check for CSS syntax errors

3. **Check CSS Variable Overrides**
   - Verify theme files override semantic tokens
   - Check for conflicting `:root` declarations
   - Ensure theme selectors have correct specificity

### Issue 3: Layout Issues

**Symptoms:**
- Grid not working
- Sidebar not positioning correctly
- Responsive breakpoints not working

**Solutions:**

1. **Check Layout Classes**
   ```html
   <!-- Use layout prefix -->
   <div class="l-container">
     <div class="l-grid l-grid-3">
   ```

2. **Verify Breakpoints**
   - Check `breakpoints.css` is loaded
   - Use CSS variables: `var(--bp-tablet)`
   - Test media queries in DevTools

3. **Check Container Structure**
   ```html
   <!-- Correct page structure -->
   <div class="l-page-sidebar">
     <aside class="l-sidebar">...</aside>
     <main class="l-main">...</main>
   </div>
   ```

### Issue 4: State Classes Not Working

**Symptoms:**
- `.is-active` not applying
- `.has-error` not showing
- States not toggling

**Solutions:**

1. **Check JavaScript Integration**
   ```javascript
   // Correct state toggle
   element.classList.toggle('is-active');
   element.classList.add('has-error');
   ```

2. **Verify State CSS Loaded**
   - Check `state.css` is imported
   - Ensure state classes are defined
   - Check for CSS syntax errors

3. **Check Specificity**
   - State classes may need `!important`
   - Verify no conflicting styles
   - Check cascade layer order

### Issue 5: Animations Not Working

**Symptoms:**
- Animations not playing
- Transitions not smooth
- Reduced motion not respected

**Solutions:**

1. **Check Animation Classes**
   ```html
   <!-- Correct usage -->
   <div class="u-animate-fade-in">
   <div class="u-transition-colors">
   ```

2. **Verify Reduced Motion**
   - Check `prefers-reduced-motion` media query
   - Ensure animations respect user preference
   - Test in browser settings

3. **Check Keyframes**
   - Verify keyframes are defined in `animations.css`
   - Check for syntax errors
   - Ensure animation names match

### Issue 6: JavaScript Hooks Not Working

**Symptoms:**
- `.js-*` classes not targeting elements
- Event listeners not attaching
- Hooks have styles applied

**Solutions:**

1. **Verify Hook Classes**
   ```html
   <!-- Correct - no styles -->
   <button class="btn js-modal-trigger">
   ```

2. **Check JavaScript**
   ```javascript
   // Correct targeting
   document.querySelectorAll('.js-modal-trigger').forEach(...);
   ```

3. **Ensure No Styles**
   - Verify `hooks.css` has no styles
   - Check for accidental styling
   - Use DevTools to inspect

### Issue 7: Specificity Conflicts

**Symptoms:**
- Styles not overriding
- `!important` needed everywhere
- Cascade layers not working

**Solutions:**

1. **Use Cascade Layers**
   ```css
   /* Utilities layer has highest priority */
   @layer utilities {
     .u-text-primary { color: red !important; }
   }
   ```

2. **Check Layer Order**
   - Verify layer declaration order
   - Ensure utilities layer is last
   - Check for layer conflicts

3. **Use Utility Classes**
   - Prefer `.u-` utilities for overrides
   - Avoid inline styles
   - Use component classes for structure

### Issue 8: Responsive Issues

**Symptoms:**
- Breakpoints not triggering
- Mobile styles not applying
- Desktop styles breaking on mobile

**Solutions:**

1. **Check Breakpoint Variables**
   ```css
   /* Correct usage */
   @media (min-width: var(--bp-tablet)) { ... }
   ```

2. **Verify Viewport Meta**
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```

3. **Test Breakpoints**
   - Use DevTools device emulation
   - Test actual devices
   - Verify media query syntax

### Issue 9: Accessibility Issues

**Symptoms:**
- Focus indicators not visible
- Screen reader not working
- Keyboard navigation broken

**Solutions:**

1. **Check Focus Styles**
   ```css
   /* Ensure focus-visible is styled */
   :focus-visible {
     outline: 2px solid var(--color-border-focus);
   }
   ```

2. **Verify ARIA Attributes**
   ```html
   <!-- Correct ARIA usage -->
   <button aria-expanded="false" aria-controls="menu">
   ```

3. **Test Accessibility**
   - Use screen reader (NVDA, JAWS, VoiceOver)
   - Test keyboard navigation
   - Check color contrast ratios

### Issue 10: Performance Issues

**Symptoms:**
- Slow page load
- CSS blocking render
- Large file size

**Solutions:**

1. **Optimize Imports**
   - Use single `main.css` import
   - Avoid duplicate imports
   - Check for unused CSS

2. **Consider Critical CSS**
   ```html
   <!-- Inline critical CSS -->
   <style>
     /* Above-the-fold styles */
   </style>
   ```

3. **Minify for Production**
   - Use CSS minifier
   - Remove comments
   - Optimize selectors

## Debugging Tips

### 1. Use Browser DevTools

- **Inspect Element**: Check computed styles
- **Network Tab**: Verify CSS files loading
- **Console**: Check for CSS errors
- **Layers Panel**: Inspect cascade layers

### 2. Check CSS Variables

```javascript
// In browser console
getComputedStyle(document.documentElement)
  .getPropertyValue('--color-brand-primary');
```

### 3. Verify Layer Order

```css
/* Check layer declarations */
@layer reset, base, tokens, theme, layout, components, state, utilities;
```

### 4. Test Specificity

```css
/* Use DevTools to check specificity */
/* Higher specificity wins */
```

## Getting Help

1. **Check Documentation**
   - `README.md` - API reference
   - `MIGRATION.md` - Migration guide
   - Component examples

2. **Common Patterns**
   - Review working examples
   - Check component documentation
   - Look at existing implementations

3. **Browser Support**
   - Check cascade layers support
   - Verify CSS custom properties
   - Test in target browsers

## Prevention

1. **Follow Naming Conventions**
   - Use `.l-` for layout
   - Use `.u-` for utilities
   - Use `.is-`/`.has-` for states
   - Use `.js-` for hooks

2. **Use Design Tokens**
   - Always use CSS variables
   - Don't hardcode values
   - Reference tokens consistently

3. **Test Early and Often**
   - Test in multiple browsers
   - Test responsive breakpoints
   - Test accessibility features
   - Test theme switching

4. **Keep It Simple**
   - Avoid over-engineering
   - Use existing utilities
   - Follow established patterns


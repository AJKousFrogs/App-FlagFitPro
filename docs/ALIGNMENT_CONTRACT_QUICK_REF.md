# Alignment Contract Quick Reference

> **Use this as a checklist when building new UI components**

---

## Control Row Pattern

```scss
/* Two-column control layout (label + control) */
.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 64px; /* 🔒 LOCK THIS */
  padding: var(--space-4);
  border: 2px solid transparent; /* Prevents hover shift */
}

.control-row__label {
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* ⚠️ Top-align, not center */
  align-items: flex-start;
  flex: 1;
}

.control-row__control {
  flex-shrink: 0;
  min-width: 44px; /* 🔒 LOCK THIS */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**When to use:** Settings toggles, notification preferences, any label + control pair

---

## List Item Pattern

```scss
/* Clickable list items with action on the right */
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 80px; /* 🔒 LOCK THIS (taller than control-row) */
  padding: var(--space-4) var(--space-3);
  border: 2px solid transparent;
  border-radius: var(--radius-xl);
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast);
}

.list-item:hover {
  background: var(--surface-secondary);
  /* ⚠️ Border stays 2px, no layout shift */
}

.list-item__content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* ⚠️ Top-align */
  align-items: flex-start;
  flex: 1;
}
```

**When to use:** Security actions, notification items, menu items with descriptions

---

## Icon + Text Pattern

```scss
/* Any component with icon next to text */
.icon-text-pair {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.icon-text-pair i {
  line-height: 1; /* 🔒 REQUIRED - locks icon baseline */
  flex-shrink: 0; /* 🔒 REQUIRED - prevents compression */
  font-size: var(--font-size-body);
}
```

**When to use:** Navigation items, buttons with icons, badges, status indicators

---

## Dialog Footer Pattern

```scss
/* All dialog footers MUST match this exact structure */
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  background: var(--surface-secondary);
  border-top: 1px solid var(--color-border-muted);
  min-height: 72px; /* 🔒 LOCK THIS - matches all dialogs */
}

.dialog-actions app-button {
  min-width: 130px; /* 🔒 LOCK THIS - consistent button sizing */
}
```

**When to use:** All p-dialog footers (password, 2FA, delete, export, etc.)

---

## Button Usage Rules

### ✅ DO

```html
<!-- Use app-button component with standard variants -->
<app-button variant="primary">Save</app-button>
<app-button variant="outlined">Cancel</app-button>
<app-button variant="danger">Delete</app-button>
```

### ❌ DON'T

```scss
/* NEVER override button geometry */
app-button {
  height: 50px !important; /* ❌ NO */
  padding: 20px !important; /* ❌ NO */
  min-height: 60px !important; /* ❌ NO */
}
```

**Rule:** If a button looks wrong, fix the **container**, not the button.

---

## Mobile Responsiveness

```scss
/* Stack control rows on mobile */
@include respond-to(xs) {
  .control-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .control-row__control {
    width: 100%;
    justify-content: flex-start; /* Left-align on mobile */
  }
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Centering multi-line text

```scss
/* BAD - causes drift when text wraps */
.text-block {
  justify-content: center;
}

/* GOOD - maintains top alignment */
.text-block {
  justify-content: flex-start;
  align-items: flex-start;
}
```

### ❌ Pitfall 2: Forgetting icon line-height

```scss
/* BAD - icon drifts relative to text */
.icon {
  font-size: var(--font-size-body);
}

/* GOOD - locks icon baseline */
.icon {
  font-size: var(--font-size-body);
  line-height: 1;
  flex-shrink: 0;
}
```

### ❌ Pitfall 3: Variable row heights

```scss
/* BAD - rows feel inconsistent */
.row-item {
  padding: var(--space-4);
}

/* GOOD - locked visual rhythm */
.row-item {
  padding: var(--space-4);
  min-height: 80px;
}
```

### ❌ Pitfall 4: Hover layout shifts

```scss
/* BAD - border appears on hover, causes shift */
.button {
  border: none;
}
.button:hover {
  border: 2px solid green; /* ❌ Adds 4px total height */
}

/* GOOD - border exists always, only color changes */
.button {
  border: 2px solid transparent;
}
.button:hover {
  border-color: green; /* ✅ No layout shift */
}
```

---

## Checklist for New Components

- [ ] Control rows have **locked min-height**
- [ ] Left column uses **flex-start alignment** (not center)
- [ ] Right column has **locked min-width**
- [ ] Icons have **line-height: 1** and **flex-shrink: 0**
- [ ] Hover states use **constant border-width** (2px transparent → 2px colored)
- [ ] Dialog footers match **72px min-height**
- [ ] Buttons use **app-button component** without overrides
- [ ] Mobile breakpoints **stack properly** without drift

---

## Testing Quick Check

### Visual Test

1. Open Settings page
2. Hover over all interactive rows → should see **zero layout shift**
3. Open all dialogs → footers should be **identical height**
4. Resize to mobile → rows should **stack cleanly**

### Code Review Test

```bash
# Search for anti-patterns
rg "height.*!important" --type scss
rg "padding.*!important" --type scss
rg "min-height.*!important" --type scss

# Should return ZERO results in component files
```

---

**Last Updated:** January 11, 2026  
**Maintained By:** Design System Team  
**Status:** Active Reference

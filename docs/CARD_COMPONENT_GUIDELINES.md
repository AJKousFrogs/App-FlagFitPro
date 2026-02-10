# Card Component Guidelines

**Scope:** FlagFit Pro Angular frontend  
**Components:** `p-card` (PrimeNG) vs `app-card` (custom)

---

## When to Use Each

| Use Case | Component | Rationale |
|----------|-----------|-----------|
| **New feature cards** | `app-card` | Design system aligned; consistent header, actions, empty state |
| **Settings / preferences blocks** | `app-card` | Matches app-card API (title, headerIcon, etc.) |
| **Data tables with card wrapper** | `app-card` | Standard card wrapper for tables |
| **Legacy / PrimeNG-templated content** | `p-card` | Existing usage with `pTemplate="header"`, `styleClass` |
| **Simple content containers** | Either | Prefer `app-card` for new code |

## Migration Strategy

1. **New code:** Use `app-card` exclusively.
2. **Refactors:** When touching a template with `p-card`, migrate to `app-card` if straightforward.
3. **Leave as-is:** Complex `p-card` usage (many pTemplates, styleClass) can stay until refactor.

## app-card API (Preferred)

```html
<app-card
  title="Card Title"
  headerIcon="pi-calendar"
  headerIconColor="info"
>
  Content here
</app-card>
```

## p-card (PrimeNG) – Legacy

```html
<p-card header="Title" styleClass="w-full">
  <ng-template pTemplate="footer">
    Actions
  </ng-template>
</p-card>
```

---

*See DESIGN_SYSTEM_RULES.md and ANGULAR_PRIMENG_GUIDE.md for PrimeNG patterns.*

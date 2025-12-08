# PrimeNG v21 Migration Guide

**Issue**: Application is using PrimeNG v21.0.1, but component imports use old v16/v17 naming conventions.

**Impact**: 9 components currently have build errors due to incorrect imports.

---

## 🔄 Component Name Changes

PrimeNG v21 introduced **breaking changes** in component names to align with modern Angular patterns (standalone components):

### Import Path Changes

| Old Import (v16-v17) | New Import (v21) |
|----------------------|------------------|
| `import { DropdownModule } from "primeng/dropdown"` | `import { Select } from "primeng/select"` |
| `import { CalendarModule } from "primeng/calendar"` | `import { DatePicker } from "primeng/datepicker"` |
| `import { InputTextareaModule } from "primeng/inputtextarea"` | `import { Textarea } from "primeng/textarea"` |
| `import { TabViewModule } from "primeng/tabview"` | `import { Tabs } from "primeng/tabs"` |
| `import { InputSwitchModule } from "primeng/inputswitch"` | `import { ToggleSwitch } from "primeng/toggleswitch"` |
| `import { InputTextarea } from "primeng/inputtextarea"` | `import { Textarea } from "primeng/textarea"` |

### Naming Pattern Changes

**Old (Module-based)**:
- Suffix: `Module`
- Example: `DropdownModule`, `CalendarModule`

**New (Standalone)**:
- No suffix (direct component name)
- Example: `Select`, `DatePicker`

---

## 📝 Files Requiring Updates

### 1. analytics.component.ts

**Current (Broken)**:
```typescript
import { DropdownModule } from "primeng/dropdown";
import { TabViewModule } from "primeng/tabview";

imports: [
  CommonModule,
  DropdownModule,
  ChartModule,
  TabViewModule,
]
```

**Fixed**:
```typescript
import { Select } from "primeng/select";
import { Tabs } from "primeng/tabs";

imports: [
  CommonModule,
  Select,
  ChartModule,
  Tabs,
]
```

---

### 2. game-tracker.component.ts

**Current (Broken)**:
```typescript
import { InputTextareaModule } from "primeng/inputtextarea";
import { CalendarModule } from "primeng/calendar";
import { DropdownModule } from "primeng/dropdown";

imports: [
  CommonModule,
  FormsModule,
  ButtonModule,
  InputTextareaModule,
  TableModule,
  CalendarModule,
  DropdownModule,
]
```

**Fixed**:
```typescript
import { Textarea } from "primeng/textarea";
import { DatePicker } from "primeng/datepicker";
import { Select } from "primeng/select";

imports: [
  CommonModule,
  FormsModule,
  ButtonModule,
  Textarea,
  TableModule,
  DatePicker,
  Select,
]
```

**Additional Fix Required**:
```typescript
// Add missing FormsModule import
import { FormsModule } from '@angular/forms';
```

---

### 3. performance-tracking.component.ts

**Current (Broken)**:
```typescript
import { CalendarModule } from "primeng/calendar";

imports: [
  CommonModule,
  CalendarModule,
]
```

**Fixed**:
```typescript
import { DatePicker } from "primeng/datepicker";

imports: [
  CommonModule,
  DatePicker,
]
```

---

### 4. profile.component.ts

**Current (Broken)**:
```typescript
import { TabViewModule } from "primeng/tabview";

imports: [
  CommonModule,
  TabViewModule,
]
```

**Fixed**:
```typescript
import { Tabs } from "primeng/tabs";

imports: [
  CommonModule,
  Tabs,
]
```

---

### 5. settings.component.ts

**Current (Broken)**:
```typescript
import { InputSwitchModule } from "primeng/inputswitch";
import { DropdownModule } from "primeng/dropdown";

imports: [
  CommonModule,
  InputSwitchModule,
  DropdownModule,
]
```

**Fixed**:
```typescript
import { ToggleSwitch } from "primeng/toggleswitch";
import { Select } from "primeng/select";

imports: [
  CommonModule,
  ToggleSwitch,
  Select,
]
```

---

### 6. tournaments.component.ts

**Current (Broken)**:
```typescript
import { TabViewModule } from "primeng/tabview";

imports: [
  CommonModule,
  TabViewModule,
]
```

**Fixed**:
```typescript
import { Tabs } from "primeng/tabs";

imports: [
  CommonModule,
  Tabs,
]
```

---

### 7. wellness.component.ts

**Current (Broken)**:
```typescript
import { CalendarModule } from "primeng/calendar";

imports: [
  CommonModule,
  CalendarModule,
]
```

**Fixed**:
```typescript
import { DatePicker } from "primeng/datepicker";

imports: [
  CommonModule,
  DatePicker,
]
```

---

### 8. community.component.ts

**Current (Broken)**:
```typescript
import { InputTextarea } from "primeng/inputtextarea";

imports: [
  CommonModule,
  InputTextarea,
]
```

**Fixed**:
```typescript
import { Textarea } from "primeng/textarea";

imports: [
  CommonModule,
  Textarea,
]
```

---

### 9. smart-breadcrumbs.component.ts

**Current (Broken)**:
```typescript
import { DropdownModule } from "primeng/dropdown";

imports: [
  CommonModule,
  DropdownModule,
]
```

**Fixed**:
```typescript
import { Select } from "primeng/select";

imports: [
  CommonModule,
  Select,
]
```

---

## 🛠️ Template Changes

### Dropdown → Select

**Old Template**:
```html
<p-dropdown [options]="items" [(ngModel)]="selectedItem"></p-dropdown>
```

**New Template**:
```html
<p-select [options]="items" [(ngModel)]="selectedItem"></p-select>
```

### Calendar → DatePicker

**Old Template**:
```html
<p-calendar [(ngModel)]="date" [showTime]="true"></p-calendar>
```

**New Template**:
```html
<p-datepicker [(ngModel)]="date" [showTime]="true"></p-datepicker>
```

### TabView → Tabs

**Old Template**:
```html
<p-tabView>
  <p-tabPanel header="Tab 1">Content 1</p-tabPanel>
  <p-tabPanel header="Tab 2">Content 2</p-tabPanel>
</p-tabView>
```

**New Template**:
```html
<p-tabs>
  <p-tabpanel header="Tab 1">Content 1</p-tabpanel>
  <p-tabpanel header="Tab 2">Content 2</p-tabpanel>
</p-tabs>
```

### InputTextarea → Textarea

**Old Template**:
```html
<textarea pInputTextarea [(ngModel)]="text"></textarea>
```

**New Template**:
```html
<p-textarea [(ngModel)]="text"></p-textarea>
```

---

## 🚀 Quick Migration Script

You can use this find-and-replace script to update all files at once:

### Option 1: VS Code Search & Replace

1. Open VS Code
2. Press `Cmd+Shift+H` (Mac) or `Ctrl+Shift+H` (Windows)
3. Enable regex mode (.*| icon)
4. Run these replacements:

```
Find: from "primeng/dropdown"
Replace: from "primeng/select"

Find: DropdownModule
Replace: Select

Find: from "primeng/calendar"
Replace: from "primeng/datepicker"

Find: CalendarModule
Replace: DatePicker

Find: from "primeng/inputtextarea"
Replace: from "primeng/textarea"

Find: InputTextareaModule
Replace: Textarea

Find: InputTextarea
Replace: Textarea

Find: from "primeng/tabview"
Replace: from "primeng/tabs"

Find: TabViewModule
Replace: Tabs

Find: from "primeng/inputswitch"
Replace: from "primeng/toggleswitch"

Find: InputSwitchModule
Replace: ToggleSwitch
```

### Option 2: Automated sed Script

```bash
cd /Users/aljosaursakous/Desktop/Flag\ football\ HTML\ -\ APP/angular/src

# TypeScript imports
find . -name "*.ts" -exec sed -i '' 's/from "primeng\/dropdown"/from "primeng\/select"/g' {} +
find . -name "*.ts" -exec sed -i '' 's/DropdownModule/Select/g' {} +
find . -name "*.ts" -exec sed -i '' 's/from "primeng\/calendar"/from "primeng\/datepicker"/g' {} +
find . -name "*.ts" -exec sed -i '' 's/CalendarModule/DatePicker/g' {} +
find . -name "*.ts" -exec sed -i '' 's/from "primeng\/inputtextarea"/from "primeng\/textarea"/g' {} +
find . -name "*.ts" -exec sed -i '' 's/InputTextareaModule/Textarea/g' {} +
find . -name "*.ts" -exec sed -i '' 's/from "primeng\/tabview"/from "primeng\/tabs"/g' {} +
find . -name "*.ts" -exec sed -i '' 's/TabViewModule/Tabs/g' {} +
find . -name "*.ts" -exec sed -i '' 's/from "primeng\/inputswitch"/from "primeng\/toggleswitch"/g' {} +
find . -name "*.ts" -exec sed -i '' 's/InputSwitchModule/ToggleSwitch/g' {} +

# HTML templates
find . -name "*.html" -exec sed -i '' 's/<p-dropdown/<p-select/g' {} +
find . -name "*.html" -exec sed -i '' 's/<\/p-dropdown>/<\/p-select>/g' {} +
find . -name "*.html" -exec sed -i '' 's/<p-calendar/<p-datepicker/g' {} +
find . -name "*.html" -exec sed -i '' 's/<\/p-calendar>/<\/p-datepicker>/g' {} +
find . -name "*.html" -exec sed -i '' 's/<p-tabView/<p-tabs/g' {} +
find . -name "*.html" -exec sed -i '' 's/<\/p-tabView>/<\/p-tabs>/g' {} +
find . -name "*.html" -exec sed -i '' 's/<p-tabPanel/<p-tabpanel/g' {} +
find . -name "*.html" -exec sed -i '' 's/<\/p-tabPanel>/<\/p-tabpanel>/g' {} +
find . -name "*.html" -exec sed -i '' 's/pInputTextarea/<p-textarea/g' {} +

echo "✅ Migration complete! Run 'npm run build' to verify."
```

---

## ✅ Migration Checklist

- [ ] Backup your project: `git commit -am "Before PrimeNG v21 migration"`
- [ ] Update imports in all 9 affected TypeScript files
- [ ] Update component names in imports arrays
- [ ] Update HTML templates (component selectors)
- [ ] Add missing `FormsModule` to `game-tracker.component.ts`
- [ ] Run build: `npm run build`
- [ ] Fix any remaining TypeScript errors
- [ ] Test all affected components manually
- [ ] Verify dropdown, calendar, textarea, tabs functionality

---

## 📚 Official PrimeNG v21 Migration Guide

For complete details, see:
- https://primeng.org/installation
- https://github.com/primefaces/primeng/releases/tag/21.0.0

---

## 🎯 Summary

**Affected Files**: 9 components
**Required Changes**:
- TypeScript imports: ~20 lines
- Template updates: ~15 lines
**Estimated Time**: 15-30 minutes (with script) or 1-2 hours (manual)

**After migration**, your application should build successfully!

---

*Migration guide created: December 7, 2025*

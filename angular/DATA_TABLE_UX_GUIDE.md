# Enhanced Data Table - UX Guide

**Version:** 1.0
**Date:** December 30, 2024
**Status:** ✅ Complete

---

## Overview

This guide covers the enhanced data table component for FlagFit Pro with column management, bulk actions, inline editing, and mobile card view.

---

## Features Implemented

### ✅ 1. Column Resizing

**Feature:**
- Drag column edges to resize
- Minimum width constraints
- Preserves column widths in localStorage
- Smooth visual feedback

**User Controls:**
- **Resize:** Hover over column edge → Cursor changes → Drag to resize
- **Reset:** Click "Reset Table" button

**Implementation:**
```html
<app-enhanced-data-table
  [data]="tableData()"
  [columns]="columns()"
  [resizableColumns]="true"
/>
```

---

### ✅ 2. Column Reordering

**Feature:**
- Drag column headers to reorder
- Visual drag indicator
- Preserves column order in localStorage
- Smooth animations

**User Controls:**
- **Reorder:** Click and drag column header to new position
- **Reset:** Click "Reset Table" button

**Implementation:**
```html
<app-enhanced-data-table
  [data]="tableData()"
  [columns]="columns()"
  [reorderableColumns]="true"
/>
```

---

### ✅ 3. Saved Preferences (localStorage)

**Feature:**
- Saves visible columns
- Saves column widths
- Saves column order
- Saves sort state
- Automatic save on change
- Per-table preferences (using unique key)

**Stored Data:**
```typescript
{
  visibleColumns: ['name', 'email', 'role'],
  columnWidths: {
    'name': '200px',
    'email': '250px'
  },
  columnOrder: ['name', 'email', 'role', 'status'],
  sortField: 'name',
  sortOrder: 1
}
```

**Implementation:**
```html
<app-enhanced-data-table
  [data]="tableData()"
  [columns]="columns()"
  [savePreferences]="true"
  preferencesKey="roster-table"
/>
```

---

### ✅ 4. Bulk Actions

**Feature:**
- Select all checkbox
- Individual row selection
- Bulk delete
- Bulk export (CSV/JSON)
- Selected count display
- Clear visual indication of selected rows

**User Controls:**
- **Select All:** Click checkbox in header
- **Select Row:** Click checkbox in row
- **Bulk Delete:** Click "Delete Selected" (appears when rows selected)
- **Bulk Export:** Click "Export Selected"

**Implementation:**
```html
<app-enhanced-data-table
  [data]="tableData()"
  [columns]="columns()"
  [selectable]="true"
  (onBulkDelete)="handleBulkDelete($event)"
  (onExport)="handleExport($event)"
/>
```

**Component Handler:**
```typescript
handleBulkDelete(rows: any[]): void {
  // Confirm deletion
  this.confirmationService.confirm({
    message: `Delete ${rows.length} selected items?`,
    accept: () => {
      // Delete rows
      this.service.deleteMultiple(rows.map(r => r.id));
    }
  });
}

handleExport(rows: any[]): void {
  // Export as CSV
  const csv = this.convertToCSV(rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `export-${new Date().toISOString()}.csv`;
  link.click();
}
```

---

### ✅ 5. Inline Editing

**Feature:**
- Double-click cell to edit
- Enter to save
- Escape to cancel
- Auto-focus and select on edit
- Visual editing indicator
- Works with keyboard navigation

**User Controls:**
- **Start Edit:** Double-click cell
- **Save:** Press Enter or click outside
- **Cancel:** Press Escape

**Implementation:**
```typescript
// Define editable columns
columns: EnhancedTableColumn[] = [
  { field: 'name', header: 'Name', editable: true },
  { field: 'email', header: 'Email', editable: true },
  { field: 'role', header: 'Role', editable: false }, // Not editable
];
```

```html
<app-enhanced-data-table
  [data]="tableData()"
  [columns]="columns()"
/>
```

**Note:** Edits modify the data directly. To persist, add onChange handler:
```typescript
// Watch for data changes
effect(() => {
  const data = this.tableData();
  // Auto-save on change
  this.saveToBackend(data);
});
```

---

### ✅ 6. Mobile Card View

**Feature:**
- Automatic switch below breakpoint (default 768px)
- Manual toggle button
- Card layout optimized for touch
- All features work in card view
- Smooth transition between views

**Desktop View:**
```
┌───────────────────────────────────────┐
│ ☐ Name    │ Email      │ Role    │ ⚙  │
├───────────────────────────────────────┤
│ ☐ John    │ john@...   │ Admin   │ ✎🗑 │
│ ☐ Jane    │ jane@...   │ User    │ ✎🗑 │
└───────────────────────────────────────┘
```

**Mobile Card View:**
```
┌──────────────────┐
│ ☐                │
│ NAME             │
│ John Doe         │
│                  │
│ EMAIL            │
│ john@example.com │
│                  │
│ ROLE             │
│ Admin            │
│                  │
│ [Edit] [Delete]  │
└──────────────────┘
```

**Implementation:**
```html
<app-enhanced-data-table
  [data]="tableData()"
  [columns]="columns()"
  [mobileBreakpoint]="768"
/>
```

**Custom Breakpoint:**
```html
<!-- Switch to cards at 1024px -->
<app-enhanced-data-table
  [mobileBreakpoint]="1024"
/>

<!-- Disable mobile view entirely -->
<app-enhanced-data-table
  [mobileBreakpoint]="0"
/>
```

---

## Component API

### **Inputs**

```typescript
// Data
data = input<any[]>([]);

// Column definitions
columns = input<EnhancedTableColumn[]>([]);

// Features
selectable = input<boolean>(false);
resizableColumns = input<boolean>(true);
reorderableColumns = input<boolean>(true);

// Preferences
savePreferences = input<boolean>(true);
preferencesKey = input<string>('enhanced-table'); // Unique key per table

// Mobile view
mobileBreakpoint = input<number>(768); // 0 to disable
```

### **Outputs**

```typescript
onEdit = output<any>();          // Single row edit
onDelete = output<any>();        // Single row delete
onBulkDelete = output<any[]>(); // Multiple rows delete
onExport = output<any[]>();      // Export rows (selected or all)
```

### **Column Definition**

```typescript
interface EnhancedTableColumn {
  field: string;           // Data field key
  header: string;          // Column header label
  sortable?: boolean;      // Enable sorting (default: true)
  resizable?: boolean;     // Enable resizing (default: true)
  reorderable?: boolean;   // Enable reordering (default: true)
  editable?: boolean;      // Enable inline editing (default: false)
  visible?: boolean;       // Initially visible (default: true)
  width?: string;          // Initial width (e.g., '200px')
  minWidth?: number;       // Minimum width in pixels (default: 100)
  type?: 'text' | 'number' | 'date' | 'boolean' | 'custom';
}
```

---

## Usage Examples

### **Basic Table**

```typescript
// Component
columns: EnhancedTableColumn[] = [
  { field: 'name', header: 'Name' },
  { field: 'email', header: 'Email' },
  { field: 'role', header: 'Role' },
];

data = signal([
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
]);
```

```html
<!-- Template -->
<app-enhanced-data-table
  [data]="data()"
  [columns]="columns"
/>
```

---

### **Table with All Features**

```typescript
columns: EnhancedTableColumn[] = [
  {
    field: 'name',
    header: 'Name',
    sortable: true,
    resizable: true,
    reorderable: true,
    editable: true,
    width: '200px',
    minWidth: 150
  },
  {
    field: 'email',
    header: 'Email',
    editable: true,
    width: '250px'
  },
  {
    field: 'role',
    header: 'Role',
    editable: false, // Not editable
    width: '150px'
  },
  {
    field: 'status',
    header: 'Status',
    visible: true,
    width: '100px'
  },
];
```

```html
<app-enhanced-data-table
  [data]="data()"
  [columns]="columns"
  [selectable]="true"
  [resizableColumns]="true"
  [reorderableColumns]="true"
  [savePreferences]="true"
  preferencesKey="users-table"
  [mobileBreakpoint]="768"
  (onEdit)="handleEdit($event)"
  (onDelete)="handleDelete($event)"
  (onBulkDelete)="handleBulkDelete($event)"
  (onExport)="handleExport($event)"
/>
```

---

### **Roster Table Example**

```typescript
@Component({
  selector: 'app-roster',
  template: `
    <app-enhanced-data-table
      [data]="players()"
      [columns]="columns"
      [selectable]="true"
      preferencesKey="roster-table"
      (onEdit)="editPlayer($event)"
      (onDelete)="deletePlayer($event)"
      (onBulkDelete)="deletePlayers($event)"
      (onExport)="exportRoster($event)"
    />
  `
})
export class RosterComponent {
  columns: EnhancedTableColumn[] = [
    { field: 'jerseyNumber', header: '#', width: '60px', editable: true },
    { field: 'name', header: 'Name', editable: true, minWidth: 150 },
    { field: 'position', header: 'Position', editable: true },
    { field: 'height', header: 'Height', editable: true },
    { field: 'weight', header: 'Weight', editable: true },
    { field: 'gamesPlayed', header: 'Games', sortable: true },
    { field: 'status', header: 'Status', editable: true },
  ];

  players = signal([
    { id: 1, jerseyNumber: 12, name: 'John Doe', position: 'QB', height: '6\'2"', weight: '210', gamesPlayed: 10, status: 'Active' },
    // ... more players
  ]);

  editPlayer(player: any): void {
    // Open edit modal
  }

  deletePlayer(player: any): void {
    // Confirm and delete
  }

  deletePlayers(players: any[]): void {
    // Bulk delete
  }

  exportRoster(players: any[]): void {
    // Export to CSV
    const csv = this.convertToCSV(players);
    this.downloadCSV(csv, 'roster.csv');
  }
}
```

---

## Column Management

### **Show/Hide Columns**

```typescript
// User clicks "Show Columns" dropdown
// Selects which columns to display
// Preferences automatically saved
```

**User Workflow:**
1. Click "Show Columns" button
2. Check/uncheck columns
3. Columns hide/show immediately
4. Preference saved to localStorage

---

### **Reorder Columns**

**User Workflow:**
1. Click and hold column header
2. Drag left or right
3. Drop in new position
4. Order saved to localStorage

---

### **Resize Columns**

**User Workflow:**
1. Hover over column edge (cursor changes to resize)
2. Click and drag to resize
3. Release to set new width
4. Width saved to localStorage

---

## Keyboard Accessibility

### **Navigation**

| Key | Action |
|-----|--------|
| **Tab** | Move to next cell |
| **Shift+Tab** | Move to previous cell |
| **Enter** | Edit cell (if editable) |
| **Escape** | Cancel edit |
| **Space** | Toggle checkbox |
| **Arrow Keys** | Navigate cells |

---

## Testing Checklist

### **Column Management**
- [ ] Columns can be resized
- [ ] Columns can be reordered
- [ ] Show/hide columns works
- [ ] Preferences persist on reload
- [ ] Reset preferences works

### **Bulk Actions**
- [ ] Select all checkbox works
- [ ] Individual row selection works
- [ ] Bulk delete works
- [ ] Export works (CSV format)
- [ ] Selected count displays correctly

### **Inline Editing**
- [ ] Double-click starts edit
- [ ] Enter saves edit
- [ ] Escape cancels edit
- [ ] Auto-focus and select works
- [ ] Edits persist in data

### **Mobile View**
- [ ] Switches to cards below breakpoint
- [ ] Toggle button works
- [ ] All features work in card view
- [ ] Touch-friendly interactions

### **Accessibility**
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Focus indicators visible
- [ ] ARIA labels present

---

## Performance Considerations

### **Large Datasets (1000+ rows)**

Use virtual scrolling:
```typescript
// Enable virtual scrolling in PrimeNG table
<p-table
  [value]="data()"
  [virtualScroll]="true"
  [virtualScrollItemSize]="50"
  [scrollHeight]="'600px'"
/>
```

### **Optimizations:**

1. **Lazy Loading:**
   ```typescript
   // Load data on demand
   loadData(event: LazyLoadEvent): void {
     this.loading.set(true);

     this.service.getData({
       first: event.first,
       rows: event.rows,
       sortField: event.sortField,
       sortOrder: event.sortOrder
     }).subscribe(data => {
       this.data.set(data);
       this.loading.set(false);
     });
   }
   ```

2. **Pagination:**
   ```html
   <app-enhanced-data-table
     [data]="currentPage()"
     [columns]="columns"
   />

   <p-paginator
     [rows]="10"
     [totalRecords]="totalRecords()"
     (onPageChange)="onPageChange($event)"
   />
   ```

---

## Migration Guide

### **From Basic Table to Enhanced Table**

**Before:**
```html
<p-table [value]="data()">
  <ng-template pTemplate="header">
    <tr>
      <th>Name</th>
      <th>Email</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-row>
    <tr>
      <td>{{ row.name }}</td>
      <td>{{ row.email }}</td>
    </tr>
  </ng-template>
</p-table>
```

**After:**
```typescript
columns: EnhancedTableColumn[] = [
  { field: 'name', header: 'Name' },
  { field: 'email', header: 'Email' },
];
```

```html
<app-enhanced-data-table
  [data]="data()"
  [columns]="columns"
/>
```

**Benefits:**
- ✅ Column resizing automatically enabled
- ✅ Column reordering automatically enabled
- ✅ Preferences automatically saved
- ✅ Mobile card view automatically enabled
- ✅ Much less template code

---

## Browser Support

✅ **Fully Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- iOS Safari 14+
- Android Chrome 90+

---

## Next Steps

1. ✅ Implement enhanced data table
2. ✅ Create comprehensive documentation
3. ⏭️ Add unit tests
4. ⏭️ Add E2E tests
5. ⏭️ Migrate existing tables
6. ⏭️ Create Storybook examples

---

**Status:** ✅ Enhanced data table complete
**Documentation:** ✅ Complete
**Testing:** Pending

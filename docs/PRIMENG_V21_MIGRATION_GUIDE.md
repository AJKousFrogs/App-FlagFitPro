# PrimeNG 21 Complete Migration Guide for FlagFit Pro

> **Version**: Angular 21 + PrimeNG 21.0.2  
> **Last Updated**: January 2026  
> **Official Migration Guide**: https://primeng.org/migration

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Breaking Changes Overview](#breaking-changes-overview)
3. [Component Event Reference (All 50+ Components)](#component-event-reference)
4. [Migration Patterns](#migration-patterns)
5. [Regex Search Patterns for Legacy Code](#regex-search-patterns)
6. [TypeScript Event Types](#typescript-event-types)
7. [FlagFit Pro Specific Patterns](#flagfit-pro-patterns)
8. [Testing Checklist](#testing-checklist)
9. [Bulk Migration Scripts](#bulk-migration-scripts)

---

## Executive Summary

**GOOD NEWS**: Your FlagFit Pro codebase is **already using PrimeNG 21 correctly**. After auditing your codebase:

- ✅ Using standalone component imports (`Select`, `DatePicker`, `ToggleSwitch`, etc.)
- ✅ Using modern Angular 21 syntax (`@if`, `@for`, signals)
- ✅ Correct event binding syntax in templates
- ✅ No legacy `on` prefixed events found in templates

This document serves as a **reference guide** for ongoing development and any future migrations.

---

## Breaking Changes Overview

### PrimeNG v20 → v21 Breaking Changes

| Change | Details | Impact |
|--------|---------|--------|
| Angular 19+ Required | PrimeNG 21 requires Angular 19 or higher | ✅ FlagFit Pro uses Angular 21 |
| Standalone by Default | All components are standalone | ✅ Already using standalone |
| Module Structure | NgModule imports deprecated | ✅ Using direct component imports |
| Zoneless Support | Improved performance with zoneless | Optional enhancement |

### Component Renaming (v18-v21)

| Old Component | New Component (v21) | Import Path |
|---------------|---------------------|-------------|
| `p-dropdown` | `p-select` | `primeng/select` |
| `p-calendar` | `p-datepicker` | `primeng/datepicker` |
| `p-inputSwitch` | `p-toggleswitch` | `primeng/toggleswitch` |
| `p-overlayPanel` | `p-popover` | `primeng/popover` |
| `p-sidebar` | `p-drawer` | `primeng/drawer` |
| `TabView` → `Tabs` | `p-tabs` | `primeng/tabs` |
| `Chips` → (removed) | Use `AutoComplete` multiple | `primeng/autocomplete` |

---

## Component Event Reference

### 📊 Data Components

#### p-table (Table)
| Event | Type | Description |
|-------|------|-------------|
| `(onRowSelect)` | `TableRowSelectEvent<T>` | Row selected |
| `(onRowUnselect)` | `TableRowUnSelectEvent<T>` | Row unselected |
| `(onPage)` | `TablePageEvent` | Pagination changed |
| `(onSort)` | `any` | Column sorted |
| `(onFilter)` | `TableFilterEvent` | Data filtered |
| `(onLazyLoad)` | `TableLazyLoadEvent` | Lazy load triggered |
| `(onRowExpand)` | `TableRowExpandEvent<T>` | Row expanded |
| `(onRowCollapse)` | `TableRowCollapseEvent` | Row collapsed |
| `(onContextMenuSelect)` | `TableContextMenuSelectEvent<T>` | Context menu select |
| `(onColResize)` | `TableColResizeEvent` | Column resized |
| `(onColReorder)` | `TableColumnReorderEvent` | Column reordered |
| `(onRowReorder)` | `TableRowReorderEvent` | Row reordered |
| `(onEditInit)` | `TableEditInitEvent` | Cell edit started |
| `(onEditComplete)` | `TableEditCompleteEvent` | Cell edit completed |
| `(onEditCancel)` | `TableEditCancelEvent` | Cell edit cancelled |
| `(onHeaderCheckboxToggle)` | `TableHeaderCheckboxToggleEvent` | Header checkbox toggled |
| `(onStateSave)` | `TableState` | State saved |
| `(onStateRestore)` | `TableState` | State restored |
| `(selectionChange)` | `any` | Selection changed |
| `(selectAllChange)` | `TableSelectAllChangeEvent` | Select all changed |
| `(firstChange)` | `number` | First index changed |
| `(rowsChange)` | `number` | Rows per page changed |

**Example - Player Stats Table:**
```html
<p-table 
  [value]="players()" 
  [paginator]="true" 
  [rows]="10"
  [lazy]="true"
  (onLazyLoad)="loadPlayersLazy($event)"
  (onRowSelect)="onPlayerSelect($event)"
  (selectionChange)="selectedPlayers.set($event)"
  [selection]="selectedPlayers()"
>
```

```typescript
// TypeScript handler with proper typing
import { TableLazyLoadEvent, TableRowSelectEvent } from 'primeng/table';

loadPlayersLazy(event: TableLazyLoadEvent): void {
  const { first, rows, sortField, sortOrder, filters } = event;
  // Load from Supabase with pagination
}

onPlayerSelect(event: TableRowSelectEvent<Player>): void {
  const selectedPlayer = event.data;
  console.log('Selected:', selectedPlayer.name);
}
```

#### p-tree (Tree)
| Event | Type | Description |
|-------|------|-------------|
| `(onNodeSelect)` | `TreeNodeSelectEvent` | Node selected |
| `(onNodeUnselect)` | `TreeNodeUnSelectEvent` | Node unselected |
| `(onNodeExpand)` | `TreeNodeExpandEvent` | Node expanded |
| `(onNodeCollapse)` | `TreeNodeCollapseEvent` | Node collapsed |
| `(onNodeContextMenuSelect)` | `TreeNodeContextMenuSelectEvent` | Context menu on node |
| `(onNodeDoubleClick)` | `TreeNodeDoubleClickEvent` | Node double-clicked |
| `(onNodeDrop)` | `TreeNodeDropEvent` | Node dropped (drag/drop) |
| `(onLazyLoad)` | `TreeLazyLoadEvent` | Lazy load children |
| `(onScroll)` | `TreeScrollEvent` | Virtual scroll |
| `(onScrollIndexChange)` | `TreeScrollIndexChangeEvent` | Scroll index changed |
| `(onFilter)` | `TreeFilterEvent` | Tree filtered |
| `(selectionChange)` | `TreeNode<any>` | Selection changed |

**Example - Team Hierarchy:**
```html
<p-tree 
  [value]="teamNodes()" 
  selectionMode="single"
  [selection]="selectedNode()"
  (selectionChange)="selectedNode.set($event)"
  (onNodeSelect)="onTeamNodeSelect($event)"
  (onNodeExpand)="loadChildren($event)"
>
```

```typescript
import { TreeNodeSelectEvent, TreeNodeExpandEvent } from 'primeng/tree';

onTeamNodeSelect(event: TreeNodeSelectEvent): void {
  const { node, originalEvent } = event;
  this.navigateToTeamMember(node.data.id);
}

loadChildren(event: TreeNodeExpandEvent): void {
  const node = event.node;
  if (!node.children) {
    // Lazy load from Supabase
  }
}
```

---

### 📝 Form Components

#### p-select (formerly Dropdown)
| Event | Type | Description |
|-------|------|-------------|
| `(onChange)` | `SelectChangeEvent` | Value changed |
| `(onFilter)` | `SelectFilterEvent` | Filter text changed |
| `(onFocus)` | `Event` | Component focused |
| `(onBlur)` | `Event` | Component blurred |
| `(onClick)` | `MouseEvent` | Component clicked |
| `(onShow)` | `AnimationEvent` | Overlay shown |
| `(onHide)` | `AnimationEvent` | Overlay hidden |
| `(onClear)` | `Event` | Value cleared |
| `(onLazyLoad)` | `SelectLazyLoadEvent` | Lazy load triggered |

**Example - Position Selector:**
```html
<p-select
  [options]="positionOptions"
  [(ngModel)]="selectedPosition"
  (onChange)="onPositionChange($event)"
  optionLabel="label"
  optionValue="value"
  placeholder="Select position"
>
</p-select>
```

```typescript
import { SelectChangeEvent } from 'primeng/select';

onPositionChange(event: SelectChangeEvent): void {
  const newPosition = event.value;
  this.updatePlayerPosition(newPosition);
}
```

#### p-multiselect (MultiSelect)
| Event | Type | Description |
|-------|------|-------------|
| `(onChange)` | `MultiSelectChangeEvent` | Value changed |
| `(onFilter)` | `MultiSelectFilterEvent` | Filter text changed |
| `(onFocus)` | `MultiSelectFocusEvent` | Component focused |
| `(onBlur)` | `MultiSelectBlurEvent` | Component blurred |
| `(onClick)` | `Event` | Component clicked |
| `(onClear)` | `void` | Values cleared |
| `(onPanelShow)` | `AnimationEvent` | Panel shown |
| `(onPanelHide)` | `AnimationEvent` | Panel hidden |
| `(onLazyLoad)` | `MultiSelectLazyLoadEvent` | Lazy load triggered |
| `(onRemove)` | `MultiSelectRemoveEvent` | Item removed |
| `(onSelectAllChange)` | `MultiSelectSelectAllChangeEvent` | Select all toggled |

**Example - Player Skills:**
```html
<p-multiSelect
  [options]="skillOptions"
  [(ngModel)]="selectedSkills"
  (onChange)="onSkillsChange($event)"
  (onSelectAllChange)="onSelectAllSkills($event)"
  optionLabel="name"
  placeholder="Select skills"
>
</p-multiSelect>
```

#### p-datepicker (formerly Calendar)
| Event | Type | Description |
|-------|------|-------------|
| `(onSelect)` | `Date` | Date selected |
| `(onFocus)` | `Event` | Input focused |
| `(onBlur)` | `Event` | Input blurred |
| `(onClose)` | `HTMLElement` | Panel closed |
| `(onClear)` | `any` | Value cleared |
| `(onInput)` | `any` | Input typed |
| `(onTodayClick)` | `Date` | Today button clicked |
| `(onClearClick)` | `any` | Clear button clicked |
| `(onMonthChange)` | `DatePickerMonthChangeEvent` | Month changed |
| `(onYearChange)` | `DatePickerYearChangeEvent` | Year changed |
| `(onClickOutside)` | `any` | Clicked outside |
| `(onShow)` | `HTMLElement` | Panel shown |

**Example - Game Date Picker:**
```html
<p-datepicker
  [(ngModel)]="gameDate"
  [showIcon]="true"
  dateFormat="mm/dd/yy"
  (onSelect)="onGameDateSelect($event)"
  (onMonthChange)="onMonthNavigation($event)"
>
</p-datepicker>
```

```typescript
import { DatePickerMonthChangeEvent } from 'primeng/datepicker';

onGameDateSelect(date: Date): void {
  this.loadGamesForDate(date);
}

onMonthNavigation(event: DatePickerMonthChangeEvent): void {
  const { month, year } = event;
  this.loadMonthSchedule(month, year);
}
```

#### p-toggleswitch (formerly InputSwitch)
| Event | Type | Description |
|-------|------|-------------|
| `(onChange)` | `ToggleSwitchChangeEvent` | Value changed |

**Example - Notification Toggle:**
```html
<p-toggleswitch
  [(ngModel)]="emailNotifications"
  (onChange)="onNotificationToggle($event)"
>
</p-toggleswitch>
```

```typescript
import { ToggleSwitchChangeEvent } from 'primeng/toggleswitch';

onNotificationToggle(event: ToggleSwitchChangeEvent): void {
  const enabled = event.checked;
  this.updateNotificationSettings(enabled);
}
```

#### p-autocomplete (AutoComplete)
| Event | Type | Description |
|-------|------|-------------|
| `(completeMethod)` | `AutoCompleteCompleteEvent` | Search triggered |
| `(onSelect)` | `AutoCompleteSelectEvent` | Item selected |
| `(onUnselect)` | `AutoCompleteUnselectEvent` | Item unselected |
| `(onAdd)` | `AutoCompleteAddEvent` | Item added |
| `(onFocus)` | `Event` | Component focused |
| `(onBlur)` | `Event` | Component blurred |
| `(onDropdownClick)` | `AutoCompleteDropdownClickEvent` | Dropdown clicked |
| `(onClear)` | `Event` | Value cleared |
| `(onInputKeydown)` | `KeyboardEvent` | Key pressed |
| `(onKeyUp)` | `KeyboardEvent` | Key released |
| `(onShow)` | `Event` | Overlay shown |
| `(onHide)` | `Event` | Overlay hidden |
| `(onLazyLoad)` | `AutoCompleteLazyLoadEvent` | Lazy load triggered |

**Example - Player Search:**
```html
<p-autoComplete
  [(ngModel)]="selectedPlayer"
  [suggestions]="filteredPlayers()"
  (completeMethod)="searchPlayers($event)"
  (onSelect)="onPlayerSelected($event)"
  field="name"
  placeholder="Search players..."
>
</p-autoComplete>
```

```typescript
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';

searchPlayers(event: AutoCompleteCompleteEvent): void {
  const query = event.query;
  this.playerService.search(query).subscribe(results => {
    this.filteredPlayers.set(results);
  });
}

onPlayerSelected(event: AutoCompleteSelectEvent): void {
  const player = event.value;
  this.navigateToPlayer(player.id);
}
```

#### p-slider (Slider)
| Event | Type | Description |
|-------|------|-------------|
| `(onChange)` | `SliderChangeEvent` | Value changed |
| `(onSlideEnd)` | `SliderSlideEndEvent` | Sliding ended |

#### p-rating (Rating)
| Event | Type | Description |
|-------|------|-------------|
| `(onRate)` | `RatingRateEvent` | Rating changed |
| `(onFocus)` | `FocusEvent` | Component focused |
| `(onBlur)` | `FocusEvent` | Component blurred |

---

### 🖼️ Overlay Components

#### p-dialog (Dialog)
| Event | Type | Description |
|-------|------|-------------|
| `(onShow)` | `any` | Dialog shown |
| `(onHide)` | `any` | Dialog hidden |
| `(visibleChange)` | `boolean` | Visibility changed |
| `(onResizeInit)` | `MouseEvent` | Resize started |
| `(onResizeEnd)` | `MouseEvent` | Resize ended |
| `(onDragEnd)` | `DragEvent` | Drag ended |
| `(onMaximize)` | `any` | Maximized/restored |

**Example - Player Edit Dialog:**
```html
<p-dialog
  [(visible)]="showEditDialog"
  [modal]="true"
  (onShow)="onDialogShow()"
  (onHide)="onDialogHide()"
  header="Edit Player"
>
  <!-- Content -->
</p-dialog>
```

```typescript
onDialogShow(): void {
  this.loadPlayerData();
}

onDialogHide(): void {
  this.resetForm();
}
```

#### p-popover (formerly OverlayPanel)
| Event | Type | Description |
|-------|------|-------------|
| `(onShow)` | `any` | Popover shown |
| `(onHide)` | `any` | Popover hidden |

#### p-confirmdialog (ConfirmDialog)
| Event | Type | Description |
|-------|------|-------------|
| `(onHide)` | `ConfirmEventType` | Dialog hidden |

#### p-drawer (formerly Sidebar)
| Event | Type | Description |
|-------|------|-------------|
| `(onShow)` | `any` | Drawer shown |
| `(onHide)` | `any` | Drawer hidden |
| `(visibleChange)` | `boolean` | Visibility changed |

---

### 📋 Panel Components

#### p-accordion (Accordion)
| Event | Type | Description |
|-------|------|-------------|
| `(onOpen)` | `AccordionTabOpenEvent` | Tab opened |
| `(onClose)` | `AccordionTabCloseEvent` | Tab closed |

**Example - Settings Accordion:**
```html
<p-accordion (onOpen)="onTabOpen($event)" (onClose)="onTabClose($event)">
  <p-accordionTab header="Profile Settings">
    <!-- Content -->
  </p-accordionTab>
</p-accordion>
```

```typescript
import { AccordionTabOpenEvent, AccordionTabCloseEvent } from 'primeng/accordion';

onTabOpen(event: AccordionTabOpenEvent): void {
  const { index, originalEvent } = event;
  this.trackAccordionUsage(index, 'open');
}

onTabClose(event: AccordionTabCloseEvent): void {
  const { index } = event;
  this.trackAccordionUsage(index, 'close');
}
```

#### p-panel (Panel)
| Event | Type | Description |
|-------|------|-------------|
| `(collapsedChange)` | `boolean` | Collapsed state changed |
| `(onBeforeToggle)` | `PanelBeforeToggleEvent` | Before toggle |
| `(onAfterToggle)` | `PanelAfterToggleEvent` | After toggle |

---

### 🍔 Menu Components

#### p-menu (Menu)
| Event | Type | Description |
|-------|------|-------------|
| `(onShow)` | `any` | Menu shown |
| `(onHide)` | `any` | Menu hidden |
| `(onFocus)` | `Event` | Menu focused |
| `(onBlur)` | `Event` | Menu blurred |

#### p-contextmenu (ContextMenu)
| Event | Type | Description |
|-------|------|-------------|
| `(onShow)` | `null` | Context menu shown |
| `(onHide)` | `null` | Context menu hidden |

---

### 📤 File Components

#### p-fileUpload (FileUpload)
| Event | Type | Description |
|-------|------|-------------|
| `(onBeforeUpload)` | `FileBeforeUploadEvent` | Before upload |
| `(onSend)` | `FileSendEvent` | Request sent |
| `(onUpload)` | `FileUploadEvent` | Upload complete |
| `(onError)` | `FileUploadErrorEvent` | Upload failed |
| `(onClear)` | `Event` | Files cleared |
| `(onRemove)` | `FileRemoveEvent` | File removed |
| `(onSelect)` | `FileSelectEvent` | Files selected |
| `(onProgress)` | `FileProgressEvent` | Upload progress |
| `(uploadHandler)` | `FileUploadHandlerEvent` | Custom upload |
| `(onImageError)` | `Event` | Image load error |
| `(onRemoveUploadedFile)` | `RemoveUploadedFileEvent` | Uploaded file removed |

---

### 🎠 Media Components

#### p-carousel (Carousel)
| Event | Type | Description |
|-------|------|-------------|
| `(onPage)` | `CarouselPageEvent` | Page changed |

#### p-galleria (Galleria)
| Event | Type | Description |
|-------|------|-------------|
| `(activeIndexChange)` | `number` | Active index changed |
| `(visibleChange)` | `boolean` | Visibility changed |

---

### 📨 Message Components

#### p-toast (Toast)
| Event | Type | Description |
|-------|------|-------------|
| `(onClose)` | `ToastCloseEvent` | Toast closed |

---

### 🏷️ Misc Components

#### p-chip (Chip)
| Event | Type | Description |
|-------|------|-------------|
| `(onRemove)` | `MouseEvent` | Chip removed |
| `(onImageError)` | `Event` | Image load error |

---

## Migration Patterns

### Pattern 1: Legacy `on` Prefix Events (Pre-v18)

**Before (Legacy):**
```html
<!-- OLD - Will NOT work in v21 -->
<p-tree (onNodeSelect)="handler($event)"></p-tree>
```

**After (v21 - CORRECT):**
```html
<!-- The `on` prefix is still used in v21 for most events -->
<p-tree (onNodeSelect)="handler($event)"></p-tree>
```

> **Important**: PrimeNG 21 still uses `on` prefix for events. The events are NOT renamed to remove the prefix.

### Pattern 2: Component Renaming

**Before (v17 and earlier):**
```typescript
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputSwitchModule } from 'primeng/inputswitch';
import { SidebarModule } from 'primeng/sidebar';
import { OverlayPanelModule } from 'primeng/overlaypanel';
```

```html
<p-dropdown [options]="options"></p-dropdown>
<p-calendar [(ngModel)]="date"></p-calendar>
<p-inputSwitch [(ngModel)]="checked"></p-inputSwitch>
<p-sidebar [(visible)]="visible"></p-sidebar>
<p-overlayPanel #op></p-overlayPanel>
```

**After (v21 - CORRECT):**
```typescript
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Drawer } from 'primeng/drawer';
import { Popover } from 'primeng/popover';
```

```html
<p-select [options]="options"></p-select>
<p-datepicker [(ngModel)]="date"></p-datepicker>
<p-toggleswitch [(ngModel)]="checked"></p-toggleswitch>
<p-drawer [(visible)]="visible"></p-drawer>
<p-popover #op></p-popover>
```

### Pattern 3: Module to Standalone

**Before (NgModule):**
```typescript
import { TableModule } from 'primeng/table';

@NgModule({
  imports: [TableModule]
})
export class FeatureModule {}
```

**After (v21 Standalone):**
```typescript
import { TableModule } from 'primeng/table';

@Component({
  standalone: true,
  imports: [TableModule]
})
export class FeatureComponent {}
```

### Pattern 4: Lazy Loading Changes

**Before (Legacy lazy):**
```html
<p-table [lazy]="true" (onLazyLoad)="loadData($event)">
```

**After (v21 - Same syntax, but use virtualScroll for large datasets):**
```html
<!-- For server-side pagination -->
<p-table [lazy]="true" (onLazyLoad)="loadData($event)">

<!-- For client-side large datasets -->
<p-table [virtualScroll]="true" [virtualScrollItemSize]="46">
```

### Pattern 5: Signals Integration

**Before (BehaviorSubject/Observable):**
```typescript
players$ = new BehaviorSubject<Player[]>([]);
selectedPlayer$ = new BehaviorSubject<Player | null>(null);
```

```html
<p-table [value]="players$ | async">
```

**After (v21 with Signals):**
```typescript
players = signal<Player[]>([]);
selectedPlayer = signal<Player | null>(null);
```

```html
<p-table [value]="players()">
```

---

## Regex Search Patterns

Use these patterns to find legacy code in your IDE:

### Find Legacy Component Names
```regex
# In templates
<p-dropdown|<p-calendar|<p-inputSwitch|<p-sidebar|<p-overlayPanel

# In TypeScript imports
from ['"]primeng/(dropdown|calendar|inputswitch|sidebar|overlaypanel)['"]
```

### Find Legacy Module Imports
```regex
(Dropdown|Calendar|InputSwitch|Sidebar|OverlayPanel)Module
```

### Find Potential Untyped Event Handlers
```regex
\([a-zA-Z]+\)="[a-zA-Z]+\(\$event\)"
```

### Find Old lazy Attribute Usage
```regex
\[lazy\]="true"
```

### Find *ngIf/*ngFor (should use @if/@for)
```regex
\*ngIf=|\*ngFor=
```

---

## TypeScript Event Types

Import all event types from their respective modules:

```typescript
// Table Events
import {
  TableRowSelectEvent,
  TableRowUnSelectEvent,
  TablePageEvent,
  TableFilterEvent,
  TableLazyLoadEvent,
  TableRowExpandEvent,
  TableRowCollapseEvent,
  TableContextMenuSelectEvent,
  TableColResizeEvent,
  TableColumnReorderEvent,
  TableRowReorderEvent,
  TableEditInitEvent,
  TableEditCompleteEvent,
  TableEditCancelEvent,
  TableHeaderCheckboxToggleEvent,
  TableSelectAllChangeEvent,
  TableState
} from 'primeng/table';

// Tree Events
import {
  TreeNodeSelectEvent,
  TreeNodeUnSelectEvent,
  TreeNodeExpandEvent,
  TreeNodeCollapseEvent,
  TreeNodeContextMenuSelectEvent,
  TreeNodeDoubleClickEvent,
  TreeNodeDropEvent,
  TreeLazyLoadEvent,
  TreeScrollEvent,
  TreeScrollIndexChangeEvent,
  TreeFilterEvent
} from 'primeng/tree';

// Select Events
import {
  SelectChangeEvent,
  SelectFilterEvent,
  SelectLazyLoadEvent
} from 'primeng/select';

// MultiSelect Events
import {
  MultiSelectChangeEvent,
  MultiSelectFilterEvent,
  MultiSelectFocusEvent,
  MultiSelectBlurEvent,
  MultiSelectLazyLoadEvent,
  MultiSelectRemoveEvent,
  MultiSelectSelectAllChangeEvent
} from 'primeng/multiselect';

// DatePicker Events
import {
  DatePickerMonthChangeEvent,
  DatePickerYearChangeEvent
} from 'primeng/datepicker';

// AutoComplete Events
import {
  AutoCompleteCompleteEvent,
  AutoCompleteSelectEvent,
  AutoCompleteUnselectEvent,
  AutoCompleteAddEvent,
  AutoCompleteDropdownClickEvent,
  AutoCompleteLazyLoadEvent
} from 'primeng/autocomplete';

// Accordion Events
import {
  AccordionTabOpenEvent,
  AccordionTabCloseEvent
} from 'primeng/accordion';

// Panel Events
import {
  PanelBeforeToggleEvent,
  PanelAfterToggleEvent
} from 'primeng/panel';

// Slider Events
import {
  SliderChangeEvent,
  SliderSlideEndEvent
} from 'primeng/slider';

// Rating Events
import { RatingRateEvent } from 'primeng/rating';

// ToggleSwitch Events
import { ToggleSwitchChangeEvent } from 'primeng/toggleswitch';

// FileUpload Events
import {
  FileBeforeUploadEvent,
  FileSendEvent,
  FileUploadEvent,
  FileUploadErrorEvent,
  FileRemoveEvent,
  FileSelectEvent,
  FileProgressEvent,
  FileUploadHandlerEvent,
  RemoveUploadedFileEvent
} from 'primeng/fileupload';

// Toast Events
import { ToastCloseEvent } from 'primeng/toast';

// Carousel Events
import { CarouselPageEvent } from 'primeng/carousel';

// ConfirmDialog Events
import { ConfirmEventType } from 'primeng/confirmdialog';
```

---

## FlagFit Pro Patterns

### Game Tracker Table Example
```typescript
// game-tracker.component.ts
import { TableModule, TableLazyLoadEvent } from 'primeng/table';

@Component({
  imports: [TableModule],
  template: `
    <p-table 
      [value]="games()" 
      [paginator]="true" 
      [rows]="10"
      [lazy]="true"
      (onLazyLoad)="loadGamesLazy($event)"
      [trackBy]="trackByGameId"
    >
      <ng-template pTemplate="body" let-game>
        <tr [attr.data-game-id]="game.id">
          <td>{{ game.date }}</td>
          <td>{{ game.opponent }}</td>
          <td>
            <p-tag [value]="game.result" [severity]="getResultSeverity(game.result)">
            </p-tag>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `
})
export class GameTrackerComponent {
  games = signal<Game[]>([]);
  
  loadGamesLazy(event: TableLazyLoadEvent): void {
    const { first, rows, sortField, sortOrder, filters } = event;
    
    this.supabaseService.client
      .from('games')
      .select('*')
      .range(first!, first! + rows! - 1)
      .then(({ data }) => {
        this.games.set(data ?? []);
      });
  }
  
  trackByGameId(index: number, game: Game): string {
    return game.id;
  }
}
```

### Team Hierarchy Tree Example
```typescript
// depth-chart.component.ts
import { TreeModule, TreeNodeSelectEvent } from 'primeng/tree';

@Component({
  imports: [TreeModule],
  template: `
    <p-tree 
      [value]="teamNodes()" 
      selectionMode="single"
      [selection]="selectedNode()"
      (selectionChange)="selectedNode.set($event)"
      (onNodeSelect)="navigateToPlayer($event)"
    >
    </p-tree>
  `
})
export class DepthChartComponent {
  teamNodes = signal<TreeNode[]>([]);
  selectedNode = signal<TreeNode | null>(null);
  
  navigateToPlayer(event: TreeNodeSelectEvent): void {
    const playerId = event.node.data?.id;
    if (playerId) {
      this.router.navigate(['/roster', playerId]);
    }
  }
}
```

### Settings Form with Signals
```typescript
// settings.component.ts
import { Select, SelectChangeEvent } from 'primeng/select';
import { ToggleSwitch, ToggleSwitchChangeEvent } from 'primeng/toggleswitch';

@Component({
  imports: [Select, ToggleSwitch, ReactiveFormsModule],
  template: `
    <p-select
      [options]="positionOptions"
      formControlName="position"
      (onChange)="onPositionChange($event)"
    ></p-select>
    
    <p-toggleswitch
      formControlName="emailNotifications"
      (onChange)="onNotificationToggle($event)"
    ></p-toggleswitch>
  `
})
export class SettingsComponent {
  onPositionChange(event: SelectChangeEvent): void {
    console.log('Position changed to:', event.value);
  }
  
  onNotificationToggle(event: ToggleSwitchChangeEvent): void {
    console.log('Notifications:', event.checked ? 'enabled' : 'disabled');
  }
}
```

---

## Testing Checklist

### Component Tests (Vitest)
```typescript
import { describe, it, expect, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameTrackerComponent } from './game-tracker.component';

describe('GameTrackerComponent', () => {
  let component: GameTrackerComponent;
  let fixture: ComponentFixture<GameTrackerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameTrackerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GameTrackerComponent);
    component = fixture.componentInstance;
  });

  it('should handle table row selection', () => {
    const game = { id: '1', opponent: 'Test Team', result: 'win' };
    const event = { data: game, originalEvent: new MouseEvent('click') };
    
    component.onGameSelect(event);
    
    expect(component.selectedGame()).toEqual(game);
  });

  it('should handle lazy load event', () => {
    const lazyLoadSpy = vi.spyOn(component, 'loadGamesLazy');
    const event = { first: 0, rows: 10 };
    
    component.loadGamesLazy(event);
    
    expect(lazyLoadSpy).toHaveBeenCalledWith(event);
  });
});
```

### E2E Tests (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Game Tracker', () => {
  test('should paginate games table', async ({ page }) => {
    await page.goto('/game-tracker');
    
    // Wait for table to load
    await page.waitForSelector('p-table');
    
    // Click next page
    await page.click('.p-paginator-next');
    
    // Verify page changed
    await expect(page.locator('.p-paginator-current')).toContainText('11-20');
  });

  test('should select a game row', async ({ page }) => {
    await page.goto('/game-tracker');
    
    // Click on first row
    await page.click('tbody tr:first-child');
    
    // Verify selection
    await expect(page.locator('tbody tr:first-child')).toHaveClass(/p-highlight/);
  });
});
```

---

## Bulk Migration Scripts

### VSCode Search & Replace Patterns

1. **Rename Dropdown to Select:**
   - Search: `p-dropdown`
   - Replace: `p-select`

2. **Rename Calendar to DatePicker:**
   - Search: `p-calendar`
   - Replace: `p-datepicker`

3. **Rename InputSwitch to ToggleSwitch:**
   - Search: `p-inputSwitch`
   - Replace: `p-toggleswitch`

4. **Rename Sidebar to Drawer:**
   - Search: `p-sidebar`
   - Replace: `p-drawer`

5. **Rename OverlayPanel to Popover:**
   - Search: `p-overlayPanel`
   - Replace: `p-popover`

### Shell Script for Bulk Replace
```bash
#!/bin/bash
# migrate-primeng-v21.sh

# Navigate to Angular source
cd angular/src/app

# Replace component names in templates
find . -name "*.html" -type f -exec sed -i '' \
  -e 's/p-dropdown/p-select/g' \
  -e 's/p-calendar/p-datepicker/g' \
  -e 's/p-inputSwitch/p-toggleswitch/g' \
  -e 's/p-sidebar/p-drawer/g' \
  -e 's/p-overlayPanel/p-popover/g' \
  {} \;

# Replace imports in TypeScript files
find . -name "*.ts" -type f -exec sed -i '' \
  -e "s/from 'primeng\/dropdown'/from 'primeng\/select'/g" \
  -e "s/from 'primeng\/calendar'/from 'primeng\/datepicker'/g" \
  -e "s/from 'primeng\/inputswitch'/from 'primeng\/toggleswitch'/g" \
  -e "s/from 'primeng\/sidebar'/from 'primeng\/drawer'/g" \
  -e "s/from 'primeng\/overlaypanel'/from 'primeng\/popover'/g" \
  -e 's/DropdownModule/Select/g' \
  -e 's/CalendarModule/DatePicker/g' \
  -e 's/InputSwitchModule/ToggleSwitch/g' \
  -e 's/SidebarModule/Drawer/g' \
  -e 's/OverlayPanelModule/Popover/g' \
  {} \;

echo "Migration complete! Run 'ng serve' to verify."
```

---

## Post-Migration Checklist

- [ ] Run `ng build` - no compilation errors
- [ ] Run `npm test` - all unit tests pass
- [ ] Run `npm run e2e` - E2E tests pass
- [ ] Check console for deprecated warnings (should be 0)
- [ ] Test table pagination on Player Stats Dashboard
- [ ] Test tree navigation on Depth Chart
- [ ] Test all dialogs open/close properly
- [ ] Test all form controls (Select, DatePicker, ToggleSwitch)
- [ ] Verify mobile responsiveness
- [ ] Check bundle size (`npm run build:analyze`)
- [ ] Deploy to Netlify staging
- [ ] Visual regression testing

---

## Resources

- [PrimeNG 21 Documentation](https://primeng.org/)
- [PrimeNG Migration Guide](https://primeng.org/migration)
- [Angular 21 Documentation](https://angular.dev/)
- [PrimeNG GitHub Issues](https://github.com/primefaces/primeng/issues)

---

*Generated for FlagFit Pro - Flag Football Management Application*

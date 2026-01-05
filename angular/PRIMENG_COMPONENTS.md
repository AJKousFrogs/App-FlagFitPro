# PrimeNG Components Used in Angular 21 App

This document provides a comprehensive overview of all PrimeNG components used in the Flag Football Angular application.

> **🎨 Design System Integration**: For complete design system guidelines including colors, typography, spacing, shadows, and accessibility standards, see **[PRIMENG_DESIGN_SYSTEM_INTEGRATION.md](./PRIMENG_DESIGN_SYSTEM_INTEGRATION.md)**

## Package Information

- **PrimeNG Version**: `^21.0.2`
- **PrimeIcons Version**: `^7.0.0`
- **Angular Version**: 21.x

## Quick Links

- 📘 **[Design System Integration Guide](./PRIMENG_DESIGN_SYSTEM_INTEGRATION.md)** - Colors, typography, spacing, shadows, accessibility
- 🔍 **[Cross-Check Report](./PRIMENG_DESIGN_SYSTEM_CROSSCHECK.md)** - Design system compliance verification
- 🎨 **Design Tokens**: `src/assets/styles/design-system-tokens.scss`
- 🎭 **PrimeNG Theme**: `src/assets/styles/primeng-theme.scss`

## Components by Category

### Form Components

#### 1. Button (`p-button` / `ButtonModule`)

**Module**: `primeng/button`

**Usage**: Primary interactive element for actions throughout the app

- Settings page: Save changes, change password, delete account, 2FA setup
- Supplement tracker: Add supplement, action buttons
- Training components: Various action triggers
- Search panel: Clear search button

**Design**: **Raised Material Design style** with 8px border radius (`--radius-lg`) and elevated shadows.

**Key Properties**:

- `label` - Button text
- `icon` - Icon class (e.g., "pi pi-save")
- `size` - Button size: `"small"` (36px), default (44px), `"large"` (52px)
- `[text]` - Text-only button variant (no background)
- `[outlined]` - Outlined button variant (border only)
- `styleClass` - Additional CSS classes
- `(onClick)` - Click event handler

**Size Guidelines**:

- `small` (36px): Desktop only, below touch target minimum
- Default (44px): **Recommended minimum** - meets 44px touch target
- `large` (52px): Enhanced visibility and touch target

**Example**:

```html
<!-- Primary action button with icon -->
<p-button label="Save Changes" icon="pi pi-save" (onClick)="saveSettings()">
</p-button>

<!-- Icon-only button with accessibility label -->
<p-button
  icon="pi pi-plus"
  [text]="true"
  size="small"
  pTooltip="Add supplement"
  aria-label="Add supplement"
  (onClick)="openAddDialog()"
>
</p-button>

<!-- Secondary outlined button -->
<p-button
  label="Cancel"
  icon="pi pi-times"
  [outlined]="true"
  (onClick)="cancel()"
>
</p-button>
```

**Styling**:

- **Border Radius**: 8px (`--radius-lg`) - Raised button style
- **Elevation**: Material Design multi-layer shadows
  - Resting: Raised depth with green-tinted ambient shadow
  - Hover: Enhanced elevation with 2px lift
  - Active: Pressed state with reduced shadow
  - Focus: Green focus ring with maintained elevation
- **Typography**: Poppins semibold (600), 15px
- **Padding**: 12px vertical, 24px horizontal

**Color Variants**:

- **Primary** (default): Green background (#089949), white text
- **Secondary**: Light background, dark text
- **Success/Info/Warning/Danger**: Semantic color backgrounds
- **Text**: Transparent background, green text
- **Outlined**: Transparent background, green border and text

> **⚠️ Accessibility**: Always provide `aria-label` for icon-only buttons. Use default (44px) or large (52px) size on mobile for proper touch targets.

---

#### 2. InputText (`pInputText` / `InputTextModule`)

**Module**: `primeng/inputtext`

**Usage**: Standard text input fields

- Settings: Display name, email, phone, jersey number, team name
- Search panel: Main search input
- Supplement tracker: Supplement name and dosage
- Password dialogs: Delete confirmation

**Key Properties**:

- `pInputText` - Directive for styling
- `[(ngModel)]` / `formControlName` - Two-way binding
- `placeholder` - Placeholder text
- `autocomplete` - Browser autocomplete settings

**Example**:

```html
<input
  id="settings-displayName"
  type="text"
  pInputText
  formControlName="displayName"
  placeholder="Enter your display name"
  autocomplete="name"
/>
```

---

#### 3. Select (`p-select` / `Select` / `SelectModule`)

**Module**: `primeng/select`

**Usage**: Dropdown selection component

- Settings: Position selector, profile visibility, language selection
- Supplement tracker: Timing and category selection
- Tournament calendar: Various dropdown options
- QB throwing tracker: Selection fields

**Key Properties**:

- `[options]` - Array of options
- `optionLabel` - Property to display
- `optionValue` - Property for value
- `placeholder` - Placeholder text
- `appendTo` - Where to append overlay (e.g., "body")
- `[showClear]` - Show clear button

**Example**:

```html
<p-select
  id="language"
  formControlName="language"
  [options]="languageOptions"
  optionLabel="label"
  optionValue="value"
  placeholder="Select language"
  appendTo="body"
>
  <ng-template pTemplate="item" let-lang>
    <div class="lang-item">
      <span class="lang-flag">{{ lang.flag }}</span>
      <span class="lang-label">{{ lang.label }}</span>
    </div>
  </ng-template>
</p-select>
```

---

#### 4. Checkbox (`p-checkbox` / `Checkbox` / `CheckboxModule`)

**Module**: `primeng/checkbox`

**Usage**: Boolean selection and multi-selection

- Supplement tracker: Mark supplements as taken
- Tournament calendar: Various boolean options
- QB throwing tracker: Configuration options
- Player settings dialog: Multiple selections

**Key Properties**:

- `[binary]` - Boolean mode
- `[(ngModel)]` - Two-way binding
- `inputId` - Input element ID
- `(onChange)` - Change event handler

**Example**:

```html
<p-checkbox
  [ngModel]="supp.taken"
  [binary]="true"
  (onChange)="toggleSupplement(supp)"
  [inputId]="'morning-' + supp.id"
></p-checkbox>
```

---

#### 5. RadioButton (`p-radioButton` / `RadioButtonModule`)

**Module**: `primeng/radiobutton`

**Usage**: Single selection from multiple options

- Game tracker: Play type selection (pass play, run play, flag pull, interception, pass deflection)

**Key Properties**:

- `name` - Radio group name
- `value` - Radio button value
- `formControlName` - Form control binding
- `inputId` - Input element ID

**Example**:

```html
<p-radioButton
  name="playType"
  value="pass_play"
  formControlName="playType"
  inputId="pass_play"
></p-radioButton>
<label for="pass_play">Pass Play</label>
```

---

#### 6. Password (`p-password` / `PasswordModule`)

**Module**: `primeng/password`

**Usage**: Password input with strength meter and toggle visibility

- Settings: Change password dialog (current, new, confirm passwords)

**Key Properties**:

- `[feedback]` - Show password strength feedback
- `[toggleMask]` - Show/hide password toggle
- `inputId` - Input element ID
- `formControlName` - Form control binding
- `autocomplete` - Autocomplete attribute

**Example**:

```html
<p-password
  inputId="settings-newPassword"
  formControlName="newPassword"
  [toggleMask]="true"
  placeholder="Create a strong password"
  styleClass="password-input"
  autocomplete="new-password"
></p-password>
```

---

#### 7. Slider (`p-slider` / `Slider` / `SliderModule`)

**Module**: `primeng/slider`

**Usage**: Numeric input with slider interface

- Session log form: RPE (Rate of Perceived Exertion) tracking
- QB throwing tracker: Various numeric inputs

**Key Properties**:

- `[(ngModel)]` - Two-way binding
- `[min]` / `[max]` - Range values
- `[step]` - Step increment

**Example**:

```typescript
import { Slider } from "primeng/slider";
```

---

#### 8. InputNumber (`p-inputnumber` / `InputNumber` / `InputNumberModule`)

**Module**: `primeng/inputnumber`

**Usage**: Formatted numeric input

- Session log form: Numeric data entry
- Tournament calendar: Numeric fields
- QB throwing tracker: Throw counts, metrics
- Game tracker: Score tracking

**Key Properties**:

- `[(ngModel)]` - Two-way binding
- `[min]` / `[max]` - Range constraints
- `[showButtons]` - Show increment/decrement buttons
- `mode` - Input mode (decimal, currency)

---

#### 9. Textarea (`p-textarea` / `Textarea` / `TextareaModule`)

**Module**: `primeng/textarea`

**Usage**: Multi-line text input

- Session log form: Notes and comments
- Game tracker: Play notes
- Parent dashboard: Feedback and comments

**Key Properties**:

- `[(ngModel)]` - Two-way binding
- `rows` - Number of visible rows
- `autoResize` - Auto-resize based on content

**Example**:

```typescript
import { Textarea } from "primeng/textarea";
```

---

#### 10. DatePicker (`p-datepicker` / `DatePicker` / `DatePickerModule`)

**Module**: `primeng/datepicker`

**Usage**: Date selection component

- Player settings dialog: Date fields
- Tournament calendar: Tournament dates and scheduling
- Game tracker: Game dates

**Key Properties**:

- `[(ngModel)]` - Two-way binding
- `[showIcon]` - Show calendar icon
- `dateFormat` - Date display format
- `[inline]` - Inline calendar display

**Example**:

```typescript
import { DatePicker } from "primeng/datepicker";
```

---

#### 11. MultiSelect (`p-multiselect` / `MultiSelect`)

**Module**: `primeng/multiselect`

**Usage**: Multiple selection dropdown

- Player settings dialog: Select multiple options

**Key Properties**:

- `[options]` - Array of options
- `[(ngModel)]` - Two-way binding
- `optionLabel` - Property to display
- `placeholder` - Placeholder text

**Example**:

```typescript
import { MultiSelect } from "primeng/multiselect";
```

---

#### 12. ToggleSwitch (`p-toggleswitch` / `ToggleSwitch` / `ToggleSwitchModule`)

**Module**: `primeng/toggleswitch`

**Usage**: Toggle switch for boolean settings

- Settings: Notification preferences (email, push, training reminders)
- Settings: Privacy settings (show stats publicly)
- Parent dashboard: Youth settings management

**Key Properties**:

- `formControlName` - Form control binding
- `[(ngModel)]` - Two-way binding

**Example**:

```html
<p-toggleswitch formControlName="emailNotifications"></p-toggleswitch>
```

```typescript
import { ToggleSwitch } from "primeng/toggleswitch";
import { ToggleSwitchModule } from "primeng/toggleswitch";
```

---

#### 13. SelectButton (`SelectButtonModule`)

**Module**: `primeng/selectbutton`

**Usage**: Toggle button group for selecting from predefined options

- Live game tracker: Quick selection options

**Key Properties**:

- `[options]` - Array of options
- `[(ngModel)]` - Two-way binding
- `optionLabel` - Property to display
- `optionValue` - Value property

**Example**:

```typescript
import { SelectButtonModule } from "primeng/selectbutton";
```

---

#### 14. ToggleButton (`ToggleButtonModule`)

**Module**: `primeng/togglebutton`

**Usage**: Single toggle button for on/off states

**Example**:

```typescript
import { ToggleButtonModule } from "primeng/togglebutton";
```

---

#### 15. AutoComplete (`AutoCompleteModule`)

**Module**: `primeng/autocomplete`

**Usage**: Autocomplete input with suggestions

**Key Properties**:

- `[suggestions]` - Array of suggestions
- `(completeMethod)` - Method to filter suggestions
- `field` - Property to display

**Example**:

```typescript
import { AutoCompleteModule } from "primeng/autocomplete";
```

---

#### 16. FileUpload (`FileUploadModule`)

**Module**: `primeng/fileupload`

**Usage**: File upload component with drag & drop

**Key Properties**:

- `name` - Form field name
- `url` - Upload URL
- `accept` - Accepted file types
- `maxFileSize` - Maximum file size

**Example**:

```typescript
import { FileUploadModule } from "primeng/fileupload";
```

---

### Data Display Components

#### 17. Tag (`p-tag` / `TagModule`)

**Module**: `primeng/tag`

**Usage**: Label/badge for categorization and status

- Supplement tracker: Category tags with color coding
- Exercise card: Exercise type tags
- Protocol block: Status indicators
- Tournament calendar: Event type tags
- QB throwing tracker: Status tags

**Key Properties**:

- `[value]` - Tag text
- `[severity]` - Color scheme (success, info, warning, danger)
- `[rounded]` - Rounded corners
- `styleClass` - Custom CSS class

**Example**:

```html
<p-tag
  [value]="supp.category | titlecase"
  [severity]="getCategoryColor(supp.category)"
  [rounded]="true"
  styleClass="category-tag"
></p-tag>
```

---

#### 18. Card (`p-card` / `CardModule`)

**Module**: `primeng/card`

**Usage**: Container component for content grouping

- QB throwing tracker: Main content container
- Coach analytics: Stats cards
- Game tracker: Game summary cards
- Parent dashboard: Child cards

**Key Properties**:

- `header` - Card header
- `subheader` - Card subheader
- `styleClass` - Custom CSS class

**Example**:

```typescript
import { CardModule } from "primeng/card";
```

---

#### 19. Avatar (`p-avatar` / `AvatarModule`)

**Module**: `primeng/avatar`

**Usage**: User avatar display

- Header: User profile avatar
- Coach analytics: Player avatars in leaderboard
- Parent dashboard: Child avatars

**Key Properties**:

- `image` - Avatar image URL
- `icon` - Icon class for icon avatar
- `label` - Text for text avatar
- `size` - Size (normal, large, xlarge)
- `shape` - Shape (square, circle)

**Example**:

```html
<p-avatar
  [image]="player.profileImageUrl"
  shape="circle"
  size="large"
></p-avatar>
```

```typescript
import { AvatarModule } from "primeng/avatar";
```

---

#### 20. Badge (`p-badge` / `BadgeModule`)

**Module**: `primeng/badge`

**Usage**: Notification badges and counts

- Header: Notification count badge
- Parent dashboard: Pending approvals badge

**Key Properties**:

- `[value]` - Badge value/count
- `severity` - Color scheme
- `size` - Badge size

**Example**:

```html
<p-badge [value]="notificationCount()" severity="danger"></p-badge>
```

```typescript
import { BadgeModule } from "primeng/badge";
```

---

#### 21. Chip (`Chip`)

**Module**: `primeng/chip`

**Usage**: Small element for tags, categories, or removable items

**Key Properties**:

- `label` - Chip text
- `image` - Image URL
- `icon` - Icon class
- `removable` - Show remove icon

**Example**:

```typescript
import { Chip } from "primeng/chip";
```

---

#### 22. ProgressBar (`p-progressbar` / `ProgressBar` / `ProgressBarModule`)

**Module**: `primeng/progressbar`

**Usage**: Progress indication

- Protocol block: Exercise completion progress
- QB throwing tracker: Throwing metrics progress
- Coach analytics: Team progress metrics

**Key Properties**:

- `[value]` - Progress percentage (0-100)
- `[showValue]` - Display value text
- `mode` - Progress mode (determinate, indeterminate)

**Example**:

```html
<p-progressBar [value]="progressPercent()"></p-progressBar>
```

```typescript
import { ProgressBarModule } from "primeng/progressbar";
```

---

#### 23. ProgressSpinner (`ProgressSpinnerModule`)

**Module**: `primeng/progressspinner`

**Usage**: Loading spinner for async operations

**Key Properties**:

- `strokeWidth` - Spinner stroke width
- `fill` - Fill color
- `animationDuration` - Animation duration

**Example**:

```typescript
import { ProgressSpinnerModule } from "primeng/progressspinner";
```

---

#### 24. Skeleton (`p-skeleton` / `SkeletonModule`)

**Module**: `primeng/skeleton`

**Usage**: Loading placeholder

- Supplement tracker: Loading state for supplement list
- Coach analytics: Loading skeletons
- Parent dashboard: Content loading states

**Key Properties**:

- `shape` - Shape (rectangle, circle, square)
- `size` - Size for circle/square
- `width` / `height` - Dimensions for rectangle

**Example**:

```html
<p-skeleton shape="circle" size="24px"></p-skeleton>
<p-skeleton width="80%" height="20px"></p-skeleton>
```

```typescript
import { SkeletonModule } from "primeng/skeleton";
```

---

#### 25. Table (`p-table` / `TableModule`)

**Module**: `primeng/table`

**Usage**: Data table with sorting, filtering, and pagination

- Game tracker: Plays table and games history table
- Coach analytics: Player statistics tables

**Key Properties**:

- `[value]` - Array of data
- `[paginator]` - Enable pagination
- `[rows]` - Rows per page
- `[sortField]` - Default sort field
- `[globalFilterFields]` - Fields for global search

**Example**:

```html
<p-table [value]="plays()" [paginator]="true" [rows]="10">
  <ng-template pTemplate="header">
    <tr>
      <th>Play Type</th>
      <th>Result</th>
      <th>Yards</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-play>
    <tr>
      <td>{{ play.playType }}</td>
      <td>{{ play.result }}</td>
      <td>{{ play.yards }}</td>
    </tr>
  </ng-template>
</p-table>
```

```typescript
import { TableModule } from "primeng/table";
```

---

#### 26. Chart (`p-chart` / `ChartModule` / `UIChart`)

**Module**: `primeng/chart`

**Usage**: Chart.js integration for data visualization

- Coach analytics: Classification charts, trend charts, feedback charts

**Key Properties**:

- `type` - Chart type (line, bar, pie, doughnut, radar, polarArea)
- `[data]` - Chart data
- `[options]` - Chart.js options

**Example**:

```html
<p-chart type="bar" [data]="chartData" [options]="chartOptions"></p-chart>
```

```typescript
import { ChartModule } from "primeng/chart";
import { UIChart } from "primeng/chart";
```

---

#### 27. Timeline (`TimelineModule`)

**Module**: `primeng/timeline`

**Usage**: Display events in chronological order

- Parent dashboard: AI activity feed timeline

**Key Properties**:

- `[value]` - Array of events
- `layout` - Layout mode (vertical, horizontal)
- `align` - Alignment (left, right, alternate)

**Example**:

```typescript
import { TimelineModule } from "primeng/timeline";
```

---

#### 28. Knob (`KnobModule`)

**Module**: `primeng/knob`

**Usage**: Circular input/display for numeric values

**Key Properties**:

- `[(ngModel)]` - Two-way binding
- `[min]` / `[max]` - Range
- `valueColor` - Value color
- `rangeColor` - Range color

**Example**:

```typescript
import { KnobModule } from "primeng/knob";
```

---

### Navigation Components

#### 29. Tabs (`p-tabs` / `p-tabpanel` / `Tabs` / `TabPanel` / `TabsModule`)

**Module**: `primeng/tabs`

**Usage**: Tab navigation for organizing content

- Coach analytics: Classification, Trends, Leaderboard, Feedback tabs
- Parent dashboard: My Athletes, Activity Feed, Notifications tabs

**Key Properties**:

- `[value]` - Active tab index
- `(onChange)` - Tab change event
- `header` - Tab header text

**Example**:

```html
<p-tabs [value]="activeTabIndex" (onChange)="onTabChange($event)">
  <p-tabpanel header="Classification">
    <!-- Classification content -->
  </p-tabpanel>
  <p-tabpanel header="Trends">
    <!-- Trends content -->
  </p-tabpanel>
</p-tabs>
```

```typescript
import { Tabs, TabPanel } from "primeng/tabs";
import { TabsModule } from "primeng/tabs";
```

---

#### 30. Steps (`StepsModule`)

**Module**: `primeng/steps`

**Usage**: Step indicator for multi-step processes

**Key Properties**:

- `[model]` - Array of MenuItem objects
- `[activeIndex]` - Current active step
- `[readonly]` - Read-only mode

**Example**:

```typescript
import { StepsModule } from "primeng/steps";
```

---

#### 31. Breadcrumb (`BreadcrumbModule`)

**Module**: `primeng/breadcrumb`

**Usage**: Breadcrumb navigation trail

**Key Properties**:

- `[model]` - Array of MenuItem objects
- `[home]` - Home icon item

**Example**:

```typescript
import { BreadcrumbModule } from "primeng/breadcrumb";
```

---

#### 32. Menu (`MenuModule` / `MenuItem`)

**Module**: `primeng/menu`

**Usage**: Menu component for navigation and actions

**Key Properties**:

- `[model]` - Array of MenuItem objects
- `[popup]` - Popup mode
- `[appendTo]` - Append target

**Example**:

```typescript
import { MenuModule } from "primeng/menu";
import { MenuItem } from "primeng/api";
```

---

### Overlay Components

#### 33. Dialog (`p-dialog` / `Dialog` / `DialogModule`)

**Module**: `primeng/dialog`

**Usage**: Modal dialogs throughout the app

- Search panel: Command palette dialog
- Settings: Change password, delete account, 2FA setup/disable, active sessions
- Supplement tracker: Add supplement dialog
- Tournament calendar: Event management
- QB throwing tracker: Various dialogs
- Live game tracker: Play entry dialogs

**Key Properties**:

- `[(visible)]` - Dialog visibility
- `[modal]` - Modal backdrop
- `[style]` - Inline styles (width, etc.)
- `[closable]` - Show close button
- `[showHeader]` - Show header section
- `[dismissableMask]` - Click outside to close
- `position` - Dialog position
- `styleClass` - Custom CSS class
- `header` - Header text

**Example**:

```html
<p-dialog
  [(visible)]="showChangePasswordDialog"
  [modal]="true"
  [style]="{ width: '440px' }"
  [closable]="true"
  [showHeader]="false"
  styleClass="password-dialog"
>
  <!-- Dialog content -->
</p-dialog>
```

```typescript
import { DialogModule } from "primeng/dialog";
import { Dialog } from "primeng/dialog";
```

---

#### 34. ConfirmDialog (`ConfirmDialog` / `ConfirmDialogModule` / `ConfirmationService`)

**Module**: `primeng/confirmdialog`

**Usage**: Confirmation dialog for user actions

**Key Properties**:

- Requires `ConfirmationService` injection
- Shows confirmation dialogs programmatically

**Example**:

```typescript
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
```

---

#### 35. Tooltip (`pTooltip` / `TooltipModule`)

**Module**: `primeng/tooltip`

**Usage**: Hover tooltips for additional information

- Search panel: Clear button tooltip
- Exercise card: Exercise details
- Week progress strip: Day information
- Tournament calendar: Event details
- QB throwing tracker: Metric explanations
- Parent dashboard: Icon tooltips

**Key Properties**:

- `pTooltip` - Tooltip text
- `tooltipPosition` - Position (top, bottom, left, right)

**Example**:

```html
<p-button
  icon="pi pi-times"
  pTooltip="Clear search (Esc)"
  tooltipPosition="bottom"
></p-button>
```

---

#### 36. Toast (`p-toast` / `ToastModule`)

**Module**: `primeng/toast`

**Usage**: Notification messages

- Settings: Success/error notifications
- QB throwing tracker: Action feedback

**Key Properties**:

- Requires `MessageService` injection
- Shows messages programmatically

**Example**:

```html
<p-toast></p-toast>
```

```typescript
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

constructor(private messageService: MessageService) {}

showSuccess() {
  this.messageService.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Settings saved successfully'
  });
}
```

---

#### 37. SpeedDial (`SpeedDialModule`)

**Module**: `primeng/speeddial`

**Usage**: Floating action button with multiple actions

- Live game tracker: Quick action menu

**Key Properties**:

- `[model]` - Array of MenuItem objects
- `direction` - Direction of actions (up, down, left, right, up-left, up-right, down-left, down-right)
- `[visible]` - Visibility control

**Example**:

```typescript
import { SpeedDialModule } from "primeng/speeddial";
import { MenuItem } from "primeng/api";
```

---

### Layout Components

#### 38. Divider (`p-divider` / `DividerModule`)

**Module**: `primeng/divider`

**Usage**: Visual separator

- Settings: Separating security sections
- Coach analytics: Section separators
- Parent dashboard: Content separation

**Key Properties**:

- `layout` - Horizontal or vertical
- `align` - Content alignment
- `type` - Solid or dashed

**Example**:

```html
<p-divider></p-divider>
```

```typescript
import { DividerModule } from "primeng/divider";
```

---

#### 39. Accordion (`AccordionModule`)

**Module**: `primeng/accordion`

**Usage**: Collapsible content panels

**Key Properties**:

- `[activeIndex]` - Active panel index
- `[multiple]` - Allow multiple panels open

**Example**:

```typescript
import { AccordionModule } from "primeng/accordion";
```

---

#### 40. ScrollPanel (`ScrollPanelModule`)

**Module**: `primeng/scrollpanel`

**Usage**: Custom scrollbar for content areas

**Key Properties**:

- `[style]` - Panel styles

**Example**:

```typescript
import { ScrollPanelModule } from "primeng/scrollpanel";
```

---

#### 41. Carousel (`CarouselModule`)

**Module**: `primeng/carousel`

**Usage**: Carousel/slider for content

**Key Properties**:

- `[value]` - Array of items
- `[numVisible]` - Number of visible items
- `[numScroll]` - Number of items to scroll
- `[circular]` - Circular mode

**Example**:

```typescript
import { CarouselModule } from "primeng/carousel";
```

---

#### 42. DataView (`DataViewModule`)

**Module**: `primeng/dataview`

**Usage**: Display data in grid or list layout

**Key Properties**:

- `[value]` - Array of data
- `layout` - Layout mode (list, grid)
- `[paginator]` - Enable pagination

**Example**:

```typescript
import { DataViewModule } from "primeng/dataview";
```

---

#### 43. Paginator (`PaginatorModule`)

**Module**: `primeng/paginator`

**Usage**: Standalone pagination component

**Key Properties**:

- `[rows]` - Rows per page
- `[totalRecords]` - Total record count
- `(onPageChange)` - Page change event

**Example**:

```typescript
import { PaginatorModule } from "primeng/paginator";
```

---

### Utility Components

#### 44. Message (`MessageModule`)

**Module**: `primeng/message`

**Usage**: Inline messages

**Key Properties**:

- `severity` - Message severity (success, info, warn, error)
- `text` - Message text
- `[closable]` - Show close button

**Example**:

```typescript
import { MessageModule } from "primeng/message";
```

---

#### 45. IconField / InputIcon (`IconFieldModule` / `InputIconModule`)

**Module**: `primeng/iconfield` / `primeng/inputicon`

**Usage**: Input field with icons

**Example**:

```typescript
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
```

---

#### 46. Ripple (`RippleModule`)

**Module**: `primeng/ripple`

**Usage**: Material Design ripple effect

**Example**:

```typescript
import { RippleModule } from "primeng/ripple";
```

---

## Services

### MessageService

**Module**: `primeng/api`

**Usage**: Service for displaying toast messages

**Example**:

```typescript
import { MessageService } from "primeng/api";
```

---

### ConfirmationService

**Module**: `primeng/api`

**Usage**: Service for confirmation dialogs

**Example**:

```typescript
import { ConfirmationService } from "primeng/api";
```

---

## Configuration

### providePrimeNG

**Module**: `primeng/config`

**Usage**: Configure PrimeNG globally

**Example**:

```typescript
import { providePrimeNG } from "primeng/config";
```

---

## Available PrimeNG Components NOT Currently Used

The following PrimeNG components are available in the library but not currently implemented in the app:

### Form Components

- **ColorPicker** - Color selection
- **Editor** - Rich text editor (Quill integration)
- **InputMask** - Masked input
- **InputOtp** - OTP input
- **InputSwitch** - Alternative to ToggleSwitch
- **Listbox** - List selection
- **Rating** - Star rating input
- **TreeSelect** - Tree dropdown selection
- **TriStateCheckbox** - Three-state checkbox

### Data Display

- **Galleria** - Image gallery with thumbnails
- **Image** - Image display with preview
- **OrganizationChart** - Hierarchical organization chart
- **Paginator** - Standalone pagination (imported but may not be used)
- **Tree** - Tree structure display
- **TreeTable** - Table with tree structure
- **VirtualScroller** - Virtual scrolling for large lists

### Navigation

- **ContextMenu** - Right-click context menu
- **Dock** - Dock/taskbar navigation
- **MegaMenu** - Large dropdown menu
- **MenuBar** - Horizontal menu bar
- **PanelMenu** - Collapsible menu panels
- **SlideMenu** - Sliding navigation menu
- **TabMenu** - Tab-based navigation
- **TieredMenu** - Multi-level menu

### Overlay

- **OverlayPanel** - Floating overlay panel
- **Popover** - Popover component
- **Sidebar** - Slide-in sidebar panel

### Layout

- **Fieldset** - Grouped form fields
- **Panel** - Content panel with header
- **Splitter** - Resizable split panels
- **Stepper** - Step-by-step wizard
- **Toolbar** - Action toolbar

### Misc

- **BlockUI** - Block user interaction
- **CaptCha** - reCAPTCHA integration
- **Defer** - Deferred content loading
- **FocusTrap** - Trap focus within element
- **InPlace** - Inline editing
- **MeterGroup** - Multiple meter display
- **OrderList** - Reorderable list with dual columns
- **PickList** - Dual list selection
- **ProgressBar** - Linear progress indicator
- **ScrollTop** - Scroll to top button
- **Terminal** - Terminal emulator UI
- **VirtualScroller** - Virtual scrolling for performance

## PrimeIcons Usage

The app extensively uses PrimeIcons throughout:

**Common Icons**:

- `pi-search` - Search functionality
- `pi-times` - Close/remove actions
- `pi-plus` - Add actions
- `pi-save` - Save actions
- `pi-cog` - Settings
- `pi-user` - User/profile
- `pi-bell` - Notifications
- `pi-lock`, `pi-shield` - Security
- `pi-calendar` - Date/schedule
- `pi-heart` - Health/favorites
- `pi-chart-line`, `pi-chart-bar` - Analytics
- `pi-check`, `pi-times` - Status indicators
- `pi-spin pi-spinner` - Loading states

## Template Directives

**pTemplate**: Used for customizing component templates

- Item templates in Select dropdowns
- Footer templates in Dialogs
- Header/body templates in Tables
- Content templates in various components

**Example**:

```html
<ng-template pTemplate="item" let-lang>
  <div class="lang-item">
    <span class="lang-flag">{{ lang.flag }}</span>
    <span class="lang-label">{{ lang.label }}</span>
  </div>
</ng-template>
```

## File Locations

### Main Component Files Using PrimeNG:

**Training Features**:

- `src/app/features/training/daily-protocol/components/player-settings-dialog.component.ts`
- `src/app/features/training/daily-protocol/components/exercise-card.component.ts`
- `src/app/features/training/daily-protocol/components/week-progress-strip.component.ts`
- `src/app/features/training/daily-protocol/components/protocol-block.component.ts`
- `src/app/features/training/daily-protocol/components/session-log-form.component.ts`
- `src/app/features/training/daily-protocol/components/tournament-calendar.component.ts`
- `src/app/features/training/qb-throwing-tracker/qb-throwing-tracker.component.ts`

**Shared Components**:

- `src/app/shared/components/header/header.component.ts`
- `src/app/shared/components/search-panel/search-panel.component.html`
- `src/app/shared/components/supplement-tracker/supplement-tracker.component.html`
- `src/app/shared/components/todays-schedule/todays-schedule.component.html`

**Feature Pages**:

- `src/app/features/settings/settings.component.html`
- `src/app/features/parent-dashboard/parent-dashboard.component.html`
- `src/app/features/game-tracker/game-tracker.component.html`
- `src/app/features/game-tracker/live-game-tracker.component.ts`
- `src/app/features/coach/coach-analytics/coach-analytics.component.html`

## Migration Notes for Angular 21

The app is using **PrimeNG 21.0.2**, which is compatible with Angular 21. Key migration points:

1. **Standalone Components**: PrimeNG 21 supports Angular standalone components
2. **Updated Imports**: Some components now use direct class imports (e.g., `Select`, `Checkbox`, `Slider`) instead of module imports
3. **Template Syntax**: Uses modern Angular template syntax with `@if`, `@for`, `@switch`
4. **Form Integration**: Full support for Reactive Forms with `formControlName`

## Best Practices Used

1. **Accessibility**: Proper `aria-*` attributes, labels, and keyboard navigation
2. **Form Validation**: Integration with Angular Reactive Forms
3. **Custom Styling**: Using `styleClass` for component-specific styles
4. **Type Safety**: TypeScript imports for all components
5. **Performance**: Lazy loading of overlays with `appendTo="body"`
6. **User Experience**: Loading states, skeletons, tooltips for better UX

## Summary

The app uses **46+ PrimeNG components** across various categories:

- **Form Components**: 16 (Button, InputText, Select, Checkbox, RadioButton, Password, Slider, InputNumber, Textarea, DatePicker, MultiSelect, ToggleSwitch, SelectButton, ToggleButton, AutoComplete, FileUpload)
- **Data Display**: 12 (Tag, Card, Avatar, Badge, Chip, ProgressBar, ProgressSpinner, Skeleton, Table, Chart, Timeline, Knob)
- **Navigation**: 4 (Tabs, Steps, Breadcrumb, Menu)
- **Overlay**: 5 (Dialog, ConfirmDialog, Tooltip, Toast, SpeedDial)
- **Layout**: 6 (Divider, Accordion, ScrollPanel, Carousel, DataView, Paginator)
- **Utility**: 3 (Message, IconField/InputIcon, Ripple)
- **Services**: 2 (MessageService, ConfirmationService)

This provides a modern, accessible, and feature-rich UI component library that integrates seamlessly with Angular 21.

**Components NOT in use** (but available): 40+ additional components including OrderList, VirtualScroller, Tree, ColorPicker, Editor, Galleria, ContextMenu, Sidebar, and many more.

// Comprehensive Radix UI Components Utility
// Exports all available Radix UI components to prevent import errors

// Form Components
export * as Form from '@radix-ui/react-form';

// Focus Management
export * as FocusScope from '@radix-ui/react-focus-scope';

// Layout & Structure
export * as Separator from '@radix-ui/react-separator';
export * as Slot from '@radix-ui/react-slot';
export * as Portal from '@radix-ui/react-portal';

// Overlay Components
export * as HoverCard from '@radix-ui/react-hover-card';
export * as Popover from '@radix-ui/react-popover';
export * as Tooltip from '@radix-ui/react-tooltip';
export * as Dialog from '@radix-ui/react-dialog';
export * as AlertDialog from '@radix-ui/react-alert-dialog';

// Menu Components
export * as DropdownMenu from '@radix-ui/react-dropdown-menu';
export * as ContextMenu from '@radix-ui/react-context-menu';
export * as Menubar from '@radix-ui/react-menubar';
export * as NavigationMenu from '@radix-ui/react-navigation-menu';

// Content Organization
export * as Tabs from '@radix-ui/react-tabs';
export * as Accordion from '@radix-ui/react-accordion';
export * as Collapsible from '@radix-ui/react-collapsible';

// Form Controls
export * as Checkbox from '@radix-ui/react-checkbox';
export * as RadioGroup from '@radix-ui/react-radio-group';
export * as Switch from '@radix-ui/react-switch';
export * as Toggle from '@radix-ui/react-toggle';
export * as ToggleGroup from '@radix-ui/react-toggle-group';
export * as Slider from '@radix-ui/react-slider';
export * as Progress from '@radix-ui/react-progress';
export * as Select from '@radix-ui/react-select';

// Display Components
export * as ScrollArea from '@radix-ui/react-scroll-area';
export * as Toast from '@radix-ui/react-toast';
export * as Avatar from '@radix-ui/react-avatar';
export * as Label from '@radix-ui/react-label';
export * as AspectRatio from '@radix-ui/react-aspect-ratio';

// Specialized Form Fields
export * as OneTimePasswordField from '@radix-ui/react-one-time-password-field';
export * as PasswordToggleField from '@radix-ui/react-password-toggle-field';

// Component mapping for easy access
export const radixComponents = {
  // Form
  Form: '@radix-ui/react-form',
  OneTimePasswordField: '@radix-ui/react-one-time-password-field',
  PasswordToggleField: '@radix-ui/react-password-toggle-field',
  
  // Focus
  FocusScope: '@radix-ui/react-focus-scope',
  
  // Layout
  Separator: '@radix-ui/react-separator',
  Slot: '@radix-ui/react-slot',
  Portal: '@radix-ui/react-portal',
  
  // Overlays
  HoverCard: '@radix-ui/react-hover-card',
  Popover: '@radix-ui/react-popover',
  Tooltip: '@radix-ui/react-tooltip',
  Dialog: '@radix-ui/react-dialog',
  AlertDialog: '@radix-ui/react-alert-dialog',
  
  // Menus
  DropdownMenu: '@radix-ui/react-dropdown-menu',
  ContextMenu: '@radix-ui/react-context-menu',
  Menubar: '@radix-ui/react-menubar',
  NavigationMenu: '@radix-ui/react-navigation-menu',
  
  // Content
  Tabs: '@radix-ui/react-tabs',
  Accordion: '@radix-ui/react-accordion',
  Collapsible: '@radix-ui/react-collapsible',
  
  // Controls
  Checkbox: '@radix-ui/react-checkbox',
  RadioGroup: '@radix-ui/react-radio-group',
  Switch: '@radix-ui/react-switch',
  Toggle: '@radix-ui/react-toggle',
  ToggleGroup: '@radix-ui/react-toggle-group',
  Slider: '@radix-ui/react-slider',
  Progress: '@radix-ui/react-progress',
  Select: '@radix-ui/react-select',
  
  // Display
  ScrollArea: '@radix-ui/react-scroll-area',
  Toast: '@radix-ui/react-toast',
  Avatar: '@radix-ui/react-avatar',
  Label: '@radix-ui/react-label',
  AspectRatio: '@radix-ui/react-aspect-ratio'
};

// Usage examples
export const componentExamples = {
  // Form with validation
  formExample: `
import * as Form from '@radix-ui/react-form';

<Form.Root onSubmit={handleSubmit}>
  <Form.Field name="email">
    <Form.Label>Email</Form.Label>
    <Form.Control asChild>
      <input type="email" />
    </Form.Control>
    <Form.Message />
  </Form.Field>
</Form.Root>
  `,
  
  // Dialog
  dialogExample: `
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root>
  <Dialog.Trigger>Open Dialog</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close />
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
  `,
  
  // Dropdown Menu
  dropdownExample: `
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

<DropdownMenu.Root>
  <DropdownMenu.Trigger>Open Menu</DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content>
      <DropdownMenu.Item>Item 1</DropdownMenu.Item>
      <DropdownMenu.Item>Item 2</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
  `,
  
  // Tabs
  tabsExample: `
import * as Tabs from '@radix-ui/react-tabs';

<Tabs.Root>
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs.Root>
  `,
  
  // Accordion
  accordionExample: `
import * as Accordion from '@radix-ui/react-accordion';

<Accordion.Root>
  <Accordion.Item value="item-1">
    <Accordion.Trigger>Section 1</Accordion.Trigger>
    <Accordion.Content>Content 1</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
  `,
  
  // Toast
  toastExample: `
import * as Toast from '@radix-ui/react-toast';

<Toast.Provider>
  <Toast.Root>
    <Toast.Title>Title</Toast.Title>
    <Toast.Description>Description</Toast.Description>
    <Toast.Close />
  </Toast.Root>
  <Toast.Viewport />
</Toast.Provider>
  `
};

// Common component combinations
export const componentCombinations = {
  // Login form
  loginForm: ['Form', 'FocusScope', 'Label'],
  
  // Navigation
  navigation: ['NavigationMenu', 'DropdownMenu', 'Separator'],
  
  // Settings panel
  settingsPanel: ['Tabs', 'Accordion', 'Switch', 'Select'],
  
  // Data display
  dataDisplay: ['Table', 'ScrollArea', 'Progress', 'Avatar'],
  
  // Modal interface
  modalInterface: ['Dialog', 'AlertDialog', 'Popover', 'Tooltip'],
  
  // Form interface
  formInterface: ['Form', 'Checkbox', 'RadioGroup', 'Slider', 'Toggle']
};

export default radixComponents; 
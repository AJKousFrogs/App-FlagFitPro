# PrimeNG Design System Rules

> **Complete Design Token Reference for All PrimeNG Component Categories**  
> Generated from PrimeNG MCP - Version 21+

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Global Configuration](#global-configuration)
3. [Form Components](#1-form-components)
4. [Data Components](#2-data-components)
5. [Panel Components](#3-panel-components)
6. [Overlay Components](#4-overlay-components)
7. [File Components](#5-file-components)
8. [Menu Components](#6-menu-components)
9. [Chart Components](#7-chart-components)
10. [Messages Components](#8-messages-components)
11. [Media Components](#9-media-components)
12. [Misc Components](#10-misc-components)
13. [Button Components](#11-button-components)
14. [Best Practices](#best-practices)

---

## Architecture Overview

PrimeNG uses a **design-agnostic** theming architecture with three token tiers:

### Token Tiers

| Tier | Purpose | Example |
|------|---------|---------|
| **Primitive** | Raw color palette values | `blue-500`, `green-400` |
| **Semantic** | Contextual design elements | `primary.color`, `surface.ground` |
| **Component** | Component-specific tokens | `button.background`, `inputtext.border.color` |

### Available Presets

- **Aura** - PrimeTek's modern vision (default)
- **Material** - Google Material Design v2
- **Lara** - Bootstrap-inspired
- **Nora** - Enterprise application style

---

## Global Configuration

### Theme Setup

```typescript
import { ApplicationConfig } from '@angular/core';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: '.app-dark',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      }
    })
  ]
};
```

### CSS Variable Prefix

All PrimeNG tokens use the `--p-` prefix by default.

---

## 1. Form Components

### Components in Category
- `autocomplete` | `cascadeselect` | `checkbox` | `colorpicker`
- `datepicker` | `editor` | `floatlabel` | `fluid`
- `iconfield` | `iftalabel` | `inputgroup` | `inputmask`
- `inputnumber` | `inputotp` | `inputtext` | `keyfilter`
- `knob` | `multiselect` | `password` | `rating`
- `select` | `slider` | `textarea` | `toggleswitch`

---

### InputText Design Tokens (29 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `inputtext.background` | `--p-inputtext-background` | Background of root |
| `inputtext.disabled.background` | `--p-inputtext-disabled-background` | Disabled background |
| `inputtext.filled.background` | `--p-inputtext-filled-background` | Filled variant background |
| `inputtext.filled.hover.background` | `--p-inputtext-filled-hover-background` | Filled hover background |
| `inputtext.filled.focus.background` | `--p-inputtext-filled-focus-background` | Filled focus background |
| `inputtext.border.color` | `--p-inputtext-border-color` | Border color |
| `inputtext.hover.border.color` | `--p-inputtext-hover-border-color` | Hover border color |
| `inputtext.focus.border.color` | `--p-inputtext-focus-border-color` | Focus border color |
| `inputtext.invalid.border.color` | `--p-inputtext-invalid-border-color` | Invalid state border |
| `inputtext.color` | `--p-inputtext-color` | Text color |
| `inputtext.disabled.color` | `--p-inputtext-disabled-color` | Disabled text color |
| `inputtext.placeholder.color` | `--p-inputtext-placeholder-color` | Placeholder color |
| `inputtext.invalid.placeholder.color` | `--p-inputtext-invalid-placeholder-color` | Invalid placeholder |
| `inputtext.shadow` | `--p-inputtext-shadow` | Box shadow |
| `inputtext.padding.x` | `--p-inputtext-padding-x` | Horizontal padding |
| `inputtext.padding.y` | `--p-inputtext-padding-y` | Vertical padding |
| `inputtext.border.radius` | `--p-inputtext-border-radius` | Border radius |
| `inputtext.focus.ring.width` | `--p-inputtext-focus-ring-width` | Focus ring width |
| `inputtext.focus.ring.style` | `--p-inputtext-focus-ring-style` | Focus ring style |
| `inputtext.focus.ring.color` | `--p-inputtext-focus-ring-color` | Focus ring color |
| `inputtext.focus.ring.offset` | `--p-inputtext-focus-ring-offset` | Focus ring offset |
| `inputtext.focus.ring.shadow` | `--p-inputtext-focus-ring-shadow` | Focus ring shadow |
| `inputtext.transition.duration` | `--p-inputtext-transition-duration` | Transition duration |
| `inputtext.sm.font.size` | `--p-inputtext-sm-font-size` | Small size font |
| `inputtext.sm.padding.x` | `--p-inputtext-sm-padding-x` | Small horizontal padding |
| `inputtext.sm.padding.y` | `--p-inputtext-sm-padding-y` | Small vertical padding |
| `inputtext.lg.font.size` | `--p-inputtext-lg-font-size` | Large size font |
| `inputtext.lg.padding.x` | `--p-inputtext-lg-padding-x` | Large horizontal padding |
| `inputtext.lg.padding.y` | `--p-inputtext-lg-padding-y` | Large vertical padding |

---

### Select Design Tokens (57 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `select.background` | `--p-select-background` | Background |
| `select.disabled.background` | `--p-select-disabled-background` | Disabled background |
| `select.filled.background` | `--p-select-filled-background` | Filled variant |
| `select.border.color` | `--p-select-border-color` | Border color |
| `select.hover.border.color` | `--p-select-hover-border-color` | Hover border |
| `select.focus.border.color` | `--p-select-focus-border-color` | Focus border |
| `select.invalid.border.color` | `--p-select-invalid-border-color` | Invalid border |
| `select.color` | `--p-select-color` | Text color |
| `select.placeholder.color` | `--p-select-placeholder-color` | Placeholder |
| `select.shadow` | `--p-select-shadow` | Shadow |
| `select.padding.x` | `--p-select-padding-x` | Horizontal padding |
| `select.padding.y` | `--p-select-padding-y` | Vertical padding |
| `select.border.radius` | `--p-select-border-radius` | Border radius |
| `select.dropdown.width` | `--p-select-dropdown-width` | Dropdown icon width |
| `select.dropdown.color` | `--p-select-dropdown-color` | Dropdown icon color |
| `select.overlay.background` | `--p-select-overlay-background` | Overlay background |
| `select.overlay.border.color` | `--p-select-overlay-border-color` | Overlay border |
| `select.overlay.border.radius` | `--p-select-overlay-border-radius` | Overlay radius |
| `select.overlay.shadow` | `--p-select-overlay-shadow` | Overlay shadow |
| `select.list.padding` | `--p-select-list-padding` | List padding |
| `select.list.gap` | `--p-select-list-gap` | List item gap |
| `select.option.focus.background` | `--p-select-option-focus-background` | Option focus bg |
| `select.option.selected.background` | `--p-select-option-selected-background` | Selected option bg |
| `select.option.color` | `--p-select-option-color` | Option color |
| `select.option.selected.color` | `--p-select-option-selected-color` | Selected color |
| `select.option.padding` | `--p-select-option-padding` | Option padding |
| `select.option.border.radius` | `--p-select-option-border-radius` | Option radius |
| `select.checkmark.color` | `--p-select-checkmark-color` | Checkmark color |

---

### Checkbox Design Tokens (34 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `checkbox.width` | `--p-checkbox-width` | Width |
| `checkbox.height` | `--p-checkbox-height` | Height |
| `checkbox.border.radius` | `--p-checkbox-border-radius` | Border radius |
| `checkbox.background` | `--p-checkbox-background` | Background |
| `checkbox.checked.background` | `--p-checkbox-checked-background` | Checked background |
| `checkbox.checked.hover.background` | `--p-checkbox-checked-hover-background` | Checked hover |
| `checkbox.disabled.background` | `--p-checkbox-disabled-background` | Disabled background |
| `checkbox.border.color` | `--p-checkbox-border-color` | Border color |
| `checkbox.hover.border.color` | `--p-checkbox-hover-border-color` | Hover border |
| `checkbox.focus.border.color` | `--p-checkbox-focus-border-color` | Focus border |
| `checkbox.checked.border.color` | `--p-checkbox-checked-border-color` | Checked border |
| `checkbox.invalid.border.color` | `--p-checkbox-invalid-border-color` | Invalid border |
| `checkbox.shadow` | `--p-checkbox-shadow` | Shadow |
| `checkbox.icon.size` | `--p-checkbox-icon-size` | Icon size |
| `checkbox.icon.color` | `--p-checkbox-icon-color` | Icon color |
| `checkbox.icon.checked.color` | `--p-checkbox-icon-checked-color` | Checked icon |
| `checkbox.sm.width` | `--p-checkbox-sm-width` | Small width |
| `checkbox.sm.height` | `--p-checkbox-sm-height` | Small height |
| `checkbox.lg.width` | `--p-checkbox-lg-width` | Large width |
| `checkbox.lg.height` | `--p-checkbox-lg-height` | Large height |

---

### ToggleSwitch Design Tokens (34 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `toggleswitch.width` | `--p-toggleswitch-width` | Width |
| `toggleswitch.height` | `--p-toggleswitch-height` | Height |
| `toggleswitch.border.radius` | `--p-toggleswitch-border-radius` | Border radius |
| `toggleswitch.gap` | `--p-toggleswitch-gap` | Gap |
| `toggleswitch.shadow` | `--p-toggleswitch-shadow` | Shadow |
| `toggleswitch.border.color` | `--p-toggleswitch-border-color` | Border color |
| `toggleswitch.hover.border.color` | `--p-toggleswitch-hover-border-color` | Hover border |
| `toggleswitch.checked.border.color` | `--p-toggleswitch-checked-border-color` | Checked border |
| `toggleswitch.invalid.border.color` | `--p-toggleswitch-invalid-border-color` | Invalid border |
| `toggleswitch.background` | `--p-toggleswitch-background` | Background |
| `toggleswitch.hover.background` | `--p-toggleswitch-hover-background` | Hover background |
| `toggleswitch.checked.background` | `--p-toggleswitch-checked-background` | Checked background |
| `toggleswitch.handle.size` | `--p-toggleswitch-handle-size` | Handle size |
| `toggleswitch.handle.background` | `--p-toggleswitch-handle-background` | Handle background |
| `toggleswitch.handle.checked.background` | `--p-toggleswitch-handle-checked-background` | Checked handle |
| `toggleswitch.slide.duration` | `--p-toggleswitch-slide-duration` | Animation duration |

---

### Slider Design Tokens (21 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `slider.track.background` | `--p-slider-track-background` | Track background |
| `slider.track.border.radius` | `--p-slider-track-border-radius` | Track radius |
| `slider.track.size` | `--p-slider-track-size` | Track size |
| `slider.range.background` | `--p-slider-range-background` | Range background |
| `slider.handle.width` | `--p-slider-handle-width` | Handle width |
| `slider.handle.height` | `--p-slider-handle-height` | Handle height |
| `slider.handle.border.radius` | `--p-slider-handle-border-radius` | Handle radius |
| `slider.handle.background` | `--p-slider-handle-background` | Handle background |
| `slider.handle.hover.background` | `--p-slider-handle-hover-background` | Handle hover |
| `slider.handle.content.shadow` | `--p-slider-handle-content-shadow` | Handle shadow |

---

### Rating Design Tokens (11 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `rating.gap` | `--p-rating-gap` | Gap between stars |
| `rating.icon.size` | `--p-rating-icon-size` | Icon size |
| `rating.icon.color` | `--p-rating-icon-color` | Inactive color |
| `rating.icon.hover.color` | `--p-rating-icon-hover-color` | Hover color |
| `rating.icon.active.color` | `--p-rating-icon-active-color` | Active/selected color |

---

### Knob Design Tokens (9 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `knob.value.background` | `--p-knob-value-background` | Value arc background |
| `knob.range.background` | `--p-knob-range-background` | Range background |
| `knob.text.color` | `--p-knob-text-color` | Center text color |

---

### Datepicker Design Tokens (78 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `datepicker.panel.background` | `--p-datepicker-panel-background` | Panel background |
| `datepicker.panel.border.color` | `--p-datepicker-panel-border-color` | Panel border |
| `datepicker.panel.border.radius` | `--p-datepicker-panel-border-radius` | Panel radius |
| `datepicker.panel.shadow` | `--p-datepicker-panel-shadow` | Panel shadow |
| `datepicker.panel.padding` | `--p-datepicker-panel-padding` | Panel padding |
| `datepicker.header.background` | `--p-datepicker-header-background` | Header background |
| `datepicker.header.color` | `--p-datepicker-header-color` | Header text color |
| `datepicker.header.padding` | `--p-datepicker-header-padding` | Header padding |
| `datepicker.title.font.weight` | `--p-datepicker-title-font-weight` | Title font weight |
| `datepicker.date.hover.background` | `--p-datepicker-date-hover-background` | Date hover bg |
| `datepicker.date.selected.background` | `--p-datepicker-date-selected-background` | Selected date bg |
| `datepicker.date.color` | `--p-datepicker-date-color` | Date text color |
| `datepicker.date.selected.color` | `--p-datepicker-date-selected-color` | Selected text |
| `datepicker.date.width` | `--p-datepicker-date-width` | Date cell width |
| `datepicker.date.height` | `--p-datepicker-date-height` | Date cell height |
| `datepicker.date.border.radius` | `--p-datepicker-date-border-radius` | Date cell radius |
| `datepicker.today.background` | `--p-datepicker-today-background` | Today highlight |
| `datepicker.today.color` | `--p-datepicker-today-color` | Today text |
| `datepicker.week.day.color` | `--p-datepicker-week-day-color` | Weekday header |
| `datepicker.week.day.font.weight` | `--p-datepicker-week-day-font-weight` | Weekday weight |

---

### MultiSelect Design Tokens (56 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `multiselect.background` | `--p-multiselect-background` | Background |
| `multiselect.border.color` | `--p-multiselect-border-color` | Border color |
| `multiselect.hover.border.color` | `--p-multiselect-hover-border-color` | Hover border |
| `multiselect.focus.border.color` | `--p-multiselect-focus-border-color` | Focus border |
| `multiselect.invalid.border.color` | `--p-multiselect-invalid-border-color` | Invalid border |
| `multiselect.color` | `--p-multiselect-color` | Text color |
| `multiselect.placeholder.color` | `--p-multiselect-placeholder-color` | Placeholder |
| `multiselect.overlay.background` | `--p-multiselect-overlay-background` | Dropdown bg |
| `multiselect.overlay.shadow` | `--p-multiselect-overlay-shadow` | Dropdown shadow |
| `multiselect.option.focus.background` | `--p-multiselect-option-focus-background` | Option focus |
| `multiselect.option.selected.background` | `--p-multiselect-option-selected-background` | Selected |
| `multiselect.chip.border.radius` | `--p-multiselect-chip-border-radius` | Chip radius |

---

### Autocomplete Design Tokens (65 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `autocomplete.background` | `--p-autocomplete-background` | Background |
| `autocomplete.border.color` | `--p-autocomplete-border-color` | Border color |
| `autocomplete.focus.border.color` | `--p-autocomplete-focus-border-color` | Focus border |
| `autocomplete.invalid.border.color` | `--p-autocomplete-invalid-border-color` | Invalid border |
| `autocomplete.overlay.background` | `--p-autocomplete-overlay-background` | Dropdown bg |
| `autocomplete.overlay.shadow` | `--p-autocomplete-overlay-shadow` | Dropdown shadow |
| `autocomplete.option.focus.background` | `--p-autocomplete-option-focus-background` | Option focus |
| `autocomplete.option.selected.background` | `--p-autocomplete-option-selected-background` | Selected |
| `autocomplete.chip.border.radius` | `--p-autocomplete-chip-border-radius` | Chip radius |
| `autocomplete.chip.focus.background` | `--p-autocomplete-chip-focus-background` | Chip focus |

---

## 2. Data Components

### Components in Category
- `listbox` | `orderlist` | `organizationchart` | `paginator`
- `picklist` | `scroller` | `table` | `timeline`
- `tree` | `treeselect` | `treetable`

---

### Listbox Design Tokens (30 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `listbox.background` | `--p-listbox-background` | Background |
| `listbox.disabled.background` | `--p-listbox-disabled-background` | Disabled bg |
| `listbox.border.color` | `--p-listbox-border-color` | Border color |
| `listbox.invalid.border.color` | `--p-listbox-invalid-border-color` | Invalid border |
| `listbox.color` | `--p-listbox-color` | Text color |
| `listbox.shadow` | `--p-listbox-shadow` | Shadow |
| `listbox.border.radius` | `--p-listbox-border-radius` | Border radius |
| `listbox.list.padding` | `--p-listbox-list-padding` | List padding |
| `listbox.list.gap` | `--p-listbox-list-gap` | List gap |
| `listbox.option.focus.background` | `--p-listbox-option-focus-background` | Focus bg |
| `listbox.option.selected.background` | `--p-listbox-option-selected-background` | Selected bg |
| `listbox.option.color` | `--p-listbox-option-color` | Option color |
| `listbox.option.selected.color` | `--p-listbox-option-selected-color` | Selected color |
| `listbox.option.padding` | `--p-listbox-option-padding` | Option padding |
| `listbox.option.border.radius` | `--p-listbox-option-border-radius` | Option radius |
| `listbox.option.striped.background` | `--p-listbox-option-striped-background` | Striped bg |
| `listbox.checkmark.color` | `--p-listbox-checkmark-color` | Checkmark |

---

### Tree Design Tokens (36 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `tree.background` | `--p-tree-background` | Background |
| `tree.color` | `--p-tree-color` | Text color |
| `tree.padding` | `--p-tree-padding` | Padding |
| `tree.gap` | `--p-tree-gap` | Gap |
| `tree.indent` | `--p-tree-indent` | Indentation |
| `tree.node.padding` | `--p-tree-node-padding` | Node padding |
| `tree.node.border.radius` | `--p-tree-node-border-radius` | Node radius |
| `tree.node.hover.background` | `--p-tree-node-hover-background` | Node hover |
| `tree.node.selected.background` | `--p-tree-node-selected-background` | Selected bg |
| `tree.node.color` | `--p-tree-node-color` | Node color |
| `tree.node.selected.color` | `--p-tree-node-selected-color` | Selected color |
| `tree.node.icon.color` | `--p-tree-node-icon-color` | Icon color |
| `tree.node.toggle.button.size` | `--p-tree-node-toggle-button-size` | Toggle size |
| `tree.node.toggle.button.color` | `--p-tree-node-toggle-button-color` | Toggle color |

---

### Paginator Design Tokens (22 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `paginator.padding` | `--p-paginator-padding` | Padding |
| `paginator.gap` | `--p-paginator-gap` | Gap |
| `paginator.border.radius` | `--p-paginator-border-radius` | Border radius |
| `paginator.background` | `--p-paginator-background` | Background |
| `paginator.color` | `--p-paginator-color` | Text color |
| `paginator.nav.button.background` | `--p-paginator-nav-button-background` | Button bg |
| `paginator.nav.button.hover.background` | `--p-paginator-nav-button-hover-background` | Button hover |
| `paginator.nav.button.selected.background` | `--p-paginator-nav-button-selected-background` | Selected bg |
| `paginator.nav.button.color` | `--p-paginator-nav-button-color` | Button color |
| `paginator.nav.button.selected.color` | `--p-paginator-nav-button-selected-color` | Selected color |
| `paginator.nav.button.width` | `--p-paginator-nav-button-width` | Button width |
| `paginator.nav.button.height` | `--p-paginator-nav-button-height` | Button height |
| `paginator.nav.button.border.radius` | `--p-paginator-nav-button-border-radius` | Button radius |

---

## 3. Panel Components

### Components in Category
- `accordion` | `card` | `divider` | `fieldset`
- `panel` | `scrollpanel` | `splitter` | `stepper`
- `tabs` | `toolbar`

---

### Card Design Tokens (10 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `card.background` | `--p-card-background` | Background |
| `card.border.radius` | `--p-card-border-radius` | Border radius |
| `card.color` | `--p-card-color` | Text color |
| `card.shadow` | `--p-card-shadow` | Box shadow |
| `card.body.padding` | `--p-card-body-padding` | Body padding |
| `card.body.gap` | `--p-card-body-gap` | Body gap |
| `card.caption.gap` | `--p-card-caption-gap` | Caption gap |
| `card.title.font.size` | `--p-card-title-font-size` | Title size |
| `card.title.font.weight` | `--p-card-title-font-weight` | Title weight |
| `card.subtitle.color` | `--p-card-subtitle-color` | Subtitle color |

---

### Panel Design Tokens (14 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `panel.background` | `--p-panel-background` | Background |
| `panel.border.color` | `--p-panel-border-color` | Border color |
| `panel.color` | `--p-panel-color` | Text color |
| `panel.border.radius` | `--p-panel-border-radius` | Border radius |
| `panel.header.background` | `--p-panel-header-background` | Header bg |
| `panel.header.color` | `--p-panel-header-color` | Header color |
| `panel.header.padding` | `--p-panel-header-padding` | Header padding |
| `panel.header.border.color` | `--p-panel-header-border-color` | Header border |
| `panel.header.border.radius` | `--p-panel-header-border-radius` | Header radius |
| `panel.title.font.weight` | `--p-panel-title-font-weight` | Title weight |
| `panel.content.padding` | `--p-panel-content-padding` | Content padding |
| `panel.footer.padding` | `--p-panel-footer-padding` | Footer padding |

---

### Accordion Design Tokens (34 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `accordion.panel.border.width` | `--p-accordion-panel-border-width` | Panel border width |
| `accordion.panel.border.color` | `--p-accordion-panel-border-color` | Panel border color |
| `accordion.header.color` | `--p-accordion-header-color` | Header color |
| `accordion.header.hover.color` | `--p-accordion-header-hover-color` | Header hover |
| `accordion.header.active.color` | `--p-accordion-header-active-color` | Active color |
| `accordion.header.padding` | `--p-accordion-header-padding` | Header padding |
| `accordion.header.font.weight` | `--p-accordion-header-font-weight` | Header weight |
| `accordion.header.border.radius` | `--p-accordion-header-border-radius` | Header radius |
| `accordion.header.background` | `--p-accordion-header-background` | Header bg |
| `accordion.header.hover.background` | `--p-accordion-header-hover-background` | Hover bg |
| `accordion.header.active.background` | `--p-accordion-header-active-background` | Active bg |
| `accordion.header.toggle.icon.color` | `--p-accordion-header-toggle-icon-color` | Toggle icon |
| `accordion.content.background` | `--p-accordion-content-background` | Content bg |
| `accordion.content.color` | `--p-accordion-content-color` | Content color |
| `accordion.content.padding` | `--p-accordion-content-padding` | Content padding |

---

### Tabs Design Tokens (44 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `tabs.tablist.border.width` | `--p-tabs-tablist-border-width` | Tablist border |
| `tabs.tablist.background` | `--p-tabs-tablist-background` | Tablist bg |
| `tabs.tablist.border.color` | `--p-tabs-tablist-border-color` | Border color |
| `tabs.tab.background` | `--p-tabs-tab-background` | Tab background |
| `tabs.tab.hover.background` | `--p-tabs-tab-hover-background` | Tab hover |
| `tabs.tab.active.background` | `--p-tabs-tab-active-background` | Active tab |
| `tabs.tab.border.color` | `--p-tabs-tab-border-color` | Tab border |
| `tabs.tab.active.border.color` | `--p-tabs-tab-active-border-color` | Active border |
| `tabs.tab.color` | `--p-tabs-tab-color` | Tab color |
| `tabs.tab.hover.color` | `--p-tabs-tab-hover-color` | Hover color |
| `tabs.tab.active.color` | `--p-tabs-tab-active-color` | Active color |
| `tabs.tab.padding` | `--p-tabs-tab-padding` | Tab padding |
| `tabs.tab.font.weight` | `--p-tabs-tab-font-weight` | Font weight |
| `tabs.tabpanel.background` | `--p-tabs-tabpanel-background` | Panel bg |
| `tabs.tabpanel.color` | `--p-tabs-tabpanel-color` | Panel color |
| `tabs.tabpanel.padding` | `--p-tabs-tabpanel-padding` | Panel padding |
| `tabs.active.bar.height` | `--p-tabs-active-bar-height` | Active bar |
| `tabs.active.bar.background` | `--p-tabs-active-bar-background` | Bar color |

---

### Divider Design Tokens (9 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `divider.border.color` | `--p-divider-border-color` | Border color |
| `divider.content.background` | `--p-divider-content-background` | Label bg |
| `divider.content.color` | `--p-divider-content-color` | Label color |
| `divider.horizontal.margin` | `--p-divider-horizontal-margin` | H margin |
| `divider.horizontal.padding` | `--p-divider-horizontal-padding` | H padding |
| `divider.vertical.margin` | `--p-divider-vertical-margin` | V margin |
| `divider.vertical.padding` | `--p-divider-vertical-padding` | V padding |

---

### Splitter Design Tokens (13 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `splitter.background` | `--p-splitter-background` | Background |
| `splitter.border.color` | `--p-splitter-border-color` | Border color |
| `splitter.gutter.background` | `--p-splitter-gutter-background` | Gutter bg |
| `splitter.handle.size` | `--p-splitter-handle-size` | Handle size |
| `splitter.handle.background` | `--p-splitter-handle-background` | Handle bg |
| `splitter.handle.border.radius` | `--p-splitter-handle-border-radius` | Handle radius |

---

## 4. Overlay Components

### Components in Category
- `confirmdialog` | `confirmpopup` | `dialog`
- `drawer` | `dynamicdialog` | `overlay`
- `popover` | `tooltip`

---

### Dialog Design Tokens (12 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `dialog.background` | `--p-dialog-background` | Background |
| `dialog.border.color` | `--p-dialog-border-color` | Border color |
| `dialog.color` | `--p-dialog-color` | Text color |
| `dialog.border.radius` | `--p-dialog-border-radius` | Border radius |
| `dialog.shadow` | `--p-dialog-shadow` | Box shadow |
| `dialog.header.padding` | `--p-dialog-header-padding` | Header padding |
| `dialog.header.gap` | `--p-dialog-header-gap` | Header gap |
| `dialog.title.font.size` | `--p-dialog-title-font-size` | Title size |
| `dialog.title.font.weight` | `--p-dialog-title-font-weight` | Title weight |
| `dialog.content.padding` | `--p-dialog-content-padding` | Content padding |
| `dialog.footer.padding` | `--p-dialog-footer-padding` | Footer padding |
| `dialog.footer.gap` | `--p-dialog-footer-gap` | Footer gap |

---

### Drawer Design Tokens (9 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `drawer.background` | `--p-drawer-background` | Background |
| `drawer.border.color` | `--p-drawer-border-color` | Border color |
| `drawer.color` | `--p-drawer-color` | Text color |
| `drawer.shadow` | `--p-drawer-shadow` | Shadow |
| `drawer.header.padding` | `--p-drawer-header-padding` | Header padding |
| `drawer.title.font.size` | `--p-drawer-title-font-size` | Title size |
| `drawer.title.font.weight` | `--p-drawer-title-font-weight` | Title weight |
| `drawer.content.padding` | `--p-drawer-content-padding` | Content padding |
| `drawer.footer.padding` | `--p-drawer-footer-padding` | Footer padding |

---

### Popover Design Tokens (8 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `popover.background` | `--p-popover-background` | Background |
| `popover.border.color` | `--p-popover-border-color` | Border color |
| `popover.color` | `--p-popover-color` | Text color |
| `popover.border.radius` | `--p-popover-border-radius` | Border radius |
| `popover.shadow` | `--p-popover-shadow` | Shadow |
| `popover.gutter` | `--p-popover-gutter` | Gutter/offset |
| `popover.arrow.offset` | `--p-popover-arrow-offset` | Arrow offset |
| `popover.content.padding` | `--p-popover-content-padding` | Content padding |

---

### Tooltip Design Tokens (7 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `tooltip.max.width` | `--p-tooltip-max-width` | Max width |
| `tooltip.gutter` | `--p-tooltip-gutter` | Offset from target |
| `tooltip.shadow` | `--p-tooltip-shadow` | Shadow |
| `tooltip.padding` | `--p-tooltip-padding` | Padding |
| `tooltip.border.radius` | `--p-tooltip-border-radius` | Border radius |
| `tooltip.background` | `--p-tooltip-background` | Background |
| `tooltip.color` | `--p-tooltip-color` | Text color |

---

## 5. File Components

### Components in Category
- `fileupload`

---

### FileUpload Design Tokens (22 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `fileupload.background` | `--p-fileupload-background` | Background |
| `fileupload.border.color` | `--p-fileupload-border-color` | Border color |
| `fileupload.color` | `--p-fileupload-color` | Text color |
| `fileupload.border.radius` | `--p-fileupload-border-radius` | Border radius |
| `fileupload.header.background` | `--p-fileupload-header-background` | Header bg |
| `fileupload.header.color` | `--p-fileupload-header-color` | Header color |
| `fileupload.header.padding` | `--p-fileupload-header-padding` | Header padding |
| `fileupload.header.border.color` | `--p-fileupload-header-border-color` | Header border |
| `fileupload.header.gap` | `--p-fileupload-header-gap` | Header gap |
| `fileupload.content.highlight.border.color` | `--p-fileupload-content-highlight-border-color` | Drag highlight |
| `fileupload.content.padding` | `--p-fileupload-content-padding` | Content padding |
| `fileupload.content.gap` | `--p-fileupload-content-gap` | Content gap |
| `fileupload.file.padding` | `--p-fileupload-file-padding` | File padding |
| `fileupload.file.gap` | `--p-fileupload-file-gap` | File gap |
| `fileupload.file.border.color` | `--p-fileupload-file-border-color` | File border |
| `fileupload.progressbar.height` | `--p-fileupload-progressbar-height` | Progress height |

---

## 6. Menu Components

### Components in Category
- `breadcrumb` | `contextmenu` | `dock` | `megamenu`
- `menu` | `menubar` | `panelmenu` | `steps` | `tieredmenu`

---

### Menu Design Tokens (21 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `menu.background` | `--p-menu-background` | Background |
| `menu.border.color` | `--p-menu-border-color` | Border color |
| `menu.color` | `--p-menu-color` | Text color |
| `menu.border.radius` | `--p-menu-border-radius` | Border radius |
| `menu.shadow` | `--p-menu-shadow` | Shadow |
| `menu.list.padding` | `--p-menu-list-padding` | List padding |
| `menu.list.gap` | `--p-menu-list-gap` | List gap |
| `menu.item.focus.background` | `--p-menu-item-focus-background` | Item focus |
| `menu.item.color` | `--p-menu-item-color` | Item color |
| `menu.item.focus.color` | `--p-menu-item-focus-color` | Focus color |
| `menu.item.padding` | `--p-menu-item-padding` | Item padding |
| `menu.item.border.radius` | `--p-menu-item-border-radius` | Item radius |
| `menu.item.gap` | `--p-menu-item-gap` | Item gap |
| `menu.item.icon.color` | `--p-menu-item-icon-color` | Icon color |
| `menu.submenu.label.padding` | `--p-menu-submenu-label-padding` | Submenu padding |
| `menu.submenu.label.font.weight` | `--p-menu-submenu-label-font-weight` | Submenu weight |
| `menu.separator.border.color` | `--p-menu-separator-border-color` | Separator |

---

### Menubar Design Tokens (42 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `menubar.background` | `--p-menubar-background` | Background |
| `menubar.border.color` | `--p-menubar-border-color` | Border color |
| `menubar.border.radius` | `--p-menubar-border-radius` | Border radius |
| `menubar.color` | `--p-menubar-color` | Text color |
| `menubar.gap` | `--p-menubar-gap` | Gap |
| `menubar.padding` | `--p-menubar-padding` | Padding |
| `menubar.item.focus.background` | `--p-menubar-item-focus-background` | Item focus |
| `menubar.item.active.background` | `--p-menubar-item-active-background` | Active bg |
| `menubar.item.color` | `--p-menubar-item-color` | Item color |
| `menubar.item.active.color` | `--p-menubar-item-active-color` | Active color |
| `menubar.item.padding` | `--p-menubar-item-padding` | Item padding |
| `menubar.item.border.radius` | `--p-menubar-item-border-radius` | Item radius |
| `menubar.submenu.background` | `--p-menubar-submenu-background` | Submenu bg |
| `menubar.submenu.border.radius` | `--p-menubar-submenu-border-radius` | Submenu radius |
| `menubar.submenu.shadow` | `--p-menubar-submenu-shadow` | Submenu shadow |
| `menubar.mobile.button.size` | `--p-menubar-mobile-button-size` | Mobile btn size |
| `menubar.mobile.button.color` | `--p-menubar-mobile-button-color` | Mobile btn color |

---

### Breadcrumb Design Tokens (16 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `breadcrumb.padding` | `--p-breadcrumb-padding` | Padding |
| `breadcrumb.background` | `--p-breadcrumb-background` | Background |
| `breadcrumb.gap` | `--p-breadcrumb-gap` | Gap |
| `breadcrumb.item.color` | `--p-breadcrumb-item-color` | Item color |
| `breadcrumb.item.hover.color` | `--p-breadcrumb-item-hover-color` | Hover color |
| `breadcrumb.item.border.radius` | `--p-breadcrumb-item-border-radius` | Item radius |
| `breadcrumb.item.icon.color` | `--p-breadcrumb-item-icon-color` | Icon color |
| `breadcrumb.separator.color` | `--p-breadcrumb-separator-color` | Separator |

---

### Steps Design Tokens (23 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `steps.separator.background` | `--p-steps-separator-background` | Separator bg |
| `steps.item.link.border.radius` | `--p-steps-item-link-border-radius` | Link radius |
| `steps.item.link.gap` | `--p-steps-item-link-gap` | Link gap |
| `steps.item.label.color` | `--p-steps-item-label-color` | Label color |
| `steps.item.label.active.color` | `--p-steps-item-label-active-color` | Active label |
| `steps.item.label.font.weight` | `--p-steps-item-label-font-weight` | Label weight |
| `steps.item.number.background` | `--p-steps-item-number-background` | Number bg |
| `steps.item.number.active.background` | `--p-steps-item-number-active-background` | Active num bg |
| `steps.item.number.border.color` | `--p-steps-item-number-border-color` | Number border |
| `steps.item.number.active.border.color` | `--p-steps-item-number-active-border-color` | Active border |
| `steps.item.number.color` | `--p-steps-item-number-color` | Number color |
| `steps.item.number.active.color` | `--p-steps-item-number-active-color` | Active color |
| `steps.item.number.size` | `--p-steps-item-number-size` | Number size |
| `steps.item.number.border.radius` | `--p-steps-item-number-border-radius` | Number radius |

---

## 7. Chart Components

### Components in Category
- `chart` (uses Chart.js)

**Note:** Chart component styling is handled via Chart.js configuration options, not PrimeNG design tokens. Use Chart.js theming documentation for customization.

---

## 8. Messages Components

### Components in Category
- `message` | `toast`

---

### Message Design Tokens (85 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `message.border.radius` | `--p-message-border-radius` | Border radius |
| `message.border.width` | `--p-message-border-width` | Border width |
| `message.content.padding` | `--p-message-content-padding` | Content padding |
| `message.content.gap` | `--p-message-content-gap` | Content gap |
| `message.text.font.size` | `--p-message-text-font-size` | Text size |
| `message.text.font.weight` | `--p-message-text-font-weight` | Text weight |
| `message.icon.size` | `--p-message-icon-size` | Icon size |
| `message.close.button.width` | `--p-message-close-button-width` | Close width |
| `message.close.button.height` | `--p-message-close-button-height` | Close height |
| `message.close.button.border.radius` | `--p-message-close-button-border-radius` | Close radius |
| **Info Variant** |
| `message.info.background` | `--p-message-info-background` | Info bg |
| `message.info.border.color` | `--p-message-info-border-color` | Info border |
| `message.info.color` | `--p-message-info-color` | Info color |
| `message.info.shadow` | `--p-message-info-shadow` | Info shadow |
| **Success Variant** |
| `message.success.background` | `--p-message-success-background` | Success bg |
| `message.success.border.color` | `--p-message-success-border-color` | Success border |
| `message.success.color` | `--p-message-success-color` | Success color |
| **Warning Variant** |
| `message.warn.background` | `--p-message-warn-background` | Warn bg |
| `message.warn.border.color` | `--p-message-warn-border-color` | Warn border |
| `message.warn.color` | `--p-message-warn-color` | Warn color |
| **Error Variant** |
| `message.error.background` | `--p-message-error-background` | Error bg |
| `message.error.border.color` | `--p-message-error-border-color` | Error border |
| `message.error.color` | `--p-message-error-color` | Error color |
| **Secondary Variant** |
| `message.secondary.background` | `--p-message-secondary-background` | Secondary bg |
| `message.secondary.border.color` | `--p-message-secondary-border-color` | Secondary border |
| `message.secondary.color` | `--p-message-secondary-color` | Secondary color |
| **Contrast Variant** |
| `message.contrast.background` | `--p-message-contrast-background` | Contrast bg |
| `message.contrast.border.color` | `--p-message-contrast-border-color` | Contrast border |
| `message.contrast.color` | `--p-message-contrast-color` | Contrast color |

---

### Toast Design Tokens (68 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `toast.width` | `--p-toast-width` | Toast width |
| `toast.border.radius` | `--p-toast-border-radius` | Border radius |
| `toast.border.width` | `--p-toast-border-width` | Border width |
| `toast.icon.size` | `--p-toast-icon-size` | Icon size |
| `toast.content.padding` | `--p-toast-content-padding` | Content padding |
| `toast.content.gap` | `--p-toast-content-gap` | Content gap |
| `toast.summary.font.weight` | `--p-toast-summary-font-weight` | Title weight |
| `toast.summary.font.size` | `--p-toast-summary-font-size` | Title size |
| `toast.detail.font.size` | `--p-toast-detail-font-size` | Detail size |
| `toast.close.button.width` | `--p-toast-close-button-width` | Close width |
| `toast.close.button.height` | `--p-toast-close-button-height` | Close height |
| **Info Variant** |
| `toast.info.background` | `--p-toast-info-background` | Info bg |
| `toast.info.border.color` | `--p-toast-info-border-color` | Info border |
| `toast.info.color` | `--p-toast-info-color` | Info color |
| **Success Variant** |
| `toast.success.background` | `--p-toast-success-background` | Success bg |
| `toast.success.border.color` | `--p-toast-success-border-color` | Success border |
| `toast.success.color` | `--p-toast-success-color` | Success color |
| **Warning Variant** |
| `toast.warn.background` | `--p-toast-warn-background` | Warn bg |
| `toast.warn.border.color` | `--p-toast-warn-border-color` | Warn border |
| `toast.warn.color` | `--p-toast-warn-color` | Warn color |
| **Error Variant** |
| `toast.error.background` | `--p-toast-error-background` | Error bg |
| `toast.error.border.color` | `--p-toast-error-border-color` | Error border |
| `toast.error.color` | `--p-toast-error-color` | Error color |

---

## 9. Media Components

### Components in Category
- `carousel` | `galleria` | `imagecompare`

---

### Carousel Design Tokens (15 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `carousel.content.gap` | `--p-carousel-content-gap` | Content gap |
| `carousel.indicator.list.padding` | `--p-carousel-indicator-list-padding` | Indicator padding |
| `carousel.indicator.list.gap` | `--p-carousel-indicator-list-gap` | Indicator gap |
| `carousel.indicator.width` | `--p-carousel-indicator-width` | Indicator width |
| `carousel.indicator.height` | `--p-carousel-indicator-height` | Indicator height |
| `carousel.indicator.border.radius` | `--p-carousel-indicator-border-radius` | Indicator radius |
| `carousel.indicator.background` | `--p-carousel-indicator-background` | Indicator bg |
| `carousel.indicator.hover.background` | `--p-carousel-indicator-hover-background` | Hover bg |
| `carousel.indicator.active.background` | `--p-carousel-indicator-active-background` | Active bg |

---

## 10. Misc Components

### Components in Category
- `animateonscroll` | `autofocus` | `avatar` | `badge`
- `blockui` | `chip` | `dataview` | `dragdrop`
- `focustrap` | `inplace` | `metergroup` | `progressbar`
- `progressspinner` | `ripple` | `scrolltop` | `skeleton`
- `styleclass` | `tag` | `terminal`

---

### Avatar Design Tokens (19 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `avatar.width` | `--p-avatar-width` | Width |
| `avatar.height` | `--p-avatar-height` | Height |
| `avatar.font.size` | `--p-avatar-font-size` | Font size |
| `avatar.background` | `--p-avatar-background` | Background |
| `avatar.color` | `--p-avatar-color` | Text color |
| `avatar.border.radius` | `--p-avatar-border-radius` | Border radius |
| `avatar.icon.size` | `--p-avatar-icon-size` | Icon size |
| `avatar.group.border.color` | `--p-avatar-group-border-color` | Group border |
| `avatar.group.offset` | `--p-avatar-group-offset` | Group offset |
| `avatar.lg.width` | `--p-avatar-lg-width` | Large width |
| `avatar.lg.height` | `--p-avatar-lg-height` | Large height |
| `avatar.lg.font.size` | `--p-avatar-lg-font-size` | Large font |
| `avatar.xl.width` | `--p-avatar-xl-width` | XL width |
| `avatar.xl.height` | `--p-avatar-xl-height` | XL height |
| `avatar.xl.font.size` | `--p-avatar-xl-font-size` | XL font |

---

### Badge Design Tokens (30 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `badge.border.radius` | `--p-badge-border-radius` | Border radius |
| `badge.padding` | `--p-badge-padding` | Padding |
| `badge.font.size` | `--p-badge-font-size` | Font size |
| `badge.font.weight` | `--p-badge-font-weight` | Font weight |
| `badge.min.width` | `--p-badge-min-width` | Min width |
| `badge.height` | `--p-badge-height` | Height |
| `badge.dot.size` | `--p-badge-dot-size` | Dot size |
| **Size Variants** |
| `badge.sm.font.size` | `--p-badge-sm-font-size` | Small font |
| `badge.sm.min.width` | `--p-badge-sm-min-width` | Small width |
| `badge.sm.height` | `--p-badge-sm-height` | Small height |
| `badge.lg.font.size` | `--p-badge-lg-font-size` | Large font |
| `badge.lg.min.width` | `--p-badge-lg-min-width` | Large width |
| `badge.xl.font.size` | `--p-badge-xl-font-size` | XL font |
| **Severity Variants** |
| `badge.primary.background` | `--p-badge-primary-background` | Primary bg |
| `badge.primary.color` | `--p-badge-primary-color` | Primary color |
| `badge.secondary.background` | `--p-badge-secondary-background` | Secondary bg |
| `badge.success.background` | `--p-badge-success-background` | Success bg |
| `badge.info.background` | `--p-badge-info-background` | Info bg |
| `badge.warn.background` | `--p-badge-warn-background` | Warn bg |
| `badge.danger.background` | `--p-badge-danger-background` | Danger bg |
| `badge.contrast.background` | `--p-badge-contrast-background` | Contrast bg |

---

### Tag Design Tokens (21 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `tag.font.size` | `--p-tag-font-size` | Font size |
| `tag.font.weight` | `--p-tag-font-weight` | Font weight |
| `tag.padding` | `--p-tag-padding` | Padding |
| `tag.gap` | `--p-tag-gap` | Gap |
| `tag.border.radius` | `--p-tag-border-radius` | Border radius |
| `tag.rounded.border.radius` | `--p-tag-rounded-border-radius` | Rounded radius |
| `tag.icon.size` | `--p-tag-icon-size` | Icon size |
| **Severity Variants** |
| `tag.primary.background` | `--p-tag-primary-background` | Primary bg |
| `tag.primary.color` | `--p-tag-primary-color` | Primary color |
| `tag.secondary.background` | `--p-tag-secondary-background` | Secondary bg |
| `tag.success.background` | `--p-tag-success-background` | Success bg |
| `tag.info.background` | `--p-tag-info-background` | Info bg |
| `tag.warn.background` | `--p-tag-warn-background` | Warn bg |
| `tag.danger.background` | `--p-tag-danger-background` | Danger bg |
| `tag.contrast.background` | `--p-tag-contrast-background` | Contrast bg |

---

### Chip Design Tokens (18 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `chip.border.radius` | `--p-chip-border-radius` | Border radius |
| `chip.padding.x` | `--p-chip-padding-x` | Horizontal padding |
| `chip.padding.y` | `--p-chip-padding-y` | Vertical padding |
| `chip.gap` | `--p-chip-gap` | Gap |
| `chip.background` | `--p-chip-background` | Background |
| `chip.color` | `--p-chip-color` | Text color |
| `chip.image.width` | `--p-chip-image-width` | Image width |
| `chip.image.height` | `--p-chip-image-height` | Image height |
| `chip.icon.size` | `--p-chip-icon-size` | Icon size |
| `chip.icon.color` | `--p-chip-icon-color` | Icon color |
| `chip.remove.icon.size` | `--p-chip-remove-icon-size` | Remove icon size |
| `chip.remove.icon.color` | `--p-chip-remove-icon-color` | Remove icon color |

---

### ProgressBar Design Tokens (7 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `progressbar.background` | `--p-progressbar-background` | Track background |
| `progressbar.border.radius` | `--p-progressbar-border-radius` | Border radius |
| `progressbar.height` | `--p-progressbar-height` | Height |
| `progressbar.value.background` | `--p-progressbar-value-background` | Value bg |
| `progressbar.label.color` | `--p-progressbar-label-color` | Label color |
| `progressbar.label.font.size` | `--p-progressbar-label-font-size` | Label size |
| `progressbar.label.font.weight` | `--p-progressbar-label-font-weight` | Label weight |

---

### Skeleton Design Tokens (3 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `skeleton.border.radius` | `--p-skeleton-border-radius` | Border radius |
| `skeleton.background` | `--p-skeleton-background` | Background |
| `skeleton.animation.background` | `--p-skeleton-animation-background` | Animation bg |

---

## 11. Button Components

### Button Design Tokens (175 tokens)

| Token | CSS Variable | Description |
|-------|--------------|-------------|
| `button.border.radius` | `--p-button-border-radius` | Border radius |
| `button.rounded.border.radius` | `--p-button-rounded-border-radius` | Rounded radius |
| `button.gap` | `--p-button-gap` | Gap |
| `button.padding.x` | `--p-button-padding-x` | Horizontal padding |
| `button.padding.y` | `--p-button-padding-y` | Vertical padding |
| `button.icon.only.width` | `--p-button-icon-only-width` | Icon-only width |
| `button.label.font.weight` | `--p-button-label-font-weight` | Label weight |
| `button.raised.shadow` | `--p-button-raised-shadow` | Raised shadow |
| **Size Variants** |
| `button.sm.font.size` | `--p-button-sm-font-size` | Small font |
| `button.sm.padding.x` | `--p-button-sm-padding-x` | Small padding x |
| `button.sm.padding.y` | `--p-button-sm-padding-y` | Small padding y |
| `button.lg.font.size` | `--p-button-lg-font-size` | Large font |
| `button.lg.padding.x` | `--p-button-lg-padding-x` | Large padding x |
| `button.lg.padding.y` | `--p-button-lg-padding-y` | Large padding y |
| **Primary Severity** |
| `button.primary.background` | `--p-button-primary-background` | Primary bg |
| `button.primary.hover.background` | `--p-button-primary-hover-background` | Hover bg |
| `button.primary.active.background` | `--p-button-primary-active-background` | Active bg |
| `button.primary.border.color` | `--p-button-primary-border-color` | Border |
| `button.primary.color` | `--p-button-primary-color` | Text color |
| **Secondary Severity** |
| `button.secondary.background` | `--p-button-secondary-background` | Secondary bg |
| `button.secondary.hover.background` | `--p-button-secondary-hover-background` | Hover bg |
| `button.secondary.color` | `--p-button-secondary-color` | Text color |
| **Info Severity** |
| `button.info.background` | `--p-button-info-background` | Info bg |
| `button.info.hover.background` | `--p-button-info-hover-background` | Hover bg |
| `button.info.color` | `--p-button-info-color` | Text color |
| **Success Severity** |
| `button.success.background` | `--p-button-success-background` | Success bg |
| `button.success.hover.background` | `--p-button-success-hover-background` | Hover bg |
| `button.success.color` | `--p-button-success-color` | Text color |
| **Warning Severity** |
| `button.warn.background` | `--p-button-warn-background` | Warn bg |
| `button.warn.hover.background` | `--p-button-warn-hover-background` | Hover bg |
| `button.warn.color` | `--p-button-warn-color` | Text color |
| **Danger Severity** |
| `button.danger.background` | `--p-button-danger-background` | Danger bg |
| `button.danger.hover.background` | `--p-button-danger-hover-background` | Hover bg |
| `button.danger.color` | `--p-button-danger-color` | Text color |
| **Help Severity** |
| `button.help.background` | `--p-button-help-background` | Help bg |
| `button.help.hover.background` | `--p-button-help-hover-background` | Hover bg |
| `button.help.color` | `--p-button-help-color` | Text color |
| **Contrast Severity** |
| `button.contrast.background` | `--p-button-contrast-background` | Contrast bg |
| `button.contrast.hover.background` | `--p-button-contrast-hover-background` | Hover bg |
| `button.contrast.color` | `--p-button-contrast-color` | Text color |
| **Outlined Variant** |
| `button.outlined.primary.border.color` | `--p-button-outlined-primary-border-color` | Outlined primary |
| `button.outlined.primary.color` | `--p-button-outlined-primary-color` | Outlined text |
| `button.outlined.secondary.border.color` | `--p-button-outlined-secondary-border-color` | Outlined secondary |
| **Text Variant** |
| `button.text.primary.color` | `--p-button-text-primary-color` | Text primary |
| `button.text.secondary.color` | `--p-button-text-secondary-color` | Text secondary |
| **Link Variant** |
| `button.link.color` | `--p-button-link-color` | Link color |
| `button.link.hover.color` | `--p-button-link-hover-color` | Link hover |
| `button.link.active.color` | `--p-button-link-active-color` | Link active |

---

## Best Practices

### 1. Token Hierarchy

```
✅ Use semantic tokens for common design elements
✅ Use component tokens only for specific customizations  
✅ Avoid direct CSS overrides - use design tokens
```

### 2. Dark Mode Support

```typescript
// Define tokens per color scheme
colorScheme: {
  light: {
    surface: {
      0: '#ffffff',
      // ... light mode surfaces
    }
  },
  dark: {
    surface: {
      0: '#121212',
      // ... dark mode surfaces
    }
  }
}
```

### 3. Scoped Token Customization

```html
<!-- Component-level token override -->
<p-toggleswitch 
  [dt]="{
    width: '3rem',
    handle: { size: '1.5rem' }
  }" 
/>
```

### 4. CSS Layer Configuration

```typescript
options: {
  cssLayer: {
    name: 'primeng',
    order: 'tailwind-base, primeng, tailwind-utilities'
  }
}
```

### 5. Focus Ring Standards

All interactive components share focus ring tokens:
- `focus.ring.width` - Ring thickness
- `focus.ring.style` - Ring style (solid, dotted, etc.)
- `focus.ring.color` - Ring color
- `focus.ring.offset` - Distance from element
- `focus.ring.shadow` - Ring shadow effect

---

## Quick Reference Card

| Category | Key Components | Token Count |
|----------|---------------|-------------|
| **Form** | InputText, Select, Checkbox, DatePicker | 29-78 per component |
| **Data** | Table, Tree, Listbox, Paginator | 22-36 per component |
| **Panel** | Card, Accordion, Tabs, Panel | 10-44 per component |
| **Overlay** | Dialog, Drawer, Popover, Tooltip | 7-12 per component |
| **File** | FileUpload | 22 tokens |
| **Menu** | Menu, Menubar, Steps, Breadcrumb | 16-42 per component |
| **Messages** | Message, Toast | 68-85 per component |
| **Media** | Carousel, Galleria | 15+ per component |
| **Misc** | Avatar, Badge, Tag, Skeleton | 3-30 per component |
| **Button** | Button | 175 tokens |

---

**Document Version:** PrimeNG 21+  
**Last Updated:** January 2026  
**Source:** PrimeNG MCP Integration

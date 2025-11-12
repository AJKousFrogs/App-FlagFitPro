# Roster Table Component

## Overview

Data table component for displaying athlete rosters. Includes sorting, filtering, pagination, and row actions. This is an organism combining card molecule with table structure.

## Usage

Copy the HTML from `roster-table.html` into your page. The table displays athlete information in a sortable, paginated format.

## HTML Structure

```html
<div class="roster-table-card card">
    <div class="card-header">
        <h3>Table Title</h3>
        <div class="table-actions">
            <!-- Action buttons -->
        </div>
    </div>
    <div class="card-body">
        <div class="table-wrapper">
            <table class="roster-table">
                <!-- Table content -->
            </table>
        </div>
    </div>
    <div class="card-footer">
        <div class="table-pagination">
            <!-- Pagination controls -->
        </div>
    </div>
</div>
```

## Features

- **Sortable Columns** - Click headers to sort
- **Row Actions** - Edit, view, delete per row
- **Pagination** - Navigate through pages
- **Status Badges** - Visual status indicators
- **Avatar Images** - Player photos

## CSS Classes

- `.roster-table-card` - Card wrapper
- `.table-wrapper` - Scrollable container
- `.roster-table` - Table element
- `.table-sort` - Sortable header button
- `.table-actions` - Action buttons container
- `.table-pagination` - Pagination container
- `.pagination-controls` - Pagination buttons

## Accessibility

- ✅ Semantic `<table>` element
- ✅ `<thead>` and `<tbody>` structure
- ✅ `role="table"` for clarity
- ✅ `aria-label` for action buttons
- ✅ Keyboard navigation support

## Responsive Behavior

On mobile:
- Table may scroll horizontally
- Columns may stack
- Actions may move to overflow menu
- Pagination may simplify

## Notes

- Table requires JavaScript for sorting
- Pagination requires backend or client-side logic
- Avatar images should have alt text
- Consider adding search/filter functionality
- Ensure sufficient contrast for readability


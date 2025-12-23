# Empty State Component

A standardized empty state component for displaying when there's no data.

## Usage

```html
<div class="empty-state-container">
  <div class="empty-state-icon">
    <i data-lucide="inbox" style="width: 64px; height: 64px;"></i>
  </div>
  <h3 class="empty-state-title">No items found</h3>
  <p class="empty-state-message">There are no items to display at this time.</p>
  <button class="btn btn-primary">Add Item</button>
</div>
```

## Variants

### With Icon

```html
<div class="empty-state-container">
  <div class="empty-state-icon">
    <i data-lucide="search" style="width: 64px; height: 64px;"></i>
  </div>
  <h3 class="empty-state-title">No results found</h3>
  <p class="empty-state-message">Try adjusting your search criteria.</p>
</div>
```

### Minimal

```html
<div class="empty-state-container empty-state-minimal">
  <h3 class="empty-state-title">No data</h3>
</div>
```

## CSS Classes

- `.empty-state-container` - Main container
- `.empty-state-icon` - Icon wrapper
- `.empty-state-image` - Image wrapper
- `.empty-state-title` - Title text
- `.empty-state-message` - Message text
- `.empty-state-minimal` - Minimal variant

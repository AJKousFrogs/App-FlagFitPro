# Pagination Component

A reusable pagination component for navigating through paginated data.

## Usage

```html
<nav class="pagination-container" aria-label="Pagination">
  <div class="pagination-info">
    <span class="pagination-text">
      Showing <span class="start-item">1</span> - <span class="end-item">10</span> of <span class="total-items">100</span>
    </span>
  </div>

  <div class="pagination-controls">
    <button type="button" class="pagination-btn pagination-first" disabled>
      <i data-lucide="chevrons-left"></i>
    </button>
    <button type="button" class="pagination-btn pagination-prev" disabled>
      <i data-lucide="chevron-left"></i>
    </button>
    <div class="pagination-pages">
      <button type="button" class="pagination-page active">1</button>
      <button type="button" class="pagination-page">2</button>
      <button type="button" class="pagination-page">3</button>
    </div>
    <button type="button" class="pagination-btn pagination-next">
      <i data-lucide="chevron-right"></i>
    </button>
    <button type="button" class="pagination-btn pagination-last">
      <i data-lucide="chevrons-right"></i>
    </button>
  </div>
</nav>
```

## CSS Classes

- `.pagination-container` - Main container
- `.pagination-info` - Page info section
- `.pagination-controls` - Controls wrapper
- `.pagination-btn` - Navigation button
- `.pagination-page` - Page number button
- `.pagination-page.active` - Active page
- `.pagination-ellipsis` - Ellipsis separator
- `.pagination-items-per-page` - Items per page selector


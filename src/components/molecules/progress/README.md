# Progress Component

A progress indicator component for showing completion status.

## Usage

```html
<!-- Linear Progress -->
<div class="progress-container">
  <div class="progress-header">
    <span class="progress-label">Upload Progress</span>
    <span class="progress-value">75%</span>
  </div>
  <div class="progress-bar-wrapper">
    <div
      class="progress-bar"
      role="progressbar"
      aria-valuenow="75"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="progress-fill" style="width: 75%"></div>
    </div>
  </div>
</div>
```

## Variants

- **Linear**: Horizontal progress bar
- **Circular**: Circular progress indicator
- **Steps**: Step-by-step progress indicator

## Sizes

- Small: `.progress-sm`
- Medium: Default
- Large: `.progress-lg`

## Accessibility

- Uses `role="progressbar"`
- Includes `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Supports `aria-label` for custom labels

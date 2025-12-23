# Stepper Component

A stepper/wizard component for multi-step forms and processes.

## Usage

```html
<div class="stepper-container">
  <div class="stepper-header">
    <div class="stepper-steps">
      <div class="stepper-step completed">
        <div class="step-number">1</div>
        <div class="step-label">Step 1</div>
      </div>
      <div class="stepper-step active">
        <div class="step-number">2</div>
        <div class="step-label">Step 2</div>
      </div>
      <div class="stepper-step">
        <div class="step-number">3</div>
        <div class="step-label">Step 3</div>
      </div>
    </div>
  </div>
</div>
```

## Variants

- **Horizontal**: Default horizontal layout
- **Vertical**: `.stepper-vertical` class for vertical layout

## States

- **Default**: Upcoming step
- **Active**: `.active` class for current step
- **Completed**: `.completed` class for finished steps

## Features

- Step navigation
- Progress tracking
- Clickable steps (optional)
- Responsive design

## Accessibility

- Uses `aria-current="step"` for active step
- Includes `aria-label` for step buttons
- Supports keyboard navigation

/**
 * Button Components - Unified Design System
 *
 * This module exports the standard button components for the application.
 * All buttons in the app should use these components.
 *
 * @example Import in a component
 * ```typescript
 * import { ButtonComponent, IconButtonComponent } from '@shared/components/button';
 *
 * @Component({
 *   imports: [ButtonComponent, IconButtonComponent],
 *   // ...
 * })
 * export class MyComponent {}
 * ```
 */

export { ButtonComponent } from "./button.component";
export type { ButtonVariant, ButtonSize } from "./button.component";
export { IconButtonComponent } from "./icon-button.component";
export type {
  IconButtonVariant,
  IconButtonSize,
} from "./icon-button.component";

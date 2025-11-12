# Radix UI Navigation Menu Implementation

This document describes the implementation of a modern, accessible navigation menu using Radix UI primitives for the Flag Football app.

## Overview

The new navigation menu is built using [Radix UI Navigation Menu](https://www.radix-ui.com/primitives/docs/components/navigation-menu) primitives, providing:

- **Accessibility**: Full keyboard navigation and screen reader support
- **Modern Design**: Smooth animations and hover effects
- **Dropdown Menus**: Rich content with callouts and descriptions
- **Mobile Responsive**: Adapts to different screen sizes
- **Type Safety**: Built with React and TypeScript support

## Components

### 1. RadixNavigationMenu.jsx

The main navigation component that implements the Radix UI Navigation Menu.

**Features:**

- React Router integration with active state detection
- Dropdown menus for Training, Community, Tournaments, and Performance
- Brand logo and navigation items
- Custom Link component for proper routing

**Key Sections:**

- **Dashboard**: Main overview page
- **Training**: Dropdown with Plyometrics, Isometrics, and Recovery
- **Community**: Dropdown with Forums, Leaderboards, Teams, and Chat
- **Tournaments**: Dropdown with Active, Upcoming, Results, and Standings
- **Performance**: Dropdown with Analytics, Predictions, Health, and Nutrition
- **Profile**: User profile and settings

### 2. radix-navigation.css

Comprehensive styling for the navigation menu with:

- **Animations**: Smooth enter/exit transitions
- **Responsive Design**: Mobile-first approach
- **Dark Mode Support**: Automatic theme detection
- **Focus States**: Accessibility-friendly focus indicators
- **Hover Effects**: Interactive feedback

### 3. NavigationDemo.jsx

A demonstration page showcasing the navigation menu in action.

## Usage

### Basic Implementation

```jsx
import RadixNavigationMenu from "./components/RadixNavigationMenu";

function App() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <RadixNavigationMenu />
    </nav>
  );
}
```

### With React Router

The component automatically integrates with React Router and detects active routes:

```jsx
import { BrowserRouter as Router } from "react-router-dom";
import RadixNavigationMenu from "./components/RadixNavigationMenu";

function App() {
  return (
    <Router>
      <nav>
        <RadixNavigationMenu />
      </nav>
      {/* Your routes here */}
    </Router>
  );
}
```

## Demo

To see the navigation menu in action, visit `/nav-demo` in your application.

## Customization

### Adding New Menu Items

1. Add the item to the navigation structure in `RadixNavigationMenu.jsx`
2. Import the appropriate icon from `@heroicons/react/24/outline`
3. Add the corresponding route in your routing configuration

### Styling Customization

The navigation uses CSS custom properties and Tailwind classes. You can customize:

- Colors in `radix-navigation.css`
- Spacing and layout in the component
- Animations and transitions
- Dark mode appearance

### Adding Dropdown Content

```jsx
<NavigationMenu.Item>
  <NavigationMenu.Trigger>
    <YourIcon className="h-5 w-5" />
    <span>Your Section</span>
    <CaretDownIcon className="CaretDown" aria-hidden />
  </NavigationMenu.Trigger>
  <NavigationMenu.Content>
    <ul className="List two">
      <ListItem href="/your-route" title="Your Item">
        Description of your item.
      </ListItem>
    </ul>
  </NavigationMenu.Content>
</NavigationMenu.Item>
```

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support with arrow keys, Enter, Space, and Escape
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Automatic focus handling for dropdowns
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user's motion preferences

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- `@radix-ui/react-navigation-menu`: Core navigation primitives
- `@radix-ui/react-icons`: Icons for dropdown indicators
- `@heroicons/react`: Navigation icons
- `react-router-dom`: Routing integration
- `tailwindcss`: Styling framework

## Migration from Previous Navigation

The new Radix Navigation Menu can replace the existing `Navigation2025.jsx` component. To migrate:

1. Replace the import in `App.jsx`
2. Update any custom styling references
3. Test all navigation flows
4. Verify accessibility features

## Performance

- **Code Splitting**: Navigation is loaded with the main bundle
- **Lazy Loading**: Dropdown content is rendered on demand
- **Optimized Animations**: CSS-based animations for smooth performance
- **Minimal Re-renders**: Efficient React component structure

## Future Enhancements

- [ ] Add search functionality within dropdowns
- [ ] Implement breadcrumb navigation
- [ ] Add user preferences for navigation layout
- [ ] Support for nested submenus
- [ ] Integration with analytics tracking

## Troubleshooting

### Common Issues

1. **Routes not working**: Ensure React Router is properly configured
2. **Styling issues**: Check that `radix-navigation.css` is imported
3. **Accessibility problems**: Verify proper ARIA attributes are present
4. **Mobile responsiveness**: Test on various screen sizes

### Debug Mode

Add `data-debug` attribute to the root component for development:

```jsx
<NavigationMenu.Root className="NavigationMenuRoot" data-debug>
```

## Contributing

When contributing to the navigation:

1. Follow the existing code structure
2. Maintain accessibility standards
3. Test on multiple devices and browsers
4. Update documentation as needed
5. Ensure proper TypeScript types if applicable

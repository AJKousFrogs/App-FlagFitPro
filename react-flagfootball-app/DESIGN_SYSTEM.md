# FlagFit Pro Design System

## 🎨 Color Palette

### Primary Colors
- **Green-600**: `#16A34A` - Main buttons, links, primary actions
- **Green-700**: `#15803D` - Hover states, emphasis
- **Green-800**: `#166534` - Text accents, progress bars
- **Green-500**: `#22C55E` - Success states, achievements

### Background Colors
- **White**: `#FFFFFF` - Main backgrounds, cards, modals
- **Gray-50**: `#F8FAFC` - Secondary backgrounds, subtle gradients
- **Gray-100**: `#F1F5F9` - Light backgrounds, hover states

### Text Colors
- **Gray-900**: `#111827` - Main headings, primary text
- **Gray-700**: `#374151` - Secondary text, labels, descriptions
- **Gray-600**: `#4B5563` - Muted text, placeholders

### Border Colors
- **Gray-200**: `#E5E7EB` - Card borders, dividers, input borders
- **Gray-300**: `#D1D5DB` - Focus states, active borders

### Gradient Backgrounds
```css
/* Primary page background */
background: linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%);

/* Green accent backgrounds */
background: linear-gradient(135deg, #16A34A 0%, #15803D 100%);

/* Card backgrounds */
background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
```

## 📝 Typography

### Font Family
- **Primary**: `Inter` - Modern, clean, highly readable
- **Fallback**: `Arial, sans-serif`

### Font Weights
- **Regular**: `400` - Body text, descriptions
- **Medium**: `500` - Labels, secondary headings
- **Semibold**: `600` - Buttons, important text
- **Bold**: `700` - Main headings, emphasis

### Font Sizes
- **H1**: `text-4xl` (36px) - Page titles
- **H2**: `text-2xl` (24px) - Section headings
- **H3**: `text-xl` (20px) - Card titles
- **Body**: `text-base` (16px) - Main content
- **Small**: `text-sm` (14px) - Labels, captions
- **Extra Small**: `text-xs` (12px) - Badges, metadata

## 🧩 Component Library

### Buttons

#### Primary Button
```jsx
<button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
  Primary Action
</button>
```

#### Secondary Button
```jsx
<button className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold transition-colors">
  Secondary Action
</button>
```

#### Ghost Button
```jsx
<button className="text-green-600 hover:text-green-700 font-semibold transition-colors">
  Ghost Action
</button>
```

### Cards

#### Standard Card
```jsx
<div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">
  <h3 className="text-xl font-bold text-gray-900 mb-4">Card Title</h3>
  <p className="text-gray-700">Card content goes here...</p>
</div>
```

#### Gradient Card
```jsx
<div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
  <h3 className="text-xl font-bold mb-4">Gradient Card</h3>
  <p className="text-green-100">Content with white text...</p>
</div>
```

### Form Elements

#### Input Field
```jsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Label
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
    placeholder="Placeholder text"
  />
</div>
```

#### Select Dropdown
```jsx
<select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
  <option>Select an option</option>
</select>
```

### Progress Indicators

#### Progress Bar
```jsx
<div className="w-full bg-gray-200 rounded-full h-3">
  <div 
    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000"
    style={{ width: '75%' }}
  ></div>
</div>
<p className="text-sm text-green-700 mt-2">75% Complete</p>
```

#### Loading Spinner
```jsx
<div className="flex items-center justify-center">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
</div>
```

## 📱 Page Layouts

### Login/Register Pages
- **Background**: White to light green gradient
- **Form Container**: White background with gray borders
- **Buttons**: Green background
- **Text**: Black for headings, gray for descriptions
- **Links**: Green color

### Dashboard
- **Background**: White to light green gradient
- **Cards**: White backgrounds with gray borders
- **Progress Indicators**: Green gradients
- **AI Coach Section**: Green gradient background
- **Daily Challenge**: Green gradient background

### Training View
- **Background**: White to light green gradient
- **Training Categories**: All green gradients
- **Player Progress**: White background with green accents
- **Buttons**: All green color scheme

### Profile/Community
- **Background**: White to light green gradient
- **Content Cards**: White backgrounds
- **Interactive Elements**: Green accents

## 🎯 Usage Guidelines

### Color Usage Rules
1. **Primary Green** (`#16A34A`) for all interactive elements
2. **White backgrounds** for content areas and cards
3. **Black text** for headings and primary content
4. **Gray text** for secondary content and descriptions
5. **Green gradients** for highlights and progress indicators

### Accessibility
- **Color Contrast**: All text meets WCAG AA standards (4.5:1 ratio)
- **Focus Indicators**: Green ring (`#16A34A`) for all interactive elements
- **Text Resizing**: Layout remains functional up to 200% zoom
- **Screen Readers**: All interactive elements have proper ARIA labels

### Responsive Design
- **Mobile-first** approach with Tailwind CSS breakpoints
- **Touch targets** minimum 44x44px for mobile accessibility
- **Typography** scales appropriately across device sizes
- **Spacing** uses consistent 8px grid system

### Component Consistency
- **Border radius**: 12px for cards and buttons
- **Shadows**: Subtle shadows for depth and hierarchy
- **Transitions**: Smooth color transitions (150ms) for interactions
- **Spacing**: Consistent padding and margins using Tailwind spacing scale

## 🔧 Implementation

### CSS Variables
```css
:root {
  --color-primary: #16A34A;
  --color-primary-hover: #15803D;
  --color-background: #FFFFFF;
  --color-surface: #F8FAFC;
  --color-text: #111827;
  --color-text-light: #374151;
  --color-border: #E5E7EB;
  --radius: 12px;
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}
```

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
        }
      }
    }
  }
}
```

## 📋 Checklist for New Components

When creating new components, ensure they follow:

- [ ] Use FlagFit Pro color palette
- [ ] Maintain consistent spacing (8px grid)
- [ ] Include proper focus states
- [ ] Test accessibility (color contrast, screen readers)
- [ ] Add responsive design considerations
- [ ] Include smooth transitions
- [ ] Follow component patterns established above

This design system ensures consistency across the entire FlagFit Pro application and provides a solid foundation for future development. 
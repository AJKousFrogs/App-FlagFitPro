# FlagFit Pro Color Reference

## 🎨 Quick Color Guide

### Primary Colors (Copy & Paste)
```css
/* Main Green */
background-color: #16A34A;  /* Green-600 */
color: #16A34A;

/* Hover Green */
background-color: #15803D;  /* Green-700 */
color: #15803D;

/* Dark Green */
background-color: #166534;  /* Green-800 */
color: #166534;

/* Light Green */
background-color: #22C55E;  /* Green-500 */
color: #22C55E;
```

### Background Colors
```css
/* White Background */
background-color: #FFFFFF;

/* Light Gray Background */
background-color: #F8FAFC;  /* Gray-50 */

/* Very Light Gray */
background-color: #F1F5F9;  /* Gray-100 */
```

### Text Colors
```css
/* Main Text (Black) */
color: #111827;  /* Gray-900 */

/* Secondary Text */
color: #374151;  /* Gray-700 */

/* Muted Text */
color: #4B5563;  /* Gray-600 */
```

### Border Colors
```css
/* Light Border */
border-color: #E5E7EB;  /* Gray-200 */

/* Focus Border */
border-color: #D1D5DB;  /* Gray-300 */
```

## 🎯 Tailwind Classes

### Buttons
```jsx
// Primary Button
className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"

// Secondary Button
className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold transition-colors"

// Ghost Button
className="text-green-600 hover:text-green-700 font-semibold transition-colors"
```

### Cards
```jsx
// Standard Card
className="bg-white border border-gray-200 rounded-xl shadow-lg p-6"

// Gradient Card
className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white"
```

### Form Elements
```jsx
// Input Field
className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"

// Label
className="block text-sm font-medium text-gray-700 mb-2"
```

### Progress Indicators
```jsx
// Progress Bar Background
className="w-full bg-gray-200 rounded-full h-3"

// Progress Bar Fill
className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000"

// Progress Text
className="text-sm text-green-700 mt-2"
```

## 🌈 Gradients

### Page Backgrounds
```css
/* Main Page Background */
background: linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%);

/* Green Accent Background */
background: linear-gradient(135deg, #16A34A 0%, #15803D 100%);

/* Card Background */
background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
```

### Tailwind Gradients
```jsx
// Page Background
className="bg-gradient-to-br from-white via-green-50 to-green-100"

// Green Gradient
className="bg-gradient-to-r from-green-600 to-green-700"

// Card Gradient
className="bg-gradient-to-r from-green-500 to-green-600"
```

## 📱 Page-Specific Colors

### Login/Register Pages
- **Background**: `bg-gradient-to-br from-white via-green-50 to-green-100`
- **Form Container**: `bg-white border border-gray-200`
- **Buttons**: `bg-green-600 hover:bg-green-700`
- **Text**: `text-gray-900` (headings), `text-gray-600` (descriptions)
- **Links**: `text-green-600 hover:text-green-700`

### Dashboard
- **Background**: `bg-gradient-to-br from-white via-green-50 to-green-100`
- **Cards**: `bg-white border border-gray-200`
- **AI Coach**: `bg-gradient-to-r from-green-600 to-green-700`
- **Daily Challenge**: `bg-gradient-to-r from-green-500 to-green-600`
- **Progress Bars**: `bg-gradient-to-r from-green-500 to-green-600`

### Training View
- **Background**: `bg-gradient-to-br from-white via-green-50 to-green-100`
- **Training Categories**: All use `bg-gradient-to-br from-green-500 to-green-600`
- **Player Progress**: `bg-white border border-gray-200`
- **Buttons**: All use `bg-green-600 hover:bg-green-700`

### Profile/Community
- **Background**: `bg-gradient-to-br from-white via-green-50 to-green-100`
- **Content Cards**: `bg-white border border-gray-200`
- **Interactive Elements**: `text-green-600` or `bg-green-600`

## ⚡ Quick Copy Snippets

### Common Patterns
```jsx
// Standard Page Layout
<div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-green-100 text-gray-900">

// Standard Card
<div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6">

// Standard Button
<button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">

// Standard Input
<input className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">

// Standard Progress Bar
<div className="w-full bg-gray-200 rounded-full h-3">
  <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full" style={{width: '75%'}}></div>
</div>
```

## 🚫 What NOT to Use

**Avoid these colors to maintain consistency:**
- ❌ Blue (`#3B82F6`, `bg-blue-600`)
- ❌ Purple (`#8B5CF6`, `bg-purple-600`)
- ❌ Red (`#EF4444`, `bg-red-600`)
- ❌ Orange (`#F97316`, `bg-orange-600`)
- ❌ Dark backgrounds (`#1F2937`, `bg-gray-800`)

**Use these instead:**
- ✅ Green (`#16A34A`, `bg-green-600`)
- ✅ White (`#FFFFFF`, `bg-white`)
- ✅ Light gray (`#F8FAFC`, `bg-gray-50`)
- ✅ Black text (`#111827`, `text-gray-900`)

## 📋 Checklist

When building new components, ensure:
- [ ] Uses FlagFit Pro green (`#16A34A`) for primary actions
- [ ] Uses white backgrounds for content areas
- [ ] Uses black text (`#111827`) for headings
- [ ] Uses gray text (`#374151`) for descriptions
- [ ] Uses green gradients for highlights
- [ ] Includes proper hover states
- [ ] Maintains accessibility contrast ratios 
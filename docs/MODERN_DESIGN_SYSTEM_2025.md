# FlagFit Pro - Modern Design System 2025

## 🎯 **System Overview**

### **Design Philosophy**
- **Athletic Energy**: High-performance visual language for competitive sports
- **Clean Minimal**: Uncluttered interface focusing on essential information
- **High Contrast**: WCAG AA compliant for optimal accessibility
- **Mobile-First**: 70% mobile usage for players, desktop priority for coaches
- **Subtle Dynamics**: 70% subtle animations, 30% dynamic celebrations

### **Target Audience**
- **Primary**: Athletes aged 18-45 (mobile-focused)
- **Secondary**: Coaches/Staff (desktop-focused)
- **Usage**: Performance tracking, team management, game analysis

---

## 🎨 **Color System**

### **Radix Colors Palette**

#### **Light Theme Colors**
```css
/* Primary Accent - Blue */
--radix-accent-1: #f8fafc;   /* Lightest backgrounds */
--radix-accent-2: #f1f5f9;   /* Subtle backgrounds */
--radix-accent-3: #e2e8f0;   /* Borders and dividers */
--radix-accent-4: #cbd5e1;   /* Disabled states */
--radix-accent-5: #94a3b8;   /* Placeholder text */
--radix-accent-6: #64748b;   /* Secondary text */
--radix-accent-7: #475569;   /* Primary text */
--radix-accent-8: #334155;   /* Strong text */
--radix-accent-9: #1e293b;   /* Headlines */
--radix-accent-10: #0f172a;  /* Authority text */
--radix-accent-11: #5271FF;  /* Main brand color */
--radix-accent-12: #0c4a6e;  /* Darkest accent */

/* Gray System */
--radix-gray-1: #fafafa;     /* Lightest backgrounds */
--radix-gray-2: #f5f5f5;     /* Card backgrounds */
--radix-gray-3: #e5e5e5;     /* Borders */
--radix-gray-4: #d4d4d4;     /* Dividers */
--radix-gray-5: #a3a3a3;     /* Disabled text */
--radix-gray-6: #8a8a8a;     /* Placeholder text */
--radix-gray-7: #4b4b4b;     /* Secondary text */
--radix-gray-8: #333333;     /* Primary text */
--radix-gray-9: #111111;     /* Main gray */
--radix-gray-10: #000000;    /* Strong text */
--radix-gray-11: #111111;    /* Headlines */
--radix-gray-12: #000000;    /* Authority text */

/* Background System */
--radix-background-1: #ffffff; /* Main background */
--radix-background-2: #fafafa; /* Secondary background */
--radix-background-3: #f5f5f5; /* Card background */
--radix-background-4: #f0f0f0; /* Hover states */
--radix-background-5: #e5e5e5; /* Active states */
--radix-background-6: #d4d4d4; /* Disabled states */
--radix-background-7: #a3a3a3; /* Overlay backgrounds */
--radix-background-8: #8a8a8a; /* Modal backgrounds */
--radix-background-9: #4b4b4b; /* Dark overlays */
--radix-background-10: #333333; /* Dark backgrounds */
--radix-background-11: #111111; /* Darkest backgrounds */
--radix-background-12: #000000; /* Pure black */
```

#### **Dark Theme Colors**
```css
/* Primary Accent - White/Blue */
--dark-accent-1: #0f172a;    /* Darkest backgrounds */
--dark-accent-2: #1e293b;    /* Dark backgrounds */
--dark-accent-3: #334155;    /* Borders and dividers */
--dark-accent-4: #475569;    /* Disabled states */
--dark-accent-5: #64748b;    /* Placeholder text */
--dark-accent-6: #94a3b8;    /* Secondary text */
--dark-accent-7: #cbd5e1;    /* Primary text */
--dark-accent-8: #e2e8f0;    /* Strong text */
--dark-accent-9: #f1f5f9;    /* Headlines */
--dark-accent-10: #f8fafc;   /* Authority text */
--dark-accent-11: #ffffff;   /* Main brand color */
--dark-accent-12: #f0f9ff;   /* Lightest accent */

/* Gray System */
--dark-gray-1: #000000;      /* Darkest backgrounds */
--dark-gray-2: #111111;      /* Dark backgrounds */
--dark-gray-3: #333333;      /* Borders */
--dark-gray-4: #4b4b4b;      /* Dividers */
--dark-gray-5: #8a8a8a;      /* Disabled text */
--dark-gray-6: #a3a3a3;      /* Placeholder text */
--dark-gray-7: #d4d4d4;      /* Secondary text */
--dark-gray-8: #e5e5e5;      /* Primary text */
--dark-gray-9: #5271FF;      /* Main gray */
--dark-gray-10: #f5f5f5;     /* Strong text */
--dark-gray-11: #fafafa;     /* Headlines */
--dark-gray-12: #ffffff;     /* Authority text */

/* Background System */
--dark-background-1: #000000; /* Main background */
--dark-background-2: #111111; /* Secondary background */
--dark-background-3: #333333; /* Card background */
--dark-background-4: #4b4b4b; /* Hover states */
--dark-background-5: #8a8a8a; /* Active states */
--dark-background-6: #a3a3a3; /* Disabled states */
--dark-background-7: #d4d4d4; /* Overlay backgrounds */
--dark-background-8: #e5e5e5; /* Modal backgrounds */
--dark-background-9: #f5f5f5; /* Light overlays */
--dark-background-10: #fafafa; /* Light backgrounds */
--dark-background-11: #ffffff; /* Lightest backgrounds */
--dark-background-12: #ffffff; /* Pure white */
```

### **Typography System**

#### **Font Family**
```css
/* Primary Font: Poppins */
font-family: 'Poppins', ui-sans-serif, system-ui, sans-serif;

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### **Type Scale**
```css
/* Text Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
--text-6xl: 3.75rem;   /* 60px */
```

### **Spacing System**
```css
/* 4-point grid system */
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 0.75rem;   /* 12px */
--space-lg: 1rem;      /* 16px */
--space-xl: 1.5rem;    /* 24px */
--space-2xl: 2rem;     /* 32px */
--space-3xl: 3rem;     /* 48px */
--space-4xl: 4rem;     /* 64px */
```

### **Border Radius System**
```css
/* Border Radius */
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem;   /* 8px */
--radius-xl: 0.75rem;  /* 12px */
--radius-2xl: 1rem;    /* 16px */
--radius-full: 9999px; /* Full circle */
```

### **Shadow System**
```css
/* Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

---

## 🎨 **Component Guidelines**

### **Buttons**
```css
/* Primary Button */
.btn-primary {
  background: var(--radix-accent-11);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  font-family: 'Poppins', sans-serif;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--radix-accent-11);
  border: 2px solid var(--radix-accent-11);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  font-family: 'Poppins', sans-serif;
}
```

### **Cards**
```css
/* Card Component */
.card {
  background: var(--radix-background-1);
  border: 1px solid var(--radix-accent-3);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  font-family: 'Poppins', sans-serif;
}
```

### **Forms**
```css
/* Input Field */
.input {
  background: var(--radix-background-1);
  border: 1px solid var(--radix-accent-3);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  font-family: 'Poppins', sans-serif;
  color: var(--radix-accent-7);
}

.input:focus {
  outline: none;
  border-color: var(--radix-accent-11);
  box-shadow: 0 0 0 3px rgba(82, 113, 255, 0.1);
}
```

---

## 🌙 **Dark Mode Implementation**

### **CSS Variables for Theme Switching**
```css
/* Light Theme (default) */
:root {
  --primary-accent: #5271FF;
  --primary-gray: #111111;
  --primary-background: #ffffff;
  
  --text-primary: #111111;
  --text-secondary: #4b4b4b;
  --text-muted: #8a8a8a;
  
  --background-primary: #ffffff;
  --background-secondary: #fafafa;
  --background-tertiary: #f5f5f5;
  
  --border-primary: #e5e5e5;
  --border-secondary: #d4d4d4;
}

/* Dark Theme */
[data-theme="dark"] {
  --primary-accent: #ffffff;
  --primary-gray: #5271FF;
  --primary-background: #111111;
  
  --text-primary: #ffffff;
  --text-secondary: #e5e5e5;
  --text-muted: #a3a3a3;
  
  --background-primary: #111111;
  --background-secondary: #333333;
  --background-tertiary: #4b4b4b;
  
  --border-primary: #4b4b4b;
  --border-secondary: #333333;
}
```

---

## 📱 **Responsive Design**

### **Breakpoints**
```css
/* Mobile First Approach */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### **Container Max Widths**
```css
/* Container Sizes */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

---

## ♿ **Accessibility**

### **Color Contrast**
- **WCAG AA Compliance**: All text meets 4.5:1 contrast ratio
- **WCAG AAA Compliance**: All text meets 7:1 contrast ratio where possible
- **Focus Indicators**: Clear focus states with 3:1 contrast ratio

### **Typography**
- **Minimum Font Size**: 14px for body text
- **Line Height**: 1.5 for optimal readability
- **Font Weight**: Minimum 400 for body text, 600+ for headings

### **Interactive Elements**
- **Touch Targets**: Minimum 44px for mobile interactions
- **Hover States**: Clear visual feedback for all interactive elements
- **Focus Management**: Logical tab order and visible focus indicators

---

## 🎨 **Usage Examples**

### **Tailwind CSS Classes**
```html
<!-- Primary Button -->
<button class="bg-radix-accent-11 text-white px-6 py-3 rounded-lg font-medium font-poppins">
  Primary Action
</button>

<!-- Secondary Button -->
<button class="bg-transparent text-radix-accent-11 border-2 border-radix-accent-11 px-6 py-3 rounded-lg font-medium font-poppins">
  Secondary Action
</button>

<!-- Card Component -->
<div class="bg-radix-background-1 border border-radix-accent-3 rounded-lg p-6 shadow-sm font-poppins">
  <h3 class="text-radix-accent-9 font-semibold mb-4">Card Title</h3>
  <p class="text-radix-accent-6">Card content goes here...</p>
</div>

<!-- Input Field -->
<input class="bg-radix-background-1 border border-radix-accent-3 rounded-md px-3 py-3 font-poppins text-radix-accent-7 focus:border-radix-accent-11 focus:ring-2 focus:ring-radix-accent-11/20" placeholder="Enter text...">
```

### **CSS Custom Properties**
```css
/* Using CSS Variables */
.button {
  background: var(--radix-accent-11);
  color: white;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
}

.card {
  background: var(--radix-background-1);
  border: 1px solid var(--radix-accent-3);
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Poppins', sans-serif;
}
```

---

## 🔄 **Theme Switching**

### **JavaScript Implementation**
```javascript
// Theme switching function
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Initialize theme on page load
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

// Call on page load
initializeTheme();
```

---

## 📋 **Design Tokens**

### **Complete Token List**
```json
{
  "colors": {
    "radix": {
      "accent": {
        "1": "#f8fafc",
        "2": "#f1f5f9",
        "3": "#e2e8f0",
        "4": "#cbd5e1",
        "5": "#94a3b8",
        "6": "#64748b",
        "7": "#475569",
        "8": "#334155",
        "9": "#1e293b",
        "10": "#0f172a",
        "11": "#5271FF",
        "12": "#0c4a6e"
      },
      "gray": {
        "1": "#fafafa",
        "2": "#f5f5f5",
        "3": "#e5e5e5",
        "4": "#d4d4d4",
        "5": "#a3a3a3",
        "6": "#8a8a8a",
        "7": "#4b4b4b",
        "8": "#333333",
        "9": "#111111",
        "10": "#000000",
        "11": "#111111",
        "12": "#000000"
      },
      "background": {
        "1": "#ffffff",
        "2": "#fafafa",
        "3": "#f5f5f5",
        "4": "#f0f0f0",
        "5": "#e5e5e5",
        "6": "#d4d4d4",
        "7": "#a3a3a3",
        "8": "#8a8a8a",
        "9": "#4b4b4b",
        "10": "#333333",
        "11": "#111111",
        "12": "#000000"
      }
    }
  },
  "typography": {
    "fontFamily": {
      "sans": ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      "poppins": ["Poppins", "sans-serif"]
    },
    "fontWeight": {
      "light": 300,
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    }
  },
  "spacing": {
    "xs": "0.25rem",
    "sm": "0.5rem",
    "md": "0.75rem",
    "lg": "1rem",
    "xl": "1.5rem",
    "2xl": "2rem",
    "3xl": "3rem",
    "4xl": "4rem"
  },
  "borderRadius": {
    "sm": "0.25rem",
    "md": "0.375rem",
    "lg": "0.5rem",
    "xl": "0.75rem",
    "2xl": "1rem",
    "full": "9999px"
  }
}
```

This design system provides a comprehensive foundation for building consistent, accessible, and beautiful user interfaces using the Radix Colors palette and Poppins typography.
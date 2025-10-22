# GitHub Copilot Instructions for AdminOS

## Project Overview
AdminOS is a modern dashboard application built with Angular and styled using a glassy aesthetic design system.

## Technology Stack

### Core Framework
- **Angular** (v20+) - Using standalone components
- **TypeScript** - Type-safe development

### Styling & UI
- **Tailwind CSS v4** - Utility-first CSS framework
- **DaisyUI v5** - Component library for Tailwind CSS
- **Remix Icons** - Icon library (use class names like `ri-icon-name-fill` or `ri-icon-name-line`)

## Design System

### Color Palette (Glassy Theme)
- **Primary**: `#0ea5e9` (Sky Blue) - Use for main actions and highlights
- **Secondary**: `#8b5cf6` (Purple) - Use for secondary actions
- **Neutral Grays**: Range from `neutral-50` to `neutral-900`
- **Success**: `#36d399`
- **Warning**: `#fbbd23`
- **Error**: `#f87272`
- **Info**: `#3abff8`

### Design Principles
- **Border Radius**: Use `rounded-2xl` (1rem) as default for cards, buttons, and containers
- **Shadows**: Use `shadow-xl` for elevated components
- **Glassy Effect**: Use the `.glass` class for semi-transparent backgrounds with backdrop blur
- **Spacing**: Use generous padding (p-6, p-8) for comfortable layouts

## Code Style Guidelines

### Angular Components
```typescript
// Use standalone components
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-component-name',
  imports: [CommonModule],
  templateUrl: './component.html',
  styleUrl: './component.css'
})
export class ComponentName {
  // Use signals for reactive state
  protected readonly data = signal(initialValue);
}
```

### HTML/Templates
```html
<!-- Use @for instead of *ngFor -->
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}

<!-- Use @if instead of *ngIf -->
@if (condition) {
  <div>Content</div>
}

<!-- DaisyUI Components -->
<button class="btn btn-primary rounded-2xl">Button</button>
<div class="card glass rounded-2xl shadow-xl">Card content</div>

<!-- Remix Icons -->
<i class="ri-user-fill text-xl"></i>
<i class="ri-settings-3-line text-2xl text-primary"></i>
```

### DaisyUI Components to Use
- **Buttons**: `btn`, `btn-primary`, `btn-secondary`, `btn-ghost`, etc.
- **Cards**: `card`, `card-body`, `card-title`, `card-actions`
- **Modals**: `modal`, `modal-box`, `modal-action`
- **Alerts**: `alert`, `alert-info`, `alert-success`, `alert-warning`, `alert-error`
- **Forms**: `input`, `select`, `textarea`, `checkbox`, `radio`, `toggle`
- **Badges**: `badge`, `badge-primary`, `badge-secondary`
- **Loading**: `loading`, `loading-spinner`, `loading-dots`
- **Collapse/Accordion**: `collapse`, `collapse-plus`
- **Tabs**: `tabs`, `tab`, `tab-content`
- **Drawer**: `drawer`, `drawer-side`, `drawer-content`
- **Tables**: `table`, `table-zebra`
- **Progress**: `progress`
- **Rating**: `rating`
- **Stats**: `stats`, `stat`

### Tailwind CSS Utilities
- **Layout**: `grid`, `flex`, `container`, `mx-auto`
- **Spacing**: `p-{size}`, `m-{size}`, `gap-{size}`
- **Sizing**: `w-{size}`, `h-{size}`, `max-w-{size}`
- **Colors**: `bg-primary`, `text-neutral-700`, `border-white/20`
- **Effects**: `shadow-xl`, `backdrop-blur-lg`, `hover:shadow-2xl`
- **Transitions**: `transition-all`, `duration-300`, `hover:-translate-y-1`
- **Responsive**: `md:grid-cols-2`, `lg:grid-cols-3`

### Remix Icons Usage
- **Pattern**: `ri-{name}-{style}` where style is `fill` or `line`
- **Common Icons**:
  - Dashboard: `ri-dashboard-3-fill`
  - User: `ri-user-fill`, `ri-user-line`
  - Settings: `ri-settings-3-fill`
  - Notifications: `ri-notification-3-fill`
  - Search: `ri-search-line`
  - Menu: `ri-menu-line`
  - Close: `ri-close-line`
  - Add: `ri-add-fill`
  - Edit: `ri-edit-fill`
  - Delete: `ri-delete-bin-fill`
  - Save: `ri-save-fill`
  - Charts: `ri-line-chart-fill`, `ri-bar-chart-fill`

## Component Structure

### Standard Component Pattern
```html
<div class="glass rounded-2xl p-6 shadow-xl">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold text-neutral-800 flex items-center gap-2">
      <i class="ri-icon-fill text-primary"></i>
      Component Title
    </h2>
    <button class="btn btn-primary rounded-2xl">
      <i class="ri-add-fill"></i>
      Action
    </button>
  </div>
  
  <!-- Component content -->
  <div class="space-y-4">
    <!-- Content here -->
  </div>
</div>
```

### Grid Layouts
```html
<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  @for (item of items; track item.id) {
    <div class="glass rounded-2xl p-6 shadow-xl">
      <!-- Item content -->
    </div>
  }
</div>
```

## File Organization
```
src/
  app/
    component-name/
      component-name.ts
      component-name.html
      component-name.css
  styles.css (global styles with Tailwind imports)
```

## Important Notes
- Always use `rounded-2xl` instead of `rounded-lg` for consistency
- Prefer the `.glass` class for cards and containers
- Use Remix Icons consistently throughout the app
- Keep the glassy aesthetic with semi-transparent backgrounds
- Use signals (`signal()`) for reactive state management
- Import `CommonModule` when using control flow (@for, @if)
- Use DaisyUI semantic class names instead of custom CSS when possible

## Example: Creating a New Feature Card
```html
<div class="glass rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
  <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-sky-400 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
    <i class="ri-feature-fill text-2xl"></i>
  </div>
  <h3 class="text-xl font-bold text-neutral-800 mb-2">Feature Title</h3>
  <p class="text-neutral-600">Feature description goes here.</p>
  <div class="mt-4">
    <button class="btn btn-primary btn-sm rounded-2xl w-full">
      Learn More
    </button>
  </div>
</div>
```

---

**Remember**: Maintain the glassy, modern aesthetic throughout all components. Use DaisyUI components as the foundation and enhance them with Tailwind utilities and Remix Icons for a cohesive design system.

# GitHub Copilot Instructions for AdminOS

## Project Overview
AdminOS is a modern, glassy-style multi-tenant dashboard application built with Angular and styled using Tailwind CSS and DaisyUI.

The app provides tools for condominium and operations management — enabling administrators to manage users, payments, tickets, reports, and communications efficiently.

---

## Core Features & Modules
AdminOS includes the following core modules:
- **Authentication & Roles:** Login, register, password recovery, role-based access control.
- **Dashboard Overview:** KPIs, charts, recent activity.
- **Users & Roles Management:** CRUD operations with modals and tables.
- **Tickets & Tasks:** Create, assign, and resolve incidents or work orders.
- **Reports:** Data visualization, filtering, and export (Excel/PDF).
- **Notifications:** Toasts, alerts, in-app updates.
- **Settings:** Tenant configuration, profile management, and preferences.

> **Note:** Component, service, and model names must always be written in **English**, but the **HTML content (labels, text, titles, etc.) must be in Spanish**.

---

## Technology Stack

### Core Framework
- **Angular (v20+)** — Using standalone components.
- **TypeScript** — Strongly typed development.

### Styling & UI
- **Tailwind CSS v4** — Utility-first CSS framework.
- **DaisyUI v5** — Tailwind CSS component library.
- **Remix Icons** — Icon library (`ri-icon-name-fill` or `ri-icon-name-line`).

---

## Design System

### Color Palette (Mexican Market - High Contrast)
**Primary Colors:**
- **Primary:** `#0284c7` (Sky Blue 600) — Main actions, buttons, highlights
- **Primary Dark:** `#0369a1` (Sky Blue 700) — Hover states
- **Primary Light:** `#7dd3fc` (Sky Blue 300) — Backgrounds, subtle highlights

**Secondary Colors:**
- **Secondary:** `#7c3aed` (Violet 600) — Secondary actions
- **Secondary Dark:** `#6d28d9` (Violet 700) — Hover states

**Semantic Colors:**
- **Success:** `#059669` (Emerald 600) — Completed, paid, active
- **Success Light:** `#10b981` (Emerald 500) — Backgrounds
- **Warning:** `#d97706` (Amber 600) — Pending, caution
- **Warning Light:** `#f59e0b` (Amber 500) — Backgrounds
- **Error:** `#dc2626` (Red 600) — Errors, rejected, critical
- **Error Light:** `#ef4444` (Red 500) — Backgrounds
- **Info:** `#2563eb` (Blue 600) — Information, details
- **Info Light:** `#3b82f6` (Blue 500) — Backgrounds

**Neutral Colors (High Contrast):**
- **Text Primary:** `#171717` (neutral-900) — Main text, headings
- **Text Secondary:** `#404040` (neutral-700) — Secondary text
- **Text Tertiary:** `#737373` (neutral-500) — Tertiary text, placeholders
- **Border:** `#d4d4d4` (neutral-300) — Borders, dividers
- **Background:** `#fafafa` (neutral-50) — Page backgrounds
- **Surface:** `#ffffff` (white) — Cards, modals

### Icon Sizing Guidelines
- **Small icons:** `text-sm` (0.875rem / 14px) — Inline with text, badges
- **Regular icons:** `text-base` (1rem / 16px) — Buttons, list items, default use
- **Medium icons:** `text-lg` (1.125rem / 18px) — Card headers, secondary emphasis
- **Large icons:** `text-xl` (1.25rem / 20px) — Page headers, primary emphasis only
- **Extra large:** `text-2xl` (1.5rem / 24px) — Dashboard stats, hero sections only

**Default:** Use `text-base` (16px) for most icons. Only increase size for emphasis.

### Design Principles
- **Border Radius:** Use `rounded-2xl` (1rem) for all cards, buttons, and containers.
- **Shadows:** Use `shadow-lg` for cards, `shadow-xl` for elevated components (modals, dropdowns).
- **Glassy Effect:** Use `.glass` with `backdrop-blur-lg` and high opacity (0.95+) for readability.
- **Spacing:** Use `p-6` for cards, `p-4` for compact areas, `p-8` for spacious layouts.
- **Contrast:** Always ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text).
- **Text on White:** Use `text-neutral-900` or `text-neutral-800` for maximum readability.
- **Text on Colors:** Use white text on dark backgrounds, ensure sufficient contrast.

---

## Code Style Guidelines

### Angular Components
```typescript
// Standalone Angular Component Example
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent {
  protected readonly users = signal<User[]>([]);
}

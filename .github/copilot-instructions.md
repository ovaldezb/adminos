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

### Color Palette (Glassy Theme)
- **Primary:** `#0ea5e9` (Sky Blue) — main actions and highlights.
- **Secondary:** `#8b5cf6` (Purple) — secondary actions.
- **Neutral Grays:** `neutral-50` → `neutral-900`.
- **Success:** `#36d399`
- **Warning:** `#fbbd23`
- **Error:** `#f87272`
- **Info:** `#3abff8`

### Design Principles
- **Border Radius:** Use `rounded-2xl` (1rem) for all cards, buttons, and containers.
- **Shadows:** Use `shadow-xl` for elevated components.
- **Glassy Effect:** Use `.glass` for semi-transparent backgrounds with `backdrop-blur-lg`.
- **Spacing:** Prefer generous padding (`p-6`, `p-8`).

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

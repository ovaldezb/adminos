# 🎨 AdminOS - Quick Style Reference Guide

## Color Palette (Actualizada)

```
PRIMARY COLORS:
├─ Primary:        #0284c7 (Sky Blue 600) - Botones principales, acciones
├─ Primary Dark:   #0369a1 (Sky Blue 700) - Hover, active states  
├─ Primary Light:  #e0f2fe (Sky Blue 100) - Backgrounds

SECONDARY COLORS:
├─ Secondary:      #7c3aed (Violet 600) - Acciones secundarias
├─ Secondary Dark: #6d28d9 (Violet 700) - Hover, active states
├─ Secondary Lt:   #ede9fe (Violet 100) - Backgrounds

SEMANTIC COLORS:
├─ Success:  #059669 (Emerald 600)  - ✓ Completado, activo
├─ Warning:  #d97706 (Amber 600)    - ⚠ Pendiente, caución
├─ Error:    #dc2626 (Red 600)      - ✗ Error, rechazo
├─ Info:     #2563eb (Blue 600)     - ℹ Información

NEUTRAL COLORS (Alto Contraste):
├─ Text Primary:   #171717 (Neutral 900)  - Headings, modales [SIEMPRE]
├─ Text Secondary: #404040 (Neutral 700)  - Texto secundario
├─ Text Tertiary:  #737373 (Neutral 500)  - Hints, placeholders
├─ Border:         #d4d4d4 (Neutral 300)  - Bordes
├─ Background:     #fafafa (Neutral 50)   - Page bg
└─ Surface:        #ffffff (White)        - Cards, modales
```

---

## Component Styles

### MODALES (Ultra Premium)
```css
.modal-box {
  background: rgba(255, 255, 255, 0.99) !important;  /* Casi blanco */
  border: 1px solid rgba(2, 132, 199, 0.15);        /* Borde sutil azul */
  color: #171717 !important;                         /* SIEMPRE texto oscuro */
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);  /* Sombra elevada */
  border-radius: 0.75rem;
}

.modal-box h3 {
  color: #171717 !important;
  font-weight: 600;
}

.modal-box label {
  color: #171717 !important;
  font-weight: 600;
}
```

### BOTONES (Gradient Premium)
```css
/* PRIMARY */
.btn-primary {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff !important;
  font-weight: 600;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%);
  box-shadow: 0 12px 24px -8px rgba(2, 132, 199, 0.3);
  transform: translateY(-2px);
}

/* SECONDARY */
.btn-secondary {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: #ffffff !important;
  font-weight: 600;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%);
  box-shadow: 0 12px 24px -8px rgba(124, 58, 237, 0.3);
  transform: translateY(-2px);
}

/* ERROR */
.btn-error {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: #ffffff !important;
}

.btn-error:hover {
  box-shadow: 0 12px 24px -8px rgba(220, 38, 38, 0.3);
}

/* GHOST */
.btn-ghost {
  color: #0284c7 !important;
  border: 1px solid #d4d4d4;
}

.btn-ghost:hover {
  background: rgba(2, 132, 199, 0.08);
  border-color: #0284c7;
}
```

### INPUTS & FORMS (Alto Contraste)
```css
.input, .select, .textarea {
  border-color: #d4d4d4 !important;
  color: #171717 !important;
  font-weight: 500;
  transition: all 0.2s ease;
}

.input::placeholder, .textarea::placeholder {
  color: #737373 !important;
}

.input:focus, .select:focus, .textarea:focus {
  outline: none;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.2);
}

.label-text {
  color: #171717 !important;
  font-weight: 600;
  letter-spacing: 0.3px;
}
```

### BADGES (Gradientes & Bordes)
```css
/* PRIMARY BADGE */
.badge-primary {
  background: linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(2, 132, 199, 0.1) 100%);
  color: #0284c7 !important;
  border: 1px solid rgba(2, 132, 199, 0.3);
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* SUCCESS BADGE */
.badge-success {
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
  color: #059669 !important;
  border: 1px solid rgba(5, 150, 105, 0.3);
}

/* ERROR BADGE */
.badge-error {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%);
  color: #dc2626 !important;
  border: 1px solid rgba(220, 38, 38, 0.3);
}

/* WARNING BADGE */
.badge-warning {
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%);
  color: #d97706 !important;
  border: 1px solid rgba(217, 119, 6, 0.3);
}
```

### ALERTAS (Énfasis Total)
```css
.alert {
  border: 1.5px solid;
  border-radius: 0.75rem;
  font-weight: 500;
  color: #171717;
}

/* ERROR ALERT */
.alert-error {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.08) 0%, rgba(220, 38, 38, 0.04) 100%);
  border-color: #dc2626;
  color: #7f1d1d;
}

/* SUCCESS ALERT */
.alert-success {
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%);
  border-color: #059669;
  color: #065f46;
}

/* WARNING ALERT */
.alert-warning {
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.08) 0%, rgba(217, 119, 6, 0.04) 100%);
  border-color: #d97706;
  color: #7c2d12;
}

/* INFO ALERT */
.alert-info {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.04) 100%);
  border-color: #2563eb;
  color: #1e3a8a;
}
```

### GLASS EFFECT (Moderno & Premium)
```css
.glass {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.15);
}

.glass-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 249, 255, 0.95) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(2, 132, 199, 0.1);
  box-shadow: 0 20px 40px -10px rgb(0 0 0 / 0.08);
}
```

---

## Icon Sizing

```
text-sm   = 14px  | Inline icons, badges
text-base = 16px  | DEFAULT for most (use this!)
text-lg   = 18px  | Card headers, section emphasis
text-xl   = 20px  | Page headers
text-2xl  = 24px  | Dashboard stats, KPI
text-5xl  = 48px  | Empty states, hero
```

### Icon Colors
```
Primary:   text-primary       (use for main icons)
Success:   text-success       (positive actions)
Error:     text-error         (destructive actions)
Warning:   text-warning       (caution)
Secondary: text-neutral-600   (helper icons)
Disabled:  text-neutral-400   (inactive icons)
```

---

## Spacing Guidelines

```
Padding:   p-4 (compact), p-6 (standard), p-8 (spacious)
Gap:       gap-3 (tight), gap-4 (normal), gap-6 (loose)
Margin:    mb-6 (section breaks), mb-4 (subsections)
Border Radius: rounded-xl (0.75rem), rounded-2xl (1rem)
```

---

## Shadow Hierarchy

```
shadow-sm = 1px 2px (subtle)
shadow-lg = 10px 15px -3px (cards)
shadow-xl = 20px 25px -5px (modals)
shadow-2xl = 25px 50px -12px (interactive hover)
```

---

## Contrast Compliance (WCAG AA+)

```
✓ Text-neutral-900 on #ffffff = 21:1 (AAA++)
✓ Text-neutral-800 on #ffffff = 12:1 (AAA+)
✓ Text-neutral-700 on #ffffff = 8:1 (AAA)
✓ Text-white on #0284c7 = 5.5:1 (AA+)

ALWAYS REQUIRED:
- Modales: text-neutral-900 on #ffffff
- Form labels: text-neutral-900 with font-weight 600
- Buttons: text-white on gradient backgrounds
```

---

## HTML Examples

### Modal Premium
```html
<div class="modal modal-open">
  <div class="modal-box glass">
    <h3 class="font-bold text-2xl text-neutral-900 mb-6">
      <i class="ri-edit-line text-primary mr-2"></i>Editar
    </h3>
    
    <div class="space-y-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text text-neutral-900 font-semibold">Email *</span>
        </label>
        <input type="email" class="input input-bordered" required />
      </div>
    </div>
    
    <div class="modal-action mt-8">
      <button class="btn btn-ghost">Cancelar</button>
      <button class="btn btn-primary">Guardar</button>
    </div>
  </div>
  <div class="modal-backdrop"></div>
</div>
```

### Button Set
```html
<div class="flex gap-2">
  <button class="btn btn-primary">
    <i class="ri-check-line"></i> Confirmar
  </button>
  <button class="btn btn-secondary">
    <i class="ri-settings-line"></i> Configurar
  </button>
  <button class="btn btn-ghost">Cancelar</button>
</div>
```

### Badge Group
```html
<div class="flex gap-2">
  <span class="badge badge-primary">
    <i class="ri-user-line text-sm mr-1"></i> Propietario
  </span>
  <span class="badge badge-success">
    <i class="ri-check-line text-sm mr-1"></i> Activo
  </span>
</div>
```

### Alert
```html
<div class="alert alert-error">
  <i class="ri-error-warning-fill text-xl"></i>
  <span class="font-semibold">Error: Operación no permitida</span>
  <button class="btn btn-sm btn-ghost">
    <i class="ri-close-line"></i>
  </button>
</div>
```

---

## ⚠️ CRITICAL RULES

```
🚫 NUNCA:
- text-white en modales
- bg-opacity muy bajo (< 0.9)
- Badges sin bordes
- Botones sin gradientes
- Alertas sin énfasis

✅ SIEMPRE:
- text-neutral-900 en modales
- Gradientes en botones
- Bordes en badges
- Énfasis en alertas
- Contraste WCAG AA+
- font-weight 600 en labels
```

---

**Versión:** 2.0 Mejorada
**Última actualización:** Octubre 2025
**Estado:** ✅ Activo y Validado

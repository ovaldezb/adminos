# Integración de Residentes con Unidades y Edificios

## Resumen de Cambios

Se ha implementado una integración completa entre residentes, unidades y edificios, permitiendo que cuando se crea un residente, este se asocie automáticamente a una unidad y a un edificio.

---

## Cambios en Modelos

### 1. **resident.model.ts**
Se agregó el campo `buildingId` para asociar residentes con edificios:

```typescript
export interface Resident {
  // ... campos existentes
  buildingId?: string; // ID del edificio/torre asociado
  // ...
}

export interface ResidentDetails extends Resident {
  buildingName?: string; // Nombre del edificio/torre
  unitNumber?: string; // Número de unidad para display
  // ...
}

export interface CreateResidentDto {
  // ... campos existentes
  buildingId?: string; // Se obtiene automáticamente de la unidad seleccionada
  // ...
}
```

---

## Cambios en el Componente de Residentes

### 2. **residents.ts**

#### Nuevos Signals para Dropdowns:
```typescript
protected readonly availableCondominiums = signal<Condominium[]>([]);
protected readonly availableBuildings = signal<BuildingDetails[]>([]);
protected readonly availableUnits = signal<UnitDetails[]>([]);
```

#### Nuevos Métodos:

**`loadCondominiums()`**: Carga todos los condominios disponibles para el dropdown.

**`loadBuildingsByCondominium(condominiumId: string)`**: Carga los edificios de un condominio específico.

**`loadUnitsByBuilding(buildingId: string)`**: Carga las unidades de un edificio específico.

**`onCondominiumChange(event)`**: Maneja el cambio de condominio y limpia los campos dependientes.

**`onBuildingChange(event)`**: Maneja el cambio de edificio y carga las unidades correspondientes.

**`onUnitChange(event)`**: Maneja la selección de unidad y asigna automáticamente el `buildingId`.

#### Flujo de Selección en Cascada:
1. Usuario selecciona un **Condominio**
2. Se cargan los **Edificios** de ese condominio
3. Usuario selecciona un **Edificio**
4. Se cargan las **Unidades** de ese edificio
5. Usuario selecciona una **Unidad**
6. El `buildingId` se asigna automáticamente desde la unidad

---

## Cambios en la Vista HTML

### 3. **residents.html**

#### Reemplazo del Campo de Texto por Dropdowns:

**Antes:**
```html
<input
  type="text"
  [(ngModel)]="formData().unitId"
  placeholder="Ej: U-101"
/>
```

**Después:**
```html
<!-- Dropdown de Condominio -->
<select [value]="formData().condominiumId" (change)="onCondominiumChange($event)">
  <option value="">Seleccione un condominio</option>
  @for (condo of availableCondominiums(); track condo.id) {
    <option [value]="condo.id">{{ condo.name }}</option>
  }
</select>

<!-- Dropdown de Edificio/Torre -->
<select [value]="formData().buildingId" (change)="onBuildingChange($event)" [disabled]="!formData().condominiumId">
  <option value="">Seleccione un edificio</option>
  @for (building of availableBuildings(); track building.id) {
    <option [value]="building.id">{{ building.name }}</option>
  }
</select>

<!-- Dropdown de Unidad -->
<select [value]="formData().unitId" (change)="onUnitChange($event)" [disabled]="!formData().buildingId">
  <option value="">Seleccione una unidad</option>
  @for (unit of availableUnits(); track unit.id) {
    <option [value]="unit.id">
      {{ unit.unitNumber }} - {{ unit.tower }} - Piso {{ unit.floor }}
      @if (unit.status === 'occupied') { (Ocupada) }
    </option>
  }
</select>
```

#### Nueva Columna en la Tabla:
Se agregó una columna **"Edificio"** en la tabla de residentes que muestra el nombre del edificio asociado.

#### Vista de Detalles Mejorada:
El modal de detalles ahora muestra el edificio asociado junto con las unidades.

---

## Cambios en Servicios

### 4. **resident.service.ts**
Se actualizaron los datos mock para incluir `buildingId` y `buildingName`:

```typescript
{
  id: 'R-001',
  buildingId: 'bld-001',
  buildingName: 'Torre Palmas',
  // ...
}
```

### 5. **unit.service.ts**
Se actualizaron los datos mock de unidades para incluir `buildingId` y `buildingName`:

```typescript
{
  id: 'U-101',
  buildingId: 'bld-001',
  buildingName: 'Torre Palmas',
  // ...
}
```

### 6. **building.service.ts**
Se corrigieron los IDs de condominios para que coincidan con el sistema:
- `condo-001` → `1`
- `condo-002` → `2`
- `condo-003` → `3`

---

## Flujo de Uso

### Crear un Nuevo Residente:

1. Click en **"Nuevo Residente"**
2. Llenar datos personales (nombre, email, etc.)
3. Seleccionar **Condominio** del dropdown
4. Seleccionar **Edificio/Torre** del dropdown (filtrado por condominio)
5. Seleccionar **Unidad** del dropdown (filtrado por edificio)
6. El campo `buildingId` se asigna automáticamente
7. Completar datos adicionales y guardar

### Validación:
El formulario valida que se hayan seleccionado:
- Condominio
- Edificio
- Unidad

---

## Características Implementadas

✅ **Dropdowns en cascada**: Condominio → Edificio → Unidad

✅ **Asociación automática**: El `buildingId` se asigna automáticamente al seleccionar una unidad

✅ **Validación de campos**: No permite guardar sin seleccionar todos los campos obligatorios

✅ **Vista mejorada**: La tabla y el modal de detalles muestran el edificio asociado

✅ **Estados deshabilitados**: Los dropdowns se deshabilitan hasta que se complete el paso anterior

✅ **Filtrado inteligente**: Las unidades solo muestran las del edificio seleccionado

✅ **Indicador de ocupación**: Las unidades ocupadas se marcan en el dropdown

---

## Datos de Prueba

### Condominios:
- **1** - Torres del Parque
- **2** - Condominio Vista Hermosa
- **3** - Edificio Sunset Boulevard

### Edificios:
- **bld-001** - Torre Palmas (Condominio 1)
- **bld-002** - Torre Jardines (Condominio 2)
- **bld-003** - Privada Los Robles (Condominio 3)
- **bld-004** - Edificio Central A (Condominio 3)
- **bld-005** - Edificio Central B (Condominio 3)

### Unidades de Ejemplo:
- **U-101** - Torre Palmas - Ocupada
- **U-102** - Torre Palmas - Ocupada
- **U-103** - Torre Palmas - En Alquiler
- **U-201** - Torre Jardines - Ocupada
- **U-202** - Torre Jardines - En Mantenimiento

---

## Próximos Pasos Sugeridos

1. **Integrar con API Real**: Reemplazar datos mock con llamadas a AWS Lambda
2. **Agregar búsqueda en dropdowns**: Para facilitar la selección en listas largas
3. **Mostrar más info en dropdowns**: Agregar iconos de estado, precios, etc.
4. **Validación de disponibilidad**: Prevenir asignar residentes a unidades ocupadas
5. **Historial de ocupación**: Registrar cambios de unidad de un residente
6. **Notificaciones**: Alertar cuando se asigna un residente a una unidad

---

## Notas Técnicas

- Se mantiene compatibilidad con el sistema existente de unidades
- Los cambios son retrocompatibles con datos que no tengan `buildingId`
- El componente de unidades (`units.ts`) permanece sin cambios para mantener su funcionalidad independiente
- Se utilizan Angular Signals para manejo reactivo de estado
- Se implementó el patrón de selección en cascada con dropdowns deshabilitados

---

**Fecha de implementación**: 28 de Octubre, 2025
**Versión**: 1.0.0

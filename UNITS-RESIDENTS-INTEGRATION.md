# Integración de Residentes en Unidades - Implementación Completa

## 📋 Descripción General

Se ha implementado la funcionalidad para **agregar múltiples residentes** a cada unidad con información detallada y checkboxes que determinan el tipo de relación con la unidad.

---

## ✨ Características Implementadas

### 1. Gestión de Residentes en Unidades

#### Campos por Residente:
- **Nombre Completo** (obligatorio)
- **Celular** (obligatorio)
- **Correo Electrónico** (opcional)

#### Checkboxes de Tipo:
- ✅ **Vive Aquí** - Indica si la persona reside actualmente en la unidad
- ✅ **Encargado** - Persona responsable del mantenimiento o administración
- ✅ **Es Dueño** - Propietario legal de la unidad

#### Combinaciones Posibles:
1. **Dueño Residente**: `isOwner=true` + `isResident=true`
   - Es propietario y vive en la unidad
   
2. **Solo Dueño**: `isOwner=true` + `isResident=false`
   - Propietario que no vive en la unidad (por ejemplo, la renta)

3. **Encargado**: `isManager=true`
   - Persona responsable del mantenimiento (puede o no vivir ahí)

4. **Residente**: `isResident=true` (sin otros checkboxes)
   - Persona que habita la unidad sin ser dueño

---

## 🏗️ Estructura Técnica

### Modelo de Datos (`unit.model.ts`)

```typescript
export interface UnitResident {
  id?: string; // ID del residente (si ya existe)
  name: string;
  phone: string;
  email?: string; // Opcional
  isResident: boolean; // Vive ahí
  isManager: boolean; // Encargado/responsable
  isOwner: boolean; // Dueño
}

export interface Unit {
  // ... otros campos
  residents?: UnitResident[]; // Lista de residentes
}

export interface CreateUnitDto {
  // ... otros campos
  residents?: UnitResident[];
}

export interface UpdateUnitDto extends Partial<CreateUnitDto> {
  residents?: UnitResident[];
}
```

---

## 🎨 Interfaz de Usuario

### Modal de Crear/Editar Unidad

#### Sección de Residentes:
- **Header**: Título "Residentes de la Unidad" con botón `+ Agregar Residente`
- **Empty State**: Mensaje cuando no hay residentes agregados
- **Cards de Residentes**: Cada residente se muestra en una card con:
  - Border izquierdo de color según tipo (Dueño=Primary, Encargado=Secondary, Residente=Accent)
  - Badges que indican el tipo (Dueño, Encargado, Vive Aquí, Solo Dueño)
  - Formulario con campos nombre, celular, correo
  - Checkboxes con iconos (Vive Aquí, Encargado, Es Dueño)
  - Alert informativo dinámico según la combinación de checkboxes
  - Botón de eliminar en esquina superior derecha

#### Validaciones:
- ✅ Nombre y celular son obligatorios
- ✅ Correo es opcional pero si se proporciona debe ser válido
- ✅ Se muestra mensaje de error específico por cada campo inválido

### Modal de Vista (Ver Detalles)

- **Sección "Residentes (X)"**: Lista de todos los residentes con:
  - Nombre en negrita
  - Badges de tipo (Dueño, Encargado, Vive Aquí, Solo Dueño)
  - Icono y teléfono
  - Icono y correo (si existe)
  - Border de color según tipo de residente

---

## 🔧 Métodos del Componente (`units.ts`)

### Gestión de Residentes

```typescript
// Agregar un nuevo residente vacío
addResident(): void

// Eliminar residente por índice
removeResident(index: number): void

// Actualizar campo específico de un residente
updateResident(index: number, field: keyof UnitResident, value: any): void

// Validar todos los residentes antes de guardar
validateResidents(): boolean

// Obtener etiqueta descriptiva del residente
getResidentLabel(resident: UnitResident, index: number): string
```

### Flujo de Creación/Edición

1. **Abrir Modal**: Se inicializa `unitResidents` signal vacío o con datos existentes
2. **Agregar Residentes**: Usuario hace clic en "+ Agregar Residente"
3. **Llenar Datos**: Usuario completa nombre, celular, correo (opcional)
4. **Seleccionar Tipo**: Usuario marca checkboxes según la relación con la unidad
5. **Validar**: Al guardar, se valida que todos tengan nombre y celular
6. **Guardar**: Se envía la unidad con array de residentes al servicio

---

## 🗄️ Datos Mock (Ejemplos Reales)

### Unidad U-101: Familia con 3 residentes
```typescript
residentDetails: [
  {
    id: 'R-001',
    name: 'Juan Carlos Pérez González',
    phone: '+52 55 1234-5678',
    email: 'juan.perez@email.com',
    isResident: true,  // Vive ahí
    isManager: true,   // Es encargado
    isOwner: true      // Es dueño
  },
  {
    id: 'R-001-01',
    name: 'Ana María Pérez García',
    phone: '+52 55 1234-5679',
    email: 'ana.perez@email.com',
    isResident: true,  // Vive ahí
    isManager: false,
    isOwner: false
  },
  {
    id: 'R-001-02',
    name: 'Carlos Andrés Pérez García',
    phone: '',         // Sin teléfono (menor)
    email: '',
    isResident: true,
    isManager: false,
    isOwner: false
  }
]
```

### Unidad U-305: Dueño que no vive + Inquilino
```typescript
residentDetails: [
  {
    id: 'R-003',
    name: 'Carlos Alberto Rodríguez López',
    phone: '+52 55 3456-7890',
    email: 'carlos.rodriguez@email.com',
    isResident: false, // NO vive ahí
    isManager: false,
    isOwner: true      // Solo es dueño
  },
  {
    id: 'R-004',
    name: 'Ana Patricia Martínez Hernández',
    phone: '+52 55 4567-8901',
    email: 'ana.martinez@email.com',
    isResident: true,  // Vive ahí (inquilina)
    isManager: true,   // Es encargada
    isOwner: false
  }
]
```

---

## 🎯 Casos de Uso

### 1. Familia que Vive en su Propiedad
- **Dueño principal**: `isOwner=true`, `isResident=true`, `isManager=true`
- **Esposa/o**: `isResident=true`, `isManager=false`, `isOwner=false`
- **Hijos**: `isResident=true`, `isManager=false`, `isOwner=false`

### 2. Propiedad Rentada
- **Dueño**: `isOwner=true`, `isResident=false` (no vive ahí)
- **Inquilino**: `isResident=true`, `isManager=true`, `isOwner=false`

### 3. Propiedad con Coadministrador
- **Dueño principal**: `isOwner=true`, `isResident=true`, `isManager=true`
- **Coadministrador**: `isResident=true`, `isManager=true`, `isOwner=false`

### 4. Propiedad Vacía con Encargado
- **Encargado de mantenimiento**: `isManager=true`, `isResident=false`, `isOwner=false`

---

## 🔄 Integración con Módulo de Residentes

### El módulo de Residentes se mantiene independiente para:
1. **Búsqueda Global**: Buscar residentes por nombre, documento, email
2. **Visualización Completa**: Ver historial de pagos, deudas, documentos
3. **Gestión de Información Personal**: Documentos (CURP, RFC, INE), contactos de emergencia
4. **Filtros Avanzados**: Por tipo, estado, edificio, condominio

### El módulo de Unidades gestiona:
1. **Asociación Unidad-Residentes**: Vincular personas a una unidad específica
2. **Roles en la Unidad**: Definir quién es dueño, encargado, o residente
3. **Creación Rápida**: Agregar residentes sin toda la información completa del módulo de Residentes

---

## 📊 Ventajas de esta Implementación

✅ **Flexibilidad**: Múltiples residentes por unidad con roles diferenciados
✅ **Claridad Visual**: Badges y colores indican inmediatamente el tipo de residente
✅ **Validación Robusta**: Campos obligatorios y validación de email
✅ **UX Intuitiva**: Fácil agregar/eliminar residentes con botones claros
✅ **Información Completa**: Se captura lo esencial sin saturar el formulario
✅ **Mock Data Realista**: Ejemplos que representan casos de uso reales

---

## 🚀 Próximos Pasos (Opcionales)

1. **Integración con Residentes Existentes**: 
   - Autocompletar desde el módulo de Residentes
   - Vincular `id` de residente existente

2. **Notificaciones Automáticas**:
   - Enviar email/SMS a residentes agregados
   - Notificar cambios de encargado

3. **Historial de Cambios**:
   - Registro de cuándo se agregó/removió un residente
   - Auditoría de cambios de roles

4. **Exportación**:
   - PDF con listado de residentes por unidad
   - Excel con información de ocupación

---

## 📝 Archivos Modificados

### Modelos
- ✅ `src/app/models/unit.model.ts` - Agregado `UnitResident` interface

### Componentes
- ✅ `src/app/pages/units/units.ts` - Métodos de gestión de residentes
- ✅ `src/app/pages/units/units.html` - UI de residentes en modal

### Servicios
- ✅ `src/app/services/unit.service.ts` - Mock data con residentes de ejemplo

---

## ✨ Conclusión

La implementación permite una **gestión completa y flexible** de los residentes de cada unidad, con una interfaz intuitiva y validaciones robustas. El sistema es capaz de representar cualquier combinación de dueños, inquilinos, encargados y residentes de manera clara y organizada.

**El componente de Residentes se mantiene intacto** para su función de búsqueda y gestión detallada de información personal, mientras que el componente de Unidades maneja la asociación y roles específicos dentro de cada propiedad.

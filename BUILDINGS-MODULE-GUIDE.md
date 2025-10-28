# Módulo de Edificios/Torres/Privadas - Guía Completa

## 📋 Resumen

Se ha implementado un módulo completo de **CRUD para Edificios, Torres y Privadas** que se integra perfectamente con el sistema AdminOS. Este módulo permite gestionar las estructuras físicas de los condominios y asociarlas con las unidades habitacionales.

---

## 🏗️ Arquitectura del Módulo

### 1. **Modelo de Datos** (`building.model.ts`)

#### Tipos de Edificios (BuildingType)
- **TOWER**: Torre residencial
- **BUILDING**: Edificio
- **PRIVATE_RESIDENCE**: Privada de fraccionamiento
- **CLUSTER**: Conjunto habitacional

#### Estados de Edificios (BuildingStatus)
- **ACTIVE**: Activo y en operación
- **UNDER_CONSTRUCTION**: En construcción
- **UNDER_MAINTENANCE**: En mantenimiento
- **INACTIVE**: Inactivo

#### Propiedades del Edificio
```typescript
interface Building {
  id: string;
  condominiumId: string;          // Asociación con el condominio
  name: string;                   // Nombre del edificio
  type: BuildingType;             // Tipo de edificio
  mainEntranceAddress: string;    // Dirección de caseta o acceso principal
  totalUnits: number;             // Número de viviendas
  floors?: number;                // Número de pisos (opcional)
  hasCommonAreas: boolean;        // Si tiene áreas comunes para rentar
  commonAreasDescription?: string;// Descripción de áreas comunes
  commonAreaRentalRate?: number;  // Tarifa de renta por evento
  status: BuildingStatus;
  yearBuilt?: number;
  parkingSpots?: number;
  elevators?: number;
  securityFeatures?: string[];    // Características de seguridad
  amenities?: string[];           // Amenidades del edificio
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔗 Integración con Otros Módulos

### **Relación con Condominios**
- Cada edificio pertenece a un condominio (`condominiumId`)
- El condominio ya tiene una propiedad `address` que representa la dirección general
- Los edificios tienen su propia `mainEntranceAddress` para el acceso específico

### **Relación con Unidades**
Se actualizó el modelo de `Unit` para incluir:
```typescript
interface Unit {
  // ... propiedades existentes
  buildingId?: string;      // ID del edificio asociado
  // ... resto de propiedades
}

interface UnitDetails extends Unit {
  buildingName?: string;    // Nombre del edificio (para mostrar)
  // ... resto de propiedades
}
```

### **Flujo de Creación Recomendado**
1. **Crear Condominio** → Dirección general del fraccionamiento
2. **Crear Edificio(s)** → Asociar al condominio, con dirección de acceso
3. **Crear Unidades** → Asociar al edificio y al condominio

---

## 🎨 Interfaz de Usuario

### **Características del Módulo**
- ✅ Tabla responsive con todos los edificios
- ✅ Filtros por tipo, estado y búsqueda
- ✅ Estadísticas en tiempo real:
  - Total de edificios
  - Total de viviendas
  - Edificios con áreas comunes
  - Ocupación promedio
- ✅ Modal de creación/edición completo
- ✅ Modal de visualización de detalles
- ✅ Confirmación de eliminación
- ✅ Notificaciones toast
- ✅ Paginación integrada

### **Campos del Formulario**

#### **Información Básica**
- Nombre del edificio *
- Tipo (Torre/Edificio/Privada/Conjunto) *
- Dirección de acceso principal *
- Número de viviendas *
- Número de pisos
- Año de construcción
- Estado

#### **Áreas Comunes**
- ¿Tiene áreas comunes para rentar? (checkbox)
- Descripción de áreas comunes
- Tarifa de renta por evento

#### **Información Adicional**
- Número de estacionamientos
- Número de elevadores
- Características de seguridad (array dinámico)
- Amenidades (array dinámico)
- Descripción general

---

## 📊 Datos de Ejemplo

El servicio incluye 5 edificios de ejemplo:

1. **Torre Palmas** (Torre)
   - 48 unidades, 12 pisos
   - Áreas comunes: Salón de eventos, gimnasio, alberca
   - Tarifa: $2,500 por evento

2. **Torre Jardines** (Torre)
   - 40 unidades, 10 pisos
   - Sin áreas comunes de renta

3. **Privada Los Robles** (Privada)
   - 24 unidades (casas)
   - Áreas comunes: Casa club, parque infantil
   - Tarifa: $1,500 por evento

4. **Edificio Central A** (Edificio)
   - 32 unidades, 8 pisos
   - Áreas comunes: Roof garden, coworking
   - Tarifa: $1,800 por evento

5. **Edificio Central B** (Edificio)
   - 32 unidades, 8 pisos
   - Estado: En mantenimiento

---

## 🚀 Uso del Módulo

### **Acceso**
- Menú lateral → **Edificios**
- Ruta: `/edificios`

### **Operaciones CRUD**

#### **Crear Edificio**
1. Clic en botón "Nuevo Edificio"
2. Completar formulario (campos obligatorios marcados con *)
3. Agregar características de seguridad y amenidades dinámicamente
4. Si tiene áreas comunes, completar descripción y tarifa
5. Guardar

#### **Editar Edificio**
1. Clic en ícono de editar (lápiz) en la tabla
2. Modificar campos necesarios
3. Guardar cambios

#### **Ver Detalles**
1. Clic en ícono de ojo en la tabla
2. Ver toda la información del edificio

#### **Eliminar Edificio**
1. Clic en ícono de eliminar (papelera)
2. Confirmar eliminación en modal

---

## 🎯 Próximos Pasos Recomendados

### **1. Actualizar Formulario de Unidades**
En el componente `units`, agregar:
```html
<!-- En el formulario de crear/editar unidad -->
<div class="form-control">
  <label class="label">
    <span class="label-text">Edificio/Torre</span>
  </label>
  <select class="select select-bordered" [(ngModel)]="formData.buildingId">
    <option value="">Seleccionar edificio...</option>
    @for (building of buildings(); track building.id) {
      <option [value]="building.id">{{ building.name }}</option>
    }
  </select>
</div>
```

### **2. Agregar Servicio para Obtener Edificios**
En `units.component.ts`:
```typescript
constructor(
  private unitService: UnitService,
  private buildingService: BuildingService
) {
  // Cargar edificios del condominio seleccionado
  effect(() => {
    const condo = this.selectedCondo();
    if (condo && condo.id !== 'all') {
      this.loadBuildings(condo.id);
    }
  });
}

loadBuildings(condominiumId: string): void {
  this.buildingService.getBuildings({ condominiumId }).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        this.buildings.set(response.data.items);
      }
    }
  });
}
```

### **3. Mostrar Nombre del Edificio en Tabla de Unidades**
Actualizar la tabla de unidades para mostrar el edificio asociado.

### **4. Dashboard de Edificios**
Agregar tarjetas en el Dashboard principal con:
- Total de edificios activos
- Edificios con áreas comunes disponibles
- Ingresos por renta de áreas comunes

---

## 🎨 Paleta de Colores Utilizada

Siguiendo el diseño del sistema:

- **Primary (Sky Blue)**: `#0284c7` - Acciones principales, edificios activos
- **Secondary (Violet)**: `#7c3aed` - Acciones secundarias, amenidades
- **Success (Emerald)**: `#059669` - Estado activo, ocupación alta
- **Warning (Amber)**: `#d97706` - En construcción, pendientes
- **Error (Red)**: `#dc2626` - Inactivo, errores
- **Info (Blue)**: `#2563eb` - En mantenimiento, información

---

## ✅ Checklist de Implementación

- [x] Modelo de datos completo
- [x] Servicio con CRUD funcional
- [x] Componente TypeScript con lógica completa
- [x] Template HTML con diseño glassy
- [x] Estilos CSS personalizados
- [x] Rutas configuradas
- [x] Menú lateral actualizado
- [x] Integración con selector de condominio
- [x] Relación con modelo de Unit
- [x] Filtros y búsqueda
- [x] Paginación
- [x] Modales (crear/editar/ver/eliminar)
- [x] Notificaciones toast
- [x] Validaciones de formulario
- [ ] Integración en formulario de unidades
- [ ] Actualizar backend API cuando esté disponible

---

## 📝 Notas Importantes

1. **Datos Mock**: Actualmente usa datos de ejemplo. Cuando se conecte a una API real, solo hay que actualizar el `BuildingService`.

2. **Relación Condominio-Edificio-Unidad**:
   ```
   Condominio (dirección general)
   └── Edificio 1 (dirección de acceso)
       ├── Unidad 101
       ├── Unidad 102
       └── ...
   └── Edificio 2 (dirección de acceso)
       ├── Unidad 201
       └── ...
   ```

3. **Áreas Comunes**: La tarifa se cobra por evento (puede ser por hora, día, etc.). Esto es configurable por edificio.

4. **Características Dinámicas**: Las características de seguridad y amenidades se pueden agregar/eliminar dinámicamente en el formulario.

5. **Vista General**: Cuando se selecciona "Vista General" (todos los condominios), el botón de crear está deshabilitado hasta seleccionar un condominio específico.

---

## 🎉 Resultado

¡Módulo completo de Edificios/Torres/Privadas implementado exitosamente! El sistema ahora puede gestionar la estructura física de los condominios de manera profesional y eficiente.

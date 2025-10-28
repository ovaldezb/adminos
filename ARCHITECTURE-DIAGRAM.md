# Arquitectura AdminOS - Gestión Multi-Condominio

## 🏗️ Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│                            APP SHELL                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                         NAVBAR                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │           CONDO SELECTOR (Dropdown)                    │  │  │
│  │  │  • Todos los Condominios                               │  │  │
│  │  │  • Torres del Parque                                   │  │  │
│  │  │  • Privadas del Sol                                    │  │  │
│  │  │  • Conjunto Las Flores                                 │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │               ↓ selección ↓                                   │  │
│  │     condominiumService.setSelectedCondominium(condo)          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────┬───────────────────────────────────────────────┐  │
│  │  SIDE MENU  │             MAIN CONTENT                      │  │
│  │             │                                               │  │
│  │ • Dashboard │  ┌─────────────────────────────────────────┐  │  │
│  │ • Edificios │  │      COMPONENT WITH GLOBAL SYNC        │  │  │
│  │ • Unidades  │  │                                         │  │  │
│  │ • Residentes│  │  effect(() => {                         │  │  │
│  │ • Pagos     │  │    const condo =                        │  │  │
│  │ • Facturas  │  │      condominiumService                 │  │  │
│  │ • Reportes  │  │        .selectedCondominium();          │  │  │
│  │             │  │                                         │  │  │
│  │             │  │    // Recargar datos del condominio    │  │  │
│  │             │  │    this.loadData(condo);                │  │  │
│  │             │  │  });                                    │  │  │
│  │             │  │                                         │  │  │
│  │             │  └─────────────────────────────────────────┘  │  │
│  └─────────────┴───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos

```
┌──────────────────────────────────────────────────────────────────┐
│                    CONDOMINIUM SERVICE                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  selectedCondominium = signal<Condominium | null>(null)    │  │
│  │                                                            │  │
│  │  setSelectedCondominium(condo: Condominium | null) {      │  │
│  │    this.selectedCondominium.set(condo);                   │  │
│  │  }                                                         │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                            ↓
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Residents    │  │   Units      │  │   Payments   │
    │ Component    │  │  Component   │  │  Component   │
    │              │  │              │  │              │
    │ effect(() => │  │ effect(() => │  │ effect(() => │
    │   sync...    │  │   sync...    │  │   sync...    │
    │ )            │  │ )            │  │ )            │
    └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 📦 Estructura de Modelos

```
┌────────────────────────────────────────────────────────────────┐
│                        CONDOMINIUM                             │
├────────────────────────────────────────────────────────────────┤
│ • id, name, address, city, state, country                     │
│ • type: BUILDING | RESIDENTIAL_COMPLEX | GATED_COMMUNITY      │
│ • maintenanceFee, currency, billingDay                        │
│ • totalUnits (calculado), occupiedUnits                       │
│ • isActive                                                    │
├────────────────────────────────────────────────────────────────┤
│ Para BUILDING:                                                │
│   towers: [                                                   │
│     { id, name, floors, unitsPerFloor, totalUnits }          │
│   ]                                                           │
├────────────────────────────────────────────────────────────────┤
│ Para RESIDENTIAL_COMPLEX / GATED_COMMUNITY:                   │
│   privateStreets: [                                           │
│     { id, name, totalHouses }                                 │
│   ]                                                           │
├────────────────────────────────────────────────────────────────┤
│ Amenidades (opcional):                                        │
│   amenities: [                                                │
│     {                                                         │
│       id, name, type (POOL, GYM, etc.),                      │
│       isRentable, hourlyRate?, capacity?,                     │
│       description?, isActive                                  │
│     }                                                         │
│   ]                                                           │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                          RESIDENT                              │
├────────────────────────────────────────────────────────────────┤
│ • id, firstName, lastName, email, phone                       │
│ • type: OWNER | TENANT | FAMILY_MEMBER | COHABITANT           │
│ • documentType (CURP, RFC, INE, etc.)                         │
│ • documentNumber                                              │
├────────────────────────────────────────────────────────────────┤
│ Relaciones:                                                   │
│ • condominiumId, buildingId, unitId                           │
│ • isResponsible (responsable principal de la unidad)          │
├────────────────────────────────────────────────────────────────┤
│ Banderas Administrativas (NEW):                               │
│ • isAdministrator (puede administrar el condominio)           │
│ • canReceiveNotifications (recibe anuncios y notificaciones)  │
├────────────────────────────────────────────────────────────────┤
│ • moveInDate, moveOutDate?, isActive                          │
│ • emergencyContactName, emergencyContactPhone                 │
│ • relationship? (si es familiar/cohabitante)                  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                            UNIT                                │
├────────────────────────────────────────────────────────────────┤
│ • id, unitNumber, floor, area (m²)                            │
│ • bedrooms, bathrooms, parkingSpaces                          │
│ • monthlyFee, propertyType                                    │
├────────────────────────────────────────────────────────────────┤
│ Relaciones:                                                   │
│ • condominiumId                                               │
│ • buildingId (opcional)                                       │
│ • towerId (si es edificio con torres)                         │
│ • privateStreetId (si es fraccionamiento)                     │
├────────────────────────────────────────────────────────────────┤
│ Ocupación:                                                    │
│ • isOccupied                                                  │
│ • occupancyStatus (VACANT | OWNER_OCCUPIED |                  │
│                    TENANT_OCCUPIED | UNDER_MAINTENANCE)       │
│ • residents[] (IDs de residentes)                             │
│ • primaryResidentId (residente principal)                     │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Permisos y Roles

```
┌──────────────────────────────────────────────────────────────┐
│                   RESIDENT PERMISSIONS                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  isAdministrator = true                                      │
│  ├─ Puede gestionar unidades                                │
│  ├─ Puede gestionar otros residentes                        │
│  ├─ Puede ver reportes completos                            │
│  ├─ Puede configurar amenidades                             │
│  └─ Puede modificar configuración del condominio            │
│                                                              │
│  canReceiveNotifications = true                              │
│  ├─ Recibe anuncios del condominio                          │
│  ├─ Recibe notificaciones de pagos                          │
│  ├─ Recibe alertas de mantenimiento                         │
│  └─ Recibe comunicados generales                            │
│                                                              │
│  isResponsible = true                                        │
│  ├─ Responsable principal de la unidad                      │
│  ├─ Puede realizar pagos                                    │
│  ├─ Puede reportar incidencias                              │
│  └─ Puede agregar co-residentes (family/cohabitant)         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚦 Validaciones del Sistema

```
┌──────────────────────────────────────────────────────────────┐
│              VALIDACIONES DE OPERACIONES                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  CREAR RESIDENTE                                             │
│  ✓ Verificar condominio seleccionado                         │
│  ✓ Verificar que NO es "all"                                 │
│  ✓ Verificar que condominio tiene unidades (totalUnits > 0) │
│  ✓ Pre-llenar condominiumId automáticamente                  │
│                                                              │
│  CREAR UNIDAD                                                │
│  ✓ Verificar condominio seleccionado                         │
│  ✓ Verificar que NO es "all"                                 │
│  ✓ Verificar que condominio tiene edificios/torres/privadas │
│  ✓ Asociar unitId con towerId o privateStreetId              │
│                                                              │
│  REGISTRAR PAGO                                              │
│  ✓ Verificar condominio seleccionado                         │
│  ✓ Filtrar unidades del condominio actual                    │
│  ✓ Asociar pago al condominio correcto                       │
│                                                              │
│  GENERAR FACTURA                                             │
│  ✓ Verificar condominio seleccionado                         │
│  ✓ Usar información del condominio (address, RFC, etc.)     │
│  ✓ Aplicar maintenanceFee del condominio                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Dashboard según Condominio

```
┌──────────────────────────────────────────────────────────────┐
│             DASHBOARD - CONDOMINIO SELECCIONADO              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Si seleccionado === "all":                                  │
│  ├─ Total de todos los condominios                          │
│  ├─ Total unidades: suma de todos                           │
│  ├─ Total residentes: suma de todos                         │
│  ├─ Total cobros: suma de todos                             │
│  └─ Gráficas agregadas                                       │
│                                                              │
│  Si seleccionado === condominio específico:                  │
│  ├─ Estadísticas del condominio                             │
│  ├─ Total unidades: condo.totalUnits                        │
│  ├─ Unidades ocupadas: condo.occupiedUnits                  │
│  ├─ Residentes del condominio                               │
│  ├─ Cobros del mes (por condominio)                         │
│  ├─ Deuda acumulada (por condominio)                        │
│  └─ Gráficas filtradas por condominio                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX Considerations

### Selección de Condominio (Navbar)
- Dropdown con lista completa de condominios
- Opción "Todos" al inicio
- Muestra nombre, ciudad y tipo de cada condominio
- Color distintivo para cada condominio

### Creación de Condominio
- **Paso 1**: Tipo de condominio (edificio/fraccionamiento/conjunto)
- **Paso 2**: Información básica (nombre, dirección, cuota)
- **Paso 3**: 
  - Si BUILDING: Agregar torres con formulario dinámico
  - Si RESIDENTIAL/GATED: Agregar privadas/calles
- **Paso 4**: Agregar amenidades (opcional)
- **Paso 5**: Confirmación con resumen y cálculo de total de unidades

### Registro de Residentes
- Validación visual si no hay condominio seleccionado
- Alert informativo si el condominio no tiene unidades
- Pre-llenado automático de condominiumId
- Cascada de selects: Condominio → Edificio → Unidad
- Checkboxes claros para:
  - "Es administrador del condominio"
  - "Puede recibir notificaciones"

---

## 🔧 Configuración Técnica

### Angular Signals
```typescript
// Servicio con signal global
public readonly selectedCondominium = signal<Condominium | null>(null);

// Componente sincronizado
effect(() => {
  const condo = this.condominiumService.selectedCondominium();
  // Reacción automática al cambio
});
```

### RxJS Observable Patterns
```typescript
// Servicio retorna Observable con ApiResponse
getAllCondominiums(): Observable<ApiResponse<Condominium[]>> {
  return of({ success: true, data: this.mockData })
    .pipe(delay(300)); // Simula latencia de Lambda
}
```

### Type Safety
```typescript
// Todos los tipos están definidos
interface Condominium { ... }
interface Resident { ... }
interface Unit { ... }

// DTOs para operaciones CRUD
interface CreateCondominiumDto { ... }
interface UpdateCondominiumDto extends Partial<CreateCondominiumDto> { ... }
```

---

**Fecha**: 28 de octubre de 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Implementado y funcional

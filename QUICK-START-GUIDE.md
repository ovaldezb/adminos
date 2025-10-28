# Guía Rápida - AdminOS

## 🚀 Inicio Rápido

### 1. Seleccionar Condominio
```typescript
// El condominio seleccionado está disponible globalmente
constructor(private condominiumService: CondominiumService) {
  effect(() => {
    const selectedCondo = this.condominiumService.selectedCondominium();
    // Tu lógica aquí
  });
}
```

### 2. Cambiar Condominio Seleccionado
```typescript
this.condominiumService.setSelectedCondominium(condominium);
```

### 3. Validar Condominio Antes de Operaciones
```typescript
const condoId = this.selectedCondo()?.id;

if (!condoId || condoId === 'all') {
  this.showToast('Por favor seleccione un condominio específico', 'error');
  return;
}

if (this.selectedCondo()?.totalUnits === 0) {
  this.showToast('Este condominio no tiene unidades', 'info');
  return;
}
```

---

## 📋 Estructura de Modelos

### Condominium
```typescript
interface Condominium {
  id: string;
  name: string;
  type: CondominiumType; // BUILDING, RESIDENTIAL_COMPLEX, GATED_COMMUNITY
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  
  // Para edificios
  towers?: Tower[]; // { id, name, floors, unitsPerFloor, totalUnits }
  
  // Para fraccionamientos
  privateStreets?: PrivateStreet[]; // { id, name, totalHouses }
  
  // Amenidades
  amenities?: Amenity[]; // { id, name, type, isRentable, hourlyRate, capacity }
  
  maintenanceFee: number;
  currency: string;
  billingDay: number;
  totalUnits: number;
  occupiedUnits: number;
  isActive: boolean;
}
```

### Resident
```typescript
interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  type: ResidentType; // OWNER, TENANT, FAMILY_MEMBER, COHABITANT
  
  // Nuevas banderas
  isAdministrator: boolean; // Puede administrar el condominio
  canReceiveNotifications: boolean; // Recibe anuncios
  
  condominiumId: string;
  buildingId?: string;
  unitId: string;
  isResponsible: boolean;
  isActive: boolean;
}
```

---

## 🔄 Flujo de Trabajo

### Crear Condominio
1. Usuario abre modal de creación
2. Selecciona tipo (Edificio/Fraccionamiento/Conjunto)
3. Si es **Edificio**: Agrega torres con pisos y unidades
4. Si es **Fraccionamiento**: Agrega privadas con número de casas
5. Agrega amenidades (opcional)
6. Guarda → `totalUnits` se calcula automáticamente

### Registrar Residente
1. Usuario selecciona condominio en navbar
2. Sistema valida que hay condominio y tiene unidades
3. Usuario abre modal/wizard
4. `condominiumId` se pre-llena automáticamente
5. Selecciona edificio/torre/privada
6. Selecciona unidad
7. Llena datos del residente
8. Configura banderas:
   - `isAdministrator`: false por defecto
   - `canReceiveNotifications`: true por defecto

---

## 🎯 Ejemplos de Uso

### Componente con Sincronización Global
```typescript
export class MiComponente {
  protected readonly selectedCondo = signal<Condominium | null>(null);
  
  constructor(private condominiumService: CondominiumService) {
    // Sincronizar con selección global
    effect(() => {
      const globalCondo = this.condominiumService.selectedCondominium();
      if (globalCondo && globalCondo.id !== this.selectedCondo()?.id) {
        this.selectedCondo.set(globalCondo);
        this.loadData(); // Recargar datos
      }
    });
  }
  
  loadData(): void {
    const condoId = this.selectedCondo()?.id;
    if (!condoId || condoId === 'all') {
      // Cargar datos de todos los condominios
    } else {
      // Cargar datos del condominio específico
    }
  }
}
```

### Validar Antes de Crear
```typescript
openCreateModal(): void {
  const selectedCondoId = this.selectedCondo()?.id;
  
  // Validación 1: Condominio seleccionado
  if (!selectedCondoId || selectedCondoId === 'all') {
    this.showToast('⚠️ Por favor seleccione un condominio específico', 'error');
    return;
  }
  
  // Validación 2: Tiene unidades
  const selectedCondo = this.selectedCondo();
  if (selectedCondo && selectedCondo.totalUnits === 0) {
    this.showToast('📋 Este condominio no tiene unidades. Cree edificios primero.', 'info');
    return;
  }
  
  // Continuar con creación...
  this.formData.set({
    condominiumId: selectedCondoId,
    // ... otros campos
  });
  
  this.showModal.set(true);
}
```

### Calcular Total de Unidades
```typescript
calculateTotalUnits(condo: Condominium): number {
  if (condo.towers) {
    return condo.towers.reduce((total, tower) => 
      total + (tower.floors * tower.unitsPerFloor), 0
    );
  }
  if (condo.privateStreets) {
    return condo.privateStreets.reduce((total, ps) => 
      total + ps.totalHouses, 0
    );
  }
  return 0;
}
```

---

## 📊 Datos Mock Disponibles

### Condominios
- **Torres del Parque** (ID: '1')
  - Tipo: BUILDING
  - 3 torres (A, B, C)
  - 144 unidades totales
  - Amenidades: Alberca, Gimnasio, Salón

- **Privadas del Sol** (ID: '2')
  - Tipo: RESIDENTIAL_COMPLEX
  - 4 privadas
  - 45 casas totales
  - Amenidades: Salón de fiestas, Cancha, Playground

- **Conjunto Las Flores** (ID: '3')
  - Tipo: GATED_COMMUNITY
  - 2 calles
  - 34 casas totales
  - Amenidades: Casa club, Piscina, BBQ

### Residentes
- 4+ residentes mock con banderas administrativas
- Vinculados a condominios reales
- Incluyen familias completas (owner + family members)

---

## ⚠️ Validaciones Importantes

### Al Crear Residentes
✅ Verificar que hay condominio seleccionado  
✅ Verificar que NO es "all"  
✅ Verificar que el condominio tiene unidades  
✅ Pre-llenar `condominiumId` automáticamente  

### Al Crear Pagos/Facturas
✅ Verificar que hay condominio seleccionado  
✅ Asociar pago/factura al condominio actual  
✅ Filtrar unidades del condominio seleccionado  

### Al Mostrar Estadísticas
✅ Si es "all": Mostrar estadísticas agregadas  
✅ Si es específico: Mostrar estadísticas del condominio  

---

## 🛠️ Debugging

### Ver Condominio Seleccionado
```typescript
console.log('Condominio actual:', this.condominiumService.selectedCondominium()());
```

### Listar Todos los Condominios
```typescript
this.condominiumService.getAllCondominiums().subscribe(response => {
  console.log('Condominios disponibles:', response.data);
});
```

### Verificar Estructura de Condominio
```typescript
const condo = this.condominiumService.selectedCondominium()();
console.log('Tipo:', condo?.type);
console.log('Torres:', condo?.towers);
console.log('Privadas:', condo?.privateStreets);
console.log('Amenidades:', condo?.amenities);
console.log('Total unidades:', condo?.totalUnits);
```

---

## 📝 Checklist de Implementación

Cuando crees un nuevo componente que use condominios:

- [ ] Inyectar `CondominiumService` en constructor
- [ ] Crear signal `selectedCondo` local
- [ ] Agregar `effect()` para sincronizar con global
- [ ] Validar condominio antes de operaciones CRUD
- [ ] Filtrar datos por `condominiumId`
- [ ] Manejar caso especial "all" si aplica
- [ ] Mostrar mensajes claros de validación

---

**Última actualización**: 28 de octubre de 2025  
**Versión**: 1.0.0

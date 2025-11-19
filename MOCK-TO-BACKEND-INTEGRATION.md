# Integración de Backend - Eliminación de Mock Data

## Resumen de Cambios

Este documento describe los cambios realizados para integrar los servicios del backend y eliminar la información mock hardcodeada en la aplicación.

---

## ✅ Componentes Actualizados

### 1. **Navbar Component** (`src/app/components/navbar/`)

#### Antes (Mock Data):
- Notificaciones hardcodeadas en un array estático
- Usuario "Administrador" hardcodeado
- Contador de notificaciones manual

#### Después (Backend Integrado):
- ✅ **AuthService**: Carga el usuario actual del backend
- ✅ **NotificationService**: Carga notificaciones desde el backend
- ✅ Contador de notificaciones computed (calcula automáticamente los no leídos)
- ✅ Método `markAllAsRead()` conectado al servicio
- ✅ Método `clearNotifications()` elimina notificaciones del backend
- ✅ Método `markNotificationAsRead()` marca individual como leída
- ✅ Método `getRelativeTime()` formatea fechas dinámicamente

#### Funcionalidades:
```typescript
// Usuario actual desde AuthService
protected readonly currentUser = signal<User | null>(null);

// Notificaciones desde NotificationService
protected readonly notifications = signal<Notification[]>([]);

// Contador computed
protected readonly notificationCount = computed(() => 
  this.notifications().filter(n => !n.isRead).length
);
```

---

### 2. **Dashboard Component** (`src/app/pages/dashboard/`)

#### Antes (Mock Data):
- Estadísticas hardcodeadas por condominio
- Datos estáticos en objeto `condoData`

#### Después (Backend Integrado):
- ✅ **CondominiumService**: Carga estadísticas desde el backend
- ✅ `getAllCondominiumsStats()`: Stats globales de todos los condominios
- ✅ `getCondominiumStats(id)`: Stats específicos de un condominio
- ✅ Stats computed dinámicamente desde datos del backend
- ✅ Loading state para mostrar feedback al usuario

#### Datos que ya NO son mock:
- Total de unidades
- Cobranza del mes
- Facturas pendientes
- Unidades morosas

#### Datos que AÚN son mock (no hay endpoints backend):
- ⏳ Actividad reciente (`recentActivity`)
- ⏳ Pagos pendientes (`pendingPayments`)

**Nota**: Estos datos permanecen como mock hasta que el backend implemente los endpoints correspondientes.

---

## 🔄 Servicios Backend Utilizados

### AuthService
```typescript
// Obtener usuario actual
getCurrentUser(): Observable<ApiResponse<User>>

// Login
login(request: LoginRequest): Observable<ApiResponse<AuthResponse>>

// Logout
logout(): Observable<ApiResponse<void>>
```

### NotificationService
```typescript
// Obtener notificaciones del usuario
getUserNotifications(userId: string, unreadOnly?: boolean): Observable<ApiResponse<Notification[]>>

// Marcar como leída
markAsRead(notificationId: string): Observable<ApiResponse<Notification>>

// Marcar todas como leídas
markAllAsRead(userId: string): Observable<ApiResponse<void>>

// Eliminar notificación
deleteNotification(notificationId: string): Observable<ApiResponse<void>>

// Obtener contador de no leídas
getUnreadCount(userId: string): Observable<ApiResponse<number>>
```

### CondominiumService
```typescript
// Stats globales
getAllCondominiumsStats(): Observable<ApiResponse<CondominiumStats>>

// Stats de condominio específico
getCondominiumStats(id: string): Observable<ApiResponse<CondominiumStats>>

// Obtener todos los condominios
getAllCondominiums(): Observable<ApiResponse<Condominium[]>>
```

---

## 📊 Estado de Integración por Módulo

| Módulo | Estado | Backend Integrado | Mock Remanente |
|--------|--------|-------------------|----------------|
| **Navbar** | ✅ Completo | Usuario, Notificaciones | Ninguno |
| **Dashboard** | 🔶 Parcial | Stats principales | Actividad reciente, Pagos pendientes |
| **Condominiums** | ✅ Completo | CRUD completo | Ninguno |
| **Buildings** | ✅ Completo | CRUD completo | Ninguno |
| **Units** | ✅ Completo | CRUD completo | Ninguno |
| **Residents** | ✅ Completo | CRUD completo | Ninguno |
| **Payments** | 🔶 Mock | - | Todo (esperando backend) |
| **Invoices** | 🔶 Mock | - | Todo (esperando backend) |
| **Providers** | 🔶 Mock | - | Todo (esperando backend) |

---

## 🎯 Comportamiento Actual

### Navbar
1. Al cargar (`ngOnInit`):
   - Llama a `AuthService.getCurrentUser()` para obtener el usuario
   - Llama a `NotificationService.getUserNotifications()` para cargar notificaciones

2. Al hacer clic en una notificación:
   - Marca como leída en el backend
   - Actualiza el estado local

3. Al hacer clic en "Marcar todas como leídas":
   - Llama al backend para marcar todas
   - Actualiza el estado local

4. Al hacer clic en "Limpiar todas":
   - Elimina todas las notificaciones del backend
   - Limpia el array local

### Dashboard
1. Al cargar (`ngOnInit`):
   - Llama a `CondominiumService.getAllCondominiumsStats()` para vista general
   
2. Al seleccionar un condominio:
   - Llama a `CondominiumService.getCondominiumStats(id)` para ese condominio específico
   - Actualiza las estadísticas dinámicamente

3. Datos mostrados:
   - **Desde Backend**: Total unidades, cobranza, facturas pendientes, morosos
   - **Mock Temporal**: Actividad reciente, lista de pagos pendientes

---

## 🚀 Próximos Pasos

### Endpoints Backend Requeridos:
1. **Activity/Timeline**:
   - `GET /activities` - Obtener actividad reciente
   - Parámetros: `userId`, `condominiumId`, `limit`

2. **Payments (Dashboard)**:
   - `GET /payments/pending` - Obtener pagos pendientes
   - Parámetros: `condominiumId`, `status`, `limit`

3. **Facturas (Invoices)**:
   - `GET /invoices` - CRUD completo de facturas
   - `POST /invoices`
   - `PUT /invoices/{id}`
   - `DELETE /invoices/{id}`

4. **Proveedores (Providers)**:
   - `GET /providers` - CRUD completo de proveedores
   - `POST /providers`
   - `PUT /providers/{id}`
   - `DELETE /providers/{id}`

---

## 📝 Notas Importantes

### Estructura de Respuesta
Todos los servicios ya están configurados para recibir la estructura del backend:
```typescript
{
  success: boolean;
  message?: string;
  data?: T;
  error?: { code: string; message: string; };
  timestamp: Date;
}
```

### Manejo de Errores
- Todos los servicios tienen manejo de errores con `console.error`
- Los errores no bloquean la UI
- Los datos mock se mantienen como fallback cuando el backend no responde

### Testing
- Verificar que las notificaciones se cargan correctamente
- Verificar que el usuario se muestra con avatar y nombre
- Verificar que las estadísticas del dashboard se actualizan al cambiar de condominio
- Verificar que marcar notificaciones como leídas funciona
- Verificar que eliminar notificaciones funciona

---

## 🔍 Dónde Buscar Mock Data Remanente

Para encontrar datos mock que aún no están integrados:
```bash
# Buscar en los archivos TypeScript
grep -r "signal(\[" src/app/pages/
grep -r "= \[{" src/app/pages/
grep -r "mock" src/app/
```

### Ubicaciones Conocidas con Mock:
1. ✅ `navbar.ts` - **ELIMINADO** (ahora usa servicios)
2. 🔶 `dashboard.ts` - **PARCIALMENTE INTEGRADO** (stats desde backend, activity mock)
3. ⏳ `payments.ts` - **TODO MOCK** (esperando backend)
4. ⏳ `providers.ts` - **TODO MOCK** (esperando backend)

---

## ✨ Mejoras Implementadas

1. **Signals Computed**: Uso de `computed()` para cálculos derivados (ej: notificationCount)
2. **Loading States**: Estados de carga para mejor UX
3. **Error Handling**: Manejo robusto de errores en todas las llamadas al backend
4. **Type Safety**: Todos los tipos están correctamente tipados con interfaces
5. **Reactive Updates**: Los datos se actualizan automáticamente cuando cambian
6. **Relative Time**: Formateo dinámico de fechas relativas en notificaciones

---

## 📚 Recursos

- [BACKEND-FRONTEND-SYNC.md](./BACKEND-FRONTEND-SYNC.md) - Documentación de sincronización con backend
- [Services Guide](./SERVICES-GUIDE.md) - Guía de servicios disponibles
- Modelos: `src/app/models/`
- Servicios: `src/app/services/`

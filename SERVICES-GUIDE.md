# AdminOS - Servicios y Modelos

## 📁 Estructura de Carpetas

```
src/app/
├── models/              # Interfaces y tipos TypeScript
│   ├── condominium.model.ts
│   ├── unit.model.ts
│   ├── resident.model.ts
│   ├── invoice.model.ts
│   ├── payment.model.ts
│   ├── activity.model.ts
│   ├── notification.model.ts
│   ├── user.model.ts
│   ├── api.model.ts
│   └── index.ts         # Barrel exports
│
└── services/            # Servicios con simulación de AWS Lambda
    ├── condominium.service.ts
    ├── unit.service.ts
    ├── resident.service.ts
    ├── invoice.service.ts
    ├── payment.service.ts
    ├── activity.service.ts
    ├── notification.service.ts
    ├── auth.service.ts
    └── index.ts         # Barrel exports
```

---

## 🎯 Modelos (Interfaces)

### 1. **Condominium Model** (`condominium.model.ts`)
Gestión de condominios/edificios.

```typescript
interface Condominium {
  id: string;
  name: string;
  address: string;
  units: number;
  towers: number;
  avatar?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CondominiumStats {
  totalUnits: number;
  occupiedUnits: number;
  monthlyCollection: number;
  pendingInvoices: number;
  delinquentUnits: number;
  collectionRate: number;
}
```

**Uso:**
```typescript
import { Condominium, CondominiumStats } from '@app/models';
```

---

### 2. **Unit Model** (`unit.model.ts`)
Gestión de unidades/departamentos.

```typescript
interface Unit {
  id: string;
  condominiumId: string;
  unitNumber: string;
  tower: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: UnitStatus;
  monthlyFee: number;
}

enum UnitStatus {
  OCCUPIED = 'occupied',
  VACANT = 'vacant',
  UNDER_MAINTENANCE = 'under_maintenance',
  FOR_SALE = 'for_sale',
  FOR_RENT = 'for_rent'
}
```

---

### 3. **Resident Model** (`resident.model.ts`)
Gestión de propietarios e inquilinos.

```typescript
interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  type: ResidentType;
  condominiumId: string;
  unitId: string;
  isActive: boolean;
}

enum ResidentType {
  OWNER = 'owner',
  TENANT = 'tenant',
  BOTH = 'both'
}
```

---

### 4. **Invoice Model** (`invoice.model.ts`)
Gestión de facturas y cargos.

```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;
  condominiumId: string;
  unitId: string;
  residentId: string;
  amount: number;
  dueDate: Date;
  status: InvoiceStatus;
  period: string;
  items: InvoiceItem[];
  totalAmount: number;
}

enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIALLY_PAID = 'partially_paid',
  CANCELLED = 'cancelled'
}
```

---

### 5. **Payment Model** (`payment.model.ts`)
Gestión de pagos.

```typescript
interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  reference?: string;
}

enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card'
}
```

---

### 6. **Activity Model** (`activity.model.ts`)
Registro de actividades y eventos.

```typescript
interface Activity {
  id: string;
  condominiumId: string;
  type: ActivityType;
  title: string;
  description: string;
  entityType: EntityType;
  entityId: string;
  userId: string;
  createdAt: Date;
}

enum ActivityType {
  PAYMENT_RECEIVED = 'payment_received',
  INVOICE_GENERATED = 'invoice_generated',
  RESIDENT_ADDED = 'resident_added',
  // ... más tipos
}
```

---

### 7. **Notification Model** (`notification.model.ts`)
Sistema de notificaciones.

```typescript
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}
```

---

### 8. **User Model** (`user.model.ts`)
Autenticación y usuarios.

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  condominiumIds: string[];
  isActive: boolean;
}

enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant'
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}
```

---

## 🚀 Servicios (AWS Lambda Simulation)

Todos los servicios simulan llamadas a AWS Lambda con:
- ✅ Delays realistas (200-800ms)
- ✅ Respuestas tipo `ApiResponse<T>`
- ✅ Manejo de errores
- ✅ Datos mock realistas

### 1. **CondominiumService**

```typescript
import { CondominiumService } from '@app/services';

constructor(private condoService: CondominiumService) {}

// GET: Obtener todos los condominios
this.condoService.getAllCondominiums().subscribe({
  next: (response) => {
    if (response.success) {
      console.log(response.data); // Condominium[]
    }
  }
});

// GET: Obtener estadísticas de un condominio
this.condoService.getCondominiumStats('1').subscribe({
  next: (response) => {
    if (response.success) {
      console.log(response.data); // CondominiumStats
    }
  }
});

// POST: Crear nuevo condominio
this.condoService.createCondominium({
  name: 'Nuevo Edificio',
  address: 'Calle Example 123',
  units: 100,
  towers: 2
}).subscribe({
  next: (response) => {
    console.log('Condominio creado:', response.data);
  }
});
```

**Métodos disponibles:**
- `getAllCondominiums()` - Lambda: `getCondominiums`
- `getCondominiumById(id)` - Lambda: `getCondominiumById`
- `getCondominiumStats(id)` - Lambda: `getCondominiumStats`
- `getAllCondominiumsStats()` - Lambda: `getAllCondominiumsStats`
- `createCondominium(data)` - Lambda: `createCondominium`
- `updateCondominium(id, data)` - Lambda: `updateCondominium`
- `deleteCondominium(id)` - Lambda: `deleteCondominium`

---

### 2. **InvoiceService**

```typescript
import { InvoiceService } from '@app/services';

// GET: Obtener facturas con paginación
this.invoiceService.getInvoices({
  page: 1,
  pageSize: 10,
  condominiumId: '1',
  status: InvoiceStatus.PENDING
}).subscribe({
  next: (response) => {
    if (response.success) {
      const { items, total, page } = response.data!;
      console.log(`Mostrando ${items.length} de ${total} facturas`);
    }
  }
});

// GET: Facturas vencidas
this.invoiceService.getOverdueInvoices('1').subscribe({
  next: (response) => {
    console.log('Facturas vencidas:', response.data);
  }
});

// POST: Crear factura
this.invoiceService.createInvoice({
  condominiumId: '1',
  unitId: 'U-101',
  residentId: 'R-001',
  amount: 1500,
  dueDate: new Date('2025-11-05'),
  period: '2025-10'
}).subscribe({
  next: (response) => {
    console.log('Factura creada:', response.data);
  }
});
```

**Métodos disponibles:**
- `getInvoices(params)` - Lambda: `getInvoices`
- `getInvoiceById(id)` - Lambda: `getInvoiceById`
- `createInvoice(data)` - Lambda: `createInvoice`
- `updateInvoiceStatus(id, status)` - Lambda: `updateInvoiceStatus`
- `getOverdueInvoices(condoId)` - Lambda: `getOverdueInvoices`
- `sendInvoiceReminder(invoiceId)` - Lambda: `sendInvoiceReminder`

---

### 3. **PaymentService**

```typescript
import { PaymentService } from '@app/services';

// POST: Registrar pago
this.paymentService.registerPayment({
  invoiceId: 'INV-001',
  condominiumId: '1',
  unitId: 'U-101',
  residentId: 'R-001',
  amount: 1500,
  paymentMethod: PaymentMethod.BANK_TRANSFER,
  reference: 'TRF-20251022-001'
}).subscribe({
  next: (response) => {
    console.log('Pago registrado:', response.data);
  }
});

// GET: Pagos recientes
this.paymentService.getRecentPayments('1', 10).subscribe({
  next: (response) => {
    console.log('Últimos pagos:', response.data);
  }
});

// GET: Estadísticas de pagos
this.paymentService.getPaymentStats('1').subscribe({
  next: (response) => {
    const { total, totalAmount, byMethod } = response.data!;
    console.log(`Total: ${total} pagos = S/. ${totalAmount}`);
  }
});
```

---

### 4. **ActivityService**

```typescript
import { ActivityService } from '@app/services';

// GET: Actividades recientes
this.activityService.getRecentActivities('1', 10).subscribe({
  next: (response) => {
    console.log('Últimas actividades:', response.data);
  }
});

// POST: Registrar actividad
this.activityService.logActivity({
  condominiumId: '1',
  type: ActivityType.PAYMENT_RECEIVED,
  title: 'Pago recibido',
  description: 'Juan Pérez - S/. 1,500',
  entityType: EntityType.PAYMENT,
  entityId: 'PAY-001',
  userId: 'admin-001',
  userName: 'Admin'
}).subscribe({
  next: (response) => {
    console.log('Actividad registrada');
  }
});
```

---

### 5. **NotificationService**

```typescript
import { NotificationService } from '@app/services';

// GET: Notificaciones del usuario
this.notificationService.getUserNotifications('admin-001', true).subscribe({
  next: (response) => {
    console.log('Notificaciones no leídas:', response.data);
  }
});

// GET: Contador de no leídas
this.notificationService.getUnreadCount('admin-001').subscribe({
  next: (response) => {
    console.log('Tienes', response.data, 'notificaciones nuevas');
  }
});

// PUT: Marcar como leída
this.notificationService.markAsRead('NOTIF-001').subscribe({
  next: (response) => {
    console.log('Marcada como leída');
  }
});
```

---

### 6. **AuthService**

```typescript
import { AuthService } from '@app/services';

// POST: Login
this.authService.login({
  email: 'admin@adminos.com',
  password: 'admin123',
  rememberMe: true
}).subscribe({
  next: (response) => {
    if (response.success) {
      const { user, token } = response.data!;
      localStorage.setItem('token', token);
      console.log('Bienvenido', user.firstName);
    } else {
      console.error(response.error?.message);
    }
  }
});

// GET: Usuario actual
this.authService.getCurrentUser().subscribe({
  next: (response) => {
    console.log('Usuario:', response.data);
  }
});

// POST: Logout
this.authService.logout().subscribe({
  next: () => {
    console.log('Sesión cerrada');
  }
});
```

**Credenciales Mock:**
- Email: `admin@adminos.com`
- Password: `admin123`

---

### 7. **ResidentService**

```typescript
// GET: Buscar residentes
this.residentService.getResidents({
  page: 1,
  pageSize: 10,
  condominiumId: '1',
  search: 'juan'
}).subscribe({
  next: (response) => {
    console.log('Residentes encontrados:', response.data?.items);
  }
});

// GET: Residentes con deuda
this.residentService.getResidentsWithDebt('1').subscribe({
  next: (response) => {
    console.log('Morosos:', response.data);
  }
});
```

---

### 8. **UnitService**

```typescript
// GET: Unidades vacantes
this.unitService.getVacantUnits('1').subscribe({
  next: (response) => {
    console.log('Unidades disponibles:', response.data);
  }
});

// GET: Estadísticas de unidades
this.unitService.getUnitStats('1').subscribe({
  next: (response) => {
    const { total, byStatus } = response.data!;
    console.log(`Total: ${total} unidades`);
    console.log('Por estado:', byStatus);
  }
});
```

---

## 📊 Estructura de Respuesta API

Todas las respuestas siguen el formato `ApiResponse<T>`:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: Date;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
```

**Ejemplo de éxito:**
```json
{
  "success": true,
  "data": { /* ... */ },
  "message": "Operación exitosa",
  "timestamp": "2025-10-22T10:30:00Z"
}
```

**Ejemplo de error:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Recurso no encontrado"
  },
  "timestamp": "2025-10-22T10:30:00Z"
}
```

---

## 🔄 Paginación

Las respuestas paginadas usan `PaginatedResponse<T>`:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

**Ejemplo de uso:**
```typescript
this.service.getItems({ page: 2, pageSize: 20 }).subscribe({
  next: (response) => {
    const { items, total, hasNext } = response.data!;
    // Procesar items...
    if (hasNext) {
      // Cargar más...
    }
  }
});
```

---

## 🎨 Uso en Componentes

### Ejemplo completo en Dashboard:

```typescript
import { Component, OnInit, signal } from '@angular/core';
import { 
  CondominiumService, 
  ActivityService, 
  InvoiceService 
} from '@app/services';
import { 
  Condominium, 
  ActivityWithDetails, 
  InvoiceStatus 
} from '@app/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  condominiums = signal<Condominium[]>([]);
  activities = signal<ActivityWithDetails[]>([]);
  loading = signal(false);

  constructor(
    private condoService: CondominiumService,
    private activityService: ActivityService,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    // Cargar condominios
    this.condoService.getAllCondominiums().subscribe({
      next: (response) => {
        if (response.success) {
          this.condominiums.set(response.data!);
        }
      }
    });

    // Cargar actividades recientes
    this.activityService.getRecentActivities(undefined, 10).subscribe({
      next: (response) => {
        if (response.success) {
          this.activities.set(response.data!);
        }
        this.loading.set(false);
      }
    });
  }
}
```

---

## 🔐 Autenticación y Tokens

Los servicios simulan el uso de tokens JWT:

```typescript
// 1. Login y guardar token
this.authService.login({ email, password }).subscribe({
  next: (response) => {
    if (response.success) {
      const { token, refreshToken } = response.data!;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('refresh_token', refreshToken);
    }
  }
});

// 2. Usar token en requests (en producción)
// Los servicios deberían agregar el token en headers:
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
};
```

---

## 🧪 Testing

Ejemplo de test con datos mock:

```typescript
import { TestBed } from '@angular/core/testing';
import { CondominiumService } from '@app/services';

describe('CondominiumService', () => {
  let service: CondominiumService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CondominiumService);
  });

  it('should fetch all condominiums', (done) => {
    service.getAllCondominiums().subscribe({
      next: (response) => {
        expect(response.success).toBe(true);
        expect(response.data?.length).toBeGreaterThan(0);
        done();
      }
    });
  });
});
```

---

## 📝 Notas Importantes

1. **Datos Mock**: Todos los servicios usan datos mock en memoria. En producción, reemplazar con llamadas reales a AWS Lambda.

2. **Delays Simulados**: Los servicios usan `delay()` de RxJS para simular latencia de red (200-800ms).

3. **Observables**: Todos los métodos retornan Observables, compatible con el patrón reactivo de Angular.

4. **Type Safety**: Todas las interfaces están fuertemente tipadas con TypeScript.

5. **Error Handling**: Los servicios manejan errores y retornan respuestas con `success: false`.

---

## 🚀 Próximos Pasos

Para conectar con AWS Lambda real:

1. Reemplazar los `of()` con `HttpClient.get/post/put/delete`
2. Configurar endpoints de AWS API Gateway
3. Implementar interceptores HTTP para tokens
4. Agregar retry logic y error handling robusto
5. Implementar caché donde sea apropiado

---

## 📚 Referencias

- [Angular HttpClient](https://angular.dev/guide/http)
- [RxJS Observables](https://rxjs.dev/guide/observable)
- [AWS Lambda](https://aws.amazon.com/lambda/)
- [TypeScript Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)

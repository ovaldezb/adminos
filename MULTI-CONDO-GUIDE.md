# Sistema Multi-Condominio - CondoAdmin

## 🏢 Visión General

El sistema CondoAdmin ahora soporta la administración de **múltiples condominios** desde una sola cuenta de administrador. El administrador puede gestionar varios edificios y alternar entre:

- **Vista General**: Muestra estadísticas consolidadas de todos los condominios
- **Vista Específica**: Muestra información detallada de un condominio seleccionado

---

## 🎯 Características Principales

### 1. **Selector de Condominios** 
Ubicado en el navbar (centro), permite:
- ✅ Seleccionar entre múltiples condominios
- ✅ Ver "Todos los Condominios" para vista general
- ✅ Mostrar información resumida (unidades, torres, dirección)
- ✅ Búsqueda visual con iconos y colores distintivos
- ✅ Opción de agregar nuevos condominios

### 2. **Vista General (Modo Todos)**
Cuando se selecciona "Todos los Condominios":

#### Banner Informativo
- Alerta visual que indica que está en modo vista general
- Información de estadísticas consolidadas

#### Tarjetas de Estadísticas Globales
- **Total de Unidades**: 796 unidades en total
- **Cobranza Total**: $1,245,680 del mes
- **Facturas Pendientes**: 87 en total
- **Morosos Totales**: 32 en todos los condominios

#### Resumen por Condominio
Grid de tarjetas mostrando cada condominio:
- **Torres del Sol**: 248 unidades, 94% cobranza, 42 pendientes
- **Residencial Las Palmas**: 186 unidades, 96% cobranza, 18 pendientes
- **Conjunto Villa Verde**: 124 unidades, 90% cobranza, 12 pendientes
- **Edificio Mirador**: 96 unidades, 92% cobranza, 8 pendientes
- **Terrazas del Parque**: 142 unidades, 95% cobranza, 7 pendientes

Cada tarjeta incluye:
- Icono y color distintivo
- Porcentaje de cobranza
- Total de unidades
- Pagos pendientes
- Barra de progreso visual

### 3. **Vista Específica (Modo Individual)**
Cuando se selecciona un condominio específico:

#### Estadísticas del Condominio
- Datos filtrados solo para ese condominio
- Unidades del condominio seleccionado
- Cobranza específica del condominio
- Facturas pendientes específicas
- Morosos del condominio

#### Actividad Reciente
- Eventos filtrados por condominio
- Pagos recibidos
- Facturas generadas
- Nuevos residentes
- Recordatorios enviados

#### Tabla de Pagos Pendientes
- Lista de unidades con pagos vencidos
- Información de propietarios
- Días de mora
- Acciones rápidas por unidad

---

## 🗂️ Estructura de Componentes

```
src/app/
├── components/
│   ├── condo-selector/          # Nuevo componente selector
│   │   ├── condo-selector.ts
│   │   ├── condo-selector.html
│   │   └── condo-selector.css
│   ├── navbar/                  # Actualizado con selector
│   │   ├── navbar.ts
│   │   ├── navbar.html
│   │   └── navbar.css
│   └── side-menu/               # Actualizado para mostrar condo activo
│       ├── side-menu.ts
│       ├── side-menu.html
│       └── side-menu.css
└── pages/
    └── dashboard/               # Actualizado con lógica multi-condo
        ├── dashboard.ts
        ├── dashboard.html
        └── dashboard.css
```

---

## 📊 Datos por Condominio

### Torres del Sol
- **ID**: 1
- **Unidades**: 248
- **Torres**: 3
- **Cobranza**: $485,230
- **Pendientes**: 42
- **Morosos**: 15

### Residencial Las Palmas
- **ID**: 2
- **Unidades**: 186
- **Torres**: 2
- **Cobranza**: $298,450
- **Pendientes**: 18
- **Morosos**: 6

### Conjunto Villa Verde
- **ID**: 3
- **Unidades**: 124
- **Torres**: 2
- **Cobranza**: $186,920
- **Pendientes**: 12
- **Morosos**: 5

### Edificio Mirador
- **ID**: 4
- **Unidades**: 96
- **Torres**: 1
- **Cobranza**: $142,380
- **Pendientes**: 8
- **Morosos**: 3

### Terrazas del Parque
- **ID**: 5
- **Unidades**: 142
- **Torres**: 2
- **Cobranza**: $132,700
- **Pendientes**: 7
- **Morosos**: 3

---

## 🎨 Paleta de Colores por Condominio

Cada condominio tiene un color distintivo:

- **Vista General**: `from-neutral-600 to-neutral-400` (Gris)
- **Torres del Sol**: `from-primary to-sky-400` (Azul cielo)
- **Residencial Las Palmas**: `from-success to-green-400` (Verde)
- **Conjunto Villa Verde**: `from-secondary to-purple-400` (Púrpura)
- **Edificio Mirador**: `from-warning to-yellow-400` (Amarillo)
- **Terrazas del Parque**: `from-info to-cyan-400` (Cyan)

---

## 🔄 Flujo de Uso

### Paso 1: Login
```
/login → Iniciar sesión con credenciales
```

### Paso 2: Vista General (Por Defecto)
```
/inicio → Dashboard con "Todos los Condominios" seleccionado
```
- Ver estadísticas consolidadas
- Ver resumen de cada condominio en tarjetas
- Identificar condominios con problemas de cobranza

### Paso 3: Seleccionar Condominio Específico
```
Click en Selector → Elegir condominio → Vista específica
```
- Ver datos filtrados del condominio
- Gestionar pagos pendientes específicos
- Ver actividad reciente del condominio

### Paso 4: Regresar a Vista General
```
Click en Selector → "Todos los Condominios" → Vista general
```

---

## 🔧 Funcionalidades Técnicas

### Signals de Angular
```typescript
selectedCondo = signal<Condominium | null>(null);
isOverviewMode = computed(() => !this.selectedCondo() || this.selectedCondo()?.id === 'all');
stats = computed(() => { /* Cálculo dinámico basado en selectedCondo */ });
```

### Eventos y Comunicación
```typescript
// Navbar emite cambio de condominio
(condoChanged)="onCondoSelected($event)"

// Dashboard recibe y actualiza estado
onCondoSelected(condo: Condominium | null): void {
  this.selectedCondo.set(condo);
}
```

### Renderizado Condicional
```html
<!-- Mostrar solo en vista general -->
@if (isOverviewMode()) {
  <div>Contenido de vista general</div>
}

<!-- Mostrar solo en vista específica -->
@if (!isOverviewMode()) {
  <div>Contenido específico del condominio</div>
}
```

---

## 📱 Responsive Design

- **Mobile**: Selector colapsable en navbar
- **Tablet**: Grid de 2 columnas para tarjetas
- **Desktop**: Grid de 3-4 columnas, selector siempre visible

---

## 🚀 Próximas Mejoras Sugeridas

1. **Filtros Avanzados**: Filtrar por rango de fechas, estado de cobranza
2. **Gráficos Comparativos**: Comparar rendimiento entre condominios
3. **Exportación de Reportes**: PDF/Excel por condominio o general
4. **Alertas Personalizadas**: Notificaciones específicas por condominio
5. **Dashboard Personalizable**: Permitir reordenar y ocultar secciones
6. **Gestión de Permisos**: Asignar diferentes niveles de acceso por condominio

---

## 💡 Casos de Uso

### Caso 1: Monitoreo Matutino
**Objetivo**: Revisar estado general de todos los condominios

1. Login al sistema
2. Vista general muestra resumen consolidado
3. Identificar condominios con problemas (cobranza baja, muchos pendientes)
4. Hacer click en condominio problemático para ver detalles

### Caso 2: Gestión de Cobranza Específica
**Objetivo**: Revisar y gestionar pagos pendientes de un condominio

1. Seleccionar condominio específico del dropdown
2. Ver tabla de pagos pendientes filtrada
3. Enviar recordatorios o registrar pagos
4. Ver actividad reciente del condominio

### Caso 3: Reportes Mensuales
**Objetivo**: Generar reporte consolidado de todos los condominios

1. Modo vista general
2. Capturar estadísticas consolidadas
3. Revisar rendimiento de cada condominio en tarjetas
4. Identificar tendencias y áreas de mejora

---

## 🎓 Guía para Desarrolladores

### Agregar un Nuevo Condominio

1. **Actualizar el selector** (`condo-selector.ts`):
```typescript
{
  id: '6',
  name: 'Nuevo Condominio',
  address: 'Dirección...',
  units: 150,
  towers: 2,
  color: 'from-rose to-pink-400'
}
```

2. **Agregar datos** (`dashboard.ts`):
```typescript
'6': {
  units: 150,
  collection: '$220,000',
  pending: 10,
  delinquent: 4
}
```

### Agregar Nueva Estadística

1. **Actualizar interfaz de datos**
2. **Modificar computed signal** en `dashboard.ts`
3. **Actualizar template** para mostrar nueva estadística

---

## 📞 Soporte

Para dudas o problemas con el sistema multi-condominio, contactar al equipo de desarrollo.

**Sistema desarrollado con**: Angular 20, Tailwind CSS v4, DaisyUI v5, Remix Icons

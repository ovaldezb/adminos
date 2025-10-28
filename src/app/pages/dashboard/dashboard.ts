import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SideMenuComponent } from '../../components/side-menu/side-menu';
import { Condominium } from '../../models';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, NavbarComponent, SideMenuComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  protected readonly sidebarOpen = signal(false);
  protected readonly userName = signal('Administrador');
  protected readonly selectedCondo = signal<Condominium | null>(null);
  protected readonly isOverviewMode = computed(() => !this.selectedCondo() || this.selectedCondo()?.id === 'all');
  protected readonly isAnimating = signal(false);
  
  // Data por condominio
  private readonly condoData = {
    'all': {
      units: 796,
      collection: '$1,245,680',
      pending: 87,
      delinquent: 32
    },
    '1': { // Torres del Sol
      units: 248,
      collection: '$485,230',
      pending: 42,
      delinquent: 15
    },
    '2': { // Residencial Las Palmas
      units: 186,
      collection: '$298,450',
      pending: 18,
      delinquent: 6
    },
    '3': { // Conjunto Villa Verde
      units: 124,
      collection: '$186,920',
      pending: 12,
      delinquent: 5
    },
    '4': { // Edificio Mirador
      units: 96,
      collection: '$142,380',
      pending: 8,
      delinquent: 3
    },
    '5': { // Terrazas del Parque
      units: 142,
      collection: '$132,700',
      pending: 7,
      delinquent: 3
    }
  };

  // Estadísticas principales (computed)
  protected readonly stats = computed(() => {
    const condoId = this.selectedCondo()?.id || 'all';
    const data = this.condoData[condoId as keyof typeof this.condoData] || this.condoData['all'];
    
    return [
      { 
        icon: 'ri-home-4-fill', 
        label: this.isOverviewMode() ? 'Total de Unidades' : 'Unidades en Este Condominio', 
        value: data.units.toString(), 
        change: '+12',
        changeLabel: 'este mes',
        color: 'text-primary',
        bgColor: 'from-primary/20 to-sky-400/20'
      },
      { 
        icon: 'ri-money-dollar-circle-fill', 
        label: 'Cobranza del Mes', 
        value: data.collection, 
        change: '+18.5%',
        changeLabel: 'vs mes anterior',
        color: 'text-success',
        bgColor: 'from-success/20 to-green-400/20'
      },
      { 
        icon: 'ri-bill-fill', 
        label: 'Facturas Pendientes', 
        value: data.pending.toString(), 
        change: '-8',
        changeLabel: 'esta semana',
        color: 'text-warning',
        bgColor: 'from-warning/20 to-yellow-400/20'
      },
      { 
        icon: 'ri-user-follow-fill', 
        label: 'Morosos', 
        value: data.delinquent.toString(), 
        change: '-3',
        changeLabel: 'vs mes anterior',
        color: 'text-error',
        bgColor: 'from-error/20 to-red-400/20'
      }
    ];
  });

  // Actividad reciente
  protected readonly recentActivity = signal([
    { 
      icon: 'ri-money-dollar-circle-fill', 
      title: 'Pago recibido', 
      description: 'Unidad 304 - Cuota de mantenimiento',
      time: 'Hace 5 minutos', 
      color: 'bg-success',
      amount: '$850'
    },
    { 
      icon: 'ri-file-text-fill', 
      title: 'Factura generada', 
      description: 'Factura mensual para Torre A',
      time: 'Hace 15 minutos', 
      color: 'bg-primary',
      amount: null
    },
    { 
      icon: 'ri-alert-fill', 
      title: 'Recordatorio enviado', 
      description: 'Notificación de pago pendiente',
      time: 'Hace 1 hora', 
      color: 'bg-warning',
      amount: null
    },
    { 
      icon: 'ri-user-add-fill', 
      title: 'Nuevo residente', 
      description: 'Alta en Unidad 508',
      time: 'Hace 2 horas', 
      color: 'bg-info',
      amount: null
    }
  ]);

  // Unidades con pagos pendientes
  protected readonly pendingPayments = signal([
    { id: '304', tower: 'A', owner: 'Juan Pérez', amount: '$850', days: 5, status: 'warning' },
    { id: '507', tower: 'B', owner: 'María García', amount: '$850', days: 15, status: 'error' },
    { id: '102', tower: 'A', owner: 'Carlos López', amount: '$1,200', days: 3, status: 'warning' },
    { id: '208', tower: 'C', owner: 'Ana Martínez', amount: '$850', days: 30, status: 'error' },
    { id: '412', tower: 'B', owner: 'Roberto Silva', amount: '$950', days: 7, status: 'warning' }
  ]);

  // Accesos rápidos
  protected readonly quickActions = signal([
    { 
      icon: 'ri-file-add-fill', 
      title: 'Nueva Factura', 
      description: 'Generar factura de cobro',
      color: 'from-primary to-sky-400',
      route: '/facturas/nueva'
    },
    { 
      icon: 'ri-money-dollar-circle-fill', 
      title: 'Registrar Pago', 
      description: 'Registrar nuevo pago',
      color: 'from-success to-green-400',
      route: '/pagos/nuevo'
    },
    { 
      icon: 'ri-user-add-fill', 
      title: 'Nuevo Residente', 
      description: 'Alta de propietario',
      color: 'from-secondary to-purple-400',
      route: '/residentes/nuevo'
    },
    { 
      icon: 'ri-bar-chart-box-fill', 
      title: 'Reportes', 
      description: 'Ver reportes financieros',
      color: 'from-info to-cyan-400',
      route: '/reportes'
    }
  ]);

  constructor(private router: Router) {}

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  onCondoSelected(condo: Condominium | null): void {
    console.log('Dashboard recibió selección:', condo?.name);
    
    // Trigger animation
    this.isAnimating.set(true);
    
    // Update selected condo
    this.selectedCondo.set(condo);
    
    // Simular actualización de datos con delay para efecto visual
    setTimeout(() => {
      this.updateActivityByCondo(condo?.id || 'all');
      this.updatePendingPaymentsByCondo(condo?.id || 'all');
      
      // Remove animation class after animation completes
      setTimeout(() => {
        this.isAnimating.set(false);
      }, 400);
    }, 100);
  }

  private updateActivityByCondo(condoId: string): void {
    // Simular diferentes actividades por condominio
    const activities = {
      'all': [
        { icon: 'ri-money-dollar-circle-fill', title: 'Pago recibido', description: 'Múltiples unidades - Varios condominios', time: 'Hace 5 minutos', color: 'bg-success', amount: '$3,450' },
        { icon: 'ri-file-text-fill', title: 'Facturas generadas', description: 'Generación masiva - Todos los condominios', time: 'Hace 15 minutos', color: 'bg-primary', amount: null },
        { icon: 'ri-alert-fill', title: 'Recordatorios enviados', description: '87 notificaciones enviadas', time: 'Hace 1 hora', color: 'bg-warning', amount: null },
        { icon: 'ri-user-add-fill', title: 'Nuevos residentes', description: 'Altas en varios condominios', time: 'Hace 2 horas', color: 'bg-info', amount: null }
      ],
      '1': [
        { icon: 'ri-money-dollar-circle-fill', title: 'Pago recibido', description: 'Torres del Sol - Unidad 304', time: 'Hace 10 minutos', color: 'bg-success', amount: '$850' },
        { icon: 'ri-file-text-fill', title: 'Factura generada', description: 'Torres del Sol - Torre A', time: 'Hace 30 minutos', color: 'bg-primary', amount: null },
        { icon: 'ri-alert-fill', title: 'Recordatorio enviado', description: 'Torres del Sol - 12 unidades', time: 'Hace 1 hora', color: 'bg-warning', amount: null }
      ],
      '2': [
        { icon: 'ri-money-dollar-circle-fill', title: 'Pago recibido', description: 'Las Palmas - Unidad 205', time: 'Hace 5 minutos', color: 'bg-success', amount: '$950' },
        { icon: 'ri-user-add-fill', title: 'Nuevo residente', description: 'Las Palmas - Unidad 307', time: 'Hace 45 minutos', color: 'bg-info', amount: null }
      ]
    };

    this.recentActivity.set(activities[condoId as keyof typeof activities] || activities['all']);
  }

  private updatePendingPaymentsByCondo(condoId: string): void {
    // Simular pagos pendientes por condominio
    const payments = {
      'all': [
        { id: '304', tower: 'A', owner: 'Juan Pérez', amount: '$850', days: 5, status: 'warning' },
        { id: '507', tower: 'B', owner: 'María García', amount: '$850', days: 15, status: 'error' },
        { id: '102', tower: 'A', owner: 'Carlos López', amount: '$1,200', days: 3, status: 'warning' },
        { id: '208', tower: 'C', owner: 'Ana Martínez', amount: '$850', days: 30, status: 'error' },
        { id: '412', tower: 'B', owner: 'Roberto Silva', amount: '$950', days: 7, status: 'warning' }
      ],
      '1': [
        { id: '304', tower: 'A', owner: 'Juan Pérez', amount: '$850', days: 5, status: 'warning' },
        { id: '507', tower: 'B', owner: 'María García', amount: '$850', days: 15, status: 'error' },
        { id: '102', tower: 'A', owner: 'Carlos López', amount: '$1,200', days: 3, status: 'warning' }
      ],
      '2': [
        { id: '205', tower: 'A', owner: 'Luis Ramírez', amount: '$750', days: 8, status: 'warning' },
        { id: '307', tower: 'B', owner: 'Elena Torres', amount: '$800', days: 12, status: 'error' }
      ]
    };

    this.pendingPayments.set(payments[condoId as keyof typeof payments] || payments['all']);
  }

  getCondoName(): string {
    if (this.isOverviewMode()) {
      return 'Vista General - Todos los Condominios';
    }
    return this.selectedCondo()?.name || 'Sin Seleccionar';
  }

  onLogout(): void {
    this.router.navigate(['/login']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}

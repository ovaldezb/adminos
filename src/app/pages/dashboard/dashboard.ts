import { Component, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SideMenuComponent } from '../../components/side-menu/side-menu';
import { Condominium } from '../../models';
import { CondominiumService, ActivityService } from '../../services';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, NavbarComponent, SideMenuComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  protected readonly sidebarOpen = signal(false);
  protected readonly userName = signal('Administrador');
  protected readonly selectedCondo = signal<Condominium | null>(null);
  protected readonly isOverviewMode = computed(() => !this.selectedCondo() || this.selectedCondo()?.id === 'all');
  protected readonly isAnimating = signal(false);
  protected readonly loading = signal(true);
  
  // Stats from backend services
  protected readonly condoStats = signal<any>(null);

  // Estadísticas principales (computed from backend data)
  protected readonly stats = computed(() => {
    const stats = this.condoStats();
    if (!stats) {
      return [
        { icon: 'ri-home-4-fill', label: 'Cargando...', value: '-', change: '', changeLabel: '', color: 'text-primary', bgColor: 'from-primary/20 to-sky-400/20' },
        { icon: 'ri-money-dollar-circle-fill', label: 'Cargando...', value: '-', change: '', changeLabel: '', color: 'text-success', bgColor: 'from-success/20 to-green-400/20' },
        { icon: 'ri-bill-fill', label: 'Cargando...', value: '-', change: '', changeLabel: '', color: 'text-warning', bgColor: 'from-warning/20 to-yellow-400/20' },
        { icon: 'ri-user-follow-fill', label: 'Cargando...', value: '-', change: '', changeLabel: '', color: 'text-error', bgColor: 'from-error/20 to-red-400/20' }
      ];
    }
    
    return [
      { 
        icon: 'ri-home-4-fill', 
        label: this.isOverviewMode() ? 'Total de Unidades' : 'Unidades en Este Condominio', 
        value: stats.totalUnits?.toString() || '0', 
        change: '+12',
        changeLabel: 'este mes',
        color: 'text-primary',
        bgColor: 'from-primary/20 to-sky-400/20'
      },
      { 
        icon: 'ri-money-dollar-circle-fill', 
        label: 'Cobranza del Mes', 
        value: `$${stats.monthlyCollection?.toLocaleString() || '0'}`, 
        change: '+18.5%',
        changeLabel: 'vs mes anterior',
        color: 'text-success',
        bgColor: 'from-success/20 to-green-400/20'
      },
      { 
        icon: 'ri-bill-fill', 
        label: 'Facturas Pendientes', 
        value: stats.pendingInvoices?.toString() || '0', 
        change: '-8',
        changeLabel: 'esta semana',
        color: 'text-warning',
        bgColor: 'from-warning/20 to-yellow-400/20'
      },
      { 
        icon: 'ri-user-follow-fill', 
        label: 'Morosos', 
        value: stats.delinquentUnits?.toString() || '0', 
        change: '-3',
        changeLabel: 'vs mes anterior',
        color: 'text-error',
        bgColor: 'from-error/20 to-red-400/20'
      }
    ];
  });

  // Actividad reciente (mock data - no hay endpoint backend aún)
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

  // Unidades con pagos pendientes (mock data - no hay endpoint backend aún)
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

  constructor(
    private router: Router,
    private condominiumService: CondominiumService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    this.loading.set(true);
    const condoId = this.selectedCondo()?.id;
    
    if (!condoId || condoId === 'all') {
      // Cargar stats globales
      this.condominiumService.getAllCondominiumsStats().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.condoStats.set(response.data);
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading dashboard stats:', error);
          this.loading.set(false);
        }
      });
    } else {
      // Cargar stats de condominio específico
      this.condominiumService.getCondominiumStats(condoId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.condoStats.set(response.data);
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading condominium stats:', error);
          this.loading.set(false);
        }
      });
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  onCondoSelected(condo: Condominium | null): void {
    
    // Trigger animation
    this.isAnimating.set(true);
    
    // Update selected condo
    this.selectedCondo.set(condo);
    
    // Cargar datos del backend
    this.loadDashboardStats();
    
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

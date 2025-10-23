import { Component, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { Condominium } from '../condo-selector/condo-selector';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  badge?: string;
  badgeColor?: string;
}

@Component({
  selector: 'app-side-menu',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './side-menu.html',
  styleUrl: './side-menu.css'
})
export class SideMenuComponent {
  readonly isOpen = input<boolean>(false);
  readonly selectedCondo = input<Condominium | null>(null);
  
  protected readonly menuItems = signal<MenuItem[]>([
    { 
      icon: 'ri-dashboard-3-fill', 
      label: 'Dashboard', 
      route: '/inicio'
    },
    { 
      icon: 'ri-money-dollar-circle-fill', 
      label: 'Cobranza', 
      route: '/cobranza',
      badge: '12',
      badgeColor: 'badge-warning'
    },
    { 
      icon: 'ri-bill-fill', 
      label: 'Facturación', 
      route: '/facturacion'
    },
    { 
      icon: 'ri-home-4-fill', 
      label: 'Unidades', 
      route: '/unidades',
      badge: '248',
      badgeColor: 'badge-info'
    },
    { 
      icon: 'ri-user-follow-fill', 
      label: 'Residentes', 
      route: '/residentes'
    },
    { 
      icon: 'ri-truck-fill', 
      label: 'Proveedores', 
      route: '/proveedores'
    },
    { 
      icon: 'ri-bar-chart-box-fill', 
      label: 'Reportes', 
      route: '/reportes'
    },
    { 
      icon: 'ri-calendar-fill', 
      label: 'Calendario', 
      route: '/calendario'
    },
    { 
      icon: 'ri-tools-fill', 
      label: 'Mantenimiento', 
      route: '/mantenimiento',
      badge: '3',
      badgeColor: 'badge-error'
    },
    { 
      icon: 'ri-message-3-fill', 
      label: 'Comunicados', 
      route: '/comunicados',
      badge: '5',
      badgeColor: 'badge-success'
    },
    { 
      icon: 'ri-settings-3-fill', 
      label: 'Configuración', 
      route: '/configuracion'
    }
  ]);

  getCondoInfo() {
    const condo = this.selectedCondo();
    if (!condo || condo.id === 'all') {
      return {
        name: 'Vista General',
        units: 796,
        towers: 10,
        isOverview: true
      };
    }
    return {
      name: condo.name,
      units: condo.units,
      towers: condo.towers,
      isOverview: false
    };
  }
}

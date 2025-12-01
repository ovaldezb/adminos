import { Component, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { Condominium } from '../../models';
import { filter } from 'rxjs/operators';

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
  readonly close = output<void>();
  
  protected readonly menuItems = signal<MenuItem[]>([
    { 
      icon: 'ri-dashboard-3-fill', 
      label: 'Dashboard', 
      route: '/inicio'
    },
    { 
      icon: 'ri-money-dollar-circle-fill', 
      label: 'Pagos', 
      route: '/pagos',
      badge: '12',
      badgeColor: 'badge-warning'
    },
    { 
      icon: 'ri-bill-fill', 
      label: 'Facturas', 
      route: '/facturas'
    },
    { 
      icon: 'ri-community-line', 
      label: 'Condominios', 
      route: '/condominios'
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

  constructor(private router: Router) {
    // Cerrar el sidebar cuando navegamos en móvil
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        // Emitir evento para cerrar el sidebar en móvil
        if (window.innerWidth < 1024) { // lg breakpoint
          this.close.emit();
        }
      });
  }

  onMenuClick(item: MenuItem): void {
    // Navigate to the selected menu item
    this.router.navigate([item.route]);
  }

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

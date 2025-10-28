import { Component, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CondoSelectorComponent } from '../condo-selector/condo-selector';
import { Condominium } from '../../models';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, CondoSelectorComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  protected readonly toggleSidebar = output<void>();
  protected readonly condoChanged = output<Condominium | null>();
  readonly showCondoSelector = input<boolean>(true);
  protected readonly showNotifications = signal(false);
  protected readonly showProfile = signal(false);
  protected readonly notificationCount = signal(5);
  
  protected readonly notifications = signal([
    { 
      id: 1, 
      icon: 'ri-money-dollar-circle-fill', 
      title: 'Nuevo pago recibido', 
      message: 'Unidad 304 - $850',
      time: 'Hace 5 min',
      unread: true,
      color: 'text-success'
    },
    { 
      id: 2, 
      icon: 'ri-alert-fill', 
      title: 'Pago vencido', 
      message: 'Unidad 507 - 15 días',
      time: 'Hace 1 hora',
      unread: true,
      color: 'text-warning'
    },
    { 
      id: 3, 
      icon: 'ri-user-add-fill', 
      title: 'Nuevo residente', 
      message: 'Alta en Unidad 508',
      time: 'Hace 2 horas',
      unread: true,
      color: 'text-info'
    },
    { 
      id: 4, 
      icon: 'ri-file-text-fill', 
      title: 'Factura generada', 
      message: 'Factura mensual Torre A',
      time: 'Hace 3 horas',
      unread: false,
      color: 'text-primary'
    },
    { 
      id: 5, 
      icon: 'ri-message-3-fill', 
      title: 'Nuevo mensaje', 
      message: 'Consulta de mantenimiento',
      time: 'Hace 5 horas',
      unread: false,
      color: 'text-secondary'
    }
  ]);

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleNotifications(): void {
    this.showNotifications.set(!this.showNotifications());
    if (this.showNotifications()) {
      this.showProfile.set(false);
    }
  }

  toggleProfile(): void {
    this.showProfile.set(!this.showProfile());
    if (this.showProfile()) {
      this.showNotifications.set(false);
    }
  }

  markAllAsRead(): void {
    const updatedNotifications = this.notifications().map(n => ({ ...n, unread: false }));
    this.notifications.set(updatedNotifications);
    this.notificationCount.set(0);
  }

  clearNotifications(): void {
    this.notifications.set([]);
    this.notificationCount.set(0);
  }

  onCondoSelected(condo: Condominium | null): void {
    this.condoChanged.emit(condo);
  }
}

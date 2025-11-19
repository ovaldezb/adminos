import { Component, signal, output, input, effect, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CondoSelectorComponent } from '../condo-selector/condo-selector';
import { Condominium, Notification, User } from '../../models';
import { CondominiumService, AuthService, NotificationService } from '../../services';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, CondoSelectorComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {
  protected readonly toggleSidebar = output<void>();
  protected readonly condoChanged = output<Condominium | null>();
  readonly showCondoSelector = input<boolean>(true);
  protected readonly showNotifications = signal(false);
  protected readonly showProfile = signal(false);
  
  // User data from AuthService
  protected readonly currentUser = signal<User | null>(null);
  
  // Notifications from NotificationService
  protected readonly notifications = signal<Notification[]>([]);
  protected readonly notificationCount = computed(() => 
    this.notifications().filter(n => !n.isRead).length
  );

  constructor(
    private condominiumService: CondominiumService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    // Sincronizar con el servicio global (si otro componente cambia la selección)
    effect(() => {
      const globalCondo = this.condominiumService.selectedCondominium();
      // Aquí se podría actualizar el selector si es necesario
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadNotifications();
  }

  private loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentUser.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading user:', error);
      }
    });
  }

  private loadNotifications(): void {
    const userId = 'admin-001'; // En producción, obtener del token o del usuario actual
    this.notificationService.getUserNotifications(userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notifications.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }

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
    const userId = this.currentUser()?.id || 'admin-001';
    this.notificationService.markAllAsRead(userId).subscribe({
      next: (response) => {
        if (response.success) {
          // Actualizar las notificaciones localmente
          const updated = this.notifications().map(n => ({ ...n, isRead: true, readAt: new Date() }));
          this.notifications.set(updated);
        }
      },
      error: (error) => {
        console.error('Error marking notifications as read:', error);
      }
    });
  }

  clearNotifications(): void {
    // Eliminar todas las notificaciones
    const deletePromises = this.notifications().map(n => 
      this.notificationService.deleteNotification(n.id).toPromise()
    );
    
    Promise.all(deletePromises).then(() => {
      this.notifications.set([]);
    }).catch(error => {
      console.error('Error clearing notifications:', error);
    });
  }

  markNotificationAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: (response) => {
        if (response.success) {
          // Actualizar la notificación localmente
          const updated = this.notifications().map(n => 
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
          );
          this.notifications.set(updated);
        }
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Justo ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }

  onCondoSelected(condo: Condominium | null): void {
    // Actualizar el servicio global
    this.condominiumService.setSelectedCondominium(condo);
    // Emitir el evento para componentes que escuchen directamente
    this.condoChanged.emit(condo);
  }
}

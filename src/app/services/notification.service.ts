import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, catchError } from 'rxjs';
import { Notification, NotificationType, NotificationSettings } from '../models/notification.model';
import { ApiResponse } from '../models/api.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  // Mock data
  private mockNotifications: Notification[] = [
    {
      id: 'NOTIF-001',
      userId: 'admin-001',
      condominiumId: '1',
      type: NotificationType.PAYMENT_OVERDUE,
      title: 'Pago Vencido',
      message: '5 unidades con pagos vencidos en Torres del Parque',
      icon: 'ri-error-warning-fill',
      color: '#f87272',
      isRead: false,
      actionUrl: '/facturas?status=overdue&condo=1',
      createdAt: new Date('2025-10-22T08:00:00'),
    },
    {
      id: 'NOTIF-002',
      userId: 'admin-001',
      condominiumId: '2',
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Nuevo Pago',
      message: 'Carlos Rodríguez ha realizado un pago de S/. 1,800',
      icon: 'ri-money-dollar-circle-fill',
      color: '#36d399',
      isRead: false,
      actionUrl: '/pagos/PAY-001',
      createdAt: new Date('2025-10-22T14:30:00'),
    },
    {
      id: 'NOTIF-003',
      userId: 'admin-001',
      type: NotificationType.SYSTEM_UPDATE,
      title: 'Actualización del Sistema',
      message: 'Nueva versión disponible con mejoras de rendimiento',
      icon: 'ri-information-fill',
      color: '#3abff8',
      isRead: true,
      actionUrl: '/configuracion/actualizaciones',
      createdAt: new Date('2025-10-20T10:00:00'),
      readAt: new Date('2025-10-20T11:30:00'),
    },
    {
      id: 'NOTIF-004',
      userId: 'admin-001',
      condominiumId: '3',
      type: NotificationType.MAINTENANCE_REQUEST,
      title: 'Solicitud de Mantenimiento',
      message: 'Nueva solicitud en Sunset Boulevard - Unidad 405',
      icon: 'ri-tools-fill',
      color: '#fbbd23',
      isRead: false,
      actionUrl: '/mantenimiento/requests/REQ-089',
      metadata: { unitId: 'U-405', priority: 'high' },
      createdAt: new Date('2025-10-21T16:45:00'),
    },
    {
      id: 'NOTIF-005',
      userId: 'admin-001',
      condominiumId: '1',
      type: NotificationType.INVOICE_GENERATED,
      title: 'Facturas Generadas',
      message: '156 facturas generadas para Torres del Parque - Octubre 2025',
      icon: 'ri-file-list-3-fill',
      color: '#8b5cf6',
      isRead: true,
      actionUrl: '/facturas?period=2025-10&condo=1',
      createdAt: new Date('2025-10-01T09:00:00'),
      readAt: new Date('2025-10-01T09:15:00'),
    },
  ];

  /**
   * GET /notifications/user/:userId - Fetch user notifications from backend
   * Lambda: getUserNotifications
   */
  getUserNotifications(
    userId: string,
    unreadOnly = false
  ): Observable<ApiResponse<Notification[]>> {
    let httpParams = new HttpParams();
    if (unreadOnly) {
      httpParams = httpParams.set('unreadOnly', 'true');
    }

    return this.http.get<ApiResponse<Notification[]>>(`${this.apiUrl}/user/${userId}`, { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Error fetching notifications from backend, using mock data:', error);
        // Fallback a mock data
        let notifications = this.mockNotifications.filter(
          (n) => n.userId === userId
        );

        if (unreadOnly) {
          notifications = notifications.filter((n) => !n.isRead);
        }

        notifications.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );

        return of({
          success: true,
          data: notifications,
          message: 'Notificaciones obtenidas exitosamente (mock fallback)',
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /notifications/user/:userId/count - Fetch unread notifications count via backend
   * Lambda: getUnreadCount
   */
  getUnreadCount(userId: string): Observable<ApiResponse<number>> {
    return this.http
      .get<ApiResponse<number>>(`${this.apiUrl}/user/${userId}/count`)
      .pipe(
        catchError((error) => {
          console.error(`Error fetching unread count for user ${userId} from backend, using mock:`, error);
          // Fallback a mock
          const count = this.mockNotifications.filter(
            (n) => n.userId === userId && !n.isRead
          ).length;
          return of({
            success: true,
            data: count,
            message: 'Contador obtenido exitosamente (mock fallback)',
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * PUT /notifications/:id/read - Mark notification as read via backend
   * Lambda: markAsRead
   */
  markAsRead(notificationId: string): Observable<ApiResponse<Notification>> {
    return this.http.put<ApiResponse<Notification>>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      catchError((error) => {
        console.error(`Error marking notification ${notificationId} as read, using mock:`, error);
        // Fallback a mock
        const notification = this.mockNotifications.find(
          (n) => n.id === notificationId
        );

        if (!notification) {
          return of({
            success: false,
            error: {
              code: 'NOTIFICATION_NOT_FOUND',
              message: 'Notificación no encontrada',
            },
            timestamp: new Date(),
          });
        }

        notification.isRead = true;
        notification.readAt = new Date();

        return of({
          success: true,
          data: notification,
          message: 'Notificación marcada como leída (mock fallback)',
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * PUT /notifications/user/:userId/read-all - Mark all notifications as read via backend
   * Lambda: markAllAsRead
   */
  markAllAsRead(userId: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/user/${userId}/read-all`, {}).pipe(
      catchError((error) => {
        console.error(`Error marking all notifications as read for user ${userId}, using mock:`, error);
        // Fallback a mock
        this.mockNotifications
          .filter((n) => n.userId === userId && !n.isRead)
          .forEach((n) => {
            n.isRead = true;
            n.readAt = new Date();
          });

        return of({
          success: true,
          message: 'Todas las notificaciones marcadas como leídas (mock fallback)',
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * POST /notifications - Send notification via backend
   * Lambda: sendNotification
   */
  sendNotification(
    notification: Partial<Notification>
  ): Observable<ApiResponse<Notification>> {
    return this.http.post<ApiResponse<Notification>>(this.apiUrl, notification).pipe(
      catchError((error) => {
        console.error('Error sending notification in backend, using mock:', error);
        // Fallback a mock
        const newNotification: Notification = {
          id: `NOTIF-${String(Date.now()).slice(-6)}`,
          userId: notification.userId!,
          condominiumId: notification.condominiumId,
          type: notification.type!,
          title: notification.title!,
          message: notification.message!,
          icon: notification.icon || 'ri-notification-3-fill',
          color: notification.color || '#0ea5e9',
          isRead: false,
          actionUrl: notification.actionUrl,
          metadata: notification.metadata,
          createdAt: new Date(),
        };

        this.mockNotifications.push(newNotification);

        return of({
          success: true,
          data: newNotification,
          message: 'Notificación enviada exitosamente (mock fallback)',
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * DELETE /notifications/:id - Delete notification via backend
   * Lambda: deleteNotification
   */
  deleteNotification(notificationId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${notificationId}`).pipe(
      catchError((error) => {
        console.error(`Error deleting notification ${notificationId}, using mock:`, error);
        // Fallback a mock
        const index = this.mockNotifications.findIndex(
          (n) => n.id === notificationId
        );

        if (index === -1) {
          return of({
            success: false,
            error: {
              code: 'NOTIFICATION_NOT_FOUND',
              message: 'Notificación no encontrada',
            },
            timestamp: new Date(),
          });
        }

        this.mockNotifications.splice(index, 1);

        return of({
          success: true,
          message: 'Notificación eliminada exitosamente (mock fallback)',
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /notifications/settings/:userId - Fetch notification settings from backend
   * Lambda: getNotificationSettings
   */
  getNotificationSettings(
    userId: string
  ): Observable<ApiResponse<NotificationSettings>> {
    return this.http.get<ApiResponse<NotificationSettings>>(`${this.apiUrl}/settings/${userId}`).pipe(
      catchError((error) => {
        console.error(`Error fetching notification settings for user ${userId}, using mock:`, error);
        // Fallback a mock
        const settings: NotificationSettings = {
          userId,
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          paymentReminders: true,
          maintenanceAlerts: true,
          systemUpdates: true,
        };

        return of({
          success: true,
          data: settings,
          message: 'Configuración obtenida exitosamente (mock fallback)',
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * PUT /notifications/settings/:userId - Update notification settings via backend
   * Lambda: updateNotificationSettings
   */
  updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Observable<ApiResponse<NotificationSettings>> {
    return this.http.put<ApiResponse<NotificationSettings>>(`${this.apiUrl}/settings/${userId}`, settings).pipe(
      catchError((error) => {
        console.error(`Error updating notification settings for user ${userId}, using mock:`, error);
        // Fallback a mock
        const updated: NotificationSettings = {
          userId,
          emailNotifications: settings.emailNotifications ?? true,
          smsNotifications: settings.smsNotifications ?? false,
          pushNotifications: settings.pushNotifications ?? true,
          paymentReminders: settings.paymentReminders ?? true,
          maintenanceAlerts: settings.maintenanceAlerts ?? true,
          systemUpdates: settings.systemUpdates ?? true,
        };

        return of({
          success: true,
          data: updated,
          message: 'Configuración actualizada exitosamente (mock fallback)',
          timestamp: new Date(),
        });
      })
    );
  }
}

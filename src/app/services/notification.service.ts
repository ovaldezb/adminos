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
        console.error('Error fetching notifications from backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener las notificaciones del servidor',
          },
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
          console.error(`Error fetching unread count for user ${userId} from backend:`, error);
          return of({
            success: false,
            error: {
              code: 'BACKEND_ERROR',
              message: 'Error al obtener el contador de notificaciones no leídas',
            },
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
        console.error(`Error marking notification ${notificationId} as read:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al marcar la notificación como leída',
          },
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
        console.error(`Error marking all notifications as read for user ${userId}:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al marcar todas las notificaciones como leídas',
          },
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
        console.error('Error sending notification in backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al enviar la notificación en el servidor',
          },
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
        console.error(`Error deleting notification ${notificationId}:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al eliminar la notificación',
          },
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
        console.error(`Error fetching notification settings for user ${userId}:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener la configuración de notificaciones del servidor',
          },
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
        console.error(`Error updating notification settings for user ${userId}:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al actualizar la configuración de notificaciones en el servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }
}

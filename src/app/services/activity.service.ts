import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, catchError } from 'rxjs';
import { Activity, ActivityWithDetails, ActivityType } from '../models/activity.model';
import { ApiResponse, PaginationParams, PaginatedResponse } from '../models/api.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/activities`;

  // Mock data
  private mockActivities: ActivityWithDetails[] = [
    {
      id: 'ACT-001',
      condominiumId: '1',
      condominiumName: 'Torres del Parque',
      type: ActivityType.PAYMENT_RECEIVED,
      title: 'Pago recibido',
      description: 'Juan Pérez - Unidad 101',
      entityType: 'payment' as any,
      entityId: 'PAY-002',
      userId: 'admin-001',
      userName: 'Admin Principal',
      icon: 'ri-money-dollar-circle-fill',
      color: '#10b981',
      amount: 'S/. 1,500.00',
      timeAgo: 'Hace 2 horas',
      createdAt: new Date('2025-10-22T14:30:00'),
    },
    {
      id: 'ACT-002',
      condominiumId: '1',
      condominiumName: 'Torres del Parque',
      type: ActivityType.REMINDER_SENT,
      title: 'Recordatorio enviado',
      description: 'María García - Unidad 102',
      entityType: 'invoice' as any,
      entityId: 'INV-002',
      userId: 'admin-001',
      userName: 'Admin Principal',
      icon: 'ri-mail-send-fill',
      color: '#f59e0b',
      timeAgo: 'Hace 4 horas',
      createdAt: new Date('2025-10-22T12:30:00'),
    },
    {
      id: 'ACT-003',
      condominiumId: '2',
      condominiumName: 'Vista Hermosa',
      type: ActivityType.INVOICE_GENERATED,
      title: 'Factura generada',
      description: 'Factura mensual - Octubre 2025',
      entityType: 'invoice' as any,
      entityId: 'INV-045',
      userId: 'system',
      userName: 'Sistema',
      icon: 'ri-file-text-fill',
      color: '#0ea5e9',
      timeAgo: 'Hace 1 día',
      createdAt: new Date('2025-10-21T09:00:00'),
    },
    {
      id: 'ACT-004',
      condominiumId: '3',
      condominiumName: 'Sunset Boulevard',
      type: ActivityType.RESIDENT_ADDED,
      title: 'Nuevo residente',
      description: 'Ana Martínez - Unidad 305',
      entityType: 'resident' as any,
      entityId: 'R-125',
      userId: 'admin-002',
      userName: 'Gerente Operaciones',
      icon: 'ri-user-add-fill',
      color: '#8b5cf6',
      timeAgo: 'Hace 2 días',
      createdAt: new Date('2025-10-20T15:45:00'),
    },
    {
      id: 'ACT-005',
      condominiumId: '1',
      condominiumName: 'Torres del Parque',
      type: ActivityType.MAINTENANCE_SCHEDULED,
      title: 'Mantenimiento programado',
      description: 'Limpieza de tanques de agua',
      entityType: 'maintenance' as any,
      entityId: 'MAINT-089',
      userId: 'admin-001',
      userName: 'Admin Principal',
      icon: 'ri-tools-fill',
      color: '#6366f1',
      timeAgo: 'Hace 3 días',
      createdAt: new Date('2025-10-19T11:20:00'),
    },
    {
      id: 'ACT-006',
      condominiumId: '2',
      condominiumName: 'Vista Hermosa',
      type: ActivityType.PAYMENT_RECEIVED,
      title: 'Pago recibido',
      description: 'Carlos Rodríguez - Unidad 201',
      entityType: 'payment' as any,
      entityId: 'PAY-001',
      userId: 'admin-001',
      userName: 'Admin Principal',
      icon: 'ri-money-dollar-circle-fill',
      color: '#10b981',
      amount: 'S/. 1,800.00',
      timeAgo: 'Hace 19 días',
      createdAt: new Date('2025-10-03T10:15:00'),
    },
  ];

  /**
   * GET /activities/recent - Fetch recent activities from backend
   * Lambda: getRecentActivities
   */
  getRecentActivities(
    condominiumId?: string,
    limit = 10
  ): Observable<ApiResponse<ActivityWithDetails[]>> {
    let httpParams = new HttpParams().set('limit', limit.toString());
    
    if (condominiumId && condominiumId !== 'all') {
      httpParams = httpParams.set('condominiumId', condominiumId);
    }

    return this.http.get<ApiResponse<ActivityWithDetails[]>>(`${this.apiUrl}/recent`, { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Error fetching activities from backend, using mock data:', error);
        // Fallback a mock data
        let activities = [...this.mockActivities];

        if (condominiumId && condominiumId !== 'all') {
          activities = activities.filter((a) => a.condominiumId === condominiumId);
        }

        activities = activities
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit);

        return of({
          success: true,
          data: activities,
          message: 'Actividades recientes obtenidas exitosamente (mock fallback)',
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /activities - Fetch paginated activities from backend
   * Lambda: getActivities
   */
  getActivities(
    params?: PaginationParams & { condominiumId?: string; type?: ActivityType }
  ): Observable<ApiResponse<PaginatedResponse<ActivityWithDetails>>> {
    let httpParams = new HttpParams()
      .set('page', (params?.page || 1).toString())
      .set('pageSize', (params?.pageSize || 20).toString());

    if (params?.condominiumId && params.condominiumId !== 'all') {
      httpParams = httpParams.set('condominiumId', params.condominiumId);
    }

    if (params?.type) {
      httpParams = httpParams.set('type', params.type);
    }

    return this.http.get<ApiResponse<PaginatedResponse<ActivityWithDetails>>>(this.apiUrl, { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Error fetching activities from backend, using mock data:', error);
        // Fallback a mock data
        let filtered = [...this.mockActivities];

        // Filter by condominiumId
        if (params?.condominiumId && params.condominiumId !== 'all') {
          filtered = filtered.filter((a) => a.condominiumId === params.condominiumId);
        }

        // Filter by type
        if (params?.type) {
          filtered = filtered.filter((a) => a.type === params.type);
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const page = params?.page || 1;
        const pageSize = params?.pageSize || 20;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const items = filtered.slice(start, end);

        const response: PaginatedResponse<ActivityWithDetails> = {
          items,
          total: filtered.length,
          page,
          pageSize,
          totalPages: Math.ceil(filtered.length / pageSize),
          hasNext: end < filtered.length,
          hasPrevious: page > 1,
        };

        return of({
          success: true,
          data: response,
          message: 'Actividades obtenidas exitosamente (mock fallback)',
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * POST /activities - Log activity via backend
   * Lambda: logActivity
   */
  logActivity(activity: Partial<Activity>): Observable<ApiResponse<Activity>> {
    return this.http.post<ApiResponse<Activity>>(this.apiUrl, activity).pipe(
      catchError((error) => {
        console.error('Error logging activity in backend, using mock:', error);
        // Fallback a mock
        const newActivity: Activity = {
          id: `ACT-${String(Date.now()).slice(-6)}`,
          condominiumId: activity.condominiumId!,
          type: activity.type!,
          title: activity.title!,
          description: activity.description || '',
          entityType: activity.entityType!,
          entityId: activity.entityId!,
          userId: activity.userId || 'system',
          userName: activity.userName || 'Sistema',
          metadata: activity.metadata,
          createdAt: new Date(),
        };

        return of({
          success: true,
          data: newActivity,
          message: 'Actividad registrada exitosamente (mock fallback)',
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /activities/stats - Fetch activity statistics from backend
   * Lambda: getActivityStats
   */
  getActivityStats(
    condominiumId?: string,
    days = 30
  ): Observable<ApiResponse<Record<ActivityType, number>>> {
    let httpParams = new HttpParams().set('days', days.toString());
    
    if (condominiumId && condominiumId !== 'all') {
      httpParams = httpParams.set('condominiumId', condominiumId);
    }

    return this.http.get<ApiResponse<Record<ActivityType, number>>>(`${this.apiUrl}/stats`, { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Error fetching activity stats from backend, using mock:', error);
        // Fallback a mock
        let activities = [...this.mockActivities];

        if (condominiumId && condominiumId !== 'all') {
          activities = activities.filter((a) => a.condominiumId === condominiumId);
        }

        // Filter by date range
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        activities = activities.filter((a) => a.createdAt >= startDate);

        // Count by type
        const stats: Record<string, number> = {};
        activities.forEach((a) => {
          stats[a.type] = (stats[a.type] || 0) + 1;
        });

        return of({
          success: true,
          data: stats as Record<ActivityType, number>,
          message: 'Estadísticas de actividad obtenidas exitosamente (mock fallback)',
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /activities/timeline - Fetch activity timeline from backend
   * Lambda: getActivityTimeline
   */
  getActivityTimeline(
    condominiumId?: string,
    entityType?: string,
    entityId?: string
  ): Observable<ApiResponse<ActivityWithDetails[]>> {
    let httpParams = new HttpParams();
    
    if (condominiumId && condominiumId !== 'all') {
      httpParams = httpParams.set('condominiumId', condominiumId);
    }

    if (entityType) {
      httpParams = httpParams.set('entityType', entityType);
    }

    if (entityId) {
      httpParams = httpParams.set('entityId', entityId);
    }

    return this.http.get<ApiResponse<ActivityWithDetails[]>>(`${this.apiUrl}/timeline`, { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Error fetching activity timeline from backend, using mock:', error);
        // Fallback a mock
        let activities = [...this.mockActivities];

        if (condominiumId && condominiumId !== 'all') {
          activities = activities.filter((a) => a.condominiumId === condominiumId);
        }

        if (entityType) {
          activities = activities.filter((a) => a.entityType === entityType);
        }

        if (entityId) {
          activities = activities.filter((a) => a.entityId === entityId);
        }

        activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return of({
          success: true,
          data: activities,
          message: 'Timeline de actividad obtenido exitosamente (mock fallback)',
          timestamp: new Date(),
        });
      })
    );
  }
}

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Activity, ActivityWithDetails, ActivityType } from '../models/activity.model';
import { ApiResponse, PaginationParams, PaginatedResponse } from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  // Simulated AWS Lambda endpoint
  private readonly lambdaEndpoint = 'https://api.example.com/activities';

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
   * Simulates AWS Lambda GET request to fetch recent activities
   * Lambda: getRecentActivities
   */
  getRecentActivities(
    condominiumId?: string,
    limit = 10
  ): Observable<ApiResponse<ActivityWithDetails[]>> {
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
      message: 'Actividades recientes obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 250));
  }

  /**
   * Simulates AWS Lambda GET request to fetch paginated activities
   * Lambda: getActivities
   */
  getActivities(
    params?: PaginationParams & { condominiumId?: string; type?: ActivityType }
  ): Observable<ApiResponse<PaginatedResponse<ActivityWithDetails>>> {
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
      message: 'Actividades obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda POST request to log activity
   * Lambda: logActivity
   */
  logActivity(activity: Partial<Activity>): Observable<ApiResponse<Activity>> {
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
      message: 'Actividad registrada exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 300 + 200));
  }

  /**
   * Simulates AWS Lambda GET request to fetch activity statistics
   * Lambda: getActivityStats
   */
  getActivityStats(
    condominiumId?: string,
    days = 30
  ): Observable<ApiResponse<Record<ActivityType, number>>> {
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
      message: 'Estadísticas de actividad obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch activity timeline
   * Lambda: getActivityTimeline
   */
  getActivityTimeline(
    condominiumId?: string,
    entityType?: string,
    entityId?: string
  ): Observable<ApiResponse<ActivityWithDetails[]>> {
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
      message: 'Timeline de actividad obtenido exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }
}

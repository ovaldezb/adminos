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
        console.error('Error fetching activities from backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener las actividades del servidor',
          },
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
        console.error('Error fetching activities from backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener las actividades del servidor',
          },
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
        console.error('Error logging activity in backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al registrar la actividad en el servidor',
          },
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
        console.error('Error fetching activity stats from backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener las estadísticas de actividades del servidor',
          },
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
        console.error('Error fetching activity timeline from backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener la cronología de actividades del servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }
}

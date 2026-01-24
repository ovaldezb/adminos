import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import {
  BuildingDetails,
  BuildingType,
  BuildingStatus,
  CreateBuildingDto,
  UpdateBuildingDto,
  BuildingStatistics,
  ApiResponse,
  PaginatedResponse
} from '../models';
import { environment } from '../../environments/environment';

export interface GetBuildingsParams {
  page?: number;
  pageSize?: number;
  condominiumId?: string;
  search?: string;
  type?: BuildingType;
  status?: BuildingStatus;
}

@Injectable({
  providedIn: 'root'
})
export class BuildingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/building`;

  constructor() { }

  // Get all buildings - SIMPLE VERSION (sin paginación por ahora)
  // Backend: GET /buildings - Returns { success, message, data: { buildings: [], count } }
  getBuildings(params: GetBuildingsParams = {}): Observable<ApiResponse<PaginatedResponse<BuildingDetails>>> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('pageSize', (params.pageSize || 10).toString());

    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.status) httpParams = httpParams.set('status', params.status);

    let url = this.apiUrl;
    if (params.condominiumId && params.condominiumId !== 'all') {
      url += '/' + params.condominiumId;
    }

    return this.http.get<any>(url, { params: httpParams }).pipe(
      map(response => {
        const rawBuildings = response.data?.buildings || [];
        const total = response.data?.count || 0;
        const page = response.data?.page || params.page || 1;
        const pageSize = response.data?.pageSize || params.pageSize || 10;
        const totalPages = response.data?.totalPages || Math.ceil(total / pageSize);

        const buildings = rawBuildings.map((building: any) => ({
          ...building,
          id: building.id || building._id,
          _id: building._id
        }));

        const paginatedResponse: ApiResponse<PaginatedResponse<BuildingDetails>> = {
          success: response.success,
          message: response.message,
          data: {
            items: buildings,
            total: total,
            page: page,
            pageSize: pageSize,
            totalPages: totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1
          },
          timestamp: response.timestamp || new Date()
        };

        return paginatedResponse;
      }),
      catchError((error) => {
        console.error('❌ Building Service - Error:', error);
        return throwError(() => error);
      })
    );
  }

  // GET /buildings/:id - Get building by ID from backend
  getBuildingById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching building ${id} from backend:`, error);
        return throwError(() => error);
      })
    );
  }

  // POST /buildings - Create new building via backend
  createBuilding(dto: CreateBuildingDto): Observable<ApiResponse<BuildingDetails>> {
    return this.http.post<ApiResponse<BuildingDetails>>(`${this.apiUrl}`, dto).pipe(
      catchError((error) => {
        console.error('Error creating building in backend:', error);
        return throwError(() => error);
      })
    );
  }

  // PUT /buildings/:id - Update building via backend
  updateBuilding(id: string, dto: UpdateBuildingDto): Observable<ApiResponse<BuildingDetails>> {
    return this.http.put<ApiResponse<BuildingDetails>>(`${this.apiUrl}/${id}`, dto).pipe(
      catchError((error) => {
        console.error(`Error updating building ${id} in backend:`, error);
        return throwError(() => error);
      })
    );
  }

  // DELETE /buildings/:id - Delete building (soft delete) via backend
  deleteBuilding(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting building ${id} in backend:`, error);
        return throwError(() => error);
      })
    );
  }

  // Get building statistics from backend
  getBuildingStatistics(condominiumId?: string): Observable<ApiResponse<BuildingStatistics>> {
    let httpParams = new HttpParams();

    if (condominiumId && condominiumId !== 'all') {
      httpParams = httpParams.set('condominiumId', condominiumId);
    }

    return this.http.get<ApiResponse<BuildingStatistics>>(`${this.apiUrl}/statistics`, { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Error fetching building statistics from backend:', error);
        return throwError(() => error);
      })
    );
  }

  // Get building aggregated report from backend
  // Backend: GET /reports?buildingId=xxx&year=2024
  getBuildingReport(buildingId: string, year: number): Observable<ApiResponse<any>> {
    const httpParams = new HttpParams()
      .set('buildingId', buildingId)
      .set('year', year.toString());

    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/reports`, { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Error fetching building report from backend:', error);
        return throwError(() => error);
      })
    );
  }
}

import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, catchError, map, throwError } from 'rxjs';
import { 
  Building, 
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

  constructor() {}

  // Get all buildings - SIMPLE VERSION (sin paginación por ahora)
  // Backend: GET /buildings - Returns { success, message, data: { buildings: [], count } }
  getBuildings(params: GetBuildingsParams = {}): Observable<ApiResponse<PaginatedResponse<BuildingDetails>>> {
    console.log('🔍 Building Service - Calling GET /building (sin parámetros)');

    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        console.log('✅ Building Service - Raw response:', response);
        
        // La Lambda retorna { success, message, data: { buildings: [], count } }
        // Necesitamos transformarlo a formato PaginatedResponse
        const buildings = response.data?.buildings || [];
        const total = response.data?.count || 0;
        
        const paginatedResponse: ApiResponse<PaginatedResponse<BuildingDetails>> = {
          success: response.success,
          message: response.message,
          data: {
            items: buildings,
            total: total,
            page: 1,
            pageSize: total,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false
          },
          timestamp: response.timestamp || new Date()
        };
        
        console.log('✅ Transformed response:', paginatedResponse);
        return paginatedResponse;
      }),
      catchError((error) => {
        console.error('❌ Building Service - Error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url
        });
        
        // Si es error 500, probablemente el backend tiene un problema
        if (error.status === 500) {
          console.error('⚠️ Backend error 500 - Posibles causas:');
          console.error('  1. Error en Lambda function');
          console.error('  2. Error en DynamoDB query');
          console.error('  3. Parámetros inválidos');
          console.error('  4. Permisos IAM insuficientes');
        }
        
        // Re-throw el error para que el componente lo maneje
        return throwError(() => error);
      })
    );
  }

  // GET /buildings/:id - Get building by ID from backend
  // Backend: GET /buildings/{id} - Returns { success, message, data: building }
  getBuildingById(id: string): Observable<ApiResponse<BuildingDetails>> {
    return this.http.get<ApiResponse<BuildingDetails>>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching building ${id} from backend:`, error);
        return throwError(() => error);
      })
    );
  }

  // POST /condominiums/:condominiumId/buildings - Create new building via backend
  // Backend: POST /condominiums/{condominiumId}/buildings - Returns created building with _id
  createBuilding(dto: CreateBuildingDto): Observable<ApiResponse<BuildingDetails>> {
    return this.http.post<ApiResponse<BuildingDetails>>(`${this.apiUrl}`, dto).pipe(
      catchError((error) => {
        console.error('Error creating building in backend:', error);
        return throwError(() => error);
      })
    );
  }

  // PUT /buildings/:id - Update building via backend
  // Backend: PUT /buildings/{id} - Returns { success, message, data: updated building }
  updateBuilding(id: string, dto: UpdateBuildingDto): Observable<ApiResponse<BuildingDetails>> {
    return this.http.put<ApiResponse<BuildingDetails>>(`${this.apiUrl}/${id}`, dto).pipe(
      catchError((error) => {
        console.error(`Error updating building ${id} in backend:`, error);
        return throwError(() => error);
      })
    );
  }

  // DELETE /buildings/:id - Delete building (soft delete) via backend
  // Backend: DELETE /buildings/{id} - Returns { success, message, data: {} }
  deleteBuilding(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting building ${id} in backend:`, error);
        return throwError(() => error);
      })
    );
  }

  // Get building statistics from backend
  // Backend: GET /buildings/statistics?condominiumId=xxx
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
}

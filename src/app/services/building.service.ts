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

  // Get all buildings with pagination and filters
  // Backend: GET /buildings - Returns { success, message, data: { buildings: [], count } }
  // GET /buildings - Fetch buildings from backend
  // Backend: GET /buildings?condominiumId=xxx&page=1&pageSize=10&search=xxx&type=xxx&status=xxx
  getBuildings(params: GetBuildingsParams = {}): Observable<ApiResponse<PaginatedResponse<BuildingDetails>>> {
    const {
      page = 1,
      pageSize = 10,
      condominiumId,
      search,
      type,
      status
    } = params;

    // Validar parámetros antes de enviar
    if (page < 1) {
      console.warn('⚠️ Invalid page number:', page, '- Setting to 1');
    }
    if (pageSize < 1 || pageSize > 100) {
      console.warn('⚠️ Invalid pageSize:', pageSize, '- Setting to 10');
    }
    if (condominiumId) {
      console.log('🏢 CondominiumId received:', {
        value: condominiumId,
        type: typeof condominiumId,
        length: condominiumId.length,
        isValid: /^[a-zA-Z0-9_-]+$/.test(condominiumId)
      });
    }

    // Construir HttpParams para la petición
    let httpParams = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    // Validar y agregar condominiumId solo si es válido
    if (condominiumId && condominiumId !== 'all' && condominiumId.trim() !== '') {
      httpParams = httpParams.set('condominiumId', condominiumId.trim());
    }

    if (search) {
      httpParams = httpParams.set('search', search);
    }

    if (type) {
      httpParams = httpParams.set('type', type);
    }

    if (status) {
      httpParams = httpParams.set('status', status);
    }

    console.log('🔍 Building Service - Request:', {
      url: this.apiUrl,
      params: httpParams.toString(),
      fullUrl: `${this.apiUrl}?${httpParams.toString()}`
    });

    return this.http.get<ApiResponse<PaginatedResponse<BuildingDetails>>>(this.apiUrl, { params: httpParams }).pipe(
      map(response => {
        console.log('✅ Building Service - Success:', response);
        return response;
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

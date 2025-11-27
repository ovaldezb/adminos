import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, catchError, map } from 'rxjs';
import { 
  Resident, 
  ResidentDetails, 
  ResidentType, 
  DocumentType,
  CreateResidentDto,
  UpdateResidentDto,
  UnitResidents
} from '../models/resident.model';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ResidentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/residents`;

  /**
   * Simulates AWS Lambda GET request to fetch all residents
   * Backend: GET /residents - Returns { success, message, data: { residents: [], count } }
   * Supports filters: ?unitId=xxx&type=xxx&documentNumber=xxx
   */
  // GET /residents - Fetch residents from backend
  // Backend: GET /residents?page=1&pageSize=10&condominiumId=xxx&type=xxx&search=xxx
  getResidents(
    params?: PaginationParams & { condominiumId?: string; type?: ResidentType; search?: string }
  ): Observable<ApiResponse<PaginatedResponse<ResidentDetails>>> {
    let httpParams = new HttpParams()
      .set('page', (params?.page || 1).toString())
      .set('pageSize', (params?.pageSize || 10).toString());

    if (params?.condominiumId && params.condominiumId !== 'all') {
      httpParams = httpParams.set('condominiumId', params.condominiumId);
    }

    if (params?.type) {
      httpParams = httpParams.set('type', params.type);
    }

    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<ApiResponse<PaginatedResponse<ResidentDetails>>>(this.apiUrl, { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Error fetching residents from backend:', error);
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Error al cargar residentes' },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /residents/by-unit/:unitId - Get residents by unit ID from backend
   */
  getResidentsByUnit(unitId: string): Observable<ApiResponse<UnitResidents>> {
    return this.http.get<ApiResponse<UnitResidents>>(`${this.apiUrl}/by-unit/${unitId}`).pipe(
      catchError((error) => {
        console.error(`Error fetching residents for unit ${unitId} from backend:`, error);
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Error al cargar residentes de la unidad' },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * POST /units/:unitId/residents - Create new resident via backend
   * Backend: POST /units/{unitId}/residents - Returns { success, message, data: created resident }
   * Adds resident to Unit's residentsId array automatically
   */
  createResident(residentData: CreateResidentDto): Observable<ApiResponse<Resident>> {
    return this.http.post<ApiResponse<Resident>>(`${this.apiUrl}`, residentData).pipe(
      catchError((error) => {
        console.error('Error creating resident in backend:', error);
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Error al crear el residente' },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * PUT /residents/:id - Update resident via backend
   * Backend: PUT /residents/{id} - Returns { success, message, data: updated resident }
   */
  updateResident(id: string, updates: UpdateResidentDto): Observable<ApiResponse<ResidentDetails>> {
    return this.http.put<ApiResponse<ResidentDetails>>(`${this.apiUrl}/${id}`, updates).pipe(
      catchError((error) => {
        console.error(`Error updating resident ${id} in backend:`, error);
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Error al actualizar el residente' },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * PATCH /residents/:id/deactivate - Deactivate resident via backend
   */
  deactivateResident(id: string): Observable<ApiResponse<void>> {
    return this.http
      .patch<ApiResponse<void>>(`${this.apiUrl}/${id}/deactivate`, {})
      .pipe(
        catchError((error) => {
          console.error(`Error deactivating resident ${id} in backend:`, error);
          return of({
            success: false,
            error: { code: 'BACKEND_ERROR', message: 'Error al desactivar el residente' },
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * DELETE /residents/:id - Delete resident (hard delete) via backend
   * Backend: DELETE /residents/{id} - Returns { success, message, data: {} }
   * Also removes resident from unit's residentsId array
   */
  deleteResident(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting resident ${id} in backend:`, error);
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Error al eliminar el residente' },
          timestamp: new Date(),
        });
      })
    );
  }
}
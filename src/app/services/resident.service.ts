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
  private readonly apiUrl = `${environment.apiUrl}/resident`; // Cambiar a /resident para coincidir con las lambdas

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

    // Backend responde con formato: { success, message, data: { residents: [], count } }
    interface BackendResidentsResponse {
      residents: any[];
      count: number;
    }

    return this.http.get<ApiResponse<BackendResidentsResponse>>(this.apiUrl, { params: httpParams }).pipe(
      map((response) => {
        console.log('[ResidentService] Raw backend response:', response);

        if (!response.success || !response.data) {
          return {
            success: false,
            error: { code: 'NO_DATA', message: 'No se recibieron datos del backend' },
            timestamp: new Date(),
          } as ApiResponse<PaginatedResponse<ResidentDetails>>;
        }

        const backendData = response.data;
        const residents = backendData.residents || [];
        const count = backendData.count || 0;
        const pageSize = params?.pageSize || 10;
        const currentPage = params?.page || 1;
        const totalPages = Math.ceil(count / pageSize);

        // Map backend residents to ResidentDetails
        const mappedResidents: ResidentDetails[] = residents.map((resident: any) => ({
          ...resident,
          id: resident._id || resident.id,
          isActive: resident.status !== 'INACTIVE',
          totalDebt: resident.debt || 0,
          createdAt: resident.createdAt ? new Date(resident.createdAt) : new Date(),
          updatedAt: resident.updatedAt ? new Date(resident.updatedAt) : new Date(),
        }));

        return {
          success: true,
          data: {
            items: mappedResidents,
            total: count,
            page: currentPage,
            pageSize: pageSize,
            totalPages: totalPages,
          },
          timestamp: new Date(),
        } as ApiResponse<PaginatedResponse<ResidentDetails>>;
      }),
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
    // Usar query parameter según la lambda: GET /resident?unitId=xxx
    const params = new HttpParams().set('unitId', unitId);
    return this.http.get<ApiResponse<UnitResidents>>(this.apiUrl, { params }).pipe(
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
  searchResidents(term: string): Observable<ApiResponse<{ residents: ResidentDetails[]; count: number }>> {
    const params = new HttpParams().set('name', term);
    return this.http.get<ApiResponse<any>>(this.apiUrl, { params }).pipe(
      map((response) => {
        if (!response.success || !response.data) {
          return {
            success: false,
            error: { code: 'NO_DATA', message: 'No se encontraron residentes' },
            timestamp: new Date(),
          } as ApiResponse<{ residents: ResidentDetails[]; count: number }>;
        }

        const residents = (response.data.residents || []).map((r: any) => ({
          ...r,
          id: r._id || r.id,
          isActive: r.status !== 'INACTIVE',
          totalDebt: r.debt || 0,
        }));

        return {
          success: true,
          data: {
            residents,
            count: residents.length
          },
          timestamp: new Date()
        } as ApiResponse<{ residents: ResidentDetails[]; count: number }>;
      }),
      catchError((error) => {
        console.error('Error searching residents:', error);
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Error al buscar residentes' },
          timestamp: new Date(),
        });
      })
    );
  }
}
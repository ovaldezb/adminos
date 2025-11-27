import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, throwError, catchError, map } from 'rxjs';
import {
  Condominium,
  CondominiumStats,
  CondominiumDetails,
  CreateCondominiumDto,
  UpdateCondominiumDto,
  CondominiumType,
  Tower,
  PrivateStreet,
  Amenity,
  AmenityType
} from '../models/condominium.model';
import { ApiResponse } from '../models/api.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CondominiumService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  
  // Signal para el condominio seleccionado globalmente
  public readonly selectedCondominium = signal<Condominium | null>(null);

  /**
   * GET /condominium - Fetch all condominiums from backend
   * Backend: GET /condominium - Returns { success, message, data: [condominiums with buildings] }
   */
  getAllCondominiums(): Observable<ApiResponse<Condominium[]>> {
    return this.http.get<ApiResponse<Condominium[]>>(`${this.baseUrl}/condominium`).pipe(
      catchError((error) => {
        console.error('Error fetching condominiums from backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener los condominios del servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /condominiums/:id - Fetch single condominium from backend
   * Lambda: getCondominiumById
   */
  getCondominiumById(id: string): Observable<ApiResponse<Condominium>> {
    return this.http.get<ApiResponse<Condominium>>(`${this.baseUrl}/condominium/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching condominium ${id} from backend:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener el condominio del servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /condominiums/:id/details - Fetch condominium details from backend
   * Lambda: getCondominiumDetails
   */
  getCondominiumDetails(
    id: string
  ): Observable<ApiResponse<CondominiumDetails>> {
    return this.http.get<ApiResponse<CondominiumDetails>>(`${this.baseUrl}/condominium/${id}/details`).pipe(
      catchError((error) => {
        console.error(`Error fetching condominium details for ${id}:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener los detalles del condominio del servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /condominiums/:id/stats - Fetch condominium statistics from backend
   * Lambda: getCondominiumStats
   */
  getCondominiumStats(
    id: string
  ): Observable<ApiResponse<CondominiumStats>> {
    return this.http.get<ApiResponse<CondominiumStats>>(`${this.baseUrl}/condominium/${id}/stats`).pipe(
      catchError((error) => {
        console.error(`Error fetching stats for condominium ${id}:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener las estadísticas del condominio del servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /condominiums/stats/all - Fetch aggregated stats for all condominiums
   * Lambda: getAllCondominiumsStats
   */
  getAllCondominiumsStats(): Observable<ApiResponse<CondominiumStats>> {
    return this.http.get<ApiResponse<CondominiumStats>>(`${this.baseUrl}/condominium/stats/all`).pipe(
      catchError((error) => {
        console.error('Error fetching global stats:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener las estadísticas globales del servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * POST /condominiums - Create new condominium via backend
   * Backend: POST /condominiums - Returns { success, message, data: created condominium with _id }
   */
  createCondominium(
    condominiumDto: CreateCondominiumDto
  ): Observable<ApiResponse<Condominium>> {
    return this.http.post<ApiResponse<Condominium>>(`${this.baseUrl}/condominium`, condominiumDto).pipe(
      catchError((error) => {
        console.error('Error creating condominium in backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al crear el condominio en el servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * PUT /condominiums/:id - Update condominium via backend
   * Backend: PUT /condominiums/{id} - Returns { success, message, data: updated condominium }
   */
  updateCondominium(
    id: string,
    updates: UpdateCondominiumDto
  ): Observable<ApiResponse<Condominium>> {
    return this.http.put<ApiResponse<Condominium>>(`${this.baseUrl}/condominium/${id}`, updates).pipe(
      catchError((error) => {
        console.error(`Error updating condominium ${id} in backend:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al actualizar el condominio en el servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  // Método para establecer el condominio seleccionado globalmente
  setSelectedCondominium(condominium: Condominium | null): void {
    this.selectedCondominium.set(condominium);
  }

  /**
   * DELETE /condominiums/:id - Delete condominium (soft delete) via backend
   * Backend: DELETE /condominiums/{id} - Sets status to INACTIVE - Returns { success, message }
   */
  deleteCondominium(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/condominium/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting condominium ${id} in backend:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al eliminar el condominio en el servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }
}

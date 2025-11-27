import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, catchError, map } from 'rxjs';
import { 
  Provider, 
  ProviderDetails, 
  ProviderCategory,
  CreateProviderDto,
  UpdateProviderDto,
  ProviderStatistics
} from '../models/provider.model';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/providers`;

  /**
   * GET /providers - Fetch all providers via backend
   * Lambda: getProviders
   */
  getProviders(
    params?: PaginationParams & { category?: ProviderCategory; isActive?: boolean; search?: string }
  ): Observable<ApiResponse<PaginatedResponse<ProviderDetails>>> {
    let httpParams = new HttpParams()
      .set('page', String(params?.page || 1))
      .set('pageSize', String(params?.pageSize || 10));
    
    if (params?.category) {
      httpParams = httpParams.set('category', params.category);
    }
    if (params?.isActive !== undefined) {
      httpParams = httpParams.set('isActive', String(params.isActive));
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<ApiResponse<PaginatedResponse<ProviderDetails>>>(this.apiUrl, { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Error fetching providers from backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener los proveedores del servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /providers/:id - Fetch single provider via backend
   * Lambda: getProviderById
   */
  getProviderById(id: string): Observable<ApiResponse<ProviderDetails>> {
    return this.http.get<ApiResponse<ProviderDetails>>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching provider ${id} from backend:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener el proveedor del servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * POST /providers - Create provider via backend
   * Lambda: createProvider
   */
  createProvider(providerData: CreateProviderDto): Observable<ApiResponse<Provider>> {
    return this.http.post<ApiResponse<Provider>>(this.apiUrl, providerData).pipe(
      catchError((error) => {
        console.error('Error creating provider in backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al crear el proveedor en el servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * PUT /providers/:id - Update provider via backend
   * Lambda: updateProvider
   */
  updateProvider(
    id: string,
    updates: UpdateProviderDto
  ): Observable<ApiResponse<ProviderDetails>> {
    return this.http.put<ApiResponse<ProviderDetails>>(`${this.apiUrl}/${id}`, updates).pipe(
      catchError((error) => {
        console.error(`Error updating provider ${id} in backend:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al actualizar el proveedor en el servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * PATCH /providers/:id/deactivate - Deactivate provider via backend
   * Lambda: deactivateProvider
   */
  deactivateProvider(id: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${id}/deactivate`, {}).pipe(
      catchError((error) => {
        console.error(`Error deactivating provider ${id} in backend:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al desactivar el proveedor en el servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * PATCH /providers/:id/activate - Activate provider via backend
   * Lambda: activateProvider
   */
  activateProvider(id: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.apiUrl}/${id}/activate`, {}).pipe(
      catchError((error) => {
        console.error(`Error activating provider ${id} in backend:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al activar el proveedor en el servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /providers/stats - Fetch provider statistics via backend
   * Lambda: getProviderStats
   */
  getProviderStats(): Observable<ApiResponse<ProviderStatistics>> {
    return this.http.get<ApiResponse<ProviderStatistics>>(`${this.apiUrl}/stats`).pipe(
      catchError((error) => {
        console.error('Error fetching provider statistics from backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener las estadísticas de proveedores del servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /providers/category/:category - Fetch providers by category via backend
   * Lambda: getProvidersByCategory
   */
  getProvidersByCategory(
    category: ProviderCategory
  ): Observable<ApiResponse<ProviderDetails[]>> {
    return this.http.get<ApiResponse<ProviderDetails[]>>(`${this.apiUrl}/category/${category}`).pipe(
      catchError((error) => {
        console.error(`Error fetching providers by category from backend:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener los proveedores por categoría del servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }
}

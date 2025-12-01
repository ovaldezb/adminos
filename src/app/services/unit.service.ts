import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, catchError, map } from 'rxjs';
import { 
  Unit, 
  UnitDetails, 
  UnitStatus,
  UnitOccupancyStatus,
  PropertyType, 
  CreateUnitDto, 
  UpdateUnitDto, 
  UnitStatistics 
} from '../models/unit.model';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UnitService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/unit`;

  /**
   * GET /units/validate-number - Validates if unit number is unique within a building
   * Lambda: validateUnitNumber
   */
  validateUnitNumber(buildingId: string, unitNumber: string, excludeId?: string): Observable<ApiResponse<{ isUnique: boolean }>> {
    let params = new HttpParams()
      .set('buildingId', buildingId)
      .set('unitNumber', unitNumber);
    
    if (excludeId) {
      params = params.set('excludeId', excludeId);
    }

    return this.http.get<ApiResponse<{ isUnique: boolean }>>(`${this.apiUrl}/validate-number`, { params }).pipe(
      catchError((error) => {
        console.error('Error validating unit number from backend:', error);
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Error al validar número de unidad' },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * Simulates AWS Lambda GET request to fetch all units
   * Backend: GET /units - Returns { success, message, data: { units: [units with residents], count } }
   * Units include nested residents fetched from residentsId array
   */
  // GET /units - Fetch units from backend
  // Backend: GET /units?page=1&pageSize=10&condominiumId=xxx&buildingId=xxx&status=xxx&search=xxx
  getUnits(
    params?: PaginationParams & { condominiumId?: string; buildingId?: string; status?: UnitStatus; search?: string }
  ): Observable<ApiResponse<PaginatedResponse<UnitDetails>>> {
    // Construir HttpParams
    let httpParams = new HttpParams()
      .set('page', (params?.page || 1).toString())
      .set('pageSize', (params?.pageSize || 10).toString());

    if (params?.condominiumId && params.condominiumId !== 'all') {
      httpParams = httpParams.set('condominiumId', params.condominiumId);
    }

    if (params?.buildingId) {
      httpParams = httpParams.set('buildingId', params.buildingId);
    }

    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }

    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    // Backend response format: { success, message, data: { units: [], count } }
    interface BackendUnitsResponse {
      units: any[];
      count: number;
    }

    return this.http.get<ApiResponse<BackendUnitsResponse>>(this.apiUrl, { params: httpParams }).pipe(
      map((response) => {
        console.log('[UnitService] Raw backend response:', response);
        
        if (!response.success || !response.data) {
          return {
            success: false,
            error: { code: 'NO_DATA', message: 'No se recibieron datos del backend' },
            timestamp: new Date(),
          } as ApiResponse<PaginatedResponse<UnitDetails>>;
        }

        // Map backend format to frontend format
        const backendData = response.data;
        const units = backendData.units || [];
        const count = backendData.count || 0;
        const pageSize = params?.pageSize || 10;
        const currentPage = params?.page || 1;
        const totalPages = Math.ceil(count / pageSize);

        // Map backend units to UnitDetails (normalize _id to id, status values, etc.)
        const mappedUnits: UnitDetails[] = units.map((unit: any) => ({
          ...unit,
          id: unit._id || unit.id, // Backend uses _id
          buildingId: unit.buildingId || unit._buildingId, // Normalize buildingId
          condominiumId: unit.condominiumId || unit._condominiumId, // Normalize condominiumId
          // Map backend status to frontend enum
          status: this.mapBackendStatus(unit.status),
          // Map backend propertyType to frontend enum
          propertyType: this.mapBackendPropertyType(unit.propertyType),
          // Ensure required fields exist with defaults
          isOccupied: unit.status === 'ACTIVE' || unit.status === 'OCCUPIED',
          occupancyStatus: unit.status === 'ACTIVE' ? UnitOccupancyStatus.OWNER_OCCUPIED : UnitOccupancyStatus.VACANT,
          hasDebt: false,
          debtAmount: 0,
          residents: unit.residents || [],
          parkingSpaces: unit.parkingSlots || unit.parkingSpaces || 0,
          storageSpaces: unit.storageSlots || unit.storageSpaces || 0,
          createdAt: unit.createdAt ? new Date(unit.createdAt) : new Date(),
          updatedAt: unit.updatedAt ? new Date(unit.updatedAt) : new Date(),
        }));

        console.log('[UnitService] Mapped units:', mappedUnits);

        return {
          success: true,
          data: {
            items: mappedUnits,
            total: count,
            page: currentPage,
            pageSize: pageSize,
            totalPages: totalPages,
          },
          timestamp: new Date(),
        } as ApiResponse<PaginatedResponse<UnitDetails>>;
      }),
      catchError((error) => {
        console.error('[UnitService] Error fetching units from backend:', error);
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Error al cargar las unidades' },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * Maps backend status values to frontend UnitStatus enum
   */
  private mapBackendStatus(backendStatus: string): UnitStatus {
    const statusMap: Record<string, UnitStatus> = {
      'ACTIVE': UnitStatus.OCCUPIED,
      'INACTIVE': UnitStatus.VACANT,
      'OCCUPIED': UnitStatus.OCCUPIED,
      'VACANT': UnitStatus.VACANT,
      'occupied': UnitStatus.OCCUPIED,
      'vacant': UnitStatus.VACANT,
      'under_maintenance': UnitStatus.UNDER_MAINTENANCE,
      'for_sale': UnitStatus.FOR_SALE,
      'for_rent': UnitStatus.FOR_RENT,
    };
    
    return statusMap[backendStatus] || UnitStatus.VACANT;
  }

  /**
   * Maps backend propertyType values to frontend PropertyType enum
   */
  private mapBackendPropertyType(backendPropertyType: string): PropertyType {
    const typeMap: Record<string, PropertyType> = {
      'APARTMENT': PropertyType.APARTMENT,
      'PENTHOUSE': PropertyType.PENTHOUSE,
      'DUPLEX': PropertyType.DUPLEX,
      'STUDIO': PropertyType.STUDIO,
      'LOFT': PropertyType.LOFT,
      'TOWNHOUSE': PropertyType.TOWNHOUSE,
      'apartment': PropertyType.APARTMENT,
      'penthouse': PropertyType.PENTHOUSE,
      'duplex': PropertyType.DUPLEX,
      'studio': PropertyType.STUDIO,
      'loft': PropertyType.LOFT,
      'townhouse': PropertyType.TOWNHOUSE,
    };
    
    return typeMap[backendPropertyType] || PropertyType.APARTMENT;
  }

  /**
   * GET /units/:id - Fetch single unit from backend
   * Backend: GET /units/{id} - Returns { success, message, data: unit }
   */
  getUnitById(id: string): Observable<ApiResponse<UnitDetails>> {
    return this.http.get<ApiResponse<UnitDetails>>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching unit ${id} from backend:`, error);
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Error al cargar la unidad' },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * POST /buildings/:buildingId/units - Create unit via backend
   * Backend: POST /buildings/{buildingId}/units - Returns { success, message, data: created unit }
   * Adds unit to Building's unitsId array automatically
   */
  createUnit(unitData: CreateUnitDto): Observable<ApiResponse<Unit>> {
    console.log('[UnitService] createUnit - Original data:', unitData);
    
    // Map frontend field names to backend field names
    const backendData = {
      ...unitData,
      parkingSlots: unitData.parkingSpaces,
      storageSlots: unitData.storageSpaces
    };
    
    // Remove frontend field names
    delete (backendData as any).parkingSpaces;
    delete (backendData as any).storageSpaces;
    
    console.log('[UnitService] createUnit - Mapped data for backend:', backendData);
    console.log('[UnitService] createUnit - URL:', this.apiUrl);
    
    return this.http.post<ApiResponse<Unit>>(this.apiUrl, backendData).pipe(
      map((response) => {
        console.log('[UnitService] createUnit - Response:', response);
        return response;
      }),
      catchError((error) => {
        console.error('[UnitService] createUnit - Error:', error);
        console.error('[UnitService] createUnit - Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          error: error.error
        });
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: error.error?.message || 'Error al crear la unidad' },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * PUT /units/:id - Update unit via backend
   * Backend: PUT /units/{id} - Returns { success, message, data: updated unit }
   */
  updateUnit(
    id: string,
    updates: UpdateUnitDto
  ): Observable<ApiResponse<UnitDetails>> {
    console.log('[UnitService] updateUnit - ID:', id);
    console.log('[UnitService] updateUnit - Original data:', updates);
    
    // Map frontend field names to backend field names
    const backendData = {
      ...updates,
      parkingSlots: updates.parkingSpaces,
      storageSlots: updates.storageSpaces
    };
    
    // Remove frontend field names
    delete (backendData as any).parkingSpaces;
    delete (backendData as any).storageSpaces;
    
    console.log('[UnitService] updateUnit - Mapped data for backend:', backendData);
    console.log('[UnitService] updateUnit - URL:', `${this.apiUrl}/${id}`);
    
    return this.http.put<ApiResponse<UnitDetails>>(`${this.apiUrl}/${id}`, backendData).pipe(
      map((response) => {
        console.log('[UnitService] updateUnit - Response:', response);
        return response;
      }),
      catchError((error) => {
        console.error('[UnitService] updateUnit - Error:', error);
        console.error('[UnitService] updateUnit - Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          error: error.error
        });
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: error.error?.message || 'Error al actualizar la unidad' },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * DELETE /units/:id - Delete unit (soft delete) via backend
   * Backend: DELETE /units/{id} - Sets status to VACANT - Returns { success, message, data: {} }
   */
  deleteUnit(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting unit ${id} in backend:`, error);
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Error al eliminar la unidad' },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /units/vacant - Fetch vacant units via backend
   * Lambda: getVacantUnits
   */
  getVacantUnits(
    condominiumId?: string
  ): Observable<ApiResponse<UnitDetails[]>> {
    let params = new HttpParams();
    if (condominiumId && condominiumId !== 'all') {
      params = params.set('condominiumId', condominiumId);
    }

    return this.http
      .get<ApiResponse<UnitDetails[]>>(`${this.apiUrl}/vacant`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error fetching vacant units from backend:', error);
          return of({
            success: false,
            error: { code: 'BACKEND_ERROR', message: 'Error al cargar unidades vacantes' },
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * GET /units/with-debt - Fetch units with debt via backend
   * Lambda: getUnitsWithDebt
   */
  getUnitsWithDebt(
    condominiumId?: string
  ): Observable<ApiResponse<UnitDetails[]>> {
    let params = new HttpParams();
    if (condominiumId && condominiumId !== 'all') {
      params = params.set('condominiumId', condominiumId);
    }

    return this.http
      .get<ApiResponse<UnitDetails[]>>(`${this.apiUrl}/with-debt`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error fetching units with debt from backend:', error);
          return of({
            success: false,
            error: { code: 'BACKEND_ERROR', message: 'Error al cargar unidades con deuda' },
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * GET /units/stats - Fetch unit statistics via backend
   * Lambda: getUnitStats
   */
  getUnitStats(
    condominiumId?: string
  ): Observable<ApiResponse<UnitStatistics>> {
    let params = new HttpParams();
    if (condominiumId && condominiumId !== 'all') {
      params = params.set('condominiumId', condominiumId);
    }

    return this.http
      .get<ApiResponse<UnitStatistics>>(`${this.apiUrl}/stats`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error fetching unit stats from backend:', error);
          return of({
            success: false,
            error: { code: 'BACKEND_ERROR', message: 'Error al cargar estadísticas' },
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * GET /units/by-property-type/:propertyType - Fetch units by property type via backend
   * Lambda: getUnitsByPropertyType
   */
  getUnitsByPropertyType(
    propertyType: PropertyType,
    condominiumId?: string
  ): Observable<ApiResponse<UnitDetails[]>> {
    let params = new HttpParams();
    if (condominiumId && condominiumId !== 'all') {
      params = params.set('condominiumId', condominiumId);
    }

    return this.http
      .get<ApiResponse<UnitDetails[]>>(`${this.apiUrl}/by-property-type/${propertyType}`, { params })
      .pipe(
        catchError((error) => {
          console.error(`Error fetching units by property type ${propertyType} from backend:`, error);
          return of({
            success: false,
            error: { code: 'BACKEND_ERROR', message: 'Error al cargar unidades' },
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * GET /units/by-tower/:tower - Fetch units by tower via backend
   * Lambda: getUnitsByTower
   */
  getUnitsByTower(
    tower: string,
    condominiumId?: string
  ): Observable<ApiResponse<UnitDetails[]>> {
    let params = new HttpParams();
    if (condominiumId && condominiumId !== 'all') {
      params = params.set('condominiumId', condominiumId);
    }

    return this.http
      .get<ApiResponse<UnitDetails[]>>(`${this.apiUrl}/by-tower/${tower}`, { params })
      .pipe(
        catchError((error) => {
          console.error(`Error fetching units by tower ${tower} from backend:`, error);
          return of({
            success: false,
            error: { code: 'BACKEND_ERROR', message: 'Error al cargar unidades' },
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * POST /units/bulk-update - Bulk update of units via backend
   * Lambda: bulkUpdateUnits
   */
  bulkUpdateUnits(
    unitIds: string[],
    updates: Partial<UpdateUnitDto>
  ): Observable<ApiResponse<{ updated: number; failed: number }>> {
    return this.http.post<ApiResponse<{ updated: number; failed: number }>>(`${this.apiUrl}/bulk-update`, { unitIds, updates }).pipe(
      catchError((error) => {
        console.error('Error bulk updating units from backend:', error);
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Error al actualizar unidades' },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * POST /units/:unitId/assign-resident - Assign owner/resident to a unit
   * Lambda: assignResidentToUnit
   */
  assignResidentToUnit(
    unitId: string,
    residentId: string,
    isOwner: boolean = true
  ): Observable<ApiResponse<UnitDetails>> {
    return this.http.post<ApiResponse<UnitDetails>>(
      `${this.apiUrl}/${unitId}/assign-resident`,
      { residentId, isOwner }
    ).pipe(
      catchError((error) => {
        console.error(`Error assigning resident to unit ${unitId}:`, error);
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Error al asignar residente' },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * DELETE /units/:unitId/residents/:residentId - Remove resident from a unit
   * Lambda: removeResidentFromUnit
   */
  removeResidentFromUnit(
    unitId: string,
    removeOwner: boolean = false
  ): Observable<ApiResponse<UnitDetails>> {
    return this.http.delete<ApiResponse<UnitDetails>>(
      `${this.apiUrl}/${unitId}/residents`,
      { body: { removeOwner } }
    ).pipe(
      catchError((error) => {
        console.error(`Error removing resident from unit ${unitId}:`, error);
        return of({
          success: false,
          error: { code: 'BACKEND_ERROR', message: 'Error al remover residente' },
          timestamp: new Date(),
        });
      })
    );
  }
}

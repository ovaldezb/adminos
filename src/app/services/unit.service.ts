import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Unit, UnitDetails, UnitStatus } from '../models/unit.model';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class UnitService {
  // Simulated AWS Lambda endpoint
  private readonly lambdaEndpoint = 'https://api.example.com/units';

  // Mock data
  private mockUnits: UnitDetails[] = [
    {
      id: 'U-101',
      condominiumId: '1',
      unitNumber: '101',
      tower: 'Torre A',
      floor: 1,
      area: 85,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 1,
      status: UnitStatus.OCCUPIED,
      monthlyFee: 1500,
      ownerId: 'R-001',
      ownerName: 'Juan Pérez',
      residentId: 'R-001',
      residentName: 'Juan Pérez',
      hasDebt: false,
      debtAmount: 0,
      createdAt: new Date('2020-01-15'),
      updatedAt: new Date('2025-10-15'),
    },
    {
      id: 'U-102',
      condominiumId: '1',
      unitNumber: '102',
      tower: 'Torre A',
      floor: 1,
      area: 85,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 1,
      status: UnitStatus.OCCUPIED,
      monthlyFee: 1500,
      ownerId: 'R-002',
      ownerName: 'María García',
      residentId: 'R-002',
      residentName: 'María García',
      hasDebt: true,
      debtAmount: 1575,
      createdAt: new Date('2019-06-20'),
      updatedAt: new Date('2025-10-20'),
    },
    {
      id: 'U-201',
      condominiumId: '2',
      unitNumber: '201',
      tower: 'Único',
      floor: 2,
      area: 120,
      bedrooms: 4,
      bathrooms: 3,
      parkingSpaces: 2,
      status: UnitStatus.OCCUPIED,
      monthlyFee: 1800,
      ownerId: 'R-003',
      ownerName: 'Carlos Rodríguez',
      residentId: 'R-003',
      residentName: 'Carlos Rodríguez',
      hasDebt: false,
      debtAmount: 0,
      createdAt: new Date('2021-01-10'),
      updatedAt: new Date('2025-10-10'),
    },
    {
      id: 'U-305',
      condominiumId: '3',
      unitNumber: '305',
      tower: 'Torre B',
      floor: 3,
      area: 95,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 1,
      status: UnitStatus.OCCUPIED,
      monthlyFee: 1650,
      ownerId: 'R-005',
      ownerName: 'Luis Torres',
      residentId: 'R-004',
      residentName: 'Ana Martínez',
      hasDebt: false,
      debtAmount: 0,
      createdAt: new Date('2022-02-14'),
      updatedAt: new Date('2025-10-01'),
    },
    {
      id: 'U-450',
      condominiumId: '3',
      unitNumber: '450',
      tower: 'Torre C',
      floor: 4,
      area: 110,
      bedrooms: 4,
      bathrooms: 3,
      parkingSpaces: 2,
      status: UnitStatus.VACANT,
      monthlyFee: 1850,
      hasDebt: false,
      debtAmount: 0,
      createdAt: new Date('2022-02-14'),
      updatedAt: new Date('2025-09-15'),
    },
  ];

  /**
   * Simulates AWS Lambda GET request to fetch all units
   * Lambda: getUnits
   */
  getUnits(
    params?: PaginationParams & { condominiumId?: string; status?: UnitStatus; search?: string }
  ): Observable<ApiResponse<PaginatedResponse<UnitDetails>>> {
    let filtered = [...this.mockUnits];

    // Filter by condominiumId
    if (params?.condominiumId && params.condominiumId !== 'all') {
      filtered = filtered.filter((u) => u.condominiumId === params.condominiumId);
    }

    // Filter by status
    if (params?.status) {
      filtered = filtered.filter((u) => u.status === params.status);
    }

    // Search filter
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.unitNumber.toLowerCase().includes(search) ||
          u.tower.toLowerCase().includes(search) ||
          u.ownerName?.toLowerCase().includes(search) ||
          u.residentName?.toLowerCase().includes(search)
      );
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    const response: PaginatedResponse<UnitDetails> = {
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
      message: 'Unidades obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch single unit
   * Lambda: getUnitById
   */
  getUnitById(id: string): Observable<ApiResponse<UnitDetails>> {
    const unit = this.mockUnits.find((u) => u.id === id);

    if (!unit) {
      return of({
        success: false,
        error: {
          code: 'UNIT_NOT_FOUND',
          message: 'Unidad no encontrada',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    return of({
      success: true,
      data: unit,
      message: 'Unidad obtenida exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 200));
  }

  /**
   * Simulates AWS Lambda POST request to create unit
   * Lambda: createUnit
   */
  createUnit(unit: Partial<Unit>): Observable<ApiResponse<Unit>> {
    const newUnit: Unit = {
      id: `U-${String(Date.now()).slice(-6)}`,
      condominiumId: unit.condominiumId!,
      unitNumber: unit.unitNumber!,
      tower: unit.tower!,
      floor: unit.floor || 1,
      area: unit.area || 0,
      bedrooms: unit.bedrooms || 0,
      bathrooms: unit.bathrooms || 0,
      parkingSpaces: unit.parkingSpaces || 0,
      status: unit.status || UnitStatus.VACANT,
      monthlyFee: unit.monthlyFee || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return of({
      success: true,
      data: newUnit,
      message: 'Unidad creada exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 700 + 500));
  }

  /**
   * Simulates AWS Lambda PUT request to update unit
   * Lambda: updateUnit
   */
  updateUnit(
    id: string,
    updates: Partial<Unit>
  ): Observable<ApiResponse<Unit>> {
    const unit = this.mockUnits.find((u) => u.id === id);

    if (!unit) {
      return of({
        success: false,
        error: {
          code: 'UNIT_NOT_FOUND',
          message: 'Unidad no encontrada',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    const updated = {
      ...unit,
      ...updates,
      updatedAt: new Date(),
    };

    return of({
      success: true,
      data: updated,
      message: 'Unidad actualizada exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 600 + 400));
  }

  /**
   * Simulates AWS Lambda DELETE request to delete unit
   * Lambda: deleteUnit
   */
  deleteUnit(id: string): Observable<ApiResponse<void>> {
    const index = this.mockUnits.findIndex((u) => u.id === id);

    if (index === -1) {
      return of({
        success: false,
        error: {
          code: 'UNIT_NOT_FOUND',
          message: 'Unidad no encontrada',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    this.mockUnits.splice(index, 1);

    return of({
      success: true,
      message: 'Unidad eliminada exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch vacant units
   * Lambda: getVacantUnits
   */
  getVacantUnits(
    condominiumId?: string
  ): Observable<ApiResponse<UnitDetails[]>> {
    let units = this.mockUnits.filter((u) => u.status === UnitStatus.VACANT);

    if (condominiumId && condominiumId !== 'all') {
      units = units.filter((u) => u.condominiumId === condominiumId);
    }

    return of({
      success: true,
      data: units,
      message: 'Unidades vacantes obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch units with debt
   * Lambda: getUnitsWithDebt
   */
  getUnitsWithDebt(
    condominiumId?: string
  ): Observable<ApiResponse<UnitDetails[]>> {
    let units = this.mockUnits.filter((u) => u.hasDebt);

    if (condominiumId && condominiumId !== 'all') {
      units = units.filter((u) => u.condominiumId === condominiumId);
    }

    return of({
      success: true,
      data: units,
      message: 'Unidades con deuda obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch unit statistics
   * Lambda: getUnitStats
   */
  getUnitStats(
    condominiumId?: string
  ): Observable<ApiResponse<{ total: number; byStatus: Record<UnitStatus, number> }>> {
    let units = [...this.mockUnits];

    if (condominiumId && condominiumId !== 'all') {
      units = units.filter((u) => u.condominiumId === condominiumId);
    }

    const byStatus: Record<string, number> = {};
    units.forEach((u) => {
      byStatus[u.status] = (byStatus[u.status] || 0) + 1;
    });

    const stats = {
      total: units.length,
      byStatus: byStatus as Record<UnitStatus, number>,
    };

    return of({
      success: true,
      data: stats,
      message: 'Estadísticas de unidades obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 300));
  }
}

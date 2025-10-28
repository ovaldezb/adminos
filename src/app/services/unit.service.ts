import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { 
  Unit, 
  UnitDetails, 
  UnitStatus, 
  PropertyType, 
  CreateUnitDto, 
  UpdateUnitDto, 
  UnitStatistics 
} from '../models/unit.model';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class UnitService {
  // Simulated AWS Lambda endpoint
  private readonly lambdaEndpoint = 'https://api.example.com/units';

  // Mock data - simulating MongoDB collection
  private mockUnits: UnitDetails[] = [
    {
      id: 'U-101',
      condominiumId: '1',
      buildingId: 'bld-001',
      buildingName: 'Torre Palmas',
      unitNumber: '101',
      tower: 'Torre A',
      floor: 1,
      area: 85,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 1,
      storageSpaces: 1,
      status: UnitStatus.OCCUPIED,
      monthlyFee: 30000,
      propertyType: PropertyType.APARTMENT,
      orientation: 'Norte',
      hasBalcony: true,
      hasGarden: false,
      isFurnished: true,
      description: 'Departamento acogedor con vista panorámica',
      ownerId: 'R-001',
      ownerName: 'Juan Carlos Pérez González',
      ownerEmail: 'juan.perez@email.com',
      ownerPhone: '+52 55 1234-5678',
      residentId: 'R-001',
      residentName: 'Juan Carlos Pérez González',
      residentEmail: 'juan.perez@email.com',
      residentPhone: '+52 55 1234-5678',
      hasDebt: false,
      debtAmount: 0,
      lastPaymentDate: new Date('2025-10-15'),
      occupancyStartDate: new Date('2020-01-15'),
      createdAt: new Date('2020-01-15'),
      updatedAt: new Date('2025-10-15'),
    },
    {
      id: 'U-102',
      condominiumId: '1',
      buildingId: 'bld-001',
      buildingName: 'Torre Palmas',
      unitNumber: '102',
      tower: 'Torre A',
      floor: 1,
      area: 85,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 1,
      storageSpaces: 1,
      status: UnitStatus.OCCUPIED,
      monthlyFee: 30000,
      propertyType: PropertyType.APARTMENT,
      orientation: 'Sur',
      hasBalcony: true,
      hasGarden: false,
      isFurnished: false,
      description: 'Departamento luminoso con espacios amplios',
      ownerId: 'R-002',
      ownerName: 'María Guadalupe García Martínez',
      ownerEmail: 'maria.garcia@email.com',
      ownerPhone: '+52 55 2345-6789',
      residentId: 'R-002',
      residentName: 'María Guadalupe García Martínez',
      residentEmail: 'maria.garcia@email.com',
      residentPhone: '+52 55 2345-6789',
      hasDebt: true,
      debtAmount: 31500,
      lastPaymentDate: new Date('2025-08-20'),
      occupancyStartDate: new Date('2019-06-20'),
      createdAt: new Date('2019-06-20'),
      updatedAt: new Date('2025-10-20'),
    },
    {
      id: 'U-103',
      condominiumId: '1',
      buildingId: 'bld-001',
      buildingName: 'Torre Palmas',
      unitNumber: '103',
      tower: 'Torre A',
      floor: 1,
      area: 95,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 2,
      storageSpaces: 1,
      status: UnitStatus.FOR_RENT,
      monthlyFee: 33000,
      propertyType: PropertyType.APARTMENT,
      orientation: 'Este',
      hasBalcony: true,
      hasGarden: true,
      isFurnished: true,
      description: 'Departamento con jardín privado y doble estacionamiento',
      hasDebt: false,
      debtAmount: 0,
      createdAt: new Date('2020-03-10'),
      updatedAt: new Date('2025-09-15'),
    },
    {
      id: 'U-201',
      condominiumId: '2',
      buildingId: 'bld-002',
      buildingName: 'Torre Jardines',
      unitNumber: '201',
      tower: 'Único',
      floor: 2,
      area: 120,
      bedrooms: 4,
      bathrooms: 3,
      parkingSpaces: 2,
      storageSpaces: 2,
      status: UnitStatus.OCCUPIED,
      monthlyFee: 36000,
      propertyType: PropertyType.PENTHOUSE,
      orientation: 'Norte',
      hasBalcony: true,
      hasGarden: false,
      isFurnished: false,
      description: 'Penthouse de lujo con terraza privada',
      ownerId: 'R-003',
      ownerName: 'Carlos Alberto Rodríguez López',
      ownerEmail: 'carlos.rodriguez@email.com',
      ownerPhone: '+52 55 3456-7890',
      residentId: 'R-003',
      residentName: 'Carlos Alberto Rodríguez López',
      residentEmail: 'carlos.rodriguez@email.com',
      residentPhone: '+52 55 3456-7890',
      hasDebt: false,
      debtAmount: 0,
      lastPaymentDate: new Date('2025-10-10'),
      occupancyStartDate: new Date('2021-01-10'),
      createdAt: new Date('2021-01-10'),
      updatedAt: new Date('2025-10-10'),
    },
    {
      id: 'U-202',
      condominiumId: '2',
      buildingId: 'bld-002',
      buildingName: 'Torre Jardines',
      unitNumber: '202',
      tower: 'Único',
      floor: 2,
      area: 110,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 2,
      storageSpaces: 1,
      status: UnitStatus.UNDER_MAINTENANCE,
      monthlyFee: 34000,
      propertyType: PropertyType.APARTMENT,
      orientation: 'Sur',
      hasBalcony: true,
      hasGarden: false,
      isFurnished: false,
      description: 'Departamento en remodelación',
      hasDebt: false,
      debtAmount: 0,
      createdAt: new Date('2021-03-15'),
      updatedAt: new Date('2025-10-01'),
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
      storageSpaces: 1,
      status: UnitStatus.OCCUPIED,
      monthlyFee: 33000,
      propertyType: PropertyType.APARTMENT,
      orientation: 'Oeste',
      hasBalcony: true,
      hasGarden: false,
      isFurnished: false,
      description: 'Departamento con vista al mar',
      ownerId: 'R-005',
      ownerName: 'Luis Fernando Torres Ramírez',
      ownerEmail: 'luis.torres@email.com',
      ownerPhone: '+52 55 5678-9012',
      residentId: 'R-004',
      residentName: 'Ana Patricia Martínez Hernández',
      residentEmail: 'ana.martinez@email.com',
      residentPhone: '+52 55 4567-8901',
      hasDebt: false,
      debtAmount: 0,
      lastPaymentDate: new Date('2025-10-01'),
      occupancyStartDate: new Date('2025-10-01'),
      createdAt: new Date('2022-02-14'),
      updatedAt: new Date('2025-10-01'),
    },
    {
      id: 'U-306',
      condominiumId: '3',
      unitNumber: '306',
      tower: 'Torre B',
      floor: 3,
      area: 75,
      bedrooms: 2,
      bathrooms: 2,
      parkingSpaces: 1,
      storageSpaces: 0,
      status: UnitStatus.FOR_SALE,
      monthlyFee: 28000,
      propertyType: PropertyType.APARTMENT,
      orientation: 'Este',
      hasBalcony: true,
      hasGarden: false,
      isFurnished: false,
      description: 'Departamento ideal para pareja joven',
      hasDebt: false,
      debtAmount: 0,
      createdAt: new Date('2022-02-14'),
      updatedAt: new Date('2025-09-20'),
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
      storageSpaces: 2,
      status: UnitStatus.VACANT,
      monthlyFee: 37000,
      propertyType: PropertyType.DUPLEX,
      orientation: 'Norte',
      hasBalcony: true,
      hasGarden: false,
      isFurnished: false,
      description: 'Dúplex de dos pisos con terraza',
      hasDebt: false,
      debtAmount: 0,
      createdAt: new Date('2022-02-14'),
      updatedAt: new Date('2025-09-15'),
    },
    {
      id: 'U-501',
      condominiumId: '1',
      unitNumber: '501',
      tower: 'Torre A',
      floor: 5,
      area: 60,
      bedrooms: 1,
      bathrooms: 1,
      parkingSpaces: 1,
      storageSpaces: 0,
      status: UnitStatus.VACANT,
      monthlyFee: 24000,
      propertyType: PropertyType.STUDIO,
      orientation: 'Sur',
      hasBalcony: false,
      hasGarden: false,
      isFurnished: true,
      description: 'Studio moderno totalmente amoblado',
      hasDebt: false,
      debtAmount: 0,
      createdAt: new Date('2020-05-20'),
      updatedAt: new Date('2025-10-05'),
    },
    {
      id: 'U-502',
      condominiumId: '1',
      unitNumber: '502',
      tower: 'Torre A',
      floor: 5,
      area: 140,
      bedrooms: 4,
      bathrooms: 3,
      parkingSpaces: 3,
      storageSpaces: 2,
      status: UnitStatus.OCCUPIED,
      monthlyFee: 44000,
      propertyType: PropertyType.PENTHOUSE,
      orientation: 'Norte',
      hasBalcony: true,
      hasGarden: false,
      isFurnished: false,
      description: 'Penthouse de lujo en último piso',
      ownerId: 'R-006',
      ownerName: 'Roberto Silva Méndez',
      ownerEmail: 'roberto.silva@email.com',
      ownerPhone: '+52 55 6789-0123',
      residentId: 'R-006',
      residentName: 'Roberto Silva Méndez',
      residentEmail: 'roberto.silva@email.com',
      residentPhone: '+52 55 6789-0123',
      hasDebt: false,
      debtAmount: 0,
      lastPaymentDate: new Date('2025-10-18'),
      occupancyStartDate: new Date('2023-05-10'),
      createdAt: new Date('2020-05-20'),
      updatedAt: new Date('2025-10-18'),
    },
  ];

  /**
   * Validates if unit number is unique within a building
   * Lambda: validateUnitNumber
   */
  validateUnitNumber(buildingId: string, unitNumber: string, excludeId?: string): Observable<ApiResponse<{ isUnique: boolean }>> {
    const existingUnit = this.mockUnits.find(u => 
      u.buildingId === buildingId && 
      u.unitNumber === unitNumber &&
      u.id !== excludeId
    );

    return of({
      success: true,
      data: { isUnique: !existingUnit },
      message: existingUnit ? 'Número de unidad ya existe' : 'Número de unidad disponible',
      timestamp: new Date(),
    }).pipe(delay(300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch all units
   * Lambda: getUnits
   */
  getUnits(
    params?: PaginationParams & { condominiumId?: string; buildingId?: string; status?: UnitStatus; search?: string }
  ): Observable<ApiResponse<PaginatedResponse<UnitDetails>>> {
    let filtered = [...this.mockUnits];

    // Filter by condominiumId
    if (params?.condominiumId && params.condominiumId !== 'all') {
      filtered = filtered.filter((u) => u.condominiumId === params.condominiumId);
    }

    // Filter by buildingId
    if (params?.buildingId) {
      filtered = filtered.filter((u) => u.buildingId === params.buildingId);
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
  createUnit(unitData: CreateUnitDto): Observable<ApiResponse<Unit>> {
    const newUnit: Unit = {
      id: `U-${String(Date.now()).slice(-6)}`,
      condominiumId: unitData.condominiumId,
      unitNumber: unitData.unitNumber,
      tower: unitData.tower,
      floor: unitData.floor,
      area: unitData.area,
      bedrooms: unitData.bedrooms,
      bathrooms: unitData.bathrooms,
      parkingSpaces: unitData.parkingSpaces,
      storageSpaces: unitData.storageSpaces,
      status: unitData.status,
      monthlyFee: unitData.monthlyFee,
      propertyType: unitData.propertyType,
      orientation: unitData.orientation,
      hasBalcony: unitData.hasBalcony,
      hasGarden: unitData.hasGarden,
      isFurnished: unitData.isFurnished,
      description: unitData.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to mock data
    this.mockUnits.push({
      ...newUnit,
      hasDebt: false,
      debtAmount: 0,
    });

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
    updates: UpdateUnitDto
  ): Observable<ApiResponse<UnitDetails>> {
    const unitIndex = this.mockUnits.findIndex((u) => u.id === id);

    if (unitIndex === -1) {
      return of({
        success: false,
        error: {
          code: 'UNIT_NOT_FOUND',
          message: 'Unidad no encontrada',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    const updated: UnitDetails = {
      ...this.mockUnits[unitIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.mockUnits[unitIndex] = updated;

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
  ): Observable<ApiResponse<UnitStatistics>> {
    let units = [...this.mockUnits];

    if (condominiumId && condominiumId !== 'all') {
      units = units.filter((u) => u.condominiumId === condominiumId);
    }

    const byStatus: Record<string, number> = {};
    units.forEach((u) => {
      byStatus[u.status] = (byStatus[u.status] || 0) + 1;
    });

    const byPropertyType: Record<string, number> = {};
    units.forEach((u) => {
      byPropertyType[u.propertyType] = (byPropertyType[u.propertyType] || 0) + 1;
    });

    const totalOccupied = byStatus[UnitStatus.OCCUPIED] || 0;
    const totalVacant = byStatus[UnitStatus.VACANT] || 0;
    const totalArea = units.reduce((sum, u) => sum + u.area, 0);
    const totalMonthlyRevenue = units
      .filter(u => u.status === UnitStatus.OCCUPIED)
      .reduce((sum, u) => sum + u.monthlyFee, 0);
    const totalDebt = units.reduce((sum, u) => sum + u.debtAmount, 0);
    const unitsWithDebt = units.filter(u => u.hasDebt).length;

    const stats: UnitStatistics = {
      total: units.length,
      byStatus: byStatus as Record<UnitStatus, number>,
      byPropertyType: byPropertyType as Record<PropertyType, number>,
      totalOccupied,
      totalVacant,
      occupancyRate: units.length > 0 ? (totalOccupied / units.length) * 100 : 0,
      totalArea,
      averageArea: units.length > 0 ? totalArea / units.length : 0,
      totalMonthlyRevenue,
      totalDebt,
      unitsWithDebt,
    };

    return of({
      success: true,
      data: stats,
      message: 'Estadísticas de unidades obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch units by property type
   * Lambda: getUnitsByPropertyType
   */
  getUnitsByPropertyType(
    propertyType: PropertyType,
    condominiumId?: string
  ): Observable<ApiResponse<UnitDetails[]>> {
    let units = this.mockUnits.filter((u) => u.propertyType === propertyType);

    if (condominiumId && condominiumId !== 'all') {
      units = units.filter((u) => u.condominiumId === condominiumId);
    }

    return of({
      success: true,
      data: units,
      message: 'Unidades obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch units by tower
   * Lambda: getUnitsByTower
   */
  getUnitsByTower(
    tower: string,
    condominiumId?: string
  ): Observable<ApiResponse<UnitDetails[]>> {
    let units = this.mockUnits.filter((u) => 
      u.tower.toLowerCase() === tower.toLowerCase()
    );

    if (condominiumId && condominiumId !== 'all') {
      units = units.filter((u) => u.condominiumId === condominiumId);
    }

    return of({
      success: true,
      data: units,
      message: 'Unidades obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 300));
  }

  /**
   * Simulates bulk update of units
   * Lambda: bulkUpdateUnits
   */
  bulkUpdateUnits(
    unitIds: string[],
    updates: Partial<UpdateUnitDto>
  ): Observable<ApiResponse<{ updated: number; failed: number }>> {
    let updated = 0;
    let failed = 0;

    unitIds.forEach(id => {
      const unitIndex = this.mockUnits.findIndex(u => u.id === id);
      if (unitIndex !== -1) {
        this.mockUnits[unitIndex] = {
          ...this.mockUnits[unitIndex],
          ...updates,
          updatedAt: new Date(),
        };
        updated++;
      } else {
        failed++;
      }
    });

    return of({
      success: true,
      data: { updated, failed },
      message: `${updated} unidades actualizadas, ${failed} fallidas`,
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 800 + 600));
  }

  /**
   * Simulates assigning an owner/resident to a unit
   * Lambda: assignResidentToUnit
   */
  assignResidentToUnit(
    unitId: string,
    residentId: string,
    isOwner: boolean = true
  ): Observable<ApiResponse<UnitDetails>> {
    const unitIndex = this.mockUnits.findIndex(u => u.id === unitId);

    if (unitIndex === -1) {
      return of({
        success: false,
        error: {
          code: 'UNIT_NOT_FOUND',
          message: 'Unidad no encontrada',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    const unit = this.mockUnits[unitIndex];

    if (isOwner) {
      unit.ownerId = residentId;
      unit.status = UnitStatus.OCCUPIED;
    } else {
      unit.residentId = residentId;
    }

    unit.occupancyStartDate = new Date();
    unit.updatedAt = new Date();

    return of({
      success: true,
      data: unit,
      message: isOwner ? 'Propietario asignado exitosamente' : 'Residente asignado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 600 + 400));
  }

  /**
   * Simulates removing a resident from a unit
   * Lambda: removeResidentFromUnit
   */
  removeResidentFromUnit(
    unitId: string,
    removeOwner: boolean = false
  ): Observable<ApiResponse<UnitDetails>> {
    const unitIndex = this.mockUnits.findIndex(u => u.id === unitId);

    if (unitIndex === -1) {
      return of({
        success: false,
        error: {
          code: 'UNIT_NOT_FOUND',
          message: 'Unidad no encontrada',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    const unit = this.mockUnits[unitIndex];

    if (removeOwner) {
      unit.ownerId = undefined;
      unit.ownerName = undefined;
      unit.ownerEmail = undefined;
      unit.ownerPhone = undefined;
      unit.status = UnitStatus.VACANT;
    } else {
      unit.residentId = undefined;
      unit.residentName = undefined;
      unit.residentEmail = undefined;
      unit.residentPhone = undefined;
    }

    unit.updatedAt = new Date();

    return of({
      success: true,
      data: unit,
      message: removeOwner ? 'Propietario removido exitosamente' : 'Residente removido exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 600 + 400));
  }
}

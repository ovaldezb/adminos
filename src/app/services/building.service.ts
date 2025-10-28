import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
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
  private buildings = signal<BuildingDetails[]>([
    {
      id: 'bld-001',
      condominiumId: '1',
      name: 'Torre Palmas',
      type: BuildingType.TOWER,
      mainEntranceAddress: 'Av. Constitución 1234, Col. Centro',
      totalUnits: 48,
      floors: 12,
      hasCommonAreas: true,
      commonAreasDescription: 'Salón de eventos, gimnasio, alberca',
      commonAreaRentalRate: 2500,
      status: BuildingStatus.ACTIVE,
      yearBuilt: 2019,
      parkingSpots: 96,
      elevators: 2,
      securityFeatures: ['Cámaras 24/7', 'Acceso controlado', 'Vigilancia privada'],
      amenities: ['Gimnasio', 'Alberca', 'Salón de eventos', 'Jardín'],
      description: 'Torre residencial de lujo con vista panorámica',
      condominiumName: 'Torres del Parque',
      occupiedUnits: 42,
      vacantUnits: 6,
      occupancyRate: 87.5,
      monthlyRevenue: 144000,
      adminName: 'Carlos González',
      adminEmail: 'admin@laspalmas.com',
      adminPhone: '555-1234',
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2024-10-20')
    },
    {
      id: 'bld-002',
      condominiumId: '2',
      name: 'Torre Jardines',
      type: BuildingType.TOWER,
      mainEntranceAddress: 'Av. Constitución 1236, Col. Centro',
      totalUnits: 40,
      floors: 10,
      hasCommonAreas: false,
      status: BuildingStatus.ACTIVE,
      yearBuilt: 2020,
      parkingSpots: 80,
      elevators: 2,
      securityFeatures: ['Cámaras 24/7', 'Acceso controlado'],
      amenities: ['Estacionamiento techado'],
      description: 'Torre residencial familiar',
      condominiumName: 'Condominio Vista Hermosa',
      occupiedUnits: 38,
      vacantUnits: 2,
      occupancyRate: 95,
      monthlyRevenue: 120000,
      createdAt: new Date('2023-03-10'),
      updatedAt: new Date('2024-10-18')
    },
    {
      id: 'bld-003',
      condominiumId: '3',
      name: 'Privada Los Robles',
      type: BuildingType.PRIVATE_RESIDENCE,
      mainEntranceAddress: 'Calle Robles #45, Fracc. Bosques del Valle',
      totalUnits: 24,
      hasCommonAreas: true,
      commonAreasDescription: 'Casa club, parque infantil',
      commonAreaRentalRate: 1500,
      status: BuildingStatus.ACTIVE,
      yearBuilt: 2018,
      parkingSpots: 48,
      securityFeatures: ['Garita de seguridad', 'Acceso controlado', 'Rondines'],
      amenities: ['Casa club', 'Área verde', 'Parque infantil', 'Cancha deportiva'],
      description: 'Privada residencial con casas unifamiliares',
      condominiumName: 'Edificio Sunset Boulevard',
      occupiedUnits: 22,
      vacantUnits: 2,
      occupancyRate: 91.7,
      monthlyRevenue: 60000,
      adminName: 'María Rodríguez',
      adminEmail: 'admin@bosques.com',
      adminPhone: '555-5678',
      createdAt: new Date('2023-02-20'),
      updatedAt: new Date('2024-10-15')
    },
    {
      id: 'bld-004',
      condominiumId: '3',
      name: 'Edificio Central A',
      type: BuildingType.BUILDING,
      mainEntranceAddress: 'Calle Principal #100, Col. Vista Hermosa',
      totalUnits: 32,
      floors: 8,
      hasCommonAreas: true,
      commonAreasDescription: 'Roof garden, coworking',
      commonAreaRentalRate: 1800,
      status: BuildingStatus.ACTIVE,
      yearBuilt: 2021,
      parkingSpots: 32,
      elevators: 1,
      securityFeatures: ['Interfón', 'Puerta de seguridad'],
      amenities: ['Roof garden', 'Área de coworking'],
      description: 'Edificio moderno con espacios para trabajo remoto',
      condominiumName: 'Edificio Sunset Boulevard',
      occupiedUnits: 28,
      vacantUnits: 4,
      occupancyRate: 87.5,
      monthlyRevenue: 80000,
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date('2024-10-10')
    },
    {
      id: 'bld-005',
      condominiumId: '3',
      name: 'Edificio Central B',
      type: BuildingType.BUILDING,
      mainEntranceAddress: 'Calle Principal #102, Col. Vista Hermosa',
      totalUnits: 32,
      floors: 8,
      hasCommonAreas: false,
      status: BuildingStatus.UNDER_MAINTENANCE,
      yearBuilt: 2021,
      parkingSpots: 32,
      elevators: 1,
      securityFeatures: ['Interfón', 'Puerta de seguridad'],
      description: 'Edificio en mantenimiento preventivo',
      condominiumName: 'Edificio Sunset Boulevard',
      occupiedUnits: 30,
      vacantUnits: 2,
      occupancyRate: 93.75,
      monthlyRevenue: 75000,
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date('2024-10-25')
    }
  ]);

  constructor() {}

  // Get all buildings with pagination and filters
  getBuildings(params: GetBuildingsParams = {}): Observable<ApiResponse<PaginatedResponse<BuildingDetails>>> {
    const {
      page = 1,
      pageSize = 10,
      condominiumId,
      search,
      type,
      status
    } = params;

    let filtered = this.buildings();

    // Apply filters
    if (condominiumId && condominiumId !== 'all') {
      filtered = filtered.filter(b => b.condominiumId === condominiumId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(searchLower) ||
        b.mainEntranceAddress.toLowerCase().includes(searchLower) ||
        b.description?.toLowerCase().includes(searchLower)
      );
    }

    if (type) {
      filtered = filtered.filter(b => b.type === type);
    }

    if (status) {
      filtered = filtered.filter(b => b.status === status);
    }

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    const response: ApiResponse<PaginatedResponse<BuildingDetails>> = {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      },
      timestamp: new Date()
    };

    return of(response).pipe(delay(300));
  }

  // Get building by ID
  getBuildingById(id: string): Observable<ApiResponse<BuildingDetails>> {
    const building = this.buildings().find(b => b.id === id);

    if (building) {
      return of({
        success: true,
        data: building,
        timestamp: new Date()
      }).pipe(delay(200));
    }

    return of({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Edificio no encontrado'
      },
      timestamp: new Date()
    }).pipe(delay(200));
  }

  // Create new building
  createBuilding(dto: CreateBuildingDto): Observable<ApiResponse<BuildingDetails>> {
    const newBuilding: BuildingDetails = {
      id: `bld-${Date.now()}`,
      ...dto,
      occupiedUnits: 0,
      vacantUnits: dto.totalUnits,
      occupancyRate: 0,
      monthlyRevenue: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.buildings.update(buildings => [...buildings, newBuilding]);

    return of({
      success: true,
      data: newBuilding,
      timestamp: new Date()
    }).pipe(delay(500));
  }

  // Update building
  updateBuilding(id: string, dto: UpdateBuildingDto): Observable<ApiResponse<BuildingDetails>> {
    const index = this.buildings().findIndex(b => b.id === id);

    if (index === -1) {
      return of({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Edificio no encontrado'
        },
        timestamp: new Date()
      }).pipe(delay(300));
    }

    const updatedBuilding: BuildingDetails = {
      ...this.buildings()[index],
      ...dto,
      updatedAt: new Date()
    };

    this.buildings.update(buildings => {
      const newBuildings = [...buildings];
      newBuildings[index] = updatedBuilding;
      return newBuildings;
    });

    return of({
      success: true,
      data: updatedBuilding,
      timestamp: new Date()
    }).pipe(delay(500));
  }

  // Delete building
  deleteBuilding(id: string): Observable<ApiResponse<void>> {
    const index = this.buildings().findIndex(b => b.id === id);

    if (index === -1) {
      return of({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Edificio no encontrado'
        },
        timestamp: new Date()
      }).pipe(delay(300));
    }

    this.buildings.update(buildings => buildings.filter(b => b.id !== id));

    return of({
      success: true,
      timestamp: new Date()
    }).pipe(delay(500));
  }

  // Get building statistics
  getBuildingStatistics(condominiumId?: string): Observable<ApiResponse<BuildingStatistics>> {
    let filtered = this.buildings();

    if (condominiumId && condominiumId !== 'all') {
      filtered = filtered.filter(b => b.condominiumId === condominiumId);
    }

    const stats: BuildingStatistics = {
      total: filtered.length,
      byType: {
        [BuildingType.TOWER]: filtered.filter(b => b.type === BuildingType.TOWER).length,
        [BuildingType.BUILDING]: filtered.filter(b => b.type === BuildingType.BUILDING).length,
        [BuildingType.PRIVATE_RESIDENCE]: filtered.filter(b => b.type === BuildingType.PRIVATE_RESIDENCE).length,
        [BuildingType.CLUSTER]: filtered.filter(b => b.type === BuildingType.CLUSTER).length
      },
      byStatus: {
        [BuildingStatus.ACTIVE]: filtered.filter(b => b.status === BuildingStatus.ACTIVE).length,
        [BuildingStatus.UNDER_CONSTRUCTION]: filtered.filter(b => b.status === BuildingStatus.UNDER_CONSTRUCTION).length,
        [BuildingStatus.UNDER_MAINTENANCE]: filtered.filter(b => b.status === BuildingStatus.UNDER_MAINTENANCE).length,
        [BuildingStatus.INACTIVE]: filtered.filter(b => b.status === BuildingStatus.INACTIVE).length
      },
      totalUnits: filtered.reduce((sum, b) => sum + b.totalUnits, 0),
      totalOccupied: filtered.reduce((sum, b) => sum + b.occupiedUnits, 0),
      totalVacant: filtered.reduce((sum, b) => sum + b.vacantUnits, 0),
      averageOccupancyRate: filtered.length > 0 
        ? filtered.reduce((sum, b) => sum + b.occupancyRate, 0) / filtered.length 
        : 0,
      totalMonthlyRevenue: filtered.reduce((sum, b) => sum + b.monthlyRevenue, 0),
      withCommonAreas: filtered.filter(b => b.hasCommonAreas).length,
      totalCommonAreaRevenue: filtered
        .filter(b => b.hasCommonAreas && b.commonAreaRentalRate)
        .reduce((sum, b) => sum + (b.commonAreaRentalRate || 0), 0)
    };

    return of({
      success: true,
      data: stats,
      timestamp: new Date()
    }).pipe(delay(300));
  }
}

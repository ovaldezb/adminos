import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
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

@Injectable({
  providedIn: 'root',
})
export class CondominiumService {
  // Signal para el condominio seleccionado globalmente
  public readonly selectedCondominium = signal<Condominium | null>(null);

  // Simulated AWS Lambda endpoint
  private readonly lambdaEndpoint = 'https://api.example.com/condominiums';

  // Mock data simulating AWS Lambda responses from MongoDB
  private mockCondominiums: Condominium[] = [
    {
      id: '1',
      name: 'Torres del Parque',
      type: CondominiumType.BUILDING,
      street: 'Av. Primavera',
      neighborhood: 'San Borja',
      number: '123',
      zipCode: '15037',
      city: 'Lima',
      state: 'Lima',
      country: 'Perú',
      paymentDay: 5,
      conventionalPenalty: 2.5,
      initialFolio: 1,
      rfc: 'TDP850101XX0',
      isActive: true,
      hasAC: true,
      additionalInfo: 'Condominio de lujo con 3 torres residenciales. Cuenta con seguridad 24/7 y amplias áreas verdes.',
      towers: [
        { id: 't1', name: 'Torre A', floors: 10, unitsPerFloor: 4, totalUnits: 40 },
        { id: 't2', name: 'Torre B', floors: 12, unitsPerFloor: 6, totalUnits: 72 },
        { id: 't3', name: 'Torre C', floors: 8, unitsPerFloor: 4, totalUnits: 32 }
      ],
      amenities: [
        { 
          id: 'a1', 
          name: 'Alberca Olímpica', 
          type: AmenityType.POOL, 
          isRentable: true, 
          hourlyRate: 250, 
          capacity: 40,
          description: 'Alberca techada con calefacción',
          isActive: true 
        },
        { 
          id: 'a2', 
          name: 'Gimnasio Premium', 
          type: AmenityType.GYM, 
          isRentable: false,
          capacity: 25,
          description: 'Gimnasio con equipamiento completo',
          isActive: true 
        },
        { 
          id: 'a3', 
          name: 'Salón de Eventos', 
          type: AmenityType.PARTY_ROOM, 
          isRentable: true, 
          hourlyRate: 500,
          capacity: 80,
          description: 'Salón para fiestas y eventos',
          isActive: true 
        }
      ],
      maintenanceFee: 1800,
      currency: 'MXN',
      billingDay: 1,
      units: 144,
      totalUnits: 144,
      occupiedUnits: 138,
      color: '#0ea5e9',
      description: 'Moderno complejo residencial con 3 torres',
      createdAt: new Date('2020-01-15'),
      updatedAt: new Date('2025-10-15'),
    },
    {
      id: '2',
      name: 'Privadas del Sol',
      type: CondominiumType.RESIDENTIAL_COMPLEX,
      street: 'Blvd. Las Palmas',
      neighborhood: 'Centro Sur',
      number: '567',
      zipCode: '76100',
      city: 'Querétaro',
      state: 'Querétaro',
      country: 'México',
      paymentDay: 10,
      conventionalPenalty: 3.0,
      initialFolio: 50,
      isActive: true,
      hasAC: false,
      additionalInfo: 'Fraccionamiento familiar con 4 privadas cerradas. Incluye áreas deportivas y recreativas.',
      privateStreets: [
        { id: 'ps1', name: 'Privada Norte', totalHouses: 12 },
        { id: 'ps2', name: 'Privada Sur', totalHouses: 15 },
        { id: 'ps3', name: 'Privada Este', totalHouses: 10 },
        { id: 'ps4', name: 'Privada Oeste', totalHouses: 8 }
      ],
      amenities: [
        { 
          id: 'a4', 
          name: 'Salón de Fiestas', 
          type: AmenityType.PARTY_ROOM, 
          isRentable: true, 
          hourlyRate: 600,
          capacity: 60,
          description: 'Salón techado con cocina integral',
          isActive: true 
        },
        { 
          id: 'a5', 
          name: 'Cancha de Fútbol', 
          type: AmenityType.SPORTS_COURT, 
          isRentable: true, 
          hourlyRate: 200,
          capacity: 22,
          description: 'Cancha de pasto sintético',
          isActive: true 
        },
        { 
          id: 'a6', 
          name: 'Área de Juegos Infantiles', 
          type: AmenityType.PLAYGROUND, 
          isRentable: false,
          isActive: true 
        }
      ],
      maintenanceFee: 950,
      currency: 'MXN',
      billingDay: 5,
      units: 45,
      totalUnits: 45,
      occupiedUnits: 43,
      color: '#8b5cf6',
      description: 'Fraccionamiento familiar con 4 privadas',
      createdAt: new Date('2019-03-20'),
      updatedAt: new Date('2025-10-10'),
    },
    {
      id: '3',
      name: 'Conjunto Residencial Las Flores',
      type: CondominiumType.GATED_COMMUNITY,
      street: 'Av. Angamos',
      neighborhood: 'Surco',
      number: '789',
      zipCode: '15023',
      city: 'Lima',
      state: 'Lima',
      country: 'Perú',
      paymentDay: 15,
      conventionalPenalty: 2.0,
      initialFolio: 100,
      rfc: 'CRL950320XX8',
      isActive: true,
      hasAC: true,
      additionalInfo: 'Conjunto habitacional con seguridad 24/7. Casa club con piscina y áreas BBQ disponibles para renta.',
      privateStreets: [
        { id: 'ps5', name: 'Calle Las Rosas', totalHouses: 18 },
        { id: 'ps6', name: 'Calle Los Tulipanes', totalHouses: 16 }
      ],
      amenities: [
        { 
          id: 'a7', 
          name: 'Casa Club', 
          type: AmenityType.PARTY_ROOM, 
          isRentable: true, 
          hourlyRate: 800,
          capacity: 100,
          description: 'Casa club con terraza y parrilla',
          isActive: true 
        },
        { 
          id: 'a8', 
          name: 'Piscina Semi-Olímpica', 
          type: AmenityType.POOL, 
          isRentable: false,
          capacity: 30,
          isActive: true 
        },
        { 
          id: 'a9', 
          name: 'Área de BBQ', 
          type: AmenityType.BARBECUE_AREA, 
          isRentable: true, 
          hourlyRate: 150,
          capacity: 12,
          isActive: true 
        }
      ],
      maintenanceFee: 1200,
      currency: 'PEN',
      billingDay: 10,
      units: 34,
      totalUnits: 34,
      occupiedUnits: 32,
      color: '#10b981',
      description: 'Conjunto habitacional con seguridad 24/7',
      createdAt: new Date('2021-06-10'),
      updatedAt: new Date('2025-10-12'),
    }
  ];

  private mockStats: Record<string, CondominiumStats> = {
    '1': {
      condominiumId: '1',
      totalUnits: 144,
      occupiedUnits: 138,
      vacantUnits: 6,
      monthlyCollection: 248400,
      pendingInvoices: 18,
      delinquentUnits: 8,
      collectionRate: 95.8,
      month: '10',
      year: 2025,
    },
    '2': {
      condominiumId: '2',
      totalUnits: 45,
      occupiedUnits: 43,
      vacantUnits: 2,
      monthlyCollection: 40850,
      pendingInvoices: 6,
      delinquentUnits: 3,
      collectionRate: 95.6,
      month: '10',
      year: 2025,
    },
    '3': {
      condominiumId: '3',
      totalUnits: 34,
      occupiedUnits: 32,
      vacantUnits: 2,
      monthlyCollection: 38400,
      pendingInvoices: 4,
      delinquentUnits: 2,
      collectionRate: 94.1,
      month: '10',
      year: 2025,
    }
  };

  /**
   * Simulates AWS Lambda GET request to fetch all condominiums
   * Backend: GET /condominiums - Returns { success, message, data: [condominiums with buildings] }
   */
  getAllCondominiums(): Observable<ApiResponse<Condominium[]>> {
    // Backend fetches buildings for each condominium and adds them to the condominium object
    return of({
      success: true,
      message: 'Condominiums retrieved successfully',
      data: this.mockCondominiums,
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch single condominium
   * Lambda: getCondominiumById
   */
  getCondominiumById(id: string): Observable<ApiResponse<Condominium>> {
    const condominium = this.mockCondominiums.find((c) => c.id === id);

    if (!condominium) {
      return of({
        success: false,
        error: {
          code: 'CONDO_NOT_FOUND',
          message: 'Condominio no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    return of({
      success: true,
      data: condominium,
      message: 'Condominio obtenido exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 200));
  }

  /**
   * Simulates AWS Lambda GET request to fetch condominium details
   * Lambda: getCondominiumDetails
   */
  getCondominiumDetails(
    id: string
  ): Observable<ApiResponse<CondominiumDetails>> {
    const condominium = this.mockCondominiums.find((c) => c.id === id);

    if (!condominium) {
      return of({
        success: false,
        error: {
          code: 'CONDO_NOT_FOUND',
          message: 'Condominio no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    const details: CondominiumDetails = {
      ...condominium,
      adminName: 'Carlos Mendoza',
      adminEmail: `admin@${condominium.name.toLowerCase().replace(/\s+/g, '')}.com`,
      adminPhone: '+51 999 888 777',
      bankAccount: '1234-5678-9012-3456',
    };

    return of({
      success: true,
      data: details,
      message: 'Detalles del condominio obtenidos exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch condominium statistics
   * Lambda: getCondominiumStats
   */
  getCondominiumStats(
    id: string
  ): Observable<ApiResponse<CondominiumStats>> {
    const stats = this.mockStats[id];

    if (!stats) {
      return of({
        success: false,
        error: {
          code: 'STATS_NOT_FOUND',
          message: 'Estadísticas no encontradas',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    return of({
      success: true,
      data: stats,
      message: 'Estadísticas obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 250));
  }

  /**
   * Simulates AWS Lambda GET request to fetch aggregated stats for all condominiums
   * Lambda: getAllCondominiumsStats
   */
  getAllCondominiumsStats(): Observable<ApiResponse<CondominiumStats>> {
    const aggregated: CondominiumStats = {
      condominiumId: 'all',
      totalUnits: Object.values(this.mockStats).reduce(
        (sum, s) => sum + s.totalUnits,
        0
      ),
      occupiedUnits: Object.values(this.mockStats).reduce(
        (sum, s) => sum + s.occupiedUnits,
        0
      ),
      vacantUnits: Object.values(this.mockStats).reduce(
        (sum, s) => sum + s.vacantUnits,
        0
      ),
      monthlyCollection: Object.values(this.mockStats).reduce(
        (sum, s) => sum + s.monthlyCollection,
        0
      ),
      pendingInvoices: Object.values(this.mockStats).reduce(
        (sum, s) => sum + s.pendingInvoices,
        0
      ),
      delinquentUnits: Object.values(this.mockStats).reduce(
        (sum, s) => sum + s.delinquentUnits,
        0
      ),
      collectionRate:
        Object.values(this.mockStats).reduce(
          (sum, s) => sum + s.collectionRate,
          0
        ) / Object.values(this.mockStats).length,
      month: '10',
      year: 2025,
    };

    return of({
      success: true,
      data: aggregated,
      message: 'Estadísticas globales obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 600 + 400));
  }

  /**
   * Simulates AWS Lambda POST request to create condominium
   * Backend: POST /condominiums - Returns { success, message, data: created condominium with _id }
   */
  createCondominium(
    condominiumDto: CreateCondominiumDto
  ): Observable<ApiResponse<Condominium>> {
    const newCondominium: Condominium = {
      id: String(Date.now()),
      name: condominiumDto.name,
      type: condominiumDto.type || CondominiumType.BUILDING,
      street: condominiumDto.street,
      neighborhood: condominiumDto.neighborhood,
      number: condominiumDto.number,
      zipCode: condominiumDto.zipCode,
      city: condominiumDto.city,
      state: condominiumDto.state,
      country: condominiumDto.country || 'México',
      paymentDay: condominiumDto.paymentDay,
      conventionalPenalty: condominiumDto.conventionalPenalty,
      initialFolio: condominiumDto.initialFolio || 1,
      rfc: condominiumDto.rfc,
      isActive: condominiumDto.isActive ?? true,
      hasAC: condominiumDto.hasAC ?? false,
      additionalInfo: condominiumDto.additionalInfo,
      description: condominiumDto.description,
      towers: condominiumDto.towers?.map(t => ({ ...t, id: `tower_${Date.now()}_${Math.random()}` })),
      privateStreets: condominiumDto.privateStreets?.map(ps => ({ ...ps, id: `ps_${Date.now()}_${Math.random()}` })),
      amenities: condominiumDto.amenities?.map(a => ({ ...a, id: `amenity_${Date.now()}_${Math.random()}` })),
      maintenanceFee: condominiumDto.maintenanceFee,
      currency: condominiumDto.currency,
      billingDay: condominiumDto.billingDay,
      totalUnits: this.calculateTotalUnits(condominiumDto),
      occupiedUnits: 0,
      color: '#6366f1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockCondominiums.push(newCondominium);

    return of({
      success: true,
      message: 'Condominium created successfully',
      data: newCondominium,
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 700 + 500));
  }

  private calculateTotalUnits(dto: CreateCondominiumDto): number {
    if (dto.towers) {
      return dto.towers.reduce((total, tower) => total + (tower.floors * tower.unitsPerFloor), 0);
    }
    if (dto.privateStreets) {
      return dto.privateStreets.reduce((total, ps) => total + ps.totalHouses, 0);
    }
    return 0;
  }

  /**
   * Simulates AWS Lambda PUT request to update condominium
   * Backend: PUT /condominiums/{id} - Returns { success, message, data: updated condominium }
   */
  updateCondominium(
    id: string,
    updates: UpdateCondominiumDto
  ): Observable<ApiResponse<Condominium>> {
    const index = this.mockCondominiums.findIndex((c) => c.id === id);

    if (index === -1) {
      return of({
        success: false,
        message: 'Condominium not found',
        error: {
          code: 'CONDO_NOT_FOUND',
          message: 'Condominio no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    const updated: Condominium = {
      ...this.mockCondominiums[index],
      ...updates,
      towers: updates.towers?.map(t => ({ ...t, id: `tower_${Date.now()}_${Math.random()}` })) || this.mockCondominiums[index].towers,
      privateStreets: updates.privateStreets?.map(ps => ({ ...ps, id: `ps_${Date.now()}_${Math.random()}` })) || this.mockCondominiums[index].privateStreets,
      amenities: updates.amenities?.map(a => ({ ...a, id: `amenity_${Date.now()}_${Math.random()}` })) || this.mockCondominiums[index].amenities,
      updatedAt: new Date(),
    };
    this.mockCondominiums[index] = updated;

    return of({
      success: true,
      message: 'Condominium updated successfully',
      data: updated,
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 600 + 400));
  }

  // Método para establecer el condominio seleccionado globalmente
  setSelectedCondominium(condominium: Condominium | null): void {
    this.selectedCondominium.set(condominium);
  }

  /**
   * Simulates AWS Lambda DELETE request to delete condominium (soft delete)
   * Backend: DELETE /condominiums/{id} - Sets status to INACTIVE - Returns { success, message }
   */
  deleteCondominium(id: string): Observable<ApiResponse<void>> {
    const index = this.mockCondominiums.findIndex((c) => c.id === id);

    if (index === -1) {
      return of({
        success: false,
        message: 'Condominium not found',
        error: {
          code: 'CONDO_NOT_FOUND',
          message: 'Condominio no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    // Soft delete - set status to INACTIVE instead of removing
    this.mockCondominiums[index].isActive = false;

    return of({
      success: true,
      message: 'Condominium deleted successfully',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }
}

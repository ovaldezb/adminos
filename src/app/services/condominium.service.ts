import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  Condominium,
  CondominiumStats,
  CondominiumDetails,
} from '../models/condominium.model';
import { ApiResponse } from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class CondominiumService {
  // Simulated AWS Lambda endpoint
  private readonly lambdaEndpoint = 'https://api.example.com/condominiums';

  // Mock data simulating AWS Lambda responses
  private mockCondominiums: Condominium[] = [
    {
      id: '1',
      name: 'Torres del Parque',
      address: 'Av. Primavera 123, San Borja',
      units: 156,
      towers: 2,
      avatar: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
      color: '#0ea5e9',
      createdAt: new Date('2020-01-15'),
      updatedAt: new Date('2025-10-15'),
    },
    {
      id: '2',
      name: 'Condominio Vista Hermosa',
      address: 'Calle Los Jazmines 456, Miraflores',
      units: 89,
      towers: 1,
      avatar: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
      color: '#8b5cf6',
      createdAt: new Date('2019-03-20'),
      updatedAt: new Date('2025-10-10'),
    },
    {
      id: '3',
      name: 'Edificio Sunset Boulevard',
      address: 'Av. Angamos 789, Surco',
      units: 234,
      towers: 3,
      avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
      color: '#10b981',
      createdAt: new Date('2021-06-10'),
      updatedAt: new Date('2025-10-12'),
    },
    {
      id: '4',
      name: 'Residencial Las Palmas',
      address: 'Jr. Las Flores 321, San Isidro',
      units: 67,
      towers: 1,
      avatar: 'https://images.unsplash.com/photo-1460574283810-2aab119d8511?w=400',
      color: '#f59e0b',
      createdAt: new Date('2018-11-25'),
      updatedAt: new Date('2025-09-30'),
    },
    {
      id: '5',
      name: 'Condominio El Mirador',
      address: 'Av. La Marina 555, Pueblo Libre',
      units: 250,
      towers: 3,
      avatar: 'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=400',
      color: '#ec4899',
      createdAt: new Date('2022-02-14'),
      updatedAt: new Date('2025-10-20'),
    },
  ];

  private mockStats: Record<string, CondominiumStats> = {
    '1': {
      condominiumId: '1',
      totalUnits: 156,
      occupiedUnits: 145,
      vacantUnits: 11,
      monthlyCollection: 234500,
      pendingInvoices: 18,
      delinquentUnits: 8,
      collectionRate: 94.2,
      month: '10',
      year: 2025,
    },
    '2': {
      condominiumId: '2',
      totalUnits: 89,
      occupiedUnits: 87,
      vacantUnits: 2,
      monthlyCollection: 156800,
      pendingInvoices: 12,
      delinquentUnits: 5,
      collectionRate: 95.5,
      month: '10',
      year: 2025,
    },
    '3': {
      condominiumId: '3',
      totalUnits: 234,
      occupiedUnits: 228,
      vacantUnits: 6,
      monthlyCollection: 389000,
      pendingInvoices: 28,
      delinquentUnits: 14,
      collectionRate: 93.8,
      month: '10',
      year: 2025,
    },
    '4': {
      condominiumId: '4',
      totalUnits: 67,
      occupiedUnits: 64,
      vacantUnits: 3,
      monthlyCollection: 98500,
      pendingInvoices: 8,
      delinquentUnits: 3,
      collectionRate: 96.8,
      month: '10',
      year: 2025,
    },
    '5': {
      condominiumId: '5',
      totalUnits: 250,
      occupiedUnits: 242,
      vacantUnits: 8,
      monthlyCollection: 425000,
      pendingInvoices: 32,
      delinquentUnits: 16,
      collectionRate: 92.5,
      month: '10',
      year: 2025,
    },
  };

  /**
   * Simulates AWS Lambda GET request to fetch all condominiums
   * Lambda: getCondominiums
   */
  getAllCondominiums(): Observable<ApiResponse<Condominium[]>> {
    // Simulate API delay (300-800ms)
    return of({
      success: true,
      data: this.mockCondominiums,
      message: 'Condominios obtenidos exitosamente',
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
      amenities: [
        'Piscina',
        'Gimnasio',
        'Sala de eventos',
        'Áreas verdes',
        'Seguridad 24/7',
      ],
      adminName: 'Carlos Mendoza',
      adminEmail: `admin@${condominium.name.toLowerCase().replace(/\s+/g, '')}.com`,
      adminPhone: '+51 999 888 777',
      bankAccount: '1234-5678-9012-3456',
      maintenanceFee: 350,
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
   * Lambda: createCondominium
   */
  createCondominium(
    condominium: Partial<Condominium>
  ): Observable<ApiResponse<Condominium>> {
    const newCondominium: Condominium = {
      id: String(Date.now()),
      name: condominium.name!,
      address: condominium.address!,
      units: condominium.units || 0,
      towers: condominium.towers || 1,
      avatar: condominium.avatar,
      color: condominium.color || '#6366f1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockCondominiums.push(newCondominium);

    return of({
      success: true,
      data: newCondominium,
      message: 'Condominio creado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 700 + 500));
  }

  /**
   * Simulates AWS Lambda PUT request to update condominium
   * Lambda: updateCondominium
   */
  updateCondominium(
    id: string,
    updates: Partial<Condominium>
  ): Observable<ApiResponse<Condominium>> {
    const index = this.mockCondominiums.findIndex((c) => c.id === id);

    if (index === -1) {
      return of({
        success: false,
        error: {
          code: 'CONDO_NOT_FOUND',
          message: 'Condominio no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    const updated = {
      ...this.mockCondominiums[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.mockCondominiums[index] = updated;

    return of({
      success: true,
      data: updated,
      message: 'Condominio actualizado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 600 + 400));
  }

  /**
   * Simulates AWS Lambda DELETE request to delete condominium
   * Lambda: deleteCondominium
   */
  deleteCondominium(id: string): Observable<ApiResponse<void>> {
    const index = this.mockCondominiums.findIndex((c) => c.id === id);

    if (index === -1) {
      return of({
        success: false,
        error: {
          code: 'CONDO_NOT_FOUND',
          message: 'Condominio no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    this.mockCondominiums.splice(index, 1);

    return of({
      success: true,
      message: 'Condominio eliminado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }
}

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Resident, ResidentDetails, ResidentType } from '../models/resident.model';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class ResidentService {
  // Simulated AWS Lambda endpoint
  private readonly lambdaEndpoint = 'https://api.example.com/residents';

  // Mock data
  private mockResidents: ResidentDetails[] = [
    {
      id: 'R-001',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@email.com',
      phone: '+51 999 111 222',
      documentType: 'dni' as any,
      documentNumber: '12345678',
      type: ResidentType.OWNER,
      condominiumId: '1',
      unitId: 'U-101',
      units: ['U-101'],
      moveInDate: new Date('2020-03-15'),
      isActive: true,
      emergencyContactName: 'María Pérez',
      emergencyContactPhone: '+51 999 111 223',
      totalDebt: 0,
      paymentHistory: 48,
      averagePaymentDelay: 2,
      createdAt: new Date('2020-03-15'),
      updatedAt: new Date('2025-10-15'),
    },
    {
      id: 'R-002',
      firstName: 'María',
      lastName: 'García',
      email: 'maria.garcia@email.com',
      phone: '+51 999 222 333',
      documentType: 'dni' as any,
      documentNumber: '23456789',
      type: ResidentType.OWNER,
      condominiumId: '1',
      unitId: 'U-102',
      units: ['U-102'],
      moveInDate: new Date('2019-06-20'),
      isActive: true,
      emergencyContactName: 'Carlos García',
      emergencyContactPhone: '+51 999 222 334',
      totalDebt: 1575,
      paymentHistory: 62,
      averagePaymentDelay: 5,
      createdAt: new Date('2019-06-20'),
      updatedAt: new Date('2025-10-20'),
    },
    {
      id: 'R-003',
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos.rodriguez@email.com',
      phone: '+51 999 333 444',
      documentType: 'dni' as any,
      documentNumber: '34567890',
      type: ResidentType.OWNER,
      condominiumId: '2',
      unitId: 'U-201',
      units: ['U-201', 'U-202'],
      moveInDate: new Date('2021-01-10'),
      isActive: true,
      emergencyContactName: 'Ana Rodríguez',
      emergencyContactPhone: '+51 999 333 445',
      totalDebt: 0,
      paymentHistory: 40,
      averagePaymentDelay: 0,
      createdAt: new Date('2021-01-10'),
      updatedAt: new Date('2025-10-10'),
    },
    {
      id: 'R-004',
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana.martinez@email.com',
      phone: '+51 999 444 555',
      documentType: 'ce' as any,
      documentNumber: 'CE-001234567',
      type: ResidentType.TENANT,
      condominiumId: '3',
      unitId: 'U-305',
      units: ['U-305'],
      moveInDate: new Date('2025-10-01'),
      isActive: true,
      emergencyContactName: 'Luis Martínez',
      emergencyContactPhone: '+51 999 444 556',
      totalDebt: 0,
      paymentHistory: 1,
      averagePaymentDelay: 0,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-01'),
    },
  ];

  /**
   * Simulates AWS Lambda GET request to fetch all residents
   * Lambda: getResidents
   */
  getResidents(
    params?: PaginationParams & { condominiumId?: string; type?: ResidentType; search?: string }
  ): Observable<ApiResponse<PaginatedResponse<ResidentDetails>>> {
    let filtered = [...this.mockResidents];

    // Filter by condominiumId
    if (params?.condominiumId && params.condominiumId !== 'all') {
      filtered = filtered.filter((r) => r.condominiumId === params.condominiumId);
    }

    // Filter by type
    if (params?.type) {
      filtered = filtered.filter((r) => r.type === params.type);
    }

    // Search filter
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.firstName.toLowerCase().includes(search) ||
          r.lastName.toLowerCase().includes(search) ||
          r.email.toLowerCase().includes(search) ||
          r.documentNumber.toLowerCase().includes(search)
      );
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    const response: PaginatedResponse<ResidentDetails> = {
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
      message: 'Residentes obtenidos exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch single resident
   * Lambda: getResidentById
   */
  getResidentById(id: string): Observable<ApiResponse<ResidentDetails>> {
    const resident = this.mockResidents.find((r) => r.id === id);

    if (!resident) {
      return of({
        success: false,
        error: {
          code: 'RESIDENT_NOT_FOUND',
          message: 'Residente no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    return of({
      success: true,
      data: resident,
      message: 'Residente obtenido exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 200));
  }

  /**
   * Simulates AWS Lambda POST request to create resident
   * Lambda: createResident
   */
  createResident(
    resident: Partial<Resident>
  ): Observable<ApiResponse<Resident>> {
    const newResident: Resident = {
      id: `R-${String(Date.now()).slice(-6)}`,
      firstName: resident.firstName!,
      lastName: resident.lastName!,
      email: resident.email!,
      phone: resident.phone!,
      documentType: resident.documentType!,
      documentNumber: resident.documentNumber!,
      type: resident.type || ResidentType.OWNER,
      condominiumId: resident.condominiumId!,
      unitId: resident.unitId!,
      moveInDate: resident.moveInDate || new Date(),
      isActive: true,
      emergencyContactName: resident.emergencyContactName,
      emergencyContactPhone: resident.emergencyContactPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return of({
      success: true,
      data: newResident,
      message: 'Residente creado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 700 + 500));
  }

  /**
   * Simulates AWS Lambda PUT request to update resident
   * Lambda: updateResident
   */
  updateResident(
    id: string,
    updates: Partial<Resident>
  ): Observable<ApiResponse<Resident>> {
    const resident = this.mockResidents.find((r) => r.id === id);

    if (!resident) {
      return of({
        success: false,
        error: {
          code: 'RESIDENT_NOT_FOUND',
          message: 'Residente no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    const updated = {
      ...resident,
      ...updates,
      updatedAt: new Date(),
    };

    return of({
      success: true,
      data: updated,
      message: 'Residente actualizado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 600 + 400));
  }

  /**
   * Simulates AWS Lambda DELETE request to deactivate resident
   * Lambda: deactivateResident
   */
  deactivateResident(id: string): Observable<ApiResponse<void>> {
    const resident = this.mockResidents.find((r) => r.id === id);

    if (!resident) {
      return of({
        success: false,
        error: {
          code: 'RESIDENT_NOT_FOUND',
          message: 'Residente no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    resident.isActive = false;
    resident.moveOutDate = new Date();
    resident.updatedAt = new Date();

    return of({
      success: true,
      message: 'Residente desactivado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch residents with debt
   * Lambda: getResidentsWithDebt
   */
  getResidentsWithDebt(
    condominiumId?: string
  ): Observable<ApiResponse<ResidentDetails[]>> {
    let residents = this.mockResidents.filter((r) => r.totalDebt > 0);

    if (condominiumId && condominiumId !== 'all') {
      residents = residents.filter((r) => r.condominiumId === condominiumId);
    }

    return of({
      success: true,
      data: residents,
      message: 'Residentes con deuda obtenidos exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch resident payment history
   * Lambda: getResidentPaymentHistory
   */
  getResidentPaymentHistory(
    residentId: string
  ): Observable<ApiResponse<{ totalPayments: number; totalAmount: number; averageDelay: number }>> {
    const resident = this.mockResidents.find((r) => r.id === residentId);

    if (!resident) {
      return of({
        success: false,
        error: {
          code: 'RESIDENT_NOT_FOUND',
          message: 'Residente no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    const history = {
      totalPayments: resident.paymentHistory,
      totalAmount: resident.paymentHistory * 1500, // Mock calculation
      averageDelay: resident.averagePaymentDelay,
    };

    return of({
      success: true,
      data: history,
      message: 'Historial de pagos obtenido exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }
}

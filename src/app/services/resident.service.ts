import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { 
  Resident, 
  ResidentDetails, 
  ResidentType, 
  DocumentType,
  CreateResidentDto,
  UpdateResidentDto
} from '../models/resident.model';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class ResidentService {
  // Simulated AWS Lambda endpoint
  private readonly lambdaEndpoint = 'https://api.example.com/residents';

  // Mock data - simulating MongoDB collection
  private mockResidents: ResidentDetails[] = [
    {
      id: 'R-001',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@email.com',
      phone: '+51 999 111 222',
      documentType: DocumentType.DNI,
      documentNumber: '12345678',
      type: ResidentType.OWNER,
      condominiumId: '1',
      unitId: 'U-101',
      units: ['U-101'],
      unitNumbers: ['101'],
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
      documentType: DocumentType.DNI,
      documentNumber: '23456789',
      type: ResidentType.OWNER,
      condominiumId: '1',
      unitId: 'U-102',
      units: ['U-102'],
      unitNumbers: ['102'],
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
      documentType: DocumentType.DNI,
      documentNumber: '34567890',
      type: ResidentType.OWNER,
      condominiumId: '2',
      unitId: 'U-201',
      units: ['U-201', 'U-202'],
      unitNumbers: ['201', '202'],
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
      documentType: DocumentType.CE,
      documentNumber: 'CE-001234567',
      type: ResidentType.TENANT,
      condominiumId: '3',
      unitId: 'U-305',
      units: ['U-305'],
      unitNumbers: ['305'],
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
    {
      id: 'R-005',
      firstName: 'Luis',
      lastName: 'Torres',
      email: 'luis.torres@email.com',
      phone: '+51 999 555 666',
      documentType: DocumentType.DNI,
      documentNumber: '45678901',
      type: ResidentType.OWNER,
      condominiumId: '3',
      unitId: 'U-305',
      units: ['U-305'],
      unitNumbers: ['305'],
      moveInDate: new Date('2022-02-14'),
      isActive: true,
      emergencyContactName: 'Carmen Torres',
      emergencyContactPhone: '+51 999 555 667',
      totalDebt: 0,
      paymentHistory: 35,
      averagePaymentDelay: 1,
      createdAt: new Date('2022-02-14'),
      updatedAt: new Date('2025-10-10'),
    },
    {
      id: 'R-006',
      firstName: 'Roberto',
      lastName: 'Silva',
      email: 'roberto.silva@email.com',
      phone: '+51 999 666 777',
      documentType: DocumentType.DNI,
      documentNumber: '56789012',
      type: ResidentType.BOTH,
      condominiumId: '1',
      unitId: 'U-502',
      units: ['U-502', 'U-103'],
      unitNumbers: ['502', '103'],
      moveInDate: new Date('2023-05-10'),
      isActive: true,
      emergencyContactName: 'Patricia Silva',
      emergencyContactPhone: '+51 999 666 778',
      totalDebt: 0,
      paymentHistory: 28,
      averagePaymentDelay: 0,
      createdAt: new Date('2023-05-10'),
      updatedAt: new Date('2025-10-18'),
    },
    {
      id: 'R-007',
      firstName: 'Elena',
      lastName: 'Vargas',
      email: 'elena.vargas@email.com',
      phone: '+51 999 777 888',
      documentType: DocumentType.PASSPORT,
      documentNumber: 'P123456789',
      type: ResidentType.TENANT,
      condominiumId: '2',
      unitId: 'U-202',
      units: ['U-202'],
      unitNumbers: ['202'],
      moveInDate: new Date('2024-08-15'),
      isActive: true,
      emergencyContactName: 'Miguel Vargas',
      emergencyContactPhone: '+51 999 777 889',
      totalDebt: 850,
      paymentHistory: 14,
      averagePaymentDelay: 3,
      createdAt: new Date('2024-08-15'),
      updatedAt: new Date('2025-10-20'),
    },
    {
      id: 'R-008',
      firstName: 'Fernando',
      lastName: 'Campos',
      email: 'fernando.campos@email.com',
      phone: '+51 999 888 999',
      documentType: DocumentType.DNI,
      documentNumber: '67890123',
      type: ResidentType.OWNER,
      condominiumId: '1',
      unitId: 'U-501',
      units: ['U-501'],
      unitNumbers: ['501'],
      moveInDate: new Date('2020-05-20'),
      isActive: false,
      moveOutDate: new Date('2025-09-30'),
      emergencyContactName: 'Lucia Campos',
      emergencyContactPhone: '+51 999 888 998',
      totalDebt: 0,
      paymentHistory: 60,
      averagePaymentDelay: 2,
      createdAt: new Date('2020-05-20'),
      updatedAt: new Date('2025-09-30'),
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
    residentData: CreateResidentDto
  ): Observable<ApiResponse<Resident>> {
    const newResident: Resident = {
      id: `R-${String(Date.now()).slice(-6)}`,
      firstName: residentData.firstName,
      lastName: residentData.lastName,
      email: residentData.email,
      phone: residentData.phone,
      documentType: residentData.documentType,
      documentNumber: residentData.documentNumber,
      type: residentData.type,
      condominiumId: residentData.condominiumId,
      unitId: residentData.unitId,
      moveInDate: residentData.moveInDate,
      isActive: true,
      emergencyContactName: residentData.emergencyContactName,
      emergencyContactPhone: residentData.emergencyContactPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to mock data
    this.mockResidents.push({
      ...newResident,
      units: [newResident.unitId],
      totalDebt: 0,
      paymentHistory: 0,
      averagePaymentDelay: 0,
    });

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
    updates: UpdateResidentDto
  ): Observable<ApiResponse<ResidentDetails>> {
    const residentIndex = this.mockResidents.findIndex((r) => r.id === id);

    if (residentIndex === -1) {
      return of({
        success: false,
        error: {
          code: 'RESIDENT_NOT_FOUND',
          message: 'Residente no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    const updated: ResidentDetails = {
      ...this.mockResidents[residentIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.mockResidents[residentIndex] = updated;

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

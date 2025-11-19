import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { 
  Resident, 
  ResidentDetails, 
  ResidentType, 
  DocumentType,
  CreateResidentDto,
  UpdateResidentDto,
  UnitResidents
} from '../models/resident.model';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class ResidentService {
  // Simulated AWS Lambda endpoint
  private readonly lambdaEndpoint = 'https://api.example.com/residents';

  // Mock data - simulating MongoDB collection with new structure
  private mockResidents: ResidentDetails[] = [
    // Unidad U-101 - Familia Pérez (Dueño + esposa + hijo)
    {
      id: 'R-001',
      firstName: 'Juan Carlos',
      lastName: 'Pérez González',
      email: 'juan.perez@email.com',
      phone: '+52 55 1234-5678',
      documentType: DocumentType.CURP,
      documentNumber: 'PEGJ850315HDFRNN09',
      type: ResidentType.OWNER,
      condominiumId: '1',
      condominiumName: 'Torres del Parque',
      buildingId: 'bld-001',
      buildingName: 'Torre A',
      unitId: 'U-101',
      unitNumber: '101',
      isResponsible: true,
      isAdministrator: true, // Es administrador del condominio
      canReceiveNotifications: true,
      moveInDate: new Date('2020-03-15'),
      isActive: true,
      emergencyContactName: 'María Pérez',
      emergencyContactPhone: '+52 55 9876-5432',
      totalDebt: 0,
      paymentHistory: 48,
      averagePaymentDelay: 2,
      createdAt: new Date('2020-03-15'),
      updatedAt: new Date('2025-10-15'),
    },
    {
      id: 'R-001-01',
      firstName: 'Ana María',
      lastName: 'Pérez García',
      email: 'ana.perez@email.com',
      phone: '+52 55 1234-5679',
      documentType: DocumentType.CURP,
      documentNumber: 'PEGA900520MDFRNN08',
      type: ResidentType.FAMILY_MEMBER,
      condominiumId: '1',
      condominiumName: 'Torres del Parque',
      buildingId: 'bld-001',
      buildingName: 'Torre A',
      unitId: 'U-101',
      unitNumber: '101',
      isResponsible: false,
      isAdministrator: false,
      canReceiveNotifications: true, // Puede recibir notificaciones
      relationship: 'Esposa',
      moveInDate: new Date('2020-03-15'),
      isActive: true,
      totalDebt: 0,
      paymentHistory: 0,
      averagePaymentDelay: 0,
      createdAt: new Date('2020-03-15'),
      updatedAt: new Date('2025-10-15'),
    },
    {
      id: 'R-001-02',
      firstName: 'Carlos Andrés',
      lastName: 'Pérez García',
      email: '',
      phone: '',
      documentType: DocumentType.CURP,
      documentNumber: 'PEGC150812HDFRNN07',
      type: ResidentType.FAMILY_MEMBER,
      condominiumId: '1',
      condominiumName: 'Torres del Parque',
      buildingId: 'bld-001',
      buildingName: 'Torre A',
      unitId: 'U-101',
      unitNumber: '101',
      isResponsible: false,
      isAdministrator: false,
      canReceiveNotifications: false,
      relationship: 'Hijo',
      moveInDate: new Date('2020-03-15'),
      isActive: true,
      totalDebt: 0,
      paymentHistory: 0,
      averagePaymentDelay: 0,
      createdAt: new Date('2020-03-15'),
      updatedAt: new Date('2025-10-15'),
    },
    
    // Unidad U-102 - María García (Dueña sola)
    {
      id: 'R-002',
      firstName: 'María Guadalupe',
      lastName: 'García Martínez',
      email: 'maria.garcia@email.com',
      phone: '+52 55 2345-6789',
      documentType: DocumentType.CURP,
      documentNumber: 'GAMG920620MDFRRL03',
      type: ResidentType.OWNER,
      condominiumId: '1',
      condominiumName: 'Torres del Parque',
      buildingId: 'bld-001',
      buildingName: 'Torre A',
      unitId: 'U-102',
      unitNumber: '102',
      isResponsible: true,
      isAdministrator: false,
      canReceiveNotifications: true,
      moveInDate: new Date('2019-06-20'),
      isActive: true,
      emergencyContactName: 'Carlos García',
      emergencyContactPhone: '+52 55 8765-4321',
      totalDebt: 31500,
      paymentHistory: 62,
      averagePaymentDelay: 5,
      createdAt: new Date('2019-06-20'),
      updatedAt: new Date('2025-10-20'),
    },
    
    // Unidad U-201 - Carlos Rodríguez (Dueño)
    {
      id: 'R-003',
      firstName: 'Carlos Alberto',
      lastName: 'Rodríguez López',
      email: 'carlos.rodriguez@email.com',
      phone: '+52 55 3456-7890',
      documentType: DocumentType.RFC,
      documentNumber: 'ROLC880112ABC',
      type: ResidentType.OWNER,
      condominiumId: '2',
      condominiumName: 'Privadas del Sol',
      buildingId: 'bld-002',
      buildingName: 'Privada Norte',
      unitId: 'U-201',
      unitNumber: '201',
      isResponsible: true,
      isAdministrator: true, // Es administrador
      canReceiveNotifications: true,
      moveInDate: new Date('2021-01-10'),
      isActive: true,
      emergencyContactName: 'Ana Rodríguez',
      emergencyContactPhone: '+52 55 7654-3210',
      totalDebt: 0,
      paymentHistory: 40,
      averagePaymentDelay: 0,
      createdAt: new Date('2021-01-10'),
      updatedAt: new Date('2025-10-10'),
    },
    
    // Unidad U-305 - Ana Martínez (Inquilina principal)
    {
      id: 'R-004',
      firstName: 'Ana Patricia',
      lastName: 'Martínez Hernández',
      email: 'ana.martinez@email.com',
      phone: '+52 55 4567-8901',
      documentType: DocumentType.INE,
      documentNumber: '1234567890123',
      type: ResidentType.TENANT,
      condominiumId: '3',
      condominiumName: 'Conjunto Residencial Las Flores',
      buildingId: 'bld-003',
      buildingName: 'Calle Las Rosas',
      unitId: 'U-305',
      unitNumber: '305',
      isResponsible: true,
      isAdministrator: false,
      canReceiveNotifications: true,
      moveInDate: new Date('2025-10-01'),
      isActive: true,
      emergencyContactName: 'Luis Martínez',
      emergencyContactPhone: '+52 55 6543-2109',
      totalDebt: 0,
      paymentHistory: 1,
      averagePaymentDelay: 0,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-15'),
    }
  ];

  /**
   * Simulates AWS Lambda GET request to fetch all residents
   * Backend: GET /residents - Returns { success, message, data: { residents: [], count } }
   * Supports filters: ?unitId=xxx&type=xxx&documentNumber=xxx
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
      message: 'Residentes obtenidos exitosamente',
      data: response,
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Get residents by unit ID
   */
  getResidentsByUnit(unitId: string): Observable<ApiResponse<UnitResidents>> {
    const residents = this.mockResidents.filter(r => r.unitId === unitId);
    const responsible = residents.find(r => r.isResponsible);
    
    if (residents.length === 0) {
      return of({
        success: false,
        error: {
          code: 'UNIT_NOT_FOUND',
          message: 'No se encontraron residentes para esta unidad'
        },
        timestamp: new Date()
      }).pipe(delay(200));
    }

    const unitResidents: UnitResidents = {
      unitId,
      unitNumber: residents[0].unitNumber || '',
      buildingName: residents[0].buildingName || '',
      responsible,
      residents,
      totalDebt: responsible?.totalDebt || 0
    };

    return of({
      success: true,
      data: unitResidents,
      message: 'Residentes de la unidad obtenidos exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 200));
  }

  /**
   * Create new resident
   * Backend: POST /units/{unitId}/residents - Returns { success, message, data: created resident }
   * Adds resident to Unit's residentsId array automatically
   */
  createResident(residentData: CreateResidentDto): Observable<ApiResponse<Resident>> {
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
      buildingId: residentData.buildingId,
      unitId: residentData.unitId,
      isResponsible: residentData.isResponsible || false,
      isAdministrator: residentData.isAdministrator || false,
      canReceiveNotifications: residentData.canReceiveNotifications !== undefined ? residentData.canReceiveNotifications : true,
      moveInDate: residentData.moveInDate,
      isActive: true,
      emergencyContactName: residentData.emergencyContactName,
      emergencyContactPhone: residentData.emergencyContactPhone,
      relationship: residentData.relationship,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to mock data
    this.mockResidents.push({
      ...newResident,
      condominiumName: '', // This would be populated from condominium service
      unitNumber: '', // This would be populated from unit service
      buildingName: '', // This would be populated from building service
      totalDebt: 0,
      paymentHistory: 0,
      averagePaymentDelay: 0,
    });

    return of({
      success: true,
      message: 'Residente creado exitosamente',
      data: newResident,
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 700 + 500));
  }

  /**
   * Update resident
   * Backend: PUT /residents/{id} - Returns { success, message, data: updated resident }
   */
  updateResident(id: string, updates: UpdateResidentDto): Observable<ApiResponse<ResidentDetails>> {
    const residentIndex = this.mockResidents.findIndex((r) => r.id === id);

    if (residentIndex === -1) {
      return of({
        success: false,
        message: 'Resident not found',
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
      message: 'Residente actualizado exitosamente',
      data: updated,
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 600 + 400));
  }

  /**
   * Deactivate resident
   */
  deactivateResident(id: string): Observable<ApiResponse<void>> {
    const residentIndex = this.mockResidents.findIndex((r) => r.id === id);

    if (residentIndex === -1) {
      return of({
        success: false,
        message: 'Resident not found',
        error: {
          code: 'RESIDENT_NOT_FOUND',
          message: 'Residente no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    this.mockResidents[residentIndex].isActive = false;
    this.mockResidents[residentIndex].updatedAt = new Date();

    return of({
      success: true,
      message: 'Residente desactivado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Delete resident (hard delete)
   * Backend: DELETE /residents/{id} - Returns { success, message, data: {} }
   * Also removes resident from unit's residentsId array
   */
  deleteResident(id: string): Observable<ApiResponse<void>> {
    const index = this.mockResidents.findIndex((r) => r.id === id);

    if (index === -1) {
      return of({
        success: false,
        message: 'Resident not found',
        error: {
          code: 'RESIDENT_NOT_FOUND',
          message: 'Residente no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    this.mockResidents.splice(index, 1);

    return of({
      success: true,
      message: 'Residente eliminado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }
}
import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { 
  Provider, 
  ProviderDetails, 
  ProviderCategory,
  CreateProviderDto,
  UpdateProviderDto,
  ProviderStatistics
} from '../models/provider.model';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
  // Simulated AWS Lambda endpoint
  private readonly lambdaEndpoint = 'https://api.example.com/providers';

  // Mock data - simulating MongoDB collection
  private mockProviders: ProviderDetails[] = [
    {
      id: 'P-001',
      businessName: 'Servicios de Limpieza Integral S.A. de C.V.',
      tradeName: 'Limpieza Total MX',
      rfc: 'SLI850315ABC',
      category: ProviderCategory.CLEANING,
      address: 'Av. Insurgentes Sur 1234',
      city: 'Ciudad de México',
      country: 'México',
      contactName: 'Rosa María Hernández',
      email: 'contacto@limpiezatotal.mx',
      phone: '+52 55 1234-5678',
      mobile: '+52 55 9876-5432',
      website: 'www.limpiezatotal.mx',
      bankName: 'BBVA México',
      bankAccount: '0123456789',
      clabe: '012180001234567890',
      isActive: true,
      rating: 4.5,
      notes: 'Excelente servicio de limpieza profunda',
      condominiums: ['1', '2', '3'],
      totalContracts: 36,
      totalInvoiced: 850000,
      averageRating: 4.5,
      lastContractDate: new Date('2025-10-01'),
      createdAt: new Date('2020-01-15'),
      updatedAt: new Date('2025-10-15'),
    },
    {
      id: 'P-002',
      businessName: 'Seguridad Privada Guardián S.A. de C.V.',
      tradeName: 'Guardián Security',
      rfc: 'SPG920620XYZ',
      category: ProviderCategory.SECURITY,
      address: 'Calzada de Tlalpan 890',
      city: 'Ciudad de México',
      country: 'México',
      contactName: 'Carlos Alberto Ramírez',
      email: 'ventas@guardian.com.mx',
      phone: '+52 55 2345-6789',
      mobile: '+52 55 8765-4321',
      website: 'www.guardian.com.mx',
      bankName: 'Banorte',
      bankAccount: '9876543210',
      clabe: '072180009876543210',
      isActive: true,
      rating: 5,
      notes: 'Personal altamente capacitado y confiable',
      condominiums: ['1', '2'],
      totalContracts: 24,
      totalInvoiced: 2400000,
      averageRating: 5,
      lastContractDate: new Date('2025-10-10'),
      createdAt: new Date('2019-06-20'),
      updatedAt: new Date('2025-10-20'),
    },
    {
      id: 'P-003',
      businessName: 'Mantenimiento y Reparaciones Técnicas S. de R.L.',
      tradeName: 'Técnicos MR',
      rfc: 'MRT010725LMN',
      category: ProviderCategory.MAINTENANCE,
      address: 'Av. Industrial 567, Col. Narvarte',
      city: 'Ciudad de México',
      country: 'México',
      contactName: 'Miguel Ángel Torres',
      email: 'servicios@tecnicosmr.mx',
      phone: '+52 55 3456-7890',
      mobile: '+52 55 7654-3210',
      isActive: true,
      rating: 4,
      notes: 'Rápida respuesta en emergencias',
      condominiums: ['1', '3', '4'],
      totalContracts: 48,
      totalInvoiced: 1500000,
      averageRating: 4,
      lastContractDate: new Date('2025-10-05'),
      createdAt: new Date('2021-01-10'),
      updatedAt: new Date('2025-10-10'),
    },
    {
      id: 'P-004',
      businessName: 'Jardinería y Paisajismo Verde Vida S.A. de C.V.',
      tradeName: 'Verde Vida',
      rfc: 'JPV031015OPQ',
      category: ProviderCategory.GARDENING,
      address: 'Calle Reforma 890, Col. Polanco',
      city: 'Ciudad de México',
      country: 'México',
      contactName: 'Patricia Flores Méndez',
      email: 'info@verdevida.mx',
      phone: '+52 55 4567-8901',
      mobile: '+52 55 6543-2109',
      website: 'www.verdevida.mx',
      clabe: '014180005678901234',
      isActive: true,
      rating: 4.8,
      notes: 'Diseños creativos y mantenimiento impecable',
      condominiums: ['2', '3', '5'],
      totalContracts: 30,
      totalInvoiced: 760000,
      averageRating: 4.8,
      lastContractDate: new Date('2025-09-28'),
      createdAt: new Date('2021-03-15'),
      updatedAt: new Date('2025-10-01'),
    },
    {
      id: 'P-005',
      businessName: 'Electricidad Profesional del Valle S.A.',
      tradeName: 'Electro Pro',
      rfc: 'EPV051210RST',
      category: ProviderCategory.ELECTRICAL,
      address: 'Av. Cuauhtémoc 345, Col. Roma',
      city: 'Ciudad de México',
      country: 'México',
      contactName: 'Jorge Luis Vargas',
      email: 'contacto@electropro.mx',
      phone: '+52 55 5678-9012',
      mobile: '+52 55 5432-1098',
      clabe: '002180006789012345',
      isActive: true,
      rating: 4.2,
      notes: 'Certificados y con experiencia en edificios',
      condominiums: ['1', '4'],
      totalContracts: 18,
      totalInvoiced: 1040000,
      averageRating: 4.2,
      lastContractDate: new Date('2025-09-15'),
      createdAt: new Date('2020-05-20'),
      updatedAt: new Date('2025-10-05'),
    },
    {
      id: 'P-006',
      businessName: 'Plomería e Instalaciones Águila S. de R.L.',
      tradeName: 'Plomería Águila',
      rfc: 'PIA080920UVW',
      category: ProviderCategory.PLUMBING,
      address: 'Calle Hidalgo 123, Col. Centro',
      city: 'Ciudad de México',
      country: 'México',
      contactName: 'Luis Fernando Águila',
      email: 'servicios@plomeriaaguila.mx',
      phone: '+52 55 6789-0123',
      mobile: '+52 55 4321-0987',
      isActive: true,
      rating: 3.8,
      notes: 'Atención 24/7 para emergencias',
      condominiums: ['1', '2', '3', '5'],
      totalContracts: 42,
      totalInvoiced: 960000,
      averageRating: 3.8,
      lastContractDate: new Date('2025-10-12'),
      createdAt: new Date('2019-08-10'),
      updatedAt: new Date('2025-10-18'),
    },
    {
      id: 'P-007',
      businessName: 'Pinturas y Acabados Colormax S.A. de C.V.',
      tradeName: 'Colormax',
      rfc: 'PAC140225XYZ',
      category: ProviderCategory.PAINTING,
      address: 'Av. Revolución 678, Col. San Ángel',
      city: 'Ciudad de México',
      country: 'México',
      contactName: 'Fernando Colores García',
      email: 'ventas@colormax.mx',
      phone: '+52 55 7890-1234',
      mobile: '+52 55 3210-9876',
      website: 'www.colormax.mx',
      isActive: true,
      rating: 4.6,
      notes: 'Pintura ecológica y duradera',
      condominiums: ['2', '4'],
      totalContracts: 15,
      totalInvoiced: 560000,
      averageRating: 4.6,
      lastContractDate: new Date('2025-09-01'),
      createdAt: new Date('2022-02-14'),
      updatedAt: new Date('2025-09-20'),
    },
    {
      id: 'P-008',
      businessName: 'Suministros Industriales del Norte S.A. de C.V.',
      tradeName: 'Suministros Norte',
      rfc: 'SIN101105ABC',
      category: ProviderCategory.SUPPLIES,
      address: 'Blvd. Manuel Ávila Camacho 234',
      city: 'Monterrey',
      country: 'México',
      contactName: 'Ana Laura Suárez',
      email: 'ventas@suministrosnorte.mx',
      phone: '+52 81 8901-2345',
      mobile: '+52 81 2109-8765',
      isActive: true,
      rating: 4.3,
      notes: 'Amplio stock y entregas rápidas',
      condominiums: ['1', '3', '5'],
      totalContracts: 60,
      totalInvoiced: 1900000,
      averageRating: 4.3,
      lastContractDate: new Date('2025-10-20'),
      createdAt: new Date('2020-11-05'),
      updatedAt: new Date('2025-10-22'),
    },
    {
      id: 'P-009',
      businessName: 'Bufete Jurídico Ramírez y Asociados S.C.',
      tradeName: 'Ramírez Abogados',
      rfc: 'BJR030320DEF',
      category: ProviderCategory.LEGAL,
      address: 'Paseo de la Reforma 456, Col. Juárez',
      city: 'Ciudad de México',
      country: 'México',
      contactName: 'Lic. Roberto Ramírez Ortega',
      email: 'contacto@ramirezabogados.mx',
      phone: '+52 55 9012-3456',
      mobile: '+52 55 1098-7654',
      website: 'www.ramirezabogados.mx',
      isActive: true,
      rating: 5,
      notes: 'Especialistas en derecho inmobiliario',
      condominiums: ['1', '2'],
      totalContracts: 12,
      totalInvoiced: 1300000,
      averageRating: 5,
      lastContractDate: new Date('2025-08-15'),
      createdAt: new Date('2018-03-20'),
      updatedAt: new Date('2025-09-10'),
    },
    {
      id: 'P-010',
      businessName: 'Contadores y Auditores Asociados S.C.',
      tradeName: 'CAA Contadores',
      rfc: 'CAA070701GHI',
      category: ProviderCategory.ACCOUNTING,
      address: 'Av. Patriotismo 789, Col. Mixcoac',
      city: 'Ciudad de México',
      country: 'México',
      contactName: 'C.P. Elena Mora López',
      email: 'info@caacontadores.mx',
      phone: '+52 55 0123-4567',
      mobile: '+52 55 9876-5430',
      isActive: false,
      rating: 3.5,
      notes: 'Servicio discontinuado por cambio de personal',
      condominiums: ['3'],
      totalContracts: 8,
      totalInvoiced: 640000,
      averageRating: 3.5,
      lastContractDate: new Date('2025-06-30'),
      createdAt: new Date('2021-07-01'),
      updatedAt: new Date('2025-07-15'),
    },
  ];

  /**
   * Simulates AWS Lambda GET request to fetch all providers
   * Lambda: getProviders
   */
  getProviders(
    params?: PaginationParams & { category?: ProviderCategory; isActive?: boolean; search?: string }
  ): Observable<ApiResponse<PaginatedResponse<ProviderDetails>>> {
    let filtered = [...this.mockProviders];

    // Filter by category
    if (params?.category) {
      filtered = filtered.filter((p) => p.category === params.category);
    }

    // Filter by active status
    if (params?.isActive !== undefined) {
      filtered = filtered.filter((p) => p.isActive === params.isActive);
    }

    // Search filter
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.businessName.toLowerCase().includes(search) ||
          p.tradeName?.toLowerCase().includes(search) ||
          p.rfc.includes(search) ||
          p.contactName.toLowerCase().includes(search) ||
          p.email.toLowerCase().includes(search)
      );
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    const response: PaginatedResponse<ProviderDetails> = {
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
      message: 'Proveedores obtenidos exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch single provider
   * Lambda: getProviderById
   */
  getProviderById(id: string): Observable<ApiResponse<ProviderDetails>> {
    const provider = this.mockProviders.find((p) => p.id === id);

    if (!provider) {
      return of({
        success: false,
        error: {
          code: 'PROVIDER_NOT_FOUND',
          message: 'Proveedor no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    return of({
      success: true,
      data: provider,
      message: 'Proveedor obtenido exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 200));
  }

  /**
   * Simulates AWS Lambda POST request to create provider
   * Lambda: createProvider
   */
  createProvider(providerData: CreateProviderDto): Observable<ApiResponse<Provider>> {
    const newProvider: Provider = {
      id: `P-${String(Date.now()).slice(-6)}`,
      businessName: providerData.businessName,
      tradeName: providerData.tradeName,
      rfc: providerData.rfc,
      category: providerData.category,
      address: providerData.address,
      city: providerData.city,
      country: providerData.country,
      contactName: providerData.contactName,
      email: providerData.email,
      phone: providerData.phone,
      mobile: providerData.mobile,
      website: providerData.website,
      bankName: providerData.bankName,
      bankAccount: providerData.bankAccount,
      clabe: providerData.clabe,
      isActive: true,
      rating: providerData.rating,
      notes: providerData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to mock data
    this.mockProviders.push({
      ...newProvider,
      condominiums: [],
      totalContracts: 0,
      totalInvoiced: 0,
      averageRating: providerData.rating || 0,
    });

    return of({
      success: true,
      data: newProvider,
      message: 'Proveedor creado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 700 + 500));
  }

  /**
   * Simulates AWS Lambda PUT request to update provider
   * Lambda: updateProvider
   */
  updateProvider(
    id: string,
    updates: UpdateProviderDto
  ): Observable<ApiResponse<ProviderDetails>> {
    const providerIndex = this.mockProviders.findIndex((p) => p.id === id);

    if (providerIndex === -1) {
      return of({
        success: false,
        error: {
          code: 'PROVIDER_NOT_FOUND',
          message: 'Proveedor no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    const updated: ProviderDetails = {
      ...this.mockProviders[providerIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.mockProviders[providerIndex] = updated;

    return of({
      success: true,
      data: updated,
      message: 'Proveedor actualizado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 600 + 400));
  }

  /**
   * Simulates AWS Lambda DELETE request to deactivate provider
   * Lambda: deactivateProvider
   */
  deactivateProvider(id: string): Observable<ApiResponse<void>> {
    const provider = this.mockProviders.find((p) => p.id === id);

    if (!provider) {
      return of({
        success: false,
        error: {
          code: 'PROVIDER_NOT_FOUND',
          message: 'Proveedor no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    provider.isActive = false;
    provider.updatedAt = new Date();

    return of({
      success: true,
      message: 'Proveedor desactivado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda DELETE request to activate provider
   * Lambda: activateProvider
   */
  activateProvider(id: string): Observable<ApiResponse<void>> {
    const provider = this.mockProviders.find((p) => p.id === id);

    if (!provider) {
      return of({
        success: false,
        error: {
          code: 'PROVIDER_NOT_FOUND',
          message: 'Proveedor no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    provider.isActive = true;
    provider.updatedAt = new Date();

    return of({
      success: true,
      message: 'Proveedor activado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch provider statistics
   * Lambda: getProviderStats
   */
  getProviderStats(): Observable<ApiResponse<ProviderStatistics>> {
    const providers = [...this.mockProviders];

    const byCategory: Record<string, number> = {};
    providers.forEach((p) => {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    });

    const totalRating = providers.reduce((sum, p) => sum + (p.rating || 0), 0);
    const topProviders = providers
      .filter(p => p.isActive)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    const stats: ProviderStatistics = {
      total: providers.length,
      byCategory: byCategory as Record<ProviderCategory, number>,
      totalActive: providers.filter(p => p.isActive).length,
      totalInactive: providers.filter(p => !p.isActive).length,
      averageRating: providers.length > 0 ? totalRating / providers.length : 0,
      topProviders,
    };

    return of({
      success: true,
      data: stats,
      message: 'Estadísticas de proveedores obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch providers by category
   * Lambda: getProvidersByCategory
   */
  getProvidersByCategory(
    category: ProviderCategory
  ): Observable<ApiResponse<ProviderDetails[]>> {
    const providers = this.mockProviders.filter((p) => p.category === category && p.isActive);

    return of({
      success: true,
      data: providers,
      message: 'Proveedores obtenidos exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 300));
  }
}

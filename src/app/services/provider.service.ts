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
      businessName: 'Servicios de Limpieza Total S.A.C.',
      tradeName: 'Limpieza Total',
      ruc: '20123456789',
      category: ProviderCategory.CLEANING,
      address: 'Av. Los Empresarios 245',
      city: 'Lima',
      country: 'Perú',
      contactName: 'Rosa Méndez',
      email: 'contacto@limpiezatotal.com',
      phone: '+51 1 234-5678',
      mobile: '+51 987 654 321',
      website: 'www.limpiezatotal.com',
      bankName: 'Banco de Crédito del Perú',
      bankAccount: '191-1234567-0-89',
      isActive: true,
      rating: 4.5,
      notes: 'Excelente servicio de limpieza profunda',
      condominiums: ['1', '2', '3'],
      totalContracts: 36,
      totalInvoiced: 45000,
      averageRating: 4.5,
      lastContractDate: new Date('2025-10-01'),
      createdAt: new Date('2020-01-15'),
      updatedAt: new Date('2025-10-15'),
    },
    {
      id: 'P-002',
      businessName: 'Seguridad Privada Guardián S.A.',
      tradeName: 'Guardián Security',
      ruc: '20234567890',
      category: ProviderCategory.SECURITY,
      address: 'Jr. Seguridad 180',
      city: 'Lima',
      country: 'Perú',
      contactName: 'Carlos Ramos',
      email: 'ventas@guardian.com.pe',
      phone: '+51 1 345-6789',
      mobile: '+51 998 765 432',
      website: 'www.guardian.com.pe',
      bankName: 'Interbank',
      bankAccount: '200-9876543-2-10',
      isActive: true,
      rating: 5,
      notes: 'Personal altamente capacitado y confiable',
      condominiums: ['1', '2'],
      totalContracts: 24,
      totalInvoiced: 120000,
      averageRating: 5,
      lastContractDate: new Date('2025-10-10'),
      createdAt: new Date('2019-06-20'),
      updatedAt: new Date('2025-10-20'),
    },
    {
      id: 'P-003',
      businessName: 'Mantenimiento y Reparaciones Técnicas E.I.R.L.',
      tradeName: 'Técnicos MR',
      ruc: '20345678901',
      category: ProviderCategory.MAINTENANCE,
      address: 'Av. Industrial 567',
      city: 'Lima',
      country: 'Perú',
      contactName: 'Miguel Torres',
      email: 'servicios@tecnicosmr.com',
      phone: '+51 1 456-7890',
      mobile: '+51 987 123 456',
      isActive: true,
      rating: 4,
      notes: 'Rápida respuesta en emergencias',
      condominiums: ['1', '3', '4'],
      totalContracts: 48,
      totalInvoiced: 75000,
      averageRating: 4,
      lastContractDate: new Date('2025-10-05'),
      createdAt: new Date('2021-01-10'),
      updatedAt: new Date('2025-10-10'),
    },
    {
      id: 'P-004',
      businessName: 'Jardinería y Paisajismo Verde Vida S.A.C.',
      tradeName: 'Verde Vida',
      ruc: '20456789012',
      category: ProviderCategory.GARDENING,
      address: 'Calle Los Jardines 890',
      city: 'Lima',
      country: 'Perú',
      contactName: 'Patricia Flores',
      email: 'info@verdevida.pe',
      phone: '+51 1 567-8901',
      mobile: '+51 976 543 210',
      website: 'www.verdevida.pe',
      isActive: true,
      rating: 4.8,
      notes: 'Diseños creativos y mantenimiento impecable',
      condominiums: ['2', '3', '5'],
      totalContracts: 30,
      totalInvoiced: 38000,
      averageRating: 4.8,
      lastContractDate: new Date('2025-09-28'),
      createdAt: new Date('2021-03-15'),
      updatedAt: new Date('2025-10-01'),
    },
    {
      id: 'P-005',
      businessName: 'Electricidad Profesional del Perú S.A.',
      tradeName: 'Electro Pro',
      ruc: '20567890123',
      category: ProviderCategory.ELECTRICAL,
      address: 'Av. Eléctrica 345',
      city: 'Lima',
      country: 'Perú',
      contactName: 'Jorge Vargas',
      email: 'contacto@electropro.pe',
      phone: '+51 1 678-9012',
      mobile: '+51 965 432 109',
      isActive: true,
      rating: 4.2,
      notes: 'Certificados y con experiencia en edificios',
      condominiums: ['1', '4'],
      totalContracts: 18,
      totalInvoiced: 52000,
      averageRating: 4.2,
      lastContractDate: new Date('2025-09-15'),
      createdAt: new Date('2020-05-20'),
      updatedAt: new Date('2025-10-05'),
    },
    {
      id: 'P-006',
      businessName: 'Gasfitería y Plomería Águila S.R.L.',
      tradeName: 'Plomería Águila',
      ruc: '20678901234',
      category: ProviderCategory.PLUMBING,
      address: 'Jr. Instalaciones 123',
      city: 'Lima',
      country: 'Perú',
      contactName: 'Luis Águila',
      email: 'servicios@plomeriaaguila.com',
      phone: '+51 1 789-0123',
      mobile: '+51 954 321 098',
      isActive: true,
      rating: 3.8,
      notes: 'Atención 24/7 para emergencias',
      condominiums: ['1', '2', '3', '5'],
      totalContracts: 42,
      totalInvoiced: 48000,
      averageRating: 3.8,
      lastContractDate: new Date('2025-10-12'),
      createdAt: new Date('2019-08-10'),
      updatedAt: new Date('2025-10-18'),
    },
    {
      id: 'P-007',
      businessName: 'Pinturas y Acabados Colormax S.A.C.',
      tradeName: 'Colormax',
      ruc: '20789012345',
      category: ProviderCategory.PAINTING,
      address: 'Av. Colores 678',
      city: 'Lima',
      country: 'Perú',
      contactName: 'Fernando Colores',
      email: 'ventas@colormax.pe',
      phone: '+51 1 890-1234',
      mobile: '+51 943 210 987',
      website: 'www.colormax.pe',
      isActive: true,
      rating: 4.6,
      notes: 'Pintura ecológica y durader a',
      condominiums: ['2', '4'],
      totalContracts: 15,
      totalInvoiced: 28000,
      averageRating: 4.6,
      lastContractDate: new Date('2025-09-01'),
      createdAt: new Date('2022-02-14'),
      updatedAt: new Date('2025-09-20'),
    },
    {
      id: 'P-008',
      businessName: 'Suministros Industriales del Norte E.I.R.L.',
      tradeName: 'Suministros Norte',
      ruc: '20890123456',
      category: ProviderCategory.SUPPLIES,
      address: 'Av. Proveedores 234',
      city: 'Lima',
      country: 'Perú',
      contactName: 'Ana Suárez',
      email: 'ventas@suministrosnorte.com',
      phone: '+51 1 901-2345',
      mobile: '+51 932 109 876',
      isActive: true,
      rating: 4.3,
      notes: 'Amplio stock y entregas rápidas',
      condominiums: ['1', '3', '5'],
      totalContracts: 60,
      totalInvoiced: 95000,
      averageRating: 4.3,
      lastContractDate: new Date('2025-10-20'),
      createdAt: new Date('2020-11-05'),
      updatedAt: new Date('2025-10-22'),
    },
    {
      id: 'P-009',
      businessName: 'Estudio Jurídico Ramírez & Asociados',
      tradeName: 'Ramírez Abogados',
      ruc: '20901234567',
      category: ProviderCategory.LEGAL,
      address: 'Calle Justicia 456',
      city: 'Lima',
      country: 'Perú',
      contactName: 'Dr. Roberto Ramírez',
      email: 'contacto@ramirezabogados.pe',
      phone: '+51 1 012-3456',
      mobile: '+51 921 098 765',
      website: 'www.ramirezabogados.pe',
      isActive: true,
      rating: 5,
      notes: 'Especialistas en derecho inmobiliario',
      condominiums: ['1', '2'],
      totalContracts: 12,
      totalInvoiced: 65000,
      averageRating: 5,
      lastContractDate: new Date('2025-08-15'),
      createdAt: new Date('2018-03-20'),
      updatedAt: new Date('2025-09-10'),
    },
    {
      id: 'P-010',
      businessName: 'Contadores y Auditores Asociados S.A.C.',
      tradeName: 'CAA Contadores',
      ruc: '21012345678',
      category: ProviderCategory.ACCOUNTING,
      address: 'Jr. Contabilidad 789',
      city: 'Lima',
      country: 'Perú',
      contactName: 'Lic. Elena Mora',
      email: 'info@caacontadores.com',
      phone: '+51 1 123-4567',
      mobile: '+51 910 987 654',
      isActive: false,
      rating: 3.5,
      notes: 'Servicio discontinuado por cambio de personal',
      condominiums: ['3'],
      totalContracts: 8,
      totalInvoiced: 32000,
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
          p.ruc.includes(search) ||
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
      ruc: providerData.ruc,
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

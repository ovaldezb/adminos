import { Injectable, signal } from '@angular/core';
import { 
  FundType, 
  FundTypeDetails, 
  FundCategory, 
  FundTypeColor,
  CreateFundTypeDto, 
  UpdateFundTypeDto 
} from '../models/fund-type.model';
import { ApiResponse, PaginatedResponse } from '../models/api.model';

@Injectable({
  providedIn: 'root'
})
export class FundTypeService {
  private readonly fundTypes = signal<FundTypeDetails[]>([]);
  
  // Mock data for development
  private mockFundTypes: FundTypeDetails[] = [
    {
      id: '1',
      name: 'Mantenimiento Ordinario',
      description: 'Cuota mensual de mantenimiento para gastos comunes',
      code: 'MANT',
      category: FundCategory.MAINTENANCE,
      isRecurring: true,
      defaultAmount: 1500,
      isActive: true,
      color: FundTypeColor.PRIMARY,
      icon: 'ri-tools-line',
      priority: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      name: 'Fondo de Reserva',
      description: 'Fondo para reparaciones mayores y emergencias',
      code: 'RES',
      category: FundCategory.RESERVE,
      isRecurring: true,
      defaultAmount: 500,
      isActive: true,
      color: FundTypeColor.SECONDARY,
      icon: 'ri-safe-2-line',
      priority: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '3',
      name: 'Seguridad',
      description: 'Pago de vigilancia y sistemas de seguridad',
      code: 'SEG',
      category: FundCategory.SECURITY,
      isRecurring: true,
      defaultAmount: 800,
      isActive: true,
      color: FundTypeColor.ERROR,
      icon: 'ri-shield-check-line',
      priority: 3,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '4',
      name: 'Limpieza',
      description: 'Servicios de limpieza de áreas comunes',
      code: 'LIMP',
      category: FundCategory.CLEANING,
      isRecurring: true,
      defaultAmount: 400,
      isActive: true,
      color: FundTypeColor.SUCCESS,
      icon: 'ri-sparkles-line',
      priority: 4,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '5',
      name: 'Jardinería',
      description: 'Mantenimiento de jardines y áreas verdes',
      code: 'JARD',
      category: FundCategory.GARDEN,
      isRecurring: true,
      defaultAmount: 300,
      isActive: true,
      color: FundTypeColor.SUCCESS,
      icon: 'ri-plant-line',
      priority: 5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '6',
      name: 'Servicios (Agua/Luz)',
      description: 'Servicios de agua y electricidad de áreas comunes',
      code: 'SERV',
      category: FundCategory.UTILITIES,
      isRecurring: true,
      defaultAmount: 600,
      isActive: true,
      color: FundTypeColor.INFO,
      icon: 'ri-flashlight-line',
      priority: 6,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '7',
      name: 'Gastos Extraordinarios',
      description: 'Gastos no previstos o especiales',
      code: 'EXT',
      category: FundCategory.EXTRAORDINARY,
      isRecurring: false,
      isActive: true,
      color: FundTypeColor.WARNING,
      icon: 'ri-error-warning-line',
      priority: 7,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '8',
      name: 'Seguro del Edificio',
      description: 'Prima anual del seguro contra daños',
      code: 'INSUR',
      category: FundCategory.INSURANCE,
      isRecurring: true,
      defaultAmount: 200,
      isActive: true,
      color: FundTypeColor.NEUTRAL,
      icon: 'ri-shield-star-line',
      priority: 8,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  constructor() {}

  // Get all fund types with optional filters
  async getFundTypes(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: FundCategory;
    isActive?: boolean;
    condominiumId?: string;
    buildingId?: string;
  }): Promise<ApiResponse<PaginatedResponse<FundTypeDetails>>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...this.mockFundTypes];
    
    if (params?.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(term) || 
        f.code.toLowerCase().includes(term) ||
        f.description.toLowerCase().includes(term)
      );
    }
    
    if (params?.category) {
      filtered = filtered.filter(f => f.category === params.category);
    }
    
    if (params?.isActive !== undefined) {
      filtered = filtered.filter(f => f.isActive === params.isActive);
    }
    
    // Sort by priority
    filtered.sort((a, b) => a.priority - b.priority);
    
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const paginatedData = filtered.slice(start, start + limit);
    
    this.fundTypes.set(filtered);
    
    return {
      success: true,
      message: 'Tipos de fondo obtenidos correctamente',
      timestamp: new Date(),
      data: {
        items: paginatedData,
        total: filtered.length,
        page,
        pageSize: limit,
        totalPages: Math.ceil(filtered.length / limit),
        hasNext: page < Math.ceil(filtered.length / limit),
        hasPrevious: page > 1
      }
    };
  }

  // Get fund type by ID
  async getFundTypeById(id: string): Promise<ApiResponse<FundTypeDetails>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const fundType = this.mockFundTypes.find(f => f.id === id);
    
    if (!fundType) {
      return {
        success: false,
        message: 'Tipo de fondo no encontrado',
        timestamp: new Date()
      };
    }
    
    return {
      success: true,
      message: 'Tipo de fondo obtenido correctamente',
      timestamp: new Date(),
      data: fundType
    };
  }

  // Create fund type
  async createFundType(dto: CreateFundTypeDto): Promise<ApiResponse<FundType>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check for duplicate code
    if (this.mockFundTypes.some(f => f.code === dto.code)) {
      return {
        success: false,
        message: 'Ya existe un tipo de fondo con ese código',
        timestamp: new Date()
      };
    }
    
    const newFundType: FundTypeDetails = {
      id: String(this.mockFundTypes.length + 1),
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.mockFundTypes.push(newFundType);
    
    return {
      success: true,
      message: 'Tipo de fondo creado correctamente',
      timestamp: new Date(),
      data: newFundType
    };
  }

  // Update fund type
  async updateFundType(id: string, dto: UpdateFundTypeDto): Promise<ApiResponse<FundType>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = this.mockFundTypes.findIndex(f => f.id === id);
    
    if (index === -1) {
      return {
        success: false,
        message: 'Tipo de fondo no encontrado',
        timestamp: new Date()
      };
    }
    
    // Check for duplicate code if updating code
    if (dto.code && this.mockFundTypes.some(f => f.code === dto.code && f.id !== id)) {
      return {
        success: false,
        message: 'Ya existe un tipo de fondo con ese código',
        timestamp: new Date()
      };
    }
    
    this.mockFundTypes[index] = {
      ...this.mockFundTypes[index],
      ...dto,
      updatedAt: new Date()
    };
    
    return {
      success: true,
      message: 'Tipo de fondo actualizado correctamente',
      timestamp: new Date(),
      data: this.mockFundTypes[index]
    };
  }

  // Delete fund type
  async deleteFundType(id: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = this.mockFundTypes.findIndex(f => f.id === id);
    
    if (index === -1) {
      return {
        success: false,
        message: 'Tipo de fondo no encontrado',
        timestamp: new Date()
      };
    }
    
    this.mockFundTypes.splice(index, 1);
    
    return {
      success: true,
      message: 'Tipo de fondo eliminado correctamente',
      timestamp: new Date()
    };
  }

  // Get category label
  getCategoryLabel(category: FundCategory): string {
    const labels: Record<FundCategory, string> = {
      [FundCategory.MAINTENANCE]: 'Mantenimiento',
      [FundCategory.RESERVE]: 'Reserva',
      [FundCategory.EXTRAORDINARY]: 'Extraordinario',
      [FundCategory.IMPROVEMENT]: 'Mejoras',
      [FundCategory.INSURANCE]: 'Seguros',
      [FundCategory.UTILITIES]: 'Servicios',
      [FundCategory.SECURITY]: 'Seguridad',
      [FundCategory.CLEANING]: 'Limpieza',
      [FundCategory.GARDEN]: 'Jardinería',
      [FundCategory.ADMINISTRATION]: 'Administración',
      [FundCategory.OTHER]: 'Otros'
    };
    return labels[category] || category;
  }

  // Get all categories
  getCategories(): { value: FundCategory; label: string }[] {
    return Object.values(FundCategory).map(cat => ({
      value: cat,
      label: this.getCategoryLabel(cat)
    }));
  }

  // Get all colors
  getColors(): { value: FundTypeColor; label: string }[] {
    return [
      { value: FundTypeColor.PRIMARY, label: 'Azul' },
      { value: FundTypeColor.SECONDARY, label: 'Violeta' },
      { value: FundTypeColor.SUCCESS, label: 'Verde' },
      { value: FundTypeColor.WARNING, label: 'Amarillo' },
      { value: FundTypeColor.ERROR, label: 'Rojo' },
      { value: FundTypeColor.INFO, label: 'Celeste' },
      { value: FundTypeColor.NEUTRAL, label: 'Gris' }
    ];
  }
}

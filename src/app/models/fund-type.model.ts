// Fund Type Interface - Tipos de Fondos para Pagos
export interface FundType {
  id: string;
  _id?: string;
  name: string;
  description: string;
  code: string; // Código único para el tipo de fondo (ej: 'MANT', 'RES', 'EXT')
  category: FundCategory;
  isRecurring: boolean; // Si es un cargo recurrente
  defaultAmount?: number; // Monto por defecto si aplica
  isActive: boolean;
  color: FundTypeColor; // Color para identificación visual
  icon: string; // Remix icon name
  condominiumId?: string; // Si aplica solo a un condominio
  buildingId?: string; // Si aplica solo a un edificio
  priority: number; // Orden de prioridad en listas
  createdAt: Date;
  updatedAt: Date;
}

export enum FundCategory {
  MAINTENANCE = 'maintenance', // Mantenimiento ordinario
  RESERVE = 'reserve', // Fondo de reserva
  EXTRAORDINARY = 'extraordinary', // Gastos extraordinarios
  IMPROVEMENT = 'improvement', // Mejoras
  INSURANCE = 'insurance', // Seguros
  UTILITIES = 'utilities', // Servicios (agua, luz, etc)
  SECURITY = 'security', // Seguridad
  CLEANING = 'cleaning', // Limpieza
  GARDEN = 'garden', // Jardinería
  ADMINISTRATION = 'administration', // Administración
  OTHER = 'other' // Otros
}

export enum FundTypeColor {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info',
  NEUTRAL = 'neutral'
}

export interface FundTypeDetails extends FundType {
  condominiumName?: string;
  buildingName?: string;
  totalCollected?: number;
  totalPending?: number;
}

export interface CreateFundTypeDto {
  name: string;
  description: string;
  code: string;
  category: FundCategory;
  isRecurring: boolean;
  defaultAmount?: number;
  isActive: boolean;
  color: FundTypeColor;
  icon: string;
  condominiumId?: string;
  buildingId?: string;
  priority: number;
}

export interface UpdateFundTypeDto extends Partial<CreateFundTypeDto> {}

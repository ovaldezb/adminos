// Provider/Supplier Interface
export interface Provider {
  id: string;
  businessName: string;
  tradeName?: string;
  ruc: string;
  category: ProviderCategory;
  address: string;
  city: string;
  country: string;
  contactName: string;
  email: string;
  phone: string;
  mobile?: string;
  website?: string;
  bankName?: string;
  bankAccount?: string;
  isActive: boolean;
  rating?: number; // 1-5
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProviderCategory {
  CLEANING = 'cleaning',
  SECURITY = 'security',
  MAINTENANCE = 'maintenance',
  GARDENING = 'gardening',
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  PAINTING = 'painting',
  CONSTRUCTION = 'construction',
  SUPPLIES = 'supplies',
  LEGAL = 'legal',
  ACCOUNTING = 'accounting',
  INSURANCE = 'insurance',
  TECHNOLOGY = 'technology',
  OTHER = 'other'
}

export interface ProviderDetails extends Provider {
  condominiums: string[]; // IDs of condominiums this provider serves
  totalContracts: number;
  totalInvoiced: number;
  averageRating: number;
  lastContractDate?: Date;
}

// DTOs for creating/updating providers
export interface CreateProviderDto {
  businessName: string;
  tradeName?: string;
  ruc: string;
  category: ProviderCategory;
  address: string;
  city: string;
  country: string;
  contactName: string;
  email: string;
  phone: string;
  mobile?: string;
  website?: string;
  bankName?: string;
  bankAccount?: string;
  rating?: number;
  notes?: string;
}

export interface UpdateProviderDto extends Partial<CreateProviderDto> {
  isActive?: boolean;
}

// Provider statistics interface
export interface ProviderStatistics {
  total: number;
  byCategory: Record<ProviderCategory, number>;
  totalActive: number;
  totalInactive: number;
  averageRating: number;
  topProviders: ProviderDetails[];
}

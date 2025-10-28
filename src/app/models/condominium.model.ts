// Condominium Interface
export interface Condominium {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  units: number;
  towers: number;
  avatar?: string;
  color: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create Condominium DTO
export interface CreateCondominiumDto {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  description?: string;
}

// Update Condominium DTO
export interface UpdateCondominiumDto extends Partial<CreateCondominiumDto> {
}

// Condominium Statistics
export interface CondominiumStats {
  condominiumId: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  monthlyCollection: number;
  pendingInvoices: number;
  delinquentUnits: number;
  collectionRate: number;
  month: string;
  year: number;
}

// Condominium Details with extended information
export interface CondominiumDetails extends Condominium {
  amenities: string[];
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  bankAccount?: string;
  maintenanceFee: number;
}

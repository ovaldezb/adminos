// Condominium Interface
export interface Condominium {
  id: string;
  name: string;
  address: string;
  units: number;
  towers: number;
  avatar?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
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

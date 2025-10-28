// Unit Interface
export interface Unit {
  id: string;
  condominiumId: string;
  buildingId?: string; // Asociación con edificio/torre/privada
  unitNumber: string;
  tower: string; // Mantiene compatibilidad, pero ahora puede referirse al nombre del building
  floor: number;
  area: number; // m²
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  storageSpaces?: number;
  status: UnitStatus;
  monthlyFee: number;
  propertyType: PropertyType;
  orientation?: string; // Norte, Sur, Este, Oeste
  hasBalcony?: boolean;
  hasGarden?: boolean;
  isFurnished?: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UnitStatus {
  OCCUPIED = 'occupied',
  VACANT = 'vacant',
  UNDER_MAINTENANCE = 'under_maintenance',
  FOR_SALE = 'for_sale',
  FOR_RENT = 'for_rent'
}

export enum PropertyType {
  APARTMENT = 'apartment',
  PENTHOUSE = 'penthouse',
  DUPLEX = 'duplex',
  STUDIO = 'studio',
  LOFT = 'loft',
  TOWNHOUSE = 'townhouse'
}

// Unit with owner/resident information
export interface UnitDetails extends Unit {
  buildingName?: string; // Nombre del edificio asociado
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  residentId?: string;
  residentName?: string;
  residentEmail?: string;
  residentPhone?: string;
  hasDebt: boolean;
  debtAmount: number;
  lastPaymentDate?: Date;
  occupancyStartDate?: Date;
}

// Interface for creating/updating units
export interface CreateUnitDto {
  condominiumId: string;
  buildingId?: string; // Opcional: ID del edificio asociado
  unitNumber: string;
  tower: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  storageSpaces?: number;
  status: UnitStatus;
  monthlyFee: number;
  propertyType: PropertyType;
  orientation?: string;
  hasBalcony?: boolean;
  hasGarden?: boolean;
  isFurnished?: boolean;
  description?: string;
}

export interface UpdateUnitDto extends Partial<CreateUnitDto> {
  ownerId?: string;
  residentId?: string;
}

// Unit statistics interface
export interface UnitStatistics {
  total: number;
  byStatus: Record<UnitStatus, number>;
  byPropertyType: Record<PropertyType, number>;
  totalOccupied: number;
  totalVacant: number;
  occupancyRate: number; // Percentage
  totalArea: number;
  averageArea: number;
  totalMonthlyRevenue: number;
  totalDebt: number;
  unitsWithDebt: number;
}

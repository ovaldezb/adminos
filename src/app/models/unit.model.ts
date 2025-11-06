// Residente de unidad (incluido en Unit)
export interface UnitResident {
  id?: string; // ID del residente (si ya existe en la base de datos)
  name: string;
  phone: string;
  email?: string; // Opcional
  isResident: boolean; // Vive ahí
  isManager: boolean; // Encargado/responsable
  isOwner: boolean; // Dueño (solo vive ahí = false, dueño = true)
}

// Unit Interface
export interface Unit {
  id: string;
  condominiumId: string;
  buildingId?: string; // Asociación con edificio/torre/privada
  towerId?: string; // ID de la torre (si es edificio con torres)
  privateStreetId?: string; // ID de la privada (si es fraccionamiento)
  unitNumber: string;
  tower?: string; // Mantiene compatibilidad (nombre para display)
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
  
  // Información de ocupación
  isOccupied: boolean;
  occupancyStatus: UnitOccupancyStatus;
  residents?: UnitResident[]; // Lista de residentes asociados
  primaryResidentId?: string; // ID del residente principal
  
  createdAt: Date;
  updatedAt: Date;
}

export enum UnitOccupancyStatus {
  VACANT = 'VACANT',
  OWNER_OCCUPIED = 'OWNER_OCCUPIED',
  TENANT_OCCUPIED = 'TENANT_OCCUPIED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE'
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
  condominiumName?: string;
  buildingName?: string; // Nombre del edificio asociado
  towerName?: string; // Nombre de la torre
  privateStreetName?: string; // Nombre de la privada
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
  
  // Residentes completos de la unidad
  residentDetails?: UnitResident[];
}

// Interface for creating/updating units
export interface CreateUnitDto {
  condominiumId: string;
  buildingId?: string; // Opcional: ID del edificio asociado
  towerId?: string; // Opcional: ID de la torre
  privateStreetId?: string; // Opcional: ID de la privada
  unitNumber: string;
  tower?: string;
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
  residents?: UnitResident[]; // Lista de residentes
}

export interface UpdateUnitDto extends Partial<CreateUnitDto> {
  ownerId?: string;
  residentId?: string;
  residents?: UnitResident[]; // Actualización de lista de residentes
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

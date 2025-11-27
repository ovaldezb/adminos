// Building Interface - Edificios, Torres o Privadas
export interface Building {
  id: string;
  _id?: string; // MongoDB ObjectId (opcional, viene del backend)
  condominiumId: string;
  name: string; // Nombre del edificio/torre/privada (ej: "Torre A", "Privada Los Pinos")
  type: BuildingType;
  mainEntranceAddress: string; // Dirección de caseta o acceso principal
  totalUnits: number; // Número de viviendas
  num_floors?: number; // Número de pisos (opcional para privadas)
  hasCommonAreas: boolean; // Si tiene áreas comunes para rentar
  commonAreasDescription?: string; // Descripción de áreas comunes
  commonAreaRentalRate?: number; // Tarifa de renta de áreas comunes (por hora/día)
  status: BuildingStatus;
  yearBuilt?: number;
  parkingSpots?: number;
  elevators?: number;
  securityFeatures?: string[]; // Características de seguridad
  amenities?: string[]; // Amenidades específicas del edificio
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum BuildingType {
  TOWER = 'tower', // Torre
  BUILDING = 'building', // Edificio
  PRIVATE_RESIDENCE = 'private_residence', // Privada de fraccionamiento
  CLUSTER = 'cluster' // Conjunto habitacional
}

export enum BuildingStatus {
  ACTIVE = 'active',
  UNDER_CONSTRUCTION = 'under_construction',
  UNDER_MAINTENANCE = 'under_maintenance',
  INACTIVE = 'inactive'
}

// Building with extended information
export interface BuildingDetails extends Building {
  condominiumName?: string;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number; // Percentage
  monthlyRevenue: number;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
}

// Interface for creating buildings
export interface CreateBuildingDto {
  condominiumId: string;
  name: string;
  type: BuildingType;
  mainEntranceAddress: string;
  totalUnits: number;
  num_floors?: number;
  hasCommonAreas: boolean;
  commonAreasDescription?: string;
  commonAreaRentalRate?: number;
  status: BuildingStatus;
  yearBuilt?: number;
  parkingSpots?: number;
  elevators?: number;
  securityFeatures?: string[];
  amenities?: string[];
  description?: string;
}

// Interface for updating buildings
export interface UpdateBuildingDto extends Partial<CreateBuildingDto> {}

// Building statistics interface
export interface BuildingStatistics {
  total: number;
  byType: Record<BuildingType, number>;
  byStatus: Record<BuildingStatus, number>;
  totalUnits: number;
  totalOccupied: number;
  totalVacant: number;
  averageOccupancyRate: number;
  totalMonthlyRevenue: number;
  withCommonAreas: number;
  totalCommonAreaRevenue: number;
}

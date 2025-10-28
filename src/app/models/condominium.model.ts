// Enums
export enum CondominiumType {
  BUILDING = 'BUILDING',           // Edificio con torres
  RESIDENTIAL_COMPLEX = 'RESIDENTIAL_COMPLEX',  // Fraccionamiento
  GATED_COMMUNITY = 'GATED_COMMUNITY'          // Conjunto habitacional
}

export enum AmenityType {
  POOL = 'POOL',
  GYM = 'GYM',
  PARTY_ROOM = 'PARTY_ROOM',
  PLAYGROUND = 'PLAYGROUND',
  SPORTS_COURT = 'SPORTS_COURT',
  BARBECUE_AREA = 'BARBECUE_AREA',
  COWORKING = 'COWORKING',
  CINEMA = 'CINEMA',
  OTHER = 'OTHER'
}

// Sub-interfaces
export interface Amenity {
  id: string;
  name: string;
  type: AmenityType;
  isRentable: boolean;
  hourlyRate?: number;
  description?: string;
  capacity?: number;
  isActive: boolean;
}

export interface Tower {
  id: string;
  name: string;
  floors: number;
  unitsPerFloor: number;
  totalUnits: number;
}

export interface PrivateStreet {
  id: string;
  name: string;
  totalHouses: number;
}

// Condominium Interface
export interface Condominium {
  id: string;
  name: string;
  type: CondominiumType;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  postalCode?: string;
  country: string;
  
  // Para edificios con torres
  towers?: Tower[];
  
  // Para fraccionamientos/conjuntos
  privateStreets?: PrivateStreet[];
  
  // Amenidades
  amenities?: Amenity[];
  
  // Configuración
  maintenanceFee: number;
  currency: string;
  billingDay: number;
  
  // Metadata
  units?: number; // Mantener para compatibilidad
  totalUnits: number;
  occupiedUnits: number;
  avatar?: string;
  color?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create Condominium DTO
export interface CreateCondominiumDto {
  name: string;
  type: CondominiumType;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Para edificios
  towers?: Omit<Tower, 'id'>[];
  
  // Para fraccionamientos
  privateStreets?: Omit<PrivateStreet, 'id'>[];
  
  // Amenidades
  amenities?: Omit<Amenity, 'id'>[];
  
  maintenanceFee: number;
  currency: string;
  billingDay: number;
  description?: string;
}

// Update Condominium DTO
export interface UpdateCondominiumDto extends Partial<CreateCondominiumDto> {
  isActive?: boolean;
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
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  bankAccount?: string;
}

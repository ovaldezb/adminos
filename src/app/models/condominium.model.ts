// Enums
export enum CondominiumType {
  TOWER = 'TOWER',           // Edificio con torres
  HOUSE = 'HOUSE',           // Fraccionamiento/Casas
  COMPLEX = 'COMPLEX'        // Conjunto habitacional/Complejo
}

export enum CondominiumStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE'
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
  num_floors: number;
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
  id?: string;
  _id?: string;
  name: string;
  type: CondominiumType;

  // Dirección completa (nombres coinciden con lambda)
  streetAddress: string;
  neighborhood: string; // colonia
  city: string;
  zipCode: string;
  state: string;
  country: string;

  // Configuración de pagos (nombres coinciden con lambda)
  conventionalPenalty: number; // Pena convencional
  initialFolioNumber: number; // Folio inicial para facturas/recibos

  // Estados (nombres coinciden con lambda)
  isActive: boolean; // Para bloquear usuarios o funcionalidades
  hasAC: boolean; // Es Asociación Civil

  // Información adicional
  additionalInfo?: string;

  // Referencias y datos relacionados (nombres coinciden con lambda)
  buildingsId: string[]; // IDs de edificios asociados
  buildings: any[]; // Array de edificios (usar Building[] cuando esté definido)
  privateStreets: string[]; // Calles privadas
  amenities: string[]; // Amenidades

  // Timestamps (nombres coinciden con lambda) - REQUERIDOS
  createdAt: Date;
  updatedAt: Date;
  status: CondominiumStatus;

  // Configuración legacy (mantener compatibilidad)
  maintenanceFee?: number;
  currency?: string;
  billingDay?: number;
  paymentDay?: number;
  rfc?: string;
  number?: string;

  // Metadata
  units?: number;
  totalUnits?: number;
  occupiedUnits?: number;
  avatar?: string;
  color?: string;
  description?: string;
  towers?: Tower[];
}

// Create Condominium DTO (nombres coinciden con lambda)
export interface CreateCondominiumDto {
  name: string;
  type: CondominiumType;

  // Dirección (nombres exactos de lambda)
  streetAddress: string;
  neighborhood: string;
  city: string;
  zipCode: string;
  state: string;
  country: string;

  // Configuración (nombres exactos de lambda)
  conventionalPenalty: number;
  initialFolioNumber?: number; // Opcional, default 1

  // Estados (nombres exactos de lambda)
  isActive?: boolean; // Default true
  hasAC?: boolean; // Default false (Asociación Civil)

  // Información adicional
  additionalInfo?: string;

  // Arrays (nombres exactos de lambda)
  buildingsId?: string[];
  buildings?: any[];
  privateStreets?: string[];
  amenities?: string[];

  // Campos que serán generados por el backend (opcionales en el DTO)
  createdAt?: Date;
  updatedAt?: Date;
  status?: CondominiumStatus;

  // Legacy fields para compatibilidad
  towers?: Omit<Tower, 'id'>[];
  maintenanceFee?: number;
  currency?: string;
  billingDay?: number;
  paymentDay?: number;
  rfc?: string;
  number?: string;
  description?: string;
}

// Update Condominium DTO
export interface UpdateCondominiumDto extends Partial<CreateCondominiumDto> { }

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

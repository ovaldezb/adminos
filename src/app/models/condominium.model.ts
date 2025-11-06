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
  
  // Dirección completa
  street: string;
  neighborhood: string; // colonia
  number: string;
  zipCode: string;
  city: string;
  state?: string;
  country?: string;
  
  // Configuración de pagos
  paymentDay: number; // Día de pago (1-31)
  conventionalPenalty: number; // Pena convencional en porcentaje
  initialFolio: number; // Folio inicial para facturas/recibos
  rfc?: string; // Registro Federal de Contribuyentes (opcional)
  
  // Estados
  isActive: boolean; // Para bloquear usuarios o funcionalidades
  hasAC: boolean; // Es Asociación Civil
  
  // Información adicional
  additionalInfo?: string;
  
  // Para edificios con torres
  towers?: Tower[];
  
  // Para fraccionamientos/conjuntos
  privateStreets?: PrivateStreet[];
  
  // Amenidades
  amenities?: Amenity[];
  
  // Configuración legacy (mantener compatibilidad)
  maintenanceFee?: number;
  currency?: string;
  billingDay?: number;
  
  // Metadata
  units?: number; // Mantener para compatibilidad
  totalUnits?: number;
  occupiedUnits?: number;
  avatar?: string;
  color?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create Condominium DTO
export interface CreateCondominiumDto {
  name: string;
  
  // Dirección
  street: string;
  neighborhood: string; // colonia
  number: string;
  zipCode: string;
  city: string;
  state?: string;
  country?: string;
  
  // Configuración de pagos
  paymentDay: number;
  conventionalPenalty: number;
  initialFolio?: number; // Opcional, default 1
  rfc?: string; // Opcional
  
  // Estados
  isActive?: boolean; // Default true
  hasAC?: boolean; // Default false (Asociación Civil)
  
  // Información adicional
  additionalInfo?: string;
  
  // Legacy fields (optional)
  type?: CondominiumType;
  towers?: Omit<Tower, 'id'>[];
  privateStreets?: Omit<PrivateStreet, 'id'>[];
  amenities?: Omit<Amenity, 'id'>[];
  maintenanceFee?: number;
  currency?: string;
  billingDay?: number;
  description?: string;
}

// Update Condominium DTO
export interface UpdateCondominiumDto extends Partial<CreateCondominiumDto> {}

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

// Resident/Owner Interface
export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  type: ResidentType;
  condominiumId: string;
  buildingId?: string; // ID del edificio/torre asociado
  unitId: string;
  isResponsible: boolean; // Indica si es el responsable principal de la unidad
  moveInDate: Date;
  moveOutDate?: Date;
  isActive: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  relationship?: string; // Relación con el responsable (hijo, cónyuge, etc.)
  createdAt: Date;
  updatedAt: Date;
}

export enum ResidentType {
  OWNER = 'owner',           // Propietario/Dueño (responsable principal)
  TENANT = 'tenant',         // Inquilino principal
  FAMILY_MEMBER = 'family',  // Familiar (hijo, cónyuge, etc.)
  COHABITANT = 'cohabitant'  // Habitante (amigo, roomie, etc.)
}

export enum DocumentType {
  CURP = 'curp', // Clave Única de Registro de Población
  RFC = 'rfc', // Registro Federal de Contribuyentes
  INE = 'ine', // Credencial para Votar
  PASSPORT = 'passport',
  FM3 = 'fm3' // Forma Migratoria para extranjeros
}

export interface ResidentDetails extends Resident {
  buildingName?: string; // Nombre del edificio/torre
  unitNumber?: string; // Número de unidad para display
  otherResidents?: Resident[]; // Otros residentes en la misma unidad
  totalDebt: number;
  paymentHistory: number; // Number of payments
  averagePaymentDelay: number; // Days
}

// DTOs for creating/updating residents
export interface CreateResidentDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  type: ResidentType;
  condominiumId: string;
  buildingId?: string; // ID del edificio/torre (se obtiene automáticamente de la unidad seleccionada)
  unitId: string;
  isResponsible: boolean; // Indica si es el responsable principal
  moveInDate: Date;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  relationship?: string; // Relación con el responsable (si no es responsable)
}

export interface UpdateResidentDto extends Partial<CreateResidentDto> {
  moveOutDate?: Date;
  isActive?: boolean;
}

// Interface para obtener residentes por unidad
export interface UnitResidents {
  unitId: string;
  unitNumber: string;
  buildingName: string;
  responsible?: Resident; // Responsable principal
  residents: Resident[]; // Todos los residentes incluyendo el responsable
  totalDebt: number;
}

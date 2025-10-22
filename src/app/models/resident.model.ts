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
  unitId: string;
  moveInDate: Date;
  moveOutDate?: Date;
  isActive: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ResidentType {
  OWNER = 'owner',
  TENANT = 'tenant',
  BOTH = 'both' // Owner who also lives there
}

export enum DocumentType {
  DNI = 'dni',
  PASSPORT = 'passport',
  RUC = 'ruc',
  CE = 'ce' // Carné de Extranjería
}

export interface ResidentDetails extends Resident {
  units: string[]; // If owns multiple units
  totalDebt: number;
  paymentHistory: number; // Number of payments
  averagePaymentDelay: number; // Days
}

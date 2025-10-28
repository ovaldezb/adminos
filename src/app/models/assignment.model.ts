import { CreateBuildingDto } from './building.model';
import { CreateUnitDto } from './unit.model';

// Asignación de Unidad Interface
export interface UnitAssignment {
  id: string;
  unitId: string;
  ownerId: string;
  residentId?: string; // Opcional si el propietario habita
  startDate: Date;
  endDate?: Date; // null si está vigente
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Person Interface - Represents both owners and residents
export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string; // Único
  phone: string;
  type: PersonType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum PersonType {
  OWNER = 'owner',
  RESIDENT = 'resident', 
  BOTH = 'both'
}

// Extended person with assignment information
export interface PersonDetails extends Person {
  assignments?: UnitAssignment[];
  totalUnits?: number;
  activeUnits?: number;
}

// DTOs for creating persons
export interface CreatePersonDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  type: PersonType;
}

export interface UpdatePersonDto extends Partial<CreatePersonDto> {
  isActive?: boolean;
}

// DTOs for unit assignments
export interface CreateUnitAssignmentDto {
  unitId: string;
  ownerId: string;
  residentId?: string;
  startDate: Date;
  notes?: string;
}

export interface UpdateUnitAssignmentDto extends Partial<CreateUnitAssignmentDto> {
  endDate?: Date;
  isActive?: boolean;
}

// Assignment with full details
export interface UnitAssignmentDetails extends UnitAssignment {
  unitNumber?: string;
  buildingName?: string;
  ownerName?: string;
  ownerEmail?: string;
  residentName?: string;
  residentEmail?: string;
}

// Wizard step data interfaces
export interface WizardStep1Data {
  selectedBuildingId?: string;
  newBuilding?: CreateBuildingDto;
  isCreatingBuilding: boolean;
}

export interface WizardStep2Data {
  selectedUnitId?: string;
  newUnit?: CreateUnitDto;
  isCreatingUnit: boolean;
}

export interface WizardStep3Data {
  selectedOwnerId?: string;
  newOwner?: CreatePersonDto;
  isCreatingOwner: boolean;
  selectedResidentId?: string;
  newResident?: CreatePersonDto;
  isCreatingResident: boolean;
  ownerInhabits: boolean; // Si el propietario habita
  assignment: Omit<CreateUnitAssignmentDto, 'unitId' | 'ownerId' | 'residentId'>;
}

// Complete wizard data
export interface WizardData {
  condominiumId: string;
  step1: WizardStep1Data;
  step2: WizardStep2Data;
  step3: WizardStep3Data;
}
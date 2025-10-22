// Unit Interface
export interface Unit {
  id: string;
  condominiumId: string;
  unitNumber: string;
  tower: string;
  floor: number;
  area: number; // m²
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  status: UnitStatus;
  monthlyFee: number;
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

// Unit with owner/resident information
export interface UnitDetails extends Unit {
  ownerId?: string;
  ownerName?: string;
  residentId?: string;
  residentName?: string;
  hasDebt: boolean;
  debtAmount: number;
}

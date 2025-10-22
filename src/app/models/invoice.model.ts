// Invoice Interface
export interface Invoice {
  id: string;
  invoiceNumber: string;
  condominiumId: string;
  unitId: string;
  residentId: string;
  amount: number;
  dueDate: Date;
  issueDate: Date;
  status: InvoiceStatus;
  period: string; // "2025-10"
  description: string;
  items: InvoiceItem[];
  lateFee?: number;
  discount?: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  type: InvoiceItemType;
}

export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIALLY_PAID = 'partially_paid',
  CANCELLED = 'cancelled'
}

export enum InvoiceItemType {
  MAINTENANCE = 'maintenance',
  WATER = 'water',
  GAS = 'gas',
  PARKING = 'parking',
  AMENITIES = 'amenities',
  EXTRAORDINARY = 'extraordinary',
  LATE_FEE = 'late_fee',
  OTHER = 'other'
}

export interface InvoiceWithDetails extends Invoice {
  residentName: string;
  unitNumber: string;
  tower: string;
  daysPastDue: number;
}

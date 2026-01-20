// Payment Interface
export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  condominiumId: string;
  unitId: string;
  residentId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  reference?: string; // Transaction reference
  notes?: string;
  processedBy: string; // Admin user ID
  fundName?: string;
  buildingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Request for registration
export interface AppPaymentRequest {
  residentId: string;
  payments: PaymentDetailRequest[];
  year: number;
}

export interface PaymentDetailRequest {
  paymentDate: Date;
  amount: number;
  reference?: string;
  paymentType: string;
  fundName?: string;
  notes?: string;
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CHECK = 'check',
  MOBILE_PAYMENT = 'mobile_payment',
  OTHER = 'other'
}

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  REFUNDED = 'refunded'
}

export interface PaymentWithDetails extends Payment {
  residentName: string;
  unitNumber: string;
  tower: string;
  invoiceNumber: string;
  invoicePeriod: string;
}

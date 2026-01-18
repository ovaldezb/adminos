export interface MonthlyAmount {
    month: number;
    amount: number;
}

export interface PaymentConfig {
    id?: string;
    buildingId: string;
    paymentYear: number;
    monthlyAmounts: MonthlyAmount[];
    createdAt?: string;
    updatedAt?: string;
}

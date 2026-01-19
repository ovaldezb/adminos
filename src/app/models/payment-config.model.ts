export interface MonthlyAmount {
    month: number;
    amount: number;
    title?: string;
}

export interface PaymentConfig {
    id?: string;
    _id?: string;
    buildingId: string;
    paymentYear: number;
    monthlyAmounts: MonthlyAmount[];
    createdAt?: string;
    updatedAt?: string;
}

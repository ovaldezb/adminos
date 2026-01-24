export interface MonthlyAmount {
    month: number;
    amount: number;
    title?: string;
}

export interface PaymentConfig {
    id?: string;
    _id?: string;
    buildingId: string;
    fiscalYear: number;
    anualBudget: number;
    createdAt?: string;
    updatedAt?: string;
}

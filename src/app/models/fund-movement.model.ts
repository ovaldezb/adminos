export interface FundMovementItem {
    fundName: string;
    previousBalance: number;
    incomes: number;
    expenses: number;
    finalBalance: number;
}

export interface FundMovement {
    id?: string;
    buildingId: string;
    fiscalYear: number;
    month: number;
    funds: FundMovementItem[];
    updatedAt?: Date | string;
}

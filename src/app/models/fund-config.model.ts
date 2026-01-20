export interface FundItem {
    fundId: number;
    fundName: string;
}

export interface FundConfig {
    id?: string;
    buildingId: string;
    fiscalYear: number;
    fundList: FundItem[];
    updatedAt?: Date | string;
}

// Cost Center has no real DB table yet. The data itself now lives on the erp-be
// side (PurchaseInvoiceMasterDataService, local-mock-data/cost-centers.json) —
// see CostCenterLookupService. Only the shared type stays here.
export interface MockCostCenter {
    costCenterId: number;
    costCenterCode: string;
    costCenterName: string;
}

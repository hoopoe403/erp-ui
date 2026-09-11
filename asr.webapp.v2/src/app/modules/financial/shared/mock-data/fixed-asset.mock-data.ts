// No real Fixed Asset module exists yet. The placeholder data itself now lives on
// the erp-be side (PurchaseInvoiceMasterDataService, local-mock-data/fixed-assets.json)
// — see FixedAssetLookupService. Only the shared type stays here.
export interface MockFixedAsset {
    fixedAssetId: number;
    assetCode: string;
    assetName: string;
}

// Generic normalized shape fed into <app-lookup-select> when the underlying
// data (GL accounts, fixed assets, VAT groups, ...) needs to share one id/code/name
// contract regardless of its original field names.
export interface LookupOption {
    id: number;
    code: string;
    name: string;
}

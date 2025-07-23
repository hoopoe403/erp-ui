export class Organization {
    organizationId: number;
    organizationCode: string;
    organizationName: string;
    organizationDescription: string;
    isBeneficiary: boolean;
    status: number;
    logo: string;
    languageID?: number;
    clientIP?: string;
    registerUserID?: number;
    registerUserName?: string;
    localChangeDate?: string;
    localChangeTime?: string;
    chaneDate?: string
    branchCount?: number;
    departmentCount?: number;
    description?: string;
}
export class drpOrganization {
    key: number;
    value: string;
    status: number;
}


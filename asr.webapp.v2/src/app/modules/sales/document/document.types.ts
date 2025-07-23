export class RevokeRequest {
    revokeRequestId: number;
    requestId: number;
    requestTypeID: number;
    status: number;
    responseType: number;
    responseDesc: string;
    requestIdList: Array<number>;
}
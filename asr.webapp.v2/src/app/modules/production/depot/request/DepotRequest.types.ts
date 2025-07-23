export class DepotRequest {
    depotMasterId: number;
    depotId: number;
    rowCount: number;
    depotTypeId: number;
    total: number;
    depotCode: string;
    productList: Array<DepotProduct>;
    coverId: number;
    coverName: string;
    regDateTime: Date;
    regLocalDate: Date;
    status: number;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    chaneDate: string;
    statusIds: Array<number>;
}

export class DepotProduct {

    depotMasterId: number;
    depotDetailId: number;
    depotDetailNumber: number;
    rowNumber: number;
    productId: number;
    quantity: number;
    frameCoverId: number;
    frameCoverName: string;
    frameCoverPrice: number;
    controlId: string;

}
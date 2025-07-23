export class ProductSerial {
    productionProgramId: number;
    productId: number;
    productCode: string;
    fullName: string;
    productTypeId: number;
    brandId: number;
    brandName: string;
    deliveryDate: string;
    serial: string;
    frameCoverId: number;
    frameCoverName: string;
    productionDateTime: string;
    productionLocalDate: string;
    productionLocalTime: string;
}

export class ProductSerialUI {
    value: string;
    openingType: string;
    doorType: string;
    panel: string;
    doorHeight: string;
    doorWidth: string;
    doorDirection: string;
    showCover: boolean;
    labelLoop: Array<number>;
    motorDriveKamanLoop: Array<number>;
    showStandard: boolean;
    fullName: string;
    brandId: number;
    brandName: string;
    productCode: string;
    productTypeId: number;
    frameCoverName: string;
    productionLocalDate: string;
}
export interface ProductionProgramDialogConfig {
    productionProgramIdList? : Array <number>;
    serial? : string;
    message?: string;
    icon?: {
        show?: boolean;
        name?: string;
        color?: 'primary';
    };
    actions?: {

        printSerial : {
            show :boolean,
            label : string,
            color : string,
        };
       
        cancel?: {
            show?: boolean;
            label?: string;
        };
    };
    dismissible?: {
        show?: boolean,
    };
}
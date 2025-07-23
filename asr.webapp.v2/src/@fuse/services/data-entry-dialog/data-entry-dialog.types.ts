export interface FuseDataEntryDialogConfig {
    title?: string;
    message?: string;
    formControls?: Array<FuseDataEntryDialogFormControls>
    icon?: {
        show?: boolean;
        name?: string;
        color?: 'primary' | 'accent' | 'warn' | 'basic' | 'info' | 'success' | 'warning' | 'error';
    };
    actions?: {
        confirm?: {
            show?: boolean;
            label?: string;
            color?: 'primary' | 'accent' | 'warn';
        };
        cancel?: {
            show?: boolean;
            label?: string;
        };
    };
    dismissible?: boolean;
}
export interface FuseDataEntryDialogFormControls {
    formControlName: string, index: number, label: string, placeHolder: string,
    type: string, disabled: boolean, value: any
}
export interface ColumnDialogConfig {
    viewId?: number;
    userId?: number;
    columnIdList?: Array<number>;
    title?: string;
    message?: string;
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
            disabled?: false;
        };
        cancel?: {
            show?: boolean;
            label?: string;
        };
    };
    dismissible?: {
        show?: boolean,
        disabled?: boolean,
    };
}

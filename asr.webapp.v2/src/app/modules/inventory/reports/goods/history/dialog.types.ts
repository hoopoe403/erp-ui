
export interface GoodsInventoryHistoryDialogConfig {
    warehouseInventoryId?: number;
    title?: string;
    message?: string;
    icon?: {
        show?: boolean;
        name?: string;
        color?: 'primary' | 'accent' | 'warn' | 'basic' | 'info' | 'success' | 'warning' | 'error';
    };
    actions?: {
        cash?: {
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

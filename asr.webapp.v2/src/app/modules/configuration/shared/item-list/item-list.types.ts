/**
 * Column configuration for the shared item list component
 */
export interface ItemListColumn {
    key: string;                    // Property key to display
    label: string;                  // Column header label
    type?: 'text' | 'badge' | 'primary-badge' | 'custom';  // Display type
    width?: string;                 // Optional column width
    align?: 'left' | 'center' | 'right';  // Text alignment
    badgeConfig?: {                 // Configuration for badge type
        activeValue?: any;          // Value that represents "active"
        activeLabel?: string;       // Label for active state
        inactiveLabel?: string;     // Label for inactive state
    };
    customTemplate?: string;        // Template name for custom rendering
    fallback?: string;              // Fallback value if property is null/undefined
}

/**
 * Action button configuration
 */
export interface ItemListAction {
    icon: string;
    tooltip: string;
    color?: 'primary' | 'accent' | 'warn';
    action: 'edit' | 'delete' | 'primary' | 'custom';
    customAction?: string;          // Custom action identifier
    showCondition?: (item: any, index: number) => boolean;  // Condition to show action
}

/**
 * Configuration for the item list component
 */
export interface ItemListConfig {
    columns: ItemListColumn[];
    actions?: ItemListAction[];
    emptyMessage?: string;
    title?: string;
    showIndex?: boolean;
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ItemListConfig, ItemListColumn, ItemListAction } from './item-list.types';

@Component({
    selector: 'app-item-list',
    templateUrl: './item-list.component.html',
    styles: [`
        .item-list-table {
            width: 100%;
            border-collapse: collapse;
        }
        .item-list-table th {
            background-color: #f3f4f6;
            font-weight: 600;
        }
        :host-context(.dark) .item-list-table th {
            background-color: #1f2937;
        }
        .primary-badge {
            background-color: #4caf50;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
        }
    `]
})
export class ItemListComponent {
    @Input() items: any[] = [];
    @Input() config: ItemListConfig;
    @Input() editingIndex: number | null = null;
    
    @Output() edit = new EventEmitter<number>();
    @Output() delete = new EventEmitter<number>();
    @Output() setPrimary = new EventEmitter<number>();
    @Output() customAction = new EventEmitter<{ action: string, index: number, item: any }>();

    /**
     * Get value from item by key (supports nested keys like 'user.name')
     */
    getValue(item: any, column: ItemListColumn): any {
        const keys = column.key.split('.');
        let value = item;
        for (const key of keys) {
            value = value?.[key];
        }
        return value ?? column.fallback ?? '-';
    }

    /**
     * Check if action should be shown
     */
    shouldShowAction(action: ItemListAction, item: any, index: number): boolean {
        if (action.showCondition) {
            return action.showCondition(item, index);
        }
        return true;
    }

    /**
     * Handle action click
     */
    onActionClick(action: ItemListAction, index: number, item: any): void {
        switch (action.action) {
            case 'edit':
                this.edit.emit(index);
                break;
            case 'delete':
                this.delete.emit(index);
                break;
            case 'primary':
                this.setPrimary.emit(index);
                break;
            case 'custom':
                this.customAction.emit({ 
                    action: action.customAction || action.action, 
                    index, 
                    item 
                });
                break;
        }
    }

    /**
     * Get badge class based on value
     */
    getBadgeClass(item: any, column: ItemListColumn): string {
        const value = this.getValue(item, column);
        const isActive = column.badgeConfig?.activeValue !== undefined 
            ? value === column.badgeConfig.activeValue 
            : !!value;
        
        if (isActive) {
            return 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
        }
        return 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
    }

    /**
     * Get badge label
     */
    getBadgeLabel(item: any, column: ItemListColumn): string {
        const value = this.getValue(item, column);
        const isActive = column.badgeConfig?.activeValue !== undefined 
            ? value === column.badgeConfig.activeValue 
            : !!value;
        
        if (isActive) {
            return column.badgeConfig?.activeLabel || 'Active';
        }
        return column.badgeConfig?.inactiveLabel || 'Inactive';
    }

    /**
     * Check if item is primary (for primary badge type)
     */
    isPrimary(item: any, column: ItemListColumn): boolean {
        return this.getValue(item, column) === true;
    }

    /**
     * Track by function for ngFor
     */
    trackByFn(index: number, item: any): any {
        return item.id || item.bankAccountId || item.productUnitId || index;
    }
}

/** One column of a {@link DataTableComponent}. */
export interface DataTableColumn<T = any> {
    /** Field shown in the cell (unless a cell template or `value` is given) and the sort id sent to the server. */
    key: string;
    header: string;
    /** Minimum width, e.g. '130px'. Columns never shrink below it - the table scrolls sideways instead. */
    width?: string;
    align?: 'left' | 'right';
    /** Default true. */
    sortable?: boolean;
    /** Text for the cell when there's no cell template; defaults to row[key], '-' when empty. */
    value?: (row: T) => any;
}

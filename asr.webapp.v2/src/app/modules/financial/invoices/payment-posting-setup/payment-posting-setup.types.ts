import { ActivatedRoute } from '@angular/router';
import { Paging } from 'app/core/type/paging/paging.type';

/** PURCHASE = Creditor Posting Setup (account credited), SALES = Debtor Posting Setup (account debited). */
export type InvoiceSide = 'PURCHASE' | 'SALES';

/** A row as returned by `financial/paymentPostingSetup`: one payment type on one side, and its GL account. */
export interface PaymentPostingSetup {
    paymentPostingSetupId: number;
    paymentTypeId: number;
    paymentTypeCode: string;
    paymentTypeName: string;
    invoiceSide: InvoiceSide;
    accountChartId: number;
    accountChartCode: string;
    accountChartName: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    registerUserName: string;
    changeDate: string;
}

/** Body of `/create` and `/edit`. No id = create. On edit the side is kept by the server. */
export interface PaymentPostingSetupRequest {
    paymentPostingSetupId?: number;
    paymentTypeId: number;
    invoiceSide: InvoiceSide;
    accountChartId: number;
    status?: number;
}

export interface PaymentPostingSetupFilter {
    invoiceSide: InvoiceSide;
    statusIdList?: number[];
    page?: Paging;
}

export interface PaymentPostingSetupListResponse {
    paymentPostingSetups: PaymentPostingSetup[];
    page: Paging;
}

/** The words each menu uses - the two menus are one module, told apart by the route's `invoiceSide`. */
export interface SideText {
    title: string;
    subtitle: string;
    accountLabel: string;
    newLabel: string;
    invoices: string;
}

export const SIDE_TEXT: Record<InvoiceSide, SideText> = {
    PURCHASE: {
        title: 'Creditor Posting Setup',
        subtitle: 'For each payment type, the GL account a posted purchase invoice\'s gross amount is credited to.',
        accountLabel: 'Credit account',
        newLabel: 'New creditor posting',
        invoices: 'purchase invoices'
    },
    SALES: {
        title: 'Debtor Posting Setup',
        subtitle: 'For each payment type, the GL account a posted sales invoice\'s gross amount is debited to.',
        accountLabel: 'Debit account',
        newLabel: 'New debtor posting',
        invoices: 'sales invoices'
    }
};

/** The `invoiceSide` set on the route in app.routing.ts, looked up from the root (child routes don't inherit it). */
export function invoiceSideOf(route: ActivatedRoute): InvoiceSide {
    const found = route.snapshot.pathFromRoot.map((r) => r.data && r.data.invoiceSide).filter((side) => !!side);
    return found.length ? found[found.length - 1] : 'PURCHASE';
}

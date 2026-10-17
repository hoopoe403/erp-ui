import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { SalesInvoiceDetailsComponent } from './details/details.component';

/**
 * Best-effort save before leaving the Sales Invoice details page in-app
 * (clicking another menu item, back button within the SPA, etc.) - see
 * SalesInvoiceDetailsComponent.canDeactivate() for what it actually does.
 * Never blocks the navigation itself, even if the save fails.
 */
@Injectable({
    providedIn: 'root'
})
export class CanDeactivateSalesInvoiceDetails implements CanDeactivate<SalesInvoiceDetailsComponent> {
    canDeactivate(component: SalesInvoiceDetailsComponent): Observable<boolean> | boolean {
        return component.canDeactivate();
    }
}

import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { PurchaseInvoiceDetailsComponent } from './details/details.component';

/**
 * Best-effort save before leaving the Purchase Invoice details page in-app
 * (clicking another menu item, back button within the SPA, etc.) - see
 * PurchaseInvoiceDetailsComponent.canDeactivate() for what it actually does.
 * Never blocks the navigation itself, even if the save fails.
 */
@Injectable({
    providedIn: 'root'
})
export class CanDeactivatePurchaseInvoiceDetails implements CanDeactivate<PurchaseInvoiceDetailsComponent> {
    canDeactivate(component: PurchaseInvoiceDetailsComponent): Observable<boolean> | boolean {
        return component.canDeactivate();
    }
}

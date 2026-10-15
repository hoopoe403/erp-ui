import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Attribute, AttributeSearch, AttributeValue, AttributeValueSearch, ATTRIBUTE_STATUSES, withStatusInfo } from './attribute.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { Units } from 'app/modules/configuration/measurement/unit/unit.types';

/**
 * Inventory Attribute / Attribute Value API. These endpoints return the resource itself (no
 * `{ succeed, message, data }` envelope); failures are RFC 7807 problems - see `errorMessage`.
 */
@Injectable({
    providedIn: 'root'
})
export class AttributeService {

    private url: string = 'inventory/attribute/';
    private valueUrl: string = 'inventory/attributeValue/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _attributes: BehaviorSubject<Attribute[] | null> = new BehaviorSubject(null);

    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    get pagination$(): Observable<Paging> {
        return this._pagination.asObservable();
    }

    get attributes$(): Observable<Attribute[]> {
        return this._attributes.asObservable();
    }

    disposeAttributes$() {
        this._attributes.next([]);
    }

    disposePaginator$() {
        this._pagination.next(null);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Attribute
    // -----------------------------------------------------------------------------------------------------

    getAttributes(search: AttributeSearch): Observable<{ attributes: Attribute[]; page: Paging }> {
        return this._httpClient.post<{ attributes: Attribute[]; page: Paging }>(ApiHelperService.BASE_URL + this.url + 'findByObj', search).pipe(
            tap((response) => {
                (response.attributes || []).forEach(withStatusInfo);
                this._pagination.next(response.page);
                this._attributes.next(response.attributes);
            })
        );
    }

    getAttributesOnInit(search: AttributeSearch): Observable<{ attributes: Attribute[]; page: Paging }> {
        return this._httpClient.post<{ attributes: Attribute[]; page: Paging }>(ApiHelperService.BASE_URL + this.url + 'findByObjInOnInit', search).pipe(
            tap((response) => {
                (response.attributes || []).forEach(withStatusInfo);
                this._pagination.next(response.page);
                this._attributes.next(response.attributes);
            })
        );
    }

    getAttribute(id: number): Observable<Attribute> {
        return this._httpClient.get<Attribute>(ApiHelperService.BASE_URL + this.url + id);
    }

    createAttribute(attribute: Attribute): Observable<Attribute> {
        return this._httpClient.post<Attribute>(ApiHelperService.BASE_URL + this.url + 'create', attribute);
    }

    editAttribute(attribute: Attribute): Observable<Attribute> {
        return this._httpClient.post<Attribute>(ApiHelperService.BASE_URL + this.url + 'edit', attribute);
    }

    getStatuses(): Observable<any[]> {
        return of(ATTRIBUTE_STATUSES);
    }

    getUnits(): Observable<Units[]> {
        return this._httpClient.get<Units[]>(ApiHelperService.BASE_URL + 'shared/unit/drp/active');
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Attribute Value
    // -----------------------------------------------------------------------------------------------------

    getAttributeValues(search: AttributeValueSearch): Observable<{ attributeValues: AttributeValue[]; page: Paging }> {
        return this._httpClient.post<{ attributeValues: AttributeValue[]; page: Paging }>(ApiHelperService.BASE_URL + this.valueUrl + 'findByObj', search).pipe(
            tap((response) => (response.attributeValues || []).forEach(withStatusInfo))
        );
    }

    createAttributeValue(value: AttributeValue): Observable<AttributeValue> {
        return this._httpClient.post<AttributeValue>(ApiHelperService.BASE_URL + this.valueUrl + 'create', value);
    }

    editAttributeValue(value: AttributeValue): Observable<AttributeValue> {
        return this._httpClient.post<AttributeValue>(ApiHelperService.BASE_URL + this.valueUrl + 'edit', value);
    }

    getValueStatuses(): Observable<any[]> {
        return of(ATTRIBUTE_STATUSES);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Helpers
    // -----------------------------------------------------------------------------------------------------

    /** The human-readable message of an RFC 7807 problem (400 validation, 404, 409), or a generic fallback. */
    errorMessage(error: any): string {
        if (error instanceof HttpErrorResponse && error.error) {
            return error.error.detail || error.error.title || error.message;
        }
        return 'Something went wrong. Please try again.';
    }
}

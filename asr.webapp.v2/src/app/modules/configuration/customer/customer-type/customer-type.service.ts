import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { CustomerType } from './customer-type.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';

@Injectable({
    providedIn: 'root'
})
export class CustomerTypeService {


    private url: string = 'configuration/customer/customerType/';
    private _customerTypes: BehaviorSubject<CustomerType[] | null> = new BehaviorSubject(null);
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------


    get customerTypes$(): Observable<CustomerType[]> {
        return this._customerTypes.asObservable();
    }

    disposeCustomerTypes$() {
        this._customerTypes.next([]);
        //  this._expenses.complete();
    }

 

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getCustomerTypes(CustomerTypeInfo: any):
        Observable<any> {
        return this._httpClient.post<{ customerTypes: CustomerType[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', CustomerTypeInfo).pipe(
            tap((response) => {
                this._customerTypes.next(response.data);
            })
        );
    }

    getCustomerType(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((customerType) => {
                return customerType;
            }),
            switchMap((customerType) => {

                if (!customerType) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                console.log(this._customerTypes.value);
                return of(customerType);
            })
        );
    }
    getCustomerTypeInOnInit(customerTypeInfo: any):
        Observable<any> {
        return this._httpClient.post<{ customerTypes: CustomerType[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', customerTypeInfo).pipe(
            tap((response) => {
                this._customerTypes.next(response.data);
            })
        );
    }

  
    create(customerType: CustomerType): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', customerType).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    edit(customerType: CustomerType): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', customerType).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    statusEdit(customerType: any ) {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', customerType).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
}

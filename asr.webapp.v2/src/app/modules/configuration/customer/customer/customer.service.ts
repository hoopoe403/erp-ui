import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { ApiHelperService } from 'environments/api-helper.service';
import { each } from 'lodash';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    // Private
    private _customer: BehaviorSubject<Customer | null> = new BehaviorSubject(null);
    private _customers: BehaviorSubject<Customer[] | null> = new BehaviorSubject(null);
    private url: string = 'configuration/customer/customer/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for Customer
     */
    get customer$(): Observable<Customer> {
        return this._customer.asObservable();
    }

    /**
     * Getter for customers
     */
    get customers$(): Observable<Customer[]> {
        return this._customers.asObservable();
    }
    get pagination$(): Observable<Paging> {
        return this._pagination.asObservable();
    }
    /**
     * Getter for countries
     */

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get customers
     */
    getCustomers(customerInfo: any): Observable<any> {
        return this._httpClient.post<any[]>(ApiHelperService.BASE_URL + this.url + 'findByObj', customerInfo).pipe(
            tap((customers) => {
                this._pagination.next(customers.data.page);
                this._customers.next(customers.data.customers);
            })
        );
    }

    /**
     * Search customers with given query
     *
     * @param query
     */
    searchCustomers(query: string): Observable<Customer[]> {
        return this._httpClient.get<Customer[]>('api/apps/customers/search', {
            params: { query }
        }).pipe(
            tap((customers) => {
                this._customers.next(customers);
            })
        );
    }

    /**
     * Get customer by id
     */
    getCustomerById(id: number): Observable<Customer> {
        if (id === -1) {
            let customer = new Customer();
            customer.customerName = 'New';
            customer.customerFamily = 'Customer';
            customer.companyName = '';
            customer.customerCode = '';
            customer.customerTypeId = null;
            customer.organizationId = null;
            customer.branchId = null;
            customer.budgetCredit = null;
            customer.phone = '';
            customer.address = '';
            customer.status = null;
            customer.customerId = -1;
            this._customer.next(customer);

            // Return the customer
            return of(customer);
        }
        else {
            return this._customers.pipe(
                take(1),
                map((customers) => {

                    // Find the customer
                    const customer = customers.find(item => item.customerId === id) || null;

                    // Update the customer
                    this._customer.next(customer);

                    // Return the customer
                    return customer;
                }),
                switchMap((customer) => {

                    if (!customer) {
                        return throwError('Could not found customer with id of ' + id + '!');
                    }

                    return of(customer);
                })
            );
        }
    }

    addToCustomerList(customer: Customer) {
        const currentValue = this._customers.value;
        const updatedValue = [...currentValue, customer];
        this._customers.next(updatedValue);

    }
    editCustomerListItem(customer: Customer) {
        this._customers.next(
            this._customers.value.map((current: Customer) =>        // <-- `Array#map` function
                current.customerId === customer.customerId ? customer : current
            )
        );
    }

    create(customer: Customer): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', customer).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    edit(customer: Customer): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', customer).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    getDrpCustomerType(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/customerType').pipe(
            map((data) => {
                return data;
            }),
            switchMap((data) => {

                if (!data) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(data);
            })
        );
    }

    getDrpOrganization(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/organization').pipe(
            map((data) => {
                return data;
            }),
            switchMap((data) => {

                if (!data) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(data);
            })
        );
    }

    getDrpBranch(orgId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/branch' + '/' + orgId).pipe(
            map((data) => {
                return data;
            }),
            switchMap((data) => {

                if (!data) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(data);
            })
        );
    }


    getBudgetDetail(budgetId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'budgetDetail' + '/' + budgetId).pipe(
            map((data) => {
                return data;
            }),
            switchMap((data) => {

                if (!data) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(data);
            })
        );
    }

}

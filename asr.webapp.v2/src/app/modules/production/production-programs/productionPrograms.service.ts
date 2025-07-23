import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ProductionProgram } from './productionPrograms.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class ProductionProgramService {


    private url: string = 'production/productionProgram/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _productionPrograms: BehaviorSubject<ProductionProgram[] | null> = new BehaviorSubject(null);
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    get pagination$(): Observable<Paging> {
        return this._pagination.asObservable();
    }




    get productionPrograms$(): Observable<ProductionProgram[]> {
        return this._productionPrograms.asObservable();
    }



    disposeFinancialDocumentsDetails$() {
        this._productionPrograms.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    getProductionProgramsOnInit (productionProgramsInfo: any):
    Observable<any> {
        return this._httpClient.post<{ pagination: Paging; productionPrograms: ProductionProgram[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjFirstLoad', productionProgramsInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._productionPrograms.next(response.data.productionPrograms);
            })
        );
    }

    getProductionPrograms (productionProgramsInfo: any):
    Observable<any>{
        return this._httpClient.post<{ paginatin : Paging ; productionPrograms: ProductionProgram[]}>(ApiHelperService.BASE_URL + this.url + 'findByObj' , productionProgramsInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._productionPrograms.next(response.data.productionPrograms)
            })
        )
    }

    

    getStatuses(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/statuses').pipe(
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
    confirm(financialDocumentDetailInfo: ProductionProgram): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirm', financialDocumentDetailInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    confirmByList(financialDocumentDetailInfo: ProductionProgram): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirmByList', financialDocumentDetailInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    getSerialInfo(info : any){
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'obj/getSerialInfo' , info).pipe(
            tap((response : any) =>{
                return response;
            })
        )
    }

  
    

    // getSerialInfo(id: number): any {
    //     return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
    //         map((serial) => {
    //             return serial;
    //         }),
    //         switchMap((serial) => {

    //             if (!serial) {
    //                 return throwError('Could not found course with id of ' + id + '!');
    //             }
    //             return of(serial);
    //         })
    //     );
    // }

 

    getFinancialCategories(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'tree/financialCategory').pipe(
            map((financialCategories) => {
                return financialCategories;
            }),
            switchMap((financialCategories) => {

                if (!financialCategories) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(financialCategories);
            })
        );
    }

    getRevenue(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getRevenueInfo/' + id).pipe(
            map((revenue) => {
                return revenue;
            }),
            switchMap((revenue) => {

                if (!revenue) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(revenue);
            })
        );
    }

    getExpense(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getExpenseInfo/' + id).pipe(
            map((expense) => {
                return expense;
            }),
            switchMap((expense) => {

                if (!expense) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(expense);
            })
        );
    }

    getCustomerOrder(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getCustomerOrderInfo/' + id).pipe(
            map((customerOrder) => {
                return customerOrder;
            }),
            switchMap((customerOrder) => {

                if (!customerOrder) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(customerOrder);
            })
        );
    }

    getInvoice(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getInvoiceInfo/' + id).pipe(
            map((invoice) => {
                return invoice;
            }),
            switchMap((invoice) => {

                if (!invoice) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(invoice);
            })
        );
    }
    getManualInvoice(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getManualInvoiceInfo/' + id).pipe(
            map((invoice) => {
                return invoice;
            }),
            switchMap((invoice) => {

                if (!invoice) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(invoice);
            })
        );
    }
    getChequeInfo(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getChequeInfo/' + id).pipe(
            map((invoice) => {
                return invoice;
            }),
            switchMap((invoice) => {

                if (!invoice) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(invoice);
            })
        );
    }
    getCustomerInfo(customerId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/customer/' + customerId).pipe(
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

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { FactoryOrderPrediction, FactoryOrderPredictionDetail } from './factory-order-predictions.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class FactoryOrderPredictionService {


    private url: string = 'production/factoryOrderPrediction/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _factoryOrderPredictions: BehaviorSubject<FactoryOrderPrediction[] | null> = new BehaviorSubject(null);
    private _factoryOrderPredictionsDetails: BehaviorSubject<FactoryOrderPredictionDetail[] | null> = new BehaviorSubject(null);
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




    get factoryOrderPredictions$(): Observable<FactoryOrderPrediction[]> {
        return this._factoryOrderPredictions.asObservable();
    }

    get factoryOrderPredictionsDetail$(): Observable<FactoryOrderPredictionDetail[]> {
        return this._factoryOrderPredictionsDetails.asObservable();
    }



    disposeFactoryOrderPredictions$() {
        this._factoryOrderPredictions.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    getFactoryOrderPredictions(factoryOrderPredictionInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; factoryOrderPredictions: FactoryOrderPrediction[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', factoryOrderPredictionInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._factoryOrderPredictions.next(response.data.factoryOrderPredictions);
            })
        );
    }

    getFactoryOrderPredictionsDetails(factoryOrderPredictionDetailInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; FactoryOrderPredictionDetail: FactoryOrderPredictionDetail[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetail', factoryOrderPredictionDetailInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._factoryOrderPredictionsDetails.next(response.data.factoryOrderPredictionDetails);
            })
        );
    }


    getFactoryOrderPredictionsOnInit(factoryOrderPredictionInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; factoryOrderPredictions: FactoryOrderPrediction[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', factoryOrderPredictionInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._factoryOrderPredictions.next(response.data.factoryOrderPredictions);
            })
        );
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

    getLevels(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/levels').pipe(
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

    async getFactoryOrderPredictionForDownloadingFile(factoryOrderPredictionInfo: FactoryOrderPrediction): Promise<any[]> {
        const responses = await this.getFactoryOrderPredictionWithoutPaging(factoryOrderPredictionInfo);
        return [].concat(...responses);
    }

    async getFactoryOrderPredictionWithoutPaging(factoryOrderPredictionInfo: FactoryOrderPrediction): Promise<any[]> {
        let responses: any[] = [];
        const obj: FactoryOrderPrediction = { ...factoryOrderPredictionInfo };
        const page: Paging = new Paging();
        page.length = factoryOrderPredictionInfo.page.length;
        page.order = factoryOrderPredictionInfo.page.order;
        page.sort = factoryOrderPredictionInfo.page.sort;
        page.pageSize = 2000;
        page.flag = false;
        obj.page = page;
        const numberOfAPIRequests = Math.ceil(obj.page.length / obj.page.pageSize); // Number of API requests
        for (let i = 1; i <= numberOfAPIRequests; i++) {
            obj.page.pageNumber = i;
            const response = await this._httpClient.post<{ data: any }>(ApiHelperService.BASE_URL + this.url + 'findByObj', obj).toPromise();
            responses.push(response.data.factoryOrderPredictions);
        }
        return responses;
    }


    async getFactoryOrderPredictionDetailsWithoutPaging(factoryOrderPredictionDetailInfo: FactoryOrderPredictionDetail): Promise<any[]> {
        let responses: any[] = [];
        const obj: FactoryOrderPredictionDetail = { ...factoryOrderPredictionDetailInfo };
        const page: Paging = new Paging();
        page.length = factoryOrderPredictionDetailInfo.page.length;
        page.order = factoryOrderPredictionDetailInfo.page.order;
        page.sort = factoryOrderPredictionDetailInfo.page.sort;
        page.pageSize = 2000;
        page.flag = false;
        obj.page = page;
        const numberOfAPIRequests = Math.ceil(obj.page.length / obj.page.pageSize); // Number of API requests
        for (let i = 1; i <= numberOfAPIRequests; i++) {
            obj.page.pageNumber = i;
            const response = await this._httpClient.post<{ data: any }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetail', obj).toPromise();
            responses.push(response.data.factoryOrderPredictionDetails);


        }
        return responses;
    }
    async getFactoryOrderPredictionDetailsForDownloadingFile(factoryOrderPredictionDetailInfo: FactoryOrderPredictionDetail): Promise<any[]> {
        const responses = await this.getFactoryOrderPredictionDetailsWithoutPaging(factoryOrderPredictionDetailInfo);
        return [].concat(...responses);
    }

    // confirm(financialDocumentDetailInfo: FactoryOrderPrediction): any {
    //     return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirm', financialDocumentDetailInfo).pipe(
    //         tap((response: any) => {
    //             return response;
    //         })
    //     );
    // }

    // confirmByList(financialDocumentDetailInfo: FactoryOrderPrediction): any {
    //     return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirmByList', financialDocumentDetailInfo).pipe(
    //         tap((response: any) => {
    //             return response;
    //         })
    //     );
    // }


    // getFinancialYears(): any {
    //     return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/years').pipe(
    //         map((data) => {
    //             return data;
    //         }),
    //         switchMap((data) => {

    //             if (!data) {
    //                 return throwError('Could not found course with id of ' + '!');
    //             }

    //             return of(data);
    //         })
    //     );
    // }

    // getFinancialCategories(): any {
    //     return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'tree/financialCategory').pipe(
    //         map((financialCategories) => {
    //             return financialCategories;
    //         }),
    //         switchMap((financialCategories) => {

    //             if (!financialCategories) {
    //                 return throwError('Could not found course with id of ' + '!');
    //             }

    //             return of(financialCategories);
    //         })
    //     );
    // }

    // getRevenue(id: number): any {
    //     return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getRevenueInfo/' + id).pipe(
    //         map((revenue) => {
    //             return revenue;
    //         }),
    //         switchMap((revenue) => {

    //             if (!revenue) {
    //                 return throwError('Could not found course with id of ' + id + '!');
    //             }
    //             return of(revenue);
    //         })
    //     );
    // }

    // getExpense(id: number): any {
    //     return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getExpenseInfo/' + id).pipe(
    //         map((expense) => {
    //             return expense;
    //         }),
    //         switchMap((expense) => {

    //             if (!expense) {
    //                 return throwError('Could not found course with id of ' + id + '!');
    //             }
    //             return of(expense);
    //         })
    //     );
    // }

    // getCustomerOrder(id: number): any {
    //     return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getCustomerOrderInfo/' + id).pipe(
    //         map((customerOrder) => {
    //             return customerOrder;
    //         }),
    //         switchMap((customerOrder) => {

    //             if (!customerOrder) {
    //                 return throwError('Could not found course with id of ' + id + '!');
    //             }
    //             return of(customerOrder);
    //         })
    //     );
    // }

    // getInvoice(id: number): any {
    //     return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getInvoiceInfo/' + id).pipe(
    //         map((invoice) => {
    //             return invoice;
    //         }),
    //         switchMap((invoice) => {

    //             if (!invoice) {
    //                 return throwError('Could not found course with id of ' + id + '!');
    //             }
    //             return of(invoice);
    //         })
    //     );
    // }


    // getManualInvoice(id: number): any {
    //     return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getManualInvoiceInfo/' + id).pipe(
    //         map((invoice) => {
    //             return invoice;
    //         }),
    //         switchMap((invoice) => {

    //             if (!invoice) {
    //                 return throwError('Could not found course with id of ' + id + '!');
    //             }
    //             return of(invoice);
    //         })
    //     );
    // }


    // getChequeInfo(id: number): any {
    //     return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getChequeInfo/' + id).pipe(
    //         map((invoice) => {
    //             return invoice;
    //         }),
    //         switchMap((invoice) => {

    //             if (!invoice) {
    //                 return throwError('Could not found course with id of ' + id + '!');
    //             }
    //             return of(invoice);
    //         })
    //     );
    // }


    // getCustomerInfo(customerId: number): any {
    //     return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/customer/' + customerId).pipe(
    //         map((data) => {
    //             return data;
    //         }),
    //         switchMap((data) => {

    //             if (!data) {
    //                 return throwError('Could not found course with id of ' + '!');
    //             }

    //             return of(data);
    //         })
    //     );
    // }

}

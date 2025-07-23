import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ApiHelperService } from 'environments/api-helper.service';
import { ProfitLoss, ProfitLossDetail } from './profit-loss.types';
@Injectable({
    providedIn: 'root'
})
export class ProfitLossService {
    private _data: BehaviorSubject<any> = new BehaviorSubject(null);
    private _chartData: BehaviorSubject<any> = new BehaviorSubject(null);
    private _financeData: BehaviorSubject<any> = new BehaviorSubject(null);
    private _profitLossList: BehaviorSubject<any> = new BehaviorSubject(null);

    private url: string = 'financial/analytics/profitLoss/';

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for data
     */
    get data$(): Observable<any> {
        return this._data.asObservable();
    }

    get chartData$(): Observable<any> {
        return this._chartData.asObservable();
    }

    get financeData$(): Observable<any> {
        return this._financeData.asObservable();
    }
    get profitLossList$(): Observable<any> {
        return this._profitLossList.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get data
     */
    getData(): Observable<any> {
        return this._httpClient.get('api/dashboards/analytics').pipe(
            tap((response: any) => {
                this._data.next(response);
            })
        );
    }

    getChartDataOnInit(profitLoss: any): Observable<any> {
        return this._httpClient.post<{}>(ApiHelperService.BASE_URL + this.url + 'getChartDataOnInit', profitLoss).pipe(
            tap((response) => {
                this._chartData.next(response.data);
            })
        );
    }
    getChartData(profitLoss: any): Observable<any> {
        return this._httpClient.post<{}>(ApiHelperService.BASE_URL + this.url + 'getChartData', profitLoss).pipe(
            tap((response) => {
                this._chartData.next(response.data);
            })
        );
    }
    getFinanceData(): Observable<any> {
        return this._httpClient.get('api/dashboards/finance').pipe(
            tap((response: any) => {
                this._financeData.next(response);
            })
        );
    }


    getCurrentProfitLoss(profitLoss: any):
        Observable<any> {
        return this._httpClient.post<{}>(ApiHelperService.BASE_URL + this.url + 'getCurrentProfitLoss', profitLoss).pipe(
            tap((response) => {
                this._profitLossList.next(response.data);
            })
        );
    }
    findByObj(profitLoss: any):
        Observable<any> {
        return this._httpClient.post<{}>(ApiHelperService.BASE_URL + this.url + 'findByObj', profitLoss).pipe(
            tap((response) => {
                this._profitLossList.next(response.data);
            })
        );
    }
    findByObjDetail(profitLossDetailInfo: any):
        Observable<any> {
        return this._httpClient.post<{ resources: ProfitLossDetail[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetail', profitLossDetailInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    findByObjDetailGrouped(profitLossDetailInfo: any):
        Observable<any> {
        return this._httpClient.post<{ resources: ProfitLossDetail[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetailGrouped', profitLossDetailInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getFinancialYear(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/financialYear').pipe(
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

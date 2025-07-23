import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { FinancialResource } from './resource.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class FinancialResourceService {


    private url: string = 'financial/resource/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _resources: BehaviorSubject<FinancialResource[] | null> = new BehaviorSubject(null);
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


    get resources$(): Observable<FinancialResource[]> {
        return this._resources.asObservable();
    }

    disposeResources$() {
        this._resources.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getResources(resourceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; resources: FinancialResource[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', resourceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._resources.next(response.data.resources);
            })
        );
    }
    getResourcesOnInit(resourceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; resources: FinancialResource[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInit', resourceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._resources.next(response.data.resources);
            })
        );
    }

    create(resource: FinancialResource): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', resource).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    edit(resource: FinancialResource): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', resource).pipe(
            tap((response: any) => {
                return response;
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

    getResource(id: string): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((resource) => {
                return resource;
            }),
            switchMap((resource) => {

                if (!resource) {
                    return throwError('Could not found course with id of ' + id + '!');
                }

                return of(resource);
            })
        );
    }
    getBanks(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/bank').pipe(
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
    getResourceType(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/resourceType').pipe(
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
    getBankAccountType(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/bankAccountType').pipe(
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
    getOwner(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/owner').pipe(
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

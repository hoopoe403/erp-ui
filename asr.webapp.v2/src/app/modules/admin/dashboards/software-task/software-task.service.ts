import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { SoftwareTask } from './software-task.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class SoftwareTaskService {

    private url: string = 'dashboards/task/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _softwareTasks: BehaviorSubject<SoftwareTask[] | null> = new BehaviorSubject(null);
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


    get softwareTasks$(): Observable<SoftwareTask[]> {
        return this._softwareTasks.asObservable();
    }

    disposeSoftwareTasks$() {
        this._softwareTasks.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getSoftwareTasks(softwareTaskInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; softwareTaskInfo: SoftwareTask[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', softwareTaskInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._softwareTasks.next(response.data.tasks);
            })
        );
    }


    getSoftwareTask(id: string): any {
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

    getSubsystems(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/subSystem').pipe(
            map((subsystem) => {
                return subsystem;
            }),
            switchMap((subsystem) => {

                if (!subsystem) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(subsystem);
            })
        );
    }

    getFinalMenus(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/finalMenu').pipe(
            map((menus) => {
                return menus;
            }),
            switchMap((menus) => {

                if (!menus) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(menus);
            })
        );
    }

    getSoftwareTasksOnInit(softwareTaskInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; softwareTaskInfo: Task[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInit', softwareTaskInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._softwareTasks.next(response.data.tasks);
            })
        );
    }

    create(resource: SoftwareTask): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', resource).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    edit(resource: SoftwareTask): any {
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

}

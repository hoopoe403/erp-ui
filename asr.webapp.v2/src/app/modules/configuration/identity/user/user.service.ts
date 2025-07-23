import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { User } from 'app/modules/configuration/identity/user/user.types';
import { ApiHelperService } from 'environments/api-helper.service';
import { each } from 'lodash';
import { Paging } from 'app/core/type/paging/paging.type';
import { UserColumn } from 'app/core/type/column/user-column.type';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    // Private
    private _user: BehaviorSubject<User | null> = new BehaviorSubject(null);
    private _users: BehaviorSubject<User[] | null> = new BehaviorSubject(null);
    private url: string = 'configuration/identity/user/';
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
     * Getter for User
     */
    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    /**
     * Getter for users
     */
    get users$(): Observable<User[]> {
        return this._users.asObservable();
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
     * Get users
     */
    getUsers(userInfo: any): Observable<any> {
        return this._httpClient.post<any[]>(ApiHelperService.BASE_URL + this.url + 'findByObj', userInfo).pipe(
            tap((users) => {
                this._pagination.next(users.data.page);
                this._users.next(users.data.users);
            })
        );
    }

    /**
     * Search users with given query
     *
     * @param query
     */
    searchUsers(query: string): Observable<User[]> {
        return this._httpClient.get<User[]>('api/apps/users/search', {
            params: { query }
        }).pipe(
            tap((users) => {
                this._users.next(users);
            })
        );
    }

    /**
     * Get user by id
     */
    getUser(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((contractor) => {
                return contractor;
            }),
            switchMap((contractor) => {
                if (!contractor) {
                    return throwError("Could not found course with id of " + id + "!");
                }
                return of(contractor);
            })
        );
    }

    addToUserList(user: User) {
        const currentValue = this._users.value;
        const updatedValue = [...currentValue, user];
        this._users.next(updatedValue);

    }
    editUserListItem(user: User) {
        this._users.next(
            this._users.value.map((current: User) =>        // <-- `Array#map` function
                current.userId === user.userId ? user : current
            )
        );
    }

    create(user: User): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', user).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    edit(user: User): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', user).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    getRoles(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/role').pipe(
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

    getMenus(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/menu').pipe(
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

    getAccess(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/access').pipe(
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

    getRoleInfo(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/roleInfo/' + id).pipe(
            map((contractor) => {
                return contractor;
            }),
            switchMap((contractor) => {
                if (!contractor) {
                    return throwError("Could not found course with id of " + id + "!");
                }
                return of(contractor);
            })
        );
    }

    getViewColumns(column: UserColumn): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'viewColumn', column).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    userColumnManagement(userColumn: UserColumn): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'userColumnManagement', userColumn).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
}

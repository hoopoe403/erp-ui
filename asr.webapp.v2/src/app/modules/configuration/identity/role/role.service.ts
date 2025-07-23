import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Role } from 'app/modules/configuration/identity/role/role.types';
import { ApiHelperService } from 'environments/api-helper.service';
import { each } from 'lodash';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class RoleService {
    // Private
    private _role: BehaviorSubject<Role | null> = new BehaviorSubject(null);
    private _roles: BehaviorSubject<Role[] | null> = new BehaviorSubject(null);
    private url: string = 'configuration/identity/role/';
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
     * Getter for Role
     */
    get role$(): Observable<Role> {
        return this._role.asObservable();
    }

    /**
     * Getter for roles
     */
    get roles$(): Observable<Role[]> {
        return this._roles.asObservable();
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
     * Get roles
     */
    getRoles(roleInfo: any): Observable<any> {
        return this._httpClient.post<any[]>(ApiHelperService.BASE_URL + this.url + 'findByObj', roleInfo).pipe(
            tap((roles) => {
                this._pagination.next(roles.data.page);
                this._roles.next(roles.data.roles);
            })
        );
    }

    /**
     * Search roles with given query
     *
     * @param query
     */
    searchRoles(query: string): Observable<Role[]> {
        return this._httpClient.get<Role[]>('api/apps/roles/search', {
            params: { query }
        }).pipe(
            tap((roles) => {
                this._roles.next(roles);
            })
        );
    }

    /**
     * Get role by id
     */
    getRole(id: number): any {
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

    addToRoleList(role: Role) {
        const currentValue = this._roles.value;
        const updatedValue = [...currentValue, role];
        this._roles.next(updatedValue);

    }
    editRoleListItem(role: Role) {
        this._roles.next(
            this._roles.value.map((current: Role) =>        // <-- `Array#map` function
                current.roleId === role.roleId ? role : current
            )
        );
    }

    create(role: Role): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', role).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    edit(role: Role): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', role).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    getUsers(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/user').pipe(
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


}

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { QueryAssistService } from './query-assist.service';
import { ChatSession, SessionInfo, Profile } from 'app/modules/admin/chat/chat.types';

@Injectable({
    providedIn: 'root'
})
export class QueryAssistSessionsResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _queryAssistService: QueryAssistService,
        private _router: Router
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<SessionInfo[]> | any
    {
        return this._queryAssistService.getSessions();
    }
}

@Injectable({
    providedIn: 'root'
})
export class QueryAssistSessionResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _queryAssistService: QueryAssistService,
        private _router: Router
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ChatSession>
    {
        return this._queryAssistService.getSession(route.paramMap.get('id'))
                   .pipe(
                       // Error here means the requested session is not available
                       catchError((error) => {

                           // Log the error
                           console.error(error);

                           // Get the parent url
                           const parentUrl = state.url.split('/').slice(0, -1).join('/');

                           // Navigate to there
                           this._router.navigateByUrl(parentUrl);

                           // Throw an error
                           return throwError(error);
                       })
                   );
    }
}

@Injectable({
    providedIn: 'root'
})
export class QueryAssistProfileResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _queryAssistService: QueryAssistService,
        private _router: Router
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Profile> | any
    {
        return this._queryAssistService.getProfile();
    }
}

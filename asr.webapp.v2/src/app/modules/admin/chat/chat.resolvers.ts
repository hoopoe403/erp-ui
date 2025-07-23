import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChatService } from './chat.service';
import { ChatSession, SessionInfo, Profile } from './chat.types';

@Injectable({
    providedIn: 'root'
})
export class ChatSessionsResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _chatService: ChatService,
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
        return this._chatService.getSessions();
    }
}

@Injectable({
    providedIn: 'root'
})
export class ChatSessionResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _chatService: ChatService,
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
        return this._chatService.getSession(route.paramMap.get('id'))
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
export class ChatProfileResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _chatService: ChatService,
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
        return this._chatService.getProfile();
    }
}

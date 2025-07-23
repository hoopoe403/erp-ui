import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NavigationModel } from 'app/core/navigation/navigation.types';
import { ApiHelperService } from 'environments/api-helper.service';
import { cloneDeep } from 'lodash';

@Injectable({
    providedIn: 'root'
})
export class NavigationService {
    private _navigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation> {
        return this._navigation.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */
    get(): Observable<NavigationModel> {
        /*   let exists: boolean = false;
          this._navigation.subscribe(nav => { if (nav.compact.length > 0) exists = true });
          if (exists)
              this.navigation$.toPromise();
          else */
        return this._httpClient.get<NavigationModel>(ApiHelperService.BASE_URL + 'getUserMenu').pipe(
            tap((navigation) => {
                let nav: Navigation = { default: [], compact: [], futuristic: [], horizontal: [] };

                nav.compact = navigation.compactNavigation;
                nav.default = navigation.defaultNavigation;
                nav.futuristic = navigation.futuristicNavigation;
                nav.horizontal = navigation.horizontalNavigation;
                nav = this.createCollection(nav);
                this._navigation.next(nav);
            })
        );
    }
    private createCollection(navigation: Navigation): Navigation {
        navigation.compact.forEach((compactNavItem) => {
            navigation.default.forEach((defaultNavItem) => {
                if (defaultNavItem.id === compactNavItem.id) {
                    compactNavItem.children = cloneDeep(defaultNavItem.children);
                }
            });
        });

        // Fill futuristic navigation children using the default navigation
        navigation.futuristic.forEach((futuristicNavItem) => {
            navigation.default.forEach((defaultNavItem) => {
                if (defaultNavItem.id === futuristicNavItem.id) {
                    futuristicNavItem.children = cloneDeep(defaultNavItem.children);
                }
            });
        });

        // Fill horizontal navigation children using the default navigation
        navigation.horizontal.forEach((horizontalNavItem) => {
            navigation.default.forEach((defaultNavItem) => {
                if (defaultNavItem.id === horizontalNavItem.id) {
                    horizontalNavItem.children = cloneDeep(defaultNavItem.children);
                }
            });
        });
        return navigation;
    }
}

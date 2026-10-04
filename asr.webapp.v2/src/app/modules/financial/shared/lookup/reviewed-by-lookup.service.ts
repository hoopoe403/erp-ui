import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RoleService } from 'app/modules/configuration/identity/role/role.service';

export interface ReviewerOption {
    userId: number;
    name: string;
}

@Injectable({
    providedIn: 'root'
})
export class ReviewedByLookupService {

    constructor(private _roleService: RoleService) {
    }

    /**
     * Reuses RoleService.getUsers() (configuration/identity/role/obj/user) — the
     * one existing, working "flat list of users for a picker" endpoint in this app
     * (already used by the Role-assignment screen). UserService.searchUsers() looks
     * similar but hits a Fuse-demo mock path ('api/apps/users/search') that isn't
     * wired to any real backend or mock-api handler, so it's not usable here.
     */
    getReviewers(): Observable<ReviewerOption[]> {
        return this._roleService.getUsers().pipe(
            map((res: any) => (res && res.data ? res.data : []).map((u: any) => ({
                userId: u.userId,
                name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username
            }))),
            catchError(() => of([] as ReviewerOption[]))
        );
    }
}

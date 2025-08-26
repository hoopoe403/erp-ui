import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewEncapsulation, Inject } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Subject } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { IChatService, CHAT_SERVICE_TOKEN } from '../chat.types';

@Component({
    selector       : 'chat-new-chat',
    templateUrl    : './new-chat.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewChatComponent implements OnInit, OnDestroy
{
    @Input() drawer: MatDrawer;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        @Inject(CHAT_SERVICE_TOKEN) private _chatService: IChatService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Reset the current session to null (no session created yet)
        this._chatService.resetSession();
        
        // Close the drawer and navigate to the conversation view
        this.drawer.close();
        this._router.navigate(['new'], { 
            relativeTo: this._activatedRoute.parent 
        });
    }

    createNewSession(): void
    {
        // Reset current session to null (no session created yet)
        this._chatService.resetSession();
        
        // Navigate directly to new conversation view
        this._router.navigate(['new'], { relativeTo: this._activatedRoute });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionInfo, Profile } from '../chat.types';
import { ChatService } from '../chat.service';

@Component({
    selector       : 'chat-chats',
    templateUrl    : './chats.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatsComponent implements OnInit, OnDestroy
{
    sessions: SessionInfo[] = [];
    filteredSessions: SessionInfo[] = [];
    profile: Profile;
    selectedSession: SessionInfo | null = null;
    drawerComponent: 'new-chat' | 'profile' = 'new-chat';
    drawerOpened: boolean = false;
    editingSessionId: string | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _chatService: ChatService,
        private _router: Router
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
        // Sessions
        this._chatService.sessions$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((sessions: SessionInfo[]) => {
                this.sessions = this.filteredSessions = sessions;
                this._changeDetectorRef.markForCheck();
            });

        // Profile
        this._chatService.profile$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((profile: Profile) => {
                this.profile = profile;
                this._changeDetectorRef.markForCheck();
            });

        // Current session
        this._chatService.currentSession$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((session) => {
                if (session) {
                    this.selectedSession = {
                        session_id: session.sessionId,
                        session_name: session.session_name,
                        assist_id: session.assist_id
                    };
                } else {
                    this.selectedSession = null;
                }
                this._changeDetectorRef.markForCheck();
            });

        // Get data from resolvers
        this._activatedRoute.data.subscribe((data) => {
            if (data.sessions) {
                this.sessions = this.filteredSessions = data.sessions;
            }
            if (data.profile) {
                this.profile = data.profile;
            }
            this._changeDetectorRef.markForCheck();
        });
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

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Filter sessions
     *
     * @param query
     */
    filterSessions(query: string): void
    {
        // Reset the filtered sessions
        this.filteredSessions = this.sessions;

        // Filter
        if (query !== '' && query !== null) {
            this.filteredSessions = this.filteredSessions.filter(session => 
                session.session_name.toLowerCase().includes(query.toLowerCase())
            );
        }

        this._changeDetectorRef.markForCheck();
    }

    /**
     * Open new chat
     */
    createNewSession(): void
    {
        // Reset current session to null (no session created yet)
        this._chatService.resetSession();
        
        // Navigate directly to new conversation view
        this._router.navigate(['new'], { relativeTo: this._activatedRoute });
    }

    /**
     * Open profile
     */
    openProfile(): void
    {
        this.drawerComponent = 'profile';
        this.drawerOpened = true;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.session_id || index;
    }

    /**
     * Create new session
     */
    // createNewSession(): void
    // {
    //     this._chatService.createSession({
    //         session_name: 'New Chat',
    //         assist_id: 1
    //     }).subscribe((newSession) => {
    //         this._router.navigate([newSession.session_id], { relativeTo: this._activatedRoute });
    //     });
    // }

    /**
     * Delete session
     */
    deleteSession(sessionId: string, event: Event): void
    {
        event.stopPropagation();
        event.preventDefault();
        this._chatService.deleteSession(sessionId).subscribe(() => {
            // If the deleted session was selected, navigate to empty conversation
            if (this.selectedSession && this.selectedSession.session_id === sessionId) {
                this._router.navigate([''], { relativeTo: this._activatedRoute });
            }
        });
    }

    /**
     * Rename session
     */
    renameSession(sessionId: string, event: Event): void
    {
        event.stopPropagation();
        event.preventDefault();
        this.editingSessionId = sessionId;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Save session name
     */
    saveSessionName(sessionId: string, newName: string, event?: Event): void
    {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        // Trim the new name
        newName = newName.trim();

        // Get the current session
        const currentSession = this.sessions.find(s => s.session_id === sessionId);

        // Only save if name has changed and is not empty
        if (currentSession && newName && newName !== '' && newName !== currentSession.session_name) {
            this._chatService.renameSession(sessionId, newName).subscribe();
        }

        // Reset editing state
        this.editingSessionId = null;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Cancel session rename
     */
    cancelRename(event?: Event): void
    {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        this.editingSessionId = null;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Handle key press in rename input
     */
    handleRenameKeyPress(sessionId: string, newName: string, event: KeyboardEvent): void
    {
        event.stopPropagation();
        
        if (event.key === 'Enter') {
            this.saveSessionName(sessionId, newName, event);
        }
        else if (event.key === 'Escape') {
            this.cancelRename(event);
        }
    }
}

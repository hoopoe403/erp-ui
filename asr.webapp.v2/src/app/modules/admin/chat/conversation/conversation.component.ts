import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild, ViewEncapsulation, Inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { ChatSession, ChatMessage, IChatService, CHAT_SERVICE_TOKEN } from '../chat.types';
import { ChatConfigService } from '../services/chat.config.service';

@Component({
    selector       : 'chat-conversation',
    templateUrl    : './conversation.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationComponent implements OnInit, OnDestroy
{
    @ViewChild('messageInput') messageInput: ElementRef;
    session: ChatSession;
    messages: ChatMessage[] = [];
    message: string = '';
    loading: boolean = false;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = false;
    isNewChat: boolean = false;
    config: any;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _chatConfigService: ChatConfigService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _ngZone: NgZone,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        @Inject(CHAT_SERVICE_TOKEN) private _chatService: IChatService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Decorated methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resize on 'input' and 'ngModelChange' events
     *
     * @private
     */
    @HostListener('input')
    @HostListener('ngModelChange')
    private _resizeMessageInput(): void
    {
        // This doesn't need to trigger Angular's change detection by itself
        this._ngZone.runOutsideAngular(() => {

            setTimeout(() => {

                // Set the height to 'auto' so we can correctly read the scrollHeight
                this.messageInput.nativeElement.style.height = 'auto';

                // Detect the changes so the height is applied
                this._changeDetectorRef.detectChanges();

                // Get the scrollHeight and subtract the vertical padding
                this.messageInput.nativeElement.style.height = `${this.messageInput.nativeElement.scrollHeight}px`;

                // Detect the changes one more time to apply the final height
                this._changeDetectorRef.detectChanges();
            });
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Check if this is a new chat route
        this.isNewChat = this._router.url.includes('/new');

        // Chat configuration
        this._chatConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config) => {
                this.config = config;
                this._changeDetectorRef.markForCheck();
            });

        // Current session
        this._chatService.currentSession$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((session: ChatSession) => {
                this.session = session;
                
                // If we were in new chat mode but now have a session, navigate to the proper URL
                if (this.isNewChat && session && session.sessionId) {
                    this._router.navigate([`../${session.sessionId}`], { relativeTo: this._activatedRoute });
                    this.isNewChat = false;
                }
                
                this._changeDetectorRef.markForCheck();
            });

        // Messages
        this._chatService.messages$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((messages: ChatMessage[]) => {
                this.messages = messages;
                this._changeDetectorRef.markForCheck();
                
                // Scroll to bottom when new messages arrive
                setTimeout(() => {
                    this._scrollToBottom();
                }, 100);
            });

        // Loading state - enhanced to auto-scroll to typing indicator
        this._chatService.loading$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((loading: boolean) => {
                this.loading = loading;
                this._changeDetectorRef.markForCheck();
                
                // Auto-scroll to bottom when loading starts (to show typing indicator)
                if (loading) {
                    setTimeout(() => {
                        this._scrollToBottom();
                    }, 100);
                }
            });

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {

                // Set the drawerMode if the given breakpoint is active
                if ( matchingAliases.includes('lg') )
                {
                    this.drawerMode = 'side';
                }
                else
                {
                    this.drawerMode = 'over';
                }

                // Mark for check
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
     * Send message
     */
    sendMessage(): void
    {
        if (!this.message.trim() || this.loading) {
            return;
        }

        const messageText = this.message.trim();
        this.message = '';

        // Reset textarea height
        if (this.messageInput) {
            this.messageInput.nativeElement.style.height = 'auto';
        }

        // Send message to AI
        this._chatService.sendMessage(this.session?.sessionId || null, messageText).subscribe({
            next: (response) => {
                // If this was a new chat and we now have a session, navigate to it
                if (this.isNewChat && response.sessionId && !this.session) {
                    this._router.navigate([`../${response.sessionId}`], { relativeTo: this._activatedRoute });
                }
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                console.error('Error sending message:', error);
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    /**
     * Handle Enter key in message input
     */
    onMessageInputKeydown(event: KeyboardEvent): void
    {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    /**
     * Check if message is from current day
     */
    isToday(timestamp: string): boolean
    {
        const messageDate = new Date(timestamp);
        const today = new Date();
        return messageDate.toDateString() === today.toDateString();
    }

    /**
     * Get formatted date
     */
    formatDate(timestamp: string): string
    {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    }

    /**
     * Scroll to bottom of messages
     */
    private _scrollToBottom(): void
    {
        try {
            const messagesContainer = document.querySelector('.chat-messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        } catch(err) {
            console.error('Error scrolling to bottom:', err);
        }
    }
}

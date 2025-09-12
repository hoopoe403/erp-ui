import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { QueryAssistService } from 'app/modules/admin/query-assist/query-assist.service';
import { ChatConfigService } from 'app/modules/admin/chat/services/chat.config.service';

@Component({
    selector: 'embedded-chat',
    templateUrl: './embedded-chat.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmbeddedChatComponent implements OnInit
{
    @Input() title: string = 'Chat Support';
    @Input() icon: string = 'heroicons_outline:chat-bubble-left-right';
    @Input() placeholder: string = 'Ask your question...';
    @Input() welcomeMessage: string = 'How can I help you today?';
    @Output() closeChat = new EventEmitter<void>();

    /**
     * Constructor
     */
    constructor(
        private _queryAssistService: QueryAssistService,
        private _chatConfigService: ChatConfigService,
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
        // Clear any existing session for fresh start
        this._queryAssistService.clearEmbeddedSession();
        
        // Configure chat for embedded use
        this._chatConfigService.updateConfig({
            title: this.title,
            icon: this.icon,
            placeholder: this.placeholder,
            welcomeMessage: this.welcomeMessage,
            assistantId: 2, // Using query assist service
            showProfile: false,
            showSessions: false,
            maxMessages: 20,
            embedMode: true
        });
    }

    /**
     * Close chat panel
     */
    onCloseChat(): void
    {
        // Clear the session and chat history for fresh start next time
        this._queryAssistService.clearEmbeddedSession();
        this.closeChat.emit();
    }

    /**
     * Open full query assist page
     */
    onOpenQueryAssist(): void
    {
        this._router.navigate(['/query-assist']);
    }
}

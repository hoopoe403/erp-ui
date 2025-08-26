import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UserGuideService } from './user-guide.service';
import { ChatConfigService } from 'app/modules/admin/chat/services/chat.config.service';

@Component({
    selector       : 'user-guide',
    templateUrl    : './user-guide.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserGuideComponent implements OnInit
{
    /**
     * Constructor
     */
    constructor(
        private _userGuideService: UserGuideService,
        private _chatConfigService: ChatConfigService
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
        // Set configuration for user guide
        this._chatConfigService.updateConfig({
            title: 'User Guide Assistant',
            icon: 'heroicons_outline:academic-cap',
            placeholder: 'Ask about how to use the system...',
            welcomeMessage: 'Welcome to the User Guide! How can I help you learn about our system?',
            assistantId: 1
        });
    }
}
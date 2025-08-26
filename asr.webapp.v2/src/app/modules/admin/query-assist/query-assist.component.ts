import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { QueryAssistService } from './query-assist.service';
import { ChatConfigService } from 'app/modules/admin/chat/services/chat.config.service';

@Component({
    selector       : 'query-assist',
    templateUrl    : './query-assist.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueryAssistComponent implements OnInit
{
    /**
     * Constructor
     */
    constructor(
        private _queryAssistService: QueryAssistService,
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
        // Set configuration for query assist
        this._chatConfigService.updateConfig({
            title: 'Query Assistant',
            icon: 'heroicons_outline:magnifying-glass',
            placeholder: 'Ask me to help with queries...',
            welcomeMessage: 'I can help you with database queries and data analysis. What would you like to know?',
            assistantId: 2
        });
    }
}

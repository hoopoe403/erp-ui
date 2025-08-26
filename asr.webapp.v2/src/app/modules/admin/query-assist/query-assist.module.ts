import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatModule } from 'app/modules/admin/chat/chat.module';
import { queryAssistRoutes } from './query-assist.routing';
import { QueryAssistComponent } from './query-assist.component';
import { QueryAssistService } from './query-assist.service';
import { CHAT_SERVICE_TOKEN } from 'app/modules/admin/chat/chat.types';

@NgModule({
    declarations: [
        QueryAssistComponent
    ],
    imports     : [
        CommonModule,
        RouterModule.forChild(queryAssistRoutes),
        HttpClientModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        ChatModule
    ],
    providers: [
        {
            provide: CHAT_SERVICE_TOKEN,
            useExisting: QueryAssistService
        }
    ]
})
export class QueryAssistModule
{
}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatModule } from 'app/modules/admin/chat/chat.module';
import { QueryAssistService } from 'app/modules/admin/query-assist/query-assist.service';
import { CHAT_SERVICE_TOKEN } from 'app/modules/admin/chat/chat.types';
import { EmbeddedChatComponent } from './embedded-chat.component';

@NgModule({
    declarations: [
        EmbeddedChatComponent
    ],
    imports: [
        CommonModule,
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
    ],
    exports: [
        EmbeddedChatComponent
    ]
})
export class EmbeddedChatModule
{
}

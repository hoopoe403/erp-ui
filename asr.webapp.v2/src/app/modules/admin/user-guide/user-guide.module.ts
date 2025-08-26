import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatModule } from 'app/modules/admin/chat/chat.module';
import { userGuideRoutes } from './user-guide.routing';
import { UserGuideComponent } from './user-guide.component';
import { UserGuideService } from './user-guide.service';
import { CHAT_SERVICE_TOKEN } from 'app/modules/admin/chat/chat.types';

@NgModule({
    declarations: [
        UserGuideComponent
    ],
    imports     : [
        CommonModule,
        RouterModule.forChild(userGuideRoutes),
        HttpClientModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        ChatModule
    ],
    providers: [
        {
            provide: CHAT_SERVICE_TOKEN,
            useExisting: UserGuideService
        }
    ]
})
export class UserGuideModule
{
}
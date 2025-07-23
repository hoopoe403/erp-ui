import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MarkdownModule } from 'ngx-markdown';
import { SharedModule } from 'app/shared/shared.module';
import { chatRoutes } from './chat.routing';
import { ChatComponent } from './chat.component';
import { ChatsComponent } from './chats/chats.component';
import { EmptyConversationComponent } from './empty-conversation/empty-conversation.component';
import { ConversationComponent } from './conversation/conversation.component';
import { MessageComponent } from './conversation/message/message.component';
import { NewChatComponent } from './new-chat/new-chat.component';
import { ProfileComponent } from './profile/profile.component';

@NgModule({
    declarations: [
        ChatComponent,
        ChatsComponent,
        ConversationComponent,
        MessageComponent,
        EmptyConversationComponent,
        NewChatComponent,
        ProfileComponent
    ],
    imports     : [
        CommonModule,
        RouterModule.forChild(chatRoutes),
        FormsModule,
        HttpClientModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatSidenavModule,
        MarkdownModule.forChild(),
        SharedModule
    ]
})
export class ChatModule
{
}

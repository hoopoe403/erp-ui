import { Route } from '@angular/router';
import { ChatSessionResolver, ChatSessionsResolver, ChatProfileResolver } from './chat.resolvers';
import { ChatComponent } from './chat.component';
import { ChatsComponent } from './chats/chats.component';
import { ConversationComponent } from './conversation/conversation.component';
import { EmptyConversationComponent } from './empty-conversation/empty-conversation.component';

export const chatRoutes: Route[] = [
    {
        path     : '',
        component: ChatComponent,
        resolve  : {
            sessions: ChatSessionsResolver,
            profile : ChatProfileResolver
        },
        children : [
            {
                path     : '',
                component: ChatsComponent,
                children : [
                    {
                        path     : '',
                        pathMatch: 'full',
                        component: EmptyConversationComponent
                    },
                    {
                        path     : 'new',
                        component: ConversationComponent
                        // No resolver - no session exists yet
                    },
                    {
                        path     : ':id',
                        component: ConversationComponent,
                        resolve  : {
                            session: ChatSessionResolver
                        }
                    }
                ]
            }
        ]
    }
];

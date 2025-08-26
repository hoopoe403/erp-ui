import { Route } from '@angular/router';
import { QueryAssistComponent } from './query-assist.component';
import { ChatComponent } from 'app/modules/admin/chat/chat.component';
import { ChatsComponent } from 'app/modules/admin/chat/chats/chats.component';
import { ConversationComponent } from 'app/modules/admin/chat/conversation/conversation.component';

// Import resolvers from the query assist module
import { QueryAssistSessionResolver, QueryAssistSessionsResolver, QueryAssistProfileResolver } from './query-assist.resolvers';

export const queryAssistRoutes: Route[] = [
    {
        path     : '',
        component: QueryAssistComponent,
        children : [
            {
                path     : '',
                component: ChatComponent,
                resolve  : {
                    sessions: QueryAssistSessionsResolver,
                    profile : QueryAssistProfileResolver
                },
                children : [
                    {
                        path     : '',
                        component: ChatsComponent,
                        children : [
                            {
                                path     : '',
                                pathMatch: 'full',
                                redirectTo: 'new'
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
                                    session: QueryAssistSessionResolver
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

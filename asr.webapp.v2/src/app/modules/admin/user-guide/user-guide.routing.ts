import { Route } from '@angular/router';
import { UserGuideComponent } from './user-guide.component';
import { ChatComponent } from 'app/modules/admin/chat/chat.component';
import { ChatsComponent } from 'app/modules/admin/chat/chats/chats.component';
import { ConversationComponent } from 'app/modules/admin/chat/conversation/conversation.component';

// Import resolvers from the user guide module
import { UserGuideSessionResolver, UserGuideSessionsResolver, UserGuideProfileResolver } from './user-guide.resolvers';

export const userGuideRoutes: Route[] = [
    {
        path     : '',
        component: UserGuideComponent,
        children : [
            {
                path     : '',
                component: ChatComponent,
                resolve  : {
                    sessions: UserGuideSessionsResolver,
                    profile : UserGuideProfileResolver
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
                                    session: UserGuideSessionResolver
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

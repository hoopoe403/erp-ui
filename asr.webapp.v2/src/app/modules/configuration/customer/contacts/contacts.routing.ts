import { Route } from '@angular/router';
import { CanDeactivateContactsDetails } from 'app/modules/configuration/customer/contacts/contacts.guards';
import { ContactsContactResolver, ContactsCountriesResolver, ContactsResolver, ContactsTagsResolver } from 'app/modules/configuration/customer/contacts/contacts.resolvers';
import { ContactsComponent } from 'app/modules/configuration/customer/contacts/contacts.component';
import { ContactsListComponent } from 'app/modules/configuration/customer/contacts/list/list.component';
import { ContactsDetailsComponent } from 'app/modules/configuration/customer/contacts/details/details.component';

export const contactsRoutes: Route[] = [
    {
        path     : '',
        component: ContactsComponent,
        resolve  : {
            tags: ContactsTagsResolver
        },
        children : [
            {
                path     : '',
                component: ContactsListComponent,
                resolve  : {
                    tasks    : ContactsResolver,
                    countries: ContactsCountriesResolver
                },
                children : [
                    {
                        path         : ':id',
                        component    : ContactsDetailsComponent,
                        resolve      : {
                            task     : ContactsContactResolver,
                            countries: ContactsCountriesResolver
                        },
                        canDeactivate: [CanDeactivateContactsDetails]
                    }
                ]
            }
        ]
    }
];

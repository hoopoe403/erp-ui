import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector       : 'organization',
    templateUrl    : './organization.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}

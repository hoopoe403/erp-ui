import { ChangeDetectionStrategy, Component, Input, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Status } from 'app/core/type/status/status.types';

@Component({
    selector: 'details-change-history',
    templateUrl: './change-history.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [
        /* language=SCSS */
        `
            .status-grid {
                grid-template-columns:250px auto 200px;

                @screen sm {
                    grid-template-columns:250px auto 200px;
                }

                @screen md {
                    grid-template-columns:250px auto 200px;
                }

                @screen lg {
                    grid-template-columns: 250px auto 200px;
                }
                @screen print{
                    grid-template-columns: 250px auto 200px;
                }
            }
        `
    ],
})
export class DetailsChangeHistoryComponent implements OnInit {
    changeHistoryForm: FormGroup;
    statusHistory: Array<Status>;
    @Input() historyData: any;
    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.changeHistoryForm = this._formBuilder.group({
        });
    }
    ngOnChanges(changes: SimpleChanges) {
        if ('historyData' in changes) {
            this.statusHistory = changes.historyData.currentValue;
        }
    }
}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseConfirmationModule } from '@fuse/services/confirmation';
import { FileAttachmentsComponent } from './file-attachments.component';

@NgModule({
    declarations: [FileAttachmentsComponent],
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        MatTooltipModule,
        FuseConfirmationModule
    ],
    exports: [FileAttachmentsComponent]
})
export class FileAttachmentsModule {
}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

// Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Fuse
import { FuseScrollbarModule } from '@fuse/directives/scrollbar';

// Component
import { UserPreferencesComponent } from './user-preferences.component';

const routes: Routes = [
    {
        path: '',
        component: UserPreferencesComponent
    }
];

@NgModule({
    declarations: [
        UserPreferencesComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        MatSnackBarModule,
        FuseScrollbarModule
    ]
})
export class UserPreferencesModule { }

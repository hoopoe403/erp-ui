import { Component } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
@Component({
    selector: 'app-notebook',
    templateUrl: './notebook.component.html',
    styleUrls: ['./notebook.component.css'],
    animations: [
        trigger('pageTurnAnimation', [
            transition(':increment', [
                style({ transform: 'translateX(100%)' }),
                animate('0.5s ease-in-out', style({ transform: 'translateX(0)' })),
            ]),
            transition(':decrement', [
                style({ transform: 'translateX(-100%)' }),
                animate('0.5s ease-in-out', style({ transform: 'translateX(0)' })),
            ]),
        ]),
    ],
})
export class NotebookComponent {
    pages = Array(10).fill(null);  // Example with 10 pages
    currentPage = 0;

    nextPage() {
        if (this.currentPage < this.pages.length - 1) {
            this.currentPage++;
        }
    }

    prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
        }
    }
}

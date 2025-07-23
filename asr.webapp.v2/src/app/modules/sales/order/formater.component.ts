import { Directive, HostListener, ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

@Directive({
    selector: '[appNumberFormat]',
    providers: [DecimalPipe]
})
export class NumberFormatDirective {
    private decimalPipe: DecimalPipe;

    constructor(private el: ElementRef, private control: NgControl, decimalPipe: DecimalPipe) {
        this.decimalPipe = decimalPipe;
    }

    @HostListener('blur')
    onBlur() {
        this.formatValue();
    }

    private formatValue() {
        let value = this.control.control.value;

        // Remove any commas from the input value
        value = value.replace(/,/g, '');

        if (!isNaN(value) && value !== '') {
            const formattedValue = this.decimalPipe.transform(value, '1.0-5');
            this.control.control.setValue(formattedValue, { emitEvent: false });
        } else {
            // Handle invalid number input
            this.control.control.setValue('');
        }
    }
}
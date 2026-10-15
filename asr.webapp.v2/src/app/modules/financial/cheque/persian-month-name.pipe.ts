import { Pipe, PipeTransform } from "@angular/core";
@Pipe({
    name: 'persianMonthName'
})
export class PersianMonthNamePipe implements PipeTransform {

    transform(value: any, args?: any): any {
        if (value === null || value === undefined || value === '' || Number(value) === 0) {
            return '';
        }

        const monthNumber = Number(value);
        if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
            return 'خارج از محدوده';
        }

        const monthNames = {
            1: 'فروردین',
            2: 'اردیبهشت',
            3: 'خرداد',
            4: 'تیر',
            5: 'مرداد',
            6: 'شهریور',
            7: 'مهر',
            8: 'آبان',
            9: 'آذر',
            10: 'دی',
            11: 'بهمن',
            12: 'اسفند'
        };

        return monthNames[monthNumber].concat(' ').concat('ماه');
    }

}
import { Pipe, PipeTransform } from "@angular/core";
@Pipe({
    name: 'persianMonthName'
})
export class PersianMonthNamePipe implements PipeTransform {



    transform(value: number, args?: any): any {
        if (!value || value === undefined || value === null || value === 0) {
            return "";
        }

        if (value.toString().length > 2) {
            return 'خارج از محدوده';
        }
        let month: string;
        value = parseInt(value.toString());
        switch (value) {
            case 1:
                month = 'فروردین';
                break;
            case 2:
                month = 'اردیبهشت';
                break;
            case 3:
                month = 'خرداد';
                break;
            case 4:
                month = 'تیر';
                break;
            case 5:
                month = 'مرداد';
                break;
            case 6:
                month = 'شهریور';
                break;
            case 7:
                month = 'مهر';
                break;
            case 8:
                month = 'آبان';
                break;
            case 9:
                month = 'آذر';
                break;
            case 10:
                month = 'دی';
                break;
            case 11:
                month = 'بهمن';
                break;
            case 12:
                month = 'اسفند';
                break;
        }
        return month.concat(' ').concat('ماه');
    }

}
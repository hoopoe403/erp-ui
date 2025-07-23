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
                month = 'فروردین';
                break;
            case 3:
                month = 'فروردین';
                break;
            case 4:
                month = 'فروردین';
                break;
            case 5:
                month = 'فروردین';
                break;
            case 6:
                month = 'فروردین';
                break;
            case 7:
                month = 'فروردین';
                break;
            case 8:
                month = 'فروردین';
                break;
            case 9:
                month = 'فروردین';
                break;
            case 10:
                month = 'فروردین';
                break;
            case 11:
                month = 'فروردین';
                break;
            case 12:
                month = 'فروردین';
                break;
        }
        return month.concat(' ').concat('ماه');
    }

}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiHelperService } from 'environments/api-helper.service';

@Injectable({
    providedIn: 'root'
})
export class BankAccountService {

    constructor(private _httpClient: HttpClient) { }

    /**
     * Get banks dropdown list (uses existing financial resource endpoint)
     * TODO: Switch to this method when backend is ready
     */
    getBanksFromApi(): Observable<any> {
        return this._httpClient.get(ApiHelperService.BASE_URL + 'financial/resource/drp/bank').pipe(
            map((data) => data),
            switchMap((data) => {
                if (!data) {
                    return throwError('Could not fetch banks');
                }
                return of(data);
            })
        );
    }

    /**
     * Get mock banks for testing
     * TODO: Remove this method when backend is ready and use getBanksFromApi() instead
     */
    getBanks(): Observable<any> {
        const mockBanks = [
            { bankId: 1, bankCode: 'ZRT', bankName: 'Ziraat Bankası', status: 1, url: '' },
            { bankId: 2, bankCode: 'GAR', bankName: 'Garanti BBVA', status: 1, url: '' },
            { bankId: 3, bankCode: 'ISB', bankName: 'İş Bankası', status: 1, url: '' },
            { bankId: 4, bankCode: 'YKB', bankName: 'Yapı Kredi', status: 1, url: '' },
            { bankId: 5, bankCode: 'AKB', bankName: 'Akbank', status: 1, url: '' },
            { bankId: 6, bankCode: 'HLK', bankName: 'Halkbank', status: 1, url: '' },
            { bankId: 7, bankCode: 'VKF', bankName: 'Vakıfbank', status: 1, url: '' },
            { bankId: 8, bankCode: 'DEN', bankName: 'Denizbank', status: 1, url: '' },
            { bankId: 9, bankCode: 'TEB', bankName: 'TEB', status: 1, url: '' },
            { bankId: 10, bankCode: 'ING', bankName: 'ING Bank', status: 1, url: '' }
        ];
        
        return of({ data: mockBanks, succeed: true });
    }
}

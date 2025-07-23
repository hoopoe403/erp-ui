import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, of, throwError } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";
import { Contractor } from "./contractor.type";
// import { ApiHelperService } from '../../../../environments/api-helper.service';
import { ApiHelperService } from "environments/api-helper.service";
import { Paging } from "app/core/type/paging/paging.type";

@Injectable({
  providedIn: "root",
})
export class ContractorService {
  private url: string = "configuration/contractor/";
  private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(
    null
  );
  private _contractors: BehaviorSubject<Contractor[] | null> =
    new BehaviorSubject(null);
  /**
   * Constructor
   */
  constructor(private _httpClient: HttpClient) {}

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  get pagination$(): Observable<Paging> {
    return this._pagination.asObservable();
  }

  get contractors$(): Observable<Contractor[]> {
    return this._contractors.asObservable();
  }

  disposeContractors$() {
    this._contractors.next([]);
    //  this._expenses.complete();
  }

  disponsePaginator$() {
    this._pagination.next(null);
    // this._pagination.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  getContractors(contractorInfo: any): Observable<any> {
    return this._httpClient
      .post<{ pagination: Paging; contractors: Contractor[] }>(
        ApiHelperService.BASE_URL + this.url + "findByObj",
        contractorInfo
      )
      .pipe(
        tap((response) => {
          this._pagination.next(response.data.page);
          this._contractors.next(response.data.contractors);
        })
      );
  }

  getContractor(id: number): any {
    return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
      map((contractor) => {
        return contractor;
      }),
      switchMap((contractor) => {
        if (!contractor) {
          return throwError("Could not found course with id of " + id + "!");
        }
        return of(contractor);
      })
    );
  }
  getContractorsOnInit(contractorInfo: any): Observable<any> {
    return this._httpClient
      .post<{ pagination: Paging; contractors: Contractor[] }>(
        ApiHelperService.BASE_URL + this.url + "findByObjInOnInit",
        contractorInfo
      )
      .pipe(
        tap((response) => {
          this._pagination.next(response.data.page);
          this._contractors.next(response.data.contractors);
        })
      );
  }

  create(contractor: Contractor): any {
    console.log(contractor);
    return this._httpClient
      .post(ApiHelperService.BASE_URL + this.url + "create", contractor)
      .pipe(
        tap((response: any) => {
          console.log(response);
          return response;
        })
      );
  }

  edit(contractor: Contractor): any {
    console.log(contractor);
    return this._httpClient
      .post(ApiHelperService.BASE_URL + this.url + "edit", contractor)
      .pipe(
        tap((response: any) => {
          console.log(response);
          return response;
        })
      );
  }
  getStatuses(): any {
    return this._httpClient
      .get(ApiHelperService.BASE_URL + this.url + "drp/statuses")
      .pipe(
        map((data) => {
          return data;
        }),
        switchMap((data) => {
          if (!data) {
            return throwError("Could not found course with id of " + "!");
          }

          return of(data);
        })
      );
  }

  getContractorTypes(): any {
    return this._httpClient
      .get(ApiHelperService.BASE_URL + this.url + "drp/contractorType")
      .pipe(
        map((data) => {
          return data;
        }),
        switchMap((data) => {
          if (!data) {
            return throwError("Could not found course with id of " + "!");
          }

          return of(data);
        })
      );
  }
  getSettlementType(): any {
    return this._httpClient
      .get(ApiHelperService.BASE_URL + this.url + "drp/settlementType")
      .pipe(
        map((data) => {
          return data;
        }),
        switchMap((data) => {
          if (!data) {
            return throwError("Could not found course with id of " + "!");
          }

          return of(data);
        })
      );
  }
}

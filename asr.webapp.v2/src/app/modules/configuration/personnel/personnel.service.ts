import { Injectable } from "@angular/core";
import { Personnel } from "./personnel.types";
import { Paging } from "app/core/type/paging/paging.type";
import { BehaviorSubject, Observable, throwError, of } from "rxjs";
import { tap, map, switchMap } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { ApiHelperService } from "environments/api-helper.service";

@Injectable({
  providedIn: "root",
})
export class PersonnelService {
  private url = "configuration/personnel/";
  private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(
    null
  );
  private _personnels: BehaviorSubject<Personnel[] | null> = new BehaviorSubject(
    null
  );

  constructor(private http: HttpClient) {}

  get pagination$(): Observable<Paging> {
    return this._pagination.asObservable();
  }

  get personnels$(): Observable<Personnel[]> {
    return this._personnels.asObservable();
  }

  disposepersonnels$() {
    this._personnels.next([]);
  }

  disponsePaginator$() {
    this._pagination.next(null);
  }

  getPersonnelOnInit(personnel: any): Observable<any> {
    return this.http
      .post<{ pagination: Paging; personnels: Personnel[] }>(
        ApiHelperService.BASE_URL + this.url + "findByObjOnInit",
        personnel
      )
      .pipe(
        tap((response) => {
          console.log(response);
          this._pagination.next(response.data.page);
          this._personnels.next(response.data.personnel);
        })
      );
  }

  getpersonnels(personnel: any): Observable<any> {
    return this.http
      .post<{ pagination: Paging; personnels: Personnel[] }>(
        ApiHelperService.BASE_URL + this.url + "findByObj",
        personnel
      )
      .pipe(
        tap((response) => {
          this._pagination.next(response.data.page);
          this._personnels.next(response.data.personnel);
        })
      );
  }

  getpersonnel(id: number): any {
    return this.http.get(ApiHelperService.BASE_URL + this.url + id).pipe(
      map((personnel) => {
        return personnel;
      }),
      switchMap((personnel) => {
        if (!personnel) {
          return throwError("Could not found course with id of " + id + "!");
        }
        return of(personnel);
      })
    );
  }

  create(personnel: Personnel): any {
    return this.http
      .post(ApiHelperService.BASE_URL + this.url + "create", personnel)
      .pipe(
        tap((response: any) => {
          console.log(response);
          return response;
        })
      );
  }

  edit(personnel: Personnel): any {
    return this.http
      .post(ApiHelperService.BASE_URL + this.url + "edit", personnel)
      .pipe(
        tap((response: any) => {
          console.log(response);
          return response;
        })
      );
  }
}

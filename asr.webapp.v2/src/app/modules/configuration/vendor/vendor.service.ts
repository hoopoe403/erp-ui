import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { ApiHelperService } from "environments/api-helper.service";
import { Paging } from "app/core/type/paging/paging.type";
import { Vendor, VendorList, VendorSearch, VendorStatus, VendorType } from "./vendor.types";

/**
 * erp-be's Vendor API (/api/shared/vendor). Plain HTTP semantics - no `{succeed, message, data}`
 * envelope: a successful call's body IS the resource, and a failure is an HTTP error whose RFC 7807
 * `detail` holds the readable text (400 invalid, 404 not found, 409 duplicate vendor code).
 */
@Injectable({
  providedIn: "root",
})
export class VendorService {
  private url: string = "shared/vendor/";
  private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
  private _vendors: BehaviorSubject<Vendor[] | null> = new BehaviorSubject(null);

  constructor(private _httpClient: HttpClient) {}

  get pagination$(): Observable<Paging> {
    return this._pagination.asObservable();
  }

  get vendors$(): Observable<Vendor[]> {
    return this._vendors.asObservable();
  }

  disposeVendors$(): void {
    this._vendors.next([]);
  }

  disposePaginator$(): void {
    this._pagination.next(null);
  }

  getVendors(search: VendorSearch): Observable<VendorList> {
    return this._httpClient.post<VendorList>(ApiHelperService.BASE_URL + this.url + "findByObj", search).pipe(
      tap((response) => {
        this._pagination.next(response.page);
        this._vendors.next(response.vendors);
      })
    );
  }

  /** 404 (no such vendor) arrives as an HTTP error. */
  getVendor(id: number): Observable<Vendor> {
    return this._httpClient.get<Vendor>(ApiHelperService.BASE_URL + this.url + id);
  }

  /** 201 - emits the stored vendor with its new id. 409 for a duplicate vendor code. */
  create(vendor: Vendor): Observable<Vendor> {
    return this._httpClient.post<Vendor>(ApiHelperService.BASE_URL + this.url + "create", vendor);
  }

  edit(vendor: Vendor): Observable<Vendor> {
    return this._httpClient.post<Vendor>(ApiHelperService.BASE_URL + this.url + "edit", vendor);
  }

  getStatuses(): Observable<VendorStatus[]> {
    return this._httpClient.get<VendorStatus[]>(ApiHelperService.BASE_URL + this.url + "drp/statuses");
  }

  getTypes(): Observable<VendorType[]> {
    return this._httpClient.get<VendorType[]>(ApiHelperService.BASE_URL + this.url + "drp/types");
  }

  /** The readable text of a failed call - the RFC 7807 `detail`, or null when there is none. */
  static errorDetail(error: any): string | null {
    const detail = error && error.error && error.error.detail;
    return typeof detail === "string" && detail ? detail : null;
  }
}

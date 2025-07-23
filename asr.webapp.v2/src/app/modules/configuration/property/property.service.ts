import { Injectable } from "@angular/core";
import { Paging } from "app/core/type/paging/paging.type";
import { BehaviorSubject, Observable, of, throwError } from "rxjs";
import { Property } from "./property.types";
import {HttpClient} from "@angular/common/http";
import { ApiHelperService } from "environments/api-helper.service";
import { tap , map , switchMap } from "rxjs/operators";



@Injectable({
    providedIn: 'root'
  })

export class PropertyService{
    private url :string = 'configuration/property/';
    private _pagination : BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _properties : BehaviorSubject<Property[] | null> = new BehaviorSubject(null);

    /**
   * Constructor
   */
  constructor(private _httpClient :HttpClient){
  }

   //--------------------------------------------------------------------------------------------
   // @Accessors
   //--------------------------------------------------------------------------------------------

   get pagination$() :Observable <Paging>{
        return this._pagination.asObservable();
   }

   get properties$() :Observable <Property[]>{
        return this._properties.asObservable();
   }

   disposeProperties$(){
    this._properties.next([]);
    //  this._expenses.complete();
   }

   disponsePaginator$() {
    this._pagination.next(null);
     // this._pagination.complete();
    }

   //--------------------------------------------------------------------------------------------
   // @ Public methods
   //--------------------------------------------------------------------------------------------
   
   getProperties(propertyInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; properties: Property[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjByPaging', propertyInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._properties.next(response.data.properties);
            })
        );
    }

    getPropertiesOnInit(propertyInfo : any):
    Observable<any> {
        return this._httpClient.post<{ pagination : Paging; properties : Property[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjByPaging' , propertyInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._properties.next(response.data.properties);
              }) 
        );
    }

    getProperty(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((property) => {
                return property;
            }),
            switchMap((property) => {

                if (!property) {
                    return throwError('Could not found course with id of ' + id + '!');
                }

                return of(property);
            })
        );
    }
    getStatuses(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/statuses').pipe(
            map((data) => {
                return data;
            }),
            switchMap((data) => {

                if (!data) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(data);
            })
        );
    }


    getUnits(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/units').pipe(
            map((data) =>{
                return data;
            }),
            switchMap((data) =>{
                if (!data) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(data);
            })
        )
    }

    createProperty(property: Property): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', property).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    editProperty(property: Property): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', property).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }


}
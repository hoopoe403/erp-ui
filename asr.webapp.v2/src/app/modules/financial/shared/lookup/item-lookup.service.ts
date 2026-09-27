import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GoodsService } from 'app/modules/inventory/goods/goods/goods.service';
import { Goods } from 'app/modules/inventory/goods/goods/goods.types';
import { Paging } from 'app/core/type/paging/paging.type';

export interface ItemOption {
    itemId: number;
    itemCode: string;
    itemName: string;
}

/**
 * Item (inventory Goods) picker for Sales Invoice's "IT" line type - the real
 * Goods/Inventory module (inventory/goods/goods), unlike Cost Center/Fixed
 * Asset/VAT groups which have no real module yet. Purchase Invoice has no
 * equivalent of this - a purchase invoice line is G/L or Fixed Asset, never an
 * inventory Item (see SalesInvoiceDetailModel's Javadoc on the erp-be side for
 * why the two invoice types don't share this line type). Always loads real
 * data, never mocked.
 */
@Injectable({
    providedIn: 'root'
})
export class ItemLookupService {

    constructor(private _goodsService: GoodsService) {
    }

    getItems(): Observable<ItemOption[]> {
        const filter: any = {};
        const paging = new Paging();
        paging.flag = true;
        paging.length = 0;
        paging.order = 'asc';
        paging.pageNumber = 1;
        paging.pageSize = 1000;
        paging.sort = '';
        filter.page = paging;
        return this._goodsService.getGoods(filter).pipe(
            map((res: any) => (res && res.data && res.data.goods ? res.data.goods : []) as Goods[]),
            map((goods: Goods[]) => goods.map((g) => ({ itemId: g.goodsId, itemCode: g.goodsCode, itemName: g.goodsName }))),
            catchError(() => of([] as ItemOption[]))
        );
    }
}

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GoodsInventoryListComponent  } from '../list/list.component';

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.component.html',
})
export class MenuItemComponent implements OnInit {
   
  selectedDepName: string;
  @Input() items: any[];
  @ViewChild('buildMenu', { static: true }) public buildMenu;
  constructor(public router: Router, private goodsReport: GoodsInventoryListComponent) {
   }
   public setSelectedCat(selectedItem: string, selectedId: number): void {
    document.getElementById('btnCat0').innerHTML = selectedItem;
    this.selectedDepName = selectedItem;
    this.goodsReport.setSelectedCat(selectedId);
  }
  ngOnInit(): void {
  }

}

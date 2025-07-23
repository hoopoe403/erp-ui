import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FactoryOrderListComponent } from '../list.component';

@Component({
  selector: 'factory-orders-menu-item',
  templateUrl: './factory-orders-menu-item.component.html',
})
export class FactoryOrdersMenuItemComponent implements OnInit {

  selectedDepName: string;
  @Input() items: any[];
  @ViewChild('buildMenu', { static: true }) public buildMenu;
  constructor(public router: Router, private factoryOrders: FactoryOrderListComponent) {
  }
  public setSelectedCat(selectedItem: string, selectedId: number): void {
    document.getElementById('btnCat0').innerHTML = selectedItem;
    this.selectedDepName = selectedItem;
    this.factoryOrders.setSelectedCat(selectedId);
  }
  ngOnInit(): void {
  }

}

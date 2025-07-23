import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FactoryOrderDetailsComponent } from '../details.component';

@Component({
  selector: 'factory-order-menu-item',
  templateUrl: './factory-order-menu-item.component.html',
})
export class FactoryOrderMenuItemComponent implements OnInit {

  selectedDepName: string;
  @Input() items: any[];
  @ViewChild('buildMenu', { static: true }) public buildMenu;
  constructor(public router: Router,/*  private factoryOrder: FactoryOrderDetailsComponent */) {
  }
  public setSelectedCat(selectedItem: string, selectedId: number): void {
    document.getElementById('btnCat0').innerHTML = selectedItem;
    this.selectedDepName = selectedItem;
   /*   this.factoryOrder.setSelectedCat(selectedId);*/
  }
  ngOnInit(): void {
  }

}

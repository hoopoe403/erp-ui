import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BrandDetailsComponent } from '../details/details.component';

@Component({
  selector: 'app-menu-item-list',
  templateUrl: './menu-item-list.component.html'
})
export class MenuItemListComponent implements OnInit {

  @Input() items: any[];
  @ViewChild('buildMenu3', { static: true }) public buildMenu3;
  constructor(public router: Router, private list: BrandDetailsComponent) {
  }
  public setSelectedCat(selectedItem: string, selectedId: number): void {

    const element = document.getElementById('btnCatList0');
    element.innerHTML = selectedItem;
    this.list.setSelectedCat(selectedId);
  }
  ngOnInit() {
  }
}

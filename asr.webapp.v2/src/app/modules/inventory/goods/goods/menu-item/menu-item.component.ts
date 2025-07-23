import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GoodsDetailsComponent } from '../details/details.component';

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss']
})
export class MenuItemComponent implements OnInit {

  @Input() items: any[];
  @ViewChild('buildMenu', { static: true }) public buildMenu;
  @ViewChild('buildMenu2', { static: true }) public buildMenu2;
  constructor(public router: Router, private goods: GoodsDetailsComponent) {
  }
  public setSelectedCat(selectedItem: string, selectedId: number): void {
    const element = document.getElementById('btnCat0');
    if (element) {
      element.innerHTML = selectedItem;
      this.goods.setSelectedCat(selectedId, true);
    }
    else {
      const element2 = document.getElementById('btnCatAd0');
      element2.innerHTML = selectedItem;
      this.goods.setSelectedCatAdSearch(selectedId);

    }
  }
  ngOnInit() {
  }
}

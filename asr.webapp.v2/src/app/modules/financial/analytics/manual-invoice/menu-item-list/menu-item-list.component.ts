import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ManualInvoiceListComponent } from '../list/list.component';
import { Tree } from 'app/core/type/tree/tree.types';

@Component({
  selector: 'app-menu-item-list',
  templateUrl: './menu-item-list.component.html'
})
export class MenuItemListComponent implements OnInit {

  @Input() items: Array<Tree>;
  @ViewChild('buildMenu3', { static: true }) public buildMenu3;
  constructor(public router: Router, private list: ManualInvoiceListComponent) {
  }

  ngOnInit() {
  }
  onFinCatCheckboxChange(event: any, id: number) {
    this.list.onFinCatCheckboxChange(event, id);
  }
  isFinItemSelected(id: number): boolean {
    const indx = this.items.findIndex(x => x.id == id);
    return this.items[indx].isSelected == true;
  }

}

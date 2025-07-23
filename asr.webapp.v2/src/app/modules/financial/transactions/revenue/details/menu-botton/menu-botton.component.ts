import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { RevenueDetailsComponent } from '../details.component';

@Component({
  selector: 'app-menu-botton',
  templateUrl: './menu-botton.component.html'
})
export class MenuBottonComponent implements OnInit {

  @Input() items: any[];
  @ViewChild('buildMenu3', { static: true }) public buildMenu3;
  constructor(public router: Router, private list: RevenueDetailsComponent) {
  }
  public setSelectedCat(selectedItem: string, selectedId: number): void {

    const element = document.getElementById('btnCatList0');
    element.innerHTML = selectedItem;
    this.list.setSelectedCat(selectedId, selectedItem);
  }
  ngOnInit() {
  }
}

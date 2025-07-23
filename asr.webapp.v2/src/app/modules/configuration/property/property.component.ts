import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'Property',
  templateUrl: './property.component.html',
  encapsulation:ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyComponent {
  /**
   * constractor
   */
  constructor() { 
  }
}

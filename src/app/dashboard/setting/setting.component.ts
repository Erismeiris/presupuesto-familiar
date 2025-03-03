import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [],
  template: `<p>setting works!</p>`,
  styleUrl: './setting.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingComponent { }

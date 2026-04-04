import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

interface WearableDeviceView {
  id: string;
  name: string;
  brand: string;
  dataTypes: string[];
  connected: boolean;
  lastSync?: string;
}

@Component({
  selector: "app-data-import-wearables-flow",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardShellComponent, ButtonComponent, StatusTagComponent],
  templateUrl: "./data-import-wearables-flow.component.html",
  styleUrl: "./data-import-wearables-flow.component.scss",
})
export class DataImportWearablesFlowComponent {
  readonly connectedDevices = input<WearableDeviceView[]>([]);
  readonly availableDevices = input<WearableDeviceView[]>([]);

  readonly reset = output<void>();
  readonly syncDevice = output<WearableDeviceView>();
  readonly disconnectDevice = output<WearableDeviceView>();
  readonly connectDevice = output<WearableDeviceView>();
}

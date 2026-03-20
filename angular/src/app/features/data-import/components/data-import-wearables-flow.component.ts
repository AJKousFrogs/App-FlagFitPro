import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
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
  imports: [CommonModule, CardShellComponent, ButtonComponent, StatusTagComponent],
  templateUrl: "./data-import-wearables-flow.component.html",
  styleUrl: "./data-import-wearables-flow.component.scss",
})
export class DataImportWearablesFlowComponent {
  @Input() connectedDevices: WearableDeviceView[] = [];
  @Input() availableDevices: WearableDeviceView[] = [];

  @Output() reset = new EventEmitter<void>();
  @Output() syncDevice = new EventEmitter<WearableDeviceView>();
  @Output() disconnectDevice = new EventEmitter<WearableDeviceView>();
  @Output() connectDevice = new EventEmitter<WearableDeviceView>();
}

import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { Dialog } from "primeng/dialog";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";
import {
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";

type ActiveSession = {
  id: string;
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet";
  location: string;
  lastActive: string;
  isCurrent: boolean;
};

@Component({
  selector: "app-active-sessions-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Dialog, IconButtonComponent, DialogHeaderComponent, DialogFooterComponent],
  templateUrl: "./active-sessions-dialog.component.html",
  styleUrl: "./active-sessions-dialog.component.scss",
})
export class ActiveSessionsDialogComponent {
  visible = input(false);
  loadingSessions = input(false);
  sessions = input<ActiveSession[]>([]);
  isRevokingAll = input(false);

  visibleChange = output<boolean>();
  revokeSession = output<string>();
  revokeAllSessions = output<void>();

  closeDialog(): void {
    this.visibleChange.emit(false);
  }

  getDeviceIcon(deviceType: string): string {
    switch (deviceType) {
      case "mobile":
        return "pi pi-mobile";
      case "tablet":
        return "pi pi-tablet";
      default:
        return "pi pi-desktop";
    }
  }
}

import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { NgClass } from "@angular/common";

/**
 * Block status within the session flow.
 */
export type BlockFlowStatus = "done" | "active" | "upcoming";

/**
 * View-model for a single block card in the horizontal flow strip.
 */
export interface BlockFlowItem {
  name: string;
  exerciseCount: number;
  durationMinutes: number;
  status: BlockFlowStatus;
  /** 0-100 completion within this block. */
  progress: number;
  isKeystone: boolean;
}

@Component({
  selector: "app-today-block-flow",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  templateUrl: "./today-block-flow.component.html",
  styleUrl: "./today-block-flow.component.scss",
})
export class TodayBlockFlowComponent {
  /** Ordered list of blocks in the session. */
  readonly blocks = input<BlockFlowItem[]>([]);

  /** Overall session progress 0-100. */
  readonly overallProgress = input<number>(0);

  /** Emits the index of the tapped block card. */
  readonly blockSelected = output<number>();

  chipLabel(block: BlockFlowItem): string {
    if (block.status === "done") return "Done";
    if (block.status === "active") return "Active";
    if (block.isKeystone) return "★ Keystone";
    return "Up next";
  }

  chipClass(block: BlockFlowItem): string {
    if (block.status === "done") return "chip--success";
    if (block.status === "active") return "chip--warning";
    if (block.isKeystone) return "chip--strength";
    return "";
  }

  metaText(block: BlockFlowItem): string {
    const parts: string[] = [];
    if (block.exerciseCount > 0) {
      parts.push(`${block.exerciseCount} ex`);
    }
    if (block.durationMinutes > 0) {
      parts.push(`~${block.durationMinutes} min`);
    }
    return parts.join(" · ");
  }
}

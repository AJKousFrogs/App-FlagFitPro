import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";

export interface PlayerPosition {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface RouteSegment {
  playerId: string;
  points: { x: number; y: number }[];
}

export type CanvasTool = "select" | "draw" | "add" | "erase";

const DEFAULT_PLAYERS: PlayerPosition[] = [
  { id: "c", label: "C", x: 200, y: 220 },
  { id: "qb", label: "QB", x: 200, y: 260 },
  { id: "wr1", label: "WR1", x: 50, y: 220 },
  { id: "wr2", label: "WR2", x: 350, y: 220 },
  { id: "wr3", label: "WR3", x: 320, y: 180 },
];

@Component({
  selector: "app-play-canvas",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="play-canvas-container">
      <svg
        #canvasSvg
        class="play-canvas-svg"
        [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
        (mousedown)="onMouseDown($event)"
        (mousemove)="onMouseMove($event)"
        (mouseup)="onMouseUp()"
        (mouseleave)="onMouseUp()"
        (touchstart)="onTouchStart($event)"
        (touchmove)="onTouchMove($event)"
        (touchend)="onMouseUp()"
      >
        <!-- Field background -->
        <rect x="0" y="0" [attr.width]="width()" [attr.height]="height()" fill="var(--color-field-bg, #2d5a27)" rx="4"/>

        <!-- End zone -->
        <rect x="0" y="0" [attr.width]="width()" height="40" fill="var(--color-field-endzone, #1e4220)" opacity="0.6"/>
        <text [attr.x]="width() / 2" y="26" text-anchor="middle" fill="white" font-size="12" font-weight="600" opacity="0.7">END ZONE</text>

        <!-- Yard lines -->
        @for (i of yardLines(); track i) {
          <line [attr.x1]="0" [attr.y1]="i" [attr.x2]="width()" [attr.y2]="i" stroke="white" stroke-opacity="0.2" stroke-width="1"/>
        }

        <!-- Scrimmage line -->
        <line [attr.x1]="0" y1="210" [attr.x2]="width()" y2="210" stroke="var(--color-field-scrimmage, #f59e0b)" stroke-width="2" stroke-dasharray="6,4"/>
        <text x="8" y="207" fill="var(--color-field-scrimmage, #f59e0b)" font-size="9" font-weight="500" opacity="0.8">SCRIMMAGE</text>

        <!-- Drawn routes -->
        @for (route of routes(); track route.playerId) {
          <polyline
            [attr.points]="routeToSvgPoints(route)"
            fill="none"
            stroke="white"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            marker-end="url(#arrowhead)"
          />
        }

        <!-- Active drawing -->
        @if (activeRoute().length > 1) {
          <polyline
            [attr.points]="pointsToSvg(activeRoute())"
            fill="none"
            stroke="var(--ui-info, #3b82f6)"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-dasharray="4,3"
          />
        }

        <!-- Player markers -->
        @for (player of players(); track player.id) {
          <g
            class="player-marker-g"
            [class.selected]="selectedPlayerId() === player.id"
            [attr.transform]="'translate(' + player.x + ',' + player.y + ')'"
            (mousedown)="onPlayerMouseDown($event, player)"
            (touchstart)="onPlayerTouchStart($event, player)"
          >
            <circle r="16" [attr.fill]="selectedPlayerId() === player.id ? 'var(--ui-info, #3b82f6)' : 'var(--ds-primary-green, #22c55e)'" stroke="white" stroke-width="2"/>
            <text text-anchor="middle" dy="4" fill="white" font-size="10" font-weight="700" style="pointer-events: none">{{ player.label }}</text>
          </g>
        }

        <!-- Arrow marker definition -->
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="white"/>
          </marker>
        </defs>
      </svg>

      <div class="canvas-toolbar">
        <button type="button" class="tool-btn" [class.active]="activeTool() === 'select'" (click)="setTool('select')" title="Select & Move">
          <i class="pi pi-arrows-alt" aria-hidden="true"></i>
        </button>
        <button type="button" class="tool-btn" [class.active]="activeTool() === 'draw'" (click)="setTool('draw')" title="Draw Route">
          <i class="pi pi-pencil" aria-hidden="true"></i>
        </button>
        <button type="button" class="tool-btn" [class.active]="activeTool() === 'erase'" (click)="setTool('erase')" title="Erase Route">
          <i class="pi pi-eraser" aria-hidden="true"></i>
        </button>
        <span class="tool-separator"></span>
        <button type="button" class="tool-btn" (click)="undo()" title="Undo" [disabled]="undoStack().length === 0">
          <i class="pi pi-undo" aria-hidden="true"></i>
        </button>
        <button type="button" class="tool-btn" (click)="clearAll()" title="Clear All">
          <i class="pi pi-trash" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `,
  styles: `
    .play-canvas-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 8px);
    }

    .play-canvas-svg {
      width: 100%;
      max-width: 420px;
      aspect-ratio: 4 / 3.5;
      border-radius: var(--radius-md, 8px);
      cursor: crosshair;
      touch-action: none;
      user-select: none;
    }

    .player-marker-g {
      cursor: grab;
      &.selected circle { stroke: var(--ui-info, #3b82f6); stroke-width: 3; }
      &:hover circle { filter: brightness(1.15); }
    }

    .canvas-toolbar {
      display: flex;
      gap: var(--space-1, 4px);
      align-items: center;
    }

    .tool-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid var(--color-border-primary, #334155);
      border-radius: var(--radius-sm, 6px);
      background: var(--color-surface-secondary, #1e293b);
      color: var(--color-text-secondary, #94a3b8);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        background: var(--color-surface-tertiary, #334155);
        color: var(--color-text-primary, #f8fafc);
      }

      &.active {
        background: var(--ui-info, #3b82f6);
        color: white;
        border-color: var(--ui-info, #3b82f6);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .tool-separator {
      width: 1px;
      height: 24px;
      background: var(--color-border-primary, #334155);
      margin: 0 var(--space-1, 4px);
    }
  `,
})
export class PlayCanvasComponent implements OnDestroy {
  readonly width = input(400);
  readonly height = input(350);
  readonly readonly = input(false);
  readonly routesChanged = output<RouteSegment[]>();
  readonly playersChanged = output<PlayerPosition[]>();

  private readonly svgRef = viewChild<ElementRef<SVGSVGElement>>("canvasSvg");

  readonly players = signal<PlayerPosition[]>([...DEFAULT_PLAYERS]);
  readonly routes = signal<RouteSegment[]>([]);
  readonly activeTool = signal<CanvasTool>("select");
  readonly selectedPlayerId = signal<string | null>(null);
  readonly activeRoute = signal<{ x: number; y: number }[]>([]);
  readonly undoStack = signal<RouteSegment[][]>([]);

  readonly yardLines = computed(() => {
    const lines: number[] = [];
    for (let y = 60; y < this.height(); y += 30) {
      lines.push(y);
    }
    return lines;
  });

  private isDrawing = false;
  private isDragging = false;
  private dragPlayer: PlayerPosition | null = null;
  private dragOffset = { x: 0, y: 0 };

  setTool(tool: CanvasTool): void {
    if (this.readonly()) return;
    this.activeTool.set(tool);
    this.selectedPlayerId.set(null);
  }

  onPlayerMouseDown(event: MouseEvent, player: PlayerPosition): void {
    event.stopPropagation();
    if (this.readonly()) return;

    if (this.activeTool() === "erase") {
      this.pushUndo();
      this.routes.update((r) => r.filter((seg) => seg.playerId !== player.id));
      this.routesChanged.emit(this.routes());
      return;
    }

    if (this.activeTool() === "draw") {
      this.selectedPlayerId.set(player.id);
      this.isDrawing = true;
      this.activeRoute.set([{ x: player.x, y: player.y }]);
      return;
    }

    this.selectedPlayerId.set(player.id);
    this.isDragging = true;
    this.dragPlayer = player;
    const pt = this.svgPoint(event);
    this.dragOffset = { x: pt.x - player.x, y: pt.y - player.y };
  }

  onPlayerTouchStart(event: TouchEvent, player: PlayerPosition): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.readonly()) return;

    const touch = event.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    this.onPlayerMouseDown(mouseEvent, player);
  }

  onMouseDown(event: MouseEvent): void {
    if (this.readonly()) return;
    if (this.activeTool() !== "draw") {
      this.selectedPlayerId.set(null);
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.readonly()) return;
    const pt = this.svgPoint(event);

    if (this.isDrawing) {
      this.activeRoute.update((pts) => [...pts, pt]);
      return;
    }

    if (this.isDragging && this.dragPlayer) {
      const newX = Math.max(16, Math.min(this.width() - 16, pt.x - this.dragOffset.x));
      const newY = Math.max(16, Math.min(this.height() - 16, pt.y - this.dragOffset.y));
      this.players.update((players) =>
        players.map((p) =>
          p.id === this.dragPlayer!.id ? { ...p, x: newX, y: newY } : p,
        ),
      );
    }
  }

  onMouseUp(): void {
    if (this.isDrawing && this.activeRoute().length > 2 && this.selectedPlayerId()) {
      this.pushUndo();
      const newRoute: RouteSegment = {
        playerId: this.selectedPlayerId()!,
        points: this.simplifyPoints(this.activeRoute()),
      };
      this.routes.update((r) => [
        ...r.filter((seg) => seg.playerId !== newRoute.playerId),
        newRoute,
      ]);
      this.routesChanged.emit(this.routes());
    }

    if (this.isDragging) {
      this.playersChanged.emit(this.players());
    }

    this.isDrawing = false;
    this.isDragging = false;
    this.dragPlayer = null;
    this.activeRoute.set([]);
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    this.onMouseDown(new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    }));
  }

  onTouchMove(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.onMouseMove(new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    }));
  }

  undo(): void {
    const stack = this.undoStack();
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    this.undoStack.update((s) => s.slice(0, -1));
    this.routes.set(prev);
    this.routesChanged.emit(prev);
  }

  clearAll(): void {
    if (this.routes().length === 0) return;
    this.pushUndo();
    this.routes.set([]);
    this.routesChanged.emit([]);
  }

  routeToSvgPoints(route: RouteSegment): string {
    return this.pointsToSvg(route.points);
  }

  pointsToSvg(points: { x: number; y: number }[]): string {
    return points.map((p) => `${p.x},${p.y}`).join(" ");
  }

  ngOnDestroy(): void {
    this.isDrawing = false;
    this.isDragging = false;
  }

  private pushUndo(): void {
    this.undoStack.update((s) => [...s.slice(-9), [...this.routes()]]);
  }

  private svgPoint(event: MouseEvent): { x: number; y: number } {
    const svg = this.svgRef()?.nativeElement;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = this.width() / rect.width;
    const scaleY = this.height() / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  private simplifyPoints(
    points: { x: number; y: number }[],
    tolerance = 3,
  ): { x: number; y: number }[] {
    if (points.length <= 2) return points;
    const result = [points[0]];
    let last = points[0];
    for (let i = 1; i < points.length - 1; i++) {
      const dx = points[i].x - last.x;
      const dy = points[i].y - last.y;
      if (Math.sqrt(dx * dx + dy * dy) >= tolerance) {
        result.push(points[i]);
        last = points[i];
      }
    }
    result.push(points[points.length - 1]);
    return result;
  }
}

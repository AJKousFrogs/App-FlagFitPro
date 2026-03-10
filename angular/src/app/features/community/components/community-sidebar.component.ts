import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { CommonModule, DecimalPipe } from "@angular/common";
import { Avatar } from "primeng/avatar";
import { Tooltip } from "primeng/tooltip";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { COLORS } from "../../../core/constants/app.constants";

interface LeaderboardEntry {
  rank: number;
  name: string;
  initials: string;
  score: number;
}

interface TrendingTopic {
  name: string;
  count: number;
}

interface UserStats {
  posts: number;
  likes: number;
  comments: number;
}

@Component({
  selector: "app-community-sidebar",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DecimalPipe,
    Avatar,
    Tooltip,
    ButtonComponent,
    CardShellComponent,
  ],
  templateUrl: "./community-sidebar.component.html",
  styleUrl: "./community-sidebar.component.scss",
})
export class CommunitySidebarComponent {
  leaderboard = input<LeaderboardEntry[]>([]);
  trendingTopics = input<TrendingTopic[]>([]);
  selectedTopic = input<string | null>(null);
  userStats = input<UserStats>({ posts: 0, likes: 0, comments: 0 });

  selectTopic = output<string>();
  clearTopicFilter = output<void>();

  getAvatarColorClass(initials: string): string {
    const index = initials.charCodeAt(0) % COLORS.CHART.length;
    return `avatar-color-${index}`;
  }
}

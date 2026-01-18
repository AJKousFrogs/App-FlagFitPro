import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { SupabaseDebugService } from "@core/services/supabase-debug.service";
import { SupabaseClient, createClient } from "@supabase/supabase-js";

interface DebugLog {
  timestamp: Date;
  level: "info" | "success" | "warning" | "error";
  message: string;
  details?: any;
}

/**
 * Debug Console Component
 * Interactive debugging interface for Supabase operations
 */
@Component({
  selector: "app-debug-console",
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="debug-console">
      <h2>🔍 Supabase Debug Console</h2>

      <div class="debug-controls">
        <button (click)="toggleDebugMode()" [class.active]="debugModeEnabled">
          {{ debugModeEnabled ? "🟢 Debug ON" : "⚪ Debug OFF" }}
        </button>

        <button (click)="clearLogs()">🗑️ Clear Logs</button>

        <button (click)="exportLogs()">💾 Export Logs</button>

        <button (click)="showStats()">📊 Show Stats</button>
      </div>

      <div class="test-section">
        <h3>Quick Tests</h3>

        <div class="test-grid">
          <div class="test-card">
            <h4>RLS Policies</h4>
            <select [(ngModel)]="selectedTable">
              <option value="user_profiles">user_profiles</option>
              <option value="injuries">injuries</option>
              <option value="daily_wellness_checkin">
                daily_wellness_checkin
              </option>
              <option value="nutrition_logs">nutrition_logs</option>
            </select>
            <button (click)="testRLSPolicies()">Test Policies</button>
          </div>

          <div class="test-card">
            <h4>Schema Validation</h4>
            <button (click)="validateSchema()">Validate Schema</button>
          </div>

          <div class="test-card">
            <h4>Index Check</h4>
            <button (click)="checkIndexes()">Check Indexes</button>
          </div>

          <div class="test-card">
            <h4>Test Insert</h4>
            <button (click)="testInsert()">Test Insert</button>
          </div>

          <div class="test-card">
            <h4>Test Update</h4>
            <button (click)="testUpdate()">Test Update</button>
          </div>

          <div class="test-card">
            <h4>Realtime Test</h4>
            <button (click)="toggleRealtimeTest()" [disabled]="realtimeActive">
              {{ realtimeActive ? "⏹️ Stop" : "▶️ Start" }} Realtime
            </button>
          </div>
        </div>
      </div>

      <div class="logs-section">
        <h3>Debug Logs</h3>
        <div class="logs-container">
          @for (log of logs; track log.timestamp) {
            <div
              class="log-entry"
              [class.log-info]="log.level === 'info'"
              [class.log-success]="log.level === 'success'"
              [class.log-warning]="log.level === 'warning'"
              [class.log-error]="log.level === 'error'"
            >
              <span class="log-time">{{
                log.timestamp | date: "HH:mm:ss.SSS"
              }}</span>
              <span class="log-level">{{ log.level.toUpperCase() }}</span>
              <span class="log-message">{{ log.message }}</span>
              @if (log.details) {
                <pre class="log-details">{{ log.details | json }}</pre>
              }
            </div>
          }
        </div>
      </div>

      @if (showStatsPanel) {
        <div class="stats-section">
          <h3>Performance Statistics</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-block__value">{{ stats?.total || 0 }}</div>
              <div class="stat-block__label">Total Queries</div>
            </div>
            <div class="stat-card">
              <div class="stat-block__value success">
                {{ stats?.successful || 0 }}
              </div>
              <div class="stat-block__label">Successful</div>
            </div>
            <div class="stat-card">
              <div class="stat-block__value error">{{ stats?.failed || 0 }}</div>
              <div class="stat-block__label">Failed</div>
            </div>
            <div class="stat-card">
              <div class="stat-block__value">
                {{ stats?.avgDuration?.toFixed(2) || 0 }}ms
              </div>
              <div class="stat-block__label">Avg Duration</div>
            </div>
          </div>

          @if (stats?.byTable) {
            <div class="by-table">
              <h4>Queries by Table</h4>
              <div class="table-stats">
                @for (entry of objectEntries(stats.byTable); track entry[0]) {
                  <div class="table-stat">
                    <span class="table-name">{{ entry[0] }}</span>
                    <span class="table-count">{{ entry[1] }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .debug-console {
        padding: var(--ds-space-5);
        background: #1e1e1e;
        color: #d4d4d4;
        font-family: var(--ds-font-family-mono); /* ds-exception: monospace console */
        min-height: 100vh;
      }

      h2 {
        color: #4ec9b0;
        margin-bottom: var(--ds-space-5);
      }

      h3 {
        color: #569cd6;
        margin: var(--ds-space-5) 0 calc(var(--ds-space-5) / 2);
      }

      .debug-controls {
        display: flex;
        gap: calc(var(--ds-space-5) / 2);
        margin-bottom: var(--ds-space-5);
      }

      button {
        padding: var(--ds-space-2) var(--ds-space-4);
        background: #2d2d2d;
        color: #d4d4d4;
        border: 1px solid #3e3e3e;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }

      button:hover {
        background: #3e3e3e;
        border-color: #569cd6;
      }

      button:active {
        background: #1e1e1e;
      }

      button.active {
        background: #0e639c;
        border-color: #569cd6;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .test-section {
        margin-bottom: 30px;
      }

      .test-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: calc(var(--ds-space-4) - (var(--ds-space-1) / 4));
        margin-top: calc(var(--ds-space-4) - (var(--ds-space-1) / 4));
      }

      .test-card {
        background: #2d2d2d;
        padding: calc(var(--ds-space-4) - (var(--ds-space-1) / 4));
        border-radius: 4px;
        border: 1px solid #3e3e3e;
      }

      .test-card h4 {
        color: #9cdcfe;
        margin: 0 0 calc(var(--ds-space-5) / 2);
        font-size: var(--ds-font-size-sm);
      }

      .test-card select {
        width: 100%;
        padding: calc(var(--ds-space-3) / 2);
        background: #1e1e1e;
        color: #d4d4d4;
        border: 1px solid #3e3e3e;
        border-radius: 4px;
        margin-bottom: var(--ds-space-2);
      }

      .test-card button {
        width: 100%;
        padding: var(--ds-space-2);
        font-size: var(--ds-font-size-xs);
      }

      .logs-section {
        margin-top: 30px;
      }

      .logs-container {
        background: #1e1e1e;
        border: 1px solid #3e3e3e;
        border-radius: 4px;
        padding: calc(var(--ds-space-5) / 2);
        max-height: 500px;
        overflow-y: auto;
      }

      .log-entry {
        padding: var(--ds-space-2);
        margin-bottom: 4px;
        border-left: 3px solid transparent;
        font-size: var(--ds-font-size-xs);
      }

      .log-entry.log-info {
        border-left-color: #569cd6;
        background: rgba(86, 156, 214, 0.1);
      }

      .log-entry.log-success {
        border-left-color: #4ec9b0;
        background: rgba(78, 201, 176, 0.1);
      }

      .log-entry.log-warning {
        border-left-color: #ce9178;
        background: rgba(206, 145, 120, 0.1);
      }

      .log-entry.log-error {
        border-left-color: #f48771;
        background: rgba(244, 135, 113, 0.1);
      }

      .log-time {
        color: #808080;
        margin-right: var(--ds-space-2);
      }

      .log-level {
        margin-right: var(--ds-space-2);
        font-weight: var(--ds-font-weight-bold);
      }

      .log-info .log-level {
        color: #569cd6;
      }
      .log-success .log-level {
        color: #4ec9b0;
      }
      .log-warning .log-level {
        color: #ce9178;
      }
      .log-error .log-level {
        color: #f48771;
      }

      .log-message {
        color: #d4d4d4;
      }

      .log-details {
        margin-top: 4px;
        padding: var(--ds-space-2);
        background: #000;
        border-radius: 2px;
        font-size: var(--ds-font-size-compact-md);
        color: #9cdcfe;
        overflow-x: auto;
      }

      .stats-section {
        margin-top: var(--ds-space-6);
        background: #2d2d2d;
        padding: var(--ds-space-5);
        border-radius: 4px;
        border: 1px solid #3e3e3e;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: calc(var(--ds-space-4) - (var(--ds-space-1) / 4));
        margin-top: calc(var(--ds-space-4) - (var(--ds-space-1) / 4));
      }

      .stat-card {
        background: #1e1e1e;
        padding: calc(var(--ds-space-4) - (var(--ds-space-1) / 4));
        border-radius: 4px;
        text-align: center;
      }

      .stat-block__value {
        font-size: var(--ds-font-size-3xl);
        font-weight: var(--ds-font-weight-bold);
        color: #569cd6;
        margin-bottom: calc(var(--ds-space-1) + (var(--ds-space-1) / 4));
      }

      .stat-block__value.success {
        color: #4ec9b0;
      }
      .stat-block__value.error {
        color: #f48771;
      }

      .stat-block__label {
        font-size: var(--ds-font-size-xs);
        color: #808080;
        text-transform: var(--ds-text-transform-uppercase);
      }

      .by-table {
        margin-top: var(--ds-space-5);
      }

      .table-stats {
        display: grid;
        gap: var(--ds-space-2);
        margin-top: calc(var(--ds-space-5) / 2);
      }

      .table-stat {
        display: flex;
        justify-content: space-between;
        padding: var(--ds-space-2);
        background: #1e1e1e;
        border-radius: 4px;
      }

      .table-name {
        color: #9cdcfe;
      }

      .table-count {
        color: #b5cea8;
        font-weight: var(--ds-font-weight-bold);
      }
    `,
  ],
})
export class DebugConsoleComponent implements OnInit, OnDestroy {
  private debugService = inject(SupabaseDebugService);

  debugModeEnabled = false;
  selectedTable = "user_profiles";
  realtimeActive = false;
  showStatsPanel = false;
  logs: DebugLog[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats: any = null;

  private supabase!: SupabaseClient;
  private userId!: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private realtimeSubscription: any;

  async ngOnInit() {
    // Initialize Supabase client
    const supabaseUrl = ""; // Get from environment
    const supabaseKey = ""; // Get from environment

    if (!supabaseUrl || !supabaseKey) {
      this.addLog("error", "Supabase configuration missing", {
        message: "Please configure SUPABASE_URL and SUPABASE_ANON_KEY",
      });
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Get current user
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) {
      this.addLog("error", "No authenticated user", {
        message: "Please login to use debug console",
      });
      return;
    }

    this.userId = user.id;
    this.addLog("info", "Debug console initialized", { userId: this.userId });
  }

  ngOnDestroy() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
  }

  toggleDebugMode() {
    this.debugModeEnabled = !this.debugModeEnabled;

    if (this.debugModeEnabled) {
      this.debugService.enableDebugMode();
      this.addLog("success", "Debug mode enabled");
    } else {
      this.debugService.disableDebugMode();
      this.addLog("info", "Debug mode disabled");
    }
  }

  async testRLSPolicies() {
    this.addLog("info", `Testing RLS policies for ${this.selectedTable}...`);

    try {
      const result = await this.debugService.testRLSPolicies(
        this.supabase,
        this.selectedTableModule,
        this.userId,
      );

      if (result.passed) {
        this.addLog("success", "All RLS policy tests passed", result.results);
      } else {
        this.addLog("warning", "Some RLS policy tests failed", result.results);
      }
    } catch (error) {
      this.addLog("error", "RLS policy test failed", error);
    }
  }

  async validateSchema() {
    this.addLog("info", `Validating schema for ${this.selectedTable}...`);

    const expectedColumns: { [key: string]: string[] } = {
      user_profiles: ["id", "full_name", "role", "created_at", "updated_at"],
      injuries: [
        "id",
        "user_id",
        "injury_type",
        "injury_date",
        "status",
        "created_at",
        "updated_at",
      ],
      daily_wellness_checkin: [
        "id",
        "user_id",
        "sleep_hours",
        "energy_level",
        "created_at",
      ],
      nutrition_logs: ["id", "user_id", "meal_type", "calories", "created_at"],
    };

    try {
      const result = await this.debugService.validateSchema(
        this.supabase,
        this.selectedTableModule,
        expectedColumns[this.selectedTable] || [],
      );

      if (result.valid) {
        this.addLog("success", "Schema validation passed", result);
      } else {
        this.addLog("warning", "Schema validation failed", result);
      }
    } catch (error) {
      this.addLog("error", "Schema validation error", error);
    }
  }

  async checkIndexes() {
    this.addLog("info", "Checking indexes...");

    const tables = [
      "user_profiles",
      "injuries",
      "daily_wellness_checkin",
      "nutrition_logs",
    ];

    try {
      const results = await this.debugService.checkIndexes(
        this.supabase,
        tables,
      );

      const missingIndexes = results.filter((r) => !r.hasIndex);
      if (missingIndexes.length === 0) {
        this.addLog("success", "All tables have required indexes", results);
      } else {
        this.addLog("warning", "Some tables missing indexes", results);
      }
    } catch (error) {
      this.addLog("error", "Index check failed", error);
    }
  }

  async testInsert() {
    this.addLog("info", `Testing insert on ${this.selectedTable}...`);

    const testData = this.getTestData();

    try {
      const result = await this.debugService.testUpsert(
        this.supabase,
        this.selectedTableModule,
        testData,
        { upsert: false },
      );

      if (result.success) {
        this.addLog("success", "Insert test passed", result.data);

        // Cleanup
        if (result.data?.[0]?.id) {
          await this.supabase
            .from(this.selectedTable)
            .delete()
            .eq("id", result.data[0].id);
          this.addLog("info", "Test data cleaned up");
        }
      } else {
        this.addLog("error", "Insert test failed", result.error);
      }
    } catch (error) {
      this.addLog("error", "Insert test error", error);
    }
  }

  async testUpdate() {
    this.addLog("info", `Testing update on ${this.selectedTable}...`);

    // First insert a record
    const testData = this.getTestData();

    try {
      const insertResult = await this.supabase
        .from(this.selectedTable)
        .insert(testData)
        .select()
        .single();

      if (insertResult.error) {
        this.addLog("error", "Failed to insert test data", insertResult.error);
        return;
      }

      const recordId = insertResult.data.id;

      // Now test update
      const updateData = { updated_at: new Date().toISOString() };
      const updateResult = await this.supabase
        .from(this.selectedTable)
        .update(updateData)
        .eq("id", recordId);

      if (updateResult.error) {
        this.addLog("error", "Update test failed", updateResult.error);
      } else {
        this.addLog("success", "Update test passed");
      }

      // Cleanup
      await this.supabase.from(this.selectedTable).delete().eq("id", recordId);
      this.addLog("info", "Test data cleaned up");
    } catch (error) {
      this.addLog("error", "Update test error", error);
    }
  }

  toggleRealtimeTest() {
    if (this.realtimeActive) {
      this.stopRealtimeTest();
    } else {
      this.startRealtimeTest();
    }
  }

  startRealtimeTest() {
    this.addLog("info", `Starting realtime test for ${this.selectedTable}...`);

    this.realtimeSubscription =
      this.debugService.subscribeWithConflictDetection(
        this.supabase,
        this.selectedTableModule,
        this.userId,
        (data) => {
          this.addLog("info", "Realtime update received", data);
        },
        (local, remote) => {
          this.addLog("warning", "Conflict detected", { local, remote });
          // Last write wins
          return remote;
        },
      );

    this.realtimeActive = true;
    this.addLog("success", "Realtime test started");
  }

  stopRealtimeTest() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }

    this.realtimeActive = false;
    this.addLog("info", "Realtime test stopped");
  }

  showStats() {
    this.stats = this.debugService.getQueryStats();
    this.showStatsPanel = !this.showStatsPanel;
    this.addLog("info", "Query statistics updated", this.stats);
  }

  clearLogs() {
    this.logs = [];
    this.debugService.clearQueryLog();
    this.addLog("info", "Logs cleared");
  }

  exportLogs() {
    const queryLog = this.debugService.exportQueryLog();
    const blob = new Blob([queryLog], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supabase-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.addLog("success", "Logs exported");
  }

  private addLog(level: DebugLog["level"], message: string, details?: any) {
    this.logs.unshift({
      timestamp: new Date(),
      level,
      message,
      details,
    });

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.pop();
    }
  }

  private getTestData(): any {
    const baseData = {
      user_id: this.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    switch (this.selectedTable) {
      case "user_profiles":
        return {
          id: this.userId,
          ...baseData,
          full_name: "Test User",
          role: "athlete",
        };
      case "injuries":
        return {
          ...baseData,
          injury_type: "test",
          injury_date: new Date().toISOString(),
          status: "active",
          body_part: "test",
          severity: "minor",
        };
      case "daily_wellness_checkin":
        return {
          ...baseData,
          sleep_hours: 8,
          energy_level: 5,
        };
      case "nutrition_logs":
        return {
          ...baseData,
          meal_type: "breakfast",
          calories: 500,
        };
      default:
        return baseData;
    }
  }

  objectEntries(obj: any): [string, any][] {
    return Object.entries(obj);
  }
}

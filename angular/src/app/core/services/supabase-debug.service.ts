import { Injectable } from "@angular/core";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Debugging Service
 * Comprehensive debugging toolkit for backend issues
 */
@Injectable({
  providedIn: "root",
})
export class SupabaseDebugService {
  private debugMode = false;
  private queryLog: Array<{
    timestamp: Date;
    table: string;
    operation: string;
    duration: number;
    success: boolean;
    error?: any;
  }> = [];

  /**
   * Enable debug mode to log all Supabase operations
   */
  enableDebugMode(): void {
    this.debugMode = true;
    console.log("[SupabaseDebug] Debug mode enabled");
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.debugMode = false;
    console.log("[SupabaseDebug] Debug mode disabled");
  }

  /**
   * Test upsert/insert on a table with detailed error logging
   */
  async testUpsert(
    supabase: SupabaseClient,
    table: string,
    data: any,
    options: { upsert?: boolean; onConflict?: string } = {},
  ): Promise<{ success: boolean; error?: any; data?: any }> {
    const startTime = performance.now();
    const operation = options.upsert ? "upsert" : "insert";

    console.group(`[SupabaseDebug] Testing ${operation} on ${table}`);
    console.log("Data:", JSON.stringify(data, null, 2));

    try {
      const query = supabase.from(table);
      let result: any;

      if (options.upsert) {
        result = await query.upsert(data, {
          onConflict: options.onConflict,
        });
      } else {
        result = await query.insert(data);
      }

      const duration = performance.now() - startTime;

      if (result.error) {
        console.error("❌ Error:", result.error);
        console.error("Error code:", result.error.code);
        console.error("Error message:", result.error.message);
        console.error("Error details:", result.error.details);
        console.error("Error hint:", result.error.hint);

        // Log specific RLS-related errors
        if (
          result.error.code === "42501" ||
          result.error.message?.includes("policy")
        ) {
          console.error("🔒 RLS Policy violation detected");
          console.error("Check if auth.uid() matches user_id in the data");
          console.error(
            "Run: SELECT * FROM pg_policies WHERE tablename = '" + table + "';",
          );
        }

        // Log schema-related errors
        if (
          result.error.code === "42703" ||
          result.error.message?.includes("column")
        ) {
          console.error("📋 Schema issue detected");
          console.error("Column does not exist in table");
          console.error(
            "Run: SELECT column_name FROM information_schema.columns WHERE table_name = '" +
              table +
              "';",
          );
        }

        this.logQuery(table, operation, duration, false, result.error);
        console.groupEnd();
        return { success: false, error: result.error };
      }

      console.log("✅ Success");
      console.log("Duration:", duration.toFixed(2), "ms");
      console.log("Result data:", result.data);

      this.logQuery(table, operation, duration, true);
      console.groupEnd();
      return { success: true, data: result.data };
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error("❌ Exception:", error);
      this.logQuery(table, operation, duration, false, error);
      console.groupEnd();
      return { success: false, error };
    }
  }

  /**
   * Test RLS policies for a specific table
   */
  async testRLSPolicies(
    supabase: SupabaseClient,
    table: string,
    userId: string,
  ): Promise<{ passed: boolean; results: any[] }> {
    console.group(`[SupabaseDebug] Testing RLS policies for ${table}`);

    const results = [];
    const testData = this.getTestDataForTable(table, userId);

    // Test SELECT
    console.log("Testing SELECT...");
    const selectResult = await supabase.from(table).select("*").limit(1);
    results.push({
      operation: "SELECT",
      success: !selectResult.error,
      error: selectResult.error,
    });
    console.log(selectResult.error ? "❌ Failed" : "✅ Passed");

    // Test INSERT
    console.log("Testing INSERT...");
    const insertResult = await this.testUpsert(supabase, table, testData, {
      upsert: false,
    });
    results.push({
      operation: "INSERT",
      success: insertResult.success,
      error: insertResult.error,
    });

    // Test UPDATE (if insert succeeded)
    if (insertResult.success && insertResult.data?.[0]) {
      console.log("Testing UPDATE...");
      const updateData = { ...testData, updated_at: new Date().toISOString() };
      const updateResult = await supabase
        .from(table)
        .update(updateData)
        .eq("id", insertResult.data[0].id);
      results.push({
        operation: "UPDATE",
        success: !updateResult.error,
        error: updateResult.error,
      });
      console.log(updateResult.error ? "❌ Failed" : "✅ Passed");

      // Test DELETE
      console.log("Testing DELETE...");
      const deleteResult = await supabase
        .from(table)
        .delete()
        .eq("id", insertResult.data[0].id);
      results.push({
        operation: "DELETE",
        success: !deleteResult.error,
        error: deleteResult.error,
      });
      console.log(deleteResult.error ? "❌ Failed" : "✅ Passed");
    }

    const passed = results.every((r) => r.success);
    console.log(passed ? "✅ All tests passed" : "❌ Some tests failed");
    console.groupEnd();

    return { passed, results };
  }

  /**
   * Check for missing indexes on user_id columns
   */
  async checkIndexes(
    supabase: SupabaseClient,
    tables: string[],
  ): Promise<{ table: string; hasIndex: boolean; indexName?: string }[]> {
    console.group("[SupabaseDebug] Checking indexes");

    const results = [];

    for (const table of tables) {
      const { data, error } = await supabase.rpc("check_user_id_index", {
        table_name: table,
      });

      if (error) {
        console.warn(`Could not check index for ${table}:`, error.message);
        // Fallback: query pg_indexes
        const { data: indexData } = await supabase.rpc("get_table_indexes", {
          table_name: table,
        });

        const hasUserIdIndex = indexData?.some((idx: any) =>
          idx.columns?.includes("user_id"),
        );

        results.push({
          table,
          hasIndex: !!hasUserIdIndex,
          indexName: indexData?.find((idx: any) =>
            idx.columns?.includes("user_id"),
          )?.indexname,
        });
      } else {
        results.push({
          table,
          hasIndex: !!data,
          indexName: data?.indexname,
        });
      }
    }

    console.table(results);
    console.groupEnd();

    return results;
  }

  /**
   * Monitor realtime changes and detect conflicts
   */
  subscribeWithConflictDetection(
    supabase: SupabaseClient,
    table: string,
    userId: string,
    onUpdate: (payload: any) => void,
    onConflict: (local: any, remote: any) => any,
  ): any {
    console.log(
      `[SupabaseDebug] Setting up realtime with conflict detection for ${table}`,
    );

    const localVersion: { [key: string]: any } = {};

    const channel = supabase
      .channel(`${table}_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log(`[SupabaseDebug] Realtime change detected:`, payload);

          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "INSERT"
          ) {
            const remoteData = payload.new;
            const recordId = remoteData.id;

            // Check for conflict
            if (localVersion[recordId]) {
              const localUpdatedAt = new Date(
                localVersion[recordId].updated_at,
              );
              const remoteUpdatedAt = new Date(remoteData.updated_at);

              if (localUpdatedAt > remoteUpdatedAt) {
                console.warn("⚠️ Conflict detected: Local version is newer");
                console.log("Local:", localVersion[recordId]);
                console.log("Remote:", remoteData);

                // Resolve conflict
                const resolved = onConflict(localVersion[recordId], remoteData);
                console.log("Resolved to:", resolved);

                // Update local version
                localVersion[recordId] = resolved;
                onUpdate(resolved);
                return;
              }
            }

            // No conflict, update normally
            localVersion[recordId] = remoteData;
            onUpdate(remoteData);
          }

          if (payload.eventType === "DELETE") {
            const recordId = payload.old.id;
            delete localVersion[recordId];
            onUpdate(payload);
          }
        },
      )
      .subscribe((status) => {
        console.log(`[SupabaseDebug] Subscription status: ${status}`);
      });

    return {
      channel,
      updateLocal: (recordId: string, data: any) => {
        localVersion[recordId] = data;
      },
      unsubscribe: () => {
        supabase.removeChannel(channel);
        console.log("[SupabaseDebug] Unsubscribed from realtime");
      },
    };
  }

  /**
   * Validate schema matches expected structure
   */
  async validateSchema(
    supabase: SupabaseClient,
    table: string,
    expectedColumns: string[],
  ): Promise<{ valid: boolean; missing: string[]; extra: string[] }> {
    console.group(`[SupabaseDebug] Validating schema for ${table}`);

    const { data, error } = await supabase.rpc("get_table_columns", {
      table_name: table,
    });

    if (error) {
      console.error("Failed to get columns:", error);
      console.groupEnd();
      return { valid: false, missing: expectedColumns, extra: [] };
    }

    const actualColumns = data?.map((col: any) => col.column_name) || [];
    const missing = expectedColumns.filter(
      (col) => !actualColumns.includes(col),
    );
    const extra = actualColumns.filter((col: string) => !expectedColumns.includes(col));

    console.log("Expected columns:", expectedColumns);
    console.log("Actual columns:", actualColumns);
    console.log("Missing columns:", missing);
    console.log("Extra columns:", extra);

    const valid = missing.length === 0;
    console.log(valid ? "✅ Schema valid" : "❌ Schema invalid");
    console.groupEnd();

    return { valid, missing, extra };
  }

  /**
   * Get query performance stats
   */
  getQueryStats(): {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
    byTable: { [key: string]: number };
  } {
    const total = this.queryLog.length;
    const successful = this.queryLog.filter((q) => q.success).length;
    const failed = total - successful;
    const avgDuration =
      total > 0
        ? this.queryLog.reduce((sum, q) => sum + q.duration, 0) / total
        : 0;

    const byTable: { [key: string]: number } = {};
    this.queryLog.forEach((q) => {
      byTable[q.table] = (byTable[q.table] || 0) + 1;
    });

    return { total, successful, failed, avgDuration, byTable };
  }

  /**
   * Export query log for analysis
   */
  exportQueryLog(): string {
    return JSON.stringify(this.queryLog, null, 2);
  }

  /**
   * Clear query log
   */
  clearQueryLog(): void {
    this.queryLog = [];
    console.log("[SupabaseDebug] Query log cleared");
  }

  private logQuery(
    table: string,
    operation: string,
    duration: number,
    success: boolean,
    error?: any,
  ): void {
    if (!this.debugMode) return;

    this.queryLog.push({
      timestamp: new Date(),
      table,
      operation,
      duration,
      success,
      error,
    });

    // Keep only last 100 queries
    if (this.queryLog.length > 100) {
      this.queryLog.shift();
    }
  }

  private getTestDataForTable(table: string, userId: string): any {
    const baseData = {
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    switch (table) {
      case "user_profiles":
        return {
          id: userId,
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
      default:
        return baseData;
    }
  }
}

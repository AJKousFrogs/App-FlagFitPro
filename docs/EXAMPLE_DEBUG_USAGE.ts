import { Component, OnInit } from '@angular/core';
import { SupabaseDebugService } from '@core/services/supabase-debug.service';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Example: Using Debug Service in a Real Component
 * 
 * This shows how to integrate debugging into your existing components
 * to catch and diagnose backend issues early.
 */
@Component({
  selector: 'app-injury-tracker',
  template: `
    <div class="injury-tracker">
      <h2>Injury Tracker</h2>
      
      <form (submit)="saveInjury()">
        <input [(ngModel)]="injuryData.injury_type" placeholder="Injury Type" />
        <input type="date" [(ngModel)]="injuryData.injury_date" />
        <select [(ngModel)]="injuryData.severity">
          <option value="minor">Minor</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
        </select>
        <button type="submit">Save</button>
      </form>

      <div class="injuries-list">
        <div *ngFor="let injury of injuries" class="injury-card">
          {{ injury.injury_type }} - {{ injury.status }}
        </div>
      </div>
    </div>
  `
})
export class InjuryTrackerComponent implements OnInit {
  injuries: any[] = [];
  injuryData: any = {};
  private userId!: string;
  private realtimeSubscription: any;

  constructor(
    private supabase: SupabaseClient,
    private debugService: SupabaseDebugService
  ) {
    // Enable debug mode in development only
    if (!environment.production) {
      this.debugService.enableDebugMode();
    }
  }

  async ngOnInit() {
    // Get current user
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user');
      return;
    }
    
    this.userId = user.id;

    // Test RLS policies on component init (development only)
    if (!environment.production) {
      await this.testBackendSetup();
    }

    // Load injuries
    await this.loadInjuries();

    // Set up realtime with conflict detection
    this.setupRealtime();
  }

  /**
   * Test backend setup on component initialization
   * This catches configuration issues early
   */
  private async testBackendSetup() {
    console.group('🔍 Backend Setup Validation');

    // 1. Test RLS policies
    const rlsResult = await this.debugService.testRLSPolicies(
      this.supabase,
      'injuries',
      this.userId
    );

    if (!rlsResult.passed) {
      console.error('❌ RLS policy tests failed:', rlsResult.results);
    } else {
      console.log('✅ RLS policies working correctly');
    }

    // 2. Check indexes
    const indexCheck = await this.debugService.checkIndexes(
      this.supabase,
      ['injuries']
    );

    const missingIndexes = indexCheck.filter(r => !r.hasIndex);
    if (missingIndexes.length > 0) {
      console.warn('⚠️ Missing indexes:', missingIndexes);
    } else {
      console.log('✅ All indexes present');
    }

    // 3. Validate schema
    const schemaResult = await this.debugService.validateSchema(
      this.supabase,
      'injuries',
      ['id', 'user_id', 'injury_type', 'injury_date', 'status', 'severity']
    );

    if (!schemaResult.valid) {
      console.error('❌ Schema validation failed:', schemaResult);
    } else {
      console.log('✅ Schema valid');
    }

    console.groupEnd();
  }

  /**
   * Load injuries with error handling and logging
   */
  private async loadInjuries() {
    const startTime = performance.now();

    const { data, error } = await this.supabase
      .from('injuries')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    const duration = performance.now() - startTime;

    if (error) {
      console.error('Failed to load injuries:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      // Common error handling
      if (error.code === '42501') {
        console.error('🔒 RLS Policy Violation:');
        console.error('- Check that user_id matches auth.uid()');
        console.error('- Verify SELECT policy exists');
        console.error('Run: SELECT * FROM get_table_policies(\'injuries\');');
      }

      return;
    }

    this.injuries = data || [];
    console.log(`✅ Loaded ${this.injuries.length} injuries in ${duration.toFixed(2)}ms`);

    // Performance warning
    if (duration > 1000) {
      console.warn('⚠️ Slow query detected. Consider adding indexes.');
    }
  }

  /**
   * Save injury with comprehensive error handling
   */
  async saveInjury() {
    // Validate data
    if (!this.injuryData.injury_type || !this.injuryData.injury_date) {
      console.error('Missing required fields');
      return;
    }

    // Prepare data with proper user_id
    const injuryToSave = {
      ...this.injuryData,
      user_id: this.userId, // Critical: Must match auth.uid()
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Use debug service in development
    if (!environment.production) {
      const result = await this.debugService.testUpsert(
        this.supabase,
        'injuries',
        injuryToSave,
        { upsert: false }
      );

      if (result.success) {
        this.injuries.unshift(result.data[0]);
        this.injuryData = {}; // Reset form
        console.log('✅ Injury saved successfully');
      } else {
        this.handleSaveError(result.error);
      }
    } else {
      // Production: Direct save without debug overhead
      const { data, error } = await this.supabase
        .from('injuries')
        .insert(injuryToSave)
        .select()
        .single();

      if (error) {
        this.handleSaveError(error);
      } else {
        this.injuries.unshift(data);
        this.injuryData = {};
      }
    }
  }

  /**
   * Comprehensive error handler with actionable feedback
   */
  private handleSaveError(error: any) {
    console.error('Failed to save injury:', error);

    switch (error.code) {
      case '42501':
        // RLS Policy Violation
        console.error('🔒 RLS Policy Violation:');
        console.error('The row-level security policy prevented this operation.');
        console.error('Possible causes:');
        console.error('1. user_id does not match authenticated user');
        console.error('2. INSERT policy is missing or incorrect');
        console.error('3. WITH CHECK clause is failing');
        console.error('\nDebug steps:');
        console.error('- Check user_id:', this.userId);
        console.error('- Run: SELECT * FROM get_table_policies(\'injuries\');');
        console.error('- Verify policy: WITH CHECK (user_id = auth.uid())');
        break;

      case '42703':
        // Column does not exist
        console.error('📋 Schema Error:');
        console.error(`Column does not exist in table.`);
        console.error('\nDebug steps:');
        console.error('- Run: SELECT * FROM get_table_columns(\'injuries\');');
        console.error('- Check for typos in column names');
        console.error('- Verify migration was applied');
        break;

      case '23505':
        // Unique constraint violation
        console.error('🔑 Duplicate Key Error:');
        console.error('This record already exists.');
        console.error('Consider using upsert() instead of insert()');
        break;

      case '23503':
        // Foreign key violation
        console.error('🔗 Foreign Key Error:');
        console.error('Referenced record does not exist.');
        console.error('Check that related records exist first.');
        break;

      default:
        console.error('❌ Unknown error:', error);
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
    }

    // Show user-friendly message
    alert('Failed to save injury. Check console for details.');
  }

  /**
   * Set up realtime with automatic conflict resolution
   */
  private setupRealtime() {
    this.realtimeSubscription = this.debugService.subscribeWithConflictDetection(
      this.supabase,
      'injuries',
      this.userId,
      (payload) => {
        // Handle updates
        if (payload.eventType === 'INSERT') {
          console.log('📥 New injury from realtime:', payload.new);
          this.injuries.unshift(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          console.log('🔄 Injury updated from realtime:', payload.new);
          const index = this.injuries.findIndex(i => i.id === payload.new.id);
          if (index !== -1) {
            this.injuries[index] = payload.new;
          }
        } else if (payload.eventType === 'DELETE') {
          console.log('🗑️ Injury deleted from realtime:', payload.old);
          this.injuries = this.injuries.filter(i => i.id !== payload.old.id);
        }
      },
      (local, remote) => {
        // Resolve conflicts
        console.warn('⚠️ Conflict detected:', { local, remote });

        // Strategy: Keep version with latest updated_at
        const localTime = new Date(local.updated_at).getTime();
        const remoteTime = new Date(remote.updated_at).getTime();

        const resolved = localTime > remoteTime ? local : remote;
        console.log('✅ Conflict resolved, keeping:', resolved);

        return resolved;
      }
    );

    console.log('👂 Listening for realtime updates on injuries');
  }

  /**
   * Update injury with optimistic concurrency control
   */
  async updateInjury(injury: any, updates: any) {
    const currentVersion = injury.updated_at;

    // Optimistic update in UI
    const index = this.injuries.findIndex(i => i.id === injury.id);
    const originalInjury = { ...this.injuries[index] };
    this.injuries[index] = { ...injury, ...updates };

    // Try to update with version check
    const { error } = await this.supabase
      .from('injuries')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', injury.id)
      .eq('updated_at', currentVersion); // Prevent overwriting newer versions

    if (error) {
      // Rollback optimistic update
      this.injuries[index] = originalInjury;

      if (error.code === 'PGRST116') {
        // No rows updated = version conflict
        console.warn('⚠️ Conflict: Record was updated by another user');
        alert('This record was updated by someone else. Refreshing...');
        await this.loadInjuries(); // Refresh to get latest
      } else {
        console.error('Update failed:', error);
        this.handleSaveError(error);
      }
    } else {
      console.log('✅ Injury updated successfully');
    }
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      console.log('👋 Unsubscribed from realtime');
    }

    // Log performance stats in development
    if (!environment.production) {
      const stats = this.debugService.getQueryStats();
      console.log('📊 Component Query Statistics:', stats);
    }
  }
}

// Add to environment.ts
const environment = {
  production: false
};

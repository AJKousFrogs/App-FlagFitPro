/**
 * Example: Debugging Signals and Effects in Player Dashboard
 *
 * This file demonstrates how to add debug logging to the Player Dashboard component.
 * Copy these patterns into your components to debug signal updates and effect executions.
 */

import { Component, signal, effect, computed, inject } from '@angular/core';
import { DebugService } from '../../core/services/debug.service';

/**
 * EXAMPLE 1: Track a single signal
 */
export class Example1_TrackSingleSignal {
  private readonly debugService = inject(DebugService);

  // Create a signal for profile data
  profileSig = signal<any>(null);

  constructor() {
    // Track this signal - all updates will be logged
    this.debugService.trackSignal(
      this.profileSig,
      'profileSig',
      'PlayerDashboard'
    );
  }

  updateProfile(newProfile: any) {
    // This will automatically log: 📊 Signal Update [PlayerDashboard] profileSig { ... }
    this.profileSig.set(newProfile);
  }
}

/**
 * EXAMPLE 2: Track multiple related signals
 */
export class Example2_TrackMultipleSignals {
  private readonly debugService = inject(DebugService);

  profileSig = signal<any>(null);
  wellnessSig = signal<any>(null);
  trainingSig = signal<any>(null);

  // Computed signal derived from others
  isReadySig = computed(() => {
    const hasProfile = this.profileSig() !== null;
    const hasWellness = this.wellnessSig() !== null;
    const hasTraining = this.trainingSig() !== null;
    return hasProfile && hasWellness && hasTraining;
  });

  constructor() {
    // Track all signals
    this.debugService.trackSignal(this.profileSig, 'profileSig', 'PlayerDashboard');
    this.debugService.trackSignal(this.wellnessSig, 'wellnessSig', 'PlayerDashboard');
    this.debugService.trackSignal(this.trainingSig, 'trainingSig', 'PlayerDashboard');
    this.debugService.trackSignal(this.isReadySig, 'isReadySig', 'PlayerDashboard');

    // Effect to log when all data is ready
    effect(() => {
      const isReady = this.isReadySig();
      if (isReady) {
        console.log('✅ Dashboard is ready to display');
        console.log('Profile:', this.profileSig());
        console.log('Wellness:', this.wellnessSig());
        console.log('Training:', this.trainingSig());
      } else {
        console.log('⏳ Dashboard still loading...');
      }
    });
  }
}

/**
 * EXAMPLE 3: Debug effect execution with timing
 */
export class Example3_DebugEffects {
  private readonly debugService = inject(DebugService);

  profileSig = signal<any>(null);
  settingsSig = signal<any>({ theme: 'light', notifications: true });

  constructor() {
    // Track signals
    this.debugService.trackSignal(this.profileSig, 'profileSig', 'PlayerDashboard');
    this.debugService.trackSignal(this.settingsSig, 'settingsSig', 'PlayerDashboard');

    // Log effect with timing
    this.debugService.logEffect('syncProfileAndSettings', 'PlayerDashboard', () => {
      const profile = this.profileSig();
      const settings = this.settingsSig();

      if (profile && settings) {
        // Sync profile with settings
        console.log('Syncing profile with settings...');
      }
    });

    // Manual effect with custom logging
    effect(() => {
      console.time('ProfileSettingsEffect');
      const profile = this.profileSig();
      const settings = this.settingsSig();

      // Do work...
      if (profile && settings) {
        // Complex operation
      }

      console.timeEnd('ProfileSettingsEffect');
    });
  }
}

/**
 * EXAMPLE 4: Debug API calls and button clicks
 */
export class Example4_DebugButtonsAndAPI {
  private readonly debugService = inject(DebugService);

  isLoadingSig = signal(false);
  errorSig = signal<string | null>(null);
  dataSig = signal<any>(null);

  isButtonDisabled = computed(() => {
    return this.isLoadingSig() || this.errorSig() !== null;
  });

  constructor() {
    // Track button state
    this.debugService.trackSignal(this.isButtonDisabled, 'isButtonDisabled', 'PlayerDashboard');

    // Log when button state changes
    effect(() => {
      console.log('🔘 Button disabled state:', this.isButtonDisabled());
      if (this.isButtonDisabled()) {
        console.log('  Reason: Loading =', this.isLoadingSig(), ', Error =', this.errorSig());
      }
    });
  }

  async onButtonClick() {
    console.log('=== Button Click Debug ===');
    console.log('1. Button clicked at:', new Date().toISOString());
    console.log('2. Current state:', {
      isLoading: this.isLoadingSig(),
      error: this.errorSig(),
      isDisabled: this.isButtonDisabled(),
    });

    // Measure API call performance
    try {
      const result = await this.debugService.measurePerformanceAsync(
        'Fetch dashboard data',
        async () => {
          this.isLoadingSig.set(true);
          this.errorSig.set(null);

          // Simulate API call
          const response = await fetch('/api/dashboard');
          if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
          }
          return await response.json();
        },
        1000 // Warn if > 1000ms
      );

      this.dataSig.set(result);
      this.isLoadingSig.set(false);
      console.log('3. API call succeeded:', result);

    } catch (error) {
      this.errorSig.set(error instanceof Error ? error.message : 'Unknown error');
      this.isLoadingSig.set(false);
      console.error('4. API call failed:', error);
    }
  }
}

/**
 * EXAMPLE 5: Performance monitoring for dashboard load
 */
export class Example5_PerformanceMonitoring {
  private readonly debugService = inject(DebugService);
  private loadStartTime = 0;

  profileSig = signal<any>(null);
  wellnessSig = signal<any>(null);
  trainingSig = signal<any>(null);

  constructor() {
    this.debugService.logLifecycle('PlayerDashboard', 'constructor');

    // Track when all data is loaded
    effect(() => {
      const profile = this.profileSig();
      const wellness = this.wellnessSig();
      const training = this.trainingSig();

      if (profile && wellness && training) {
        const loadTime = performance.now() - this.loadStartTime;
        this.debugService.logPerformance('Complete dashboard load', loadTime, 2000);
      }
    });
  }

  async loadDashboard() {
    this.loadStartTime = performance.now();
    this.debugService.logLifecycle('PlayerDashboard', 'loadDashboard started');

    try {
      // Load profile with timing
      const profile = await this.debugService.measurePerformanceAsync(
        'Load profile',
        async () => this.loadProfile(),
        500
      );
      this.profileSig.set(profile);

      // Load wellness with timing
      const wellness = await this.debugService.measurePerformanceAsync(
        'Load wellness',
        async () => this.loadWellness(),
        500
      );
      this.wellnessSig.set(wellness);

      // Load training with timing
      const training = await this.debugService.measurePerformanceAsync(
        'Load training',
        async () => this.loadTraining(),
        500
      );
      this.trainingSig.set(training);

      this.debugService.logLifecycle('PlayerDashboard', 'loadDashboard completed');

    } catch (error) {
      console.error('❌ Failed to load dashboard:', error);
      this.debugService.logLifecycle('PlayerDashboard', 'loadDashboard failed', error);
    }
  }

  private async loadProfile() {
    // Simulate API call
    return new Promise(resolve => setTimeout(() => resolve({ name: 'John' }), 200));
  }

  private async loadWellness() {
    return new Promise(resolve => setTimeout(() => resolve({ score: 85 }), 150));
  }

  private async loadTraining() {
    return new Promise(resolve => setTimeout(() => resolve({ sessions: 10 }), 100));
  }
}

/**
 * EXAMPLE 6: Debug PrimeNG component interactions
 */
export class Example6_DebugPrimeNG {
  items = signal<any[]>([]);
  selectedItem = signal<any>(null);
  filters = signal<any>({});

  constructor() {
    // Track PrimeNG-related signals
    effect(() => {
      const selected = this.selectedItem();
      if (selected) {
        console.log('🎯 PrimeNG Table - Row selected:', selected);
      }
    });

    effect(() => {
      const currentFilters = this.filters();
      console.log('🔍 PrimeNG Table - Filters changed:', currentFilters);
    });
  }

  onRowSelect(event: any) {
    console.log('=== PrimeNG Row Select Event ===');
    console.log('Event type:', event.type);
    console.log('Selected data:', event.data);
    console.log('Original event:', event.originalEvent);

    this.selectedItem.set(event.data);
  }

  onFilter(event: any) {
    console.log('=== PrimeNG Filter Event ===');
    console.log('Filters:', event.filters);
    console.log('Filtered value:', event.filteredValue);

    this.filters.set(event.filters);
  }

  onSort(event: any) {
    console.log('=== PrimeNG Sort Event ===');
    console.log('Field:', event.field);
    console.log('Order:', event.order);
    console.log('Multi sort meta:', event.multiSortMeta);
  }
}

/**
 * EXAMPLE 7: Complete Player Dashboard with debugging
 */
export class Example7_CompletePlayerDashboard {
  private readonly debugService = inject(DebugService);

  // State signals
  profileSig = signal<any>(null);
  wellnessSig = signal<any>(null);
  isLoadingSig = signal(false);
  errorSig = signal<string | null>(null);

  // Computed signals
  isReadySig = computed(() => {
    return this.profileSig() !== null && this.wellnessSig() !== null;
  });

  isButtonDisabled = computed(() => {
    return this.isLoadingSig() || !this.isReadySig();
  });

  constructor() {
    // Track all signals
    this.debugService.trackSignal(this.profileSig, 'profileSig', 'PlayerDashboard');
    this.debugService.trackSignal(this.wellnessSig, 'wellnessSig', 'PlayerDashboard');
    this.debugService.trackSignal(this.isLoadingSig, 'isLoadingSig', 'PlayerDashboard');
    this.debugService.trackSignal(this.errorSig, 'errorSig', 'PlayerDashboard');
    this.debugService.trackSignal(this.isReadySig, 'isReadySig', 'PlayerDashboard');
    this.debugService.trackSignal(this.isButtonDisabled, 'isButtonDisabled', 'PlayerDashboard');

    // Log lifecycle
    this.debugService.logLifecycle('PlayerDashboard', 'constructor');

    // Effect to log when dashboard is ready
    effect(() => {
      if (this.isReadySig()) {
        console.log('%c✅ Dashboard Ready', 'color: #4caf50; font-weight: bold;');
      }
    });

    // Effect to log errors
    effect(() => {
      const error = this.errorSig();
      if (error) {
        console.error('%c❌ Dashboard Error', 'color: #f44336; font-weight: bold;', error);
      }
    });

    // Load data
    this.loadData();
  }

  async loadData() {
    console.log('%c=== Loading Dashboard ===', 'color: #2196f3; font-weight: bold;');
    this.isLoadingSig.set(true);
    this.errorSig.set(null);

    try {
      // Load profile
      const profile = await this.debugService.measurePerformanceAsync(
        'Load profile',
        async () => {
          const response = await fetch('/api/profile');
          if (!response.ok) throw new Error('Failed to load profile');
          return response.json();
        },
        500
      );
      this.profileSig.set(profile);

      // Load wellness
      const wellness = await this.debugService.measurePerformanceAsync(
        'Load wellness',
        async () => {
          const response = await fetch('/api/wellness');
          if (!response.ok) throw new Error('Failed to load wellness');
          return response.json();
        },
        500
      );
      this.wellnessSig.set(wellness);

      this.isLoadingSig.set(false);
      console.log('%c✅ Dashboard loaded successfully', 'color: #4caf50; font-weight: bold;');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errorSig.set(errorMessage);
      this.isLoadingSig.set(false);
      console.error('%c❌ Dashboard load failed', 'color: #f44336; font-weight: bold;', error);
    }
  }

  onRefreshClick() {
    console.log('=== Refresh Button Clicked ===');
    console.log('Current state:', {
      isLoading: this.isLoadingSig(),
      isReady: this.isReadySig(),
      isDisabled: this.isButtonDisabled(),
    });

    if (!this.isButtonDisabled()) {
      this.loadData();
    } else {
      console.warn('⚠️ Button is disabled, cannot refresh');
    }
  }
}

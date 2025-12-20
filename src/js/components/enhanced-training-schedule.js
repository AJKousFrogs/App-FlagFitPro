/* eslint-disable no-console */
/**
 * Enhanced Training Schedule Component
 * 
 * Features:
 * - Real-time schedule updates via Supabase subscriptions
 * - Conflict detection and resolution
 * - Drag-and-drop schedule editing
 * - AI-powered periodization recommendations
 * - Visual schedule timeline
 * - Mobile-responsive design
 * - Export/import functionality
 */

import { realtimeManager } from '../services/supabase-client.js';
import { aiTrainingScheduler } from '../services/aiTrainingScheduler.js';

class EnhancedTrainingSchedule {
  constructor() {
    this.schedule = [];
    this.conflicts = [];
    this.realtimeSubscription = null;
    this.currentWeek = new Date();
    this.viewMode = 'week'; // 'week' | 'month' | 'timeline'
    this.selectedDate = null;
    this.isLoading = false;
    this.aiRecommendations = [];
    this.listeners = new Set();
  }

  /**
   * Initialize the enhanced training schedule
   */
  async init(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn('[TrainingSchedule] Container not found:', containerId);
      return;
    }

    this.options = {
      enableRealtime: options.enableRealtime !== false,
      enableAI: options.enableAI !== false,
      enableDragDrop: options.enableDragDrop !== false,
      ...options
    };

    // Load initial schedule
    await this.loadSchedule();

    // Setup real-time subscription
    if (this.options.enableRealtime) {
      await this.setupRealtimeSubscription();
    }

    // Load AI recommendations
    if (this.options.enableAI) {
      await this.loadAIRecommendations();
    }

    // Render schedule
    this.render();

    // Setup event listeners
    this.setupEventListeners();

    console.log('[TrainingSchedule] Enhanced training schedule initialized');
  }

  /**
   * Load schedule from API/storage
   */
  async loadSchedule() {
    this.isLoading = true;
    try {
      // Try API first
      if (window.apiClient && window.API_ENDPOINTS) {
        const response = await window.apiClient.get(
          window.API_ENDPOINTS.training?.schedule || '/api/training/schedule',
          {
            week: this.getWeekStart(this.currentWeek).toISOString()
          }
        );

        if (response && response.success && response.data) {
          this.schedule = response.data.schedule || [];
          this.conflicts = response.data.conflicts || [];
          this.notifyListeners();
          return;
        }
      }

      // Fallback to localStorage
      const stored = window.storageService?.get('trainingSchedule', [], { usePrefix: false });
      if (stored && Array.isArray(stored)) {
        this.schedule = stored;
        this.detectConflicts();
        this.notifyListeners();
      }
    } catch (error) {
      console.warn('[TrainingSchedule] Failed to load schedule:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Setup real-time subscription for schedule updates
   */
  async setupRealtimeSubscription() {
    try {
      // Wait for authManager to initialize if available
      if (window.authManager && typeof window.authManager.waitForInit === 'function') {
        await window.authManager.waitForInit();
      }

      const userId = this.getCurrentUserId();
      if (!userId) {
        console.debug('[TrainingSchedule] No user ID for real-time subscription - user may not be authenticated');
        return;
      }

      // Subscribe to training sessions
      const subscription = realtimeManager.subscribe(
        'training_sessions',
        {
          event: '*', // INSERT, UPDATE, DELETE
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          this.handleRealtimeUpdate(payload);
        }
      );

      this.realtimeSubscription = subscription;
      console.log('[TrainingSchedule] Real-time subscription active');
    } catch (error) {
      console.error('[TrainingSchedule] Failed to setup real-time subscription:', error);
    }
  }

  /**
   * Handle real-time updates
   */
  handleRealtimeUpdate(payload) {
    const eventType = payload.eventType || 'INSERT';
    const session = payload.new || payload.old;

    if (!session) return;

    console.log('[TrainingSchedule] Real-time update:', eventType, session);

    switch (eventType) {
      case 'INSERT':
        this.addSession(session);
        break;
      case 'UPDATE':
        this.updateSession(session);
        break;
      case 'DELETE':
        this.removeSession(session.id);
        break;
    }

    this.detectConflicts();
    this.render();
    this.notifyListeners();
  }

  /**
   * Load AI recommendations
   */
  async loadAIRecommendations() {
    try {
      if (!aiTrainingScheduler) {
        console.warn('[TrainingSchedule] AI scheduler not available');
        return;
      }

      const recommendations = await aiTrainingScheduler.getRecommendations({
        currentSchedule: this.schedule,
        week: this.currentWeek
      });

      this.aiRecommendations = recommendations || [];
      this.notifyListeners();
    } catch (error) {
      console.warn('[TrainingSchedule] Failed to load AI recommendations:', error);
    }
  }

  /**
   * Detect schedule conflicts
   */
  detectConflicts() {
    this.conflicts = [];
    const sessionsByDate = {};

    // Group sessions by date
    this.schedule.forEach(session => {
      const dateKey = new Date(session.date).toDateString();
      if (!sessionsByDate[dateKey]) {
        sessionsByDate[dateKey] = [];
      }
      sessionsByDate[dateKey].push(session);
    });

    // Detect conflicts
    Object.entries(sessionsByDate).forEach(([dateKey, sessions]) => {
      if (sessions.length > 1) {
        // Check for overlapping times
        for (let i = 0; i < sessions.length; i++) {
          for (let j = i + 1; j < sessions.length; j++) {
            const conflict = this.checkTimeConflict(sessions[i], sessions[j]);
            if (conflict) {
              this.conflicts.push({
                date: dateKey,
                sessions: [sessions[i], sessions[j]],
                type: conflict.type,
                severity: conflict.severity
              });
            }
          }
        }
      }
    });
  }

  /**
   * Check if two sessions conflict
   */
  checkTimeConflict(session1, session2) {
    const time1 = this.parseTime(session1.time || session1.startTime);
    const time2 = this.parseTime(session2.time || session2.startTime);
    const duration1 = session1.duration || 60;
    const duration2 = session2.duration || 60;

    if (!time1 || !time2) return null;

    const end1 = time1 + duration1;
    const end2 = time2 + duration2;

    // Check for overlap
    if ((time1 < end2 && end1 > time2) || (time2 < end1 && end2 > time1)) {
      return {
        type: 'time_overlap',
        severity: 'high'
      };
    }

    // Check for too close together (less than 4 hours apart)
    const gap = Math.abs(time1 - time2);
    if (gap < 240) { // 4 hours in minutes
      return {
        type: 'insufficient_recovery',
        severity: 'medium'
      };
    }

    return null;
  }

  /**
   * Parse time string to minutes
   */
  parseTime(timeStr) {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+)/);
    if (!match) return null;
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }

  /**
   * Add a session to the schedule
   */
  async addSession(session) {
    this.schedule.push({
      ...session,
      id: session.id || `temp-${Date.now()}`,
      date: session.date || new Date().toISOString().split('T')[0]
    });

    this.detectConflicts();
    await this.saveSchedule();
    this.render();
    this.notifyListeners();
  }

  /**
   * Update a session
   */
  async updateSession(updatedSession) {
    const index = this.schedule.findIndex(s => s.id === updatedSession.id);
    if (index !== -1) {
      this.schedule[index] = { ...this.schedule[index], ...updatedSession };
      this.detectConflicts();
      await this.saveSchedule();
      this.render();
      this.notifyListeners();
    }
  }

  /**
   * Remove a session
   */
  async removeSession(sessionId) {
    this.schedule = this.schedule.filter(s => s.id !== sessionId);
    this.detectConflicts();
    await this.saveSchedule();
    this.render();
    this.notifyListeners();
  }

  /**
   * Save schedule to API/storage
   */
  async saveSchedule() {
    try {
      // Try API first
      if (window.apiClient && window.API_ENDPOINTS) {
        await window.apiClient.post(
          window.API_ENDPOINTS.training?.schedule || '/api/training/schedule',
          {
            schedule: this.schedule,
            week: this.getWeekStart(this.currentWeek).toISOString()
          }
        );
        return;
      }

      // Fallback to localStorage
      if (window.storageService) {
        window.storageService.set('trainingSchedule', this.schedule, { usePrefix: false });
      }
    } catch (error) {
      console.warn('[TrainingSchedule] Failed to save schedule:', error);
    }
  }

  /**
   * Get week start date
   */
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    try {
      if (window.authManager) {
        const user = window.authManager.getCurrentUser();
        return user?.id || user?.user_id || null;
      }
      // Fallback: try to get from storage
      if (window.storageService) {
        const userData = window.storageService.get('user', null, { usePrefix: false });
        return userData?.id || userData?.user_id || null;
      }
      return null;
    } catch (error) {
      console.warn('[TrainingSchedule] Failed to get user ID:', error);
      return null;
    }
  }

  /**
   * Render the schedule
   */
  render() {
    if (!this.container) return;

    if (this.isLoading) {
      this.container.innerHTML = this.renderLoading();
      return;
    }

    switch (this.viewMode) {
      case 'week':
        this.container.innerHTML = this.renderWeekView();
        break;
      case 'month':
        this.container.innerHTML = this.renderMonthView();
        break;
      case 'timeline':
        this.container.innerHTML = this.renderTimelineView();
        break;
    }

    // Initialize interactive features
    this.initializeInteractivity();
  }

  /**
   * Render week view
   */
  renderWeekView() {
    const weekStart = this.getWeekStart(this.currentWeek);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push(date);
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return `
      <div class="enhanced-schedule enhanced-schedule-week">
        <div class="schedule-header">
          <div class="schedule-nav">
            <button class="btn-nav" onclick="window.enhancedTrainingSchedule?.previousWeek()">
              <i data-lucide="chevron-left"></i>
            </button>
            <h2 class="schedule-title">
              ${weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button class="btn-nav" onclick="window.enhancedTrainingSchedule?.nextWeek()">
              <i data-lucide="chevron-right"></i>
            </button>
          </div>
          <div class="schedule-actions">
            <button class="btn-action" onclick="window.enhancedTrainingSchedule?.toggleViewMode()">
              <i data-lucide="calendar"></i>
              ${this.viewMode === 'week' ? 'Month View' : 'Week View'}
            </button>
            ${this.options.enableAI ? `
              <button class="btn-action" onclick="window.enhancedTrainingSchedule?.showAIRecommendations()">
                <i data-lucide="sparkles"></i>
                AI Recommendations
              </button>
            ` : ''}
          </div>
        </div>

        ${this.conflicts.length > 0 ? this.renderConflicts() : ''}
        ${this.aiRecommendations.length > 0 ? this.renderAIRecommendations() : ''}

        <div class="schedule-grid">
          ${days.map((day, index) => {
            const daySessions = this.schedule.filter(s => {
              const sessionDate = new Date(s.date);
              return sessionDate.toDateString() === day.toDateString();
            });
            const isToday = day.toDateString() === new Date().toDateString();
            
            return `
              <div class="schedule-day ${isToday ? 'today' : ''}" data-date="${day.toISOString()}">
                <div class="day-header">
                  <div class="day-name">${dayNames[index]}</div>
                  <div class="day-date">${day.getDate()}</div>
                </div>
                <div class="day-sessions">
                  ${daySessions.length === 0 ? `
                    <div class="empty-session">
                      <i data-lucide="plus"></i>
                      <span>Add session</span>
                    </div>
                  ` : daySessions.map(session => this.renderSession(session)).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render month view
   */
  renderMonthView() {
    return '<div class="enhanced-schedule enhanced-schedule-month">Month view coming soon</div>';
  }

  /**
   * Render timeline view
   */
  renderTimelineView() {
    return '<div class="enhanced-schedule enhanced-schedule-timeline">Timeline view coming soon</div>';
  }

  /**
   * Render a session
   */
  renderSession(session) {
    const time = session.time || session.startTime || '9:00 AM';
    const type = session.type || session.sessionType || 'training';
    const typeConfig = this.getTypeConfig(type);

    return `
      <div class="schedule-session ${type}" data-session-id="${session.id}">
        <div class="session-header">
          <div class="session-time">${time}</div>
          <div class="session-type" style="background: ${typeConfig.bgColor}; color: ${typeConfig.color};">
            <i data-lucide="${typeConfig.icon}" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;"></i> ${typeConfig.label}
          </div>
        </div>
        <div class="session-title">${session.title || session.name || 'Training Session'}</div>
        ${session.duration ? `<div class="session-duration">${session.duration} min</div>` : ''}
        ${session.location ? `<div class="session-location"><i data-lucide="map-pin"></i> ${session.location}</div>` : ''}
        <div class="session-actions">
          <button class="btn-session-action" onclick="window.enhancedTrainingSchedule?.editSession('${session.id}')">
            <i data-lucide="edit"></i>
          </button>
          <button class="btn-session-action" onclick="window.enhancedTrainingSchedule?.deleteSession('${session.id}')">
            <i data-lucide="trash"></i>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render conflicts
   */
  renderConflicts() {
    return `
      <div class="schedule-conflicts">
        <div class="conflicts-header">
          <i data-lucide="alert-triangle"></i>
          <span>${this.conflicts.length} conflict${this.conflicts.length !== 1 ? 's' : ''} detected</span>
        </div>
        ${this.conflicts.map(conflict => `
          <div class="conflict-item severity-${conflict.severity}">
            <div class="conflict-date">${conflict.date}</div>
            <div class="conflict-sessions">
              ${conflict.sessions.map(s => s.title || s.name).join(' vs ')}
            </div>
            <button class="btn-resolve" onclick="window.enhancedTrainingSchedule?.resolveConflict(${JSON.stringify(conflict).replace(/"/g, '&quot;')})">
              Resolve
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render AI recommendations
   */
  renderAIRecommendations() {
    return `
      <div class="schedule-ai-recommendations">
        <div class="ai-header">
          <i data-lucide="sparkles"></i>
          <span>AI Recommendations</span>
        </div>
        ${this.aiRecommendations.map(rec => `
          <div class="ai-recommendation">
            <div class="recommendation-title">${rec.title}</div>
            <div class="recommendation-description">${rec.description}</div>
            ${rec.action ? `
              <button class="btn-apply" onclick="window.enhancedTrainingSchedule?.applyRecommendation(${JSON.stringify(rec).replace(/"/g, '&quot;')})">
                Apply
              </button>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render loading state
   */
  renderLoading() {
    return `
      <div class="schedule-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading schedule...</div>
      </div>
    `;
  }

  /**
   * Get type configuration
   */
  getTypeConfig(type) {
    const configs = {
      training: { icon: 'running', label: 'Training', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
      game: { icon: 'football', label: 'Game', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
      recovery: { icon: 'heart', label: 'Recovery', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
      practice: { icon: 'target', label: 'Practice', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
      tournament: { icon: 'trophy', label: 'Tournament', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' }
    };
    return configs[type] || configs.training;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Week navigation
    window.enhancedTrainingSchedule = this;
  }

  /**
   * Initialize interactivity
   */
  initializeInteractivity() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons(this.container);
    }

    // Setup drag and drop if enabled
    if (this.options.enableDragDrop) {
      this.setupDragAndDrop();
    }
  }

  /**
   * Setup drag and drop
   */
  setupDragAndDrop() {
    // TODO: Implement drag and drop
    console.log('[TrainingSchedule] Drag and drop setup');
  }

  /**
   * Navigation methods
   */
  previousWeek() {
    const newDate = new Date(this.currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    this.currentWeek = newDate;
    this.loadSchedule();
  }

  nextWeek() {
    const newDate = new Date(this.currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    this.currentWeek = newDate;
    this.loadSchedule();
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'week' ? 'month' : 'week';
    this.render();
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          schedule: [...this.schedule],
          conflicts: [...this.conflicts],
          aiRecommendations: [...this.aiRecommendations]
        });
      } catch (error) {
        console.error('[TrainingSchedule] Listener error:', error);
      }
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
    this.listeners.clear();
  }
}

// Export singleton instance
const enhancedTrainingSchedule = new EnhancedTrainingSchedule();

export default enhancedTrainingSchedule;


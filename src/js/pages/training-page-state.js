/**
 * Training Page State Management
 * Centralized state object for the training page
 */

class TrainingPageState {
    constructor() {
        this.reset();
    }

    reset() {
        this.user = null;
        this.scheduleSettings = null;
        this.weeklySchedule = [];
        this.recentWorkouts = [];
        this.weeklyStats = null;
        this.overallStats = null;
        this.streak = null;
        this.currentProgram = null;
        this.qbProgram = null;
        this.ui = {
            scheduleViewMode: 'detailed', // 'detailed' | 'compact'
            activeModal: null // 'scheduleBuilder' | 'offseasonProgram' | 'qbProgram' | null
        };
    }

    /**
     * Update user data
     */
    setUser(user) {
        this.user = user;
    }

    /**
     * Update schedule settings
     */
    setScheduleSettings(settings) {
        this.scheduleSettings = settings;
    }

    /**
     * Update weekly schedule
     */
    setWeeklySchedule(schedule) {
        this.weeklySchedule = schedule;
    }

    /**
     * Update recent workouts
     */
    setRecentWorkouts(workouts) {
        this.recentWorkouts = workouts;
    }

    /**
     * Update stats
     */
    setStats(weeklyStats, overallStats, streak) {
        this.weeklyStats = weeklyStats;
        this.overallStats = overallStats;
        this.streak = streak;
    }

    /**
     * Update program state
     */
    setCurrentProgram(program) {
        this.currentProgram = program;
    }

    setQBProgram(program) {
        this.qbProgram = program;
    }

    /**
     * Update UI state
     */
    setScheduleViewMode(mode) {
        if (mode === 'detailed' || mode === 'compact') {
            this.ui.scheduleViewMode = mode;
        }
    }

    setActiveModal(modal) {
        this.ui.activeModal = modal;
    }

    /**
     * Get current state snapshot
     */
    getState() {
        return {
            user: this.user,
            scheduleSettings: this.scheduleSettings,
            weeklySchedule: [...this.weeklySchedule],
            recentWorkouts: [...this.recentWorkouts],
            weeklyStats: this.weeklyStats ? { ...this.weeklyStats } : null,
            overallStats: this.overallStats ? { ...this.overallStats } : null,
            streak: this.streak ? { ...this.streak } : null,
            currentProgram: this.currentProgram ? { ...this.currentProgram } : null,
            qbProgram: this.qbProgram ? { ...this.qbProgram } : null,
            ui: { ...this.ui }
        };
    }
}

// Export singleton instance
export const trainingPageState = new TrainingPageState();


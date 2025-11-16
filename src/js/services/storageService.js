/**
 * Storage Service
 * Centralized localStorage access with error handling and fallbacks
 */

class StorageService {
    constructor() {
        this.isAvailable = this.checkAvailability();
    }

    checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            logger.warn('localStorage not available:', e);
            return false;
        }
    }

    // Workout sessions
    getRecentWorkouts() {
        if (!this.isAvailable) return [];
        try {
            const data = localStorage.getItem('recentWorkouts');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            logger.error('Error reading recentWorkouts:', e);
            return [];
        }
    }

    saveWorkoutSession(session) {
        if (!this.isAvailable) {
            logger.warn('Cannot save workout session: localStorage unavailable');
            return false;
        }
        try {
            const workouts = this.getRecentWorkouts();
            workouts.push(session);
            // Keep only last 50 workouts
            if (workouts.length > 50) {
                workouts.splice(0, workouts.length - 50);
            }
            localStorage.setItem('recentWorkouts', JSON.stringify(workouts));
            return true;
        } catch (e) {
            logger.error('Error saving workout session:', e);
            return false;
        }
    }

    getCurrentWorkout() {
        if (!this.isAvailable) return null;
        try {
            const data = localStorage.getItem('currentWorkout');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            logger.error('Error reading currentWorkout:', e);
            return null;
        }
    }

    setCurrentWorkout(session) {
        if (!this.isAvailable) return false;
        try {
            localStorage.setItem('currentWorkout', JSON.stringify(session));
            return true;
        } catch (e) {
            logger.error('Error saving currentWorkout:', e);
            return false;
        }
    }

    clearCurrentWorkout() {
        if (!this.isAvailable) return;
        try {
            localStorage.removeItem('currentWorkout');
        } catch (e) {
            logger.error('Error clearing currentWorkout:', e);
        }
    }

    // Schedule settings
    getScheduleSettings() {
        if (!this.isAvailable) {
            return this.getDefaultScheduleSettings();
        }
        try {
            const data = localStorage.getItem('flagfit_custom_schedule');
            if (data) {
                return JSON.parse(data);
            }
            return this.getDefaultScheduleSettings();
        } catch (e) {
            logger.error('Error reading schedule settings:', e);
            return this.getDefaultScheduleSettings();
        }
    }

    getDefaultScheduleSettings() {
        return {
            gameDay: null, // null, 'saturday', or 'sunday'
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            preferences: {
                includeMobility: true,
                includeFoamRolling: true
            }
        };
    }

    saveScheduleSettings(settings) {
        if (!this.isAvailable) {
            logger.warn('Cannot save schedule settings: localStorage unavailable');
            return false;
        }
        try {
            localStorage.setItem('flagfit_custom_schedule', JSON.stringify(settings));
            return true;
        } catch (e) {
            logger.error('Error saving schedule settings:', e);
            return false;
        }
    }

    // Program state
    getOffseasonProgram() {
        if (!this.isAvailable) return null;
        try {
            const data = localStorage.getItem('offseasonProgram');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            logger.error('Error reading offseason program:', e);
            return null;
        }
    }

    saveOffseasonProgram(programData) {
        if (!this.isAvailable) return false;
        try {
            localStorage.setItem('offseasonProgram', JSON.stringify(programData));
            return true;
        } catch (e) {
            logger.error('Error saving offseason program:', e);
            return false;
        }
    }

    getQBProgram() {
        if (!this.isAvailable) return null;
        try {
            const data = localStorage.getItem('qbProgram');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            logger.error('Error reading QB program:', e);
            return null;
        }
    }

    saveQBProgram(programData) {
        if (!this.isAvailable) return false;
        try {
            localStorage.setItem('qbProgram', JSON.stringify(programData));
            return true;
        } catch (e) {
            logger.error('Error saving QB program:', e);
            return false;
        }
    }

    // Generic get/set for other data
    get(key, defaultValue = null) {
        if (!this.isAvailable) return defaultValue;
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            logger.error(`Error reading ${key}:`, e);
            return defaultValue;
        }
    }

    set(key, value) {
        if (!this.isAvailable) return false;
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            logger.error(`Error saving ${key}:`, e);
            return false;
        }
    }

    remove(key) {
        if (!this.isAvailable) return;
        try {
            localStorage.removeItem(key);
        } catch (e) {
            logger.error(`Error removing ${key}:`, e);
        }
    }
}

// Export singleton instance
export const storageService = new StorageService();


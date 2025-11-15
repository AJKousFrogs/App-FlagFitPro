/**
 * Schedule Service
 * Generates weekly training schedules based on settings and workout templates
 */

import { workoutService } from './workoutService.js';

class ScheduleService {
    /**
     * Generate a weekly schedule
     * @param {Object} options - Schedule generation options
     * @param {Date} options.today - Reference date (defaults to now)
     * @param {Object} options.scheduleSettings - User's schedule settings
     * @param {Array} options.recentWorkouts - Array of completed workout sessions
     * @returns {Array} Array of 7 day objects
     */
    generateWeekSchedule({ today = new Date(), scheduleSettings, recentWorkouts = [] }) {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const weekSchedule = [];

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            const dayOfWeek = dayDate.getDay();
            const dayName = daysOfWeek[dayOfWeek];
            const isToday = dayDate.toDateString() === today.toDateString();
            const isGameDay = this.isGameDay(dayOfWeek, scheduleSettings?.gameDay);

            // Check if workout completed this day
            const dayWorkouts = recentWorkouts.filter(w => {
                const workoutDate = new Date(w.date);
                workoutDate.setHours(0, 0, 0, 0);
                const compareDate = new Date(dayDate);
                compareDate.setHours(0, 0, 0, 0);
                return workoutDate.getTime() === compareDate.getTime();
            });
            const isCompleted = dayWorkouts.length > 0;

            // Determine workout for this day
            const plannedWorkout = this.getPlannedWorkoutForDay(
                dayOfWeek,
                isGameDay,
                scheduleSettings?.gameDay
            );

            weekSchedule.push({
                date: dayDate,
                dayOfWeek,
                dayName,
                isToday,
                isGameDay,
                isCompleted,
                completedSessions: dayWorkouts,
                plannedWorkout
            });
        }

        return weekSchedule;
    }

    /**
     * Check if a day is a game day
     * @param {number} dayOfWeek - Day of week (0-6, 0=Sunday)
     * @param {string|null} gameDaySetting - User's game day setting
     * @returns {boolean} True if game day
     */
    isGameDay(dayOfWeek, gameDaySetting) {
        if (!gameDaySetting) return false;
        return (
            (gameDaySetting === 'saturday' && dayOfWeek === 6) ||
            (gameDaySetting === 'sunday' && dayOfWeek === 0)
        );
    }

    /**
     * Get planned workout for a specific day
     * @param {number} dayOfWeek - Day of week (0-6)
     * @param {boolean} isGameDay - Whether this is a game day
     * @param {string|null} gameDaySetting - User's game day setting
     * @returns {Object} Planned workout object
     */
    getPlannedWorkoutForDay(dayOfWeek, isGameDay, gameDaySetting) {
        let workoutType = null;
        let workoutTitle = null;
        let workoutMeta = null;
        let workoutClass = '';
        let isSkipped = false;

        if (dayOfWeek === 6) {
            // Saturday - Sprint Session
            if (isGameDay) {
                isSkipped = true;
                workoutTitle = 'Sprint Session (auto-skipped, game day focus)';
                workoutClass = 'skipped';
            } else {
                workoutType = 'speed';
                workoutTitle = 'Sprint Session';
                const template = workoutService.getWorkoutTemplate('speed');
                workoutMeta = `⏱️ ${template.duration} min • 🔥 High intensity`;
                workoutClass = 'sprint-session';
            }
        } else if (dayOfWeek === 0 && gameDaySetting === 'sunday') {
            // Sunday - Recovery (if game on Sunday)
            workoutType = 'endurance';
            workoutTitle = 'Recovery Session';
            workoutMeta = '⏱️ 30 min • 🔥 Low intensity';
            workoutClass = 'recovery';
        } else if (dayOfWeek === 0) {
            // Sunday - Regular Endurance
            workoutType = 'endurance';
            workoutTitle = 'Endurance Training';
            const template = workoutService.getWorkoutTemplate('endurance');
            workoutMeta = `⏱️ ${template.duration} min • 🔥 Low intensity`;
        } else if (dayOfWeek === 1 || dayOfWeek === 3) {
            // Monday, Wednesday - Strength
            workoutType = 'strength';
            workoutTitle = 'Strength Training';
            const template = workoutService.getWorkoutTemplate('strength');
            workoutMeta = `⏱️ ${template.duration} min • 🔥 Medium intensity`;
        } else if (dayOfWeek === 2 || dayOfWeek === 4) {
            // Tuesday, Thursday - Agility
            workoutType = 'agility';
            workoutTitle = 'Agility Training';
            const template = workoutService.getWorkoutTemplate('agility');
            workoutMeta = `⏱️ ${template.duration} min • 🔥 Medium intensity`;
        } else {
            // Friday - Speed
            workoutType = 'speed';
            workoutTitle = 'Speed Training';
            const template = workoutService.getWorkoutTemplate('speed');
            workoutMeta = `⏱️ ${template.duration} min • 🔥 High intensity`;
        }

        return {
            type: workoutType,
            title: workoutTitle,
            meta: workoutMeta,
            class: workoutClass,
            isSkipped
        };
    }
}

// Export singleton instance
export const scheduleService = new ScheduleService();


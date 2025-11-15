/**
 * Stats Service
 * Calculates training statistics and progress metrics
 */

class StatsService {
    /**
     * Calculate weekly stats from workout sessions
     * @param {Array} recentWorkouts - Array of workout session objects
     * @param {Date} today - Reference date (defaults to now)
     * @returns {Object} Weekly stats object
     */
    calculateWeeklyStats(recentWorkouts = [], today = new Date()) {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setHours(23, 59, 59, 999);

        const currentWeekWorkouts = recentWorkouts.filter(workout => {
            const workoutDate = new Date(workout.date);
            return workoutDate >= startOfWeek && workoutDate <= endOfWeek;
        });

        const sessionsCompleted = currentWeekWorkouts.length;
        const hoursThisWeek = currentWeekWorkouts.reduce(
            (total, workout) => total + (workout.duration || 0.75),
            0
        );

        return {
            sessionsCompleted,
            hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
            startOfWeek,
            endOfWeek
        };
    }

    /**
     * Calculate overall stats from all workouts
     * @param {Array} recentWorkouts - Array of workout session objects
     * @returns {Object} Overall stats object
     */
    calculateOverallStats(recentWorkouts = []) {
        const totalSessions = recentWorkouts.length;
        const totalHours = recentWorkouts.reduce(
            (total, workout) => total + (workout.duration || 0.75),
            0
        );
        const avgScore = recentWorkouts.length > 0
            ? Math.round(
                recentWorkouts.reduce((sum, w) => sum + (w.score || 85), 0) /
                recentWorkouts.length
            )
            : 0;

        return {
            totalSessions,
            totalHours: Math.round(totalHours * 10) / 10,
            avgScore
        };
    }

    /**
     * Calculate current streak
     * @param {Array} recentWorkouts - Array of workout session objects
     * @param {Date} today - Reference date (defaults to now)
     * @returns {Object} Streak information
     */
    computeStreak(recentWorkouts = [], today = new Date()) {
        if (recentWorkouts.length === 0) {
            return {
                currentStreak: 0,
                longestStreak: 0,
                lastWorkoutDate: null
            };
        }

        // Sort workouts by date (newest first)
        const sortedWorkouts = [...recentWorkouts].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        const lastWorkoutDate = new Date(sortedWorkouts[0].date);
        lastWorkoutDate.setHours(0, 0, 0, 0);

        const todayDate = new Date(today);
        todayDate.setHours(0, 0, 0, 0);

        // Calculate current streak
        let currentStreak = 0;
        const checkDate = new Date(todayDate);
        let workoutIndex = 0;

        while (workoutIndex < sortedWorkouts.length) {
            const workoutDate = new Date(sortedWorkouts[workoutIndex].date);
            workoutDate.setHours(0, 0, 0, 0);

            if (workoutDate.getTime() === checkDate.getTime()) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
                workoutIndex++;
            } else if (workoutDate < checkDate) {
                // Gap found, streak broken
                break;
            } else {
                // This workout is after checkDate, skip it
                workoutIndex++;
            }
        }

        // Calculate longest streak
        let longestStreak = 0;
        let tempStreak = 0;
        let lastDate = null;

        for (const workout of sortedWorkouts.reverse()) {
            const workoutDate = new Date(workout.date);
            workoutDate.setHours(0, 0, 0, 0);

            if (lastDate === null) {
                tempStreak = 1;
                lastDate = workoutDate;
            } else {
                const daysDiff = Math.floor(
                    (lastDate - workoutDate) / (1000 * 60 * 60 * 24)
                );
                if (daysDiff === 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
                lastDate = workoutDate;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return {
            currentStreak,
            longestStreak,
            lastWorkoutDate: sortedWorkouts.length > 0 ? sortedWorkouts[sortedWorkouts.length - 1].date : null
        };
    }

    /**
     * Get progress percentage for weekly goal
     * @param {number} sessionsCompleted - Number of sessions completed
     * @param {number} goalSessions - Goal number of sessions (default: 7)
     * @returns {number} Progress percentage (0-100)
     */
    getWeeklyProgress(sessionsCompleted, goalSessions = 7) {
        return Math.min(Math.round((sessionsCompleted / goalSessions) * 100), 100);
    }
}

// Export singleton instance
export const statsService = new StatsService();


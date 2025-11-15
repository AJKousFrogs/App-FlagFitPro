/**
 * Schedule Builder Modal Component
 * Specialized modal for building custom training schedules
 */

import Modal from './modal.js';
import { storageService } from '../services/storageService.js';

class ScheduleBuilderModal extends Modal {
    constructor(options = {}) {
        super({
            id: 'schedule-builder-modal',
            title: '<i data-lucide="calendar-plus" style="width: 24px; height: 24px; display: inline-block; vertical-align: middle;"></i> Build Your Custom Training Schedule',
            closeOnBackdrop: true,
            closeOnEscape: true,
            ...options
        });
        this.onSave = options.onSave || null;
        this.scheduleSettings = null;
    }

    /**
     * Create schedule builder form content
     */
    createFormContent() {
        const schedule = this.scheduleSettings || storageService.getScheduleSettings();
        const commonTimezones = [
            'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
            'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
            'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
            'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Stockholm',
            'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore',
            'Asia/Dubai', 'Asia/Kolkata', 'Australia/Sydney', 'Australia/Melbourne',
            'America/Toronto', 'America/Vancouver', 'America/Mexico_City',
            'America/Sao_Paulo', 'America/Buenos_Aires'
        ];
        const currentTz = schedule.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        let timezoneOptions = commonTimezones.map(tz =>
            `<option value="${tz}" ${tz === currentTz ? 'selected' : ''}>${tz.replace('_', ' ')}</option>`
        ).join('');
        if (!commonTimezones.includes(currentTz)) {
            timezoneOptions = `<option value="${currentTz}" selected>${currentTz.replace('_', ' ')} (Current)</option>` + timezoneOptions;
        }

        return `
            <form class="schedule-builder-form" id="schedule-builder-form">
                <div class="form-group">
                    <label class="form-label">When do you typically have games?</label>
                    <div class="game-day-selector">
                        <div class="game-day-option ${schedule.gameDay === null ? 'selected' : ''}"
                             data-game-day="null">
                            No Games
                        </div>
                        <div class="game-day-option ${schedule.gameDay === 'saturday' ? 'selected' : ''}"
                             data-game-day="saturday">
                            Saturday
                        </div>
                        <div class="game-day-option ${schedule.gameDay === 'sunday' ? 'selected' : ''}"
                             data-game-day="sunday">
                            Sunday
                        </div>
                    </div>
                    <input type="hidden" id="selected-game-day" value="${schedule.gameDay || ''}">
                    <p style="font-size: var(--text-xs); color: var(--text-secondary); margin-top: var(--space-2);">
                        💡 <strong>Saturday games:</strong> Sprint session will be automatically skipped<br>
                        💡 <strong>Sunday games:</strong> Training plan adjusts to lighter recovery workload
                    </p>
                </div>

                <div class="form-group">
                    <label class="form-label" for="timezone-select">Timezone</label>
                    <select class="form-select" id="timezone-select">
                        ${timezoneOptions}
                    </select>
                    <p style="font-size: var(--text-xs); color: var(--text-secondary); margin-top: var(--space-1);">
                        Your schedule times will adjust based on your timezone
                    </p>
                </div>

                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: var(--space-2);">
                        <input type="checkbox" id="include-mobility" ${schedule.preferences.includeMobility ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <span class="form-label" style="margin: 0;">Include 15-minute morning mobility drill and foam rolling</span>
                    </label>
                </div>
            </form>
        `;
    }

    /**
     * Create footer with action buttons
     */
    createFooter() {
        return `
            <button type="button" class="btn btn-secondary" data-modal-cancel>
                Cancel
            </button>
            <button type="submit" class="btn btn-primary" form="schedule-builder-form" data-modal-save>
                <i data-lucide="save" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i>
                Save Schedule
            </button>
        `;
    }

    /**
     * Open modal with schedule settings
     */
    open(scheduleSettings = null) {
        this.scheduleSettings = scheduleSettings || storageService.getScheduleSettings();
        this.content = this.createFormContent();
        this.footer = this.createFooter();
        super.open();
        this.setupFormEvents();
    }

    /**
     * Set up form-specific event handlers
     */
    setupFormEvents() {
        if (!this.modalElement) return;

        // Game day selector
        const gameDayOptions = this.modalElement.querySelectorAll('.game-day-option');
        gameDayOptions.forEach(option => {
            option.addEventListener('click', () => {
                gameDayOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                const gameDay = option.getAttribute('data-game-day');
                document.getElementById('selected-game-day').value = gameDay === 'null' ? '' : gameDay;
            });
        });

        // Form submission
        const form = this.modalElement.querySelector('#schedule-builder-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSave();
            });
        }

        // Cancel button
        const cancelBtn = this.modalElement.querySelector('[data-modal-cancel]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }
    }

    /**
     * Handle form save
     */
    handleSave() {
        const schedule = {
            gameDay: document.getElementById('selected-game-day').value || null,
            timezone: document.getElementById('timezone-select').value,
            preferences: {
                includeMobility: document.getElementById('include-mobility').checked,
                includeFoamRolling: document.getElementById('include-mobility').checked
            }
        };

        const success = storageService.saveScheduleSettings(schedule);

        if (success) {
            // Call onSave callback
            if (this.onSave) {
                this.onSave(schedule);
            }

            this.close();
            this.showSuccessMessage();
        } else {
            alert('Failed to save schedule. Please try again.');
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage() {
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--color-success); color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: var(--shadow-lg); z-index: 9999;';
        successMsg.innerHTML = '<i data-lucide="check-circle" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;"></i> Schedule saved successfully!';
        document.body.appendChild(successMsg);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        setTimeout(() => successMsg.remove(), 3000);
    }
}

export default ScheduleBuilderModal;


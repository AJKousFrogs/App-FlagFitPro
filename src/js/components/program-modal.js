/**
 * Program Modal Component
 * Reusable modal for displaying program information
 */

import Modal from './modal.js';
import { storageService } from '../services/storageService.js';

class ProgramModal extends Modal {
    constructor(programConfig, options = {}) {
        super({
            id: `program-modal-${programConfig.id}`,
            title: `${programConfig.icon} ${programConfig.name}`,
            closeOnBackdrop: true,
            closeOnEscape: true,
            ...options
        });
        this.programConfig = programConfig;
        this.onStart = options.onStart || null;
        this.onDownload = options.onDownload || null;
    }

    /**
     * Create program content
     */
    createProgramContent() {
        const config = this.programConfig;
        let content = `
            <div style="background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary)); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                <h3 style="margin: 0 0 1rem 0;">${config.title}</h3>
                <p style="margin: 0; opacity: 0.9;">${this.formatDateRange(config.startDate, config.endDate)}</p>
            </div>
        `;

        // Add challenge section for QB program
        if (config.challenge) {
            content += `
                <div style="background: var(--color-warning-subtle); border: 2px solid var(--color-warning); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h3 style="margin: 0 0 1rem 0; color: var(--color-warning-foreground);">🚨 The QB Challenge: ${config.challenge.totalThrows} Throws in a Weekend</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; color: var(--text-primary);">
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold;">${config.challenge.gamesPerWeekend}</div>
                            <div style="font-size: 0.8rem;">Games/Weekend</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold;">${config.challenge.throwsPerGame}</div>
                            <div style="font-size: 0.8rem;">Throws/Game</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold;">${config.challenge.totalThrows}</div>
                            <div style="font-size: 0.8rem;">Total Throws</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold;">${config.challenge.timeBetweenGames}</div>
                            <div style="font-size: 0.8rem;">Between Games</div>
                        </div>
                    </div>
                    <p style="margin: 1rem 0 0 0; font-size: 0.9rem; color: var(--text-primary); text-align: center;"><strong>${config.challenge.description}</strong></p>
                </div>
            `;
        }

        // Add features grid
        if (config.features) {
            content += `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    ${config.features.map(feature => `
                        <div style="background: var(--surface-secondary); padding: 1.5rem; border-radius: 12px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold; color: var(--brand-primary); margin-bottom: 0.5rem;">${this.extractFeatureValue(feature)}</div>
                            <div style="color: var(--text-secondary); font-size: 0.9rem;">${this.extractFeatureLabel(feature)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return content;
    }

    /**
     * Create footer with action buttons
     */
    createFooter() {
        return `
            ${this.onDownload ? `
            <button type="button" class="btn btn-primary" data-program-download>
                <i data-lucide="download" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i>
                Download Full Program
            </button>
            ` : ''}
            ${this.onStart ? `
            <button type="button" class="btn btn-secondary" data-program-start>
                <i data-lucide="play" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i>
                ${this.programConfig.role === 'QB' ? 'Start QB Training' : 'Start Week 1'}
            </button>
            ` : ''}
            <button type="button" class="btn btn-tertiary" data-modal-cancel>
                Maybe Later
            </button>
        `;
    }

    /**
     * Open modal
     */
    open() {
        this.content = this.createProgramContent();
        this.footer = this.createFooter();
        super.open();
        this.setupProgramEvents();
    }

    /**
     * Set up program-specific event handlers
     */
    setupProgramEvents() {
        if (!this.modalElement) return;

        // Download button
        const downloadBtn = this.modalElement.querySelector('[data-program-download]');
        if (downloadBtn && this.onDownload) {
            downloadBtn.addEventListener('click', () => {
                this.onDownload();
            });
        }

        // Start button
        const startBtn = this.modalElement.querySelector('[data-program-start]');
        if (startBtn && this.onStart) {
            startBtn.addEventListener('click', () => {
                this.onStart();
                this.close();
            });
        }

        // Cancel button
        const cancelBtn = this.modalElement.querySelector('[data-modal-cancel]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }
    }

    /**
     * Format date range
     */
    formatDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()} (${this.programConfig.durationWeeks} Weeks)`;
    }

    /**
     * Extract feature value from feature string
     */
    extractFeatureValue(feature) {
        // Extract numbers or text before slash/dash
        const match = feature.match(/^([\d-]+|[\w\s]+?)(?:\s|$)/);
        return match ? match[1].trim() : feature.split(' ')[0];
    }

    /**
     * Extract feature label from feature string
     */
    extractFeatureLabel(feature) {
        // Remove the value part
        return feature.replace(/^[\d-]+\s*/, '').trim();
    }
}

export default ProgramModal;


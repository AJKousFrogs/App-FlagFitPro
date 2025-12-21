// OAuth Buttons Component for Social Login
// Handles Google, Facebook, and Apple authentication with role selection

import { logger } from '../logger.js';

export class OAuthButtons {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      logger.error('[OAuth] Container not found:', containerSelector);
      return;
    }

    this.onRoleSelect = options.onRoleSelect || (() => {});
    this.selectedRole = null;
    this.currentProvider = null;

    // Configure which providers to show (can be customized)
    this.enabledProviders = options.enabledProviders || {
      google: true,
      facebook: true,
      apple: false  // Set to false by default (requires Apple Developer Account)
    };

    this.render();
  }

  render() {
    // Build buttons HTML based on enabled providers
    let buttonsHTML = '';

    if (this.enabledProviders.google) {
      buttonsHTML += `
        <button type="button" class="oauth-btn oauth-btn-google" data-provider="google" aria-label="Sign in with Google">
          <svg class="oauth-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Google</span>
        </button>
      `;
    }

    if (this.enabledProviders.facebook) {
      buttonsHTML += `
        <button type="button" class="oauth-btn oauth-btn-facebook" data-provider="facebook" aria-label="Sign in with Facebook">
          <svg class="oauth-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
          </svg>
          <span>Facebook</span>
        </button>
      `;
    }

    if (this.enabledProviders.apple) {
      buttonsHTML += `
        <button type="button" class="oauth-btn oauth-btn-apple" data-provider="apple" aria-label="Sign in with Apple">
          <svg class="oauth-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#000000"/>
          </svg>
          <span>Apple</span>
        </button>
      `;
    }

    const html = `
      <div class="oauth-container">
        <div class="divider">
          <span>Or continue with</span>
        </div>

        <div class="oauth-buttons">
          ${buttonsHTML}
        </div>
      </div>

      <!-- Role Selection Modal -->
      <div id="roleSelectionModal" class="oauth-modal" style="display: none;" role="dialog" aria-labelledby="modal-title" aria-modal="true">
        <div class="oauth-modal-overlay" id="modalOverlay"></div>
        <div class="oauth-modal-content">
          <h3 id="modal-title">Select Your Role</h3>
          <p class="oauth-modal-subtitle">Choose how you'll be using FlagFit Pro:</p>

          <div class="role-options">
            <label class="role-option">
              <input type="radio" name="oauth-role" value="player" checked>
              <div class="role-card">
                <div class="role-icon">🏈</div>
                <div class="role-title">Player</div>
                <div class="role-description">Track your performance and training</div>
              </div>
            </label>

            <label class="role-option">
              <input type="radio" name="oauth-role" value="coach">
              <div class="role-card">
                <div class="role-icon">📋</div>
                <div class="role-title">Coach</div>
                <div class="role-description">Manage your team and players</div>
              </div>
            </label>
          </div>

          <div class="oauth-modal-actions">
            <button type="button" class="btn btn-secondary" id="cancelOAuth">Cancel</button>
            <button type="button" class="btn btn-primary" id="confirmOAuth">Continue</button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  attachEventListeners() {
    // OAuth button clicks
    this.container.querySelectorAll('.oauth-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const provider = e.currentTarget.dataset.provider;
        this.showRoleSelection(provider);
      });
    });

    // Role selection modal
    const modal = document.getElementById('roleSelectionModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const cancelBtn = document.getElementById('cancelOAuth');
    const confirmBtn = document.getElementById('confirmOAuth');

    // Close modal on overlay click
    modalOverlay?.addEventListener('click', () => {
      this.hideRoleSelection();
    });

    // Close modal on cancel
    cancelBtn?.addEventListener('click', () => {
      this.hideRoleSelection();
    });

    // Confirm role selection
    confirmBtn?.addEventListener('click', () => {
      const selectedRole = document.querySelector('input[name="oauth-role"]:checked')?.value;
      if (selectedRole) {
        this.selectedRole = selectedRole;
        this.hideRoleSelection();
        this.onRoleSelect(this.currentProvider, selectedRole);
      }
    });

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        this.hideRoleSelection();
      }
    });
  }

  showRoleSelection(provider) {
    this.currentProvider = provider;
    const modal = document.getElementById('roleSelectionModal');
    if (modal) {
      modal.style.display = 'flex';
      // Focus first radio button for accessibility
      setTimeout(() => {
        const firstRadio = modal.querySelector('input[type="radio"]');
        firstRadio?.focus();
      }, 100);
    }
  }

  hideRoleSelection() {
    const modal = document.getElementById('roleSelectionModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}

import { CommonModule } from "@angular/common";
import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";

@Component({
  selector: "app-landing",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule],
  template: `
    <section class="hero-section">
      <div class="hero-background">
        <div class="hero-gradient-1"></div>
        <div class="hero-gradient-2"></div>
        <div class="hero-particles">
          @for (particle of particles; track particle.id) {
            <div 
              class="particle"
              [style.left.%]="particle.x"
              [style.top.%]="particle.y"
              [style.animation-delay]="particle.delay + 's'"
              [style.animation-duration]="particle.duration + 's'"
            ></div>
          }
        </div>
      </div>

      <div class="hero-container">
        <div class="hero-content" [class.hero-content-visible]="isLoaded()">
          <div class="hero-logo-wrapper animate-item" style="--delay: 0">
            <div class="hero-logo">
              <span class="merlin-icon">🏈</span>
            </div>
            <div class="hero-badge">🏆 Pro Platform</div>
          </div>

          <!-- Olympic Countdown Timer -->
          <div class="olympic-countdown animate-item" style="--delay: 1">
            <div class="countdown-label">
              <span class="countdown-label-text">TIME LEFT UNTIL THE</span>
              <span class="countdown-label-event">LA28 OLYMPIC GAMES</span>
            </div>
            <div class="countdown-timer">
              <div class="countdown-segment countdown-days">
                <span class="countdown-value">{{ olympicCountdown().days }}</span>
                <span class="countdown-unit">DAYS</span>
              </div>
              <div class="countdown-separator">:</div>
              <div class="countdown-segment">
                <span class="countdown-value">{{ olympicCountdown().hours | number:'2.0-0' }}</span>
                <span class="countdown-unit">HOURS</span>
              </div>
              <div class="countdown-separator">:</div>
              <div class="countdown-segment">
                <span class="countdown-value">{{ olympicCountdown().minutes | number:'2.0-0' }}</span>
                <span class="countdown-unit">MINS</span>
              </div>
              <div class="countdown-separator">:</div>
              <div class="countdown-segment">
                <span class="countdown-value">{{ olympicCountdown().seconds | number:'2.0-0' }}</span>
                <span class="countdown-unit">SEC</span>
              </div>
            </div>
          </div>

          <h1 class="hero-title animate-item" style="--delay: 2">
            Elevate Your
            <span class="hero-title-accent">Flag Football</span>
            Game
          </h1>

          <p class="hero-description animate-item" style="--delay: 3">
            The ultimate training and competition platform for serious players.
            Track performance, join tournaments, and connect with a community
            that shares your passion for the game.
          </p>

          <div class="hero-actions animate-item" style="--delay: 4">
            <p-button
              label="Get Started Free"
              icon="pi pi-arrow-right"
              iconPos="right"
              [routerLink]="['/register']"
              styleClass="p-button-lg hero-btn-primary"
            ></p-button>
            <p-button
              label="Sign In"
              icon="pi pi-sign-in"
              [routerLink]="['/login']"
              [outlined]="true"
              styleClass="p-button-lg hero-btn-secondary"
            ></p-button>
          </div>

          <div class="hero-stats animate-item" style="--delay: 5">
            @for (stat of heroStats; track stat.label) {
              <div class="hero-stat" [style.--stat-delay]="$index">
                <div class="hero-stat-number">{{ stat.value }}</div>
                <div class="hero-stat-label">{{ stat.label }}</div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="scroll-indicator animate-item" style="--delay: 6" [class.visible]="isLoaded()">
        <div class="scroll-mouse">
          <div class="scroll-wheel"></div>
        </div>
        <span>Scroll to explore</span>
      </div>
    </section>

    <section class="features-section">
      <div class="features-container">
        <div class="features-header">
          <h2 class="features-title">Everything You Need to Excel</h2>
          <p class="features-subtitle">
            Powerful tools designed to help you train smarter, compete better,
            and grow faster
          </p>
        </div>

        <div class="features-grid">
          @for (feature of features; track trackByFeatureId($index, feature)) {
            <p-card class="feature-card">
              <ng-template pTemplate="header">
                <div class="feature-card-icon">
                  <div
                    class="feature-icon-wrapper"
                    [class]="'feature-icon-' + feature.id"
                  >
                    <i [class]="'pi ' + feature.icon"></i>
                  </div>
                </div>
              </ng-template>
              <h3 class="feature-card-title">{{ feature.title }}</h3>
              <p class="feature-card-description">{{ feature.description }}</p>
              <div class="feature-card-link" (click)="navigateToFeature(feature.id)">
                <span>Learn more</span>
                <i class="pi pi-arrow-right"></i>
              </div>
            </p-card>
          }
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-container">
        <div class="footer-grid">
          <!-- Brand -->
          <div class="footer-brand">
            <div class="footer-logo">
              <i class="pi pi-football"></i>
              <span>FlagFit Pro</span>
            </div>
            <p class="footer-tagline">
              The ultimate training and competition platform for flag football athletes.
            </p>
          </div>

          <!-- Quick Links -->
          <div class="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><a routerLink="/login">Sign In</a></li>
              <li><a routerLink="/register">Get Started</a></li>
              <li><a href="#features" (click)="scrollToFeatures($event)">Features</a></li>
            </ul>
          </div>

          <!-- Resources -->
          <div class="footer-links">
            <h4>Resources</h4>
            <ul>
              <li><a routerLink="/settings/privacy">Privacy Settings</a></li>
              <li><a href="mailto:support&#64;flagfitpro.com">Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} FlagFit Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      /* ===== HERO SECTION ===== */
      .hero-section {
        position: relative;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: linear-gradient(135deg, var(--surface-primary) 0%, var(--surface-secondary) 100%);
      }

      .hero-background {
        position: absolute;
        inset: 0;
        z-index: 0;
        overflow: hidden;
      }

      .hero-gradient-1,
      .hero-gradient-2 {
        position: absolute;
        border-radius: 50%;
        filter: blur(120px);
        opacity: 0.4;
        animation: float 20s ease-in-out infinite;
      }

      .hero-gradient-1 {
        width: 600px;
        height: 600px;
        background: var(--color-brand-primary);
        top: -250px;
        right: -200px;
        animation-delay: 0s;
      }

      .hero-gradient-2 {
        width: 500px;
        height: 500px;
        background: var(--color-brand-secondary);
        bottom: -200px;
        left: -150px;
        animation-delay: -10s;
      }

      @keyframes float {
        0%, 100% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(30px, -30px) scale(1.05); }
        50% { transform: translate(-20px, 20px) scale(0.95); }
        75% { transform: translate(20px, 10px) scale(1.02); }
      }

      /* Particle effects */
      .hero-particles {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: var(--color-brand-primary);
        border-radius: 50%;
        opacity: 0.3;
        animation: particle-float 15s ease-in-out infinite;
      }

      @keyframes particle-float {
        0%, 100% { 
          transform: translateY(0) scale(1);
          opacity: 0.3;
        }
        50% { 
          transform: translateY(-100px) scale(1.5);
          opacity: 0.6;
        }
      }

      .hero-container {
        position: relative;
        z-index: 1;
        max-width: 1200px;
        width: 100%;
        padding: var(--space-6);
      }

      .hero-content {
        text-align: center;
      }

      /* Staggered animation for hero content */
      .animate-item {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                    transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        transition-delay: calc(var(--delay, 0) * 0.15s);
      }

      .hero-content-visible .animate-item {
        opacity: 1;
        transform: translateY(0);
      }

      .hero-logo-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-8);
      }

      .hero-logo {
        width: 100px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--ds-primary-green-light, #0ab85a) 0%, var(--ds-primary-green, #089949) 100%);
        border-radius: 50%;
        box-shadow: 0 20px 40px rgba(8, 153, 73, 0.3);
        animation: logo-pulse 3s ease-in-out infinite;
      }

      .merlin-icon {
        font-size: 3rem;
        line-height: 1;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }

      @keyframes logo-pulse {
        0%, 100% { 
          transform: scale(1);
          box-shadow: 0 20px 40px rgba(var(--color-brand-primary-rgb, 59, 130, 246), 0.3);
        }
        50% { 
          transform: scale(1.05);
          box-shadow: 0 25px 50px rgba(var(--color-brand-primary-rgb, 59, 130, 246), 0.4);
        }
      }

      .hero-badge {
        padding: var(--space-2) var(--space-5);
        background: linear-gradient(135deg, rgba(var(--color-brand-primary-rgb, 59, 130, 246), 0.1) 0%, rgba(var(--color-brand-secondary-rgb, 139, 92, 246), 0.1) 100%);
        border: 1px solid rgba(var(--color-brand-primary-rgb, 59, 130, 246), 0.2);
        border-radius: 50px;
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-semibold);
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
        animation: badge-glow 2s ease-in-out infinite alternate;
      }

      @keyframes badge-glow {
        0% { box-shadow: 0 0 20px rgba(var(--color-brand-primary-rgb, 59, 130, 246), 0.1); }
        100% { box-shadow: 0 0 30px rgba(var(--color-brand-primary-rgb, 59, 130, 246), 0.2); }
      }

      /* ===== OLYMPIC COUNTDOWN ===== */
      .olympic-countdown {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: clamp(2rem, 6vw, 5rem);
        margin-bottom: var(--space-10);
        padding: var(--space-6) var(--space-8);
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
        flex-wrap: wrap;
      }

      .countdown-label {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.125rem;
      }

      .countdown-label-text {
        font-family: 'Poppins', system-ui, sans-serif;
        font-size: clamp(0.625rem, 1.5vw, 0.875rem);
        font-weight: 600;
        letter-spacing: 0.15em;
        color: var(--text-secondary);
        text-transform: uppercase;
      }

      .countdown-label-event {
        font-family: 'Poppins', system-ui, sans-serif;
        font-size: clamp(0.875rem, 2vw, 1.25rem);
        font-weight: 800;
        letter-spacing: 0.1em;
        color: var(--text-primary);
        text-transform: uppercase;
      }

      .countdown-timer {
        display: flex;
        align-items: flex-start;
        gap: clamp(0.5rem, 2vw, 1rem);
      }

      .countdown-segment {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .countdown-value {
        font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Roboto Mono', monospace;
        font-size: clamp(2rem, 8vw, 4.5rem);
        font-weight: 900;
        line-height: 1;
        color: var(--text-primary);
        letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums;
        min-width: 1.8ch;
        text-align: center;
      }

      .countdown-days .countdown-value {
        min-width: 2.5ch;
      }

      .countdown-unit {
        font-family: 'Poppins', system-ui, sans-serif;
        font-size: clamp(0.5rem, 1.5vw, 0.875rem);
        font-weight: 600;
        letter-spacing: 0.15em;
        color: var(--text-secondary);
        text-transform: uppercase;
      }

      .countdown-separator {
        font-family: 'JetBrains Mono', 'SF Mono', 'Roboto Mono', monospace;
        font-size: clamp(2rem, 8vw, 4.5rem);
        font-weight: 900;
        line-height: 1;
        color: var(--text-primary);
        opacity: 0.3;
        padding-top: 0;
      }

      /* Responsive for countdown */
      @media (max-width: 768px) {
        .olympic-countdown {
          flex-direction: column;
          gap: var(--space-4);
          padding: var(--space-5) var(--space-4);
        }

        .countdown-label {
          align-items: center;
          text-align: center;
        }

        .countdown-timer {
          gap: 0.25rem;
        }

        .countdown-separator {
          padding: 0 0.125rem;
        }
      }

      @media (max-width: 380px) {
        .countdown-value {
          font-size: 1.75rem;
        }

        .countdown-separator {
          font-size: 1.75rem;
        }
      }

      .hero-title {
        font-size: clamp(2.5rem, 8vw, var(--font-display-xl, 4.5rem));
        font-weight: var(--font-weight-extrabold);
        margin-bottom: var(--space-6);
        line-height: 1.1;
        letter-spacing: -0.02em;
      }

      .hero-title-accent {
        background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-brand-secondary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .hero-description {
        font-size: var(--font-heading-sm);
        color: var(--text-secondary);
        margin-bottom: var(--space-10);
        max-width: 650px;
        margin-left: auto;
        margin-right: auto;
        line-height: 1.7;
      }

      .hero-actions {
        display: flex;
        gap: var(--space-4);
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: var(--space-14);
      }

      /* Premium button styles - WHITE ON GREEN for primary (design system rule) */
      :host ::ng-deep .hero-btn-primary {
        background: linear-gradient(135deg, var(--ds-primary-green-light, #0ab85a) 0%, var(--ds-primary-green, #089949) 100%) !important;
        border: none !important;
        border-radius: var(--radius-full, 9999px) !important;
        color: #ffffff !important; /* WHITE ON GREEN - design system rule */
        box-shadow: 0 10px 30px rgba(8, 153, 73, 0.35);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        padding: 0.875rem 2rem !important;
        font-weight: 600 !important;
      }

      :host ::ng-deep .hero-btn-primary .p-button-label {
        color: #ffffff !important; /* Ensure label is white */
      }

      :host ::ng-deep .hero-btn-primary .p-button-icon {
        color: #ffffff !important; /* Ensure icon is white */
      }

      :host ::ng-deep .hero-btn-primary:hover {
        transform: translateY(-3px) !important;
        box-shadow: 0 15px 40px rgba(8, 153, 73, 0.45) !important;
        background: linear-gradient(135deg, var(--ds-primary-green, #089949) 0%, var(--ds-primary-green-hover, #036d35) 100%) !important;
      }

      /* GREEN ON WHITE for secondary/outlined button (design system rule) */
      :host ::ng-deep .hero-btn-secondary {
        background: transparent !important;
        border: 2px solid var(--ds-primary-green, #089949) !important;
        border-radius: var(--radius-full, 9999px) !important;
        color: var(--ds-primary-green, #089949) !important; /* GREEN ON WHITE */
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        padding: 0.875rem 2rem !important;
        font-weight: 600 !important;
      }

      :host ::ng-deep .hero-btn-secondary .p-button-label {
        color: var(--ds-primary-green, #089949) !important;
      }

      :host ::ng-deep .hero-btn-secondary .p-button-icon {
        color: var(--ds-primary-green, #089949) !important;
      }

      :host ::ng-deep .hero-btn-secondary:hover {
        background: rgba(8, 153, 73, 0.08) !important;
        transform: translateY(-3px) !important;
        border-color: var(--ds-primary-green-hover, #036d35) !important;
      }

      .hero-stats {
        display: flex;
        gap: var(--space-10);
        justify-content: center;
        flex-wrap: wrap;
      }

      .hero-stat {
        text-align: center;
        opacity: 0;
        transform: translateY(20px);
        animation: stat-appear 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        animation-delay: calc(0.8s + var(--stat-delay, 0) * 0.1s);
      }

      @keyframes stat-appear {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .hero-stat-number {
        font-size: var(--font-display-sm);
        font-weight: var(--font-weight-bold);
        background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-brand-secondary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .hero-stat-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin-top: var(--space-1);
      }

      /* Scroll indicator */
      .scroll-indicator {
        position: absolute;
        bottom: var(--space-8);
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        opacity: 0;
        transition: opacity 0.6s ease;
      }

      .scroll-indicator.visible {
        opacity: 1;
        animation: bounce 2s ease-in-out infinite;
      }

      @keyframes bounce {
        0%, 100% { transform: translateX(-50%) translateY(0); }
        50% { transform: translateX(-50%) translateY(10px); }
      }

      .scroll-mouse {
        width: 24px;
        height: 40px;
        border: 2px solid var(--text-tertiary);
        border-radius: 12px;
        position: relative;
      }

      .scroll-wheel {
        width: 4px;
        height: 8px;
        background: var(--text-tertiary);
        border-radius: 2px;
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        animation: scroll-wheel 1.5s ease-in-out infinite;
      }

      @keyframes scroll-wheel {
        0%, 100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        50% { opacity: 0.3; transform: translateX(-50%) translateY(10px); }
      }

      .scroll-indicator span {
        font-size: var(--font-body-xs);
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      /* ===== FEATURES SECTION ===== */
      .features-section {
        padding: var(--space-20) var(--space-6);
        background: var(--surface-secondary);
        position: relative;
      }

      .features-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .features-header {
        text-align: center;
        margin-bottom: var(--space-16);
      }

      .features-title {
        font-size: var(--font-display-sm);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-4);
        letter-spacing: -0.02em;
      }

      .features-subtitle {
        font-size: var(--font-body-lg);
        color: var(--text-secondary);
        max-width: 600px;
        margin: 0 auto;
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--space-8);
      }

      :host ::ng-deep .feature-card {
        text-align: center;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: var(--radius-xl) !important;
        overflow: hidden;
      }

      :host ::ng-deep .feature-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
      }

      :host ::ng-deep .feature-card .p-card-body {
        padding: var(--space-8) !important;
      }

      .feature-card-icon {
        display: flex;
        justify-content: center;
        padding-top: var(--space-6);
      }

      .feature-icon-wrapper {
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 2rem;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      :host ::ng-deep .feature-card:hover .feature-icon-wrapper {
        transform: scale(1.1) rotate(5deg);
      }

      .feature-icon-analytics {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.2) 100%);
        color: #3b82f6;
      }

      .feature-icon-tournament {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.2) 100%);
        color: #f59e0b;
      }

      .feature-icon-community {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.2) 100%);
        color: #10b981;
      }

      .feature-icon-training {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.2) 100%);
        color: #8b5cf6;
      }

      .feature-icon-ai-coach {
        background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.2) 100%);
        color: #ec4899;
      }

      .feature-icon-progress {
        background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.2) 100%);
        color: #06b6d4;
      }

      .feature-card-title {
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-3);
      }

      .feature-card-description {
        color: var(--text-secondary);
        margin-bottom: var(--space-6);
        line-height: 1.6;
      }

      .feature-card-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-brand-primary);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-md);
      }

      .feature-card-link:hover {
        background: rgba(var(--color-brand-primary-rgb, 59, 130, 246), 0.1);
        gap: var(--space-3);
      }

      .feature-card-link i {
        transition: transform 0.3s ease;
      }

      .feature-card-link:hover i {
        transform: translateX(4px);
      }

      /* ===== FOOTER ===== */
      .landing-footer {
        background: var(--surface-primary);
        border-top: 1px solid var(--border-color);
        padding: var(--space-16) var(--space-6) var(--space-8);
      }

      .footer-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .footer-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: var(--space-10);
        margin-bottom: var(--space-10);
      }

      .footer-brand {
        max-width: 320px;
      }

      .footer-logo {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-4);
      }

      .footer-logo i {
        font-size: 1.75rem;
        background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-brand-secondary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .footer-logo span {
        background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-brand-secondary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .footer-tagline {
        color: var(--text-secondary);
        font-size: var(--font-body-sm);
        line-height: 1.7;
        margin: 0;
      }

      .footer-links h4 {
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin: 0 0 var(--space-5) 0;
      }

      .footer-links ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .footer-links li {
        margin-bottom: var(--space-3);
      }

      .footer-links a {
        color: var(--text-secondary);
        text-decoration: none;
        font-size: var(--font-body-sm);
        transition: all 0.2s ease;
        display: inline-block;
      }

      .footer-links a:hover {
        color: var(--color-brand-primary);
        transform: translateX(4px);
      }

      .footer-bottom {
        padding-top: var(--space-8);
        border-top: 1px solid var(--border-color);
        text-align: center;
      }

      .footer-bottom p {
        color: var(--text-tertiary);
        font-size: var(--font-body-sm);
        margin: 0;
      }

      /* ===== RESPONSIVE ===== */
      @media (max-width: 1024px) {
        .hero-stats {
          gap: var(--space-6);
        }
      }

      @media (max-width: 768px) {
        .hero-section {
          min-height: auto;
          padding: var(--space-20) 0 var(--space-16);
        }

        .hero-logo {
          width: 80px;
          height: 80px;
        }

        .merlin-icon {
          font-size: 2.5rem;
        }

        .hero-actions {
          flex-direction: column;
          align-items: center;
        }

        .hero-stats {
          flex-direction: column;
          gap: var(--space-4);
        }

        .scroll-indicator {
          display: none;
        }

        .footer-grid {
          grid-template-columns: 1fr 1fr;
          gap: var(--space-8);
        }

        .footer-brand {
          grid-column: 1 / -1;
          max-width: none;
          text-align: center;
        }

        .footer-logo {
          justify-content: center;
        }
      }

      @media (max-width: 480px) {
        .footer-grid {
          grid-template-columns: 1fr;
          text-align: center;
        }

        .features-grid {
          gap: var(--space-6);
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .hero-gradient-1,
        .hero-gradient-2,
        .particle,
        .hero-logo,
        .hero-badge,
        .animate-item,
        .hero-stat,
        .scroll-indicator,
        .scroll-wheel {
          animation: none !important;
        }

        .animate-item {
          opacity: 1;
          transform: none;
        }

        .hero-stat {
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class LandingComponent implements OnInit {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  
  // Signals for reactive state
  isLoaded = signal(false);
  
  // Olympic countdown - LA 2028 Opening Ceremony: July 14, 2028
  olympicCountdown = signal({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // LA 2028 Olympics Opening Ceremony date
  private olympicDate = new Date('2028-07-14T20:00:00-07:00'); // Pacific Time
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  
  currentYear = new Date().getFullYear();

  // Hero stats data - authentic messaging for Olympic-bound athletes
  heroStats = [
    { value: 'LA28', label: 'Olympic Debut' },
    { value: '5v5', label: 'Olympic Format' },
    { value: '∞', label: 'Your Potential' },
  ];

  // Particle data for background animation
  particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 10 + Math.random() * 10,
  }));

  features = [
    {
      id: "analytics",
      title: "Performance Analytics",
      description:
        "Track every training session and game statistic. Get insights that help you identify strengths and areas for improvement.",
      icon: "pi-chart-bar",
    },
    {
      id: "tournament",
      title: "Tournament System",
      description:
        "Join competitive tournaments, climb leaderboards, and compete against the best players in your region.",
      icon: "pi-trophy",
    },
    {
      id: "community",
      title: "Community Hub",
      description:
        "Connect with players, coaches, and teams. Share strategies, celebrate wins, and build lasting relationships.",
      icon: "pi-users",
    },
    {
      id: "training",
      title: "Training Programs",
      description:
        "Access structured workouts and skill development plans designed by professional coaches and trainers.",
      icon: "pi-bolt",
    },
    {
      id: "ai-coach",
      title: "AI Coach - Merlin",
      description:
        "Get personalized training advice from Merlin, your AI coach. Ask questions, get drill recommendations, and improve faster.",
      icon: "pi-sparkles",
    },
    {
      id: "progress",
      title: "Progress Reports",
      description:
        "Get detailed weekly and monthly reports on your development. Visualize your journey from beginner to elite athlete.",
      icon: "pi-chart-line",
    },
  ];

  constructor() {
    // Trigger animations after component renders
    afterNextRender(() => {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        this.isLoaded.set(true);
      }, 100);
    });
  }

  ngOnInit(): void {
    // Start countdown immediately
    this.updateCountdown();
    
    // Update every second
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
    
    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
    });
  }

  private updateCountdown(): void {
    const now = new Date().getTime();
    const target = this.olympicDate.getTime();
    const difference = target - now;
    
    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      this.olympicCountdown.set({ days, hours, minutes, seconds });
    } else {
      // Olympic games have started!
      this.olympicCountdown.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
    }
  }

  trackByFeatureId(index: number, feature: { id: string }): string {
    return feature.id;
  }

  scrollToFeatures(event: Event): void {
    event.preventDefault();
    const featuresSection = document.querySelector('.features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navigateToFeature(featureId: string): void {
    // Map feature IDs to their corresponding routes
    const featureRoutes: Record<string, string> = {
      analytics: '/analytics',
      tournament: '/tournaments',
      community: '/community',
      training: '/training',
      'ai-coach': '/ai-coach',
      progress: '/analytics',
    };

    const route = featureRoutes[featureId];
    if (route) {
      // Navigate to register first (since these are protected routes)
      this.router.navigate(['/register'], { 
        queryParams: { redirect: route } 
      });
    }
  }
}

/**
 * Travel Recovery Component
 *
 * JET LAG MANAGEMENT & TRAVEL RECOVERY DASHBOARD
 *
 * Helps Olympic-bound athletes:
 * - Plan travel to minimize jet lag impact
 * - Get personalized recovery protocols
 * - Track adaptation progress
 * - Prepare for LA28 and Brisbane 2032
 * - Long car travel protocols (6-12+ hours)
 * - Blood circulation management
 * - Compression & massage gun guidance
 *
 * @author FlagFit Pro Team
 * @version 2.0.0
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

// PrimeNG Components
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { Select } from "primeng/select";
import { DatePickerModule } from "primeng/datepicker";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { StepsModule } from "primeng/steps";
import { TimelineModule } from "primeng/timeline";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { AccordionModule } from "primeng/accordion";
import { CheckboxModule } from "primeng/checkbox";
import { TooltipModule } from "primeng/tooltip";
import { DividerModule } from "primeng/divider";
import { Chip } from "primeng/chip";
import { BadgeModule } from "primeng/badge";

// Services
import {
  TravelRecoveryService,
  TravelPlan,
  RecoveryProtocol,
  JetLagSeverity,
  TravelChecklist,
  CarTravelProtocol,
  CirculationExercise,
  MassageGunProtocol,
  BloodCirculationRisk,
} from "../../../core/services/travel-recovery.service";
import { ToastService } from "../../../core/services/toast.service";
import { AuthService } from "../../../core/services/auth.service";

// Layout
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

interface TimezoneOption {
  value: string;
  label: string;
  offset: number;
}

@Component({
  selector: "app-travel-recovery",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    Select,
    DatePickerModule,
    InputNumberModule,
    InputTextModule,
    StepsModule,
    TimelineModule,
    TagModule,
    ProgressBarModule,
    AccordionModule,
    CheckboxModule,
    TooltipModule,
    DividerModule,
    Chip,
    BadgeModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="travel-recovery-page">
        <app-page-header
          title="Travel Recovery Protocol"
          subtitle="Optimize your recovery for peak competition performance"
          icon="pi-globe"
        >
          @if (hasActivePlan() || hasActiveCarPlan()) {
            <p-button
              label="New Trip"
              icon="pi pi-plus"
              [outlined]="true"
              (onClick)="startNewPlan()"
            ></p-button>
          }
        </app-page-header>

        <!-- Travel Type Selector -->
        <div class="travel-type-selector">
          <button
            class="type-btn"
            [class.active]="travelType() === 'flight'"
            (click)="setTravelType('flight')"
          >
            <i class="pi pi-send"></i>
            <span>Flight Travel</span>
            <small>Jet lag protocols</small>
          </button>
          <button
            class="type-btn"
            [class.active]="travelType() === 'car'"
            (click)="setTravelType('car')"
          >
            <i class="pi pi-car"></i>
            <span>Car Travel</span>
            <small>6-12+ hour drives</small>
          </button>
        </div>

        @if (travelType() === "flight" && !hasActivePlan()) {
          <!-- Flight Trip Planning Form -->
          <div class="planning-section">
            <!-- Olympic Quick Select -->
            <p-card styleClass="olympic-card">
              <ng-template pTemplate="header">
                <div class="card-header olympic-header">
                  <span class="olympic-rings">🏅</span>
                  <div>
                    <h3>Olympic Travel Planner</h3>
                    <p>Quick setup for LA28 or Brisbane 2032</p>
                  </div>
                </div>
              </ng-template>

              <div class="olympic-buttons">
                <button
                  class="olympic-btn la28"
                  (click)="selectOlympicVenue('LA28')"
                  [class.selected]="selectedOlympicVenue === 'LA28'"
                >
                  <span class="venue-flag">🇺🇸</span>
                  <span class="venue-name">Los Angeles 2028</span>
                  <span class="venue-tz">UTC-8</span>
                </button>
                <button
                  class="olympic-btn brisbane"
                  (click)="selectOlympicVenue('BRISBANE32')"
                  [class.selected]="selectedOlympicVenue === 'BRISBANE32'"
                >
                  <span class="venue-flag">🇦🇺</span>
                  <span class="venue-name">Brisbane 2032</span>
                  <span class="venue-tz">UTC+10</span>
                </button>
              </div>

              @if (selectedOlympicVenue && olympicImpact()) {
                <div class="olympic-impact">
                  <div class="impact-stat">
                    <span class="stat-value">{{
                      Math.abs(olympicImpact()!.timezonesDifference)
                    }}</span>
                    <span class="stat-label">Time Zones</span>
                  </div>
                  <div class="impact-stat">
                    <span class="stat-value">{{
                      olympicImpact()!.direction
                    }}</span>
                    <span class="stat-label">Direction</span>
                  </div>
                  <div class="impact-stat">
                    <span class="stat-value">{{
                      olympicImpact()!.estimatedRecoveryDays
                    }}</span>
                    <span class="stat-label">Recovery Days</span>
                  </div>
                </div>
              }
            </p-card>

            <!-- Manual Trip Setup -->
            <p-card styleClass="setup-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <i class="pi pi-map"></i>
                  <h3>Trip Details</h3>
                </div>
              </ng-template>

              <div class="form-grid">
                <div class="form-field">
                  <label>Trip Name</label>
                  <input
                    pInputText
                    [(ngModel)]="tripForm.tripName"
                    placeholder="e.g., World Championships 2025"
                  />
                </div>

                <div class="form-field">
                  <label>Home Timezone</label>
                  <p-select
                    [(ngModel)]="tripForm.departureTimezone"
                    [options]="timezones"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select your home timezone"
                    [filter]="true"
                    filterBy="label"
                    styleClass="w-full"
                  ></p-select>
                </div>

                <div class="form-field">
                  <label>Destination Timezone</label>
                  <p-select
                    [(ngModel)]="tripForm.arrivalTimezone"
                    [options]="timezones"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select destination timezone"
                    [filter]="true"
                    filterBy="label"
                    styleClass="w-full"
                  ></p-select>
                </div>

                <div class="form-field">
                  <label>Departure Date</label>
                  <p-datepicker
                    [(ngModel)]="tripForm.departureDate"
                    [showIcon]="true"
                    [minDate]="minDate"
                    dateFormat="dd/mm/yy"
                    styleClass="w-full"
                  ></p-datepicker>
                </div>

                <div class="form-field">
                  <label>Arrival Date</label>
                  <p-datepicker
                    [(ngModel)]="tripForm.arrivalDate"
                    [showIcon]="true"
                    [minDate]="tripForm.departureDate || minDate"
                    dateFormat="dd/mm/yy"
                    styleClass="w-full"
                  ></p-datepicker>
                </div>

                <div class="form-field">
                  <label>Competition Date (Optional)</label>
                  <p-datepicker
                    [(ngModel)]="tripForm.competitionDate"
                    [showIcon]="true"
                    [minDate]="tripForm.arrivalDate || minDate"
                    dateFormat="dd/mm/yy"
                    styleClass="w-full"
                  ></p-datepicker>
                </div>

                <div class="form-field">
                  <label>Flight Duration (hours)</label>
                  <p-inputNumber
                    [(ngModel)]="tripForm.flightDuration"
                    [min]="1"
                    [max]="30"
                    [showButtons]="true"
                    suffix=" hrs"
                  ></p-inputNumber>
                </div>

                <div class="form-field">
                  <label>Number of Layovers</label>
                  <p-inputNumber
                    [(ngModel)]="tripForm.layovers"
                    [min]="0"
                    [max]="5"
                    [showButtons]="true"
                  ></p-inputNumber>
                </div>
              </div>

              <div class="form-actions">
                <p-button
                  label="Generate Recovery Protocol"
                  icon="pi pi-bolt"
                  (onClick)="createPlan()"
                  [disabled]="!canCreatePlan()"
                ></p-button>
              </div>
            </p-card>
          </div>
        } @else if (travelType() === "flight" && hasActivePlan()) {
          <!-- Active Flight Plan Dashboard -->
          <div class="protocol-dashboard">
            <!-- Severity Overview -->
            <div class="severity-section">
              <p-card
                styleClass="severity-card"
                [ngClass]="'severity-' + jetLagSeverity().level"
              >
                <div class="severity-content">
                  <div class="severity-gauge">
                    <div class="gauge-circle">
                      <span class="gauge-value">{{
                        jetLagSeverity().score
                      }}</span>
                      <span class="gauge-label">Jet Lag Score</span>
                    </div>
                  </div>
                  <div class="severity-details">
                    <h2>{{ currentPlan()?.tripName }}</h2>
                    <div class="detail-chips">
                      <p-chip
                        [label]="
                          Math.abs(currentPlan()?.timezonesEast || 0) +
                          ' Time Zones'
                        "
                        icon="pi pi-clock"
                      ></p-chip>
                      <p-chip
                        [label]="
                          currentPlan()?.travelDirection || 'none' | titlecase
                        "
                        [icon]="
                          currentPlan()?.travelDirection === 'eastward'
                            ? 'pi pi-arrow-right'
                            : 'pi pi-arrow-left'
                        "
                      ></p-chip>
                      <p-tag
                        [value]}="jetLagSeverity().level | titlecase"
                        [severity]="getSeverityColor(jetLagSeverity().level)"
                      ></p-tag>
                    </div>
                    <div class="recovery-estimate">
                      <i class="pi pi-calendar-plus"></i>
                      <span
                        >Estimated Recovery:
                        <strong
                          >{{
                            jetLagSeverity().estimatedRecoveryDays
                          }}
                          days</strong
                        ></span
                      >
                    </div>
                    @if (daysUntilCompetition() !== null) {
                      <div
                        class="competition-countdown"
                        [class.warning]="!isCompetitionReady()"
                      >
                        <i class="pi pi-flag"></i>
                        <span>
                          Competition in
                          <strong>{{ daysUntilCompetition() }} days</strong>
                          @if (!isCompetitionReady()) {
                            <span class="warning-text"> - Arrive earlier!</span>
                          }
                        </span>
                      </div>
                    }
                  </div>
                </div>

                @if (jetLagSeverity().symptoms.length > 0) {
                  <div class="symptoms-section">
                    <h4>Expected Symptoms</h4>
                    <div class="symptoms-list">
                      @for (
                        symptom of jetLagSeverity().symptoms;
                        track symptom
                      ) {
                        <span class="symptom-chip">{{ symptom }}</span>
                      }
                    </div>
                  </div>
                }
              </p-card>
            </div>

            <!-- Today's Protocol -->
            @if (todayProtocol()) {
              <p-card styleClass="today-card">
                <ng-template pTemplate="header">
                  <div class="card-header today-header">
                    <div class="header-left">
                      <i class="pi pi-sun"></i>
                      <div>
                        <h3>Today's Protocol</h3>
                        <p-tag
                          [value]="todayProtocol()!.phase | titlecase"
                          [severity]="getPhaseColor(todayProtocol()!.phase)"
                        ></p-tag>
                      </div>
                    </div>
                    <div class="header-right">
                      <span class="day-badge"
                        >Day {{ todayProtocol()!.day }}</span
                      >
                    </div>
                  </div>
                </ng-template>

                <div class="protocol-grid">
                  <!-- Sleep Window -->
                  <div class="protocol-section">
                    <h4><i class="pi pi-moon"></i> Sleep Window</h4>
                    <div class="sleep-times">
                      <div class="time-block">
                        <span class="time-label">Bedtime</span>
                        <span class="time-value">{{
                          todayProtocol()!.sleepWindow.bedTime
                        }}</span>
                      </div>
                      <i class="pi pi-arrow-right"></i>
                      <div class="time-block">
                        <span class="time-label">Wake Up</span>
                        <span class="time-value">{{
                          todayProtocol()!.sleepWindow.wakeTime
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Light Exposure -->
                  <div class="protocol-section">
                    <h4><i class="pi pi-sun"></i> Light Exposure</h4>
                    <div class="light-windows">
                      @for (
                        light of todayProtocol()!.lightExposure;
                        track light.startTime
                      ) {
                        <div class="light-item" [class]="light.type">
                          <span class="light-icon">
                            @if (light.type === "seek") {
                              ☀️
                            } @else {
                              🕶️
                            }
                          </span>
                          <div class="light-details">
                            <span class="light-action"
                              >{{ light.type === "seek" ? "Seek" : "Avoid" }}
                              {{ light.intensity }} light</span
                            >
                            <span class="light-time"
                              >{{ light.startTime }} - {{ light.endTime }}</span
                            >
                            <span class="light-reason">{{ light.reason }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Training Guidelines -->
                  <div class="protocol-section">
                    <h4><i class="pi pi-bolt"></i> Training</h4>
                    <div class="training-info">
                      <p-tag
                        [value]="
                          'Intensity: ' +
                          (todayProtocol()!.trainingGuidelines.allowedIntensity
                            | titlecase)
                        "
                        [severity]="
                          getIntensityColor(
                            todayProtocol()!.trainingGuidelines.allowedIntensity
                          )
                        "
                      ></p-tag>
                      <span class="max-duration"
                        >Max
                        {{ todayProtocol()!.trainingGuidelines.maxDuration }}
                        min</span
                      >
                    </div>
                    <div class="activity-lists">
                      <div class="activity-list recommended">
                        <span class="list-label">✅ Recommended</span>
                        <ul>
                          @for (
                            activity of todayProtocol()!.trainingGuidelines
                              .recommendedActivities;
                            track activity
                          ) {
                            <li>{{ activity }}</li>
                          }
                        </ul>
                      </div>
                      @if (
                        todayProtocol()!.trainingGuidelines.avoidActivities
                          .length > 0
                      ) {
                        <div class="activity-list avoid">
                          <span class="list-label">❌ Avoid</span>
                          <ul>
                            @for (
                              activity of todayProtocol()!.trainingGuidelines
                                .avoidActivities;
                              track activity
                            ) {
                              <li>{{ activity }}</li>
                            }
                          </ul>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Hydration -->
                  <div class="protocol-section">
                    <h4><i class="pi pi-tint"></i> Hydration Target</h4>
                    <div class="hydration-target">
                      <span class="hydration-value"
                        >{{
                          todayProtocol()!.hydrationTarget / 1000
                            | number: "1.1-1"
                        }}L</span
                      >
                      <span class="hydration-note"
                        >Stay well hydrated throughout the day</span
                      >
                    </div>
                  </div>
                </div>

                <!-- Key Recommendations -->
                <div class="recommendations-section">
                  <h4>Key Actions</h4>
                  <div class="recommendations-list">
                    @for (
                      rec of todayProtocol()!.recommendations;
                      track rec.action
                    ) {
                      <div
                        class="recommendation-item"
                        [class]="'importance-' + rec.importance"
                      >
                        <span class="rec-time">{{ rec.time }}</span>
                        <span class="rec-action">{{ rec.action }}</span>
                        <p-tag
                          [value]="rec.importance"
                          [severity]="getImportanceColor(rec.importance)"
                          [rounded]="true"
                        ></p-tag>
                      </div>
                    }
                  </div>
                </div>

                <!-- Supplements -->
                @if (todayProtocol()!.supplements.length > 0) {
                  <div class="supplements-section">
                    <h4><i class="pi pi-heart"></i> Supplements</h4>
                    <div class="supplements-list">
                      @for (
                        supp of todayProtocol()!.supplements;
                        track supp.name
                      ) {
                        <div class="supplement-item">
                          <div class="supp-header">
                            <span class="supp-name">{{ supp.name }}</span>
                            <span class="supp-dosage">{{ supp.dosage }}</span>
                          </div>
                          <div class="supp-details">
                            <span class="supp-timing"
                              ><i class="pi pi-clock"></i>
                              {{ supp.timing }}</span
                            >
                            <span class="supp-purpose">{{ supp.purpose }}</span>
                          </div>
                          @if (supp.caution) {
                            <div class="supp-caution">
                              <i class="pi pi-exclamation-triangle"></i>
                              {{ supp.caution }}
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </p-card>
            }

            <!-- Full Protocol Timeline -->
            <p-card styleClass="timeline-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <i class="pi pi-calendar"></i>
                  <h3>Full Recovery Timeline</h3>
                </div>
              </ng-template>

              <p-accordion [multiple]="true">
                @for (protocol of recoveryProtocol(); track protocol.day) {
                  <p-accordion-panel [value]="'day-' + protocol.day">
                    <p-accordion-header>
                      <div class="timeline-header">
                        <span class="timeline-day">
                          @if (protocol.day < 0) {
                            {{ Math.abs(protocol.day) }} days before
                          } @else if (protocol.day === 0) {
                            Travel Day
                          } @else {
                            Day {{ protocol.day }}
                          }
                        </span>
                        <span class="timeline-date">{{
                          protocol.date | date: "EEE, MMM d"
                        }}</span>
                        <p-tag
                          [value]="protocol.phase"
                          [severity]="getPhaseColor(protocol.phase)"
                          [rounded]="true"
                        ></p-tag>
                        @if (isToday(protocol.date)) {
                          <p-badge value="Today" severity="info"></p-badge>
                        }
                      </div>
                    </p-accordion-header>
                    <p-accordion-content>
                      <div class="timeline-content">
                        <div class="timeline-summary">
                          <div class="summary-item">
                            <i class="pi pi-moon"></i>
                            <span
                              >Sleep: {{ protocol.sleepWindow.bedTime }} -
                              {{ protocol.sleepWindow.wakeTime }}</span
                            >
                          </div>
                          <div class="summary-item">
                            <i class="pi pi-bolt"></i>
                            <span
                              >Training:
                              {{
                                protocol.trainingGuidelines.allowedIntensity
                                  | titlecase
                              }}
                              ({{ protocol.trainingGuidelines.maxDuration }}min
                              max)</span
                            >
                          </div>
                          <div class="summary-item">
                            <i class="pi pi-tint"></i>
                            <span
                              >Hydration:
                              {{
                                protocol.hydrationTarget / 1000
                                  | number: "1.1-1"
                              }}L</span
                            >
                          </div>
                        </div>

                        <div class="timeline-recommendations">
                          @for (
                            rec of protocol.recommendations.slice(0, 3);
                            track rec.action
                          ) {
                            <div class="mini-rec">
                              <span
                                class="rec-bullet"
                                [class]="'importance-' + rec.importance"
                                >●</span
                              >
                              {{ rec.action }}
                            </div>
                          }
                        </div>
                      </div>
                    </p-accordion-content>
                  </p-accordion-panel>
                }
              </p-accordion>
            </p-card>

            <!-- Travel Checklist -->
            <p-card styleClass="checklist-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <i class="pi pi-check-square"></i>
                  <h3>Travel Checklist</h3>
                </div>
              </ng-template>

              <p-accordion>
                @for (category of travelChecklist; track category.category) {
                  <p-accordion-panel [value]="category.category">
                    <p-accordion-header>{{
                      category.category
                    }}</p-accordion-header>
                    <p-accordion-content>
                      <div class="checklist-items">
                        @for (item of category.items; track item.id) {
                          <div
                            class="checklist-item"
                            [class.essential]="item.essential"
                          >
                            <p-checkbox
                              [(ngModel)]="item.packed"
                              [binary]="true"
                              [inputId]="item.id"
                            ></p-checkbox>
                            <label [for]="item.id" [class.packed]="item.packed">
                              {{ item.item }}
                              @if (item.essential) {
                                <span class="essential-badge">Essential</span>
                              }
                            </label>
                            @if (item.notes) {
                              <span class="item-note">{{ item.notes }}</span>
                            }
                          </div>
                        }
                      </div>
                    </p-accordion-content>
                  </p-accordion-panel>
                }
              </p-accordion>
            </p-card>
          </div>
        } @else if (travelType() === "car") {
          <!-- Car Travel Section -->
          <div class="car-travel-section">
            <!-- Car Trip Setup -->
            @if (!hasActiveCarPlan()) {
              <p-card styleClass="car-setup-card">
                <ng-template pTemplate="header">
                  <div class="card-header car-header">
                    <i class="pi pi-car"></i>
                    <div>
                      <h3>Long Car Travel Protocol</h3>
                      <p>
                        Evidence-based blood circulation management for 6-12+
                        hour drives
                      </p>
                    </div>
                  </div>
                </ng-template>

                <div class="form-grid">
                  <div class="form-field">
                    <label>Trip Name</label>
                    <input
                      pInputText
                      [(ngModel)]="carTripForm.tripName"
                      placeholder="e.g., Regional Tournament Drive"
                    />
                  </div>

                  <div class="form-field">
                    <label>Estimated Drive Duration (hours)</label>
                    <p-inputNumber
                      [(ngModel)]="carTripForm.duration"
                      [min]="1"
                      [max]="18"
                      [showButtons]="true"
                      suffix=" hrs"
                    ></p-inputNumber>
                  </div>

                  <div class="form-field">
                    <label>Are you driving?</label>
                    <div class="driver-toggle">
                      <p-checkbox
                        [(ngModel)]="carTripForm.isDriver"
                        [binary]="true"
                        label="Yes, I'm driving"
                      ></p-checkbox>
                    </div>
                  </div>

                  <div class="form-field">
                    <label>Competition Date (Optional)</label>
                    <p-datepicker
                      [(ngModel)]="carTripForm.competitionDate"
                      [showIcon]="true"
                      [minDate]="minDate"
                      dateFormat="dd/mm/yy"
                      styleClass="w-full"
                    ></p-datepicker>
                  </div>
                </div>

                <div class="form-actions">
                  <p-button
                    label="Generate Car Travel Protocol"
                    icon="pi pi-bolt"
                    (onClick)="createCarPlan()"
                    [disabled]="!canCreateCarPlan()"
                  ></p-button>
                </div>
              </p-card>

              <!-- Risk Assessment Preview -->
              @if (carTripForm.duration >= 4) {
                <p-card styleClass="risk-preview-card">
                  <ng-template pTemplate="header">
                    <div
                      class="card-header"
                      [class]="'risk-' + carTravelRisk().riskLevel"
                    >
                      <i class="pi pi-exclamation-triangle"></i>
                      <h3>Circulation Risk Assessment</h3>
                    </div>
                  </ng-template>

                  <div class="risk-content">
                    <div class="risk-gauge">
                      <div
                        class="risk-circle"
                        [class]="'risk-' + carTravelRisk().riskLevel"
                      >
                        <span class="risk-score">{{
                          carTravelRisk().score
                        }}</span>
                        <span class="risk-label">Risk Score</span>
                      </div>
                      <p-tag
                        [value]="carTravelRisk().riskLevel | titlecase"
                        [severity]="getRiskColor(carTravelRisk().riskLevel)"
                      ></p-tag>
                    </div>

                    <div class="risk-factors">
                      <h4>Risk Factors</h4>
                      <ul>
                        @for (factor of carTravelRisk().factors; track factor) {
                          <li>
                            <i class="pi pi-exclamation-circle"></i>
                            {{ factor }}
                          </li>
                        }
                      </ul>
                    </div>

                    <div class="risk-recommendations">
                      <h4>Key Recommendations</h4>
                      <ul>
                        @for (
                          rec of carTravelRisk().recommendations;
                          track rec
                        ) {
                          <li><i class="pi pi-check-circle"></i> {{ rec }}</li>
                        }
                      </ul>
                    </div>
                  </div>
                </p-card>
              }
            } @else {
              <!-- Active Car Travel Plan -->
              <div class="car-protocol-dashboard">
                <!-- Risk Overview -->
                <p-card
                  styleClass="car-risk-card"
                  [ngClass]="'risk-' + carTravelRisk().riskLevel"
                >
                  <div class="car-risk-content">
                    <div class="risk-header">
                      <div class="risk-gauge-small">
                        <span class="risk-score">{{
                          carTravelRisk().score
                        }}</span>
                      </div>
                      <div class="risk-info">
                        <h2>{{ activeCarPlan()?.tripName }}</h2>
                        <div class="detail-chips">
                          <p-chip
                            [label]="activeCarPlan()?.duration + ' Hour Drive'"
                            icon="pi pi-clock"
                          ></p-chip>
                          <p-chip
                            [label]="
                              activeCarPlan()?.isDriver
                                ? 'Driving'
                                : 'Passenger'
                            "
                            [icon]="
                              activeCarPlan()?.isDriver
                                ? 'pi pi-user'
                                : 'pi pi-users'
                            "
                          ></p-chip>
                          <p-tag
                            [value]="carTravelRisk().riskLevel + ' Risk'"
                            [severity]="getRiskColor(carTravelRisk().riskLevel)"
                          ></p-tag>
                        </div>
                      </div>
                    </div>

                    <!-- Warning Symptoms -->
                    <div class="warning-symptoms">
                      <h4>
                        <i class="pi pi-exclamation-triangle"></i> Stop & Seek
                        Help If You Experience:
                      </h4>
                      <div class="symptoms-grid">
                        @for (
                          symptom of carTravelRisk().warningSymptoms;
                          track symptom
                        ) {
                          <span class="warning-symptom">{{ symptom }}</span>
                        }
                      </div>
                    </div>
                  </div>
                </p-card>

                <!-- Compression Guidelines -->
                <p-card styleClass="compression-card">
                  <ng-template pTemplate="header">
                    <div class="card-header compression-header">
                      <span class="compression-icon">🦵</span>
                      <div>
                        <h3>Compression Garments</h3>
                        <p>Evidence-based blood flow enhancement</p>
                      </div>
                    </div>
                  </ng-template>

                  <div class="compression-content">
                    <div class="compression-type">
                      <h4>
                        Recommended:
                        {{ compressionGuidelines().garmentType | titlecase }}
                      </h4>
                      <p-tag
                        [value]="compressionGuidelines().pressureMmHg"
                        severity="info"
                      ></p-tag>
                    </div>

                    <div class="compression-timing">
                      <div class="timing-item">
                        <i class="pi pi-play"></i>
                        <div>
                          <strong>When to Wear</strong>
                          <p>{{ compressionGuidelines().whenToWear }}</p>
                        </div>
                      </div>
                      <div class="timing-item">
                        <i class="pi pi-stop"></i>
                        <div>
                          <strong>When to Remove</strong>
                          <p>{{ compressionGuidelines().whenToRemove }}</p>
                        </div>
                      </div>
                    </div>

                    <div class="compression-cautions">
                      <h4>
                        <i class="pi pi-info-circle"></i> Important Cautions
                      </h4>
                      <ul>
                        @for (
                          caution of compressionGuidelines().cautions;
                          track caution
                        ) {
                          <li>{{ caution }}</li>
                        }
                      </ul>
                    </div>

                    <div class="evidence-note">
                      <i class="pi pi-book"></i>
                      <small>{{ compressionGuidelines().evidenceBase }}</small>
                    </div>
                  </div>
                </p-card>

                <!-- Massage Gun Protocol -->
                <p-card styleClass="massage-gun-card">
                  <ng-template pTemplate="header">
                    <div class="card-header massage-header">
                      <span class="massage-icon">💆</span>
                      <div>
                        <h3>Massage Gun Protocol</h3>
                        <p>Percussion therapy for circulation</p>
                      </div>
                    </div>
                  </ng-template>

                  <p-accordion>
                    @for (
                      protocol of massageGunProtocols;
                      track protocol.timing
                    ) {
                      <p-accordion-panel [value]="protocol.timing">
                        <p-accordion-header>{{
                          getMassageTimingLabel(protocol.timing)
                        }}</p-accordion-header>
                        <p-accordion-content>
                          <div class="massage-protocol">
                            <div class="protocol-summary">
                              <p-tag
                                [value]="protocol.totalDuration + ' min total'"
                                severity="info"
                              ></p-tag>
                              <span class="frequency">{{
                                protocol.frequency
                              }}</span>
                            </div>

                            <div class="muscle-targets">
                              @for (
                                muscle of protocol.targetMuscles;
                                track muscle.muscle
                              ) {
                                <div class="muscle-item">
                                  <div class="muscle-header">
                                    <strong>{{ muscle.muscle }}</strong>
                                    <span class="muscle-duration"
                                      >{{ muscle.duration }}s</span
                                    >
                                  </div>
                                  <p class="muscle-technique">
                                    {{ muscle.technique }}
                                  </p>
                                  <p class="muscle-purpose">
                                    {{ muscle.purpose }}
                                  </p>
                                </div>
                              }
                            </div>

                            <div class="massage-cautions">
                              <h5>⚠️ Cautions</h5>
                              <ul>
                                @for (
                                  caution of protocol.cautions;
                                  track caution
                                ) {
                                  <li>{{ caution }}</li>
                                }
                              </ul>
                            </div>

                            <div class="evidence-note">
                              <i class="pi pi-book"></i>
                              <small>{{ protocol.evidenceBase }}</small>
                            </div>
                          </div>
                        </p-accordion-content>
                      </p-accordion-panel>
                    }
                  </p-accordion>
                </p-card>

                <!-- Seated Exercises -->
                <p-card styleClass="exercises-card">
                  <ng-template pTemplate="header">
                    <div class="card-header exercises-header">
                      <span class="exercises-icon">🏃</span>
                      <div>
                        <h3>Circulation Exercises</h3>
                        <p>Do these every 30 minutes while seated</p>
                      </div>
                    </div>
                  </ng-template>

                  <div class="exercises-grid">
                    @for (exercise of seatedExercises; track exercise.name) {
                      <div class="exercise-card">
                        <div class="exercise-header">
                          <h4>{{ exercise.name }}</h4>
                          <p-tag
                            [value]="exercise.targetArea | titlecase"
                            [severity]="getTargetAreaColor(exercise.targetArea)"
                            [rounded]="true"
                          ></p-tag>
                        </div>
                        <p class="exercise-description">
                          {{ exercise.description }}
                        </p>
                        <div class="exercise-details">
                          <span
                            >{{ exercise.sets }} sets ×
                            {{ exercise.reps }} reps</span
                          >
                          @if (exercise.duration) {
                            <span>Hold {{ exercise.duration }}s</span>
                          }
                        </div>
                        @if (exercise.evidenceBase) {
                          <small class="evidence">{{
                            exercise.evidenceBase
                          }}</small>
                        }
                      </div>
                    }
                  </div>
                </p-card>

                <!-- Rest Stop Protocol -->
                <p-card styleClass="rest-stop-card">
                  <ng-template pTemplate="header">
                    <div class="card-header rest-header">
                      <i class="pi pi-map-marker"></i>
                      <div>
                        <h3>Rest Stop Protocol</h3>
                        <p>Every 2 hours - take 10-15 minutes</p>
                      </div>
                    </div>
                  </ng-template>

                  <div class="rest-stop-content">
                    <div class="rest-timeline">
                      @for (
                        protocol of carTravelProtocols;
                        track protocol.hourMark
                      ) {
                        @if (protocol.phase === "rest-stop") {
                          <div class="rest-stop-item">
                            <div class="stop-marker">
                              <span class="hour"
                                >Hour {{ protocol.hourMark }}</span
                              >
                            </div>
                            <div class="stop-actions">
                              @for (
                                rec of protocol.recommendations.slice(0, 4);
                                track rec.action
                              ) {
                                <div
                                  class="action-item"
                                  [class]="'importance-' + rec.importance"
                                >
                                  <i
                                    class="pi"
                                    [ngClass]="getCategoryIcon(rec.category)"
                                  ></i>
                                  <span>{{ rec.action }}</span>
                                  @if (rec.duration) {
                                    <p-tag
                                      [value]="rec.duration + ' min'"
                                      [rounded]="true"
                                      severity="secondary"
                                    ></p-tag>
                                  }
                                </div>
                              }
                            </div>
                          </div>
                        }
                      }
                    </div>
                  </div>
                </p-card>

                <!-- Research Evidence -->
                <p-card styleClass="research-card">
                  <ng-template pTemplate="header">
                    <div class="card-header research-header">
                      <i class="pi pi-book"></i>
                      <div>
                        <h3>Evidence-Based Research</h3>
                        <p>Scientific backing for these protocols</p>
                      </div>
                    </div>
                  </ng-template>

                  <p-accordion>
                    @for (research of researchSummary; track research.topic) {
                      <p-accordion-panel [value]="research.topic">
                        <p-accordion-header>{{
                          research.topic
                        }}</p-accordion-header>
                        <p-accordion-content>
                          <div class="research-item">
                            <p class="finding">{{ research.finding }}</p>
                            <div class="source">
                              <strong>Source:</strong> {{ research.source }}
                              @if (research.pubmedId) {
                                <a
                                  [href]="
                                    'https://pubmed.ncbi.nlm.nih.gov/' +
                                    research.pubmedId
                                  "
                                  target="_blank"
                                  class="pubmed-link"
                                >
                                  PubMed: {{ research.pubmedId }}
                                </a>
                              }
                            </div>
                            <div class="recommendation">
                              <strong>Recommendation:</strong>
                              {{ research.recommendation }}
                            </div>
                          </div>
                        </p-accordion-content>
                      </p-accordion-panel>
                    }
                  </p-accordion>
                </p-card>

                <!-- Car Travel Checklist -->
                <p-card styleClass="checklist-card">
                  <ng-template pTemplate="header">
                    <div class="card-header">
                      <i class="pi pi-check-square"></i>
                      <h3>Car Travel Checklist</h3>
                    </div>
                  </ng-template>

                  <p-accordion>
                    @for (
                      category of carTravelChecklist;
                      track category.category
                    ) {
                      <p-accordion-panel [value]="category.category">
                        <p-accordion-header>{{
                          category.category
                        }}</p-accordion-header>
                        <p-accordion-content>
                          <div class="checklist-items">
                            @for (item of category.items; track item.id) {
                              <div
                                class="checklist-item"
                                [class.essential]="item.essential"
                              >
                                <p-checkbox
                                  [(ngModel)]="item.packed"
                                  [binary]="true"
                                  [inputId]="item.id"
                                ></p-checkbox>
                                <label
                                  [for]="item.id"
                                  [class.packed]="item.packed"
                                >
                                  {{ item.item }}
                                  @if (item.essential) {
                                    <span class="essential-badge"
                                      >Essential</span
                                    >
                                  }
                                </label>
                                @if (item.notes) {
                                  <span class="item-note">{{
                                    item.notes
                                  }}</span>
                                }
                              </div>
                            }
                          </div>
                        </p-accordion-content>
                      </p-accordion-panel>
                    }
                  </p-accordion>
                </p-card>
              </div>
            }
          </div>
        }
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .travel-recovery-page {
        padding: var(--space-6);
        max-width: 1400px;
        margin: 0 auto;
      }

      /* Planning Section */
      .planning-section {
        display: grid;
        gap: var(--space-6);
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-bottom: 1px solid var(--p-surface-200);
      }

      .card-header i {
        font-size: 1.5rem;
        color: var(--color-brand-primary);
      }

      .card-header h3 {
        margin: 0;
        font-size: var(--font-heading-sm);
        color: var(--text-primary);
      }

      .card-header p {
        margin: 0;
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      /* Olympic Card */
      .olympic-header {
        background: linear-gradient(
          135deg,
          #0085c7 0%,
          #f4c300 25%,
          #000 50%,
          #009f3d 75%,
          #df0024 100%
        );
        color: white;
      }

      .olympic-header h3,
      .olympic-header p {
        color: white;
      }

      .olympic-rings {
        font-size: 2rem;
      }

      .olympic-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .olympic-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-4);
        border: 2px solid var(--p-surface-200);
        border-radius: var(--radius-lg);
        background: var(--surface-primary);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .olympic-btn:hover {
        border-color: var(--color-brand-primary);
        transform: translateY(-2px);
      }

      .olympic-btn.selected {
        border-color: var(--color-brand-primary);
        background: var(--color-brand-light);
      }

      .venue-flag {
        font-size: 2rem;
      }

      .venue-name {
        font-weight: 600;
        color: var(--text-primary);
      }

      .venue-tz {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .olympic-impact {
        display: flex;
        justify-content: center;
        gap: var(--space-6);
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--radius-lg);
        margin: var(--space-4);
      }

      .impact-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .impact-stat .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-brand-primary);
      }

      .impact-stat .stat-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      /* Form Grid */
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .form-field label {
        font-weight: 500;
        color: var(--text-primary);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        padding: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      /* Severity Card */
      .severity-section {
        margin-bottom: var(--space-6);
      }

      .severity-card {
        overflow: hidden;
      }

      .severity-card.severity-none {
        border-left: 4px solid var(--color-status-success);
      }

      .severity-card.severity-mild {
        border-left: 4px solid var(--color-status-info);
      }

      .severity-card.severity-moderate {
        border-left: 4px solid var(--color-status-warning);
      }

      .severity-card.severity-severe {
        border-left: 4px solid var(--color-status-error);
      }

      .severity-content {
        display: flex;
        gap: var(--space-6);
        padding: var(--space-4);
      }

      .severity-gauge {
        flex-shrink: 0;
      }

      .gauge-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: conic-gradient(
          var(--color-brand-primary) calc(var(--score, 0) * 1%),
          var(--p-surface-200) 0
        );
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .gauge-circle::before {
        content: "";
        position: absolute;
        width: 90px;
        height: 90px;
        border-radius: 50%;
        background: var(--surface-primary);
      }

      .gauge-value {
        position: relative;
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .gauge-label {
        position: relative;
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .severity-details {
        flex: 1;
      }

      .severity-details h2 {
        margin: 0 0 var(--space-3) 0;
        font-size: var(--font-heading-md);
        color: var(--text-primary);
      }

      .detail-chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        margin-bottom: var(--space-3);
      }

      .recovery-estimate,
      .competition-countdown {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin-top: var(--space-2);
      }

      .competition-countdown.warning {
        color: var(--color-status-warning);
      }

      .warning-text {
        color: var(--color-status-error);
      }

      .symptoms-section {
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-top: 1px solid var(--p-surface-200);
      }

      .symptoms-section h4 {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .symptoms-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .symptom-chip {
        padding: var(--space-1) var(--space-3);
        background: var(--p-surface-100);
        border-radius: var(--radius-full);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      /* Today's Protocol */
      .today-card {
        margin-bottom: var(--space-6);
      }

      .today-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .day-badge {
        padding: var(--space-2) var(--space-3);
        background: var(--color-brand-primary);
        color: white;
        border-radius: var(--radius-full);
        font-weight: 600;
      }

      .protocol-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .protocol-section {
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--radius-lg);
      }

      .protocol-section h4 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0 0 var(--space-3) 0;
        font-size: var(--font-body-md);
        color: var(--text-primary);
      }

      .protocol-section h4 i {
        color: var(--color-brand-primary);
      }

      /* Sleep Times */
      .sleep-times {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
      }

      .time-block {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .time-label {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .time-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      /* Light Windows */
      .light-windows {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .light-item {
        display: flex;
        gap: var(--space-3);
        padding: var(--space-2);
        border-radius: var(--radius-md);
      }

      .light-item.seek {
        background: rgba(var(--color-status-warning-rgb), 0.1);
      }

      .light-item.avoid {
        background: rgba(var(--color-status-info-rgb), 0.1);
      }

      .light-icon {
        font-size: 1.5rem;
      }

      .light-details {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .light-action {
        font-weight: 500;
        color: var(--text-primary);
      }

      .light-time {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .light-reason {
        font-size: var(--font-body-xs);
        color: var(--text-tertiary);
      }

      /* Training Info */
      .training-info {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      }

      .max-duration {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .activity-lists {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .activity-list {
        padding: var(--space-2);
        border-radius: var(--radius-md);
      }

      .activity-list.recommended {
        background: rgba(var(--color-status-success-rgb), 0.1);
      }

      .activity-list.avoid {
        background: rgba(var(--color-status-error-rgb), 0.1);
      }

      .list-label {
        font-size: var(--font-body-sm);
        font-weight: 500;
      }

      .activity-list ul {
        margin: var(--space-1) 0 0 var(--space-4);
        padding: 0;
        font-size: var(--font-body-sm);
      }

      /* Hydration */
      .hydration-target {
        text-align: center;
      }

      .hydration-value {
        display: block;
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-brand-primary);
      }

      .hydration-note {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      /* Recommendations */
      .recommendations-section {
        padding: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .recommendations-section h4 {
        margin: 0 0 var(--space-3) 0;
      }

      .recommendations-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .recommendation-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-md);
        background: var(--p-surface-50);
      }

      .recommendation-item.importance-critical {
        border-left: 3px solid var(--color-status-error);
      }

      .recommendation-item.importance-high {
        border-left: 3px solid var(--color-status-warning);
      }

      .recommendation-item.importance-medium {
        border-left: 3px solid var(--color-status-info);
      }

      .rec-time {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        min-width: 100px;
      }

      .rec-action {
        flex: 1;
        color: var(--text-primary);
      }

      /* Supplements */
      .supplements-section {
        padding: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }

      .supplements-section h4 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0 0 var(--space-3) 0;
      }

      .supplements-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--space-3);
      }

      .supplement-item {
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--radius-md);
      }

      .supp-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--space-2);
      }

      .supp-name {
        font-weight: 600;
        color: var(--text-primary);
      }

      .supp-dosage {
        font-size: var(--font-body-sm);
        color: var(--color-brand-primary);
      }

      .supp-details {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .supp-caution {
        margin-top: var(--space-2);
        padding: var(--space-2);
        background: rgba(var(--color-status-warning-rgb), 0.1);
        border-radius: var(--radius-sm);
        font-size: var(--font-body-xs);
        color: var(--color-status-warning);
      }

      /* Timeline */
      .timeline-card {
        margin-bottom: var(--space-6);
      }

      .timeline-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        width: 100%;
      }

      .timeline-day {
        font-weight: 600;
        color: var(--text-primary);
        min-width: 120px;
      }

      .timeline-date {
        color: var(--text-secondary);
        flex: 1;
      }

      .timeline-content {
        padding: var(--space-3);
      }

      .timeline-summary {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        margin-bottom: var(--space-3);
      }

      .summary-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .summary-item i {
        color: var(--color-brand-primary);
      }

      .timeline-recommendations {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .mini-rec {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .rec-bullet {
        font-size: 0.5rem;
      }

      .rec-bullet.importance-critical {
        color: var(--color-status-error);
      }

      .rec-bullet.importance-high {
        color: var(--color-status-warning);
      }

      .rec-bullet.importance-medium {
        color: var(--color-status-info);
      }

      /* Checklist */
      .checklist-items {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .checklist-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2);
      }

      .checklist-item.essential {
        background: rgba(var(--color-status-warning-rgb), 0.05);
        border-radius: var(--radius-md);
      }

      .checklist-item label {
        flex: 1;
        cursor: pointer;
      }

      .checklist-item label.packed {
        text-decoration: line-through;
        color: var(--text-tertiary);
      }

      .essential-badge {
        font-size: var(--font-body-xs);
        padding: 2px 6px;
        background: var(--color-status-warning);
        color: white;
        border-radius: var(--radius-sm);
        margin-left: var(--space-2);
      }

      .item-note {
        font-size: var(--font-body-xs);
        color: var(--text-tertiary);
      }

      /* Travel Type Selector */
      .travel-type-selector {
        display: flex;
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .type-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-4);
        border: 2px solid var(--p-surface-200);
        border-radius: var(--radius-lg);
        background: var(--surface-primary);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .type-btn:hover {
        border-color: var(--color-brand-primary);
        transform: translateY(-2px);
      }

      .type-btn.active {
        border-color: var(--color-brand-primary);
        background: var(--color-brand-light);
      }

      .type-btn i {
        font-size: 2rem;
        color: var(--color-brand-primary);
      }

      .type-btn span {
        font-weight: 600;
        color: var(--text-primary);
      }

      .type-btn small {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      /* Car Travel Section */
      .car-travel-section {
        display: grid;
        gap: var(--space-6);
      }

      .car-header {
        background: linear-gradient(
          135deg,
          var(--color-brand-primary) 0%,
          var(--color-brand-secondary) 100%
        );
        color: white;
      }

      .car-header h3,
      .car-header p {
        color: white;
      }

      /* Risk Assessment */
      .risk-preview-card,
      .car-risk-card {
        overflow: hidden;
      }

      .risk-low {
        border-left: 4px solid var(--color-status-success);
      }
      .risk-moderate {
        border-left: 4px solid var(--color-status-warning);
      }
      .risk-high {
        border-left: 4px solid var(--color-status-error);
      }
      .risk-very-high {
        border-left: 4px solid #8b0000;
      }

      .risk-content {
        display: grid;
        grid-template-columns: auto 1fr 1fr;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .risk-gauge {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
      }

      .risk-circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--p-surface-100);
      }

      .risk-circle.risk-low {
        background: rgba(var(--color-status-success-rgb), 0.2);
      }
      .risk-circle.risk-moderate {
        background: rgba(var(--color-status-warning-rgb), 0.2);
      }
      .risk-circle.risk-high {
        background: rgba(var(--color-status-error-rgb), 0.2);
      }
      .risk-circle.risk-very-high {
        background: rgba(139, 0, 0, 0.2);
      }

      .risk-score {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .risk-label {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .risk-factors,
      .risk-recommendations {
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--radius-md);
      }

      .risk-factors h4,
      .risk-recommendations h4 {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--font-body-sm);
        color: var(--text-primary);
      }

      .risk-factors ul,
      .risk-recommendations ul {
        margin: 0;
        padding-left: var(--space-4);
        font-size: var(--font-body-sm);
      }

      .risk-factors li {
        color: var(--color-status-warning);
      }

      .risk-recommendations li {
        color: var(--color-status-success);
      }

      /* Car Risk Card */
      .car-risk-content {
        padding: var(--space-4);
      }

      .risk-header {
        display: flex;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .risk-gauge-small {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--p-surface-100);
      }

      .risk-info h2 {
        margin: 0 0 var(--space-2) 0;
      }

      .warning-symptoms {
        padding: var(--space-4);
        background: rgba(var(--color-status-error-rgb), 0.1);
        border-radius: var(--radius-lg);
        border: 1px solid var(--color-status-error);
      }

      .warning-symptoms h4 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0 0 var(--space-3) 0;
        color: var(--color-status-error);
      }

      .symptoms-grid {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .warning-symptom {
        padding: var(--space-1) var(--space-3);
        background: white;
        border: 1px solid var(--color-status-error);
        border-radius: var(--radius-full);
        font-size: var(--font-body-sm);
        color: var(--color-status-error);
      }

      /* Compression Card */
      .compression-header {
        background: linear-gradient(135deg, #4a90d9 0%, #67b26f 100%);
        color: white;
      }

      .compression-header h3,
      .compression-header p {
        color: white;
      }

      .compression-icon,
      .massage-icon,
      .exercises-icon {
        font-size: 2rem;
      }

      .compression-content {
        padding: var(--space-4);
      }

      .compression-type {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .compression-type h4 {
        margin: 0;
      }

      .compression-timing {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .timing-item {
        display: flex;
        gap: var(--space-3);
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--radius-md);
      }

      .timing-item i {
        font-size: 1.5rem;
        color: var(--color-brand-primary);
      }

      .timing-item strong {
        display: block;
        margin-bottom: var(--space-1);
      }

      .timing-item p {
        margin: 0;
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .compression-cautions {
        padding: var(--space-3);
        background: rgba(var(--color-status-warning-rgb), 0.1);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-3);
      }

      .compression-cautions h4 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0 0 var(--space-2) 0;
        font-size: var(--font-body-sm);
      }

      .compression-cautions ul {
        margin: 0;
        padding-left: var(--space-4);
        font-size: var(--font-body-sm);
      }

      .evidence-note {
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
        padding: var(--space-2);
        background: var(--p-surface-50);
        border-radius: var(--radius-sm);
        font-style: italic;
      }

      .evidence-note i {
        color: var(--color-brand-primary);
      }

      /* Massage Gun Card */
      .massage-header {
        background: linear-gradient(135deg, #e94057 0%, #f27121 100%);
        color: white;
      }

      .massage-header h3,
      .massage-header p {
        color: white;
      }

      .massage-protocol {
        padding: var(--space-3);
      }

      .protocol-summary {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .frequency {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .muscle-targets {
        display: grid;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .muscle-item {
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--radius-md);
      }

      .muscle-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--space-1);
      }

      .muscle-duration {
        padding: 2px 8px;
        background: var(--color-brand-primary);
        color: white;
        border-radius: var(--radius-full);
        font-size: var(--font-body-xs);
      }

      .muscle-technique {
        margin: 0 0 var(--space-1) 0;
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .muscle-purpose {
        margin: 0;
        font-size: var(--font-body-xs);
        color: var(--text-tertiary);
        font-style: italic;
      }

      .massage-cautions {
        padding: var(--space-3);
        background: rgba(var(--color-status-error-rgb), 0.1);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-3);
      }

      .massage-cautions h5 {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--font-body-sm);
      }

      .massage-cautions ul {
        margin: 0;
        padding-left: var(--space-4);
        font-size: var(--font-body-sm);
      }

      /* Exercises Card */
      .exercises-header {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
      }

      .exercises-header h3,
      .exercises-header p {
        color: white;
      }

      .exercises-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .exercise-card {
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--radius-lg);
        border-left: 3px solid var(--color-brand-primary);
      }

      .exercise-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-2);
      }

      .exercise-header h4 {
        margin: 0;
        font-size: var(--font-body-md);
      }

      .exercise-description {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .exercise-details {
        display: flex;
        gap: var(--space-3);
        font-size: var(--font-body-sm);
        font-weight: 500;
        color: var(--color-brand-primary);
      }

      .exercise-card .evidence {
        display: block;
        margin-top: var(--space-2);
        font-size: var(--font-body-xs);
        color: var(--text-tertiary);
        font-style: italic;
      }

      /* Rest Stop Card */
      .rest-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .rest-header h3,
      .rest-header p {
        color: white;
      }

      .rest-stop-content {
        padding: var(--space-4);
      }

      .rest-timeline {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .rest-stop-item {
        display: flex;
        gap: var(--space-4);
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--radius-lg);
      }

      .stop-marker {
        flex-shrink: 0;
        width: 80px;
        text-align: center;
      }

      .stop-marker .hour {
        display: block;
        padding: var(--space-2) var(--space-3);
        background: var(--color-brand-primary);
        color: white;
        border-radius: var(--radius-md);
        font-weight: 600;
      }

      .stop-actions {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .action-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2);
        border-radius: var(--radius-sm);
      }

      .action-item.importance-critical {
        background: rgba(var(--color-status-error-rgb), 0.1);
      }

      .action-item.importance-high {
        background: rgba(var(--color-status-warning-rgb), 0.1);
      }

      .action-item i {
        color: var(--color-brand-primary);
      }

      /* Research Card */
      .research-header {
        background: linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%);
        color: white;
      }

      .research-header h3,
      .research-header p {
        color: white;
      }

      .research-item {
        padding: var(--space-3);
      }

      .research-item .finding {
        margin: 0 0 var(--space-3) 0;
        line-height: 1.6;
      }

      .research-item .source {
        margin-bottom: var(--space-2);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .pubmed-link {
        display: inline-block;
        margin-left: var(--space-2);
        color: var(--color-brand-primary);
        text-decoration: none;
      }

      .pubmed-link:hover {
        text-decoration: underline;
      }

      .research-item .recommendation {
        padding: var(--space-3);
        background: var(--color-brand-light);
        border-radius: var(--radius-md);
        font-size: var(--font-body-sm);
      }

      /* ================================================================
       RESPONSIVE BREAKPOINTS - Full Coverage
       ================================================================ */

      /* Extra Large Screens (> 1400px) */
      @media (min-width: 1400px) {
        .protocol-grid {
          grid-template-columns: repeat(4, 1fr);
        }

        .form-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .exercises-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      /* Large Screens (1200px - 1399px) */
      @media (min-width: 1200px) and (max-width: 1399px) {
        .protocol-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .exercises-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      /* Medium-Large Screens (1024px - 1199px) */
      @media (min-width: 1024px) and (max-width: 1199px) {
        .protocol-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .exercises-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      /* Tablet Landscape (769px - 1023px) */
      @media (min-width: 769px) and (max-width: 1023px) {
        .protocol-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .form-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .exercises-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .olympic-impact {
          flex-wrap: wrap;
          justify-content: center;
        }
      }

      /* Tablet Portrait (768px) */
      @media (max-width: 768px) {
        .travel-recovery-page {
          padding: var(--space-4);
        }

        .severity-content {
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .protocol-grid {
          grid-template-columns: 1fr;
          gap: var(--space-3);
        }

        .olympic-buttons {
          grid-template-columns: 1fr;
        }

        .travel-type-selector {
          flex-direction: column;
        }

        .risk-content {
          grid-template-columns: 1fr;
        }

        .compression-timing {
          grid-template-columns: 1fr;
        }

        .exercises-grid {
          grid-template-columns: 1fr;
        }

        .rest-stop-item {
          flex-direction: column;
        }

        .stop-marker {
          width: 100%;
        }

        .form-grid {
          grid-template-columns: 1fr;
        }

        .olympic-impact {
          flex-direction: column;
          gap: var(--space-3);
        }

        .today-header {
          flex-direction: column;
          gap: var(--space-3);
          text-align: center;
        }

        .header-left {
          flex-direction: column;
        }
      }

      /* Mobile Large (481px - 767px) */
      @media (min-width: 481px) and (max-width: 767px) {
        .olympic-buttons {
          grid-template-columns: repeat(2, 1fr);
        }

        .compression-timing {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      /* Mobile Small (< 480px) */
      @media (max-width: 480px) {
        .travel-recovery-page {
          padding: var(--space-3);
        }

        .card-header {
          padding: var(--space-3);
        }

        .card-header h3 {
          font-size: var(--font-body-lg);
        }

        .gauge-circle {
          width: 100px;
          height: 100px;
        }

        .gauge-circle::before {
          width: 75px;
          height: 75px;
        }

        .gauge-value {
          font-size: 1.5rem;
        }

        .protocol-section {
          padding: var(--space-3);
        }

        .protocol-section h4 {
          font-size: var(--font-body-sm);
        }

        .sleep-times {
          flex-direction: column;
          gap: var(--space-2);
        }

        .detail-chips {
          justify-content: center;
        }

        .symptom-chip {
          font-size: var(--font-body-xs);
        }

        .impact-stat .stat-value {
          font-size: 1.25rem;
        }
      }

      /* Extra Small Screens (< 375px) */
      @media (max-width: 374px) {
        .travel-recovery-page {
          padding: var(--space-2);
        }

        .olympic-btn {
          padding: var(--space-3);
        }

        .venue-flag {
          font-size: 1.5rem;
        }

        .day-badge {
          padding: var(--space-1) var(--space-2);
          font-size: var(--font-body-sm);
        }
      }

      /* Landscape Mode on Mobile */
      @media (max-height: 500px) and (orientation: landscape) {
        .travel-recovery-page {
          padding: var(--space-3);
        }

        .protocol-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .gauge-circle {
          width: 80px;
          height: 80px;
        }

        .gauge-circle::before {
          width: 60px;
          height: 60px;
        }
      }

      /* Touch Device Optimizations */
      @media (hover: none) and (pointer: coarse) {
        .olympic-btn:hover {
          transform: none;
        }

        .olympic-btn:active {
          transform: scale(0.98);
        }

        .checklist-item,
        .exercise-card,
        .protocol-section {
          min-height: 44px;
        }
      }

      /* Print Styles */
      @media print {
        .travel-type-selector,
        .form-actions,
        .olympic-buttons {
          display: none !important;
        }

        .travel-recovery-page {
          padding: 0;
          max-width: 100%;
        }

        .protocol-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class TravelRecoveryComponent implements OnInit {
  private travelService = inject(TravelRecoveryService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  // Service signals
  readonly currentPlan = this.travelService.currentPlan;
  readonly recoveryProtocol = this.travelService.recoveryProtocol;
  readonly jetLagSeverity = this.travelService.jetLagSeverity;
  readonly hasActivePlan = this.travelService.hasActivePlan;
  readonly daysUntilCompetition = this.travelService.daysUntilCompetition;
  readonly isCompetitionReady = this.travelService.isCompetitionReady;

  // Local state
  timezones: TimezoneOption[] = [];
  selectedOlympicVenue: "LA28" | "BRISBANE32" | null = null;
  olympicImpact = signal<{
    timezonesDifference: number;
    direction: string;
    estimatedRecoveryDays: number;
  } | null>(null);
  travelChecklist: TravelChecklist[] = [];
  minDate = new Date();

  // Travel type selection
  travelType = signal<"flight" | "car">("flight");

  // Car travel state
  activeCarPlan = signal<{
    tripName: string;
    duration: number;
    isDriver: boolean;
    competitionDate?: Date;
  } | null>(null);
  carTravelProtocols: CarTravelProtocol[] = [];
  seatedExercises: CirculationExercise[] = [];
  massageGunProtocols: MassageGunProtocol[] = [];
  carTravelChecklist: TravelChecklist[] = [];
  researchSummary: Array<{
    topic: string;
    finding: string;
    source: string;
    pubmedId?: string;
    recommendation: string;
  }> = [];

  // Car trip form
  carTripForm = {
    tripName: "",
    duration: 6,
    isDriver: false,
    competitionDate: null as Date | null,
  };

  // Form state
  tripForm = {
    tripName: "",
    departureTimezone: "",
    arrivalTimezone: "",
    departureDate: null as Date | null,
    arrivalDate: null as Date | null,
    competitionDate: null as Date | null,
    flightDuration: 10,
    layovers: 0,
  };

  // Math for template
  Math = Math;

  ngOnInit(): void {
    this.timezones = this.travelService.getAvailableTimezones();
    this.travelChecklist = this.travelService.getTravelChecklist();

    // Initialize car travel data
    this.seatedExercises = this.travelService.getSeatedExercises();
    this.massageGunProtocols = this.travelService.getMassageGunProtocol();
    this.carTravelChecklist = this.travelService.getCarTravelChecklist();
    this.researchSummary = this.travelService.getCarTravelResearchSummary();
  }

  // Travel type management
  setTravelType(type: "flight" | "car"): void {
    this.travelType.set(type);
  }

  hasActiveCarPlan(): boolean {
    return this.activeCarPlan() !== null;
  }

  // Car travel risk calculation (reactive)
  carTravelRisk(): BloodCirculationRisk {
    const duration =
      this.activeCarPlan()?.duration || this.carTripForm.duration;
    const isDriver =
      this.activeCarPlan()?.isDriver ?? this.carTripForm.isDriver;
    return this.travelService.calculateCarTravelRisk(duration, isDriver);
  }

  // Compression guidelines (reactive)
  compressionGuidelines() {
    return this.travelService.getCompressionGuidelines("during-travel");
  }

  canCreateCarPlan(): boolean {
    return (
      this.carTripForm.tripName.length > 0 && this.carTripForm.duration >= 2
    );
  }

  createCarPlan(): void {
    if (!this.canCreateCarPlan()) {
      this.toastService.warn("Please fill in trip name and duration");
      return;
    }

    this.activeCarPlan.set({
      tripName: this.carTripForm.tripName,
      duration: this.carTripForm.duration,
      isDriver: this.carTripForm.isDriver,
      competitionDate: this.carTripForm.competitionDate || undefined,
    });

    // Generate protocols
    this.carTravelProtocols = this.travelService.generateCarTravelProtocol(
      this.carTripForm.duration,
      this.carTripForm.isDriver,
    );

    this.toastService.success("Car travel protocol generated!");
  }

  getRiskColor(
    level: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (level) {
      case "low":
        return "success";
      case "moderate":
        return "warn";
      case "high":
        return "danger";
      case "very-high":
        return "danger";
      default:
        return "secondary";
    }
  }

  getTargetAreaColor(
    area: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (area) {
      case "calves":
        return "info";
      case "thighs":
        return "success";
      case "glutes":
        return "warn";
      case "lower-back":
        return "danger";
      case "full-body":
        return "success";
      default:
        return "secondary";
    }
  }

  getMassageTimingLabel(timing: string): string {
    switch (timing) {
      case "pre-travel":
        return "🚗 Before Departure";
      case "rest-stop":
        return "⛽ At Rest Stops";
      case "post-arrival":
        return "🏁 After Arrival";
      default:
        return timing;
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case "circulation":
        return "pi-heart";
      case "compression":
        return "pi-shield";
      case "hydration":
        return "pi-tint";
      case "nutrition":
        return "pi-apple";
      case "rest":
        return "pi-clock";
      case "driver-safety":
        return "pi-car";
      default:
        return "pi-check";
    }
  }

  selectOlympicVenue(venue: "LA28" | "BRISBANE32"): void {
    this.selectedOlympicVenue = venue;

    // Auto-fill destination timezone
    const venueInfo = this.travelService.getOlympicVenueInfo(venue);
    this.tripForm.arrivalTimezone = venueInfo.timezone;
    this.tripForm.tripName =
      venue === "LA28" ? "Los Angeles 2028 Olympics" : "Brisbane 2032 Olympics";

    // Calculate impact if home timezone is set
    if (this.tripForm.departureTimezone) {
      const impact = this.travelService.calculateOlympicTravelImpact(
        this.tripForm.departureTimezone,
        venue,
      );
      this.olympicImpact.set(impact);
    }
  }

  canCreatePlan(): boolean {
    return !!(
      this.tripForm.tripName &&
      this.tripForm.departureTimezone &&
      this.tripForm.arrivalTimezone &&
      this.tripForm.departureDate &&
      this.tripForm.arrivalDate
    );
  }

  createPlan(): void {
    if (!this.canCreatePlan()) {
      this.toastService.warn("Please fill in all required fields");
      return;
    }

    this.travelService.createTravelPlan({
      tripName: this.tripForm.tripName,
      departureDate: this.tripForm.departureDate!,
      arrivalDate: this.tripForm.arrivalDate!,
      competitionDate: this.tripForm.competitionDate || undefined,
      departureTimezone: this.tripForm.departureTimezone,
      arrivalTimezone: this.tripForm.arrivalTimezone,
      flightDuration: this.tripForm.flightDuration,
      layovers: this.tripForm.layovers,
    });

    this.toastService.success("Recovery protocol generated!");
  }

  startNewPlan(): void {
    // Clear flight plan
    this.travelService.clearPlan();
    this.selectedOlympicVenue = null;
    this.olympicImpact.set(null);
    this.tripForm = {
      tripName: "",
      departureTimezone: "",
      arrivalTimezone: "",
      departureDate: null,
      arrivalDate: null,
      competitionDate: null,
      flightDuration: 10,
      layovers: 0,
    };

    // Clear car plan
    this.activeCarPlan.set(null);
    this.carTravelProtocols = [];
    this.carTripForm = {
      tripName: "",
      duration: 6,
      isDriver: false,
      competitionDate: null,
    };
  }

  todayProtocol(): RecoveryProtocol | null {
    return this.travelService.getCurrentProtocolDay();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    const checkDate = new Date(date);
    return (
      today.getFullYear() === checkDate.getFullYear() &&
      today.getMonth() === checkDate.getMonth() &&
      today.getDate() === checkDate.getDate()
    );
  }

  getSeverityColor(
    level: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (level) {
      case "none":
        return "success";
      case "mild":
        return "info";
      case "moderate":
        return "warn";
      case "severe":
        return "danger";
      default:
        return "secondary";
    }
  }

  getPhaseColor(
    phase: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (phase) {
      case "pre-travel":
        return "info";
      case "in-flight":
        return "warn";
      case "post-arrival":
        return "danger";
      case "competition-ready":
        return "success";
      default:
        return "secondary";
    }
  }

  getIntensityColor(
    intensity: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (intensity) {
      case "full":
        return "success";
      case "moderate":
        return "info";
      case "light":
        return "warn";
      case "none":
        return "danger";
      default:
        return "secondary";
    }
  }

  getImportanceColor(
    importance: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (importance) {
      case "critical":
        return "danger";
      case "high":
        return "warn";
      case "medium":
        return "info";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  }
}

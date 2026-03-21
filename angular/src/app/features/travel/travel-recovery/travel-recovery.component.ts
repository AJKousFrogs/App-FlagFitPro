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

import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { UI_LIMITS } from "@core/constants";

// PrimeNG Components
import { Badge } from "primeng/badge";
import { Chip } from "primeng/chip";
import { DatePicker } from "primeng/datepicker";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

// Services
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { AuthService } from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import {
  BloodCirculationRisk,
  CarTravelProtocol,
  CirculationExercise,
  MassageGunProtocol,
  RecoveryProtocol,
  TravelChecklist,
  TravelRecoveryService,
} from "../../../core/services/travel-recovery.service";

// Layout & Components
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { InputNumberComponent } from "../../../shared/components/input-number/input-number.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { AccordionComponent, AppAccordionPanelDirective } from "../../../shared/components/accordion/accordion.component";
import { CheckboxComponent } from "../../../shared/components/checkbox/checkbox.component";
import { TravelFlightSeveritySectionComponent } from "./components/travel-flight-severity-section.component";
import { TravelFlightTodayProtocolSectionComponent } from "./components/travel-flight-today-protocol-section.component";

interface TimezoneOption {
  value: string;
  label: string;
  offset: number;
}

interface CarTripForm {
  tripName: string;
  duration: number;
  isDriver: boolean;
  competitionDate: Date | null;
}

interface FlightTripForm {
  tripName: string;
  departureTimezone: string;
  arrivalTimezone: string;
  departureDate: Date | null;
  arrivalDate: Date | null;
  competitionDate: Date | null;
  flightDuration: number;
  layovers: number;
}

@Component({
  selector: "app-travel-recovery",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    Chip,
    DatePicker,
    FormInputComponent,
    InputNumberComponent,
    SelectComponent,
    AccordionComponent,
    AppAccordionPanelDirective,
    CheckboxComponent,
    Badge,
    ButtonComponent,
    CardShellComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    StatusTagComponent,
    TravelFlightSeveritySectionComponent,
    TravelFlightTodayProtocolSectionComponent,
  ],
  templateUrl: "./travel-recovery.component.html",

  styleUrl: "./travel-recovery.component.scss",
})
export class TravelRecoveryComponent implements OnInit {
  private travelService = inject(TravelRecoveryService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);

  // Constants exposed to template
  protected readonly UI_LIMITS = UI_LIMITS;

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
  carTripForm: CarTripForm = {
    tripName: "",
    duration: 6,
    isDriver: false,
    competitionDate: null as Date | null,
  };

  // Form state
  tripForm: FlightTripForm = {
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
    this.logger.debug("[TravelRecovery] Component initialized");
    this.timezones = this.travelService.getAvailableTimezones();
    this.travelChecklist = this.travelService.getTravelChecklist();

    // Initialize car travel data
    this.seatedExercises = this.travelService.getSeatedExercises();
    this.massageGunProtocols = this.travelService.getMassageGunProtocol();
    this.carTravelChecklist = this.travelService.getCarTravelChecklist();
    this.researchSummary = this.travelService.getCarTravelResearchSummary();

    this.logger.debug("[TravelRecovery] State", {
      hasActivePlan: this.hasActivePlan(),
      currentPlan: this.currentPlan(),
    });
  }

  // Travel type management
  setTravelType(type: "flight" | "car"): void {
    this.travelType.set(type);
  }

  updateTripFormText(field: "tripName", value: string | null | undefined): void {
    this.tripForm = { ...this.tripForm, [field]: value ?? "" };
  }

  updateTripFormTimezone(
    field: "departureTimezone" | "arrivalTimezone",
    value: string | null | undefined,
  ): void {
    this.tripForm = { ...this.tripForm, [field]: value ?? "" };

    if (this.selectedOlympicVenue && this.tripForm.departureTimezone) {
      this.olympicImpact.set(
        this.travelService.calculateOlympicTravelImpact(
          this.tripForm.departureTimezone,
          this.selectedOlympicVenue,
        ),
      );
    }
  }

  updateTripFormDate(
    field: "departureDate" | "arrivalDate" | "competitionDate",
    value: Date | null | undefined,
  ): void {
    this.tripForm = { ...this.tripForm, [field]: value ?? null };
  }

  updateTripFormNumber(
    field: "flightDuration" | "layovers",
    value: number | null | undefined,
  ): void {
    const fallback = field === "flightDuration" ? 1 : 0;
    this.tripForm = { ...this.tripForm, [field]: value ?? fallback };
  }

  updateTravelChecklistPacked(
    categoryName: string,
    itemId: string,
    packed: boolean | null | undefined,
  ): void {
    this.travelChecklist = this.travelChecklist.map((category) =>
      category.category !== categoryName
        ? category
        : {
            ...category,
            items: category.items.map((item) =>
              item.id === itemId ? { ...item, packed: packed ?? false } : item,
            ),
          },
    );
  }

  updateCarTripText(field: "tripName", value: string | null | undefined): void {
    this.carTripForm = { ...this.carTripForm, [field]: value ?? "" };
  }

  updateCarTripDuration(value: number | null | undefined): void {
    this.carTripForm = { ...this.carTripForm, duration: value ?? 1 };
  }

  updateCarTripDriver(value: boolean | null | undefined): void {
    this.carTripForm = { ...this.carTripForm, isDriver: value ?? false };
  }

  updateCarTripDate(value: Date | null | undefined): void {
    this.carTripForm = { ...this.carTripForm, competitionDate: value ?? null };
  }

  updateCarChecklistPacked(
    categoryName: string,
    itemId: string,
    packed: boolean | null | undefined,
  ): void {
    this.carTravelChecklist = this.carTravelChecklist.map((category) =>
      category.category !== categoryName
        ? category
        : {
            ...category,
            items: category.items.map((item) =>
              item.id === itemId ? { ...item, packed: packed ?? false } : item,
            ),
          },
    );
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | null)
      ?.value ?? "";
  }

  isChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
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
      this.toastService.warn(TOAST.WARN.MISSING_TRIP_DETAILS);
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

    this.toastService.success(TOAST.SUCCESS.TRAVEL_PROTOCOL_GENERATED);
  }

  getRiskColor(
    level: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    switch (level) {
      case "low":
        return "success";
      case "moderate":
        return "warning";
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
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    switch (area) {
      case "calves":
        return "info";
      case "thighs":
        return "success";
      case "glutes":
        return "warning";
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

  async createPlan(): Promise<void> {
    this.logger.debug("[TravelRecovery] createPlan() called", {
      formData: this.tripForm,
      canCreate: this.canCreatePlan(),
    });

    if (!this.canCreatePlan()) {
      this.logger.warn(
        "[TravelRecovery] Cannot create plan - validation failed",
      );
      this.toastService.warn(TOAST.WARN.REQUIRED_FIELDS);
      return;
    }

    const departureDate = this.tripForm.departureDate;
    const arrivalDate = this.tripForm.arrivalDate;

    if (!departureDate || !arrivalDate) {
      this.logger.warn("[TravelRecovery] Missing dates", {
        departureDate,
        arrivalDate,
      });
      this.toastService.warn(TOAST.WARN.REQUIRED_FIELDS);
      return;
    }

    try {
      this.logger.debug("[TravelRecovery] Creating travel plan...");
      const plan = await this.travelService.createTravelPlan({
        tripName: this.tripForm.tripName,
        departureDate: departureDate,
        arrivalDate: arrivalDate,
        competitionDate: this.tripForm.competitionDate || undefined,
        departureTimezone: this.tripForm.departureTimezone,
        arrivalTimezone: this.tripForm.arrivalTimezone,
        flightDuration: this.tripForm.flightDuration,
        layovers: this.tripForm.layovers,
      });

      this.logger.debug("[TravelRecovery] Plan created successfully", {
        plan,
        hasActivePlan: this.hasActivePlan(),
        currentPlan: this.currentPlan(),
        recoveryProtocol: this.recoveryProtocol(),
      });

      this.toastService.success(TOAST.SUCCESS.RECOVERY_PROTOCOL_GENERATED);
    } catch (error) {
      this.logger.error("[TravelRecovery] Error creating plan", { error });
      this.toastService.error(
        "Failed to generate recovery protocol. Please try again.",
      );
    }
  }

  async startNewPlan(): Promise<void> {
    // Clear flight plan
    await this.travelService.clearPlan();
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
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    switch (level) {
      case "none":
        return "success";
      case "mild":
        return "info";
      case "moderate":
        return "warning";
      case "severe":
        return "danger";
      default:
        return "secondary";
    }
  }

  getPhaseColor(
    phase: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    switch (phase) {
      case "pre-travel":
        return "info";
      case "in-flight":
        return "warning";
      case "post-arrival":
        return "danger";
      case "competition-ready":
        return "success";
      default:
        return "secondary";
    }
  }
}

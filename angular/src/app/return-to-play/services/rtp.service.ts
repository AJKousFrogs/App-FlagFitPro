import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { extractApiPayload } from '../../core/utils/api-response-mapper';

export interface RtpPhaseProgress {
  id: string;
  user_id: string;
  injury_id: string;
  week_ending: string;
  current_rtp_phase: number;
  strength_lsi_pct: number | null;
  hop_test_battery_pct: number | null;
  acl_rsi_pct: number | null;
  tsk11_normalized: boolean;
  biomechanics_symmetrical: boolean;
  athlete_confidence_1_10: number | null;
  coach_confidence_1_10: number | null;
  pain_level_0_10: number | null;
  acwr_target_min: number | null;
  acwr_target_max: number | null;
  acwr_compliance_pct: number | null;
  ready_for_next_phase: boolean;
  coach_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PsychologicalAssessment {
  id: string;
  user_id: string;
  assessment_date: string;
  injury_id: string | null;
  acl_rsi_score: number | null;
  tsk11_score: number | null;
  confidence_1_10: number | null;
  coping_strategies: string | null;
  created_at: string;
  updated_at: string;
}

export interface PsychologicalReadinessStatus {
  aclRsiReady: boolean | null;
  tsk11Ready: boolean | null;
  overallReady: boolean;
}

export interface RtpProgressResponse {
  success: boolean;
  data: RtpPhaseProgress[];
  count: number;
  message?: string;
}

export interface PsychologicalAssessmentResponse {
  success: boolean;
  data: PsychologicalAssessment[];
  latestStatus: PsychologicalReadinessStatus;
  count: number;
}

export interface RecoveryRecommendation {
  modality_name: string;
  evidence_grade: string;
  trigger_reason: string;
  dosage: string;
  priority: string;
}

export interface RecoveryRecommendationResponse {
  success: boolean;
  date: string;
  acwrStatus: string;
  recommendations: RecoveryRecommendation[];
  totalCount: number;
  triggers: {
    acwrBased: number;
    markerBased: number;
    injuryPhaseBased: number;
    biomarkerBased: number;
  };
}

export interface ProtocolAssignment {
  id: string;
  athlete_id: string;
  injury_id: string;
  protocol_id: string;
  current_phase: number;
  phase_start_date: string;
  estimated_return_date: string | null;
  individual_modifiers: Record<string, unknown> | null;
  biological_maturity_gate_passed: boolean;
  created_at: string;
  updated_at: string;
  criteria: {
    id: string;
    criteria_name: string;
    criteria_type: string;
    target_value: string;
    measurement_method: string;
    pass_threshold: string;
    phase_required: number;
    latestAssessment?: {
      criteria_id: string;
      assessed_value: string;
      pass_fail: boolean;
      assessed_date: string;
    } | null;
  }[];
}

export interface ProtocolAssignmentResponse {
  success: boolean;
  assignment: ProtocolAssignment | null;
  message?: string;
}

export interface AssessmentResponse {
  success: boolean;
  assessment: Record<string, unknown>;
  phaseAdvancementEligible?: boolean;
  nextPhase?: number | null;
}

export interface AdvancePhaseResponse {
  success: boolean;
  assignment: ProtocolAssignment;
  nextPhaseDetails: Record<string, unknown> | null;
  message?: string;
}

/**
 * RTP (Return-to-Play) Service
 * Fetches RTP progress, psychological assessments, and recovery recommendations
 * from Phase 2b-2c endpoints.
 */
@Injectable({ providedIn: 'root' })
export class RtpService {
  private readonly api = inject(ApiService);

  /**
   * Fetch RTP phase progress history for an athlete's injury
   * GET /api/rtp/phase-progress?athleteId=X&injuryId=Y
   */
  getRtpProgress(athleteId: string, injuryId: string): Observable<RtpProgressResponse> {
    return this.api.get<RtpProgressResponse>(`/api/rtp/phase-progress`, {
      athleteId,
      injuryId,
    }).pipe(
      map(response => extractApiPayload<RtpProgressResponse>(response) ?? {
        success: false,
        data: [],
        count: 0,
      })
    );
  }

  /**
   * Update RTP phase progress for a week
   * POST /api/rtp/phase-progress
   */
  updateRtpProgress(payload: Partial<RtpPhaseProgress>): Observable<RtpProgressResponse> {
    return this.api.post<RtpProgressResponse>(`/api/rtp/phase-progress`, payload).pipe(
      map(response => extractApiPayload<RtpProgressResponse>(response) ?? {
        success: false,
        data: [],
        count: 0,
      })
    );
  }

  /**
   * Fetch psychological assessment history
   * GET /api/rtp/psychological-assessment?athleteId=X&limit=10
   */
  getPsychologicalAssessments(
    athleteId: string,
    limit = 10
  ): Observable<PsychologicalAssessmentResponse> {
    return this.api.get<PsychologicalAssessmentResponse>(`/api/rtp/psychological-assessment`, {
      athleteId,
      limit: limit.toString(),
    }).pipe(
      map(response => extractApiPayload<PsychologicalAssessmentResponse>(response) ?? {
        success: false,
        data: [],
        latestStatus: { aclRsiReady: null, tsk11Ready: null, overallReady: false },
        count: 0,
      })
    );
  }

  /**
   * Log a psychological assessment (ACL-RSI, TSK-11, confidence)
   * POST /api/rtp/psychological-assessment
   */
  logPsychologicalAssessment(
    payload: Partial<PsychologicalAssessment>
  ): Observable<{ success: boolean; readinessStatus: PsychologicalReadinessStatus }> {
    return this.api.post<{ success: boolean; readinessStatus: PsychologicalReadinessStatus }>(`/api/rtp/psychological-assessment`, payload).pipe(
      map(response => extractApiPayload<{ success: boolean; readinessStatus: PsychologicalReadinessStatus }>(response) ?? {
        success: false,
        readinessStatus: { aclRsiReady: null, tsk11Ready: null, overallReady: false },
      })
    );
  }

  /**
   * Fetch recovery recommendations for an athlete on a specific date
   * GET /api/recovery-recommendations?athleteId=X&date=YYYY-MM-DD
   */
  getRecoveryRecommendations(
    athleteId: string,
    date?: string
  ): Observable<RecoveryRecommendationResponse> {
    const params: Record<string, string> = { athleteId };
    if (date) params.date = date;
    return this.api.get<RecoveryRecommendationResponse>(`/api/recovery-recommendations`, params).pipe(
      map(response => extractApiPayload<RecoveryRecommendationResponse>(response) ?? {
        success: false,
        date: new Date().toISOString().slice(0, 10),
        acwrStatus: 'safe',
        recommendations: [],
        totalCount: 0,
        triggers: { acwrBased: 0, markerBased: 0, injuryPhaseBased: 0, biomarkerBased: 0 },
      })
    );
  }

  /**
   * Fetch protocol assignment for an athlete's injury (Phase 1D)
   * GET /api/rtp/protocols/:athleteId/:injuryId
   */
  getProtocolAssignment(
    athleteId: string,
    injuryId: string
  ): Observable<ProtocolAssignmentResponse> {
    return this.api.get<ProtocolAssignmentResponse>(`/api/rtp/protocols/${athleteId}/${injuryId}`).pipe(
      map(response => extractApiPayload<ProtocolAssignmentResponse>(response) ?? response)
    );
  }

  /**
   * Record functional criterion assessment (Phase 1D)
   * POST /api/rtp/assessments
   */
  recordAssessment(payload: Record<string, unknown>): Observable<AssessmentResponse> {
    return this.api.post<AssessmentResponse>(`/api/rtp/assessments`, payload).pipe(
      map(response => extractApiPayload<AssessmentResponse>(response) ?? response)
    );
  }

  /**
   * Advance athlete to next RTP phase (Phase 1D)
   * PATCH /api/rtp/athletes/:athleteId/:injuryId/phase
   */
  advancePhase(
    athleteId: string,
    injuryId: string
  ): Observable<AdvancePhaseResponse> {
    return this.api.patch<AdvancePhaseResponse>(`/api/rtp/athletes/${athleteId}/${injuryId}/phase`, {}).pipe(
      map(response => extractApiPayload<AdvancePhaseResponse>(response) ?? response)
    );
  }
}

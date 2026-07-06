/**
 * getPrescriptionTemplate — priority lookup for prescription_templates.
 *
 * Priority order (highest wins):
 *   1. position_group + periodization_phase + intensity_zone
 *   2. position_group + periodization_phase (any intensity)
 *   3. position_group (any phase / intensity)
 *   4. periodization_phase + intensity_zone (any position)
 *   5. intensity_zone only
 *   6. modality only (null position, null phase, null intensity)
 *
 * Returns the matching row or null if not found.
 */
export async function getPrescriptionTemplate(
  supabase,
  {
    modality,
    intensityZone = null,
    positionGroup = null,
    periodizationPhase = null,
  } = {},
) {
  if (!modality) {
    return null;
  }

  const { data: rows } = await supabase
    .from("prescription_templates")
    .select(
      "id, modality, intensity_zone, position_group, periodization_phase, " +
        "prescribed_sets, prescribed_reps, prescribed_hold_seconds, " +
        "prescribed_distance_m, prescribed_duration_s, rest_seconds, " +
        "load_contribution_au, methodology_citation",
    )
    .eq("modality", modality)
    .eq("is_active", true);

  if (!rows || rows.length === 0) {
    return null;
  }

  // Score each candidate: higher score = higher specificity
  const score = (row) => {
    let s = 0;
    if (positionGroup && row.position_group === positionGroup) {
      s += 4;
    }
    if (periodizationPhase && row.periodization_phase === periodizationPhase) {
      s += 2;
    }
    if (intensityZone && row.intensity_zone === intensityZone) {
      s += 1;
    }
    // Penalise mismatches on non-null DB cols vs null request
    if (row.position_group && !positionGroup) {
      s -= 2;
    }
    if (row.periodization_phase && !periodizationPhase) {
      s -= 1;
    }
    return s;
  };

  const candidates = rows.filter((r) => {
    if (
      r.position_group &&
      positionGroup &&
      r.position_group !== positionGroup
    ) {
      return false;
    }
    if (
      r.periodization_phase &&
      periodizationPhase &&
      r.periodization_phase !== periodizationPhase
    ) {
      return false;
    }
    if (
      r.intensity_zone &&
      intensityZone &&
      r.intensity_zone !== intensityZone
    ) {
      return false;
    }
    return true;
  });

  if (candidates.length === 0) {
    // Fallback: return the most generic row (no position, no phase, no intensity)
    return (
      rows.find(
        (r) => !r.position_group && !r.periodization_phase && !r.intensity_zone,
      ) ?? rows[0]
    );
  }

  return candidates.sort((a, b) => score(b) - score(a))[0];
}

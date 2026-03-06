/**
 * Training program query helpers.
 *
 * Some environments have stale PostgREST schema cache entries and cannot
 * resolve implicit joins from player_programs -> training_programs. These
 * helpers keep program lookups explicit.
 */

async function getTrainingProgramById(
  supabase,
  programId,
  columns = "id, name",
) {
  if (!programId) {
    return null;
  }

  const { data, error } = await supabase
    .from("training_programs")
    .select(columns)
    .eq("id", programId)
    .maybeSingle();

  if (error) {
    console.error("[training-programs] Error fetching program:", error);
    throw error;
  }

  return data || null;
}

function toProgramSummary(programId, program) {
  if (program?.id && program?.name) {
    return {
      id: program.id,
      name: program.name,
    };
  }

  console.warn(
    `[training-programs] Missing program details for assignment ${programId}`,
  );

  return {
    id: programId,
    name: "Unknown Program",
  };
}

export { getTrainingProgramById, toProgramSummary };

/**
 * Training program query helpers.
 *
 * Some environments have stale PostgREST schema cache entries and cannot
 * resolve implicit joins from player_programs -> training_programs. These
 * helpers keep program lookups explicit.
 */

import { createLogger } from "./structured-logger.js";
const logger = createLogger({ service: "netlify.training-programs" });

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
    logger.error("training_program_fetch_failed", error, {});
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

  logger.warn("training_program_missing_details", { programId });

  return {
    id: programId,
    name: "Unknown Program",
  };
}

export { getTrainingProgramById, toProgramSummary };

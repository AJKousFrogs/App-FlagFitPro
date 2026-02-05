/**
 * Stub Routes
 * Explicit 501 responses for FE endpoints not yet implemented in backend.
 *
 * @module routes/stubs
 * @version 1.0.0
 */

import express from "express";
import { createErrorResponse } from "./utils/validation.js";

const router = express.Router();

const notImplemented = (feature) => (req, res) => {
  const { response } = createErrorResponse(
    "Endpoint not implemented",
    "NOT_IMPLEMENTED",
    501,
  );
  res.status(501).json({
    ...response,
    feature,
    method: req.method,
    path: req.originalUrl,
  });
};

const stub = (method, path, feature) => {
  router[method](path, notImplemented(feature || path));
};

// Dashboard
stub("get", "/dashboard/wearables", "dashboard.wearables");

// Training
stub("post", "/training/generate-substitute", "training.generateSubstitute");

// Analytics (missing sub-features)
stub("get", "/analytics/injury-risk", "analytics.injuryRisk");
stub("get", "/analytics/user-engagement", "analytics.userEngagement");

// Coach

// Community
stub("get", "/community/challenges", "community.challenges");

// Tournaments (FE expects /api/tournaments*, backend currently serves /api/games/tournaments*)
stub("get", "/tournaments", "tournaments.list");
stub("get", "/tournaments/health", "tournaments.health");
stub("get", "/tournaments/:id", "tournaments.details");
stub("post", "/tournaments/:id/register", "tournaments.register");
stub("get", "/tournaments/:id/bracket", "tournaments.bracket");

// Nutrition
stub("get", "/nutrition/search-foods", "nutrition.searchFoods");
stub("post", "/nutrition/add-food", "nutrition.addFood");
stub("get", "/nutrition/goals", "nutrition.goals");
stub("get", "/nutrition/meals", "nutrition.meals");
stub("get", "/nutrition/ai-suggestions", "nutrition.aiSuggestions");

// Recovery
stub("get", "/recovery/metrics", "recovery.metrics");
stub("get", "/recovery/protocols", "recovery.protocols");
stub("post", "/recovery/start-session", "recovery.startSession");
stub("post", "/recovery/complete-session", "recovery.completeSession");
stub("post", "/recovery/stop-session", "recovery.stopSession");
stub("get", "/recovery/research-insights", "recovery.researchInsights");
stub("get", "/recovery/weekly-trends", "recovery.weeklyTrends");
stub(
  "get",
  "/recovery/protocol-effectiveness",
  "recovery.protocolEffectiveness",
);

// Admin
stub("get", "/admin/health-metrics", "admin.healthMetrics");
stub("post", "/admin/sync-usda", "admin.syncUsda");
stub("post", "/admin/sync-research", "admin.syncResearch");
stub("post", "/admin/create-backup", "admin.createBackup");
stub("get", "/admin/sync-status", "admin.syncStatus");
stub("get", "/admin/usda-stats", "admin.usdaStats");
stub("get", "/admin/research-stats", "admin.researchStats");

// Load Management
stub("get", "/load-management/monotony", "loadManagement.monotony");
stub("get", "/load-management/tsb", "loadManagement.tsb");
stub("get", "/load-management/injury-risk", "loadManagement.injuryRisk");
stub("get", "/load-management/training-loads", "loadManagement.trainingLoads");

// Readiness
stub("get", "/readiness-history", "readiness.history");

// Player stats
stub("get", "/player-stats", "playerStats.aggregated");
stub("get", "/player-stats/date-range", "playerStats.dateRange");

// Fixtures & docs
stub("get", "/fixtures", "fixtures");
stub("get", "/api-docs", "apiDocs");

// AI feedback
stub("post", "/ai/feedback", "ai.feedback");

// Depth chart
stub("get", "/depth-chart/templates", "depthChart.templates.list");
stub("get", "/depth-chart/templates/:id", "depthChart.templates.details");
stub(
  "get",
  "/depth-chart/templates/:id/history",
  "depthChart.templates.history",
);
stub(
  "get",
  "/depth-chart/templates/:id/unassigned",
  "depthChart.templates.unassigned",
);
stub("get", "/depth-chart/entries", "depthChart.entries.list");
stub("get", "/depth-chart/entries/:id", "depthChart.entries.details");
stub("post", "/depth-chart/entries/swap", "depthChart.entries.swap");
stub("post", "/depth-chart/initialize", "depthChart.initialize");

// Equipment
stub("get", "/equipment/items", "equipment.items.list");
stub("get", "/equipment/items/:id", "equipment.items.details");
stub("get", "/equipment/items/:id/history", "equipment.items.history");
stub("get", "/equipment/assignments", "equipment.assignments.list");
stub(
  "get",
  "/equipment/player/:playerId/assignments",
  "equipment.player.assignments",
);
stub("post", "/equipment/checkout", "equipment.checkout");
stub("post", "/equipment/checkout/bulk", "equipment.checkout.bulk");
stub("post", "/equipment/return", "equipment.return");
stub("get", "/equipment/summary/:teamId", "equipment.summary");
stub("get", "/equipment/alerts/:teamId", "equipment.alerts");

// Officials
stub("get", "/officials", "officials.list");
stub("get", "/officials/:id", "officials.details");
stub("get", "/officials/:id/games", "officials.games");
stub("get", "/officials/:id/availability", "officials.availability");
stub("get", "/officials/available", "officials.available");
stub("post", "/officials/schedule", "officials.schedule");
stub("get", "/officials/game/:gameId", "officials.gameOfficials");
stub(
  "put",
  "/officials/assignments/:assignmentId",
  "officials.assignments.update",
);
stub("get", "/officials/payments/summary", "officials.payments.summary");

// Push
stub("post", "/push/register", "push.register");
stub("post", "/push/unregister", "push.unregister");
stub("get", "/push/preferences", "push.preferences");
stub("get", "/push/devices", "push.devices");
stub("delete", "/push/devices/:tokenId", "push.devices.delete");
stub("post", "/push/test", "push.test");

// Staff roles
stub("get", "/staff-nutritionist/athletes", "staffNutritionist.athletes");
stub(
  "get",
  "/staff-nutritionist/athletes/:athleteId/trends",
  "staffNutritionist.athleteTrends",
);
stub("get", "/staff-nutritionist/supplements", "staffNutritionist.supplements");
stub("get", "/staff-nutritionist/hydration", "staffNutritionist.hydration");
stub(
  "get",
  "/staff-nutritionist/reports/:athleteId",
  "staffNutritionist.reports",
);
stub("get", "/staff-nutritionist/summary", "staffNutritionist.summary");

stub("get", "/staff-physiotherapist/athletes", "staffPhysiotherapist.athletes");
stub(
  "get",
  "/staff-physiotherapist/athletes/:athleteId",
  "staffPhysiotherapist.athleteDetails",
);
stub("get", "/staff-physiotherapist/rtp", "staffPhysiotherapist.rtp");
stub(
  "put",
  "/staff-physiotherapist/rtp/:injuryId",
  "staffPhysiotherapist.updateRtp",
);
stub("get", "/staff-physiotherapist/summary", "staffPhysiotherapist.summary");
stub(
  "post",
  "/staff-physiotherapist/injuries",
  "staffPhysiotherapist.logInjury",
);

stub("get", "/staff-psychology/my-data", "staffPsychology.myData");
stub("post", "/staff-psychology/my-data/log", "staffPsychology.logEntry");
stub(
  "get",
  "/staff-psychology/reports/wellness",
  "staffPsychology.wellnessReport",
);
stub(
  "get",
  "/staff-psychology/reports/pre-competition",
  "staffPsychology.preCompetitionReport",
);
stub("get", "/staff-psychology/team", "staffPsychology.team");
stub(
  "get",
  "/staff-psychology/athletes/:athleteId",
  "staffPsychology.athleteData",
);
stub(
  "post",
  "/staff-psychology/assessments",
  "staffPsychology.createAssessment",
);

// Scouting
stub("get", "/scouting/reports", "scouting.reports");
stub("get", "/scouting/reports/:reportId", "scouting.report");
stub("get", "/scouting/opponents", "scouting.opponents");
stub("get", "/scouting/tendencies/:opponent", "scouting.tendencies");
stub("post", "/scouting/reports/:reportId/share", "scouting.shareReport");

// Film room
stub("get", "/film-room", "filmRoom.list");
stub("post", "/film-room/watched", "filmRoom.watched");
stub("post", "/film-room/reply", "filmRoom.reply");

// Playbook
stub("get", "/playbook", "playbook.list");
stub("post", "/playbook/study", "playbook.study");
stub("post", "/playbook/memorized", "playbook.memorized");

// Season/account
stub("post", "/season/archive", "season.archive");
stub("post", "/account/resume", "account.resume");
stub("post", "/player/notify-inactive", "player.notifyInactive");

// Calibration & micro-sessions
stub("get", "/calibration-logs", "calibration.logs");
stub("post", "/calibration-logs/outcome", "calibration.outcome");
stub("get", "/micro-sessions/analytics", "microSessions.analytics");

// Response feedback
stub("post", "/response-feedback", "responseFeedback");

export default router;

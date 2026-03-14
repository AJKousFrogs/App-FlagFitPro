# Codebase Map

**Version:** 1.7 draft  
**Purpose:** Map major product areas to their Angular surfaces, backend entry points, and primary data ownership.

## Core App Shell

| Domain | Main Angular Area | Backend / Data | Source Of Truth |
| --- | --- | --- | --- |
| App routing | `angular/src/app/core/routes` | route groups only | route config |
| Navigation | `angular/src/app/core/navigation` | none | navigation config + guards |
| Auth session | `angular/src/app/core/services/auth.service.ts` | Supabase auth | auth/session backend |
| Team context | `angular/src/app/core/services/team-membership.service.ts` | `team_members` | `team_members` |

## Player Domains

| Domain | Main Angular Area | Backend / Data | Source Of Truth |
| --- | --- | --- | --- |
| Onboarding | `angular/src/app/features/onboarding` | onboarding services, `users`, config tables | `users` + player settings |
| Today | `angular/src/app/features/today` | continuity, daily protocol, status services | continuity + protocol data |
| Training | `angular/src/app/features/training` | training APIs, player settings | training config / player settings |
| Travel recovery | `angular/src/app/features/travel/travel-recovery` | `athlete_travel_log` | travel log |
| Tournament nutrition | `angular/src/app/features/game/tournament-nutrition` | `tournament_day_plans`, hydration state | tournament day plans |
| Wellness | `angular/src/app/features/wellness` | wellness endpoints | wellness backend |
| Profile / settings | `angular/src/app/features/profile`, `angular/src/app/features/settings` | `users`, team sync services | `users` + `team_members` |

## Team And Roster Domains

| Domain | Main Angular Area | Backend / Data | Source Of Truth |
| --- | --- | --- | --- |
| Roster | `angular/src/app/features/roster` | roster service, team/player merge | `users` + `team_members`, projected to `team_players` |
| Invitations | `angular/src/app/features/team/accept-invitation` | invitation services | invite + membership backend |
| Team settings | `angular/src/app/features/coach/team-management` | team settings APIs | team settings backend |
| Depth chart | `angular/src/app/features/depth-chart` | `netlify/functions/depth-chart.js` | backend depth-chart authority |

## Coach Workflow Domains

| Domain | Main Angular Area | Backend / Data | Source Of Truth |
| --- | --- | --- | --- |
| Coach dashboard | `angular/src/app/features/dashboard/coach-dashboard.component.ts` | coach APIs, notifications | backend coach endpoints |
| Coach inbox | `angular/src/app/features/coach/coach-inbox` | `/api/coach-inbox` | coach inbox backend |
| Coach activity | `angular/src/app/features/coach/coach-activity-feed.component.ts` | team notifications | activity backend |
| Calendar | `angular/src/app/features/coach/calendar` | coach calendar endpoints | calendar backend |
| Practice planner | `angular/src/app/features/coach/practice-planner` | practice APIs | practices backend |
| Program builder | `angular/src/app/features/coach/program-builder` | program APIs | program backend |
| Player development | `angular/src/app/features/coach/player-development` | player development APIs | player development backend |
| Tournament management | `angular/src/app/features/coach/tournament-management` | tournament APIs | tournament backend |
| Payment management | `angular/src/app/features/coach/payment-management` | payment APIs | payment backend |
| Film room | `angular/src/app/features/coach/film-room` | film APIs | film backend |
| Knowledge base | `angular/src/app/features/coach/knowledge-base` | resource/review APIs | knowledge backend |
| Scouting | `angular/src/app/features/coach/scouting` | scouting APIs | scouting backend |
| Injury management | `angular/src/app/features/coach/injury-management` | physiotherapist / injury APIs | injury backend |
| Playbook manager | `angular/src/app/features/coach/playbook-manager` | playbook APIs | playbook backend |

## Staff Domains

| Domain | Main Angular Area | Backend / Data | Source Of Truth |
| --- | --- | --- | --- |
| Physiotherapist | `angular/src/app/features/staff/physiotherapist` | staff physiotherapist endpoints | staff medical backend |
| Nutrition / psychology / load | staff and coach features | staff endpoints + role sets | shared backend role sets |

## Communication Domains

| Domain | Main Angular Area | Backend / Data | Source Of Truth |
| --- | --- | --- | --- |
| Team chat | `angular/src/app/features/chat` | channel service, chat backend | channel backend |
| Community | `angular/src/app/features/community` | post/media backend | community backend |
| Notifications | core + dashboard + inbox | notification endpoints | notification backend |

## Backend Structure

| Area | Main Location | Notes |
| --- | --- | --- |
| Netlify functions | `netlify/functions` | primary backend surface |
| Shared backend auth | `netlify/functions/utils/role-sets.js` | canonical role capability sets |
| Shared backend auth guard | `netlify/functions/utils/authorization-guard.js` | active membership-sensitive access checks |
| Database migrations | `database/migrations` | persistent schema changes |

## Design And Shared UI

| Domain | Main Location | Notes |
| --- | --- | --- |
| Shared components | `angular/src/app/shared/components` | design-system aligned primitives |
| Shared utils | `angular/src/app/shared/utils` | formatting, status mapping, UI helpers |
| Global styles | `angular/src/styles` | token and override layer |
| Design rules | `docs/DESIGN_SYSTEM_RULES.md` | binding UI contract |

## Highest Drift Hotspots

These are the main places where future work should be careful:

1. Player identity and roster projection: `users` vs `team_members` vs `team_players`
2. Team-scoped role access across Angular and Netlify functions
3. Workflow handoff state passed by query params between coach tools
4. Export/share actions that still imply completion without persisted backend work

## Recommended Use

- Use this file when deciding where a feature belongs.
- Use `docs/SINGLE_SOURCE_OF_TRUTH.md` when deciding where a feature should write.
- Use `docs/REPO_DISCOVERY_GUIDE.md` when onboarding someone to the repo.

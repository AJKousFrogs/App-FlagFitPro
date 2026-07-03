/**
 * Season Calendar Presets
 *
 * Starting-point templates for the athlete-declared season_calendar
 * (SeasonWindow[]). Deliberately NOT a single hardcoded default — flag
 * football's actual season shape varies by climate and league region (a
 * hot-summer continental climate needs a mid-year heat break; a mild
 * maritime climate doesn't; the Southern Hemisphere is offset ~6 months;
 * equatorial/tropical regions run on wet/dry seasons that don't map onto
 * any of these cleanly). These are climate-pattern shapes, not verified
 * official league calendars for any specific country — the player picks
 * the shape closest to their real season during onboarding (or later in
 * settings) and then edits the actual dates to match their league. Every
 * preset's windows are contiguous ("to" of one = day before "from" of the
 * next) so macroPhaseFor never falls through to the generic fallback for a
 * date inside a freshly-applied preset.
 */

import { SeasonWindow } from "../models/prescription.models";

export interface SeasonCalendarPreset {
  id: string;
  label: string;
  description: string;
  windows: SeasonWindow[];
}

export const SEASON_CALENDAR_PRESETS: SeasonCalendarPreset[] = [
  {
    id: "heat-break-split",
    label: "Split season — mid-year heat break",
    description:
      "Two competitive blocks separated by a break during the hottest months. Common in continental/hot-summer climates (e.g. central & southern Europe, parts of the US).",
    windows: [
      { phase: "preseason", from: "03-01", to: "03-31" },
      { phase: "inseason", from: "04-01", to: "07-07" },
      { phase: "offseason", from: "07-08", to: "08-14" },
      { phase: "inseason", from: "08-15", to: "09-30" },
      { phase: "peak", from: "10-01", to: "10-31" },
      { phase: "postseason", from: "11-01", to: "11-30" },
      { phase: "offseason", from: "12-01", to: "02-29" },
    ],
  },
  {
    id: "continuous-mild",
    label: "Single continuous season — mild climate",
    description:
      "One unbroken competitive block, no heat-driven mid-year gap needed. Common in temperate maritime climates (e.g. UK & Ireland, Pacific Northwest US, New Zealand).",
    windows: [
      { phase: "preseason", from: "03-01", to: "04-15" },
      { phase: "inseason", from: "04-16", to: "09-15" },
      { phase: "peak", from: "09-16", to: "10-15" },
      { phase: "postseason", from: "10-16", to: "11-15" },
      { phase: "offseason", from: "11-16", to: "02-29" },
    ],
  },
  {
    id: "southern-hemisphere",
    label: "Southern Hemisphere — inverted",
    description:
      "Same split-season shape as the heat-break template, offset ~6 months for the opposite hemisphere's summer (e.g. Australia, South Africa, southern South America).",
    windows: [
      { phase: "preseason", from: "09-01", to: "09-30" },
      { phase: "inseason", from: "10-01", to: "01-07" },
      { phase: "offseason", from: "01-08", to: "02-13" },
      { phase: "inseason", from: "02-14", to: "03-31" },
      { phase: "peak", from: "04-01", to: "04-30" },
      { phase: "postseason", from: "05-01", to: "05-31" },
      { phase: "offseason", from: "06-01", to: "08-31" },
    ],
  },
  {
    id: "custom",
    label: "Custom — build my own",
    description:
      "Start blank and add your own periods. Best for a wet/dry-season climate (e.g. much of West Africa, Southeast Asia) or any league whose real calendar doesn't match the shapes above.",
    windows: [],
  },
];

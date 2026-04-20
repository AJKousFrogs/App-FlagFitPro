import type { TravelChecklist } from "./travel-recovery.service";

// ============================================================================
// TRAVEL CHECKLIST DATA
// Static checklist extracted from TravelRecoveryService.
// ============================================================================

export const TRAVEL_CHECKLIST: TravelChecklist[] = [
  {
    category: "Sleep & Recovery",
    items: [
      {
        id: "sleep-1",
        item: "Eye mask (blackout quality)",
        packed: false,
        essential: true,
      },
      {
        id: "sleep-2",
        item: "Earplugs or noise-canceling headphones",
        packed: false,
        essential: true,
      },
      {
        id: "sleep-3",
        item: "Neck pillow for flight",
        packed: false,
        essential: false,
      },
      {
        id: "sleep-4",
        item: "Melatonin supplements",
        packed: false,
        essential: true,
        notes: "0.5-3mg doses",
      },
      {
        id: "sleep-5",
        item: "Compression socks",
        packed: false,
        essential: true,
      },
      {
        id: "sleep-6",
        item: "Light blanket/layer for cold planes",
        packed: false,
        essential: false,
      },
    ],
  },
  {
    category: "Hydration & Nutrition",
    items: [
      {
        id: "hydration-1",
        item: "Reusable water bottle (empty for security)",
        packed: false,
        essential: true,
      },
      {
        id: "hydration-2",
        item: "Electrolyte tablets/powder",
        packed: false,
        essential: true,
      },
      {
        id: "hydration-3",
        item: "Healthy snacks (nuts, protein bars)",
        packed: false,
        essential: true,
      },
      {
        id: "hydration-4",
        item: "Ginger chews (for nausea)",
        packed: false,
        essential: false,
      },
    ],
  },
  {
    category: "Training & Recovery Gear",
    items: [
      {
        id: "training-1",
        item: "Resistance bands",
        packed: false,
        essential: false,
      },
      {
        id: "training-2",
        item: "Foam roller (travel size)",
        packed: false,
        essential: false,
      },
      {
        id: "training-3",
        item: "Massage ball",
        packed: false,
        essential: false,
      },
      {
        id: "training-4",
        item: "Training shoes",
        packed: false,
        essential: true,
      },
      {
        id: "training-5",
        item: "Competition gear",
        packed: false,
        essential: true,
      },
    ],
  },
  {
    category: "Health & Wellness",
    items: [
      {
        id: "health-1",
        item: "Sunglasses (for light management)",
        packed: false,
        essential: true,
      },
      {
        id: "health-2",
        item: "Sunscreen",
        packed: false,
        essential: false,
      },
      {
        id: "health-3",
        item: "Basic first aid kit",
        packed: false,
        essential: false,
      },
      {
        id: "health-4",
        item: "Any prescription medications",
        packed: false,
        essential: true,
      },
      {
        id: "health-5",
        item: "Hand sanitizer",
        packed: false,
        essential: true,
      },
    ],
  },
  {
    category: "Documents & Tech",
    items: [
      {
        id: "docs-1",
        item: "Passport (valid 6+ months)",
        packed: false,
        essential: true,
      },
      {
        id: "docs-2",
        item: "Travel insurance documents",
        packed: false,
        essential: true,
      },
      {
        id: "docs-3",
        item: "Competition registration/credentials",
        packed: false,
        essential: true,
      },
      {
        id: "docs-4",
        item: "Phone charger & adapter",
        packed: false,
        essential: true,
      },
      { id: "docs-5", item: "Headphones", packed: false, essential: false },
    ],
  },
];

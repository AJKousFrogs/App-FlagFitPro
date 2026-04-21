import type { CirculationExercise, MassageGunProtocol } from "./car-travel.service";
import type { TravelChecklist } from "./travel-recovery.service";

// ============================================================================
// CAR TRAVEL STATIC DATA
// Extracted from CarTravelService to keep the service focused on
// calculation and orchestration logic.
// ============================================================================

export const SEATED_EXERCISES: CirculationExercise[] = [
    {
      name: "Ankle Pumps",
      description:
        "Point toes down, then pull up toward shin. Alternate rhythmically.",
      sets: 3,
      reps: 20,
      targetArea: "calves",
      canDoSeated: true,
      evidenceBase: "Activates soleus muscle pump, promoting venous return",
    },
    {
      name: "Ankle Circles",
      description: "Rotate ankles in circles, 10 each direction per foot.",
      sets: 2,
      reps: 10,
      targetArea: "calves",
      canDoSeated: true,
    },
    {
      name: "Heel Raises (Seated)",
      description:
        "Lift heels off floor while keeping toes down, hold 2 seconds.",
      sets: 3,
      reps: 15,
      duration: 2,
      targetArea: "calves",
      canDoSeated: true,
      evidenceBase: "Engages gastrocnemius and soleus muscles",
    },
    {
      name: "Toe Raises",
      description:
        "Lift toes off floor while keeping heels down, hold 2 seconds.",
      sets: 3,
      reps: 15,
      duration: 2,
      targetArea: "calves",
      canDoSeated: true,
    },
    {
      name: "Knee Lifts",
      description: "Lift knee toward chest, hold 3 seconds, alternate legs.",
      sets: 2,
      reps: 10,
      duration: 3,
      targetArea: "thighs",
      canDoSeated: true,
      evidenceBase: "Activates hip flexors and promotes femoral vein flow",
    },
    {
      name: "Glute Squeezes",
      description: "Squeeze glutes tightly, hold 5 seconds, release.",
      sets: 3,
      reps: 10,
      duration: 5,
      targetArea: "glutes",
      canDoSeated: true,
      evidenceBase:
        "Activates gluteal muscles and promotes pelvic circulation",
    },
    {
      name: "Thigh Squeezes",
      description: "Press knees together firmly, hold 5 seconds, release.",
      sets: 3,
      reps: 10,
      duration: 5,
      targetArea: "thighs",
      canDoSeated: true,
    },
];

export const REST_STOP_EXERCISES: CirculationExercise[] = [
    {
      name: "Walking",
      description: "Brisk walking around rest area or parking lot.",
      sets: 1,
      reps: 1,
      duration: 300, // 5 minutes
      targetArea: "full-body",
      canDoSeated: false,
      evidenceBase:
        "Walking is the most effective way to activate muscle pumps",
    },
    {
      name: "Standing Calf Raises",
      description: "Rise up on toes, hold 2 seconds, lower slowly.",
      sets: 3,
      reps: 15,
      duration: 2,
      targetArea: "calves",
      canDoSeated: false,
      evidenceBase: "Stronger calf muscle activation than seated version",
    },
    {
      name: "Leg Swings (Forward/Back)",
      description: "Hold onto car for balance, swing leg forward and back.",
      sets: 2,
      reps: 15,
      targetArea: "thighs",
      canDoSeated: false,
    },
    {
      name: "Leg Swings (Side to Side)",
      description:
        "Hold onto car for balance, swing leg across body and out.",
      sets: 2,
      reps: 15,
      targetArea: "thighs",
      canDoSeated: false,
    },
    {
      name: "Walking Lunges",
      description:
        "Step forward into lunge, alternate legs for 10 steps each.",
      sets: 2,
      reps: 10,
      targetArea: "thighs",
      canDoSeated: false,
      evidenceBase: "Opens hip flexors compressed during sitting",
    },
    {
      name: "Hip Circles",
      description: "Hands on hips, rotate hips in large circles.",
      sets: 2,
      reps: 10,
      targetArea: "lower-back",
      canDoSeated: false,
    },
    {
      name: "Standing Quad Stretch",
      description: "Pull foot to glute, hold 30 seconds each leg.",
      sets: 1,
      reps: 1,
      duration: 30,
      targetArea: "thighs",
      canDoSeated: false,
    },
    {
      name: "Standing Hamstring Stretch",
      description: "Place heel on bumper/bench, lean forward gently.",
      sets: 1,
      reps: 1,
      duration: 30,
      targetArea: "thighs",
      canDoSeated: false,
    },
];

export const POST_ARRIVAL_EXERCISES: CirculationExercise[] = [
  ...REST_STOP_EXERCISES,
  {
      name: "Foam Rolling - Calves",
      description: "Roll calves on foam roller, 60 seconds each leg.",
      sets: 1,
      reps: 1,
      duration: 60,
      targetArea: "calves",
      canDoSeated: false,
      evidenceBase:
        "Foam rolling increases blood flow and reduces muscle tension",
    },
    {
      name: "Foam Rolling - Quads",
      description: "Roll quads on foam roller, 60 seconds each leg.",
      sets: 1,
      reps: 1,
      duration: 60,
      targetArea: "thighs",
      canDoSeated: false,
    },
    {
      name: "Foam Rolling - IT Band",
      description: "Roll outer thigh on foam roller, 60 seconds each leg.",
      sets: 1,
      reps: 1,
      duration: 60,
      targetArea: "thighs",
      canDoSeated: false,
    },
    {
      name: "Hip Flexor Stretch (Lunge)",
      description: "Deep lunge position, push hips forward, hold 60 seconds.",
      sets: 1,
      reps: 1,
      duration: 60,
      targetArea: "thighs",
      canDoSeated: false,
      evidenceBase:
        "Hip flexors shorten significantly during prolonged sitting",
    },
    {
      name: "Pigeon Pose",
      description:
        "Yoga pigeon pose to open hips, hold 60 seconds each side.",
      sets: 1,
      reps: 1,
      duration: 60,
      targetArea: "glutes",
      canDoSeated: false,
    },
    {
      name: "Cat-Cow Stretches",
      description: "On hands and knees, alternate arching and rounding back.",
      sets: 2,
      reps: 10,
      targetArea: "lower-back",
      canDoSeated: false,
      evidenceBase: "Restores spinal mobility after prolonged sitting",
    },
];

export const MASSAGE_GUN_PROTOCOL: MassageGunProtocol[] = [
    {
      timing: "pre-travel",
      targetMuscles: [
        {
          muscle: "Calves (Gastrocnemius & Soleus)",
          duration: 60,
          pressure: "moderate",
          technique: "Slow sweeping motions from ankle to knee",
          purpose: "Prime calf muscle pump for travel",
        },
        {
          muscle: "Quadriceps",
          duration: 60,
          pressure: "moderate",
          technique: "Work from knee to hip in sections",
          purpose: "Increase blood flow to large muscle group",
        },
        {
          muscle: "Glutes",
          duration: 60,
          pressure: "firm",
          technique: "Circular motions on gluteus maximus",
          purpose: "Activate glutes that will be compressed during sitting",
        },
      ],
      totalDuration: 5,
      frequency: "Once before departure",
      cautions: [
        "Do NOT use on bony areas (kneecap, shin bone, spine)",
        "Avoid if you have blood clots or DVT history",
        "Start with lower intensity and increase gradually",
        "Never use for more than 2 minutes on one spot",
      ],
      evidenceBase:
        "Konrad et al. (2023) - Localized percussion vibration increases blood flow velocity by 30-50%",
    },
    {
      timing: "rest-stop",
      targetMuscles: [
        {
          muscle: "Calves",
          duration: 45,
          pressure: "moderate",
          technique: "Focus on any areas of tightness",
          purpose: "Restore circulation after sitting",
        },
        {
          muscle: "Quadriceps",
          duration: 45,
          pressure: "moderate",
          technique: "Quick passes over entire muscle",
          purpose: "Reduce stiffness from static position",
        },
        {
          muscle: "Hip Flexors",
          duration: 30,
          pressure: "light",
          technique: "Gentle work on front of hip",
          purpose: "Release tension from hip flexion",
        },
      ],
      totalDuration: 3,
      frequency: "Every 2-3 hours at rest stops",
      cautions: [
        "Keep sessions brief during travel",
        "Focus on comfort, not deep tissue work",
        "Stay hydrated after use",
      ],
      evidenceBase:
        "Mayo Clinic (2024) - Percussion therapy stimulates mechanoreceptors, reducing pain perception",
    },
    {
      timing: "post-arrival",
      targetMuscles: [
        {
          muscle: "Calves",
          duration: 90,
          pressure: "moderate",
          technique: "Thorough work from ankle to knee, all sides",
          purpose: "Full restoration of calf circulation",
        },
        {
          muscle: "Quadriceps",
          duration: 90,
          pressure: "moderate",
          technique: "Work entire quad including VMO and outer quad",
          purpose: "Release tension and restore blood flow",
        },
        {
          muscle: "Hamstrings",
          duration: 90,
          pressure: "moderate",
          technique: "Work from behind knee to glute fold",
          purpose: "Address muscles compressed against seat",
        },
        {
          muscle: "Glutes",
          duration: 90,
          pressure: "firm",
          technique: "Deep work on gluteus maximus and medius",
          purpose: "Release tension from prolonged compression",
        },
        {
          muscle: "Lower Back (Erector Spinae)",
          duration: 60,
          pressure: "light",
          technique: "Gentle work along spine muscles, NOT on spine",
          purpose: "Relieve tension from driving posture",
        },
      ],
      totalDuration: 10,
      frequency: "Once within 30 minutes of arrival",
      cautions: [
        "This is the most comprehensive session",
        "Take your time and focus on problem areas",
        "If any area is particularly sore, use lighter pressure",
        "STOP if you experience sharp pain",
        "WARNING: Excessive use can cause rhabdomyolysis (Szabo et al. 2020)",
      ],
      evidenceBase:
        "Cheatham et al. (2021) - Massage guns improve flexibility and reduce muscle soreness post-activity",
    },
];

export const CAR_TRAVEL_CHECKLIST: TravelChecklist[] = [
    {
      category: "Compression & Circulation",
      items: [
        {
          id: "comp-1",
          item: "Compression leggings (15-20 mmHg)",
          packed: false,
          essential: true,
          notes: "Full-length for maximum coverage",
        },
        {
          id: "comp-2",
          item: "Compression socks (backup pair)",
          packed: false,
          essential: true,
          notes: "Knee-high, graduated compression",
        },
        {
          id: "comp-3",
          item: "Massage gun + charger",
          packed: false,
          essential: true,
          notes: "Fully charged before departure",
        },
        {
          id: "comp-4",
          item: "Foam roller (travel size)",
          packed: false,
          essential: false,
          notes: "For post-arrival recovery",
        },
        {
          id: "comp-5",
          item: "Massage ball / lacrosse ball",
          packed: false,
          essential: false,
          notes: "For trigger point release",
        },
        {
          id: "comp-6",
          item: "Resistance bands",
          packed: false,
          essential: false,
          notes: "For rest stop exercises",
        },
      ],
    },
    {
      category: "Hydration & Nutrition",
      items: [
        {
          id: "hyd-1",
          item: "Large water bottles (2-3L total)",
          packed: false,
          essential: true,
          notes: "Aim for 250ml per hour of travel",
        },
        {
          id: "hyd-2",
          item: "Electrolyte tablets/powder",
          packed: false,
          essential: true,
          notes: "Prevents cramping and dehydration",
        },
        {
          id: "hyd-3",
          item: "Bananas (potassium)",
          packed: false,
          essential: true,
          notes: "Natural cramp prevention",
        },
        {
          id: "hyd-4",
          item: "Trail mix / nuts",
          packed: false,
          essential: true,
          notes: "Healthy fats and protein",
        },
        {
          id: "hyd-5",
          item: "Whole grain crackers / rice cakes",
          packed: false,
          essential: false,
          notes: "Complex carbs for energy",
        },
        {
          id: "hyd-6",
          item: "Protein bars",
          packed: false,
          essential: false,
          notes: "Low fiber for travel",
        },
        {
          id: "hyd-7",
          item: "Cooler with ice packs",
          packed: false,
          essential: true,
          notes: "Keep drinks and snacks cold",
        },
      ],
    },
    {
      category: "Comfort & Ergonomics",
      items: [
        {
          id: "comf-1",
          item: "Lumbar support cushion",
          packed: false,
          essential: true,
          notes: "Maintains proper spine alignment",
        },
        {
          id: "comf-2",
          item: "Seat cushion (if needed)",
          packed: false,
          essential: false,
          notes: "Reduces pressure on glutes",
        },
        {
          id: "comf-3",
          item: "Neck pillow",
          packed: false,
          essential: false,
          notes: "For passenger rest periods",
        },
        {
          id: "comf-4",
          item: "Blanket / light layer",
          packed: false,
          essential: false,
          notes: "AC can affect circulation",
        },
      ],
    },
    {
      category: "Driver Safety",
      items: [
        {
          id: "drive-1",
          item: "Sunglasses",
          packed: false,
          essential: true,
          notes: "Reduce eye strain",
        },
        {
          id: "drive-2",
          item: "Caffeine (coffee/tea/gum)",
          packed: false,
          essential: false,
          notes: "Use strategically, not excessively",
        },
        {
          id: "drive-3",
          item: "Podcast/audiobook/music playlist",
          packed: false,
          essential: false,
          notes: "Mental stimulation for alertness",
        },
        {
          id: "drive-4",
          item: "Phone mount",
          packed: false,
          essential: true,
          notes: "For safe navigation",
        },
      ],
    },
    {
      category: "Emergency & Health",
      items: [
        {
          id: "emerg-1",
          item: "First aid kit",
          packed: false,
          essential: true,
        },
        {
          id: "emerg-2",
          item: "Pain relievers (ibuprofen)",
          packed: false,
          essential: false,
          notes: "For unexpected soreness",
        },
        {
          id: "emerg-3",
          item: "Phone charger / car charger",
          packed: false,
          essential: true,
        },
        {
          id: "emerg-4",
          item: "Emergency contact info",
          packed: false,
          essential: true,
        },
      ],
    },
];

export const CAR_TRAVEL_RESEARCH_SUMMARY: {
  topic: string;
  finding: string;
  source: string;
  pubmedId?: string;
  recommendation: string;
}[] = [
    {
      topic: "Compression Garments & Blood Flow",
      finding:
        "Sports compression garments significantly enhance venous blood flow at rest, during exercise, and in recovery. Meta-analysis of 29 studies showed consistent improvements in peripheral blood flow.",
      source: "Engel et al. (2016) - Systematic Review & Meta-Analysis",
      pubmedId: "36622554",
      recommendation:
        "Wear 15-20 mmHg graduated compression socks or leggings during all travel >2 hours.",
    },
    {
      topic: "Compression & Performance",
      finding:
        "Lower-limb compression tights worn during repeated-sprint cycling improved muscle blood flow and overall performance. Benefits seen in both blood flow velocity and muscle oxygenation.",
      source: "Brophy-Williams et al. (2017)",
      pubmedId: "29252067",
      recommendation:
        "Compression can help maintain performance readiness during travel to competitions.",
    },
    {
      topic: "Compression & Hemodynamics",
      finding:
        "Compression garments enhance central hemodynamic responses, including increased stroke volume and reduced heart rate, particularly after physiological challenges.",
      source: "Born et al. (2013)",
      pubmedId: "33065703",
      recommendation:
        "Continue wearing compression for 2-4 hours post-travel for optimal recovery.",
    },
    {
      topic: "Massage Gun & Blood Flow",
      finding:
        "Localized percussion vibration using massage guns increases blood flow velocity by 30-50% and muscle volume. Higher frequencies (40-53 Hz) and longer durations (60-120s) produce greater increases.",
      source: "Konrad et al. (2023) - Journal of Clinical Medicine",
      pubmedId: "MDPI: 10.3390/jcm12052047",
      recommendation:
        "Use massage gun for 60-90 seconds per muscle group at rest stops and post-arrival.",
    },
    {
      topic: "Massage Gun & Flexibility",
      finding:
        "Systematic review found massage guns effectively improve flexibility in iliopsoas, hamstrings, triceps surae, and posterior chain muscles.",
      source: "Cheatham et al. (2021)",
      pubmedId: "37754971",
      recommendation:
        "Combine massage gun use with stretching for optimal flexibility restoration.",
    },
    {
      topic: "Massage Gun Safety Warning",
      finding:
        "Case reports of severe rhabdomyolysis following excessive massage gun use, particularly in young athletes. Risk increases with prolonged application (>2 min per area) and high pressure.",
      source: "Szabo et al. (2020)",
      pubmedId: "33156927",
      recommendation:
        "NEVER use massage gun for more than 2 minutes on one area. Use moderate pressure. Stop if pain occurs.",
    },
    {
      topic: "Prolonged Sitting & DVT Risk",
      finding:
        "Sitting for more than 4 hours increases DVT risk 2-3 times. Risk compounds with duration and is present in car travel as well as air travel.",
      source: "Scurr et al. (2001) / Clarke et al. (2016) Cochrane Review",
      recommendation:
        "Take mandatory breaks every 2 hours. Perform seated exercises every 30 minutes.",
    },
    {
      topic: "Movement & Venous Return",
      finding:
        "The calf muscle pump (soleus and gastrocnemius) is critical for venous return. Simple ankle pumps and calf raises significantly improve blood flow even when seated.",
      source: "Multiple studies on venous physiology",
      recommendation:
        "Perform 20 ankle pumps every 30 minutes during travel. Do standing calf raises at every stop.",
    },
    {
      topic: "Hydration & Blood Viscosity",
      finding:
        "Dehydration increases blood viscosity, making clot formation more likely. Adequate hydration is essential for maintaining healthy blood flow during prolonged sitting.",
      source: "General cardiovascular research",
      recommendation:
        "Drink 250ml water per hour of travel. Include electrolytes to maintain hydration.",
    },
];

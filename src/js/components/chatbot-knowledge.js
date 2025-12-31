/**
 * Chatbot Knowledge Base & Question Pools
 * Contains all knowledge domains, responses, and suggested questions
 * Extracted from chatbot.js for better maintainability
 */

/**
 * Knowledge Base - Topics, keywords, and responses
 */
export const knowledgeBase = {
  psychology: {
    keywords: [
      "mental",
      "psychology",
      "mindset",
      "confidence",
      "anxiety",
      "stress",
      "focus",
      "motivation",
      "mental health",
    ],
    responses: [
      "Mental preparation is crucial for peak performance. Try visualization techniques before games - imagine yourself executing plays perfectly.",
      "Confidence comes from preparation. Focus on what you can control: your effort, attitude, and preparation.",
      "For performance anxiety, practice deep breathing: 4 seconds in, hold 4, 4 seconds out. This activates your parasympathetic nervous system.",
      "Set process goals (like 'execute this route perfectly') rather than outcome goals (like 'score a touchdown'). Process goals are more controllable.",
      "Pre-game routines help reduce anxiety. Develop a consistent warm-up and mental preparation ritual.",
    ],
  },
  nutrition: {
    keywords: [
      "nutrition",
      "diet",
      "food",
      "eat",
      "meal",
      "protein",
      "carbs",
      "hydration",
      "supplement",
      "pre-workout",
      "post-workout",
    ],
    responses: [
      "For flag football, prioritize lean proteins (chicken, fish, eggs), complex carbs (sweet potatoes, quinoa), and healthy fats (avocado, nuts).",
      "Pre-workout: Eat 2-3 hours before training. Include carbs for energy and a small amount of protein.",
      "Post-workout: Consume protein (20-30g) within 30 minutes after training to support muscle recovery.",
      "Stay hydrated! Drink 16-20oz of water 2-3 hours before training, and 8-10oz every 15-20 minutes during activity.",
      "For supplements: Creatine (3-5g daily) can improve power output. Beta-alanine helps with endurance. Always consult a sports nutritionist first.",
    ],
    specificAnswers: {
      iron: (height, weight) => {
        const baseIron = 8;
        const athleteMultiplier = 1.5;
        const recommended = Math.round(baseIron * athleteMultiplier);

        return `Based on your stats (${height}cm / ${weight}kg), as an active flag football athlete, you should aim for **${recommended}mg of iron per day**.\n\n**Important considerations:**\n• Get iron from food sources first: lean red meat, dark poultry, beans, lentils, spinach, fortified cereals\n• If supplementing, take iron supplements separately from calcium supplements (they compete for absorption)\n• Vitamin C enhances iron absorption - pair iron-rich foods with citrus fruits or bell peppers\n• Avoid taking iron with coffee or tea (tannins reduce absorption)\n• If you're experiencing fatigue, get your ferritin levels checked - athletes are prone to iron deficiency\n\n**Note:** Always consult with a sports nutritionist or doctor before starting iron supplementation, as excess iron can be harmful.`;
      },
      protein: (weight) => {
        const proteinPerKg = 1.6;
        const dailyProtein = Math.round(weight * proteinPerKg);
        return `For your weight (${weight}kg), aim for **${dailyProtein}g of protein per day** as an active flag football athlete.\n\n**Distribution:**\n• Spread across 4-5 meals: ~${Math.round(dailyProtein / 4)}g per meal\n• Post-workout: 20-30g within 30 minutes\n• Pre-sleep: 20-30g casein protein for overnight recovery\n\n**Best sources:** Chicken breast, fish, eggs, Greek yogurt, lean beef, whey protein, plant-based options (tofu, tempeh, legumes).`;
      },
      creatine: () => {
        return "**Creatine Dosage:**\n• Loading phase (optional): 20g/day split into 4 doses of 5g for 5-7 days\n• Maintenance: 3-5g daily\n• Best taken post-workout with carbs (helps uptake)\n• Can also take pre-workout\n• Stay hydrated - creatine increases water retention in muscles\n• No need to cycle on/off\n\n**Benefits for flag football:** Improved power output, sprint performance, and recovery between high-intensity efforts.";
      },
      magnesium: () => {
        return "**Magnesium for Athletes:**\n• RDA: 400-420mg/day for men, 310-320mg/day for women\n• Athletes may need 500-600mg/day due to sweat loss\n• Best sources: Dark leafy greens, nuts, seeds, whole grains, dark chocolate\n• If supplementing: Magnesium citrate or glycinate (better absorption than oxide)\n• Take with food to reduce stomach upset\n• Magnesium helps with muscle function, sleep quality, and recovery";
      },
    },
  },
  speed: {
    keywords: [
      "speed",
      "sprint",
      "fast",
      "acceleration",
      "agility",
      "quickness",
      "40 yard",
      "speed training",
    ],
    responses: [
      "Speed development requires a combination of strength, technique, and power. Focus on sprint mechanics: drive phase, maximum velocity, and deceleration.",
      "For acceleration: Practice 10-20 yard sprints with proper forward lean (45-degree angle) and powerful arm drive.",
      "Plyometric exercises like box jumps, broad jumps, and bounding improve power output and speed.",
      "Resistance training with squats, deadlifts, and Olympic lifts builds the strength foundation for speed.",
      "Rest is crucial for speed development. Allow 48-72 hours between intense speed sessions for recovery.",
    ],
  },
  injury: {
    keywords: [
      "injury",
      "hurt",
      "pain",
      "sprain",
      "strain",
      "achilles",
      "knee",
      "shoulder",
      "ankle",
      "hamstring",
    ],
    responses: [
      "For acute injuries, follow RICE: Rest, Ice (15-20 min every 2-3 hours), Compression, Elevation.",
      "If you experience sharp pain, swelling, or inability to bear weight, consult a healthcare professional immediately.",
      "Common flag football injuries: ankle sprains, hamstring strains, shoulder impingement. Prevention through proper warm-up and strength training is key.",
      "For hamstring strains: Start with gentle stretching after 48 hours, then progressive strengthening. Avoid sprinting until pain-free.",
      "Ankle sprains benefit from balance training (single-leg stands) and calf strengthening to prevent recurrence.",
    ],
  },
  recovery: {
    keywords: [
      "recovery",
      "rest",
      "sleep",
      "sore",
      "fatigue",
      "regeneration",
      "rest day",
      "overtraining",
    ],
    responses: [
      "Recovery is when adaptation happens. Aim for 7-9 hours of quality sleep per night for optimal recovery.",
      "Active recovery (light walking, stretching, yoga) can be more effective than complete rest on off days.",
      "Signs of overtraining: persistent fatigue, decreased performance, mood changes, sleep disturbances. Take a deload week if you notice these.",
      "Post-training: Use foam rolling, dynamic stretching, and contrast therapy (hot/cold) to enhance recovery.",
      "Nutrition plays a huge role in recovery. Ensure adequate protein intake and consider tart cherry juice for inflammation reduction.",
    ],
  },
  training: {
    keywords: [
      "training",
      "workout",
      "exercise",
      "drill",
      "practice",
      "session",
      "program",
    ],
    responses: [
      "Effective training follows periodization: base building, strength phase, power phase, and maintenance.",
      "For flag football, focus on: speed/agility (40%), strength (30%), skill work (20%), and recovery (10%).",
      "Training frequency: 3-4 days per week allows for adequate recovery while maintaining progress.",
      "Always include a proper warm-up (10-15 min) and cool-down (5-10 min) in every session.",
      "Track your training load (volume × intensity) to prevent overtraining and optimize performance.",
    ],
  },
  general: {
    keywords: ["hello", "hi", "help", "what", "how", "tell me"],
    responses: [
      "Hello! I'm your FlagFit AI Assistant. I can help with:\n• Sports psychology & mental training\n• Nutrition & supplements\n• Speed & agility development\n• Injury prevention & treatment\n• Recovery strategies\n• Training programs\n\nWhat would you like to know?",
      "Hi there! I'm here to help with your flag football training questions. Ask me about psychology, nutrition, speed, injuries, recovery, or training!",
    ],
  },
};

/**
 * Question Pools - Suggested questions for each topic
 */
export const questionPools = {
  psychology: [
    "How can I improve my mental game and confidence?",
    "What techniques help with performance anxiety?",
    "How do I build mental toughness for competition?",
    "What's the best way to visualize success before games?",
    "How can I stay focused during high-pressure situations?",
    "What mental strategies help with pre-game nerves?",
    "How do I develop a winning mindset?",
    "What are effective goal-setting techniques for athletes?",
    "How can I overcome self-doubt and build confidence?",
    "What mental preparation routines do elite athletes use?",
  ],
  nutrition: [
    "What should I eat before and after training?",
    "How much protein do I need as an athlete?",
    "What are the best pre-workout meals?",
    "How do I optimize my nutrition for recovery?",
    "What supplements should I consider taking?",
    "How much water should I drink during training?",
    "What foods help with muscle recovery?",
    "How do I plan meals around my training schedule?",
    "What's the best post-workout nutrition?",
    "How can I improve my energy levels through nutrition?",
  ],
  speed: [
    "How can I improve my speed and acceleration?",
    "What exercises increase sprint speed?",
    "How do I improve my 40-yard dash time?",
    "What's the best speed training program?",
    "How can plyometrics improve my speed?",
    "What's the difference between speed and agility training?",
    "How often should I do speed training?",
    "What techniques improve running form?",
    "How do I increase my top speed?",
    "What's the best way to train acceleration?",
  ],
  injury: [
    "How do I prevent and treat common flag football injuries?",
    "What's the best way to treat an ankle sprain?",
    "How can I prevent hamstring strains?",
    "What exercises prevent ACL injuries?",
    "How do I recover from a shoulder injury?",
    "What are the most common flag football injuries?",
    "How can I prevent overuse injuries?",
    "What's the RICE method for injuries?",
    "How do I know if I need to see a doctor?",
    "What exercises strengthen injury-prone areas?",
  ],
  recovery: [
    "What are the best recovery strategies after training?",
    "How does sauna therapy help with recovery?",
    "What's the best cold therapy protocol?",
    "How much sleep do I need for optimal recovery?",
    "What's the difference between active and passive recovery?",
    "How do I use a massage gun for recovery?",
    "What recovery methods work best together?",
    "How can I speed up muscle recovery?",
    "What's the best post-training recovery routine?",
    "How do I know if I'm recovering properly?",
  ],
};

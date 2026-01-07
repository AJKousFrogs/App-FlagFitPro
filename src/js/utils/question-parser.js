// Question Parser - Intelligent question understanding
// Extracts intent, entities, and context from user questions

export class QuestionParser {
  constructor() {
    this.intentPatterns = {
      dosage: [
        /how much/i,
        /how many/i,
        /what.*dose/i,
        /what.*dosage/i,
        /how.*take/i,
        /how.*consume/i,
        /recommended.*amount/i,
        /daily.*intake/i,
      ],
      timing: [
        /when.*take/i,
        /when.*use/i,
        /best.*time/i,
        /before.*after/i,
        /pre.*post/i,
        /timing/i,
      ],
      safety: [
        /safe/i,
        /dangerous/i,
        /side.*effect/i,
        /risk/i,
        /warning/i,
        /contraindication/i,
        /harmful/i,
      ],
      comparison: [
        /better/i,
        /best/i,
        /vs/i,
        /versus/i,
        /difference/i,
        /compare/i,
        /which.*better/i,
      ],
      how_to: [
        /how.*do/i,
        /how.*prevent/i,
        /how.*treat/i,
        /how.*improve/i,
        /how.*increase/i,
        /how.*reduce/i,
        /how.*avoid/i,
      ],
      what_is: [
        /what.*is/i,
        /what.*are/i,
        /explain/i,
        /tell.*about/i,
        /describe/i,
      ],
      why: [/why/i, /reason/i, /cause/i, /benefit/i, /advantage/i],
      protocol: [
        /protocol/i,
        /routine/i,
        /schedule/i,
        /program/i,
        /plan/i,
        /method/i,
      ],
    };

    this.entityPatterns = {
      supplements: [
        /iron/i,
        /creatine/i,
        /protein/i,
        /magnesium/i,
        /vitamin\s*d/i,
        /beta\s*alanine/i,
        /bcaa/i,
        /glutamine/i,
        /omega\s*3/i,
        /zinc/i,
        /calcium/i,
      ],
      injuries: [
        /ankle\s*sprain/i,
        /hamstring\s*strain/i,
        /acl/i,
        /shoulder\s*impingement/i,
        /knee\s*pain/i,
        /back\s*pain/i,
        /tendonitis/i,
        /tendinitis/i,
        /concussion/i,
      ],
      recovery: [
        /sauna/i,
        /cold\s*therapy/i,
        /ice\s*bath/i,
        /cryotherapy/i,
        /massage/i,
        /foam\s*roll/i,
        /compression/i,
        /sleep/i,
        /recovery/i,
      ],
      training: [
        /speed\s*training/i,
        /agility/i,
        /strength/i,
        /endurance/i,
        /plyometric/i,
        /sprint/i,
        /cardio/i,
      ],
      psychology: [
        /anxiety/i,
        /confidence/i,
        /mental/i,
        /psychology/i,
        /visualization/i,
        /focus/i,
        /motivation/i,
      ],
      body_stats: {
        height: /(\d+)\s*(?:cm|centimeters?|m|meters?|'|ft|feet|inches?)/i,
        weight: /(\d+)\s*(?:kg|kilograms?|lbs?|pounds?)/i,
        age: /(\d+)\s*(?:years?|yrs?|yo)/i,
      },
    };
  }

  parse(question) {
    const lowerQuestion = question.toLowerCase();

    return {
      original: question,
      intent: this.detectIntent(lowerQuestion),
      entities: this.extractEntities(lowerQuestion, question),
      context: this.extractContext(lowerQuestion),
      questionType: this.classifyQuestion(question),
      priority: this.determinePriority(lowerQuestion),
    };
  }

  detectIntent(lowerQuestion) {
    const intents = [];

    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      if (patterns.some((pattern) => pattern.test(lowerQuestion))) {
        intents.push(intent);
      }
    }

    return intents.length > 0 ? intents[0] : "general";
  }

  extractEntities(lowerQuestion, originalQuestion) {
    const entities = {
      supplements: [],
      injuries: [],
      recovery: [],
      training: [],
      psychology: [],
      bodyStats: {},
    };

    // Extract supplements
    for (const supplement of this.entityPatterns.supplements) {
      if (supplement.test(lowerQuestion)) {
        const match = lowerQuestion.match(supplement);
        entities.supplements.push(match[0].trim());
      }
    }

    // Extract injuries
    for (const injury of this.entityPatterns.injuries) {
      if (injury.test(lowerQuestion)) {
        const match = lowerQuestion.match(injury);
        entities.injuries.push(match[0].trim());
      }
    }

    // Extract recovery methods
    for (const recovery of this.entityPatterns.recovery) {
      if (recovery.test(lowerQuestion)) {
        const match = lowerQuestion.match(recovery);
        entities.recovery.push(match[0].trim());
      }
    }

    // Extract training types
    for (const training of this.entityPatterns.training) {
      if (training.test(lowerQuestion)) {
        const match = lowerQuestion.match(training);
        entities.training.push(match[0].trim());
      }
    }

    // Extract psychology topics
    for (const psych of this.entityPatterns.psychology) {
      if (psych.test(lowerQuestion)) {
        const match = lowerQuestion.match(psych);
        entities.psychology.push(match[0].trim());
      }
    }

    // Extract body stats
    const heightMatch = originalQuestion.match(
      this.entityPatterns.body_stats.height,
    );
    const weightMatch = originalQuestion.match(
      this.entityPatterns.body_stats.weight,
    );
    const ageMatch = originalQuestion.match(this.entityPatterns.body_stats.age);

    if (heightMatch) {
      entities.bodyStats.height = this.normalizeHeight(
        parseInt(heightMatch[1]),
        heightMatch[0],
      );
    }
    if (weightMatch) {
      entities.bodyStats.weight = this.normalizeWeight(
        parseInt(weightMatch[1]),
        weightMatch[0],
      );
    }
    if (ageMatch) {
      entities.bodyStats.age = parseInt(ageMatch[1]);
    }

    return entities;
  }

  normalizeHeight(value, unit) {
    const lowerUnit = unit.toLowerCase();
    if (
      lowerUnit.includes("ft") ||
      lowerUnit.includes("feet") ||
      lowerUnit.includes("'")
    ) {
      return Math.round(value * 30.48); // Convert feet to cm
    }
    if (lowerUnit.includes("m") && !lowerUnit.includes("cm")) {
      return Math.round(value * 100); // Convert meters to cm
    }
    return value; // Already in cm
  }

  normalizeWeight(value, unit) {
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit.includes("lb") || lowerUnit.includes("pound")) {
      return Math.round(value * 0.453592); // Convert lbs to kg
    }
    return value; // Already in kg
  }

  extractContext(lowerQuestion) {
    const context = {
      urgency: "normal",
      specificity: "general",
      timeFrame: null,
      comparison: false,
    };

    // Urgency indicators
    if (
      lowerQuestion.includes("urgent") ||
      lowerQuestion.includes("emergency") ||
      lowerQuestion.includes("severe")
    ) {
      context.urgency = "high";
    }

    // Specificity
    if (
      lowerQuestion.includes("specific") ||
      lowerQuestion.includes("exact") ||
      lowerQuestion.includes("precise")
    ) {
      context.specificity = "high";
    }

    // Time frame
    const timeFrameMatch = lowerQuestion.match(
      /(daily|weekly|monthly|per day|per week|per month)/i,
    );
    if (timeFrameMatch) {
      context.timeFrame = timeFrameMatch[0].toLowerCase();
    }

    // Comparison
    context.comparison =
      lowerQuestion.includes("vs") ||
      lowerQuestion.includes("versus") ||
      lowerQuestion.includes("better");

    return context;
  }

  classifyQuestion(question) {
    const lower = question.toLowerCase();

    if (lower.startsWith("what")) {
      return "definition";
    }
    if (lower.startsWith("how")) {
      return "method";
    }
    if (lower.startsWith("why")) {
      return "explanation";
    }
    if (lower.startsWith("when")) {
      return "timing";
    }
    if (lower.startsWith("where")) {
      return "location";
    }
    if (lower.startsWith("who")) {
      return "person";
    }
    if (lower.startsWith("which")) {
      return "choice";
    }
    if (lower.startsWith("should")) {
      return "advice";
    }
    if (lower.startsWith("can") || lower.startsWith("could")) {
      return "capability";
    }

    return "general";
  }

  determinePriority(lowerQuestion) {
    if (
      lowerQuestion.includes("urgent") ||
      lowerQuestion.includes("emergency") ||
      lowerQuestion.includes("severe")
    ) {
      return "high";
    }
    if (
      lowerQuestion.includes("important") ||
      lowerQuestion.includes("critical")
    ) {
      return "medium";
    }
    return "normal";
  }
}

export const questionParser = new QuestionParser();

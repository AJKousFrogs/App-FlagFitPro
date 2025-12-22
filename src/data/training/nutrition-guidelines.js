export const NUTRITION_GUIDELINES = {
  dailyFramework: {
    trainingDays: {
      breakfast: {
        timing: "2 hours pre-training",
        components: [
          "Complex carbs: Oatmeal, rice, sweet potato",
          "Protein: Eggs, Greek yogurt",
          "Fats: Nuts, avocado",
        ],
        example: "3 eggs + oatmeal with berries + almond butter",
      },
      preTraining: {
        timing: "30-60 min before",
        components: [
          "Simple carbs: Banana, rice cakes",
          "Light protein: Protein shake",
        ],
        example: "Banana + small protein shake",
      },
      duringTraining: {
        components: ["Water with electrolytes", "BCAAs (optional)"],
      },
      postTraining: {
        timing: "within 30 min",
        components: [
          "Fast-acting protein: Whey shake",
          "Simple carbs: Fruit, honey",
        ],
        example: "Protein shake + banana",
      },
      lunch: {
        timing: "2-3 hours post-training",
        components: [
          "Lean protein: Chicken, fish, lean beef",
          "Complex carbs: Rice, quinoa, pasta",
          "Vegetables: Variety of colors",
        ],
        example: "Grilled chicken + brown rice + broccoli",
      },
      dinner: {
        components: [
          "Lean protein",
          "Complex carbs (adjust based on next day)",
          "Vegetables",
          "Healthy fats",
        ],
      },
      beforeBed: {
        components: ["Slow-digesting protein: Casein, cottage cheese"],
        example: "Greek yogurt or cottage cheese",
      },
    },
    restDays: {
      adjustments: [
        "Slightly reduce carbs",
        "Maintain protein intake",
        "Increase healthy fats",
        "Focus on recovery foods",
      ],
    },
  },

  hydration: {
    dailyMinimum: "3-4 liters water",
    training: {
      pre: "16-20 oz (1-2 hours before)",
      during: "8 oz every 15-20 min",
      post: "24 oz per pound lost",
    },
    monitoring: "Monitor urine color (pale yellow)",
  },
};
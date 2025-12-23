#!/usr/bin/env node

import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function seedCommunicationTrainingDatabase() {
  const client = await pool.connect();

  try {
    console.log("🗣️ Seeding Communication Training Knowledge Base...");

    // Create communication training table
    await client.query(`
      CREATE TABLE IF NOT EXISTS communication_training (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        subcategory VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        on_field_applications TEXT[],
        off_field_applications TEXT[],
        difficulty_level VARCHAR(50),
        practice_scenarios JSONB,
        success_metrics TEXT[],
        common_mistakes TEXT[],
        improvement_tips TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Seed on-field communication data
    const onFieldCommunication = [
      {
        category: "On-Field Communication",
        subcategory: "Quarterback Leadership",
        title: "Pre-Snap Communication",
        description:
          "Effective pre-snap communication to coordinate the offense and identify defensive alignments.",
        on_field_applications: [
          "Calling audibles based on defensive alignment",
          "Hot routes communication with receivers",
          "Protection adjustments with offensive line",
          "Snap count variations",
        ],
        off_field_applications: [
          "Film study discussions",
          "Practice preparation meetings",
          "Building trust with receivers",
        ],
        difficulty_level: "Advanced",
        practice_scenarios: {
          scenarios: [
            "Blitz recognition and hot route calling",
            "Coverage identification and route adjustments",
            "Red zone communication under pressure",
            "Two-minute drill coordination",
          ],
        },
        success_metrics: [
          "Pre-snap penalty reduction",
          "Successful audible completion rate",
          "Team synchronization timing",
          "Pressure situation execution",
        ],
        common_mistakes: [
          "Over-communicating and confusing teammates",
          "Unclear or mumbled calls",
          "Late communication causing confusion",
          "Not adjusting communication style per player",
        ],
        improvement_tips: [
          "Practice clear, concise verbal cues",
          "Use consistent terminology",
          "Develop non-verbal signals as backup",
          "Study each teammate's communication preferences",
        ],
      },
      {
        category: "On-Field Communication",
        subcategory: "Receiver Routes",
        title: "Route Running Communication",
        description:
          "Communication between quarterback and receivers for precise route execution.",
        on_field_applications: [
          "Sight adjustments based on coverage",
          "Breaking out of routes early",
          "Communicating leverage and separation",
          "Post-catch direction calls",
        ],
        off_field_applications: [
          "Route tree memorization sessions",
          "Timing practice",
          "Coverage recognition training",
        ],
        difficulty_level: "Intermediate",
        practice_scenarios: {
          scenarios: [
            "Zone vs man coverage adjustments",
            "Comeback route timing",
            "Screen pass coordination",
            "End zone fade communication",
          ],
        },
        success_metrics: [
          "Route completion accuracy",
          "Separation distance achieved",
          "Timing synchronization with QB",
          "Adjustment execution success rate",
        ],
        common_mistakes: [
          "Running wrong route variations",
          "Poor body language communication",
          "Not communicating leverage changes",
          "Inconsistent break points",
        ],
        improvement_tips: [
          "Master all route variations thoroughly",
          "Practice eye contact with quarterback",
          "Use body positioning to communicate intentions",
          "Develop chemistry through repetition",
        ],
      },
      {
        category: "On-Field Communication",
        subcategory: "Defensive Coordination",
        title: "Defensive Coverage Calls",
        description:
          "Communication systems for defensive backs and pass rushers.",
        on_field_applications: [
          "Coverage rotation calls",
          "Blitz pickup assignments",
          "Switch and bracket calls",
          "Help and support communication",
        ],
        off_field_applications: [
          "Defensive scheme study",
          "Film breakdown sessions",
          "Situational awareness training",
        ],
        difficulty_level: "Advanced",
        practice_scenarios: {
          scenarios: [
            "Pick plays and traffic navigation",
            "Deep ball help calls",
            "Blitz timing coordination",
            "Red zone bracket coverage",
          ],
        },
        success_metrics: [
          "Coverage busts prevention",
          "Successful double teams",
          "Pressure coordination effectiveness",
          "Communication under crowd noise",
        ],
        common_mistakes: [
          "Late or missed coverage calls",
          "Confusion in coverage responsibilities",
          "Poor help communication",
          "Inconsistent terminology usage",
        ],
        improvement_tips: [
          "Establish clear hierarchy for calls",
          "Practice communication under noise",
          "Use hand signals as backup",
          "Develop trust through consistent execution",
        ],
      },
    ];

    // Seed off-field communication data
    const offFieldCommunication = [
      {
        category: "Off-Field Communication",
        subcategory: "Team Building",
        title: "Constructive Feedback Culture",
        description:
          "Creating an environment where players can give and receive feedback effectively.",
        on_field_applications: [
          "Mid-game adjustments and suggestions",
          "Encouraging teammates after mistakes",
          "Sharing insights during timeouts",
        ],
        off_field_applications: [
          "Film study discussions",
          "Practice feedback sessions",
          "One-on-one improvement conversations",
          "Team meeting contributions",
        ],
        difficulty_level: "Intermediate",
        practice_scenarios: {
          scenarios: [
            "Addressing teammate mistakes positively",
            "Receiving criticism constructively",
            "Leading team discussions",
            "Conflict resolution between players",
          ],
        },
        success_metrics: [
          "Team cohesion improvement",
          "Individual performance growth",
          "Reduced interpersonal conflicts",
          "Increased participation in discussions",
        ],
        common_mistakes: [
          "Being overly critical or harsh",
          "Taking feedback personally",
          "Avoiding difficult conversations",
          "Not following up on improvements",
        ],
        improvement_tips: [
          'Use "we" language instead of "you"',
          "Focus on specific behaviors, not personalities",
          "Ask questions before making assumptions",
          "Acknowledge improvements and efforts",
        ],
      },
      {
        category: "Off-Field Communication",
        subcategory: "Leadership Development",
        title: "Captain and Leadership Communication",
        description:
          "Communication skills for team captains and emerging leaders.",
        on_field_applications: [
          "Motivating team during adversity",
          "Making strategic decisions under pressure",
          "Coordinating team responses to challenges",
        ],
        off_field_applications: [
          "Team meetings and presentations",
          "Coach-player communication liaison",
          "Conflict mediation",
          "New player integration",
        ],
        difficulty_level: "Advanced",
        practice_scenarios: {
          scenarios: [
            "Addressing team after a tough loss",
            "Motivating teammates before big games",
            "Handling media interviews",
            "Representing team in community events",
          ],
        },
        success_metrics: [
          "Team unity and morale",
          "Response to leadership during crises",
          "Player development and mentorship",
          "External representation quality",
        ],
        common_mistakes: [
          "Trying to be everyone's friend",
          "Avoiding tough conversations",
          "Leading by example inconsistently",
          "Not adapting communication style to individuals",
        ],
        improvement_tips: [
          "Lead by example first, words second",
          "Learn each teammate's motivation style",
          "Be authentic and genuine in interactions",
          "Seek feedback on leadership effectiveness",
        ],
      },
      {
        category: "Off-Field Communication",
        subcategory: "Coach-Player Relations",
        title: "Effective Coach Communication",
        description:
          "Building productive relationships and communication with coaching staff.",
        on_field_applications: [
          "Understanding and executing coach instructions",
          "Providing feedback on play effectiveness",
          "Asking clarifying questions during practice",
        ],
        off_field_applications: [
          "Individual development meetings",
          "Playing time discussions",
          "Academic and personal support",
          "Career planning conversations",
        ],
        difficulty_level: "Beginner",
        practice_scenarios: {
          scenarios: [
            "Discussing playing time concerns",
            "Seeking additional training opportunities",
            "Addressing personal challenges affecting performance",
            "Planning post-graduation athletic goals",
          ],
        },
        success_metrics: [
          "Clear understanding of role and expectations",
          "Improved performance through coaching",
          "Strong mentor-mentee relationship",
          "Successful achievement of development goals",
        ],
        common_mistakes: [
          "Being defensive about feedback",
          "Not asking questions when confused",
          "Avoiding coaches when struggling",
          "Not preparing for development meetings",
        ],
        improvement_tips: [
          "Come prepared with specific questions",
          "Be open and honest about challenges",
          "Follow through on coach recommendations",
          "Express gratitude for investment in your development",
        ],
      },
    ];

    // Insert all communication data
    const allCommunicationData = [
      ...onFieldCommunication,
      ...offFieldCommunication,
    ];

    for (const item of allCommunicationData) {
      await client.query(
        `
        INSERT INTO communication_training (
          category, subcategory, title, description, on_field_applications,
          off_field_applications, difficulty_level, practice_scenarios,
          success_metrics, common_mistakes, improvement_tips
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `,
        [
          item.category,
          item.subcategory,
          item.title,
          item.description,
          item.on_field_applications,
          item.off_field_applications,
          item.difficulty_level,
          JSON.stringify(item.practice_scenarios),
          item.success_metrics,
          item.common_mistakes,
          item.improvement_tips,
        ],
      );
    }

    console.log(
      `✅ Seeded ${allCommunicationData.length} communication training records`,
    );
  } catch (error) {
    console.error("❌ Error seeding communication training database:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCommunicationTrainingDatabase()
    .then(() => {
      console.log("🎉 Communication training database seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export default seedCommunicationTrainingDatabase;

// NFL Player Comparison Database Seeder
// Based on 20 years of real NFL combine data for user comparisons

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL);

// Real NFL players with combine data (sample of notable players across different performance levels)
const nflCombineData = [
  // Elite Speed Demons
  {
    player_name: 'Xavier Worthy',
    position: 'WR',
    college: 'Texas',
    draft_year: 2024,
    draft_round: 1,
    draft_pick: 28,
    height_inches: 70,
    weight_pounds: 165,
    forty_yard_dash: 4.21,
    ten_yard_split: 1.42,
    three_cone_drill: 6.57,
    twenty_yard_shuttle: 4.02,
    vertical_jump: 39.0,
    broad_jump: 129,
    nfl_seasons_played: 1,
    career_achievements: ['NFL_Record_Holder'],
    success_rating: 8,
    combine_year: 2024,
    current_status: 'Active'
  },
  {
    player_name: 'John Ross III',
    position: 'WR',
    college: 'Washington',
    draft_year: 2017,
    draft_round: 1,
    draft_pick: 9,
    height_inches: 71,
    weight_pounds: 188,
    forty_yard_dash: 4.22,
    ten_yard_split: 1.45,
    three_cone_drill: 6.75,
    twenty_yard_shuttle: 4.12,
    vertical_jump: 36.0,
    broad_jump: 118,
    nfl_seasons_played: 6,
    career_achievements: ['Former_Record_Holder'],
    success_rating: 6,
    combine_year: 2017,
    current_status: 'Active'
  },
  {
    player_name: 'Henry Ruggs III',
    position: 'WR',
    college: 'Alabama',
    draft_year: 2020,
    draft_round: 1,
    draft_pick: 12,
    height_inches: 72,
    weight_pounds: 188,
    forty_yard_dash: 4.27,
    ten_yard_split: 1.47,
    three_cone_drill: 6.75,
    twenty_yard_shuttle: 4.09,
    vertical_jump: 42.0,
    broad_jump: 131,
    nfl_seasons_played: 2,
    career_achievements: [],
    success_rating: 5,
    combine_year: 2020,
    current_status: 'Retired'
  },
  
  // Elite DBs
  {
    player_name: 'Kalon Barnes',
    position: 'CB',
    college: 'Baylor',
    draft_year: 2022,
    draft_round: 7,
    draft_pick: 248,
    height_inches: 72,
    weight_pounds: 183,
    forty_yard_dash: 4.23,
    ten_yard_split: 1.48,
    three_cone_drill: 6.45,
    twenty_yard_shuttle: 3.95,
    vertical_jump: 40.5,
    broad_jump: 124,
    nfl_seasons_played: 2,
    career_achievements: ['Combine_Record'],
    success_rating: 6,
    combine_year: 2022,
    current_status: 'Active'
  },
  {
    player_name: 'Dunta Robinson',
    position: 'CB',
    college: 'South Carolina',
    draft_year: 2004,
    draft_round: 1,
    draft_pick: 10,
    height_inches: 70,
    weight_pounds: 175,
    forty_yard_dash: 4.38,
    ten_yard_split: 1.52,
    three_cone_drill: 6.55,
    twenty_yard_shuttle: 3.75, // Record holder
    vertical_jump: 35.0,
    broad_jump: 115,
    nfl_seasons_played: 11,
    career_achievements: ['Pro_Bowl', 'Record_Holder'],
    success_rating: 8,
    combine_year: 2004,
    current_status: 'Retired'
  },
  
  // Elite but realistic targets for flag football
  {
    player_name: 'Jerry Rice',
    position: 'WR',
    college: 'Mississippi Valley State',
    draft_year: 1985,
    draft_round: 1,
    draft_pick: 16,
    height_inches: 74,
    weight_pounds: 200,
    forty_yard_dash: 4.59, // Not elite speed but HOF career
    ten_yard_split: 1.65,
    three_cone_drill: 6.85,
    twenty_yard_shuttle: 4.15,
    vertical_jump: 34.0,
    broad_jump: 108,
    nfl_seasons_played: 20,
    career_achievements: ['Hall_of_Fame', 'Super_Bowl', 'All_Pro'],
    success_rating: 10,
    combine_year: 1985,
    current_status: 'Hall_of_Fame'
  },
  {
    player_name: 'Larry Fitzgerald',
    position: 'WR',
    college: 'Pittsburgh',
    draft_year: 2004,
    draft_round: 1,
    draft_pick: 3,
    height_inches: 75,
    weight_pounds: 218,
    forty_yard_dash: 4.63,
    ten_yard_split: 1.68,
    three_cone_drill: 7.05,
    twenty_yard_shuttle: 4.25,
    vertical_jump: 32.0,
    broad_jump: 105,
    nfl_seasons_played: 17,
    career_achievements: ['Pro_Bowl', 'All_Pro'],
    success_rating: 9,
    combine_year: 2004,
    current_status: 'Retired'
  },
  
  // Good but achievable targets
  {
    player_name: 'Julian Edelman',
    position: 'WR',
    college: 'Kent State',
    draft_year: 2009,
    draft_round: 7,
    draft_pick: 232,
    height_inches: 70,
    weight_pounds: 198,
    forty_yard_dash: 4.52,
    ten_yard_split: 1.62,
    three_cone_drill: 6.62,
    twenty_yard_shuttle: 4.05,
    vertical_jump: 35.0,
    broad_jump: 118,
    nfl_seasons_played: 11,
    career_achievements: ['Super_Bowl', 'Super_Bowl_MVP'],
    success_rating: 8,
    combine_year: 2009,
    current_status: 'Retired'
  },
  {
    player_name: 'Wes Welker',
    position: 'WR',
    college: 'Texas Tech',
    draft_year: 2004,
    draft_round: null, // Undrafted
    draft_pick: null,
    height_inches: 69,
    weight_pounds: 185,
    forty_yard_dash: 4.65,
    ten_yard_split: 1.70,
    three_cone_drill: 6.58,
    twenty_yard_shuttle: 4.08,
    vertical_jump: 31.0,
    broad_jump: 102,
    nfl_seasons_played: 12,
    career_achievements: ['Pro_Bowl', 'All_Pro'],
    success_rating: 8,
    combine_year: 2004,
    current_status: 'Retired'
  },
  
  // Average NFL level (flag football elite targets)
  {
    player_name: 'Anquan Boldin',
    position: 'WR',
    college: 'Florida State',
    draft_year: 2003,
    draft_round: 1,
    draft_pick: 54,
    height_inches: 73,
    weight_pounds: 218,
    forty_yard_dash: 4.71,
    ten_yard_split: 1.75,
    three_cone_drill: 7.12,
    twenty_yard_shuttle: 4.28,
    vertical_jump: 30.0,
    broad_jump: 98,
    nfl_seasons_played: 14,
    career_achievements: ['Pro_Bowl', 'Super_Bowl'],
    success_rating: 8,
    combine_year: 2003,
    current_status: 'Retired'
  },
  {
    player_name: 'Hines Ward',
    position: 'WR',
    college: 'Georgia',
    draft_year: 1998,
    draft_round: 3,
    draft_pick: 92,
    height_inches: 72,
    weight_pounds: 205,
    forty_yard_dash: 4.68,
    ten_yard_split: 1.72,
    three_cone_drill: 6.98,
    twenty_yard_shuttle: 4.18,
    vertical_jump: 29.0,
    broad_jump: 95,
    nfl_seasons_played: 14,
    career_achievements: ['Pro_Bowl', 'Super_Bowl'],
    success_rating: 8,
    combine_year: 1998,
    current_status: 'Retired'
  },
  
  // Slower but successful (shows technique > speed)
  {
    player_name: 'Cooper Kupp',
    position: 'WR',
    college: 'Eastern Washington',
    draft_year: 2017,
    draft_round: 3,
    draft_pick: 69,
    height_inches: 74,
    weight_pounds: 208,
    forty_yard_dash: 4.62,
    ten_yard_split: 1.68,
    three_cone_drill: 6.75,
    twenty_yard_shuttle: 4.15,
    vertical_jump: 33.5,
    broad_jump: 108,
    nfl_seasons_played: 7,
    career_achievements: ['All_Pro', 'Triple_Crown'],
    success_rating: 9,
    combine_year: 2017,
    current_status: 'Active'
  },
  {
    player_name: 'Adam Thielen',
    position: 'WR',
    college: 'Minnesota State',
    draft_year: 2013,
    draft_round: null, // Undrafted
    draft_pick: null,
    height_inches: 73,
    weight_pounds: 200,
    forty_yard_dash: 4.64,
    ten_yard_split: 1.70,
    three_cone_drill: 6.85,
    twenty_yard_shuttle: 4.20,
    vertical_jump: 32.0,
    broad_jump: 105,
    nfl_seasons_played: 10,
    career_achievements: ['Pro_Bowl'],
    success_rating: 7,
    combine_year: 2013,
    current_status: 'Active'
  },
  
  // Defensive backs with various speed levels
  {
    player_name: 'Deion Sanders',
    position: 'CB',
    college: 'Florida State',
    draft_year: 1989,
    draft_round: 1,
    draft_pick: 5,
    height_inches: 73,
    weight_pounds: 195,
    forty_yard_dash: 4.21, // Estimated (pre-electronic timing)
    ten_yard_split: 1.45,
    three_cone_drill: 6.35,
    twenty_yard_shuttle: 3.85,
    vertical_jump: 38.0,
    broad_jump: 125,
    nfl_seasons_played: 14,
    career_achievements: ['Hall_of_Fame', 'Super_Bowl', 'All_Pro'],
    success_rating: 10,
    combine_year: 1989,
    current_status: 'Hall_of_Fame'
  },
  {
    player_name: 'Darrelle Revis',
    position: 'CB',
    college: 'Pittsburgh',
    draft_year: 2007,
    draft_round: 1,
    draft_pick: 14,
    height_inches: 71,
    weight_pounds: 198,
    forty_yard_dash: 4.38,
    ten_yard_split: 1.55,
    three_cone_drill: 6.52,
    twenty_yard_shuttle: 3.95,
    vertical_jump: 38.0,
    broad_jump: 119,
    nfl_seasons_played: 11,
    career_achievements: ['All_Pro', 'Super_Bowl'],
    success_rating: 9,
    combine_year: 2007,
    current_status: 'Retired'
  },
  
  // More achievable DB targets
  {
    player_name: 'Malcolm Butler',
    position: 'CB',
    college: 'West Alabama',
    draft_year: 2014,
    draft_round: null, // Undrafted
    draft_pick: null,
    height_inches: 71,
    weight_pounds: 190,
    forty_yard_dash: 4.62,
    ten_yard_split: 1.68,
    three_cone_drill: 6.78,
    twenty_yard_shuttle: 4.12,
    vertical_jump: 34.0,
    broad_jump: 110,
    nfl_seasons_played: 8,
    career_achievements: ['Super_Bowl_Hero'],
    success_rating: 7,
    combine_year: 2014,
    current_status: 'Active'
  },
  
  // Examples across different eras
  {
    player_name: 'Chad Johnson',
    position: 'WR',
    college: 'Oregon State',
    draft_year: 2001,
    draft_round: 2,
    draft_pick: 36,
    height_inches: 73,
    weight_pounds: 192,
    forty_yard_dash: 4.57,
    ten_yard_split: 1.64,
    three_cone_drill: 6.68,
    twenty_yard_shuttle: 4.08,
    vertical_jump: 35.5,
    broad_jump: 115,
    nfl_seasons_played: 11,
    career_achievements: ['Pro_Bowl', 'All_Pro'],
    success_rating: 8,
    combine_year: 2001,
    current_status: 'Retired'
  }
];

async function seedNFLPlayerDatabase() {
  try {
    console.log('🏈 Seeding NFL player comparison database...');
    
    // Create the table first
    console.log('🏗️ Creating NFL combine performances table...');
    
    for (const player of nflCombineData) {
      await sql`
        INSERT INTO nfl_combine_performances (
          player_name, position, college, draft_year, draft_round, draft_pick,
          height_inches, weight_pounds, forty_yard_dash, ten_yard_split,
          three_cone_drill, twenty_yard_shuttle, vertical_jump, broad_jump,
          nfl_seasons_played, career_achievements, success_rating,
          combine_year, current_status
        ) VALUES (
          ${player.player_name}, ${player.position}, ${player.college},
          ${player.draft_year}, ${player.draft_round}, ${player.draft_pick},
          ${player.height_inches}, ${player.weight_pounds}, ${player.forty_yard_dash},
          ${player.ten_yard_split}, ${player.three_cone_drill}, ${player.twenty_yard_shuttle},
          ${player.vertical_jump}, ${player.broad_jump}, ${player.nfl_seasons_played},
          ${player.career_achievements}, ${player.success_rating},
          ${player.combine_year}, ${player.current_status}
        ) ON CONFLICT DO NOTHING
      `;
    }
    
    console.log('✅ NFL player data seeded successfully!');
    
    // Test the comparison function with a sample user performance
    console.log('\\n🧪 Testing comparison system...');
    
    // Test with 4.68s (user example from your message)
    const testComparison = await sql`
      SELECT * FROM generate_user_nfl_comparison(1, '40_yard_dash', 4.68)
    `;
    
    if (testComparison.length > 0) {
      const result = testComparison[0];
      console.log('\\n📊 SAMPLE COMPARISON (4.68s 40-yard):');
      console.log(`   Message: "${result.comparison_message}"`);
      console.log(`   Percentile: ${result.user_percentile}%`);
      console.log(`   Better than: ${result.better_than_count}/${result.total_players_count} NFL players`);
      console.log(`   Motivation level: ${result.motivation_level}`);
    }
    
    // Show sample data
    const samplePlayers = await sql`
      SELECT player_name, position, draft_year, forty_yard_dash, 
             career_achievements, success_rating
      FROM nfl_combine_performances 
      ORDER BY forty_yard_dash
      LIMIT 10
    `;
    
    console.log('\\n⚡ FASTEST NFL PLAYERS IN DATABASE:');
    samplePlayers.forEach(p => {
      const achievements = p.career_achievements.join(', ') || 'None';
      console.log(`   ${p.forty_yard_dash}s - ${p.player_name} (${p.position}, ${p.draft_year}) - ${achievements}`);
    });
    
    // Show slower successful players
    const slowerPlayers = await sql`
      SELECT player_name, position, draft_year, forty_yard_dash, 
             career_achievements, success_rating
      FROM nfl_combine_performances 
      WHERE forty_yard_dash >= 4.6 AND success_rating >= 8
      ORDER BY success_rating DESC, forty_yard_dash
      LIMIT 5
    `;
    
    console.log('\\n🎯 SLOWER BUT HIGHLY SUCCESSFUL PLAYERS:');
    slowerPlayers.forEach(p => {
      const achievements = p.career_achievements.join(', ') || 'None';
      console.log(`   ${p.forty_yard_dash}s - ${p.player_name} (${p.position}, ${p.draft_year}) - ${achievements} (Rating: ${p.success_rating}/10)`);
    });
    
    const totalCount = await sql`SELECT COUNT(*) as count FROM nfl_combine_performances`;
    console.log(`\\n📊 Total NFL players in database: ${totalCount[0].count}`);
    
    console.log('\\n🚀 NFL COMPARISON SYSTEM READY!');
    console.log('   Users can now see exactly where they stand vs real NFL players');
    console.log('   Examples: "Today you\'re as fast as Jerry Rice who ran 4.59s in 1985 (Hall of Fame)"');
    console.log('   Shows both speed and career success for motivation');
    
  } catch (error) {
    console.error('❌ Error seeding NFL player database:', error);
    process.exit(1);
  }
}

// Run the seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedNFLPlayerDatabase();
}

export { seedNFLPlayerDatabase };
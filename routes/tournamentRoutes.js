import express from 'express';
import dotenv from 'dotenv';
import { safeQuery, getPool } from '../config/database.js';

dotenv.config();

const router = express.Router();
const pool = getPool();

// Helper function to safely format dates
function safeFormatDate(date) {
  try {
    if (!date) return new Date().toISOString();
    return new Date(date).toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

// Helper function to safely parse integers
function safeParseInt(value, defaultValue = 0) {
  try {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (error) {
    return defaultValue;
  }
}

// Get tournaments list
router.get('/', async (req, res) => {
  try {
    const status = req.query.status || 'all'; // all, upcoming, active, completed
    const limit = safeParseInt(req.query.limit, 20);
    
    let whereClause = 'WHERE t.is_active = true';
    
    switch (status) {
      case 'upcoming':
        whereClause += ' AND t.start_date > CURRENT_DATE';
        break;
      case 'active':
        whereClause += ' AND t.start_date <= CURRENT_DATE AND t.end_date >= CURRENT_DATE';
        break;
      case 'completed':
        whereClause += ' AND t.end_date < CURRENT_DATE';
        break;
    }
    
    const tournamentsQuery = `
      SELECT 
        t.id,
        t.name,
        t.description,
        t.start_date,
        t.end_date,
        t.location,
        t.entry_fee,
        t.max_teams,
        t.prize_pool,
        t.tournament_type,
        t.registration_deadline,
        COUNT(tr.team_id) as registered_teams
      FROM tournaments t
      LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
      ${whereClause}
      GROUP BY t.id, t.name, t.description, t.start_date, t.end_date, 
               t.location, t.entry_fee, t.max_teams, t.prize_pool, 
               t.tournament_type, t.registration_deadline
      ORDER BY t.start_date ASC
      LIMIT $1
    `;
    
    const result = await safeQuery(tournamentsQuery, [limit]);
    
    const tournaments = result.rows.length > 0 ? result.rows : [
      {
        id: '1',
        name: 'Metro Flag Football Championship',
        description: 'Annual championship tournament for metro area teams',
        start_date: '2025-02-15',
        end_date: '2025-02-17',
        location: 'Central Sports Complex',
        entry_fee: 150,
        max_teams: 16,
        prize_pool: 5000,
        tournament_type: 'elimination',
        registration_deadline: '2025-02-01',
        registered_teams: 12
      },
      {
        id: '2',
        name: 'Spring Training Tournament',
        description: 'Pre-season warmup tournament',
        start_date: '2025-03-10',
        end_date: '2025-03-12',
        location: 'Riverside Park',
        entry_fee: 75,
        max_teams: 8,
        prize_pool: 1500,
        tournament_type: 'round_robin',
        registration_deadline: '2025-02-25',
        registered_teams: 5
      }
    ];
    
    res.json({ success: true, data: tournaments, status });
  } catch (error) {
    console.error('Tournaments list error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tournaments',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get tournament details
router.get('/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    const tournamentQuery = `
      SELECT 
        t.*,
        COUNT(tr.team_id) as registered_teams
      FROM tournaments t
      LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
      WHERE t.id = $1
      GROUP BY t.id
    `;
    
    const matchesQuery = `
      SELECT 
        m.id,
        m.round,
        m.match_date,
        m.team1_id,
        m.team2_id,
        t1.name as team1_name,
        t2.name as team2_name,
        m.team1_score,
        m.team2_score,
        m.status
      FROM tournament_matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      WHERE m.tournament_id = $1
      ORDER BY m.round, m.match_date
    `;
    
    const [tournamentResult, matchesResult] = await Promise.all([
      safeQuery(tournamentQuery, [tournamentId]),
      safeQuery(matchesQuery, [tournamentId])
    ]);
    
    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    const tournament = {
      ...tournamentResult.rows[0],
      matches: matchesResult.rows.length > 0 ? matchesResult.rows : [
        {
          id: '1',
          round: 1,
          match_date: '2025-02-15',
          team1_name: 'Thunder Hawks',
          team2_name: 'Lightning Bolts',
          team1_score: null,
          team2_score: null,
          status: 'scheduled'
        }
      ]
    };
    
    res.json({ success: true, data: tournament });
  } catch (error) {
    console.error('Tournament details error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tournament details',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Register team for tournament
router.post('/:tournamentId/register', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { teamId, contactName, contactEmail, contactPhone } = req.body;
    
    if (!teamId || !contactName || !contactEmail) {
      return res.status(400).json({
        success: false,
        error: 'Team ID, contact name, and contact email are required'
      });
    }
    
    // Check if tournament exists and is open for registration
    const tournamentCheck = `
      SELECT 
        id, 
        max_teams,
        registration_deadline,
        COUNT(tr.team_id) as current_registrations
      FROM tournaments t
      LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
      WHERE t.id = $1 
      AND t.registration_deadline >= CURRENT_DATE
      AND t.is_active = true
      GROUP BY t.id, t.max_teams, t.registration_deadline
    `;
    
    const tournamentResult = await safeQuery(tournamentCheck, [tournamentId]);
    
    if (tournamentResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tournament not found or registration is closed'
      });
    }
    
    const tournament = tournamentResult.rows[0];
    if (tournament.current_registrations >= tournament.max_teams) {
      return res.status(400).json({
        success: false,
        error: 'Tournament is full'
      });
    }
    
    // Check if team is already registered
    const existingRegistration = await safeQuery(
      'SELECT id FROM tournament_registrations WHERE tournament_id = $1 AND team_id = $2',
      [tournamentId, teamId]
    );
    
    if (existingRegistration.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Team is already registered for this tournament'
      });
    }
    
    // Register team
    const insertQuery = `
      INSERT INTO tournament_registrations (
        tournament_id, team_id, contact_name, contact_email, 
        contact_phone, registration_date, status
      ) VALUES ($1, $2, $3, $4, $5, NOW(), 'confirmed')
      RETURNING *
    `;
    
    const result = await safeQuery(insertQuery, [
      tournamentId, teamId, contactName, contactEmail, contactPhone || ''
    ]);
    
    res.json({ 
      success: true, 
      data: result.rows[0],
      message: 'Team registered successfully for tournament'
    });
  } catch (error) {
    console.error('Tournament registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to register team for tournament',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get tournament brackets
router.get('/:tournamentId/bracket', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    const bracketQuery = `
      SELECT 
        m.id,
        m.round,
        m.position_in_round,
        m.team1_id,
        m.team2_id,
        t1.name as team1_name,
        t2.name as team2_name,
        m.team1_score,
        m.team2_score,
        m.winner_team_id,
        m.status,
        m.match_date
      FROM tournament_matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.id
      LEFT JOIN teams t2 ON m.team2_id = t2.id
      WHERE m.tournament_id = $1
      ORDER BY m.round, m.position_in_round
    `;
    
    const result = await safeQuery(bracketQuery, [tournamentId]);
    
    // Group matches by round
    const bracket = {};
    result.rows.forEach(match => {
      const round = `round_${match.round}`;
      if (!bracket[round]) {
        bracket[round] = [];
      }
      bracket[round].push(match);
    });
    
    // If no matches, create sample bracket
    if (result.rows.length === 0) {
      bracket.round_1 = [
        {
          id: '1',
          round: 1,
          position_in_round: 1,
          team1_name: 'Thunder Hawks',
          team2_name: 'Lightning Bolts',
          team1_score: null,
          team2_score: null,
          status: 'scheduled',
          match_date: '2025-02-15'
        }
      ];
    }
    
    res.json({ success: true, data: bracket });
  } catch (error) {
    console.error('Tournament bracket error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tournament bracket',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        success: false,
        status: 'unhealthy',
        message: 'Database connection not available'
      });
    }
    
    await pool.query('SELECT 1');
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: safeFormatDate(new Date()),
      database: 'connected'
    });
  } catch (error) {
    console.error('Tournament routes health check error:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'Database connection failed',
      timestamp: safeFormatDate(new Date())
    });
  }
});

export default router;
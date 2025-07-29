import React, { useState } from 'react';
import SponsorBanner from '../components/SponsorBanner';
import { 
  TrophyIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  BeakerIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import AICoachMessage from '../components/AICoachMessage';

const TournamentsPage = () => {
  const [activeTab, setActiveTab] = useState('schedule');

  // Tournament data
  const [tournaments] = useState([
    {
      id: 1,
      name: '🏆 Championship Tournament',
      date: 'March 15-16, 2024',
      location: 'Central Sports Complex',
      entryFee: 150,
      status: 'registered',
      teams: 16,
      prizePool: 5000,
      format: 'Double Elimination',
      registrationDeadline: 'March 10, 2024'
    },
    {
      id: 2,
      name: '🥇 Spring League',
      date: 'April 1 - May 15, 2024',
      location: 'Multiple venues',
      entryFee: 200,
      status: 'pending',
      teams: 24,
      prizePool: 8000,
      format: 'League + Playoffs',
      registrationDeadline: 'March 25, 2024'
    },
    {
      id: 3,
      name: '🏅 Summer Classic',
      date: 'July 20-21, 2024',
      location: 'Memorial Stadium',
      entryFee: 175,
      status: 'not-registered',
      teams: 12,
      prizePool: 3000,
      format: 'Single Elimination',
      registrationDeadline: 'July 10, 2024'
    }
  ]);

  // Tournament brackets
  const [brackets] = useState({
    championship: {
      quarterfinals: [
        { team1: 'Hawks', team2: 'Eagles', score1: 28, score2: 21, winner: 'Hawks' },
        { team1: 'Lions', team2: 'Bears', score1: 35, score2: 14, winner: 'Lions' },
        { team1: 'Tigers', team2: 'Wolves', score1: 24, score2: 31, winner: 'Wolves' },
        { team1: 'Falcons', team2: 'Ravens', score1: 42, score2: 28, winner: 'Falcons' }
      ],
      semifinals: [
        { team1: 'Hawks', team2: 'Lions', score1: 31, score2: 28, winner: 'Hawks' },
        { team1: 'Wolves', team2: 'Falcons', score1: 21, score2: 35, winner: 'Falcons' }
      ],
      championship: [
        { team1: 'Hawks', team2: 'Falcons', score1: 28, score2: 35, winner: 'Falcons' }
      ]
    }
  });

  // Team rankings
  const [teamRankings] = useState([
    { rank: 1, team: 'Falcons', wins: 8, losses: 1, pointsFor: 245, pointsAgainst: 156, streak: 'W5' },
    { rank: 2, team: 'Hawks', wins: 7, losses: 2, pointsFor: 231, pointsAgainst: 178, streak: 'W3' },
    { rank: 3, team: 'Lions', wins: 6, losses: 3, pointsFor: 198, pointsAgainst: 167, streak: 'L1' },
    { rank: 4, team: 'Wolves', wins: 6, losses: 3, pointsFor: 189, pointsAgainst: 172, streak: 'W2' },
    { rank: 5, team: 'Eagles', wins: 5, losses: 4, pointsFor: 176, pointsAgainst: 165, streak: 'L2' },
    { rank: 6, team: 'Bears', wins: 4, losses: 5, pointsFor: 145, pointsAgainst: 189, streak: 'L1' },
    { rank: 7, team: 'Tigers', wins: 3, losses: 6, pointsFor: 134, pointsAgainst: 198, streak: 'L3' },
    { rank: 8, team: 'Ravens', wins: 2, losses: 7, pointsFor: 123, pointsAgainst: 201, streak: 'L4' }
  ]);

  // Performance analytics
  const [performanceAnalytics] = useState({
    teamStats: {
      totalGames: 36,
      averageScore: 24.5,
      highestScore: 42,
      lowestScore: 7,
      totalTouchdowns: 156,
      totalInterceptions: 23
    },
    playerStats: {
      topPasser: { name: 'Mike Johnson', yards: 1245, tds: 18, ints: 3 },
      topReceiver: { name: 'Chris Wilson', catches: 45, yards: 678, tds: 8 },
      topRusher: { name: 'Alex Davis', carries: 89, yards: 456, tds: 6 }
    }
  });

  // Tournament history
  const [tournamentHistory] = useState([
    { year: 2023, tournament: 'Fall Championship', result: 'Champions', record: '8-1' },
    { year: 2022, tournament: 'Summer League', result: 'Runner-up', record: '7-2' },
    { year: 2021, tournament: 'Spring Classic', result: 'Semifinals', record: '5-3' }
  ]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'registered': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'not-registered': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'registered': return '✅';
      case 'pending': return '⏳';
      case 'not-registered': return '📝';
      default: return '❓';
    }
  };

  return (
    <div className="tournaments-page">
      <h1 className="flex items-center gap-2">
        <TrophyIcon className="h-8 w-8 text-yellow-500" />
        Tournaments
      </h1>
      
      {/* Top Sponsor Banner */}
      <SponsorBanner 
        position="top" 
        size="wide" 
        isPremium={false}
        sponsor={{
          name: 'LaprimaFit',
          logo: <UserGroupIcon className="h-6 w-6" />,
          message: 'Tournament preparation gear',
          cta: 'Shop Now',
          link: '#'
        }}
      />
      
      {/* AI Coach Message */}
      <AICoachMessage />
      
      {/* Tournament Overview */}
      <div className="tournament-overview">
        <h2>Tournament Overview</h2>
        <div className="tournament-cards">
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="tournament-card">
              <div className="tournament-header">
                <h3>{tournament.name}</h3>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(tournament.status) }}
                >
                  {getStatusIcon(tournament.status)} {tournament.status.replace('-', ' ')}
                </span>
              </div>
              
              <div className="tournament-details">
                <div className="detail-item">
                  <span className="label">Date:</span>
                  <span className="value">{tournament.date}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Location:</span>
                  <span className="value">{tournament.location}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Entry Fee:</span>
                  <span className="value">${tournament.entryFee}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Teams:</span>
                  <span className="value">{tournament.teams}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Prize Pool:</span>
                  <span className="value">${tournament.prizePool.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Format:</span>
                  <span className="value">{tournament.format}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Deadline:</span>
                  <span className="value">{tournament.registrationDeadline}</span>
                </div>
              </div>
              
              <div className="tournament-actions">
                <button className="btn-primary">View Details</button>
                <button className="btn-secondary">Register Now</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tournament Brackets */}
      <div className="tournament-brackets">
        <h2>🏆 Championship Tournament Brackets</h2>
        
        <div className="brackets-container">
          <div className="bracket-round">
            <h3>Quarterfinals</h3>
            {brackets.championship.quarterfinals.map((game, index) => (
              <div key={index} className="bracket-game">
                <div className="team team1">
                  <span className="team-name">{game.team1}</span>
                  <span className="score">{game.score1}</span>
                </div>
                <div className="team team2">
                  <span className="team-name">{game.team2}</span>
                  <span className="score">{game.score2}</span>
                </div>
                <div className="winner">
                  Winner: {game.winner}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bracket-round">
            <h3>Semifinals</h3>
            {brackets.championship.semifinals.map((game, index) => (
              <div key={index} className="bracket-game">
                <div className="team team1">
                  <span className="team-name">{game.team1}</span>
                  <span className="score">{game.score1}</span>
                </div>
                <div className="team team2">
                  <span className="team-name">{game.team2}</span>
                  <span className="score">{game.score2}</span>
                </div>
                <div className="winner">
                  Winner: {game.winner}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bracket-round">
            <h3>Championship</h3>
            {brackets.championship.championship.map((game, index) => (
              <div key={index} className="bracket-game championship-game">
                <div className="team team1">
                  <span className="team-name">{game.team1}</span>
                  <span className="score">{game.score1}</span>
                </div>
                <div className="team team2">
                  <span className="team-name">{game.team2}</span>
                  <span className="score">{game.score2}</span>
                </div>
                <div className="winner champion">
                  🏆 Champion: {game.winner}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Team Rankings */}
      <div className="team-rankings">
        <h2>📊 Team Rankings</h2>
        
        <div className="rankings-table">
          <div className="table-header">
            <div className="header-cell">Rank</div>
            <div className="header-cell">Team</div>
            <div className="header-cell">W</div>
            <div className="header-cell">L</div>
            <div className="header-cell">PF</div>
            <div className="header-cell">PA</div>
            <div className="header-cell">Streak</div>
          </div>
          
          {teamRankings.map((team) => (
            <div key={team.rank} className="table-row">
              <div className="cell rank">{team.rank}</div>
              <div className="cell team">{team.team}</div>
              <div className="cell wins">{team.wins}</div>
              <div className="cell losses">{team.losses}</div>
              <div className="cell points-for">{team.pointsFor}</div>
              <div className="cell points-against">{team.pointsAgainst}</div>
              <div className="cell streak">{team.streak}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Performance Analytics */}
      <div className="performance-analytics">
        <h2>📈 Performance Analytics</h2>
        
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Team Statistics</h3>
            <div className="stats-list">
              <div className="stat-item">
                <span className="stat-label">Total Games:</span>
                <span className="stat-value">{performanceAnalytics.teamStats.totalGames}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average Score:</span>
                <span className="stat-value">{performanceAnalytics.teamStats.averageScore}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Highest Score:</span>
                <span className="stat-value">{performanceAnalytics.teamStats.highestScore}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Touchdowns:</span>
                <span className="stat-value">{performanceAnalytics.teamStats.totalTouchdowns}</span>
              </div>
            </div>
          </div>
          
          <div className="analytics-card">
            <h3>Player Leaders</h3>
            <div className="player-leaders">
              <div className="leader-section">
                <h4>Top Passer</h4>
                <div className="leader-info">
                  <span className="player-name">{performanceAnalytics.playerStats.topPasser.name}</span>
                  <span className="player-stats">
                    {performanceAnalytics.playerStats.topPasser.yards} yds, 
                    {performanceAnalytics.playerStats.topPasser.tds} TDs, 
                    {performanceAnalytics.playerStats.topPasser.ints} INTs
                  </span>
                </div>
              </div>
              
              <div className="leader-section">
                <h4>Top Receiver</h4>
                <div className="leader-info">
                  <span className="player-name">{performanceAnalytics.playerStats.topReceiver.name}</span>
                  <span className="player-stats">
                    {performanceAnalytics.playerStats.topReceiver.catches} catches, 
                    {performanceAnalytics.playerStats.topReceiver.yards} yds, 
                    {performanceAnalytics.playerStats.topReceiver.tds} TDs
                  </span>
                </div>
              </div>
              
              <div className="leader-section">
                <h4>Top Rusher</h4>
                <div className="leader-info">
                  <span className="player-name">{performanceAnalytics.playerStats.topRusher.name}</span>
                  <span className="player-stats">
                    {performanceAnalytics.playerStats.topRusher.carries} carries, 
                    {performanceAnalytics.playerStats.topRusher.yards} yds, 
                    {performanceAnalytics.playerStats.topRusher.tds} TDs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tournament History */}
      <div className="tournament-history">
        <h2>📚 Tournament History</h2>
        
        <div className="history-timeline">
          {tournamentHistory.map((tournament, index) => (
            <div key={index} className="history-item">
              <div className="history-year">{tournament.year}</div>
              <div className="history-details">
                <h4>{tournament.tournament}</h4>
                <div className="result">{tournament.result}</div>
                <div className="record">Record: {tournament.record}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tournament Navigation Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'schedule' ? 'active' : ''}
          onClick={() => setActiveTab('schedule')}
        >
          Tournament Schedule
        </button>
        <button 
          className={activeTab === 'nutrition' ? 'active' : ''}
          onClick={() => setActiveTab('nutrition')}
        >
          Nutrition Plan
        </button>
        <button 
          className={activeTab === 'registration' ? 'active' : ''}
          onClick={() => setActiveTab('registration')}
        >
          Registration
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'schedule' && (
        <div className="tab-content">
          <h2>Tournament Schedule & Nutrition Plan</h2>
          <div className="tournament-schedule-grid">
            <div className="schedule-section">
              <h4>🏆 Championship Tournament</h4>
              <div className="day-schedule">
                <h5>Day 1 - Friday</h5>
                <div className="game-item">
                  <div className="game-time">9:00 AM</div>
                  <div className="game-details">Hawks vs Eagles - Pool Play</div>
                </div>
                <div className="game-item">
                  <div className="game-time">11:00 AM</div>
                  <div className="game-details">Lions vs Bears - Pool Play</div>
                </div>
                <div className="game-item">
                  <div className="game-time">2:00 PM</div>
                  <div className="game-details">Hawks vs Lions - Pool Play</div>
                </div>
              </div>
              
              <div className="day-schedule">
                <h5>Day 2 - Saturday</h5>
                <div className="game-item">
                  <div className="game-time">9:00 AM</div>
                  <div className="game-details">Quarterfinals</div>
                </div>
                <div className="game-item">
                  <div className="game-time">1:00 PM</div>
                  <div className="game-details">Semifinals</div>
                </div>
                <div className="game-item">
                  <div className="game-time">4:00 PM</div>
                  <div className="game-details">Championship Game</div>
                </div>
              </div>
            </div>
            
            <div className="nutrition-section">
              <h4>🍎 Tournament Nutrition Plan</h4>
              <div className="nutrition-timeline">
                <h5>Pre-Game Day</h5>
                <div className="nutrition-item">
                  <div className="nutrition-time">7:00 AM</div>
                  <div className="nutrition-details">
                    <div>Breakfast</div>
                    <div>Oatmeal with berries and protein powder</div>
                    <div>Hydration: 16oz water</div>
                  </div>
                </div>
                <div className="nutrition-item">
                  <div className="nutrition-time">10:00 AM</div>
                  <div className="nutrition-details">
                    <div>Snack</div>
                    <div>Banana with almond butter</div>
                    <div>Hydration: 8oz sports drink</div>
                  </div>
                </div>
                <div className="nutrition-item">
                  <div className="nutrition-time">12:30 PM</div>
                  <div className="nutrition-details">
                    <div>Lunch</div>
                    <div>Grilled chicken with rice and vegetables</div>
                    <div>Hydration: 16oz water</div>
                  </div>
                </div>
              </div>
              
              <div className="nutrition-timeline">
                <h5>Game Day</h5>
                <div className="nutrition-item">
                  <div className="nutrition-time">6:00 AM</div>
                  <div className="nutrition-details">
                    <div>Pre-Game Meal</div>
                    <div>Whole grain toast with eggs and avocado</div>
                    <div>Hydration: 20oz water</div>
                  </div>
                </div>
                <div className="nutrition-item">
                  <div className="nutrition-time">8:30 AM</div>
                  <div className="nutrition-details">
                    <div>Pre-Game Snack</div>
                    <div>Energy bar and sports drink</div>
                    <div>Hydration: 12oz sports drink</div>
                  </div>
                </div>
                <div className="nutrition-item">
                  <div className="nutrition-time">10:00 AM</div>
                  <div className="nutrition-details">
                    <div>During Game</div>
                    <div>Electrolyte replacement every 15 minutes</div>
                    <div>Hydration: 8oz every 15 minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'nutrition' && (
        <div className="tab-content">
          <h2>Detailed Nutrition Plan</h2>
          <div className="nutrition-details">
            <div className="nutrition-card">
              <h3>Pre-Tournament Week</h3>
              <div>Carbohydrate loading strategy</div>
              <div>Hydration optimization</div>
              <div>Protein timing for muscle recovery</div>
            </div>
            <div className="nutrition-card">
              <h3>Game Day Nutrition</h3>
              <div>Pre-game meal timing (3-4 hours before)</div>
              <div>Pre-game snack (1-2 hours before)</div>
              <div>During game hydration strategy</div>
            </div>
            <div className="nutrition-card">
              <h3>Recovery Nutrition</h3>
              <div>Post-game protein shake (within 30 minutes)</div>
              <div>Carbohydrate replenishment</div>
              <div>Electrolyte replacement</div>
            </div>
            <div className="nutrition-card">
              <h3>Supplements</h3>
              <div>Creatine monohydrate</div>
              <div>BCAAs for muscle preservation</div>
              <div>Electrolyte tablets</div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'registration' && (
        <div className="tab-content">
          <h2>Tournament Registration</h2>
          <div className="registration-info">
            <div className="registration-card">
              <h3>🏆 Championship Tournament</h3>
              <div>Date: March 15-16, 2024</div>
              <div>Location: Central Sports Complex</div>
              <div>Entry Fee: $150 per team</div>
              <div>Registration Deadline: March 10, 2024</div>
              <div>Status: ✅ Registered</div>
            </div>
            
            <div className="registration-card">
              <h3>🥇 Spring League</h3>
              <div>Date: April 1 - May 15, 2024</div>
              <div>Location: Multiple venues</div>
              <div>Entry Fee: $200 per team</div>
              <div>Registration Deadline: March 25, 2024</div>
              <div>Status: ⏳ Pending</div>
            </div>
            
            <div className="registration-card">
              <h3>🏅 Summer Classic</h3>
              <div>Date: July 20-21, 2024</div>
              <div>Location: Memorial Stadium</div>
              <div>Entry Fee: $175 per team</div>
              <div>Registration Deadline: July 10, 2024</div>
              <div>Status: 📝 Not Registered</div>
            </div>
          </div>
          
          <div className="registration-form">
            <h3>Register for Tournament</h3>
            <form>
              <div className="form-group">
                <label>Tournament</label>
                <select>
                  <option>Select Tournament</option>
                  <option>Spring League</option>
                  <option>Summer Classic</option>
                </select>
              </div>
              <div className="form-group">
                <label>Team Name</label>
                <input type="text" placeholder="Enter team name" />
              </div>
              <div className="form-group">
                <label>Captain Name</label>
                <input type="text" placeholder="Enter captain name" />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input type="email" placeholder="Enter contact email" />
              </div>
              <button type="submit">Register Team</button>
            </form>
          </div>
        </div>
      )}
      
      {/* Bottom Sponsor Banner */}
      <SponsorBanner 
        position="bottom" 
        size="wide" 
        isPremium={false}
        sponsor={{
          name: 'Chemius',
          logo: <BeakerIcon className="h-6 w-6" />,
          message: 'Tournament nutrition supplements',
          cta: 'Get Supplements',
          link: '#'
        }}
      />
    </div>
  );
};

export default TournamentsPage; 